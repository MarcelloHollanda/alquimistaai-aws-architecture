# Encryption Configuration - Fibonacci Ecosystem

## Overview

This document describes the encryption configuration implemented across the Fibonacci ecosystem to ensure data security at rest and in transit, meeting requirements 17.1 and 17.2.

## Encryption at Rest

### KMS Key Management

A centralized AWS KMS (Key Management Service) key is created in the Fibonacci stack and shared across all resources:

**Key Features:**
- **Automatic Key Rotation**: Enabled (annual rotation)
- **Alias**: `fibonacci-encryption-key-{env}`
- **Deletion Protection**: Configurable per environment (7-day pending window)
- **Service Permissions**: Granted to S3, SQS, and RDS services

**Key ARN Output**: Available as CloudFormation output `FibonacciKmsKeyArn-{env}`

### Aurora PostgreSQL Encryption

**Configuration:**
```typescript
storageEncrypted: true
storageEncryptionKey: kmsKey  // Customer-managed KMS key
```

**Details:**
- All data at rest is encrypted using AES-256
- Automated backups are encrypted with the same key
- Read replicas (when added) will inherit encryption
- Encryption cannot be disabled after cluster creation

**Benefits:**
- Compliance with data protection regulations (LGPD, GDPR)
- Centralized key management and rotation
- Audit trail via CloudTrail for key usage

### S3 Bucket Encryption

**Configuration:**
```typescript
encryption: s3.BucketEncryption.KMS
encryptionKey: kmsKey
bucketKeyEnabled: true  // Reduces KMS costs
```

**Details:**
- All objects are encrypted using SSE-KMS
- Bucket keys reduce KMS API calls by ~99%
- Versioned objects are individually encrypted
- SSL/TLS enforced for all uploads (`enforceSSL: true`)

**Cost Optimization:**
- Bucket keys significantly reduce KMS request costs
- Estimated savings: $0.05 per 1000 requests → $0.0005 per 1000 requests

### SQS Queue Encryption

**Configuration:**
```typescript
encryption: sqs.QueueEncryption.KMS
encryptionMasterKey: kmsKey
```

**Encrypted Queues:**
- Fibonacci Main Queue
- Fibonacci DLQ
- All agent-specific queues (recebimento, estratégia, disparo, etc.)
- Nigredo DLQ
- All Nigredo agent queues

**Details:**
- Messages are encrypted at rest in SQS
- Encryption/decryption is transparent to applications
- Lambda functions automatically decrypt messages
- Dead letter queues maintain encryption

**Important Notes:**
- KMS key policy must allow SQS service principal
- Lambda execution roles need `kms:Decrypt` permission
- Message retention period: 14 days for DLQ, 4 days for standard queues

## Encryption in Transit

### TLS 1.2+ Enforcement

All data in transit is encrypted using TLS 1.2 or higher:

#### CloudFront Distribution

**Configuration:**
```typescript
minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021
viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
```

**Details:**
- Minimum TLS version: 1.2
- Supported ciphers: Modern, secure cipher suites only
- HTTP requests automatically redirected to HTTPS
- Perfect Forward Secrecy (PFS) enabled

**Supported TLS Versions:**
- TLS 1.2 ✅
- TLS 1.3 ✅
- TLS 1.1 ❌ (deprecated)
- TLS 1.0 ❌ (deprecated)
- SSL 3.0 ❌ (insecure)

#### API Gateway

**Configuration:**
- HTTP API Gateway uses TLS 1.2 by default
- Custom domains can enforce TLS 1.2+ via security policy
- CORS configured to allow HTTPS origins only

**Details:**
- All API endpoints use HTTPS
- Certificate managed by AWS Certificate Manager (ACM)
- Automatic certificate renewal

#### S3 Bucket Policy

**Configuration:**
```typescript
enforceSSL: true
```

**Details:**
- Denies all requests not using HTTPS
- Bucket policy explicitly requires `aws:SecureTransport`
- Applies to all object operations (GET, PUT, DELETE)

#### Lambda to Aurora

**Configuration:**
- Lambda functions connect to Aurora via VPC
- PostgreSQL connections use SSL/TLS
- Connection string includes `sslmode=require`

**Details:**
- Private subnet isolation (no internet gateway)
- Security group rules restrict access
- RDS enforces encrypted connections

