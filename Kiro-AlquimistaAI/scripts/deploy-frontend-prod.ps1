#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Deploy do frontend AlquimistaAI para ambiente PROD
.DESCRIPTION
    Script automatizado para fazer upload dos arquivos frontend para S3 e invalidar cache do CloudFront
    ATENÇÃO: Requer confirmação manual antes de executar
.EXAMPLE
    .\scripts\deploy-frontend-prod.ps1
#>

# Configurações
$ErrorActionPreference = "Stop"
$StackName = "FrontendStack-prod"
$FrontendDir = "./frontend"

Write-Host "🚀 Iniciando deploy do frontend PROD..." -ForegroundColor Cyan
Write-Host ""

# CONFIRMAÇÃO OBRIGATÓRIA
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "⚠️  ATENÇÃO: Você está prestes a fazer deploy em PRODUÇÃO!" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""
Write-Host "Este deploy irá:" -ForegroundColor Yellow
Write-Host "  • Substituir arquivos no bucket de produção" -ForegroundColor Yellow
Write-Host "  • Invalidar cache do CloudFront" -ForegroundColor Yellow
Write-Host "  • Afetar usuários finais imediatamente" -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "Digite 'SIM' (em maiúsculas) para confirmar"

if ($confirm -ne "SIM") {
    Write-Host ""
    Write-Host "❌ Deploy cancelado pelo usuário." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Confirmação recebida. Prosseguindo com deploy..." -ForegroundColor Green
Write-Host ""

# Verificar se AWS CLI está instalado
try {
    $awsVersion = aws --version 2>&1
    Write-Host "✅ AWS CLI: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro: AWS CLI não está instalado." -ForegroundColor Red
    Write-Host "   Instale em: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

# Verificar se diretório frontend existe
if (-not (Test-Path $FrontendDir)) {
    Write-Host "❌ Erro: Diretório '$FrontendDir' não encontrado." -ForegroundColor Red
    exit 1
}

Write-Host "📋 Obtendo informações da stack..." -ForegroundColor Cyan

# Obter informações da stack
try {
    $BUCKET_NAME = aws cloudformation describe-stacks `
        --stack-name $StackName `
        --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" `
        --output text 2>&1

    if ($LASTEXITCODE -ne 0) {
        throw "Erro ao obter nome do bucket"
    }

    $DIST_ID = aws cloudformation describe-stacks `
        --stack-name $StackName `
        --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" `
        --output text 2>&1

    if ($LASTEXITCODE -ne 0) {
        throw "Erro ao obter ID da distribution"
    }

    $FRONTEND_URL = aws cloudformation describe-stacks `
        --stack-name $StackName `
        --query "Stacks[0].Outputs[?OutputKey=='FrontendUrl'].OutputValue" `
        --output text 2>&1

    if ($LASTEXITCODE -ne 0) {
        throw "Erro ao obter URL do frontend"
    }
} catch {
    Write-Host "❌ Erro: Não foi possível obter informações da stack." -ForegroundColor Red
    Write-Host "   Certifique-se de que a stack '$StackName' foi deployada." -ForegroundColor Yellow
    Write-Host "   Execute: cdk deploy $StackName --context env=prod" -ForegroundColor Yellow
    exit 1
}

if (-not $BUCKET_NAME -or -not $DIST_ID -or -not $FRONTEND_URL) {
    Write-Host "❌ Erro: Informações da stack incompletas." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Stack encontrada!" -ForegroundColor Green
Write-Host "   📦 Bucket: $BUCKET_NAME" -ForegroundColor Gray
Write-Host "   🌐 Distribution: $DIST_ID" -ForegroundColor Gray
Write-Host "   🔗 URL: $FRONTEND_URL" -ForegroundColor Gray
Write-Host ""

# Upload dos arquivos
Write-Host "📤 Fazendo upload dos arquivos para S3..." -ForegroundColor Cyan
Write-Host "   Origem: $FrontendDir" -ForegroundColor Gray
Write-Host "   Destino: s3://$BUCKET_NAME/" -ForegroundColor Gray
Write-Host ""

try {
    aws s3 sync $FrontendDir s3://$BUCKET_NAME/ `
        --delete `
        --exclude ".git/*" `
        --exclude "node_modules/*" `
        --exclude ".next/*" `
        --exclude "*.md" `
        --exclude "package*.json" `
        --exclude "tsconfig.json" `
        --exclude "next.config.js" `
        --exclude "tailwind.config.ts" `
        --exclude "postcss.config.js" `
        --exclude ".env*"

    if ($LASTEXITCODE -ne 0) {
        throw "Erro no upload dos arquivos"
    }
} catch {
    Write-Host "❌ Erro no upload dos arquivos." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Upload concluído!" -ForegroundColor Green
Write-Host ""

# Invalidar cache do CloudFront
Write-Host "🔄 Invalidando cache do CloudFront..." -ForegroundColor Cyan

try {
    $INVALIDATION_ID = aws cloudfront create-invalidation `
        --distribution-id $DIST_ID `
        --paths "/*" `
        --query "Invalidation.Id" `
        --output text 2>&1

    if ($LASTEXITCODE -ne 0) {
        throw "Erro ao criar invalidação"
    }
} catch {
    Write-Host "⚠️  Aviso: Erro ao invalidar cache do CloudFront." -ForegroundColor Yellow
    Write-Host "   O deploy foi concluído, mas o cache não foi invalidado." -ForegroundColor Yellow
    Write-Host "   Execute manualmente:" -ForegroundColor Yellow
    Write-Host "   aws cloudfront create-invalidation --distribution-id $DIST_ID --paths '/*'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "✅ Deploy concluído (com aviso)!" -ForegroundColor Yellow
    Write-Host "🔗 URL: $FRONTEND_URL" -ForegroundColor Green
    exit 0
}

Write-Host "✅ Invalidação criada: $INVALIDATION_ID" -ForegroundColor Green
Write-Host ""

# Resumo final
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ Deploy do frontend PROD concluído com sucesso!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 URL do Frontend: $FRONTEND_URL" -ForegroundColor Green
Write-Host "📦 Bucket S3: $BUCKET_NAME" -ForegroundColor Gray
Write-Host "🌐 Distribution: $DIST_ID" -ForegroundColor Gray
Write-Host "⏳ Invalidação: $INVALIDATION_ID" -ForegroundColor Gray
Write-Host ""
Write-Host "⏱️  Aguarde 1-2 minutos para a invalidação do cache ser concluída." -ForegroundColor Yellow
Write-Host ""
Write-Host "🌐 Abrir no navegador:" -ForegroundColor Cyan
Write-Host "   start $FRONTEND_URL" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  IMPORTANTE: Monitore a aplicação após o deploy!" -ForegroundColor Yellow
Write-Host "   • Verifique se as páginas carregam corretamente" -ForegroundColor Yellow
Write-Host "   • Teste funcionalidades críticas" -ForegroundColor Yellow
Write-Host "   • Monitore logs do CloudWatch" -ForegroundColor Yellow
Write-Host ""
