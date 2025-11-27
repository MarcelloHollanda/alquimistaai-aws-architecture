# Script para capturar os ultimos erros do deploy do NigredoStack
$env:AWS_ACCESS_KEY_ID = "AKIATA2OIDWBSGYQQHFK"
$env:AWS_SECRET_ACCESS_KEY = "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"
$env:AWS_DEFAULT_REGION = "us-east-1"

Write-Host "Buscando erros do NigredoStack-dev..." -ForegroundColor Cyan
Write-Host ""

# Buscar eventos com falha
$events = aws cloudformation describe-stack-events --stack-name NigredoStack-dev --max-items 100 --output json | ConvertFrom-Json

$failedEvents = $events.StackEvents | Where-Object { 
    $_.ResourceStatus -match 'FAILED' 
} | Select-Object -First 5

if ($failedEvents.Count -eq 0) {
    Write-Host "Nenhum erro encontrado nos ultimos 100 eventos" -ForegroundColor Green
} else {
    Write-Host "Encontrados $($failedEvents.Count) erros:" -ForegroundColor Red
    Write-Host ""
    
    $counter = 1
    foreach ($event in $failedEvents) {
        Write-Host "================================================================" -ForegroundColor Yellow
        Write-Host "ERRO #$counter" -ForegroundColor Red
        Write-Host "================================================================" -ForegroundColor Yellow
        Write-Host "Timestamp:      $($event.Timestamp)" -ForegroundColor White
        Write-Host "Resource:       $($event.LogicalResourceId)" -ForegroundColor White
        Write-Host "Resource Type:  $($event.ResourceType)" -ForegroundColor White
        Write-Host "Status:         $($event.ResourceStatus)" -ForegroundColor Red
        Write-Host "Reason:" -ForegroundColor White
        Write-Host "   $($event.ResourceStatusReason)" -ForegroundColor Yellow
        Write-Host ""
        $counter++
    }
}

# Verificar status atual da stack
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "STATUS ATUAL DA STACK" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

$stackStatus = aws cloudformation describe-stacks --stack-name NigredoStack-dev --query "Stacks[0].StackStatus" --output text 2>&1

if ($stackStatus -match "does not exist") {
    Write-Host "Stack nao existe (foi deletada)" -ForegroundColor Yellow
} else {
    Write-Host "Status: $stackStatus" -ForegroundColor White
}
