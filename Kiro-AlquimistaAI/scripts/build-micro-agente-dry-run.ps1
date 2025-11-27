# Script de Build e Upload - Micro Agente Dry-Run
# Sistema: AlquimistaAI
# Componente: Micro Agente de Disparos & Agendamentos
# Função: Build da Lambda dry-run e upload para S3

param(
    [string]$Environment = "dev",
    [switch]$SkipBuild,
    [switch]$SkipUpload,
    [string]$BucketName = "alquimista-lambda-artifacts-dev"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BUILD MICRO AGENTE DRY-RUN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ambiente: $Environment" -ForegroundColor White
Write-Host "Bucket S3: $BucketName" -ForegroundColor White
Write-Host ""

# Verificar se está na raiz do projeto
if (-not (Test-Path "lambda-src/agente-disparo-agenda")) {
    Write-Host "❌ ERRO: Diretório lambda-src/agente-disparo-agenda não encontrado!" -ForegroundColor Red
    Write-Host "Execute este script da raiz do projeto." -ForegroundColor Yellow
    exit 1
}

# Navegar para o diretório da Lambda
Push-Location "lambda-src/agente-disparo-agenda"

try {
    # ========================================
    # PASSO 1: BUILD
    # ========================================
    
    if (-not $SkipBuild) {
        Write-Host "📦 Passo 1: Build do TypeScript" -ForegroundColor Cyan
        Write-Host ""
        
        # Verificar se node_modules existe
        if (-not (Test-Path "node_modules")) {
            Write-Host "Instalando dependências..." -ForegroundColor Yellow
            npm install
            if ($LASTEXITCODE -ne 0) {
                throw "Erro ao instalar dependências"
            }
        }
        
        # Compilar TypeScript
        Write-Host "Compilando TypeScript..." -ForegroundColor Yellow
        npm run build
        if ($LASTEXITCODE -ne 0) {
            throw "Erro ao compilar TypeScript"
        }
        
        # Verificar se o handler dry-run foi compilado
        if (-not (Test-Path "dist/handlers/dry-run.js")) {
            throw "Handler dry-run.js não foi compilado!"
        }
        
        Write-Host "✅ Build concluído com sucesso" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "⏭️  Pulando build (--SkipBuild)" -ForegroundColor Yellow
        Write-Host ""
    }
    
    # ========================================
    # PASSO 2: CRIAR PACOTE ZIP
    # ========================================
    
    Write-Host "📦 Passo 2: Criar pacote ZIP" -ForegroundColor Cyan
    Write-Host ""
    
    # Criar diretório de build se não existir
    if (-not (Test-Path "build")) {
        New-Item -ItemType Directory -Path "build" | Out-Null
    }
    
    # Limpar build anterior
    if (Test-Path "build/dry-run") {
        Remove-Item -Recurse -Force "build/dry-run"
    }
    
    # Criar estrutura do pacote
    New-Item -ItemType Directory -Path "build/dry-run" | Out-Null
    
    # Copiar código compilado
    Write-Host "Copiando código compilado..." -ForegroundColor Yellow
    Copy-Item -Recurse -Force "dist/*" "build/dry-run/"
    
    # Copiar node_modules (apenas production)
    Write-Host "Copiando dependências..." -ForegroundColor Yellow
    Copy-Item -Recurse -Force "node_modules" "build/dry-run/"
    
    # Copiar package.json
    Copy-Item -Force "package.json" "build/dry-run/"
    
    # Criar ZIP
    Write-Host "Criando arquivo ZIP..." -ForegroundColor Yellow
    $zipPath = "build/dry-run.zip"
    if (Test-Path $zipPath) {
        Remove-Item -Force $zipPath
    }
    
    Compress-Archive -Path "build/dry-run/*" -DestinationPath $zipPath -Force
    
    # Verificar tamanho do ZIP
    $zipSize = (Get-Item $zipPath).Length / 1MB
    Write-Host "✅ ZIP criado: $zipPath" -ForegroundColor Green
    Write-Host "   Tamanho: $([math]::Round($zipSize, 2)) MB" -ForegroundColor White
    Write-Host ""
    
    if ($zipSize -gt 50) {
        Write-Host "⚠️  AVISO: ZIP maior que 50 MB!" -ForegroundColor Yellow
        Write-Host "   Considere otimizar dependências." -ForegroundColor Yellow
        Write-Host ""
    }
    
    # ========================================
    # PASSO 3: UPLOAD PARA S3
    # ========================================
    
    if (-not $SkipUpload) {
        Write-Host "☁️  Passo 3: Upload para S3" -ForegroundColor Cyan
        Write-Host ""
        
        # Verificar se AWS CLI está disponível
        if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
            Write-Host "❌ ERRO: AWS CLI não encontrado!" -ForegroundColor Red
            Write-Host "Instale: https://aws.amazon.com/cli/" -ForegroundColor Yellow
            exit 1
        }
        
        # Verificar se bucket existe
        Write-Host "Verificando bucket S3..." -ForegroundColor Yellow
        $bucketCheck = aws s3 ls "s3://$BucketName" --region us-east-1 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "⚠️  Bucket não existe. Criando..." -ForegroundColor Yellow
            aws s3 mb "s3://$BucketName" --region us-east-1
            if ($LASTEXITCODE -ne 0) {
                throw "Erro ao criar bucket S3"
            }
        }
        
        # Upload do ZIP
        $s3Key = "micro-agente-disparo-agendamento/$Environment/dry-run.zip"
        Write-Host "Fazendo upload para s3://$BucketName/$s3Key..." -ForegroundColor Yellow
        
        aws s3 cp $zipPath "s3://$BucketName/$s3Key" --region us-east-1
        if ($LASTEXITCODE -ne 0) {
            throw "Erro ao fazer upload para S3"
        }
        
        Write-Host "✅ Upload concluído" -ForegroundColor Green
        Write-Host "   S3 URI: s3://$BucketName/$s3Key" -ForegroundColor White
        Write-Host ""
        
        # Verificar upload
        Write-Host "Verificando upload..." -ForegroundColor Yellow
        $s3List = aws s3 ls "s3://$BucketName/micro-agente-disparo-agendamento/$Environment/" --region us-east-1
        Write-Host $s3List -ForegroundColor Gray
        Write-Host ""
        
    } else {
        Write-Host "⏭️  Pulando upload (--SkipUpload)" -ForegroundColor Yellow
        Write-Host ""
    }
    
    # ========================================
    # RESUMO
    # ========================================
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "RESUMO" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "✅ Build concluído com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Artefato local:" -ForegroundColor Cyan
    Write-Host "  $((Get-Location).Path)\$zipPath" -ForegroundColor White
    Write-Host ""
    
    if (-not $SkipUpload) {
        Write-Host "Artefato S3:" -ForegroundColor Cyan
        Write-Host "  s3://$BucketName/micro-agente-disparo-agendamento/$Environment/dry-run.zip" -ForegroundColor White
        Write-Host ""
    }
    
    Write-Host "Próximos passos:" -ForegroundColor Cyan
    Write-Host "  1. Aplicar migration 007:" -ForegroundColor White
    Write-Host "     .\scripts\apply-migrations-aurora-dev.ps1" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. Deploy via Terraform:" -ForegroundColor White
    Write-Host "     cd terraform\envs\dev" -ForegroundColor Gray
    Write-Host "     terraform init" -ForegroundColor Gray
    Write-Host "     terraform plan" -ForegroundColor Gray
    Write-Host "     terraform apply" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  3. Testar Lambda:" -ForegroundColor White
    Write-Host "     aws lambda invoke --function-name micro-agente-disparo-agendamento-dev-dry-run ..." -ForegroundColor Gray
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    exit 1
} finally {
    # Voltar para o diretório original
    Pop-Location
}

exit 0
