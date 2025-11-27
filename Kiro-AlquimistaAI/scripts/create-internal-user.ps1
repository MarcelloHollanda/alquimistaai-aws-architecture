# Script para criar usuário interno no Cognito
# Uso: .\scripts\create-internal-user.ps1 -Email "admin@alquimista.ai" -Role "admin"

param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [Parameter(Mandatory=$true)]
    [ValidateSet("admin", "support")]
    [string]$Role,
    
    [Parameter(Mandatory=$false)]
    [string]$FullName = "",
    
    [Parameter(Mandatory=$false)]
    [string]$Environment = "dev",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Criar Usuário Interno - Cognito" -ForegroundColor Cyan
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
$tempPassword = $tempPassword + "A1!"

Write-Host "Criando usuário interno: $Email" -ForegroundColor Yellow
Write-Host "Papel: $Role" -ForegroundColor White
Write-Host ""

# Preparar atributos
$attributes = @(
    "Name=email,Value=$Email",
    "Name=email_verified,Value=true"
)

if ($FullName) {
    $attributes += "Name=name,Value=$FullName"
}

# Criar usuário
$createResult = aws cognito-idp admin-create-user `
    --user-pool-id $userPoolId `
    --username $Email `
    --user-attributes $attributes `
    --temporary-password $tempPassword `
    --region $Region 2>&1

if ($LASTEXITCODE -ne 0) {
    if ($createResult -like "*UsernameExistsException*") {
        Write-Host "⚠ Usuário já existe" -ForegroundColor Yellow
    } else {
        Write-Host "✗ Erro ao criar usuário: $createResult" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✓ Usuário criado com sucesso" -ForegroundColor Green
}

Write-Host ""

# Determinar grupo
$groupName = if ($Role -eq "admin") { "INTERNAL_ADMIN" } else { "INTERNAL_SUPPORT" }

Write-Host "Adicionando usuário ao grupo: $groupName" -ForegroundColor Yellow
aws cognito-idp admin-add-user-to-group `
    --user-pool-id $userPoolId `
    --username $Email `
    --group-name $groupName `
    --region $Region

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Usuário adicionado ao grupo $groupName" -ForegroundColor Green
} else {
    Write-Host "⚠ Aviso: Erro ao adicionar ao grupo" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Usuário Interno Criado!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Credenciais:" -ForegroundColor Yellow
Write-Host "  Email: $Email" -ForegroundColor White
Write-Host "  Senha Temporária: $tempPassword" -ForegroundColor White
Write-Host ""
Write-Host "Informações:" -ForegroundColor Yellow
Write-Host "  Grupo: $groupName" -ForegroundColor White
Write-Host "  Tipo: Usuário Interno AlquimistaAI" -ForegroundColor White
Write-Host ""
Write-Host "⚠ O usuário precisará alterar a senha no primeiro login" -ForegroundColor Yellow
Write-Host ""
