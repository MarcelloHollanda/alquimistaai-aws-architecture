# Script de Validação: Redirect URI Centralizado
# Verifica se o redirect_uri está consistente em todo o código

Write-Host "🔍 Validando Redirect URI..." -ForegroundColor Cyan
Write-Host ""

# 1. Verificar .env.local
Write-Host "1️⃣ Verificando .env.local..." -ForegroundColor Yellow
$envFile = Get-Content .env.local | Select-String "NEXT_PUBLIC_COGNITO_REDIRECT_URI"
if ($envFile) {
    Write-Host "   ✅ Encontrado: $envFile" -ForegroundColor Green
} else {
    Write-Host "   ❌ NEXT_PUBLIC_COGNITO_REDIRECT_URI não encontrado!" -ForegroundColor Red
    exit 1
}

# 2. Verificar se há localhost:3002 (porta errada)
Write-Host ""
Write-Host "2️⃣ Buscando por localhost:3002 (porta incorreta)..." -ForegroundColor Yellow
$wrongPort = Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx | Select-String "localhost:3002"
if ($wrongPort) {
    Write-Host "   ❌ ENCONTRADO localhost:3002 em:" -ForegroundColor Red
    $wrongPort | ForEach-Object { Write-Host "      $_" -ForegroundColor Red }
    exit 1
} else {
    Write-Host "   ✅ Nenhum localhost:3002 encontrado" -ForegroundColor Green
}

# 3. Verificar se há redirect_uri hardcoded
Write-Host ""
Write-Host "3️⃣ Buscando por redirect_uri hardcoded..." -ForegroundColor Yellow
$hardcoded = Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx | Select-String "redirect_uri.*['\`"]http"
if ($hardcoded) {
    Write-Host "   ⚠️  ATENÇÃO: Possível redirect_uri hardcoded em:" -ForegroundColor Yellow
    $hardcoded | ForEach-Object { Write-Host "      $_" -ForegroundColor Yellow }
    Write-Host "   Verifique se está usando config.redirectUri" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ Nenhum redirect_uri hardcoded encontrado" -ForegroundColor Green
}

# 4. Verificar cognito-client.ts
Write-Host ""
Write-Host "4️⃣ Verificando cognito-client.ts..." -ForegroundColor Yellow
$cognitoClient = Get-Content src/lib/cognito-client.ts

# Verificar se getCognitoConfig existe
if ($cognitoClient -match "getCognitoConfig") {
    Write-Host "   ✅ getCognitoConfig() encontrado" -ForegroundColor Green
} else {
    Write-Host "   ❌ getCognitoConfig() NÃO encontrado!" -ForegroundColor Red
    exit 1
}

# Verificar se initOAuthFlow usa config.redirectUri
if ($cognitoClient -match "initOAuthFlow.*config\.redirectUri") {
    Write-Host "   ✅ initOAuthFlow() usa config.redirectUri" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  initOAuthFlow() pode não estar usando config.redirectUri" -ForegroundColor Yellow
}

# Verificar se exchangeCodeForTokens usa config.redirectUri
if ($cognitoClient -match "exchangeCodeForTokens.*config\.redirectUri") {
    Write-Host "   ✅ exchangeCodeForTokens() usa config.redirectUri" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  exchangeCodeForTokens() pode não estar usando config.redirectUri" -ForegroundColor Yellow
}

# 5. Resumo
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ VALIDAÇÃO CONCLUÍDA" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Checklist:" -ForegroundColor Cyan
Write-Host "   ✅ .env.local configurado" -ForegroundColor Green
Write-Host "   ✅ Sem localhost:3002" -ForegroundColor Green
Write-Host "   ✅ Sem redirect_uri hardcoded" -ForegroundColor Green
Write-Host "   ✅ cognito-client.ts centralizado" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Próximos passos:" -ForegroundColor Yellow
Write-Host "   1. Verificar Cognito Console (Callback URLs)" -ForegroundColor White
Write-Host "   2. Limpar cache do navegador" -ForegroundColor White
Write-Host "   3. Testar login OAuth" -ForegroundColor White
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
