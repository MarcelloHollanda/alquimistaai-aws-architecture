# SCRIPT DE VALIDAÇÃO FINAL PRÉ-DEPLOY
# AlquimistaAI - Fibonacci + Nigredo
# Execute este script após aplicar as correções

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VALIDAÇÃO PRÉ-DEPLOY - AlquimistaAI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorCount = 0
$WarningCount = 0

# Função para log
function Log-Success { param($msg) Write-Host "✓ $msg" -ForegroundColor Green }
function Log-Error { param($msg) Write-Host "✗ $msg" -ForegroundColor Red; $script:ErrorCount++ }
function Log-Warning { param($msg) Write-Host "⚠ $msg" -ForegroundColor Yellow; $script:WarningCount++ }
function Log-Info { param($msg) Write-Host "ℹ $msg" -ForegroundColor Cyan }

# ============================================
# 1. VALIDAÇÃO DE DEPENDÊNCIAS
# ============================================
Write-Host "1. Validando Dependências..." -ForegroundColor Yellow
Write-Host ""

# Node.js
try {
    $nodeVersion = node --version
    if ($nodeVersion -match "v(\d+)\.") {
        $majorVersion = [int]$Matches[1]
        if ($majorVersion -ge 18) {
            Log-Success "Node.js $nodeVersion (OK)"
        } else {
            Log-Error "Node.js $nodeVersion (Requer v18+)"
        }
    }
} catch {
    Log-Error "Node.js não encontrado"
}

# NPM
try {
    $npmVersion = npm --version
    Log-Success "NPM v$npmVersion"
} catch {
    Log-Error "NPM não encontrado"
}

# Terraform
try {
    $tfVersion = terraform version | Select-Object -First 1
    Log-Success "Terraform $tfVersion"
} catch {
    Log-Warning "Terraform não encontrado (opcional para validação)"
}

Write-Host ""

# ============================================
# 2. VALIDAÇÃO DO FRONTEND
# ============================================
Write-Host "2. Validando Frontend..." -ForegroundColor Yellow
Write-Host ""

# Verificar se pasta existe
if (Test-Path "frontend") {
    Log-Success "Pasta frontend encontrada"
    
    # Verificar package.json
    if (Test-Path "frontend/package.json") {
        Log-Success "package.json encontrado"
        
        # Verificar dependências críticas
        $packageJson = Get-Content "frontend/package.json" -Raw | ConvertFrom-Json
        
        $criticalDeps = @(
            "react-hook-form",
            "@hookform/resolvers",
            "@tanstack/react-query",
            "next",
            "react",
            "framer-motion"
        )
        
        foreach ($dep in $criticalDeps) {
            if ($packageJson.dependencies.$dep) {
                Log-Success "Dependência: $dep"
            } else {
                Log-Error "Dependência faltando: $dep"
            }
        }
    } else {
        Log-Error "package.json não encontrado"
    }
    
    # Verificar estrutura de rotas
    Log-Info "Verificando estrutura de rotas..."
    
    $routeGroups = @(
        "frontend/src/app/(institutional)/page.tsx",
        "frontend/src/app/(fibonacci)/page.tsx",
        "frontend/src/app/(marketing)/page.tsx",
        "frontend/src/app/(nigredo)/page.tsx"
    )
    
    $rootPages = 0
    foreach ($route in $routeGroups) {
        if (Test-Path $route) {
            $rootPages++
            Log-Warning "Página raiz encontrada: $route"
        }
    }
    
    if ($rootPages -le 1) {
        Log-Success "Estrutura de rotas OK (apenas 1 página raiz)"
    } elseif ($rootPages -gt 1) {
        Log-Error "Conflito de rotas: $rootPages páginas raiz encontradas"
    }
    
    # Verificar .env.example
    if (Test-Path "frontend/.env.example") {
        Log-Success ".env.example encontrado"
    } else {
        Log-Warning ".env.example não encontrado"
    }
    
} else {
    Log-Error "Pasta frontend não encontrada"
}

Write-Host ""

# ============================================
# 3. VALIDAÇÃO DO BACKEND
# ============================================
Write-Host "3. Validando Backend..." -ForegroundColor Yellow
Write-Host ""

# Verificar handlers críticos
$handlers = @(
    "lambda/handler.ts",
    "lambda/fibonacci/handle-nigredo-event.ts",
    "lambda/nigredo/create-lead.ts",
    "lambda/nigredo/shared/webhook-sender.ts"
)

foreach ($handler in $handlers) {
    if (Test-Path $handler) {
        Log-Success "Handler: $handler"
    } else {
        Log-Error "Handler faltando: $handler"
    }
}

