# Script de Validação Completa do Sistema AlquimistaAI
# Script de Validação Completa do Sistema AlquimistaAI
# Verifica se todos os componentes estão prontos para deploy
#
# ARQUITETURA OFICIAL: Lambda + Aurora PostgreSQL + DynamoDB (AWS-only)
# Este script valida migrations, handlers, frontend e infraestrutura
# Supabase NÃO é parte do fluxo oficial (apenas legado/opcional)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VALIDAÇÃO COMPLETA - SISTEMA ALQUIMISTA.AI" -ForegroundColor Cyan
Write-Host "Arquitetura: Lambda + Aurora + DynamoDB (AWS)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$errors = 0
$warnings = 0

# 1. Validar Migrations (Aurora PostgreSQL)
Write-Host "1. Validando Migrations (Aurora PostgreSQL)..." -ForegroundColor Yellow
$migrations = @(
    "001_initial_schema.sql",
    "002_tenants_users.sql",
    "003_agents_platform.sql",
    "004_fibonacci_core.sql",
    "005_create_approval_tables.sql",
    "006_add_lgpd_consent.sql",
    "007_create_nigredo_schema.sql",
    "008_create_billing_tables.sql",
    "009_create_subscription_tables.sql",
    "010_create_plans_structure.sql"
)

foreach ($migration in $migrations) {
    if (Test-Path "database/migrations/$migration") {
        # Avisar sobre migration 009 (duplicada)
        if ($migration -eq "009_create_subscription_tables.sql") {
            Write-Host "  ⚠️  $migration (DUPLICADA - pular na aplicação)" -ForegroundColor Yellow
            $warnings++
        } else {
            Write-Host "  ✅ $migration" -ForegroundColor Green
        }
    } else {
        Write-Host "  ❌ $migration - FALTANDO" -ForegroundColor Red
        $errors++
    }
}

# 2. Validar Seeds
Write-Host "`n2. Validando Seeds..." -ForegroundColor Yellow
$seeds = @(
    "001_production_data.template.sql",
    "002_default_permissions.sql",
    "003_internal_account.sql",
    "004_subscription_test_data.sql",
    "005_agents_32_complete.sql",
    "006_subnucleos_and_plans.sql",
    "007_ceo_admin_access.sql"
)

foreach ($seed in $seeds) {
    if (Test-Path "database/seeds/$seed") {
        Write-Host "  ✅ $seed" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $seed - FALTANDO" -ForegroundColor Red
        $errors++
    }
}

# 3. Validar Lambda Handlers
Write-Host "`n3. Validando Lambda Handlers..." -ForegroundColor Yellow
$handlers = @(
    "platform/list-agents.ts",
    "platform/list-plans.ts",
    "platform/list-subnucleos.ts",
    "platform/get-tenant-subscription.ts",
    "platform/update-tenant-subscription.ts",
    "platform/create-checkout-session.ts",
    "platform/trial-start.ts",
    "platform/trial-invoke.ts",
    "platform/commercial-contact.ts"
)

foreach ($handler in $handlers) {
    if (Test-Path "lambda/$handler") {
        Write-Host "  ✅ $handler" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $handler - FALTANDO" -ForegroundColor Red
        $errors++
    }
}

# 4. Validar Frontend Pages
Write-Host "`n4. Validando Frontend Pages..." -ForegroundColor Yellow
$pages = @(
    "src/app/(dashboard)/billing/plans/page.tsx",
    "src/app/(dashboard)/billing/subnucleos/page.tsx",
    "src/app/(dashboard)/billing/checkout/page.tsx",
    "src/app/(dashboard)/billing/success/page.tsx",
    "src/app/(dashboard)/billing/cancel/page.tsx",
    "src/app/(dashboard)/commercial/contact/page.tsx"
)

foreach ($page in $pages) {
    if (Test-Path "frontend/$page") {
        Write-Host "  ✅ $page" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $page - FALTANDO" -ForegroundColor Red
        $errors++
    }
}

# 5. Validar Stores
Write-Host "`n5. Validando Stores..." -ForegroundColor Yellow
$stores = @(
    "src/stores/auth-store.ts",
    "src/stores/agent-store.ts",
    "src/stores/plans-store.ts",
    "src/stores/selection-store.ts"
)

foreach ($store in $stores) {
    if (Test-Path "frontend/$store") {
        Write-Host "  ✅ $store" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $store - FALTANDO" -ForegroundColor Red
        $errors++
    }
}

# 6. Validar API Clients
Write-Host "`n6. Validando API Clients..." -ForegroundColor Yellow
$clients = @(
    "src/lib/api-client.ts",
    "src/lib/agents-client.ts",
    "src/lib/billing-client.ts",
    "src/lib/commercial-client.ts",
    "src/lib/trials-client.ts"
)

foreach ($client in $clients) {
    if (Test-Path "frontend/$client") {
        Write-Host "  ✅ $client" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $client - FALTANDO" -ForegroundColor Red
        $errors++
    }
}

# 7. Validar CDK Stacks
Write-Host "`n7. Validando CDK Stacks..." -ForegroundColor Yellow
# Nota: Cognito User Pool está integrado ao FibonacciStack (não é stack separada)
$stacks = @(
    "lib/alquimista-stack.ts",
    "lib/fibonacci-stack.ts",
    "lib/nigredo-stack.ts"
)

