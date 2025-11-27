# Script de Deploy - Painel Operacional AlquimistaAI
# Deploy completo do Operational Dashboard em DEV ou PROD

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "prod")]
    [string]$Environment,
    
    [switch]$SkipMigrations,
    [switch]$SkipCognito,
    [switch]$SkipValidation,
    [switch]$AutoApprove,
    [string]$Region = "us-east-1"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deploy do Painel Operacional - $($Environment.ToUpper())" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar pré-requisitos
Write-Host "Verificando pré-requisitos..." -ForegroundColor Yellow

# Verificar AWS CLI
try {
    $awsVersion = aws --version 2>&1
    Write-Host "✓ AWS CLI instalado: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ AWS CLI não encontrado. Instale o AWS CLI v2." -ForegroundColor Red
    exit 1
}

# Verificar CDK
try {
    $cdkVersion = cdk --version 2>&1
    Write-Host "✓ AWS CDK instalado: $cdkVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ AWS CDK não encontrado. Execute: npm install -g aws-cdk" -ForegroundColor Red
    exit 1
}

# Verificar Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✓ Node.js instalado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js não encontrado. Instale Node.js 20.x" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Confirmar deploy em produção
if ($Environment -eq "prod" -and -not $AutoApprove) {
    Write-Host "⚠️  ATENÇÃO: Você está prestes a fazer deploy em PRODUÇÃO!" -ForegroundColor Yellow
    Write-Host ""
    $confirmation = Read-Host "Digite 'DEPLOY PROD' para confirmar"
    
    if ($confirmation -ne "DEPLOY PROD") {
        Write-Host "Deploy cancelado." -ForegroundColor Red
        exit 1
    }
    Write-Host ""
}

# Passo 1: Compilar TypeScript
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Passo 1: Compilando TypeScript" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

