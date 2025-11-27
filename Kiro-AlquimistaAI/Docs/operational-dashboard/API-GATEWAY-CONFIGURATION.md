# Configuração do API Gateway - Painel Operacional

## Visão Geral

Este documento descreve a configuração completa do API Gateway para o Painel Operacional AlquimistaAI.

---

## Stack CDK

**Arquivo**: `lib/operational-dashboard-stack.ts`

**API Gateway**: Reutiliza o `platformApi` do `AlquimistaStack`

---

## Configuração de CORS

O CORS está configurado no nível do API Gateway HTTP:

```typescript
corsPreflight: {
  allowOrigins: ['*'],
  allowMethods: [
    apigatewayv2.CorsHttpMethod.GET,
    apigatewayv2.CorsHttpMethod.POST,
    apigatewayv2.CorsHttpMethod.PUT,
    apigatewayv2.CorsHttpMethod.DELETE,
    apigatewayv2.CorsHttpMethod.OPTIONS
  ],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: cdk.Duration.days(1)
}
```

### Detalhes

- **Allow Origins**: `*` (todos os domínios)
- **Allow Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Allow Headers**: Content-Type, Authorization
- **Max Age**: 1 dia (86400 segundos)

---

## Authorizer Cognito

Todas as rotas utilizam o mesmo authorizer Cognito:

```typescript
const cognitoAuthorizer = new authorizers.HttpUserPoolAuthorizer(
  'OperationalDashboardAuthorizer',
  userPool,
  {
    authorizerName: `operational-dashboard-authorizer-${envName}`,
    identitySource: ['$request.header.Authorization'],
  }
);
```

### Características

- **Tipo**: JWT Authorizer (User Pool)
- **Identity Source**: Header `Authorization`
- **Formato**: `Bearer {jwt-token}`
- **Validação**: Automática pelo API Gateway

---

## Rotas Configuradas

### Rotas do Cliente (/tenant/*)

| Rota | Método | Lambda | Descrição |
|------|--------|--------|-----------|
| `/tenant/me` | GET | `get-tenant-me` | Dados da empresa |
| `/tenant/agents` | GET | `get-tenant-agents` | Agentes contratados |
| `/tenant/integrations` | GET | `get-tenant-integrations` | Integrações ativas |
| `/tenant/usage` | GET | `get-tenant-usage` | Métricas de uso |
| `/tenant/incidents` | GET | `get-tenant-incidents` | Histórico de incidentes |

### Rotas Internas (/internal/*)

| Rota | Método | Lambda | Descrição |
|------|--------|--------|-----------|
| `/internal/tenants` | GET | `list-tenants` | Lista todos os tenants |
| `/internal/tenants/{id}` | GET | `get-tenant-detail` | Detalhes do tenant |
| `/internal/tenants/{id}/agents` | GET | `get-tenant-agents-internal` | Agentes do tenant |
| `/internal/usage/overview` | GET | `get-usage-overview` | Visão global de uso |
| `/internal/billing/overview` | GET | `get-billing-overview` | Visão financeira |
| `/internal/operations/commands` | POST | `create-operational-command` | Criar comando |
| `/internal/operations/commands` | GET | `list-operational-commands` | Listar comandos |

---

## Integrações Lambda

Todas as integrações utilizam:

```typescript
new integrations.HttpLambdaIntegration(
  'IntegrationName',
  lambdaFunction,
  { payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0 }
);
```

### Payload Format Version 2.0

Benefícios:
- Estrutura de evento simplificada
- Melhor performance
- Suporte a features modernas do API Gateway

---

## Throttling

### Configuração Padrão

O API Gateway HTTP utiliza as seguintes configurações padrão:

- **Rate Limit**: 10.000 requisições por segundo
- **Burst Limit**: 5.000 requisições

### Throttling Customizado

Para implementar throttling customizado por rota ou por tenant:

1. **Opção 1**: Migrar para API Gateway REST API
   - Suporta throttling por método/rota
   - Suporta usage plans e API keys

2. **Opção 2**: Implementar rate limiting na Lambda
   - Usar DynamoDB para contadores
   - Implementar sliding window
   - Retornar 429 quando limite excedido

3. **Opção 3**: Usar AWS WAF
   - Rate-based rules
   - Proteção contra DDoS

---

## Configuração de Timeout

### Lambda Timeout

