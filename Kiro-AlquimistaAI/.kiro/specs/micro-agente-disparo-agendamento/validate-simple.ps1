# Script de validação simplificado

$ErrorActionPreference = "Continue"

Write-Host "Validação de Pré-requisitos" -ForegroundColor Cyan
Write-Host ""

$region = "us-east-1"
$env = "dev"

# 1. Verificar secrets
Write-Host "1. Verificando secrets..." -ForegroundColor Yellow
aws secretsmanager list-secrets --region $region --query "SecretList[?contains(Name, 'agente-disparo-agenda')].Name" --output table

# 2. Verificar bucket S3
Write-Host ""
Write-Host "2. Verificando bucket S3..." -ForegroundColor Yellow
aws s3 ls s3://alquimista-lambda-artifacts-dev/agente-disparo-agenda/ --region $region

# 3. Verificar Aurora
Write-Host ""
Write-Host "3. Verificando Aurora clusters..." -ForegroundColor Yellow
aws rds describe-db-clusters --region $region --query "DBClusters[].DBClusterIdentifier" --output table

# 4. Verificar EventBridge
Write-Host ""
Write-Host "4. Verificando EventBridge buses..." -ForegroundColor Yellow
aws events list-event-buses --region $region --query "EventBuses[].Name" --output table

Write-Host ""
Write-Host "Validação concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "Próximo passo: terraform apply" -ForegroundColor Yellow
Write-Host "  cd terraform/envs/dev" -ForegroundColor Gray
Write-Host "  terraform init" -ForegroundColor Gray
Write-Host "  terraform apply" -ForegroundColor Gray
