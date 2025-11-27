# Script para fazer o push inicial para o GitHub
# Execute APÓS criar o repositório no GitHub

Write-Host "🚀 Fazendo push inicial para GitHub..." -ForegroundColor Green

# Verificar se o repositório remoto está configurado
$remoteUrl = git remote get-url origin 2>$null
if (-not $remoteUrl) {
    Write-Host "❌ Repositório remoto não configurado. Execute setup-github.ps1 primeiro." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Repositório remoto configurado: $remoteUrl" -ForegroundColor Green

# Verificar se há commits
$commitCount = git rev-list --count HEAD 2>$null
if (-not $commitCount -or $commitCount -eq "0") {
    Write-Host "❌ Nenhum commit encontrado. Execute setup-github.ps1 primeiro." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Encontrados $commitCount commits" -ForegroundColor Green

# Fazer push
Write-Host "`n📤 Fazendo push para o repositório..." -ForegroundColor Yellow
try {
    git push -u origin main
    Write-Host "✅ Push realizado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro no push. Verifique se:" -ForegroundColor Red
    Write-Host "   1. O repositório foi criado no GitHub" -ForegroundColor Gray
    Write-Host "   2. Você tem permissões de escrita" -ForegroundColor Gray
    Write-Host "   3. Sua autenticação está configurada" -ForegroundColor Gray
    exit 1
}

Write-Host "`n🎉 Repositório configurado com sucesso!" -ForegroundColor Magenta
Write-Host "`n📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Configure os GitHub Secrets:" -ForegroundColor White
Write-Host "   - Vá para: https://github.com/MarcelloHollanda/AlquimistaAI/settings/secrets/actions" -ForegroundColor Gray
Write-Host "   - Adicione: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, SLACK_WEBHOOK_URL" -ForegroundColor Gray

Write-Host "`n2. Teste os workflows:" -ForegroundColor White
Write-Host "   - Push para 'develop' → Deploy automático para dev" -ForegroundColor Gray
Write-Host "   - Push para 'main' → Deploy automático para staging" -ForegroundColor Gray
Write-Host "   - Workflow manual → Deploy para produção" -ForegroundColor Gray

Write-Host "`n3. Configure Slack (opcional):" -ForegroundColor White
Write-Host "   - Crie webhook no Slack" -ForegroundColor Gray
Write-Host "   - Adicione URL aos secrets do GitHub" -ForegroundColor Gray

Write-Host "`n🔗 Links úteis:" -ForegroundColor Cyan
Write-Host "   - Repositório: https://github.com/MarcelloHollanda/AlquimistaAI" -ForegroundColor Gray
Write-Host "   - Actions: https://github.com/MarcelloHollanda/AlquimistaAI/actions" -ForegroundColor Gray
Write-Host "   - Settings: https://github.com/MarcelloHollanda/AlquimistaAI/settings" -ForegroundColor Gray

Write-Host "`n🚀 Pronto para transformar leads em oportunidades!" -ForegroundColor Green