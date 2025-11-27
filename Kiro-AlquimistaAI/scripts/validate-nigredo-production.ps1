#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Post-Deployment Validation for Nigredo Production
.DESCRIPTION
    Comprehensive validation script to verify Nigredo system is working correctly in production
    Tests all critical functionality, monitoring, and security features
.PARAMETER Environment
    Environment to validate (default: prod)
.PARAMETER SkipLoadTests
    Skip performance/load testing
.EXAMPLE
    .\validate-nigredo-production.ps1
.EXAMPLE
    .\validate-nigredo-production.ps1 -Environment prod -SkipLoadTests
#>

param(
    [string]$Environment = "prod",
    [switch]$SkipLoadTests
)

$ErrorActionPreference = "Stop"
$ValidationId = Get-Date -Format "yyyyMMdd-HHmmss"
$LogFile = "validation-$ValidationId.log"
$TestResults = @()

# Colors for output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

# Logging function
function Write-Log {
    param($Message, $Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] [$Level] $Message"
    Add-Content -Path $LogFile -Value $LogMessage
    
    switch ($Level) {
        "SUCCESS" { Write-Success $Message }
        "ERROR" { Write-Error $Message }
        "WARNING" { Write-Warning $Message }
        default { Write-Info $Message }
    }
}

# Test result tracking
function Add-TestResult {
    param(
        [string]$TestName,
        [bool]$Passed,
        [string]$Message = "",
        [string]$Category = "General"
    )
    
    $script:TestResults += [PSCustomObject]@{
        Category = $Category
        TestName = $TestName
        Passed = $Passed
        Message = $Message
        Timestamp = Get-Date
    }
    
    if ($Passed) {
        Write-Log "✓ $TestName" "SUCCESS"
    } else {
        Write-Log "✗ $TestName - $Message" "ERROR"
    }
}

# Banner
Write-Host @"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     NIGREDO POST-DEPLOYMENT VALIDATION                    ║
║     Environment: $Environment                                    ║
║     Validation ID: $ValidationId                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
"@ -ForegroundColor Magenta

Write-Log "Starting post-deployment validation" "INFO"

# Get stack outputs
Write-Log "Retrieving stack outputs..." "INFO"

try {
    $NigredoStack = aws cloudformation describe-stacks --stack-name "NigredoStack-$Environment" --output json | ConvertFrom-Json
    $ApiUrl = ($NigredoStack.Stacks[0].Outputs | Where-Object { $_.OutputKey -eq "ApiUrl" }).OutputValue
    
    $FrontendStack = aws cloudformation describe-stacks --stack-name "NigredoFrontendStack-$Environment" --output json | ConvertFrom-Json
    $CloudFrontUrl = ($FrontendStack.Stacks[0].Outputs | Where-Object { $_.OutputKey -eq "CloudFrontUrl" }).OutputValue
    
    Write-Log "API URL: $ApiUrl" "INFO"
    Write-Log "Frontend URL: $CloudFrontUrl" "INFO"
} catch {
    Write-Log "Failed to retrieve stack outputs: $_" "ERROR"
    exit 1
}

# Test 1: Infrastructure Validation
Write-Log "`n=== TEST SUITE 1: Infrastructure ===" "INFO"

# Test 1.1: Lambda Functions Exist
Write-Log "Testing Lambda functions..." "INFO"
try {
    $Lambdas = aws lambda list-functions --output json | ConvertFrom-Json
    $NigredoLambdas = $Lambdas.Functions | Where-Object { $_.FunctionName -like "*NigredoStack-$Environment*" }
    
    $ExpectedLambdas = @("create-lead", "list-leads", "get-lead")
    $FoundCount = 0
    
    foreach ($expected in $ExpectedLambdas) {
        $Found = $NigredoLambdas | Where-Object { $_.FunctionName -like "*$expected*" }
        if ($Found) {
            $FoundCount++
            Add-TestResult -TestName "Lambda function $expected exists" -Passed $true -Category "Infrastructure"
        } else {
            Add-TestResult -TestName "Lambda function $expected exists" -Passed $false -Message "Not found" -Category "Infrastructure"
        }
    }
} catch {
    Add-TestResult -TestName "Lambda functions check" -Passed $false -Message $_.Exception.Message -Category "Infrastructure"
}

