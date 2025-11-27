-- ============================================================================
-- SCRIPT DE VERIFICAÇÃO - MIGRATIONS 001-004
-- ============================================================================
-- Propósito: Verificar se as migrations 001-004 foram aplicadas corretamente
-- Como usar: Execute este script após aplicar 001_004_consolidated_base_schema.sql
-- ============================================================================

\echo '============================================================================'
\echo 'VERIFICAÇÃO DAS MIGRATIONS 001-004'
\echo '============================================================================'
\echo ''

-- ============================================================================
-- 1. VERIFICAR SCHEMAS
-- ============================================================================

\echo '1. Verificando Schemas...'
\echo ''

SELECT 
    schema_name,
    CASE 
        WHEN schema_name IN ('fibonacci_core', 'nigredo_leads', 'alquimista_platform') 
        THEN '✅ OK'
        ELSE '❌ ERRO'
    END as status
FROM information_schema.schemata 
WHERE schema_name IN ('fibonacci_core', 'nigredo_leads', 'alquimista_platform')
ORDER BY schema_name;

\echo ''
\echo 'Esperado: 3 schemas (fibonacci_core, nigredo_leads, alquimista_platform)'
\echo ''

-- ============================================================================
-- 2. VERIFICAR TABELAS NIGREDO_LEADS
-- ============================================================================

\echo '2. Verificando Tabelas Nigredo Leads...'
\echo ''

SELECT 
    table_name,
    '✅ OK' as status
FROM information_schema.tables 
WHERE table_schema = 'nigredo_leads'
ORDER BY table_name;

\echo ''
\echo 'Esperado: 6 tabelas (leads, campanhas, interacoes, agendamentos, metricas_diarias, blocklist)'
\echo ''

-- ============================================================================
-- 3. VERIFICAR TABELAS ALQUIMISTA_PLATFORM
-- ============================================================================

\echo '3. Verificando Tabelas Alquimista Platform...'
\echo ''

SELECT 
    table_name,
    '✅ OK' as status
FROM information_schema.tables 
WHERE table_schema = 'alquimista_platform'
ORDER BY table_name;

\echo ''
\echo 'Esperado: 6 tabelas (tenants, users, agents, agent_activations, permissions, audit_logs)'
\echo ''

-- ============================================================================
-- 4. VERIFICAR TABELAS FIBONACCI_CORE
-- ============================================================================

\echo '4. Verificando Tabelas Fibonacci Core...'
\echo ''

SELECT 
    table_name,
    '✅ OK' as status
FROM information_schema.tables 
WHERE table_schema = 'fibonacci_core'
ORDER BY table_name;

\echo ''
\echo 'Esperado: 3 tabelas (events, traces, metrics)'
\echo ''

-- ============================================================================
-- 5. VERIFICAR FOREIGN KEYS
-- ============================================================================

\echo '5. Verificando Foreign Keys...'
\echo ''

SELECT 
    tc.table_schema,
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    '✅ OK' as status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema IN ('fibonacci_core', 'nigredo_leads', 'alquimista_platform')
ORDER BY tc.table_schema, tc.table_name;

\echo ''
\echo 'Esperado: Múltiplas foreign keys entre tabelas'
\echo ''

-- ============================================================================
-- 6. VERIFICAR INDEXES
-- ============================================================================

\echo '6. Verificando Indexes...'
\echo ''

SELECT 
    schemaname,
    tablename,
    indexname,
    '✅ OK' as status
FROM pg_indexes
WHERE schemaname IN ('fibonacci_core', 'nigredo_leads', 'alquimista_platform')
ORDER BY schemaname, tablename, indexname;

\echo ''
\echo 'Esperado: Múltiplos indexes para otimização de queries'
\echo ''

-- ============================================================================
-- 7. VERIFICAR TRIGGERS
-- ============================================================================

\echo '7. Verificando Triggers...'
\echo ''

SELECT 
    event_object_schema,
    event_object_table,
    trigger_name,
    action_statement,
    '✅ OK' as status
FROM information_schema.triggers
WHERE event_object_schema IN ('fibonacci_core', 'nigredo_leads', 'alquimista_platform')
ORDER BY event_object_schema, event_object_table, trigger_name;

