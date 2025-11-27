# Script para Limpar Stack em Estado de Erro
# Alquimista.AI

Write-Host "Limpando stack em estado de erro..." -ForegroundColor Yellow
Write-Host ""

# Verificar estado atual
Write-Host "Verificando estado do stack..." -ForegroundColor Cyan
$status = aws cloudformation describe-stacks --stack-name FibonacciStack-dev --query "Stacks[0].StackStatus" --output text 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "[OK] Stack nao existe. Pronto para deploy!" -ForegroundColor Green
    exit 0
}

Write-Host "Estado atual: $status" -ForegroundColor Yellow
Write-Host ""

# Se está em ROLLBACK_IN_PROGRESS, aguardar
if ($status -eq "ROLLBACK_IN_PROGRESS" -or $status -eq "DELETE_IN_PROGRESS") {
    Write-Host "Aguardando conclusao do rollback/delete..." -ForegroundColor Yellow
    
    do {
        Start-Sleep -Seconds 10
        $status = aws cloudformation describe-stacks --stack-name FibonacciStack-dev --query "Stacks[0].StackStatus" --output text 2>$null
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[OK] Stack deletado!" -ForegroundColor Green
            exit 0
        }
        
        Write-Host "Status: $status" -ForegroundColor Cyan
    } while ($status -eq "ROLLBACK_IN_PROGRESS" -or $status -eq "DELETE_IN_PROGRESS")
}

# Deletar stack
Write-Host ""
Write-Host "Deletando stack..." -ForegroundColor Yellow
aws cloudformation delete-stack --stack-name FibonacciStack-dev

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Comando de delete enviado" -ForegroundColor Green
    Write-Host ""
    Write-Host "Aguardando delecao completa..." -ForegroundColor Yellow
    
    do {
        Start-Sleep -Seconds 10
        $status = aws cloudformation describe-stacks --stack-name FibonacciStack-dev --query "Stacks[0].StackStatus" --output text 2>$null
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host ""
            Write-Host "[OK] Stack deletado com sucesso!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Agora voce pode executar: .\deploy-backend.ps1" -ForegroundColor Cyan
            exit 0
        }
        
        Write-Host "Status: $status" -ForegroundColor Cyan
    } while ($true)
} else {
    Write-Host "[ERRO] Falha ao deletar stack" -ForegroundColor Red
    exit 1
}
