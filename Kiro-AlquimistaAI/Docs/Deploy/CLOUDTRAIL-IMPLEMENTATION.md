# CloudTrail Implementation - Task 32

## Overview

CloudTrail has been successfully implemented in the Fibonacci Stack to provide comprehensive auditing of administrative actions and data events across the AWS infrastructure.

## Implementation Details

### 1. CloudTrail Configuration

**Location**: `lib/fibonacci-stack.ts` (after KMS Key section)

**Features**:
- **Multi-region trail**: Captures events from all AWS regions
- **Management events**: Logs all administrative actions (READ and WRITE)
- **Data events**: Logs S3 object-level operations and Lambda invocations
- **File validation**: Ensures log integrity with digital signatures
- **CloudWatch Logs integration**: Real-time log streaming for alerting
- **KMS encryption**: All logs encrypted at rest using customer-managed KMS key

### 2. S3 Bucket for CloudTrail Logs

**Bucket Name**: `fibonacci-cloudtrail-{env}-{account-id}`

**Configuration**:
- KMS encryption using Fibonacci KMS key
- Block all public access
- SSL enforcement
- Versioning enabled
- Lifecycle rules:
  - Move to Infrequent Access after 30 days
  - Move to Glacier after 60 days
  - Delete after 90 days (retention requirement)

### 3. CloudWatch Logs Integration

**Log Group**: `/aws/cloudtrail/fibonacci-{env}`

**Retention**:
- Production: 30 days
- Dev/Staging: 7 days

**Purpose**: Enable real-time monitoring and alerting on CloudTrail events

### 4. Data Event Logging

#### S3 Data Events
Monitors all object-level operations on:
- Site bucket (`fibonacci-site-{env}-{account-id}`)
- CloudTrail bucket (self-monitoring)

**Events captured**:
- GetObject
- PutObject
- DeleteObject
- CopyObject
- And all other S3 API calls

#### Lambda Data Events
Monitors all Lambda function invocations:
- API Handler function
- Future agent functions (automatically included)

**Events captured**:
- Invoke
- InvokeAsync
- And all other Lambda API calls

### 5. Security Alarms

Three CloudWatch alarms have been configured to detect suspicious activities:

#### 5.1 Unauthorized API Calls Alarm
**Name**: `fibonacci-unauthorized-api-calls-{env}`

**Triggers on**:
- `UnauthorizedOperation` errors
- `AccessDenied` errors
- Threshold: 5 calls in 5 minutes

**Purpose**: Detect potential security breaches or misconfigured permissions

#### 5.2 Security Group Changes Alarm
**Name**: `fibonacci-security-group-changes-{env}`

**Triggers on**:
- AuthorizeSecurityGroupIngress
- AuthorizeSecurityGroupEgress
- RevokeSecurityGroupIngress
- RevokeSecurityGroupEgress
- CreateSecurityGroup
- DeleteSecurityGroup
- Threshold: 1 change

**Purpose**: Detect unauthorized network configuration changes

#### 5.3 IAM Policy Changes Alarm
**Name**: `fibonacci-iam-changes-{env}`

**Triggers on**:
- PutUserPolicy, PutRolePolicy, PutGroupPolicy
- CreatePolicy, DeletePolicy
- CreatePolicyVersion, DeletePolicyVersion
- AttachUserPolicy, DetachUserPolicy
- AttachRolePolicy, DetachRolePolicy
- AttachGroupPolicy, DetachGroupPolicy
- Threshold: 1 change

**Purpose**: Detect unauthorized permission changes

### 6. Metric Filters

Three metric filters have been created to transform CloudTrail logs into CloudWatch metrics:

1. **UnauthorizedAPICalls**: Counts unauthorized API attempts
2. **SecurityGroupChanges**: Counts security group modifications
3. **IAMPolicyChanges**: Counts IAM policy modifications

These metrics feed the alarms described above.

## CloudFormation Outputs

The following outputs are available after deployment:

| Output Name | Description | Export Name |
|-------------|-------------|-------------|
| CloudTrailName | ARN of the CloudTrail | FibonacciCloudTrailArn-{env} |
| CloudTrailBucketName | S3 bucket name for logs | FibonacciCloudTrailBucket-{env} |
| CloudTrailLogGroupName | CloudWatch Log Group name | FibonacciCloudTrailLogGroup-{env} |
| UnauthorizedApiCallsAlarmName | Alarm name for unauthorized calls | - |
| SecurityGroupChangesAlarmName | Alarm name for SG changes | - |
| IAMChangesAlarmName | Alarm name for IAM changes | - |

## Usage Examples

### 1. Query CloudTrail Logs via AWS CLI

```bash
# Get recent events
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=PutObject \
  --max-results 10

# Get events for specific user
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=Username,AttributeValue=admin \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-31T23:59:59Z
```

### 2. Query CloudWatch Logs Insights

```
# Find all unauthorized API calls
fields @timestamp, userIdentity.principalId, eventName, errorCode, errorMessage
| filter errorCode like /UnauthorizedOperation|AccessDenied/
| sort @timestamp desc
| limit 100

# Find all IAM changes
fields @timestamp, userIdentity.principalId, eventName, requestParameters
| filter eventName like /Put.*Policy|Create.*Policy|Delete.*Policy|Attach.*Policy|Detach.*Policy/
| sort @timestamp desc
| limit 100

# Find all Security Group changes
fields @timestamp, userIdentity.principalId, eventName, requestParameters.groupId
| filter eventName like /.*SecurityGroup.*/
| sort @timestamp desc
| limit 100
```

