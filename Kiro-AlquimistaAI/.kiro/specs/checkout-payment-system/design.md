# Documento de Design - Sistema de Checkout e Pagamento

## Visão Geral

O Sistema de Checkout e Pagamento da AlquimistaAI é uma solução segura e compatível com PCI-DSS que permite aos clientes assinar planos e agentes através de um fluxo de pagamento integrado com Stripe. O sistema garante que nenhum dado sensível de cartão de crédito seja armazenado no backend, utilizando o modelo de checkout hospedado pelo provedor de pagamento.

## Arquitetura

### Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │  Checkout Page   │  │  Success Page    │  │  Cancel Page  │ │
│  │  /billing/       │  │  /billing/       │  │  /billing/    │ │
│  │  checkout        │  │  success         │  │  cancel       │ │
│  └────────┬─────────┘  └──────────────────┘  └───────────────┘ │
│           │                                                      │
│           │ GET /api/billing/subscription                       │
│           │ POST /api/billing/create-checkout-session           │
└───────────┼──────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY (HTTP API)                        │
└───────────┬──────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LAMBDA HANDLERS (Node.js 20)                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  get-subscription.ts                                     │   │
│  │  - Busca dados da assinatura atual do tenant            │   │
│  │  - Retorna plano, agentes, SubNúcleos, valores          │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  create-checkout-session.ts                              │   │
│  │  - Valida dados do tenant                                │   │
│  │  - Cria sessão no Stripe                                 │   │
│  │  - Retorna URL segura de checkout                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  webhook-payment.ts                                      │   │
│  │  - Recebe eventos do Stripe                              │   │
│  │  - Atualiza status de assinatura                         │   │
│  │  - Registra eventos de pagamento                         │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────┬──────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AURORA POSTGRESQL                             │
│  - Tabela: subscriptions                                        │
│  - Tabela: subscription_items                                   │
│  - Tabela: payment_events                                       │
└─────────────────────────────────────────────────────────────────┘

            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STRIPE (Provedor Externo)                     │
│  - Checkout Session (hospedado)                                 │
│  - Customer Management                                           │
│  - Subscription Management                                       │
│  - Webhook Events                                                │
└─────────────────────────────────────────────────────────────────┘
```

### Fluxo de Dados

#### 1. Fluxo de Checkout

```
1. Cliente acessa /app/billing/checkout
   ↓
2. Frontend chama GET /api/billing/subscription
   ↓
3. Lambda busca dados no Aurora
   ↓
4. Frontend exibe resumo da assinatura
   ↓
5. Cliente clica "Pagar com cartão de crédito"
   ↓
6. Frontend chama POST /api/billing/create-checkout-session
   ↓
7. Lambda cria sessão no Stripe
   ↓
8. Lambda retorna checkoutUrl
   ↓
9. Frontend redireciona para Stripe Checkout (window.location.href)
   ↓
10. Cliente preenche dados de cartão no Stripe
   ↓
11. Stripe processa pagamento
   ↓
12. Stripe redireciona para /app/billing/success ou /app/billing/cancel
```

#### 2. Fluxo de Webhook

```
1. Stripe envia evento (checkout.session.completed)
   ↓
2. API Gateway recebe POST /api/billing/webhook
   ↓
3. Lambda valida assinatura do webhook
   ↓
4. Lambda processa evento
   ↓
5. Lambda atualiza subscription no Aurora
   ↓
6. Lambda registra payment_event
   ↓
