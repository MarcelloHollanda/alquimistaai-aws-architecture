# Script para build e upload das Lambdas do Micro Agente de Disparo & Agendamento
# Este script compila o TypeScript, cria ZIPs e faz upload para S3

# Parametros (deve estar no inicio do script)
param(
    [string]$Environment = "dev",
    [string]$BucketName = "",
    [switch]$SkipUpload = $false
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Build & Upload - Lambdas Disparo & Agendamento" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Detectar diretorio raiz do repositorio
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $scriptDir))

# Mudar para o diretorio raiz
Set-Location $repoRoot
Write-Host "Diretorio de trabalho: $repoRoot" -ForegroundColor Gray
Write-Host ""

# Variaveis
$lambdaSourceDir = "lambda-src/agente-disparo-agenda"
$region = "us-east-1"
$env = $Environment

# Bucket de artefatos - usar parametro ou padrao
if ($BucketName -eq "") {
    $artifactBucket = "alquimista-lambda-artifacts-$env"
} else {
    $artifactBucket = $BucketName
}

Write-Host "Configuracao:" -ForegroundColor White
Write-Host "  Diretorio Lambda: $lambdaSourceDir" -ForegroundColor Gray
Write-Host "  Regiao: $region" -ForegroundColor Gray
Write-Host "  Ambiente: $env" -ForegroundColor Gray
Write-Host "  Bucket: $artifactBucket" -ForegroundColor Gray
Write-Host ""

# ============================================
# 1. Verificar se o diretorio existe
# ============================================
if (-not (Test-Path $lambdaSourceDir)) {
    Write-Host "[ERRO] Diretorio $lambdaSourceDir nao encontrado!" -ForegroundColor Red
    exit 1
}

# ============================================
# 2. Instalar dependencias
# ============================================
Write-Host "1. Instalando dependencias..." -ForegroundColor Yellow
Push-Location $lambdaSourceDir

