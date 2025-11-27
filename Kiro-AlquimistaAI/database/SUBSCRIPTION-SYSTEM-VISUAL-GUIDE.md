# 📊 Guia Visual: Sistema de Assinatura - Database

## 🗺️ Visão Geral do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    SISTEMA DE ASSINATURA                        │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Agentes    │  │  SubNúcleos  │  │    Trials    │        │
│  │ AlquimistaAI │  │   Fibonacci  │  │  (24h/5tok)  │        │
│  │  R$ 29,90/mês│  │ R$ 365,00/mês│  │              │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│         │                  │                  │                │
│         └──────────────────┴──────────────────┘                │
│                            │                                    │
│              ┌─────────────┴─────────────┐                    │
│              │                           │                    │
│      ┌───────▼────────┐         ┌───────▼────────┐          │
│      │    Checkout    │         │    Contato     │          │
│      │     Direto     │         │   Comercial    │          │
│      └───────┬────────┘         └───────┬────────┘          │
│              │                           │                    │
│      ┌───────▼────────┐         ┌───────▼────────┐          │
│      │    Gateway     │         │     E-mail     │          │
│      │   Pagamento    │         │   Comercial    │          │
│      └────────────────┘         └────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## 📋 Diagrama de Tabelas

### Tabela: trials

```
┌─────────────────────────────────────────────────────────┐
│                        TRIALS                           │
├─────────────────────────────────────────────────────────┤
│ id                UUID (PK)                             │
│ user_id           UUID (FK → users)                     │
│ target_type       VARCHAR(20) ['agent', 'subnucleo']   │
│ target_id         UUID (FK → agents/subnucleos)        │
│ started_at        TIMESTAMP                             │
│ usage_count       INTEGER (0-5)                         │
│ max_usage         INTEGER (default: 5)                  │
│ expires_at        TIMESTAMP (started_at + 24h)          │
│ status            VARCHAR(20) ['active', 'expired']     │
│ created_at        TIMESTAMP                             │
│ updated_at        TIMESTAMP                             │
├─────────────────────────────────────────────────────────┤
│ UNIQUE (user_id, target_type, target_id)               │
│ INDEX (user_id, target_type, target_id)                │
│ INDEX (status)                                          │
│ INDEX (expires_at) WHERE status = 'active'              │
└─────────────────────────────────────────────────────────┘
```

**Regras de Negócio:**
- ✅ Um usuário pode ter apenas 1 trial por target
- ✅ Trial expira após 24h OU 5 tokens (o que ocorrer primeiro)
- ✅ Status muda para 'expired' automaticamente

### Tabela: commercial_requests

```
┌─────────────────────────────────────────────────────────┐
│                 COMMERCIAL_REQUESTS                     │
├─────────────────────────────────────────────────────────┤
│ id                  UUID (PK)                           │
│ tenant_id           UUID (FK → tenants, nullable)       │
│ company_name        VARCHAR(255)                        │
│ cnpj                VARCHAR(18) (opcional)              │
│ contact_name        VARCHAR(255)                        │
│ email               VARCHAR(255)                        │
│ whatsapp            VARCHAR(20)                         │
│ selected_agents     JSONB (array de IDs)               │
│ selected_subnucleos JSONB (array de IDs)               │
│ message             TEXT                                │
│ status              VARCHAR(50)                         │
│                     ['pending', 'contacted',            │
│                      'proposal_sent', 'closed']         │
│ created_at          TIMESTAMP                           │
│ updated_at          TIMESTAMP                           │
├─────────────────────────────────────────────────────────┤
│ INDEX (tenant_id)                                       │
│ INDEX (status)                                          │
│ INDEX (created_at DESC)                                 │
│ INDEX (email)                                           │
└─────────────────────────────────────────────────────────┘
```

**Regras de Negócio:**
- ✅ tenant_id pode ser NULL (usuário não autenticado)
- ✅ Deve ter pelo menos 1 SubNúcleo selecionado
- ✅ E-mail enviado automaticamente para comercial

