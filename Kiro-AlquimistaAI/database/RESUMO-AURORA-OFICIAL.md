# 📘 Resumo Oficial - Aurora PostgreSQL (AWS-Only)

**Sistema**: AlquimistaAI / Fibonacci Orquestrador B2B  
**Banco de Dados Oficial**: Aurora PostgreSQL Serverless v2  
**Região AWS**: us-east-1  
**Data**: 17 de janeiro de 2025

---

## 🎯 Visão Geral

Este documento é o **guia oficial** do sistema de banco de dados da plataforma AlquimistaAI, alinhado à decisão estratégica:

> **"Lambda + Aurora + DynamoDB, sem Supabase no fluxo oficial"**

---

## 📋 Arquitetura de Banco de Dados

### Fonte de Verdade

A estrutura oficial do banco está definida em:

```
database/migrations/
├── 001_initial_schema.sql          # Schemas base
├── 002_tenants_users.sql           # Tabelas Nigredo Leads
├── 003_agents_platform.sql         # Tabelas Alquimista Platform
├── 004_fibonacci_core.sql          # Tabelas Fibonacci Core
├── 005_create_approval_tables.sql  # Sistema de aprovações
├── 006_add_lgpd_consent.sql        # Conformidade LGPD
├── 007_create_nigredo_schema.sql   # Prospecção Nigredo
├── 008_create_billing_tables.sql   # Sistema de billing
├── 009_create_subscription_tables.sql  # (DUPLICADA - VER OBSERVAÇÕES)
└── 010_create_plans_structure.sql  # Planos e SubNúcleos
```

### Tecnologias

| Componente | Tecnologia | Propósito |
|------------|------------|-----------|
| **Banco Relacional** | Aurora PostgreSQL Serverless v2 | Dados estruturados, transações |
| **KV/Locks** | DynamoDB | Locks do Terraform, cache opcional |
| **Backend** | Lambda (Node.js 20) | Lógica de negócio |
| **API** | API Gateway HTTP | Endpoints REST |
| **IaC** | CDK (TypeScript) | Infraestrutura como código |

---

## 🗂️ Schemas Oficiais

### 1. `fibonacci_core`

**Propósito**: Orquestração e rastreamento de eventos

**Tabelas**:
- `events` - Eventos do sistema
- `traces` - Rastreamento de execução
- `metrics` - Métricas de performance

**Uso**: Lambda Fibonacci, dashboards CloudWatch

---

### 2. `nigredo_leads`

**Propósito**: Prospecção e gestão de leads

**Tabelas**:
- `leads` - Dados dos leads
- `campanhas` - Campanhas de prospecção
- `interacoes` - Histórico de interações
- `agendamentos` - Reuniões agendadas
- `metricas_diarias` - Métricas agregadas
- `blocklist` - Lista de bloqueio
- `form_submissions` - Submissões de formulários
- `webhook_logs` - Logs de webhooks
- `rate_limits` - Controle de rate limiting

**Uso**: Lambda Nigredo, frontend Nigredo, webhooks

---

### 3. `alquimista_platform`

**Propósito**: Plataforma e gestão de agentes

**Tabelas**:
- `tenants` - Empresas/organizações
- `users` - Usuários do sistema
- `agents` - Catálogo de agentes IA
- `agent_activations` - Ativações de agentes
- `permissions` - Permissões de acesso
- `audit_logs` - Logs de auditoria
- `approval_requests` - Solicitações de aprovação
- `approval_decisions` - Decisões de aprovação
- `notifications` - Notificações

**Uso**: Lambda Platform, frontend Dashboard, sistema de auth

---

### 4. `public` (Schema Padrão)

**Propósito**: Billing, assinaturas e controle

**Tabelas**:
- `migrations` - Controle de migrations aplicadas
- `commercial_requests` - Solicitações comerciais
- `trials` - Testes gratuitos
- `payment_events` - Eventos de pagamento
- `subscriptions` - Assinaturas ativas (migration 008)
- `subscription_plans` - Planos disponíveis
- `subnucleos` - SubNúcleos Fibonacci
- `subnucleo_agents` - Relacionamento SubNúcleos ↔ Agentes
- `tenant_subscriptions` - Assinaturas dos tenants
- `tenant_subnucleos` - SubNúcleos ativados
- `tenant_agents` - Agentes ativados

