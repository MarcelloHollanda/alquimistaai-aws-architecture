# Deploy do Painel Operacional AlquimistaAI em Produção
# Este script executa o deploy completo seguindo o runbook de produção

param(
    [switch]$SkipBackup,
    [switch]$AutoApprove,
    [switch]$SkipValidation
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deploy Painel Operacional - PRODUÇÃO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configurações
$ENV_NAME = "prod"
$REGION = "us-east-1"
$AURORA_CLUSTER = "alquimista-aurora-prod"

# Função para log
function Write-Step {
    param([string]$Message)
    Write-Host "`n[$(Get-Date -Format 'HH:mm:ss')] $Message" -ForegroundColor Green
}

function Write-Error-Step {
    param([string]$Message)
    Write-Host "`n[$(Get-Date -Format 'HH:mm:ss')] ERROR: $Message" -ForegroundColor Red
}

function Write-Warning-Step {
    param([string]$Message)
    Write-Host "`n[$(Get-Date -Format 'HH:mm:ss')] WARNING: $Message" -ForegroundColor Yellow
}

# ============================================
# PRÉ-REQUISITOS
# ============================================

Write-Step "Verificando pré-requisitos..."

# Verificar AWS CLI
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Error-Step "AWS CLI não encontrado. Instale: https://aws.amazon.com/cli/"
    exit 1
}

# Verificar CDK
if (-not (Get-Command cdk -ErrorAction SilentlyContinue)) {
    Write-Error-Step "AWS CDK não encontrado. Instale: npm install -g aws-cdk"
    exit 1
}

# Verificar Node.js
$nodeVersion = node --version
Write-Host "✓ Node.js: $nodeVersion"

# Verificar região AWS
$currentRegion = aws configure get region
if ($currentRegion -ne $REGION) {
    Write-Warning-Step "Região AWS configurada: $currentRegion (esperado: $REGION)"
    $continue = Read-Host "Continuar mesmo assim? (s/N)"
    if ($continue -ne "s") {
        exit 1
    }
}

Write-Host "✓ Pré-requisitos verificados"

# ============================================
# CONFIRMAÇÃO
# ============================================

if (-not $AutoApprove) {
    Write-Host ""
    Write-Host "ATENÇÃO: Você está prestes a fazer deploy em PRODUÇÃO!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Ambiente: $ENV_NAME" -ForegroundColor Yellow
    Write-Host "Região: $REGION" -ForegroundColor Yellow
    Write-Host ""
    $confirm = Read-Host "Tem certeza que deseja continuar? Digite 'DEPLOY PROD' para confirmar"
    
    if ($confirm -ne "DEPLOY PROD") {
        Write-Host "Deploy cancelado pelo usuário."
        exit 0
    }
}

$startTime = Get-Date

# ============================================
# FASE 1: BACKUP DO AURORA
# ============================================

