#!/usr/bin/env pwsh
# 🚀 Deploy Completo do Sistema - Alquimista.AI
# Backend (AWS CDK) + Frontend (Vercel/Amplify)

param(
    [string]$Environment = "dev",
    [switch]$SkipBackend,
    [switch]$SkipFrontend,
    [switch]$SkipValidation,
    [string]$FrontendPlatform = "vercel" # vercel, amplify, ou s3
)

$ErrorActionPreference = "Stop"

# Cores
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Cyan }
function Write-Warning { param($msg) Write-Host "⚠️  $msg" -ForegroundColor Yellow }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }
function Write-Step { param($msg) Write-Host "`n🔹 $msg" -ForegroundColor Magenta }

# Banner
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                        ║" -ForegroundColor Cyan
Write-Host "║        🚀 DEPLOY COMPLETO - ALQUIMISTA.AI 🚀          ║" -ForegroundColor Cyan
Write-Host "║                                                        ║" -ForegroundColor Cyan
Write-Host "║     Backend (AWS CDK) + Frontend (Vercel/Amplify)     ║" -ForegroundColor Cyan
Write-Host "║                                                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Info "Ambiente: $Environment"
Write-Info "Plataforma Frontend: $FrontendPlatform"
Write-Host ""

$startTime = Get-Date

# ============================================================================
# FASE 0: PRÉ-REQUISITOS
# ============================================================================

Write-Step "Fase 0: Verificando Pré-requisitos"

# Verificar AWS CLI
try {
    $awsIdentity = aws sts get-caller-identity | ConvertFrom-Json
    Write-Success "AWS CLI configurado - Account: $($awsIdentity.Account)"
} catch {
    Write-Error "AWS CLI não configurado ou credenciais inválidas"
    exit 1
}

# Verificar Node.js
try {
    $nodeVersion = node --version
    Write-Success "Node.js instalado - Versão: $nodeVersion"
} catch {
    Write-Error "Node.js não encontrado. Instale Node.js 18+"
    exit 1
}

# Verificar CDK
try {
    $cdkVersion = npx cdk --version
    Write-Success "AWS CDK disponível - $cdkVersion"
} catch {
    Write-Warning "AWS CDK não encontrado. Instalando..."
    npm install -g aws-cdk
}

# ============================================================================
# FASE 1: DEPLOY DO BACKEND
# ============================================================================

if (-not $SkipBackend) {
    Write-Step "Fase 1: Deploy do Backend (AWS CDK)"
    
    # Limpar cache
    Write-Info "Limpando cache do CDK..."
    if (Test-Path "cdk.out") {
        Remove-Item -Recurse -Force "cdk.out"
    }
    
    # Instalar dependências
    Write-Info "Instalando dependências do backend..."
    npm install
    
    # Compilar TypeScript
    Write-Info "Compilando TypeScript..."
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Falha na compilação do TypeScript"
        exit 1
    }
    
    # Validar CDK
    Write-Info "Validando sintaxe do CDK..."
    npx cdk synth --context env=$Environment > $null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Falha na validação do CDK"
        exit 1
    }
    
    Write-Success "Validação do CDK concluída"
    
    # Deploy das stacks
    Write-Info "Iniciando deploy das stacks..."
    Write-Host ""
    
    # Stack 1: Fibonacci (Core)
    Write-Info "📦 Deployando FibonacciStack-$Environment..."
    npx cdk deploy "FibonacciStack-$Environment" --require-approval never --context env=$Environment
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Falha no deploy da FibonacciStack"
        exit 1
    }
    Write-Success "FibonacciStack deployada"
    
    # Stack 2: Nigredo (Agentes)
    Write-Info "📦 Deployando NigredoStack-$Environment..."
    npx cdk deploy "NigredoStack-$Environment" --require-approval never --context env=$Environment
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Falha no deploy da NigredoStack"
        exit 1
    }
    Write-Success "NigredoStack deployada"
    
    # Stack 3: Alquimista (Plataforma)
    Write-Info "📦 Deployando AlquimistaStack-$Environment..."
    npx cdk deploy "AlquimistaStack-$Environment" --require-approval never --context env=$Environment
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Falha no deploy da AlquimistaStack"
        exit 1
    }
    Write-Success "AlquimistaStack deployada"
    
    # Capturar outputs
    Write-Info "Capturando outputs do CloudFormation..."
    $outputFile = "backend-outputs-$Environment.json"
    aws cloudformation describe-stacks --stack-name "FibonacciStack-$Environment" --query "Stacks[0].Outputs" > $outputFile
    Write-Success "Outputs salvos em: $outputFile"
    
    # Exibir outputs importantes
    Write-Host ""
    Write-Info "📋 Outputs Importantes:"
    aws cloudformation describe-stacks --stack-name "FibonacciStack-$Environment" --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint' || OutputKey=='UserPoolId' || OutputKey=='UserPoolClientId' || OutputKey=='CloudFrontUrl'].{Key:OutputKey,Value:OutputValue}" --output table
    
    Write-Success "Backend deployado com sucesso!"
    
} else {
    Write-Warning "Deploy do backend pulado (--SkipBackend)"
}

