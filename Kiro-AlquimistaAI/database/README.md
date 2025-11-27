# 🗄️ Database - AlquimistaAI

---

## ⚡ Arquitetura Oficial (Janeiro 2025)

**Banco de Dados Oficial**: Aurora PostgreSQL Serverless v2 (AWS)  
**Região**: us-east-1  
**Arquitetura**: Lambda + API Gateway + Aurora + DynamoDB

### 📘 Documentação Aurora (Fluxo Oficial)

**COMECE AQUI** para o fluxo oficial de produção:

1. **[⚡ COMANDOS-RAPIDOS-AURORA.md](./COMANDOS-RAPIDOS-AURORA.md)** - Guia operacional Windows
   - Comandos prontos para copiar/colar
   - Passo a passo de aplicação (manual e automatizado)
   - Script auxiliar: `scripts/apply-migrations-aurora-dev.ps1`
   - Instruções para testar Lambda + API Gateway
   - Troubleshooting completo

2. **[📘 RESUMO-AURORA-OFICIAL.md](./RESUMO-AURORA-OFICIAL.md)** - Visão geral oficial
   - Arquitetura completa
   - Schemas e tabelas
   - Integração com Lambda
   - Testes de API

3. **[🔍 AURORA-MIGRATIONS-AUDIT.md](./AURORA-MIGRATIONS-AUDIT.md)** - Auditoria completa
   - Análise detalhada das 10 migrations
   - Inconsistências identificadas (migration 009 duplicada)
   - Validação de compatibilidade

4. **[📋 CONSOLIDACAO-AURORA-COMPLETA.md](./CONSOLIDACAO-AURORA-COMPLETA.md)** - Resumo do trabalho
   - O que foi realizado
   - Decisões técnicas
   - Próximos passos

### 🚀 Quick Start - Aplicar Migrations em Aurora DEV

```powershell
# 1. Validar repo localmente
.\scripts\validate-system-complete.ps1

# 2. Configurar conexão Aurora DEV
$env:PGHOST = "<seu_host_aurora_dev>"
$env:PGUSER = "<seu_usuario_dev>"
$env:PGDATABASE = "alquimista_dev"
$env:PGPASSWORD = "<sua_senha_dev>"

# 3. Aplicar migrations (automatizado)
.\scripts\apply-migrations-aurora-dev.ps1

# 4. Conferir estrutura
psql -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('fibonacci_core', 'nigredo_leads', 'alquimista_platform');"

# 5. Testar API
# Ver: database/COMANDOS-RAPIDOS-AURORA.md (seção 5)
```

### 🧪 Supabase (Legado/Opcional)

Documentação Supabase mantida em `supabase/` como referência histórica e laboratório opcional.  
**NÃO faz parte do fluxo oficial de deploy.**

---

## 📚 Documentação Disponível (Geral)

### Sistema de Assinatura (Novo!)

O sistema de assinatura foi implementado com documentação completa:

- **[🚀 Quick Start](./SUBSCRIPTION-SYSTEM-QUICK-START.md)** - Comece aqui!
- **[📑 Índice Completo](./SUBSCRIPTION-SYSTEM-INDEX.md)** - Navegação completa
- **[📊 Guia Visual](./SUBSCRIPTION-SYSTEM-VISUAL-GUIDE.md)** - Diagramas e fluxos
- **[✅ Resumo da Implementação](./TASK-1-IMPLEMENTATION-SUMMARY.md)** - Status e checklist

### Migrations

Todas as migrations estão em `migrations/` com documentação individual:

- `001_*.sql` - Estrutura inicial
- `002_*.sql` - ...
- `009_create_subscription_tables.sql` - **Sistema de Assinatura** ([README](./migrations/README-009.md))

### Seeds

Dados de teste e inicialização em `seeds/`:

- `001_*.sql` - Dados iniciais
- `002_*.sql` - ...
- `004_subscription_test_data.sql` - **Agentes e SubNúcleos** ([README](./seeds/README-004.md))

## 🚀 Quick Start

### Executar Migration do Sistema de Assinatura

```bash
psql -h localhost -U postgres -d alquimista_dev \
  -f database/migrations/009_create_subscription_tables.sql
```

### Executar Seed de Dados de Teste

```bash
psql -h localhost -U postgres -d alquimista_dev \
  -f database/seeds/004_subscription_test_data.sql
```

### Verificar Instalação

```sql
-- Verificar tabelas do sistema de assinatura
\dt trials commercial_requests payment_events

-- Verificar dados
SELECT COUNT(*) FROM agents WHERE status = 'active';      -- 12
SELECT COUNT(*) FROM subnucleos WHERE status = 'active';  -- 8
```

