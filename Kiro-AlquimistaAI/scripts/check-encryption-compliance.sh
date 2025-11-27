#!/bin/bash

# Encryption Compliance Check Script
# Usage: ./scripts/check-encryption-compliance.sh [env]
# Example: ./scripts/check-encryption-compliance.sh dev

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get environment from argument or default to 'dev'
ENV=${1:-dev}

echo "========================================="
echo "Encryption Compliance Check - ${ENV}"
echo "========================================="
echo ""

# Get AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "AWS Account: ${ACCOUNT_ID}"
echo "Region: us-east-1"
echo ""

# Function to check status
check_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
    fi
}

# Function to check warning
check_warning() {
    echo -e "${YELLOW}⚠ WARNING${NC}: $1"
}

# ========================================
# 1. Check KMS Key
# ========================================
echo "1. Checking KMS Key..."

KMS_KEY_ID=$(aws kms describe-key \
    --key-id alias/fibonacci-encryption-key-${ENV} \
    --query 'KeyMetadata.KeyId' \
    --output text 2>/dev/null || echo "")

if [ -n "$KMS_KEY_ID" ]; then
    check_status 0 "KMS key exists: ${KMS_KEY_ID}"
    
    # Check key rotation
    ROTATION_ENABLED=$(aws kms get-key-rotation-status \
        --key-id $KMS_KEY_ID \
        --query 'KeyRotationEnabled' \
        --output text)
    
    if [ "$ROTATION_ENABLED" == "True" ]; then
        check_status 0 "Key rotation is enabled"
    else
        check_status 1 "Key rotation is NOT enabled"
    fi
else
    check_status 1 "KMS key not found"
fi
echo ""

# ========================================
# 2. Check Aurora Encryption
# ========================================
echo "2. Checking Aurora Encryption..."

CLUSTER_ID="fibonacci-cluster-${ENV}"
AURORA_ENCRYPTED=$(aws rds describe-db-clusters \
    --db-cluster-identifier $CLUSTER_ID \
    --query 'DBClusters[0].StorageEncrypted' \
    --output text 2>/dev/null || echo "false")

if [ "$AURORA_ENCRYPTED" == "True" ]; then
    check_status 0 "Aurora cluster is encrypted"
    
    # Check if using KMS
    AURORA_KMS_KEY=$(aws rds describe-db-clusters \
        --db-cluster-identifier $CLUSTER_ID \
        --query 'DBClusters[0].KmsKeyId' \
        --output text 2>/dev/null || echo "")
    
    if [[ "$AURORA_KMS_KEY" == *"$KMS_KEY_ID"* ]]; then
        check_status 0 "Aurora using customer-managed KMS key"
    else
        check_warning "Aurora using different KMS key: ${AURORA_KMS_KEY}"
    fi
else
    check_status 1 "Aurora cluster is NOT encrypted"
fi
echo ""

# ========================================
# 3. Check S3 Encryption
# ========================================
echo "3. Checking S3 Bucket Encryption..."

BUCKET_NAME="fibonacci-site-${ENV}-${ACCOUNT_ID}"
S3_ENCRYPTION=$(aws s3api get-bucket-encryption \
    --bucket $BUCKET_NAME \
    --query 'ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm' \
    --output text 2>/dev/null || echo "")

if [ "$S3_ENCRYPTION" == "aws:kms" ]; then
    check_status 0 "S3 bucket using KMS encryption"
    
    # Check bucket key
    BUCKET_KEY_ENABLED=$(aws s3api get-bucket-encryption \
        --bucket $BUCKET_NAME \
        --query 'ServerSideEncryptionConfiguration.Rules[0].BucketKeyEnabled' \
        --output text 2>/dev/null || echo "false")
    
    if [ "$BUCKET_KEY_ENABLED" == "True" ]; then
        check_status 0 "S3 bucket key enabled (cost optimized)"
    else
        check_warning "S3 bucket key not enabled (higher KMS costs)"
    fi
    
    # Check SSL enforcement
    SSL_POLICY=$(aws s3api get-bucket-policy \
        --bucket $BUCKET_NAME \
        --query 'Policy' \
        --output text 2>/dev/null | grep -c "aws:SecureTransport" || echo "0")
    
    if [ "$SSL_POLICY" -gt 0 ]; then
        check_status 0 "S3 SSL/TLS enforcement enabled"
    else
        check_status 1 "S3 SSL/TLS enforcement NOT enabled"
    fi
else
    check_status 1 "S3 bucket NOT using KMS encryption (found: ${S3_ENCRYPTION})"
fi
echo ""

# ========================================
# 4. Check SQS Encryption
# ========================================
echo "4. Checking SQS Queue Encryption..."

QUEUES=(
    "fibonacci-main-${ENV}"
    "fibonacci-dlq-${ENV}"
    "nigredo-recebimento-${ENV}"
    "nigredo-estrategia-${ENV}"
    "nigredo-disparo-${ENV}"
)

