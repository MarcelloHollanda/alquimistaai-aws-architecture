# Script para criar usuário de tenant no Cognito
# Uso: .\scripts\create-tenant-user.ps1 -Email "user@example.com" -TenantId "uuid" -CompanyName "Empresa" -Role "admin"

param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [Parameter(Mandatory=$true)]
    [string]$TenantId,
    
    [Parameter(Mandatory=$true)]
    [string]$CompanyName,
    
    [Parameter(Mandatory=$true)]
    [ValidateSet("admin", "user")]
    [string]$Role,
    
    [Parameter(Mandatory=$false)]
    [string]$Environment = "dev",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Criar Usuário de Tenant - Cognito" -ForegroundColor Cyan
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

# Gerar senha temporária
$tempPassword = -join ((65..90) + (97..122) + (48..57) + (33,35,36,37,38,42,43,45,61,63,64) | Get-Random -Count 12 | ForEach-Object {[char]$_})
$tempPassword = $tempPassword + "A1!"  # Garantir que atende requisitos

Write-Host "Criando usuário: $Email" -ForegroundColor Yellow
Write-Host "Tenant ID: $TenantId" -ForegroundColor White
Write-Host "Empresa: $CompanyName" -ForegroundColor White
Write-Host "Papel: $Role" -ForegroundColor White
Write-Host ""

# Criar usuário
$createResult = aws cognito-idp admin-create-user `
    --user-pool-id $userPoolId `
    --username $Email `
    --user-attributes `
        Name=email,Value=$Email `
        Name=email_verified,Value=true `
        "Name=custom:tenant_id,Value=$TenantId" `
        "Name=custom:company_name,Value=$CompanyName" `
        "Name=custom:user_role,Value=$Role" `
    --temporary-password $tempPassword `
    --region $Region 2>&1

if ($LASTEXITCODE -ne 0) {
    if ($createResult -like "*UsernameExistsException*") {
        Write-Host "⚠ Usuário já existe. Atualizando atributos..." -ForegroundColor Yellow
        
        # Atualizar atributos
        aws cognito-idp admin-update-user-attributes `
            --user-pool-id $userPoolId `
            --username $Email `
            --user-attributes `
                "Name=custom:tenant_id,Value=$TenantId" `
                "Name=custom:company_name,Value=$CompanyName" `
                "Name=custom:user_role,Value=$Role" `
            --region $Region
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Atributos atualizados" -ForegroundColor Green
        }
    } else {
        Write-Host "✗ Erro ao criar usuário: $createResult" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✓ Usuário criado com sucesso" -ForegroundColor Green
}

Write-Host ""

# Determinar grupo baseado no papel
$groupName = if ($Role -eq "admin") { "TENANT_ADMIN" } else { "TENANT_USER" }

Write-Host "Adicionando usuário ao grupo: $groupName" -ForegroundColor Yellow
aws cognito-idp admin-add-user-to-group `
    --user-pool-id $userPoolId `
    --username $Email `
    --group-name $groupName `
    --region $Region

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Usuário adicionado ao grupo $groupName" -ForegroundColor Green
} else {
    Write-Host "⚠ Aviso: Erro ao adicionar ao grupo (usuário pode já estar no grupo)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Usuário Criado com Sucesso!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Credenciais:" -ForegroundColor Yellow
Write-Host "  Email: $Email" -ForegroundColor White
Write-Host "  Senha Temporária: $tempPassword" -ForegroundColor White
Write-Host ""
Write-Host "Informações:" -ForegroundColor Yellow
Write-Host "  Tenant ID: $TenantId" -ForegroundColor White
Write-Host "  Empresa: $CompanyName" -ForegroundColor White
Write-Host "  Grupo: $groupName" -ForegroundColor White
Write-Host "  Papel: $Role" -ForegroundColor White
Write-Host ""
Write-Host "⚠ O usuário precisará alterar a senha no primeiro login" -ForegroundColor Yellow
Write-Host ""
