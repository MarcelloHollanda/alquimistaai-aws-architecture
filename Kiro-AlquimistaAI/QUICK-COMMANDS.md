# ⚡ Quick Commands - Alquimista.AI

Comandos rápidos para operações comuns do sistema.

---

## 🚀 Deploy

### Deploy Completo em Produção
```powershell
.\scripts\complete-production-deploy.ps1 -Environment prod
```

### Deploy em Dev/Staging
```powershell
# Dev
.\scripts\complete-production-deploy.ps1 -Environment dev

# Staging
.\scripts\complete-production-deploy.ps1 -Environment staging
```

### Deploy Sem Testes (Mais Rápido)
```powershell
.\scripts\complete-production-deploy.ps1 -Environment prod -SkipTests
```

### Deploy Sem Validação
```powershell
.\scripts\complete-production-deploy.ps1 -Environment prod -SkipValidation
```

---

## 🔍 Validação

### Validação Completa
```powershell
.\scripts\post-deploy-validation.ps1 -Environment prod
```

### Validação em Outros Ambientes
```powershell
# Dev
.\scripts\post-deploy-validation.ps1 -Environment dev

# Staging
.\scripts\post-deploy-validation.ps1 -Environment staging
```

---

## 📊 Monitoramento

### Ver Status das Stacks
```powershell
aws cloudformation describe-stacks --query 'Stacks[*].[StackName,StackStatus]' --output table
```

### Ver Outputs de uma Stack
```powershell
# Fibonacci
aws cloudformation describe-stacks --stack-name FibonacciStack-prod --query 'Stacks[0].Outputs'

# Nigredo
aws cloudformation describe-stacks --stack-name NigredoStack-prod --query 'Stacks[0].Outputs'

# Alquimista
aws cloudformation describe-stacks --stack-name AlquimistaStack-prod --query 'Stacks[0].Outputs'
```

### Ver Logs de Lambda
```powershell
# Handler principal
aws logs tail /aws/lambda/fibonacci-prod-handler --follow

# Agente específico
aws logs tail /aws/lambda/fibonacci-prod-recebimento --follow
```

### Ver Alarmes
```powershell
# Todos os alarmes
aws cloudwatch describe-alarms --alarm-name-prefix fibonacci-prod

# Apenas alarmes em ALARM
aws cloudwatch describe-alarms --state-value ALARM --alarm-name-prefix fibonacci-prod

# Resumo
aws cloudwatch describe-alarms --alarm-name-prefix fibonacci-prod --query 'MetricAlarms[*].[AlarmName,StateValue]' --output table
```

### Ver Dashboards
```powershell
aws cloudwatch list-dashboards --query "DashboardEntries[?contains(DashboardName, 'fibonacci-prod')].DashboardName"
```

---

## 🧪 Testes

### Smoke Tests Manuais
```powershell
# Obter API URL
$API_URL = aws cloudformation describe-stacks --stack-name FibonacciStack-prod --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' --output text

# Test health
Invoke-RestMethod -Uri "$API_URL/health"

# Test database
Invoke-RestMethod -Uri "$API_URL/db-status"

# Test events
Invoke-RestMethod -Uri "$API_URL/events" -Method Post -Body '{"type":"test","data":{}}' -ContentType "application/json"
```

### Executar Testes Locais
```powershell
# Linting
npm run lint

# Build
npm run build

# Security audit
npm run audit:critical
```

---

## 🗄️ Database

### Executar Migrações
```powershell
node scripts/migrate.js
```

### Conectar ao Banco
```powershell
# Obter endpoint
$DB_ENDPOINT = aws cloudformation describe-stacks --stack-name FibonacciStack-prod --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' --output text

# Obter senha do Secrets Manager
$DB_SECRET = aws secretsmanager get-secret-value --secret-id fibonacci-prod-db-secret --query SecretString --output text | ConvertFrom-Json

# Conectar
psql -h $DB_ENDPOINT -U postgres -d fibonacci
```

### Popular Dados Iniciais
```powershell
psql -h $DB_ENDPOINT -U postgres -d fibonacci -f database/seeds/initial_data.sql
```

---

## 🔐 Secrets

### Criar Secret do WhatsApp
```powershell
aws secretsmanager create-secret `
  --name fibonacci-prod-whatsapp-credentials `
  --secret-string '{
    "apiKey": "YOUR_API_KEY",
    "phoneNumberId": "YOUR_PHONE_NUMBER_ID"
  }'
```

### Criar Secret do Google Calendar
```powershell
aws secretsmanager create-secret `
  --name fibonacci-prod-google-calendar-credentials `
  --secret-string '{
    "clientId": "YOUR_CLIENT_ID",
    "clientSecret": "YOUR_CLIENT_SECRET",
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

### Listar Secrets
```powershell
aws secretsmanager list-secrets --query "SecretList[?contains(Name, 'fibonacci-prod')].Name"
```

### Ver Valor de um Secret
```powershell
aws secretsmanager get-secret-value --secret-id fibonacci-prod-db-secret --query SecretString --output text
```

---

## 🔄 Rollback

### Rollback Automático
```powershell
cdk deploy --all --context env=prod --rollback
```

### Rollback Manual
```powershell
# Listar versões
aws cloudformation list-stack-resources --stack-name FibonacciStack-prod

# Rollback
aws cloudformation update-stack `
  --stack-name FibonacciStack-prod `
  --use-previous-template `
  --parameters UsePreviousValue=true
```

