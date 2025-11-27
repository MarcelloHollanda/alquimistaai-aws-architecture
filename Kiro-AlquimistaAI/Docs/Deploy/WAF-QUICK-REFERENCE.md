# WAF Quick Reference Guide

## Quick Commands

### View WAF Metrics (Last Hour)

```bash
# Total blocked requests
aws cloudwatch get-metric-statistics \
  --namespace AWS/WAFV2 \
  --metric-name BlockedRequests \
  --dimensions Name=WebACL,Value=fibonacci-cloudfront-waf-dev Name=Region,Value=us-east-1 Name=Rule,Value=ALL \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

### View Sampled Requests

```bash
# Get sampled requests (last 3 hours)
aws wafv2 get-sampled-requests \
  --web-acl-arn $(aws cloudformation describe-stacks \
    --stack-name FibonacciStack-dev \
    --query 'Stacks[0].Outputs[?OutputKey==`WebAclArn`].OutputValue' \
    --output text) \
  --rule-metric-name ALL \
  --scope CLOUDFRONT \
  --time-window StartTime=$(date -u -d '3 hours ago' +%s),EndTime=$(date -u +%s) \
  --max-items 100
```

### Test WAF Rules

```bash
# Test rate limiting (send 2100 requests)
for i in {1..2100}; do curl -s https://YOUR_CLOUDFRONT_URL/ > /dev/null & done; wait

# Test SQL injection protection
curl "https://YOUR_CLOUDFRONT_URL/?id=1' OR '1'='1"

# Test XSS protection
curl "https://YOUR_CLOUDFRONT_URL/?search=<script>alert('xss')</script>"
```

## WAF Rules Summary

| Priority | Rule Name | Type | Purpose | Action |
|----------|-----------|------|---------|--------|
| 1 | RateLimitRule | Rate-based | Limit 2000 req/5min per IP | Block (429) |
| 2 | SQLInjectionProtection | Managed | Block SQL injection | Block |
| 3 | XSSProtection | Managed | Block XSS attacks | Block |
| 4 | CoreRuleSet | Managed | General web protection | Block |
| 5 | BotProtection | Managed | Block malicious bots | Block |

## CloudFormation Outputs

```bash
# Get WAF Web ACL ID
aws cloudformation describe-stacks \
  --stack-name FibonacciStack-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`WebAclId`].OutputValue' \
  --output text

# Get WAF Web ACL ARN
aws cloudformation describe-stacks \
  --stack-name FibonacciStack-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`WebAclArn`].OutputValue' \
  --output text

# Get WAF Web ACL Name
aws cloudformation describe-stacks \
  --stack-name FibonacciStack-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`WebAclName`].OutputValue' \
  --output text
```

## Common Issues

### Issue: Legitimate requests blocked

**Solution**:
1. Check sampled requests to identify blocking rule
2. Add rule to excludedRules array in CDK code
3. Redeploy stack

```typescript
excludedRules: [
  { name: 'RuleName' }
]
```

### Issue: Rate limit too aggressive

**Solution**:
1. Increase limit in CDK code
2. Redeploy stack

```typescript
limit: 5000, // Increase from 2000
```

### Issue: Bot protection blocking legitimate bots

**Solution**:
1. Change inspection level to TARGETED
2. Or add custom allow rule for specific user agents

```typescript
inspectionLevel: 'TARGETED' // Less aggressive
```

## Monitoring URLs

- **WAF Console**: https://console.aws.amazon.com/wafv2/homev2/web-acls
- **CloudWatch Metrics**: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#metricsV2:graph=~();namespace=AWS/WAFV2
- **CloudWatch Alarms**: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#alarmsV2:

## Cost Estimate

| Environment | Requests/Month | Estimated Cost |
|-------------|----------------|----------------|
| Development | 100K | ~$20/month |
| Staging | 1M | ~$26/month |
| Production | 10M | ~$36/month |

## Emergency Response

### If under attack:

1. **Check WAF metrics** - Identify attack pattern
2. **Review sampled requests** - Get attacker IPs
3. **Add IP block rule** - Block specific IPs if needed
4. **Increase rate limit** - If distributed attack
5. **Enable COUNT mode** - Temporarily to analyze traffic
6. **Contact AWS Support** - For DDoS Shield assistance

### Add IP block rule:

```typescript
{
  name: 'BlockMaliciousIPs',
  priority: 0, // Highest priority
  statement: {
    ipSetReferenceStatement: {
      arn: 'arn:aws:wafv2:us-east-1:ACCOUNT:global/ipset/malicious-ips/ID'
    }
  },
  action: { block: {} },
  visibilityConfig: {
    sampledRequestsEnabled: true,
    cloudWatchMetricsEnabled: true,
    metricName: 'BlockMaliciousIPs'
  }
}
```

## Useful Links

- [WAF Implementation Guide](./WAF-IMPLEMENTATION.md)
- [AWS WAF Console](https://console.aws.amazon.com/wafv2/)
- [CloudWatch Dashboard](https://console.aws.amazon.com/cloudwatch/)
- [AWS WAF Documentation](https://docs.aws.amazon.com/waf/)
