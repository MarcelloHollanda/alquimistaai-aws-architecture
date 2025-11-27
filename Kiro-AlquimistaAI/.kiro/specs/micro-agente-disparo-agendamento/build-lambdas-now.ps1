# Build e Upload das Lambdas - Micro Agente Disparo & Agendamento
# Versao simplificada sem parametros

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Build & Upload - Lambdas" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuracao
$env = "dev"
$region = "us-east-1"
$artifactBucket = "alquimista-lambda-artifacts-dev"
$lambdaSourceDir = "lambda-src\agente-disparo-agenda"

Write-Host "Configuracao:" -ForegroundColor White
Write-Host "  Ambiente: $env" -ForegroundColor Gray
Write-Host "  Regiao: $region" -ForegroundColor Gray
Write-Host "  Bucket: $artifactBucket" -ForegroundColor Gray
Write-Host "  Diretorio: $lambdaSourceDir" -ForegroundColor Gray
Write-Host ""

# Verificar diretorio
if (-not (Test-Path $lambdaSourceDir)) {
    Write-Host "[ERRO] Diretorio $lambdaSourceDir nao encontrado!" -ForegroundColor Red
    exit 1
}

# Ir para o diretorio das lambdas
Push-Location $lambdaSourceDir

# 1. Instalar dependencias
Write-Host "1. Instalando dependencias..." -ForegroundColor Yellow
npm install --production
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Falha ao instalar dependencias" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "[OK] Dependencias instaladas" -ForegroundColor Green
Write-Host ""

# 2. Compilar TypeScript
Write-Host "2. Compilando TypeScript..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Falha ao compilar TypeScript" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "[OK] TypeScript compilado" -ForegroundColor Green
Write-Host ""

# 3. Criar ZIPs
Write-Host "3. Criando ZIPs..." -ForegroundColor Yellow

$handlers = @(
    "api-handler",
    "ingest-contacts",
    "send-messages",
    "handle-replies",
    "schedule-meeting",
    "confirm-meeting",
    "send-reminders"
)

$zipFiles = @()

foreach ($handler in $handlers) {
    $handlerFile = "dist\handlers\$handler.js"
    
    if (Test-Path $handlerFile) {
        $zipFile = "$handler.zip"
        Write-Host "  Criando $zipFile..." -ForegroundColor Gray
        
        # Criar temp dir
        $tempDir = "temp-$handler"
        if (Test-Path $tempDir) {
            Remove-Item -Recurse -Force $tempDir
        }
        New-Item -ItemType Directory -Path $tempDir | Out-Null
        
        # Copiar dist e node_modules
        Copy-Item -Recurse "dist\*" $tempDir
        if (Test-Path "node_modules") {
            Copy-Item -Recurse "node_modules" $tempDir
        }
        
        # Criar ZIP
        Compress-Archive -Path "$tempDir\*" -DestinationPath $zipFile -Force
        
        # Limpar temp
        Remove-Item -Recurse -Force $tempDir
        
        $zipFiles += $zipFile
        
        $zipSize = (Get-Item $zipFile).Length / 1MB
        Write-Host "  [OK] $zipFile ($([math]::Round($zipSize, 2)) MB)" -ForegroundColor Green
    } else {
        Write-Host "  [AVISO] $handler nao encontrado" -ForegroundColor Yellow
    }
}

Write-Host ""

if ($zipFiles.Count -eq 0) {
    Write-Host "[ERRO] Nenhum ZIP criado!" -ForegroundColor Red
    Pop-Location
    exit 1
}

# 4. Upload para S3
Write-Host "4. Upload para S3..." -ForegroundColor Yellow

# Verificar bucket
aws s3 ls "s3://$artifactBucket" --region $region 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[AVISO] Bucket nao existe, criando..." -ForegroundColor Yellow
    aws s3 mb "s3://$artifactBucket" --region $region
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERRO] Falha ao criar bucket" -ForegroundColor Red
        Pop-Location
        exit 1
    }
}

$uploadedFiles = @()

foreach ($zipFile in $zipFiles) {
    if (Test-Path $zipFile) {
        $s3Key = "micro-agente-disparo-agendamento/$env/$zipFile"
        
        Write-Host "  Upload $zipFile..." -ForegroundColor Gray
        
        aws s3 cp $zipFile "s3://$artifactBucket/$s3Key" --region $region
        if ($LASTEXITCODE -eq 0) {
            $uploadedFiles += "s3://$artifactBucket/$s3Key"
            Write-Host "  [OK] Upload concluido" -ForegroundColor Green
        } else {
            Write-Host "  [ERRO] Falha no upload" -ForegroundColor Red
        }
    }
}

Pop-Location

# Resumo
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Resumo" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "ZIPs criados: $($zipFiles.Count)" -ForegroundColor White
Write-Host "Uploads OK: $($uploadedFiles.Count)" -ForegroundColor White
Write-Host ""

if ($uploadedFiles.Count -gt 0) {
    Write-Host "Arquivos no S3:" -ForegroundColor White
    foreach ($file in $uploadedFiles) {
        Write-Host "  - $file" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "[OK] Build e upload concluidos!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Proximos passos:" -ForegroundColor Yellow
    Write-Host "  cd terraform\envs\dev" -ForegroundColor Gray
    Write-Host "  terraform init" -ForegroundColor Gray
    Write-Host "  terraform plan" -ForegroundColor Gray
    Write-Host "  terraform apply" -ForegroundColor Gray
} else {
    Write-Host "[ERRO] Nenhum upload bem-sucedido" -ForegroundColor Red
    exit 1
}

Write-Host ""
