# Nigredo Deployment Verification Script
# Quick verification of Nigredo deployment status

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('dev', 'staging', 'prod')]
    [string]$Environment = 'dev'
)

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Nigredo Deployment Verification" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allHealthy = $true

# Check Nigredo Stack
Write-Host "[1/5] Checking Nigredo Stack..." -ForegroundColor Yellow
$nigredoStack = aws cloudformation describe-stacks --stack-name "NigredoStack-$Environment" 2>$null | ConvertFrom-Json
if ($LASTEXITCODE -eq 0) {
    $status = $nigredoStack.Stacks[0].StackStatus
    if ($status -match 'COMPLETE') {
        Write-Host "  [OK] Stack Status: $status" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Stack Status: $status" -ForegroundColor Red
        $allHealthy = $false
    }
} else {
    Write-Host "  [FAIL] Stack not found" -ForegroundColor Red
    $allHealthy = $false
}
Write-Host ""

# Check Frontend Stack
Write-Host "[2/5] Checking Frontend Stack..." -ForegroundColor Yellow
$frontendStack = aws cloudformation describe-stacks --stack-name "NigredoFrontendStack-$Environment" 2>$null | ConvertFrom-Json
if ($LASTEXITCODE -eq 0) {
    $status = $frontendStack.Stacks[0].StackStatus
    if ($status -match 'COMPLETE') {
        Write-Host "  [OK] Stack Status: $status" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Stack Status: $status" -ForegroundColor Red
        $allHealthy = $false
    }
} else {
    Write-Host "  [FAIL] Stack not found" -ForegroundColor Red
    $allHealthy = $false
}
Write-Host ""

# Check Lambda Functions
Write-Host "[3/5] Checking Lambda Functions..." -ForegroundColor Yellow
$lambdaFunctions = @(
    "create-lead-$Environment",
    "list-leads-$Environment",
    "get-lead-$Environment"
)

$lambdaHealthy = $true
foreach ($functionName in $lambdaFunctions) {
    $function = aws lambda get-function --function-name $functionName 2>$null | ConvertFrom-Json
    if ($LASTEXITCODE -eq 0) {
        $state = $function.Configuration.State
        if ($state -eq "Active") {
            Write-Host "  [OK] $functionName" -ForegroundColor Green
        } else {
            Write-Host "  [FAIL] $functionName : $state" -ForegroundColor Red
            $lambdaHealthy = $false
        }
    } else {
        Write-Host "  [FAIL] $functionName : Not found" -ForegroundColor Red
        $lambdaHealthy = $false
    }
}

if (-not $lambdaHealthy) {
    $allHealthy = $false
}
Write-Host ""

# Check API Gateway
Write-Host "[4/5] Checking API Gateway..." -ForegroundColor Yellow
if ($nigredoStack) {
    $apiUrl = ($nigredoStack.Stacks[0].Outputs | Where-Object { $_.OutputKey -eq 'NigredoApiUrl' }).OutputValue
    if ($apiUrl) {
        Write-Host "  [OK] API URL: $apiUrl" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] API URL not found in outputs" -ForegroundColor Red
        $allHealthy = $false
    }
} else {
    Write-Host "  [FAIL] Cannot check API (stack not found)" -ForegroundColor Red
}
Write-Host ""

# Check CloudFront Distribution
Write-Host "[5/5] Checking CloudFront Distribution..." -ForegroundColor Yellow
if ($frontendStack) {
    $distributionUrl = ($frontendStack.Stacks[0].Outputs | Where-Object { $_.OutputKey -eq 'NigredoDistributionUrl' }).OutputValue
    $distributionId = ($frontendStack.Stacks[0].Outputs | Where-Object { $_.OutputKey -eq 'NigredoDistributionId' }).OutputValue
    
    if ($distributionUrl -and $distributionId) {
        Write-Host "  [OK] Distribution URL: $distributionUrl" -ForegroundColor Green
        Write-Host "  [OK] Distribution ID: $distributionId" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Distribution info not found in outputs" -ForegroundColor Red
        $allHealthy = $false
    }
} else {
    Write-Host "  [FAIL] Cannot check CloudFront (stack not found)" -ForegroundColor Red
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
if ($allHealthy) {
    Write-Host "Deployment Status: HEALTHY" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "All systems operational. Ready for integration testing." -ForegroundColor Green
    exit 0
} else {
    Write-Host "Deployment Status: ISSUES FOUND" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please review the issues above and redeploy if necessary." -ForegroundColor Yellow
    exit 1
}
