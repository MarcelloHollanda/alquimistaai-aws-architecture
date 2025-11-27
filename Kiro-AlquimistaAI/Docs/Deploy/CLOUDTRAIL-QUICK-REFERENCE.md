# CloudTrail Quick Reference

## Quick Access

### CloudTrail Console
```
https://console.aws.amazon.com/cloudtrail/home?region=us-east-1
```

### S3 Bucket
```
s3://fibonacci-cloudtrail-{env}-{account-id}
```

### CloudWatch Log Group
```
/aws/cloudtrail/fibonacci-{env}
```

## Common Commands

### View Recent Events
```bash
# Last 10 events
aws cloudtrail lookup-events --max-results 10

# Events by user
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=Username,AttributeValue=admin

# Events by resource
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=ResourceName,AttributeValue=fibonacci-api-handler-prod
```

### Check Trail Status
```bash
aws cloudtrail get-trail-status \
  --name fibonacci-trail-{env}
```

### Download Logs
```bash
# List logs
aws s3 ls s3://fibonacci-cloudtrail-{env}-{account-id}/AWSLogs/ --recursive

# Download specific log
aws s3 cp s3://fibonacci-cloudtrail-{env}-{account-id}/AWSLogs/{account-id}/CloudTrail/us-east-1/2024/01/01/file.json.gz .
```

### Validate Log Integrity
```bash
aws cloudtrail validate-logs \
  --trail-arn arn:aws:cloudtrail:us-east-1:{account-id}:trail/fibonacci-trail-{env} \
  --start-time 2024-01-01T00:00:00Z
```

## CloudWatch Logs Insights Queries

### Unauthorized API Calls
```
fields @timestamp, userIdentity.principalId, eventName, errorCode
| filter errorCode like /UnauthorizedOperation|AccessDenied/
| sort @timestamp desc
| limit 100
```

### IAM Changes
```
fields @timestamp, userIdentity.principalId, eventName, requestParameters
| filter eventName like /Put.*Policy|Create.*Policy|Delete.*Policy|Attach.*Policy|Detach.*Policy/
| sort @timestamp desc
```

### Security Group Changes
```
fields @timestamp, userIdentity.principalId, eventName, requestParameters.groupId
| filter eventName like /.*SecurityGroup.*/
| sort @timestamp desc
```

### Lambda Invocations
```
fields @timestamp, userIdentity.principalId, requestParameters.functionName
| filter eventName = "Invoke"
| stats count() by requestParameters.functionName
```

### S3 Object Access
```
fields @timestamp, userIdentity.principalId, requestParameters.bucketName, requestParameters.key
| filter eventName like /GetObject|PutObject|DeleteObject/
| sort @timestamp desc
```

## Alarms

### Check Alarm Status
```bash
# List all alarms
aws cloudwatch describe-alarms \
  --alarm-name-prefix fibonacci

# Check specific alarm
aws cloudwatch describe-alarms \
  --alarm-names fibonacci-unauthorized-api-calls-{env}
```

### Subscribe to Alarm Notifications
```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:{account-id}:fibonacci-alarms-{env} \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## Troubleshooting

### Trail Not Logging
```bash
# Check trail status
aws cloudtrail get-trail-status --name fibonacci-trail-{env}

# Check if trail is enabled
aws cloudtrail describe-trails --trail-name-list fibonacci-trail-{env}

# Start logging if stopped
aws cloudtrail start-logging --name fibonacci-trail-{env}
```

### Missing Events
```bash
# Check event selectors
aws cloudtrail get-event-selectors --trail-name fibonacci-trail-{env}

# Verify S3 bucket policy
aws s3api get-bucket-policy --bucket fibonacci-cloudtrail-{env}-{account-id}
```

### High Costs
```bash
# Check data events volume
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudTrail \
  --metric-name DataEventsDelivered \
  --dimensions Name=TrailName,Value=fibonacci-trail-{env} \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-31T23:59:59Z \
  --period 86400 \
  --statistics Sum
```

## Security Checks

### Verify Encryption
```bash
# Check KMS key
aws cloudtrail describe-trails --trail-name-list fibonacci-trail-{env} \
  | jq '.trailList[0].KmsKeyId'

# Verify S3 bucket encryption
aws s3api get-bucket-encryption \
  --bucket fibonacci-cloudtrail-{env}-{account-id}
```

### Verify File Validation
```bash
aws cloudtrail describe-trails --trail-name-list fibonacci-trail-{env} \
  | jq '.trailList[0].LogFileValidationEnabled'
