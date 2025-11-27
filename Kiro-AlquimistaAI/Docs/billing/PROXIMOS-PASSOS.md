# Próximos Passos - Sistema de Billing

## ✅ O que já está pronto

### Backend (100%)
- ✅ Migration de banco de dados completa
- ✅ Tipos TypeScript definidos
- ✅ 7 handlers Lambda implementados:
  - `get-agents.ts` - Lista agentes
  - `commercial-contact.ts` - Contato comercial
  - `trial-start.ts` - Inicia trial
  - `trial-invoke.ts` - Invoca trial
  - `create-checkout-session.ts` - Cria checkout Stripe
  - `get-subscription.ts` - Busca assinatura
  - `webhook-payment.ts` - Processa webhooks Stripe

### Frontend Lib/Store (100%)
- ✅ `agents-client.ts` - Client para API de agentes
- ✅ `billing-client.ts` - Client para API de billing
- ✅ `commercial-client.ts` - Client para contato comercial
- ✅ `trials-client.ts` - Client para trials
- ✅ `selection-store.ts` - Store Zustand para seleção

---

## 🔄 O que falta implementar

### 1. Componentes de UI (Prioridade Alta)

#### `frontend/src/components/agents/agent-card.tsx`
Card individual de agente com:
- Nome, segmento, descrição
- Tags
- Preço (R$ 29,90/mês)
- Botão "Teste nossa IA"
- Botão "Adicionar ao meu plano" (toggle)

#### `frontend/src/components/agents/agents-grid.tsx`
Grid responsivo de cards de agentes:
- Layout em grid (3 colunas desktop, 1 mobile)
- Filtros por segmento/tags
- Busca por nome

#### `frontend/src/components/agents/fibonacci-section.tsx`
Seção de SubNúcleos Fibonacci:
- Lista de SubNúcleos disponíveis
- Cards com descrição e preço base
- Texto: "A partir de R$ 365,00/mês + taxas sob consulta"

#### `frontend/src/components/agents/subnucleo-card.tsx`
Card de SubNúcleo:
- Nome e descrição
- Preço base
- Botão "Teste nossa IA"
- Botão "Tenho interesse"

#### `frontend/src/components/agents/selection-summary.tsx`
Resumo flutuante/fixo com:
- Lista de agentes selecionados
- Lista de SubNúcleos com interesse
- Cálculo de totais
- Botão "Continuar para pagamento" (se só agentes)
- Botão "Falar com comercial" (se tem SubNúcleo)

#### `frontend/src/components/trial/trial-modal.tsx`
Modal de teste gratuito:
- Chat minimalista
- Contador de tokens (5 máximo)
- Timer de 24h
- Mensagem de bloqueio ao expirar
- CTA para assinatura/contato

---

### 2. Páginas (Prioridade Alta)

#### `frontend/src/app/(public)/page.tsx`
Página pública principal:
- Hero section
- Grid de agentes AlquimistaAI
- Seção Fibonacci
- Selection Summary (sticky)
- Integração com store de seleção

#### `frontend/src/app/app/billing/checkout/page.tsx`
Página de checkout (autenticada):
- Resumo do plano
- Lista de agentes selecionados
- Total mensal
- Botão "Pagar com cartão"
- Redirecionamento para Stripe

#### `frontend/src/app/app/billing/success/page.tsx`
Página de sucesso pós-pagamento:
- Mensagem de confirmação
- Resumo da assinatura
- Link para dashboard

#### `frontend/src/app/app/billing/cancel/page.tsx`
Página de cancelamento:
- Mensagem de cancelamento
- Link para tentar novamente
- Link para contato comercial

#### `frontend/src/app/app/commercial/contact/page.tsx`
Formulário de contato comercial:
- Campos: empresa, CNPJ, responsável, e-mail, WhatsApp
- Resumo de seleção (read-only)
- Campo de mensagem livre
- Validações
- Envio via API

---

### 3. Infraestrutura CDK (Prioridade Média)

#### Atualizar `lib/alquimista-stack.ts`

Adicionar:

```typescript
// Lambdas de Billing
const createCheckoutFunction = new lambda.Function(this, 'CreateCheckoutFunction', {
  runtime: lambda.Runtime.NODEJS_20_X,
  handler: 'create-checkout-session.handler',
  code: lambda.Code.fromAsset('lambda/platform'),
  environment: {
    DATABASE_HOST: dbHost,
    DATABASE_NAME: dbName,
    DATABASE_USER: dbUser,
    DATABASE_PASSWORD: dbPassword,
    STRIPE_SECRET_KEY: stripeSecretKey,
    FRONTEND_URL: frontendUrl,
  },
});

const getSubscriptionFunction = new lambda.Function(this, 'GetSubscriptionFunction', {
  runtime: lambda.Runtime.NODEJS_20_X,
  handler: 'get-subscription.handler',
  code: lambda.Code.fromAsset('lambda/platform'),
  environment: {
    DATABASE_HOST: dbHost,
    DATABASE_NAME: dbName,
    DATABASE_USER: dbUser,
    DATABASE_PASSWORD: dbPassword,
  },
});

const webhookPaymentFunction = new lambda.Function(this, 'WebhookPaymentFunction', {
  runtime: lambda.Runtime.NODEJS_20_X,
  handler: 'webhook-payment.handler',
  code: lambda.Code.fromAsset('lambda/platform'),
  environment: {
    DATABASE_HOST: dbHost,
    DATABASE_NAME: dbName,
    DATABASE_USER: dbUser,
    DATABASE_PASSWORD: dbPassword,
    STRIPE_SECRET_KEY: stripeSecretKey,
    STRIPE_WEBHOOK_SECRET: stripeWebhookSecret,
  },
});

// Rotas no API Gateway
api.addRoutes({
  path: '/api/billing/create-checkout-session',
  methods: [apigw.HttpMethod.POST],
  integration: new integrations.HttpLambdaIntegration(
    'CreateCheckoutIntegration',
    createCheckoutFunction
  ),
});

api.addRoutes({
  path: '/api/billing/subscription',
  methods: [apigw.HttpMethod.GET],
  integration: new integrations.HttpLambdaIntegration(
    'GetSubscriptionIntegration',
    getSubscriptionFunction
  ),
});

api.addRoutes({
  path: '/api/billing/webhook',
  methods: [apigw.HttpMethod.POST],
  integration: new integrations.HttpLambdaIntegration(
    'WebhookPaymentIntegration',
    webhookPaymentFunction
  ),
});
```