if (-not $SkipBackup) {
    Write-Step "FASE 1: Criando backup do Aurora..."
    
    $snapshotId = "operational-dashboard-pre-deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    
    Write-Host "Criando snapshot: $snapshotId"
    
    try {
        aws rds create-db-cluster-snapshot `
            --db-cluster-identifier $AURORA_CLUSTER `
            --db-cluster-snapshot-identifier $snapshotId `
            --region $REGION | Out-Null
        
        Write-Host "Aguardando conclusão do snapshot..."
        aws rds wait db-cluster-snapshot-available `
            --db-cluster-snapshot-identifier $snapshotId `
            --region $REGION
        
        Write-Host "✓ Snapshot criado: $snapshotId" -ForegroundColor Green
        
        # Salvar ID do snapshot para possível rollback
        $snapshotId | Out-File -FilePath "last-snapshot-id.txt"
        
    } catch {
        Write-Error-Step "Falha ao criar snapshot do Aurora"
        Write-Host $_.Exception.Message
        exit 1
    }
} else {
    Write-Warning-Step "FASE 1: Backup do Aurora IGNORADO (--SkipBackup)"
}

# ============================================
# FASE 2: MIGRATIONS DE BANCO DE DADOS
# ============================================

Write-Step "FASE 2: Executando migrations de banco de dados..."

# Obter credenciais do Aurora
Write-Host "Obtendo credenciais do Aurora..."

try {
    $secretJson = aws secretsmanager get-secret-value `
        --secret-id "/alquimista/$ENV_NAME/aurora/credentials" `
        --region $REGION `
        --query SecretString `
        --output text | ConvertFrom-Json
    
    $env:PGHOST = $secretJson.host
    $env:PGUSER = $secretJson.username
    $env:PGPASSWORD = $secretJson.password
    $env:PGDATABASE = "alquimista_platform"
    $env:PGPORT = "5432"
    
    Write-Host "✓ Credenciais obtidas"
    
} catch {
    Write-Error-Step "Falha ao obter credenciais do Aurora"
    Write-Host $_.Exception.Message
    exit 1
}

# Verificar conexão
Write-Host "Verificando conexão com o banco de dados..."
$testConnection = psql -c "SELECT version();" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Error-Step "Falha ao conectar ao banco de dados"
    Write-Host $testConnection
    exit 1
}

Write-Host "✓ Conexão com banco de dados OK"

# Executar migration
Write-Host "Executando migration 015..."

$migrationFile = "database/migrations/015_create_operational_dashboard_tables.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Error-Step "Arquivo de migration não encontrado: $migrationFile"
    exit 1
}

$migrationResult = psql -f $migrationFile 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Error-Step "Falha ao executar migration"
    Write-Host $migrationResult
    exit 1
}

Write-Host "✓ Migration executada com sucesso"

# Verificar tabelas criadas
Write-Host "Verificando tabelas criadas..."
$tables = psql -c "\dt alquimista_platform.*" | Select-String -Pattern "tenant_"

if ($tables.Count -lt 5) {
    Write-Warning-Step "Menos de 5 tabelas encontradas. Verifique manualmente."
} else {
    Write-Host "✓ Tabelas criadas: $($tables.Count)"
}

# ============================================
# FASE 3: CONFIGURAÇÃO DO COGNITO
# ============================================

Write-Step "FASE 3: Configurando grupos no Cognito..."

# Obter User Pool ID
Write-Host "Obtendo User Pool ID..."

$userPoolId = aws cognito-idp list-user-pools `
    --max-results 10 `
    --region $REGION `
    --query "UserPools[?Name=='alquimista-users-$ENV_NAME'].Id" `
    --output text

if ([string]::IsNullOrEmpty($userPoolId)) {
    Write-Error-Step "User Pool não encontrado"
    exit 1
}

Write-Host "✓ User Pool ID: $userPoolId"

# Criar grupos
$groups = @(
    @{Name="INTERNAL_ADMIN"; Description="Administradores internos da AlquimistaAI"; Precedence=1},
    @{Name="INTERNAL_SUPPORT"; Description="Equipe de suporte interno"; Precedence=2},
    @{Name="TENANT_ADMIN"; Description="Administradores de tenant"; Precedence=10},
    @{Name="TENANT_USER"; Description="Usuários de tenant"; Precedence=20}
)

foreach ($group in $groups) {
    Write-Host "Criando grupo: $($group.Name)..."
    
    try {
        aws cognito-idp create-group `
            --user-pool-id $userPoolId `
            --group-name $group.Name `
            --description $group.Description `
            --precedence $group.Precedence `
            --region $REGION 2>&1 | Out-Null
        
        Write-Host "  ✓ Grupo $($group.Name) criado"
        
    } catch {
        if ($_.Exception.Message -like "*GroupExistsException*") {
            Write-Host "  ⚠ Grupo $($group.Name) já existe" -ForegroundColor Yellow
        } else {
            Write-Error-Step "Falha ao criar grupo $($group.Name)"
            Write-Host $_.Exception.Message
        }
    }
}

Write-Host "✓ Grupos do Cognito configurados"

# ============================================
# FASE 4: DEPLOY DO CDK STACK
# ============================================

Write-Step "FASE 4: Deploy do CDK Stack..."

# Compilar TypeScript
Write-Host "Compilando TypeScript..."
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Error-Step "Falha na compilação TypeScript"
    exit 1
}

Write-Host "✓ TypeScript compilado"

# Sintetizar stack
Write-Host "Sintetizando stack..."
cdk synth OperationalDashboardStack-$ENV_NAME --context env=$ENV_NAME

