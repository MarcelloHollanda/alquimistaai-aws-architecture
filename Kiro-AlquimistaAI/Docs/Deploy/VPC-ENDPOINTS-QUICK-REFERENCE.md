# VPC Endpoints - Quick Reference

## Overview

VPC Endpoints allow AWS resources to communicate with AWS services without traversing the public internet.

## Endpoints Implemented

| Service | Type | Cost | Purpose |
|---------|------|------|---------|
| **S3** | Gateway | Free | Access S3 buckets without internet |
| **Secrets Manager** | Interface | ~$29/month | Retrieve credentials securely |
| **EventBridge** | Interface | ~$29/month | Publish events without internet |

## Quick Commands

### List All VPC Endpoints

```bash
aws ec2 describe-vpc-endpoints \
  --filters "Name=vpc-id,Values=$(aws cloudformation describe-stacks \
    --stack-name FibonacciStack-dev \
    --query 'Stacks[0].Outputs[?OutputKey==`VpcId`].OutputValue' \
    --output text)" \
  --query 'VpcEndpoints[*].[VpcEndpointId,ServiceName,State]' \
  --output table
```

### Get Endpoint IDs from CloudFormation

```bash
# S3 Endpoint
aws cloudformation describe-stacks \
  --stack-name FibonacciStack-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`S3EndpointId`].OutputValue' \
  --output text

# Secrets Manager Endpoint
aws cloudformation describe-stacks \
  --stack-name FibonacciStack-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`SecretsManagerEndpointId`].OutputValue' \
  --output text

# EventBridge Endpoint
aws cloudformation describe-stacks \
  --stack-name FibonacciStack-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`EventBridgeEndpointId`].OutputValue' \
  --output text
```

### Check Endpoint Status

```bash
aws ec2 describe-vpc-endpoints \
  --vpc-endpoint-ids <ENDPOINT_ID> \
  --query 'VpcEndpoints[0].[State,PrivateDnsEnabled,SubnetIds]' \
  --output table
```

### View Endpoint Security Groups

```bash
aws ec2 describe-vpc-endpoints \
  --vpc-endpoint-ids <ENDPOINT_ID> \
  --query 'VpcEndpoints[0].Groups[*].[GroupId,GroupName]' \
  --output table
```

## Testing

### Test S3 Access from Lambda

```bash
# Invoke Lambda that accesses S3
aws lambda invoke \
  --function-name fibonacci-api-handler-dev \
  --payload '{"path":"/health","httpMethod":"GET"}' \
  response.json && cat response.json
```

### Test Secrets Manager Access

```bash
# Check Lambda logs for secret retrieval
aws logs tail /aws/lambda/fibonacci-api-handler-dev \
  --follow \
  --filter-pattern "secret"
```

### Test EventBridge Publishing

```bash
# Publish test event
curl -X POST https://$(aws cloudformation describe-stacks \
  --stack-name FibonacciStack-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text)/events \
  -H "Content-Type: application/json" \
  -d '{"source":"fibonacci.demo","type":"test","detail":{"message":"VPC endpoint test"}}'
```

## Troubleshooting

### Lambda Timeout Accessing Service

**Check**: Private DNS enabled?
```bash
aws ec2 describe-vpc-endpoints \
  --vpc-endpoint-ids <ENDPOINT_ID> \
  --query 'VpcEndpoints[0].PrivateDnsEnabled'
```

**Expected**: `true`

### Security Group Issues

**Check**: Lambda SG allowed?
```bash
# Get Lambda SG
LAMBDA_SG=$(aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=*LambdaSg*" \
  --query 'SecurityGroups[0].GroupId' \
  --output text)

# Check endpoint SG rules
aws ec2 describe-security-groups \
  --group-ids $(aws ec2 describe-vpc-endpoints \
    --vpc-endpoint-ids <ENDPOINT_ID> \
    --query 'VpcEndpoints[0].Groups[0].GroupId' \
    --output text) \
  --query 'SecurityGroups[0].IpPermissions[*].[FromPort,ToPort,UserIdGroupPairs[*].GroupId]'
```

### High Costs

**Check**: Data processed
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/PrivateLinkEndpoints \
  --metric-name BytesProcessed \
  --dimensions Name=VPC\ Endpoint\ Id,Value=<ENDPOINT_ID> \
  --start-time $(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 86400 \
  --statistics Sum \
  --output table
```

## Cost Optimization

### Development Environment

Remove interface endpoints to save ~$60/month:

```typescript
// Comment out in dev environment
// const secretsManagerEndpoint = this.vpc.addInterfaceEndpoint(...)
// const eventBridgeEndpoint = this.vpc.addInterfaceEndpoint(...)
```

Keep only S3 Gateway Endpoint (free).

### Production Environment

Keep all endpoints for security and compliance.

## Security Best Practices

✅ **DO**:
- Enable private DNS
- Use security groups to restrict access
- Monitor VPC Flow Logs
- Enable CloudTrail logging

❌ **DON'T**:
- Set `open: true` on interface endpoints
- Allow unrestricted security group rules
- Disable private DNS
- Forget to monitor costs

## Monitoring

### CloudWatch Metrics

```bash
# Bytes processed (last 24 hours)
aws cloudwatch get-metric-statistics \
  --namespace AWS/PrivateLinkEndpoints \
  --metric-name BytesProcessed \
  --dimensions Name=VPC\ Endpoint\ Id,Value=<ENDPOINT_ID> \
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum
```

### VPC Flow Logs

```bash
# View traffic to VPC endpoints
aws logs filter-log-events \
  --log-group-name /aws/vpc/flowlogs \
  --start-time $(date -u -d '1 hour ago' +%s)000 \
  --filter-pattern "[version, account, eni, source, destination, srcport, destport=\"443\", protocol, packets, bytes, start, end, action=\"ACCEPT\", logstatus]"
```

## Additional Endpoints to Consider

| Service | Use Case | Priority |
|---------|----------|----------|
| **RDS** | Aurora access from Lambda | Medium |
| **SQS** | Queue operations | Medium |
| **DynamoDB** | If using DynamoDB | Low |
| **CloudWatch Logs** | Log streaming | Low |
| **KMS** | Encryption operations | Medium |

## Related Documentation

- [Full Implementation Guide](./VPC-ENDPOINTS-IMPLEMENTATION.md)
- [Task 33 Checklist](./TASK-33-CHECKLIST.md)
- [Security Configuration](./SECURITY-CONFIGURATION.md)

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review CloudWatch Logs
3. Verify security group rules
4. Check VPC Flow Logs

## Last Updated

Task 33 - VPC Endpoints Implementation
