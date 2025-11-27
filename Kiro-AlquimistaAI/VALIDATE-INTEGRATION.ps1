#!/usr/bin/env pwsh
# 🧪 Validação de Integração - Alquimista.AI
# Testa backend, frontend e integração completa

param(
    [string]$Environment = "dev",
    [string]$FrontendUrl = ""
)

$ErrorActionPreference = "Stop"

# Cores
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Cyan }
function Write-Warning { param($msg) Write-Host "⚠️  $msg" -ForegroundColor Yellow }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }
function Write-Test { param($msg) Write-Host "🧪 $msg" -ForegroundColor Magenta }

# Banner
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                        ║" -ForegroundColor Cyan
Write-Host "║        🧪 VALIDAÇÃO DE INTEGRAÇÃO COMPLETA 🧪         ║" -ForegroundColor Cyan
Write-Host "║                                                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$testResults = @{
    Passed = 0
    Failed = 0
    Warnings = 0
}

# ============================================================================
# TESTE 1: BACKEND - CLOUDFORMATION STACKS
# ============================================================================

Write-Test "Teste 1: Verificando CloudFormation Stacks"

$stacks = @(
    "FibonacciStack-$Environment",
    "NigredoStack-$Environment",
    "AlquimistaStack-$Environment"
)

foreach ($stackName in $stacks) {
    try {
        $stack = aws cloudformation describe-stacks --stack-name $stackName --query "Stacks[0].StackStatus" --output text
        
        if ($stack -eq "CREATE_COMPLETE" -or $stack -eq "UPDATE_COMPLETE") {
            Write-Success "$stackName: $stack"
            $testResults.Passed++
        } else {
            Write-Warning "$stackName: $stack"
            $testResults.Warnings++
        }
    } catch {
        Write-Error "$stackName: Não encontrada"
        $testResults.Failed++
    }
}

# ============================================================================
# TESTE 2: BACKEND - API GATEWAY
# ============================================================================

Write-Test "Teste 2: Testando API Gateway"

try {
    $outputs = aws cloudformation describe-stacks --stack-name "FibonacciStack-$Environment" --query "Stacks[0].Outputs" | ConvertFrom-Json
    $apiUrl = ($outputs | Where-Object { $_.OutputKey -eq "ApiEndpoint" }).OutputValue
    
    if (-not $apiUrl) {
        Write-Warning "API URL não encontrada nos outputs. Usando fallback."
        $apiUrl = "https://c5loeivg0k.execute-api.us-east-1.amazonaws.com"
    }
    
    Write-Info "API URL: $apiUrl"
    
    # Teste 2.1: Health Check
    Write-Info "Testando /health..."
    try {
        $response = Invoke-RestMethod -Uri "$apiUrl/health" -Method Get -TimeoutSec 10
        
        if ($response.ok) {
            Write-Success "Health check OK - Service: $($response.service)"
            $testResults.Passed++
            
            if ($response.db_status -eq "connected") {
                Write-Success "Database conectado"
                $testResults.Passed++
            } else {
                Write-Warning "Database não conectado: $($response.db_status)"
                $testResults.Warnings++
            }
        } else {
            Write-Error "Health check falhou"
            $testResults.Failed++
        }
    } catch {
        Write-Error "Falha ao chamar /health: $_"
        $testResults.Failed++
    }
    
    # Teste 2.2: CORS
    Write-Info "Testando CORS..."
    try {
        $headers = @{
            "Origin" = "https://example.com"
            "Access-Control-Request-Method" = "GET"
        }
        
        $response = Invoke-WebRequest -Uri "$apiUrl/health" -Method Options -Headers $headers -TimeoutSec 10
        
        if ($response.Headers["Access-Control-Allow-Origin"]) {
            Write-Success "CORS configurado: $($response.Headers['Access-Control-Allow-Origin'])"
            $testResults.Passed++
        } else {
            Write-Warning "CORS não encontrado nos headers"
            $testResults.Warnings++
        }
    } catch {
        Write-Warning "Não foi possível testar CORS: $_"
        $testResults.Warnings++
    }
    
} catch {
    Write-Error "Falha ao obter informações da API: $_"
    $testResults.Failed++
}

# ============================================================================
# TESTE 3: BACKEND - LAMBDA FUNCTIONS
# ============================================================================

Write-Test "Teste 3: Verificando Lambda Functions"

