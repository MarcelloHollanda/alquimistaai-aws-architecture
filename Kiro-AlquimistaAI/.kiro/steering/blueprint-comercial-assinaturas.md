---
inclusion: always
---

# BLUEPRINT · Planos, Assinaturas, Checkout e Comercial

## Visão Geral

Sistema de assinatura e comercialização para o ecossistema AlquimistaAI, incluindo:
- Agentes AlquimistaAI (assinatura direta)
- Fibonacci e SubNúcleos (sob consulta)
- Sistema de testes gratuitos
- Contato comercial integrado

---

## ARQUITETURA DE REFERÊNCIA

### Stack Tecnológico

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
- **Backend**: API Gateway + Lambda + Aurora (Node/TS)
- **Auth**: Amazon Cognito
- **Billing**: Provedor externo (Stripe/Pagar.me) com checkout hospedado
- **Multi-tenant**: Cada empresa = `tenantId`

### Princípios de Segurança

- **NUNCA** armazenar dados de cartão no backend
- Apenas tokens/IDs do gateway de pagamento
- Checkout sempre hospedado pelo provedor

---

## REGRAS DE NEGÓCIO

### 1. Agentes AlquimistaAI (Assinatura Direta)

**Precificação:**
- Cada agente: **R$ 29,90/mês**
- Cliente escolhe quantos agentes quiser
- Cálculo: `totalAlquimistaMes = numeroDeAgentesSelecionados * 29.90`

**Fluxo:**
- Seleção livre de agentes
- Checkout direto (se não houver Fibonacci)
- Pagamento via gateway externo

### 2. Fibonacci e SubNúcleos (Sob Consulta)

**Precificação Base:**
- SubNúcleo: **R$ 365,00/mês**
- **+ Taxa de implementação** (sob consulta)
- **+ Taxa mensal de suporte** (sob consulta)

**IMPORTANTE:**
- **NUNCA** criar checkout automático para Fibonacci/SubNúcleos
- **SEMPRE** direcionar para contato comercial
- Mostrar cálculo indicativo: `baseFibonacciMes = qtdSubnucleosFibonacci * 365.00`
- Exibir texto: "R$ 365,00/mês por SubNúcleo + taxa de implementação e suporte mensal sob consulta"

### 3. Teste Gratuito "Teste nossa IA"

**Disponibilidade:**
- Todo card de Agente AlquimistaAI
- Todo card de SubNúcleo Fibonacci
- Botão "Teste nossa IA"

**Limites:**
- **24 horas** OU **5 tokens de interação** (o que ocorrer primeiro)
- Token = 1 chamada (mensagem/prompt) ao agente/SubNúcleo

**Controle Backend:**
```typescript
interface Trial {
  trialStartAt: Date;
  trialUsageCount: number;
  userId: string;
  targetType: 'agent' | 'subnucleo';
  targetId: string;
}
```

**Mensagem de Bloqueio:**
- "Seu período de teste para esta IA terminou. Assine o agente ou fale com nosso time comercial."

---

## ESTRUTURA DE PÁGINAS

### 1. Page Pública AlquimistaAI

**Rota:** `/` ou `/alquimistaai`

**Componentes:**
- `AgentsGrid` - Grid de Agentes AlquimistaAI
- `FibonacciSection` - Fibonacci e SubNúcleos
- `SelectionSummary` - Resumo de seleção e valores
- `TrialModal` - Modal "Teste nossa IA"
- `CommercialContactEntry` - CTA para contato

#### Grid de Agentes AlquimistaAI

**Dados:** `GET /api/agents`

**Card contém:**
- Nome
- Segmento/Área
- Descrição curta (benefício principal)
- Tags (ex.: Saúde, Educação, Vendas)

**Botões:**
1. **"Teste nossa IA"**
   - Abre modal de teste
   - Chat minimalista com o agente
   - Valida 24h/5 tokens

2. **"Adicionar ao meu plano"**
   - Toggle/checkbox
   - Atualiza estado de seleção

**Texto fixo:**
> "Cada agente AlquimistaAI custa **R$ 29,90/mês**. Monte seu plano escolhendo quantos agentes desejar."

