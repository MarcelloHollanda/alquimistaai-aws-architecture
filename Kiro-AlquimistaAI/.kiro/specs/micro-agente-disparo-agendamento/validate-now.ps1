$ErrorActionPreference = "Continue"

Write-Host "========================================"
Write-Host "Validacao Rapida - Micro Agente"
Write-Host "========================================"
Write-Host ""

$region = "us-east-1"
$allValid = $true

Write-Host "1. Verificando estrutura de diretorios..."
if (Test-Path "terraform/envs/dev/main.tf") {
    Write-Host "  [OK] terraform/envs/dev/main.tf existe"
}
else {
    Write-Host "  [ERRO] terraform/envs/dev/main.tf nao encontrado"
    $allValid = $false
}

if (Test-Path "terraform/modules/agente_disparo_agenda") {
    Write-Host "  [OK] Modulo agente_disparo_agenda existe"
}
else {
    Write-Host "  [ERRO] Modulo nao encontrado"
    $allValid = $false
}

if (Test-Path "lambda-src/agente-disparo-agenda/src/handlers") {
    Write-Host "  [OK] Handlers Lambda existem"
}
else {
    Write-Host "  [ERRO] Handlers nao encontrados"
    $allValid = $false
}

Write-Host ""
Write-Host "2. Verificando AWS CLI..."
$identity = aws sts get-caller-identity --output json 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] AWS CLI configurado"
}
else {
    Write-Host "  [ERRO] Credenciais AWS invalidas"
    $allValid = $false
}

Write-Host ""
Write-Host "3. Verificando recursos AWS..."

$snsResult = aws sns list-topics --region $region --output text 2>&1
if ($snsResult -match "alquimista-alerts") {
    Write-Host "  [OK] SNS Topic encontrado"
}
else {
    Write-Host "  [AVISO] SNS Topic nao encontrado"
}

$s3Result = aws s3 ls 2>&1
if ($s3Result -match "alquimista-lambda") {
    Write-Host "  [OK] S3 Bucket encontrado"
}
else {
    Write-Host "  [AVISO] S3 Bucket nao encontrado"
}

$ebResult = aws events list-event-buses --region $region --output text 2>&1
if ($ebResult -match "fibonacci-bus") {
    Write-Host "  [OK] EventBridge Bus encontrado"
}
else {
    Write-Host "  [AVISO] EventBridge Bus nao encontrado"
}

Write-Host ""
Write-Host "========================================"
if ($allValid) {
    Write-Host "[OK] Validacao basica passou - pode prosseguir"
    exit 0
}
else {
    Write-Host "[ERRO] Alguns itens precisam de atencao"
    exit 1
}
