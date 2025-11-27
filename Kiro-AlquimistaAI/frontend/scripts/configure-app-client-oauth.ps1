$ErrorActionPreference = "Stop"

$REGION = "us-east-1"
$USER_POOL_ID = "us-east-1_Y8p2TeMbv"
$CLIENT_ID = "59fs99tv0sbrmelkqef83itenu"

Write-Host "========================================"
Write-Host "  Configurar App Client OAuth"
Write-Host "========================================"
Write-Host "User Pool: $USER_POOL_ID"
Write-Host "Client ID: $CLIENT_ID"
Write-Host ""

Write-Host "[1/3] Verificando configuracao atual..."
$currentConfig = aws cognito-idp describe-user-pool-client `
    --region $REGION `
    --user-pool-id $USER_POOL_ID `
    --client-id $CLIENT_ID `
    --output json | ConvertFrom-Json

$clientName = $currentConfig.UserPoolClient.ClientName
Write-Host "Nome do Client: $clientName"
Write-Host ""

Write-Host "[2/3] Atualizando configuracao OAuth..."
try {
    aws cognito-idp update-user-pool-client `
        --region $REGION `
        --user-pool-id $USER_POOL_ID `
        --client-id $CLIENT_ID `
        --client-name $clientName `
        --callback-urls "http://localhost:3000/auth/callback" `
        --logout-urls "http://localhost:3000/auth/logout-callback" `
        --allowed-o-auth-flows "code" `
        --allowed-o-auth-scopes "openid" "email" `
        --allowed-o-auth-flows-user-pool-client `
        --supported-identity-providers "Google" `
        --no-generate-secret
    
    Write-Host "OK - App Client configurado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "ERRO - Falha ao configurar App Client" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[3/3] Verificando nova configuracao..."
$newConfig = aws cognito-idp describe-user-pool-client `
    --region $REGION `
    --user-pool-id $USER_POOL_ID `
    --client-id $CLIENT_ID `
    --query 'UserPoolClient.{CallbackURLs:CallbackURLs,LogoutURLs:LogoutURLs,AllowedOAuthFlows:AllowedOAuthFlows,AllowedOAuthScopes:AllowedOAuthScopes,AllowedOAuthFlowsUserPoolClient:AllowedOAuthFlowsUserPoolClient}' `
    --output json | ConvertFrom-Json

Write-Host ""
Write-Host "Configuracao aplicada:"
Write-Host "  Callback URLs: $($newConfig.CallbackURLs -join ', ')"
Write-Host "  Logout URLs: $($newConfig.LogoutURLs -join ', ')"
Write-Host "  OAuth Flows: $($newConfig.AllowedOAuthFlows -join ', ')"
Write-Host "  OAuth Scopes: $($newConfig.AllowedOAuthScopes -join ', ')"
Write-Host "  OAuth Enabled: $($newConfig.AllowedOAuthFlowsUserPoolClient)"
Write-Host ""
Write-Host "Proximo passo:"
Write-Host "  1. Reinicie o servidor de desenvolvimento (npm run dev)"
Write-Host "  2. Acesse http://localhost:3000"
Write-Host "  3. Faca login com Google"