### Tabela: payment_events

```
┌─────────────────────────────────────────────────────────┐
│                   PAYMENT_EVENTS                        │
├─────────────────────────────────────────────────────────┤
│ id                       UUID (PK)                      │
│ tenant_id                UUID (FK → tenants)            │
│ event_type               VARCHAR(50)                    │
│ provider_customer_id     VARCHAR(255)                   │
│ provider_subscription_id VARCHAR(255)                   │
│ provider_session_id      VARCHAR(255)                   │
│ amount                   DECIMAL(10, 2)                 │
│ currency                 VARCHAR(3) (default: 'BRL')    │
│ status                   VARCHAR(50)                    │
│ metadata                 JSONB                          │
│ created_at               TIMESTAMP                      │
├─────────────────────────────────────────────────────────┤
│ INDEX (tenant_id)                                       │
│ INDEX (provider_subscription_id)                        │
│ INDEX (provider_session_id)                             │
│ INDEX (created_at DESC)                                 │
│ INDEX (event_type)                                      │
└─────────────────────────────────────────────────────────┘
```

**Eventos Comuns:**
- `checkout.session.completed` - Pagamento confirmado
- `subscription.created` - Assinatura criada
- `subscription.updated` - Assinatura atualizada
- `subscription.deleted` - Assinatura cancelada

## 🔄 Fluxos de Dados

### Fluxo 1: Trial de Agente

```
┌─────────┐
│ Usuário │
└────┬────┘
     │ 1. Clica "Teste nossa IA"
     ▼
┌─────────────────┐
│ POST /trials/   │
│     start       │
└────┬────────────┘
     │ 2. Cria registro
     ▼
┌─────────────────┐
│  trials table   │
│  status: active │
│  usage_count: 0 │
│  expires_at: +24h│
└────┬────────────┘
     │ 3. Retorna trial_id
     ▼
┌─────────┐
│ Usuário │ 4. Envia mensagens
└────┬────┘
     │ 5. POST /trials/invoke
     ▼
┌─────────────────┐
│  Valida limites │
│  - tempo < 24h? │
│  - tokens < 5?  │
└────┬────────────┘
     │ 6. Incrementa usage_count
     ▼
┌─────────────────┐
│  trials table   │
│  usage_count++  │
└────┬────────────┘
     │ 7. Processa com IA
     ▼
┌─────────┐
│ Resposta│
└─────────┘
```

### Fluxo 2: Checkout Direto (Só Agentes)

```
┌─────────┐
│ Usuário │ Seleciona 3 agentes
└────┬────┘
     │ Total: 3 × R$ 29,90 = R$ 89,70
     ▼
┌─────────────────┐
│ Clica "Pagar"   │
└────┬────────────┘
     │ POST /billing/create-checkout-session
     ▼
┌─────────────────┐
│ Backend valida  │
│ - Sem SubNúcleos│
│ - Cálculo correto│
└────┬────────────┘
     │ Cria sessão no Stripe
     ▼
┌─────────────────┐
│ Gateway Stripe  │
│ checkout_url    │
└────┬────────────┘
     │ Redireciona
     ▼
┌─────────┐
│ Usuário │ Paga no Stripe
└────┬────┘
     │ Webhook
     ▼
┌─────────────────┐
│ POST /webhook   │
└────┬────────────┘
     │ Registra evento
     ▼
┌─────────────────┐
│ payment_events  │
│ event_type:     │
│ checkout.       │
│ session.        │
│ completed       │
└────┬────────────┘
     │ Ativa agentes
     ▼
┌─────────┐
│ Success │
└─────────┘
```

### Fluxo 3: Contato Comercial (Com SubNúcleos)