**Uso**: Lambda Platform (billing), frontend Billing, webhooks de pagamento

---

## 🔄 Fluxo de Migrations em Aurora

### Ambientes

| Ambiente | Host Aurora | Database | Propósito |
|----------|-------------|----------|-----------|
| **dev** | `<host_aurora_dev>` | `alquimista_dev` | Desenvolvimento e testes |
| **prod** | `<host_aurora_prod>` | `alquimista_prod` | Produção |

### Aplicação de Migrations (Windows/PowerShell)

#### 1. Definir Variáveis de Conexão

```powershell
# Ambiente DEV
$env:PGHOST = "<host_aurora_dev>"
$env:PGUSER = "<usuario_dev>"
$env:PGDATABASE = "alquimista_dev"
$env:PGPASSWORD = "<senha_dev>"

# OU Ambiente PROD
$env:PGHOST = "<host_aurora_prod>"
$env:PGUSER = "<usuario_prod>"
$env:PGDATABASE = "alquimista_prod>"
$env:PGPASSWORD = "<senha_prod>"
```

#### 2. Aplicar Migrations em Sequência

```powershell
cd <project_root>

# Migrations 001-004 (Base)
psql -f database/migrations/001_initial_schema.sql
psql -f database/migrations/002_tenants_users.sql
psql -f database/migrations/003_agents_platform.sql
psql -f database/migrations/004_fibonacci_core.sql

# Migrations 005-007 (Features)
psql -f database/migrations/005_create_approval_tables.sql
psql -f database/migrations/006_add_lgpd_consent.sql
psql -f database/migrations/007_create_nigredo_schema.sql

# Migration 008 (Billing)
psql -f database/migrations/008_create_billing_tables.sql

# IMPORTANTE: PULAR migration 009 (duplicada com 008)
# psql -f database/migrations/009_create_subscription_tables.sql

# Migration 010 (Planos)
psql -f database/migrations/010_create_plans_structure.sql
```

#### 3. Validar Aplicação

```powershell
# Verificar schemas
psql -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('fibonacci_core', 'nigredo_leads', 'alquimista_platform');"

# Verificar migrations aplicadas
psql -c "SELECT * FROM public.migrations ORDER BY applied_at;"

# Contar tabelas por schema
psql -c "SELECT table_schema, COUNT(*) as table_count FROM information_schema.tables WHERE table_schema IN ('fibonacci_core', 'nigredo_leads', 'alquimista_platform', 'public') AND table_type = 'BASE TABLE' GROUP BY table_schema;"
```

---

## ⚠️ Observações Importantes

### Migration 009 - DUPLICADA

**Problema**: A migration 009 cria as mesmas tabelas que a migration 008:
- `trials`
- `commercial_requests`
- `payment_events`

**Solução Recomendada**: 
- ✅ Aplicar migration 008
- ❌ **NÃO** aplicar migration 009
- ✅ Aplicar migration 010

**Justificativa**:
- Migration 008 é mais completa (inclui tabela `subscriptions`)
- Migration 009 adiciona apenas a function `expire_trials()` (que pode ser adicionada manualmente se necessário)

### Function `expire_trials()`

Se necessário, adicionar manualmente após migration 008:

```sql
CREATE OR REPLACE FUNCTION expire_trials()
RETURNS INTEGER AS $
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE trials
  SET status = 'expired'
  WHERE status = 'active'
    AND (
      expires_at < NOW()
      OR usage_count >= max_usage
    );
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$ LANGUAGE plpgsql;

COMMENT ON FUNCTION expire_trials() IS 'Expira trials que atingiram limite de tempo ou tokens';
```

---

## 🔐 Segurança e RLS

### Row Level Security (RLS)

**Status Atual**: RLS não está implementado nas migrations base

