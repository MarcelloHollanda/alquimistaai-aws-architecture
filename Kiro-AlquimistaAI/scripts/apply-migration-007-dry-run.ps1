# Script para Aplicar Migration 007 - Tabela dry_run_log
# Sistema: AlquimistaAI
# Componente: Micro Agente de Disparos & Agendamentos
# Migration: 007_create_dry_run_log_table.sql

param(
    [string]$DbHost = $env:PGHOST,
    [string]$DbUser = $env:PGUSER,
    [string]$DbName = $env:PGDATABASE,
    [string]$DbPassword = $env:PGPASSWORD,
    [string]$DbPort = "5432"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "APLICAR MIGRATION 007 - DRY_RUN_LOG" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Validar parâmetros
if (-not $DbHost -or -not $DbUser -or -not $DbName) {
    Write-Host "❌ ERRO: Variáveis de conexão não configuradas!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Configure as variáveis de ambiente:" -ForegroundColor Yellow
    Write-Host '  $env:PGHOST = "<seu_host_aurora_dev>"' -ForegroundColor White
    Write-Host '  $env:PGUSER = "<seu_usuario_dev>"' -ForegroundColor White
    Write-Host '  $env:PGDATABASE = "alquimista_dev"' -ForegroundColor White
    Write-Host '  $env:PGPASSWORD = "<sua_senha_dev>"' -ForegroundColor White
    Write-Host ""
    Write-Host "Ou passe como parâmetros:" -ForegroundColor Yellow
    Write-Host '  .\scripts\apply-migration-007-dry-run.ps1 -DbHost "<host>" -DbUser "<user>" -DbName "<db>" -DbPassword "<pass>"' -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "Configuração:" -ForegroundColor Cyan
Write-Host "  Host: $DbHost" -ForegroundColor White
Write-Host "  User: $DbUser" -ForegroundColor White
Write-Host "  Database: $DbName" -ForegroundColor White
Write-Host "  Port: $DbPort" -ForegroundColor White
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
try {
    $testResult = psql -h $DbHost -U $DbUser -d $DbName -p $DbPort -c "SELECT version();" 2>&1
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

# Verificar se migration 007 existe
$migrationPath = ".kiro/specs/micro-agente-disparo-agendamento/migrations/007_create_dry_run_log_table.sql"

if (-not (Test-Path $migrationPath)) {
    Write-Host "❌ ERRO: Migration 007 não encontrada!" -ForegroundColor Red
    Write-Host "Caminho esperado: $migrationPath" -ForegroundColor Yellow
    exit 1
}

Write-Host "📄 Migration 007 - Tabela dry_run_log" -ForegroundColor Cyan
Write-Host "   Arquivo: $migrationPath" -ForegroundColor White
Write-Host ""

# Verificar se tabela já existe
Write-Host "Verificando se tabela já existe..." -ForegroundColor Yellow
$tableCheck = psql -h $DbHost -U $DbUser -d $DbName -p $DbPort -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'dry_run_log');" 2>&1

if ($tableCheck -match "t") {
    Write-Host "⚠️  AVISO: Tabela dry_run_log já existe!" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Deseja recriar a tabela? (s/n)"
    if ($continue -ne "s") {
        Write-Host "❌ Operação cancelada pelo usuário" -ForegroundColor Yellow
        exit 0
    }
    
    Write-Host ""
    Write-Host "Removendo tabela existente..." -ForegroundColor Yellow
    psql -h $DbHost -U $DbUser -d $DbName -p $DbPort -c "DROP TABLE IF EXISTS dry_run_log CASCADE;" 2>&1 | Out-Null
    Write-Host "✅ Tabela removida" -ForegroundColor Green
    Write-Host ""
}

# Aplicar migration
Write-Host "Aplicando migration 007..." -ForegroundColor Yellow
try {
    $result = psql -h $DbHost -U $DbUser -d $DbName -p $DbPort -f $migrationPath 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migration 007 aplicada com sucesso!" -ForegroundColor Green
        Write-Host ""
        
        # Verificar estrutura criada
        Write-Host "Verificando estrutura criada..." -ForegroundColor Yellow
        Write-Host ""
        
        # Listar colunas da tabela
        $columns = psql -h $DbHost -U $DbUser -d $DbName -p $DbPort -c "\d dry_run_log" 2>&1
        Write-Host $columns -ForegroundColor Gray
        Write-Host ""
        
        # Listar índices
        Write-Host "Índices criados:" -ForegroundColor Cyan
        $indexes = psql -h $DbHost -U $DbUser -d $DbName -p $DbPort -c "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'dry_run_log';" 2>&1
        Write-Host $indexes -ForegroundColor Gray
        Write-Host ""
        
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "SUCESSO!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Tabela dry_run_log criada com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Próximos passos:" -ForegroundColor Cyan
        Write-Host "  1. Build da Lambda dry-run:" -ForegroundColor White
        Write-Host "     .\scripts\build-micro-agente-dry-run.ps1" -ForegroundColor Gray
        Write-Host ""
        Write-Host "  2. Deploy via Terraform:" -ForegroundColor White
        Write-Host "     cd terraform\envs\dev" -ForegroundColor Gray
        Write-Host "     terraform apply" -ForegroundColor Gray
        Write-Host ""
        Write-Host "  3. Testar Lambda:" -ForegroundColor White
        Write-Host "     aws lambda invoke --function-name micro-agente-disparo-agendamento-dev-dry-run ..." -ForegroundColor Gray
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        
    } else {
        Write-Host "❌ ERRO ao aplicar migration!" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ ERRO ao aplicar migration!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

exit 0