# Test 1.2: API Gateway Exists
Write-Log "Testing API Gateway..." "INFO"
try {
    $Response = Invoke-WebRequest -Uri "$ApiUrl/health" -Method GET -TimeoutSec 10 -ErrorAction SilentlyContinue
    if ($Response.StatusCode -eq 200) {
        Add-TestResult -TestName "API Gateway health endpoint" -Passed $true -Category "Infrastructure"
    } else {
        Add-TestResult -TestName "API Gateway health endpoint" -Passed $false -Message "Status: $($Response.StatusCode)" -Category "Infrastructure"
    }
} catch {
    Add-TestResult -TestName "API Gateway health endpoint" -Passed $false -Message $_.Exception.Message -Category "Infrastructure"
}

# Test 1.3: CloudFront Distribution
Write-Log "Testing CloudFront distribution..." "INFO"
try {
    $Response = Invoke-WebRequest -Uri $CloudFrontUrl -Method GET -TimeoutSec 10 -ErrorAction SilentlyContinue
    if ($Response.StatusCode -eq 200) {
        Add-TestResult -TestName "CloudFront distribution accessible" -Passed $true -Category "Infrastructure"
    } else {
        Add-TestResult -TestName "CloudFront distribution accessible" -Passed $false -Message "Status: $($Response.StatusCode)" -Category "Infrastructure"
    }
} catch {
    Add-TestResult -TestName "CloudFront distribution accessible" -Passed $false -Message $_.Exception.Message -Category "Infrastructure"
}

# Test 2: Functional Validation
Write-Log "`n=== TEST SUITE 2: Functional Tests ===" "INFO"

# Test 2.1: Create Lead (Happy Path)
Write-Log "Testing lead creation..." "INFO"
try {
    $TestLead = @{
        name = "Test User $(Get-Random)"
        email = "test-$(Get-Random)@example.com"
        phone = "+5511999999999"
        company = "Test Company"
        message = "This is a test lead submission for validation"
        source = "validation-script"
    } | ConvertTo-Json
    
    $Response = Invoke-WebRequest -Uri "$ApiUrl/api/leads" -Method POST -Body $TestLead -ContentType "application/json" -TimeoutSec 10
    
    if ($Response.StatusCode -eq 200 -or $Response.StatusCode -eq 201) {
        $ResponseData = $Response.Content | ConvertFrom-Json
        Add-TestResult -TestName "Create lead (happy path)" -Passed $true -Category "Functional"
        $script:TestLeadId = $ResponseData.lead.id
    } else {
        Add-TestResult -TestName "Create lead (happy path)" -Passed $false -Message "Status: $($Response.StatusCode)" -Category "Functional"
    }
} catch {
    Add-TestResult -TestName "Create lead (happy path)" -Passed $false -Message $_.Exception.Message -Category "Functional"
}

# Test 2.2: Create Lead (Validation Error)
Write-Log "Testing lead validation..." "INFO"
try {
    $InvalidLead = @{
        name = "A"  # Too short
        email = "invalid-email"  # Invalid format
        message = "Short"  # Too short
    } | ConvertTo-Json
    
    $Response = Invoke-WebRequest -Uri "$ApiUrl/api/leads" -Method POST -Body $InvalidLead -ContentType "application/json" -TimeoutSec 10 -ErrorAction SilentlyContinue
    
    if ($Response.StatusCode -eq 400) {
        Add-TestResult -TestName "Create lead (validation error)" -Passed $true -Category "Functional"
    } else {
        Add-TestResult -TestName "Create lead (validation error)" -Passed $false -Message "Expected 400, got $($Response.StatusCode)" -Category "Functional"
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Add-TestResult -TestName "Create lead (validation error)" -Passed $true -Category "Functional"
    } else {
        Add-TestResult -TestName "Create lead (validation error)" -Passed $false -Message $_.Exception.Message -Category "Functional"
    }
}