#### Configurar Secrets Manager

```bash
# Criar secrets para Stripe
aws secretsmanager create-secret \
  --name /alquimista/dev/stripe/secret-key \
  --secret-string "sk_test_..."

aws secretsmanager create-secret \
  --name /alquimista/dev/stripe/webhook-secret \
  --secret-string "whsec_..."
```

---

### 4. Configuração Stripe (Prioridade Alta)

#### Criar conta Stripe
1. Acessar https://stripe.com
2. Criar conta
3. Obter chaves de API (test mode)

#### Configurar Webhook
1. Dashboard Stripe → Developers → Webhooks
2. Adicionar endpoint: `https://api.alquimista.ai/api/billing/webhook`
3. Selecionar eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copiar webhook secret

---

### 5. Testes (Prioridade Média)

#### Testar Handlers Localmente

```bash
# Instalar dependências
cd lambda/platform
npm install stripe pg

# Testar create-checkout-session
sam local invoke CreateCheckoutFunction \
  --event events/create-checkout.json

# Testar get-subscription
sam local invoke GetSubscriptionFunction \
  --event events/get-subscription.json

# Testar webhook
sam local invoke WebhookPaymentFunction \
  --event events/webhook-payment.json
```

#### Testar Frontend

```bash
cd frontend
npm run dev

# Acessar:
# http://localhost:3000 - Página pública
# http://localhost:3000/app/billing/checkout - Checkout
# http://localhost:3000/app/commercial/contact - Contato
```

---

## 📋 Checklist de Implementação

### Backend
- [x] Migration de banco
- [x] Tipos TypeScript
- [x] Handlers Lambda
- [ ] Testes unitários
- [ ] Testes de integração

### Frontend
- [x] Lib clients
- [x] Store de seleção
- [ ] Componentes de UI
- [ ] Páginas
- [ ] Testes de componentes

### Infraestrutura
- [ ] Atualizar CDK stack
- [ ] Configurar Secrets Manager
- [ ] Deploy em dev
- [ ] Configurar Stripe webhook
- [ ] Deploy em prod

### Documentação
- [x] README de implementação
- [x] Progresso documentado
- [ ] Guia de uso para usuários
- [ ] Guia de troubleshooting

---

## 🚀 Como Continuar

### Opção 1: Implementar Componentes
Começar pelos componentes de UI, que são a base visual do sistema.

```bash
# Criar componentes na ordem:
1. agent-card.tsx
2. agents-grid.tsx
3. subnucleo-card.tsx
4. fibonacci-section.tsx
5. selection-summary.tsx
6. trial-modal.tsx
```

### Opção 2: Implementar Páginas
Criar as páginas principais do fluxo.

```bash
# Criar páginas na ordem:
1. (public)/page.tsx
2. app/billing/checkout/page.tsx
3. app/billing/success/page.tsx
4. app/billing/cancel/page.tsx
5. app/commercial/contact/page.tsx
```

### Opção 3: Configurar Infraestrutura
Preparar o ambiente AWS para deploy.

```bash
# Passos:
1. Atualizar lib/alquimista-stack.ts
2. Configurar Secrets Manager
3. Deploy CDK
4. Configurar Stripe
5. Testar webhooks
```

---

## 💡 Recomendação

**Ordem sugerida de implementação:**

1. **Componentes básicos** (agent-card, subnucleo-card)
2. **Componentes de layout** (agents-grid, fibonacci-section)
3. **Página pública** (testar seleção)
4. **Selection summary** (testar cálculos)
5. **Infraestrutura CDK** (deploy backend)
6. **Página de checkout** (testar fluxo completo)
7. **Trial modal** (testar trials)
8. **Páginas de sucesso/cancelamento**
9. **Página de contato comercial**
10. **Testes e ajustes finais**

---

## 📞 Suporte

Se tiver dúvidas durante a implementação:
- Consultar blueprint: `.kiro/steering/blueprint-comercial-assinaturas.md`
- Consultar código existente: `docs/billing/CODIGO-COMPLETO-RESTANTE.md`
- Consultar progresso: `docs/billing/PROGRESSO-IMPLEMENTACAO.md`

---

**Status Atual**: Backend 100% completo, Frontend Lib/Store 100% completo
**Próximo Passo**: Implementar componentes de UI
