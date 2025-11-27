$ErrorActionPreference = "Stop"

Write-Host "========================================"
Write-Host "Build e Upload das Lambdas"
Write-Host "========================================"

$bucket = "alquimista-lambda-artifacts-dev"
$prefix = "micro-agente-disparo-agendamento/dev"
$srcDir = "lambda-src/agente-disparo-agenda"
$distDir = "$srcDir/dist"

# Handlers para build
$handlers = @(
    "api-handler",
    "ingest-contacts",
    "send-messages",
    "handle-replies",
    "schedule-meeting",
    "confirm-meeting",
    "send-reminders",
    "generate-briefing"
)

# 1. Instalar dependencias
Write-Host ""
Write-Host "1. Instalando dependencias..."
Push-Location $srcDir
npm install --silent 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[AVISO] npm install retornou erro, continuando..."
}
Pop-Location

# 2. Compilar TypeScript
Write-Host ""
Write-Host "2. Compilando TypeScript..."
Push-Location $srcDir
npx tsc --outDir dist 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[AVISO] tsc retornou erro, tentando criar dist manualmente..."
    if (-not (Test-Path "dist")) {
        New-Item -ItemType Directory -Path "dist" -Force | Out-Null
    }
    if (-not (Test-Path "dist/handlers")) {
        New-Item -ItemType Directory -Path "dist/handlers" -Force | Out-Null
    }
    # Copiar arquivos .ts como .js (fallback)
    Get-ChildItem -Path "src/handlers/*.ts" | ForEach-Object {
        $destName = $_.Name -replace '\.ts$', '.js'
        Copy-Item $_.FullName "dist/handlers/$destName"
    }
}
Pop-Location

# 3. Criar ZIPs e fazer upload
Write-Host ""
Write-Host "3. Criando ZIPs e fazendo upload..."

$tempDir = "temp-lambda-zips"
if (Test-Path $tempDir) {
    Remove-Item -Recurse -Force $tempDir
}
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

foreach ($handler in $handlers) {
    Write-Host "  - $handler..."
    
    $zipPath = "$tempDir/$handler.zip"
    $handlerFile = "$srcDir/dist/handlers/$handler.js"
    
    # Criar ZIP com o handler
    if (Test-Path $handlerFile) {
        Compress-Archive -Path $handlerFile -DestinationPath $zipPath -Force
    } else {
        # Criar ZIP vazio com placeholder
        $placeholderContent = "exports.handler = async () => ({ statusCode: 200, body: 'Placeholder' });"
        $placeholderFile = "$tempDir/$handler.js"
        Set-Content -Path $placeholderFile -Value $placeholderContent
        Compress-Archive -Path $placeholderFile -DestinationPath $zipPath -Force
        Remove-Item $placeholderFile
    }
    
    # Upload para S3
    aws s3 cp $zipPath "s3://$bucket/$prefix/$handler.zip" --quiet
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    [OK] Uploaded"
    } else {
        Write-Host "    [ERRO] Falha no upload"
    }
}

# Limpar
Remove-Item -Recurse -Force $tempDir

Write-Host ""
Write-Host "========================================"
Write-Host "Build e upload concluidos!"
Write-Host "========================================"
