# Script Simples de Setup - Cognito Auth

Write-Host "Setup de Autenticacao com Cognito" -ForegroundColor Cyan
Write-Host "==================================`n" -ForegroundColor Cyan

# Passo 1: Copiar .env.example
Write-Host "[1/3] Copiando arquivo de ambiente..." -ForegroundColor Yellow
if (Test-Path "frontend/.env.local") {
    Write-Host "   .env.local ja existe" -ForegroundColor Yellow
} else {
    Copy-Item "frontend/.env.example" "frontend/.env.local"
    Write-Host "   .env.local criado!" -ForegroundColor Green
}

# Passo 2: Instalar dependências
Write-Host "`n[2/3] Instalando dependencias..." -ForegroundColor Yellow
Set-Location frontend
npm install amazon-cognito-identity-js zustand react-icons
npm install @radix-ui/react-label @radix-ui/react-select lucide-react
Write-Host "   Dependencias instaladas!" -ForegroundColor Green
Set-Location ..

# Passo 3: Verificar arquivos
Write-Host "`n[3/3] Verificando arquivos..." -ForegroundColor Yellow
$count = 0
if (Test-Path "frontend/src/lib/cognito-client.ts") { $count++ }
if (Test-Path "frontend/src/hooks/use-auth.ts") { $count++ }
if (Test-Path "frontend/src/app/auth/login/page.tsx") { $count++ }
if (Test-Path "frontend/src/app/auth/register/page.tsx") { $count++ }
if (Test-Path "frontend/src/app/app/settings/page.tsx") { $count++ }

Write-Host "   $count/5 arquivos principais encontrados" -ForegroundColor Green

# Resumo
Write-Host "`nSetup automatico concluido!" -ForegroundColor Green
Write-Host "==================================`n" -ForegroundColor Green

Write-Host "PROXIMOS PASSOS MANUAIS:" -ForegroundColor Cyan
Write-Host "1. Configure Cognito User Pool no AWS Console" -ForegroundColor White
Write-Host "2. Configure Google e Facebook OAuth" -ForegroundColor White
Write-Host "3. Preencha frontend/.env.local" -ForegroundColor White
Write-Host "4. Implemente as APIs do backend" -ForegroundColor White
Write-Host "5. Teste: cd frontend; npm run dev`n" -ForegroundColor White

Write-Host "Leia: frontend/AUTH-SETUP-README.md`n" -ForegroundColor Yellow
