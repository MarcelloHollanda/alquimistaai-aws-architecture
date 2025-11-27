# Script para executar OWASP ZAP Security Scan
# Requisitos: Docker instalado

param(
    [string]$Target = "https://api-dev.alquimista.ai",
    [string]$ReportPath = "./tests/security/reports",
    [switch]$FullScan = $false
)

Write-Host "=== OWASP ZAP Security Scan ===" -ForegroundColor Cyan
Write-Host "Target: $Target" -ForegroundColor Yellow
Write-Host "Report Path: $ReportPath" -ForegroundColor Yellow

# Criar diretório de relatórios se não existir
if (!(Test-Path $ReportPath)) {
    New-Item -ItemType Directory -Path $ReportPath -Force | Out-Null
    Write-Host "Created report directory: $ReportPath" -ForegroundColor Green
}

# Verificar se Docker está instalado
try {
    docker --version | Out-Null
    Write-Host "Docker found" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Docker not found. Please install Docker first." -ForegroundColor Red
    exit 1
}

# Configurar tipo de scan
$scanType = if ($FullScan) { "full" } else { "baseline" }
Write-Host "Scan type: $scanType" -ForegroundColor Yellow

# Executar OWASP ZAP scan
Write-Host "`nStarting OWASP ZAP scan..." -ForegroundColor Cyan

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$reportFile = "$ReportPath/zap-report-$timestamp.html"
$jsonReportFile = "$ReportPath/zap-report-$timestamp.json"

try {
    if ($FullScan) {
        # Full scan (mais demorado, mais completo)
        Write-Host "Running FULL scan (this may take a while)..." -ForegroundColor Yellow
        
        docker run --rm `
            -v "${PWD}/${ReportPath}:/zap/wrk/:rw" `
            -t owasp/zap2docker-stable zap-full-scan.py `
            -t $Target `
            -r "zap-report-$timestamp.html" `
            -J "zap-report-$timestamp.json"
    } else {
        # Baseline scan (mais rápido, menos intrusivo)
        Write-Host "Running BASELINE scan..." -ForegroundColor Yellow
        
        docker run --rm `
            -v "${PWD}/${ReportPath}:/zap/wrk/:rw" `
            -t owasp/zap2docker-stable zap-baseline.py `
            -t $Target `
            -r "zap-report-$timestamp.html" `
            -J "zap-report-$timestamp.json"
    }
    
    Write-Host "`nScan completed successfully!" -ForegroundColor Green
    Write-Host "HTML Report: $reportFile" -ForegroundColor Cyan
    Write-Host "JSON Report: $jsonReportFile" -ForegroundColor Cyan
    
    # Verificar se relatórios foram gerados
    if (Test-Path $reportFile) {
        Write-Host "`nOpening HTML report..." -ForegroundColor Yellow
        Start-Process $reportFile
    }
    
    # Analisar resultados JSON
    if (Test-Path $jsonReportFile) {
        Write-Host "`nAnalyzing results..." -ForegroundColor Yellow
        $results = Get-Content $jsonReportFile | ConvertFrom-Json
        
        if ($results.site) {
            $alerts = $results.site[0].alerts
            $high = ($alerts | Where-Object { $_.riskcode -eq "3" }).Count
            $medium = ($alerts | Where-Object { $_.riskcode -eq "2" }).Count
            $low = ($alerts | Where-Object { $_.riskcode -eq "1" }).Count
            $info = ($alerts | Where-Object { $_.riskcode -eq "0" }).Count
            
            Write-Host "`n=== Vulnerability Summary ===" -ForegroundColor Cyan
            Write-Host "High:   $high" -ForegroundColor $(if ($high -gt 0) { "Red" } else { "Green" })
            Write-Host "Medium: $medium" -ForegroundColor $(if ($medium -gt 0) { "Yellow" } else { "Green" })
            Write-Host "Low:    $low" -ForegroundColor Yellow
            Write-Host "Info:   $info" -ForegroundColor Gray
            
            if ($high -gt 0) {
                Write-Host "`nWARNING: High-risk vulnerabilities found!" -ForegroundColor Red
                Write-Host "Please review the report and fix critical issues." -ForegroundColor Red
                exit 1
            } elseif ($medium -gt 0) {
                Write-Host "`nWARNING: Medium-risk vulnerabilities found." -ForegroundColor Yellow
                Write-Host "Please review the report." -ForegroundColor Yellow
            } else {
                Write-Host "`nNo high or medium risk vulnerabilities found!" -ForegroundColor Green
            }
        }
    }
    
} catch {
    Write-Host "`nERROR: Scan failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Scan Complete ===" -ForegroundColor Cyan
