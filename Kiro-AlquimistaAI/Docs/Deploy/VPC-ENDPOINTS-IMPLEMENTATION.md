# VPC Endpoints Implementation

## Overview

This document describes the implementation of VPC Endpoints for the Fibonacci AWS infrastructure to avoid traffic over the public internet, improving security and reducing data transfer costs.

## Implementation Date

**Task 33** - Implemented on: 2025-01-XX

## VPC Endpoints Created

### 1. S3 Gateway Endpoint

**Type**: Gateway Endpoint (no additional cost)

**Purpose**: Allow Lambda functions and other resources in the VPC to access S3 without going through the internet gateway.

**Configuration**:
```typescript
const s3Endpoint = this.vpc.addGatewayEndpoint('S3Endpoint', {
  service: ec2.GatewayVpcEndpointAwsService.S3,
  subnets: [
    { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
    { subnetType: ec2.SubnetType.PUBLIC }
  ]
});
```

**Benefits**:
- No data transfer charges for S3 access from VPC
- Traffic stays within AWS network
- No additional hourly charges (Gateway endpoints are free)
- Improved security posture

**Use Cases**:
- Lambda functions accessing S3 buckets (site bucket, CloudTrail bucket)
- Aurora database backups to S3
- CloudFormation template storage

### 2. Secrets Manager Interface Endpoint

**Type**: Interface Endpoint (charged per hour + data processed)

**Purpose**: Allow Lambda functions to retrieve database credentials and API keys from Secrets Manager without internet access.

**Configuration**:
```typescript
const secretsManagerEndpoint = this.vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
  service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
  subnets: {
    subnetType: ec2.SubnetType.PRIVATE_ISOLATED
  },
  privateDnsEnabled: true,
  open: false
});
```

**Security Configuration**:
- Private DNS enabled for automatic resolution
- Security group restricts access to Lambda security group only
- Deployed in private isolated subnets

**Benefits**:
- Secure credential retrieval without internet exposure
- Reduced latency for secret access
- Compliance with security best practices (no internet egress)

**Use Cases**:
- Lambda functions retrieving database credentials
- MCP integrations accessing API keys
- Automated secret rotation

### 3. EventBridge Interface Endpoint

**Type**: Interface Endpoint (charged per hour + data processed)

**Purpose**: Allow Lambda functions to publish events to EventBridge without internet access.

**Configuration**:
```typescript
const eventBridgeEndpoint = this.vpc.addInterfaceEndpoint('EventBridgeEndpoint', {
  service: ec2.InterfaceVpcEndpointAwsService.EVENTBRIDGE,
  subnets: {
    subnetType: ec2.SubnetType.PRIVATE_ISOLATED
  },
  privateDnsEnabled: true,
  open: false
});
```

**Security Configuration**:
- Private DNS enabled for automatic resolution
- Security group restricts access to Lambda security group only
- Deployed in private isolated subnets

**Benefits**:
- Secure event publishing without internet exposure
- Reduced latency for event-driven architecture
- Improved reliability (no dependency on internet gateway)

**Use Cases**:
- Lambda functions publishing events to fibonacci-bus
- Agent-to-agent communication via EventBridge
- Event-driven workflows

## Security Group Configuration

### Lambda Security Group Rules

The Lambda security group has been configured to allow outbound HTTPS (port 443) access to the VPC endpoints:

```typescript
// Secrets Manager Endpoint
secretsManagerEndpoint.connections.allowFrom(
  lambdaSg,
  ec2.Port.tcp(443),
  'Allow Lambda access to Secrets Manager endpoint'
);

// EventBridge Endpoint
eventBridgeEndpoint.connections.allowFrom(
  lambdaSg,
  ec2.Port.tcp(443),
  'Allow Lambda access to EventBridge endpoint'
);
```

### Principle of Least Privilege

- VPC endpoints are configured with `open: false` to prevent unrestricted access
- Only Lambda security group is explicitly allowed
- Private DNS is enabled for seamless integration
- No public internet access required

