#!/usr/bin/env pwsh
# 🚀 Script de Inicialização do Frontend - Alquimista.AI
# Este script automatiza a instalação e inicialização do servidor de desenvolvimento

Write-Host ""
Write-Host "🧙‍♂️ Alquimista.AI - Frontend Setup" -ForegroundColor Magenta
Write-Host "=====================================" -ForegroundColor Magenta
Write-Host ""

# Verificar se estamos na pasta correta
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erro: package.json não encontrado!" -ForegroundColor Red
    Write-Host "   Execute este script da pasta frontend/" -ForegroundColor Yellow
    exit 1
}

# Verificar Node.js
Write-Host "🔍 Verificando Node.js..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js instalado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado!" -ForegroundColor Red
    Write-Host "   Instale Node.js 18+ de: https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

# Verificar npm
Write-Host "🔍 Verificando npm..." -ForegroundColor Cyan
try {
    $npmVersion = npm --version
    Write-Host "✅ npm instalado: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm não encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Instalando dependências..." -ForegroundColor Cyan
Write-Host "   (Isso pode levar alguns minutos na primeira vez)" -ForegroundColor Gray
Write-Host ""

# Instalar dependências
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Erro ao instalar dependências!" -ForegroundColor Red
    Write-Host "   Tente executar manualmente: npm install" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "✅ Dependências instaladas com sucesso!" -ForegroundColor Green
Write-Host ""

# Verificar vulnerabilidades
Write-Host "🔒 Verificando vulnerabilidades..." -ForegroundColor Cyan
$auditOutput = npm audit --json 2>$null | ConvertFrom-Json

if ($auditOutput.metadata.vulnerabilities.critical -gt 0) {
    Write-Host "⚠️  Encontradas $($auditOutput.metadata.vulnerabilities.critical) vulnerabilidades críticas" -ForegroundColor Yellow
    Write-Host "   Execute: npm audit fix" -ForegroundColor Gray
} else {
    Write-Host "✅ Nenhuma vulnerabilidade crítica encontrada!" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Iniciando servidor de desenvolvimento..." -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 URLs disponíveis:" -ForegroundColor White
Write-Host "   • Home:      http://localhost:3000" -ForegroundColor Gray
Write-Host "   • Fibonacci: http://localhost:3000/fibonacci" -ForegroundColor Gray
Write-Host "   • Nigredo:   http://localhost:3000/nigredo" -ForegroundColor Gray
Write-Host "   • Login:     http://localhost:3000/login" -ForegroundColor Gray
Write-Host "   • Dashboard: http://localhost:3000/dashboard" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Dica: Pressione Ctrl+C para parar o servidor" -ForegroundColor Yellow
Write-Host ""
Write-Host "=====================================" -ForegroundColor Magenta
Write-Host ""

# Iniciar servidor de desenvolvimento
npm run dev