| Função | Timeout | Justificativa |
|--------|---------|---------------|
| Tenant APIs | 10s | Queries simples |
| Internal List | 30s | Queries complexas com agregação |
| Usage/Billing | 30s | Agregação de métricas |
| Commands | 10s | Apenas criação de registro |
| Process Command | 5min | Execução de comandos |
| Aggregate Metrics | 5min | Processamento batch |

### API Gateway Timeout

- **Timeout Máximo**: 30 segundos (limite do API Gateway HTTP)
- **Recomendação**: Operações longas devem ser assíncronas

---

## Logs e Monitoramento

### CloudWatch Logs

Cada Lambda tem log group dedicado:

```
/aws/lambda/alquimista-{function-name}-{env}
```

**Retenção**: 1 semana (7 dias)

### X-Ray Tracing

Todas as Lambdas têm tracing ativo:

```typescript
tracing: lambda.Tracing.ACTIVE
```

### CloudWatch Metrics

Métricas automáticas:
- Invocations
- Duration
- Errors
- Throttles
- ConcurrentExecutions

---

## Segurança

### 1. Autenticação

- **Método**: JWT do Amazon Cognito
- **Validação**: Automática pelo API Gateway
- **Expiração**: Configurada no User Pool

### 2. Autorização

- **Nível 1**: API Gateway valida JWT
- **Nível 2**: Lambda middleware valida grupos
- **Nível 3**: Lambda valida tenant_id

### 3. Criptografia

- **Em Trânsito**: HTTPS obrigatório
- **Em Repouso**: KMS para dados sensíveis

### 4. Input Validation

- **API Gateway**: Validação básica de formato
- **Lambda**: Validação completa de business rules

---

## Deployment

### Deploy via CDK

```bash
# Compilar TypeScript
npm run build

# Sintetizar template
cdk synth OperationalDashboardStack --context env=dev

# Deploy
cdk deploy OperationalDashboardStack --context env=dev
```

### Outputs

Após deploy, o CDK exporta:

```
alquimista-commands-table-{env}
alquimista-commands-table-arn-{env}
alquimista-aggregate-metrics-arn-{env}
alquimista-process-command-arn-{env}
```

---

## Testes

### Teste de Rota

```bash
# Obter token JWT
TOKEN=$(aws cognito-idp initiate-auth ...)

# Testar rota
curl -X GET \
  https://{api-id}.execute-api.us-east-1.amazonaws.com/tenant/me \
  -H "Authorization: Bearer $TOKEN"
```

### Teste de CORS

```bash
curl -X OPTIONS \
  https://{api-id}.execute-api.us-east-1.amazonaws.com/tenant/me \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization" \
  -v
```

---

## Troubleshooting

### Erro 401 Unauthorized

**Causas**:
- Token JWT ausente ou inválido
- Token expirado
- User Pool incorreto

**Solução**:
- Verificar formato do header: `Authorization: Bearer {token}`
- Renovar token
- Verificar configuração do authorizer

### Erro 403 Forbidden

**Causas**:
- Usuário não tem grupo necessário
- tenant_id não corresponde

**Solução**:
- Verificar grupos do usuário no Cognito
- Verificar lógica de autorização na Lambda

### Erro 429 Too Many Requests

**Causas**:
- Rate limit excedido
- Burst limit excedido

**Solução**:
- Implementar retry com exponential backoff
- Distribuir requisições ao longo do tempo
- Considerar cache no frontend

### CORS Error

**Causas**:
- Origin não permitido
- Headers não permitidos
- Método não permitido

**Solução**:
- Verificar configuração de CORS no API Gateway
- Verificar se OPTIONS está habilitado
- Verificar headers enviados pelo frontend

---

## Melhorias Futuras

### Curto Prazo

1. Implementar cache Redis para rotas de leitura
2. Adicionar rate limiting por tenant
3. Implementar paginação cursor-based

### Médio Prazo

1. Migrar para API Gateway REST para throttling avançado
2. Implementar webhooks para eventos
3. Adicionar GraphQL como alternativa

### Longo Prazo

1. Implementar API versioning
2. Adicionar suporte a WebSockets
3. Implementar API Gateway Custom Domain

---

## Referências

- [API Gateway HTTP API](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api.html)
- [Lambda Integration](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-lambda.html)
- [JWT Authorizers](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-jwt-authorizer.html)
- [CORS Configuration](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-cors.html)

---

**Última atualização**: 2025-11-18
