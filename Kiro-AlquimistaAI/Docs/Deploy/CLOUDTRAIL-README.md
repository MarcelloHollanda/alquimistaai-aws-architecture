# CloudTrail Documentation

## Quick Navigation

This directory contains comprehensive documentation for the CloudTrail implementation (Task 32).

### 📚 Documentation Files

1. **[TASK-32-IMPLEMENTATION-SUMMARY.md](./TASK-32-IMPLEMENTATION-SUMMARY.md)**
   - Executive summary of what was implemented
   - Quick overview of features and benefits
   - **Start here** for a high-level understanding

2. **[CLOUDTRAIL-IMPLEMENTATION.md](./CLOUDTRAIL-IMPLEMENTATION.md)**
   - Detailed technical implementation guide
   - Configuration details and architecture
   - Usage examples and best practices
   - Cost optimization strategies
   - Troubleshooting guide
   - **Read this** for complete technical details

3. **[CLOUDTRAIL-QUICK-REFERENCE.md](./CLOUDTRAIL-QUICK-REFERENCE.md)**
   - Quick access commands and queries
   - Common AWS CLI operations
   - CloudWatch Insights queries
   - Emergency procedures
   - **Use this** for day-to-day operations

4. **[TASK-32-CHECKLIST.md](./TASK-32-CHECKLIST.md)**
   - Implementation checklist
   - Verification steps
   - Requirements mapping
   - **Use this** to verify deployment

## What is CloudTrail?

AWS CloudTrail is a service that enables governance, compliance, operational auditing, and risk auditing of your AWS account. It logs all API calls made in your AWS account, providing a complete audit trail of administrative actions.

## What Was Implemented?

✅ **Multi-region CloudTrail trail** capturing all AWS API calls
✅ **S3 bucket** with 90-day retention and lifecycle rules
✅ **CloudWatch Logs integration** for real-time monitoring
✅ **Data event logging** for S3 and Lambda
✅ **Security alarms** for unauthorized access, security group changes, and IAM changes
✅ **Metric filters** for automated threat detection
✅ **KMS encryption** for all logs

## Quick Start

### View Recent Events
```bash
aws cloudtrail lookup-events --max-results 10
```

### Check Trail Status
```bash
aws cloudtrail get-trail-status --name fibonacci-trail-{env}
```

### View CloudWatch Logs
```bash
aws logs tail /aws/cloudtrail/fibonacci-{env} --follow
```

### Download Logs from S3
```bash
aws s3 ls s3://fibonacci-cloudtrail-{env}-{account-id}/AWSLogs/ --recursive
```

## Common Use Cases

### 1. Security Investigation
Find unauthorized API calls:
```
fields @timestamp, userIdentity.principalId, eventName, errorCode
| filter errorCode like /UnauthorizedOperation|AccessDenied/
| sort @timestamp desc
```

### 2. Compliance Auditing
Generate activity report:
```bash
aws cloudtrail lookup-events \
  --start-time $(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%SZ) \
  --max-results 1000 \
  > cloudtrail-report-$(date +%Y%m%d).json
```

### 3. Change Tracking
Find IAM policy changes:
```
fields @timestamp, userIdentity.principalId, eventName, requestParameters
| filter eventName like /Put.*Policy|Create.*Policy|Delete.*Policy/
| sort @timestamp desc
```

### 4. Resource Access Monitoring
Track S3 object access:
```
fields @timestamp, userIdentity.principalId, requestParameters.bucketName, requestParameters.key
| filter eventName like /GetObject|PutObject|DeleteObject/
| sort @timestamp desc
```

## Architecture Overview

```
CloudTrail Trail
    ├── Management Events (All AWS API calls)
    ├── Data Events
    │   ├── S3 (Site bucket + CloudTrail bucket)
    │   └── Lambda (API Handler + future functions)
    ├── S3 Bucket (90-day retention)
    │   ├── Standard (0-30 days)
    │   ├── Infrequent Access (31-60 days)
    │   └── Glacier (61-90 days)
    ├── CloudWatch Logs (Real-time)
    │   ├── Metric Filter: UnauthorizedAPICalls
    │   ├── Metric Filter: SecurityGroupChanges
    │   └── Metric Filter: IAMPolicyChanges
    └── CloudWatch Alarms (3 security alarms)
```

## Security Features

- 🔒 **KMS Encryption**: All logs encrypted at rest
- 🚫 **Block Public Access**: S3 bucket is private
- ✅ **File Validation**: Ensures log integrity
- 📝 **Versioning**: Prevents log tampering
- 🔔 **Real-time Alerts**: Immediate notification of suspicious activities
- 🔍 **Comprehensive Logging**: Management + Data events

## Cost Estimate

| Service | Monthly Cost |
|---------|-------------|
| CloudTrail (data events) | $5-10 |
| S3 Storage (with lifecycle) | $2-5 |
| CloudWatch Logs | $3-8 |
| **Total** | **$10-23** |

## Compliance

✅ **Audit Trail**: Complete history of administrative actions
✅ **90-day Retention**: Meets most compliance requirements
✅ **Log Integrity**: File validation enabled
✅ **Encryption**: At rest and in transit
✅ **Immutability**: Versioning prevents tampering

## Alarms

Three security alarms are configured:

1. **Unauthorized API Calls** - Detects access denied errors
2. **Security Group Changes** - Detects network configuration changes
3. **IAM Policy Changes** - Detects permission modifications

Subscribe to notifications:
```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:{account-id}:fibonacci-alarms-{env} \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## Troubleshooting

### Trail Not Logging?
```bash
# Check status
aws cloudtrail get-trail-status --name fibonacci-trail-{env}

# Start logging if stopped
aws cloudtrail start-logging --name fibonacci-trail-{env}
```

### Missing Events?
```bash
# Verify event selectors
aws cloudtrail get-event-selectors --trail-name fibonacci-trail-{env}
```

### Alarms Not Triggering?
```bash
# Check metric filters
aws logs describe-metric-filters --log-group-name /aws/cloudtrail/fibonacci-{env}

# Check alarm status
aws cloudwatch describe-alarms --alarm-name-prefix fibonacci
```

## Next Steps

1. **Deploy**: `npm run deploy:dev`
2. **Verify**: Follow verification steps in TASK-32-CHECKLIST.md
3. **Configure**: Set up SNS email notifications
4. **Monitor**: Review logs regularly
5. **Optimize**: Adjust retention and data events as needed

## Support

- 📖 [AWS CloudTrail Documentation](https://docs.aws.amazon.com/cloudtrail/)
- 🔧 [CloudTrail Best Practices](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/best-practices-security.html)
- 💰 [CloudTrail Pricing](https://aws.amazon.com/cloudtrail/pricing/)
- 🆘 [AWS Support](https://console.aws.amazon.com/support/)

## Related Documentation

- [IAM Roles Documentation](./IAM-ROLES-DOCUMENTATION.md) - Task 30
- [Encryption Configuration](./ENCRYPTION-CONFIGURATION.md) - Task 31
- [CloudWatch Alarms](./CLOUDWATCH-ALARMS.md) - Task 26
- [CloudWatch Dashboards](./CLOUDWATCH-DASHBOARDS.md) - Task 25

---

**Task 32 Status**: ✅ COMPLETED

For questions or issues, refer to the detailed documentation files above.
