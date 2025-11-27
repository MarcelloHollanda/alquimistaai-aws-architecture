# Runbook Operacional – Migration 017 (dry_run_log)

**Data:** 2024-11-27  
**Componente:** Pipeline de Migrations Aurora  
**Objetivo:** Operacionalizar migration 017 via Lambda na VPC

---

## 📋 Estado Atual (Pré-Requisitos)

### ✅ O Que Já Existe

Conforme última sessão do Kiro (commit `6de82c5`):

**1. Lambda Aurora Migrations Runner**
- Código: `lambda-src/aurora-migrations-runner/src/index.ts`
- Busca credenciais via AWS Secrets Manager
- Executa migrations SQL em transações
- Rollback automático em caso de erro
- Logs estruturados no CloudWatch

**2. Stack CDK**
- Arquivo: `lib/aurora-migrations-runner-stack.ts`
- Lambda dentro da VPC privada
- Security Group liberando porta 5432 para Aurora
- Permissões IAM configuradas

**3. Scripts de Automação**
- `scripts/build-aurora-migrations-runner.ps1`
- `scripts/run-migration-017.ps1`
- `scripts/list-migrations.ps1`

**4. Migration 017**
- Arquivo: `database/migrations/017_create_dry_run_log_micro_agente.sql`
- Cria tabela `dry_run_log` com índices

**5. Documentação Completa**
- Pipeline detalhado
- Quick reference
- README da Lambda
- Resumo para ChatGPT

### ⚠️ O Que Falta

- [ ] Build da Lambda
- [ ] Deploy do stack CDK
- [ ] Execução da migration 017
- [ ] Validação via CloudWatch

---

## 🎯 Objetivo Deste Runbook

1. **Construir** a Lambda Aurora Migrations Runner localmente
2. **Deployar** o stack `AuroraMigrationsRunnerStack-dev` na AWS
3. **Executar** a migration 017 via Lambda (dentro da VPC)
4. **Validar** pelo CloudWatch que tudo funcionou
5. Deixar pronto para o Micro Agente usar a tabela `dry_run_log`

---

## 🚀 Passo a Passo

### Passo 1: Preparar Ambiente Local

```powershell
# Navegar para raiz do projeto
cd "C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI"

# Verificar status do Git
git status
```

**Resultado esperado:**
```
On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean
```

Se houver modificações, commitar antes de prosseguir.

---

### Passo 2: Build da Lambda

```powershell
# Executar script de build
.\scripts\build-aurora-migrations-runner.ps1
```

**O que o script faz:**
1. Instala dependências npm
2. Compila TypeScript → JavaScript
3. Copia migrations SQL para `dist/`
4. Valida estrutura do pacote

**Resultado esperado:**
```
✅ Dependências instaladas
✅ TypeScript compilado
✅ Migrations copiadas
✅ BUILD CONCLUÍDO COM SUCESSO
```

**Em caso de erro:**
- Verificar se Node.js está instalado: `node --version`
- Verificar se npm está instalado: `npm --version`
- Verificar se TypeScript está instalado: `npx tsc --version`

---

### Passo 3: Deploy do Stack CDK

```powershell
# Deploy do stack de migrations (ambiente dev)
cdk deploy AuroraMigrationsRunnerStack-dev --context env=dev
```

**O que esse comando faz:**
1. Sintetiza CloudFormation do stack
2. Cria/atualiza recursos:
   - Lambda `aurora-migrations-runner-dev`
   - Security Groups
   - Permissões IAM
3. Exibe outputs (nome/ARN da Lambda)

**Resultado esperado:**
```
✅ AuroraMigrationsRunnerStack-dev

Outputs:
AuroraMigrationsRunnerStack-dev.MigrationRunnerFunctionName = aurora-migrations-runner-dev
AuroraMigrationsRunnerStack-dev.MigrationRunnerFunctionArn = arn:aws:lambda:us-east-1:...

Stack ARN:
arn:aws:cloudformation:us-east-1:...
```

**Tempo estimado:** 2-5 minutos

**Em caso de erro:**
- Verificar credenciais AWS: `aws sts get-caller-identity`
- Verificar se CDK está instalado: `cdk --version`
- Verificar se o FibonacciStack já foi deployado (dependência)