## Network Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         VPC                                  │
│                                                              │
│  ┌────────────────────┐         ┌────────────────────┐     │
│  │  Private Isolated  │         │  Private Isolated  │     │
│  │     Subnet AZ-A    │         │     Subnet AZ-B    │     │
│  │                    │         │                    │     │
│  │  ┌──────────────┐  │         │  ┌──────────────┐  │     │
│  │  │   Lambda     │  │         │  │   Aurora     │  │     │
│  │  │  Functions   │──┼─────────┼──│   Cluster    │  │     │
│  │  └──────┬───────┘  │         │  └──────────────┘  │     │
│  │         │          │         │                    │     │
│  │         │          │         │                    │     │
│  │         ▼          │         │                    │     │
│  │  ┌──────────────┐  │         │  ┌──────────────┐  │     │
│  │  │ Secrets Mgr  │  │         │  │ EventBridge  │  │     │
│  │  │   Endpoint   │  │         │  │   Endpoint   │  │     │
│  │  └──────────────┘  │         │  └──────────────┘  │     │
│  └────────────────────┘         └────────────────────┘     │
│                                                              │
│  ┌────────────────────┐         ┌────────────────────┐     │
│  │  Public Subnet     │         │  Public Subnet     │     │
│  │      AZ-A          │         │      AZ-B          │     │
│  └────────────────────┘         └────────────────────┘     │
│                                                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │         S3 Gateway Endpoint                       │      │
│  │  (Available to all subnets via route tables)     │      │
│  └──────────────────────────────────────────────────┘      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
                  AWS Services
              (S3, Secrets Manager,
                  EventBridge)
```

## Cost Implications

### Gateway Endpoint (S3)
- **Hourly Cost**: $0.00 (free)
- **Data Transfer**: $0.00 (no charges for data transfer within same region)
- **Estimated Monthly Savings**: ~$5-10 (avoiding NAT Gateway data transfer)

### Interface Endpoints (Secrets Manager + EventBridge)
- **Hourly Cost**: $0.01 per AZ per hour × 2 AZs × 2 endpoints = $0.04/hour
- **Monthly Cost**: ~$29/month per endpoint × 2 = ~$58/month
- **Data Processing**: $0.01 per GB (minimal for our use case)
- **Estimated Monthly Cost**: ~$60/month

### Net Cost Impact
- **Additional Cost**: ~$60/month
- **Security Benefit**: Eliminates internet egress for sensitive operations
- **Compliance Value**: Meets security requirements for LGPD and enterprise customers

### Cost Optimization Recommendations

For **development** environment:
- Consider using only S3 Gateway Endpoint (free)
- Allow Lambda to access Secrets Manager and EventBridge via internet gateway
- Reduces cost to $0/month for VPC endpoints

For **production** environment:
- Keep all three endpoints for maximum security
- Cost is justified by security and compliance requirements

## CloudFormation Outputs

The following outputs are available after deployment:

```typescript
// VPC Endpoint IDs
FibonacciS3EndpointId-{env}
FibonacciSecretsManagerEndpointId-{env}
FibonacciEventBridgeEndpointId-{env}
```

## Verification Steps

### 1. Verify VPC Endpoints are Created

```bash
# List VPC endpoints
aws ec2 describe-vpc-endpoints \
  --filters "Name=vpc-id,Values=<VPC_ID>" \
  --query 'VpcEndpoints[*].[VpcEndpointId,ServiceName,State]' \
  --output table
```

Expected output:
```
|  vpce-xxxxx  |  com.amazonaws.us-east-1.s3              |  available  |
|  vpce-yyyyy  |  com.amazonaws.us-east-1.secretsmanager  |  available  |
|  vpce-zzzzz  |  com.amazonaws.us-east-1.events          |  available  |
```

### 2. Verify Private DNS is Enabled

```bash
# Check Secrets Manager endpoint
aws ec2 describe-vpc-endpoints \
  --vpc-endpoint-ids <SECRETS_MANAGER_ENDPOINT_ID> \
  --query 'VpcEndpoints[0].PrivateDnsEnabled'
```

Expected output: `true`

### 3. Test Lambda Access to Secrets Manager

```bash
# Invoke Lambda function that accesses Secrets Manager
aws lambda invoke \
  --function-name fibonacci-api-handler-dev \
  --payload '{"path":"/health","httpMethod":"GET"}' \
  response.json

# Check CloudWatch Logs for successful secret retrieval
aws logs tail /aws/lambda/fibonacci-api-handler-dev --follow
```

### 4. Verify No Internet Traffic

```bash
# Check VPC Flow Logs (if enabled)
# Look for traffic to AWS service IPs - should go through VPC endpoints
aws logs filter-log-events \
  --log-group-name /aws/vpc/flowlogs \
  --filter-pattern "[version, account, eni, source, destination, srcport, destport, protocol, packets, bytes, start, end, action, logstatus]" \
  --start-time $(date -u -d '5 minutes ago' +%s)000
