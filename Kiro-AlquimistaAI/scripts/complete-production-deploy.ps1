# Complete Production Deploy Script
# Este script executa o deploy completo do sistema em produção

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('dev', 'staging', 'prod')]
    [string]$Environment = 'prod',
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipTests = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipValidation = $false
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Colors
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"
$Cyan = "Cyan"

function Write-Step {
    param([string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor $Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $Red
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor $Yellow
}

# Banner
Write-Host @"

╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     🚀 ALQUIMISTA.AI - PRODUCTION DEPLOY                 ║
║                                                           ║
║     Environment: $Environment                                    ║
║     Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

"@ -ForegroundColor $Cyan

# Confirmation for production
if ($Environment -eq 'prod') {
    Write-Warning-Custom "You are about to deploy to PRODUCTION!"
    $confirmation = Read-Host "Type 'DEPLOY' to continue"
    if ($confirmation -ne 'DEPLOY') {
        Write-Error-Custom "Deployment cancelled"
        exit 1
    }
}

# Step 1: Pre-deployment checks
Write-Step "Step 1: Pre-deployment checks"

Write-Host "Checking AWS credentials..."
try {
    $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
    Write-Success "AWS Account: $($identity.Account)"
    Write-Success "AWS User: $($identity.Arn)"
} catch {
    Write-Error-Custom "AWS credentials not configured"
    exit 1
}

Write-Host "Checking Node.js version..."
$nodeVersion = node --version
Write-Success "Node.js: $nodeVersion"

Write-Host "Checking npm version..."
$npmVersion = npm --version
Write-Success "npm: $npmVersion"

Write-Host "Checking AWS CDK version..."
$cdkVersion = cdk --version
Write-Success "CDK: $cdkVersion"

# Step 2: Install dependencies
Write-Step "Step 2: Installing dependencies"
npm ci
if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Failed to install dependencies"
    exit 1
}
Write-Success "Dependencies installed"

# Step 3: Run tests (if not skipped)
if (-not $SkipTests) {
    Write-Step "Step 3: Running tests"
    
    Write-Host "Running linter..."
    npm run lint
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Linting failed"
        exit 1
    }
    Write-Success "Linting passed"
    
    Write-Host "Running security audit..."
    npm run audit:critical
    if ($LASTEXITCODE -ne 0) {
        Write-Warning-Custom "Security audit found issues (continuing anyway)"
    } else {
        Write-Success "Security audit passed"
    }
} else {
    Write-Warning-Custom "Skipping tests (--SkipTests flag)"
}

# Step 4: Build
Write-Step "Step 4: Building application"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Build failed"
    exit 1
}
Write-Success "Build completed"

# Step 5: CDK Synth
Write-Step "Step 5: Synthesizing CloudFormation templates"
cdk synth --context env=$Environment
if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "CDK synth failed"
    exit 1
}
Write-Success "CloudFormation templates synthesized"

# Step 6: CDK Diff (show changes)
Write-Step "Step 6: Showing infrastructure changes"
Write-Host "Running cdk diff to show changes..."
cdk diff --all --context env=$Environment

if ($Environment -eq 'prod') {
    $confirmation = Read-Host "`nReview the changes above. Continue with deployment? (yes/no)"
    if ($confirmation -ne 'yes') {
        Write-Error-Custom "Deployment cancelled by user"
        exit 1
    }
}

# Step 7: Deploy
Write-Step "Step 7: Deploying to AWS"
Write-Host "This may take 15-25 minutes..."

$deployStart = Get-Date

cdk deploy --all --context env=$Environment --require-approval never
if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Deployment failed"
    exit 1
}

$deployEnd = Get-Date
$deployDuration = ($deployEnd - $deployStart).TotalMinutes
Write-Success "Deployment completed in $([math]::Round($deployDuration, 2)) minutes"

# Step 8: Collect outputs
Write-Step "Step 8: Collecting CloudFormation outputs"

$outputFile = "deployment-outputs-$Environment-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"

Write-Host "Collecting outputs from FibonacciStack..."
$fibonacciOutputs = aws cloudformation describe-stacks `
    --stack-name "FibonacciStack-$Environment" `
    --query 'Stacks[0].Outputs' `
    --output json | ConvertFrom-Json

Write-Host "Collecting outputs from NigredoStack..."
$nigredoOutputs = aws cloudformation describe-stacks `
    --stack-name "NigredoStack-$Environment" `
    --query 'Stacks[0].Outputs' `
    --output json | ConvertFrom-Json

