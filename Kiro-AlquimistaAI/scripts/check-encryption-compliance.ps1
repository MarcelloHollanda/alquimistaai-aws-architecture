# Encryption Compliance Check Script (PowerShell)
# Usage: .\scripts\check-encryption-compliance.ps1 -Env dev
# Example: .\scripts\check-encryption-compliance.ps1 -Env prod

param(
    [Parameter(Mandatory=$false)]
    [string]$Env = "dev"
)

# Function to write colored output
function Write-Status {
    param(
        [string]$Status,
        [string]$Message
    )
    
    switch ($Status) {
        "PASS" { Write-Host "✓ PASS: " -ForegroundColor Green -NoNewline; Write-Host $Message }
        "FAIL" { Write-Host "✗ FAIL: " -ForegroundColor Red -NoNewline; Write-Host $Message }
        "WARNING" { Write-Host "⚠ WARNING: " -ForegroundColor Yellow -NoNewline; Write-Host $Message }
    }
}

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Encryption Compliance Check - $Env" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Get AWS Account ID
try {
    $AccountId = (aws sts get-caller-identity --query Account --output text)
    Write-Host "AWS Account: $AccountId"
    Write-Host "Region: us-east-1"
    Write-Host ""
} catch {
    Write-Host "Error: Unable to get AWS account information" -ForegroundColor Red
    exit 1
}

# ========================================
# 1. Check KMS Key
# ========================================
Write-Host "1. Checking KMS Key..." -ForegroundColor Cyan

try {
    $KmsKeyId = (aws kms describe-key `
        --key-id "alias/fibonacci-encryption-key-$Env" `
        --query 'KeyMetadata.KeyId' `
        --output text 2>$null)
    
    if ($KmsKeyId) {
        Write-Status "PASS" "KMS key exists: $KmsKeyId"
        
        # Check key rotation
        $RotationEnabled = (aws kms get-key-rotation-status `
            --key-id $KmsKeyId `
            --query 'KeyRotationEnabled' `
            --output text)
        
        if ($RotationEnabled -eq "True") {
            Write-Status "PASS" "Key rotation is enabled"
        } else {
            Write-Status "FAIL" "Key rotation is NOT enabled"
        }
    } else {
        Write-Status "FAIL" "KMS key not found"
    }
} catch {
    Write-Status "FAIL" "Error checking KMS key: $_"
}
Write-Host ""

# ========================================
# 2. Check Aurora Encryption
# ========================================
Write-Host "2. Checking Aurora Encryption..." -ForegroundColor Cyan

try {
    $ClusterId = "fibonacci-cluster-$Env"
    $AuroraEncrypted = (aws rds describe-db-clusters `
        --db-cluster-identifier $ClusterId `
        --query 'DBClusters[0].StorageEncrypted' `
        --output text 2>$null)
    
    if ($AuroraEncrypted -eq "True") {
        Write-Status "PASS" "Aurora cluster is encrypted"
        
        # Check if using KMS
        $AuroraKmsKey = (aws rds describe-db-clusters `
            --db-cluster-identifier $ClusterId `
            --query 'DBClusters[0].KmsKeyId' `
            --output text 2>$null)
        
        if ($AuroraKmsKey -like "*$KmsKeyId*") {
            Write-Status "PASS" "Aurora using customer-managed KMS key"
        } else {
            Write-Status "WARNING" "Aurora using different KMS key: $AuroraKmsKey"
        }
    } else {
        Write-Status "FAIL" "Aurora cluster is NOT encrypted"
    }
} catch {
    Write-Status "WARNING" "Aurora cluster not found or error checking: $_"
}
Write-Host ""

# ========================================
# 3. Check S3 Encryption
# ========================================
Write-Host "3. Checking S3 Bucket Encryption..." -ForegroundColor Cyan

try {
    $BucketName = "fibonacci-site-$Env-$AccountId"
    $S3Encryption = (aws s3api get-bucket-encryption `
        --bucket $BucketName `
        --query 'ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm' `
        --output text 2>$null)
    
    if ($S3Encryption -eq "aws:kms") {
        Write-Status "PASS" "S3 bucket using KMS encryption"
        
        # Check bucket key
        $BucketKeyEnabled = (aws s3api get-bucket-encryption `
            --bucket $BucketName `
            --query 'ServerSideEncryptionConfiguration.Rules[0].BucketKeyEnabled' `
            --output text 2>$null)
        
        if ($BucketKeyEnabled -eq "True") {
            Write-Status "PASS" "S3 bucket key enabled (cost optimized)"
        } else {
            Write-Status "WARNING" "S3 bucket key not enabled (higher KMS costs)"
        }
        
        # Check SSL enforcement
        $BucketPolicy = (aws s3api get-bucket-policy `
            --bucket $BucketName `
            --query 'Policy' `
            --output text 2>$null)
        
        if ($BucketPolicy -like "*aws:SecureTransport*") {
            Write-Status "PASS" "S3 SSL/TLS enforcement enabled"
        } else {
            Write-Status "FAIL" "S3 SSL/TLS enforcement NOT enabled"
        }
    } else {
        Write-Status "FAIL" "S3 bucket NOT using KMS encryption (found: $S3Encryption)"
    }
} catch {
    Write-Status "WARNING" "S3 bucket not found or error checking: $_"
}
Write-Host ""

# ========================================
# 4. Check SQS Encryption
# ========================================
Write-Host "4. Checking SQS Queue Encryption..." -ForegroundColor Cyan

$Queues = @(
    "fibonacci-main-$Env",
    "fibonacci-dlq-$Env",
    "nigredo-recebimento-$Env",
    "nigredo-estrategia-$Env",
    "nigredo-disparo-$Env"
)

$EncryptedCount = 0
$TotalQueues = $Queues.Count

foreach ($QueueName in $Queues) {
    try {
        $QueueUrl = (aws sqs get-queue-url `
            --queue-name $QueueName `
            --query 'QueueUrl' `
            --output text 2>$null)
        
        if ($QueueUrl) {
            $KmsKey = (aws sqs get-queue-attributes `
                --queue-url $QueueUrl `
                --attribute-names KmsMasterKeyId `
                --query 'Attributes.KmsMasterKeyId' `
                --output text 2>$null)
            
            if ($KmsKey -and $KmsKey -ne "None") {
                $EncryptedCount++
            }
        }
    } catch {
        # Queue not found, skip
    }
}

