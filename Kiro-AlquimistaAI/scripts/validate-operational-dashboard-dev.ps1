# Script de Validação - Painel Operacional DEV
# Valida que todos os recursos foram deployados corretamente

param(
    [string]$Region = "us-east-1"
)

$ErrorActionPreference = "Continue"
$env = "dev"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Validação do Painel Operacional - DEV" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allChecks = @()

# Função para adicionar resultado de check
function Add-CheckResult {
    param(
        [string]$Name,
        [bool]$Passed,
        [string]$Message
    )
    
    $script:allChecks += [PSCustomObject]@{
        Name = $Name
        Passed = $Passed
        Message = $Message
    }
    
    if ($Passed) {
        Write-Host "✓ $Name" -ForegroundColor Green
        if ($Message) {
            Write-Host "  $Message" -ForegroundColor Gray
        }
    } else {
        Write-Host "✗ $Name" -ForegroundColor Red
        if ($Message) {
            Write-Host "  $Message" -ForegroundColor Yellow
        }
    }
}

Write-Host "1. Validando DynamoDB Table..." -ForegroundColor Yellow
try {
    $tableName = "alquimista-operational-commands-$env"
    $table = aws dynamodb describe-table --table-name $tableName --region $Region 2>&1 | ConvertFrom-Json
    
    if ($table.Table) {
        Add-CheckResult -Name "DynamoDB Table" -Passed $true -Message "Table: $tableName"
        
        # Verificar GSIs
        $gsiNames = $table.Table.GlobalSecondaryIndexes | ForEach-Object { $_.IndexName }
        
        if ($gsiNames -contains "tenant_id-created_at-index") {
            Add-CheckResult -Name "GSI tenant_id-created_at-index" -Passed $true
        } else {
            Add-CheckResult -Name "GSI tenant_id-created_at-index" -Passed $false -Message "GSI não encontrado"
        }
        
        if ($gsiNames -contains "status-created_at-index") {
            Add-CheckResult -Name "GSI status-created_at-index" -Passed $true
        } else {
            Add-CheckResult -Name "GSI status-created_at-index" -Passed $false -Message "GSI não encontrado"
        }
        
        # Verificar Stream
        if ($table.Table.StreamSpecification.StreamEnabled) {
            Add-CheckResult -Name "DynamoDB Stream" -Passed $true
        } else {
            Add-CheckResult -Name "DynamoDB Stream" -Passed $false -Message "Stream não habilitado"
        }
    } else {
        Add-CheckResult -Name "DynamoDB Table" -Passed $false -Message "Table não encontrada"
    }
} catch {
    Add-CheckResult -Name "DynamoDB Table" -Passed $false -Message $_.Exception.Message
}

Write-Host ""
Write-Host "2. Validando ElastiCache Redis..." -ForegroundColor Yellow
try {
    $clusterName = "alquimista-redis-$env"
    $cluster = aws elasticache describe-cache-clusters --cache-cluster-id $clusterName --region $Region 2>&1 | ConvertFrom-Json
    
    if ($cluster.CacheClusters) {
        $status = $cluster.CacheClusters[0].CacheClusterStatus
        Add-CheckResult -Name "ElastiCache Redis" -Passed ($status -eq "available") -Message "Status: $status"
        
        if ($status -eq "available") {
            $endpoint = $cluster.CacheClusters[0].CacheNodes[0].Endpoint.Address
            Add-CheckResult -Name "Redis Endpoint" -Passed $true -Message $endpoint
        }
    } else {
        Add-CheckResult -Name "ElastiCache Redis" -Passed $false -Message "Cluster não encontrado"
    }
} catch {
    Add-CheckResult -Name "ElastiCache Redis" -Passed $false -Message $_.Exception.Message
}

Write-Host ""
Write-Host "3. Validando Lambda Functions..." -ForegroundColor Yellow

$lambdaFunctions = @(
    "alquimista-get-tenant-me-$env",
    "alquimista-get-tenant-agents-$env",
    "alquimista-get-tenant-integrations-$env",
    "alquimista-get-tenant-usage-$env",
    "alquimista-get-tenant-incidents-$env",
    "alquimista-list-tenants-$env",
    "alquimista-get-tenant-detail-$env",
    "alquimista-get-tenant-agents-internal-$env",
    "alquimista-get-usage-overview-$env",
    "alquimista-get-billing-overview-$env",
    "alquimista-create-operational-command-$env",
    "alquimista-list-operational-commands-$env",
    "alquimista-aggregate-metrics-$env",
    "alquimista-process-command-$env"
)