# Verificar shared utilities
$sharedFiles = @(
    "lambda/shared/logger.ts",
    "lambda/shared/database.ts",
    "lambda/shared/error-handler.ts"
)

foreach ($file in $sharedFiles) {
    if (Test-Path $file) {
        Log-Success "Shared: $file"
    } else {
        Log-Warning "Shared faltando: $file"
    }
}

Write-Host ""

# ============================================
# 4. VALIDAÇÃO DO TERRAFORM
# ============================================
Write-Host "4. Validando Terraform..." -ForegroundColor Yellow
Write-Host ""

$stacks = @(
    "lib/fibonacci-stack.ts",
    "lib/nigredo-stack.ts",
    "lib/alquimista-stack.ts"
)

foreach ($stack in $stacks) {
    if (Test-Path $stack) {
        Log-Success "Stack: $stack"
    } else {
        Log-Warning "Stack não encontrado: $stack"
    }
}

Write-Host ""

# ============================================
# 5. TESTE DE BUILD DO FRONTEND
# ============================================
Write-Host "5. Testando Build do Frontend..." -ForegroundColor Yellow
Write-Host ""

if (Test-Path "frontend") {
    Log-Info "Executando npm run build..."
    Write-Host ""
    
    Push-Location frontend
    
    try {
        $buildOutput = npm run build 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Log-Success "Build do frontend passou!"
        } else {
            Log-Error "Build do frontend falhou!"
            Write-Host ""
            Write-Host "Últimas linhas do erro:" -ForegroundColor Red
            $buildOutput | Select-Object -Last 20 | ForEach-Object { Write-Host $_ -ForegroundColor Red }
        }
    } catch {
        Log-Error "Erro ao executar build: $_"
    }
    
    Pop-Location
} else {
    Log-Error "Pasta frontend não encontrada"
}

Write-Host ""

# ============================================
# 6. VERIFICAÇÃO DE SEGREDOS
# ============================================
Write-Host "6. Verificando Segredos..." -ForegroundColor Yellow
Write-Host ""

# Procurar por possíveis segredos hardcoded
$patterns = @(
    "password\s*=\s*['\`"]",
    "secret\s*=\s*['\`"]",
    "api_key\s*=\s*['\`"]",
    "token\s*=\s*['\`"]"
)

$foundSecrets = $false

foreach ($pattern in $patterns) {
    $results = Get-ChildItem -Path "lambda","frontend/src" -Recurse -Include "*.ts","*.tsx","*.js" -ErrorAction SilentlyContinue | 
        Select-String -Pattern $pattern -CaseSensitive:$false
    
    if ($results) {
        $foundSecrets = $true
        Log-Warning "Possível segredo encontrado: $pattern"
        $results | ForEach-Object { Write-Host "  $($_.Path):$($_.LineNumber)" -ForegroundColor Yellow }
    }
}

if (-not $foundSecrets) {
    Log-Success "Nenhum segredo hardcoded encontrado"
}

Write-Host ""

# ============================================
# 7. RESUMO FINAL
# ============================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUMO DA VALIDAÇÃO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($ErrorCount -eq 0 -and $WarningCount -eq 0) {
    Write-Host "✓ TUDO OK! Sistema pronto para deploy!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos passos:" -ForegroundColor Cyan
    Write-Host "1. Configurar variáveis de ambiente de produção"
    Write-Host "2. Executar: terraform plan (dev)"
    Write-Host "3. Executar: terraform apply (dev)"
    Write-Host "4. Testar integração end-to-end"
    Write-Host "5. Deploy em produção"
} elseif ($ErrorCount -eq 0) {
    Write-Host "⚠ AVISOS ENCONTRADOS ($WarningCount)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "O sistema pode ser deployado, mas revise os avisos acima." -ForegroundColor Yellow
} else {
    Write-Host "✗ ERROS ENCONTRADOS ($ErrorCount)" -ForegroundColor Red
    Write-Host "⚠ AVISOS ENCONTRADOS ($WarningCount)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Corrija os erros antes de fazer deploy!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Consulte:" -ForegroundColor Cyan
    Write-Host "- CORRECOES-RAPIDAS.md (correções rápidas)"
    Write-Host "- AUDITORIA-PRE-DEPLOY-COMPLETA.md (relatório detalhado)"
}

Write-Host ""
Write-Host "Erros: $ErrorCount | Avisos: $WarningCount" -ForegroundColor $(if ($ErrorCount -gt 0) { "Red" } elseif ($WarningCount -gt 0) { "Yellow" } else { "Green" })
Write-Host ""

# Retornar código de saída apropriado
exit $ErrorCount
