# Pipeline Seguro de Migrations Aurora (Lambda dentro da VPC)

**Data de Criação:** 2024-11-27  
**Componente:** Infraestrutura de Banco de Dados  
**Status:** ✅ Implementado

---

## 📋 Visão Geral

Sistema de execução de migrations SQL no Aurora PostgreSQL através de Lambda dentro da VPC, eliminando a necessidade de expor o banco para acesso público ou usar `psql` diretamente da máquina local.

### Problema Resolvido

**Antes:**
- Aurora em VPC privada (correto por segurança)
- Tentativas de `psql` do Windows resultavam em timeout
- Opções ruins: expor Aurora publicamente ou usar bastion host

**Depois:**
- Lambda roda dentro da mesma VPC do Aurora
- Executa migrations com acesso direto ao banco
- Aurora permanece privado e seguro
- Invocação via AWS CLI de qualquer lugar

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                         AWS Cloud                            │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    VPC Privada                         │ │
│  │                                                        │ │
│  │  ┌──────────────────┐         ┌──────────────────┐   │ │
│  │  │  Lambda          │         │  Aurora          │   │ │
│  │  │  Migrations      │────────▶│  PostgreSQL      │   │ │
│  │  │  Runner          │ Port    │  (Privado)       │   │ │
│  │  │                  │ 5432    │                  │   │ │
│  │  └──────────────────┘         └──────────────────┘   │ │
│  │         │                              ▲              │ │
│  │         │                              │              │ │
│  │         ▼                              │              │ │
│  │  ┌──────────────────┐         ┌──────────────────┐   │ │
│  │  │  Secrets         │         │  Security        │   │ │
│  │  │  Manager         │         │  Group           │   │ │
│  │  └──────────────────┘         └──────────────────┘   │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  CloudWatch Logs                                       │ │
│  │  /aws/lambda/aurora-migrations-runner-dev              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
         ▲
         │ AWS CLI Invoke
         │
    ┌────────────┐
    │  Máquina   │
    │  Local     │
    └────────────┘
```

---

## 📦 Componentes Implementados

### 1. Lambda Function

**Localização:** `lambda-src/aurora-migrations-runner/`

**Estrutura:**
```
aurora-migrations-runner/
├── src/
│   └── index.ts          # Handler principal
├── migrations/
│   └── 017_create_dry_run_log_micro_agente.sql
├── package.json
└── tsconfig.json
```

**Funcionalidades:**
- Busca credenciais do Aurora via Secrets Manager
- Conecta ao Aurora usando driver `pg`
- Lê arquivos SQL da pasta `migrations/`
- Executa migrations dentro de transações
- Rollback automático em caso de erro
- Logs estruturados para CloudWatch

**Ações suportadas:**
- `run-migration` - Executa migration específica ou todas
- `list-migrations` - Lista migrations disponíveis

### 2. Stack CDK

**Arquivo:** `lib/aurora-migrations-runner-stack.ts`

**Recursos criados:**
- Lambda Function (Node.js 20, 512MB, 5min timeout)
- Security Group com acesso ao Aurora (porta 5432)
- Permissões IAM:
  - `secretsmanager:GetSecretValue` no secret do Aurora
  - `rds-data:*` para Data API (futuro)
- CloudWatch Logs (retenção 1 mês)
- X-Ray tracing habilitado

**Configuração de VPC:**
- Subnets: `PRIVATE_WITH_EGRESS`
- Security Group: permite saída para Aurora

### 3. Scripts de Automação

#### Build Script

**Arquivo:** `scripts/build-aurora-migrations-runner.ps1`

**Funções:**
- Instala dependências npm
- Compila TypeScript → JavaScript
- Copia migrations SQL para `dist/`
- Valida estrutura do pacote

**Uso:**
```powershell
.\scripts\build-aurora-migrations-runner.ps1
```

#### Execution Script

**Arquivo:** `scripts/run-migration-017.ps1`

**Funções:**
- Valida credenciais AWS
- Cria payload JSON
- Invoca Lambda via AWS CLI
- Exibe resultado formatado
- Salva output em arquivo

**Uso:**
```powershell
.\scripts\run-migration-017.ps1 -Environment dev
```

**Parâmetros:**
- `-Environment` - Ambiente (dev/prod)
- `-FunctionName` - Nome da Lambda (default: aurora-migrations-runner-dev)

#### List Migrations Script

**Arquivo:** `scripts/list-migrations.ps1`

**Funções:**
- Lista migrations disponíveis na Lambda
- Útil para verificar quais migrations estão empacotadas

**Uso:**
```powershell
.\scripts\list-migrations.ps1 -Environment dev
```

---

## 🚀 Fluxo de Uso

### Passo 1: Build da Lambda

```powershell
# Navegar para raiz do projeto
cd C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI

