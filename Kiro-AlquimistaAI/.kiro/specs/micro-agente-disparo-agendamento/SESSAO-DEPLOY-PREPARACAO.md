# Sessão de Preparação para Deploy · Micro Agente Dry-Run

**Data**: 2024-11-27  
**Objetivo**: Criar scripts automatizados para deploy do fluxo dry-run na AWS  
**Status**: ✅ Concluído - Pronto para Execução

---

## 📋 Resumo da Sessão

Esta sessão focou em **preparar a infraestrutura e automação** necessária para deployar o fluxo dry-run do Micro Agente na AWS, sem executar o deploy real.

### O Que Foi Criado

1. **Script de Build e Upload** (`scripts/build-micro-agente-dry-run.ps1`)
2. **Script de Migration** (`scripts/apply-migration-007-dry-run.ps1`)
3. **Documentação Atualizada** (COMANDOS-PROXIMOS-PASSOS.md)

---

## 🎯 Scripts Criados

### 1. Script de Build e Upload

**Arquivo**: `scripts/build-micro-agente-dry-run.ps1`

**Funcionalidades**:
- ✅ Compila TypeScript automaticamente
- ✅ Cria pacote ZIP otimizado (código + dependências)
- ✅ Faz upload para S3 automaticamente
- ✅ Valida tamanho e integridade do pacote
- ✅ Suporta flags: `-SkipBuild`, `-SkipUpload`, `-BucketName`

**Uso**:
```powershell
# Build completo (compile + upload)
.\scripts\build-micro-agente-dry-run.ps1

# Apenas build (sem upload)
.\scripts\build-micro-agente-dry-run.ps1 -SkipUpload

# Apenas upload (sem build)
.\scripts\build-micro-agente-dry-run.ps1 -SkipBuild
```

**Output**:
- ZIP local: `lambda-src/agente-disparo-agenda/build/dry-run.zip`
- S3: `s3://alquimista-lambda-artifacts-dev/micro-agente-disparo-agendamento/dev/dry-run.zip`

---

### 2. Script de Migration 007

**Arquivo**: `scripts/apply-migration-007-dry-run.ps1`

**Funcionalidades**:
- ✅ Testa conexão com Aurora DEV
- ✅ Verifica se tabela já existe
- ✅ Aplica migration 007 (tabela `dry_run_log`)
- ✅ Valida estrutura criada (colunas e índices)
- ✅ Suporta variáveis de ambiente e parâmetros

**Uso**:
```powershell
# Usando variáveis de ambiente
$env:PGHOST = "seu-host-aurora"
$env:PGUSER = "admin"
$env:PGDATABASE = "alquimista_dev"
$env:PGPASSWORD = "sua-senha"

.\scripts\apply-migration-007-dry-run.ps1

# OU passando como parâmetros
.\scripts\apply-migration-007-dry-run.ps1 -Host "host" -User "admin" -Database "db" -Password "pass"
```

**Output**:
- Tabela `dry_run_log` criada no Aurora DEV
- Índices: `idx_dry_run_tenant`, `idx_dry_run_canal`, `idx_dry_run_ambiente`

---

## 📚 Documentação Atualizada

### COMANDOS-PROXIMOS-PASSOS.md

**Atualizações**:
- ✅ Comandos reais substituindo placeholders
- ✅ Referências aos scripts automatizados
- ✅ Passos renumerados (1-9)
- ✅ Instruções detalhadas de uso

**Estrutura**:
1. Verificar Estado do Repositório
2. Testar Handler Localmente (opcional)
3. Build da Lambda (script automatizado)
4. Executar Migration 007 (script automatizado)
5. Deploy via Terraform
6. Testar Lambda na AWS
7. Verificar Logs no CloudWatch
8. Verificar Tabela dry_run_log
9. Commit e Push (após testes)

---

## 🔍 Análise de Infraestrutura Realizada

### Terraform DEV

**Verificado**:
- ✅ Backend remoto configurado: S3 + DynamoDB
- ✅ Bucket de estado: `alquimistaai-terraform-state`
- ✅ Tabela de locks: `alquimistaai-terraform-locks`
- ✅ Módulo `agente_disparo_agenda` instanciado corretamente

**Variáveis DEV** (`terraform/envs/dev/terraform.tfvars`):
```hcl
alerts_sns_topic_arn   = "arn:aws:sns:us-east-1:207933152643:alquimista-alerts-dev"
lambda_artifact_bucket = "alquimista-lambda-artifacts-dev"
```

### Lambda Dry-Run

**Configuração** (`terraform/modules/agente_disparo_agenda/lambda_dry_run.tf`):
- ✅ Nome: `micro-agente-disparo-agendamento-dev-dry-run`
- ✅ Runtime: Node.js 20
- ✅ Memory: 512 MB
- ✅ Timeout: 30 segundos
- ✅ Feature flag: `MICRO_AGENT_DISPARO_ENABLED = "false"`
- ✅ X-Ray tracing: Habilitado
- ✅ Permissões: API Gateway + EventBridge

---

## 📊 Estado Atual do Projeto

### Código

