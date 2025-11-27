param(
    [Parameter(Mandatory=$true)]
    [string]$Username,
    
    [Parameter(Mandatory=$true)]
    [string]$GroupName
)

$ErrorActionPreference = "Stop"

$REGION = "us-east-1"
$USER_POOL_ID = "us-east-1_Y8p2TeMbv"

Write-Host "========================================"
Write-Host "  Adicionar Usuario ao Grupo Cognito"
Write-Host "========================================"
Write-Host "Usuario: $Username"
Write-Host "Grupo: $GroupName"
Write-Host ""

# Verificar se usuario existe
Write-Host "[1/2] Verificando se usuario existe..."
try {
    aws cognito-idp admin-get-user `
        --region $REGION `
        --user-pool-id $USER_POOL_ID `
        --username $Username `
        --query 'Username' `
        --output text | Out-Null
    Write-Host "OK - Usuario encontrado: $Username" -ForegroundColor Green
} catch {
    Write-Host "ERRO - Usuario nao encontrado: $Username" -ForegroundColor Red
    exit 1
}

# Adicionar ao grupo
Write-Host "[2/2] Adicionando usuario ao grupo..."
try {
    aws cognito-idp admin-add-user-to-group `
        --region $REGION `
        --user-pool-id $USER_POOL_ID `
        --username $Username `
        --group-name $GroupName
    Write-Host "OK - Usuario adicionado ao grupo $GroupName" -ForegroundColor Green
} catch {
    Write-Host "ERRO - Falha ao adicionar usuario ao grupo" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Proximo passo:"
Write-Host "  1. Faca logout no frontend (se estiver logado)"
Write-Host "  2. Faca login novamente"
Write-Host "  3. O token agora tera 'cognito:groups': ['$GroupName']"