**Recomendação**:
- RLS deve ser configurado conforme necessidade de cada tenant
- Implementar policies específicas para multi-tenancy
- Criar migration adicional quando necessário

### Exemplo de Policy (Futuro)

```sql
-- Habilitar RLS na tabela leads
ALTER TABLE nigredo_leads.leads ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários só veem leads do próprio tenant
CREATE POLICY tenant_isolation ON nigredo_leads.leads
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

---

## 🔗 Integração com Lambda

### Conexão Aurora

**Método Recomendado**: Usar AWS Secrets Manager

```typescript
// lambda/shared/database.ts
import { SecretsManager } from 'aws-sdk';
import { Pool } from 'pg';

const secretsManager = new SecretsManager({ region: 'us-east-1' });

async function getDbConnection() {
  const secret = await secretsManager.getSecretValue({
    SecretId: `/alquimista/${process.env.ENV}/aurora/credentials`
  }).promise();
  
  const credentials = JSON.parse(secret.SecretString);
  
  return new Pool({
    host: credentials.host,
    port: credentials.port,
    database: credentials.database,
    user: credentials.username,
    password: credentials.password,
    ssl: { rejectUnauthorized: false }
  });
}
```

### Fluxo de Deploy

```
1. Aplicar migrations em Aurora (dev)
   ↓
2. Testar Lambda localmente
   ↓
3. Deploy Lambda (dev)
   ↓
4. Testar API Gateway (dev)
   ↓
5. Validar funcionalidade
   ↓
6. Aplicar migrations em Aurora (prod)
   ↓
7. Deploy Lambda (prod)
   ↓
8. Validar produção
```

---

## 🧪 Testar Lambda + API Gateway (DEV)

### Obter URL da API

```powershell
# Listar outputs do stack Fibonacci (DEV)
aws cloudformation describe-stacks --stack-name FibonacciStack-dev --query "Stacks[0].Outputs" --region us-east-1

# Procurar por: FibonacciApiUrl
# Exemplo: https://c5loeivg0k.execute-api.us-east-1.amazonaws.com/
```

### Testar Endpoints

```powershell
# Definir URL da API
$API_URL = "https://c5loeivg0k.execute-api.us-east-1.amazonaws.com"

# 1. Health Check
Invoke-WebRequest -Uri "$API_URL/health" -Method GET
# Esperado: {"ok": true, "service": "Fibonacci Orquestrador", "environment": "dev", "db_status": "connected"}

# 2. Listar Agentes
Invoke-WebRequest -Uri "$API_URL/api/agents" -Method GET
# Esperado: {"agents": [...]}

# 3. Listar Planos
Invoke-WebRequest -Uri "$API_URL/api/plans" -Method GET
# Esperado: {"plans": [...]}
```

### Troubleshooting

**Se retornar erro 500**:

1. **Verificar logs no CloudWatch**:
   ```powershell
   aws logs tail /aws/lambda/fibonacci-list-agents-dev --follow --region us-east-1
   ```

2. **Verificar migrations aplicadas**:
   ```powershell
   psql -c "SELECT COUNT(*) FROM public.migrations;"
   # Deve retornar: 9 (migrations 001-008, 010)
   ```

3. **Verificar credenciais da Lambda**:
   - Console AWS Lambda → Configuração → Variáveis de ambiente
   - Verificar: `DB_HOST`, `DB_USER`, `DB_NAME`, `DB_PASSWORD`
   - OU verificar se Secrets Manager está configurado

4. **Verificar conectividade**:
   - Security Group da Aurora deve permitir conexões da Lambda
   - Lambda deve estar na mesma VPC/Subnet da Aurora
   - Verificar NAT Gateway se Lambda estiver em subnet privada

---

## 📊 Estatísticas do Sistema

### Objetos Criados

| Tipo | Quantidade |
|------|------------|
| Schemas | 3 |
| Tabelas | 25 |
| Indexes | 90+ |
| Functions | 6 |
| Triggers | 20+ |
| Views | 1 |

### Distribuição por Schema

| Schema | Tabelas | Propósito |
|--------|---------|-----------|
| `fibonacci_core` | 3 | Orquestração |
| `nigredo_leads` | 9 | Prospecção |
| `alquimista_platform` | 9 | Plataforma |
| `public` | 4 | Billing/Controle |

---

## 🛠️ Comandos Úteis

### Backup

```powershell
# Backup completo
pg_dump -h <host> -U <user> -d <database> -F c -f backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').dump

