$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Teste Manual de Token Cognito" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configurações do Cognito
$clientId = "59fs99tv0sbrmelkqef83itenu"
$redirectUri = "http://localhost:3000/auth/callback"
$domain = "us-east-1y8p2tembv.auth.us-east-1.amazoncognito.com"

Write-Host "Configuração:" -ForegroundColor Yellow
Write-Host "  Client ID: $clientId"
Write-Host "  Redirect URI: $redirectUri"
Write-Host "  Domain: $domain"
Write-Host ""

# Pedir o código de autorização
Write-Host "INSTRUÇÕES:" -ForegroundColor Green
Write-Host "1. Abra o navegador em: http://localhost:3000"
Write-Host "2. Clique em 'Login com Google'"
Write-Host "3. Após o login, você será redirecionado para:"
Write-Host "   http://localhost:3000/auth/callback?code=XXXXXXX"
Write-Host "4. COPIE o valor do 'code' da URL (antes da página processar)"
Write-Host ""

$code = Read-Host "Cole o código de autorização aqui"

if ([string]::IsNullOrWhiteSpace($code)) {
    Write-Host "❌ Código não fornecido" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Testando troca de código por tokens..." -ForegroundColor Yellow
Write-Host ""

# Montar o body da requisição
$body = @{
    grant_type = "authorization_code"
    client_id = $clientId
    code = $code
    redirect_uri = $redirectUri
}

# Converter para URL-encoded
$bodyString = ($body.GetEnumerator() | ForEach-Object { "$($_.Key)=$([System.Uri]::EscapeDataString($_.Value))" }) -join "&"

Write-Host "Body da requisição:" -ForegroundColor Cyan
Write-Host $bodyString
Write-Host ""

# Fazer a requisição
$tokenUrl = "https://$domain/oauth2/token"

Write-Host "URL do token: $tokenUrl" -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-WebRequest `
        -Uri $tokenUrl `
        -Method POST `
        -ContentType "application/x-www-form-urlencoded" `
        -Body $bodyString `
        -UseBasicParsing

    Write-Host "✅ SUCESSO!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response Body:" -ForegroundColor Cyan
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
    Write-Host ""
    Write-Host "✅ O problema NÃO é configuração do Cognito!" -ForegroundColor Green
    Write-Host "   O problema está no código do frontend." -ForegroundColor Yellow
    
} catch {
    Write-Host "❌ ERRO!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Status: $($_.Exception.Response.StatusCode.Value__)" -ForegroundColor Red
    Write-Host ""
    
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        $reader.Close()
        
        Write-Host "Error Body:" -ForegroundColor Red
        Write-Host $errorBody
        Write-Host ""
        
        $errorJson = $errorBody | ConvertFrom-Json
        
        if ($errorJson.error -eq "invalid_grant") {
            Write-Host "❌ ERRO: invalid_grant" -ForegroundColor Red
            Write-Host ""
            Write-Host "Possíveis causas:" -ForegroundColor Yellow
            Write-Host "  1. redirect_uri diferente entre /authorize e /token"
            Write-Host "  2. Código já foi usado (códigos são de uso único)"
            Write-Host "  3. Código expirou (válido por ~10 minutos)"
            Write-Host "  4. PKCE: code_verifier ausente ou incorreto"
            Write-Host "  5. App Client não configurado corretamente"
            Write-Host ""
            Write-Host "Próximos passos:" -ForegroundColor Cyan
            Write-Host "  1. Tente novamente com um código NOVO"
            Write-Host "  2. Verifique se o App Client tem PKCE habilitado"
            Write-Host "  3. Verifique se o redirect_uri está registrado"
        }
        
    } catch {
        Write-Host "Não foi possível ler o corpo do erro" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
