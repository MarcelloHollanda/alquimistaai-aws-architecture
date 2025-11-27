# Post-Deploy Validation Script
# Valida que o deploy foi bem-sucedido e todos os componentes estão funcionando

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('dev', 'staging', 'prod')]
    [string]$Environment = 'prod'
)

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# Colors
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"
$Cyan = "Cyan"

function Write-TestResult {
    param(
        [string]$TestName,
        [bool]$Passed,
        [string]$Details = ""
    )
    
    if ($Passed) {
        Write-Host "✅ $TestName" -ForegroundColor $Green
    } else {
        Write-Host "❌ $TestName" -ForegroundColor $Red
    }
    
    if ($Details) {
        Write-Host "   $Details" -ForegroundColor Gray
    }
}

# Banner
Write-Host @"

╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     🔍 POST-DEPLOY VALIDATION                            ║
║                                                           ║
║     Environment: $Environment                                    ║
║     Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

"@ -ForegroundColor $Cyan

$totalTests = 0
$passedTests = 0

# Test 1: CloudFormation Stacks
Write-Host "`n📦 Testing CloudFormation Stacks..." -ForegroundColor $Cyan

$stacks = @("FibonacciStack-$Environment", "NigredoStack-$Environment", "AlquimistaStack-$Environment")

foreach ($stackName in $stacks) {
    $totalTests++
    try {
        $stack = aws cloudformation describe-stacks --stack-name $stackName --query 'Stacks[0]' --output json | ConvertFrom-Json
        $status = $stack.StackStatus
        
        if ($status -match 'COMPLETE') {
            Write-TestResult -TestName "$stackName exists and is complete" -Passed $true -Details "Status: $status"
            $passedTests++
        } else {
            Write-TestResult -TestName "$stackName exists and is complete" -Passed $false -Details "Status: $status"
        }
    } catch {
        Write-TestResult -TestName "$stackName exists and is complete" -Passed $false -Details "Stack not found"
    }
}

# Test 2: API Gateway
Write-Host "`n🌐 Testing API Gateway..." -ForegroundColor $Cyan

try {
    $fibonacciOutputs = aws cloudformation describe-stacks `
        --stack-name "FibonacciStack-$Environment" `
        --query 'Stacks[0].Outputs' `
        --output json | ConvertFrom-Json
    
    $apiUrl = ($fibonacciOutputs | Where-Object { $_.OutputKey -eq 'ApiUrl' }).OutputValue
    
    if ($apiUrl) {
        # Test /health endpoint
        $totalTests++
        try {
            $response = Invoke-RestMethod -Uri "$apiUrl/health" -Method Get -TimeoutSec 10
            if ($response.ok -eq $true) {
                Write-TestResult -TestName "Health endpoint responds" -Passed $true -Details "URL: $apiUrl/health"
                $passedTests++
            } else {
                Write-TestResult -TestName "Health endpoint responds" -Passed $false -Details "Unexpected response"
            }
        } catch {
            Write-TestResult -TestName "Health endpoint responds" -Passed $false -Details $_.Exception.Message
        }
        
        # Test /db-status endpoint
        $totalTests++
        try {
            $response = Invoke-RestMethod -Uri "$apiUrl/db-status" -Method Get -TimeoutSec 10
            if ($response.db_status -eq 'connected') {
                Write-TestResult -TestName "Database connection works" -Passed $true -Details "Status: connected"
                $passedTests++
            } else {
                Write-TestResult -TestName "Database connection works" -Passed $false -Details "Status: $($response.db_status)"
            }
        } catch {
            Write-TestResult -TestName "Database connection works" -Passed $false -Details $_.Exception.Message
        }
    } else {
        Write-TestResult -TestName "API URL found in outputs" -Passed $false -Details "ApiUrl output not found"
    }
} catch {
    Write-TestResult -TestName "API Gateway accessible" -Passed $false -Details $_.Exception.Message
}

# Test 3: Aurora Database
Write-Host "`n🗄️  Testing Aurora Database..." -ForegroundColor $Cyan

$totalTests++
try {
    $dbEndpoint = ($fibonacciOutputs | Where-Object { $_.OutputKey -eq 'DatabaseEndpoint' }).OutputValue
    
    if ($dbEndpoint) {
        Write-TestResult -TestName "Database endpoint exists" -Passed $true -Details "Endpoint: $dbEndpoint"
        $passedTests++
    } else {
        Write-TestResult -TestName "Database endpoint exists" -Passed $false -Details "DatabaseEndpoint output not found"
    }
} catch {
    Write-TestResult -TestName "Database endpoint exists" -Passed $false -Details $_.Exception.Message
}

# Test 4: S3 + CloudFront
Write-Host "`n☁️  Testing S3 + CloudFront..." -ForegroundColor $Cyan

$totalTests++
try {
    $cloudFrontUrl = ($fibonacciOutputs | Where-Object { $_.OutputKey -eq 'CloudFrontUrl' }).OutputValue
    
    if ($cloudFrontUrl) {
        Write-TestResult -TestName "CloudFront distribution exists" -Passed $true -Details "URL: $cloudFrontUrl"
        $passedTests++
        
        # Test if CloudFront is accessible
        $totalTests++
        try {
            $response = Invoke-WebRequest -Uri $cloudFrontUrl -Method Head -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                Write-TestResult -TestName "CloudFront is accessible" -Passed $true
                $passedTests++
            } else {
                Write-TestResult -TestName "CloudFront is accessible" -Passed $false -Details "Status: $($response.StatusCode)"
            }
        } catch {
            Write-TestResult -TestName "CloudFront is accessible" -Passed $false -Details $_.Exception.Message
        }
    } else {
        Write-TestResult -TestName "CloudFront distribution exists" -Passed $false -Details "CloudFrontUrl output not found"
    }
} catch {
    Write-TestResult -TestName "CloudFront distribution exists" -Passed $false -Details $_.Exception.Message
}