try {
    $lambdas = aws lambda list-functions --query "Functions[?starts_with(FunctionName, 'FibonacciStack') || starts_with(FunctionName, 'NigredoStack') || starts_with(FunctionName, 'AlquimistaStack')].FunctionName" --output json | ConvertFrom-Json
    
    $expectedLambdas = @(
        "ApiHandler",
        "RecebimentoAgent",
        "EstrategiaAgent",
        "DisparoAgent",
        "AtendimentoAgent",
        "SentimentoAgent",
        "AgendamentoAgent",
        "RelatoriosAgent"
    )
    
    Write-Info "Lambdas encontradas: $($lambdas.Count)"
    
    $foundCount = 0
    foreach ($expected in $expectedLambdas) {
        $found = $lambdas | Where-Object { $_ -like "*$expected*" }
        if ($found) {
            Write-Success "✓ $expected"
            $foundCount++
        } else {
            Write-Warning "✗ $expected não encontrada"
        }
    }
    
    if ($foundCount -ge 5) {
        Write-Success "Lambdas principais encontradas ($foundCount/$($expectedLambdas.Count))"
        $testResults.Passed++
    } else {
        Write-Warning "Poucas Lambdas encontradas ($foundCount/$($expectedLambdas.Count))"
        $testResults.Warnings++
    }
    
} catch {
    Write-Error "Falha ao listar Lambdas: $_"
    $testResults.Failed++
}

# ============================================================================
# TESTE 4: BACKEND - AURORA DATABASE
# ============================================================================

Write-Test "Teste 4: Verificando Aurora Database"

try {
    $dbClusters = aws rds describe-db-clusters --query "DBClusters[?starts_with(DBClusterIdentifier, 'fibonacci')].{ID:DBClusterIdentifier,Status:Status,Endpoint:Endpoint}" --output json | ConvertFrom-Json
    
    if ($dbClusters.Count -gt 0) {
        foreach ($cluster in $dbClusters) {
            if ($cluster.Status -eq "available") {
                Write-Success "Database: $($cluster.ID) - $($cluster.Status)"
                Write-Info "Endpoint: $($cluster.Endpoint)"
                $testResults.Passed++
            } else {
                Write-Warning "Database: $($cluster.ID) - $($cluster.Status)"
                $testResults.Warnings++
            }
        }
    } else {
        Write-Warning "Nenhum cluster Aurora encontrado"
        $testResults.Warnings++
    }
} catch {
    Write-Error "Falha ao verificar Aurora: $_"
    $testResults.Failed++
}

# ============================================================================
# TESTE 5: BACKEND - COGNITO USER POOL
# ============================================================================

Write-Test "Teste 5: Verificando Cognito User Pool"

try {
    $userPoolId = ($outputs | Where-Object { $_.OutputKey -eq "UserPoolId" }).OutputValue
    
    if ($userPoolId) {
        $userPool = aws cognito-idp describe-user-pool --user-pool-id $userPoolId --query "UserPool.{Name:Name,Status:Status,Id:Id}" --output json | ConvertFrom-Json
        
        Write-Success "User Pool: $($userPool.Name)"
        Write-Info "ID: $($userPool.Id)"
        Write-Info "Status: $($userPool.Status)"
        $testResults.Passed++
    } else {
        Write-Warning "User Pool ID não encontrado nos outputs"
        $testResults.Warnings++
    }
} catch {
    Write-Error "Falha ao verificar Cognito: $_"
    $testResults.Failed++
}

# ============================================================================
# TESTE 6: FRONTEND - ARQUIVOS E BUILD
# ============================================================================

Write-Test "Teste 6: Verificando Frontend"

# Teste 6.1: Arquivo .env.production
if (Test-Path "frontend/.env.production") {
    Write-Success "Arquivo .env.production existe"
    $testResults.Passed++
    
    $envContent = Get-Content "frontend/.env.production" -Raw
    
    if ($envContent -match "NEXT_PUBLIC_API_URL") {
        Write-Success "NEXT_PUBLIC_API_URL configurado"
        $testResults.Passed++
    } else {
        Write-Warning "NEXT_PUBLIC_API_URL não encontrado"
        $testResults.Warnings++
    }
    
    if ($envContent -match "NEXT_PUBLIC_COGNITO_USER_POOL_ID") {
        Write-Success "NEXT_PUBLIC_COGNITO_USER_POOL_ID configurado"
        $testResults.Passed++
    } else {
        Write-Warning "NEXT_PUBLIC_COGNITO_USER_POOL_ID não encontrado"
        $testResults.Warnings++
    }
} else {
    Write-Warning "Arquivo .env.production não encontrado"
    $testResults.Warnings++
}

# Teste 6.2: Build do Next.js
if (Test-Path "frontend/.next") {
    Write-Success "Build do Next.js existe"
    $testResults.Passed++
} else {
    Write-Warning "Build do Next.js não encontrado. Execute: cd frontend && npm run build"
    $testResults.Warnings++
}

# Teste 6.3: Dependências instaladas
if (Test-Path "frontend/node_modules") {
    Write-Success "Dependências do frontend instaladas"
    $testResults.Passed++
} else {
    Write-Warning "Dependências não instaladas. Execute: cd frontend && npm install"
    $testResults.Warnings++
}

# ============================================================================
# TESTE 7: FRONTEND - URL ACESSÍVEL (SE FORNECIDA)
# ============================================================================

