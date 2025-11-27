# Comandos para Próximos Passos · Fluxo Dry-Run

**Data**: 2024-11-27  
**Objetivo**: Guia passo a passo para testar e deployar o fluxo dry-run

---

## 📋 Pré-requisitos

- ✅ Código do fluxo dry-run implementado
- ✅ Terraform configurado
- ✅ AWS CLI configurado
- ✅ Node.js 20 instalado
- ⚠️ Aurora Serverless v2 provisionado (verificar)
- ⚠️ Secrets Manager configurado (verificar)

---

## 🔍 Passo 1: Verificar Estado do Repositório

```powershell
# Navegar para o repositório
cd "C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI"

# Verificar status
git status

# Ver arquivos modificados/criados
git diff --name-status
```

**Arquivos esperados**:
- ✅ `terraform/modules/agente_disparo_agenda/lambda_dry_run.tf` (novo)
- ✅ `terraform/modules/agente_disparo_agenda/outputs.tf` (modificado)
- ✅ `docs/micro-agente-disparo-agendamento/IMPLEMENTATION-STATUS.md` (modificado)
- ✅ `.kiro/specs/micro-agente-disparo-agendamento/SPEC-TECNICA.md` (modificado)
- ✅ `.kiro/specs/micro-agente-disparo-agendamento/INDEX.md` (modificado)
- ✅ `.kiro/specs/micro-agente-disparo-agendamento/RELATORIO-SESSAO-ATUAL.md` (novo)

---

## 🧪 Passo 2: Testar Handler Localmente (Opcional)

```powershell
# Navegar para a spec
cd .kiro\specs\micro-agente-disparo-agendamento

# Teste básico (1 lead)
.\test-dry-run-local.ps1

# Teste com múltiplos leads
.\test-dry-run-local.ps1 -BatchSize 3
```

**Resultado esperado**: Saída JSON com decisões de canal para cada lead mock.

---

## 🏗️ Passo 3: Build da Lambda (SCRIPT AUTOMATIZADO)

```powershell
# Usar script automatizado de build
.\scripts\build-micro-agente-dry-run.ps1

# OU com opções:
# Apenas build (sem upload)
.\scripts\build-micro-agente-dry-run.ps1 -SkipUpload

# Apenas upload (sem build)
.\scripts\build-micro-agente-dry-run.ps1 -SkipBuild

# Especificar bucket diferente
.\scripts\build-micro-agente-dry-run.ps1 -BucketName "meu-bucket-custom"
```

**O que o script faz**:
1. Compila TypeScript (`npm run build`)
2. Cria pacote ZIP com código + dependências
3. Faz upload para S3 (se não usar `-SkipUpload`)
4. Verifica tamanho e integridade

**Resultado esperado**: 
- ✅ Arquivo `lambda-src/agente-disparo-agenda/build/dry-run.zip` criado
- ✅ Upload para `s3://alquimista-lambda-artifacts-dev/micro-agente-disparo-agendamento/dev/dry-run.zip`

---

## 🗄️ Passo 4: Executar Migration do Banco de Dados (SCRIPT AUTOMATIZADO)

```powershell
# Configurar variáveis de ambiente (ajustar para seu Aurora DEV)
$env:PGHOST = "alquimista-aurora-dev.cluster-xxxxx.us-east-1.rds.amazonaws.com"
$env:PGUSER = "admin"
$env:PGDATABASE = "alquimista_dev"
$env:PGPASSWORD = "sua-senha-aqui"

# Executar script automatizado
.\scripts\apply-migration-007-dry-run.ps1

# OU passar credenciais como parâmetros
.\scripts\apply-migration-007-dry-run.ps1 -Host "seu-host" -User "admin" -Database "alquimista_dev" -Password "senha"
```

**O que o script faz**:
1. Testa conexão com Aurora
2. Verifica se tabela já existe
3. Aplica migration 007
4. Valida estrutura criada (colunas e índices)

**Resultado esperado**: 
- ✅ Tabela `dry_run_log` criada no Aurora DEV
- ✅ Índices criados: `idx_dry_run_tenant`, `idx_dry_run_canal`, `idx_dry_run_ambiente`

**Alternativa (se psql não estiver instalado)**:
- Usar AWS RDS Query Editor no console
- Copiar conteúdo de `.kiro/specs/micro-agente-disparo-agendamento/migrations/007_create_dry_run_log_table.sql` e executar

---

