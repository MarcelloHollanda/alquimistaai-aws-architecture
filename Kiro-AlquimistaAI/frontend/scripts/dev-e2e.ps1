# Script para subir servidor dev com bypass E2E ativado
# Uso: .\scripts\dev-e2e.ps1

$env:E2E_BYPASS_AUTH = "true"
$env:NEXT_PUBLIC_E2E_BYPASS_AUTH = "true"
$env:NODE_ENV = "development"

Write-Host "🚀 Iniciando servidor dev com E2E Bypass ativado..." -ForegroundColor Green
Write-Host "⚠️  ATENÇÃO: Autenticação desabilitada para testes E2E" -ForegroundColor Yellow
Write-Host ""

npm run dev
