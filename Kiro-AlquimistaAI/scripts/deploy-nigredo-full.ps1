# Nigredo Full Deployment Script
# Deploys both backend (API + Agents) and frontend (Landing Pages)
# Requirements: 3.4, 3.5

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('dev', 'staging', 'prod')]
    [string]$Environment = 'dev',
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBackend,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipFrontend,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipSmokeTests
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Nigredo Full System Deployment" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$startTime = Get-Date

# ============================================================================
# Pre-Deployment Checks
# ============================================================================

Write-Host "Pre-deployment checks..." -ForegroundColor Yellow
Write-Host ""

# Check AWS credentials
Write-Host "  - Verifying AWS credentials..." -ForegroundColor Gray
$identity = aws sts get-caller-identity 2>$null | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] AWS credentials not configured!" -ForegroundColor Red
    Write-Host "Run: aws configure" -ForegroundColor Yellow
    exit 1
}
Write-Host "    Account: $($identity.Account)" -ForegroundColor Green
Write-Host "    Region: $(aws configure get region)" -ForegroundColor Green

# Check if scripts exist
Write-Host "  - Checking deployment scripts..." -ForegroundColor Gray
if (-not (Test-Path "scripts/deploy-nigredo-backend.ps1")) {
    Write-Host "[ERROR] Backend deployment script not found!" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path "scripts/deploy-nigredo-frontend.ps1")) {
    Write-Host "[ERROR] Frontend deployment script not found!" -ForegroundColor Red
    exit 1
}
Write-Host "    Scripts found" -ForegroundColor Green

Write-Host ""
Write-Host "[OK] Pre-deployment checks passed" -ForegroundColor Green
Write-Host ""

# Confirmation prompt for production
if ($Environment -eq 'prod') {
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "WARNING: Production Deployment" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You are about to deploy to PRODUCTION environment." -ForegroundColor Yellow
    Write-Host "This will affect live users and data." -ForegroundColor Yellow
    Write-Host ""
    $confirmation = Read-Host "Type 'DEPLOY' to continue or anything else to cancel"
    
    if ($confirmation -ne 'DEPLOY') {
        Write-Host ""
        Write-Host "Deployment cancelled by user" -ForegroundColor Yellow
        exit 0
    }
    Write-Host ""
}

# ============================================================================
# Step 1: Deploy Backend (API + Agents + Database)
# ============================================================================

if (-not $SkipBackend) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Step 1: Backend Deployment" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    $backendStartTime = Get-Date
    
    # Run backend deployment script
    & ".\scripts\deploy-nigredo-backend.ps1" -Environment $Environment
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "[ERROR] Backend deployment failed!" -ForegroundColor Red
        Write-Host "Aborting full deployment" -ForegroundColor Yellow
        exit 1
    }
    
    $backendDuration = (Get-Date) - $backendStartTime
    Write-Host ""
    Write-Host "[OK] Backend deployed in $($backendDuration.ToString('mm\:ss'))" -ForegroundColor Green
    Write-Host ""
    
    # Wait a moment for resources to stabilize
    Write-Host "Waiting 10 seconds for resources to stabilize..." -ForegroundColor Gray
    Start-Sleep -Seconds 10
    Write-Host ""
} else {
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "Step 1: Backend Deployment (SKIPPED)" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
}

# ============================================================================
# Step 2: Deploy Frontend (Landing Pages + CloudFront)
# ============================================================================

if (-not $SkipFrontend) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Step 2: Frontend Deployment" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    $frontendStartTime = Get-Date
    
    # Check if frontend stack exists, if not deploy it first
    $frontendStackName = "NigredoFrontendStack-$Environment"
    $frontendStack = aws cloudformation describe-stacks --stack-name $frontendStackName 2>$null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Frontend stack not found. Deploying infrastructure first..." -ForegroundColor Yellow
        Write-Host ""
        
        npx cdk deploy $frontendStackName --require-approval never --context env=$Environment
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host ""
            Write-Host "[ERROR] Frontend stack deployment failed!" -ForegroundColor Red
            exit 1
        }
        
        Write-Host ""
        Write-Host "[OK] Frontend infrastructure deployed" -ForegroundColor Green
        Write-Host ""
    }
    
    # Run frontend deployment script
    & ".\scripts\deploy-nigredo-frontend.ps1" -Environment $Environment
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "[ERROR] Frontend deployment failed!" -ForegroundColor Red
        Write-Host "Backend is deployed, but frontend deployment failed" -ForegroundColor Yellow
        exit 1
    }
    
    $frontendDuration = (Get-Date) - $frontendStartTime
    Write-Host ""
    Write-Host "[OK] Frontend deployed in $($frontendDuration.ToString('mm\:ss'))" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "Step 2: Frontend Deployment (SKIPPED)" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
}

# ============================================================================
# Step 3: Run Smoke Tests
# ============================================================================

