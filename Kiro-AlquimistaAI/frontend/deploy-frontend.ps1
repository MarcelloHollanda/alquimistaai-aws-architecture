# Script de Deploy Automatizado do Frontend
# Alquimista.AI - Next.js + Vercel

Write-Host "Iniciando Deploy do Frontend..." -ForegroundColor Cyan
Write-Host ""

# Verificar se está no diretório frontend
if (-not (Test-Path "package.json")) {
    Write-Host "[ERRO] Execute este script do diretorio frontend/" -ForegroundColor Red
    exit 1
}

# Verificar variáveis de ambiente
Write-Host "Verificando variaveis de ambiente..." -ForegroundColor Yellow
if (-not (Test-Path ".env.production")) {
    Write-Host "AVISO: Arquivo .env.production nao encontrado!" -ForegroundColor Yellow
    Write-Host "Criando template..." -ForegroundColor Yellow
    
    @"
# API Backend
NEXT_PUBLIC_API_URL=https://[SEU-API-GATEWAY-URL]

# AWS Cognito
NEXT_PUBLIC_COGNITO_USER_POOL_ID=[SEU-USER-POOL-ID]
NEXT_PUBLIC_COGNITO_CLIENT_ID=[SEU-CLIENT-ID]
NEXT_PUBLIC_AWS_REGION=us-east-1

# Ambiente
NEXT_PUBLIC_ENV=production
"@ | Out-File -FilePath ".env.production" -Encoding UTF8
    
    Write-Host "[ERRO] Configure o arquivo .env.production com os valores do backend!" -ForegroundColor Red
    Write-Host "Valores disponiveis em: ../backend-outputs.json" -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] Variaveis de ambiente encontradas" -ForegroundColor Green
Write-Host ""

# Instalar dependências
Write-Host "Instalando dependencias..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Erro ao instalar dependencias!" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Dependencias instaladas" -ForegroundColor Green
Write-Host ""

# Build
Write-Host "Compilando aplicacao..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Erro na compilacao!" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Build concluido" -ForegroundColor Green
Write-Host ""

# Verificar Vercel CLI
Write-Host "Verificando Vercel CLI..." -ForegroundColor Yellow
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "AVISO: Vercel CLI nao encontrado!" -ForegroundColor Yellow
    Write-Host "Instalando..." -ForegroundColor Yellow
    npm i -g vercel
}
Write-Host "[OK] Vercel CLI OK" -ForegroundColor Green
Write-Host ""

# Deploy
Write-Host "Iniciando deploy no Vercel..." -ForegroundColor Cyan
Write-Host ""
vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[OK] Frontend deployado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Deploy completo!" -ForegroundColor Green
    Write-Host "Acesse sua aplicacao na URL fornecida acima" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "[ERRO] Deploy falhou!" -ForegroundColor Red
    Write-Host "Verifique os logs acima para detalhes" -ForegroundColor Yellow
    exit 1
}
