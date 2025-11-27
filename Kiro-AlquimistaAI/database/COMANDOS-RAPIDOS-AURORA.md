# ⚡ Comandos Rápidos - Aurora PostgreSQL (Windows)

**Sistema Operacional**: Windows (PowerShell/cmd)  
**Banco de Dados**: Aurora PostgreSQL Serverless v2  
**Região AWS**: us-east-1

---

## 🎯 Guia de Bolso para o Fundador

Este documento contém comandos prontos para copiar e colar no PowerShell do Windows.

---

## 📋 Pré-Requisitos

### 1. Instalar PostgreSQL Client (psql)

```powershell
# Opção 1: Via Chocolatey
choco install postgresql

# Opção 2: Download manual
# https://www.postgresql.org/download/windows/
# Instalar apenas "Command Line Tools"
```

### 2. Verificar Instalação

```powershell
psql --version
# Deve mostrar: psql (PostgreSQL) 14.x ou superior
```

---

## 🔧 Configuração Inicial

### Definir Variáveis de Ambiente (DEV)

```powershell
# Copiar e colar no PowerShell
$env:PGHOST = "<seu_host_aurora_dev>"
$env:PGUSER = "<seu_usuario_dev>"
$env:PGDATABASE = "alquimista_dev"
$env:PGPASSWORD = "<sua_senha_dev>"
$env:PGPORT = "5432"

# Verificar
echo "Host: $env:PGHOST"
echo "User: $env:PGUSER"
echo "Database: $env:PGDATABASE"
```

### Definir Variáveis de Ambiente (PROD)

```powershell
# CUIDADO: Apenas para produção validada!
$env:PGHOST = "<seu_host_aurora_prod>"
$env:PGUSER = "<seu_usuario_prod>"
$env:PGDATABASE = "alquimista_prod"
$env:PGPASSWORD = "<sua_senha_prod>"
$env:PGPORT = "5432"

# Verificar
echo "Host: $env:PGHOST"
echo "User: $env:PGUSER"
echo "Database: $env:PGDATABASE"
```

---

## 🚀 Aplicar Migrations em Aurora (DEV)

### Fluxo Completo Recomendado

Este é o fluxo oficial para aplicar migrations em Aurora DEV e testar a integração com Lambda/API:

```
1. Validar repo localmente
   ↓
2. Configurar conexão Aurora DEV
   ↓
3. Aplicar migrations (001-010, pulando 009)
   ↓
4. Conferir estrutura criada
   ↓
5. Testar Lambda + API Gateway
```

---

### 1️⃣ Validar Migrations Localmente

**Antes de aplicar no Aurora**, valide que todas as migrations estão OK:

```powershell
# Ir para raiz do projeto
cd <caminho_do_projeto>

# Executar validador
.\scripts\validate-system-complete.ps1

# Resultado esperado: 
# ✅ 10/10 migrations encontradas
# ⚠️  Migration 009 marcada como duplicada (OK)
```

---

### 2️⃣ Configurar Conexão Aurora DEV

**Definir variáveis de ambiente** (substituir com seus valores reais):

```powershell
# Copiar e colar no PowerShell
$env:PGHOST = "<seu_host_aurora_dev>"
$env:PGUSER = "<seu_usuario_dev>"
$env:PGDATABASE = "alquimista_dev"
$env:PGPASSWORD = "<sua_senha_dev>"
$env:PGPORT = "5432"

# Verificar
echo "Host: $env:PGHOST"
echo "User: $env:PGUSER"
echo "Database: $env:PGDATABASE"
```

**Testar conexão**:

```powershell
# Teste simples
psql -c "SELECT version();"

# Deve retornar versão do PostgreSQL
# Exemplo: PostgreSQL 14.x on x86_64-pc-linux-gnu
```

---

### 3️⃣ Aplicar Migrations (Ordem Oficial)

#### Opção A: Script Automatizado (Recomendado)

```powershell
# Usar script auxiliar (requer variáveis de ambiente configuradas)
.\scripts\apply-migrations-aurora-dev.ps1

# OU passar parâmetros diretamente
.\scripts\apply-migrations-aurora-dev.ps1 -Host "<host_aurora_dev>" -User "<user_dev>" -Database "alquimista_dev" -Password "<senha_dev>"

# O script aplica automaticamente:
# - Migrations 001-008
# - Pula migration 009 (duplicada)
# - Aplica migration 010
# - Mostra progresso e erros
# - Valida conexão antes de iniciar
```