---

### Passo 4: Executar Migration 017

```powershell
# Executar migration via script
.\scripts\run-migration-017.ps1 -Environment dev
```

**O que o script faz:**
1. Valida credenciais AWS
2. Invoca Lambda `aurora-migrations-runner-dev`
3. Passa payload: `{"action":"run-migration","target":"017"}`
4. Exibe resultado formatado
5. Salva output em `migration-017-output.json`

**Resultado esperado:**
```
========================================
EXECUTAR MIGRATION 017 VIA LAMBDA
========================================

🔐 Validando credenciais AWS...
✅ Autenticado como: arn:aws:iam::207933152643:user/...

📤 Invocando Lambda: aurora-migrations-runner-dev
Payload: {"action":"run-migration","target":"017"}

✅ Lambda invocada com sucesso

📥 Resultado da execução:
{
  "status": "success",
  "migration": "017",
  "message": "Migration 017 executed successfully"
}

========================================
✅ MIGRATION 017 EXECUTADA COM SUCESSO
========================================

Tabela criada: dry_run_log
Componente: Micro Agente de Disparos & Agendamentos
```

**Em caso de erro:**
- Verificar logs no CloudWatch (Passo 5)
- Verificar se Lambda foi deployada corretamente
- Verificar se Aurora está acessível da VPC

---

### Passo 5: Verificar Logs no CloudWatch

```powershell
# Tail logs em tempo real
aws logs tail /aws/lambda/aurora-migrations-runner-dev --follow
```

**O que procurar nos logs:**

**✅ Sucesso:**
```
📥 Received event: {"action":"run-migration","target":"017"}
🔐 Fetching database credentials...
✅ Connected to Aurora PostgreSQL
📄 Executing migration 017...
✅ Migration 017 executed successfully
🔌 Database connection closed
```

**❌ Erros comuns:**

1. **Connection Timeout:**
   ```
   ❌ Failed to connect to Aurora: Connection timeout
   ```
   - **Causa:** Lambda não está na VPC ou Security Group bloqueando
   - **Solução:** Verificar configuração da VPC no stack CDK

2. **Secret Not Found:**
   ```
   ❌ Failed to fetch DB credentials: Secret not found
   ```
   - **Causa:** ARN do secret incorreto ou sem permissão
   - **Solução:** Verificar variável `DB_SECRET_ARN` da Lambda

3. **SQL Error:**
   ```
   ❌ Migration 017 failed: relation "dry_run_log" already exists
   ```
   - **Causa:** Migration já foi executada anteriormente
   - **Solução:** Normal se for re-execução (migration é idempotente)

---

### Passo 6: Validar Tabela Criada (Opcional)

Como o Aurora está em VPC privada, validar via outra Lambda:

```powershell
# Invocar Lambda do Operational Dashboard para query
aws lambda invoke `
  --function-name alquimista-operational-dashboard-dev `
  --payload '{"query":"SELECT COUNT(*) FROM dry_run_log"}' `
  output.json

# Ver resultado
Get-Content output.json | ConvertFrom-Json
```

**Resultado esperado:**
```json
{
  "count": 0
}
```

(Tabela existe mas está vazia - correto!)

---

## ✅ Critérios de Aceitação

Considere esta etapa concluída quando:

- [x] `build-aurora-migrations-runner.ps1` rodou sem erros
- [x] `cdk deploy AuroraMigrationsRunnerStack-dev` completou com sucesso
- [x] `run-migration-017.ps1` indicou sucesso
- [x] Logs no CloudWatch mostraram:
  - Conexão bem-sucedida ao Aurora
  - Execução da migration 017 sem erro
- [x] Arquivo `migration-017-output.json` contém `"status": "success"`

---

## 🔄 Próximos Passos

Após concluir este runbook:

### 1. Integrar dry_run_log no Código do Micro Agente

**Arquivo:** `lambda-src/agente-disparo-agenda/src/handlers/dry-run.ts`

**Adicionar:**
```typescript
// Após decisão de canal
await db.query(`
  INSERT INTO dry_run_log (
    tenant_id, lead_id, lead_nome, lead_telefone, lead_email,
    canal_decidido, motivo_decisao, template_selecionado,
    disparo_seria_executado, razao_bloqueio,
    ambiente, feature_flag_enabled
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
`, [
  tenantId, leadId, leadNome, leadTelefone, leadEmail,
  canalDecidido, motivoDecisao, templateSelecionado,
  disparoSeriaExecutado, razaoBloqueio,
  process.env.ENV, process.env.MICRO_AGENT_DISPARO_ENABLED === 'true'
]);
```

### 2. Testar Fluxo Completo

```powershell
# Invocar Lambda dry-run do Micro Agente
aws lambda invoke `
  --function-name micro-agente-disparo-agendamento-dev-dry-run `
  --payload '{"tenantId":"test-001","batchSize":1}' `
  response.json

# Verificar se registrou na dry_run_log
# (via Operational Dashboard ou outra Lambda)
```

