# Script Simplificado para Configurar Grupos no Cognito
# Data: 25/11/2024

param(
    [string]$Region = "us-east-1"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup de Grupos Cognito - AlquimistaAI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Passo 1: Buscar User Pool
Write-Host "[1/5] Buscando User Pool..." -ForegroundColor Yellow
$poolsJson = aws cognito-idp list-user-pools --max-results 10 --region $Region
$pools = $poolsJson | ConvertFrom-Json
$alquimistaPool = $pools.UserPools | Where-Object { $_.Name -like "*alquimista*" } | Select-Object -First 1

if (-not $alquimistaPool) {
    Write-Host "X User Pool nao encontrado" -ForegroundColor Red
    exit 1
}

$UserPoolId = $alquimistaPool.Id
Write-Host "OK User Pool encontrado: $($alquimistaPool.Name)" -ForegroundColor Green
Write-Host "  ID: $UserPoolId" -ForegroundColor Gray
Write-Host ""

# Passo 2: Criar grupos
Write-Host "[2/5] Criando grupos..." -ForegroundColor Yellow

# Criar grupo Admins
Write-Host "  Criando grupo Admins..." -ForegroundColor Gray
aws cognito-idp create-group --user-pool-id $UserPoolId --group-name "Admins" --description "Administradores da plataforma AlquimistaAI" --precedence 1 --region $Region 2>&1 | Out-Null
Write-Host "  Grupo Admins processado" -ForegroundColor Gray

# Criar grupo Users
Write-Host "  Criando grupo Users..." -ForegroundColor Gray
aws cognito-idp create-group --user-pool-id $UserPoolId --group-name "Users" --description "Usuarios tenants da plataforma" --precedence 2 --region $Region 2>&1 | Out-Null
Write-Host "  Grupo Users processado" -ForegroundColor Gray

Write-Host ""

# Passo 3: Listar usuários
Write-Host "[3/5] Listando usuarios..." -ForegroundColor Yellow
$usersJson = aws cognito-idp list-users --user-pool-id $UserPoolId --region $Region
$usersData = $usersJson | ConvertFrom-Json

if ($usersData.Users.Count -eq 0) {
    Write-Host "X Nenhum usuario encontrado" -ForegroundColor Red
    exit 0
}

Write-Host "OK Usuarios encontrados:" -ForegroundColor Green
for ($i = 0; $i -lt $usersData.Users.Count; $i++) {
    $user = $usersData.Users[$i]
    $email = ($user.Attributes | Where-Object { $_.Name -eq "email" }).Value
    Write-Host "  [$($i+1)] $($user.Username) ($email)" -ForegroundColor Gray
}

Write-Host ""

# Passo 4: Selecionar usuário
Write-Host "Selecione o usuario:" -ForegroundColor Yellow
$selection = Read-Host "Numero do usuario (1-$($usersData.Users.Count))"
$selectedIndex = [int]$selection - 1

if ($selectedIndex -lt 0 -or $selectedIndex -ge $usersData.Users.Count) {
    Write-Host "X Selecao invalida" -ForegroundColor Red
    exit 1
}

$Username = $usersData.Users[$selectedIndex].Username
Write-Host ""

# Passo 5: Selecionar grupo
Write-Host "Selecione o grupo:" -ForegroundColor Yellow
Write-Host "  [1] Admins (acesso ao painel da empresa)" -ForegroundColor Gray
Write-Host "  [2] Users (acesso ao dashboard do tenant)" -ForegroundColor Gray
$groupSelection = Read-Host "Numero do grupo (1-2)"

if ($groupSelection -eq "1") {
    $GroupName = "Admins"
} else {
    $GroupName = "Users"
}

Write-Host ""

# Passo 6: Adicionar usuário ao grupo
Write-Host "[4/5] Adicionando usuario ao grupo..." -ForegroundColor Yellow
Write-Host "  Usuario: $Username" -ForegroundColor Gray
Write-Host "  Grupo: $GroupName" -ForegroundColor Gray

aws cognito-idp admin-add-user-to-group --user-pool-id $UserPoolId --username $Username --group-name $GroupName --region $Region

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK Usuario adicionado ao grupo '$GroupName'" -ForegroundColor Green
} else {
    Write-Host "X Erro ao adicionar usuario ao grupo" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Passo 7: Verificar grupos do usuário
Write-Host "[5/5] Verificando grupos do usuario..." -ForegroundColor Yellow
$groupsJson = aws cognito-idp admin-list-groups-for-user --user-pool-id $UserPoolId --username $Username --region $Region
$groupsData = $groupsJson | ConvertFrom-Json

if ($groupsData.Groups.Count -eq 0) {
    Write-Host "X Usuario nao pertence a nenhum grupo" -ForegroundColor Red
} else {
    Write-Host "OK Grupos do usuario:" -ForegroundColor Green
    $groupsData.Groups | ForEach-Object {
        Write-Host "  - $($_.GroupName) (Precedencia: $($_.Precedence))" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Configuracao concluida com sucesso!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Yellow
Write-Host "1. Faca logout: http://localhost:3000/auth/logout" -ForegroundColor Gray
Write-Host "2. Faca login novamente" -ForegroundColor Gray
Write-Host "3. Verifique se o grupo aparece nos logs do console" -ForegroundColor Gray