#### Opção B: Passo a Passo Manual

```powershell
# Ir para raiz do projeto
cd <caminho_do_projeto>

Write-Host "🚀 Iniciando aplicação de migrations..." -ForegroundColor Cyan

# Migrations 001-004 (Base)
psql -f database/migrations/001_initial_schema.sql
Write-Host "✅ Migration 001 aplicada" -ForegroundColor Green

psql -f database/migrations/002_tenants_users.sql
Write-Host "✅ Migration 002 aplicada" -ForegroundColor Green

psql -f database/migrations/003_agents_platform.sql
Write-Host "✅ Migration 003 aplicada" -ForegroundColor Green

psql -f database/migrations/004_fibonacci_core.sql
Write-Host "✅ Migration 004 aplicada" -ForegroundColor Green

# Migrations 005-007 (Features)
psql -f database/migrations/005_create_approval_tables.sql
Write-Host "✅ Migration 005 aplicada" -ForegroundColor Green

psql -f database/migrations/006_add_lgpd_consent.sql
Write-Host "✅ Migration 006 aplicada" -ForegroundColor Green

psql -f database/migrations/007_create_nigredo_schema.sql
Write-Host "✅ Migration 007 aplicada" -ForegroundColor Green

# Migration 008 (Billing)
psql -f database/migrations/008_create_billing_tables.sql
Write-Host "✅ Migration 008 aplicada" -ForegroundColor Green

# IMPORTANTE: NÃO aplicar migration 009 (duplicada)
Write-Host "⚠️  Pulando migration 009 (duplicada com 008)" -ForegroundColor Yellow

# Migration 010 (Planos)
psql -f database/migrations/010_create_plans_structure.sql
Write-Host "✅ Migration 010 aplicada" -ForegroundColor Green

Write-Host "✅ Todas as migrations aplicadas com sucesso!" -ForegroundColor Green
```

---

### 4️⃣ Conferir Estrutura em Aurora DEV

**Verificar schemas criados**:

```powershell
psql -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('fibonacci_core', 'nigredo_leads', 'alquimista_platform') ORDER BY schema_name;"

# Resultado esperado:
# alquimista_platform
# fibonacci_core
# nigredo_leads
```

**Verificar migrations aplicadas**:

```powershell
psql -c "SELECT migration_name, applied_at FROM public.migrations ORDER BY applied_at;"

# Deve listar 9 migrations (001-008, 010)
# Migration 009 NÃO deve aparecer
```

**Contar tabelas por schema**:

```powershell
psql -c "SELECT table_schema, COUNT(*) as table_count FROM information_schema.tables WHERE table_schema IN ('fibonacci_core', 'nigredo_leads', 'alquimista_platform', 'public') AND table_type = 'BASE TABLE' GROUP BY table_schema ORDER BY table_schema;"

# Resultado esperado:
# alquimista_platform | 9
# fibonacci_core      | 3
# nigredo_leads       | 9
# public              | 11+
```

**Listar todas as tabelas** (opcional):

```powershell
psql -c "SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema IN ('fibonacci_core', 'nigredo_leads', 'alquimista_platform', 'public') AND table_type = 'BASE TABLE' ORDER BY table_schema, table_name;"
```

---

### 5️⃣ Testar Lambda + API Gateway (DEV)

#### Obter URL da API DEV

A URL da API Gateway DEV deve estar nos outputs do CDK após deploy:

```powershell
# Listar outputs do stack Fibonacci (DEV)
aws cloudformation describe-stacks --stack-name FibonacciStack-dev --query "Stacks[0].Outputs" --region us-east-1

# Procurar por: FibonacciApiUrl ou similar
# Exemplo: https://c5loeivg0k.execute-api.us-east-1.amazonaws.com/
```

#### Testar Health Check

```powershell
# Definir URL da API (substituir com sua URL real)
$API_URL = "https://c5loeivg0k.execute-api.us-east-1.amazonaws.com"

# Testar health check
Invoke-WebRequest -Uri "$API_URL/health" -Method GET

# Resultado esperado:
# StatusCode: 200
# Body: {"ok": true, "service": "Fibonacci Orquestrador", "environment": "dev"}
```