### 3. Adicionar Mais Migrations (Futuro)

Para adicionar migration 018, 019, etc.:

1. Criar arquivo: `database/migrations/018_nome_da_migration.sql`
2. Copiar para: `lambda-src/aurora-migrations-runner/migrations/`
3. Rebuild: `.\scripts\build-aurora-migrations-runner.ps1`
4. Redeploy: `cdk deploy AuroraMigrationsRunnerStack-dev --context env=dev`
5. Executar: `.\scripts\run-migration-018.ps1 -Environment dev`

---

## 🐛 Troubleshooting

### Problema: Build falha com erro de TypeScript

**Sintoma:**
```
❌ ERRO: Falha ao compilar TypeScript
```

**Solução:**
```powershell
# Verificar versão do TypeScript
cd lambda-src\aurora-migrations-runner
npx tsc --version

# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Problema: CDK deploy falha com erro de VPC

**Sintoma:**
```
❌ Error: VPC not found
```

**Solução:**
- Verificar se FibonacciStack foi deployado primeiro
- FibonacciStack cria a VPC que a Lambda precisa
- Deploy FibonacciStack antes: `cdk deploy FibonacciStack-dev --context env=dev`

### Problema: Lambda não consegue conectar ao Aurora

**Sintoma:**
```
❌ Failed to connect to Aurora: Connection timeout
```

**Diagnóstico:**
```powershell
# Verificar VPC da Lambda
aws lambda get-function-configuration `
  --function-name aurora-migrations-runner-dev `
  --query 'VpcConfig'

# Verificar Security Groups
aws ec2 describe-security-groups `
  --group-ids <sg-id> `
  --query 'SecurityGroups[0].IpPermissions'
```

**Solução:**
- Lambda deve estar nas mesmas subnets privadas do Aurora
- Security Group deve permitir saída para Aurora na porta 5432

### Problema: Migration já foi executada

**Sintoma:**
```
❌ Migration 017 failed: relation "dry_run_log" already exists
```

**Solução:**
- Isso é normal se a migration já foi executada antes
- A migration é idempotente (usa `IF NOT EXISTS`)
- Se quiser reexecutar, dropar a tabela primeiro (cuidado!)

---

## 📚 Referências

- [Pipeline Migrations VPC - Completo](./PIPELINE-MIGRATIONS-VPC.md)
- [Pipeline Migrations - Quick Reference](../../../docs/database/PIPELINE-MIGRATIONS-SEGURO.md)
- [Lambda README](../../../lambda-src/aurora-migrations-runner/README.md)
- [Stack CDK](../../../lib/aurora-migrations-runner-stack.ts)

---

## 📝 Checklist de Execução

Use este checklist para acompanhar o progresso:

```
[ ] Passo 1: Ambiente preparado (git status limpo)
[ ] Passo 2: Build da Lambda concluído
[ ] Passo 3: Stack CDK deployado
[ ] Passo 4: Migration 017 executada
[ ] Passo 5: Logs verificados no CloudWatch
[ ] Passo 6: Tabela validada (opcional)
[ ] Próximo: Integrar no código do Micro Agente
```

---

**Status:** 📋 Aguardando Execução  
**Tempo Estimado:** 15-20 minutos  
**Última Atualização:** 2024-11-27