if (-not $SkipSmokeTests) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Step 3: Smoke Tests" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    $allTestsPassed = $true
    
    # Test 1: Check Lambda functions are active
    Write-Host "[Test 1/5] Checking Lambda functions..." -ForegroundColor Yellow
    
    $lambdaFunctions = @(
        "nigredo-recebimento-$Environment",
        "nigredo-estrategia-$Environment",
        "nigredo-disparo-$Environment",
        "nigredo-atendimento-$Environment",
        "nigredo-sentimento-$Environment",
        "nigredo-agendamento-$Environment"
    )
    
    $lambdaHealthy = $true
    foreach ($functionName in $lambdaFunctions) {
        $function = aws lambda get-function --function-name $functionName 2>$null | ConvertFrom-Json
        if ($LASTEXITCODE -eq 0 -and $function.Configuration.State -eq "Active") {
            Write-Host "  ✓ $functionName" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $functionName" -ForegroundColor Red
            $lambdaHealthy = $false
            $allTestsPassed = $false
        }
    }
    
    if ($lambdaHealthy) {
        Write-Host "[OK] All Lambda functions are active" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Some Lambda functions are not active" -ForegroundColor Red
    }
    Write-Host ""
    
    # Test 2: Check SQS queues exist
    Write-Host "[Test 2/5] Checking SQS queues..." -ForegroundColor Yellow
    
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
    
    $queuesHealthy = $true
    foreach ($queueName in $queueNames) {
        $queueUrl = aws sqs get-queue-url --queue-name $queueName 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ $queueName" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $queueName" -ForegroundColor Red
            $queuesHealthy = $false
            $allTestsPassed = $false
        }
    }
    
    if ($queuesHealthy) {
        Write-Host "[OK] All SQS queues exist" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Some SQS queues are missing" -ForegroundColor Red
    }
    Write-Host ""
    
    # Test 3: Check EventBridge rules
    Write-Host "[Test 3/5] Checking EventBridge rules..." -ForegroundColor Yellow
    
    $ruleNames = @(
        "nigredo-recebimento-$Environment",
        "nigredo-estrategia-$Environment",
        "nigredo-disparo-$Environment",
        "nigredo-atendimento-$Environment",
        "nigredo-sentimento-$Environment",
        "nigredo-agendamento-$Environment",
        "nigredo-relatorios-$Environment"
    )
    
    $rulesHealthy = $true
    foreach ($ruleName in $ruleNames) {
        $rule = aws events describe-rule --name $ruleName 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ $ruleName" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $ruleName" -ForegroundColor Red
            $rulesHealthy = $false
            $allTestsPassed = $false
        }
    }
    
    if ($rulesHealthy) {
        Write-Host "[OK] All EventBridge rules exist" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Some EventBridge rules are missing" -ForegroundColor Red
    }
    Write-Host ""
    
    # Test 4: Check CloudFront distribution
    Write-Host "[Test 4/5] Checking CloudFront distribution..." -ForegroundColor Yellow
    
    $frontendStack = aws cloudformation describe-stacks --stack-name "NigredoFrontendStack-$Environment" 2>$null | ConvertFrom-Json
    if ($LASTEXITCODE -eq 0) {
        $distributionId = ($frontendStack.Stacks[0].Outputs | Where-Object { $_.OutputKey -eq 'NigredoDistributionId' }).OutputValue
        
        if ($distributionId) {
            $distribution = aws cloudfront get-distribution --id $distributionId 2>$null | ConvertFrom-Json
            if ($LASTEXITCODE -eq 0) {
                $status = $distribution.Distribution.Status
                if ($status -eq "Deployed") {
                    Write-Host "  ✓ Distribution $distributionId : $status" -ForegroundColor Green
                    Write-Host "[OK] CloudFront distribution is deployed" -ForegroundColor Green
                } else {
                    Write-Host "  ⚠ Distribution $distributionId : $status" -ForegroundColor Yellow
                    Write-Host "[WARNING] CloudFront distribution is not fully deployed yet" -ForegroundColor Yellow
                }
            } else {
                Write-Host "  ✗ Could not retrieve distribution status" -ForegroundColor Red
                Write-Host "[FAIL] CloudFront distribution check failed" -ForegroundColor Red
                $allTestsPassed = $false
            }
        } else {
            Write-Host "  ✗ Distribution ID not found in stack outputs" -ForegroundColor Red
            Write-Host "[FAIL] CloudFront distribution not found" -ForegroundColor Red
            $allTestsPassed = $false
        }
    } else {
        Write-Host "  ✗ Frontend stack not found" -ForegroundColor Red
        Write-Host "[FAIL] Frontend stack check failed" -ForegroundColor Red
        $allTestsPassed = $false
    }
    Write-Host ""
    
    # Test 5: Check S3 bucket
    Write-Host "[Test 5/5] Checking S3 bucket..." -ForegroundColor Yellow
    
    if ($frontendStack) {
        $bucketName = ($frontendStack.Stacks[0].Outputs | Where-Object { $_.OutputKey -eq 'NigredoSiteBucketName' }).OutputValue
        
        if ($bucketName) {
            $indexCheck = aws s3 ls "s3://$bucketName/index.html" 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  ✓ Bucket $bucketName contains index.html" -ForegroundColor Green
                Write-Host "[OK] S3 bucket is properly configured" -ForegroundColor Green
            } else {
                Write-Host "  ✗ index.html not found in bucket" -ForegroundColor Red
                Write-Host "[FAIL] S3 bucket check failed" -ForegroundColor Red
                $allTestsPassed = $false
            }
        } else {
            Write-Host "  ✗ Bucket name not found in stack outputs" -ForegroundColor Red
            Write-Host "[FAIL] S3 bucket not found" -ForegroundColor Red
            $allTestsPassed = $false
        }
    }
    Write-Host ""
    
    # Summary
    if ($allTestsPassed) {
        Write-Host "[OK] All smoke tests passed" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Some smoke tests failed" -ForegroundColor Yellow
        Write-Host "          Review the output above for details" -ForegroundColor Yellow
    }
    Write-Host ""
} else {
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "Step 3: Smoke Tests (SKIPPED)" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
}

