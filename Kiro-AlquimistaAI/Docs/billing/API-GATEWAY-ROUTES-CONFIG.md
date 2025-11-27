# Configuração de Rotas do API Gateway - Sistema de Checkout

## Rotas a Adicionar

### 1. GET /api/billing/subscription

**Handler:** `lambda/platform/get-subscription.ts`

**Descrição:** Busca dados completos da assinatura para exibição no checkout

**Autenticação:** Requerida (JWT)

**Query Parameters:**
- `tenantId` (opcional, pode vir do JWT)

**Response:**
```typescript
{
  tenantId: string;
  companyName: string;
  cnpj: string;
  plan: {
    id: string;
    name: string;
    periodicity: 'monthly' | 'annual';
  };
  agents: Array<{
    id: string;
    name: string;
    priceMonthly: number;
  }>;
  subnucleos: Array<{
    id: string;
    name: string;
    priceMonthly: number;
  }>;
  pricing: {
    subtotal: number;
    taxes: number;
    total: number;
  };
  status: 'active' | 'pending' | 'cancelled' | 'past_due';
}
```

**CORS:** Habilitado

**Rate Limiting:** 100 requisições/minuto por IP

---

### 2. POST /api/billing/create-checkout-session

**Handler:** `lambda/platform/create-checkout-session.ts`

**Descrição:** Cria uma sessão de checkout no Stripe

**Autenticação:** Requerida (JWT)

**Request Body:**
```typescript
{
  tenantId: string;
  planId: string;
  periodicity: 'monthly' | 'annual';
  selectedAgents: string[];
  selectedSubnucleos: string[];
}
```

**Response:**
```typescript
{
  checkoutUrl: string;
  sessionId: string;
  expiresAt: string;
}
```

**CORS:** Habilitado

**Rate Limiting:** 10 requisições/minuto por tenant

**Timeout:** 30 segundos

---

### 3. POST /api/billing/webhook

**Handler:** `lambda/platform/webhook-payment.ts`

**Descrição:** Recebe webhooks do Stripe

**Autenticação:** Validação de assinatura Stripe

**Headers Requeridos:**
- `stripe-signature` ou `Stripe-Signature`

**Request Body:** Evento do Stripe (JSON)

**Response:**
```typescript
{
  received: true
}
```

**CORS:** Não necessário (chamado pelo Stripe)

**Rate Limiting:** Não aplicar (Stripe controla)

**Timeout:** 30 segundos

---

## Exemplo de Configuração CDK

