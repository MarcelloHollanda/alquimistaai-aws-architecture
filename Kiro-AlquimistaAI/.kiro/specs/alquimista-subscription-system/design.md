   
             ┌───────────────┐
                │ Tem SubNúcleo?│
                └───────┬───────┘
                        │
            ┌───────────┴───────────┐
            │                       │
         NÃO│                       │SIM
            ▼                       ▼
    ┌──────────────┐        ┌──────────────┐
    │   Checkout   │        │   Contato    │
    │    Direto    │        │  Comercial   │
    └──────────────┘        └──────────────┘
            │                       │
            ▼                       ▼
    ┌──────────────┐        ┌──────────────┐
    │   Gateway    │        │    E-mail    │
    │  Pagamento   │        │   Comercial  │
    └──────────────┘        └──────────────┘
```

### Camadas da Aplicação

**Frontend (Next.js 14 + TypeScript)**
- Páginas públicas e autenticadas
- Componentes reutilizáveis (shadcn/ui)
- Estado global (Zustand)
- Clients HTTP para APIs

**Backend (Lambda + Node.js)**
- Handlers REST para cada endpoint
- Validação de entrada
- Lógica de negócio
- Integração com gateway de pagamento

**Dados (Aurora PostgreSQL)**
- Schema multi-tenant
- Tabelas de trials, commercial_requests, payment_events
- Índices para performance

## Componentes e Interfaces

### Frontend - Estrutura de Páginas

#### 1. Page AlquimistaAI (Pública)
**Rota:** `/` ou `/alquimistaai`
**Layout:** Página pública sem autenticação

**Componentes:**
```typescript
<AlquimistaPage>
  <Hero />
  <AgentsGridBilling />
  <FibonacciSection />
  <SelectionSummary />
</AlquimistaPage>
```

#### 2. Página de Checkout
**Rota:** `/app/billing/checkout`
**Layout:** Dashboard autenticado
**Proteção:** Requer autenticação

**Componentes:**
```typescript
<CheckoutPage>
  <CheckoutHeader />
  <SelectedAgentsList />
  <PricingSummary />
  <PaymentButton />
</CheckoutPage>
```

#### 3. Página de Contato Comercial
**Rota:** `/app/commercial/contact`
**Layout:** Dashboard autenticado ou modal

**Componentes:**
```typescript
<CommercialContactPage>
  <ContactForm />
  <SelectionSummary readonly />
  <SubmitButton />
</CommercialContactPage>
```

#### 4. Páginas de Retorno
**Rotas:** 
- `/app/billing/success`
- `/app/billing/cancel`

### Frontend - Componentes Principais

#### AgentsGridBilling
```typescript
interface AgentsGridBillingProps {
  agents: Agent[];
  selectedAgentIds: string[];
  onToggleAgent: (agentId: string) => void;
  onTestAgent: (agentId: string) => void;
}
```

**Responsabilidades:**
- Renderizar grid responsivo de cards de agentes
- Gerenciar estado de seleção visual
- Disparar callbacks para ações

#### AgentCardBilling
```typescript
interface AgentCardBillingProps {
  agent: Agent;
  isSelected: boolean;
  onToggle: () => void;
  onTest: () => void;
}
```

**Elementos:**
- Nome e descrição do agente
- Tags de segmento
- Botão "Teste nossa IA"
- Checkbox/toggle "Adicionar ao meu plano"
- Indicador visual de seleção

#### FibonacciSection
```typescript
interface FibonacciSectionProps {
  subnucleos: Subnucleo[];
  selectedSubnucleoIds: string[];
  onToggleInterest: (subnucleoId: string) => void;
  onTestSubnucleo: (subnucleoId: string) => void;
}
```

**Responsabilidades:**
- Exibir cards de SubNúcleos
- Mostrar preço base + texto de consulta
- Gerenciar interesse em SubNúcleos

#### SubnucleoCard
```typescript
interface SubnucleoCardProps {
  subnucleo: Subnucleo;
  hasInterest: boolean;
  onToggleInterest: () => void;
  onTest: () => void;
}
```

**Elementos:**
- Nome e descrição do SubNúcleo
- Texto de preço: "A partir de R$ 365,00/mês + taxas sob consulta"
- Botão "Teste nossa IA"
- Botão "Tenho interesse"

#### SelectionSummary
```typescript
interface SelectionSummaryProps {
  selectedAgents: Agent[];
  selectedSubnucleos: Subnucleo[];
  readonly?: boolean;
}
```

**Cálculos:**
```typescript
const totalAgentes = selectedAgents.length * 29.90;
const baseSubnucleos = selectedSubnucleos.length * 365.00;
```

**Lógica de Ação:**
- Se `selectedSubnucleos.length > 0`: Botão "Falar com comercial"
- Se `selectedSubnucleos.length === 0 && selectedAgents.length > 0`: Botão "Continuar para pagamento"
- Caso contrário: Botão desabilitado

#### TrialModal
```typescript
interface TrialModalProps {
  targetType: 'agent' | 'subnucleo';
  targetId: string;
  targetName: string;
  onClose: () => void;
}
```

**Estado Interno:**
```typescript
interface TrialState {
  messages: Message[];
  remainingTokens: number;
  expiresAt: string;
  isExpired: boolean;
  isLoading: boolean;
}
```

**Fluxo:**
1. Ao abrir: chamar `POST /api/trials/start`
2. Ao enviar mensagem: chamar `POST /api/trials/invoke`
3. Exibir contador de tokens restantes
4. Ao expirar: mostrar CTA apropriado

### Frontend - Estado Global

#### Selection Store (Zustand)
```typescript
interface SelectionStore {
  selectedAgentIds: string[];
  selectedSubnucleoIds: string[];
  