---

## 🧹 Limpeza

### Destruir Stack (CUIDADO!)
```powershell
# Dev
cdk destroy --all --context env=dev

# Staging
cdk destroy --all --context env=staging

# Prod (requer confirmação)
cdk destroy --all --context env=prod
```

### Limpar Recursos Órfãos
```powershell
# Listar recursos órfãos
aws resourcegroupstaggingapi get-resources --tag-filters Key=Project,Values=Fibonacci

# Deletar manualmente via console
```

---

## 📦 Build e Deploy

### Build Local
```powershell
npm run build
```

### CDK Synth
```powershell
cdk synth --context env=prod
```

### CDK Diff
```powershell
cdk diff --all --context env=prod
```

### Deploy Manual
```powershell
npm run deploy:prod
```

---

## 🎨 Frontend

### Deploy Frontend
```powershell
cd frontend
npm run deploy:vercel
```

### Build Frontend Local
```powershell
cd frontend
npm run build
```

### Dev Server
```powershell
cd frontend
npm run dev
```

---

## 📈 Métricas

### Ver Métricas de Lambda
```powershell
aws cloudwatch get-metric-statistics `
  --namespace AWS/Lambda `
  --metric-name Invocations `
  --dimensions Name=FunctionName,Value=fibonacci-prod-handler `
  --start-time (Get-Date).AddHours(-1) `
  --end-time (Get-Date) `
  --period 300 `
  --statistics Sum
```

### Ver Métricas de API Gateway
```powershell
aws cloudwatch get-metric-statistics `
  --namespace AWS/ApiGateway `
  --metric-name Count `
  --dimensions Name=ApiName,Value=fibonacci-api-prod `
  --start-time (Get-Date).AddHours(-1) `
  --end-time (Get-Date) `
  --period 300 `
  --statistics Sum
```

### Ver Custos
```powershell
aws ce get-cost-and-usage `
  --time-period Start=(Get-Date).AddDays(-7).ToString("yyyy-MM-dd"),End=(Get-Date).ToString("yyyy-MM-dd") `
  --granularity DAILY `
  --metrics BlendedCost `
  --filter file://cost-filter.json
```

---

## 🔧 Troubleshooting

### Ver Eventos de CloudFormation
```powershell
aws cloudformation describe-stack-events --stack-name FibonacciStack-prod --max-items 20
```

### Ver Erros Recentes de Lambda
```powershell
aws logs filter-log-events `
  --log-group-name /aws/lambda/fibonacci-prod-handler `
  --filter-pattern "ERROR" `
  --start-time $((Get-Date).AddHours(-1).ToUniversalTime().ToString("o"))
```

### Ver Status de Recursos
```powershell
# Lambda
aws lambda list-functions --query "Functions[?contains(FunctionName, 'fibonacci-prod')].FunctionName"

# API Gateway
aws apigatewayv2 get-apis --query "Items[?contains(Name, 'fibonacci')].Name"

# Aurora
aws rds describe-db-clusters --query "DBClusters[?contains(DBClusterIdentifier, 'fibonacci-prod')].[DBClusterIdentifier,Status]"
```

---

## 📚 Documentação

### Abrir Documentação
```powershell
# Guia de deploy
code DEPLOY-PRODUCTION-NOW.md

# Resumo do sistema
code SYSTEM-COMPLETION-SUMMARY.md

# Troubleshooting
code docs/deploy/TROUBLESHOOTING.md

# Arquitetura
code docs/ecosystem/ARQUITETURA-TECNICA-COMPLETA.md
```

---

## 🎯 Workflows Comuns

### Workflow 1: Deploy Completo
```powershell
# 1. Deploy backend
.\scripts\complete-production-deploy.ps1 -Environment prod

# 2. Validar
.\scripts\post-deploy-validation.ps1 -Environment prod

# 3. Configurar secrets
# (executar comandos de secrets acima)

# 4. Migrações
node scripts/migrate.js

# 5. Deploy frontend
cd frontend
npm run deploy:vercel
```

### Workflow 2: Atualização Rápida
```powershell
# 1. Build
npm run build

# 2. Deploy
npm run deploy:prod

# 3. Validar
.\scripts\post-deploy-validation.ps1 -Environment prod
```

### Workflow 3: Debugging
```powershell
# 1. Ver logs
aws logs tail /aws/lambda/fibonacci-prod-handler --follow

# 2. Ver alarmes
aws cloudwatch describe-alarms --state-value ALARM

# 3. Ver métricas
# (usar comandos de métricas acima)

# 4. Conectar ao banco
# (usar comandos de database acima)
```

---

## 💡 Dicas

### Aliases Úteis
```powershell
# Adicionar ao seu profile do PowerShell
function Deploy-Prod { .\scripts\complete-production-deploy.ps1 -Environment prod }
function Validate-Prod { .\scripts\post-deploy-validation.ps1 -Environment prod }
function Logs-Handler { aws logs tail /aws/lambda/fibonacci-prod-handler --follow }
function Alarms-Check { aws cloudwatch describe-alarms --state-value ALARM --alarm-name-prefix fibonacci-prod }
```

### Variáveis de Ambiente
```powershell
# Definir para sessão atual
$env:AWS_PROFILE = "fibonacci-prod"
$env:AWS_REGION = "us-east-1"
```

---

**Última Atualização**: 16 de Novembro de 2025  
**Versão**: 1.0.0