7. Lambda retorna 200 OK para Stripe
```

## Componentes e Interfaces

### Frontend Components

#### 1. CheckoutPage (`/app/(dashboard)/billing/checkout/page.tsx`)

**Responsabilidades:**
- Buscar dados da assinatura atual
- Exibir resumo completo do plano
- Iniciar processo de pagamento
- Redirecionar para Stripe Checkout

**Props:** Nenhuma (Server Component)

**Estado:**
```typescript
interface CheckoutState {
  subscription: SubscriptionSummary | null;
  loading: boolean;
  error: string | null;
}
```

**Hooks:**
- `useEffect` para buscar dados na montagem
- `useState` para gerenciar estado local

**Componentes Filhos:**
- `CheckoutHeader` - Cabeçalho com logo e dados da empresa
- `PlanSummary` - Resumo do plano selecionado
- `FinancialSummary` - Resumo financeiro com valores
- `PaymentActions` - Botões de ação
- `SecurityNotice` - Aviso de segurança

#### 2. SuccessPage (`/app/(dashboard)/billing/success/page.tsx`)

**Responsabilidades:**
- Exibir mensagem de sucesso
- Mostrar detalhes do plano contratado
- Exibir próxima data de faturamento
- Fornecer navegação para dashboard

**Query Params:**
- `session_id` - ID da sessão do Stripe

#### 3. CancelPage (`/app/(dashboard)/billing/cancel/page.tsx`)

**Responsabilidades:**
- Exibir mensagem de cancelamento
- Oferecer opção de tentar novamente
- Fornecer link para alterar plano

### Backend Handlers

#### 1. get-subscription.ts

**Endpoint:** `GET /api/billing/subscription`

**Query Parameters:**
```typescript
{
  tenantId: string;
}
```

**Response:**
```typescript
interface SubscriptionSummary {
  tenantId: string;
  companyName: string;
  cnpj: string;
  plan: {
    id: string;
    name: string; // Starter, Profissional, Expert, Enterprise
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
  status: 'active' | 'pending' | 'cancelled';
}
```

**Lógica:**
1. Validar tenantId
2. Buscar subscription no Aurora
3. Buscar subscription_items relacionados
4. Calcular valores totais
5. Retornar dados formatados

#### 2. create-checkout-session.ts

**Endpoint:** `POST /api/billing/create-checkout-session`

**Request Body:**
```typescript
interface CreateCheckoutRequest {
  tenantId: string;
  planId: string;
  periodicity: 'monthly' | 'annual';
  selectedAgents: string[];
  selectedSubnucleos: string[];
}
```

**Response:**
```typescript
interface CheckoutSessionResponse {
  checkoutUrl: string;
  sessionId: string;
  expiresAt: string;
}
```

**Lógica:**
1. Validar dados de entrada
2. Verificar se tenant existe
3. Calcular valor total
4. Criar ou recuperar Stripe Customer
5. Criar Stripe Checkout Session com:
   - Line items (plano + agentes + SubNúcleos)
   - Success URL: `/app/billing/success?session_id={CHECKOUT_SESSION_ID}`
   - Cancel URL: `/app/billing/cancel`
   - Metadata: tenantId, planId, etc.
6. Retornar checkoutUrl

**Integração Stripe:**
```typescript
const session = await stripe.checkout.sessions.create({
  customer: stripeCustomerId,
  mode: 'subscription',
  line_items: [
    {
      price: stripePriceId,
      quantity: 1,
    },
    // ... agentes e SubNúcleos
  ],
  success_url: `${baseUrl}/app/billing/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${baseUrl}/app/billing/cancel`,
  metadata: {
    tenantId,
    planId,
    periodicity,
  },
});
```

#### 3. webhook-payment.ts

**Endpoint:** `POST /api/billing/webhook`

**Headers:**
- `stripe-signature` - Assinatura do webhook

**Request Body:** Evento do Stripe (JSON)

**Eventos Suportados:**
- `checkout.session.completed` - Checkout concluído
- `invoice.paid` - Fatura paga
- `invoice.payment_failed` - Falha no pagamento
- `customer.subscription.updated` - Assinatura atualizada
- `customer.subscription.deleted` - Assinatura cancelada

**Lógica:**
1. Validar assinatura do webhook
2. Extrair tipo de evento
3. Processar evento específico
4. Atualizar dados no Aurora
5. Registrar evento em payment_events
6. Retornar 200 OK

**Exemplo - checkout.session.completed:**
```typescript
const session = event.data.object;
const tenantId = session.metadata.tenantId;

// Atualizar subscription
await db.query(`
  UPDATE subscriptions
  SET 
    stripe_customer_id = $1,
    stripe_subscription_id = $2,
    status = 'active',
    updated_at = NOW()
  WHERE tenant_id = $3
`, [session.customer, session.subscription, tenantId]);

// Registrar evento
await db.query(`
  INSERT INTO payment_events (
    tenant_id,
    event_type,
    provider_customer_id,
    provider_subscription_id,
    amount,
    status,
    metadata
  ) VALUES ($1, $2, $3, $4, $5, $6, $7)
`, [
  tenantId,
  'checkout.completed',
  session.customer,
  session.subscription,
  session.amount_total / 100,
  'success',
  JSON.stringify(session)
]);
```

## Modelos de Dados

### TypeScript Interfaces

```typescript
// Resumo de assinatura
interface SubscriptionSummary {
  tenantId: string;
  companyName: string;
  cnpj: string;
  plan: PlanInfo;
  agents: AgentInfo[];
  subnucleos: SubnucleoInfo[];
  pricing: PricingInfo;
  status: SubscriptionStatus;
}

interface PlanInfo {
  id: string;
  name: string;
  periodicity: 'monthly' | 'annual';
}

interface AgentInfo {
  id: string;
  name: string;
  priceMonthly: number;
}

interface SubnucleoInfo {
  id: string;
  name: string;
  priceMonthly: number;
}

interface PricingInfo {
  subtotal: number;
  taxes: number;
  total: number;
}

type SubscriptionStatus = 'active' | 'pending' | 'cancelled' | 'past_due';

// Sessão de checkout
interface CheckoutSessionResponse {
  checkoutUrl: string;
  sessionId: string;
  expiresAt: string;
}

interface CreateCheckoutRequest {
  tenantId: string;
  planId: string;
  periodicity: 'monthly' | 'annual';
  selectedAgents: string[];
  selectedSubnucleos: string[];
}

// Evento de pagamento
interface PaymentEvent {
  id: string;
  tenantId: string;
  eventType: string;
  providerCustomerId: string;
  providerSubscriptionId: string;
  amount: number;
  currency: string;
  status: string;
  metadata: Record<string, any>;
  createdAt: Date;
}
```

### Tabelas do Banco de Dados

As tabelas já existem no sistema (migration 008 e 009), mas aqui está o uso específico:

#### subscriptions
```sql
-- Campos utilizados:
- id (UUID)
- tenant_id (UUID) - FK para tenants
- plan_id (UUID) - FK para plans
- stripe_customer_id (VARCHAR) - ID do cliente no Stripe
- stripe_subscription_id (VARCHAR) - ID da assinatura no Stripe
- status (VARCHAR) - active, pending, cancelled, past_due
- periodicity (VARCHAR) - monthly, annual
- current_period_start (TIMESTAMP)
- current_period_end (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### subscription_items
```sql
-- Campos utilizados:
- id (UUID)
- subscription_id (UUID) - FK para subscriptions
- item_type (VARCHAR) - agent, subnucleo
- item_id (UUID) - ID do agente ou SubNúcleo
- quantity (INTEGER)
- price_monthly (DECIMAL)
- created_at (TIMESTAMP)
```

#### payment_events
```sql
-- Campos utilizados:
- id (UUID)
- tenant_id (UUID) - FK para tenants
- event_type (VARCHAR) - checkout.completed, invoice.paid, etc.
- provider_customer_id (VARCHAR)
- provider_subscription_id (VARCHAR)
- amount (DECIMAL)
- currency (VARCHAR) - BRL
- status (VARCHAR) - success, failed, pending
- metadata (JSONB) - Dados completos do evento
- created_at (TIMESTAMP)
```

## Tratamento de Erros

### Frontend

**Erros de Rede:**
```typescript
try {
  const response = await billingClient.getSubscription(tenantId);
  setSubscription(response);
} catch (error) {
  if (error.code === 'NETWORK_ERROR') {
    toast.error('Erro de conexão. Verifique sua internet.');
  } else if (error.code === 'NOT_FOUND') {
    toast.error('Assinatura não encontrada.');
  } else {
    toast.error('Erro ao carregar dados. Tente novamente.');
  }
}
```

**Erros de Validação:**
- Exibir mensagens claras usando toast
- Destacar campos com erro
- Fornecer sugestões de correção

### Backend

**Erros de Validação:**
```typescript
if (!tenantId || !planId) {
  return {
    statusCode: 400,
    body: JSON.stringify({
      error: 'VALIDATION_ERROR',
      message: 'tenantId e planId são obrigatórios',
    }),
  };
}
```

**Erros do Stripe:**
```typescript
try {
  const session = await stripe.checkout.sessions.create({...});
} catch (error) {
  logger.error('Erro ao criar sessão Stripe', { error, tenantId });
  
  if (error.type === 'StripeCardError') {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'CARD_ERROR',
        message: 'Erro no cartão de crédito',
      }),
    };
  }
  
  return {
    statusCode: 500,
    body: JSON.stringify({
      error: 'STRIPE_ERROR',
      message: 'Erro ao processar pagamento',
    }),
  };
}
```

**Erros de Banco de Dados:**
```typescript
try {
  await db.query('UPDATE subscriptions...');
} catch (error) {
  logger.error('Erro ao atualizar subscription', { error, tenantId });
  
  return {
    statusCode: 500,
    body: JSON.stringify({
      error: 'DATABASE_ERROR',
      message: 'Erro ao salvar dados',
    }),
  };
}
```

## Estratégia de Testes

### Testes Unitários

**Frontend:**
- Componentes React (renderização, interações)
- Funções de formatação de valores
- Validações de formulário

**Backend:**
- Lógica de cálculo de valores
- Validações de entrada
- Formatação de dados

### Testes de Integração

**Frontend + Backend:**
- Fluxo completo de checkout
- Busca de dados de assinatura
- Tratamento de erros

**Backend + Stripe:**
- Criação de sessão de checkout
- Processamento de webhooks
- Sincronização de dados

### Testes E2E

**Fluxo Completo:**
1. Login do usuário
2. Navegação para checkout
3. Visualização de resumo
4. Clique em "Pagar"
5. Redirecionamento para Stripe
6. (Mock) Conclusão de pagamento
7. Retorno para página de sucesso

## Segurança

### Conformidade PCI-DSS

**Princípios:**
1. **NUNCA** armazenar dados de cartão no backend
2. **SEMPRE** usar checkout hospedado pelo Stripe
3. **APENAS** armazenar tokens/IDs do provedor
4. **VALIDAR** assinaturas de webhooks

### Validação de Webhooks

```typescript
const signature = request.headers['stripe-signature'];

try {
  const event = stripe.webhooks.constructEvent(
    request.body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
  
  // Processar evento validado
} catch (error) {
  logger.error('Webhook signature verification failed', { error });
  return {
    statusCode: 400,
    body: JSON.stringify({ error: 'Invalid signature' }),
  };
}
```

### Proteção de Dados

**Dados Sensíveis:**
- Stripe API Key: AWS Secrets Manager
- Webhook Secret: AWS Secrets Manager
- Database credentials: AWS Secrets Manager

**Logs:**
- NUNCA logar dados de cartão
- NUNCA logar tokens completos
- Logar apenas IDs e metadados não sensíveis

### Rate Limiting

```typescript
// Aplicar rate limiting no API Gateway
const rateLimiter = {
  '/api/billing/create-checkout-session': {
    limit: 10, // 10 requisições
    window: 60, // por minuto
  },
};
```

## Configuração de Ambiente

### Variáveis de Ambiente

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_API_BASE_URL=https://api.alquimistaai.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Backend (Lambda Environment Variables):**
```bash
STRIPE_SECRET_KEY=sk_test_... # Do Secrets Manager
STRIPE_WEBHOOK_SECRET=whsec_... # Do Secrets Manager
DATABASE_HOST=aurora-cluster.us-east-1.rds.amazonaws.com
DATABASE_NAME=alquimista
FRONTEND_BASE_URL=https://app.alquimistaai.com
```

### Secrets Manager

**Paths:**
```
/alquimista/dev/stripe/secret-key
/alquimista/dev/stripe/webhook-secret
/alquimista/prod/stripe/secret-key
/alquimista/prod/stripe/webhook-secret
```

## Observabilidade

### Logging

**Eventos a Logar:**
- Criação de sessão de checkout
- Redirecionamento para Stripe
- Recebimento de webhook
- Atualização de assinatura
- Erros e exceções

**Formato:**
```typescript
logger.info('Checkout session created', {
  tenantId,
  sessionId,
  amount: total,
  currency: 'BRL',
});
```

### Métricas

**CloudWatch Metrics:**
- `CheckoutSessionsCreated` - Sessões criadas
- `CheckoutSessionsCompleted` - Checkouts concluídos
- `CheckoutSessionsCancelled` - Checkouts cancelados
- `WebhookEventsReceived` - Webhooks recebidos
- `WebhookEventsProcessed` - Webhooks processados
- `PaymentErrors` - Erros de pagamento

### Alarmes

**Alarmes Críticos:**
- Taxa de erro > 5% em create-checkout-session
- Webhook processing failures > 10 em 5 minutos
- Latência > 3s em get-subscription

## Considerações de Performance

### Frontend

**Otimizações:**
- Lazy loading de componentes pesados
- Memoização de cálculos de valores
- Debounce em validações de formulário
- Cache de dados de assinatura (5 minutos)

### Backend

**Otimizações:**
- Connection pooling para Aurora
- Cache de dados de planos (Redis/ElastiCache)
- Processamento assíncrono de webhooks
- Retry logic com exponential backoff

### Stripe

**Boas Práticas:**
- Reutilizar Stripe Customer quando possível
- Usar idempotency keys em criação de sessões
- Implementar retry logic para chamadas à API
- Monitorar rate limits

## Roadmap de Implementação

### Fase 1: Estrutura Base
- Criar interfaces TypeScript
- Implementar billing-client.ts
- Criar componentes UI básicos

### Fase 2: Backend
- Implementar get-subscription.ts
- Implementar create-checkout-session.ts
- Configurar Stripe SDK

### Fase 3: Frontend
- Implementar CheckoutPage
- Implementar SuccessPage
- Implementar CancelPage

### Fase 4: Webhooks
- Implementar webhook-payment.ts
- Configurar endpoint no Stripe
- Testar eventos

### Fase 5: Testes e Refinamento
- Testes unitários
- Testes de integração
- Testes E2E
- Ajustes de UX

### Fase 6: Deploy e Monitoramento
- Deploy em dev
- Testes em staging
- Deploy em prod
- Configurar alarmes