# ============================================================================
# FASE 2: CONFIGURAR FRONTEND
# ============================================================================

if (-not $SkipFrontend) {
    Write-Step "Fase 2: Configurando Frontend"
    
    # Obter outputs do backend
    Write-Info "Obtendo configurações do backend..."
    $outputs = aws cloudformation describe-stacks --stack-name "FibonacciStack-$Environment" --query "Stacks[0].Outputs" | ConvertFrom-Json
    
    $apiUrl = ($outputs | Where-Object { $_.OutputKey -eq "ApiEndpoint" }).OutputValue
    $userPoolId = ($outputs | Where-Object { $_.OutputKey -eq "UserPoolId" }).OutputValue
    $clientId = ($outputs | Where-Object { $_.OutputKey -eq "UserPoolClientId" }).OutputValue
    
    if (-not $apiUrl) {
        Write-Warning "API URL não encontrada nos outputs. Usando valor padrão."
        $apiUrl = "https://c5loeivg0k.execute-api.us-east-1.amazonaws.com"
    }
    
    Write-Info "API URL: $apiUrl"
    Write-Info "User Pool ID: $userPoolId"
    Write-Info "Client ID: $clientId"
    
    # Criar arquivo .env.production
    Write-Info "Criando frontend/.env.production..."
    $envContent = @"
# Ambiente de Produção - Alquimista.AI
# Gerado automaticamente em $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# API Backend
NEXT_PUBLIC_API_URL=$apiUrl

# Cognito
NEXT_PUBLIC_COGNITO_USER_POOL_ID=$userPoolId
NEXT_PUBLIC_COGNITO_CLIENT_ID=$clientId
NEXT_PUBLIC_AWS_REGION=us-east-1

# Ambiente
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_APP_NAME=Alquimista.AI
NEXT_PUBLIC_APP_VERSION=1.0.0
"@
    
    Set-Content -Path "frontend/.env.production" -Value $envContent
    Write-Success "Arquivo .env.production criado"
    
} else {
    Write-Warning "Configuração do frontend pulada (--SkipFrontend)"
}

# ============================================================================
# FASE 3: DEPLOY DO FRONTEND
# ============================================================================

if (-not $SkipFrontend) {
    Write-Step "Fase 3: Deploy do Frontend ($FrontendPlatform)"
    
    Push-Location frontend
    
    try {
        # Instalar dependências
        Write-Info "Instalando dependências do frontend..."
        npm install
        
        # Build
        Write-Info "Fazendo build do Next.js..."
        npm run build
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Falha no build do frontend"
            Pop-Location
            exit 1
        }
        
        Write-Success "Build do frontend concluído"
        
        # Deploy baseado na plataforma
        switch ($FrontendPlatform.ToLower()) {
            "vercel" {
                Write-Info "Deployando no Vercel..."
                
                # Verificar se Vercel CLI está instalado
                try {
                    vercel --version > $null
                } catch {
                    Write-Warning "Vercel CLI não encontrado. Instalando..."
                    npm install -g vercel
                }
                
                # Deploy
                Write-Info "Executando: vercel --prod"
                vercel --prod
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Success "Frontend deployado no Vercel!"
                } else {
                    Write-Error "Falha no deploy do Vercel"
                    Pop-Location
                    exit 1
                }
            }
            
            "amplify" {
                Write-Info "Deployando no AWS Amplify..."
                
                # Verificar se Amplify CLI está instalado
                try {
                    amplify --version > $null
                } catch {
                    Write-Warning "Amplify CLI não encontrado. Instalando..."
                    npm install -g @aws-amplify/cli
                }
                
                # Deploy
                Write-Info "Executando: amplify publish"
                amplify publish --yes
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Success "Frontend deployado no Amplify!"
                } else {
                    Write-Error "Falha no deploy do Amplify"
                    Pop-Location
                    exit 1
                }
            }
            
            "s3" {
                Write-Info "Deployando no S3 + CloudFront..."
                
                # Obter bucket name dos outputs
                $bucketName = ($outputs | Where-Object { $_.OutputKey -eq "FrontendBucketName" }).OutputValue
                
                if (-not $bucketName) {
                    Write-Error "Bucket name não encontrado nos outputs"
                    Pop-Location
                    exit 1
                }
                
                Write-Info "Bucket: $bucketName"
                
                # Sync para S3
                Write-Info "Sincronizando arquivos para S3..."
                aws s3 sync .next/static s3://$bucketName/_next/static --delete
                aws s3 sync public s3://$bucketName/public --delete
                
                # Invalidar cache do CloudFront
                $distributionId = ($outputs | Where-Object { $_.OutputKey -eq "CloudFrontDistributionId" }).OutputValue
                
                if ($distributionId) {
                    Write-Info "Invalidando cache do CloudFront..."
                    aws cloudfront create-invalidation --distribution-id $distributionId --paths "/*"
                    Write-Success "Cache invalidado"
                }
                
                Write-Success "Frontend deployado no S3!"
            }
            
            default {
                Write-Error "Plataforma desconhecida: $FrontendPlatform"
                Write-Info "Plataformas suportadas: vercel, amplify, s3"
                Pop-Location
                exit 1
            }
        }
        
    } finally {
        Pop-Location
    }
    
} else {
    Write-Warning "Deploy do frontend pulado (--SkipFrontend)"
}

