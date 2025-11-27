# Nigredo Backend Deployment Script
# Deploys Nigredo API Stack with database migrations and health checks
# Requirements: 3.4

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('dev', 'staging', 'prod')]
    [string]$Environment = 'dev',
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipMigrations,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipHealthCheck
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Nigredo Backend Deployment" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# Step 1: Verify Prerequisites
# ============================================================================

Write-Host "[1/5] Verifying prerequisites..." -ForegroundColor Yellow

# Check AWS credentials
Write-Host "  - Checking AWS credentials..." -ForegroundColor Gray
$identity = aws sts get-caller-identity 2>$null | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] AWS credentials not configured!" -ForegroundColor Red
    Write-Host "Run: aws configure" -ForegroundColor Yellow
    exit 1
}
$accountId = $identity.Account
Write-Host "    AWS Account: $accountId" -ForegroundColor Green

# Check Node.js
Write-Host "  - Checking Node.js..." -ForegroundColor Gray
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Node.js not installed!" -ForegroundColor Red
    exit 1
}
Write-Host "    Node.js: $nodeVersion" -ForegroundColor Green

# Check npm dependencies
Write-Host "  - Checking npm dependencies..." -ForegroundColor Gray
if (-not (Test-Path "node_modules")) {
    Write-Host "    Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to install dependencies!" -ForegroundColor Red
        exit 1
    }
}
Write-Host "    Dependencies OK" -ForegroundColor Green

Write-Host "[OK] Prerequisites verified" -ForegroundColor Green
Write-Host ""

# ============================================================================
# Step 2: Build TypeScript
# ============================================================================

Write-Host "[2/5] Building TypeScript..." -ForegroundColor Yellow

npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] TypeScript compilation failed!" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Build completed" -ForegroundColor Green
Write-Host ""

# ============================================================================
# Step 3: Run Database Migrations
# ============================================================================

if (-not $SkipMigrations) {
    Write-Host "[3/5] Running database migrations..." -ForegroundColor Yellow
    
    # Get database credentials from Secrets Manager
    Write-Host "  - Retrieving database credentials..." -ForegroundColor Gray
    $secretName = "fibonacci-db-credentials-$Environment"
    
    try {
        $secretJson = aws secretsmanager get-secret-value --secret-id $secretName --query SecretString --output text 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[WARNING] Could not retrieve database credentials from Secrets Manager" -ForegroundColor Yellow
            Write-Host "          Secret: $secretName" -ForegroundColor Yellow
            Write-Host "          Skipping migrations..." -ForegroundColor Yellow
        } else {
            $secret = $secretJson | ConvertFrom-Json
            
            # Set environment variables for psql
            $env:PGHOST = $secret.host
            $env:PGPORT = $secret.port
            $env:PGDATABASE = $secret.dbname
            $env:PGUSER = $secret.username
            $env:PGPASSWORD = $secret.password
            
            Write-Host "  - Connecting to database..." -ForegroundColor Gray
            Write-Host "    Host: $($secret.host)" -ForegroundColor Gray
            Write-Host "    Database: $($secret.dbname)" -ForegroundColor Gray
            
            # Check if psql is available
            $psqlVersion = psql --version 2>$null
            if ($LASTEXITCODE -ne 0) {
                Write-Host "[WARNING] psql not found. Skipping migrations." -ForegroundColor Yellow
                Write-Host "          Install PostgreSQL client to run migrations automatically." -ForegroundColor Yellow
            } else {
                Write-Host "  - Running migration 007_create_nigredo_schema.sql..." -ForegroundColor Gray
                
                $migrationFile = "database/migrations/007_create_nigredo_schema.sql"
                if (Test-Path $migrationFile) {
                    psql -f $migrationFile 2>&1 | Out-Null
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "    Migration completed successfully" -ForegroundColor Green
                    } else {
                        Write-Host "[WARNING] Migration may have failed or already applied" -ForegroundColor Yellow
                    }
                } else {
                    Write-Host "[WARNING] Migration file not found: $migrationFile" -ForegroundColor Yellow
                }
            }
            
            # Clear sensitive environment variables
            Remove-Item Env:PGHOST -ErrorAction SilentlyContinue
            Remove-Item Env:PGPORT -ErrorAction SilentlyContinue
            Remove-Item Env:PGDATABASE -ErrorAction SilentlyContinue
            Remove-Item Env:PGUSER -ErrorAction SilentlyContinue
            Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
        }
    } catch {
        Write-Host "[WARNING] Error during migration: $_" -ForegroundColor Yellow
        Write-Host "          Continuing with deployment..." -ForegroundColor Yellow
    }
    
    Write-Host "[OK] Migration step completed" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "[3/5] Skipping database migrations (--SkipMigrations flag)" -ForegroundColor Yellow
    Write-Host ""
}

# ============================================================================
# Step 4: Deploy Nigredo Stack with CDK
# ============================================================================

Write-Host "[4/5] Deploying Nigredo Stack..." -ForegroundColor Yellow
Write-Host "  This may take 10-15 minutes..." -ForegroundColor Gray
Write-Host ""

