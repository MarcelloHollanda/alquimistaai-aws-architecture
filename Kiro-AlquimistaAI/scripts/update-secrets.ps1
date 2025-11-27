# Script para atualizar secrets do AWS Secrets Manager
# Uso: .\scripts\update-secrets.ps1

param(
    [Parameter(Mandatory=$false)]
    [string]$Service,
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1"
)

Write-Host "🔑 Fibonacci - Atualização de API Keys" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

function Update-WhatsAppSecret {
    Write-Host "📱 Configurando WhatsApp Business API" -ForegroundColor Yellow
    Write-Host ""
    
    $apiKey = Read-Host "Digite o WhatsApp API Token (ou Enter para pular)"
    
    if ([string]::IsNullOrWhiteSpace($apiKey)) {
        Write-Host "⏭️  Pulando WhatsApp..." -ForegroundColor Gray
        return
    }
    
    $secretString = @{
        apiKey = $apiKey
    } | ConvertTo-Json -Compress
    
    try {
        aws secretsmanager update-secret `
            --secret-id fibonacci/mcp/whatsapp `
            --secret-string $secretString `
            --region $Region | Out-Null
        
        Write-Host "✅ WhatsApp configurado com sucesso!" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Erro ao configurar WhatsApp: $_" -ForegroundColor Red
    }
    
    Write-Host ""
}

function Update-EnrichmentSecret {
    Write-Host "🔍 Configurando Data Enrichment APIs" -ForegroundColor Yellow
    Write-Host ""
    
    $googlePlacesApiKey = Read-Host "Digite o Google Places API Key (ou Enter para pular)"
    $linkedInClientId = Read-Host "Digite o LinkedIn Client ID (opcional, Enter para pular)"
    $linkedInClientSecret = Read-Host "Digite o LinkedIn Client Secret (opcional, Enter para pular)"
    $linkedInAccessToken = Read-Host "Digite o LinkedIn Access Token (opcional, Enter para pular)"
    
    if ([string]::IsNullOrWhiteSpace($googlePlacesApiKey) -and 
        [string]::IsNullOrWhiteSpace($linkedInClientId)) {
        Write-Host "⏭️  Pulando Enrichment..." -ForegroundColor Gray
        return
    }
    
    $secretString = @{
        googlePlacesApiKey = if ($googlePlacesApiKey) { $googlePlacesApiKey } else { "" }
        linkedInClientId = if ($linkedInClientId) { $linkedInClientId } else { "" }
        linkedInClientSecret = if ($linkedInClientSecret) { $linkedInClientSecret } else { "" }
        linkedInAccessToken = if ($linkedInAccessToken) { $linkedInAccessToken } else { "" }
    } | ConvertTo-Json -Compress
    
    try {
        aws secretsmanager update-secret `
            --secret-id fibonacci/mcp/enrichment `
            --secret-string $secretString `
            --region $Region | Out-Null
        
        Write-Host "✅ Enrichment configurado com sucesso!" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Erro ao configurar Enrichment: $_" -ForegroundColor Red
    }
    
    Write-Host ""
}