if ($LASTEXITCODE -ne 0) {
    Write-Error-Step "Falha ao sintetizar stack"
    exit 1
}

Write-Host "✓ Stack sintetizado"

# Deploy
Write-Host "Iniciando deploy do stack..."
Write-Host "Isso pode levar 20-30 minutos..."

if ($AutoApprove) {
    cdk deploy OperationalDashboardStack-$ENV_NAME --context env=$ENV_NAME --require-approval never
} else {
    cdk deploy OperationalDashboardStack-$ENV_NAME --context env=$ENV_NAME
}

if ($LASTEXITCODE -ne 0) {
    Write-Error-Step "Falha no deploy do stack"
    exit 1
}

Write-Host "✓ Stack deployado com sucesso" -ForegroundColor Green

# ============================================
# FASE 5: VALIDAÇÃO PÓS-DEPLOY
# ============================================

if (-not $SkipValidation) {
    Write-Step "FASE 5: Validação pós-deploy..."
    
    # Verificar DynamoDB Table
    Write-Host "Verificando DynamoDB Table..."
    $tableStatus = aws dynamodb describe-table `
        --table-name "alquimista-operational-commands-$ENV_NAME" `
        --region $REGION `
        --query "Table.TableStatus" `
        --output text
    
    if ($tableStatus -eq "ACTIVE") {
        Write-Host "✓ DynamoDB Table: ACTIVE"
    } else {
        Write-Warning-Step "DynamoDB Table status: $tableStatus"
    }
    
    # Verificar ElastiCache
    Write-Host "Verificando ElastiCache Redis..."
    $cacheStatus = aws elasticache describe-cache-clusters `
        --cache-cluster-id "alquimista-redis-$ENV_NAME" `
        --region $REGION `
        --query "CacheClusters[0].CacheClusterStatus" `
        --output text 2>$null
    
    if ($cacheStatus -eq "available") {
        Write-Host "✓ ElastiCache Redis: available"
    } else {
        Write-Warning-Step "ElastiCache Redis status: $cacheStatus"
    }
    
    # Listar Lambda Functions
    Write-Host "Verificando Lambda Functions..."
    $lambdas = aws lambda list-functions `
        --region $REGION `
        --query "Functions[?contains(FunctionName, 'operational') && contains(FunctionName, '$ENV_NAME')].FunctionName" `
        --output text
    
    $lambdaCount = ($lambdas -split '\s+').Count
    Write-Host "✓ Lambda Functions encontradas: $lambdaCount"
    
    Write-Host "✓ Validação concluída" -ForegroundColor Green
    
} else {
    Write-Warning-Step "FASE 5: Validação IGNORADA (--SkipValidation)"
}

# ============================================
# CONCLUSÃO
# ============================================

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "DEPLOY CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Ambiente: $ENV_NAME" -ForegroundColor Cyan
Write-Host "Região: $REGION" -ForegroundColor Cyan
Write-Host "Duração: $($duration.ToString('hh\:mm\:ss'))" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Executar smoke tests: .\scripts\smoke-tests-operational-dashboard-prod.ps1"
Write-Host "2. Configurar frontend: .\scripts\configure-frontend-env.ps1 -Environment prod"
Write-Host "3. Monitorar logs no CloudWatch"
Write-Host "4. Criar usuários de teste"
Write-Host ""
Write-Host "Documentação:" -ForegroundColor Yellow
Write-Host "- Runbook: docs/operational-dashboard/PRODUCTION-DEPLOY-RUNBOOK.md"
Write-Host "- API Reference: docs/operational-dashboard/API-ROUTES-REFERENCE.md"
Write-Host "- Troubleshooting: docs/operational-dashboard/TROUBLESHOOTING.md"
Write-Host ""

# Salvar log do deploy
$logFile = "deploy-operational-dashboard-$ENV_NAME-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
@"
Deploy do Painel Operacional AlquimistaAI
Ambiente: $ENV_NAME
Região: $REGION
Início: $startTime
Fim: $endTime
Duração: $($duration.ToString('hh\:mm\:ss'))
Status: SUCESSO
"@ | Out-File -FilePath $logFile

Write-Host "Log salvo em: $logFile" -ForegroundColor Cyan
Write-Host ""
