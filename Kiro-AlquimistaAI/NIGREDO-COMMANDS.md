# Nigredo Stack - Comandos Úteis

## 🚀 Deploy & Gestão

### Deploy Completo
```powershell
# Solução automatizada (recomendado)
.\fix-and-deploy-nigredo.ps1

# Ou manualmente
npx cdk deploy NigredoStack-dev --verbose
```

### Sintetizar Template
```powershell
npx cdk synth NigredoStack-dev
```

### Diff de Mudanças
```powershell
npx cdk diff NigredoStack-dev
```

### Deletar Stack
```powershell
aws cloudformation delete-stack --stack-name NigredoStack-dev
aws cloudformation wait stack-delete-complete --stack-name NigredoStack-dev
```

---

## 📊 Monitoramento

### Status do Stack
```powershell
aws cloudformation describe-stacks --stack-name NigredoStack-dev --query 'Stacks[0].StackStatus'
```

### Listar Outputs
```powershell
aws cloudformation describe-stacks --stack-name NigredoStack-dev --query 'Stacks[0].Outputs'
```

### Obter URL da API
```powershell
aws cloudformation describe-stacks --stack-name NigredoStack-dev --query 'Stacks[0].Outputs[?OutputKey==`NigredoApiUrl`].OutputValue' --output text
```

### Listar Exports
```powershell
# Todos os exports do Nigredo
aws cloudformation list-exports --query 'Exports[?starts_with(Name, `Nigredo`)].{Name:Name,Value:Value}'

# Export específico
aws cloudformation list-exports --query 'Exports[?Name==`Nigredo-dev-FunnelConversionQuery`]'
```

---

## 🔍 Logs & Debugging

### Tail de Logs (Lambda específica)
```powershell
# Recebimento
aws logs tail /aws/lambda/nigredo-recebimento-dev --follow

# Estratégia
aws logs tail /aws/lambda/nigredo-estrategia-dev --follow

# API - Create Lead
aws logs tail /aws/lambda/nigredo-create-lead-dev --follow
```

### Buscar Erros nos Logs
```powershell
aws logs filter-log-events `
  --log-group-name /aws/lambda/nigredo-create-lead-dev `
  --filter-pattern "ERROR" `
  --start-time (Get-Date).AddHours(-1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss") `
  --max-items 50
```

### CloudWatch Insights Query
```powershell
# Executar query de erros por agente
aws logs start-query `
  --log-group-names /aws/lambda/nigredo-recebimento-dev /aws/lambda/nigredo-estrategia-dev `
  --start-time (Get-Date).AddHours(-24).ToUniversalTime().Ticks `
  --end-time (Get-Date).ToUniversalTime().Ticks `
  --query-string 'fields @timestamp, agent, message | filter level = "ERROR" | stats count() by agent'
```

---

## 🧪 Testes

### Testar API - Create Lead
```powershell
$apiUrl = aws cloudformation describe-stacks --stack-name NigredoStack-dev --query 'Stacks[0].Outputs[?OutputKey==`NigredoApiUrl`].OutputValue' --output text

curl -X POST "$apiUrl/api/leads" `
  -H "Content-Type: application/json" `
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "+5511999999999",
    "company": "Empresa Teste",
    "source": "website"
  }'
```

### Testar API - List Leads
```powershell
curl "$apiUrl/api/leads"
```

### Testar API - Get Lead
```powershell
curl "$apiUrl/api/leads/[LEAD_ID]"
```

### Script de Teste Completo
```powershell
.\scripts\test-nigredo-integration.ps1
```

---

## 📦 Recursos AWS

### Listar Lambdas do Nigredo
```powershell
aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `nigredo`)].{Name:FunctionName,Runtime:Runtime,Memory:MemorySize}'
```

### Listar Filas SQS do Nigredo
```powershell
aws sqs list-queues --queue-name-prefix nigredo
```

### Listar Dashboards do CloudWatch
```powershell
aws cloudwatch list-dashboards --query 'DashboardEntries[?contains(DashboardName, `nigredo`)]'
```

### Listar Alarms Ativos
```powershell
aws cloudwatch describe-alarms --alarm-name-prefix Nigredo --state-value ALARM
```

---

## 🔐 Segurança & Permissões

### Verificar Identidade AWS
```powershell
aws sts get-caller-identity
```

### Listar Roles IAM do Nigredo
```powershell
aws iam list-roles --query 'Roles[?contains(RoleName, `Nigredo`)].{Name:RoleName,Created:CreateDate}'
```

### Verificar Políticas de uma Role
```powershell
$roleName = "NigredoStack-dev-RecebimentoLambdaServiceRole"
aws iam list-attached-role-policies --role-name $roleName
aws iam list-role-policies --role-name $roleName
```

---

## 💰 Custos

### Estimar Custos de Lambda
```powershell
# Invocações nas últimas 24h
aws cloudwatch get-metric-statistics `
  --namespace AWS/Lambda `
  --metric-name Invocations `
  --dimensions Name=FunctionName,Value=nigredo-create-lead-dev `
  --start-time (Get-Date).AddDays(-1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss") `
  --end-time (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss") `
  --period 3600 `
  --statistics Sum
```

### Duração Total de Execução
```powershell
aws cloudwatch get-metric-statistics `
  --namespace AWS/Lambda `
  --metric-name Duration `
  --dimensions Name=FunctionName,Value=nigredo-create-lead-dev `
  --start-time (Get-Date).AddDays(-1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss") `
  --end-time (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss") `
  --period 3600 `
  --statistics Sum,Average
```

---

## 🔄 Rollback

### Rollback para Versão Anterior
```powershell
# Listar mudanças do stack
aws cloudformation describe-stack-events --stack-name NigredoStack-dev --max-items 50

# Se necessário, deletar e redeployar versão anterior
aws cloudformation delete-stack --stack-name NigredoStack-dev
git checkout [COMMIT_ANTERIOR]
npx cdk deploy NigredoStack-dev
```

---

## 📝 Manutenção

### Limpar Logs Antigos
```powershell
# Definir retenção de 7 dias para todos os log groups do Nigredo
$logGroups = aws logs describe-log-groups --log-group-name-prefix /aws/lambda/nigredo --query 'logGroups[].logGroupName' --output text

foreach ($lg in $logGroups -split '\s+') {
    aws logs put-retention-policy --log-group-name $lg --retention-in-days 7
}
```

### Atualizar Variáveis de Ambiente
```powershell
aws lambda update-function-configuration `
  --function-name nigredo-create-lead-dev `
  --environment "Variables={LOG_LEVEL=DEBUG,DB_SECRET_ARN=arn:aws:secretsmanager:...}"
```

---

## 🎯 Aliases Úteis

Adicione ao seu perfil PowerShell (`$PROFILE`):

```powershell
# Nigredo aliases
function nigredo-deploy { npx cdk deploy NigredoStack-dev --verbose }
function nigredo-status { aws cloudformation describe-stacks --stack-name NigredoStack-dev --query 'Stacks[0].StackStatus' }
function nigredo-logs { param($lambda) aws logs tail "/aws/lambda/nigredo-$lambda-dev" --follow }
function nigredo-api { aws cloudformation describe-stacks --stack-name NigredoStack-dev --query 'Stacks[0].Outputs[?OutputKey==`NigredoApiUrl`].OutputValue' --output text }
```

Uso:
```powershell
nigredo-deploy
nigredo-status
nigredo-logs create-lead
nigredo-api
```

---

**Última Atualização:** 2024
**Autor:** Kiro AI Assistant
