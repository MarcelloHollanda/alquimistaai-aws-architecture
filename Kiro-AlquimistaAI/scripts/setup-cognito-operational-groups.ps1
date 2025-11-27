# Script para configurar grupos operacionais no Cognito User Pool
# Este script cria os grupos necessários para o Painel Operacional AlquimistaAI

param(
    [Parameter(Mandatory=$false)]
    [string]$Environment = "dev",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuração de Grupos Operacionais - Cognito" -ForegroundColor Cyan
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

# Função para criar grupo
function Create-CognitoGroup {
    param(
        [string]$GroupName,
        [string]$Description,
        [int]$Precedence
    )
    
    Write-Host "Criando grupo: $GroupName" -ForegroundColor Yellow
    
    try {
        aws cognito-idp create-group `
            --user-pool-id $userPoolId `
            --group-name $GroupName `
            --description $Description `
            --precedence $Precedence `
            --region $Region 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Grupo $GroupName criado com sucesso" -ForegroundColor Green
        } else {
            # Verificar se o grupo já existe
            $existingGroup = aws cognito-idp get-group `
                --user-pool-id $userPoolId `
                --group-name $GroupName `
                --region $Region 2>$null
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✓ Grupo $GroupName já existe" -ForegroundColor Yellow
            } else {
                Write-Host "✗ Erro ao criar grupo $GroupName" -ForegroundColor Red
            }
        }
    } catch {
        Write-Host "✗ Erro ao criar grupo $GroupName : $_" -ForegroundColor Red
    }
    
    Write-Host ""
}

# Criar grupos operacionais
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Criando Grupos Operacionais" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Create-CognitoGroup -GroupName "INTERNAL_ADMIN" `
    -Description "Administradores internos da AlquimistaAI com acesso total ao painel operacional" `
    -Precedence 1

Create-CognitoGroup -GroupName "INTERNAL_SUPPORT" `
    -Description "Equipe de suporte interno da AlquimistaAI com acesso ao painel operacional" `
    -Precedence 2

Create-CognitoGroup -GroupName "TENANT_ADMIN" `
    -Description "Administradores de empresas clientes com acesso total ao dashboard do tenant" `
    -Precedence 3

Create-CognitoGroup -GroupName "TENANT_USER" `
    -Description "Usuários de empresas clientes com acesso limitado ao dashboard do tenant" `
    -Precedence 4

# Verificar custom attribute tenant_id
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verificando Custom Attribute" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Verificando se custom attribute 'custom:tenant_id' existe..." -ForegroundColor Yellow
$userPoolDetails = aws cognito-idp describe-user-pool `
    --user-pool-id $userPoolId `
    --region $Region `
    --query "UserPool.SchemaAttributes[?Name=='custom:tenant_id']" `
    --output json | ConvertFrom-Json

if ($userPoolDetails) {
    Write-Host "✓ Custom attribute 'custom:tenant_id' já está configurado" -ForegroundColor Green
} else {
    Write-Host "⚠ Custom attribute 'custom:tenant_id' NÃO encontrado" -ForegroundColor Yellow
    Write-Host "  Este atributo deve ser configurado no CDK (já está no código)" -ForegroundColor Yellow
}

Write-Host ""

# Listar todos os grupos criados
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Grupos Configurados" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$groups = aws cognito-idp list-groups `
    --user-pool-id $userPoolId `
    --region $Region `
    --query "Groups[*].[GroupName,Description,Precedence]" `
    --output table

Write-Host $groups
Write-Host ""

# Criar usuários de teste (opcional)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Criação de Usuários de Teste" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$createTestUsers = Read-Host "Deseja criar usuários de teste? (s/n)"

if ($createTestUsers -eq "s" -or $createTestUsers -eq "S") {
    Write-Host ""
    Write-Host "Criando usuários de teste..." -ForegroundColor Yellow
    Write-Host ""
    
    # Função para criar usuário de teste
    function Create-TestUser {
        param(
            [string]$Email,
            [string]$GroupName,
            [string]$TenantId = $null
        )
        
        Write-Host "Criando usuário: $Email" -ForegroundColor Yellow
        
        # Senha temporária
        $tempPassword = "TempPass123!"
        
        try {
            # Criar usuário
            $createResult = aws cognito-idp admin-create-user `
                --user-pool-id $userPoolId `
                --username $Email `
                --user-attributes Name=email,Value=$Email Name=email_verified,Value=true `
                --temporary-password $tempPassword `
                --region $Region 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✓ Usuário $Email criado" -ForegroundColor Green
                
                # Adicionar ao grupo
                aws cognito-idp admin-add-user-to-group `
                    --user-pool-id $userPoolId `
                    --username $Email `
                    --group-name $GroupName `
                    --region $Region 2>$null
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✓ Usuário $Email adicionado ao grupo $GroupName" -ForegroundColor Green
                }
                
                # Adicionar tenant_id se fornecido
                if ($TenantId) {
                    aws cognito-idp admin-update-user-attributes `
                        --user-pool-id $userPoolId `
                        --username $Email `
                        --user-attributes Name=custom:tenant_id,Value=$TenantId `
                        --region $Region 2>$null
                    
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "✓ Tenant ID $TenantId atribuído ao usuário $Email" -ForegroundColor Green
                    }
                }
                
                Write-Host "  Senha temporária: $tempPassword" -ForegroundColor Cyan
            } else {
                if ($createResult -like "*UsernameExistsException*") {
                    Write-Host "✓ Usuário $Email já existe" -ForegroundColor Yellow
                } else {
                    Write-Host "✗ Erro ao criar usuário $Email" -ForegroundColor Red
                }
            }
        } catch {
            Write-Host "✗ Erro ao criar usuário $Email : $_" -ForegroundColor Red
        }
        
        Write-Host ""
    }
    
    # Criar usuários de teste para cada grupo
    Create-TestUser -Email "admin@alquimista.ai" -GroupName "INTERNAL_ADMIN"
    Create-TestUser -Email "support@alquimista.ai" -GroupName "INTERNAL_SUPPORT"
    Create-TestUser -Email "tenant-admin@example.com" -GroupName "TENANT_ADMIN" -TenantId "test-tenant-001"
    Create-TestUser -Email "tenant-user@example.com" -GroupName "TENANT_USER" -TenantId "test-tenant-001"
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Usuários de teste criados!" -ForegroundColor Green
    Write-Host "Senha temporária para todos: TempPass123!" -ForegroundColor Cyan
    Write-Host "Os usuários precisarão alterar a senha no primeiro login" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuração Concluída!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Verificar os grupos criados no Console do Cognito" -ForegroundColor White
Write-Host "2. Atribuir usuários aos grupos apropriados" -ForegroundColor White
Write-Host "3. Configurar custom attribute 'tenant_id' para usuários de tenants" -ForegroundColor White
Write-Host "4. Testar autenticação e autorização no frontend" -ForegroundColor White
Write-Host ""
