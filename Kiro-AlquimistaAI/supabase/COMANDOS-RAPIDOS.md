# ⚡ Comandos Rápidos - Supabase Migrations

## 🚀 Aplicar Migration

### Via Supabase Dashboard (Recomendado)
1. Acesse: https://app.supabase.com
2. SQL Editor → New Query
3. Copie e cole: `supabase/migrations/001_004_consolidated_base_schema.sql`
4. Run (Ctrl+Enter)

### Via psql
```bash
# Conectar e executar
psql "postgresql://postgres:[SENHA]@[HOST]:5432/postgres" \
  -f supabase/migrations/001_004_consolidated_base_schema.sql
```

### Via Supabase CLI
```bash
# Instalar CLI
npm install -g supabase

# Login
supabase login

# Link projeto
supabase link --project-ref <seu-project-ref>

# Push migration
supabase db push
```

## ✅ Verificar Instalação

### Verificação Completa
```bash
psql "postgresql://postgres:[SENHA]@[HOST]:5432/postgres" \
  -f supabase/migrations/verify_001_004.sql
```

### Verificação Rápida (SQL)
```sql
-- Contar tabelas (esperado: 15)
SELECT COUNT(*) as total_tabelas
FROM information_schema.tables 
WHERE table_schema IN ('fibonacci_core', 'nigredo_leads', 'alquimista_platform');

-- Ver migrations aplicadas (esperado: 4)
SELECT migration_name, applied_at 
FROM public.migrations 
ORDER BY applied_at DESC;

-- Ver schemas (esperado: 3)
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name IN ('fibonacci_core', 'nigredo_leads', 'alquimista_platform');
```

## 🔐 Configurar RLS (Segurança)

### Habilitar RLS em Todas as Tabelas
```sql
-- Nigredo Leads
ALTER TABLE nigredo_leads.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE nigredo_leads.campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE nigredo_leads.interacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE nigredo_leads.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE nigredo_leads.metricas_diarias ENABLE ROW LEVEL SECURITY;

-- Alquimista Platform
ALTER TABLE alquimista_platform.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE alquimista_platform.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE alquimista_platform.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE alquimista_platform.agent_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE alquimista_platform.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alquimista_platform.audit_logs ENABLE ROW LEVEL SECURITY;

-- Fibonacci Core
ALTER TABLE fibonacci_core.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE fibonacci_core.traces ENABLE ROW LEVEL SECURITY;
ALTER TABLE fibonacci_core.metrics ENABLE ROW LEVEL SECURITY;
```

### Políticas RLS Básicas (Isolamento por Tenant)
```sql
-- Tenants: Usuários só veem seu próprio tenant
CREATE POLICY tenant_isolation ON alquimista_platform.tenants
    FOR ALL
    USING (id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Users: Usuários do mesmo tenant
CREATE POLICY users_tenant_isolation ON alquimista_platform.users
    FOR ALL
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Leads: Isolamento por tenant
CREATE POLICY leads_tenant_isolation ON nigredo_leads.leads
    FOR ALL
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Campanhas: Isolamento por tenant
CREATE POLICY campanhas_tenant_isolation ON nigredo_leads.campanhas
    FOR ALL
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Agendamentos: Isolamento por tenant
CREATE POLICY agendamentos_tenant_isolation ON nigredo_leads.agendamentos
    FOR ALL
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Métricas: Isolamento por tenant
CREATE POLICY metricas_tenant_isolation ON nigredo_leads.metricas_diarias
    FOR ALL
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Agent Activations: Isolamento por tenant
CREATE POLICY activations_tenant_isolation ON alquimista_platform.agent_activations
    FOR ALL
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Audit Logs: Isolamento por tenant
CREATE POLICY audit_tenant_isolation ON alquimista_platform.audit_logs
    FOR ALL
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Events: Isolamento por tenant (via metadata)
CREATE POLICY events_tenant_isolation ON fibonacci_core.events
    FOR ALL
    USING ((metadata->>'tenantId')::uuid = (auth.jwt() ->> 'tenant_id')::uuid);

-- Traces: Isolamento por tenant
CREATE POLICY traces_tenant_isolation ON fibonacci_core.traces
    FOR ALL
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Metrics: Isolamento por tenant (via dimensions)
CREATE POLICY metrics_tenant_isolation ON fibonacci_core.metrics
    FOR ALL
    USING ((dimensions->>'tenantId')::uuid = (auth.jwt() ->> 'tenant_id')::uuid);
```

### Políticas RLS para Service Role (Bypass)
```sql
-- Service role tem acesso total
CREATE POLICY service_role_all ON alquimista_platform.tenants
    FOR ALL
    TO service_role
    USING (true);

-- Repetir para todas as tabelas
CREATE POLICY service_role_all ON alquimista_platform.users
    FOR ALL TO service_role USING (true);

CREATE POLICY service_role_all ON nigredo_leads.leads
    FOR ALL TO service_role USING (true);

-- ... (repetir para todas as tabelas)
```