# Test 5: Lambda Functions
Write-Host "`n⚡ Testing Lambda Functions..." -ForegroundColor $Cyan

$expectedLambdas = @(
    "fibonacci-$Environment-handler",
    "fibonacci-$Environment-recebimento",
    "fibonacci-$Environment-estrategia",
    "fibonacci-$Environment-disparo",
    "fibonacci-$Environment-atendimento",
    "fibonacci-$Environment-sentimento",
    "fibonacci-$Environment-agendamento",
    "fibonacci-$Environment-relatorios"
)

foreach ($lambdaName in $expectedLambdas) {
    $totalTests++
    try {
        $lambda = aws lambda get-function --function-name $lambdaName --query 'Configuration' --output json 2>$null | ConvertFrom-Json
        
        if ($lambda) {
            Write-TestResult -TestName "$lambdaName exists" -Passed $true -Details "Runtime: $($lambda.Runtime)"
            $passedTests++
        } else {
            Write-TestResult -TestName "$lambdaName exists" -Passed $false
        }
    } catch {
        Write-TestResult -TestName "$lambdaName exists" -Passed $false
    }
}

# Test 6: EventBridge
Write-Host "`n📡 Testing EventBridge..." -ForegroundColor $Cyan

$totalTests++
try {
    $eventBusName = "fibonacci-bus-$Environment"
    $eventBus = aws events describe-event-bus --name $eventBusName --output json 2>$null | ConvertFrom-Json
    
    if ($eventBus) {
        Write-TestResult -TestName "EventBridge bus exists" -Passed $true -Details "Name: $eventBusName"
        $passedTests++
    } else {
        Write-TestResult -TestName "EventBridge bus exists" -Passed $false
    }
} catch {
    Write-TestResult -TestName "EventBridge bus exists" -Passed $false
}

# Test 7: SQS Queues
Write-Host "`n📬 Testing SQS Queues..." -ForegroundColor $Cyan

$expectedQueues = @(
    "fibonacci-$Environment-recebimento-queue",
    "fibonacci-$Environment-dlq"
)

foreach ($queueName in $expectedQueues) {
    $totalTests++
    try {
        $queueUrl = aws sqs get-queue-url --queue-name $queueName --query 'QueueUrl' --output text 2>$null
        
        if ($queueUrl) {
            Write-TestResult -TestName "$queueName exists" -Passed $true
            $passedTests++
        } else {
            Write-TestResult -TestName "$queueName exists" -Passed $false
        }
    } catch {
        Write-TestResult -TestName "$queueName exists" -Passed $false
    }
}

# Test 8: Cognito User Pool
Write-Host "`n👤 Testing Cognito User Pool..." -ForegroundColor $Cyan

$totalTests++
try {
    $userPoolId = ($fibonacciOutputs | Where-Object { $_.OutputKey -eq 'UserPoolId' }).OutputValue
    
    if ($userPoolId) {
        $userPool = aws cognito-idp describe-user-pool --user-pool-id $userPoolId --query 'UserPool' --output json 2>$null | ConvertFrom-Json
        
        if ($userPool) {
            Write-TestResult -TestName "Cognito User Pool exists" -Passed $true -Details "ID: $userPoolId"
            $passedTests++
        } else {
            Write-TestResult -TestName "Cognito User Pool exists" -Passed $false
        }
    } else {
        Write-TestResult -TestName "Cognito User Pool exists" -Passed $false -Details "UserPoolId output not found"
    }
} catch {
    Write-TestResult -TestName "Cognito User Pool exists" -Passed $false
}

# Test 9: CloudWatch Dashboards
Write-Host "`n📊 Testing CloudWatch Dashboards..." -ForegroundColor $Cyan

$expectedDashboards = @(
    "fibonacci-core-$Environment",
    "fibonacci-nigredo-agents-$Environment",
    "fibonacci-business-metrics-$Environment"
)

foreach ($dashboardName in $expectedDashboards) {
    $totalTests++
    try {
        $dashboard = aws cloudwatch get-dashboard --dashboard-name $dashboardName --output json 2>$null | ConvertFrom-Json
        
        if ($dashboard) {
            Write-TestResult -TestName "$dashboardName exists" -Passed $true
            $passedTests++
        } else {
            Write-TestResult -TestName "$dashboardName exists" -Passed $false
        }
    } catch {
        Write-TestResult -TestName "$dashboardName exists" -Passed $false
    }
}