## 📊 Estrutura do Banco

### Tabelas Principais

| Tabela | Migration | Descrição |
|--------|-----------|-----------|
| `tenants` | 001 | Empresas clientes (multi-tenant) |
| `users` | 001 | Usuários do sistema |
| `agents` | 009 | Agentes AlquimistaAI (R$ 29,90/mês) |
| `subnucleos` | 009 | SubNúcleos Fibonacci (R$ 365,00/mês base) |
| `trials` | 009 | Testes gratuitos (24h ou 5 tokens) |
| `commercial_requests` | 009 | Solicitações de contato comercial |
| `payment_events` | 009 | Log de eventos de pagamento |

### Schemas

- `public` - Schema principal
- `nigredo` - Schema do núcleo de prospecção (se aplicável)

## 🔧 Manutenção

### Expirar Trials

```sql
SELECT expire_trials();
```

Recomendação: Executar a cada hora via Lambda EventBridge.

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

## 📝 Convenções

### Nomenclatura

- **Tabelas:** snake_case, plural (ex: `commercial_requests`)
- **Colunas:** snake_case (ex: `created_at`)
- **Índices:** `idx_<tabela>_<coluna(s)>` (ex: `idx_trials_user_target`)
- **Funções:** snake_case (ex: `expire_trials`)

### Timestamps

Todas as tabelas devem ter:
- `created_at TIMESTAMP DEFAULT NOW()`
- `updated_at TIMESTAMP DEFAULT NOW()`

Com trigger para atualizar `updated_at` automaticamente.

### Status

Usar CHECK constraints para validar valores:

```sql
status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'pending'))
```

## 🔍 Queries Úteis

### Listar Todas as Tabelas

```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Verificar Tamanho das Tabelas

```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Listar Índices

```sql
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### Verificar Conexões Ativas

```sql
SELECT 
  datname,
  usename,
  application_name,
  client_addr,
  state,
  query
FROM pg_stat_activity
WHERE datname = 'alquimista';
```

## 🆘 Troubleshooting

### Erro: Permissão Negada

```sql
-- Verificar permissões
\du

-- Conceder permissões (ajustar conforme necessário)
GRANT ALL PRIVILEGES ON DATABASE alquimista TO <username>;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO <username>;
```

### Erro: Tabela Já Existe

```sql
-- Verificar se tabela existe
SELECT tablename FROM pg_tables WHERE tablename = 'trials';

-- Fazer rollback se necessário
DROP TABLE IF EXISTS trials CASCADE;
```

### Erro: Conexão Recusada

Verificar:
1. PostgreSQL está rodando?
2. Credenciais corretas?
3. Host e porta corretos?
4. Firewall/Security Group permite conexão?

## 📚 Documentação Externa

### Specs do Projeto

- [Sistema de Assinatura - Requirements](../.kiro/specs/alquimista-subscription-system/requirements.md)
- [Sistema de Assinatura - Design](../.kiro/specs/alquimista-subscription-system/design.md)
- [Sistema de Assinatura - Tasks](../.kiro/specs/alquimista-subscription-system/tasks.md)

### Documentação de Negócio

- [Catálogo de Agentes](../docs/ecosystem/CATALOGO-COMPLETO-AGENTES.md)
- [Modelo de Negócio](../docs/ecosystem/BUSINESS-MODEL.md)
- [Blueprint Comercial](../.kiro/steering/blueprint-comercial-assinaturas.md)

## 🔐 Segurança

### Boas Práticas

- ✅ Nunca commitar credenciais no código
- ✅ Usar AWS Secrets Manager para credenciais
- ✅ Usar connection pooling (RDS Proxy)
- ✅ Habilitar SSL/TLS para conexões
- ✅ Fazer backup regular
- ✅ Testar restore de backup periodicamente

### Credenciais

Credenciais devem estar em:
- **Desenvolvimento:** `.env.local` (não commitado)
- **Produção:** AWS Secrets Manager

Exemplo de secret:
```json
{
  "host": "alquimista-prod.xxxxx.us-east-1.rds.amazonaws.com",
  "port": 5432,
  "database": "alquimista",
  "username": "alquimista_app",
  "password": "xxxxx"
}
```

## 📞 Suporte

Para dúvidas ou problemas:

1. Consulte a documentação específica do sistema
2. Verifique os logs de erro
3. Revise as specs do projeto
4. Entre em contato com a equipe de desenvolvimento

---

**Última atualização:** 2025-01-17  
**Versão do Schema:** 009
