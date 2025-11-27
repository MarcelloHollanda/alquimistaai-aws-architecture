# Script de Teste do Workflow CI/CD
param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("basic", "full", "security")]
    [string]$TestType = "basic",
    
    [Parameter(Mandatory=$false)]
    [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"

Write-Host "Iniciando Teste de Workflow CI/CD" -ForegroundColor Cyan
Write-Host "Tipo de teste: $TestType" -ForegroundColor Yellow
Write-Host "Branch: $Branch" -ForegroundColor Yellow
Write-Host ""

# Verificar pre-requisitos
Write-Host "Verificando pre-requisitos..." -ForegroundColor Cyan

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Git nao encontrado" -ForegroundColor Red
    exit 1
}
Write-Host "Git instalado" -ForegroundColor Green

if (Get-Command gh -ErrorAction SilentlyContinue) {
    Write-Host "GitHub CLI instalado" -ForegroundColor Green
    $HasGHCLI = $true
} else {
    Write-Host "GitHub CLI nao encontrado (opcional)" -ForegroundColor Yellow
    $HasGHCLI = $false
}

if (-not (Test-Path .git)) {
    Write-Host "Nao esta em um repositorio Git" -ForegroundColor Red
    exit 1
}
Write-Host "Repositorio Git detectado" -ForegroundColor Green
Write-Host ""

# Teste basico
if ($TestType -eq "basic") {
    Write-Host "Executando Teste Basico" -ForegroundColor Cyan
    Write-Host ""
    
    $testFile = "docs/ci-cd/TEST-LOG.md"
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    Write-Host "Criando arquivo de teste..." -ForegroundColor Yellow
    
    $content = @"
# Log de Teste CI/CD

Teste executado em: $timestamp
Tipo: Basico
Branch: $Branch

Status: Arquivo criado
"@
    
    New-Item -Path $testFile -ItemType File -Force | Out-Null
    Set-Content -Path $testFile -Value $content
    
    Write-Host "Arquivo criado: $testFile" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Adicionando arquivo ao Git..." -ForegroundColor Yellow
    git add $testFile
    
    $commitMessage = "test(ci-cd): validar workflow basico - $timestamp"
    Write-Host "Criando commit..." -ForegroundColor Yellow
    git commit -m $commitMessage
    
    Write-Host "Commit criado" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Fazendo push para $Branch..." -ForegroundColor Yellow
    Write-Host ""
    
    $pushConfirm = Read-Host "Deseja fazer push agora? (s/n)"
    if ($pushConfirm -eq "s" -or $pushConfirm -eq "S") {
        git push origin $Branch
        Write-Host "Push realizado com sucesso!" -ForegroundColor Green
        Write-Host ""
        
        if ($HasGHCLI) {
            Write-Host "Abrindo GitHub Actions..." -ForegroundColor Cyan
            Start-Sleep -Seconds 2
            gh run list --limit 1
            Write-Host ""
            
            $watchConfirm = Read-Host "Deseja acompanhar o workflow? (s/n)"
            if ($watchConfirm -eq "s" -or $watchConfirm -eq "S") {
                gh run watch
            }
        } else {
            Write-Host "Acesse GitHub Actions para acompanhar:" -ForegroundColor Cyan
            Write-Host "https://github.com/MarcelloHollanda/alquimistaai-aws-architecture/actions" -ForegroundColor Blue
        }
    } else {
        Write-Host "Push cancelado. Execute manualmente:" -ForegroundColor Yellow
        Write-Host "git push origin $Branch" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "Teste concluido!" -ForegroundColor Green
Write-Host ""
Write-Host "Para mais informacoes, consulte:" -ForegroundColor Cyan
Write-Host "docs/ci-cd/TESTE-WORKFLOW-VALIDACAO.md" -ForegroundColor Blue