foreach ($stack in $stacks) {
    if (Test-Path $stack) {
        Write-Host "  ✅ $stack" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $stack - FALTANDO" -ForegroundColor Red
        $errors++
    }
}

# Validar que Cognito está no FibonacciStack
if (Test-Path "lib/fibonacci-stack.ts") {
    $fibonacciContent = Get-Content "lib/fibonacci-stack.ts" -Raw
    if ($fibonacciContent -match "cognito\.UserPool") {
        Write-Host "  ✅ Cognito User Pool (integrado ao FibonacciStack)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Cognito User Pool não encontrado no FibonacciStack" -ForegroundColor Yellow
        $warnings++
    }
}

# 8. Compilar TypeScript
Write-Host "`n8. Compilando TypeScript..." -ForegroundColor Yellow
try {
    $compileOutput = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Compilação bem-sucedida" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Erro na compilação" -ForegroundColor Red
        $errors++
    }
} catch {
    Write-Host "  ⚠️  Não foi possível compilar" -ForegroundColor Yellow
    $warnings++
}

# 9. Verificar Documentação
Write-Host "`n9. Verificando Documentação..." -ForegroundColor Yellow
$docs = @(
    "README.md",
    "SISTEMA-PRONTO-DEPLOY.md",
    "docs/billing/README.md"
)

foreach ($doc in $docs) {
    if (Test-Path $doc) {
        Write-Host "  ✅ $doc" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  $doc - Recomendado" -ForegroundColor Yellow
        $warnings++
    }
}

# 10. Validações Complementares (Opcional)
Write-Host "`n10. Validações Complementares..." -ForegroundColor Yellow
Write-Host "    (Execute manualmente quando necessário)" -ForegroundColor Gray
Write-Host ""

Write-Host "  📋 Scripts disponíveis:" -ForegroundColor Cyan
Write-Host "     - validate-migrations-aurora.ps1 : Valida estado de migrations no Aurora" -ForegroundColor White
Write-Host "     - smoke-tests-api-dev.ps1 : Testa endpoints das APIs após deploy" -ForegroundColor White
Write-Host "     - manual-rollback-guided.ps1 : Guia para rollback em caso de problemas" -ForegroundColor White
Write-Host ""

# Verificar se variáveis de ambiente para Aurora estão configuradas
if ($env:PGHOST -and $env:PGUSER -and $env:PGDATABASE) {
    Write-Host "  ℹ️  Variáveis de conexão Aurora detectadas" -ForegroundColor Cyan
    Write-Host "     Execute: .\scripts\validate-migrations-aurora.ps1" -ForegroundColor Gray
} else {
    Write-Host "  ℹ️  Para validar migrations Aurora, configure:" -ForegroundColor Cyan
    Write-Host '     $env:PGHOST, $env:PGUSER, $env:PGDATABASE, $env:PGPASSWORD' -ForegroundColor Gray
}
Write-Host ""

# Resumo Final
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUMO DA VALIDAÇÃO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($errors -eq 0 -and $warnings -eq 0) {
    Write-Host "✅ SISTEMA 100% COMPLETO E PRONTO PARA DEPLOY!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos passos (Aurora PostgreSQL):" -ForegroundColor Cyan
    Write-Host "  1. Aplicar migrations em Aurora (dev): Ver database/COMANDOS-RAPIDOS-AURORA.md" -ForegroundColor White
    Write-Host "  2. Executar seeds em Aurora (dev)" -ForegroundColor White
    Write-Host "  3. Testar Lambda + API Gateway (dev)" -ForegroundColor White
    Write-Host "  4. Aplicar migrations em Aurora (prod)" -ForegroundColor White
    Write-Host "  5. Deploy CDK: cdk deploy --all --context env=prod" -ForegroundColor White
    Write-Host "  6. Deploy Frontend: cd frontend && npm run deploy" -ForegroundColor White
    Write-Host "  7. Validar endpoints em produção" -ForegroundColor White
    Write-Host ""
    Write-Host "📚 Documentação:" -ForegroundColor Cyan
    Write-Host "  - database/RESUMO-AURORA-OFICIAL.md (visão geral)" -ForegroundColor White
    Write-Host "  - database/COMANDOS-RAPIDOS-AURORA.md (comandos Windows)" -ForegroundColor White
    Write-Host "  - database/AURORA-MIGRATIONS-AUDIT.md (auditoria completa)" -ForegroundColor White
    Write-Host "  - docs/VALIDACAO-E-SUPORTE-AWS.md (scripts de validação)" -ForegroundColor White
} elseif ($errors -eq 0) {
    Write-Host "⚠️  SISTEMA PRONTO COM AVISOS" -ForegroundColor Yellow
    Write-Host "Avisos: $warnings" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "O sistema pode ser deployado, mas revise os avisos acima." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📚 Documentação Aurora:" -ForegroundColor Cyan
    Write-Host "  - database/RESUMO-AURORA-OFICIAL.md" -ForegroundColor White
    Write-Host "  - database/COMANDOS-RAPIDOS-AURORA.md" -ForegroundColor White
    Write-Host "  - docs/VALIDACAO-E-SUPORTE-AWS.md" -ForegroundColor White
} else {
    Write-Host "❌ SISTEMA INCOMPLETO" -ForegroundColor Red
    Write-Host "Erros: $errors" -ForegroundColor Red
    Write-Host "Avisos: $warnings" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Corrija os erros antes de fazer deploy." -ForegroundColor Red
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

exit $errors