#### Lambda to External APIs (MCP)

**Configuration:**
- All MCP integrations use HTTPS
- TLS 1.2+ enforced by AWS SDK
- Certificate validation enabled

**External Services:**
- WhatsApp Business API: HTTPS only
- Google Calendar API: HTTPS only
- AWS Comprehend: HTTPS only (AWS internal)
- Data enrichment APIs: HTTPS only

## Key Permissions and IAM

### KMS Key Policy

The KMS key has the following permissions:

**Service Principals:**
```typescript
// S3 Service
{
  "Sid": "Allow AWS Services",
  "Principal": { "Service": "s3.amazonaws.com" },
  "Action": ["kms:Decrypt", "kms:GenerateDataKey"]
}

// SQS Service
{
  "Sid": "Allow SQS Service",
  "Principal": { "Service": "sqs.amazonaws.com" },
  "Action": ["kms:Decrypt", "kms:GenerateDataKey"]
}

// RDS Service
{
  "Sid": "Allow RDS Service",
  "Principal": { "Service": "rds.amazonaws.com" },
  "Action": ["kms:Decrypt", "kms:GenerateDataKey", "kms:CreateGrant"]
}
```

### Lambda Execution Roles

All Lambda functions that interact with encrypted resources have the following permissions:

**Automatic Grants:**
- `kms:Decrypt` - Granted automatically by CDK when using encrypted SQS queues
- `kms:GenerateDataKey` - Granted for encrypting new messages
- `secretsmanager:GetSecretValue` - For database credentials

**Manual Grants:**
- Secrets Manager secrets are encrypted with default AWS managed key
- Can be migrated to customer-managed key if needed

## Compliance and Audit

### CloudTrail Integration

All KMS key usage is logged to CloudTrail:

**Logged Events:**
- `Encrypt` - When data is encrypted
- `Decrypt` - When data is decrypted
- `GenerateDataKey` - When data keys are generated
- `RotateKey` - When key is rotated

**Audit Queries:**
```sql
-- Find all KMS decrypt operations
SELECT eventTime, userIdentity.principalId, requestParameters.encryptionContext
FROM cloudtrail_logs
WHERE eventName = 'Decrypt'
AND resources[0].ARN = 'arn:aws:kms:us-east-1:ACCOUNT_ID:key/KEY_ID'
ORDER BY eventTime DESC
```

### Key Rotation

**Automatic Rotation:**
- Enabled by default
- Rotates annually
- Old key versions retained for decryption
- No application changes required

**Manual Rotation:**
```bash
# Check rotation status
aws kms get-key-rotation-status --key-id alias/fibonacci-encryption-key-dev

# Enable rotation (if disabled)
aws kms enable-key-rotation --key-id alias/fibonacci-encryption-key-dev
```

### Compliance Standards

This encryption configuration helps meet:

- **LGPD** (Lei Geral de Proteção de Dados) - Brazilian data protection law
- **GDPR** (General Data Protection Regulation) - European data protection
- **PCI DSS** - Payment Card Industry Data Security Standard
- **HIPAA** - Health Insurance Portability and Accountability Act (if applicable)
- **SOC 2** - Service Organization Control 2

## Cost Considerations

### KMS Costs

**Pricing (us-east-1):**
- Customer managed key: $1/month
- Key rotation: Free
- API requests: $0.03 per 10,000 requests

**Estimated Monthly Costs:**
```
Environment: Development
- KMS key: $1.00
- API requests (100K): $0.30
- Total: ~$1.30/month

Environment: Production
- KMS key: $1.00
- API requests (10M): $30.00
- Total: ~$31.00/month
```

**Cost Optimization:**
- S3 bucket keys reduce KMS requests by 99%
- SQS batch processing reduces per-message encryption overhead
- Lambda environment variable caching reduces Secrets Manager calls

### Storage Costs

**Encryption Overhead:**
- Aurora: No additional storage cost for encryption
- S3: No additional storage cost for encryption
- SQS: No additional storage cost for encryption

**Note:** Encryption adds negligible performance overhead (<1% CPU)

## Troubleshooting

### Common Issues

#### 1. Lambda Cannot Decrypt SQS Messages

**Error:**
```
KMS.AccessDeniedException: User: arn:aws:sts::ACCOUNT:assumed-role/lambda-role is not authorized to perform: kms:Decrypt
```

