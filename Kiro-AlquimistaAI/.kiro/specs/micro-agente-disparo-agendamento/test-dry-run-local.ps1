# Script de Teste Local - Dry-Run Handler
# 
# Este script testa o handler dry-run localmente usando Node.js
# sem necessidade de deploy na AWS.
#
# Uso:
#   .\test-dry-run-local.ps1
#   .\test-dry-run-local.ps1 -BatchSize 3
#   .\test-dry-run-local.ps1 -EnableDisparo

param(
    [int]$BatchSize = 1,
    [switch]$EnableDisparo
)

Write-Host "=== Teste Local - Dry-Run Handler ===" -ForegroundColor Cyan
Write-Host ""

# Verificar se estamos na raiz do projeto
if (-not (Test-Path "lambda-src/agente-disparo-agenda")) {
    Write-Host "ERRO: Execute este script da raiz do projeto" -ForegroundColor Red
    exit 1
}

# Navegar para o diretório da Lambda
Push-Location "lambda-src/agente-disparo-agenda"

try {
    # Verificar se node_modules existe
    if (-not (Test-Path "node_modules")) {
        Write-Host "Instalando dependências..." -ForegroundColor Yellow
        npm install
        if ($LASTEXITCODE -ne 0) {
            throw "Falha ao instalar dependências"
        }
    }

    # Compilar TypeScript
    Write-Host "Compilando TypeScript..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Falha ao compilar TypeScript"
    }

    # Configurar variáveis de ambiente
    $env:MICRO_AGENT_DISPARO_ENABLED = if ($EnableDisparo) { "true" } else { "false" }
    $env:ENVIRONMENT = "dev"
    $env:DB_SECRET_ARN = "arn:aws:secretsmanager:us-east-1:123456789:secret:mock-secret"
    $env:EVENT_BUS_NAME = "fibonacci-bus-dev"

    Write-Host ""
    Write-Host "Configuração:" -ForegroundColor Cyan
    Write-Host "  MICRO_AGENT_DISPARO_ENABLED: $env:MICRO_AGENT_DISPARO_ENABLED"
    Write-Host "  ENVIRONMENT: $env:ENVIRONMENT"
    Write-Host "  Batch Size: $BatchSize"
    Write-Host ""

    # Criar evento de teste
    $testEvent = @{
        tenantId = "test-tenant-001"
        batchSize = $BatchSize
    } | ConvertTo-Json

    # Criar arquivo temporário com o evento
    $eventFile = "test-event.json"
    $testEvent | Out-File -FilePath $eventFile -Encoding UTF8

    # Criar script Node.js para invocar o handler
    $invokeScript = @"
const handler = require('./dist/handlers/dry-run').handler;
const fs = require('fs');

const event = JSON.parse(fs.readFileSync('$eventFile', 'utf8'));
const context = {
    functionName: 'dry-run-local-test',
    requestId: 'local-test-' + Date.now()
};

console.log('Invocando handler dry-run...\n');

handler(event, context)
    .then(result => {
        console.log('\n=== RESULTADO ===\n');
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
    })
    .catch(error => {
        console.error('\n=== ERRO ===\n');
        console.error(error);
        process.exit(1);
    });
"@

    $invokeScript | Out-File -FilePath "invoke-dry-run.js" -Encoding UTF8

    # Executar o handler
    Write-Host "Executando handler dry-run..." -ForegroundColor Yellow
    Write-Host ""
    node invoke-dry-run.js

    # Limpar arquivos temporários
    Remove-Item $eventFile -ErrorAction SilentlyContinue
    Remove-Item "invoke-dry-run.js" -ErrorAction SilentlyContinue

    Write-Host ""
    Write-Host "=== Teste concluído ===" -ForegroundColor Green

} catch {
    Write-Host ""
    Write-Host "ERRO: $_" -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
}
