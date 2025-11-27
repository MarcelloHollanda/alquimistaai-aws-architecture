# Script para Executar Testes de Performance
# Painel Operacional AlquimistaAI

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('smoke', 'load', 'stress', 'spike', 'soak', 'tenant-apis', 'internal-apis', 'full')]
    [string]$TestType = 'load',
    
    [Parameter(Mandatory=$false)]
    [string]$Environment = 'dev',
    
    [Parameter(Mandatory=$false)]
    [int]$VUs = 10,
    
    [Parameter(Mandatory=$false)]
    [string]$Duration = '5m',
    
    [Parameter(Mandatory=$false)]
    [switch]$GenerateReport,
    
    [Parameter(Mandatory=$false)]
    [switch]$Analyze
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TESTES DE PERFORMANCE - PAINEL OPERACIONAL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se k6 está instalado
Write-Host "Verificando k6..." -ForegroundColor Yellow
$k6Version = k6 version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ k6 não está instalado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Instale k6 seguindo as instruções em:" -ForegroundColor Yellow
    Write-Host "https://k6.io/docs/getting-started/installation/" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Windows (Chocolatey):" -ForegroundColor Yellow
    Write-Host "  choco install k6" -ForegroundColor White
    Write-Host ""
    Write-Host "Windows (Winget):" -ForegroundColor Yellow
    Write-Host "  winget install k6" -ForegroundColor White
    exit 1
}
Write-Host "✓ k6 instalado: $k6Version" -ForegroundColor Green
Write-Host ""

# Configurar variáveis de ambiente
Write-Host "Configurando ambiente..." -ForegroundColor Yellow
$env:TEST_ENV = $Environment
$env:TEST_TYPE = $TestType
$env:TEST_VUS = $VUs
$env:TEST_DURATION = $Duration

# Definir URL base baseado no ambiente
switch ($Environment) {
    'dev' { $env:API_BASE_URL = 'https://api-dev.alquimistaai.com' }
    'staging' { $env:API_BASE_URL = 'https://api-staging.alquimistaai.com' }
    'prod' { $env:API_BASE_URL = 'https://api.alquimistaai.com' }
    default { $env:API_BASE_URL = 'https://api-dev.alquimistaai.com' }
}

Write-Host "  Ambiente: $Environment" -ForegroundColor White
Write-Host "  Tipo de Teste: $TestType" -ForegroundColor White
Write-Host "  VUs: $VUs" -ForegroundColor White
Write-Host "  Duração: $Duration" -ForegroundColor White
Write-Host "  API Base URL: $($env:API_BASE_URL)" -ForegroundColor White
Write-Host ""

# Selecionar script de teste
$scriptPath = ""
switch ($TestType) {
    'tenant-apis' { $scriptPath = 'tests/load/scripts/tenant-apis.js' }
    'internal-apis' { $scriptPath = 'tests/load/scripts/internal-apis.js' }
    'full' { $scriptPath = 'tests/load/scripts/full-load-test.js' }
    default { $scriptPath = 'tests/load/scripts/full-load-test.js' }
}

if (-not (Test-Path $scriptPath)) {
    Write-Host "❌ Script de teste não encontrado: $scriptPath" -ForegroundColor Red
    exit 1
}

Write-Host "Script de teste: $scriptPath" -ForegroundColor White
Write-Host ""

# Criar diretório de relatórios
$reportDir = "tests/load/reports"
if (-not (Test-Path $reportDir)) {
    New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
}

# Construir comando k6
$k6Command = "k6 run"

# Adicionar opções de VUs e duração se não for teste completo
if ($TestType -ne 'full') {
    $k6Command += " --vus $VUs --duration $Duration"
}

# Adicionar output JSON
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$jsonOutput = "$reportDir/results-$TestType-$timestamp.json"
$k6Command += " --out json=$jsonOutput"

# Adicionar output HTML se solicitado
if ($GenerateReport) {
    $htmlOutput = "$reportDir/report-$TestType-$timestamp.html"
    $k6Command += " --out html=$htmlOutput"
}

# Adicionar script
$k6Command += " $scriptPath"

# Executar teste
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "EXECUTANDO TESTE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Comando: $k6Command" -ForegroundColor Gray
Write-Host ""

$startTime = Get-Date
Invoke-Expression $k6Command
$exitCode = $LASTEXITCODE
$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TESTE CONCLUÍDO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Duração total: $($duration.ToString('mm\:ss'))" -ForegroundColor White
Write-Host "Resultados salvos em: $jsonOutput" -ForegroundColor White

if ($GenerateReport) {
    Write-Host "Relatório HTML: $htmlOutput" -ForegroundColor White
}

Write-Host ""

# Analisar resultados se solicitado
if ($Analyze -and (Test-Path $jsonOutput)) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "ANALISANDO RESULTADOS" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    node tests/load/utils/analyze-results.js $jsonOutput
    $analyzeExitCode = $LASTEXITCODE
    
    if ($analyzeExitCode -ne 0) {
        Write-Host ""
        Write-Host "⚠️  Análise identificou problemas de performance" -ForegroundColor Yellow
    }
}

# Resumo final
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUMO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($exitCode -eq 0) {
    Write-Host "✓ Teste executado com sucesso" -ForegroundColor Green
} else {
    Write-Host "✗ Teste falhou (código: $exitCode)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "  1. Revisar relatórios em: $reportDir" -ForegroundColor White
Write-Host "  2. Analisar métricas no CloudWatch" -ForegroundColor White
Write-Host "  3. Implementar otimizações recomendadas" -ForegroundColor White
Write-Host "  4. Executar testes novamente para validar" -ForegroundColor White
Write-Host ""

exit $exitCode
