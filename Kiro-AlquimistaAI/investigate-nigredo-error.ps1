# Script para investigar erro no deploy da NigredoStack-dev

$env:AWS_ACCESS_KEY_ID = "AKIATA2OIDWBSGYQQHFK"
$env:AWS_SECRET_ACCESS_KEY = "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"
$env:AWS_DEFAULT_REGION = "us-east-1"

Write-Host "=== Investigando erro na NigredoStack-dev ===" -ForegroundColor Yellow
Write-Host ""

Write-Host "1. Status da Stack:" -ForegroundColor Cyan
aws cloudformation describe-stacks --stack-name NigredoStack-dev --query 'Stacks[0].[StackName,StackStatus,StackStatusReason]' --output table

Write-Host ""
Write-Host "2. Eventos de Falha:" -ForegroundColor Cyan
aws cloudformation describe-stack-events --stack-name NigredoStack-dev --max-items 50 --query 'StackEvents[?ResourceStatus==`CREATE_FAILED` || ResourceStatus==`ROLLBACK_IN_PROGRESS`].[Timestamp,LogicalResourceId,ResourceType,ResourceStatus,ResourceStatusReason]' --output table

Write-Host ""
Write-Host "3. Recursos Criados Antes da Falha:" -ForegroundColor Cyan
aws cloudformation describe-stack-resources --stack-name NigredoStack-dev --query 'StackResources[?ResourceStatus==`CREATE_COMPLETE`].[LogicalResourceId,ResourceType]' --output table

Write-Host ""
Write-Host "=== Fim da Investigação ===" -ForegroundColor Yellow
