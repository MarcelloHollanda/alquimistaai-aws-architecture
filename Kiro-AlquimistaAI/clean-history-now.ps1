# Limpeza Rápida do Histórico Git
Write-Host "=== Limpeza de Histórico Git ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Isso reescreverá o histórico do Git!" -ForegroundColor Red
Write-Host ""

$response = Read-Host "Continuar? Digite SIM"
if ($response -ne "SIM") {
    Write-Host "Cancelado" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Executando limpeza..." -ForegroundColor Yellow

$filterCommand = 'if [ -f tests/unit/inventory/sanitizer.test.ts ]; then sed -i s/sk_live_abcdefghijklmnopqrstuvwxyz/STRIPE_KEY_REMOVED/g tests/unit/inventory/sanitizer.test.ts; fi'

git filter-branch --force --tree-filter $filterCommand --prune-empty --tag-name-filter cat -- --all

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Limpando referências..." -ForegroundColor Yellow
    
    git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
    git reflog expire --expire=now --all
    git gc --prune=now --aggressive
    
    Write-Host ""
    Write-Host "Concluído!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Execute: git push origin --force main" -ForegroundColor Yellow
} else {
    Write-Host "ERRO" -ForegroundColor Red
}
