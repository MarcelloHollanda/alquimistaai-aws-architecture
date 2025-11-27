# 🚀 Comandos Rápidos - Tarefa 8: Rotas do API Gateway

## Validação Rápida

### 1. Verificar Rotas Criadas

```bash
# Listar todas as rotas do API Gateway
aws apigatewayv2 get-routes \
  --api-id {api-id} \
  --query 'Items[*].[RouteKey,RouteId]' \
  --output table

# Contar rotas
aws apigatewayv2 get-routes \
  --api-id {api-id} \
  --query 'length(Items)'
```

### 2. Verificar Authorizer

```bash
# Listar authorizers
aws apigatewayv2 get-authorizers \
  --api-id {api-id} \
  --query 'Items[*].[Name,AuthorizerId,AuthorizerType]' \
  --output table
```

### 3. Verificar Integrações

```bash
# Listar integrações
aws apigatewayv2 get-integrations \
  --api-id {api-id} \
  --query 'Items[*].[IntegrationId,IntegrationType,IntegrationUri]' \
  --output table
```

---

## Deploy e Validação

### Deploy do Stack

```powershell
# Deploy em desenvolvimento
cdk deploy OperationalDashboardStack --context env=dev

# Deploy em produção
cdk deploy OperationalDashboardStack --context env=prod

# Deploy com aprovação automática
cdk deploy OperationalDashboardStack --context env=dev --require-approval never
```

### Validar Configuração

```powershell
# Validar setup do Cognito
.\scripts\validate-cognito-setup.ps1

# Validar deploy do operational dashboard
.\scripts\validate-operational-dashboard-dev.ps1

# Smoke tests em produção
.\scripts\smoke-tests-operational-dashboard-prod.ps1
```

---

## Testes de API

### Obter Token JWT

```bash
# Autenticar e obter token
aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id {client-id} \
  --auth-parameters USERNAME={email},PASSWORD={password} \
  --query 'AuthenticationResult.IdToken' \
  --output text
```

### Testar Rotas de Cliente

```bash
# Salvar token em variável
TOKEN="eyJraWQ..."

# GET /tenant/me
curl -H "Authorization: Bearer $TOKEN" \
  https://{api-id}.execute-api.us-east-1.amazonaws.com/tenant/me

# GET /tenant/agents
curl -H "Authorization: Bearer $TOKEN" \
  https://{api-id}.execute-api.us-east-1.amazonaws.com/tenant/agents

# GET /tenant/integrations
curl -H "Authorization: Bearer $TOKEN" \
  https://{api-id}.execute-api.us-east-1.amazonaws.com/tenant/integrations

# GET /tenant/usage?period=30d
curl -H "Authorization: Bearer $TOKEN" \
  "https://{api-id}.execute-api.us-east-1.amazonaws.com/tenant/usage?period=30d"

# GET /tenant/incidents
curl -H "Authorization: Bearer $TOKEN" \
  https://{api-id}.execute-api.us-east-1.amazonaws.com/tenant/incidents
```

### Testar Rotas Internas

```bash
# GET /internal/tenants
curl -H "Authorization: Bearer $TOKEN" \
  https://{api-id}.execute-api.us-east-1.amazonaws.com/internal/tenants

# GET /internal/tenants/{id}
curl -H "Authorization: Bearer $TOKEN" \
  https://{api-id}.execute-api.us-east-1.amazonaws.com/internal/tenants/{tenant-id}

# GET /internal/tenants/{id}/agents
curl -H "Authorization: Bearer $TOKEN" \
  https://{api-id}.execute-api.us-east-1.amazonaws.com/internal/tenants/{tenant-id}/agents

# GET /internal/usage/overview
curl -H "Authorization: Bearer $TOKEN" \
  https://{api-id}.execute-api.us-east-1.amazonaws.com/internal/usage/overview

# GET /internal/billing/overview
curl -H "Authorization: Bearer $TOKEN" \
  https://{api-id}.execute-api.us-east-1.amazonaws.com/internal/billing/overview

# POST /internal/operations/commands
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"command_type":"HEALTH_CHECK","parameters":{}}' \
  https://{api-id}.execute-api.us-east-1.amazonaws.com/internal/operations/commands

# GET /internal/operations/commands
curl -H "Authorization: Bearer $TOKEN" \
  https://{api-id}.execute-api.us-east-1.amazonaws.com/internal/operations/commands
```

---

## Monitoramento

### CloudWatch Logs

```bash
# Ver logs de uma Lambda específica
aws logs tail /aws/lambda/alquimista-get-tenant-me-dev --follow

# Buscar erros nos logs
aws logs filter-log-events \
  --log-group-name /aws/lambda/alquimista-get-tenant-me-dev \
  --filter-pattern "ERROR" \
  --start-time $(date -d '1 hour ago' +%s)000

# Ver logs de todas as Lambdas do operational dashboard
aws logs tail /aws/lambda/alquimista-*-dev --follow
```

