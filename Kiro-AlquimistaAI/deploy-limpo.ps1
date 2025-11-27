# 🚀 Script de Deploy Limpo - Alquimista.AI
# Este script automatiza o processo de limpeza e deploy completo

param(
    [switch]$SkipWait,
    [switch]$SkipDelete,
    [switch]$SkipDeploy
)

$ErrorActionPreference = "Continue"
$StackName = "FibonacciStack-dev"
$Environment = "dev"

Write-Host "`n[DEPLOY LIMPO] Alquimista.AI" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Função para verificar status da stack
function Get-StackStatus {
    try {
        $status = aws cloudformation describe-stacks --stack-name $StackName --query "Stacks[0].StackStatus" --output text 2>$null
        return $status
    } catch {
        return "NOT_EXISTS"
    }
}

# Passo 1: Verificar status atual
Write-Host "[PASSO 1] Verificando status atual..." -ForegroundColor Yellow
$currentStatus = Get-StackStatus
Write-Host "   Status: $currentStatus" -ForegroundColor White

if ($currentStatus -eq "NOT_EXISTS") {
    Write-Host "   [OK] Stack nao existe, pode prosseguir com deploy limpo" -ForegroundColor Green
    $SkipWait = $true
    $SkipDelete = $true
}

# Passo 2: Aguardar rollback completar
if (-not $SkipWait -and $currentStatus -eq "ROLLBACK_IN_PROGRESS") {
    Write-Host "`n[PASSO 2] Aguardando rollback completar..." -ForegroundColor Yellow
    Write-Host "   Isso pode levar 5-15 minutos. Aguarde..." -ForegroundColor White
    
    aws cloudformation wait stack-rollback-complete --stack-name $StackName 2>&1 | Out-Null
    
    $newStatus = Get-StackStatus
    if ($newStatus -eq "ROLLBACK_COMPLETE") {
        Write-Host "   [OK] Rollback completado!" -ForegroundColor Green
    } else {
        Write-Host "   [AVISO] Status inesperado: $newStatus" -ForegroundColor Red
        Write-Host "   Execute manualmente: aws cloudformation wait stack-rollback-complete --stack-name $StackName" -ForegroundColor Yellow
        exit 1
    }
}

# Passo 3: Deletar stack
if (-not $SkipDelete -and $currentStatus -ne "NOT_EXISTS") {
    Write-Host "`n[PASSO 3] Deletando stack..." -ForegroundColor Yellow
    
    aws cloudformation delete-stack --stack-name $StackName
    Write-Host "   Aguardando deleção completar (2-5 minutos)..." -ForegroundColor White
    
    aws cloudformation wait stack-delete-complete --stack-name $StackName 2>&1 | Out-Null
    
    $finalStatus = Get-StackStatus
    if ($finalStatus -eq "NOT_EXISTS") {
        Write-Host "   [OK] Stack deletada com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "   [ERRO] Falha ao deletar. Status: $finalStatus" -ForegroundColor Red
        exit 1
    }
}

# Passo 4: Limpar cache e preparar ambiente
Write-Host "`n[PASSO 4] Preparando ambiente..." -ForegroundColor Yellow

if (Test-Path "cdk.out") {
    Remove-Item -Recurse -Force cdk.out
    Write-Host "   [OK] Cache CDK limpo" -ForegroundColor Green
}

Write-Host "   Instalando dependências..." -ForegroundColor White
npm install --silent 2>&1 | Out-Null

Write-Host "   Compilando TypeScript..." -ForegroundColor White
npm run build 2>&1 | Out-Null

Write-Host "   Validando sintaxe CDK..." -ForegroundColor White
$synthResult = npx cdk synth --context env=$Environment 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   [OK] Ambiente preparado!" -ForegroundColor Green
} else {
    Write-Host "   [ERRO] Erro na validacao CDK" -ForegroundColor Red
    Write-Host $synthResult
    exit 1
}

# Passo 5: Deploy do backend
if (-not $SkipDeploy) {
    Write-Host "`n[PASSO 5] Iniciando deploy do backend..." -ForegroundColor Yellow
    Write-Host "   Isso pode levar 15-25 minutos. Aguarde..." -ForegroundColor White
    Write-Host ""
    
    npx cdk deploy $StackName --require-approval never --context env=$Environment
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n   [OK] Deploy do backend concluido com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "`n   [ERRO] Falha no deploy do backend" -ForegroundColor Red
        exit 1
    }
    
    # Passo 6: Capturar outputs
    Write-Host "`n[PASSO 6] Capturando outputs..." -ForegroundColor Yellow
    
    aws cloudformation describe-stacks --stack-name $StackName --query "Stacks[0].Outputs" > backend-outputs.json
    
    Write-Host "`n   Outputs salvos em: backend-outputs.json" -ForegroundColor White
    Write-Host ""
    aws cloudformation describe-stacks --stack-name $StackName --query "Stacks[0].Outputs" --output table
    
    Write-Host "`n   [OK] Outputs capturados!" -ForegroundColor Green
}

# Resumo final
Write-Host "`n[SUCESSO] Deploy Completo!" -ForegroundColor Green
Write-Host "==================`n" -ForegroundColor Green

Write-Host "[PROXIMOS PASSOS]" -ForegroundColor Cyan
Write-Host "   1. Configure o frontend com os outputs do backend" -ForegroundColor White
Write-Host "   2. Crie frontend/.env.production com as variaveis" -ForegroundColor White
Write-Host "   3. Execute: cd frontend && npm run build" -ForegroundColor White
Write-Host "   4. Execute: vercel --prod" -ForegroundColor White
Write-Host ""
Write-Host "[MONITORAMENTO]" -ForegroundColor Cyan
Write-Host "   CloudWatch: https://console.aws.amazon.com/cloudwatch" -ForegroundColor White
Write-Host "   Lambda: https://console.aws.amazon.com/lambda" -ForegroundColor White
Write-Host "   API Gateway: https://console.aws.amazon.com/apigateway" -ForegroundColor White
Write-Host ""

Write-Host "[CONCLUIDO] Deploy concluido com sucesso!`n" -ForegroundColor Green
