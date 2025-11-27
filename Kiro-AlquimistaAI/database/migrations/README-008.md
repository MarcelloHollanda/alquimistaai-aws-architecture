# Migration 008: Sistema de Assinaturas e Billing

## Visão Geral

Esta migration cria a estrutura de banco de dados necessária para o sistema de assinaturas e comercialização do AlquimistaAI, incluindo:

- **Trials**: Sistema de testes gratuitos (24h ou 5 tokens)
- **Commercial Requests**: Solicitações de contato comercial para Fibonacci/SubNúcleos
- **Payment Events**: Histórico de eventos do gateway de pagamento
- **Subscriptions**: Assinaturas ativas de agentes AlquimistaAI

## Tabelas Criadas

### 1. `commercial_requests`

Armazena solicitações de contato comercial para Fibonacci e SubNúcleos.

**Campos principais:**
- `tenant_id`: Referência ao tenant (opcional para usuários não autenticados)
- `company_name`, `cnpj`, `contact_name`, `email`, `whatsapp`: Dados de contato
- `selected_agents`: Array JSON de IDs de agentes selecionados
- `selected_subnucleos`: Array JSON de IDs de SubNúcleos selecionados
- `message`: Mensagem livre do cliente
- `status`: `pending`, `contacted`, `closed`

**Índices:**
- `idx_commercial_requests_tenant`: Busca por tenant
- `idx_commercial_requests_status`: Filtro por status
- `idx_commercial_requests_created`: Ordenação por data

### 2. `trials`

Gerencia testes gratuitos de agentes e SubNúcleos.

**Campos principais:**
- `user_id`: ID do usuário testando
- `target_type`: `agent` ou `subnucleo`
- `target_id`: ID do agente ou SubNúcleo
- `started_at`: Timestamp de início
- `expires_at`: Timestamp de expiração (started_at + 24h)
- `usage_count`: Contador de tokens usados
- `max_usage`: Limite de tokens (padrão: 5)
- `status`: `active`, `expired`, `completed`

**Regras de Negócio:**
- Limite: 24 horas OU 5 tokens (o que ocorrer primeiro)
- Constraint UNIQUE em (user_id, target_type, target_id) - um trial por usuário/target

**Índices:**
- `idx_trials_user`: Busca por usuário
- `idx_trials_status`: Filtro por status
- `idx_trials_expires`: Queries de expiração

### 3. `payment_events`

Registra todos os eventos do gateway de pagamento (Stripe/Pagar.me).

**Campos principais:**
- `tenant_id`: Referência ao tenant
- `event_type`: Tipo do evento (ex: `checkout.session.completed`)
- `provider_customer_id`: ID do customer no gateway
- `provider_subscription_id`: ID da subscription no gateway
- `provider_session_id`: ID da sessão de checkout
- `amount`: Valor do evento
- `currency`: Moeda (padrão: BRL)
- `status`: Status do evento
- `metadata`: Dados adicionais em JSON

**Índices:**
- `idx_payment_events_tenant`: Busca por tenant
- `idx_payment_events_type`: Filtro por tipo de evento
- `idx_payment_events_subscription`: Busca por subscription
- `idx_payment_events_created`: Ordenação por data

### 4. `subscriptions`

Armazena assinaturas ativas de agentes AlquimistaAI.

**Campos principais:**
- `tenant_id`: Referência ao tenant (obrigatório)
- `provider_customer_id`: ID do customer no gateway
- `provider_subscription_id`: ID da subscription no gateway (único)
- `status`: `active`, `canceled`, `past_due`, `trialing`
- `selected_agents`: Array JSON de IDs de agentes contratados
- `total_monthly`: Valor mensal total
- `currency`: Moeda (padrão: BRL)
- `current_period_start`, `current_period_end`: Período de cobrança
- `cancel_at_period_end`: Flag de cancelamento agendado

**Índices:**
- `idx_subscriptions_tenant`: Busca por tenant
- `idx_subscriptions_status`: Filtro por status
- `idx_subscriptions_provider`: Busca por subscription do gateway

## Triggers

Todas as tabelas possuem trigger `update_updated_at` que atualiza automaticamente o campo `updated_at` em cada UPDATE.

## Segurança

**IMPORTANTE:**
- Nunca armazenar dados de cartão de crédito
- Apenas IDs e tokens do gateway de pagamento
- Checkout sempre hospedado pelo provedor externo

## Relacionamentos

