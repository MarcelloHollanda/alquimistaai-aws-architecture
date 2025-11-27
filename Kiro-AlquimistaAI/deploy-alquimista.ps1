# Deploy Completo Alquimista.AI
# Deploy automatizado de Backend (AWS CDK) + Frontend (Vercel)

param(
    [string]$Environment = "dev",
    [switch]$SkipBackend,
    [switch]$SkipFrontend,
    [switch]$SkipValidation
)

$ErrorActionPreference = "Continue"
$StackName = "FibonacciStack-$Environment"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY ALQUIMISTA.AI - SISTEMA COMPLETO" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "[INFO] Ambiente: $Environment" -ForegroundColor White
Write-Host "[INFO] Stack: $StackName`n" -ForegroundColor White

$startTime = Get-Date

# ============================================
# PARTE 1: DEPLOY DO BACKEND (AWS CDK)
# ============================================

if (-not $SkipBackend) {
    Write-Host "`n[BACKEND] Iniciando deploy do backend..." -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan

    # Passo 1: Verificar credenciais AWS
    Write-Host "[1/6] Verificando credenciais AWS..." -ForegroundColor Yellow
    try {
        $identity = aws sts get-caller-identity 2>&1 | ConvertFrom-Json
        Write-Host "   [OK] Conta AWS: $($identity.Account)" -ForegroundColor Green
        Write-Host "   [OK] Usuario: $($identity.Arn)" -ForegroundColor Green
    } catch {
        Write-Host "   [ERRO] Credenciais AWS invalidas" -ForegroundColor Red
        exit 1
    }

    # Passo 2: Limpar cache
    Write-Host "`n[2/6] Limpando cache..." -ForegroundColor Yellow
    if (Test-Path "cdk.out") {
        Remove-Item -Recurse -Force cdk.out
        Write-Host "   [OK] Cache CDK limpo" -ForegroundColor Green
    } else {
        Write-Host "   [INFO] Cache ja estava limpo" -ForegroundColor Gray
    }

    # Passo 3: Instalar dependencias
    Write-Host "`n[3/6] Instalando dependencias..." -ForegroundColor Yellow
    npm install --silent 2>&1 | Out-Null
    Write-Host "   [OK] Dependencias instaladas" -ForegroundColor Green

    # Passo 4: Build
    Write-Host "`n[4/6] Compilando TypeScript..." -ForegroundColor Yellow
    npm run build 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] Build concluido" -ForegroundColor Green
    } else {
        Write-Host "   [ERRO] Falha no build" -ForegroundColor Red
        exit 1
    }

    # Passo 5: Validar CDK
    Write-Host "`n[5/6] Validando sintaxe CDK..." -ForegroundColor Yellow
    npx cdk synth --context env=$Environment 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] Sintaxe CDK validada" -ForegroundColor Green
    } else {
        Write-Host "   [ERRO] Erro na validacao CDK" -ForegroundColor Red
        exit 1
    }

    # Passo 6: Deploy
    Write-Host "`n[6/6] Fazendo deploy do backend..." -ForegroundColor Yellow
    Write-Host "   Isso pode levar 15-25 minutos. Aguarde...`n" -ForegroundColor White
    
    npx cdk deploy $StackName --require-approval never --context env=$Environment
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n   [OK] Backend deployado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "`n   [ERRO] Falha no deploy do backend" -ForegroundColor Red
        exit 1
    }

    # Capturar outputs
    Write-Host "`n[OUTPUTS] Capturando outputs do backend..." -ForegroundColor Yellow
    $outputs = aws cloudformation describe-stacks --stack-name $StackName --query "Stacks[0].Outputs" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        $outputs | Out-File -FilePath "backend-outputs-$Environment.json"
        Write-Host "   [OK] Outputs salvos em: backend-outputs-$Environment.json" -ForegroundColor Green
        
        # Exibir outputs principais
        Write-Host "`n   Outputs principais:" -ForegroundColor White
        $outputsObj = $outputs | ConvertFrom-Json
        foreach ($output in $outputsObj) {
            Write-Host "   - $($output.OutputKey): $($output.OutputValue)" -ForegroundColor Gray
        }
    }

} else {
    Write-Host "`n[BACKEND] Pulando deploy do backend (--SkipBackend)" -ForegroundColor Yellow
}

# ============================================
# PARTE 2: DEPLOY DO FRONTEND (VERCEL)
# ============================================

