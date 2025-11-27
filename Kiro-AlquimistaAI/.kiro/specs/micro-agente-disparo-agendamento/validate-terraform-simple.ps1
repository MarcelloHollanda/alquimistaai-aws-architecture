# Script para validar variáveis do Terraform

$ErrorActionPreference = "Stop"

Write-Host "Validação de Variáveis do Terraform" -ForegroundColor Cyan
Write-Host ""

$region = "us-east-1"
$env = "dev"
$allValid = $true

# 1. Verificar secrets
Write-Host "1. Verificando secrets no AWS Secrets Manager..." -ForegroundColor Yellow
$secrets = @(
    "/alquimista/$env/agente-disparo-agenda/mcp-whatsapp",
    "/alquimista/$env/agente-disparo-agenda/mcp-email",
    "/alquimista/$env/agente-disparo-agenda/mcp-calendar"
)

foreach ($secret in $secrets) {
    try {
        $result = aws secretsmanager describe-secret --region $region --secret-id $secret 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ $secret" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $secret não encontrado" -ForegroundColor Red
            $allValid = $false
        }
    } catch {
        Write-Host "  ✗ $secret não encontrado" -ForegroundColor Red
        $allValid = $false
    }
}

# 2. Verificar bucket S3
Write-Host ""
Write-Host "2. Verificando bucket S3..." -ForegroundColor Yellow
$bucketName = "alquimista-lambda-artifacts-dev"
try {
    aws s3 ls s3://$bucketName --region $region 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Bucket $bucketName existe" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Bucket $bucketName não encontrado" -ForegroundColor Red
        $allValid = $false
    }
} catch {
    Write-Host "  ✗ Bucket $bucketName não encontrado" -ForegroundColor Red
    $allValid = $false
}

# 3. Verificar arquivo Lambda no S3
Write-Host ""
Write-Host "3. Verificando arquivo Lambda no S3..." -ForegroundColor Yellow
$lambdaKey = "agente-disparo-agenda/agente-disparo-agenda.zip"
try {
    aws s3 ls s3://$bucketName/$lambdaKey --region $region 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Arquivo Lambda encontrado" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Arquivo Lambda não encontrado" -ForegroundColor Red
        $allValid = $false
    }
} catch {
    Write-Host "  ✗ Arquivo Lambda não encontrado" -ForegroundColor Red
    $allValid = $false
}

# 4. Verificar Aurora cluster
Write-Host ""
Write-Host "4. Verificando Aurora cluster..." -ForegroundColor Yellow
try {
    $clusters = aws rds describe-db-clusters --region $region --query "DBClusters[?contains(DBClusterIdentifier, 'alquimista')].DBClusterIdentifier" --output text 2>&1
    if ($clusters -and $clusters.Trim() -ne "") {
        Write-Host "  ✓ Aurora cluster encontrado: $clusters" -ForegroundColor Green
    } else {
        Write-Host "  ! Aurora cluster não encontrado (será criado pelo Terraform)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ! Erro ao verificar Aurora cluster" -ForegroundColor Yellow
}

# 5. Verificar EventBridge bus
Write-Host ""
Write-Host "5. Verificando EventBridge bus..." -ForegroundColor Yellow
try {
    $buses = aws events list-event-buses --region $region --query "EventBuses[?contains(Name, 'fibonacci')].Name" --output text 2>&1
    if ($buses -and $buses.Trim() -ne "") {
        Write-Host "  ✓ EventBridge bus encontrado: $buses" -ForegroundColor Green
    } else {
        Write-Host "  ! EventBridge bus não encontrado (será criado pelo Terraform)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ! Erro ao verificar EventBridge bus" -ForegroundColor Yellow
}

# Resumo
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Resumo da Validação" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($allValid) {
    Write-Host "✓ Todas as validações críticas passaram!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximo passo: Executar terraform apply" -ForegroundColor Yellow
    Write-Host "  cd terraform/envs/dev" -ForegroundColor Gray
    Write-Host "  terraform init" -ForegroundColor Gray
    Write-Host "  terraform plan" -ForegroundColor Gray
    Write-Host "  terraform apply" -ForegroundColor Gray
} else {
    Write-Host "✗ Algumas validações falharam!" -ForegroundColor Red
    Write-Host "Corrija os problemas antes de executar terraform apply" -ForegroundColor Yellow
}

Write-Host ""
