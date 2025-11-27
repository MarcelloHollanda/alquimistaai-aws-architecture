# Script para Aplicar Migrations em Aurora DEV
# Sistema: AlquimistaAI / Fibonacci Orquestrador B2B
# Banco: Aurora PostgreSQL Serverless v2
# Região: us-east-1
#
# IMPORTANTE: Este script aplica migrations 001-010, PULANDO a 009 (duplicada)

param(
    [string]$Host = $env:PGHOST,
    [string]$User = $env:PGUSER,
    [string]$Database = $env:PGDATABASE,
    [string]$Password = $env:PGPASSWORD,
    [string]$Port = "5432"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "APLICAR MIGRATIONS - AURORA DEV" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Validar parâmetros
if (-not $Host -or -not $User -or -not $Database) {
    Write-Host "❌ ERRO: Variáveis de conexão não configuradas!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Configure as variáveis de ambiente:" -ForegroundColor Yellow
    Write-Host '  $env:PGHOST = "<seu_host_aurora_dev>"' -ForegroundColor White
    Write-Host '  $env:PGUSER = "<seu_usuario_dev>"' -ForegroundColor White
    Write-Host '  $env:PGDATABASE = "alquimista_dev"' -ForegroundColor White
    Write-Host '  $env:PGPASSWORD = "<sua_senha_dev>"' -ForegroundColor White
    Write-Host ""
    Write-Host "Ou passe como parâmetros:" -ForegroundColor Yellow
    Write-Host '  .\scripts\apply-migrations-aurora-dev.ps1 -Host "<host>" -User "<user>" -Database "<db>" -Password "<pass>"' -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "Configuração:" -ForegroundColor Cyan
Write-Host "  Host: $Host" -ForegroundColor White
Write-Host "  User: $User" -ForegroundColor White
Write-Host "  Database: $Database" -ForegroundColor White
Write-Host "  Port: $Port" -ForegroundColor White
Write-Host ""

# Testar conexão
Write-Host "Testando conexão com Aurora..." -ForegroundColor Yellow
try {
    $testResult = psql -h $Host -U $User -d $Database -p $Port -c "SELECT version();" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ERRO: Não foi possível conectar ao Aurora!" -ForegroundColor Red
        Write-Host $testResult -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Conexão OK" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ ERRO: Não foi possível conectar ao Aurora!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

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

# Verificar se está na raiz do projeto
if (-not (Test-Path "database/migrations")) {
    Write-Host "❌ ERRO: Diretório database/migrations não encontrado!" -ForegroundColor Red
    Write-Host "Execute este script da raiz do projeto." -ForegroundColor Yellow
    exit 1
}

# Lista de migrations na ordem correta
$migrations = @(
    @{Number="001"; File="001_initial_schema.sql"; Description="Schemas base"},
    @{Number="002"; File="002_tenants_users.sql"; Description="Tabelas Nigredo Leads"},
    @{Number="003"; File="003_agents_platform.sql"; Description="Tabelas Alquimista Platform"},
    @{Number="004"; File="004_fibonacci_core.sql"; Description="Tabelas Fibonacci Core"},
    @{Number="005"; File="005_create_approval_tables.sql"; Description="Sistema de aprovações"},
    @{Number="006"; File="006_add_lgpd_consent.sql"; Description="Conformidade LGPD"},
    @{Number="007"; File="007_create_nigredo_schema.sql"; Description="Prospecção Nigredo"},
    @{Number="008"; File="008_create_billing_tables.sql"; Description="Sistema de billing"},
    @{Number="009"; File="009_create_subscription_tables.sql"; Description="PULAR (duplicada)"; Skip=$true},
    @{Number="010"; File="010_create_plans_structure.sql"; Description="Estrutura de planos"}
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "APLICANDO MIGRATIONS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$applied = 0
$skipped = 0
$errors = 0

foreach ($migration in $migrations) {
    $number = $migration.Number
    $file = $migration.File
    $description = $migration.Description
    $skip = $migration.Skip
    
    if ($skip) {
        Write-Host "⚠️  Migration $number - $description" -ForegroundColor Yellow
        Write-Host "    Pulando (duplicada com migration 008)" -ForegroundColor Yellow
        $skipped++
        continue
    }
    
    Write-Host "📄 Migration $number - $description" -ForegroundColor Cyan
    
    $migrationPath = "database/migrations/$file"
    
    if (-not (Test-Path $migrationPath)) {
        Write-Host "    ❌ Arquivo não encontrado: $migrationPath" -ForegroundColor Red
        $errors++
        continue
    }
    
    try {
        $result = psql -h $Host -U $User -d $Database -p $Port -f $migrationPath 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    ✅ Aplicada com sucesso" -ForegroundColor Green
            $applied++
        } else {
            Write-Host "    ❌ Erro ao aplicar migration" -ForegroundColor Red
            Write-Host "    $result" -ForegroundColor Red
            $errors++
            
            # Perguntar se quer continuar
            $continue = Read-Host "    Continuar com próximas migrations? (s/n)"
            if ($continue -ne "s") {
                Write-Host ""
                Write-Host "❌ Aplicação interrompida pelo usuário" -ForegroundColor Red
                exit 1
            }
        }
    } catch {
        Write-Host "    ❌ Erro ao aplicar migration" -ForegroundColor Red
        Write-Host "    $($_.Exception.Message)" -ForegroundColor Red
        $errors++
    }
    
    Write-Host ""
}

# Resumo
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUMO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Migrations aplicadas: $applied" -ForegroundColor Green
Write-Host "Migrations puladas: $skipped" -ForegroundColor Yellow
Write-Host "Erros: $errors" -ForegroundColor $(if ($errors -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($errors -eq 0) {
    Write-Host "✅ SUCESSO! Todas as migrations foram aplicadas." -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos passos:" -ForegroundColor Cyan
    Write-Host "  1. Conferir estrutura criada:" -ForegroundColor White
    Write-Host '     psql -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name IN (''fibonacci_core'', ''nigredo_leads'', ''alquimista_platform'');"' -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. Verificar migrations aplicadas:" -ForegroundColor White
    Write-Host '     psql -c "SELECT migration_name, applied_at FROM public.migrations ORDER BY applied_at;"' -ForegroundColor Gray
    Write-Host ""
    Write-Host "  3. Testar Lambda + API Gateway (DEV)" -ForegroundColor White
    Write-Host "     Ver: database/COMANDOS-RAPIDOS-AURORA.md (seção 5)" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "❌ ATENÇÃO! Houve erros durante a aplicação." -ForegroundColor Red
    Write-Host ""
    Write-Host "Revise os erros acima e:" -ForegroundColor Yellow
    Write-Host "  1. Verifique se as migrations anteriores foram aplicadas corretamente" -ForegroundColor White
    Write-Host "  2. Verifique os logs de erro" -ForegroundColor White
    Write-Host "  3. Consulte: database/COMANDOS-RAPIDOS-AURORA.md (seção Troubleshooting)" -ForegroundColor White
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

exit $errors
