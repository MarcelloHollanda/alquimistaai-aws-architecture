# 🚀 Quick Start: Sistema de Assinatura - Database

## Execução Rápida

### 1️⃣ Executar Migration

```bash
# Desenvolvimento
psql -h localhost -U postgres -d alquimista_dev \
  -f database/migrations/009_create_subscription_tables.sql

# Produção (ajustar credenciais)
psql -h <rds-endpoint> -U <username> -d alquimista \
  -f database/migrations/009_create_subscription_tables.sql
```

### 2️⃣ Executar Seed

```bash
# Desenvolvimento
psql -h localhost -U postgres -d alquimista_dev \
  -f database/seeds/004_subscription_test_data.sql

# Produção (ajustar credenciais)
psql -h <rds-endpoint> -U <username> -d alquimista \
  -f database/seeds/004_subscription_test_data.sql
```

### 3️⃣ Verificar

```sql
-- Verificar tabelas criadas
\dt trials commercial_requests payment_events

-- Verificar agentes
SELECT COUNT(*) FROM agents WHERE status = 'active';
-- Esperado: 12

-- Verificar SubNúcleos
SELECT COUNT(*) FROM subnucleos WHERE status = 'active';
-- Esperado: 8
```

## 📊 Estrutura Criada

### Tabelas

| Tabela | Descrição | Registros Iniciais |
|--------|-----------|-------------------|
| `trials` | Testes gratuitos (24h/5 tokens) | 0 |
| `commercial_requests` | Solicitações comerciais | 0 |
| `payment_events` | Log de pagamentos | 0 |
| `agents` | Agentes AlquimistaAI | 12 |
| `subnucleos` | SubNúcleos Fibonacci | 8 |

### Funções

- `update_updated_at_column()` - Atualiza `updated_at` automaticamente
- `expire_trials()` - Expira trials que atingiram limites

## 🔍 Queries Úteis

### Listar Agentes por Segmento

```sql
SELECT segment, COUNT(*), SUM(price_monthly) as total
FROM agents
WHERE status = 'active'
GROUP BY segment
ORDER BY segment;
```

### Listar SubNúcleos

```sql
SELECT name, base_price_monthly, LEFT(description, 50) as desc_preview
FROM subnucleos
WHERE status = 'active'
ORDER BY name;
```

### Verificar Trials Ativos

```sql
SELECT 
  user_id,
  target_type,
  usage_count || '/' || max_usage as tokens,
  ROUND(EXTRACT(EPOCH FROM (expires_at - NOW())) / 3600, 1) as hours_left
FROM trials
WHERE status = 'active';
```

### Solicitações Comerciais Pendentes

```sql
SELECT 
  company_name,
  contact_name,
  email,
  jsonb_array_length(selected_agents) as agents,
  jsonb_array_length(selected_subnucleos) as subnucleos,
  created_at
FROM commercial_requests
WHERE status = 'pending'
ORDER BY created_at DESC;
```

## 🛠️ Manutenção

### Expirar Trials (executar periodicamente)

```sql
SELECT expire_trials();
```

### Limpar Dados Antigos

```sql
-- Trials expirados há mais de 30 dias
DELETE FROM trials
WHERE status = 'expired'
  AND updated_at < NOW() - INTERVAL '30 days';

-- Payment events com mais de 90 dias
DELETE FROM payment_events
WHERE created_at < NOW() - INTERVAL '90 days';
```

## 📝 Próximos Passos

Após configurar o banco:

1. ✅ Migration executada
2. ✅ Seed executado
3. ⏭️ Implementar API GET /api/agents
4. ⏭️ Implementar APIs de trials
5. ⏭️ Implementar API de contato comercial
6. ⏭️ Configurar gateway de pagamento

## 📚 Documentação Completa

- [Migration 009 README](./migrations/README-009.md)
- [Seed 004 README](./seeds/README-004.md)
- [Índice Completo](./SUBSCRIPTION-SYSTEM-INDEX.md)
- [Guia Visual](./SUBSCRIPTION-SYSTEM-VISUAL-GUIDE.md)

## ⚠️ Troubleshooting

### Erro: Tabela já existe

```sql
-- Verificar se tabelas existem
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('trials', 'commercial_requests', 'payment_events');

-- Se necessário, fazer rollback primeiro
DROP TABLE IF EXISTS payment_events CASCADE;
DROP TABLE IF EXISTS commercial_requests CASCADE;
DROP TABLE IF EXISTS trials CASCADE;
```

### Erro: Tabela agents não existe

O seed assume que as tabelas `agents` e `subnucleos` já existem. Se não existirem, criar primeiro:

```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  segment VARCHAR(100),
  description TEXT,
  tags JSONB DEFAULT '[]',
  price_monthly DECIMAL(10, 2) DEFAULT 29.90,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE subnucleos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  scope TEXT,
  base_price_monthly DECIMAL(10, 2) DEFAULT 365.00,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🆘 Suporte

Problemas? Consulte:
- [Design Document](../.kiro/specs/alquimista-subscription-system/design.md)
- [Requirements](../.kiro/specs/alquimista-subscription-system/requirements.md)
- [Tasks](../.kiro/specs/alquimista-subscription-system/tasks.md)