# Executar build
.\scripts\build-aurora-migrations-runner.ps1
```

**Resultado esperado:**
```
✅ Dependências instaladas
✅ TypeScript compilado
✅ Migrations copiadas
✅ BUILD CONCLUÍDO COM SUCESSO
```

### Passo 2: Deploy do Stack CDK

```powershell
# Sintetizar template (opcional)
cdk synth AuroraMigrationsRunnerStack-dev --context env=dev

# Deploy
cdk deploy AuroraMigrationsRunnerStack-dev --context env=dev
```

**Recursos criados:**
- Lambda: `aurora-migrations-runner-dev`
- Security Group: `AuroraMigrationsRunnerStack-dev-MigrationRunnerSG-xxx`
- IAM Role: `AuroraMigrationsRunnerStack-dev-MigrationRunnerFunctionRole-xxx`

### Passo 3: Executar Migration

```powershell
# Executar migration 017
.\scripts\run-migration-017.ps1 -Environment dev
```

**Output esperado:**
```json
{
  "status": "success",
  "migration": "017",
  "message": "Migration 017 executed successfully"
}
```

### Passo 4: Verificar Logs

```powershell
# Tail logs em tempo real
aws logs tail /aws/lambda/aurora-migrations-runner-dev --follow

# Buscar logs específicos
aws logs filter-log-events `
  --log-group-name /aws/lambda/aurora-migrations-runner-dev `
  --filter-pattern "Migration 017"