```

### 5. Test EventBridge Publishing

```bash
# Publish test event via API
curl -X POST https://<API_URL>/events \
  -H "Content-Type: application/json" \
  -d '{
    "source": "fibonacci.demo",
    "type": "test",
    "detail": {"message": "Testing VPC endpoint"}
  }'

# Verify event was received in SQS
aws sqs receive-message \
  --queue-url <MAIN_QUEUE_URL> \
  --max-number-of-messages 1
```

## Troubleshooting

### Issue: Lambda Cannot Access Secrets Manager

**Symptoms**:
- Lambda function times out when calling Secrets Manager
- Error: "Unable to connect to endpoint"

**Solution**:
1. Verify private DNS is enabled on the endpoint
2. Check security group rules allow Lambda SG to access endpoint on port 443
3. Verify Lambda is deployed in the correct subnets (PRIVATE_ISOLATED)

```bash
# Check endpoint configuration
aws ec2 describe-vpc-endpoints \
  --vpc-endpoint-ids <ENDPOINT_ID> \
  --query 'VpcEndpoints[0].[PrivateDnsEnabled,SubnetIds,Groups]'
```

### Issue: EventBridge Events Not Being Delivered

**Symptoms**:
- Events published but not appearing in SQS queues
- No errors in Lambda logs

**Solution**:
1. Verify EventBridge endpoint is in available state
2. Check EventBridge rules are correctly configured
3. Verify SQS queue permissions allow EventBridge to send messages

```bash
# Check endpoint state
aws ec2 describe-vpc-endpoints \
  --vpc-endpoint-ids <ENDPOINT_ID> \
  --query 'VpcEndpoints[0].State'

# Check EventBridge rules
aws events list-rules \
  --event-bus-name fibonacci-bus-dev
```

### Issue: High VPC Endpoint Costs

**Symptoms**:
- Monthly AWS bill shows high VPC endpoint charges

**Solution**:
1. Review data processing charges (should be minimal)
2. Consider removing interface endpoints in dev environment
3. Verify endpoints are only in required AZs

```bash
# Check endpoint usage metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/PrivateLinkEndpoints \
  --metric-name BytesProcessed \
  --dimensions Name=VPC Endpoint Id,Value=<ENDPOINT_ID> \
  --start-time $(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 86400 \
  --statistics Sum
```

## Security Considerations

### Benefits

1. **No Internet Exposure**: Lambda functions don't need internet access to call AWS services
2. **Reduced Attack Surface**: Eliminates internet gateway as potential attack vector
3. **Compliance**: Meets requirements for data residency and network isolation
4. **Audit Trail**: All traffic through VPC endpoints is logged in VPC Flow Logs

### Best Practices

1. **Enable VPC Flow Logs**: Monitor all traffic through VPC endpoints
2. **Use Security Groups**: Restrict access to VPC endpoints to specific resources
3. **Enable Private DNS**: Simplifies configuration and prevents misrouting
4. **Regular Audits**: Review VPC endpoint access patterns and security group rules

### LGPD Compliance

VPC endpoints help meet LGPD requirements by:
- Ensuring data doesn't traverse public internet
- Providing network-level isolation for sensitive operations
- Enabling detailed audit trails of data access
- Supporting data residency requirements

## Related Documentation

- [AWS VPC Endpoints Documentation](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints.html)
- [Fibonacci Stack Implementation](./FIBONACCI-STACK-IMPLEMENTATION.md)
- [Security Configuration](./SECURITY-CONFIGURATION.md)
- [Task 33 Checklist](./TASK-33-CHECKLIST.md)

## Maintenance

### Regular Tasks

1. **Monthly**: Review VPC endpoint costs and usage
2. **Quarterly**: Audit security group rules for VPC endpoints
3. **Annually**: Review need for additional VPC endpoints (RDS, SQS, etc.)

### Monitoring

CloudWatch metrics to monitor:
- `AWS/PrivateLinkEndpoints` - BytesProcessed
- `AWS/PrivateLinkEndpoints` - PacketsProcessed
- VPC Flow Logs - Traffic patterns to endpoint IPs

### Updates

When adding new AWS services:
1. Evaluate if VPC endpoint is available
2. Consider security and cost implications
3. Update security group rules accordingly
4. Document in this file

## Conclusion

VPC endpoints have been successfully implemented for S3, Secrets Manager, and EventBridge, eliminating the need for internet access for these critical services. This improves security posture, reduces latency, and helps meet compliance requirements.

The implementation follows AWS best practices for network isolation and provides a foundation for adding additional VPC endpoints as the system evolves.