function Update-CalendarSecret {
    Write-Host "📅 Configurando Google Calendar API" -ForegroundColor Yellow
    Write-Host ""
    
    $clientId = Read-Host "Digite o Google Calendar Client ID (ou Enter para pular)"
    $clientSecret = Read-Host "Digite o Google Calendar Client Secret (ou Enter para pular)"
    $refreshToken = Read-Host "Digite o Google Calendar Refresh Token (ou Enter para pular)"
    
    if ([string]::IsNullOrWhiteSpace($clientId)) {
        Write-Host "⏭️  Pulando Calendar..." -ForegroundColor Gray
        return
    }
    
    $secretString = @{
        clientId = $clientId
        clientSecret = if ($clientSecret) { $clientSecret } else { "" }
        refreshToken = if ($refreshToken) { $refreshToken } else { "" }
    } | ConvertTo-Json -Compress
    
    try {
        aws secretsmanager update-secret `
            --secret-id fibonacci/mcp/calendar `
            --secret-string $secretString `
            --region $Region | Out-Null
        
        Write-Host "✅ Calendar configurado com sucesso!" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Erro ao configurar Calendar: $_" -ForegroundColor Red
    }
    
    Write-Host ""
}

function Show-CurrentSecrets {
    Write-Host "📋 Secrets Atuais:" -ForegroundColor Cyan
    Write-Host ""
    
    $secrets = @(
        "fibonacci/mcp/whatsapp",
        "fibonacci/mcp/enrichment",
        "fibonacci/mcp/calendar"
    )
    
    foreach ($secret in $secrets) {
        try {
            $value = aws secretsmanager get-secret-value `
                --secret-id $secret `
                --region $Region `
                --query SecretString `
                --output text 2>$null
            
            if ($value) {
                $json = $value | ConvertFrom-Json
                $keys = $json.PSObject.Properties.Name
                $configuredKeys = @()
                
                foreach ($key in $keys) {
                    if (![string]::IsNullOrWhiteSpace($json.$key)) {
                        $configuredKeys += $key
                    }
                }
                
                if ($configuredKeys.Count -gt 0) {
                    Write-Host "  ✅ $secret" -ForegroundColor Green
                    Write-Host "     Configurado: $($configuredKeys -join ', ')" -ForegroundColor Gray
                }
                else {
                    Write-Host "  ⚠️  $secret" -ForegroundColor Yellow
                    Write-Host "     Nenhuma chave configurada" -ForegroundColor Gray
                }
            }
            else {
                Write-Host "  ❌ $secret" -ForegroundColor Red
                Write-Host "     Não encontrado" -ForegroundColor Gray
            }
        }
        catch {
            Write-Host "  ❌ $secret" -ForegroundColor Red
            Write-Host "     Erro ao verificar" -ForegroundColor Gray
        }
        
        Write-Host ""
    }
}

function Show-Menu {
    Write-Host "Escolha uma opção:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  1. Configurar WhatsApp Business API"
    Write-Host "  2. Configurar Data Enrichment (Google Places + LinkedIn)"
    Write-Host "  3. Configurar Google Calendar API"
    Write-Host "  4. Configurar TODOS"
    Write-Host "  5. Ver secrets atuais"
    Write-Host "  0. Sair"
    Write-Host ""
    
    $choice = Read-Host "Digite sua escolha"
    return $choice
}

# Main
if ($Service) {
    switch ($Service.ToLower()) {
        "whatsapp" { Update-WhatsAppSecret }
        "enrichment" { Update-EnrichmentSecret }
        "calendar" { Update-CalendarSecret }
        "all" {
            Update-WhatsAppSecret
            Update-EnrichmentSecret
            Update-CalendarSecret
        }
        "show" { Show-CurrentSecrets }
        default {
            Write-Host "❌ Serviço inválido. Use: whatsapp, enrichment, calendar, all, ou show" -ForegroundColor Red
            exit 1
        }
    }
}
else {
    # Interactive mode
    do {
        $choice = Show-Menu
        
        switch ($choice) {
            "1" { Update-WhatsAppSecret }
            "2" { Update-EnrichmentSecret }
            "3" { Update-CalendarSecret }
            "4" {
                Update-WhatsAppSecret
                Update-EnrichmentSecret
                Update-CalendarSecret
            }
            "5" { Show-CurrentSecrets }
            "0" {
                Write-Host "👋 Até logo!" -ForegroundColor Cyan
                exit 0
            }
            default {
                Write-Host "❌ Opção inválida!" -ForegroundColor Red
            }
        }
        
        if ($choice -ne "0") {
            Write-Host ""
            Write-Host "Pressione Enter para continuar..." -ForegroundColor Gray
            Read-Host
            Clear-Host
            Write-Host "🔑 Fibonacci - Atualização de API Keys" -ForegroundColor Cyan
            Write-Host "=======================================" -ForegroundColor Cyan
            Write-Host ""
        }
    } while ($choice -ne "0")
}

Write-Host ""
Write-Host "Concluido!" -ForegroundColor Green
Write-Host ""
Write-Host "Para mais informacoes, consulte: CONFIGURACAO-API-KEYS.md" -ForegroundColor Gray
