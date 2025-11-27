# Script para validar variáveis do Terraform antes do apply
# Verifica se os recursos necessários existem na AWS

$ErrorActionPreference = "Stop"

param(
    [string]$Environment = "dev"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Validação de Variáveis - Terraform" -ForegroundColor Cyan
Write-Host "Micro Agente Disparo & Agendamento" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$region = "us-east-1"
$env = $Environment

Write-Host "Ambiente: $env" -ForegroundColor White
Write-Host "Região: $region" -ForegroundColor White
Write-Host ""

$allValid = $true

# Verificar se estamos na raiz do repositório
$repoRoot = (Get-Location).Path
if (-not (Test-Path "$repoRoot/terraform/envs/$env/main.tf")) {
    Write-Host "✗ Erro: Execute este script a partir da raiz do repositório!" -ForegroundColor Red
    Write-Host "  Caminho atual: $repoRoot" -ForegroundColor Yellow
    Write-Host "  Esperado: terraform/envs/$env/main.tf deve existir" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Diretório correto: $repoRoot" -ForegroundColor Green
Write-Host ""

# 1. Verificar SNS Topic de Alertas
Write-Host "1. Verificando SNS Topic de alertas..." -ForegroundColor Yellow

$expectedTopicName = "alquimista-alerts-$env"

try {
    $topics = aws sns list-topics --region $region --output json | ConvertFrom-Json
    $alertsTopic = $topics.Topics | Where-Object { $_.TopicArn -like "*$expectedTopicName*" }
    
    if ($alertsTopic) {
        Write-Host "  ✓ SNS Topic encontrado: $($alertsTopic.TopicArn)" -ForegroundColor Green
        $snsTopicArn = $alertsTopic.TopicArn
    } else {
        Write-Host "  ✗ SNS Topic '$expectedTopicName' não encontrado!" -ForegroundColor Red
        $allValid = $false
        $snsTopicArn = "ARN_NAO_ENCONTRADO"
    }
} catch {
    Write-Host "  ✗ Erro ao verificar SNS Topics: $_" -ForegroundColor Red
    $allValid = $false
    $snsTopicArn = "ERRO_AO_VERIFICAR"
}

Write-Host ""

# 2. Verificar Bucket de Artefatos Lambda
Write-Host "2. Verificando bucket de artefatos Lambda..." -ForegroundColor Yellow

$expectedBucketName = "alquimista-lambda-artifacts-$env"

try {
    $buckets = aws s3 ls --region $region 2>&1
    
    if ($buckets -match $expectedBucketName) {
        Write-Host "  ✓ Bucket encontrado: $expectedBucketName" -ForegroundColor Green
        $lambdaBucket = $expectedBucketName
    } else {
        Write-Host "  ✗ Bucket '$expectedBucketName' não encontrado!" -ForegroundColor Red
        $allValid = $false
        $lambdaBucket = "BUCKET_NAO_ENCONTRADO"
    }
} catch {
    Write-Host "  ✗ Erro ao verificar buckets S3: $_" -ForegroundColor Red
    $allValid = $false
    $lambdaBucket = "ERRO_AO_VERIFICAR"
}

Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Resumo da Validação" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($allValid) {
    Write-Host "✓ Validações básicas passaram!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximo passo: Executar build das Lambdas" -ForegroundColor White
} else {
    Write-Host "✗ Algumas validações falharam!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Corrija os problemas acima antes de prosseguir" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
