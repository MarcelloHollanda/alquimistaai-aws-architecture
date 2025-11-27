# Script para auditar permissões IAM do Ecossistema Alquimista.AI
# Uso: .\scripts\audit-iam-permissions.ps1 [-Environment dev|staging|prod]

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('dev', 'staging', 'prod')]
    [string]$Environment = 'dev'
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "IAM Permissions Audit - Fibonacci AWS" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Função para obter roles por stack
function Get-StackRoles {
    param([string]$StackName)
    
    Write-Host "Buscando roles da stack: $StackName..." -ForegroundColor Yellow
    
    $roles = aws cloudformation describe-stack-resources `
        --stack-name $StackName `
        --query "StackResources[?ResourceType=='AWS::IAM::Role'].PhysicalResourceId" `
        --output json | ConvertFrom-Json
    
    return $roles
}

# Função para obter políticas de uma role
function Get-RolePolicies {
    param([string]$RoleName)
    
    Write-Host "  Analisando role: $RoleName" -ForegroundColor White
    
    # Políticas gerenciadas (managed)
    $managedPolicies = aws iam list-attached-role-policies `
        --role-name $RoleName `
        --query "AttachedPolicies[].PolicyName" `
        --output json | ConvertFrom-Json
    
    if ($managedPolicies) {
        Write-Host "    Managed Policies:" -ForegroundColor Green
        foreach ($policy in $managedPolicies) {
            Write-Host "      - $policy" -ForegroundColor Gray
        }
    }
    
    # Políticas inline
    $inlinePolicies = aws iam list-role-policies `
        --role-name $RoleName `
        --query "PolicyNames" `
        --output json | ConvertFrom-Json
    
    if ($inlinePolicies) {
        Write-Host "    Inline Policies:" -ForegroundColor Green
        foreach ($policy in $inlinePolicies) {
            Write-Host "      - $policy" -ForegroundColor Gray
            
            # Obter detalhes da política inline
            $policyDoc = aws iam get-role-policy `
                --role-name $RoleName `
                --policy-name $policy `
                --query "PolicyDocument" `
                --output json | ConvertFrom-Json
            
            # Mostrar permissões
            foreach ($statement in $policyDoc.Statement) {
                $actions = $statement.Action
                if ($actions -is [array]) {
                    $actions = $actions -join ", "
                }
                Write-Host "        Actions: $actions" -ForegroundColor DarkGray
                
                $resources = $statement.Resource
                if ($resources -is [array]) {
                    $resources = $resources -join ", "
                }
                if ($resources -eq "*") {
                    Write-Host "        Resources: * (WARNING: Wildcard)" -ForegroundColor Red
                } else {
                    Write-Host "        Resources: $resources" -ForegroundColor DarkGray
                }
            }
        }
    }
    
    Write-Host ""
}

# Função para verificar permissões perigosas
function Check-DangerousPermissions {
    param([string]$RoleName)
    
    $inlinePolicies = aws iam list-role-policies `
        --role-name $RoleName `
        --query "PolicyNames" `
        --output json | ConvertFrom-Json
    
    $warnings = @()
    
    foreach ($policy in $inlinePolicies) {
        $policyDoc = aws iam get-role-policy `
            --role-name $RoleName `
            --policy-name $policy `
            --query "PolicyDocument" `
            --output json | ConvertFrom-Json
        
        foreach ($statement in $policyDoc.Statement) {
            # Verificar wildcard em actions
            if ($statement.Action -contains "*") {
                $warnings += "⚠️  Wildcard (*) em Actions"
            }
            
            # Verificar wildcard em resources (exceto X-Ray e Comprehend)
            if ($statement.Resource -eq "*") {
                $actions = $statement.Action
                if ($actions -is [array]) {
                    $actions = $actions -join ","
                }
                
                # X-Ray e Comprehend não suportam resource-level permissions
                if ($actions -notmatch "xray:" -and $actions -notmatch "comprehend:") {
                    $warnings += "⚠️  Wildcard (*) em Resources para: $actions"
                }
            }
            
            # Verificar permissões administrativas
            $adminActions = @("iam:*", "s3:*", "dynamodb:*", "rds:*", "ec2:*")
            foreach ($adminAction in $adminActions) {
                if ($statement.Action -contains $adminAction) {
                    $warnings += "🚨 Permissão administrativa detectada: $adminAction"
                }
            }
        }
    }
    
    return $warnings
}

# Stacks para auditar
$stacks = @(
    "FibonacciStack-$Environment",
    "NigredoStack-$Environment",
    "AlquimistaStack-$Environment"
)

$totalWarnings = 0

foreach ($stack in $stacks) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Stack: $stack" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    try {
        $roles = Get-StackRoles -StackName $stack
        
        if ($roles.Count -eq 0) {
            Write-Host "Nenhuma role encontrada nesta stack." -ForegroundColor Yellow
            Write-Host ""
            continue
        }
        
        foreach ($role in $roles) {
            Get-RolePolicies -RoleName $role
            
            # Verificar permissões perigosas
            $warnings = Check-DangerousPermissions -RoleName $role
            if ($warnings.Count -gt 0) {
                Write-Host "  ⚠️  AVISOS DE SEGURANÇA:" -ForegroundColor Red
                foreach ($warning in $warnings) {
                    Write-Host "    $warning" -ForegroundColor Red
                    $totalWarnings++
                }
                Write-Host ""
            }
        }
    }
    catch {
        Write-Host "Erro ao processar stack $stack : $_" -ForegroundColor Red
        Write-Host "A stack pode não existir ainda." -ForegroundColor Yellow
        Write-Host ""
    }
}

# Resumo final
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUMO DA AUDITORIA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($totalWarnings -eq 0) {
    Write-Host "✅ Nenhum aviso de segurança encontrado!" -ForegroundColor Green
    Write-Host "Todas as roles seguem o princípio de menor privilégio." -ForegroundColor Green
} else {
    Write-Host "⚠️  Total de avisos: $totalWarnings" -ForegroundColor Red
    Write-Host "Revise as permissões acima e corrija conforme necessário." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Para mais informações, consulte:" -ForegroundColor Cyan
Write-Host "  - Docs/Deploy/IAM-ROLES-DOCUMENTATION.md" -ForegroundColor Gray
Write-Host "  - Docs/Deploy/IAM-QUICK-REFERENCE.md" -ForegroundColor Gray
Write-Host ""

# Sugestões de melhorias
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RECOMENDAÇÕES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Habilite IAM Access Analyzer:" -ForegroundColor White
Write-Host "   aws accessanalyzer create-analyzer --analyzer-name fibonacci-analyzer --type ACCOUNT" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Habilite CloudTrail para auditoria:" -ForegroundColor White
Write-Host "   aws cloudtrail create-trail --name fibonacci-trail --s3-bucket-name <bucket>" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Configure rotação de secrets:" -ForegroundColor White
Write-Host "   Já configurado automaticamente no CDK (30 dias)" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Revise permissões trimestralmente" -ForegroundColor White
Write-Host "   Execute este script regularmente" -ForegroundColor Gray
Write-Host ""