```
┌─────────┐
│ Usuário │ Seleciona 2 agentes + 1 SubNúcleo
└────┬────┘
     │ Indicativo: 2×29,90 + 1×365,00 = R$ 424,80 base
     ▼
┌─────────────────┐
│ Clica "Falar    │
│ com comercial"  │
└────┬────────────┘
     │ Preenche formulário
     ▼
┌─────────────────┐
│ POST /commercial│
│     /contact    │
└────┬────────────┘
     │ Valida dados
     ▼
┌─────────────────┐
│ commercial_     │
│ requests table  │
│ status: pending │
└────┬────────────┘
     │ Envia e-mail
     ▼
┌─────────────────┐
│ alquimista      │
│ fibonacci@      │
│ gmail.com       │
└────┬────────────┘
     │ Time comercial responde
     ▼
┌─────────┐
│ Proposta│
│ Enviada │
└─────────┘
```

## 📊 Modelo de Dados - Agentes

```
┌────────────────────────────────────────────────────────┐
│                      AGENTS                            │
├────────────────────────────────────────────────────────┤
│ Segmento: Atendimento (1 agente)                      │
│   • Atendimento AI                                     │
│                                                        │
│ Segmento: Vendas (2 agentes)                          │
│   • Vendas AI                                          │
│   • Qualificação de Leads AI                          │
│                                                        │
│ Segmento: Marketing (4 agentes)                       │
│   • Social Media AI                                    │
│   • E-mail Marketing AI                                │
│   • SEO AI                                             │
│   • Criação de Conteúdo AI                            │
│                                                        │
│ Segmento: Suporte (1 agente)                          │
│   • Suporte Técnico AI                                 │
│                                                        │
│ Segmento: Análise (2 agentes)                         │
│   • Análise de Sentimento AI                          │
│   • Relatórios AI                                      │
│                                                        │
│ Segmento: Produtividade (1 agente)                    │
│   • Agendamento AI                                     │
│                                                        │
│ Segmento: Financeiro (1 agente)                       │
│   • Cobrança AI                                        │
│                                                        │
│ TOTAL: 12 agentes × R$ 29,90 = R$ 358,80/mês         │
└────────────────────────────────────────────────────────┘
```

## 📊 Modelo de Dados - SubNúcleos

```
┌────────────────────────────────────────────────────────┐
│                    SUBNUCLEOS                          │
├────────────────────────────────────────────────────────┤
│ 1. Saúde          - Clínicas e hospitais              │
│ 2. Educação       - Instituições de ensino            │
│ 3. Vendas B2B     - Vendas corporativas               │
│ 4. Cobrança       - Recuperação de crédito            │
│ 5. Imobiliário    - Imobiliárias                      │
│ 6. Jurídico       - Escritórios de advocacia          │
│ 7. Varejo         - Lojas e e-commerce                │
│ 8. Serviços       - Empresas de serviços              │
│                                                        │
│ TOTAL: 8 SubNúcleos × R$ 365,00 = R$ 2.920,00/mês    │
│        + Taxas de implementação (sob consulta)        │
│        + Suporte mensal (sob consulta)                │
└────────────────────────────────────────────────────────┘
```

## 🎯 Exemplos de Uso

### Exemplo 1: Cliente Pequeno (Só Agentes)

```
Seleção:
  ✓ Atendimento AI      R$ 29,90
  ✓ Vendas AI           R$ 29,90
  ✓ Social Media AI     R$ 29,90
  ─────────────────────────────
  Total:                R$ 89,70/mês

Fluxo: Checkout Direto → Stripe → Ativação Imediata
```

### Exemplo 2: Cliente Médio (Agentes + SubNúcleo)

```
Seleção:
  ✓ Atendimento AI      R$ 29,90
  ✓ Vendas AI           R$ 29,90
  ✓ Cobrança AI         R$ 29,90
  ✓ SubNúcleo Saúde     R$ 365,00 (base)
  ─────────────────────────────
  Base:                 R$ 454,70/mês
  + Taxa implementação  (sob consulta)
  + Suporte mensal      (sob consulta)

Fluxo: Contato Comercial → Proposta → Negociação → Contrato
```