#### Seção Fibonacci & SubNúcleos

**Lista de SubNúcleos:**
- Saúde, Vendas, Cobrança, Educação, etc.

**Card contém:**
- Nome + descrição de escopo
- Texto de preço: "A partir de **R$ 365,00/mês por SubNúcleo** + taxa de implementação e suporte mensal (sob consulta)"

**Botões:**
1. **"Teste nossa IA"** - Trial 24h/5 tokens
2. **"Tenho interesse"** - Marca para contato comercial

#### Resumo de Seleção (SelectionSummary)

**Entrada:**
- Lista de agentes AlquimistaAI selecionados
- Lista de SubNúcleos Fibonacci com interesse

**Cálculo:**
- `totalAlquimistaMes = qtdAgentes * 29.90`
- `baseFibonacciMes = qtdSubnucleosSelected * 365.00` (indicativo)

**Exibição:**
- Subtotal AlquimistaAI
- Base Fibonacci (se houver): "+ taxas de implementação e suporte mensal sob consulta"

**Ações:**
- **SEM SubNúcleo Fibonacci:**
  - Botão: "Continuar para pagamento"
  - Se logado → `/app/billing/checkout`
  - Se não logado → login/registro → redirect

- **COM SubNúcleo Fibonacci:**
  - Botão: "Falar com comercial"
  - Abre tela/modal de contato

---

### 2. Tela/Modal de Contato Comercial

**Rota:** `/app/commercial/contact` (ou modal)

**Campos:**
- Nome da empresa
- CNPJ (opcional)
- Nome do responsável
- E-mail
- WhatsApp
- Resumo (somente leitura):
  - Agentes AlquimistaAI selecionados
  - SubNúcleos Fibonacci selecionados
- Campo texto livre: "Explique sua necessidade, volume de leads/contatos e expectativas com a IA"

**Envio:**

Endpoint: `POST /api/commercial/contact`

**Backend deve:**
1. Enviar e-mail para: `alquimistafibonacci@gmail.com`
2. (Opcional) Disparar WhatsApp para: `+55 84 99708-4444`
3. Registrar em tabela `commercial_requests`:
   - `tenantId` (se logado)
   - payload completo
   - timestamp

**Mensagem de sucesso:**
- "Sua solicitação foi enviada. Nossa equipe comercial entrará em contato por e-mail ou WhatsApp em breve."

---

### 3. Checkout/Pagamento (Somente Agentes)

**Rota:** `/app/billing/checkout` (autenticada)

**Condições de Acesso:**
- ✅ Agentes AlquimistaAI selecionados (≥ 1)
- ❌ **NÃO** há SubNúcleos Fibonacci selecionados

**Se houver SubNúcleo Fibonacci:**
- Não redirecionar para checkout
- Forçar fluxo de contato comercial

#### Conteúdo da Tela

**1. Cabeçalho:**
- Logomarca AlquimistaAI
- Nome da empresa (tenant)
- CNPJ

**2. Resumo do Plano:**
- Lista de agentes selecionados
- Quantidade de agentes
- Texto: "R$ 29,90/mês por agente AlquimistaAI"

**3. Resumo Financeiro:**
- `totalAlquimistaMes = qtdAgentes * 29.90`
- Linha adicional para impostos/taxas (se aplicável)

**4. Botão de Pagamento:**
- "Pagar com cartão de crédito"
- Ao clicar:
  1. Chamar `POST /api/billing/create-checkout-session`
  2. Payload: `tenantId`, lista de agentes, `totalAlquimistaMes`
  3. Backend cria sessão no provedor
  4. Retorna `checkoutUrl`
  5. Frontend: `window.location.href = checkoutUrl`

**5. Páginas Pós-Pagamento:**
- `/app/billing/success` - Sucesso + resumo
- `/app/billing/cancel` - Cancelamento + link para tentar novamente

#### Segurança

**Backend NUNCA deve armazenar:**
- Número de cartão
- CVV
- Validade

**Armazenar apenas:**
- `customerId` (do provedor)
- `subscriptionId`
- Eventos em `payment_events`