## 🚀 Passo 5: Deploy via Terraform

```powershell
# Navegar para Terraform dev
cd terraform\envs\dev

# Inicializar Terraform (se ainda não fez)
terraform init

# Validar configuração
terraform validate

# Ver plano de mudanças
terraform plan

# Aplicar mudanças (ATENÇÃO: Isso criará recursos na AWS)
terraform apply
```

**Recursos que serão criados**:
- Lambda `micro-agente-disparo-agendamento-dev-dry-run`
- CloudWatch Log Group `/aws/lambda/micro-agente-disparo-agendamento-dev-dry-run`
- Permissões IAM para a Lambda

**Resultado esperado**: 
```
Apply complete! Resources: 3 added, 0 changed, 0 destroyed.
```

---

## ✅ Passo 6: Testar Lambda na AWS

```powershell
# Criar payload de teste
$payload = @{
    tenantId = "test-001"
    batchSize = 1
} | ConvertTo-Json

# Salvar payload em arquivo
$payload | Out-File -FilePath test-payload.json -Encoding utf8

# Invocar Lambda
aws lambda invoke `
  --function-name micro-agente-disparo-agendamento-dev-dry-run `
  --payload file://test-payload.json `
  --region us-east-1 `
  response.json

# Ver resultado
Get-Content response.json | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

**Resultado esperado**:
```json
{
  "success": true,
  "leadsProcessados": 1,
  "decisoes": [
    {
      "lead": {
        "id": "mock-lead-001",
        "nome": "Empresa Teste Ltda"
      },
      "canal": "whatsapp",
      "motivo": "Lead possui 1 telefone(s) válido(s) para WhatsApp",
      "seria_executado": true
    }
  ],
  "logs": [...]
}
```

---

## 📊 Passo 7: Verificar Logs no CloudWatch

```powershell
# Ver logs recentes
aws logs tail /aws/lambda/micro-agente-disparo-agendamento-dev-dry-run --follow --region us-east-1
```

**Resultado esperado**: Logs estruturados em JSON com informações do dry-run.

---

## 🔍 Passo 8: Verificar Tabela dry_run_log

```powershell
# Conectar ao Aurora
psql

# Consultar logs
SELECT 
  log_id,
  lead_nome,
  canal_decidido,
  motivo_decisao,
  disparo_seria_executado,
  created_at
FROM dry_run_log
ORDER BY created_at DESC
LIMIT 10;
```

**Resultado esperado**: Registros dos testes dry-run executados.

---

## 🎯 Passo 9: Commit e Push (Após Testes)

```powershell
# Voltar para raiz do repositório
cd "C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI"

# Adicionar arquivos
git add .

# Commit
git commit -m "feat: implementar fluxo mínimo dry-run do Micro Agente de Disparos & Agendamentos

- Adicionar Lambda dry-run no Terraform
- Atualizar outputs do Terraform
- Atualizar IMPLEMENTATION-STATUS.md
- Adicionar seção de dry-run na SPEC-TECNICA.md
- Atualizar INDEX.md
- Criar RELATORIO-SESSAO-ATUAL.md
- Criar COMANDOS-PROXIMOS-PASSOS.md

Refs: blueprint-disparo-agendamento.md"

# Push
git push origin main
```

---

## 🐛 Troubleshooting

### Erro: "Lambda artifact not found in S3"

**Solução**: Executar Passo 5 (Upload para S3)

### Erro: "Table dry_run_log does not exist"

**Solução**: Executar Passo 6 (Migration do banco)

### Erro: "Access Denied" ao invocar Lambda

**Solução**: Verificar permissões IAM do usuário AWS CLI

### Erro: "Cannot connect to Aurora"

**Solução**: 
1. Verificar se Aurora está provisionado
2. Verificar security groups
3. Verificar se está na VPC correta

---

## 📞 Suporte

Se encontrar problemas:

1. Verificar logs do CloudWatch
2. Verificar outputs do Terraform
3. Consultar documentação:
   - [DRY-RUN-IMPLEMENTATION.md](./DRY-RUN-IMPLEMENTATION.md)
   - [SPEC-TECNICA.md](./SPEC-TECNICA.md)
4. Contatar equipe:
   - Email: alquimistafibonacci@gmail.com
   - WhatsApp: +55 84 99708-4444

---

**Criado por**: Kiro AI  
**Data**: 2024-11-27  
**Versão**: 1.0.0