### Exemplo 3: Cliente Enterprise (Múltiplos SubNúcleos)

```
Seleção:
  ✓ 8 agentes diversos  R$ 239,20
  ✓ SubNúcleo Saúde     R$ 365,00
  ✓ SubNúcleo Educação  R$ 365,00
  ✓ SubNúcleo Vendas    R$ 365,00
  ─────────────────────────────
  Base:                 R$ 1.334,20/mês
  + Implementação       (sob consulta)
  + Suporte Premium     (sob consulta)
  + SLA Dedicado        (sob consulta)

Fluxo: Contato Comercial → Proposta Customizada → Contrato Enterprise
```

## 📈 Métricas e KPIs

### Métricas de Trial

```sql
-- Taxa de conversão de trials
SELECT 
  ROUND(
    COUNT(CASE WHEN usage_count >= 3 THEN 1 END)::numeric / 
    COUNT(*)::numeric * 100, 
    2
  ) as engagement_rate_pct
FROM trials
WHERE status = 'expired';

-- Tempo médio de uso
SELECT 
  AVG(EXTRACT(EPOCH FROM (updated_at - started_at)) / 3600) as avg_hours_used
FROM trials
WHERE status = 'expired';

-- Agentes mais testados
SELECT 
  target_id,
  COUNT(*) as trial_count
FROM trials
WHERE target_type = 'agent'
GROUP BY target_id
ORDER BY trial_count DESC
LIMIT 10;
```

### Métricas de Conversão

```sql
-- Taxa de conversão geral
SELECT 
  COUNT(DISTINCT user_id) as total_trials,
  COUNT(DISTINCT CASE 
    WHEN EXISTS (
      SELECT 1 FROM payment_events pe 
      WHERE pe.tenant_id::text = trials.user_id::text
    ) THEN user_id 
  END) as converted_users,
  ROUND(
    COUNT(DISTINCT CASE 
      WHEN EXISTS (
        SELECT 1 FROM payment_events pe 
        WHERE pe.tenant_id::text = trials.user_id::text
      ) THEN user_id 
    END)::numeric / 
    COUNT(DISTINCT user_id)::numeric * 100,
    2
  ) as conversion_rate_pct
FROM trials;
```

### Métricas Comerciais

```sql
-- Tempo médio de resposta
SELECT 
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600) as avg_response_hours
FROM commercial_requests
WHERE status != 'pending';

-- Taxa de fechamento
SELECT 
  status,
  COUNT(*) as total,
  ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 2) as percentage
FROM commercial_requests
GROUP BY status;
```

## 🔧 Manutenção Automática

### Job 1: Expirar Trials (a cada hora)

```sql
-- Lambda EventBridge Rule: rate(1 hour)
SELECT expire_trials();
```

### Job 2: Limpar Dados Antigos (diário)

```sql
-- Lambda EventBridge Rule: cron(0 2 * * ? *)
DELETE FROM trials
WHERE status = 'expired'
  AND updated_at < NOW() - INTERVAL '30 days';

DELETE FROM payment_events
WHERE created_at < NOW() - INTERVAL '90 days';
```

### Job 3: Alertar Solicitações Pendentes (diário)

```sql
-- Lambda EventBridge Rule: cron(0 9 * * ? *)
SELECT 
  id,
  company_name,
  email,
  NOW() - created_at as waiting_time
FROM commercial_requests
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '24 hours';
-- Enviar alerta para equipe comercial
```

## 📚 Referências

- [Quick Start](./SUBSCRIPTION-SYSTEM-QUICK-START.md)
- [Índice Completo](./SUBSCRIPTION-SYSTEM-INDEX.md)
- [Migration README](./migrations/README-009.md)
- [Seed README](./seeds/README-004.md)
- [Design Document](../.kiro/specs/alquimista-subscription-system/design.md)
