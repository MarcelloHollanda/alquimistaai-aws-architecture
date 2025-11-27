# Script de Smoke Tests - APIs AlquimistaAI
# Sistema: AlquimistaAI / Fibonacci Orquestrador B2B
# Região: us-east-1
#
# PROPÓSITO: Executar testes rápidos para garantir que serviços principais
# respondem corretamente após deploy

param(
    [string]$Environment = "dev",
    [string]$BaseUrlFibonacci = $null,
    [string]$BaseUrlNigredo = $null,
    [switch]$SkipFibonacci = $false,
    [switch]$SkipNigredo = $false,
    [switch]$Verbose = $false
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SMOKE TESTS - APIs ALQUIMISTA.AI" -ForegroundColor Cyan
Write-Host "Ambiente: $Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$totalTests = 0
$passedTests = 0
$failedTests = 0
$skippedTests = 0

# Função auxiliar para fazer requisições HTTP
function Invoke-SmokeTest {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body = $null,
        [int]$ExpectedStatus = 200,
        [string]$ExpectedContentPattern = $null
    )
    
    $totalTests++
    Write-Host "🧪 Teste: $Name" -ForegroundColor Cyan
    Write-Host "   URL: $Url" -ForegroundColor Gray
    Write-Host "   Método: $Method" -ForegroundColor Gray
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            TimeoutSec = 30
            UseBasicParsing = $true
        }
        
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params -ErrorAction Stop
        
        # Verificar status code
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host "   ✅ Status: $($response.StatusCode) (esperado: $ExpectedStatus)" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Status: $($response.StatusCode) (esperado: $ExpectedStatus)" -ForegroundColor Red
            $script:failedTests++
            return $false
        }
        
        # Verificar padrão de conteúdo (se especificado)
        if ($ExpectedContentPattern) {
            $content = $response.Content
            if ($content -match $ExpectedContentPattern) {
                Write-Host "   ✅ Conteúdo contém padrão esperado" -ForegroundColor Green
            } else {
                Write-Host "   ❌ Conteúdo NÃO contém padrão esperado: $ExpectedContentPattern" -ForegroundColor Red
                if ($Verbose) {
                    Write-Host "   Conteúdo recebido: $content" -ForegroundColor Gray
                }
                $script:failedTests++
                return $false
            }
        }
        
        # Verificar se é JSON válido
        try {
            $json = $response.Content | ConvertFrom-Json
            Write-Host "   ✅ Resposta JSON válida" -ForegroundColor Green
            
            if ($Verbose) {
                Write-Host "   Resposta: $($response.Content)" -ForegroundColor Gray
            }
        } catch {
            Write-Host "   ⚠️  Resposta não é JSON (pode ser esperado)" -ForegroundColor Yellow
        }
        
        $script:passedTests++
        Write-Host ""
        return $true
        
    } catch {
        Write-Host "   ❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
        
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            Write-Host "   Status Code: $statusCode" -ForegroundColor Red
        }
        
        if ($Verbose) {
            Write-Host "   Detalhes: $($_.Exception)" -ForegroundColor Gray
        }
        
        $script:failedTests++
        Write-Host ""
        return $false
    }
}

