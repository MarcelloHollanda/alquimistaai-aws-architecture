# Script de Deploy Automatizado do Backend
# Alquimista.AI - Fibonacci Stack

Write-Host "Iniciando Deploy do Backend..." -ForegroundColor Cyan
Write-Host ""

# Verificar credenciais AWS
Write-Host "Verificando credenciais AWS..." -ForegroundColor Yellow
$identity = aws sts get-caller-identity 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Credenciais AWS nao configuradas!" -ForegroundColor Red
    Write-Host "Execute: aws configure" -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] Credenciais AWS OK" -ForegroundColor Green
Write-Host ""

# Build
Write-Host "Compilando TypeScript..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Erro na compilacao!" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Build concluido" -ForegroundColor Green
Write-Host ""

# Synth (validação)
Write-Host "Validando stack CDK..." -ForegroundColor Yellow
npx cdk synth --context env=dev --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Erro na validacao!" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Validacao OK" -ForegroundColor Green
Write-Host ""

# Deploy
Write-Host "Iniciando deploy (isso pode levar 15-25 minutos)..." -ForegroundColor Cyan
Write-Host ""
npx cdk deploy FibonacciStack-dev --require-approval never --context env=dev

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[OK] Deploy concluido com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Capturando outputs..." -ForegroundColor Yellow
    aws cloudformation describe-stacks --stack-name FibonacciStack-dev --query "Stacks[0].Outputs" --output table
    
    Write-Host ""
    Write-Host "Salvando outputs em backend-outputs.json..." -ForegroundColor Yellow
    aws cloudformation describe-stacks --stack-name FibonacciStack-dev --query "Stacks[0].Outputs" > backend-outputs.json
    
    Write-Host ""
    Write-Host "Backend deployado com sucesso!" -ForegroundColor Green
    Write-Host "Proximo passo: Configure o frontend com os outputs acima" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "[ERRO] Deploy falhou!" -ForegroundColor Red
    Write-Host "Verifique os logs acima para detalhes" -ForegroundColor Yellow
    exit 1
}
