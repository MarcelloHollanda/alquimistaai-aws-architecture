# Script de Validação de Migrations Aurora
# Sistema: AlquimistaAI / Fibonacci Orquestrador B2B
# Banco: Aurora PostgreSQL Serverless v2
# Região: us-east-1
#
# PROPÓSITO: Validar estado real do banco Aurora vs migrations esperadas
# DECISÃO OFICIAL: Migrations 001-008, 010 aplicadas | Migration 009 PULADA

param(
    [string]$Host = $env:PGHOST,
    [string]$User = $env:PGUSER,
    [string]$Database = $env:PGDATABASE,
    [string]$Password = $env:PGPASSWORD,
    [string]$Port = "5432",
    [string]$SecretName = $null
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VALIDAÇÃO DE MIGRATIONS - AURORA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Se SecretName foi fornecido, buscar credenciais do Secrets Manager
if ($SecretName) {
    Write-Host "Buscando credenciais do AWS Secrets Manager..." -ForegroundColor Yellow
    try {
        $secretJson = aws secretsmanager get-secret-value --secret-id $SecretName --query SecretString --output text --region us-east-1
        $secret = $secretJson | ConvertFrom-Json
        
        $Host = $secret.host
        $User = $secret.username
        $Database = $secret.database
        $Password = $secret.password
        if ($secret.port) { $Port = $secret.port }
        
        Write-Host "✅ Credenciais obtidas do Secrets Manager" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "❌ ERRO: Não foi possível obter credenciais do Secrets Manager" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        exit 1
    }
}

# Validar parâmetros
if (-not $Host -or -not $User -or -not $Database) {
    Write-Host "❌ ERRO: Parâmetros de conexão não configurados!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Opção 1 - Variáveis de ambiente:" -ForegroundColor Yellow
    Write-Host '  $env:PGHOST = "<seu_host_aurora>"' -ForegroundColor White
    Write-Host '  $env:PGUSER = "<seu_usuario>"' -ForegroundColor White
    Write-Host '  $env:PGDATABASE = "<seu_database>"' -ForegroundColor White
    Write-Host '  $env:PGPASSWORD = "<sua_senha>"' -ForegroundColor White
    Write-Host ""
    Write-Host "Opção 2 - Parâmetros:" -ForegroundColor Yellow
    Write-Host '  .\scripts\validate-migrations-aurora.ps1 -Host "<host>" -User "<user>" -Database "<db>" -Password "<pass>"' -ForegroundColor White
    Write-Host ""
    Write-Host "Opção 3 - Secrets Manager:" -ForegroundColor Yellow
    Write-Host '  .\scripts\validate-migrations-aurora.ps1 -SecretName "/alquimista/dev/aurora/credentials"' -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "Configuração:" -ForegroundColor Cyan
Write-Host "  Host: $Host" -ForegroundColor White
Write-Host "  User: $User" -ForegroundColor White
Write-Host "  Database: $Database" -ForegroundColor White
Write-Host "  Port: $Port" -ForegroundColor White
Write-Host ""

# Verificar se psql está disponível
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    Write-Host "❌ ERRO: psql não encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Instale o PostgreSQL Client:" -ForegroundColor Yellow
    Write-Host "  choco install postgresql" -ForegroundColor White
    Write-Host "  OU baixe de: https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Testar conexão
Write-Host "Testando conexão com Aurora..." -ForegroundColor Yellow
$env:PGPASSWORD = $Password
try {
    $testResult = psql -h $Host -U $User -d $Database -p $Port -c "SELECT version();" -t 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ERRO: Não foi possível conectar ao Aurora!" -ForegroundColor Red
        Write-Host $testResult -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Conexão OK" -ForegroundColor Green
    Write-Host "   Versão: $($testResult.Trim())" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ ERRO: Não foi possível conectar ao Aurora!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Migrations esperadas (decisão oficial)
$expectedMigrations = @(
    @{Number="001"; File="001_initial_schema.sql"; Description="Schemas base"; Expected=$true},
    @{Number="002"; File="002_tenants_users.sql"; Description="Tabelas Nigredo Leads"; Expected=$true},
    @{Number="003"; File="003_agents_platform.sql"; Description="Tabelas Alquimista Platform"; Expected=$true},
    @{Number="004"; File="004_fibonacci_core.sql"; Description="Tabelas Fibonacci Core"; Expected=$true},
    @{Number="005"; File="005_create_approval_tables.sql"; Description="Sistema de aprovações"; Expected=$true},
    @{Number="006"; File="006_add_lgpd_consent.sql"; Description="Conformidade LGPD"; Expected=$true},
    @{Number="007"; File="007_create_nigredo_schema.sql"; Description="Prospecção Nigredo"; Expected=$true},
    @{Number="008"; File="008_create_billing_tables.sql"; Description="Sistema de billing"; Expected=$true},
    @{Number="009"; File="009_create_subscription_tables.sql"; Description="DUPLICADA - NÃO APLICAR"; Expected=$false},
    @{Number="010"; File="010_create_plans_structure.sql"; Description="Estrutura de planos"; Expected=$true}
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VALIDANDO ESTADO DAS MIGRATIONS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se tabela migrations existe
Write-Host "Verificando tabela public.migrations..." -ForegroundColor Yellow
$migrationsTableExists = psql -h $Host -U $User -d $Database -p $Port -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'migrations');" 2>&1

if ($migrationsTableExists -match "t") {
    Write-Host "✅ Tabela public.migrations existe" -ForegroundColor Green
} else {
    Write-Host "❌ ERRO: Tabela public.migrations não existe!" -ForegroundColor Red
    Write-Host "   Execute as migrations primeiro." -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Buscar migrations aplicadas
Write-Host "Buscando migrations aplicadas..." -ForegroundColor Yellow
$appliedMigrationsRaw = psql -h $Host -U $User -d $Database -p $Port -t -c "SELECT migration_name FROM public.migrations ORDER BY applied_at;" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERRO: Não foi possível consultar migrations aplicadas" -ForegroundColor Red
    Write-Host $appliedMigrationsRaw -ForegroundColor Red
    exit 1
}

$appliedMigrations = $appliedMigrationsRaw -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }

Write-Host "✅ Migrations aplicadas no banco: $($appliedMigrations.Count)" -ForegroundColor Green
Write-Host ""

# Validar cada migration
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ANÁLISE DETALHADA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$errors = 0
$warnings = 0
$ok = 0

foreach ($migration in $expectedMigrations) {
    $number = $migration.Number
    $file = $migration.File
    $description = $migration.Description
    $expected = $migration.Expected
    $applied = $appliedMigrations -contains $file
    
    if ($expected) {
        # Migration DEVE estar aplicada
        if ($applied) {
            Write-Host "✅ Migration $number - $description" -ForegroundColor Green
            Write-Host "   Arquivo: $file" -ForegroundColor Gray
            Write-Host "   Status: Aplicada (conforme esperado)" -ForegroundColor Gray
            $ok++
        } else {
            Write-Host "❌ Migration $number - $description" -ForegroundColor Red
            Write-Host "   Arquivo: $file" -ForegroundColor Gray
            Write-Host "   Status: NÃO APLICADA (deveria estar aplicada)" -ForegroundColor Red
            $errors++
        }
    } else {
        # Migration NÃO DEVE estar aplicada (009)
        if ($applied) {
            Write-Host "⚠️  Migration $number - $description" -ForegroundColor Yellow
            Write-Host "   Arquivo: $file" -ForegroundColor Gray
            Write-Host "   Status: APLICADA (não deveria estar aplicada - duplicada)" -ForegroundColor Yellow
            Write-Host "   Ação: Considere reverter ou manter (não causa problemas críticos)" -ForegroundColor Yellow
            $warnings++
        } else {
            Write-Host "✅ Migration $number - $description" -ForegroundColor Green
            Write-Host "   Arquivo: $file" -ForegroundColor Gray
            Write-Host "   Status: NÃO APLICADA (conforme esperado - duplicada)" -ForegroundColor Gray
            $ok++
        }
    }
    Write-Host ""
}

# Verificar migrations extras (não esperadas)
Write-Host "Verificando migrations extras..." -ForegroundColor Yellow
$expectedFiles = $expectedMigrations | ForEach-Object { $_.File }
$extraMigrations = $appliedMigrations | Where-Object { $_ -notin $expectedFiles }

if ($extraMigrations.Count -gt 0) {
    Write-Host "⚠️  Migrations extras encontradas (não esperadas):" -ForegroundColor Yellow
    foreach ($extra in $extraMigrations) {
        Write-Host "   - $extra" -ForegroundColor Yellow
    }
    $warnings++
} else {
    Write-Host "✅ Nenhuma migration extra encontrada" -ForegroundColor Green
}
Write-Host ""

# Validar schemas criados
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VALIDANDO SCHEMAS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$expectedSchemas = @("fibonacci_core", "nigredo_leads", "alquimista_platform")
$schemasQuery = "SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('fibonacci_core', 'nigredo_leads', 'alquimista_platform') ORDER BY schema_name;"
$existingSchemas = psql -h $Host -U $User -d $Database -p $Port -t -c $schemasQuery 2>&1

if ($LASTEXITCODE -eq 0) {
    $schemasArray = $existingSchemas -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }
    
    foreach ($schema in $expectedSchemas) {
        if ($schemasArray -contains $schema) {
            Write-Host "✅ Schema: $schema" -ForegroundColor Green
        } else {
            Write-Host "❌ Schema: $schema (NÃO ENCONTRADO)" -ForegroundColor Red
            $errors++
        }
    }
} else {
    Write-Host "⚠️  Não foi possível validar schemas" -ForegroundColor Yellow
    $warnings++
}
Write-Host ""

# Resumo Final
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUMO DA VALIDAÇÃO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Migrations OK: $ok" -ForegroundColor Green
Write-Host "Erros: $errors" -ForegroundColor $(if ($errors -gt 0) { "Red" } else { "Green" })
Write-Host "Avisos: $warnings" -ForegroundColor $(if ($warnings -gt 0) { "Yellow" } else { "Green" })
Write-Host ""

if ($errors -eq 0 -and $warnings -eq 0) {
    Write-Host "✅ ESTADO DO BANCO CONSISTENTE COM O FLUXO OFICIAL!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Migrations aplicadas: 001-008, 010 (009 pulada)" -ForegroundColor Green
    Write-Host "Schemas criados: fibonacci_core, nigredo_leads, alquimista_platform" -ForegroundColor Green
    Write-Host ""
    Write-Host "O banco está pronto para uso." -ForegroundColor Cyan
} elseif ($errors -eq 0) {
    Write-Host "⚠️  ESTADO DO BANCO OK COM AVISOS" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Revise os avisos acima. O banco pode ser usado, mas há inconsistências menores." -ForegroundColor Yellow
} else {
    Write-Host "❌ ESTADO DO BANCO INCONSISTENTE" -ForegroundColor Red
    Write-Host ""
    Write-Host "Corrija os erros antes de prosseguir:" -ForegroundColor Red
    Write-Host "  1. Verifique quais migrations estão faltando" -ForegroundColor White
    Write-Host "  2. Execute: .\scripts\apply-migrations-aurora-dev.ps1" -ForegroundColor White
    Write-Host "  3. Consulte: database/COMANDOS-RAPIDOS-AURORA.md" -ForegroundColor White
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Retornar código de saída apropriado
if ($errors -gt 0) {
    exit 1
} elseif ($warnings -gt 0) {
    exit 0  # Avisos não bloqueiam
} else {
    exit 0
}
