# Migrations Supabase - AlquimistaAI

## 📋 Visão Geral

Este diretório contém as migrations consolidadas do sistema AlquimistaAI, adaptadas para o Supabase PostgreSQL.

## 🗂️ Estrutura de Migrations

### Migration 001-004 (Consolidada)
**Arquivo**: `001_004_consolidated_base_schema.sql`

**Conteúdo**:
- ✅ **Migration 001**: Criação dos 3 schemas principais
  - `fibonacci_core` - Orquestração e eventos
  - `nigredo_leads` - Prospecção e leads
  - `alquimista_platform` - Plataforma SaaS multi-tenant

- ✅ **Migration 002**: Tabelas Nigredo Leads
  - `leads` - Informações de leads
  - `campanhas` - Campanhas de marketing
  - `interacoes` - Histórico de interações
  - `agendamentos` - Reuniões agendadas
  - `metricas_diarias` - Métricas agregadas
  - `blocklist` - LGPD compliance

- ✅ **Migration 003**: Tabelas Alquimista Platform
  - `tenants` - Empresas clientes
  - `users` - Usuários do sistema
  - `agents` - Catálogo de agentes IA
  - `agent_activations` - Agentes ativos por tenant
  - `permissions` - Controle de acesso granular
  - `audit_logs` - Trilha de auditoria

- ✅ **Migration 004**: Tabelas Fibonacci Core
  - `events` - Histórico completo de eventos
  - `traces` - Rastreamento distribuído
  - `metrics` - Métricas agregadas

### Migrations Existentes (005-010)

Estas migrations já existem no projeto AWS e devem ser adaptadas:

- **005**: `create_approval_tables.sql` - Fluxos de aprovação
- **006**: `add_lgpd_consent.sql` - Consentimento LGPD
- **007**: `create_nigredo_schema.sql` - Schema adicional Nigredo
- **008**: `create_billing_tables.sql` - Tabelas de billing
- **009**: `create_subscription_tables.sql` - Sistema de assinaturas
- **010**: `create_plans_structure.sql` - Estrutura de planos

## 🔧 Ajustes Realizados

### Compatibilidade Supabase

1. **Permissões de Usuário**:
   - Substituído `CURRENT_USER` por roles do Supabase: `postgres`, `anon`, `authenticated`, `service_role`
   - Adicionadas permissões específicas para cada role

2. **Schemas**:
   - Mantidos os 3 schemas originais
   - Grants ajustados para Supabase

3. **Triggers e Functions**:
   - Sintaxe ajustada para PostgreSQL 14+ (Supabase)
   - Funções mantidas compatíveis

4. **Indexes**:
   - Todos os indexes mantidos
   - Otimizados para queries comuns

## 📝 Como Usar

### Opção 1: Supabase Dashboard (Recomendado)

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Copie o conteúdo de `001_004_consolidated_base_schema.sql`
4. Cole no editor
5. Clique em **Run**

### Opção 2: Supabase CLI

```bash
# Instalar Supabase CLI (se necessário)
npm install -g supabase

# Login
supabase login

# Link ao projeto
supabase link --project-ref <seu-project-ref>

# Executar migration
supabase db push
```

### Opção 3: psql (Direto)

```bash
# Conectar ao banco Supabase
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Executar migration
\i supabase/migrations/001_004_consolidated_base_schema.sql
```

## ✅ Verificação Pós-Migration

Execute estas queries para verificar se tudo foi criado corretamente:

```sql
-- Verificar schemas
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name IN ('fibonacci_core', 'nigredo_leads', 'alquimista_platform');

-- Verificar tabelas Nigredo
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'nigredo_leads';

-- Verificar tabelas Platform
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'alquimista_platform';

-- Verificar tabelas Core
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'fibonacci_core';

-- Verificar migrations aplicadas
SELECT * FROM public.migrations ORDER BY applied_at DESC;
```

**Resultado Esperado**:
- 3 schemas criados
- 6 tabelas em `nigredo_leads`
- 6 tabelas em `alquimista_platform`
- 3 tabelas em `fibonacci_core`
- 4 registros em `public.migrations`

## 🔄 Dependências

### Esta Migration (001-004)
- **Depende de**: Nenhuma (primeira migration)
- **Requerida por**: Migrations 005-010

### Próximas Migrations (005-010)

Estas migrations dependem das tabelas criadas em 001-004:

- **005** depende de: `alquimista_platform.tenants`, `alquimista_platform.users`
- **006** depende de: `nigredo_leads.leads`
- **007** depende de: Schemas criados em 001
- **008** depende de: `alquimista_platform.tenants`
- **009** depende de: `alquimista_platform.tenants`, tabelas de 008
- **010** depende de: `alquimista_platform.agents`, tabelas de 009

## 🚨 Importante

### Antes de Executar

1. ✅ Faça backup do banco de dados
2. ✅ Teste em ambiente de desenvolvimento primeiro
3. ✅ Verifique se não há conflitos com tabelas existentes
4. ✅ Confirme que tem permissões adequadas

### Após Executar

1. ✅ Verifique se todas as tabelas foram criadas
2. ✅ Teste as foreign keys
3. ✅ Verifique os indexes
4. ✅ Teste os triggers

## 📊 Estrutura de Dados

### Relacionamentos Principais

```
alquimista_platform.tenants (1) ──→ (N) alquimista_platform.users
                            (1) ──→ (N) nigredo_leads.leads
                            (1) ──→ (N) alquimista_platform.agent_activations

alquimista_platform.agents (1) ──→ (N) alquimista_platform.agent_activations

nigredo_leads.leads (1) ──→ (N) nigredo_leads.interacoes
                    (1) ──→ (N) nigredo_leads.agendamentos

fibonacci_core.traces (1) ──→ (N) fibonacci_core.events
```

## 🔐 Segurança

### Row Level Security (RLS)

**IMPORTANTE**: Esta migration NÃO inclui políticas RLS. Você deve adicionar políticas RLS manualmente para:

1. `alquimista_platform.tenants` - Isolar dados por tenant
2. `alquimista_platform.users` - Controlar acesso de usuários
3. `nigredo_leads.leads` - Isolar leads por tenant
4. Demais tabelas conforme necessário

### Exemplo de Política RLS

```sql
-- Habilitar RLS
ALTER TABLE alquimista_platform.tenants ENABLE ROW LEVEL SECURITY;

-- Política: Usuários só veem seu próprio tenant
CREATE POLICY tenant_isolation ON alquimista_platform.tenants
    FOR ALL
    USING (id = auth.jwt() ->> 'tenant_id');
```

## 📚 Referências

- [Documentação Supabase](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Projeto Original AWS](../database/migrations/)

## 🆘 Troubleshooting

### Erro: "schema already exists"
**Solução**: Os schemas já existem. Você pode:
1. Dropar os schemas: `DROP SCHEMA IF EXISTS fibonacci_core CASCADE;`
2. Ou pular a criação dos schemas

### Erro: "permission denied"
**Solução**: Verifique se está usando o usuário `postgres` ou `service_role`

### Erro: "relation already exists"
**Solução**: Algumas tabelas já existem. Você pode:
1. Dropar as tabelas existentes
2. Ou comentar as linhas de criação dessas tabelas

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação do Supabase
2. Consulte os logs de erro no Dashboard
3. Entre em contato com a equipe de desenvolvimento

---

**Versão**: 1.0.0  
**Data**: 2025-01-17  
**Autor**: AlquimistaAI Team  
**Status**: ✅ Pronto para uso
