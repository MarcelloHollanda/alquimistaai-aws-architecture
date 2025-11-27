# Script de Configuração - Painel Operacional AlquimistaAI
# Este script configura os grupos do Cognito e usuários de teste

param(
    [Parameter(Mandatory=$true)]
    [string]$UserPoolId,
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipTestUsers
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuração - Painel Operacional" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se AWS CLI está instalado
try {
    $awsVersion = aws --version
    Write-Host "✓ AWS CLI encontrado: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ AWS CLI não encontrado. Instale em: https://aws.amazon.com/cli/" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "User Pool ID: $UserPoolId" -ForegroundColor Yellow
Write-Host "Região: $Region" -ForegroundColor Yellow
Write-Host ""

# Função para criar grupo
function Create-CognitoGroup {
    param(
        [string]$GroupName,
        [string]$Description,
        [int]$Precedence
    )
    
    Write-Host "Criando grupo: $GroupName..." -NoNewline
    
    $result = aws cognito-idp create-group `
        --group-name $GroupName `
        --user-pool-id $UserPoolId `
        --description $Description `
        --precedence $Precedence `
        --region $Region 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ✓" -ForegroundColor Green
        return $true
    } elseif ($result -like "*GroupExistsException*") {
        Write-Host " (já existe)" -ForegroundColor Yellow
        return $true
    } else {
        Write-Host " ✗" -ForegroundColor Red
        Write-Host "  Erro: $result" -ForegroundColor Red
        return $false
    }
}

# Criar grupos
Write-Host "Criando grupos do Cognito..." -ForegroundColor Cyan
Write-Host ""

$groups = @(
    @{Name="INTERNAL_ADMIN"; Description="Administradores internos da AlquimistaAI com acesso total"; Precedence=1},
    @{Name="INTERNAL_SUPPORT"; Description="Equipe de suporte interno da AlquimistaAI"; Precedence=2},
    @{Name="TENANT_ADMIN"; Description="Administradores de tenants (clientes)"; Precedence=3},
    @{Name="TENANT_USER"; Description="Usuários regulares de tenants (clientes)"; Precedence=4}
)

$groupsCreated = 0
foreach ($group in $groups) {
    if (Create-CognitoGroup -GroupName $group.Name -Description $group.Description -Precedence $group.Precedence) {
        $groupsCreated++
    }
}

Write-Host ""
Write-Host "Grupos criados/verificados: $groupsCreated/4" -ForegroundColor $(if ($groupsCreated -eq 4) { "Green" } else { "Yellow" })

# Listar grupos criados
Write-Host ""
Write-Host "Listando grupos..." -ForegroundColor Cyan
aws cognito-idp list-groups --user-pool-id $UserPoolId --region $Region --query 'Groups[].GroupName' --output table

# Criar usuários de teste (se solicitado)
if (-not $SkipTestUsers) {
    Write-Host ""
    Write-Host "Criando usuários de teste..." -ForegroundColor Cyan
    Write-Host ""
    
    # Usuário admin
    Write-Host "Criando admin@alquimistaai.com..." -NoNewline
    $result = aws cognito-idp admin-create-user `
        --user-pool-id $UserPoolId `
        --username "admin@alquimistaai.com" `
        --user-attributes Name=email,Value=admin@alquimistaai.com Name=email_verified,Value=true `
        --temporary-password "TempPass123!" `
        --region $Region 2>&1
    
    if ($LASTEXITCODE -eq 0 -or $result -like "*UsernameExistsException*") {
        Write-Host " ✓" -ForegroundColor Green
        
        # Adicionar ao grupo
        Write-Host "  Adicionando ao grupo INTERNAL_ADMIN..." -NoNewline
        aws cognito-idp admin-add-user-to-group `
            --user-pool-id $UserPoolId `
            --username "admin@alquimistaai.com" `
            --group-name "INTERNAL_ADMIN" `
            --region $Region 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host " ✓" -ForegroundColor Green
        } else {
            Write-Host " ✗" -ForegroundColor Red
        }
    } else {
        Write-Host " ✗" -ForegroundColor Red
        Write-Host "  Erro: $result" -ForegroundColor Red
    }
    
    # Usuário suporte
    Write-Host "Criando suporte@alquimistaai.com..." -NoNewline
    $result = aws cognito-idp admin-create-user `
        --user-pool-id $UserPoolId `
        --username "suporte@alquimistaai.com" `
        --user-attributes Name=email,Value=suporte@alquimistaai.com Name=email_verified,Value=true `
        --temporary-password "TempPass123!" `
        --region $Region 2>&1
    
    if ($LASTEXITCODE -eq 0 -or $result -like "*UsernameExistsException*") {
        Write-Host " ✓" -ForegroundColor Green
        
        # Adicionar ao grupo
        Write-Host "  Adicionando ao grupo INTERNAL_SUPPORT..." -NoNewline
        aws cognito-idp admin-add-user-to-group `
            --user-pool-id $UserPoolId `
            --username "suporte@alquimistaai.com" `
            --group-name "INTERNAL_SUPPORT" `
            --region $Region 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host " ✓" -ForegroundColor Green
        } else {
            Write-Host " ✗" -ForegroundColor Red
        }
    } else {
        Write-Host " ✗" -ForegroundColor Red
        Write-Host "  Erro: $result" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Credenciais temporárias:" -ForegroundColor Yellow
    Write-Host "  admin@alquimistaai.com / TempPass123!" -ForegroundColor Yellow
    Write-Host "  suporte@alquimistaai.com / TempPass123!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "IMPORTANTE: Altere as senhas no primeiro login!" -ForegroundColor Red
}

# Resumo
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuração Concluída!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Verificar grupos criados no console AWS Cognito" -ForegroundColor White
Write-Host "2. Testar login com usuários de teste" -ForegroundColor White
Write-Host "3. Iniciar Task 2: Implementar Middleware de Autorização" -ForegroundColor White
Write-Host ""
Write-Host "Documentação: docs/operational-dashboard/SETUP-GUIDE.md" -ForegroundColor Yellow
Write-Host ""
