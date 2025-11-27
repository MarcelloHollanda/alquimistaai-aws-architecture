param(
    [string]$Environment = "dev"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Build e Upload - Lambdas" -ForegroundColor Cyan
Write-Host "Micro Agente Disparo & Agendamento" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$env = $Environment
$bucketName = "alquimista-lambda-artifacts-$env"
$region = "us-east-1"
$lambdaSourceDir = "lambda-src/agente-disparo-agenda"

Write-Host "Ambiente: $env" -ForegroundColor White
Write-Host "Bucket: $bucketName" -ForegroundColor White
Write-Host "Região: $region" -ForegroundColor White
Write-Host ""

# 1. Verificar se o diretório existe
if (-not (Test-Path $lambdaSourceDir)) {
    Write-Host "✗ Erro: Diretório não encontrado: $lambdaSourceDir" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Diretório encontrado: $lambdaSourceDir" -ForegroundColor Green
Write-Host ""

# 2. Instalar dependências
Write-Host "1. Instalando dependências..." -ForegroundColor Yellow
Set-Location $lambdaSourceDir

if (Test-Path "package.json") {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Erro ao instalar dependências" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Dependências instaladas" -ForegroundColor Green
} else {
    Write-Host "⚠ package.json não encontrado" -ForegroundColor Yellow
}

Write-Host ""

# 3. Compilar TypeScript
Write-Host "2. Compilando TypeScript..." -ForegroundColor Yellow

if (Test-Path "tsconfig.json") {
    npx tsc
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Erro ao compilar TypeScript" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ TypeScript compilado" -ForegroundColor Green
} else {
    Write-Host "⚠ tsconfig.json não encontrado" -ForegroundColor Yellow
}

Write-Host ""

# 4. Criar ZIPs
Write-Host "3. Criando arquivos ZIP..." -ForegroundColor Yellow

$distDir = "dist"
if (-not (Test-Path $distDir)) {
    Write-Host "✗ Diretório dist não encontrado" -ForegroundColor Red
    exit 1
}

$handlers = @(
    "api-handler",
    "ingest-contacts",
    "send-messages",
    "handle-replies",
    "schedule-meeting",
    "confirm-meeting",
    "send-reminders"
)

$zipsCreated = 0

foreach ($handler in $handlers) {
    $zipName = "$handler.zip"
    $zipPath = "$distDir/$zipName"
    
    if (Test-Path "$distDir/handlers/$handler.js") {
        # Criar ZIP com o handler e node_modules
        Compress-Archive -Path "$distDir/handlers/$handler.js", "node_modules" -DestinationPath $zipPath -Force
        Write-Host "  ✓ Criado: $zipName" -ForegroundColor Green
        $zipsCreated++
    } else {
        Write-Host "  ⚠ Handler não encontrado: $handler.js" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✓ ZIPs criados: $zipsCreated/$($handlers.Count)" -ForegroundColor Green
Write-Host ""

# 5. Upload para S3
Write-Host "4. Fazendo upload para S3..." -ForegroundColor Yellow

$uploadsSuccess = 0

foreach ($handler in $handlers) {
    $zipName = "$handler.zip"
    $zipPath = "$distDir/$zipName"
    
    if (Test-Path $zipPath) {
        $s3Key = "micro-agente-disparo-agenda/$zipName"
        aws s3 cp $zipPath "s3://$bucketName/$s3Key" --region $region
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ Upload: $zipName" -ForegroundColor Green
            $uploadsSuccess++
        } else {
            Write-Host "  ✗ Erro no upload: $zipName" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "✓ Uploads concluídos: $uploadsSuccess/$zipsCreated" -ForegroundColor Green
Write-Host ""

# Voltar para raiz
Set-Location ../..

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Build Concluído!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($uploadsSuccess -eq $handlers.Count) {
    Write-Host "✓ Todos os handlers foram buildados e enviados!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximo passo: Executar Terraform" -ForegroundColor White
} else {
    Write-Host "⚠ Alguns handlers não foram enviados" -ForegroundColor Yellow
    Write-Host "  Buildados: $zipsCreated" -ForegroundColor Gray
    Write-Host "  Enviados: $uploadsSuccess" -ForegroundColor Gray
}

Write-Host ""
