# Script para monitorar rollback e fazer deploy automático do NigredoStack
# Uso: .\watch-and-deploy-nigredo.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Monitor de Deploy - NigredoStack-dev" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$stackName = "NigredoStack-dev"
$checkInterval = 15  # segundos entre verificações
$maxAttempts = 60    # máximo de tentativas (15 min)
$attempt = 0

Write-Host "Iniciando monitoramento do stack $stackName..." -ForegroundColor Yellow
Write-Host "Verificando status a cada $checkInterval segundos..." -ForegroundColor Gray
Write-Host ""

while ($attempt -lt $maxAttempts) {
    $attempt++
    $timestamp = Get-Date -Format "HH:mm:ss"
    
    # Verificar status do stack
    $status = aws cloudformation describe-stacks --stack-name $stackName --query 'Stacks[0].StackStatus' --output text 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        # Stack não existe mais - pronto para deploy!
        Write-Host "[$timestamp] ✅ Stack não existe - pronto para deploy!" -ForegroundColor Green
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  Iniciando Deploy do NigredoStack" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        
        # Fazer o deploy
        npx cdk deploy NigredoStack-dev --require-approval never
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "  ✅ DEPLOY CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            Write-Host ""
            
            # Mostrar outputs
            Write-Host "Obtendo URL da API..." -ForegroundColor Cyan
            $apiUrl = aws cloudformation describe-stacks --stack-name $stackName --query 'Stacks[0].Outputs[?OutputKey==`NigredoApiUrl`].OutputValue' --output text
            
            if ($apiUrl) {
                Write-Host ""
                Write-Host "🚀 API Nigredo disponível em:" -ForegroundColor Green
                Write-Host "   $apiUrl" -ForegroundColor White
                Write-Host ""
            }
            
            Write-Host "Para ver todos os outputs:" -ForegroundColor Gray
            Write-Host "   aws cloudformation describe-stacks --stack-name $stackName --query 'Stacks[0].Outputs'" -ForegroundColor Gray
            Write-Host ""
        } else {
            Write-Host ""
            Write-Host "❌ ERRO no deploy!" -ForegroundColor Red
            Write-Host "Verifique os logs acima para detalhes." -ForegroundColor Yellow
            Write-Host ""
        }
        
        exit $LASTEXITCODE
    }
    
    # Stack ainda existe - mostrar status
    $statusColor = "Yellow"
    $statusIcon = "⏳"
    
    if ($status -eq "ROLLBACK_COMPLETE") {
        $statusColor = "Green"
        $statusIcon = "✅"
        Write-Host "[$timestamp] $statusIcon Status: $status - Pronto para deploy!" -ForegroundColor $statusColor
        Write-Host ""
        Write-Host "Stack em estado ROLLBACK_COMPLETE. Deletando antes do deploy..." -ForegroundColor Yellow
        
        # Deletar o stack
        aws cloudformation delete-stack --stack-name $stackName
        Write-Host "Aguardando deleção completa..." -ForegroundColor Gray
        Start-Sleep -Seconds 30
        continue
    }
    elseif ($status -like "*FAILED*" -or $status -like "*ROLLBACK*") {
        $statusColor = "Yellow"
    }
    elseif ($status -like "*COMPLETE*") {
        $statusColor = "Green"
    }
    
    Write-Host "[$timestamp] $statusIcon Status: $status (tentativa $attempt/$maxAttempts)" -ForegroundColor $statusColor
    
    # Aguardar antes da próxima verificação
    Start-Sleep -Seconds $checkInterval
}

# Timeout
Write-Host ""
Write-Host "⚠️  Timeout atingido após $maxAttempts tentativas." -ForegroundColor Yellow
Write-Host "O rollback ainda está em progresso." -ForegroundColor Yellow
Write-Host ""
Write-Host "Você pode:" -ForegroundColor Cyan
Write-Host "  1. Executar este script novamente: .\watch-and-deploy-nigredo.ps1" -ForegroundColor White
Write-Host "  2. Verificar manualmente: aws cloudformation describe-stacks --stack-name $stackName" -ForegroundColor White
Write-Host "  3. Ver eventos no console: https://console.aws.amazon.com/cloudformation" -ForegroundColor White
Write-Host ""

exit 1