# First, ensure Fibonacci stack is deployed (dependency)
Write-Host "  - Checking Fibonacci stack..." -ForegroundColor Gray
$fibonacciStack = aws cloudformation describe-stacks --stack-name "FibonacciStack-$Environment" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Fibonacci stack not found!" -ForegroundColor Red
    Write-Host "        Deploy Fibonacci stack first: npm run deploy:$Environment" -ForegroundColor Yellow
    exit 1
}
Write-Host "    Fibonacci stack found" -ForegroundColor Green

# Deploy Nigredo stack
Write-Host "  - Deploying NigredoStack-$Environment..." -ForegroundColor Gray
npx cdk deploy "NigredoStack-$Environment" --require-approval never --context env=$Environment

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERROR] Nigredo stack deployment failed!" -ForegroundColor Red
    Write-Host "Check the error messages above for details" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "[OK] Nigredo stack deployed successfully" -ForegroundColor Green
Write-Host ""

# ============================================================================
# Step 5: Verify Deployment with Health Checks
# ============================================================================

if (-not $SkipHealthCheck) {
    Write-Host "[5/5] Verifying deployment..." -ForegroundColor Yellow
    
    # Get stack outputs
    Write-Host "  - Retrieving stack outputs..." -ForegroundColor Gray
    $stackOutputs = aws cloudformation describe-stacks --stack-name "NigredoStack-$Environment" --query "Stacks[0].Outputs" 2>$null | ConvertFrom-Json
    
    if ($LASTEXITCODE -eq 0 -and $stackOutputs) {
        Write-Host ""
        Write-Host "  Stack Outputs:" -ForegroundColor Cyan
        Write-Host "  ============================================" -ForegroundColor Cyan
        
        foreach ($output in $stackOutputs) {
            Write-Host "  $($output.OutputKey): $($output.OutputValue)" -ForegroundColor White
        }
        
        Write-Host ""
        
        # Save outputs to file
        $outputFile = "nigredo-backend-outputs-$Environment.json"
        $stackOutputs | ConvertTo-Json -Depth 10 | Out-File -FilePath $outputFile -Encoding UTF8
        Write-Host "  - Outputs saved to: $outputFile" -ForegroundColor Green
        
        # Check Lambda functions
        Write-Host ""
        Write-Host "  - Checking Lambda functions..." -ForegroundColor Gray
        
        $lambdaFunctions = @(
            "nigredo-recebimento-$Environment",
            "nigredo-estrategia-$Environment",
            "nigredo-disparo-$Environment",
            "nigredo-atendimento-$Environment",
            "nigredo-sentimento-$Environment",
            "nigredo-agendamento-$Environment"
        )
        
        $allHealthy = $true
        foreach ($functionName in $lambdaFunctions) {
            $function = aws lambda get-function --function-name $functionName 2>$null | ConvertFrom-Json
            if ($LASTEXITCODE -eq 0) {
                $state = $function.Configuration.State
                if ($state -eq "Active") {
                    Write-Host "    ✓ $functionName : Active" -ForegroundColor Green
                } else {
                    Write-Host "    ✗ $functionName : $state" -ForegroundColor Yellow
                    $allHealthy = $false
                }
            } else {
                Write-Host "    ✗ $functionName : Not found" -ForegroundColor Red
                $allHealthy = $false
            }
        }
        
        Write-Host ""
        
        # Check SQS queues
        Write-Host "  - Checking SQS queues..." -ForegroundColor Gray
        
        $queueNames = @(
            "nigredo-recebimento-$Environment",
            "nigredo-estrategia-$Environment",
            "nigredo-disparo-$Environment",
            "nigredo-atendimento-$Environment",
            "nigredo-sentimento-$Environment",
            "nigredo-agendamento-$Environment",
            "nigredo-relatorios-$Environment",
            "nigredo-dlq-$Environment"
        )
        
        foreach ($queueName in $queueNames) {
            $queueUrl = aws sqs get-queue-url --queue-name $queueName 2>$null | ConvertFrom-Json
            if ($LASTEXITCODE -eq 0) {
                Write-Host "    ✓ $queueName" -ForegroundColor Green
            } else {
                Write-Host "    ✗ $queueName : Not found" -ForegroundColor Red
                $allHealthy = $false
            }
        }
        
        Write-Host ""
        
        if ($allHealthy) {
            Write-Host "[OK] All health checks passed" -ForegroundColor Green
        } else {
            Write-Host "[WARNING] Some health checks failed" -ForegroundColor Yellow
            Write-Host "          Review the output above for details" -ForegroundColor Yellow
        }
    } else {
        Write-Host "[WARNING] Could not retrieve stack outputs" -ForegroundColor Yellow
    }
    
    Write-Host ""
} else {
    Write-Host "[5/5] Skipping health checks (--SkipHealthCheck flag)" -ForegroundColor Yellow
    Write-Host ""
}

# ============================================================================
# Deployment Complete
# ============================================================================

Write-Host "========================================" -ForegroundColor Green
Write-Host "Nigredo Backend Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Review the stack outputs above" -ForegroundColor White
Write-Host "  2. Deploy the frontend: .\scripts\deploy-nigredo-frontend.ps1 -Environment $Environment" -ForegroundColor White
Write-Host "  3. Test the API endpoints" -ForegroundColor White
Write-Host ""
Write-Host "For full deployment (backend + frontend):" -ForegroundColor Cyan
Write-Host "  .\scripts\deploy-nigredo-full.ps1 -Environment $Environment" -ForegroundColor White
Write-Host ""