# Buscar URLs das APIs se não foram fornecidas
if (-not $BaseUrlFibonacci -and -not $SkipFibonacci) {
    Write-Host "Buscando URL da API Fibonacci..." -ForegroundColor Yellow
    try {
        $stackName = "FibonacciStack-$Environment"
        $outputsJson = aws cloudformation describe-stacks --stack-name $stackName --query "Stacks[0].Outputs" --output json --region us-east-1 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            $outputs = $outputsJson | ConvertFrom-Json
            $apiOutput = $outputs | Where-Object { $_.OutputKey -like "*ApiUrl*" -or $_.OutputKey -like "*Endpoint*" }
            
            if ($apiOutput) {
                $BaseUrlFibonacci = $apiOutput[0].OutputValue.TrimEnd('/')
                Write-Host "✅ URL encontrada: $BaseUrlFibonacci" -ForegroundColor Green
            } else {
                Write-Host "⚠️  URL não encontrada nos outputs do stack" -ForegroundColor Yellow
                Write-Host "   Forneça manualmente com -BaseUrlFibonacci" -ForegroundColor Yellow
                $SkipFibonacci = $true
            }
        } else {
            Write-Host "⚠️  Não foi possível buscar outputs do stack" -ForegroundColor Yellow
            Write-Host "   Forneça manualmente com -BaseUrlFibonacci" -ForegroundColor Yellow
            $SkipFibonacci = $true
        }
    } catch {
        Write-Host "⚠️  Erro ao buscar URL: $($_.Exception.Message)" -ForegroundColor Yellow
        $SkipFibonacci = $true
    }
    Write-Host ""
}

if (-not $BaseUrlNigredo -and -not $SkipNigredo) {
    Write-Host "Buscando URL da API Nigredo..." -ForegroundColor Yellow
    try {
        $stackName = "NigredoStack-$Environment"
        $outputsJson = aws cloudformation describe-stacks --stack-name $stackName --query "Stacks[0].Outputs" --output json --region us-east-1 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            $outputs = $outputsJson | ConvertFrom-Json
            $apiOutput = $outputs | Where-Object { $_.OutputKey -like "*ApiUrl*" -or $_.OutputKey -like "*Endpoint*" }
            
            if ($apiOutput) {
                $BaseUrlNigredo = $apiOutput[0].OutputValue.TrimEnd('/')
                Write-Host "✅ URL encontrada: $BaseUrlNigredo" -ForegroundColor Green
            } else {
                Write-Host "⚠️  URL não encontrada nos outputs do stack" -ForegroundColor Yellow
                Write-Host "   Forneça manualmente com -BaseUrlNigredo" -ForegroundColor Yellow
                $SkipNigredo = $true
            }
        } else {
            Write-Host "⚠️  Não foi possível buscar outputs do stack" -ForegroundColor Yellow
            Write-Host "   Forneça manualmente com -BaseUrlNigredo" -ForegroundColor Yellow
            $SkipNigredo = $true
        }
    } catch {
        Write-Host "⚠️  Erro ao buscar URL: $($_.Exception.Message)" -ForegroundColor Yellow
        $SkipNigredo = $true
    }
    Write-Host ""
}

# ========================================
# TESTES FIBONACCI ORQUESTRADOR
# ========================================

if (-not $SkipFibonacci -and $BaseUrlFibonacci) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "FIBONACCI ORQUESTRADOR - SMOKE TESTS" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Teste 1: Health Check
    Invoke-SmokeTest `
        -Name "Fibonacci - Health Check" `
        -Url "$BaseUrlFibonacci/health" `
        -ExpectedStatus 200 `
        -ExpectedContentPattern '"ok".*true'
    
    # Teste 2: Listar Agentes
    Invoke-SmokeTest `
        -Name "Fibonacci - Listar Agentes" `
        -Url "$BaseUrlFibonacci/api/agents" `
        -ExpectedStatus 200 `
        -ExpectedContentPattern '"agents"'
    
    # Teste 3: Listar Planos
    Invoke-SmokeTest `
        -Name "Fibonacci - Listar Planos" `
        -Url "$BaseUrlFibonacci/api/plans" `
        -ExpectedStatus 200 `
        -ExpectedContentPattern '"plans"'
    
    # Teste 4: Listar SubNúcleos
    Invoke-SmokeTest `
        -Name "Fibonacci - Listar SubNúcleos" `
        -Url "$BaseUrlFibonacci/api/subnucleos" `
        -ExpectedStatus 200 `
        -ExpectedContentPattern '"subnucleos"'
    
} elseif ($SkipFibonacci) {
    Write-Host "⏭️  Testes Fibonacci pulados" -ForegroundColor Yellow
    Write-Host ""
    $skippedTests += 4
} else {
    Write-Host "❌ URL da API Fibonacci não fornecida" -ForegroundColor Red
    Write-Host "   Use: -BaseUrlFibonacci <url>" -ForegroundColor Yellow
    Write-Host ""
    $skippedTests += 4
}