\echo ''
\echo 'Esperado: Triggers de updated_at e calculate_trace_duration'
\echo ''

-- ============================================================================
-- 8. VERIFICAR FUNCTIONS
-- ============================================================================

\echo '8. Verificando Functions...'
\echo ''

SELECT 
    n.nspname as schema,
    p.proname as function_name,
    pg_get_function_result(p.oid) as return_type,
    '✅ OK' as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('fibonacci_core', 'nigredo_leads', 'alquimista_platform', 'public')
    AND p.proname IN ('update_updated_at_column', 'calculate_trace_duration')
ORDER BY n.nspname, p.proname;

\echo ''
\echo 'Esperado: 2 functions (update_updated_at_column, calculate_trace_duration)'
\echo ''

-- ============================================================================
-- 9. VERIFICAR MIGRATIONS REGISTRADAS
-- ============================================================================

\echo '9. Verificando Migrations Registradas...'
\echo ''

SELECT 
    migration_name,
    applied_at,
    description,
    '✅ OK' as status
FROM public.migrations
WHERE migration_name IN (
    '001_create_schemas',
    '002_create_leads_tables',
    '003_create_platform_tables',
    '004_create_core_tables'
)
ORDER BY migration_name;

\echo ''
\echo 'Esperado: 4 registros de migrations'
\echo ''

-- ============================================================================
-- 10. VERIFICAR CONSTRAINTS
-- ============================================================================

\echo '10. Verificando Constraints...'
\echo ''

SELECT 
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    '✅ OK' as status
FROM information_schema.table_constraints tc
WHERE tc.table_schema IN ('fibonacci_core', 'nigredo_leads', 'alquimista_platform')
    AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE', 'CHECK')
ORDER BY tc.table_schema, tc.table_name, tc.constraint_type;

\echo ''
\echo 'Esperado: Primary keys, unique constraints e check constraints'
\echo ''

-- ============================================================================
-- 11. CONTAGEM GERAL
-- ============================================================================

\echo '============================================================================'
\echo 'RESUMO GERAL'
\echo '============================================================================'
\echo ''

WITH counts AS (
    SELECT 
        'Schemas' as item,
        COUNT(*) as quantidade,
        3 as esperado
    FROM information_schema.schemata 
    WHERE schema_name IN ('fibonacci_core', 'nigredo_leads', 'alquimista_platform')
    
    UNION ALL
    
    SELECT 
        'Tabelas Nigredo' as item,
        COUNT(*) as quantidade,
        6 as esperado
    FROM information_schema.tables 
    WHERE table_schema = 'nigredo_leads'
    
    UNION ALL
    
    SELECT 
        'Tabelas Platform' as item,
        COUNT(*) as quantidade,
        6 as esperado
    FROM information_schema.tables 
    WHERE table_schema = 'alquimista_platform'
    
    UNION ALL
    
    SELECT 
        'Tabelas Core' as item,
        COUNT(*) as quantidade,
        3 as esperado
    FROM information_schema.tables 
    WHERE table_schema = 'fibonacci_core'
    
    UNION ALL
    
    SELECT 
        'Migrations Registradas' as item,
        COUNT(*) as quantidade,
        4 as esperado
    FROM public.migrations
    WHERE migration_name IN (
        '001_create_schemas',
        '002_create_leads_tables',
        '003_create_platform_tables',
        '004_create_core_tables'
    )
)
SELECT 
    item,
    quantidade,
    esperado,
    CASE 
        WHEN quantidade = esperado THEN '✅ OK'
        WHEN quantidade < esperado THEN '❌ FALTANDO ' || (esperado - quantidade)::text
        ELSE '⚠️ EXCESSO ' || (quantidade - esperado)::text
    END as status
FROM counts
ORDER BY item;

\echo ''
\echo '============================================================================'
\echo 'VERIFICAÇÃO COMPLETA'
\echo '============================================================================'
\echo ''
\echo 'Se todos os itens estão com ✅ OK, a migration foi aplicada com sucesso!'
\echo ''
\echo 'Próximos passos:'
\echo '1. Aplicar migrations 005-010 (se necessário)'
\echo '2. Configurar Row Level Security (RLS)'
\echo '3. Inserir dados iniciais (seeds)'
\echo ''
