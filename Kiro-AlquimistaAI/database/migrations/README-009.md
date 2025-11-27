# Migration 009: Sistema de Assinatura

## Visão Geral

Esta migration cria a estrutura de banco de dados para o sistema de assinatura AlquimistaAI, incluindo:

- **Trials**: Testes gratuitos de agentes e SubNúcleos (24h ou 5 tokens)
- **Commercial Requests**: Solicitações de contato comercial para Fibonacci
- **Payment Events**: Log de eventos do gateway de pagamento

## Tabelas Criadas

### 1. `trials`

Armazena testes gratuitos com controle de limites.

**Colunas principais:**
- `user_id`: ID do usuário
- `target_type`: 'agent' ou 'subnucleo'
- `target_id`: ID do agente ou SubNúcleo
- `usage_count`: Contador de tokens usados (máx: 5)
- `expires_at`: Data de expiração (started_at + 24h)
- `status`: 'active' ou 'expired'

**Constraint único:** Um usuário pode ter apenas um trial por target

### 2. `commercial_requests`

Solicitações de contato comercial para Fibonacci e SubNúcleos.

**Colunas principais:**
- `tenant_id`: ID do tenant (pode ser NULL)
- `company_name`, `cnpj`, `contact_name`, `email`, `whatsapp`
- `selected_agents`: Array JSON com IDs dos agentes
- `selected_subnucleos`: Array JSON com IDs dos SubNúcleos
- `message`: Mensagem do cliente
- `status`: 'pending', 'contacted', 'proposal_sent', 'closed', 'cancelled'

### 3. `payment_events`

Log de eventos do gateway de pagamento (Stripe/Pagar.me).

**Colunas principais:**
- `tenant_id`: ID do tenant
- `event_type`: Tipo do evento (ex: 'checkout.session.completed')
- `provider_customer_id`: ID do customer no gateway
- `provider_subscription_id`: ID da subscription no gateway
- `amount`, `currency`, `status`
- `metadata`: Dados adicionais em JSON

## Funções Criadas

### `update_updated_at_column()`

Trigger function que atualiza automaticamente a coluna `updated_at` em UPDATE.

### `expire_trials()`

Função para expirar trials que atingiram limite de tempo ou tokens.

**Uso:**
```sql
SELECT expire_trials(); -- Retorna quantidade de trials expirados
```

**Recomendação:** Executar periodicamente (ex: a cada hora) via cron job ou Lambda scheduled.

## Índices

Índices criados para otimizar queries frequentes:

**trials:**
- `idx_trials_user_target`: (user_id, target_type, target_id)
- `idx_trials_status`: (status)
- `idx_trials_expires_at`: (expires_at) WHERE status = 'active'

**commercial_requests:**
- `idx_commercial_requests_tenant`: (tenant_id)
- `idx_commercial_requests_status`: (status)
- `idx_commercial_requests_created`: (created_at DESC)
- `idx_commercial_requests_email`: (email)

**payment_events:**
- `idx_payment_events_tenant`: (tenant_id)
- `idx_payment_events_subscription`: (provider_subscription_id)
- `idx_payment_events_session`: (provider_session_id)
- `idx_payment_events_created`: (created_at DESC)
- `idx_payment_events_type`: (event_type)

## Como Executar

### Desenvolvimento Local

```bash
psql -h localhost -U postgres -d alquimista_dev -f database/migrations/009_create_subscription_tables.sql
```

### AWS RDS (via psql)

```bash
psql -h <rds-endpoint> -U <username> -d alquimista -f database/migrations/009_create_subscription_tables.sql
```

### Via Lambda (recomendado para produção)

Usar Lambda function de migration que executa o SQL via connection pool.

## Seeds de Teste

Após executar a migration, executar o seed para popular dados de teste:

```bash
psql -h localhost -U postgres -d alquimista_dev -f database/seeds/004_subscription_test_data.sql
```

O seed cria:
- **12 agentes AlquimistaAI** (diversos segmentos)
- **8 SubNúcleos Fibonacci** (Saúde, Educação, Vendas, etc.)

## Rollback

Para reverter esta migration:

```sql
DROP TRIGGER IF EXISTS update_trials_updated_at ON trials;
DROP TRIGGER IF EXISTS update_commercial_requests_updated_at ON commercial_requests;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS expire_trials();
DROP TABLE IF EXISTS payment_events;
DROP TABLE IF EXISTS commercial_requests;
DROP TABLE IF EXISTS trials;
```

## Queries Úteis

### Verificar trials ativos

```sql
SELECT 
  t.id,
  t.user_id,
  t.target_type,
  t.usage_count,
  t.max_usage,
  t.expires_at,
  EXTRACT(EPOCH FROM (t.expires_at - NOW())) / 3600 AS hours_remaining
FROM trials t
WHERE t.status = 'active'
ORDER BY t.expires_at;
```

### Verificar solicitações comerciais pendentes

```sql
SELECT 
  cr.id,
  cr.company_name,
  cr.contact_name,
  cr.email,
  jsonb_array_length(cr.selected_agents) AS qtd_agents,
  jsonb_array_length(cr.selected_subnucleos) AS qtd_subnucleos,
  cr.created_at
FROM commercial_requests cr
WHERE cr.status = 'pending'
ORDER BY cr.created_at DESC;
```

### Verificar eventos de pagamento recentes

```sql
SELECT 
  pe.event_type,
  pe.provider_subscription_id,
  pe.amount,
  pe.status,
  pe.created_at
FROM payment_events pe
WHERE pe.created_at > NOW() - INTERVAL '7 days'
ORDER BY pe.created_at DESC
LIMIT 50;
```

## Manutenção

### Expirar trials automaticamente

Criar job agendado (Lambda EventBridge ou cron) para executar:

```sql
SELECT expire_trials();
```

Recomendação: Executar a cada hora.

### Limpar trials antigos

Após 30 dias, pode-se arquivar ou deletar trials expirados:

```sql
DELETE FROM trials
WHERE status = 'expired'
  AND updated_at < NOW() - INTERVAL '30 days';
```

### Limpar eventos de pagamento antigos

Após 90 dias, pode-se arquivar eventos:

```sql
-- Criar tabela de arquivo primeiro
CREATE TABLE IF NOT EXISTS payment_events_archive (LIKE payment_events INCLUDING ALL);

-- Mover eventos antigos
INSERT INTO payment_events_archive
SELECT * FROM payment_events
WHERE created_at < NOW() - INTERVAL '90 days';

-- Deletar da tabela principal
DELETE FROM payment_events
WHERE created_at < NOW() - INTERVAL '90 days';
```

## Dependências

Esta migration assume que as seguintes tabelas já existem:
- `tenants`: Tabela de tenants do sistema multi-tenant
- `users`: Tabela de usuários
- `agents`: Tabela de agentes (será populada pelo seed)
- `subnucleos`: Tabela de SubNúcleos (será populada pelo seed)

Se alguma tabela não existir, ajustar conforme necessário.

## Próximos Passos

Após executar esta migration:

1. ✅ Executar seed de dados de teste
2. ⏭️ Implementar handlers Lambda para APIs de trials
3. ⏭️ Implementar handler de contato comercial
4. ⏭️ Configurar integração com gateway de pagamento
5. ⏭️ Implementar frontend de seleção e checkout

## Suporte

Para dúvidas ou problemas com esta migration, consultar:
- Design doc: `.kiro/specs/alquimista-subscription-system/design.md`
- Requirements: `.kiro/specs/alquimista-subscription-system/requirements.md`