```

### Check Access Logs
```bash
# List who accessed CloudTrail logs
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=ResourceType,AttributeValue=AWS::S3::Object \
  | jq '.Events[] | select(.Resources[].ResourceName | contains("cloudtrail"))'
```

## Compliance Reports

### Generate Activity Report
```bash
# All events in last 7 days
aws cloudtrail lookup-events \
  --start-time $(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%SZ) \
  --max-results 1000 \
  > cloudtrail-report-$(date +%Y%m%d).json
```

### Count Events by Type
```bash
aws cloudtrail lookup-events --max-results 1000 \
  | jq '.Events | group_by(.EventName) | map({event: .[0].EventName, count: length}) | sort_by(.count) | reverse'
```

### Find Root Account Usage
```bash
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=Username,AttributeValue=root \
  --max-results 100
```

## Cost Monitoring

### Estimate Monthly Costs
```bash
# Data events count (last 30 days)
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudTrail \
  --metric-name DataEventsDelivered \
  --dimensions Name=TrailName,Value=fibonacci-trail-{env} \
  --start-time $(date -u -d '30 days ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 2592000 \
  --statistics Sum

# S3 storage size
aws s3 ls s3://fibonacci-cloudtrail-{env}-{account-id} --recursive --summarize \
  | grep "Total Size"
```

## Outputs Reference

After deployment, get outputs:

```bash
# Get all CloudTrail outputs
aws cloudformation describe-stacks \
  --stack-name FibonacciStack-{env} \
  --query 'Stacks[0].Outputs[?contains(OutputKey, `CloudTrail`)]'

# Get specific output
aws cloudformation describe-stacks \
  --stack-name FibonacciStack-{env} \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudTrailBucketName`].OutputValue' \
  --output text
```

## Emergency Procedures

### Disable Trail (Emergency Only)
```bash
aws cloudtrail stop-logging --name fibonacci-trail-{env}
```

### Re-enable Trail
```bash
aws cloudtrail start-logging --name fibonacci-trail-{env}
```

### Export Logs for Investigation
```bash
# Sync all logs to local directory
aws s3 sync s3://fibonacci-cloudtrail-{env}-{account-id}/AWSLogs/ ./cloudtrail-logs/

# Search for specific event
find ./cloudtrail-logs -name "*.json.gz" -exec zgrep -l "DeleteBucket" {} \;
```

## Integration Examples

### Send to Slack
```bash
# Create Lambda function to process CloudTrail events and send to Slack
# Trigger: CloudWatch Logs subscription filter
```

### Export to Athena
```sql
-- Create Athena table for CloudTrail logs
CREATE EXTERNAL TABLE cloudtrail_logs (
  eventversion STRING,
  useridentity STRUCT<
    type:STRING,
    principalid:STRING,
    arn:STRING,
    accountid:STRING,
    invokedby:STRING,
    accesskeyid:STRING,
    userName:STRING
  >,
  eventtime STRING,
  eventsource STRING,
  eventname STRING,
  awsregion STRING,
  sourceipaddress STRING,
  useragent STRING,
  errorcode STRING,
  errormessage STRING,
  requestparameters STRING,
  responseelements STRING,
  additionaleventdata STRING,
  requestid STRING,
  eventid STRING,
  resources ARRAY<STRUCT<
    ARN:STRING,
    accountId:STRING,
    type:STRING
  >>,
  eventtype STRING,
  apiversion STRING,
  readonly STRING,
  recipientaccountid STRING,
  serviceeventdetails STRING,
  sharedeventid STRING,
  vpcendpointid STRING
)
ROW FORMAT SERDE 'com.amazon.emr.hive.serde.CloudTrailSerde'
STORED AS INPUTFORMAT 'com.amazon.emr.cloudtrail.CloudTrailInputFormat'
OUTPUTFORMAT 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat'
LOCATION 's3://fibonacci-cloudtrail-{env}-{account-id}/AWSLogs/{account-id}/CloudTrail/';
```

## Best Practices Checklist

- [ ] CloudTrail enabled in all regions
- [ ] Management events logging enabled
- [ ] Data events configured for critical resources
- [ ] Log file validation enabled
- [ ] Logs encrypted with KMS
- [ ] S3 bucket has restrictive policy
- [ ] CloudWatch Logs integration enabled
- [ ] Alarms configured for suspicious activities
- [ ] SNS notifications subscribed
- [ ] Regular log reviews scheduled
- [ ] Retention policy meets compliance requirements
- [ ] Backup/archive strategy in place

## Support

For issues or questions:
1. Check CloudTrail service health: https://status.aws.amazon.com/
2. Review CloudTrail documentation: https://docs.aws.amazon.com/cloudtrail/
3. Contact AWS Support if needed
