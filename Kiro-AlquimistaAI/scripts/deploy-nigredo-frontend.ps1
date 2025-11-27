# Nigredo Frontend Deployment Script
# Builds Next.js application and deploys to S3 + CloudFront
# Requirements: 3.5

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('dev', 'staging', 'prod')]
    [string]$Environment = 'dev',
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBuild,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipInvalidation
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Nigredo Frontend Deployment" -ForegroundColor Cyan
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

# Check if frontend directory exists
Write-Host "  - Checking frontend directory..." -ForegroundColor Gray
if (-not (Test-Path "frontend")) {
    Write-Host "[ERROR] Frontend directory not found!" -ForegroundColor Red
    exit 1
}
Write-Host "    Frontend directory found" -ForegroundColor Green

# Check Node.js
Write-Host "  - Checking Node.js..." -ForegroundColor Gray
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Node.js not installed!" -ForegroundColor Red
    exit 1
}
Write-Host "    Node.js: $nodeVersion" -ForegroundColor Green

# Check if Nigredo Frontend Stack is deployed
Write-Host "  - Checking Nigredo Frontend Stack..." -ForegroundColor Gray
$stackName = "NigredoFrontendStack-$Environment"
$stack = aws cloudformation describe-stacks --stack-name $stackName 2>$null | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Nigredo Frontend Stack not found!" -ForegroundColor Red
    Write-Host "        Deploy the stack first: npx cdk deploy $stackName --context env=$Environment" -ForegroundColor Yellow
    exit 1
}
Write-Host "    Stack found: $stackName" -ForegroundColor Green

# Get stack outputs
$outputs = @{}
foreach ($output in $stack.Stacks[0].Outputs) {
    $outputs[$output.OutputKey] = $output.OutputValue
}

$bucketName = $outputs['NigredoSiteBucketName']
$distributionId = $outputs['NigredoDistributionId']
$distributionUrl = $outputs['NigredoDistributionUrl']

if (-not $bucketName -or -not $distributionId) {
    Write-Host "[ERROR] Could not retrieve bucket name or distribution ID from stack outputs!" -ForegroundColor Red
    exit 1
}

Write-Host "    S3 Bucket: $bucketName" -ForegroundColor Green
Write-Host "    CloudFront Distribution: $distributionId" -ForegroundColor Green

Write-Host "[OK] Prerequisites verified" -ForegroundColor Green
Write-Host ""

# ============================================================================
# Step 2: Install Dependencies
# ============================================================================

Write-Host "[2/5] Installing frontend dependencies..." -ForegroundColor Yellow

Push-Location frontend