## 🗑️ Rollback (Reverter Migration)

### Rollback Completo
```sql
-- ATENÇÃO: Isso apaga TODOS os dados!
DROP SCHEMA IF EXISTS fibonacci_core CASCADE;
DROP SCHEMA IF EXISTS nigredo_leads CASCADE;
DROP SCHEMA IF EXISTS alquimista_platform CASCADE;

-- Limpar registro de migrations
DELETE FROM public.migrations 
WHERE migration_name IN (
    '001_create_schemas',
    '002_create_leads_tables',
    '003_create_platform_tables',
    '004_create_core_tables'
);
```

### Rollback Parcial (Por Schema)
```sql
-- Apenas Nigredo
DROP SCHEMA IF EXISTS nigredo_leads CASCADE;
DELETE FROM public.migrations WHERE migration_name = '002_create_leads_tables';

-- Apenas Platform
DROP SCHEMA IF EXISTS alquimista_platform CASCADE;
DELETE FROM public.migrations WHERE migration_name = '003_create_platform_tables';

-- Apenas Core
DROP SCHEMA IF EXISTS fibonacci_core CASCADE;
DELETE FROM public.migrations WHERE migration_name = '004_create_core_tables';
```

## 📊 Monitoramento

### Ver Tamanho das Tabelas
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname IN ('fibonacci_core', 'nigredo_leads', 'alquimista_platform')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Ver Índices Não Utilizados
```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname IN ('fibonacci_core', 'nigredo_leads', 'alquimista_platform')
    AND idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Ver Queries Lentas
```sql
SELECT 
    substring(query, 1, 100) as query_preview,
    calls,
    round(total_time::numeric, 2) as total_time_ms,
    round(mean_time::numeric, 2) as mean_time_ms,
    round((100 * total_time / sum(total_time) OVER ())::numeric, 2) as percentage
FROM pg_stat_statements
WHERE query LIKE '%fibonacci_core%' 
    OR query LIKE '%nigredo_leads%'
    OR query LIKE '%alquimista_platform%'
ORDER BY total_time DESC
LIMIT 20;
```

### Ver Conexões Ativas
```sql
SELECT 
    datname,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    state_change,
    substring(query, 1, 100) as query_preview
FROM pg_stat_activity
WHERE datname = current_database()
    AND state = 'active'
ORDER BY query_start DESC;
```

## 🔍 Debugging

### Ver Estrutura de uma Tabela
```sql
-- Exemplo: leads
\d nigredo_leads.leads

-- Ou via SQL
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'nigredo_leads'
    AND table_name = 'leads'
ORDER BY ordinal_position;
```

### Ver Foreign Keys
```sql
SELECT 
    tc.table_schema,
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema IN ('fibonacci_core', 'nigredo_leads', 'alquimista_platform')
ORDER BY tc.table_schema, tc.table_name;
```

### Ver Triggers
```sql
SELECT 
    event_object_schema,
    event_object_table,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema IN ('fibonacci_core', 'nigredo_leads', 'alquimista_platform')
ORDER BY event_object_schema, event_object_table, trigger_name;
```

## 🧪 Testes

### Inserir Dados de Teste
```sql
-- Criar tenant de teste
INSERT INTO alquimista_platform.tenants (id, company_name, cnpj, subscription_tier)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Empresa Teste',
    '12.345.678/0001-90',
    'professional'
);

-- Criar usuário de teste
INSERT INTO alquimista_platform.users (tenant_id, email, full_name, user_role)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'teste@exemplo.com',
    'Usuário Teste',
    'admin'
);

-- Criar lead de teste
INSERT INTO nigredo_leads.leads (tenant_id, empresa, email, telefone, status)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Lead Teste Ltda',
    'lead@teste.com',
    '+55 11 98765-4321',
    'novo'
);
```

### Limpar Dados de Teste
```sql
-- Deletar dados de teste (CASCADE deleta relacionados)
DELETE FROM alquimista_platform.tenants 
WHERE id = '00000000-0000-0000-0000-000000000001';
```

## 📋 Backup e Restore

### Backup Completo
```bash
# Via pg_dump
pg_dump "postgresql://postgres:[SENHA]@[HOST]:5432/postgres" \
  --schema=fibonacci_core \
  --schema=nigredo_leads \
  --schema=alquimista_platform \
  --file=backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore
```bash
# Via psql
psql "postgresql://postgres:[SENHA]@[HOST]:5432/postgres" \
  -f backup_20250117_120000.sql
```

## 🔗 Links Úteis

- [Supabase Dashboard](https://app.supabase.com)
- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md)
- [RESUMO-EXECUTIVO.md](./RESUMO-EXECUTIVO.md)

---

**Dica**: Salve este arquivo como favorito para acesso rápido aos comandos!