---

### 4. Módulo de Teste "Teste nossa IA"

#### API de Teste

**Endpoints:**

1. `POST /api/trials/start`
   - Inicia ou recupera trial para (`userId`, `targetType`, `targetId`)

2. `POST /api/trials/invoke`
   - Payload:
     ```typescript
     {
       userId: string;
       targetType: 'agent' | 'subnucleo';
       targetId: string;
       message: string;
     }
     ```
   - Backend verifica:
     - Trial existe?
     - `now - trialStartAt <= 24h`?
     - `trialUsageCount < 5`?
   - Se OK:
     - Incrementa `trialUsageCount`
     - Encaminha para agente/subnúcleo (modelo IA)
   - Se NÃO OK:
     - Retorna erro: "Período de teste encerrado"

#### UI de Teste

**Modal `TrialModal`:**
- Usado em cards de agentes e SubNúcleos
- Exibe:
  - Nome do agente/SubNúcleo
  - Mini-chat (histórico local)
  - Rodapé: "Teste liberado por 24h ou até 5 interações"

**Fim de Teste:**
- Mostrar CTA:
  - Agentes: "Assine este agente"
  - Fibonacci/SubNúcleo: "Falar com comercial"

---

## ESTRUTURA TÉCNICA

### Frontend

```
src/
├── app/
│   ├── (public)/
│   │   └── page.tsx                    # Page pública AlquimistaAI
│   └── app/
│       ├── billing/
│       │   ├── checkout/
│       │   │   └── page.tsx
│       │   ├── success/
│       │   │   └── page.tsx
│       │   └── cancel/
│       │       └── page.tsx
│       └── commercial/
│           └── contact/
│               └── page.tsx
├── components/
│   ├── agents/
│   │   ├── agents-grid.tsx
│   │   ├── agent-card.tsx
│   │   ├── fibonacci-section.tsx
│   │   ├── subnucleo-card.tsx
│   │   └── selection-summary.tsx
│   └── trial/
│       └── trial-modal.tsx
└── lib/
    ├── agents-client.ts
    ├── billing-client.ts
    ├── commercial-client.ts
    └── trials-client.ts
```

### Backend (Lambda Handlers)

```
lambda/
├── platform/
│   ├── list-agents.ts              # GET /api/agents
│   ├── create-checkout-session.ts  # POST /api/billing/create-checkout-session
│   ├── get-subscription.ts         # GET /api/billing/subscription
│   ├── commercial-contact.ts       # POST /api/commercial/contact
│   ├── trial-start.ts              # POST /api/trials/start
│   └── trial-invoke.ts             # POST /api/trials/invoke
```

---

## ENDPOINTS DA API

### Agentes

```
GET /api/agents
Response: {
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

### Billing

```
POST /api/billing/create-checkout-session
Request: {
  tenantId: string;
  selectedAgents: string[];
  totalAmount: number;
}
Response: {
  checkoutUrl: string;
  sessionId: string;
}

GET /api/billing/subscription
Response: {
  subscriptionId: string;
  status: string;
  agents: string[];
  totalMonthly: number;
}
```

### Comercial

```
POST /api/commercial/contact
Request: {
  companyName: string;
  cnpj?: string;
  contactName: string;
  email: string;
  whatsapp: string;
  selectedAgents: string[];
  selectedSubnucleos: string[];
  message: string;
}
Response: {
  success: boolean;
  message: string;
}
```

### Trials

```
POST /api/trials/start
Request: {
  userId: string;
  targetType: 'agent' | 'subnucleo';
  targetId: string;
}
Response: {
  trialId: string;
  startedAt: string;
  expiresAt: string;
  remainingTokens: number;
}

