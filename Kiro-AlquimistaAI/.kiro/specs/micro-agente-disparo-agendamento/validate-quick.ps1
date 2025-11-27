# Script de validação rápida para deploy do micro agente
$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Validação Rápida - Micro Agente" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$region = "us-east-1"
$env = "dev"
$allValid = $true

# 1. Verificar diretório
Write-Host "1. Verificando estrutura de diretórios..." -ForegroundColor Yellow
if (Test-Path "terraform/envs/dev/main.tf") {
    Write-Host "  ✓ terraform/envs/dev/main.tf existe" -ForegroundColor Green
} else {
    Write-Host "  ✗ terraform/envs/dev/main.tf não encontrado" -ForegroundColor Red
    $allValid = $false
}

if (Test-Path "terraform/modules/agente_disparo_agenda") {
    Write-Host "  ✓ Módulo agente_disparo_agenda existe" -ForegroundColor Green
} else {
    Write-Host "  ✗ Módulo não encontrado" -ForegroundColor Red
    $allValid = $false
}

if (Test-Path "lambda-src/agente-disparo-agenda/src/handlers") {
    Write-Host "  ✓ Handlers Lambda existem" -ForegroundColor Green
} else {
    Write-Host "  ✗ Handlers não encontrados" -ForegroundColor Red
    $allValid = $false
}

Write-Host ""

# 2. Verificar AWS CLI
Write-Host "2. Verificando AWS CLI e credenciais..." -ForegroundColor Yellow
try {
    $identity = aws sts get-caller-identity --output json 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ AWS CLI configurado corretamente" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Erro nas credenciais AWS" -ForegroundColor Red
        $allValid = $false
    }
} catch {
    Write-Host "  ✗ AWS CLI não disponível" -ForegroundColor Red
    $allValid = $false
}

Write-Host ""

# 3. Verificar SNS Topic
Write-Host "3. Verificando SNS Topic..." -ForegroundColor Yellow
$snsResult = aws sns list-topics --region $region --output text 2>&1
if ($snsResult -match "alquimista-alerts") {
    Write-Host "  ✓ SNS Topic de alertas encontrado" -ForegroundColor Green
} else {
    Write-Host "  ⚠ SNS Topic não encontrado (será criado pelo Terraform)" -ForegroundColor Yellow
}

Write-Host ""

# 4. Verificar S3 Bucket
Write-Host "4. Verificando S3 Bucket para Lambda..." -ForegroundColor Yellow
$s3Result = aws s3 ls 2>&1
if ($s3Result -match "alquimista-lambda-artifacts") {
    Write-Host "  ✓ Bucket de artefatos encontrado" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Bucket não encontrado (será criado pelo Terraform)" -ForegroundColor Yellow
}

Write-Host ""

# 5. Verificar EventBridge
Write-Host "5. Verificando EventBridge Bus..." -ForegroundColor Yellow
$ebResult = aws events list-event-buses --region $region --output text 2>&1
if ($ebResult -match "fibonacci-bus") {
    Write-Host "  ✓ EventBridge Bus encontrado" -ForegroundColor Green
} else {
    Write-Host "  ⚠ EventBridge Bus não encontrado (será criado pelo Terraform)" -ForegroundColor Yellow
}

Write-Host ""

# 6. Verificar Secrets
Write-Host "6. Verificando Secrets Manager..." -ForegroundColor Yellow
$secretsResult = aws secretsmanager list-secrets --region $region --output text 2>&1
if ($secretsResult -match "micro-agente-disparo-agendamento") {
    Write-Host "  ✓ Secrets do micro agente encontrados" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Secrets não encontrados - execute create-secrets.ps1" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Resumo" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($allValid) {
    Write-Host "✓ Validação básica OK - pode prosseguir com Terraform" -ForegroundColor Green
} else {
    Write-Host "✗ Alguns itens precisam de atenção" -ForegroundColor Yellow
}

Write-Host ""