if (-not (Test-Path "node_modules")) {
    Write-Host "  - Installing npm packages..." -ForegroundColor Gray
    npm install
    if ($LASTEXITCODE -ne 0) {
        Pop-Location
        Write-Host "[ERROR] Failed to install dependencies!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  - Dependencies already installed" -ForegroundColor Gray
}

Write-Host "[OK] Dependencies ready" -ForegroundColor Green
Write-Host ""

# ============================================================================
# Step 3: Build Next.js Application
# ============================================================================

if (-not $SkipBuild) {
    Write-Host "[3/5] Building Next.js application..." -ForegroundColor Yellow
    Write-Host "  This may take 2-5 minutes..." -ForegroundColor Gray
    Write-Host ""
    
    # Set environment variables for build
    $env:NEXT_PUBLIC_ENV = $Environment
    
    # Get API URL from Nigredo Stack outputs if available
    $nigredoStack = aws cloudformation describe-stacks --stack-name "NigredoStack-$Environment" 2>$null | ConvertFrom-Json
    if ($LASTEXITCODE -eq 0 -and $nigredoStack) {
        foreach ($output in $nigredoStack.Stacks[0].Outputs) {
            if ($output.OutputKey -eq 'NigredoApiUrl') {
                $env:NEXT_PUBLIC_API_URL = $output.OutputValue
                Write-Host "  - Using API URL: $($output.OutputValue)" -ForegroundColor Gray
            }
        }
    }
    
    # Build the application
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Pop-Location
        Write-Host ""
        Write-Host "[ERROR] Build failed!" -ForegroundColor Red
        exit 1
    }
    
    # Verify build output
    if (-not (Test-Path "out") -and -not (Test-Path ".next")) {
        Pop-Location
        Write-Host ""
        Write-Host "[ERROR] Build output not found!" -ForegroundColor Red
        Write-Host "        Expected 'out' or '.next' directory" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host ""
    Write-Host "[OK] Build completed successfully" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "[3/5] Skipping build (--SkipBuild flag)" -ForegroundColor Yellow
    Write-Host ""
}

# ============================================================================
# Step 4: Upload Build to S3
# ============================================================================

Write-Host "[4/5] Uploading build to S3..." -ForegroundColor Yellow

# Determine build output directory
$buildDir = if (Test-Path "out") { "out" } else { ".next" }
Write-Host "  - Build directory: $buildDir" -ForegroundColor Gray

# Upload to S3 with proper cache headers
Write-Host "  - Uploading files to s3://$bucketName..." -ForegroundColor Gray

# Upload static assets with long cache (1 year)
if (Test-Path "$buildDir/_next/static") {
    Write-Host "    Uploading static assets (cache: 1 year)..." -ForegroundColor Gray
    aws s3 sync "$buildDir/_next/static" "s3://$bucketName/_next/static" `
        --delete `
        --cache-control "public,max-age=31536000,immutable" `
        --metadata-directive REPLACE 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Pop-Location
        Write-Host "[ERROR] Failed to upload static assets!" -ForegroundColor Red
        exit 1
    }
}

# Upload HTML files with short cache (5 minutes)
Write-Host "    Uploading HTML files (cache: 5 minutes)..." -ForegroundColor Gray
Get-ChildItem -Path $buildDir -Filter "*.html" -Recurse | ForEach-Object {
    $relativePath = $_.FullName.Substring((Get-Location).Path.Length + $buildDir.Length + 2).Replace('\', '/')
    aws s3 cp $_.FullName "s3://$bucketName/$relativePath" `
        --cache-control "public,max-age=300" `
        --content-type "text/html" `
        --metadata-directive REPLACE 2>&1 | Out-Null
}

# Upload remaining files
Write-Host "    Uploading remaining files..." -ForegroundColor Gray
aws s3 sync $buildDir "s3://$bucketName" `
    --delete `
    --exclude "_next/static/*" `
    --exclude "*.html" `
    --cache-control "public,max-age=3600" `
    --metadata-directive REPLACE 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Write-Host "[ERROR] Failed to upload files to S3!" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Files uploaded successfully" -ForegroundColor Green
Write-Host ""

# ============================================================================
# Step 5: Invalidate CloudFront Cache
# ============================================================================

if (-not $SkipInvalidation) {
    Write-Host "[5/5] Invalidating CloudFront cache..." -ForegroundColor Yellow
    
    # Create invalidation
    Write-Host "  - Creating invalidation for distribution $distributionId..." -ForegroundColor Gray
    $invalidation = aws cloudfront create-invalidation `
        --distribution-id $distributionId `
        --paths "/*" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        $invalidationJson = $invalidation | ConvertFrom-Json
        $invalidationId = $invalidationJson.Invalidation.Id
        Write-Host "    Invalidation ID: $invalidationId" -ForegroundColor Green
        Write-Host "    Status: In Progress" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  Note: Cache invalidation may take 5-10 minutes to complete" -ForegroundColor Gray
    } else {
        Write-Host "[WARNING] Failed to create CloudFront invalidation" -ForegroundColor Yellow
        Write-Host "          You may need to wait for cache to expire or invalidate manually" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "[OK] Invalidation initiated" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "[5/5] Skipping CloudFront invalidation (--SkipInvalidation flag)" -ForegroundColor Yellow
    Write-Host ""
}

Pop-Location

# ============================================================================
# Step 6: Verify Deployment
# ============================================================================

Write-Host "Verifying deployment..." -ForegroundColor Yellow

# Check if index.html exists in S3
Write-Host "  - Checking index.html in S3..." -ForegroundColor Gray
$indexCheck = aws s3 ls "s3://$bucketName/index.html" 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "    ✓ index.html found" -ForegroundColor Green
} else {
    Write-Host "    ✗ index.html not found" -ForegroundColor Red
}

# Get CloudFront distribution status
Write-Host "  - Checking CloudFront distribution status..." -ForegroundColor Gray
$distribution = aws cloudfront get-distribution --id $distributionId 2>$null | ConvertFrom-Json
if ($LASTEXITCODE -eq 0) {
    $status = $distribution.Distribution.Status
    Write-Host "    Status: $status" -ForegroundColor $(if ($status -eq "Deployed") { "Green" } else { "Yellow" })
} else {
    Write-Host "    Could not retrieve distribution status" -ForegroundColor Yellow
}

Write-Host ""

# ============================================================================
# Deployment Complete
# ============================================================================

Write-Host "========================================" -ForegroundColor Green
Write-Host "Nigredo Frontend Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend URL: $distributionUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Wait 5-10 minutes for CloudFront cache invalidation" -ForegroundColor White
Write-Host "  2. Visit the URL above to test the landing page" -ForegroundColor White
Write-Host "  3. Test form submission functionality" -ForegroundColor White
Write-Host ""
Write-Host "Troubleshooting:" -ForegroundColor Cyan
Write-Host "  - If you see old content, clear your browser cache" -ForegroundColor White
Write-Host "  - Check CloudFront invalidation status:" -ForegroundColor White
Write-Host "    aws cloudfront get-invalidation --distribution-id $distributionId --id [INVALIDATION-ID]" -ForegroundColor Gray
Write-Host ""