```typescript
// No arquivo lib/alquimista-stack.ts ou similar

import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as lambda from 'aws-cdk-lib/aws-lambda';

// Criar Lambdas
const getSubscriptionLambda = new lambda.Function(this, 'GetSubscriptionFunction', {
  runtime: lambda.Runtime.NODEJS_20_X,
  handler: 'get-subscription.handler',
  code: lambda.Code.fromAsset('lambda/platform'),
  environment: {
    DATABASE_HOST: dbHost,
    DATABASE_NAME: dbName,
    ENV: env,
  },
  timeout: cdk.Duration.seconds(30),
});

const createCheckoutSessionLambda = new lambda.Function(this, 'CreateCheckoutSessionFunction', {
  runtime: lambda.Runtime.NODEJS_20_X,
  handler: 'create-checkout-session.handler',
  code: lambda.Code.fromAsset('lambda/platform'),
  environment: {
    DATABASE_HOST: dbHost,
    DATABASE_NAME: dbName,
    FRONTEND_BASE_URL: frontendUrl,
    ENV: env,
  },
  timeout: cdk.Duration.seconds(30),
});

const webhookPaymentLambda = new lambda.Function(this, 'WebhookPaymentFunction', {
  runtime: lambda.Runtime.NODEJS_20_X,
  handler: 'webhook-payment.handler',
  code: lambda.Code.fromAsset('lambda/platform'),
  environment: {
    DATABASE_HOST: dbHost,
    DATABASE_NAME: dbName,
    ENV: env,
  },
  timeout: cdk.Duration.seconds(30),
});

// Conceder permissões para Secrets Manager
const stripeSecretArn = `arn:aws:secretsmanager:${this.region}:${this.account}:secret:/alquimista/${env}/stripe/*`;
createCheckoutSessionLambda.addToRolePolicy(new iam.PolicyStatement({
  actions: ['secretsmanager:GetSecretValue'],
  resources: [stripeSecretArn],
}));

webhookPaymentLambda.addToRolePolicy(new iam.PolicyStatement({
  actions: ['secretsmanager:GetSecretValue'],
  resources: [stripeSecretArn],
}));

// Adicionar rotas ao API Gateway
const api = apigateway.HttpApi.fromHttpApiAttributes(this, 'ExistingApi', {
  httpApiId: existingApiId,
});

// Rota: GET /api/billing/subscription
api.addRoutes({
  path: '/api/billing/subscription',
  methods: [apigateway.HttpMethod.GET],
  integration: new integrations.HttpLambdaIntegration(
    'GetSubscriptionIntegration',
    getSubscriptionLambda
  ),
  authorizer: jwtAuthorizer, // Usar authorizer existente
});

// Rota: POST /api/billing/create-checkout-session
api.addRoutes({
  path: '/api/billing/create-checkout-session',
  methods: [apigateway.HttpMethod.POST],
  integration: new integrations.HttpLambdaIntegration(
    'CreateCheckoutSessionIntegration',
    createCheckoutSessionLambda
  ),
  authorizer: jwtAuthorizer, // Usar authorizer existente
});

// Rota: POST /api/billing/webhook (sem autenticação JWT)
api.addRoutes({
  path: '/api/billing/webhook',
  methods: [apigateway.HttpMethod.POST],
  integration: new integrations.HttpLambdaIntegration(
    'WebhookPaymentIntegration',
    webhookPaymentLambda
  ),
  // Sem authorizer - validação feita no handler
});
```

## Configuração de CORS

```typescript
// Configurar CORS para as rotas de billing
const corsConfig = {
  allowOrigins: [
    'https://app.alquimistaai.com',
    'http://localhost:3000', // Para desenvolvimento
  ],
  allowMethods: [
    apigateway.CorsHttpMethod.GET,
    apigateway.CorsHttpMethod.POST,
    apigateway.CorsHttpMethod.OPTIONS,
  ],
  allowHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
  ],
  maxAge: cdk.Duration.hours(1),
};
```

## Rate Limiting

```typescript
// Configurar throttling para proteção
const throttleSettings = {
  rateLimit: 100, // requisições por segundo
  burstLimit: 200, // burst máximo
};

// Aplicar throttling específico para create-checkout-session
const createCheckoutRoute = api.addRoutes({
  path: '/api/billing/create-checkout-session',
  methods: [apigateway.HttpMethod.POST],
  integration: new integrations.HttpLambdaIntegration(
    'CreateCheckoutSessionIntegration',
    createCheckoutSessionLambda,
    {
      throttle: {
        rateLimit: 10, // Mais restritivo
        burstLimit: 20,
      },
    }
  ),
});
```

## Permissões IAM Necessárias

### Para Lambdas de Billing

```typescript
// Permissões para acessar Secrets Manager
const secretsPolicy = new iam.PolicyStatement({
  actions: ['secretsmanager:GetSecretValue'],
  resources: [
    `arn:aws:secretsmanager:${region}:${account}:secret:/alquimista/${env}/stripe/secret-key*`,
    `arn:aws:secretsmanager:${region}:${account}:secret:/alquimista/${env}/stripe/webhook-secret*`,
  ],
});

// Permissões para acessar Aurora
const rdsPolicy = new iam.PolicyStatement({
  actions: [
    'rds-data:ExecuteStatement',
    'rds-data:BatchExecuteStatement',
  ],
  resources: [dbClusterArn],
});

// Aplicar políticas
createCheckoutSessionLambda.addToRolePolicy(secretsPolicy);
createCheckoutSessionLambda.addToRolePolicy(rdsPolicy);

webhookPaymentLambda.addToRolePolicy(secretsPolicy);
webhookPaymentLambda.addToRolePolicy(rdsPolicy);

getSubscriptionLambda.addToRolePolicy(rdsPolicy);
```

## Monitoramento

### CloudWatch Alarms

```typescript
// Alarme para taxa de erro em create-checkout-session
new cloudwatch.Alarm(this, 'CheckoutSessionErrorAlarm', {
  metric: createCheckoutSessionLambda.metricErrors(),
  threshold: 5,
  evaluationPeriods: 1,
  alarmDescription: 'Alerta quando há mais de 5 erros em create-checkout-session',
});

// Alarme para latência
new cloudwatch.Alarm(this, 'CheckoutSessionLatencyAlarm', {
  metric: createCheckoutSessionLambda.metricDuration(),
  threshold: 3000, // 3 segundos
  evaluationPeriods: 2,
  alarmDescription: 'Alerta quando latência excede 3 segundos',
});

// Alarme para falhas de webhook
new cloudwatch.Alarm(this, 'WebhookFailureAlarm', {
  metric: webhookPaymentLambda.metricErrors(),
  threshold: 10,
  evaluationPeriods: 1,
  alarmDescription: 'Alerta quando há mais de 10 falhas de webhook',
});
```

## Logs Estruturados

```typescript
// Configurar log groups com retenção
const logGroup = new logs.LogGroup(this, 'BillingLogsGroup', {
  logGroupName: `/aws/lambda/billing-${env}`,
  retention: logs.RetentionDays.ONE_MONTH,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});
```

## Testes

### Testar Rotas Localmente

```bash
# Testar GET /api/billing/subscription
curl -X GET "https://api.alquimistaai.com/api/billing/subscription?tenantId=xxx" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Testar POST /api/billing/create-checkout-session
curl -X POST "https://api.alquimistaai.com/api/billing/create-checkout-session" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "xxx",
    "planId": "yyy",
    "periodicity": "monthly",
    "selectedAgents": [],
    "selectedSubnucleos": []
  }'

# Testar webhook (usar Stripe CLI)
stripe trigger checkout.session.completed
```

## Checklist de Deploy

- [ ] Criar Lambdas no CDK
- [ ] Configurar variáveis de ambiente
- [ ] Adicionar permissões IAM
- [ ] Criar rotas no API Gateway
- [ ] Configurar CORS
- [ ] Configurar rate limiting
- [ ] Adicionar alarmes CloudWatch
- [ ] Testar rotas em dev
- [ ] Configurar webhook no Stripe
- [ ] Validar em staging
- [ ] Deploy em produção

---

**Nota:** Este documento deve ser usado como referência para adicionar as rotas ao stack CDK existente. Adapte conforme a estrutura atual do projeto.
