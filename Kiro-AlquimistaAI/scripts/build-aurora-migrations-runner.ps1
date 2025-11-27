# Script para Build da Lambda Aurora Migrations Runner
# Sistema: AlquimistaAI
# Componente: Pipeline de Migrations Seguro (dentro da VPC)

param(
    [string]$Environment = "dev"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BUILD: Aurora Migrations Runner Lambda" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# Validar que estamos na raiz do projeto
if (-not (Test-Path "lambda-src\aurora-migrations-runner")) {
    Write-Host "❌ ERRO: Diretório lambda-src\aurora-migrations-runner não encontrado!" -ForegroundColor Red
    Write-Host "Execute este script da raiz do projeto." -ForegroundColor Yellow
    exit 1
}

# Navegar para o diretório da Lambda
Set-Location "lambda-src\aurora-migrations-runner"

Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERRO: Falha ao instalar dependências" -ForegroundColor Red
    Set-Location "..\..\"
    exit 1
}

Write-Host "✅ Dependências instaladas" -ForegroundColor Green
Write-Host ""

Write-Host "🔨 Compilando TypeScript..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERRO: Falha ao compilar TypeScript" -ForegroundColor Red
    Set-Location "..\..\"
    exit 1
}

Write-Host "✅ TypeScript compilado" -ForegroundColor Green
Write-Host ""

# Copiar migrations para dist
Write-Host "📄 Copiando migrations SQL para dist..." -ForegroundColor Yellow
if (-not (Test-Path "dist\migrations")) {
    New-Item -ItemType Directory -Path "dist\migrations" -Force | Out-Null
}

Copy-Item "migrations\*.sql" "dist\migrations\" -Force

Write-Host "✅ Migrations copiadas" -ForegroundColor Green
Write-Host ""

# Copiar node_modules para dist (necessário para Lambda)
Write-Host "📦 Copiando node_modules para dist..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Copy-Item "node_modules" "dist\node_modules" -Recurse -Force
    Write-Host "✅ node_modules copiado" -ForegroundColor Green
} else {
    Write-Host "⚠️  AVISO: node_modules não encontrado" -ForegroundColor Yellow
}
Write-Host ""

# Voltar para raiz
Set-Location "..\..\"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ BUILD CONCLUÍDO COM SUCESSO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "  1. Deploy da stack CDK:" -ForegroundColor White
Write-Host "     cdk deploy AuroraMigrationsRunnerStack-$Environment --context env=$Environment" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Executar migration 017:" -ForegroundColor White
Write-Host "     .\scripts\run-migration-017.ps1 -Environment $Environment" -ForegroundColor Gray
Write-Host ""
