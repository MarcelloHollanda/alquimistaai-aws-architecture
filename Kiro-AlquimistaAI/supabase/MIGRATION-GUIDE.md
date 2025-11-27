# 🚀 Guia Rápido de Migration - Supabase

## ✅ O Que Foi Feito

Consolidei as **migrations 001-004** do projeto AWS em um único arquivo SQL otimizado para Supabase:

### 📦 Arquivo Criado
`supabase/migrations/001_004_consolidated_base_schema.sql`

### 📊 Conteúdo
- **3 Schemas**: `fibonacci_core`, `nigredo_leads`, `alquimista_platform`
- **15 Tabelas**: Estrutura completa do sistema
- **50+ Indexes**: Otimização de performance
- **8 Triggers**: Automação de timestamps e cálculos
- **2 Functions**: Utilitários reutilizáveis

## 🎯 Como Aplicar

### Opção 1: Supabase Dashboard (Mais Fácil)

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral)
4. Clique em **New Query**
5. Copie todo o conteúdo de `001_004_consolidated_base_schema.sql`
6. Cole no editor
7. Clique em **Run** (ou Ctrl+Enter)
8. Aguarde a execução (pode levar 10-30 segundos)

### Opção 2: Supabase CLI

```bash
# 1. Instalar CLI (se necessário)
npm install -g supabase

# 2. Login
supabase login

# 3. Link ao projeto
supabase link --project-ref <seu-project-ref>

# 4. Aplicar migration
supabase db push
```

### Opção 3: psql Direto

```bash
# Conectar ao Supabase
psql "postgresql://postgres:[SUA-SENHA]@[SEU-HOST]:5432/postgres"

# Executar migration
\i supabase/migrations/001_004_consolidated_base_schema.sql
```

## ✅ Verificar Instalação

### Método 1: Script Automático

```bash
psql "postgresql://postgres:[SUA-SENHA]@[SEU-HOST]:5432/postgres" \
  -f supabase/migrations/verify_001_004.sql
```

### Método 2: Queries Manuais

Execute no SQL Editor do Supabase:

```sql
-- 1. Verificar schemas (esperado: 3)
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name IN ('fibonacci_core', 'nigredo_leads', 'alquimista_platform');

-- 2. Verificar tabelas (esperado: 15 total)
SELECT table_schema, COUNT(*) as total_tabelas
FROM information_schema.tables 
WHERE table_schema IN ('fibonacci_core', 'nigredo_leads', 'alquimista_platform')
GROUP BY table_schema;

-- 3. Verificar migrations registradas (esperado: 4)
SELECT * FROM public.migrations 
WHERE migration_name LIKE '00%'
ORDER BY migration_name;
```

**Resultado Esperado**:
```
✅ 3 schemas criados
✅ 6 tabelas em nigredo_leads
✅ 6 tabelas em alquimista_platform
✅ 3 tabelas em fibonacci_core
✅ 4 registros em public.migrations
```

## 📋 Estrutura Criada

### Schema: `nigredo_leads` (Prospecção)
- `leads` - Informações de leads
- `campanhas` - Campanhas de marketing
- `interacoes` - Histórico de interações
- `agendamentos` - Reuniões agendadas
- `metricas_diarias` - Métricas agregadas
- `blocklist` - LGPD compliance

### Schema: `alquimista_platform` (Plataforma)
- `tenants` - Empresas clientes (multi-tenant)
- `users` - Usuários do sistema
- `agents` - Catálogo de agentes IA
- `agent_activations` - Agentes ativos por tenant
- `permissions` - Controle de acesso
- `audit_logs` - Trilha de auditoria

### Schema: `fibonacci_core` (Orquestração)
- `events` - Histórico de eventos
- `traces` - Rastreamento distribuído
- `metrics` - Métricas do sistema

## 🔄 Próximos Passos

### 1. Aplicar Migrations Restantes (005-010)

Você precisará adaptar estas migrations do projeto AWS:

```
database/migrations/005_create_approval_tables.sql
database/migrations/006_add_lgpd_consent.sql
database/migrations/007_create_nigredo_schema.sql
database/migrations/008_create_billing_tables.sql
database/migrations/009_create_subscription_tables.sql
database/migrations/010_create_plans_structure.sql
```

**Como adaptar**:
1. Copie o conteúdo de cada arquivo
2. Ajuste permissões (substitua `CURRENT_USER` por `postgres, service_role`)
3. Teste em ambiente dev primeiro
4. Aplique no Supabase

### 2. Configurar Row Level Security (RLS)

**IMPORTANTE**: As tabelas foram criadas SEM políticas RLS. Você deve adicionar:

