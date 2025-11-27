#!/usr/bin/env pwsh
# 🔍 Script de Verificação de Status - Alquimista.AI Frontend
# Verifica se tudo está configurado corretamente

Write-Host ""
Write-Host "🔍 Verificação de Status - Alquimista.AI" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# 1. Verificar Node.js
Write-Host "1️⃣  Node.js" -ForegroundColor White
try {
    $nodeVersion = node --version
    $nodeMajor = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($nodeMajor -ge 18) {
        Write-Host "   ✅ Versão: $nodeVersion (OK)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Versão: $nodeVersion (Recomendado: 18+)" -ForegroundColor Yellow
        $allGood = $false
    }
} catch {
    Write-Host "   ❌ Não instalado" -ForegroundColor Red
    $allGood = $false
}

# 2. Verificar npm
Write-Host "2️⃣  npm" -ForegroundColor White
try {
    $npmVersion = npm --version
    Write-Host "   ✅ Versão: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Não instalado" -ForegroundColor Red
    $allGood = $false
}

# 3. Verificar package.json
Write-Host "3️⃣  package.json" -ForegroundColor White
if (Test-Path "package.json") {
    Write-Host "   ✅ Encontrado" -ForegroundColor Green
} else {
    Write-Host "   ❌ Não encontrado" -ForegroundColor Red
    $allGood = $false
}

# 4. Verificar node_modules
Write-Host "4️⃣  Dependências (node_modules)" -ForegroundColor White
if (Test-Path "node_modules") {
    Write-Host "   ✅ Instaladas" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Não instaladas (execute: npm install)" -ForegroundColor Yellow
    $allGood = $false
}

# 5. Verificar .env.local
Write-Host "5️⃣  Variáveis de Ambiente (.env.local)" -ForegroundColor White
if (Test-Path ".env.local") {
    Write-Host "   ✅ Configurado" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Não encontrado (será criado automaticamente)" -ForegroundColor Yellow
}

# 6. Verificar .env.production
Write-Host "6️⃣  Produção (.env.production)" -ForegroundColor White
if (Test-Path ".env.production") {
    Write-Host "   ✅ Configurado" -ForegroundColor Green
} else {
    Write-Host "   ❌ Não encontrado" -ForegroundColor Red
    $allGood = $false
}

# 7. Verificar estrutura de pastas
Write-Host "7️⃣  Estrutura de Pastas" -ForegroundColor White
$requiredPaths = @(
    "src/app/(institutional)/page.tsx",
    "src/app/(auth)/login/page.tsx",
    "src/app/(dashboard)/dashboard/page.tsx",
    "src/lib/api-client.ts"
)

$missingPaths = @()
foreach ($path in $requiredPaths) {
    if (-not (Test-Path $path)) {
        $missingPaths += $path
    }
}

if ($missingPaths.Count -eq 0) {
    Write-Host "   ✅ Todos os arquivos principais encontrados" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Arquivos faltando: $($missingPaths.Count)" -ForegroundColor Yellow
    foreach ($path in $missingPaths) {
        Write-Host "      - $path" -ForegroundColor Gray
    }
    $allGood = $false
}

# 8. Verificar conflitos de rotas
Write-Host "8️⃣  Conflitos de Rotas" -ForegroundColor White
if (Test-Path "src/app/(marketing)/page.tsx") {
    Write-Host "   ⚠️  Conflito detectado: (marketing)/page.tsx existe" -ForegroundColor Yellow
    Write-Host "      Execute: Remove-Item -Recurse src/app/(marketing)" -ForegroundColor Gray
    $allGood = $false
} else {
    Write-Host "   ✅ Sem conflitos" -ForegroundColor Green
}

# 9. Verificar API AWS
Write-Host "9️⃣  Conectividade API AWS" -ForegroundColor White
try {
    $response = Invoke-RestMethod -Uri "https://ogsd1547nd.execute-api.us-east-1.amazonaws.com/" -TimeoutSec 5
    if ($response.ok -eq $true) {
        Write-Host "   ✅ API PROD respondendo (db: $($response.db_status))" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  API respondeu mas com status inesperado" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  Não foi possível conectar (verifique internet)" -ForegroundColor Yellow
}

# 10. Verificar porta 3000
Write-Host "🔟 Porta 3000" -ForegroundColor White
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    Write-Host "   ⚠️  Porta 3000 em uso (outro processo rodando)" -ForegroundColor Yellow
    Write-Host "      PID: $($port3000.OwningProcess)" -ForegroundColor Gray
} else {
    Write-Host "   ✅ Porta 3000 disponível" -ForegroundColor Green
}

# Resumo Final
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "✅ Tudo pronto para começar!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Execute: .\START-DEV.ps1" -ForegroundColor White
} else {
    Write-Host "⚠️  Alguns problemas foram encontrados" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Corrija os problemas acima e tente novamente" -ForegroundColor Gray
}
Write-Host ""