if (-not $SkipFrontend) {
    Write-Host "`n`n[FRONTEND] Iniciando deploy do frontend..." -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan

    # Verificar se Vercel CLI esta instalado
    Write-Host "[1/5] Verificando Vercel CLI..." -ForegroundColor Yellow
    $vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
    if (-not $vercelInstalled) {
        Write-Host "   [AVISO] Vercel CLI nao encontrado" -ForegroundColor Yellow
        Write-Host "   Instale com: npm i -g vercel" -ForegroundColor White
        Write-Host "   Pulando deploy do frontend..." -ForegroundColor Yellow
    } else {
        Write-Host "   [OK] Vercel CLI encontrado" -ForegroundColor Green

        # Navegar para pasta frontend
        Push-Location frontend

        try {
            # Passo 2: Instalar dependencias
            Write-Host "`n[2/5] Instalando dependencias do frontend..." -ForegroundColor Yellow
            npm install --silent 2>&1 | Out-Null
            Write-Host "   [OK] Dependencias instaladas" -ForegroundColor Green

            # Passo 3: Verificar variaveis de ambiente
            Write-Host "`n[3/5] Verificando variaveis de ambiente..." -ForegroundColor Yellow
            if (Test-Path ".env.production") {
                Write-Host "   [OK] Arquivo .env.production encontrado" -ForegroundColor Green
            } else {
                Write-Host "   [AVISO] Arquivo .env.production nao encontrado" -ForegroundColor Yellow
                Write-Host "   Crie o arquivo com os outputs do backend" -ForegroundColor White
                
                # Criar template
                $envTemplate = @"
NEXT_PUBLIC_API_URL=https://[SEU-API-GATEWAY-URL]
NEXT_PUBLIC_COGNITO_USER_POOL_ID=[SEU-USER-POOL-ID]
NEXT_PUBLIC_COGNITO_CLIENT_ID=[SEU-CLIENT-ID]
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_ENV=production
"@
                $envTemplate | Out-File -FilePath ".env.production.template"
                Write-Host "   [INFO] Template criado em: .env.production.template" -ForegroundColor Gray
            }

            # Passo 4: Build
            Write-Host "`n[4/5] Fazendo build do frontend..." -ForegroundColor Yellow
            npm run build 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   [OK] Build do frontend concluido" -ForegroundColor Green
            } else {
                Write-Host "   [ERRO] Falha no build do frontend" -ForegroundColor Red
                Pop-Location
                exit 1
            }

            # Passo 5: Deploy no Vercel
            Write-Host "`n[5/5] Fazendo deploy no Vercel..." -ForegroundColor Yellow
            Write-Host "   Isso pode levar 5-10 minutos. Aguarde...`n" -ForegroundColor White
            
            if ($Environment -eq "prod") {
                vercel --prod
            } else {
                vercel
            }
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "`n   [OK] Frontend deployado com sucesso!" -ForegroundColor Green
            } else {
                Write-Host "`n   [ERRO] Falha no deploy do frontend" -ForegroundColor Red
                Pop-Location
                exit 1
            }

        } finally {
            Pop-Location
        }
    }

} else {
    Write-Host "`n[FRONTEND] Pulando deploy do frontend (--SkipFrontend)" -ForegroundColor Yellow
}

# ============================================
# PARTE 3: VALIDACAO
# ============================================

if (-not $SkipValidation -and -not $SkipBackend) {
    Write-Host "`n`n[VALIDACAO] Validando deploy..." -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan

    # Verificar stack
    Write-Host "[1/3] Verificando stack..." -ForegroundColor Yellow
    $stackStatus = aws cloudformation describe-stacks --stack-name $StackName --query "Stacks[0].StackStatus" --output text 2>&1
    if ($stackStatus -eq "CREATE_COMPLETE" -or $stackStatus -eq "UPDATE_COMPLETE") {
        Write-Host "   [OK] Stack: $stackStatus" -ForegroundColor Green
    } else {
        Write-Host "   [AVISO] Stack: $stackStatus" -ForegroundColor Yellow
    }

    # Testar API
    Write-Host "`n[2/3] Testando API..." -ForegroundColor Yellow
    try {
        $apiEndpoint = aws cloudformation describe-stacks --stack-name $StackName --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" --output text 2>&1
        if ($apiEndpoint) {
            $response = Invoke-WebRequest -Uri "$apiEndpoint/health" -Method Get -TimeoutSec 10 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Host "   [OK] API respondendo (200 OK)" -ForegroundColor Green
            }
        }
    } catch {
        Write-Host "   [AVISO] Nao foi possivel testar a API" -ForegroundColor Yellow
    }

    # Listar Lambdas
    Write-Host "`n[3/3] Verificando Lambdas..." -ForegroundColor Yellow
    $lambdas = aws lambda list-functions --query "Functions[?starts_with(FunctionName, '$StackName')].FunctionName" --output text 2>&1
    if ($lambdas) {
        $lambdaCount = ($lambdas -split '\s+').Count
        Write-Host "   [OK] $lambdaCount Lambda(s) encontrada(s)" -ForegroundColor Green
    }

} else {
    Write-Host "`n[VALIDACAO] Pulando validacao" -ForegroundColor Yellow
}

# ============================================
# RESUMO FINAL
# ============================================

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host "`n`n========================================" -ForegroundColor Green
Write-Host "  DEPLOY CONCLUIDO COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "[RESUMO]" -ForegroundColor Cyan
Write-Host "  Ambiente: $Environment" -ForegroundColor White
Write-Host "  Tempo total: $($duration.Minutes) min $($duration.Seconds) seg" -ForegroundColor White
Write-Host "  Backend: $(if ($SkipBackend) { 'Pulado' } else { 'Deployado' })" -ForegroundColor White
Write-Host "  Frontend: $(if ($SkipFrontend) { 'Pulado' } else { 'Deployado' })" -ForegroundColor White

Write-Host "`n[PROXIMOS PASSOS]" -ForegroundColor Cyan
Write-Host "  1. Acesse o frontend e teste a aplicacao" -ForegroundColor White
Write-Host "  2. Verifique os logs no CloudWatch" -ForegroundColor White
Write-Host "  3. Configure monitoramento e alarmes" -ForegroundColor White

Write-Host "`n[MONITORAMENTO]" -ForegroundColor Cyan
Write-Host "  CloudWatch: https://console.aws.amazon.com/cloudwatch" -ForegroundColor White
Write-Host "  Lambda: https://console.aws.amazon.com/lambda" -ForegroundColor White
Write-Host "  API Gateway: https://console.aws.amazon.com/apigateway" -ForegroundColor White

Write-Host "`n[CONCLUIDO]`n" -ForegroundColor Green