if ($EncryptedCount -eq $TotalQueues) {
    Write-Status "PASS" "All SQS queues encrypted ($EncryptedCount/$TotalQueues)"
} elseif ($EncryptedCount -gt 0) {
    Write-Status "WARNING" "Some SQS queues encrypted ($EncryptedCount/$TotalQueues)"
} else {
    Write-Status "FAIL" "No SQS queues encrypted ($EncryptedCount/$TotalQueues)"
}
Write-Host ""

# ========================================
# 5. Check CloudFront TLS
# ========================================
Write-Host "5. Checking CloudFront TLS Configuration..." -ForegroundColor Cyan

try {
    $DistributionId = (aws cloudformation describe-stacks `
        --stack-name "FibonacciStack-$Env" `
        --query 'Stacks[0].Outputs[?OutputKey==`DistributionId`].OutputValue' `
        --output text 2>$null)
    
    if ($DistributionId) {
        $MinTlsVersion = (aws cloudfront get-distribution-config `
            --id $DistributionId `
            --query 'DistributionConfig.ViewerCertificate.MinimumProtocolVersion' `
            --output text 2>$null)
        
        if ($MinTlsVersion -like "*TLSv1.2*" -or $MinTlsVersion -like "*TLSv1.3*") {
            Write-Status "PASS" "CloudFront using TLS 1.2+ ($MinTlsVersion)"
        } else {
            Write-Status "FAIL" "CloudFront NOT using TLS 1.2+ (found: $MinTlsVersion)"
        }
        
        # Check HTTPS enforcement
        $ViewerProtocol = (aws cloudfront get-distribution-config `
            --id $DistributionId `
            --query 'DistributionConfig.DefaultCacheBehavior.ViewerProtocolPolicy' `
            --output text 2>$null)
        
        if ($ViewerProtocol -eq "redirect-to-https" -or $ViewerProtocol -eq "https-only") {
            Write-Status "PASS" "CloudFront enforcing HTTPS ($ViewerProtocol)"
        } else {
            Write-Status "FAIL" "CloudFront NOT enforcing HTTPS (found: $ViewerProtocol)"
        }
    } else {
        Write-Status "WARNING" "CloudFront distribution not found"
    }
} catch {
    Write-Status "WARNING" "Error checking CloudFront: $_"
}
Write-Host ""

# ========================================
# 6. Check Lambda Environment Encryption
# ========================================
Write-Host "6. Checking Lambda Environment Variable Encryption..." -ForegroundColor Cyan

$LambdaFunctions = @(
    "fibonacci-api-handler-$Env",
    "nigredo-recebimento-$Env",
    "nigredo-estrategia-$Env"
)

$LambdaEncryptedCount = 0
$LambdaTotal = $LambdaFunctions.Count

foreach ($FunctionName in $LambdaFunctions) {
    try {
        $EnvKmsKey = (aws lambda get-function-configuration `
            --function-name $FunctionName `
            --query 'KMSKeyArn' `
            --output text 2>$null)
        
        if ($EnvKmsKey -and $EnvKmsKey -ne "None") {
            $LambdaEncryptedCount++
        }
    } catch {
        # Function not found, skip
    }
}

if ($LambdaEncryptedCount -gt 0) {
    Write-Status "PASS" "Lambda environment variables encrypted ($LambdaEncryptedCount/$LambdaTotal)"
} else {
    Write-Status "WARNING" "Lambda environment variables using default encryption ($LambdaEncryptedCount/$LambdaTotal)"
}
Write-Host ""

# ========================================
# Summary
# ========================================
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Compliance Summary" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Encryption at Rest:"
Write-Host "  - KMS Key: $(if ($KmsKeyId) { '✓' } else { '✗' })"
Write-Host "  - Aurora: $(if ($AuroraEncrypted -eq 'True') { '✓' } else { '✗' })"
Write-Host "  - S3: $(if ($S3Encryption -eq 'aws:kms') { '✓' } else { '✗' })"
Write-Host "  - SQS: $(if ($EncryptedCount -eq $TotalQueues) { '✓' } else { '⚠' })"
Write-Host ""
Write-Host "Encryption in Transit:"
Write-Host "  - CloudFront TLS 1.2+: $(if ($MinTlsVersion -like '*TLSv1.2*') { '✓' } else { '✗' })"
Write-Host "  - S3 SSL Enforcement: $(if ($BucketPolicy -like '*aws:SecureTransport*') { '✓' } else { '✗' })"
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Check complete!" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