| Componente | Status |
|------------|--------|
| Handler `dry-run.ts` | ✅ Implementado |
| Módulo `canal-decision.ts` | ✅ Implementado |
| Migration 007 | ✅ Criada |
| Terraform Lambda | ✅ Configurado |
| Scripts de automação | ✅ Criados |

### Infraestrutura

| Recurso | Status |
|---------|--------|
| Terraform DEV | ✅ Configurado |
| Backend S3 + DynamoDB | ✅ Existente |
| Bucket S3 artefatos | ✅ Existente |
| SNS Topic alertas | ✅ Existente |
| Aurora DEV | ⚠️ Verificar credenciais |
| Lambda dry-run | ⏳ Pendente deploy |
| Tabela `dry_run_log` | ⏳ Pendente migration |

### Documentação

| Documento | Status |
|-----------|--------|
| SPEC-TECNICA.md | ✅ Atualizado |
| IMPLEMENTATION-STATUS.md | ✅ Atualizado |
| COMANDOS-PROXIMOS-PASSOS.md | ✅ Atualizado |
| RELATORIO-SESSAO-ATUAL.md | ✅ Atualizado |
| DRY-RUN-IMPLEMENTATION.md | ✅ Existente |

---

## 🚀 Próximos Passos (Ordem de Execução)

### 1. Configurar Credenciais Aurora

```powershell
$env:PGHOST = "alquimista-aurora-dev.cluster-xxxxx.us-east-1.rds.amazonaws.com"
$env:PGUSER = "admin"
$env:PGDATABASE = "alquimista_dev"
$env:PGPASSWORD = "sua-senha-aqui"
```

### 2. Aplicar Migration 007

```powershell
.\scripts\apply-migration-007-dry-run.ps1
```

**Validação**: Tabela `dry_run_log` criada no Aurora

### 3. Build e Upload Lambda

```powershell
.\scripts\build-micro-agente-dry-run.ps1
```

**Validação**: ZIP no S3 em `micro-agente-disparo-agendamento/dev/dry-run.zip`

### 4. Deploy Terraform

```powershell
cd terraform\envs\dev
terraform init
terraform plan
terraform apply
```

**Validação**: Lambda `micro-agente-disparo-agendamento-dev-dry-run` criada

### 5. Testar Lambda

```powershell
$payload = @{ tenantId = "test-001"; batchSize = 1 } | ConvertTo-Json
$payload | Out-File test-payload.json -Encoding utf8

aws lambda invoke `
  --function-name micro-agente-disparo-agendamento-dev-dry-run `
  --payload file://test-payload.json `
  --region us-east-1 `
  response.json

Get-Content response.json | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

**Validação**: JSON com decisões de canal

### 6. Verificar Logs CloudWatch

```powershell
aws logs tail /aws/lambda/micro-agente-disparo-agendamento-dev-dry-run --follow --region us-east-1
```

**Validação**: Logs estruturados em JSON

### 7. Verificar Tabela dry_run_log

```sql
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

**Validação**: Registros dos testes

---

## 🎓 Decisões Técnicas

### D-01: Scripts Automatizados

**Decisão**: Criar scripts PowerShell dedicados para build e migration

**Justificativa**:
- Reduz erros manuais
- Padroniza processo
- Facilita troubleshooting
- Permite CI/CD futuro

### D-02: Separação Build/Upload

**Decisão**: Permitir build sem upload (`-SkipUpload`)

**Justificativa**:
- Testes locais sem afetar S3
- Desenvolvimento iterativo
- Economia de tempo em iterações

### D-03: Validação Automática

**Decisão**: Scripts validam cada etapa automaticamente

**Justificativa**:
- Detecta problemas cedo
- Feedback imediato
- Reduz debugging

---

## 📝 Checklist de Validação

Antes de considerar o deploy concluído, validar:

- [ ] Migration 007 aplicada com sucesso
- [ ] Tabela `dry_run_log` existe no Aurora
- [ ] Índices criados corretamente
- [ ] ZIP da Lambda criado (< 50 MB)
- [ ] ZIP uploadado para S3
- [ ] Terraform apply executado sem erros
- [ ] Lambda criada na AWS
- [ ] Lambda invocável via AWS CLI
- [ ] Logs aparecem no CloudWatch
- [ ] Registros aparecem em `dry_run_log`
- [ ] Feature flag `MICRO_AGENT_DISPARO_ENABLED = "false"` confirmada
- [ ] Nenhum disparo real executado

---

## 🔗 Referências

- [COMANDOS-PROXIMOS-PASSOS.md](./COMANDOS-PROXIMOS-PASSOS.md) - Guia completo de execução
- [RELATORIO-SESSAO-ATUAL.md](./RELATORIO-SESSAO-ATUAL.md) - Relatório detalhado
- [IMPLEMENTATION-STATUS.md](../../docs/micro-agente-disparo-agendamento/IMPLEMENTATION-STATUS.md) - Status geral
- [DRY-RUN-IMPLEMENTATION.md](./DRY-RUN-IMPLEMENTATION.md) - Implementação técnica

---

**Criado por**: Kiro AI  
**Data**: 2024-11-27  
**Versão**: 1.0.0  
**Próxima sessão**: Execução do Deploy na AWS
