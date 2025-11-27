# ⚡ Comandos Rápidos - Alquimista.AI

Referência rápida de comandos para deploy e gerenciamento.

---

## 🚀 Deploy

### Deploy Completo
```powershell
.\DEPLOY-FULL-SYSTEM.ps1
```

### Deploy Apenas Backend
```powershell
.\DEPLOY-FULL-SYSTEM.ps1 -SkipFrontend
```

### Deploy Apenas Frontend
```powershell
.\DEPLOY-FULL-SYSTEM.ps1 -SkipBackend
```

### Deploy Produção
```powershell
.\DEPLOY-FULL-SYSTEM.ps1 -Environment prod
```

---

## ✅ Validação

### Validação Completa
```powershell
.\VALIDATE-INTEGRATION.ps1
```

### Validação com Frontend
```powershell
.\VALIDATE-INTEGRATION.ps1 -FrontendUrl "https://seu-app.vercel.app"
```

### Validação Básica
```powershell
.\VALIDAR-DEPLOY.ps1
```

---

## 🔍 Verificação

### Ver Stacks
```powershell
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE
```

### Ver Outputs
```powershell
aws cloudformation describe-stacks --stack-name FibonacciStack-dev --query "Stacks[0].Outputs" --output table
```

### Ver Lambdas
```powershell
aws lambda list-functions --query "Functions[?starts_with(FunctionName, 'Fibonacci')].FunctionName"
```

### Ver Database
```powershell
aws rds describe-db-clusters --query "DBClusters[?starts_with(DBClusterIdentifier, 'fibonacci')]"
```

---

## 📊 Monitoramento

### Logs em Tempo Real
```powershell
# API Handler
aws logs tail /aws/lambda/FibonacciStack-dev-ApiHandler --follow

# Agente Específico
aws logs tail /aws/lambda/NigredoStack-dev-RecebimentoAgent --follow
```

### Ver Últimos Logs
```powershell
aws logs tail /aws/lambda/FibonacciStack-dev-ApiHandler --since 1h
```

### Dashboards
```powershell
# Abrir CloudWatch no navegador
start https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:
```

---

## 🧪 Testes

### Testar API
```powershell
# Health Check
curl https://c5loeivg0k.execute-api.us-east-1.amazonaws.com/health

# Com variável
$API_URL = (aws cloudformation describe-stacks --stack-name FibonacciStack-dev --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" --output text)
curl "$API_URL/health"
```

### Testar Database
```powershell
# Ver status
aws rds describe-db-clusters --db-cluster-identifier fibonacci-dev-aurora --query "DBClusters[0].Status"
```

### Testar Cognito
```powershell
# Ver User Pool
$POOL_ID = (aws cloudformation describe-stacks --stack-name FibonacciStack-dev --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" --output text)
aws cognito-idp describe-user-pool --user-pool-id $POOL_ID
```

---

## 🧹 Limpeza

### Deletar Stack
```powershell
# Deletar uma stack
aws cloudformation delete-stack --stack-name FibonacciStack-dev

# Aguardar conclusão
aws cloudformation wait stack-delete-complete --stack-name FibonacciStack-dev
```

### Deletar Todas as Stacks
```powershell
aws cloudformation delete-stack --stack-name AlquimistaStack-dev
aws cloudformation delete-stack --stack-name NigredoStack-dev
aws cloudformation delete-stack --stack-name FibonacciStack-dev
```

### Limpar Cache CDK
```powershell
Remove-Item -Recurse -Force cdk.out
```

---

## 🔧 Manutenção

### Atualizar Dependências
```powershell
# Backend
npm update

# Frontend
cd frontend
npm update
cd ..
```

### Recompilar
```powershell
npm run build
```

### Validar CDK
```powershell
npx cdk synth
```

### Ver Diff
```powershell
npx cdk diff FibonacciStack-dev
```

---

## 📦 Frontend

### Build Local
```powershell
cd frontend
npm run build
cd ..
```

### Dev Server
```powershell
cd frontend
npm run dev
cd ..
```