foreach ($funcName in $lambdaFunctions) {
    try {
        $func = aws lambda get-function --function-name $funcName --region $Region 2>&1 | ConvertFrom-Json
        
        if ($func.Configuration) {
            $state = $func.Configuration.State
            Add-CheckResult -Name "Lambda: $funcName" -Passed ($state -eq "Active") -Message "State: $state"
        } else {
            Add-CheckResult -Name "Lambda: $funcName" -Passed $false -Message "Função não encontrada"
        }
    } catch {
        Add-CheckResult -Name "Lambda: $funcName" -Passed $false -Message "Função não encontrada"
    }
}

Write-Host ""
Write-Host "4. Validando EventBridge Rule..." -ForegroundColor Yellow
try {
    $ruleName = "alquimista-daily-metrics-$env"
    $rule = aws events describe-rule --name $ruleName --region $Region 2>&1 | ConvertFrom-Json
    
    if ($rule.Name) {
        $state = $rule.State
        Add-CheckResult -Name "EventBridge Rule" -Passed ($state -eq "ENABLED") -Message "State: $state"
    } else {
        Add-CheckResult -Name "EventBridge Rule" -Passed $false -Message "Rule não encontrada"
    }
} catch {
    Add-CheckResult -Name "EventBridge Rule" -Passed $false -Message $_.Exception.Message
}

Write-Host ""
Write-Host "5. Validando Cognito Groups..." -ForegroundColor Yellow
try {
    # Obter User Pool ID
    $userPools = aws cognito-idp list-user-pools --max-results 10 --region $Region | ConvertFrom-Json
    $userPool = $userPools.UserPools | Where-Object { $_.Name -like "*alquimista*$env*" } | Select-Object -First 1
    
    if ($userPool) {
        $userPoolId = $userPool.Id
        Add-CheckResult -Name "Cognito User Pool" -Passed $true -Message "Pool ID: $userPoolId"
        
        # Verificar grupos
        $requiredGroups = @("INTERNAL_ADMIN", "INTERNAL_SUPPORT", "TENANT_ADMIN", "TENANT_USER")
        $groups = aws cognito-idp list-groups --user-pool-id $userPoolId --region $Region | ConvertFrom-Json
        
        foreach ($groupName in $requiredGroups) {
            $groupExists = $groups.Groups | Where-Object { $_.GroupName -eq $groupName }
            Add-CheckResult -Name "Cognito Group: $groupName" -Passed ($null -ne $groupExists)
        }
    } else {
        Add-CheckResult -Name "Cognito User Pool" -Passed $false -Message "User Pool não encontrado"
    }
} catch {
    Add-CheckResult -Name "Cognito Groups" -Passed $false -Message $_.Exception.Message
}

Write-Host ""
Write-Host "6. Validando Tabelas do Aurora..." -ForegroundColor Yellow
Write-Host "  (Requer conexão ao banco de dados - verificação manual)" -ForegroundColor Gray
Write-Host "  Tabelas esperadas:" -ForegroundColor Gray
Write-Host "    - tenant_users" -ForegroundColor Gray
Write-Host "    - tenant_agents" -ForegroundColor Gray
Write-Host "    - tenant_integrations" -ForegroundColor Gray
Write-Host "    - tenant_usage_daily" -ForegroundColor Gray
Write-Host "    - operational_events" -ForegroundColor Gray

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Resumo da Validação" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$passedChecks = ($allChecks | Where-Object { $_.Passed }).Count
$totalChecks = $allChecks.Count
$failedChecks = $totalChecks - $passedChecks

Write-Host ""
Write-Host "Total de Checks: $totalChecks" -ForegroundColor White
Write-Host "Passou: $passedChecks" -ForegroundColor Green
Write-Host "Falhou: $failedChecks" -ForegroundColor Red
Write-Host ""

if ($failedChecks -eq 0) {
    Write-Host "✓ Todos os checks passaram!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos passos:" -ForegroundColor Cyan
    Write-Host "1. Executar testes de integração" -ForegroundColor White
    Write-Host "2. Validar endpoints da API manualmente" -ForegroundColor White
    Write-Host "3. Verificar logs no CloudWatch" -ForegroundColor White
    exit 0
} else {
    Write-Host "✗ Alguns checks falharam. Revisar erros acima." -ForegroundColor Red
    Write-Host ""
    Write-Host "Checks que falharam:" -ForegroundColor Yellow
    $allChecks | Where-Object { -not $_.Passed } | ForEach-Object {
        Write-Host "  - $($_.Name): $($_.Message)" -ForegroundColor Yellow
    }
    exit 1
}
