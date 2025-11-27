# Script para Executar Migration 017 via Lambda
# Sistema: AlquimistaAI
# Migration: 017_create_dry_run_log_micro_agente.sql
# Componente: Micro Agente de Disparos & Agendamentos

param(
    [string]$Environment = "dev",
    [string]$FunctionName = "aurora-migrations-runner-dev"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "EXECUTAR MIGRATION 017 VIA LAMBDA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# Validar AWS CLI
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "❌ ERRO: AWS CLI não encontrado!" -ForegroundColor Red
    Write-Host "Instale: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

# Validar credenciais AWS
Write-Host "🔐 Validando credenciais AWS..." -ForegroundColor Yellow
try {
    $identity = aws sts get-caller-identity 2>&1 | ConvertFrom-Json
    Write-Host "✅ Autenticado como: $($identity.Arn)" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ ERRO: Credenciais AWS inválidas ou não configuradas" -ForegroundColor Red
    Write-Host "Configure com: aws configure" -ForegroundColor Yellow
    exit 1
}

# Preparar payload
$payload = @{
    action = "run-migration"
    target = "017"
} | ConvertTo-Json -Compress

Write-Host "📤 Invocando Lambda: $FunctionName" -ForegroundColor Yellow
Write-Host "Payload: $payload" -ForegroundColor Gray
Write-Host ""

# Criar arquivo temporário para payload
$payloadFile = [System.IO.Path]::GetTempFileName()
$payload | Out-File -FilePath $payloadFile -Encoding utf8 -NoNewline

# Invocar Lambda
$outputFile = "migration-017-output.json"

try {
    aws lambda invoke `
        --function-name $FunctionName `
        --payload "file://$payloadFile" `
        --cli-binary-format raw-in-base64-out `
        $outputFile

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ERRO: Falha ao invocar Lambda" -ForegroundColor Red
        exit 1
    }

    Write-Host "✅ Lambda invocada com sucesso" -ForegroundColor Green
    Write-Host ""

    # Ler e exibir resultado
    Write-Host "📥 Resultado da execução:" -ForegroundColor Cyan
    $result = Get-Content $outputFile | ConvertFrom-Json
    
    Write-Host ($result | ConvertTo-Json -Depth 10) -ForegroundColor White
    Write-Host ""

    if ($result.status -eq "success") {
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "✅ MIGRATION 017 EXECUTADA COM SUCESSO" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Tabela criada: dry_run_log" -ForegroundColor Green
        Write-Host "Componente: Micro Agente de Disparos e Agendamentos" -ForegroundColor White
        Write-Host ""
        Write-Host "Próximos passos:" -ForegroundColor Cyan
        Write-Host "  1. Verificar logs no CloudWatch:" -ForegroundColor White
        Write-Host "     aws logs tail /aws/lambda/$FunctionName --follow" -ForegroundColor Gray
        Write-Host ""
        Write-Host "  2. Validar tabela criada (via outra Lambda com acesso ao Aurora)" -ForegroundColor White
        Write-Host ""
        Write-Host "  3. Integrar dry_run_log no código do Micro Agente" -ForegroundColor White
        Write-Host "     Ver: lambda-src/agente-disparo-agenda/src/handlers/dry-run.ts" -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "❌ MIGRATION 017 FALHOU" -ForegroundColor Red
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Erro: $($result.error)" -ForegroundColor Red
        Write-Host ""
        Write-Host "Troubleshooting:" -ForegroundColor Yellow
        Write-Host "  1. Verificar logs no CloudWatch:" -ForegroundColor White
        Write-Host "     aws logs tail /aws/lambda/$FunctionName --follow" -ForegroundColor Gray
        Write-Host ""
        Write-Host "  2. Verificar conectividade Lambda para Aurora:" -ForegroundColor White
        Write-Host "     - Lambda está na mesma VPC do Aurora?" -ForegroundColor Gray
        Write-Host "     - Security Group permite porta 5432?" -ForegroundColor Gray
        Write-Host "     - Secret ARN está correto?" -ForegroundColor Gray
        Write-Host ""
        exit 1
    }

} finally {
    # Limpar arquivo temporário
    Remove-Item $payloadFile -ErrorAction SilentlyContinue
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