# ========================================
# TESTES NIGREDO (PROSPECÇÃO)
# ========================================

if (-not $SkipNigredo -and $BaseUrlNigredo) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "NIGREDO (PROSPECÇÃO) - SMOKE TESTS" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Teste 1: Health Check
    Invoke-SmokeTest `
        -Name "Nigredo - Health Check" `
        -Url "$BaseUrlNigredo/api/nigredo/health" `
        -ExpectedStatus 200 `
        -ExpectedContentPattern '"ok".*true'
    
    # Teste 2: Status do Pipeline
    Invoke-SmokeTest `
        -Name "Nigredo - Status do Pipeline" `
        -Url "$BaseUrlNigredo/api/nigredo/pipeline/status" `
        -ExpectedStatus 200
    
    # Teste 3: Métricas do Pipeline
    Invoke-SmokeTest `
        -Name "Nigredo - Métricas do Pipeline" `
        -Url "$BaseUrlNigredo/api/nigredo/pipeline/metrics" `
        -ExpectedStatus 200
    
} elseif ($SkipNigredo) {
    Write-Host "⏭️  Testes Nigredo pulados" -ForegroundColor Yellow
    Write-Host ""
    $skippedTests += 3
} else {
    Write-Host "⚠️  URL da API Nigredo não fornecida (opcional)" -ForegroundColor Yellow
    Write-Host "   Use: -BaseUrlNigredo <url>" -ForegroundColor Yellow
    Write-Host ""
    $skippedTests += 3
}

# ========================================
# RESUMO FINAL
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUMO DOS SMOKE TESTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total de testes: $totalTests" -ForegroundColor White
Write-Host "Testes passados: $passedTests" -ForegroundColor Green
Write-Host "Testes falhados: $failedTests" -ForegroundColor $(if ($failedTests -gt 0) { "Red" } else { "Green" })
Write-Host "Testes pulados: $skippedTests" -ForegroundColor Yellow
Write-Host ""

if ($failedTests -eq 0 -and $passedTests -gt 0) {
    Write-Host "✅ TODOS OS TESTES PASSARAM!" -ForegroundColor Green
    Write-Host ""
    Write-Host "As APIs estão respondendo corretamente." -ForegroundColor Green
    Write-Host "O sistema está pronto para uso." -ForegroundColor Cyan
} elseif ($failedTests -eq 0 -and $passedTests -eq 0) {
    Write-Host "⚠️  NENHUM TESTE EXECUTADO" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Forneça as URLs das APIs:" -ForegroundColor Yellow
    Write-Host "  -BaseUrlFibonacci <url>" -ForegroundColor White
    Write-Host "  -BaseUrlNigredo <url>" -ForegroundColor White
    Write-Host ""
    Write-Host "Ou deixe o script buscar automaticamente dos stacks CDK." -ForegroundColor White
} else {
    Write-Host "❌ ALGUNS TESTES FALHARAM" -ForegroundColor Red
    Write-Host ""
    Write-Host "Ações recomendadas:" -ForegroundColor Yellow
    Write-Host "  1. Verifique os logs do CloudWatch das Lambdas" -ForegroundColor White
    Write-Host "  2. Verifique se as migrations foram aplicadas" -ForegroundColor White
    Write-Host "  3. Verifique conectividade Aurora <-> Lambda" -ForegroundColor White
    Write-Host "  4. Execute: .\scripts\validate-migrations-aurora.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "Para mais detalhes, execute com -Verbose" -ForegroundColor White
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Retornar código de saída apropriado
if ($failedTests -gt 0) {
    exit 1
} else {
    exit 0
}
