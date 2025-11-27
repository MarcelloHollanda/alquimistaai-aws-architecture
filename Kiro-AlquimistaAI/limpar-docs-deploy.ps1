# Script para Limpar Arquivos de Deploy Duplicados
# Consolida documentação em docs/deploy/

Write-Host "[LIMPEZA] Organizando documentacao de deploy..." -ForegroundColor Cyan

# Arquivos para MANTER (úteis)
$manter = @(
    "deploy-limpo.ps1",
    "deploy-backend.ps1", 
    "VALIDAR-DEPLOY.ps1",
    "limpar-stack.ps1",
    "README.md",
    "SETUP.md"
)

# Arquivos para ARQUIVAR (mover para docs/deploy/archive/)
$arquivar = @(
    "DEPLOY-COMPLETO.md",
    "FIX-ROLLBACK.md",
    "STATUS-DEPLOY-ATUALIZADO.md",
    "STATUS-DEPLOY-ATUAL-AGORA.md",
    "EXECUTAR-DEPLOY-AGORA.md",
    "DEPLOY-STATUS-ATUAL.md",
    "README-DEPLOY.md",
    "DEPLOY-INDEX.md",
    "COMECE-AQUI.md",
    "DEPLOY-SUMMARY.md",
    "STATUS-DEPLOY.md",
    "DEPLOY-RAPIDO.md",
    "deploy-tudo.ps1",
    "DEPLOY-SOLUTION.md",
    "DEPLOY-FINAL-SUMMARY.md",
    "REMOVE-DEMO-MODE.md",
    "DEPLOY-EXECUTION-LOG.md",
    "DEPLOY-NOW.md",
    "DEPLOY-STATUS-SUMMARY.md",
    "DEPLOY-PROD-GUIDE.md",
    "AWS-SETUP-GUIDE.md",
    "PRODUCTION-SETUP-GUIDE.md",
    "DEPLOY-OUTPUTS.md"
)

# Criar diretório de arquivo
$archiveDir = "docs/deploy/archive"
if (-not (Test-Path $archiveDir)) {
    New-Item -ItemType Directory -Path $archiveDir -Force | Out-Null
    Write-Host "[OK] Diretorio de arquivo criado: $archiveDir" -ForegroundColor Green
}

# Mover arquivos para arquivo
$movedCount = 0
foreach ($file in $arquivar) {
    if (Test-Path $file) {
        Move-Item -Path $file -Destination $archiveDir -Force
        Write-Host "[MOVIDO] $file -> $archiveDir" -ForegroundColor Yellow
        $movedCount++
    }
}

Write-Host "`n[RESUMO] Limpeza concluida!" -ForegroundColor Green
Write-Host "  - Arquivos movidos: $movedCount" -ForegroundColor White
Write-Host "  - Arquivos mantidos: $($manter.Count)" -ForegroundColor White
Write-Host "  - Localizacao do arquivo: $archiveDir" -ForegroundColor White

Write-Host "`n[PROXIMOS PASSOS]" -ForegroundColor Cyan
Write-Host "  1. Consulte docs/deploy/README.md para documentacao organizada" -ForegroundColor White
Write-Host "  2. Use deploy-limpo.ps1 para deploy limpo" -ForegroundColor White
Write-Host "  3. Use VALIDAR-DEPLOY.ps1 para validar" -ForegroundColor White

Write-Host "`n[CONCLUIDO]`n" -ForegroundColor Green
