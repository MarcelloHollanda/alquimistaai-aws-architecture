# Script de Validação do Fluxo de Autenticação
# Task 9: Testar fluxo com usuários DEV

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Validação do Fluxo de Autenticação OAuth" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se o servidor está rodando
Write-Host "1. Verificando servidor de desenvolvimento..." -ForegroundColor Yellow
$serverRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        $serverRunning = $true
        Write-Host "   ✓ Servidor rodando em http://localhost:3000" -ForegroundColor Green
    }
} catch {
    Write-Host "   ✗ Servidor NÃO está rodando" -ForegroundColor Red
    Write-Host "   Execute: cd frontend && npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Verificar variáveis de ambiente
Write-Host "2. Verificando variáveis de ambiente..." -ForegroundColor Yellow

$envFile = "frontend/.env.local"
if (Test-Path $envFile) {
    Write-Host "   ✓ Arquivo .env.local encontrado" -ForegroundColor Green
    
    $envContent = Get-Content $envFile -Raw
    
    $requiredVars = @(
        "NEXT_PUBLIC_COGNITO_USER_POOL_ID",
        "NEXT_PUBLIC_COGNITO_CLIENT_ID",
        "NEXT_PUBLIC_COGNITO_DOMAIN_HOST",
        "NEXT_PUBLIC_COGNITO_REDIRECT_URI",
        "NEXT_PUBLIC_COGNITO_LOGOUT_URI"
    )
    
    $allVarsPresent = $true
    foreach ($var in $requiredVars) {
        if ($envContent -match "$var=(.+)") {
            $value = $matches[1].Trim()
            if ($value) {
                Write-Host "   ✓ $var configurado" -ForegroundColor Green
            } else {
                Write-Host "   ✗ $var está vazio" -ForegroundColor Red
                $allVarsPresent = $false
            }
        } else {
            Write-Host "   ✗ $var ausente" -ForegroundColor Red
            $allVarsPresent = $false
        }
    }
    
    if (-not $allVarsPresent) {
        Write-Host ""
        Write-Host "   Corrija as variáveis ausentes no arquivo .env.local" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "   ✗ Arquivo .env.local não encontrado" -ForegroundColor Red
    Write-Host "   Copie .env.local.example para .env.local e configure" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Verificar rotas de autenticação
Write-Host "3. Verificando rotas de autenticação..." -ForegroundColor Yellow

$routes = @(
    @{ Path = "/auth/login"; Name = "Login" },
    @{ Path = "/auth/callback"; Name = "Callback" },
    @{ Path = "/auth/logout"; Name = "Logout" },
    @{ Path = "/auth/logout-callback"; Name = "Logout Callback" }
)

foreach ($route in $routes) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000$($route.Path)" -Method GET -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "   ✓ $($route.Name) ($($route.Path))" -ForegroundColor Green
        }
    } catch {
        Write-Host "   ✗ $($route.Name) ($($route.Path)) - Erro: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# Verificar arquivos de implementação
Write-Host "4. Verificando arquivos de implementação..." -ForegroundColor Yellow

$files = @(
    @{ Path = "frontend/src/lib/cognito-client.ts"; Name = "Cognito Client" },
    @{ Path = "frontend/src/stores/auth-store.ts"; Name = "Auth Store" },
    @{ Path = "frontend/middleware.ts"; Name = "Middleware" },
    @{ Path = "frontend/src/app/auth/callback/page.tsx"; Name = "Callback Page" },
    @{ Path = "frontend/src/app/auth/login/page.tsx"; Name = "Login Page" },
    @{ Path = "frontend/src/app/auth/logout/page.tsx"; Name = "Logout Page" },
    @{ Path = "frontend/src/app/auth/logout-callback/page.tsx"; Name = "Logout Callback Page" }
)

$allFilesPresent = $true
foreach ($file in $files) {
    if (Test-Path $file.Path) {
        Write-Host "   ✓ $($file.Name)" -ForegroundColor Green
    } else {
        Write-Host "   ✗ $($file.Name) não encontrado" -ForegroundColor Red
        $allFilesPresent = $false
    }
}

if (-not $allFilesPresent) {
    Write-Host ""
    Write-Host "   Alguns arquivos estão ausentes. Verifique a implementação." -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Verificar funções OAuth no Cognito Client
Write-Host "5. Verificando funções OAuth no Cognito Client..." -ForegroundColor Yellow

$cognitoClientContent = Get-Content "frontend/src/lib/cognito-client.ts" -Raw

$requiredFunctions = @(
    "initOAuthFlow",
    "exchangeCodeForTokens",
    "storeTokensInCookies",
    "getTokensFromCookies",
    "clearTokensFromCookies",
    "initLogoutFlow"
)

$allFunctionsPresent = $true
foreach ($func in $requiredFunctions) {
    if ($cognitoClientContent -match "export (const|function) $func") {
        Write-Host "   ✓ $func implementada" -ForegroundColor Green
    } else {
        Write-Host "   ✗ $func não encontrada" -ForegroundColor Red
        $allFunctionsPresent = $false
    }
}

if (-not $allFunctionsPresent) {
    Write-Host ""
    Write-Host "   Algumas funções OAuth estão ausentes. Complete a Task 2." -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Verificar mapeamento de grupos no Auth Store
Write-Host "6. Verificando mapeamento de grupos no Auth Store..." -ForegroundColor Yellow

$authStoreContent = Get-Content "frontend/src/stores/auth-store.ts" -Raw

$requiredFunctions = @(
    "extractClaimsFromToken",
    "mapGroupsToRole",
    "isInternalUser",
    "determineInitialRoute"
)

$allFunctionsPresent = $true
foreach ($func in $requiredFunctions) {
    if ($authStoreContent -match "function $func") {
        Write-Host "   ✓ $func implementada" -ForegroundColor Green
    } else {
        Write-Host "   ✗ $func não encontrada" -ForegroundColor Red
        $allFunctionsPresent = $false
    }
}

if (-not $allFunctionsPresent) {
    Write-Host ""
    Write-Host "   Algumas funções de mapeamento estão ausentes. Complete a Task 3." -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Verificar middleware de proteção
Write-Host "7. Verificando middleware de proteção..." -ForegroundColor Yellow

$middlewareContent = Get-Content "frontend/middleware.ts" -Raw

$middlewareChecks = @(
    @{ Pattern = "request\.cookies\.get\('accessToken'\)"; Name = "Validação de tokens" },
    @{ Pattern = "payload\['cognito:groups'\]"; Name = "Extração de grupos" },
    @{ Pattern = "payload\.exp"; Name = "Validação de expiração" },
    @{ Pattern = "INTERNAL_ADMIN|INTERNAL_SUPPORT"; Name = "Verificação de usuários internos" },
    @{ Pattern = "TENANT_ADMIN|TENANT_USER"; Name = "Verificação de usuários tenant" },
    @{ Pattern = "/app/company"; Name = "Proteção de rotas internas" },
    @{ Pattern = "/app/dashboard"; Name = "Proteção de rotas de cliente" }
)

$allChecksPresent = $true
foreach ($check in $middlewareChecks) {
    if ($middlewareContent -match $check.Pattern) {
        Write-Host "   ✓ $($check.Name)" -ForegroundColor Green
    } else {
        Write-Host "   ✗ $($check.Name) não encontrada" -ForegroundColor Red
        $allChecksPresent = $false
    }
}

if (-not $allChecksPresent) {
    Write-Host ""
    Write-Host "   Algumas verificações do middleware estão ausentes. Complete a Task 6." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Validação Automática Concluída" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "✓ Todas as verificações automáticas passaram!" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Execute os testes manuais conforme TASK-9-MANUAL-TESTING-GUIDE.md" -ForegroundColor White
Write-Host "2. Teste login com os 4 usuários DEV:" -ForegroundColor White
Write-Host "   - jmrhollanda@gmail.com (INTERNAL_ADMIN)" -ForegroundColor White
Write-Host "   - alquimistafibonacci@gmail.com (INTERNAL_SUPPORT)" -ForegroundColor White
Write-Host "   - marcello@c3comercial.com.br (TENANT_ADMIN)" -ForegroundColor White
Write-Host "   - leylany@c3comercial.com.br (TENANT_USER)" -ForegroundColor White
Write-Host "3. Valide redirecionamento correto para cada grupo" -ForegroundColor White
Write-Host "4. Valide bloqueio cross-dashboard (CRÍTICO)" -ForegroundColor White
Write-Host "5. Valide logout completo" -ForegroundColor White
Write-Host ""
Write-Host "Acesse: http://localhost:3000/auth/login" -ForegroundColor Cyan
Write-Host ""