**Solution:**
- Verify Lambda execution role has `kms:Decrypt` permission
- Check KMS key policy allows Lambda service principal
- Ensure key is in the same region as Lambda

#### 2. S3 Access Denied

**Error:**
```
Access Denied: The bucket does not allow unencrypted requests
```

**Solution:**
- Ensure all S3 requests use HTTPS
- Verify IAM role has `kms:GenerateDataKey` permission
- Check bucket policy allows the principal

#### 3. Aurora Connection Fails

**Error:**
```
SSL connection required
```

**Solution:**
- Add `sslmode=require` to connection string
- Download RDS CA certificate bundle
- Verify security group allows port 5432

### Verification Commands

**Check KMS Key Status:**
```bash
aws kms describe-key --key-id alias/fibonacci-encryption-key-dev
```

**Check S3 Encryption:**
```bash
aws s3api get-bucket-encryption --bucket fibonacci-site-dev-ACCOUNT_ID
```

**Check SQS Encryption:**
```bash
aws sqs get-queue-attributes \
  --queue-url https://sqs.us-east-1.amazonaws.com/ACCOUNT_ID/fibonacci-main-dev \
  --attribute-names KmsMasterKeyId
```

**Check Aurora Encryption:**
```bash
aws rds describe-db-clusters \
  --db-cluster-identifier fibonacci-cluster-dev \
  --query 'DBClusters[0].StorageEncrypted'
```

## Security Best Practices

### Key Management

1. **Never share KMS keys across environments**
   - Each environment (dev, staging, prod) has its own key
   - Prevents accidental data access across environments

2. **Enable key rotation**
   - Automatic annual rotation enabled
   - Reduces risk of key compromise

3. **Use least privilege**
   - Grant only necessary KMS permissions
   - Use resource-based policies when possible

4. **Monitor key usage**
   - Set up CloudWatch alarms for unusual activity
   - Review CloudTrail logs regularly

### Data Protection

1. **Encrypt all sensitive data**
   - Database credentials in Secrets Manager
   - Lead data in Aurora
   - Messages in SQS queues
   - Files in S3 buckets

2. **Enforce TLS 1.2+**
   - CloudFront minimum protocol version
   - API Gateway security policy
   - Database connections

3. **Implement defense in depth**
   - Encryption at rest + in transit
   - Network isolation (VPC, security groups)
   - IAM least privilege
   - Audit logging

### Incident Response

**If key compromise is suspected:**

1. **Immediate Actions:**
   ```bash
   # Disable key (prevents new operations)
   aws kms disable-key --key-id KEY_ID
   
   # Review recent usage
   aws cloudtrail lookup-events \
     --lookup-attributes AttributeKey=ResourceName,AttributeValue=KEY_ARN \
     --max-results 100
   ```

2. **Create new key:**
   ```bash
   # Create new key
   aws kms create-key --description "Fibonacci encryption key (rotated)"
   
   # Create alias
   aws kms create-alias \
     --alias-name alias/fibonacci-encryption-key-dev-new \
     --target-key-id NEW_KEY_ID
   ```

3. **Update infrastructure:**
   - Update CDK code with new key ID
   - Deploy updated stacks
   - Re-encrypt data with new key

4. **Schedule old key deletion:**
   ```bash
   # Schedule deletion (7-30 days)
   aws kms schedule-key-deletion --key-id OLD_KEY_ID --pending-window-in-days 30
   ```

## References

- [AWS KMS Best Practices](https://docs.aws.amazon.com/kms/latest/developerguide/best-practices.html)
- [RDS Encryption](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Overview.Encryption.html)
- [S3 Encryption](https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingEncryption.html)
- [SQS Encryption](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-server-side-encryption.html)
- [CloudFront TLS](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/secure-connections-supported-viewer-protocols-ciphers.html)

## Changelog

### 2024-01-XX - Initial Implementation
- Created centralized KMS key for Fibonacci ecosystem
- Configured Aurora encryption with KMS
- Configured S3 encryption with KMS and bucket keys
- Configured SQS encryption with KMS for all queues
- Enforced TLS 1.2+ on CloudFront distribution
- Enforced SSL on S3 bucket
- Documented encryption configuration and best practices