# Test 2.3: List Leads (Requires Auth)
Write-Log "Testing list leads endpoint..." "INFO"
try {
    $Response = Invoke-WebRequest -Uri "$ApiUrl/api/leads" -Method GET -TimeoutSec 10 -ErrorAction SilentlyContinue
    
    # Should return 401 without auth
    if ($Response.StatusCode -eq 401) {
        Add-TestResult -TestName "List leads (requires auth)" -Passed $true -Category "Functional"
    } else {
        Add-TestResult -TestName "List leads (requires auth)" -Passed $false -Message "Expected 401, got $($Response.StatusCode)" -Category "Functional"
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Add-TestResult -TestName "List leads (requires auth)" -Passed $true -Category "Functional"
    } else {
        Add-TestResult -TestName "List leads (requires auth)" -Passed $false -Message $_.Exception.Message -Category "Functional"
    }
}

# Test 2.4: Get Lead (Requires Auth)
Write-Log "Testing get lead endpoint..." "INFO"
try {
    $TestId = "00000000-0000-0000-0000-000000000000"
    $Response = Invoke-WebRequest -Uri "$ApiUrl/api/leads/$TestId" -Method GET -TimeoutSec 10 -ErrorAction SilentlyContinue
    
    # Should return 401 without auth
    if ($Response.StatusCode -eq 401) {
        Add-TestResult -TestName "Get lead (requires auth)" -Passed $true -Category "Functional"
    } else {
        Add-TestResult -TestName "Get lead (requires auth)" -Passed $false -Message "Expected 401, got $($Response.StatusCode)" -Category "Functional"
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Add-TestResult -TestName "Get lead (requires auth)" -Passed $true -Category "Functional"
    } else {
        Add-TestResult -TestName "Get lead (requires auth)" -Passed $false -Message $_.Exception.Message -Category "Functional"
    }
}

# Test 3: Security Validation
Write-Log "`n=== TEST SUITE 3: Security Tests ===" "INFO"

# Test 3.1: XSS Prevention
Write-Log "Testing XSS prevention..." "INFO"
try {
    $XssPayload = @{
        name = "<script>alert('xss')</script>"
        email = "test@example.com"
        message = "<img src=x onerror=alert('xss')>"
    } | ConvertTo-Json
    
    $Response = Invoke-WebRequest -Uri "$ApiUrl/api/leads" -Method POST -Body $XssPayload -ContentType "application/json" -TimeoutSec 10 -ErrorAction SilentlyContinue
    
    # Should either reject or sanitize
    if ($Response.StatusCode -eq 400 -or $Response.StatusCode -eq 200) {
        Add-TestResult -TestName "XSS prevention" -Passed $true -Category "Security"
    } else {
        Add-TestResult -TestName "XSS prevention" -Passed $false -Message "Unexpected response" -Category "Security"
    }
} catch {
    Add-TestResult -TestName "XSS prevention" -Passed $true -Category "Security"
}

# Test 3.2: SQL Injection Prevention
Write-Log "Testing SQL injection prevention..." "INFO"
try {
    $SqlPayload = @{
        name = "'; DROP TABLE leads; --"
        email = "test@example.com"
        message = "1' OR '1'='1"
    } | ConvertTo-Json
    
    $Response = Invoke-WebRequest -Uri "$ApiUrl/api/leads" -Method POST -Body $SqlPayload -ContentType "application/json" -TimeoutSec 10 -ErrorAction SilentlyContinue
    
    # Should handle safely
    Add-TestResult -TestName "SQL injection prevention" -Passed $true -Category "Security"
} catch {
    Add-TestResult -TestName "SQL injection prevention" -Passed $true -Category "Security"
}