#### Testar Rota de Agentes

```powershell
# Listar agentes
Invoke-WebRequest -Uri "$API_URL/api/agents" -Method GET

# Resultado esperado:
# StatusCode: 200
# Body: {"agents": [...]}
```

#### Testar Rota de Planos

```powershell
# Listar planos
Invoke-WebRequest -Uri "$API_URL/api/plans" -Method GET

# Resultado esperado:
# StatusCode: 200
# Body: {"plans": [...]}
```

#### Se Retornar Erro 500

```powershell
# 1. Verificar logs no CloudWatch
aws logs tail /aws/lambda/fibonacci-list-agents-dev --follow --region us-east-1

# 2. Verificar se migrations foram aplicadas
psql -c "SELECT COUNT(*) FROM public.migrations;"

# 3. Verificar credenciais da Lambda
# - Ir no console AWS Lambda
# - Verificar variáveis de ambiente (DB_HOST, DB_USER, etc.)
# - Verificar se Secrets Manager está configurado corretamente

# 4. Testar conexão da Lambda com Aurora
# - Verificar Security Group da Aurora (deve permitir Lambda)
# - Verificar VPC/Subnet da Lambda
```

---

### 6️⃣ Aplicar Seeds (Opcional)

Se quiser popular o banco com dados de teste:

```powershell
# Seeds básicos
psql -f database/seeds/002_default_permissions.sql
psql -f database/seeds/005_agents_32_complete.sql
psql -f database/seeds/006_subnucleos_and_plans.sql

# Verificar
psql -c "SELECT COUNT(*) FROM agents WHERE status = 'active';"
# Deve retornar: 32

psql -c "SELECT COUNT(*) FROM subnucleos WHERE status = 'active';"
# Deve retornar: 8+
```

---

## ✅ Validação Pós-Aplicação

### 1. Verificar Schemas Criados

```powershell
psql -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('fibonacci_core', 'nigredo_leads', 'alquimista_platform') ORDER BY schema_name;"

# Resultado esperado:
# alquimista_platform
# fibonacci_core
# nigredo_leads
```

### 2. Verificar Migrations Aplicadas

```powershell
psql -c "SELECT migration_name, applied_at FROM public.migrations ORDER BY applied_at;"

# Deve listar todas as migrations aplicadas com timestamps
```

### 3. Contar Tabelas por Schema

```powershell
psql -c "SELECT table_schema, COUNT(*) as table_count FROM information_schema.tables WHERE table_schema IN ('fibonacci_core', 'nigredo_leads', 'alquimista_platform', 'public') AND table_type = 'BASE TABLE' GROUP BY table_schema ORDER BY table_schema;"

# Resultado esperado:
# alquimista_platform | 9
# fibonacci_core      | 3
# nigredo_leads       | 9
# public              | 4+
```

### 4. Listar Todas as Tabelas

```powershell
psql -c "SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema IN ('fibonacci_core', 'nigredo_leads', 'alquimista_platform', 'public') AND table_type = 'BASE TABLE' ORDER BY table_schema, table_name;"
```

### 5. Verificar Functions Criadas

```powershell
psql -c "SELECT routine_schema, routine_name FROM information_schema.routines WHERE routine_schema IN ('fibonacci_core', 'nigredo_leads', 'alquimista_platform', 'public') ORDER BY routine_schema, routine_name;"

# Deve listar:
# - update_updated_at_column
# - calculate_trace_duration
# - cleanup_old_rate_limits
# - check_rate_limit
# - increment_rate_limit
# - expire_trials (se adicionada manualmente)
```

---

## 🧪 Testar Lambda + API Gateway

### 1. Testar Health Check (Dev)

```powershell
# Obter URL da API (substituir com sua URL)
$API_URL = "<sua_url_api_gateway_dev>"

# Testar health check
Invoke-WebRequest -Uri "$API_URL/health" -Method GET

# Resultado esperado: Status 200, body com "status": "ok"
```

### 2. Testar Rota de Agentes

```powershell
# Listar agentes
Invoke-WebRequest -Uri "$API_URL/api/agents" -Method GET

# Resultado esperado: Status 200, array de agentes
```

### 3. Testar Rota de Planos

