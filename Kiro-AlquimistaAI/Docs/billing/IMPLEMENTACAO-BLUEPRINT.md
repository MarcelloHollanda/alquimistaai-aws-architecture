# Implementação do Blueprint de Billing e Assinaturas

## Status da Implementação

### ✅ Concluído

1. **Database Migrations**
   - `database/migrations/008_create_billing_tables.sql`
   - `database/migrations/README-008.md`
   - Tabelas: commercial_requests, trials, payment_events, subscriptions

2. **Backend - Tipos**
   - `lambda/platform/types/billing.ts`

3. **Backend - Handlers Criados**
   - `lambda/platform/get-agents.ts` - GET /api/agents

### 🔄 Próximos Passos

#### Backend Lambda Handlers

1. **`lambda/platform/commercial-contact.ts`** - POST /api/commercial/contact
   - Receber solicitação comercial
   - Enviar e-mail para alquimistafibonacci@gmail.com
   - Registrar em commercial_requests
   - (Opcional) Disparar WhatsApp

2. **`lambda/platform/trial-start.ts`** - POST /api/trials/start
   - Iniciar ou recuperar trial
   - Validar se já existe trial ativo
   - Criar registro com expires_at = now() + 24h

3. **`lambda/platform/trial-invoke.ts`** - POST /api/trials/invoke
   - Validar trial (24h e 5 tokens)
   - Incrementar usage_count
   - Encaminhar para modelo de IA
   - Retornar resposta + tokens restantes

4. **`lambda/platform/create-checkout-session.ts`** - POST /api/billing/create-checkout-session
   - Validar que não há SubNúcleos Fibonacci
   - Criar sessão no Stripe/Pagar.me
   - Registrar em payment_events
   - Retornar checkoutUrl

5. **`lambda/platform/get-subscription.ts`** - GET /api/billing/subscription
   - Buscar assinatura ativa do tenant
   - Retornar agentes assinados e valor mensal

6. **`lambda/platform/webhook-payment.ts`** - POST /api/billing/webhook
   - Receber webhooks do gateway
   - Validar assinatura do webhook
   - Atualizar subscriptions
   - Registrar em payment_events

#### Frontend - Lib Clients

1. **`frontend/src/lib/agents-client.ts`**
   ```typescript
   export async function getAgents()
   export async function getAgentById(id: string)
   ```

2. **`frontend/src/lib/billing-client.ts`**
   ```typescript
   export async function createCheckoutSession(data)
   export async function getSubscription()
   ```

3. **`frontend/src/lib/commercial-client.ts`**
   ```typescript
   export async function sendCommercialContact(data)
   ```

4. **`frontend/src/lib/trials-client.ts`**
   ```typescript
   export async function startTrial(userId, targetType, targetId)
   export async function invokeTrial(data)
   ```

#### Frontend - Store (Zustand)

1. **`frontend/src/stores/selection-store.ts`**
   - Estado global de seleção de agentes e SubNúcleos
   - Cálculos de totais
   - Persistência em localStorage

#### Frontend - Componentes

1. **`frontend/src/components/agents/agent-card.tsx`**
   - Card de agente com botões "Teste nossa IA" e "Adicionar ao plano"

2. **`frontend/src/components/agents/agents-grid.tsx`**
   - Grid responsivo de agentes

3. **`frontend/src/components/agents/fibonacci-section.tsx`**
   - Seção de SubNúcleos Fibonacci

4. **`frontend/src/components/agents/subnucleo-card.tsx`**
   - Card de SubNúcleo com botões

5. **`frontend/src/components/agents/selection-summary.tsx`**
   - Resumo de seleção com cálculos
   - Lógica de botão (checkout vs comercial)

6. **`frontend/src/components/trial/trial-modal.tsx`**
   - Modal de teste com chat
   - Contador de tokens e tempo
   - CTAs ao fim do trial

#### Frontend - Páginas

1. **`frontend/src/app/(public)/page.tsx`**
   - Page pública AlquimistaAI
   - Integra todos os componentes

2. **`frontend/src/app/app/billing/checkout/page.tsx`**
   - Tela de checkout (somente agentes)
   - Resumo e botão de pagamento

3. **`frontend/src/app/app/billing/success/page.tsx`**
   - Página de sucesso pós-pagamento

4. **`frontend/src/app/app/billing/cancel/page.tsx`**
   - Página de cancelamento

5. **`frontend/src/app/app/commercial/contact/page.tsx`**
   - Formulário de contato comercial

#### Infraestrutura CDK

1. **Atualizar `lib/alquimista-stack.ts`**
   - Adicionar rotas no API Gateway
   - Configurar Lambdas de billing
   - Variáveis de ambiente (Stripe keys, email config)

2. **Secrets Manager**
   - `/alquimista/dev/stripe/secret-key`
   - `/alquimista/dev/stripe/webhook-secret`
   - `/alquimista/dev/email/smtp-config`

## Ordem de Implementação Recomendada

### Fase 1: Backend Core (Prioridade Alta)
1. ✅ Migrations
2. ✅ Tipos TypeScript
3. ✅ Handler get-agents
4. Handler commercial-contact
5. Handler trial-start
6. Handler trial-invoke

### Fase 2: Frontend Base (Prioridade Alta)
1. Lib clients (agents, commercial, trials)
2. Selection store (Zustand)
3. Componentes de agentes (cards, grid)
4. Page pública

### Fase 3: Billing Integration (Prioridade Média)
1. Handler create-checkout-session
2. Handler webhook-payment
3. Integração com Stripe/Pagar.me
4. Páginas de checkout

### Fase 4: Trials e IA (Prioridade Média)
1. Modal de trial
2. Integração com modelos de IA
3. Lógica de expiração

### Fase 5: Infraestrutura (Prioridade Baixa)
1. Atualizar CDK stack
2. Configurar Secrets Manager
3. Deploy e testes

## Comandos Úteis

```bash
# Executar migration
psql -h localhost -U postgres -d alquimista_dev -f database/migrations/008_create_billing_tables.sql

# Compilar Lambda
cd lambda/platform
npm run build

# Testar localmente
sam local invoke GetAgentsFunction --event events/get-agents.json

# Deploy CDK
cdk deploy AlquimistaStack --context env=dev
```

## Variáveis de Ambiente Necessárias

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# E-mail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@alquimista.ai
SMTP_PASS=...
COMMERCIAL_EMAIL=alquimistafibonacci@gmail.com

# WhatsApp (Opcional)
WHATSAPP_API_URL=...
WHATSAPP_API_TOKEN=...
WHATSAPP_COMMERCIAL_NUMBER=+5584997084444

# Database
DATABASE_HOST=...
DATABASE_NAME=alquimista_dev
DATABASE_USER=...
DATABASE_PASSWORD=...
```

## Próxima Ação

Continuar implementação dos handlers Lambda restantes, começando por `commercial-contact.ts`.