try {
    npm run build
    Write-Host "✓ Compilação concluída" -ForegroundColor Green
} catch {
    Write-Host "✗ Erro na compilação" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Passo 2: Executar Migrations
if (-not $SkipMigrations) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Passo 2: Executando Migrations" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    if ($Environment -eq "prod") {
        Write-Host "⚠️  Criando backup do Aurora antes das migrations..." -ForegroundColor Yellow
        
        $snapshotId = "operational-dashboard-pre-deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        $clusterName = "alquimista-aurora-prod"
        
        try {
            aws rds create-db-cluster-snapshot `
                --db-cluster-identifier $clusterName `
                --db-cluster-snapshot-identifier $snapshotId `
                --region $Region
            
            Write-Host "✓ Snapshot criado: $snapshotId" -ForegroundColor Green
        } catch {
            Write-Host "✗ Erro ao criar snapshot" -ForegroundColor Red
            Write-Host "Deseja continuar sem backup? (y/N)" -ForegroundColor Yellow
            $continue = Read-Host
            if ($continue -ne "y") {
                exit 1
            }
        }
        Write-Host ""
    }
    
    Write-Host "Executando migration 015_create_operational_dashboard_tables.sql..." -ForegroundColor Yellow
    
    # Obter credenciais do Aurora
    $secretId = "/alquimista/$Environment/aurora/credentials"
    
    try {
        $secretJson = aws secretsmanager get-secret-value `
            --secret-id $secretId `
            --region $Region `
            --query SecretString `
            --output text | ConvertFrom-Json
        
        $dbHost = $secretJson.host
        $dbUser = $secretJson.username
        $dbPassword = $secretJson.password
        $dbName = "alquimista_platform"
        
        Write-Host "Conectando ao Aurora: $dbHost" -ForegroundColor Gray
        
        # Executar migration
        $env:PGPASSWORD = $dbPassword
        psql -h $dbHost -U $dbUser -d $dbName -f "database/migrations/015_create_operational_dashboard_tables.sql"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Migration executada com sucesso" -ForegroundColor Green
        } else {
            Write-Host "✗ Erro ao executar migration" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "✗ Erro ao obter credenciais do Aurora" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
} else {
    Write-Host "Passo 2: Migrations - PULADO" -ForegroundColor Yellow
    Write-Host ""
}

# Passo 3: Configurar Cognito
if (-not $SkipCognito) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Passo 3: Configurando Cognito" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    try {
        & ".\scripts\setup-cognito-groups.ps1" -Environment $Environment
        Write-Host "✓ Grupos do Cognito configurados" -ForegroundColor Green
    } catch {
        Write-Host "✗ Erro ao configurar Cognito" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        
        Write-Host "Deseja continuar? (y/N)" -ForegroundColor Yellow
        $continue = Read-Host
        if ($continue -ne "y") {
            exit 1
        }
    }
    
    Write-Host ""
} else {
    Write-Host "Passo 3: Cognito - PULADO" -ForegroundColor Yellow
    Write-Host ""
}

# Passo 4: Sintetizar Stack
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Passo 4: Sintetizando Stack" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

try {
    cdk synth "OperationalDashboardStack-$Environment" --context env=$Environment
    Write-Host "✓ Stack sintetizado com sucesso" -ForegroundColor Green
} catch {
    Write-Host "✗ Erro ao sintetizar stack" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Passo 5: Deploy do Stack
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Passo 5: Deploy do Stack CDK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$deployArgs = @(
    "deploy",
    "OperationalDashboardStack-$Environment",
    "--context", "env=$Environment"
)

if ($AutoApprove) {
    $deployArgs += "--require-approval", "never"
}

try {
    & cdk @deployArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Deploy concluído com sucesso" -ForegroundColor Green
    } else {
        Write-Host "✗ Erro no deploy" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Erro no deploy" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""

# Passo 6: Validação
if (-not $SkipValidation) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Passo 6: Validando Deploy" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "Aguardando 30 segundos para recursos estabilizarem..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    
    try {
        if ($Environment -eq "dev") {
            & ".\scripts\validate-operational-dashboard-dev.ps1" -Region $Region
        } else {
            Write-Host "Validação manual necessária para produção." -ForegroundColor Yellow
            Write-Host "Execute: .\scripts\smoke-tests-operational-dashboard-prod.ps1" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  Validação falhou, mas deploy foi concluído" -ForegroundColor Yellow
        Write-Host "Revise os logs e execute validação manual" -ForegroundColor Yellow
    }
    
    Write-Host ""
} else {
    Write-Host "Passo 6: Validação - PULADO" -ForegroundColor Yellow
    Write-Host ""
}

# Resumo
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deploy Concluído!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Ambiente: $($Environment.ToUpper())" -ForegroundColor White
Write-Host "Região: $Region" -ForegroundColor White
Write-Host ""

Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Verificar logs no CloudWatch" -ForegroundColor White
Write-Host "2. Testar endpoints da API" -ForegroundColor White
Write-Host "3. Criar usuários de teste (se necessário)" -ForegroundColor White
Write-Host "4. Configurar frontend com URLs da API" -ForegroundColor White
Write-Host ""

Write-Host "Recursos criados:" -ForegroundColor Cyan
Write-Host "- DynamoDB Table: alquimista-operational-commands-$Environment" -ForegroundColor White
Write-Host "- ElastiCache Redis: alquimista-redis-$Environment" -ForegroundColor White
Write-Host "- 14 Lambda Functions" -ForegroundColor White
Write-Host "- 12 API Gateway Routes" -ForegroundColor White
Write-Host "- EventBridge Rule para agregação diária" -ForegroundColor White
Write-Host ""

Write-Host "Documentação:" -ForegroundColor Cyan
Write-Host "- docs/operational-dashboard/README.md" -ForegroundColor White
Write-Host "- docs/operational-dashboard/DEPLOY-PREPARATION.md" -ForegroundColor White
Write-Host "- docs/operational-dashboard/API-ROUTES-REFERENCE.md" -ForegroundColor White
Write-Host ""

exit 0