```powershell
# Listar planos
Invoke-WebRequest -Uri "$API_URL/api/plans" -Method GET

# Resultado esperado: Status 200, array de planos
```

---

## 🔍 Troubleshooting

### Erro: "psql: command not found"

```powershell
# Adicionar PostgreSQL ao PATH
$env:PATH += ";C:\Program Files\PostgreSQL\14\bin"

# Verificar
psql --version
```

### Erro: "connection refused"

```powershell
# Verificar variáveis de ambiente
echo "Host: $env:PGHOST"
echo "Port: $env:PGPORT"
echo "Database: $env:PGDATABASE"

# Testar conectividade
Test-NetConnection -ComputerName $env:PGHOST -Port 5432

# Verificar Security Group da Aurora (deve permitir sua IP)
```

### Erro: "authentication failed"

```powershell
# Verificar credenciais
echo "User: $env:PGUSER"
echo "Password: $env:PGPASSWORD"

# Testar conexão manual
psql -h $env:PGHOST -U $env:PGUSER -d $env:PGDATABASE -c "SELECT 1;"
```

### Erro: "relation already exists"

```powershell
# Verificar se migration já foi aplicada
psql -c "SELECT * FROM public.migrations WHERE migration_name = '008_create_billing_tables';"

# Se já aplicada, pular
echo "⚠️ Migration já aplicada anteriormente"
```

### Erro: "schema does not exist"

```powershell
# Verificar se migration 001 foi aplicada
psql -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('fibonacci_core', 'nigredo_leads', 'alquimista_platform');"

# Se vazio, aplicar migration 001 primeiro
psql -f database/migrations/001_initial_schema.sql
```

---

## 🗄️ Backup e Restore

### Criar Backup Completo

```powershell
# Definir nome do arquivo
$BACKUP_FILE = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').dump"

# Criar backup
pg_dump -h $env:PGHOST -U $env:PGUSER -d $env:PGDATABASE -F c -f $BACKUP_FILE

echo "✅ Backup criado: $BACKUP_FILE"
```

### Criar Backup Apenas do Schema

```powershell
# Definir nome do arquivo
$SCHEMA_FILE = "schema_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"

# Criar backup do schema
pg_dump -h $env:PGHOST -U $env:PGUSER -d $env:PGDATABASE -s -f $SCHEMA_FILE

echo "✅ Schema exportado: $SCHEMA_FILE"
```

### Restaurar Backup

```powershell
# CUIDADO: Isso vai sobrescrever dados existentes!

# Restaurar backup completo
pg_restore -h $env:PGHOST -U $env:PGUSER -d $env:PGDATABASE -c backup_20250117_120000.dump

# Restaurar apenas dados (sem schema)
pg_restore -h $env:PGHOST -U $env:PGUSER -d $env:PGDATABASE -a backup_20250117_120000.dump
```

---

## 🧹 Manutenção

### Vacuum e Analyze

```powershell
# Vacuum completo
psql -c "VACUUM ANALYZE;"

echo "✅ Vacuum e analyze concluídos"
```

### Verificar Tamanho das Tabelas

```powershell
psql -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size FROM pg_tables WHERE schemaname IN ('fibonacci_core', 'nigredo_leads', 'alquimista_platform', 'public') ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC LIMIT 10;"
```

### Reindexar Banco

```powershell
# CUIDADO: Pode demorar em bancos grandes
psql -c "REINDEX DATABASE $env:PGDATABASE;"

echo "✅ Reindex concluído"
```

---

## 📊 Queries Úteis

### Listar Todos os Schemas

```powershell
psql -c "SELECT schema_name FROM information_schema.schemata ORDER BY schema_name;"
```

### Listar Todas as Tabelas

```powershell
psql -c "SELECT table_schema, table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE' ORDER BY table_schema, table_name;"
```

### Listar Todos os Indexes

```powershell
psql -c "SELECT schemaname, tablename, indexname FROM pg_indexes WHERE schemaname IN ('fibonacci_core', 'nigredo_leads', 'alquimista_platform', 'public') ORDER BY schemaname, tablename, indexname;"
```

### Verificar Conexões Ativas

```powershell
psql -c "SELECT datname, usename, application_name, client_addr, state FROM pg_stat_activity WHERE datname = '$env:PGDATABASE';"
```

### Verificar Slow Queries