ENCRYPTED_COUNT=0
TOTAL_QUEUES=${#QUEUES[@]}

for QUEUE_NAME in "${QUEUES[@]}"; do
    QUEUE_URL=$(aws sqs get-queue-url \
        --queue-name $QUEUE_NAME \
        --query 'QueueUrl' \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$QUEUE_URL" ]; then
        KMS_KEY=$(aws sqs get-queue-attributes \
            --queue-url $QUEUE_URL \
            --attribute-names KmsMasterKeyId \
            --query 'Attributes.KmsMasterKeyId' \
            --output text 2>/dev/null || echo "")
        
        if [ -n "$KMS_KEY" ] && [ "$KMS_KEY" != "None" ]; then
            ((ENCRYPTED_COUNT++))
        fi
    fi
done

if [ $ENCRYPTED_COUNT -eq $TOTAL_QUEUES ]; then
    check_status 0 "All SQS queues encrypted (${ENCRYPTED_COUNT}/${TOTAL_QUEUES})"
elif [ $ENCRYPTED_COUNT -gt 0 ]; then
    check_warning "Some SQS queues encrypted (${ENCRYPTED_COUNT}/${TOTAL_QUEUES})"
else
    check_status 1 "No SQS queues encrypted (${ENCRYPTED_COUNT}/${TOTAL_QUEUES})"
fi
echo ""

# ========================================
# 5. Check CloudFront TLS
# ========================================
echo "5. Checking CloudFront TLS Configuration..."

DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
    --stack-name FibonacciStack-${ENV} \
    --query 'Stacks[0].Outputs[?OutputKey==`DistributionId`].OutputValue' \
    --output text 2>/dev/null || echo "")

if [ -n "$DISTRIBUTION_ID" ]; then
    MIN_TLS_VERSION=$(aws cloudfront get-distribution-config \
        --id $DISTRIBUTION_ID \
        --query 'DistributionConfig.ViewerCertificate.MinimumProtocolVersion' \
        --output text 2>/dev/null || echo "")
    
    if [[ "$MIN_TLS_VERSION" == *"TLSv1.2"* ]] || [[ "$MIN_TLS_VERSION" == *"TLSv1.3"* ]]; then
        check_status 0 "CloudFront using TLS 1.2+ (${MIN_TLS_VERSION})"
    else
        check_status 1 "CloudFront NOT using TLS 1.2+ (found: ${MIN_TLS_VERSION})"
    fi
    
    # Check HTTPS enforcement
    VIEWER_PROTOCOL=$(aws cloudfront get-distribution-config \
        --id $DISTRIBUTION_ID \
        --query 'DistributionConfig.DefaultCacheBehavior.ViewerProtocolPolicy' \
        --output text 2>/dev/null || echo "")
    
    if [ "$VIEWER_PROTOCOL" == "redirect-to-https" ] || [ "$VIEWER_PROTOCOL" == "https-only" ]; then
        check_status 0 "CloudFront enforcing HTTPS (${VIEWER_PROTOCOL})"
    else
        check_status 1 "CloudFront NOT enforcing HTTPS (found: ${VIEWER_PROTOCOL})"
    fi
else
    check_warning "CloudFront distribution not found"
fi
echo ""

# ========================================
# 6. Check Lambda Environment Encryption
# ========================================
echo "6. Checking Lambda Environment Variable Encryption..."

LAMBDA_FUNCTIONS=(
    "fibonacci-api-handler-${ENV}"
    "nigredo-recebimento-${ENV}"
    "nigredo-estrategia-${ENV}"
)

LAMBDA_ENCRYPTED_COUNT=0
LAMBDA_TOTAL=${#LAMBDA_FUNCTIONS[@]}

for FUNCTION_NAME in "${LAMBDA_FUNCTIONS[@]}"; do
    ENV_KMS_KEY=$(aws lambda get-function-configuration \
        --function-name $FUNCTION_NAME \
        --query 'KMSKeyArn' \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$ENV_KMS_KEY" ] && [ "$ENV_KMS_KEY" != "None" ]; then
        ((LAMBDA_ENCRYPTED_COUNT++))
    fi
done

if [ $LAMBDA_ENCRYPTED_COUNT -gt 0 ]; then
    check_status 0 "Lambda environment variables encrypted (${LAMBDA_ENCRYPTED_COUNT}/${LAMBDA_TOTAL})"
else
    check_warning "Lambda environment variables using default encryption (${LAMBDA_ENCRYPTED_COUNT}/${LAMBDA_TOTAL})"
fi
echo ""

# ========================================
# Summary
# ========================================
echo "========================================="
echo "Compliance Summary"
echo "========================================="
echo ""
echo "Encryption at Rest:"
echo "  - KMS Key: $([ -n "$KMS_KEY_ID" ] && echo "✓" || echo "✗")"
echo "  - Aurora: $([ "$AURORA_ENCRYPTED" == "True" ] && echo "✓" || echo "✗")"
echo "  - S3: $([ "$S3_ENCRYPTION" == "aws:kms" ] && echo "✓" || echo "✗")"
echo "  - SQS: $([ $ENCRYPTED_COUNT -eq $TOTAL_QUEUES ] && echo "✓" || echo "⚠")"
echo ""
echo "Encryption in Transit:"
echo "  - CloudFront TLS 1.2+: $([ -n "$MIN_TLS_VERSION" ] && [[ "$MIN_TLS_VERSION" == *"TLSv1.2"* ]] && echo "✓" || echo "✗")"
echo "  - S3 SSL Enforcement: $([ "$SSL_POLICY" -gt 0 ] && echo "✓" || echo "✗")"
echo ""
echo "========================================="
echo "Check complete!"
echo "========================================="