# ============================================================================
# Deployment Summary
# ============================================================================

$totalDuration = (Get-Date) - $startTime

Write-Host "========================================" -ForegroundColor Green
Write-Host "Nigredo Full Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host "Total Duration: $($totalDuration.ToString('mm\:ss'))" -ForegroundColor Cyan
Write-Host ""

# Display URLs and important information
Write-Host "Deployment Information:" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host ""

# Get stack outputs
$nigredoStack = aws cloudformation describe-stacks --stack-name "NigredoStack-$Environment" 2>$null | ConvertFrom-Json
$frontendStack = aws cloudformation describe-stacks --stack-name "NigredoFrontendStack-$Environment" 2>$null | ConvertFrom-Json

if ($nigredoStack) {
    Write-Host "Backend (Nigredo Stack):" -ForegroundColor Yellow
    foreach ($output in $nigredoStack.Stacks[0].Outputs) {
        if ($output.OutputKey -match 'Url|Arn|Name') {
            Write-Host "  $($output.OutputKey): $($output.OutputValue)" -ForegroundColor White
        }
    }
    Write-Host ""
}

if ($frontendStack) {
    Write-Host "Frontend (Nigredo Frontend Stack):" -ForegroundColor Yellow
    foreach ($output in $frontendStack.Stacks[0].Outputs) {
        Write-Host "  $($output.OutputKey): $($output.OutputValue)" -ForegroundColor White
    }
    Write-Host ""
}

# Save outputs to file
$outputFile = "nigredo-deployment-outputs-$Environment.json"
$allOutputs = @{
    environment = $Environment
    deploymentTime = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
    duration = $totalDuration.ToString('mm\:ss')
    backend = @{}
    frontend = @{}
}

if ($nigredoStack) {
    foreach ($output in $nigredoStack.Stacks[0].Outputs) {
        $allOutputs.backend[$output.OutputKey] = $output.OutputValue
    }
}

if ($frontendStack) {
    foreach ($output in $frontendStack.Stacks[0].Outputs) {
        $allOutputs.frontend[$output.OutputKey] = $output.OutputValue
    }
}

$allOutputs | ConvertTo-Json -Depth 10 | Out-File -FilePath $outputFile -Encoding UTF8
Write-Host "Deployment outputs saved to: $outputFile" -ForegroundColor Green
Write-Host ""

# Next steps
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "==========" -ForegroundColor Cyan
Write-Host "  1. Wait 5-10 minutes for CloudFront cache to propagate" -ForegroundColor White
Write-Host "  2. Visit the frontend URL to test the landing page" -ForegroundColor White
Write-Host "  3. Test form submission functionality" -ForegroundColor White
Write-Host "  4. Monitor CloudWatch logs for any errors" -ForegroundColor White
Write-Host "  5. Check CloudWatch dashboards for metrics" -ForegroundColor White
Write-Host ""

Write-Host "Monitoring Commands:" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host "  # View Lambda logs" -ForegroundColor Gray
Write-Host "  aws logs tail /aws/lambda/nigredo-recebimento-$Environment --follow" -ForegroundColor Gray
Write-Host ""
Write-Host "  # Check SQS queue depth" -ForegroundColor Gray
Write-Host "  aws sqs get-queue-attributes --queue-url [QUEUE-URL] --attribute-names ApproximateNumberOfMessages" -ForegroundColor Gray
Write-Host ""
Write-Host "  # View CloudWatch alarms" -ForegroundColor Gray
Write-Host "  aws cloudwatch describe-alarms --alarm-name-prefix Nigredo-$Environment" -ForegroundColor Gray
Write-Host ""

if ($Environment -eq 'prod') {
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "PRODUCTION DEPLOYMENT COMPLETE" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please monitor the system closely for the next 24 hours." -ForegroundColor Yellow
    Write-Host "Check CloudWatch alarms and logs regularly." -ForegroundColor Yellow
    Write-Host ""
}
