# Encryption Quick Reference

## ✅ Encryption Status

### At Rest
- ✅ **Aurora PostgreSQL**: KMS encrypted (customer-managed key)
- ✅ **S3 Buckets**: KMS encrypted with bucket keys
- ✅ **SQS Queues**: KMS encrypted (all queues)
- ✅ **Secrets Manager**: AWS managed key (default)

### In Transit
- ✅ **CloudFront**: TLS 1.2+ enforced
- ✅ **API Gateway**: TLS 1.2+ (default)
- ✅ **S3**: SSL/TLS enforced
- ✅ **Aurora**: SSL/TLS required
- ✅ **External APIs**: HTTPS only

## 🔑 KMS Key Information

**Key Alias**: `fibonacci-encryption-key-{env}`

**Get Key ARN:**
```bash
aws kms describe-key --key-id alias/fibonacci-encryption-key-dev \
  --query 'KeyMetadata.Arn' --output text
```

**Check Rotation Status:**
```bash
aws kms get-key-rotation-status --key-id alias/fibonacci-encryption-key-dev
```

## 🔍 Verification Commands

### Aurora Encryption
```bash
aws rds describe-db-clusters \
  --db-cluster-identifier fibonacci-cluster-dev \
  --query 'DBClusters[0].[StorageEncrypted,KmsKeyId]' \
  --output table
```

### S3 Encryption
```bash
aws s3api get-bucket-encryption \
  --bucket fibonacci-site-dev-$(aws sts get-caller-identity --query Account --output text)
```

### SQS Encryption
```bash
aws sqs get-queue-attributes \
  --queue-url $(aws sqs get-queue-url --queue-name fibonacci-main-dev --query QueueUrl --output text) \
  --attribute-names KmsMasterKeyId KmsDataKeyReusePeriodSeconds
```

### CloudFront TLS
```bash
aws cloudfront get-distribution-config \
  --id $(aws cloudformation describe-stacks --stack-name FibonacciStack-dev \
    --query 'Stacks[0].Outputs[?OutputKey==`DistributionId`].OutputValue' --output text) \
  --query 'DistributionConfig.ViewerCertificate.MinimumProtocolVersion'
```

## 📊 Cost Estimate

| Resource | Monthly Cost |
|----------|--------------|
| KMS Key | $1.00 |
| KMS API Requests (dev) | $0.30 |
| KMS API Requests (prod) | $30.00 |
| **Total (dev)** | **$1.30** |
| **Total (prod)** | **$31.00** |

## 🚨 Troubleshooting

### Lambda Can't Decrypt SQS Messages
```bash
# Check Lambda role permissions
aws iam get-role-policy \
  --role-name $(aws lambda get-function --function-name fibonacci-api-handler-dev \
    --query 'Configuration.Role' --output text | cut -d'/' -f2) \
  --policy-name default
```

**Fix**: Ensure role has `kms:Decrypt` permission

### S3 Access Denied
```bash
# Check bucket policy
aws s3api get-bucket-policy \
  --bucket fibonacci-site-dev-ACCOUNT_ID
```

**Fix**: Ensure requests use HTTPS and principal has `kms:GenerateDataKey`

### Aurora SSL Connection Failed
```bash
# Download RDS CA bundle
wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
```

**Fix**: Add `sslmode=require` to connection string

## 📝 Common Tasks

### Rotate KMS Key Manually
```bash
# Create new key
NEW_KEY_ID=$(aws kms create-key \
  --description "Fibonacci encryption key (rotated)" \
  --query 'KeyMetadata.KeyId' --output text)

# Update alias
aws kms update-alias \
  --alias-name alias/fibonacci-encryption-key-dev \
  --target-key-id $NEW_KEY_ID

# Schedule old key deletion (30 days)
aws kms schedule-key-deletion \
  --key-id OLD_KEY_ID \
  --pending-window-in-days 30
```

### Grant Lambda Access to KMS Key
```bash
# Get Lambda role ARN
LAMBDA_ROLE=$(aws lambda get-function \
  --function-name fibonacci-api-handler-dev \
  --query 'Configuration.Role' --output text)

# Add inline policy
aws iam put-role-policy \
  --role-name $(echo $LAMBDA_ROLE | cut -d'/' -f2) \
  --policy-name KMSDecryptPolicy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["kms:Decrypt", "kms:GenerateDataKey"],
      "Resource": "arn:aws:kms:us-east-1:ACCOUNT_ID:key/KEY_ID"
    }]
  }'
```

### Check Encryption Compliance
```bash
# Run compliance check script
./scripts/check-encryption-compliance.sh dev
```

## 🔗 Related Documentation

- [Full Encryption Configuration](./ENCRYPTION-CONFIGURATION.md)
- [Security Best Practices](./SECURITY.md)
- [IAM Roles Documentation](./IAM-ROLES-DOCUMENTATION.md)
- [CloudWatch Alarms](./CLOUDWATCH-ALARMS.md)

## 📞 Support

For encryption-related issues:
1. Check CloudTrail logs for KMS operations
2. Review Lambda execution logs
3. Verify IAM permissions
4. Contact AWS Support if needed

## ✨ Key Features

- 🔐 **Customer-Managed Keys**: Full control over encryption keys
- 🔄 **Automatic Rotation**: Annual key rotation enabled
- 💰 **Cost Optimized**: S3 bucket keys reduce KMS costs by 99%
- 🛡️ **Defense in Depth**: Encryption at rest + in transit
- 📊 **Full Audit Trail**: All key usage logged to CloudTrail
- ✅ **Compliance Ready**: Meets LGPD, GDPR, PCI DSS requirements