```
tenants (1) ----< (N) commercial_requests
tenants (1) ----< (N) payment_events
tenants (1) ----< (N) subscriptions

users (1) ----< (N) trials
agents (1) ----< (N) trials (via target_id quando target_type='agent')
subnucleos (1) ----< (N) trials (via target_id quando target_type='subnucleo')
```

## Executar Migration

```bash
# Desenvolvimento
psql -h localhost -U postgres -d alquimista_dev -f database/migrations/008_create_billing_tables.sql

# Produção (via AWS RDS)
psql -h <rds-endpoint> -U <master-user> -d alquimista_prod -f database/migrations/008_create_billing_tables.sql
```

## Seed de Dados de Teste

Após executar a migration, execute o seed para popular dados de teste:

```bash
psql -h localhost -U postgres -d alquimista_dev -f database/seeds/004_subscription_test_data.sql
```

O seed cria:
- Agentes AlquimistaAI com preço R$ 29,90/mês
- SubNúcleos Fibonacci com preço base R$ 365,00/mês
- Trials de exemplo (ativos e expirados)
- Solicitações comerciais de exemplo

## Queries Úteis

### Listar agentes disponíveis para compra
```sql
SELECT 
    id,
    display_name,
    description,
    category,
    pricing->>'monthlyPrice' as price,
    config->'tags' as tags
FROM alquimista_platform.agents
WHERE config->>'availableForPurchase' = 'true'
    AND status = 'active';
```

### Verificar trials ativos de um usuário
```sql
SELECT 
    t.id,
    t.target_type,
    CASE 
        WHEN t.target_type = 'agent' THEN a.display_name
        WHEN t.target_type = 'subnucleo' THEN s.display_name
    END as target_name,
    t.started_at,
    t.expires_at,
    t.usage_count,
    t.max_usage,
    (t.max_usage - t.usage_count) as remaining_tokens,
    EXTRACT(EPOCH FROM (t.expires_at - NOW())) / 3600 as hours_remaining
FROM trials t
LEFT JOIN alquimista_platform.agents a ON t.target_id = a.id AND t.target_type = 'agent'
LEFT JOIN alquimista_platform.subnucleos s ON t.target_id = s.id AND t.target_type = 'subnucleo'
WHERE t.user_id = '<user-id>'
    AND t.status = 'active'
    AND t.expires_at > NOW()
    AND t.usage_count < t.max_usage;
```

### Listar SubNúcleos Fibonacci disponíveis
```sql
SELECT 
    id,
    display_name,
    description,
    scope,
    base_price_monthly,
    included_agents,
    features
FROM alquimista_platform.subnucleos
WHERE status = 'active'
ORDER BY display_name;
```

### Verificar assinatura de um tenant
```sql
SELECT 
    s.id,
    s.status,
    s.selected_agents,
    s.total_monthly,
    s.current_period_start,
    s.current_period_end,
    s.cancel_at_period_end,
    array_length(s.selected_agents::jsonb, 1) as agent_count
FROM subscriptions s
WHERE s.tenant_id = '<tenant-id>'
    AND s.status = 'active';
```

### Histórico de eventos de pagamento
```sql
SELECT 
    event_type,
    status,
    amount,
    currency,
    metadata,
    created_at
FROM payment_events
WHERE tenant_id = '<tenant-id>'
ORDER BY created_at DESC
LIMIT 20;
```

## Rollback

Para reverter esta migration:

```sql
-- Remover triggers
DROP TRIGGER IF EXISTS update_commercial_requests_updated_at ON commercial_requests;
DROP TRIGGER IF EXISTS update_trials_updated_at ON trials;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;

-- Remover tabelas
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS payment_events;
DROP TABLE IF EXISTS trials;
DROP TABLE IF EXISTS commercial_requests;

-- Remover função (se não for usada por outras tabelas)
DROP FUNCTION IF EXISTS update_updated_at_column();
```

## Próximos Passos

1. Executar migration em ambiente de desenvolvimento
2. Executar seed de dados de teste
3. Testar APIs de trials e billing
4. Configurar gateway de pagamento (Stripe/Pagar.me)
5. Testar fluxo completo de checkout
6. Executar em staging
7. Executar em produção

## Referências

- Requisitos: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15
- Design: `.kiro/specs/alquimista-subscription-system/design.md`
- Tasks: `.kiro/specs/alquimista-subscription-system/tasks.md`