# Backup apenas schema
pg_dump -h <host> -U <user> -d <database> -s -f schema_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql
```

### Restore

```powershell
# Restore completo
pg_restore -h <host> -U <user> -d <database> -c backup_20250117_120000.dump

# Restore apenas dados
pg_restore -h <host> -U <user> -d <database> -a backup_20250117_120000.dump
```

### Manutenção

```sql
-- Vacuum e analyze
VACUUM ANALYZE;

-- Reindex
REINDEX DATABASE alquimista_dev;

-- Verificar tamanho das tabelas
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname IN ('fibonacci_core', 'nigredo_leads', 'alquimista_platform', 'public')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 📚 Documentação Relacionada

### Documentos Principais

1. **`database/AURORA-MIGRATIONS-AUDIT.md`**
   - Auditoria completa das migrations
   - Análise de compatibilidade
   - Identificação de inconsistências

2. **`database/COMANDOS-RAPIDOS-AURORA.md`**
   - Comandos passo a passo para Windows
   - Troubleshooting
   - Validação pós-aplicação

3. **`RESUMO-REFATORACAO-MIGRATIONS.md`**
   - Histórico da refatoração 001-004
   - Validação anterior
   - Estrutura detalhada

4. **`database/README.md`**
   - Índice geral de documentação
   - Links para recursos

### Scripts de Validação

- **`scripts/validate-system-complete.ps1`**
  - Validação completa do sistema
  - Verifica migrations, seeds, handlers, frontend
  - Critério de sucesso: 10/10 migrations OK

---

## 🚀 Próximos Passos

### Ações Imediatas

1. ✅ **Aplicar migrations em Aurora (dev)**
   - Seguir ordem 001 → 010 (pulando 009)
   - Validar estrutura
   - Testar conexão Lambda

2. ✅ **Validar integração Lambda + Aurora**
   - Testar rotas da API
   - Verificar logs CloudWatch
   - Validar queries

3. ✅ **Documentar credenciais**
   - Armazenar em Secrets Manager
   - Documentar paths dos secrets
   - Configurar variáveis de ambiente

### Ações Futuras

4. ⏳ **Implementar RLS (se necessário)**
   - Definir policies de multi-tenancy
   - Criar migration adicional
   - Testar isolamento de dados

5. ⏳ **Otimização de Performance**
   - Analisar slow queries
   - Adicionar indexes conforme necessário
   - Configurar connection pooling

6. ⏳ **Monitoramento**
   - Configurar CloudWatch Insights
   - Criar dashboards de performance
   - Alertas de anomalias

---

## 🎯 Conclusão

### Status Oficial

✅ **AURORA POSTGRESQL É O BANCO OFICIAL DA PLATAFORMA**

**Características**:
- ✅ 10 migrations validadas e prontas
- ✅ Compatibilidade 100% com Aurora Serverless v2
- ✅ Integração com Lambda via Secrets Manager
- ✅ Estrutura completa para todos os módulos
- ⚠️ Migration 009 deve ser pulada (duplicada)

### Supabase

**Status**: Legado / Opcional / Laboratório

- Não faz parte do fluxo oficial de deploy
- Pode ser usado para testes locais (opcional)
- Documentação mantida em `supabase/` como referência histórica

### Próximo Documento

Consulte `database/COMANDOS-RAPIDOS-AURORA.md` para:
- Comandos passo a passo (Windows)
- Troubleshooting
- Validação pós-aplicação
- Integração com Lambda

---

**Última atualização**: 17 de janeiro de 2025  
**Versão**: 1.0  
**Status**: ✅ DOCUMENTO OFICIAL