### CloudWatch Metrics

```bash
# Métricas do API Gateway
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --dimensions Name=ApiId,Value={api-id} \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum

# Latência do API Gateway
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Latency \
  --dimensions Name=ApiId,Value={api-id} \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum

# Erros 4xx e 5xx
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name 4XXError \
  --dimensions Name=ApiId,Value={api-id} \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

### X-Ray Traces

```bash
# Listar traces recentes
aws xray get-trace-summaries \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --query 'TraceSummaries[*].[Id,Duration,Http.HttpStatus]' \
  --output table

# Ver detalhes de um trace específico
aws xray batch-get-traces \
  --trace-ids {trace-id} \
  --query 'Traces[0].Segments[*].Document' \
  --output text | jq .
```

---

## Troubleshooting

### Erro 401 (Unauthorized)

```bash
# Verificar se o token é válido
echo $TOKEN | cut -d. -f2 | base64 -d | jq .

# Verificar expiração do token
echo $TOKEN | cut -d. -f2 | base64 -d | jq .exp | xargs -I {} date -d @{}
```

### Erro 403 (Forbidden)

```bash
# Verificar grupos do usuário
echo $TOKEN | cut -d. -f2 | base64 -d | jq '."cognito:groups"'

# Verificar tenant_id
echo $TOKEN | cut -d. -f2 | base64 -d | jq '."custom:tenant_id"'
```

### Erro 500 (Internal Server Error)

```bash
# Ver logs da Lambda
aws logs tail /aws/lambda/alquimista-{function-name}-dev --follow

# Ver traces no X-Ray
aws xray get-trace-summaries \
  --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --filter-expression 'http.status = 500'
```

---

## Limpeza

### Remover Stack

```powershell
# Remover stack de desenvolvimento
cdk destroy OperationalDashboardStack --context env=dev

# Remover stack de produção (cuidado!)
cdk destroy OperationalDashboardStack --context env=prod
```

### Limpar Logs

```bash
# Deletar log group
aws logs delete-log-group \
  --log-group-name /aws/lambda/alquimista-get-tenant-me-dev

# Deletar todos os log groups do operational dashboard
aws logs describe-log-groups \
  --log-group-name-prefix /aws/lambda/alquimista- \
  --query 'logGroups[*].logGroupName' \
  --output text | xargs -n1 aws logs delete-log-group --log-group-name
```

---

## Utilitários

### Obter API ID

```bash
# Listar APIs
aws apigatewayv2 get-apis \
  --query 'Items[*].[Name,ApiId]' \
  --output table

# Obter API ID por nome
aws apigatewayv2 get-apis \
  --query 'Items[?Name==`alquimista-platform-api-dev`].ApiId' \
  --output text
```

### Obter URL da API

```bash
# Obter endpoint da API
aws apigatewayv2 get-api \
  --api-id {api-id} \
  --query 'ApiEndpoint' \
  --output text
```

### Exportar Configuração

```bash
# Exportar definição da API
aws apigatewayv2 export-api \
  --api-id {api-id} \
  --output-type JSON \
  --specification OAS30 \
  > api-definition.json
```

---

## Scripts PowerShell

### Criar Usuário de Teste

```powershell
# Criar usuário interno
.\scripts\create-internal-user.ps1 `
  -Email "admin@alquimista.ai" `
  -Name "Admin Teste" `
  -Group "INTERNAL_ADMIN"

# Criar usuário de tenant
.\scripts\create-tenant-user.ps1 `
  -Email "usuario@empresa.com" `
  -Name "Usuario Teste" `
  -TenantId "uuid-do-tenant" `
  -Group "TENANT_ADMIN"
```

### Validação Completa

```powershell
# Executar todos os testes de validação
.\scripts\validate-cognito-setup.ps1
.\scripts\validate-operational-dashboard-dev.ps1
.\scripts\smoke-tests-operational-dashboard-prod.ps1
```

---

## Referências Rápidas

### Variáveis de Ambiente

```bash
# Desenvolvimento
export AWS_REGION=us-east-1
export ENV=dev
export API_ID={api-id-dev}

# Produção
export AWS_REGION=us-east-1
export ENV=prod
export API_ID={api-id-prod}
```

### Endpoints Importantes

```
# Desenvolvimento
https://{api-id}.execute-api.us-east-1.amazonaws.com/tenant/*
https://{api-id}.execute-api.us-east-1.amazonaws.com/internal/*

# Produção
https://{api-id}.execute-api.us-east-1.amazonaws.com/tenant/*
https://{api-id}.execute-api.us-east-1.amazonaws.com/internal/*
```

---

## Documentação

- [TASK-8-COMPLETE.md](./TASK-8-COMPLETE.md) - Resumo completo
- [API-ROUTES-REFERENCE.md](./API-ROUTES-REFERENCE.md) - Referência de rotas
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Resolução de problemas

---

**Última Atualização**: Janeiro 2025  
**Versão**: 1.0.0