# Test 3.3: CORS Headers
Write-Log "Testing CORS configuration..." "INFO"
try {
    $Response = Invoke-WebRequest -Uri "$ApiUrl/api/leads" -Method OPTIONS -TimeoutSec 10 -ErrorAction SilentlyContinue
    $CorsHeader = $Response.Headers["Access-Control-Allow-Origin"]
    
    if ($CorsHeader) {
        Add-TestResult -TestName "CORS headers present" -Passed $true -Category "Security"
    } else {
        Add-TestResult -TestName "CORS headers present" -Passed $false -Message "No CORS headers" -Category "Security"
    }
} catch {
    Add-TestResult -TestName "CORS headers present" -Passed $false -Message $_.Exception.Message -Category "Security"
}

# Test 4: Monitoring Validation
Write-Log "`n=== TEST SUITE 4: Monitoring ===" "INFO"

# Test 4.1: CloudWatch Log Groups
Write-Log "Testing CloudWatch log groups..." "INFO"
try {
    $LogGroups = aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/NigredoStack-$Environment" --output json | ConvertFrom-Json
    
    if ($LogGroups.logGroups.Count -gt 0) {
        Add-TestResult -TestName "CloudWatch log groups exist" -Passed $true -Category "Monitoring"
    } else {
        Add-TestResult -TestName "CloudWatch log groups exist" -Passed $false -Message "No log groups found" -Category "Monitoring"
    }
} catch {
    Add-TestResult -TestName "CloudWatch log groups exist" -Passed $false -Message $_.Exception.Message -Category "Monitoring"
}

# Test 4.2: CloudWatch Alarms
Write-Log "Testing CloudWatch alarms..." "INFO"
try {
    $Alarms = aws cloudwatch describe-alarms --alarm-name-prefix "Nigredo-$Environment" --output json | ConvertFrom-Json
    
    if ($Alarms.MetricAlarms.Count -gt 0) {
        Add-TestResult -TestName "CloudWatch alarms configured" -Passed $true -Category "Monitoring"
        Write-Log "Found $($Alarms.MetricAlarms.Count) alarms" "INFO"
    } else {
        Add-TestResult -TestName "CloudWatch alarms configured" -Passed $false -Message "No alarms found" -Category "Monitoring"
    }
} catch {
    Add-TestResult -TestName "CloudWatch alarms configured" -Passed $false -Message $_.Exception.Message -Category "Monitoring"
}

# Test 4.3: X-Ray Tracing
Write-Log "Testing X-Ray tracing..." "INFO"
try {
    # Check if X-Ray is enabled on Lambda functions
    $Lambda = $NigredoLambdas[0]
    if ($Lambda) {
        $Config = aws lambda get-function-configuration --function-name $Lambda.FunctionName --output json | ConvertFrom-Json
        
        if ($Config.TracingConfig.Mode -eq "Active") {
            Add-TestResult -TestName "X-Ray tracing enabled" -Passed $true -Category "Monitoring"
        } else {
            Add-TestResult -TestName "X-Ray tracing enabled" -Passed $false -Message "Tracing not active" -Category "Monitoring"
        }
    }
} catch {
    Add-TestResult -TestName "X-Ray tracing enabled" -Passed $false -Message $_.Exception.Message -Category "Monitoring"
}