### Deploy Vercel
```powershell
cd frontend
vercel --prod
cd ..
```

### Deploy Amplify
```powershell
cd frontend
amplify publish
cd ..
```

---

## 🔐 Segurança

### Ver IAM Roles
```powershell
aws iam list-roles --query "Roles[?starts_with(RoleName, 'FibonacciStack')]"
```

### Ver Secrets
```powershell
aws secretsmanager list-secrets --query "SecretList[?starts_with(Name, 'fibonacci')]"
```

### Audit IAM
```powershell
.\scripts\audit-iam-permissions.ps1
```

### Check Encryption
```powershell
.\scripts\check-encryption-compliance.ps1
```

---

## 📈 Métricas

### Ver Métricas Lambda
```powershell
aws cloudwatch get-metric-statistics --namespace AWS/Lambda --metric-name Invocations --dimensions Name=FunctionName,Value=FibonacciStack-dev-ApiHandler --start-time (Get-Date).AddHours(-1).ToString("yyyy-MM-ddTHH:mm:ss") --end-time (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss") --period 300 --statistics Sum
```

### Ver Custos
```powershell
# Abrir Cost Explorer
start https://console.aws.amazon.com/cost-management/home#/cost-explorer
```

---

## 🆘 Troubleshooting

### Ver Eventos da Stack
```powershell
aws cloudformation describe-stack-events --stack-name FibonacciStack-dev --max-items 20
```

### Ver Recursos da Stack
```powershell
aws cloudformation describe-stack-resources --stack-name FibonacciStack-dev
```

### Ver Erros Recentes
```powershell
aws logs filter-log-events --log-group-name /aws/lambda/FibonacciStack-dev-ApiHandler --filter-pattern "ERROR" --start-time ((Get-Date).AddHours(-1).ToUniversalTime().Subtract((Get-Date "1970-01-01")).TotalMilliseconds)
```

---

## 🔄 CI/CD

### Trigger Deploy Dev
```powershell
git push origin develop
```

### Trigger Deploy Staging
```powershell
git push origin main
```

### Trigger Deploy Prod
```powershell
# Via GitHub Actions (manual)
# Ou via CLI:
gh workflow run deploy-prod.yml
```

---

## 📝 Documentação

### Gerar Outputs
```powershell
.\scripts\document-outputs.ts
```

### Ver Changelog
```powershell
Get-Content CHANGELOG.md
```

### Ver README
```powershell
Get-Content README.md
```

---

## 🎯 Atalhos Úteis

### Abrir AWS Console
```powershell
# CloudFormation
start https://console.aws.amazon.com/cloudformation

# Lambda
start https://console.aws.amazon.com/lambda

# RDS
start https://console.aws.amazon.com/rds

# API Gateway
start https://console.aws.amazon.com/apigateway

# CloudWatch
start https://console.aws.amazon.com/cloudwatch
```

### Ver Identidade AWS
```powershell
aws sts get-caller-identity
```

### Ver Região
```powershell
aws configure get region
```

---

## 💡 Dicas

### Alias Úteis (PowerShell Profile)

Adicione ao seu `$PROFILE`:

```powershell
# Alquimista.AI Aliases
function Deploy-Alquimista { .\DEPLOY-FULL-SYSTEM.ps1 @args }
function Validate-Alquimista { .\VALIDATE-INTEGRATION.ps1 @args }
function Logs-Api { aws logs tail /aws/lambda/FibonacciStack-dev-ApiHandler --follow }
function Test-Api { 
    $url = (aws cloudformation describe-stacks --stack-name FibonacciStack-dev --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" --output text)
    curl "$url/health"
}

Set-Alias deploy Deploy-Alquimista
Set-Alias validate Validate-Alquimista
Set-Alias logs Logs-Api
Set-Alias test-api Test-Api
```

Depois use:
```powershell
deploy          # Deploy completo
validate        # Validar
logs            # Ver logs
test-api        # Testar API
```

---

**Última atualização**: 15 de Novembro de 2025  
**Versão**: 1.0.0

