# Script para validar configuração do Cognito
# Uso: .\scripts\validate-cognito-setup.ps1 -Environment dev

param(
    [Parameter(Mandatory=$false)]
    [string]$Environment = "dev",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1"
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Validação de Configuração - Cognito" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Obter User Pool ID
Write-Host "1. Obtendo User Pool ID..." -ForegroundColor Yellow
$userPoolId = aws cognito-idp list-user-pools --max-results 10 --region $Region --query "UserPools[?Name=='fibonacci-users-$Environment'].Id" --output text

if (-not $userPoolId) {
    Write-Host "   ✗ ERRO: User Pool não encontrado" -ForegroundColor Red
    exit 1
}

Write-Host "   ✓ User Pool ID: $userPoolId" -ForegroundColor Green
Write-Host ""

# Verificar grupos
Write-Host "2. Verificando grupos operacionais..." -ForegroundColor Yellow
$expectedGroups = @("INTERNAL_ADMIN", "INTERNAL_SUPPORT", "TENANT_ADMIN", "TENANT_USER")
$groups = aws cognito-idp list-groups --user-pool-id $userPoolId --region $Region | ConvertFrom-Json

$foundGroups = @()
foreach ($expectedGroup in $expectedGroups) {
    $found = $groups.Groups | Where-Object { $_.GroupName -eq $expectedGroup }
    if ($found) {
        Write-Host "   ✓ $expectedGroup (Precedência: $($found.Precedence))" -ForegroundColor Green
        $foundGroups += $expectedGroup
    } else {
        Write-Host "   ✗ $expectedGroup NÃO ENCONTRADO" -ForegroundColor Red
    }
}

Write-Host ""

# Verificar custom attributes
Write-Host "3. Verificando custom attributes..." -ForegroundColor Yellow
$userPoolDetails = aws cognito-idp describe-user-pool --user-pool-id $userPoolId --region $Region | ConvertFrom-Json
$customAttrs = $userPoolDetails.UserPool.SchemaAttributes | Where-Object { $_.Name -like "custom:*" }

$expectedAttrs = @("custom:tenant_id", "custom:company_name", "custom:user_role")
foreach ($expectedAttr in $expectedAttrs) {
    $found = $customAttrs | Where-Object { $_.Name -eq $expectedAttr }
    if ($found) {
        Write-Host "   ✓ $expectedAttr (Mutável: $($found.Mutable))" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ $expectedAttr NÃO ENCONTRADO" -ForegroundColor Yellow
    }
}

Write-Host ""

# Contar usuários por grupo
Write-Host "4. Contando usuários por grupo..." -ForegroundColor Yellow
foreach ($group in $foundGroups) {
    $users = aws cognito-idp list-users-in-group --user-pool-id $userPoolId --group-name $group --region $Region | ConvertFrom-Json
    $count = $users.Users.Count
    
    if ($count -gt 0) {
        Write-Host "   ✓ $group : $count usuário(s)" -ForegroundColor Green
    } else {
        Write-Host "   ○ $group : 0 usuários" -ForegroundColor Gray
    }
}

Write-Host ""

# Verificar App Client
Write-Host "5. Verificando App Client..." -ForegroundColor Yellow
$clients = aws cognito-idp list-user-pool-clients --user-pool-id $userPoolId --region $Region | ConvertFrom-Json

if ($clients.UserPoolClients.Count -gt 0) {
    Write-Host "   ✓ $($clients.UserPoolClients.Count) App Client(s) configurado(s)" -ForegroundColor Green
    foreach ($client in $clients.UserPoolClients) {
        Write-Host "     - $($client.ClientName) (ID: $($client.ClientId))" -ForegroundColor White
    }
} else {
    Write-Host "   ⚠ Nenhum App Client encontrado" -ForegroundColor Yellow
}

Write-Host ""

# Resumo
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Resumo da Validação" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$totalGroups = $foundGroups.Count
$totalExpected = $expectedGroups.Count

Write-Host "User Pool:" -ForegroundColor Yellow
Write-Host "  ID: $userPoolId" -ForegroundColor White
Write-Host "  Ambiente: $Environment" -ForegroundColor White
Write-Host ""

Write-Host "Grupos:" -ForegroundColor Yellow
Write-Host "  Configurados: $totalGroups de $totalExpected" -ForegroundColor White
if ($totalGroups -eq $totalExpected) {
    Write-Host "  Status: ✓ COMPLETO" -ForegroundColor Green
} else {
    Write-Host "  Status: ✗ INCOMPLETO" -ForegroundColor Red
}
Write-Host ""

Write-Host "Custom Attributes:" -ForegroundColor Yellow
$customAttrCount = $customAttrs.Count
Write-Host "  Encontrados: $customAttrCount" -ForegroundColor White
if ($customAttrCount -ge 3) {
    Write-Host "  Status: ✓ COMPLETO" -ForegroundColor Green
} else {
    Write-Host "  Status: ⚠ VERIFICAR CDK" -ForegroundColor Yellow
}
Write-Host ""

# Status final
if ($totalGroups -eq $totalExpected -and $customAttrCount -ge 3) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "✓ CONFIGURAÇÃO VÁLIDA" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Próximos passos:" -ForegroundColor Yellow
    Write-Host "1. Criar usuários de teste" -ForegroundColor White
    Write-Host "2. Testar autenticação no frontend" -ForegroundColor White
    Write-Host "3. Implementar Tarefa 2 (Middleware de Autorização)" -ForegroundColor White
} else {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "⚠ CONFIGURAÇÃO INCOMPLETA" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Execute o script de setup:" -ForegroundColor Yellow
    Write-Host ".\scripts\setup-cognito-operational-groups.ps1 -Environment $Environment" -ForegroundColor White
}

Write-Host ""