# Test 10: CloudWatch Alarms
Write-Host "`n🚨 Testing CloudWatch Alarms..." -ForegroundColor $Cyan

$totalTests++
try {
    $alarms = aws cloudwatch describe-alarms `
        --alarm-name-prefix "fibonacci-$Environment" `
        --query 'MetricAlarms[*]' `
        --output json | ConvertFrom-Json
    
    if ($alarms.Count -gt 0) {
        Write-TestResult -TestName "CloudWatch alarms configured" -Passed $true -Details "Found $($alarms.Count) alarm(s)"
        $passedTests++
        
        # Check alarm states
        $okAlarms = ($alarms | Where-Object { $_.StateValue -eq 'OK' }).Count
        $alarmAlarms = ($alarms | Where-Object { $_.StateValue -eq 'ALARM' }).Count
        $insufficientAlarms = ($alarms | Where-Object { $_.StateValue -eq 'INSUFFICIENT_DATA' }).Count
        
        Write-Host "   OK: $okAlarms | ALARM: $alarmAlarms | INSUFFICIENT_DATA: $insufficientAlarms" -ForegroundColor Gray
    } else {
        Write-TestResult -TestName "CloudWatch alarms configured" -Passed $false -Details "No alarms found"
    }
} catch {
    Write-TestResult -TestName "CloudWatch alarms configured" -Passed $false
}

# Test 11: Secrets Manager
Write-Host "`n🔐 Testing Secrets Manager..." -ForegroundColor $Cyan

$totalTests++
try {
    $dbSecretArn = ($fibonacciOutputs | Where-Object { $_.OutputKey -eq 'DatabaseSecretArn' }).OutputValue
    
    if ($dbSecretArn) {
        $secret = aws secretsmanager describe-secret --secret-id $dbSecretArn --output json 2>$null | ConvertFrom-Json
        
        if ($secret) {
            Write-TestResult -TestName "Database secret exists" -Passed $true -Details "ARN: $dbSecretArn"
            $passedTests++
        } else {
            Write-TestResult -TestName "Database secret exists" -Passed $false
        }
    } else {
        Write-TestResult -TestName "Database secret exists" -Passed $false -Details "DatabaseSecretArn output not found"
    }
} catch {
    Write-TestResult -TestName "Database secret exists" -Passed $false
}

# Test 12: VPC
Write-Host "`n🌐 Testing VPC..." -ForegroundColor $Cyan

$totalTests++
try {
    $vpcId = ($fibonacciOutputs | Where-Object { $_.OutputKey -eq 'VpcId' }).OutputValue
    
    if ($vpcId) {
        $vpc = aws ec2 describe-vpcs --vpc-ids $vpcId --query 'Vpcs[0]' --output json 2>$null | ConvertFrom-Json
        
        if ($vpc) {
            Write-TestResult -TestName "VPC exists" -Passed $true -Details "ID: $vpcId"
            $passedTests++
        } else {
            Write-TestResult -TestName "VPC exists" -Passed $false
        }
    } else {
        Write-TestResult -TestName "VPC exists" -Passed $false -Details "VpcId output not found"
    }
} catch {
    Write-TestResult -TestName "VPC exists" -Passed $false
}

# Summary
Write-Host @"

╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     📊 VALIDATION SUMMARY                                ║
║                                                           ║
║     Total Tests: $totalTests                                        ║
║     Passed: $passedTests                                          ║
║     Failed: $($totalTests - $passedTests)                                          ║
║     Success Rate: $([math]::Round(($passedTests / $totalTests) * 100, 2))%                              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

"@ -ForegroundColor $(if ($passedTests -eq $totalTests) { $Green } elseif ($passedTests / $totalTests -gt 0.8) { $Yellow } else { $Red })

if ($passedTests -eq $totalTests) {
    Write-Host "✅ All tests passed! System is fully operational." -ForegroundColor $Green
} elseif ($passedTests / $totalTests -gt 0.8) {
    Write-Host "⚠️  Most tests passed, but some issues were found. Review failed tests above." -ForegroundColor $Yellow
} else {
    Write-Host "❌ Multiple tests failed. System may not be fully operational." -ForegroundColor $Red
}

Write-Host "`n📋 Next Steps:" -ForegroundColor $Cyan
if ($passedTests -lt $totalTests) {
    Write-Host "1. Review failed tests above"
    Write-Host "2. Check CloudFormation console for errors"
    Write-Host "3. Check CloudWatch Logs for Lambda errors"
    Write-Host "4. Consider rolling back if critical issues"
} else {
    Write-Host "1. Configure remaining secrets (WhatsApp, Google Calendar, etc.)"
    Write-Host "2. Run database migrations"
    Write-Host "3. Deploy frontend"
    Write-Host "4. Monitor system for 24-48 hours"
}

# Exit with appropriate code
if ($passedTests -eq $totalTests) {
    exit 0
} else {
    exit 1
}
