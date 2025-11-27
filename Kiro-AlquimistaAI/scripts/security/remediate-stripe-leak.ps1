# Script de Remediação de Vazamento de Chave Stripe
# 
# Este script automatiza o processo de limpeza de chaves Stripe
# do histórico do Git.
#
# ATENÇÃO: Este script reescreve o histórico do Git!
# Faça backup antes de executar.
#
# Uso:
#   .\remediate-stripe-leak.ps1 -Scan
#   .\remediate-stripe-leak.ps1 -Clean -Confirm
#   .\remediate-stripe-leak.ps1 -Verify

param(
    [switch]$Scan,
    [switch]$Clean,
    [switch]$Verify,
    [switch]$Confirm,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

Write-Host "=== Remediação de Vazamento de Chave Stripe ===" -ForegroundColor Cyan
Write-Host ""

# Verificar se estamos na raiz do repositório
if (-not (Test-Path ".git")) {
    Write-Host "ERRO: Execute este script da raiz do repositório Git" -ForegroundColor Red
    exit 1
}

# Padrões de chaves Stripe
$stripePatterns = @(
    "sk_live_[0-9a-zA-Z]{24,}",
    "sk_test_[0-9a-zA-Z]{24,}",
    "pk_live_[0-9a-zA-Z]{24,}",
    "pk_test_[0-9a-zA-Z]{24,}"
)

function Scan-Repository {
    Write-Host "Escaneando repositório por chaves Stripe..." -ForegroundColor Yellow
    Write-Host ""
    
    $found = $false
    
    foreach ($pattern in $stripePatterns) {
        Write-Host "Buscando padrão: $pattern" -ForegroundColor Gray
        
        # Buscar em todos os commits
        $results = git grep -E $pattern $(git rev-list --all) 2>$null
        
        if ($results) {
            $found = $true
            Write-Host "  ⚠️ ENCONTRADO!" -ForegroundColor Red
            Write-Host ""
            
            # Mostrar primeiras 5 ocorrências
            $results | Select-Object -First 5 | ForEach-Object {
                Write-Host "    $_" -ForegroundColor Yellow
            }
            
            $total = ($results | Measure-Object).Count
            if ($total -gt 5) {
                Write-Host "    ... e mais $($total - 5) ocorrências" -ForegroundColor Gray
            }
            Write-Host ""
        } else {
            Write-Host "  ✓ Nenhuma ocorrência encontrada" -ForegroundColor Green
        }
    }
    
    if ($found) {
        Write-Host ""
        Write-Host "⚠️ ATENÇÃO: Chaves Stripe encontradas no histórico!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Próximos passos:" -ForegroundColor Yellow
        Write-Host "1. Rotacione as chaves no Dashboard da Stripe" -ForegroundColor White
        Write-Host "2. Execute: .\remediate-stripe-leak.ps1 -Clean -Confirm" -ForegroundColor White
        Write-Host ""
        return $false
    } else {
        Write-Host "✓ Nenhuma chave Stripe encontrada no histórico" -ForegroundColor Green
        return $true
    }
}

function Clean-Repository {
    if (-not $Confirm -and -not $Force) {
        Write-Host "ERRO: Operação de limpeza requer confirmação explícita" -ForegroundColor Red
        Write-Host "Use: -Confirm ou -Force" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "⚠️ ATENÇÃO: Esta operação reescreverá o histórico do Git!" -ForegroundColor Red
    Write-Host ""
    
    if (-not $Force) {
        $response = Read-Host "Você fez backup do repositório? (sim/não)"
        if ($response -ne "sim") {
            Write-Host "Operação cancelada. Faça backup primeiro:" -ForegroundColor Yellow
            Write-Host "  git clone . ../backup-alquimistaai" -ForegroundColor White
            exit 1
        }
    }
    
    Write-Host ""
    Write-Host "Iniciando limpeza do histórico..." -ForegroundColor Yellow
    Write-Host ""
    
    # Criar arquivo de substituição
    $replaceFile = "stripe-secrets-replace.txt"
    $patterns = @(
        "regex:sk_live_[0-9a-zA-Z]{24,}==>STRIPE_LIVE_KEY_REMOVED",
        "regex:sk_test_[0-9a-zA-Z]{24,}==>STRIPE_TEST_KEY_REMOVED",
        "regex:pk_live_[0-9a-zA-Z]{24,}==>STRIPE_PK_LIVE_REMOVED",
        "regex:pk_test_[0-9a-zA-Z]{24,}==>STRIPE_PK_TEST_REMOVED"
    )
    
    $patterns | Out-File -FilePath $replaceFile -Encoding UTF8
    
    Write-Host "Arquivo de substituição criado: $replaceFile" -ForegroundColor Gray
    Write-Host ""
    
    # Verificar se git-filter-repo está instalado
    $hasFilterRepo = $null -ne (Get-Command git-filter-repo -ErrorAction SilentlyContinue)
    
    if ($hasFilterRepo) {
        Write-Host "Usando git-filter-repo (recomendado)..." -ForegroundColor Green
        Write-Host ""
        
        try {
            # Executar git-filter-repo
            git filter-repo --replace-text $replaceFile --force
            
            Write-Host ""
            Write-Host "✓ Histórico limpo com sucesso!" -ForegroundColor Green
            Write-Host ""
            
            # Re-adicionar remote
            Write-Host "Re-adicionando remote origin..." -ForegroundColor Yellow
            git remote add origin https://github.com/MarcelloHollanda/alquimistaai-aws-architecture.git
            
            Write-Host ""
            Write-Host "Próximo passo:" -ForegroundColor Yellow
            Write-Host "  git push origin --force --all" -ForegroundColor White
            Write-Host "  git push origin --force --tags" -ForegroundColor White
            
        } catch {
            Write-Host "ERRO ao executar git-filter-repo: $_" -ForegroundColor Red
            exit 1
        }
        
    } else {
        Write-Host "git-filter-repo não encontrado. Usando git filter-branch..." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "RECOMENDAÇÃO: Instale git-filter-repo para melhor performance:" -ForegroundColor Yellow
        Write-Host "  pip install git-filter-repo" -ForegroundColor White
        Write-Host ""
        
        # Usar filter-branch como fallback
        Write-Host "Executando git filter-branch..." -ForegroundColor Gray
        
        # Criar script de filtro
        $filterScript = @"
#!/bin/bash
sed -i 's/sk_live_[0-9a-zA-Z]\{24,\}/STRIPE_LIVE_KEY_REMOVED/g' `$1
sed -i 's/sk_test_[0-9a-zA-Z]\{24,\}/STRIPE_TEST_KEY_REMOVED/g' `$1
sed -i 's/pk_live_[0-9a-zA-Z]\{24,\}/STRIPE_PK_LIVE_REMOVED/g' `$1
sed -i 's/pk_test_[0-9a-zA-Z]\{24,\}/STRIPE_PK_TEST_REMOVED/g' `$1
"@
        
        $filterScript | Out-File -FilePath "filter-stripe.sh" -Encoding UTF8
        
        try {
            git filter-branch --force --tree-filter "bash filter-stripe.sh" --prune-empty --tag-name-filter cat -- --all
            
            # Limpar referências
            git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
            git reflog expire --expire=now --all
            git gc --prune=now --aggressive
            
            Write-Host ""
            Write-Host "✓ Histórico limpo com sucesso!" -ForegroundColor Green
            
        } catch {
            Write-Host "ERRO ao executar git filter-branch: $_" -ForegroundColor Red
            exit 1
        } finally {
            Remove-Item "filter-stripe.sh" -ErrorAction SilentlyContinue
        }
    }
    
    # Limpar arquivo temporário
    Remove-Item $replaceFile -ErrorAction SilentlyContinue
    
    Write-Host ""
    Write-Host "=== Limpeza Concluída ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANTE: Execute a verificação:" -ForegroundColor Yellow
    Write-Host "  .\remediate-stripe-leak.ps1 -Verify" -ForegroundColor White
    Write-Host ""
}

function Verify-Cleanup {
    Write-Host "Verificando limpeza..." -ForegroundColor Yellow
    Write-Host ""
    
    $clean = Scan-Repository
    
    if ($clean) {
        Write-Host ""
        Write-Host "✓ Verificação passou! Repositório está limpo." -ForegroundColor Green
        Write-Host ""
        Write-Host "Você pode fazer push agora:" -ForegroundColor Yellow
        Write-Host "  git push origin --force --all" -ForegroundColor White
        Write-Host "  git push origin --force --tags" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "⚠️ Ainda há chaves no histórico. Execute a limpeza novamente." -ForegroundColor Red
        Write-Host ""
    }
}

# Executar ação solicitada
if ($Scan) {
    Scan-Repository
} elseif ($Clean) {
    Clean-Repository
} elseif ($Verify) {
    Verify-Cleanup
} else {
    Write-Host "Uso:" -ForegroundColor Yellow
    Write-Host "  .\remediate-stripe-leak.ps1 -Scan          # Escanear por chaves" -ForegroundColor White
    Write-Host "  .\remediate-stripe-leak.ps1 -Clean -Confirm # Limpar histórico" -ForegroundColor White
    Write-Host "  .\remediate-stripe-leak.ps1 -Verify        # Verificar limpeza" -ForegroundColor White
    Write-Host ""
    Write-Host "Documentação completa:" -ForegroundColor Gray
    Write-Host "  docs/security/STRIPE-KEY-LEAK-REMEDIATION.md" -ForegroundColor White
    Write-Host ""
}