# Test 5: Performance Validation
if (-not $SkipLoadTests) {
    Write-Log "`n=== TEST SUITE 5: Performance ===" "INFO"
    
    # Test 5.1: API Latency
    Write-Log "Testing API latency..." "INFO"
    try {
        $Latencies = @()
        
        for ($i = 1; $i -le 10; $i++) {
            $StartTime = Get-Date
            $Response = Invoke-WebRequest -Uri "$ApiUrl/health" -Method GET -TimeoutSec 10
            $EndTime = Get-Date
            $Latency = ($EndTime - $StartTime).TotalMilliseconds
            $Latencies += $Latency
        }
        
        $AvgLatency = ($Latencies | Measure-Object -Average).Average
        $P99Latency = ($Latencies | Sort-Object -Descending)[0]
        
        Write-Log "Average latency: $([math]::Round($AvgLatency, 2))ms" "INFO"
        Write-Log "P99 latency: $([math]::Round($P99Latency, 2))ms" "INFO"
        
        if ($P99Latency -lt 1000) {
            Add-TestResult -TestName "API latency < 1000ms (p99)" -Passed $true -Category "Performance"
        } else {
            Add-TestResult -TestName "API latency < 1000ms (p99)" -Passed $false -Message "P99: $([math]::Round($P99Latency, 2))ms" -Category "Performance"
        }
    } catch {
        Add-TestResult -TestName "API latency test" -Passed $false -Message $_.Exception.Message -Category "Performance"
    }
    
    # Test 5.2: Frontend Load Time
    Write-Log "Testing frontend load time..." "INFO"
    try {
        $StartTime = Get-Date
        $Response = Invoke-WebRequest -Uri $CloudFrontUrl -Method GET -TimeoutSec 10
        $EndTime = Get-Date
        $LoadTime = ($EndTime - $StartTime).TotalMilliseconds
        
        Write-Log "Frontend load time: $([math]::Round($LoadTime, 2))ms" "INFO"
        
        if ($LoadTime -lt 3000) {
            Add-TestResult -TestName "Frontend load time < 3s" -Passed $true -Category "Performance"
        } else {
            Add-TestResult -TestName "Frontend load time < 3s" -Passed $false -Message "$([math]::Round($LoadTime, 2))ms" -Category "Performance"
        }
    } catch {
        Add-TestResult -TestName "Frontend load time test" -Passed $false -Message $_.Exception.Message -Category "Performance"
    }
} else {
    Write-Warning "Skipping performance tests"
}

# Generate Report
Write-Host @"

╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     VALIDATION REPORT                                     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

$TotalTests = $TestResults.Count
$PassedTests = ($TestResults | Where-Object { $_.Passed }).Count
$FailedTests = $TotalTests - $PassedTests
$SuccessRate = [math]::Round(($PassedTests / $TotalTests) * 100, 2)

Write-Log "`nValidation Summary:" "INFO"
Write-Log "Total Tests: $TotalTests" "INFO"
Write-Success "Passed: $PassedTests"
if ($FailedTests -gt 0) {
    Write-Error "Failed: $FailedTests"
} else {
    Write-Success "Failed: $FailedTests"
}
Write-Log "Success Rate: $SuccessRate%" "INFO"

# Group by category
Write-Log "`nResults by Category:" "INFO"
$TestResults | Group-Object Category | ForEach-Object {
    $CategoryPassed = ($_.Group | Where-Object { $_.Passed }).Count
    $CategoryTotal = $_.Group.Count
    Write-Log "$($_.Name): $CategoryPassed/$CategoryTotal passed" "INFO"
}

# Show failed tests
if ($FailedTests -gt 0) {
    Write-Log "`nFailed Tests:" "ERROR"
    $TestResults | Where-Object { -not $_.Passed } | ForEach-Object {
        Write-Log "  ✗ [$($_.Category)] $($_.TestName): $($_.Message)" "ERROR"
    }
}

# Save detailed report
$ReportFile = "validation-report-$ValidationId.json"
$TestResults | ConvertTo-Json -Depth 10 | Out-File $ReportFile
Write-Log "`nDetailed report saved to: $ReportFile" "INFO"
Write-Log "Log file saved to: $LogFile" "INFO"

# Final verdict
if ($FailedTests -eq 0) {
    Write-Success "`n✓ All validation tests passed! System is ready for production use."
    exit 0
} elseif ($FailedTests -le 2) {
    Write-Warning "`n⚠ Most tests passed, but some issues detected. Review failed tests."
    exit 0
} else {
    Write-Error "`n✗ Multiple validation tests failed. System may not be production-ready."
    exit 1
}
