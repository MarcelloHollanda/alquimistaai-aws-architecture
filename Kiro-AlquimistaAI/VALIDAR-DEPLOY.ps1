# 🔍 Script de Validação de Deploy - Alquimista.AI
# Valida se o deploy foi bem-sucedido

$ErrorActionPreference = "Continue"
$StackName = "FibonacciStack-dev"

Write-Host "`n🔍 Validação de Deploy - Alquimista.AI" -ForegroundColor Cyan
Write-Host "======================================`n" -ForegroundColor Cyan

$allPassed = $true

# 1. Verificar Stack
Write-Host "1️⃣  Verificando Stack CloudFormation..." -ForegroundColor Yellow
try {
    $stackStatus = aws cloudformation describe-stacks --stack-name $StackName --query "Stacks[0].StackStatus" --output text 2>$null
    if ($stackStatus -eq "CREATE_COMPLETE" -or $stackStatus -eq "UPDATE_COMPLETE") {
        Write-Host "   ✅ Stack: $stackStatus" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Stack: $stackStatus" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "   ❌ Stack não encontrada" -ForegroundColor Red
    $allPassed = $false
}

# 2. Verificar API Gateway
Write-Host "`n2️⃣  Verificando API Gateway..." -ForegroundColor Yellow
try {
    $apiEndpoint = aws cloudformation describe-stacks --stack-name $StackName --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" --output text 2>$null
    if ($apiEndpoint) {
        Write-Host "   URL: $apiEndpoint" -ForegroundColor White
        
        # Testar endpoint /health
        try {
            $response = Invoke-WebRequest -Uri "$apiEndpoint/health" -Method Get -TimeoutSec 10 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Host "   ✅ API respondendo (200 OK)" -ForegroundColor Green
                $content = $response.Content | ConvertFrom-Json
                Write-Host "   Response: $($content | ConvertTo-Json -Compress)" -ForegroundColor Gray
            } else {
                Write-Host "   ⚠️  API respondeu com status: $($response.StatusCode)" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "   ❌ Erro ao testar API: $($_.Exception.Message)" -ForegroundColor Red
            $allPassed = $false
        }
    } else {
        Write-Host "   ❌ API Endpoint não encontrado" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "   ❌ Erro ao obter API Endpoint" -ForegroundColor Red
    $allPassed = $false
}

# 3. Verificar Lambdas
Write-Host "`n3️⃣  Verificando Lambdas..." -ForegroundColor Yellow
try {
    $lambdas = aws lambda list-functions --query "Functions[?starts_with(FunctionName, 'FibonacciStack')].FunctionName" --output text 2>$null
    if ($lambdas) {
        $lambdaCount = ($lambdas -split '\s+').Count
        Write-Host "   ✅ $lambdaCount Lambda(s) encontrada(s)" -ForegroundColor Green
        $lambdas -split '\s+' | ForEach-Object {
            Write-Host "      - $_" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ⚠️  Nenhuma Lambda encontrada" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Erro ao listar Lambdas" -ForegroundColor Red
    $allPassed = $false
}

# 4. Verificar Cognito User Pool
Write-Host "`n4️⃣  Verificando Cognito User Pool..." -ForegroundColor Yellow
try {
    $userPoolId = aws cloudformation describe-stacks --stack-name $StackName --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" --output text 2>$null
    if ($userPoolId) {
        Write-Host "   ✅ User Pool ID: $userPoolId" -ForegroundColor Green
        
        $clientId = aws cloudformation describe-stacks --stack-name $StackName --query "Stacks[0].Outputs[?OutputKey=='UserPoolClientId'].OutputValue" --output text 2>$null
        if ($clientId) {
            Write-Host "   ✅ Client ID: $clientId" -ForegroundColor Green
        }
    } else {
        Write-Host "   ❌ User Pool não encontrado" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "   ❌ Erro ao verificar Cognito" -ForegroundColor Red
    $allPassed = $false
}

# 5. Verificar Aurora
Write-Host "`n5️⃣  Verificando Aurora Database..." -ForegroundColor Yellow
try {
    $dbEndpoint = aws cloudformation describe-stacks --stack-name $StackName --query "Stacks[0].Outputs[?OutputKey=='DatabaseEndpoint'].OutputValue" --output text 2>$null
    if ($dbEndpoint) {
        Write-Host "   ✅ Database Endpoint: $dbEndpoint" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Database Endpoint não encontrado nos outputs" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Erro ao verificar Aurora" -ForegroundColor Red
}

# 6. Verificar CloudFront
Write-Host "`n6️⃣  Verificando CloudFront..." -ForegroundColor Yellow
try {
    $cloudFrontUrl = aws cloudformation describe-stacks --stack-name $StackName --query "Stacks[0].Outputs[?OutputKey=='CloudFrontUrl'].OutputValue" --output text 2>$null
    if ($cloudFrontUrl) {
        Write-Host "   ✅ CloudFront URL: $cloudFrontUrl" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  CloudFront URL não encontrado" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Erro ao verificar CloudFront" -ForegroundColor Red
}

# 7. Verificar EventBridge
Write-Host "`n7️⃣  Verificando EventBridge..." -ForegroundColor Yellow
try {
    $eventBus = aws events list-event-buses --query "EventBuses[?contains(Name, 'fibonacci')].Name" --output text 2>$null
    if ($eventBus) {
        Write-Host "   ✅ Event Bus: $eventBus" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Event Bus não encontrado" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Erro ao verificar EventBridge" -ForegroundColor Red
}

# 8. Verificar CloudWatch Dashboards
Write-Host "`n8️⃣  Verificando CloudWatch Dashboards..." -ForegroundColor Yellow
try {
    $dashboards = aws cloudwatch list-dashboards --query "DashboardEntries[?contains(DashboardName, 'Fibonacci')].DashboardName" --output text 2>$null
    if ($dashboards) {
        $dashboardCount = ($dashboards -split '\s+').Count
        Write-Host "   ✅ $dashboardCount Dashboard(s) encontrado(s)" -ForegroundColor Green
        $dashboards -split '\s+' | ForEach-Object {
            Write-Host "      - $_" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ⚠️  Nenhum Dashboard encontrado" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Erro ao verificar Dashboards" -ForegroundColor Red
}

# Resumo Final
Write-Host "`n" -NoNewline
Write-Host "========================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "✅ VALIDAÇÃO COMPLETA - DEPLOY OK!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "`n🎉 Todos os componentes principais estão funcionando!" -ForegroundColor Green
    Write-Host "`n📋 Próximos Passos:" -ForegroundColor Cyan
    Write-Host "   1. Configure o frontend com os outputs acima" -ForegroundColor White
    Write-Host "   2. Deploy do frontend no Vercel" -ForegroundColor White
    Write-Host "   3. Teste a integração completa" -ForegroundColor White
} else {
    Write-Host "⚠️  VALIDAÇÃO COM PROBLEMAS" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "`n🔧 Alguns componentes precisam de atenção." -ForegroundColor Yellow
    Write-Host "   Revise os itens marcados com ❌ acima." -ForegroundColor White
}

Write-Host "`n📊 Outputs Completos:" -ForegroundColor Cyan
Write-Host "   Arquivo: backend-outputs.json" -ForegroundColor White
Write-Host "   Comando: aws cloudformation describe-stacks --stack-name $StackName --query 'Stacks[0].Outputs' --output table" -ForegroundColor Gray

Write-Host "`n"