```powershell
psql -c "SELECT query, calls, total_time, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

---

## 🔐 Segurança

### Verificar Permissões de Usuário

```powershell
psql -c "SELECT grantee, privilege_type FROM information_schema.role_table_grants WHERE table_schema IN ('fibonacci_core', 'nigredo_leads', 'alquimista_platform') AND grantee = '$env:PGUSER';"
```

### Listar Roles

```powershell
psql -c "SELECT rolname FROM pg_roles ORDER BY rolname;"
```

---

## 📚 Referências Rápidas

### Comandos psql Essenciais

```powershell
# Conectar ao banco
psql

# Listar databases
psql -c "\l"

# Listar schemas
psql -c "\dn"

# Listar tabelas
psql -c "\dt"

# Descrever tabela
psql -c "\d nome_da_tabela"

# Sair
psql -c "\q"
```

### Variáveis de Ambiente

```powershell
# Ver todas as variáveis PG
Get-ChildItem Env: | Where-Object { $_.Name -like "PG*" }

# Limpar variáveis
Remove-Item Env:PGHOST
Remove-Item Env:PGUSER
Remove-Item Env:PGDATABASE
Remove-Item Env:PGPASSWORD
```

---

## 🎯 Checklist de Deploy

### Antes de Aplicar Migrations

- [ ] Backup do banco atual (se houver dados)
- [ ] Variáveis de ambiente configuradas
- [ ] Conexão testada com Aurora
- [ ] Validador local executado (10/10 OK)
- [ ] Migrations revisadas

### Durante Aplicação

- [ ] Migrations 001-004 aplicadas
- [ ] Migrations 005-007 aplicadas
- [ ] Migration 008 aplicada (pulando 009)
- [ ] Migration 010 aplicada
- [ ] Validação pós-aplicação executada

### Após Aplicação

- [ ] Schemas criados verificados
- [ ] Tabelas contadas por schema
- [ ] Migrations registradas em `public.migrations`
- [ ] Lambda testada com Aurora
- [ ] API Gateway testada
- [ ] Logs CloudWatch verificados

---

## 🚨 Comandos de Emergência

### Reverter Última Migration (CUIDADO!)

```powershell
# Verificar última migration
psql -c "SELECT * FROM public.migrations ORDER BY applied_at DESC LIMIT 1;"

# Reverter manualmente (exemplo: migration 010)
# CUIDADO: Isso vai APAGAR dados!
psql -c "DROP TABLE IF EXISTS tenant_agents CASCADE;"
psql -c "DROP TABLE IF EXISTS tenant_subnucleos CASCADE;"
psql -c "DROP TABLE IF EXISTS tenant_subscriptions CASCADE;"
psql -c "DROP TABLE IF EXISTS subnucleo_agents CASCADE;"
psql -c "DROP TABLE IF EXISTS subnucleos CASCADE;"
psql -c "DROP TABLE IF EXISTS subscription_plans CASCADE;"
psql -c "DELETE FROM public.migrations WHERE migration_name = '010_create_plans_structure';"
```

### Resetar Banco Completo (CUIDADO!)

```powershell
# CUIDADO: Isso vai APAGAR TUDO!
psql -c "DROP SCHEMA IF EXISTS fibonacci_core CASCADE;"
psql -c "DROP SCHEMA IF EXISTS nigredo_leads CASCADE;"
psql -c "DROP SCHEMA IF EXISTS alquimista_platform CASCADE;"
psql -c "DROP TABLE IF EXISTS public.migrations CASCADE;"

echo "⚠️ Banco resetado! Aplicar migrations novamente."
```

---

## 📞 Suporte

### Documentação Relacionada

- `database/RESUMO-AURORA-OFICIAL.md` - Visão geral do sistema
- `database/AURORA-MIGRATIONS-AUDIT.md` - Auditoria completa
- `RESUMO-REFATORACAO-MIGRATIONS.md` - Histórico de refatoração

### Scripts Úteis

- `scripts/validate-system-complete.ps1` - Validador completo
- `scripts/deploy-backend.ps1` - Deploy do backend
- `scripts/post-deploy-validation.ps1` - Validação pós-deploy

---

**Última atualização**: 17 de janeiro de 2025  
**Versão**: 1.0  
**Status**: ✅ GUIA OPERACIONAL COMPLETO

