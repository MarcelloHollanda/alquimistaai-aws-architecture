# Script para Listar Migrations Disponíveis via Lambda
# Sistema: AlquimistaAI
# Componente: Pipeline de Migrations Seguro

param(
    [string]$Environment = "dev",
    [string]$FunctionName = "aurora-migrations-runner-dev"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "LISTAR MIGRATIONS DISPONÍVEIS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# Preparar payload
$payload = @{
    action = "list-migrations"
} | ConvertTo-Json -Compress

Write-Host "📤 Invocando Lambda: $FunctionName" -ForegroundColor Yellow
Write-Host ""

# Criar arquivo temporário para payload
$payloadFile = [System.IO.Path]::GetTempFileName()
$payload | Out-File -FilePath $payloadFile -Encoding utf8 -NoNewline

# Invocar Lambda
$outputFile = "list-migrations-output.json"

try {
    aws lambda invoke `
        --function-name $FunctionName `
        --payload "file://$payloadFile" `
        --cli-binary-format raw-in-base64-out `
        $outputFile

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ERRO: Falha ao invocar Lambda" -ForegroundColor Red
        exit 1
    }

    # Ler e exibir resultado
    $result = Get-Content $outputFile | ConvertFrom-Json
    
    if ($result.status -eq "success") {
        Write-Host "✅ Migrations disponíveis:" -ForegroundColor Green
        Write-Host ""
        foreach ($migration in $result.executedMigrations) {
            Write-Host "  📄 Migration $migration" -ForegroundColor White
        }
        Write-Host ""
        Write-Host "Total: $($result.executedMigrations.Count) migration(s)" -ForegroundColor Cyan
    } else {
        Write-Host "❌ ERRO: $($result.error)" -ForegroundColor Red
    }

} finally {
    # Limpar arquivo temporário
    Remove-Item $payloadFile -ErrorAction SilentlyContinue
    Remove-Item $outputFile -ErrorAction SilentlyContinue
}

Write-Host ""
