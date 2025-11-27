# Script Master de Deploy Completo
# Alquimista.AI - Frontend + Backend

param(
    [switch]$SkipBackend,
    [switch]$SkipFrontend
)

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "                                                            " -ForegroundColor Cyan
Write-Host "          DEPLOY COMPLETO - ALQUIMISTA.AI                  " -ForegroundColor Cyan
Write-Host "                                                            " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$startTime = Get-Date

# ============================================
# PARTE 1: BACKEND
# ============================================
if (-not $SkipBackend) {
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host "  PARTE 1: DEPLOY DO BACKEND (AWS CDK)" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host ""
    
    & .\deploy-backend.ps1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "❌ Deploy do backend falhou!" -ForegroundColor Red
        Write-Host "Corrija os erros antes de continuar" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host ""
    Write-Host "✅ Backend deployado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Start-Sleep -Seconds 3
} else {
    Write-Host ">> Pulando deploy do backend..." -ForegroundColor Yellow
    Write-Host ""
}

# ============================================
# PARTE 2: FRONTEND
# ============================================
if (-not $SkipFrontend) {
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host "  PARTE 2: DEPLOY DO FRONTEND (VERCEL)" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host ""
    
    # Verificar se backend foi deployado
    if (-not (Test-Path "backend-outputs.json")) {
        Write-Host "AVISO: Outputs do backend nao encontrados!" -ForegroundColor Yellow
        Write-Host "Certifique-se de que o backend foi deployado primeiro" -ForegroundColor Yellow
        Write-Host ""
        $continue = Read-Host "Continuar mesmo assim? (y/n)"
        if ($continue -ne "y") {
            Write-Host "Deploy cancelado" -ForegroundColor Yellow
            exit 0
        }
    }
    
    Set-Location frontend
    & .\deploy-frontend.ps1
    Set-Location ..
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "❌ Deploy do frontend falhou!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "✅ Frontend deployado com sucesso!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ">> Pulando deploy do frontend..." -ForegroundColor Yellow
    Write-Host ""
}

# ============================================
# RESUMO FINAL
# ============================================
$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "                                                            " -ForegroundColor Green
Write-Host "          DEPLOY COMPLETO FINALIZADO!                      " -ForegroundColor Green
Write-Host "                                                            " -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Tempo total: $($duration.Minutes) minutos e $($duration.Seconds) segundos" -ForegroundColor Cyan
Write-Host ""
Write-Host "Recursos Deployados:" -ForegroundColor Yellow
if (-not $SkipBackend) {
    Write-Host "  [OK] Backend (AWS CDK)" -ForegroundColor Green
    Write-Host "     - API Gateway" -ForegroundColor Gray
    Write-Host "     - Lambda Functions (15+)" -ForegroundColor Gray
    Write-Host "     - Aurora Serverless v2" -ForegroundColor Gray
    Write-Host "     - CloudFront + S3" -ForegroundColor Gray
    Write-Host "     - EventBridge + SQS" -ForegroundColor Gray
    Write-Host "     - CloudWatch Dashboards" -ForegroundColor Gray
}
if (-not $SkipFrontend) {
    Write-Host "  [OK] Frontend (Vercel)" -ForegroundColor Green
    Write-Host "     - Next.js Application" -ForegroundColor Gray
    Write-Host "     - Edge Functions" -ForegroundColor Gray
    Write-Host "     - CDN Global" -ForegroundColor Gray
}
Write-Host ""
Write-Host "Proximos Passos:" -ForegroundColor Yellow
Write-Host "  1. Teste a aplicacao no navegador" -ForegroundColor White
Write-Host "  2. Configure dominio customizado (opcional)" -ForegroundColor White
Write-Host "  3. Configure monitoramento e alertas" -ForegroundColor White
Write-Host "  4. Revise logs no CloudWatch" -ForegroundColor White
Write-Host ""
Write-Host "Documentacao: DEPLOY-COMPLETO.md" -ForegroundColor Cyan
Write-Host ""
