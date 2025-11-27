# Aurora Migrations Runner Lambda

Lambda Function para executar migrations SQL no Aurora PostgreSQL de dentro da VPC.

## 📋 Visão Geral

Esta Lambda elimina a necessidade de expor o Aurora para acesso público ou usar `psql` diretamente da máquina local. Ela roda dentro da mesma VPC do Aurora e pode ser invocada remotamente via AWS CLI.

## 🏗️ Estrutura

```
aurora-migrations-runner/
├── src/
│   └── index.ts          # Handler principal
├── migrations/
│   └── 017_create_dry_run_log_micro_agente.sql
├── dist/                 # Gerado pelo build
│   ├── index.js
│   └── migrations/
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Build

```powershell
# Da raiz do projeto
.\scripts\build-aurora-migrations-runner.ps1
```

**O que faz:**
1. Instala dependências npm
2. Compila TypeScript → JavaScript
3. Copia migrations SQL para dist/
4. Valida estrutura do pacote

## 📦 Deploy

```powershell
# Sintetizar template
cdk synth AuroraMigrationsRunnerStack-dev --context env=dev

# Deploy
cdk deploy AuroraMigrationsRunnerStack-dev --context env=dev
```

## 🎯 Uso

### Executar Migration Específica

```powershell
.\scripts\run-migration-017.ps1 -Environment dev
```

Ou manualmente:

```powershell
$payload = @{
    action = "run-migration"
    target = "017"
} | ConvertTo-Json

aws lambda invoke `
  --function-name aurora-migrations-runner-dev `
  --payload $payload `
  --cli-binary-format raw-in-base64-out `
  output.json
```

### Listar Migrations Disponíveis

```powershell
.\scripts\list-migrations.ps1 -Environment dev
```

Ou manualmente:

```powershell
$payload = @{
    action = "list-migrations"
} | ConvertTo-Json

aws lambda invoke `
  --function-name aurora-migrations-runner-dev `
  --payload $payload `
  --cli-binary-format raw-in-base64-out `
  output.json
```

### Executar Todas as Migrations

```powershell
$payload = @{
    action = "run-migration"
    target = "all"
} | ConvertTo-Json

aws lambda invoke `
  --function-name aurora-migrations-runner-dev `
  --payload $payload `
  --cli-binary-format raw-in-base64-out `
  output.json
```

## 📊 Payload e Response

### Request Payload

```typescript
interface MigrationEvent {
  action: 'run-migration' | 'list-migrations';
  target?: string; // '017' ou 'all'
}
```

### Response

**Sucesso:**
```json
{
  "status": "success",
  "migration": "017",
  "message": "Migration 017 executed successfully"
}
```

**Erro:**
```json
{
  "status": "error",
  "message": "Migration execution failed",
  "error": "Connection timeout"
}
```

## 🔒 Segurança

### Credenciais

- Obtidas via AWS Secrets Manager
- Variável de ambiente: `DB_SECRET_ARN`
- Nunca logadas no CloudWatch

### Rede

- Lambda em subnets privadas (`PRIVATE_WITH_EGRESS`)
- Security Group permite saída para Aurora (porta 5432)
- Aurora sem acesso público

### IAM

Permissões necessárias:
- `secretsmanager:GetSecretValue` no secret do Aurora
- `rds-data:*` para Data API (opcional)
- `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents`

## 📝 Logs

### CloudWatch Logs

**Log Group:** `/aws/lambda/aurora-migrations-runner-dev`

**Exemplo de log:**
```
📥 Received event: {"action":"run-migration","target":"017"}
🔐 Fetching database credentials...
✅ Connected to Aurora PostgreSQL
📄 Executing migration 017...
✅ Migration 017 executed successfully
🔌 Database connection closed
```

### Verificar Logs

```powershell
# Tail em tempo real
aws logs tail /aws/lambda/aurora-migrations-runner-dev --follow

# Buscar logs específicos
aws logs filter-log-events `
  --log-group-name /aws/lambda/aurora-migrations-runner-dev `
  --filter-pattern "Migration 017"
```

## 🧪 Testes

### Teste na AWS

```powershell
# 1. Listar migrations
.\scripts\list-migrations.ps1 -Environment dev

# 2. Executar migration 017
.\scripts\run-migration-017.ps1 -Environment dev

# 3. Verificar logs
aws logs tail /aws/lambda/aurora-migrations-runner-dev --follow
```

### Validar Tabela Criada

Como o Aurora está em VPC privada, validar via outra Lambda:

```powershell
aws lambda invoke `
  --function-name alquimista-operational-dashboard-dev `
  --payload '{"query":"SELECT COUNT(*) FROM dry_run_log"}' `
  output.json
```

## 🐛 Troubleshooting

### Connection Timeout

**Sintoma:** Lambda não consegue conectar ao Aurora

**Verificar:**
1. Lambda está na mesma VPC do Aurora?
2. Security Group permite porta 5432?
3. Subnets têm rota para Aurora?

```powershell
aws lambda get-function-configuration `
  --function-name aurora-migrations-runner-dev `
  --query 'VpcConfig'
```

### Secret Not Found

**Sintoma:** Lambda não encontra secret do Aurora

**Verificar:**
1. ARN do secret está correto?
2. Lambda tem permissão para ler secret?

```powershell
aws lambda get-function-configuration `
  --function-name aurora-migrations-runner-dev `
  --query 'Environment.Variables.DB_SECRET_ARN'
```

### Migration File Not Found

**Sintoma:** Lambda não encontra arquivo SQL

**Solução:** Rebuild da Lambda

```powershell
.\scripts\build-aurora-migrations-runner.ps1
```

## 📚 Referências

- [Pipeline Migrations VPC](../../.kiro/specs/micro-agente-disparo-agendamento/PIPELINE-MIGRATIONS-VPC.md)
- [Database README](../../database/README.md)
- [Stack CDK](../../lib/aurora-migrations-runner-stack.ts)

---

**Versão:** 1.0.0  
**Status:** ✅ Pronto para Uso  
**Data:** 2024-11-27