```

---

## 📊 Migration 017 - dry_run_log

### Descrição

Tabela para auditar decisões de canal e disparos pretendidos em modo dry-run do Micro Agente de Disparos & Agendamentos.

### Estrutura da Tabela

```sql
CREATE TABLE dry_run_log (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Dados do lead
  lead_id UUID,
  lead_nome VARCHAR(500),
  lead_telefone VARCHAR(50),
  lead_email VARCHAR(255),
  lead_documento VARCHAR(20),
  
  -- Decisão de canal
  canal_decidido VARCHAR(20) NOT NULL,
  motivo_decisao TEXT NOT NULL,
  template_selecionado VARCHAR(100),
  
  -- Controle de execução
  disparo_seria_executado BOOLEAN DEFAULT TRUE,
  razao_bloqueio TEXT,
  
  -- Metadata
  ambiente VARCHAR(10) DEFAULT 'dev',
  feature_flag_enabled BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Índices

- `idx_dry_run_tenant` - (tenant_id, created_at DESC)
- `idx_dry_run_canal` - (canal_decidido)
- `idx_dry_run_ambiente` - (ambiente, created_at DESC)

### Uso no Código

```typescript
// lambda-src/agente-disparo-agenda/src/handlers/dry-run.ts
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

---

## 🔒 Segurança

### Credenciais

- ✅ Nunca armazenadas em código
- ✅ Obtidas via Secrets Manager em runtime
- ✅ Não logadas no CloudWatch
- ✅ Conexão SSL/TLS com Aurora

### Rede

- ✅ Lambda em subnets privadas
- ✅ Aurora sem acesso público
- ✅ Security Group restritivo (apenas porta 5432)
- ✅ Sem NAT Gateway desnecessário

### IAM

- ✅ Princípio do menor privilégio
- ✅ Permissões específicas por recurso
- ✅ Sem wildcards em ARNs

---

## 🧪 Testes

### Teste Local (Simulado)

Não é possível testar localmente pois requer:
- Acesso à VPC privada
- Credenciais do Aurora
- Secrets Manager

### Teste na AWS

```powershell
# 1. Listar migrations disponíveis
.\scripts\list-migrations.ps1 -Environment dev

# 2. Executar migration 017
.\scripts\run-migration-017.ps1 -Environment dev

# 3. Verificar logs
aws logs tail /aws/lambda/aurora-migrations-runner-dev --follow

# 4. Validar tabela criada (via outra Lambda)
aws lambda invoke `
  --function-name alquimista-operational-dashboard-dev `
  --payload '{"query":"SELECT COUNT(*) FROM dry_run_log"}' `
  output.json
```

---

## 📈 Métricas e Observabilidade

### CloudWatch Logs

**Log Group:** `/aws/lambda/aurora-migrations-runner-dev`

**Logs estruturados:**
```json
{
  "timestamp": "2024-11-27T12:00:00Z",
  "level": "INFO",
  "message": "Migration 017 executed successfully",
  "migration": "017",
  "duration": 1234
}
```

### X-Ray Tracing

- ✅ Habilitado por padrão
- ✅ Rastreamento de:
  - Chamadas ao Secrets Manager
  - Conexões ao Aurora
  - Execução de queries SQL

### Alarmes (Futuro)

Sugestões de alarmes:
- Migration falhou (status = error)
- Duração > 4 minutos (timeout próximo)
- Erros de conexão ao Aurora

---

## 🔄 Evolução Futura

### Curto Prazo

- [ ] Adicionar mais migrations (018, 019, ...)
- [ ] Implementar rollback de migrations
- [ ] Criar tabela de controle de migrations aplicadas

### Médio Prazo

- [ ] Dashboard de status de migrations
- [ ] Notificações SNS em caso de falha
- [ ] Integração com CI/CD (GitHub Actions)

### Longo Prazo

- [ ] Suporte a migrations complexas (multi-step)
- [ ] Dry-run de migrations (preview de mudanças)
- [ ] Versionamento semântico de migrations

---

## 🐛 Troubleshooting

### Erro: Connection Timeout

**Sintoma:** Lambda não consegue conectar ao Aurora

**Causas possíveis:**
1. Lambda não está na mesma VPC do Aurora
2. Security Group não permite porta 5432
3. Subnets não têm rota para Aurora

**Solução:**
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

### Erro: Secret Not Found

**Sintoma:** Lambda não encontra secret do Aurora

**Causas possíveis:**
1. ARN do secret incorreto
2. Lambda sem permissão para ler secret

**Solução:**
```powershell
# Verificar variável de ambiente
aws lambda get-function-configuration `
  --function-name aurora-migrations-runner-dev `
  --query 'Environment.Variables.DB_SECRET_ARN'

# Verificar permissões IAM
aws iam get-role-policy `
  --role-name <role-name> `
  --policy-name <policy-name>
```

### Erro: Migration File Not Found

**Sintoma:** Lambda não encontra arquivo SQL

**Causas possíveis:**
1. Migration não foi copiada para dist/
2. Nome do arquivo incorreto

**Solução:**
```powershell
# Rebuild da Lambda
.\scripts\build-aurora-migrations-runner.ps1

# Verificar conteúdo do pacote
cd lambda-src\aurora-migrations-runner\dist
ls migrations\
```

---

## 📚 Referências

### Documentação Relacionada

- [Blueprint Disparo & Agendamento](../../../.kiro/steering/blueprint-disparo-agendamento.md)
- [Contexto do Projeto](../../../.kiro/steering/contexto-projeto-alquimista.md)
- [Database README](../../../database/README.md)

### Código Fonte

- Lambda: `lambda-src/aurora-migrations-runner/`
- Stack CDK: `lib/aurora-migrations-runner-stack.ts`
- Scripts: `scripts/build-aurora-migrations-runner.ps1`, `scripts/run-migration-017.ps1`

### AWS Resources

- [Lambda VPC Configuration](https://docs.aws.amazon.com/lambda/latest/dg/configuration-vpc.html)
- [RDS Security Groups](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Overview.RDSSecurityGroups.html)
- [Secrets Manager](https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html)

---

**Implementado por:** Kiro AI  
**Data:** 2024-11-27  
**Versão:** 1.0.0  
**Status:** ✅ Pronto para Uso