  toggleAgent: (agentId: string) => void;
  toggleSubnucleo: (subnucleoId: string) => void;
  clearSelection: () => void;
  
  getSelectedAgents: (agents: Agent[]) => Agent[];
  getSelectedSubnucleos: (subnucleos: Subnucleo[]) => Subnucleo[];
  getTotalAgentes: () => number;
  getBaseSubnucleos: () => number;
}
```

**Implementação:**
- Não persistir em localStorage (estado efêmero)
- Limpar ao completar checkout ou contato comercial
- Manter durante navegação na sessão

### Frontend - API Clients

#### agents-client.ts
```typescript
export async function getAgents(): Promise<Agent[]> {
  const response = await fetch(`${API_BASE_URL}/api/agents`);
  if (!response.ok) throw new Error('Failed to fetch agents');
  return response.json();
}
```

#### trials-client.ts
```typescript
export async function startTrial(
  userId: string,
  targetType: 'agent' | 'subnucleo',
  targetId: string
): Promise<TrialResponse> {
  // POST /api/trials/start
}

export async function invokeTrial(
  userId: string,
  targetType: 'agent' | 'subnucleo',
  targetId: string,
  message: string
): Promise<TrialInvokeResponse> {
  // POST /api/trials/invoke
}
```

#### billing-client.ts
```typescript
export async function createCheckoutSession(
  tenantId: string,
  selectedAgents: string[],
  totalAmount: number
): Promise<CheckoutSessionResponse> {
  // POST /api/billing/create-checkout-session
}

export async function getSubscription(
  tenantId: string
): Promise<SubscriptionResponse> {
  // GET /api/billing/subscription
}
```

#### commercial-client.ts
```typescript
export async function submitCommercialContact(
  data: CommercialContactRequest
): Promise<CommercialContactResponse> {
  // POST /api/commercial/contact
}
```

## Data Models

### Frontend Types

```typescript
interface Agent {
  id: string;
  name: string;
  segment: string;
  description: string;
  tags: string[];
  priceMonthly: number; // 29.90
}

interface Subnucleo {
  id: string;
  name: string;
  description: string;
  scope: string;
  basePriceMonthly: number; // 365.00
}

interface Trial {
  id: string;
  userId: string;
  targetType: 'agent' | 'subnucleo';
  targetId: string;
  startedAt: string;
  expiresAt: string;
  usageCount: number;
  maxUsage: number;
  status: 'active' | 'expired';
}

interface CommercialContactRequest {
  companyName: string;
  cnpj?: string;
  contactName: string;
  email: string;
  whatsapp: string;
  selectedAgents: string[];
  selectedSubnucleos: string[];
  message: string;
}
```

### Database Schema

#### Tabela: trials
```sql
CREATE TABLE trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('agent', 'subnucleo')),
  target_id UUID NOT NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  usage_count INTEGER DEFAULT 0,
  max_usage INTEGER DEFAULT 5,
  expires_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);

