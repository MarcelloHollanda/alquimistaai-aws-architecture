# Script Simplificado de Limpeza de Histórico
# Remove a chave Stripe fake do histórico do Git

Write-Host "=== Limpeza de Histórico - Chave Stripe ===" -ForegroundColor Cyan
Write-Host ""

# Verificar se estamos na raiz
if (-not (Test-Path ".git")) {
    Write-Host "ERRO: Execute da raiz do repositório" -ForegroundColor Red
    exit 1
}

Write-Host "Este script vai:" -ForegroundColor Yellow
Write-Host "1. Substituir 'sk_live_abcdefghijklmnopqrstuvwxyz' por 'REMOVED' no histórico" -ForegroundColor White
Write-Host "2. Reescrever o histórico do Git" -ForegroundColor White
Write-Host "3. Preparar para push forçado" -ForegroundColor White
Write-Host ""

$response = Read-Host "Continuar? (s/n)"
if ($response -ne "s") {
    Write-Host "Cancelado" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Criando arquivo de substituição..." -ForegroundColor Yellow

# Criar arquivo de substituição
$replaceContent = "sk_live_abcdefghijklmnopqrstuvwxyz==>STRIPE_KEY_REMOVED"
$replaceContent | Out-File -FilePath "stripe-replace.txt" -Encoding UTF8

Write-Host "Executando git filter-branch..." -ForegroundColor Yellow
Write-Host ""

try {
    # Usar filter-branch para substituir no histórico
    git filter-branch --force --tree-filter `
        "if [ -f 'tests/unit/inventory/sanitizer.test.ts' ]; then sed -i 's/sk_live_abcdefghijklmnopqrstuvwxyz/STRIPE_KEY_REMOVED/g' 'tests/unit/inventory/sanitizer.test.ts'; fi" `
        --prune-empty --tag-name-filter cat -- --all
    
    Write-Host ""
    Write-Host "Limpando referências antigas..." -ForegroundColor Yellow
    
    # Limpar refs antigas
    git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
    git reflog expire --expire=now --all
    git gc --prune=now --aggressive
    
    Write-Host ""
    Write-Host "✓ Histórico limpo com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximo passo:" -ForegroundColor Yellow
    Write-Host "  git push origin --force main" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "ERRO: $_" -ForegroundColor Red
    exit 1
} finally {
    Remove-Item "stripe-replace.txt" -ErrorAction SilentlyContinue
}
