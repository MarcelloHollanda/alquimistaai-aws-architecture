# Script de Reescrita de Histórico - Estratégia Orphan Branch
# 
# Este script cria uma nova história limpa sem o histórico antigo
# que contém a chave Stripe fake.
#
# ATENÇÃO: Isso sobrescreverá o histórico remoto!

$ErrorActionPreference = "Stop"

Write-Host "=== Reescrita de Histórico Git - Estratégia Orphan ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Este script vai:" -ForegroundColor Yellow
Write-Host "1. Criar um novo branch sem histórico (orphan)" -ForegroundColor White
Write-Host "2. Adicionar todos os arquivos atuais em um commit inicial limpo" -ForegroundColor White
Write-Host "3. Substituir a branch main" -ForegroundColor White
Write-Host "4. Fazer push forçado para o GitHub" -ForegroundColor White
Write-Host ""
Write-Host "⚠️ ATENÇÃO: O histórico antigo será perdido!" -ForegroundColor Red
Write-Host ""

# Verificar se estamos na raiz do repositório
if (-not (Test-Path ".git")) {
    Write-Host "ERRO: Execute este script da raiz do repositório Git" -ForegroundColor Red
    exit 1
}

# Verificar se há mudanças não commitadas
$status = git status --porcelain
if ($status) {
    Write-Host "⚠️ Há mudanças não commitadas:" -ForegroundColor Yellow
    Write-Host $status
    Write-Host ""
    $response = Read-Host "Deseja continuar mesmo assim? (s/n)"
    if ($response -ne "s") {
        Write-Host "Cancelado. Commit suas mudanças primeiro." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""
$response = Read-Host "Digite 'REESCREVER' para confirmar"
if ($response -ne "REESCREVER") {
    Write-Host "Cancelado" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Iniciando reescrita..." -ForegroundColor Yellow
Write-Host ""

try {
    # 1. Garantir que estamos na main
    Write-Host "[1/6] Mudando para branch main..." -ForegroundColor Gray
    git checkout main
    if ($LASTEXITCODE -ne 0) { throw "Falha ao mudar para main" }
    
    # 2. Criar branch orphan (sem histórico)
    Write-Host "[2/6] Criando branch orphan clean-main..." -ForegroundColor Gray
    git checkout --orphan clean-main
    if ($LASTEXITCODE -ne 0) { throw "Falha ao criar branch orphan" }
    
    # 3. Adicionar todos os arquivos
    Write-Host "[3/6] Adicionando todos os arquivos..." -ForegroundColor Gray
    git add .
    if ($LASTEXITCODE -ne 0) { throw "Falha ao adicionar arquivos" }
    
    # 4. Criar commit inicial limpo
    Write-Host "[4/6] Criando commit inicial limpo..." -ForegroundColor Gray
    git commit -m "chore: initial clean commit (history rewritten to remove secrets)

This commit represents a clean slate with all current files.
Previous history was rewritten to remove accidentally committed test patterns
that triggered GitHub secret scanning.

All secrets are now properly managed via AWS Secrets Manager.
"
    if ($LASTEXITCODE -ne 0) { throw "Falha ao criar commit" }
    
    # 5. Renomear branch para main
    Write-Host "[5/6] Renomeando branch para main..." -ForegroundColor Gray
    git branch -M main
    if ($LASTEXITCODE -ne 0) { throw "Falha ao renomear branch" }
    
    # 6. Push forçado
    Write-Host "[6/6] Fazendo push forçado para origin..." -ForegroundColor Gray
    Write-Host ""
    Write-Host "⚠️ Última chance para cancelar! (Ctrl+C)" -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    
    git push -u origin main --force
    if ($LASTEXITCODE -ne 0) { throw "Falha no push" }
    
    Write-Host ""
    Write-Host "✓ Histórico reescrito com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Verificação:" -ForegroundColor Cyan
    Write-Host "  git log --oneline" -ForegroundColor White
    Write-Host ""
    Write-Host "Você deve ver apenas 1 commit inicial." -ForegroundColor Gray
    Write-Host ""
    
    # Mostrar log
    git log --oneline
    
    Write-Host ""
    Write-Host "✓ Concluído! O GitHub agora só vê o histórico limpo." -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "ERRO: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Revertendo para estado anterior..." -ForegroundColor Yellow
    git checkout main
    git branch -D clean-main 2>$null
    Write-Host ""
    Write-Host "Estado revertido. Nenhuma mudança foi feita." -ForegroundColor Yellow
    exit 1
}

Write-Host "IMPORTANTE: Se outros desenvolvedores têm clones deste repo," -ForegroundColor Yellow
Write-Host "eles precisarão re-clonar:" -ForegroundColor Yellow
Write-Host "  git clone https://github.com/MarcelloHollanda/alquimistaai-aws-architecture.git" -ForegroundColor White
Write-Host ""
