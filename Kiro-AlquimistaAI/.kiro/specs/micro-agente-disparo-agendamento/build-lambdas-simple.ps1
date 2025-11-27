# Script para build e upload das Lambdas do Micro Agente

$ErrorActionPreference = "Stop"

Write-Host "Build e Upload das Lambdas - Micro Agente Disparo e Agendamento" -ForegroundColor Cyan

$bucketName = "alquimista-lambda-artifacts-dev"
$region = "us-east-1"
$rootDir = "../../.."
$lambdaSourceDir = "$rootDir/lambda-src/agente-disparo-agenda"

# Verificar se o diretório existe
if (-not (Test-Path $lambdaSourceDir)) {
    Write-Host "ERRO: Diretório $lambdaSourceDir não encontrado!" -ForegroundColor Red
    Write-Host "Diretório atual: $(Get-Location)" -ForegroundColor Gray
    exit 1
}

# Criar bucket S3 se não existir
Write-Host "Verificando bucket S3..." -ForegroundColor Yellow
try {
    aws s3 ls s3://$bucketName --region $region 2>$null
    Write-Host "Bucket $bucketName já existe" -ForegroundColor Green
} catch {
    Write-Host "Criando bucket $bucketName..." -ForegroundColor Yellow
    aws s3 mb s3://$bucketName --region $region
    Write-Host "Bucket criado!" -ForegroundColor Green
}

# Instalar dependências
Write-Host ""
Write-Host "Instalando dependências..." -ForegroundColor Yellow
Set-Location $lambdaSourceDir
npm install --production
Write-Host "Dependências instaladas!" -ForegroundColor Green

# Criar arquivo ZIP
Write-Host ""
Write-Host "Criando arquivo ZIP..." -ForegroundColor Yellow
$zipFile = "agente-disparo-agenda.zip"
if (Test-Path $zipFile) {
    Remove-Item $zipFile -Force
}

# Comprimir arquivos
Compress-Archive -Path "src/*","node_modules/*","package.json" -DestinationPath $zipFile -Force
Write-Host "Arquivo ZIP criado: $zipFile" -ForegroundColor Green

# Upload para S3
Write-Host ""
Write-Host "Fazendo upload para S3..." -ForegroundColor Yellow
aws s3 cp $zipFile s3://$bucketName/agente-disparo-agenda/ --region $region
Write-Host "Upload concluído!" -ForegroundColor Green

# Voltar ao diretório da spec
Set-Location ../../.kiro/specs/micro-agente-disparo-agendamento

Write-Host ""
Write-Host "Build e upload concluídos com sucesso!" -ForegroundColor Cyan
Write-Host "Bucket: s3://$bucketName/agente-disparo-agenda/$zipFile" -ForegroundColor Gray
Write-Host ""
Write-Host "Próximo passo: Executar terraform apply" -ForegroundColor Yellow