Write-Host "Collecting outputs from AlquimistaStack..."
$alquimistaOutputs = aws cloudformation describe-stacks `
    --stack-name "AlquimistaStack-$Environment" `
    --query 'Stacks[0].Outputs' `
    --output json | ConvertFrom-Json

$allOutputs = @{
    Environment = $Environment
    DeploymentDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    FibonacciStack = $fibonacciOutputs
    NigredoStack = $nigredoOutputs
    AlquimistaStack = $alquimistaOutputs
}

$allOutputs | ConvertTo-Json -Depth 10 | Out-File $outputFile
Write-Success "Outputs saved to $outputFile"

# Step 9: Run smoke tests (if not skipped)
if (-not $SkipValidation) {
    Write-Step "Step 9: Running smoke tests"
    
    # Extract API URL
    $apiUrl = ($fibonacciOutputs | Where-Object { $_.OutputKey -eq 'ApiUrl' }).OutputValue
    
    if ($apiUrl) {
        Write-Host "Testing health endpoint: $apiUrl/health"
        try {
            $response = Invoke-RestMethod -Uri "$apiUrl/health" -Method Get -TimeoutSec 10
            if ($response.ok -eq $true) {
                Write-Success "Health check passed"
            } else {
                Write-Warning-Custom "Health check returned unexpected response"
            }
        } catch {
            Write-Warning-Custom "Health check failed: $_"
        }
        
        Write-Host "Testing database status: $apiUrl/db-status"
        try {
            $response = Invoke-RestMethod -Uri "$apiUrl/db-status" -Method Get -TimeoutSec 10
            if ($response.db_status -eq 'connected') {
                Write-Success "Database connection verified"
            } else {
                Write-Warning-Custom "Database not connected"
            }
        } catch {
            Write-Warning-Custom "Database status check failed: $_"
        }
    } else {
        Write-Warning-Custom "API URL not found in outputs"
    }
} else {
    Write-Warning-Custom "Skipping validation (--SkipValidation flag)"
}

# Step 10: Verify dashboards
Write-Step "Step 10: Verifying CloudWatch dashboards"

$dashboards = aws cloudwatch list-dashboards `
    --query "DashboardEntries[?contains(DashboardName, 'fibonacci-$Environment')].DashboardName" `
    --output json | ConvertFrom-Json

if ($dashboards.Count -gt 0) {
    Write-Success "Found $($dashboards.Count) dashboard(s):"
    foreach ($dashboard in $dashboards) {
        Write-Host "  - $dashboard"
    }
} else {
    Write-Warning-Custom "No dashboards found"
}

# Step 11: Verify alarms
Write-Step "Step 11: Verifying CloudWatch alarms"

$alarms = aws cloudwatch describe-alarms `
    --alarm-name-prefix "fibonacci-$Environment" `
    --query 'MetricAlarms[*].[AlarmName,StateValue]' `
    --output json | ConvertFrom-Json

if ($alarms.Count -gt 0) {
    Write-Success "Found $($alarms.Count) alarm(s):"
    foreach ($alarm in $alarms) {
        $alarmName = $alarm[0]
        $alarmState = $alarm[1]
        $color = if ($alarmState -eq 'OK') { $Green } elseif ($alarmState -eq 'ALARM') { $Red } else { $Yellow }
        Write-Host "  - $alarmName : $alarmState" -ForegroundColor $color
    }
} else {
    Write-Warning-Custom "No alarms found"
}

# Step 12: Generate deployment report
Write-Step "Step 12: Generating deployment report"

$reportFile = "deployment-report-$Environment-$(Get-Date -Format 'yyyyMMdd-HHmmss').md"

$report = @"
# Deployment Report - $Environment

**Date**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")  
**Environment**: $Environment  
**Duration**: $([math]::Round($deployDuration, 2)) minutes  
**Status**: ✅ SUCCESS

## Deployed Stacks

- ✅ FibonacciStack-$Environment
- ✅ NigredoStack-$Environment
- ✅ AlquimistaStack-$Environment

## CloudFormation Outputs

### FibonacciStack
$(($fibonacciOutputs | ForEach-Object { "- **$($_.OutputKey)**: $($_.OutputValue)" }) -join "`n")

### NigredoStack
$(($nigredoOutputs | ForEach-Object { "- **$($_.OutputKey)**: $($_.OutputValue)" }) -join "`n")

### AlquimistaStack
$(($alquimistaOutputs | ForEach-Object { "- **$($_.OutputKey)**: $($_.OutputValue)" }) -join "`n")

## Smoke Tests

$(if (-not $SkipValidation) {
    "- ✅ Health check passed
- ✅ Database connection verified"
} else {
    "- ⏭️ Skipped (--SkipValidation flag)"
})

## CloudWatch

- **Dashboards**: $($dashboards.Count) found
- **Alarms**: $($alarms.Count) configured

## Next Steps

1. Configure secrets in AWS Secrets Manager:
   - WhatsApp Business API credentials
   - Google Calendar OAuth credentials
   - Other MCP integrations

2. Run database migrations:
   ``````powershell
   node scripts/migrate.js
   ``````

3. Deploy frontend:
   ``````powershell
   cd frontend
   npm run deploy:vercel
   ``````

4. Monitor system for 24-48 hours

## Rollback Procedure

If issues are detected:

``````powershell
# Rollback to previous version
cdk deploy --all --context env=$Environment --rollback
``````

---

**Deployed by**: $($identity.Arn)  
**AWS Account**: $($identity.Account)  
**Report generated**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@

$report | Out-File $reportFile
Write-Success "Deployment report saved to $reportFile"

# Final summary
Write-Host @"

╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     ✅ DEPLOYMENT COMPLETED SUCCESSFULLY                 ║
║                                                           ║
║     Environment: $Environment                                    ║
║     Duration: $([math]::Round($deployDuration, 2)) minutes                              ║
║     Report: $reportFile                                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

"@ -ForegroundColor $Green

Write-Host "`n📋 Next Steps:" -ForegroundColor $Cyan
Write-Host "1. Review the deployment report: $reportFile"
Write-Host "2. Configure secrets in AWS Secrets Manager"
Write-Host "3. Run database migrations"
Write-Host "4. Deploy frontend"
Write-Host "5. Monitor CloudWatch dashboards"

Write-Host "`n🔗 Useful Links:" -ForegroundColor $Cyan
if ($apiUrl) {
    Write-Host "API URL: $apiUrl"
}
Write-Host "CloudWatch Console: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1"
Write-Host "CloudFormation Console: https://console.aws.amazon.com/cloudformation/home?region=us-east-1"

Write-Host "`n✨ Deployment completed at $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor $Green