if ($FrontendUrl) {
    Write-Test "Teste 7: Testando Frontend Deployado"
    
    try {
        Write-Info "URL: $FrontendUrl"
        $response = Invoke-WebRequest -Uri $FrontendUrl -Method Get -TimeoutSec 10
        
        if ($response.StatusCode -eq 200) {
            Write-Success "Frontend acessível (Status: $($response.StatusCode))"
            $testResults.Passed++
            
            # Verificar se é HTML
            if ($response.Content -match "<html") {
                Write-Success "Conteúdo HTML válido"
                $testResults.Passed++
            } else {
                Write-Warning "Conteúdo não parece ser HTML"
                $testResults.Warnings++
            }
        } else {
            Write-Warning "Frontend retornou status: $($response.StatusCode)"
            $testResults.Warnings++
        }
    } catch {
        Write-Error "Falha ao acessar frontend: $_"
        $testResults.Failed++
    }
} else {
    Write-Info "URL do frontend não fornecida. Pulando teste de acesso."
}

# ============================================================================
# TESTE 8: INTEGRAÇÃO - VARIÁVEIS DE AMBIENTE
# ============================================================================

Write-Test "Teste 8: Validando Integração Backend-Frontend"

if (Test-Path "frontend/.env.production") {
    $envContent = Get-Content "frontend/.env.production" -Raw
    $envApiUrl = if ($envContent -match 'NEXT_PUBLIC_API_URL=(.+)') { $matches[1].Trim() } else { $null }
    
    if ($envApiUrl -and $apiUrl) {
        if ($envApiUrl -eq $apiUrl) {
            Write-Success "API URL no frontend corresponde ao backend"
            $testResults.Passed++
        } else {
            Write-Warning "API URL no frontend ($envApiUrl) difere do backend ($apiUrl)"
            $testResults.Warnings++
        }
    }
}

# ============================================================================
# TESTE 9: CLOUDWATCH LOGS
# ============================================================================

Write-Test "Teste 9: Verificando CloudWatch Logs"

try {
    $logGroups = aws logs describe-log-groups --query "logGroups[?starts_with(logGroupName, '/aws/lambda/FibonacciStack') || starts_with(logGroupName, '/aws/lambda/NigredoStack')].logGroupName" --output json | ConvertFrom-Json
    
    if ($logGroups.Count -gt 0) {
        Write-Success "Log Groups encontrados: $($logGroups.Count)"
        $testResults.Passed++
    } else {
        Write-Warning "Nenhum Log Group encontrado"
        $testResults.Warnings++
    }
} catch {
    Write-Warning "Falha ao verificar CloudWatch Logs: $_"
    $testResults.Warnings++
}

# ============================================================================
# TESTE 10: EVENTBRIDGE
# ============================================================================

Write-Test "Teste 10: Verificando EventBridge"

try {
    $eventBuses = aws events list-event-buses --query "EventBuses[?starts_with(Name, 'fibonacci')].Name" --output json | ConvertFrom-Json
    
    if ($eventBuses.Count -gt 0) {
        Write-Success "Event Bus encontrado: $($eventBuses[0])"
        $testResults.Passed++
    } else {
        Write-Warning "Event Bus não encontrado"
        $testResults.Warnings++
    }
} catch {
    Write-Warning "Falha ao verificar EventBridge: $_"
    $testResults.Warnings++
}

# ============================================================================
# RESUMO FINAL
# ============================================================================

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                        ║" -ForegroundColor Cyan
Write-Host "║                  📊 RESUMO DOS TESTES                  ║" -ForegroundColor Cyan
Write-Host "║                                                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$total = $testResults.Passed + $testResults.Failed + $testResults.Warnings

Write-Host "Total de Testes: $total" -ForegroundColor White
Write-Success "Passou: $($testResults.Passed)"
Write-Warning "Avisos: $($testResults.Warnings)"
Write-Error "Falhou: $($testResults.Failed)"
Write-Host ""

# Calcular porcentagem de sucesso
$successRate = if ($total -gt 0) { [math]::Round(($testResults.Passed / $total) * 100, 2) } else { 0 }

Write-Host "Taxa de Sucesso: $successRate%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 60) { "Yellow" } else { "Red" })
Write-Host ""

# Status final
if ($testResults.Failed -eq 0 -and $testResults.Warnings -le 3) {
    Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                                                        ║" -ForegroundColor Green
    Write-Host "║          ✅ SISTEMA VALIDADO COM SUCESSO! ✅           ║" -ForegroundColor Green
    Write-Host "║                                                        ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
    exit 0
} elseif ($testResults.Failed -eq 0) {
    Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║                                                        ║" -ForegroundColor Yellow
    Write-Host "║      ⚠️  SISTEMA OK COM ALGUNS AVISOS ⚠️              ║" -ForegroundColor Yellow
    Write-Host "║                                                        ║" -ForegroundColor Yellow
    Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║                                                        ║" -ForegroundColor Red
    Write-Host "║        ❌ SISTEMA COM FALHAS CRÍTICAS ❌              ║" -ForegroundColor Red
    Write-Host "║                                                        ║" -ForegroundColor Red
    Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Red
    Write-Host ""
    Write-Info "Verifique os erros acima e consulte: docs/deploy/TROUBLESHOOTING.md"
    exit 1
}
