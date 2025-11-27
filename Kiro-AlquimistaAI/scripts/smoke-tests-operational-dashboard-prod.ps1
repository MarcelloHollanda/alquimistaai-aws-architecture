# Smoke Tests - Painel Operacional AlquimistaAI (Produção)
# Valida funcionalidades críticas após deploy

param(
    [string]$Environment = "prod"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Smoke Tests - Painel Operacional" -ForegroundColor Cyan
Write-Host "Ambiente: $Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$REGION = "us-east-1"
$testsPassed = 0
$testsFailed = 0
$testsSkipped = 0

# Função para executar teste
function Test-Component {
    param(
        [string]$Name,
        [scriptblock]$TestScript
    )
    
    Write-Host "`n[$Name]" -ForegroundColor Yellow
    
    try {
        $result = & $TestScript
        
        if ($result) {
            Write-Host "  ✓ PASSOU" -ForegroundColor Green
            $script:testsPassed++
            return $true
        } else {
            Write-Host "  ✗ FALHOU" -ForegroundColor Red
            $script:testsFailed++
            return $false
        }
        
    } catch {
        Write-Host "  ✗ ERRO: $($_.Exception.Message)" -ForegroundColor Red
        $script:testsFailed++
        return $false
    }
}

# ============================================
# TESTES DE INFRAESTRUTURA
# ============================================

Write-Host "`n=== TESTES DE INFRAESTRUTURA ===" -ForegroundColor Cyan

# Teste 1: DynamoDB Table
Test-Component "DynamoDB Table" {
    $tableStatus = aws dynamodb describe-table `
        --table-name "alquimista-operational-commands-$Environment" `
        --region $REGION `
        --query "Table.TableStatus" `
        --output text 2>$null
    
    if ($tableStatus -eq "ACTIVE") {
        Write-Host "    Status: ACTIVE"
        return $true
    } else {
        Write-Host "    Status: $tableStatus (esperado: ACTIVE)"
        return $false
    }
}

# Teste 2: ElastiCache Redis
Test-Component "ElastiCache Redis" {
    $cacheStatus = aws elasticache describe-cache-clusters `
        --cache-cluster-id "alquimista-redis-$Environment" `
        --region $REGION `
        --query "CacheClusters[0].CacheClusterStatus" `
        --output text 2>$null
    
    if ($cacheStatus -eq "available") {
        Write-Host "    Status: available"
        return $true
    } else {
        Write-Host "    Status: $cacheStatus (esperado: available)"
        return $false
    }
}

# Teste 3: Lambda Functions
Test-Component "Lambda Functions" {
    $lambdas = aws lambda list-functions `
        --region $REGION `
        --query "Functions[?contains(FunctionName, 'operational') && contains(FunctionName, '$Environment')].FunctionName" `
        --output text
    
    $lambdaCount = ($lambdas -split '\s+').Count
    
    Write-Host "    Funções encontradas: $lambdaCount"
    
    if ($lambdaCount -ge 14) {
        return $true
    } else {
        Write-Host "    Esperado: >= 14 funções"
        return $false
    }
}

# Teste 4: Aurora Database
Test-Component "Aurora Database" {
    try {
        $secretJson = aws secretsmanager get-secret-value `
            --secret-id "/alquimista/$Environment/aurora/credentials" `
            --region $REGION `
            --query SecretString `
            --output text | ConvertFrom-Json
        
        $env:PGHOST = $secretJson.host
        $env:PGUSER = $secretJson.username
        $env:PGPASSWORD = $secretJson.password
        $env:PGDATABASE = "alquimista_platform"
        
        $result = psql -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'alquimista_platform' AND table_name LIKE 'tenant_%';" -t 2>$null
        
        $tableCount = [int]$result.Trim()
        
        Write-Host "    Tabelas tenant_*: $tableCount"
        
        if ($tableCount -ge 5) {
            return $true
        } else {
            Write-Host "    Esperado: >= 5 tabelas"
            return $false
        }
        
    } catch {
        Write-Host "    Erro ao conectar: $($_.Exception.Message)"
        return $false
    }
}

# Teste 5: Cognito Groups
Test-Component "Cognito Groups" {
    $userPoolId = aws cognito-idp list-user-pools `
        --max-results 10 `
        --region $REGION `
        --query "UserPools[?Name=='alquimista-users-$Environment'].Id" `
        --output text
    
    if ([string]::IsNullOrEmpty($userPoolId)) {
        Write-Host "    User Pool não encontrado"
        return $false
    }
    
    $groups = aws cognito-idp list-groups `
        --user-pool-id $userPoolId `
        --region $REGION `
        --query "Groups[].GroupName" `
        --output text
    
    $requiredGroups = @("INTERNAL_ADMIN", "INTERNAL_SUPPORT", "TENANT_ADMIN", "TENANT_USER")
    $foundGroups = $groups -split '\s+'
    
    $allFound = $true
    foreach ($group in $requiredGroups) {
        if ($foundGroups -contains $group) {
            Write-Host "    ✓ $group"
        } else {
            Write-Host "    ✗ $group (não encontrado)"
            $allFound = $false
        }
    }
    
    return $allFound
}

# ============================================
# TESTES DE LOGS E MONITORAMENTO
# ============================================

Write-Host "`n=== TESTES DE LOGS E MONITORAMENTO ===" -ForegroundColor Cyan

# Teste 6: CloudWatch Log Groups
Test-Component "CloudWatch Log Groups" {
    $logGroups = aws logs describe-log-groups `
        --region $REGION `
        --query "logGroups[?contains(logGroupName, 'operational') && contains(logGroupName, '$Environment')].logGroupName" `
        --output text
    
    $logGroupCount = ($logGroups -split '\s+').Count
    
    Write-Host "    Log Groups encontrados: $logGroupCount"
    
    if ($logGroupCount -ge 10) {
        return $true
    } else {
        Write-Host "    Esperado: >= 10 log groups"
        return $false
    }
}

# Teste 7: Verificar erros recentes nos logs
Test-Component "Erros Recentes nos Logs" {
    $fiveMinutesAgo = [int]((Get-Date).AddMinutes(-5).ToUniversalTime() - (Get-Date "1970-01-01")).TotalMilliseconds
    
    $logGroupName = "/aws/lambda/alquimista-get-tenant-me-$Environment"
    
    try {
        $errors = aws logs filter-log-events `
            --log-group-name $logGroupName `
            --filter-pattern "ERROR" `
            --start-time $fiveMinutesAgo `
            --region $REGION `
            --query "events[].message" `
            --output text 2>$null
        
        if ([string]::IsNullOrEmpty($errors)) {
            Write-Host "    Nenhum erro encontrado (últimos 5 minutos)"
            return $true
        } else {
            Write-Host "    Erros encontrados:"
            Write-Host "    $errors"
            return $false
        }
        
    } catch {
        Write-Host "    Log group ainda não existe (normal em deploy novo)"
        $script:testsSkipped++
        return $true
    }
}

# ============================================
# TESTES DE API (BÁSICOS)
# ============================================

Write-Host "`n=== TESTES DE API ===" -ForegroundColor Cyan

# Teste 8: API Gateway Endpoints
Test-Component "API Gateway Endpoints" {
    $apis = aws apigatewayv2 get-apis `
        --region $REGION `
        --query "Items[?contains(Name, 'alquimista') && contains(Name, '$Environment')].ApiEndpoint" `
        --output text
    
    if (-not [string]::IsNullOrEmpty($apis)) {
        Write-Host "    API Endpoint: $apis"
        return $true
    } else {
        Write-Host "    Nenhum API Gateway encontrado"
        return $false
    }
}

# ============================================
# RESUMO
# ============================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUMO DOS TESTES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$totalTests = $testsPassed + $testsFailed + $testsSkipped

Write-Host "Total de testes: $totalTests" -ForegroundColor White
Write-Host "Passou: $testsPassed" -ForegroundColor Green
Write-Host "Falhou: $testsFailed" -ForegroundColor Red
Write-Host "Ignorado: $testsSkipped" -ForegroundColor Yellow
Write-Host ""

$successRate = if ($totalTests -gt 0) { [math]::Round(($testsPassed / $totalTests) * 100, 2) } else { 0 }
Write-Host "Taxa de sucesso: $successRate%" -ForegroundColor $(if ($successRate -ge 90) { "Green" } elseif ($successRate -ge 70) { "Yellow" } else { "Red" })
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "✓ TODOS OS TESTES PASSARAM!" -ForegroundColor Green
    Write-Host ""
    Write-Host "O sistema está pronto para uso." -ForegroundColor Green
    exit 0
} else {
    Write-Host "✗ ALGUNS TESTES FALHARAM" -ForegroundColor Red
    Write-Host ""
    Write-Host "Revise os erros acima e corrija antes de prosseguir." -ForegroundColor Yellow
    Write-Host "Consulte: docs/operational-dashboard/TROUBLESHOOTING.md" -ForegroundColor Yellow
    exit 1
}