# ============================================================================
# FASE 4: VALIDAÇÃO
# ============================================================================

if (-not $SkipValidation) {
    Write-Step "Fase 4: Validação do Deploy"
    
    # Testar API
    Write-Info "Testando API Backend..."
    try {
        $apiUrl = ($outputs | Where-Object { $_.OutputKey -eq "ApiEndpoint" }).OutputValue
        if (-not $apiUrl) {
            $apiUrl = "https://c5loeivg0k.execute-api.us-east-1.amazonaws.com"
        }
        
        $response = Invoke-RestMethod -Uri "$apiUrl/health" -Method Get
        
        if ($response.ok) {
            Write-Success "API respondendo: $($response.service)"
        } else {
            Write-Warning "API respondeu mas status não é OK"
        }
    } catch {
        Write-Error "Falha ao testar API: $_"
    }
    
    # Listar Lambdas
    Write-Info "Verificando Lambdas criadas..."
    aws lambda list-functions --query "Functions[?starts_with(FunctionName, 'FibonacciStack') || starts_with(FunctionName, 'NigredoStack') || starts_with(FunctionName, 'AlquimistaStack')].FunctionName" --output table
    
    Write-Success "Validação concluída"
    
} else {
    Write-Warning "Validação pulada (--SkipValidation)"
}

# ============================================================================
# RESUMO FINAL
# ============================================================================

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                        ║" -ForegroundColor Green
Write-Host "║              ✅ DEPLOY CONCLUÍDO COM SUCESSO! ✅        ║" -ForegroundColor Green
Write-Host "║                                                        ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Info "📊 Resumo do Deploy:"
Write-Host "   • Ambiente: $Environment" -ForegroundColor White
Write-Host "   • Backend: $(if ($SkipBackend) { 'Pulado' } else { 'Deployado' })" -ForegroundColor White
Write-Host "   • Frontend: $(if ($SkipFrontend) { 'Pulado' } else { "Deployado ($FrontendPlatform)" })" -ForegroundColor White
Write-Host "   • Duração: $($duration.Minutes)m $($duration.Seconds)s" -ForegroundColor White
Write-Host ""

if (-not $SkipBackend) {
    Write-Info "🔗 URLs Importantes:"
    $apiUrl = ($outputs | Where-Object { $_.OutputKey -eq "ApiEndpoint" }).OutputValue
    $cloudFrontUrl = ($outputs | Where-Object { $_.OutputKey -eq "CloudFrontUrl" }).OutputValue
    
    if ($apiUrl) {
        Write-Host "   • API Backend: $apiUrl" -ForegroundColor Cyan
    }
    if ($cloudFrontUrl) {
        Write-Host "   • CloudFront: $cloudFrontUrl" -ForegroundColor Cyan
    }
    Write-Host ""
}

Write-Info "📝 Próximos Passos:"
Write-Host "   1. Acesse o frontend e teste o login" -ForegroundColor White
Write-Host "   2. Verifique o dashboard e métricas" -ForegroundColor White
Write-Host "   3. Teste a ativação de agentes" -ForegroundColor White
Write-Host "   4. Monitore os logs no CloudWatch" -ForegroundColor White
Write-Host ""

Write-Info "📚 Documentação:"
Write-Host "   • Guia Completo: DEPLOY-INTEGRATION-GUIDE.md" -ForegroundColor White
Write-Host "   • Troubleshooting: docs/deploy/TROUBLESHOOTING.md" -ForegroundColor White
Write-Host "   • Validação: .\VALIDAR-DEPLOY.ps1" -ForegroundColor White
Write-Host ""

Write-Success "Deploy finalizado! 🎉"
Write-Host ""
