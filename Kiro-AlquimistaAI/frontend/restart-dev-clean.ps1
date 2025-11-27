# Script para reiniciar o servidor dev com cache limpo
# Uso: .\restart-dev-clean.ps1

Write-Host "🔄 Reiniciando servidor dev com cache limpo..." -ForegroundColor Cyan
Write-Host ""

# Navegar para o diretório frontend
$frontendPath = "C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI\frontend"
Set-Location $frontendPath

# Verificar se o diretório .next existe e remover
if (Test-Path ".next") {
    Write-Host "🗑️  Removendo cache do Next.js (.next)..." -ForegroundColor Yellow
    Remove-Item ".next" -Recurse -Force
    Write-Host "✅ Cache removido com sucesso!" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Nenhum cache encontrado (.next não existe)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🚀 Iniciando servidor dev..." -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Após o servidor iniciar, teste as seguintes rotas:" -ForegroundColor Yellow
Write-Host "   1. http://localhost:3000/login" -ForegroundColor White
Write-Host "   2. http://localhost:3000/auth/login" -ForegroundColor White
Write-Host "   3. http://localhost:3000/" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Para parar o servidor, pressione Ctrl+C" -ForegroundColor Yellow
Write-Host ""

# Iniciar o servidor dev
npm run dev
