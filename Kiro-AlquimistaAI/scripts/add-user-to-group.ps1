# Script para adicionar usuário a grupo no Cognito
# Uso: .\scripts\add-user-to-group.ps1 -Email "user@example.com" -GroupName "TENANT_ADMIN" -Environment "dev"

param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [Parameter(Mandatory=$true)]
    [ValidateSet("INTERNAL_ADMIN", "INTERNAL_SUPPORT", "TENANT_ADMIN", "TENANT_USER")]
    [string]$GroupName,
    
    [Parameter(Mandatory=$false)]
    [string]$Environment = "dev",
    
    [Parameter(Mandatory=$false)]
    [string]$TenantId = $null,
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Adicionar Usuário a Grupo - Cognito" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Obter User Pool ID
Write-Host "Obtendo User Pool ID para ambiente: $Environment" -ForegroundColor Yellow
$userPoolId = aws cognito-idp list-user-pools --max-results 10 --region $Region --query "UserPools[?Name=='fibonacci-users-$Environment'].Id" --output text

if (-not $userPoolId) {
    Write-Host "ERRO: User Pool não encontrado para ambiente $Environment" -ForegroundColor Red
    exit 1
}

Write-Host "User Pool ID: $userPoolId" -ForegroundColor Green
Write-Host ""

# Verificar se usuário existe
Write-Host "Verificando se usuário existe: $Email" -ForegroundColor Yellow
$userExists = aws cognito-idp admin-get-user `
    --user-pool-id $userPoolId `
    --username $Email `
    --region $Region 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Usuário $Email não encontrado" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Usuário encontrado" -ForegroundColor Green
Write-Host ""

# Adicionar usuário ao grupo
Write-Host "Adicionando usuário ao grupo: $GroupName" -ForegroundColor Yellow
aws cognito-idp admin-add-user-to-group `
    --user-pool-id $userPoolId `
    --username $Email `
    --group-name $GroupName `
    --region $Region

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Usuário adicionado ao grupo $GroupName com sucesso" -ForegroundColor Green
} else {
    Write-Host "✗ Erro ao adicionar usuário ao grupo" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Configurar tenant_id se fornecido e se for grupo de tenant
if ($TenantId -and ($GroupName -eq "TENANT_ADMIN" -or $GroupName -eq "TENANT_USER")) {
    Write-Host "Configurando tenant_id: $TenantId" -ForegroundColor Yellow
    
    aws cognito-idp admin-update-user-attributes `
        --user-pool-id $userPoolId `
        --username $Email `
        --user-attributes Name=custom:tenant_id,Value=$TenantId `
        --region $Region
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Tenant ID configurado com sucesso" -ForegroundColor Green
    } else {
        Write-Host "✗ Erro ao configurar tenant_id" -ForegroundColor Red
    }
    
    Write-Host ""
}

# Exibir informações do usuário
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Informações do Usuário" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$userInfo = aws cognito-idp admin-get-user `
    --user-pool-id $userPoolId `
    --username $Email `
    --region $Region | ConvertFrom-Json

Write-Host "Email: $($userInfo.Username)" -ForegroundColor White
Write-Host "Status: $($userInfo.UserStatus)" -ForegroundColor White

# Exibir grupos
Write-Host ""
Write-Host "Grupos:" -ForegroundColor Yellow
$groups = aws cognito-idp admin-list-groups-for-user `
    --user-pool-id $userPoolId `
    --username $Email `
    --region $Region | ConvertFrom-Json

foreach ($group in $groups.Groups) {
    Write-Host "  - $($group.GroupName)" -ForegroundColor White
}

# Exibir atributos customizados
Write-Host ""
Write-Host "Atributos Customizados:" -ForegroundColor Yellow
foreach ($attr in $userInfo.UserAttributes) {
    if ($attr.Name -like "custom:*") {
        Write-Host "  - $($attr.Name): $($attr.Value)" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Operação Concluída!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