CREATE INDEX idx_trials_user_target ON trials(user_id, target_type, target_id);
CREATE INDEX idx_trials_status ON trials(status);
```

#### Tabela: commercial_requests
```sql
CREATE TABLE commercial_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  company_name VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18),
  contact_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(20) NOT NULL,
  selected_agents JSONB DEFAULT '[]',
  selected_subnucleos JSONB DEFAULT '[]',
  message TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'closed')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_commercial_requests_tenant ON commercial_requests(tenant_id);
CREATE INDEX idx_commercial_requests_status ON commercial_requests(status);
CREATE INDEX idx_commercial_requests_created ON commercial_requests(created_at DESC);
```

#### Tabela: payment_events
```sql
CREATE TABLE payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  event_type VARCHAR(50) NOT NULL,
  provider_customer_id VARCHAR(255),
  provider_subscription_id VARCHAR(255),
  amount DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'BRL',
  status VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payment_events_tenant ON payment_events(tenant_id);
CREATE INDEX idx_payment_events_subscription ON payment_events(provider_subscription_id);
CREATE INDEX idx_payment_events_created ON payment_events(created_at DESC);
```

## Backend - API Endpoints

### GET /api/agents
**Descrição:** Retorna lista de todos os agentes AlquimistaAI disponíveis

**Response:**
```typescript
{
  agents: Array<{
    id: string;
    name: string;
    segment: string;
    description: string;
    tags: string[];
    priceMonthly: 29.90;
  }>
}
```

**Handler:** `lambda/platform/list-agents.ts`

**Lógica:**
1. Buscar agentes ativos do banco
2. Formatar resposta
3. Retornar array

### POST /api/trials/start
**Descrição:** Inicia ou recupera trial existente

**Request:**
```typescript
{
  userId: string;
  targetType: 'agent' | 'subnucleo';
  targetId: string;
}
```

**Response:**
```typescript
{
  trialId: string;
  startedAt: string;
  expiresAt: string;
  remainingTokens: number;
}
```

**Handler:** `lambda/platform/trial-start.ts`

**Lógica:**
1. Verificar se trial já existe (userId + targetType + targetId)
2. Se existe e está ativo: retornar dados existentes
3. Se não existe: criar novo trial
4. Calcular expiresAt = startedAt + 24h
5. Retornar dados do trial

### POST /api/trials/invoke
**Descrição:** Processa mensagem de teste e valida limites

**Request:**
```typescript
{
  userId: string;
  targetType: 'agent' | 'subnucleo';
  targetId: string;
  message: string;
}
```

**Response (Sucesso):**
```typescript
{
  response: string;
  remainingTokens: number;
  expiresAt: string;
}
```

**Response (Expirado):**
```typescript
{
  error: 'trial_expired';
  message: 'Período de teste encerrado';
}
```

**Handler:** `lambda/platform/trial-invoke.ts`

**Lógica:**
1. Buscar trial do banco
2. Validar: `now - startedAt <= 24h`
3. Validar: `usageCount < 5`
4. Se falhar: retornar erro 403
5. Incrementar `usageCount`
6. Processar mensagem com agente/SubNúcleo
7. Retornar resposta + tokens restantes

### POST /api/billing/create-checkout-session
**Descrição:** Cria sessão de checkout no gateway de pagamento

**Request:**
```typescript
{
  tenantId: string;
  selectedAgents: string[];
  totalAmount: number;
}
```

**Response:**
```typescript
{
  checkoutUrl: string;
  sessionId: string;
}
```

**Handler:** `lambda/platform/create-checkout-session.ts`

**Lógica:**
1. Validar que não há SubNúcleos (regra de negócio)
2. Validar totalAmount = selectedAgents.length * 29.90
3. Criar customer no gateway (se não existe)
4. Criar checkout session no gateway
5. Registrar evento em payment_events
6. Retornar checkoutUrl

**Integração Gateway:**
```typescript
// Exemplo com Stripe
const session = await stripe.checkout.sessions.create({
  customer: customerId,
  mode: 'subscription',
  line_items: [{
    price_data: {
      currency: 'brl',
      product_data: {
        name: 'Agentes AlquimistaAI',
        description: `${selectedAgents.length} agentes selecionados`
      },
      unit_amount: 2990, // R$ 29,90 em centavos
      recurring: { interval: 'month' }
    },
    quantity: selectedAgents.length
  }],
  success_url: `${FRONTEND_URL}/app/billing/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${FRONTEND_URL}/app/billing/cancel`
});
```

### POST /api/commercial/contact
**Descrição:** Processa solicitação de contato comercial

**Request:**
```typescript
{
  companyName: string;
  cnpj?: string;
  contactName: string;
  email: string;
  whatsapp: string;
  selectedAgents: string[];
  selectedSubnucleos: string[];
  message: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

**Handler:** `lambda/platform/commercial-contact.ts`

**Lógica:**
1. Validar campos obrigatórios
2. Inserir em commercial_requests
3. Enviar e-mail para alquimistafibonacci@gmail.com
4. (Opcional) Disparar WhatsApp via API
5. Retornar sucesso

**Template de E-mail:**
```
Assunto: Nova Solicitação Comercial - AlquimistaAI

Empresa: {companyName}
CNPJ: {cnpj}
Responsável: {contactName}
E-mail: {email}
WhatsApp: {whatsapp}

Agentes AlquimistaAI Selecionados:
- {agent1.name}
- {agent2.name}
Total: {count} agentes × R$ 29,90 = R$ {total}

SubNúcleos Fibonacci Selecionados:
- {subnucleo1.name}
- {subnucleo2.name}
Base: {count} SubNúcleos × R$ 365,00 = R$ {base}
+ Taxa de implementação (sob consulta)
+ Suporte mensal (sob consulta)

Mensagem do Cliente:
{message}
```

### POST /api/billing/webhook
**Descrição:** Recebe webhooks do gateway de pagamento

**Handler:** `lambda/platform/webhook-payment.ts`

**Eventos Tratados:**
- `checkout.session.completed`: Pagamento confirmado
- `customer.subscription.created`: Assinatura criada
- `customer.subscription.updated`: Assinatura atualizada
- `customer.subscription.deleted`: Assinatura cancelada

**Lógica:**
1. Validar assinatura do webhook
2. Registrar evento em payment_events
3. Atualizar status da assinatura no banco
4. Ativar agentes para o tenant

## Error Handling

### Frontend Error Handling

**Estratégias:**
- Toast notifications para erros de API
- Fallback UI para falhas de carregamento
- Retry automático para falhas de rede
- Mensagens amigáveis ao usuário

**Exemplo:**
```typescript
try {
  const agents = await getAgents();
  setAgents(agents);
} catch (error) {
  toast({
    title: 'Erro ao carregar agentes',
    description: 'Tente novamente em alguns instantes',
    variant: 'destructive'
  });
  setError(error);
}
```

### Backend Error Handling

**Códigos de Status:**
- `200`: Sucesso
- `400`: Validação falhou
- `401`: Não autenticado
- `403`: Trial expirado / Sem permissão
- `404`: Recurso não encontrado
- `500`: Erro interno

**Estrutura de Erro:**
```typescript
{
  error: string; // Código do erro
  message: string; // Mensagem amigável
  details?: any; // Detalhes adicionais
}
```

## Testing Strategy

### Frontend Testing

**Unit Tests:**
- Componentes isolados (AgentCard, SelectionSummary)
- Funções de cálculo (preços, validações)
- Store actions e selectors

**Integration Tests:**
- Fluxo completo de seleção
- Navegação entre páginas
- Integração com API clients

**E2E Tests:**
- Fluxo de checkout completo
- Fluxo de contato comercial
- Sistema de trials

### Backend Testing

**Unit Tests:**
- Validação de limites de trial
- Cálculos de preço
- Formatação de e-mails

**Integration Tests:**
- Endpoints completos
- Integração com banco de dados
- Integração com gateway de pagamento (mock)

### Test Data

**Agentes de Teste:**
```typescript
const mockAgents = [
  { id: '1', name: 'Atendimento AI', segment: 'Atendimento', priceMonthly: 29.90 },
  { id: '2', name: 'Vendas AI', segment: 'Vendas', priceMonthly: 29.90 }
];
```

**SubNúcleos de Teste:**
```typescript
const mockSubnucleos = [
  { id: '1', name: 'Saúde', basePriceMonthly: 365.00 },
  { id: '2', name: 'Educação', basePriceMonthly: 365.00 }
];
```

## Security Considerations

### Dados Sensíveis

**NUNCA armazenar:**
- Número de cartão de crédito
- CVV
- Data de validade

**Armazenar apenas:**
- `customerId` do gateway
- `subscriptionId` do gateway
- Tokens de sessão (temporários)

### Validação de Trials

**Backend DEVE:**
- Validar limites no servidor (nunca confiar no frontend)
- Usar transações para incrementar contadores
- Prevenir race conditions

**Exemplo:**
```sql
UPDATE trials 
SET usage_count = usage_count + 1, updated_at = NOW()
WHERE id = $1 AND usage_count < max_usage
RETURNING *;
```

### Rate Limiting

**Endpoints Protegidos:**
- `/api/trials/invoke`: 10 req/min por usuário
- `/api/commercial/contact`: 3 req/hora por IP
- `/api/billing/create-checkout-session`: 5 req/min por tenant

## Performance Optimization

### Frontend

**Code Splitting:**
- Lazy load TrialModal
- Lazy load checkout page
- Separate bundle para billing

**Caching:**
- Cache lista de agentes (5 minutos)
- Prefetch dados ao hover em cards

**Otimizações:**
- Virtual scrolling para grids grandes
- Debounce em buscas
- Optimistic updates

### Backend

**Database:**
- Índices em colunas de busca frequente
- Connection pooling
- Query optimization

**API:**
- Response caching (CloudFront)
- Compression (gzip)
- Pagination para listas grandes

## Deployment Considerations

### Environment Variables

**Frontend:**
```
NEXT_PUBLIC_API_BASE_URL=https://api.alquimista.ai
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_...
```

**Backend:**
```
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
COMMERCIAL_EMAIL=alquimistafibonacci@gmail.com
WHATSAPP_API_KEY=...
```

### Migration Strategy

1. Deploy backend com novos endpoints
2. Executar migrations de banco
3. Deploy frontend com feature flag
4. Testar em staging
5. Habilitar feature flag em produção
6. Monitorar métricas

### Rollback Plan

- Feature flags para desabilitar rapidamente
- Manter endpoints antigos por 30 dias
- Backup de banco antes de migrations
- Documentar procedimento de rollback

## Monitoring and Observability

### Métricas de Negócio

- Taxa de conversão (teste → assinatura)
- Agentes mais testados
- Taxa de abandono no checkout
- Tempo médio de resposta comercial

### Métricas Técnicas

- Latência de APIs
- Taxa de erro por endpoint
- Uso de trials (24h vs 5 tokens)
- Performance do gateway de pagamento

### Alertas

- Trial invoke falhando > 5%
- Checkout session creation falhando
- E-mails comerciais não enviados
- Webhooks de pagamento falhando

## Diagramas

### Fluxo de Checkout Direto

```
Usuário → Seleciona Agentes → Clica "Continuar"
   ↓
Login (se necessário)
   ↓
Página Checkout → Revisa Seleção
   ↓
Clica "Pagar" → Backend cria sessão
   ↓
Redireciona para Gateway
   ↓
Usuário paga → Gateway processa
   ↓
Webhook → Backend ativa agentes
   ↓
Redireciona para Success
```

### Fluxo de Contato Comercial

```
Usuário → Seleciona SubNúcleos → Clica "Falar com comercial"
   ↓
Preenche Formulário
   ↓
Envia → Backend registra
   ↓
E-mail enviado para comercial
   ↓
WhatsApp disparado (opcional)
   ↓
Mensagem de confirmação
```

### Fluxo de Trial

```
Usuário → Clica "Teste nossa IA"
   ↓
Modal abre → POST /trials/start
   ↓
Backend cria/recupera trial
   ↓
Usuário envia mensagem → POST /trials/invoke
   ↓
Backend valida limites
   ↓
   ├─ OK: Processa e retorna resposta
   └─ Expirado: Retorna erro + CTA
```

## Conclusão

Este design fornece uma arquitetura completa e escalável para o sistema de assinatura AlquimistaAI, com separação clara de responsabilidades, validações robustas e integração segura com gateway de pagamento. A implementação seguirá os padrões estabelecidos no projeto, utilizando Next.js 14, shadcn/ui, e Lambda functions na AWS.