### 3. Download CloudTrail Logs from S3

```bash
# List log files
aws s3 ls s3://fibonacci-cloudtrail-{env}-{account-id}/AWSLogs/{account-id}/CloudTrail/us-east-1/

# Download specific log file
aws s3 cp s3://fibonacci-cloudtrail-{env}-{account-id}/AWSLogs/{account-id}/CloudTrail/us-east-1/2024/01/01/file.json.gz .

# Decompress and view
gunzip file.json.gz
cat file.json | jq .
```

### 4. Verify Log File Integrity

```bash
# Validate log file integrity
aws cloudtrail validate-logs \
  --trail-arn arn:aws:cloudtrail:us-east-1:{account-id}:trail/fibonacci-trail-{env} \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-31T23:59:59Z
```

## Security Best Practices

### 1. Access Control
- CloudTrail bucket has restrictive bucket policy
- Only CloudTrail service can write to the bucket
- Logs are encrypted with KMS
- MFA delete can be enabled for production

### 2. Monitoring
- Subscribe to alarm SNS topic for real-time notifications
- Review CloudTrail logs regularly
- Set up automated compliance checks

### 3. Compliance
- 90-day retention meets most compliance requirements
- Logs are immutable (versioning + lifecycle rules)
- File validation ensures integrity
- Encryption at rest and in transit

## Cost Optimization

### Current Configuration Costs (Estimated)

**CloudTrail**:
- First trail: Free for management events
- Data events: $0.10 per 100,000 events
- Estimated: $5-10/month for typical usage

**S3 Storage**:
- Standard: $0.023/GB for first 30 days
- IA: $0.0125/GB for days 31-60
- Glacier: $0.004/GB for days 61-90
- Estimated: $2-5/month for typical usage

**CloudWatch Logs**:
- Ingestion: $0.50/GB
- Storage: $0.03/GB/month
- Estimated: $3-8/month for typical usage

**Total Estimated Cost**: $10-23/month

### Cost Optimization Tips

1. **Adjust retention**: Reduce to 30 days if 90 days not required
2. **Filter data events**: Only log critical S3 buckets and Lambda functions
3. **Use S3 Intelligent-Tiering**: Automatically optimize storage costs
4. **Archive to Glacier Deep Archive**: For long-term retention beyond 90 days

## Troubleshooting

### Issue: CloudTrail not logging events

**Check**:
1. Trail is enabled: `aws cloudtrail get-trail-status --name fibonacci-trail-{env}`
2. S3 bucket policy allows CloudTrail writes
3. KMS key policy allows CloudTrail to use the key

### Issue: Alarms not triggering

**Check**:
1. Metric filters are correctly configured
2. CloudWatch Logs are being received
3. Alarm threshold and evaluation periods are appropriate
4. SNS topic subscription is confirmed

### Issue: High costs

**Check**:
1. Number of data events being logged
2. CloudWatch Logs ingestion volume
3. S3 storage growth rate
4. Consider filtering data events to critical resources only

## Compliance Mapping

### Requirement 17.4
✅ **Criar trail para auditoria de ações administrativas**
- Multi-region trail created
- Management events (READ/WRITE) enabled

✅ **Configurar logging de eventos de gerenciamento**
- All management events logged
- Includes IAM, EC2, RDS, Lambda, etc.

✅ **Configurar logging de eventos de dados (S3, Lambda)**
- S3 data events for site bucket and CloudTrail bucket
- Lambda data events for API handler

✅ **Armazenar logs em bucket S3 com retenção de 90 dias**
- Dedicated S3 bucket with lifecycle rules
- Automatic deletion after 90 days
- Transition to IA (30d) and Glacier (60d) for cost optimization

## Next Steps

### Recommended Enhancements

1. **SNS Email Subscription**: Configure email notifications for alarms
   ```bash
   aws sns subscribe \
     --topic-arn arn:aws:sns:us-east-1:{account-id}:fibonacci-alarms-{env} \
     --protocol email \
     --notification-endpoint ops@alquimista.ai
   ```

2. **Additional Metric Filters**: Add filters for:
   - Root account usage
   - Console login failures
   - KMS key deletion attempts
   - S3 bucket policy changes

3. **Automated Compliance Reports**: Use AWS Config or custom Lambda to generate compliance reports

4. **Integration with SIEM**: Forward CloudTrail logs to security information and event management system

5. **Cross-Account Logging**: Configure CloudTrail to log to a central security account

## References

- [AWS CloudTrail Documentation](https://docs.aws.amazon.com/cloudtrail/)
- [CloudTrail Best Practices](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/best-practices-security.html)
- [CloudTrail Log File Integrity](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-log-file-validation-intro.html)
- [CloudTrail Pricing](https://aws.amazon.com/cloudtrail/pricing/)

## Task Completion

✅ Task 32 completed successfully

All requirements have been implemented:
- ✅ Trail created for administrative action auditing
- ✅ Management event logging configured
- ✅ Data event logging configured (S3, Lambda)
- ✅ S3 bucket with 90-day retention
- ✅ Security alarms and metric filters
- ✅ CloudWatch Logs integration
- ✅ KMS encryption
- ✅ Documentation complete
