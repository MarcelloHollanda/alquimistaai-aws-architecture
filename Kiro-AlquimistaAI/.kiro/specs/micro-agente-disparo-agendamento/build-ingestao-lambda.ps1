# build-ingestao-lambda.ps1
# Script para build e deploy da Lambda de Ingestão de Leads

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('dev', 'prod')]
    [string]$Environment = 'dev',
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBuild,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipUpload
)

$ErrorActionPreference = "Stop"

# Cores para output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

Write-Info "=========================================="
Write-Info "Build Lambda Ingestão - Ambiente: $Environment"
Write-Info "=========================================="

# Diretórios
$rootDir = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
$lambdaDir = Join-Path $rootDir "lambda-src\agente-disparo-agenda"
$distDir = Join-Path $lambdaDir "dist"
$zipFile = Join-Path $lambdaDir "ingestao-lambda.zip"

# Validar que o diretório existe
if (-not (Test-Path $lambdaDir)) {
    Write-Error "Diretório não encontrado: $lambdaDir"
    exit 1
}

# 1. Build TypeScript
if (-not $SkipBuild) {
    Write-Info "`n[1/4] Instalando dependências..."
    Push-Location $lambdaDir
    
    if (-not (Test-Path "node_modules")) {
        npm install
    } else {
        Write-Info "node_modules já existe, pulando npm install"
    }
    
    Write-Info "`n[2/4] Compilando TypeScript..."
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Erro ao compilar TypeScript"
        Pop-Location
        exit 1
    }
    
    Pop-Location
    Write-Success "✓ Build concluído"
} else {
    Write-Warning "Pulando build (--SkipBuild)"
}

# 2. Criar ZIP
Write-Info "`n[3/4] Criando pacote ZIP..."

if (Test-Path $zipFile) {
    Remove-Item $zipFile -Force
}

Push-Location $distDir

# Incluir apenas arquivos necessários
$filesToZip = @(
    "ingestao\*",
    "shared\*"
)

# Copiar node_modules necessários
$nodeModulesDir = Join-Path $lambdaDir "node_modules"
if (Test-Path $nodeModulesDir) {
    Write-Info "Copiando node_modules..."
    
    # Copiar apenas dependências de produção
    $prodDeps = @(
        "@aws-sdk",
        "pg",
        "xlsx"
    )
    
    foreach ($dep in $prodDeps) {
        $depPath = Join-Path $nodeModulesDir $dep
        if (Test-Path $depPath) {
            $destPath = Join-Path $distDir "node_modules\$dep"
            if (-not (Test-Path (Split-Path $destPath))) {
                New-Item -ItemType Directory -Path (Split-Path $destPath) -Force | Out-Null
            }
            Copy-Item -Path $depPath -Destination $destPath -Recurse -Force
        }
    }
}

# Criar ZIP
Compress-Archive -Path * -DestinationPath $zipFile -Force

Pop-Location

$zipSize = (Get-Item $zipFile).Length / 1MB
Write-Success "✓ ZIP criado: $zipFile ($([math]::Round($zipSize, 2)) MB)"

# 3. Upload para S3
if (-not $SkipUpload) {
    Write-Info "`n[4/4] Fazendo upload para S3..."
    
    $bucketName = "alquimista-lambda-artifacts-$Environment"
    $s3Key = "ingestao/ingestao-lambda.zip"
    
    aws s3 cp $zipFile "s3://$bucketName/$s3Key" --region us-east-1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Erro ao fazer upload para S3"
        exit 1
    }
    
    Write-Success "✓ Upload concluído: s3://$bucketName/$s3Key"
    
    # Atualizar código da Lambda
    Write-Info "`nAtualizando código da Lambda..."
    
    $functionName = "alquimista-ingestao-leads-$Environment"
    
    aws lambda update-function-code `
        --function-name $functionName `
        --s3-bucket $bucketName `
        --s3-key $s3Key `
        --region us-east-1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Erro ao atualizar Lambda"
        exit 1
    }
    
    Write-Success "✓ Lambda atualizada: $functionName"
} else {
    Write-Warning "Pulando upload (--SkipUpload)"
}

Write-Success "`n=========================================="
Write-Success "Build e deploy concluídos com sucesso!"
Write-Success "=========================================="

# Próximos passos
Write-Info "`nPróximos passos:"
Write-Info "1. Testar a Lambda com um arquivo de teste"
Write-Info "2. Verificar logs: aws logs tail /aws/lambda/alquimista-ingestao-leads-$Environment --follow"
Write-Info "3. Monitorar métricas no CloudWatch"
