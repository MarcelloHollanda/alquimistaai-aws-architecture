#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Gera arquivo de configuração de APIs para o frontend
.DESCRIPTION
    Script automatizado para gerar o arquivo api-config.json com URLs das APIs backend
.PARAMETER Environment
    Ambiente (dev ou prod)
.EXAMPLE
    .\scripts\generate-api-config.ps1 -Environment dev
.EXAMPLE
    .\scripts\generate-api-config.ps1 -Environment prod
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "prod")]
    [string]$Environment
)

# Configurações
$ErrorActionPreference = "Stop"
$ConfigDir = "./frontend/config"
$ConfigFile = "$ConfigDir/api-config.json"

Write-Host "🔧 Gerando configuração de APIs para $Environment..." -ForegroundColor Cyan
Write-Host ""

# Verificar se AWS CLI está instalado
try {
    $awsVersion = aws --version 2>&1
    Write-Host "✅ AWS CLI: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro: AWS CLI não está instalado." -ForegroundColor Red
    Write-Host "   Instale em: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Obtendo URLs das APIs..." -ForegroundColor Cyan

# Obter URL da API Fibonacci
try {
    $FIBONACCI_URL = aws cloudformation describe-stacks `
        --stack-name "FibonacciStack-$Environment" `
        --query "Stacks[0].Outputs[?OutputKey=='HttpApiUrl'].OutputValue" `
        --output text 2>&1

    if ($LASTEXITCODE -ne 0) {
        throw "Erro ao obter URL da API Fibonacci"
    }

    if (-not $FIBONACCI_URL) {
        throw "URL da API Fibonacci não encontrada"
    }

    # Remover trailing slash se existir
    $FIBONACCI_URL = $FIBONACCI_URL.TrimEnd('/')

    Write-Host "   ✅ Fibonacci: $FIBONACCI_URL" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erro ao obter URL da API Fibonacci" -ForegroundColor Red
    Write-Host "      Certifique-se de que a stack 'FibonacciStack-$Environment' foi deployada." -ForegroundColor Yellow
    exit 1
}

# Obter URL da API Nigredo
try {
    $NIGREDO_URL = aws cloudformation describe-stacks `
        --stack-name "NigredoStack-$Environment" `
        --query "Stacks[0].Outputs[?OutputKey=='HttpApiUrl'].OutputValue" `
        --output text 2>&1

    if ($LASTEXITCODE -ne 0) {
        throw "Erro ao obter URL da API Nigredo"
    }

    if (-not $NIGREDO_URL) {
        throw "URL da API Nigredo não encontrada"
    }

    # Remover trailing slash se existir
    $NIGREDO_URL = $NIGREDO_URL.TrimEnd('/')

    Write-Host "   ✅ Nigredo: $NIGREDO_URL" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erro ao obter URL da API Nigredo" -ForegroundColor Red
    Write-Host "      Certifique-se de que a stack 'NigredoStack-$Environment' foi deployada." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📝 Gerando arquivo de configuração..." -ForegroundColor Cyan

# Criar objeto de configuração
$config = @{
    environment = $Environment
    apis = @{
        fibonacci = @{
            baseUrl = $FIBONACCI_URL
            timeout = 30000
        }
        nigredo = @{
            baseUrl = $NIGREDO_URL
            timeout = 30000
        }
    }
    features = @{
        trialEnabled = $true
        checkoutEnabled = $true
    }
}

# Converter para JSON
$configJson = $config | ConvertTo-Json -Depth 10

# Criar diretório se não existir
if (-not (Test-Path $ConfigDir)) {
    Write-Host "   📁 Criando diretório: $ConfigDir" -ForegroundColor Gray
    New-Item -ItemType Directory -Force -Path $ConfigDir | Out-Null
}

# Salvar arquivo
try {
    $configJson | Out-File -FilePath $ConfigFile -Encoding UTF8 -Force
    Write-Host "   ✅ Arquivo salvo: $ConfigFile" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erro ao salvar arquivo: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Exibir conteúdo do arquivo
Write-Host "📄 Conteúdo do arquivo:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host $configJson -ForegroundColor Gray
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# Resumo final
Write-Host "✅ Configuração gerada com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Arquivo: $ConfigFile" -ForegroundColor Gray
Write-Host "🌍 Ambiente: $Environment" -ForegroundColor Gray
Write-Host "🔗 Fibonacci: $FIBONACCI_URL" -ForegroundColor Gray
Write-Host "🔗 Nigredo: $NIGREDO_URL" -ForegroundColor Gray
Write-Host ""
Write-Host "📤 Próximo passo: Fazer deploy do frontend" -ForegroundColor Cyan
Write-Host "   .\scripts\deploy-frontend-$Environment.ps1" -ForegroundColor Gray
Write-Host ""
