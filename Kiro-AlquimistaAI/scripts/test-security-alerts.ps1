# Script para Testar Envio de Alertas de Segurança
# Envia uma mensagem de teste para o tópico SNS de segurança

param(
    [string]$Environment = "dev"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Teste de Alertas de Segurança" -ForegroundColor Cyan
Write-Host "Ambiente: $Environment" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

try {
    # Obter ARN do tópico SNS
    Write-Host "Obtendo ARN do tópico SNS..." -ForegroundColor Yellow
    $stackName = "SecurityStack-$Environment"
    $topicArn = aws cloudformation describe-stacks `
        --stack-name $stackName `
        --query "Stacks[0].Outputs[?OutputKey=='SecurityAlertTopicArn'].OutputValue" `
        --output text 2>&1
    
    if (-not $topicArn -or $topicArn -eq "") {
        Write-Host "❌ Não foi possível encontrar o ARN do tópico SNS" -ForegroundColor Red
        Write-Host "   Verifique se o SecurityStack-$Environment está deployado" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "✅ Tópico encontrado: $topicArn`n" -ForegroundColor Green
    
    # Verificar assinaturas
    Write-Host "Verificando assinaturas..." -ForegroundColor Yellow
    $subscriptions = aws sns list-subscriptions-by-topic --topic-arn $topicArn 2>&1 | ConvertFrom-Json
    
    $confirmedSubs = $subscriptions.Subscriptions | Where-Object { $_.SubscriptionArn -ne "PendingConfirmation" }
    $pendingSubs = $subscriptions.Subscriptions | Where-Object { $_.SubscriptionArn -eq "PendingConfirmation" }
    
    if ($confirmedSubs.Count -eq 0) {
        Write-Host "⚠️  Nenhuma assinatura confirmada encontrada!" -ForegroundColor Yellow
        Write-Host "   Adicione um email e confirme a assinatura antes de testar" -ForegroundColor Yellow
        
        if ($pendingSubs.Count -gt 0) {
            Write-Host "`n   Assinaturas pendentes de confirmação:" -ForegroundColor Yellow
            foreach ($sub in $pendingSubs) {
                Write-Host "   - $($sub.Endpoint)" -ForegroundColor Gray
            }
            Write-Host "`n   Verifique sua caixa de entrada e confirme a assinatura" -ForegroundColor Yellow
        }
        
        exit 1
    }
    
    Write-Host "✅ Assinaturas confirmadas: $($confirmedSubs.Count)" -ForegroundColor Green
    foreach ($sub in $confirmedSubs) {
        Write-Host "   - $($sub.Protocol): $($sub.Endpoint)" -ForegroundColor Gray
    }
    
    if ($pendingSubs.Count -gt 0) {
        Write-Host "`n⚠️  Assinaturas pendentes: $($pendingSubs.Count)" -ForegroundColor Yellow
        foreach ($sub in $pendingSubs) {
            Write-Host "   - $($sub.Endpoint)" -ForegroundColor Gray
        }
    }
    
    # Enviar mensagem de teste
    Write-Host "`nEnviando mensagem de teste..." -ForegroundColor Yellow
    
    $subject = "🧪 Teste de Alerta de Segurança - AlquimistaAI"
    $message = @"
Este é um teste do sistema de alertas de segurança do AlquimistaAI.

Ambiente: $Environment
Data/Hora: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Tópico SNS: $topicArn

Se você recebeu este email, o sistema de alertas está funcionando corretamente.

---
Próximos passos:
1. Verifique que o email não foi para spam
2. Adicione o remetente à lista de contatos seguros
3. Configure filtros de email se necessário

Para mais informações, consulte: docs/SECURITY-GUARDRAILS-AWS.md
"@
    
    $result = aws sns publish `
        --topic-arn $topicArn `
        --subject $subject `
        --message $message 2>&1 | ConvertFrom-Json
    
    if ($result.MessageId) {
        Write-Host "`n✅ Mensagem enviada com sucesso!" -ForegroundColor Green
        Write-Host "   Message ID: $($result.MessageId)" -ForegroundColor Gray
        Write-Host "`n📧 Verifique sua caixa de entrada (incluindo spam)" -ForegroundColor Cyan
        Write-Host "   Os emails devem chegar em alguns segundos" -ForegroundColor Gray
    } else {
        Write-Host "`n❌ Erro ao enviar mensagem" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "`n❌ Erro ao executar teste: $_" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Teste Concluído" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