POST /api/trials/invoke
Request: {
  userId: string;
  targetType: 'agent' | 'subnucleo';
  targetId: string;
  message: string;
}
Response: {
  response: string;
  remainingTokens: number;
  expiresAt: string;
} | {
  error: string;
  message: "Período de teste encerrado";
}
```

---

## SCHEMA DE BANCO DE DADOS

### Tabela: `commercial_requests`

```sql
CREATE TABLE commercial_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  company_name VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18),
  contact_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(20) NOT NULL,
  selected_agents JSONB,
  selected_subnucleos JSONB,
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'pending'
);
```

### Tabela: `trials`

```sql
CREATE TABLE trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  target_type VARCHAR(20) NOT NULL, -- 'agent' | 'subnucleo'
  target_id UUID NOT NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  usage_count INTEGER DEFAULT 0,
  max_usage INTEGER DEFAULT 5,
  expires_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active',
  UNIQUE(user_id, target_type, target_id)
);
```

### Tabela: `payment_events`

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
```

---

## FLUXOS DE USUÁRIO

### Fluxo 1: Assinatura de Agentes (Sem Fibonacci)

1. Usuário acessa page pública
2. Seleciona agentes AlquimistaAI
3. Clica "Continuar para pagamento"
4. Se não logado: login/registro
5. Redireciona para `/app/billing/checkout`
6. Revisa seleção e total
7. Clica "Pagar com cartão"
8. Redireciona para checkout do provedor
9. Completa pagamento
10. Retorna para `/app/billing/success`

### Fluxo 2: Interesse em Fibonacci (Com ou Sem Agentes)

1. Usuário acessa page pública
2. Seleciona SubNúcleos Fibonacci (e opcionalmente agentes)
3. Clica "Falar com comercial"
4. Preenche formulário de contato
5. Envia solicitação
6. Recebe confirmação
7. Aguarda contato da equipe comercial

### Fluxo 3: Teste Gratuito

1. Usuário clica "Teste nossa IA" em qualquer card
2. Modal abre com chat
3. Usuário interage (até 5 mensagens ou 24h)
4. Ao atingir limite:
   - Agente: CTA "Assine este agente"
   - SubNúcleo: CTA "Falar com comercial"

---

## CHECKLIST DE IMPLEMENTAÇÃO

### Frontend

- [ ] Page pública AlquimistaAI (`/`)
- [ ] Componente `AgentsGrid`
- [ ] Componente `FibonacciSection`
- [ ] Componente `SelectionSummary`
- [ ] Componente `TrialModal`
- [ ] Page de checkout (`/app/billing/checkout`)
- [ ] Page de sucesso (`/app/billing/success`)
- [ ] Page de cancelamento (`/app/billing/cancel`)
- [ ] Page/Modal de contato comercial
- [ ] Clients HTTP (agents, billing, commercial, trials)
- [ ] Estado global de seleção (Zustand/Context)

### Backend

- [ ] Handler `GET /api/agents`
- [ ] Handler `POST /api/billing/create-checkout-session`
- [ ] Handler `GET /api/billing/subscription`
- [ ] Handler `POST /api/commercial/contact`
- [ ] Handler `POST /api/trials/start`
- [ ] Handler `POST /api/trials/invoke`
- [ ] Integração com gateway de pagamento
- [ ] Envio de e-mail comercial
- [ ] (Opcional) Integração WhatsApp
- [ ] Migrations de banco de dados

### Infraestrutura

- [ ] Adicionar rotas no API Gateway
- [ ] Configurar variáveis de ambiente
- [ ] Secrets Manager para credenciais do gateway
- [ ] Secrets Manager para credenciais de e-mail
- [ ] Configurar webhooks do gateway de pagamento

---

## OBSERVAÇÕES IMPORTANTES

1. **Nunca** criar checkout automático para Fibonacci/SubNúcleos
2. **Sempre** validar limites de trial no backend
3. **Nunca** armazenar dados de cartão
4. **Sempre** usar checkout hospedado pelo provedor
5. **Documentar** todas as integrações externas
6. **Testar** fluxos completos em ambiente dev
7. **Monitorar** eventos de pagamento e trials

---

## CONTATOS COMERCIAIS

- **E-mail**: alquimistafibonacci@gmail.com
- **WhatsApp**: +55 84 99708-4444

---

Este blueprint deve ser seguido rigorosamente ao implementar funcionalidades relacionadas a planos, assinaturas, checkout e contato comercial no sistema AlquimistaAI.
