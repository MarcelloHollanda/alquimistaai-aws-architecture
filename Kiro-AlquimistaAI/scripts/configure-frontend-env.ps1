# Script para Configurar Variáveis de Ambiente do Frontend
# Extrai valores do deploy do CDK e configura o frontend

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "prod")]
    [string]$Environment,
    
    [string]$Region = "us-east-1",
    [string]$OutputFile = "frontend/.env.local"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configurando Frontend - $($Environment.ToUpper())" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Obtendo outputs do CDK..." -ForegroundColor Yellow

# Função para obter output do CloudFormation
function Get-StackOutput {
    param(
        [string]$StackName,
        [string]$OutputKey
    )
    
    try {
        $output = aws cloudformation describe-stacks `
            --stack-name $StackName `
            --region $Region `
            --query "Stacks[0].Outputs[?OutputKey=='$OutputKey'].OutputValue" `
            --output text 2>&1
        
        if ($output -and $output -ne "None") {
            return $output
        }
        return $null
    } catch {
        return $null
    }
}

# Obter outputs do AlquimistaStack
$alquimistaStackName = "AlquimistaStack-$Environment"
Write-Host "Obtendo outputs de $alquimistaStackName..." -ForegroundColor Gray

$platformApiUrl = Get-StackOutput -StackName $alquimistaStackName -OutputKey "PlatformApiUrl"
if (-not $platformApiUrl) {
    Write-Host "⚠️  Platform API URL não encontrada" -ForegroundColor Yellow
    $platformApiUrl = "https://CONFIGURE_ME.execute-api.$Region.amazonaws.com"
}
Write-Host "  Platform API URL: $platformApiUrl" -ForegroundColor Gray

# Obter outputs do FibonacciStack (Cognito)
$fibonacciStackName = "FibonacciStack-$Environment"
Write-Host "Obtendo outputs de $fibonacciStackName..." -ForegroundColor Gray

$userPoolId = Get-StackOutput -StackName $fibonacciStackName -OutputKey "UserPoolId"
if (-not $userPoolId) {
    Write-Host "⚠️  User Pool ID não encontrado" -ForegroundColor Yellow
    $userPoolId = "us-east-1_CONFIGURE_ME"
}
Write-Host "  User Pool ID: $userPoolId" -ForegroundColor Gray

$userPoolClientId = Get-StackOutput -StackName $fibonacciStackName -OutputKey "UserPoolClientId"
if (-not $userPoolClientId) {
    Write-Host "⚠️  User Pool Client ID não encontrado" -ForegroundColor Yellow
    $userPoolClientId = "CONFIGURE_ME"
}
Write-Host "  User Pool Client ID: $userPoolClientId" -ForegroundColor Gray

$cognitoDomain = Get-StackOutput -StackName $fibonacciStackName -OutputKey "CognitoDomain"
if (-not $cognitoDomain) {
    Write-Host "⚠️  Cognito Domain não encontrado" -ForegroundColor Yellow
    $cognitoDomain = "alquimista-auth-$Environment.auth.$Region.amazoncognito.com"
}
Write-Host "  Cognito Domain: $cognitoDomain" -ForegroundColor Gray

Write-Host ""
Write-Host "Gerando arquivo de configuração..." -ForegroundColor Yellow

# Gerar conteúdo do arquivo .env
$envContent = @"
# Configuração do Painel Operacional AlquimistaAI
# Gerado automaticamente em $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# Ambiente: $($Environment.ToUpper())

# ========================================
# API URLs
# ========================================

NEXT_PUBLIC_PLATFORM_API_URL=$platformApiUrl

# ========================================
# Cognito Configuration
# ========================================

NEXT_PUBLIC_COGNITO_USER_POOL_ID=$userPoolId
NEXT_PUBLIC_COGNITO_CLIENT_ID=$userPoolClientId
NEXT_PUBLIC_AWS_REGION=$Region
NEXT_PUBLIC_COGNITO_DOMAIN=$cognitoDomain

# ========================================
# Feature Flags
# ========================================

NEXT_PUBLIC_ENABLE_OPERATIONAL_DASHBOARD=true
NEXT_PUBLIC_ENABLE_TENANT_DASHBOARD=true
NEXT_PUBLIC_ENABLE_COMPANY_PANEL=true

# ========================================
# Cache Configuration
# ========================================

NEXT_PUBLIC_CACHE_TTL=300
NEXT_PUBLIC_ENABLE_LOCAL_CACHE=true

# ========================================
# Monitoring & Observability
# ========================================

NEXT_PUBLIC_ENABLE_DEBUG_LOGS=$($Environment -eq "dev")
NEXT_PUBLIC_ENABLE_PERFORMANCE_METRICS=true

# ========================================
# UI Configuration
# ========================================

NEXT_PUBLIC_ITEMS_PER_PAGE=50
NEXT_PUBLIC_COMMAND_POLLING_INTERVAL=5000
NEXT_PUBLIC_REQUEST_TIMEOUT=30000

# ========================================
# Development Only
# ========================================

NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_BYPASS_AUTH=false
"@

# Salvar arquivo
$envContent | Out-File -FilePath $OutputFile -Encoding UTF8

Write-Host "✓ Arquivo criado: $OutputFile" -ForegroundColor Green
Write-Host ""

# Verificar se há valores não configurados
$missingValues = @()

if ($platformApiUrl -like "*CONFIGURE_ME*") {
    $missingValues += "Platform API URL"
}
if ($userPoolId -like "*CONFIGURE_ME*") {
    $missingValues += "User Pool ID"
}
if ($userPoolClientId -like "*CONFIGURE_ME*") {
    $missingValues += "User Pool Client ID"
}

if ($missingValues.Count -gt 0) {
    Write-Host "⚠️  ATENÇÃO: Os seguintes valores precisam ser configurados manualmente:" -ForegroundColor Yellow
    foreach ($value in $missingValues) {
        Write-Host "  - $value" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "Edite o arquivo $OutputFile e substitua os valores CONFIGURE_ME" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Revisar o arquivo $OutputFile" -ForegroundColor White
Write-Host "2. Executar: cd frontend && npm run build" -ForegroundColor White
Write-Host "3. Testar localmente: cd frontend && npm run dev" -ForegroundColor White
Write-Host "4. Deploy do frontend: npm run deploy" -ForegroundColor White
Write-Host ""

exit 0