try {
    npm install --production
    Write-Host "[OK] Dependencias instaladas!" -ForegroundColor Green
} catch {
    Write-Host "[ERRO] Erro ao instalar dependencias: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host ""

# ============================================
# 3. Compilar TypeScript
# ============================================
Write-Host "2. Compilando TypeScript..." -ForegroundColor Yellow

try {
    npm run build
    Write-Host "[OK] TypeScript compilado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "[ERRO] Erro ao compilar TypeScript: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host ""

# ============================================
# 4. Criar ZIPs das Lambdas
# ============================================
Write-Host "3. Criando ZIPs das Lambdas..." -ForegroundColor Yellow

$distDir = "dist"
if (-not (Test-Path $distDir)) {
    Write-Host "[ERRO] Diretorio dist/ nao encontrado apos build!" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Handlers disponiveis (baseado na estrutura real do repositorio)
# Estes handlers correspondem as Lambdas definidas no Terraform
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
    $handlerFile = Join-Path (Join-Path $distDir "handlers") "$handler.js"
    
    if (Test-Path $handlerFile) {
        $zipFile = "$handler.zip"
        Write-Host "  Criando $zipFile..." -ForegroundColor Gray
        
        # Criar diretorio temporario para o ZIP
        $tempDir = "temp-$handler"
        if (Test-Path $tempDir) {
            Remove-Item -Recurse -Force $tempDir
        }
        New-Item -ItemType Directory -Path $tempDir | Out-Null
        
        # Copiar toda a estrutura dist/ (handlers, types, utils)
        Copy-Item -Recurse "$distDir/*" $tempDir
        
        # Copiar node_modules (apenas production)
        if (Test-Path "node_modules") {
            Write-Host "    Copiando node_modules..." -ForegroundColor Gray
            Copy-Item -Recurse "node_modules" $tempDir
        }
        
        # Criar ZIP
        Compress-Archive -Path "$tempDir/*" -DestinationPath $zipFile -Force
        
        # Limpar diretorio temporario
        Remove-Item -Recurse -Force $tempDir
        
        $zipFiles += $zipFile
        
        # Mostrar tamanho do ZIP
        $zipSize = (Get-Item $zipFile).Length / 1MB
        Write-Host "  [OK] $zipFile criado ($([math]::Round($zipSize, 2)) MB)" -ForegroundColor Green
    } else {
        Write-Host "  [AVISO] Handler $handler nao encontrado em $handlerFile, pulando..." -ForegroundColor Yellow
    }
}

Write-Host ""

if ($zipFiles.Count -eq 0) {
    Write-Host "[ERRO] Nenhum ZIP foi criado! Verifique a compilacao." -ForegroundColor Red
    Pop-Location
    exit 1
}

# ============================================
# 5. Upload para S3 (opcional)
# ============================================
$uploadedFiles = @()

if ($SkipUpload) {
    Write-Host "4. Upload para S3 PULADO (SkipUpload)" -ForegroundColor Yellow
    Write-Host ""
    
    # Considerar todos os ZIPs como "uploaded" para o resumo
    foreach ($zipFile in $zipFiles) {
        if (Test-Path $zipFile) {
            $uploadedFiles += "local:$zipFile"
        }
    }
} else {
    Write-Host "4. Fazendo upload para S3..." -ForegroundColor Yellow
    
    # Verificar se o bucket existe
    try {
        aws s3 ls "s3://$artifactBucket" --region $region 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Bucket nao encontrado"
        }
    } catch {
        Write-Host "[ERRO] Bucket $artifactBucket nao encontrado!" -ForegroundColor Red
        Write-Host "  Crie o bucket com: aws s3 mb s3://$artifactBucket --region $region" -ForegroundColor Yellow
        Pop-Location
        exit 1
    }
    
    foreach ($zipFile in $zipFiles) {
        if (Test-Path $zipFile) {
            $s3Key = "micro-agente-disparo-agendamento/$env/$zipFile"
            
            Write-Host "  Uploading $zipFile para s3://$artifactBucket/$s3Key..." -ForegroundColor Gray
            
            try {
                aws s3 cp $zipFile "s3://$artifactBucket/$s3Key" --region $region
                if ($LASTEXITCODE -eq 0) {
                    $uploadedFiles += "s3://$artifactBucket/$s3Key"
                    Write-Host "  [OK] Upload concluido" -ForegroundColor Green
                } else {
                    Write-Host "  [ERRO] Erro ao fazer upload" -ForegroundColor Red
                }
            } catch {
                Write-Host "  [ERRO] Erro ao fazer upload: $_" -ForegroundColor Red
            }
        }
    }
}

Pop-Location

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Resumo do Build & Upload" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "ZIPs criados: $($zipFiles.Count)" -ForegroundColor White
Write-Host "Uploads bem-sucedidos: $($uploadedFiles.Count)" -ForegroundColor White
Write-Host ""

if ($uploadedFiles.Count -gt 0) {
    if ($SkipUpload) {
        Write-Host "Arquivos criados localmente:" -ForegroundColor White
    } else {
        Write-Host "Arquivos no S3:" -ForegroundColor White
    }
    
    foreach ($file in $uploadedFiles) {
        Write-Host "  - $file" -ForegroundColor Gray
    }
    Write-Host ""
    
    # Calcular tamanho total
    $totalSize = 0
    foreach ($zipFile in $zipFiles) {
        if (Test-Path $zipFile) {
            $totalSize += (Get-Item $zipFile).Length
        }
    }
    $totalSizeMB = [math]::Round($totalSize / 1MB, 2)
    Write-Host "Tamanho total: $totalSizeMB MB" -ForegroundColor White
    Write-Host ""
    
    if ($SkipUpload) {
        Write-Host "[OK] Build concluido com sucesso!" -ForegroundColor Green
        Write-Host "  (Upload para S3 foi pulado)" -ForegroundColor Gray
    } else {
        Write-Host "[OK] Build e upload concluidos com sucesso!" -ForegroundColor Green
    }
    Write-Host ""
    Write-Host "Proximos passos:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Validar variaveis do Terraform:" -ForegroundColor White
    Write-Host "   .\validate-terraform-vars.ps1" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Aplicar infraestrutura:" -ForegroundColor White
    Write-Host "   cd ..\..\..\terraform\envs\$env" -ForegroundColor Gray
    Write-Host "   terraform init" -ForegroundColor Gray
    Write-Host "   terraform plan" -ForegroundColor Gray
    Write-Host "   terraform apply" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Verificar deploy:" -ForegroundColor White
    Write-Host "   aws lambda list-functions --query 'Functions[?starts_with(FunctionName, ``alquimista-$env-disparo-agenda``)]'" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "[ERRO] Nenhum arquivo foi enviado para o S3" -ForegroundColor Red
    Write-Host ""
    Write-Host "Verifique:" -ForegroundColor Yellow
    Write-Host "  - Se o bucket $artifactBucket existe" -ForegroundColor Gray
    Write-Host "  - Se voce tem permissoes AWS configuradas" -ForegroundColor Gray
    Write-Host "  - Se a AWS CLI esta instalada e configurada" -ForegroundColor Gray
    exit 1
}

Write-Host ""