```sql
-- Exemplo: Isolar dados por tenant
ALTER TABLE alquimista_platform.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON alquimista_platform.tenants
    FOR ALL
    USING (id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Repetir para outras tabelas sensíveis
```

### 3. Inserir Dados Iniciais (Seeds)

Adapte os seeds do projeto AWS:

```
database/seeds/001_production_data.template.sql
database/seeds/002_default_permissions.sql
database/seeds/003_internal_account.sql
database/seeds/004_subscription_test_data.sql
database/seeds/005_agents_32_complete.sql
database/seeds/006_subnucleos_and_plans.sql
database/seeds/007_ceo_admin_access.sql
```

## 🔐 Segurança

### Checklist de Segurança

- [ ] RLS habilitado em todas as tabelas sensíveis
- [ ] Políticas RLS criadas para isolamento de tenants
- [ ] Permissões de roles configuradas corretamente
- [ ] Secrets Manager configurado para credenciais
- [ ] Backup automático habilitado no Supabase
- [ ] Logs de auditoria monitorados

### Exemplo de Política RLS Completa

```sql
-- Tenants: Usuários só veem seu próprio tenant
ALTER TABLE alquimista_platform.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_select ON alquimista_platform.tenants
    FOR SELECT
    USING (id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY tenant_update ON alquimista_platform.tenants
    FOR UPDATE
    USING (id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Leads: Isolamento por tenant
ALTER TABLE nigredo_leads.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY leads_tenant_isolation ON nigredo_leads.leads
    FOR ALL
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
```

## 🆘 Troubleshooting

### Erro: "schema already exists"
```sql
-- Solução: Dropar schemas existentes (CUIDADO: perde dados!)
DROP SCHEMA IF EXISTS fibonacci_core CASCADE;
DROP SCHEMA IF EXISTS nigredo_leads CASCADE;
DROP SCHEMA IF EXISTS alquimista_platform CASCADE;

-- Depois execute a migration novamente
```

### Erro: "permission denied"
**Causa**: Usuário sem permissões adequadas  
**Solução**: Use o usuário `postgres` ou role `service_role`

### Erro: "relation already exists"
```sql
-- Solução: Verificar quais tabelas já existem
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_schema IN ('fibonacci_core', 'nigredo_leads', 'alquimista_platform');

-- Dropar tabelas específicas se necessário
DROP TABLE IF EXISTS nigredo_leads.leads CASCADE;
```

### Migration Parcialmente Aplicada
```sql
-- Verificar o que foi criado
SELECT * FROM public.migrations ORDER BY applied_at DESC;

-- Reverter migration específica (se necessário)
DELETE FROM public.migrations WHERE migration_name = '001_create_schemas';

-- Dropar objetos criados e tentar novamente
```

## 📊 Monitoramento

### Queries Úteis

```sql
-- Ver tamanho das tabelas
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname IN ('fibonacci_core', 'nigredo_leads', 'alquimista_platform')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Ver índices não utilizados
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan
FROM pg_stat_user_indexes
WHERE schemaname IN ('fibonacci_core', 'nigredo_leads', 'alquimista_platform')
    AND idx_scan = 0
ORDER BY schemaname, tablename;

-- Ver queries lentas
SELECT 
    query,
    calls,
    total_time,
    mean_time
FROM pg_stat_statements
WHERE query LIKE '%fibonacci_core%' 
    OR query LIKE '%nigredo_leads%'
    OR query LIKE '%alquimista_platform%'
ORDER BY mean_time DESC
LIMIT 10;
```

## 📚 Documentação Adicional

- [README.md](./migrations/README.md) - Documentação completa
- [verify_001_004.sql](./migrations/verify_001_004.sql) - Script de verificação
- [Supabase Docs](https://supabase.com/docs) - Documentação oficial

## ✅ Checklist Final

- [ ] Migration 001-004 aplicada com sucesso
- [ ] Verificação executada (15 tabelas criadas)
- [ ] RLS configurado
- [ ] Migrations 005-010 adaptadas e aplicadas
- [ ] Seeds inseridos
- [ ] Backup configurado
- [ ] Monitoramento ativo
- [ ] Documentação atualizada

## 🎉 Conclusão

Você agora tem a estrutura base do AlquimistaAI rodando no Supabase!

**Próximos passos**:
1. Aplicar migrations 005-010
2. Configurar RLS
3. Inserir dados iniciais
4. Conectar o backend

---

**Versão**: 1.0.0  
**Data**: 2025-01-17  
**Status**: ✅ Pronto para uso
