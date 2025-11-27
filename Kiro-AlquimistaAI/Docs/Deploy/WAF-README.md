# AWS WAF Configuration for Fibonacci CloudFront

## Overview

AWS WAF (Web Application Firewall) protects the Fibonacci CloudFront distribution from common web exploits and attacks. This implementation includes rate limiting, SQL injection protection, XSS protection, and bot control.

## What's Implemented

✅ **Rate Limiting** - 2,000 requests per 5 minutes per IP  
✅ **SQL Injection Protection** - AWS Managed Rules  
✅ **XSS Protection** - AWS Managed Rules  
✅ **Core Rule Set** - General web attack protection  
✅ **Bot Protection** - Block malicious bots, allow legitimate ones  
✅ **CloudWatch Alarms** - Alert on high blocked requests  
✅ **Custom 429 Response** - User-friendly rate limit message  

## Quick Start

### 1. Deploy WAF

WAF is automatically deployed with the Fibonacci stack:

```bash
npm run deploy:dev
```

### 2. Verify Deployment

```bash
# Get WAF Web ACL ARN
aws cloudformation describe-stacks \
  --stack-name FibonacciStack-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`WebAclArn`].OutputValue' \
  --output text
```

### 3. Test Protection

```bash
# Test rate limiting
for i in {1..2100}; do curl -s https://YOUR_CLOUDFRONT_URL/ > /dev/null & done; wait

# Test SQL injection
curl "https://YOUR_CLOUDFRONT_URL/?id=1' OR '1'='1"

# Test XSS
curl "https://YOUR_CLOUDFRONT_URL/?search=<script>alert('xss')</script>"
```

### 4. Monitor

View metrics in CloudWatch:
- Navigate to CloudWatch → Metrics → WAFV2
- Filter by WebACL: `fibonacci-cloudfront-waf-dev`

## Protection Rules

### 1. Rate Limiting (Priority 1)
- **Limit**: 2,000 requests per 5 minutes per IP
- **Action**: Block with 429 response
- **Exception**: `/health` endpoint excluded

### 2. SQL Injection Protection (Priority 2)
- **Rule Set**: AWSManagedRulesSQLiRuleSet
- **Action**: Block
- **Protects**: Query strings, body, headers, cookies

### 3. XSS Protection (Priority 3)
- **Rule Set**: AWSManagedRulesKnownBadInputsRuleSet
- **Action**: Block
- **Protects**: All XSS attack vectors

### 4. Core Rule Set (Priority 4)
- **Rule Set**: AWSManagedRulesCommonRuleSet
- **Action**: Block
- **Protects**: LFI, RFI, command injection, etc.
- **Excluded**: SizeRestrictions_BODY, GenericRFI_BODY

### 5. Bot Protection (Priority 5)
- **Rule Set**: AWSManagedRulesBotControlRuleSet
- **Inspection Level**: COMMON
- **Action**: Block malicious bots
- **Allows**: Search engines, monitoring services

## CloudWatch Alarms

### WAF Blocked Requests Alarm
- **Threshold**: 100 blocked requests in 5 minutes
- **Purpose**: Detect possible attacks
- **Action**: SNS notification

### WAF Rate Limit Alarm
- **Threshold**: 10 IPs rate limited in 5 minutes
- **Purpose**: Monitor rate limiting activity
- **Action**: SNS notification

## Cost

| Environment | Requests/Month | Estimated Cost |
|-------------|----------------|----------------|
| Development | 100K | ~$20/month |
| Staging | 1M | ~$26/month |
| Production | 10M | ~$36/month |

**Breakdown**:
- Web ACL: $5/month
- Rules: $5/month (5 rules × $1)
- Requests: $0.60 per 1M requests
- Bot Control: $10/month + $1 per 1M requests

## Configuration

WAF is configured in `lib/fibonacci-stack.ts`:

```typescript
const webAcl = new wafv2.CfnWebACL(this, 'CloudFrontWebACL', {
  name: `fibonacci-cloudfront-waf-${props.envName}`,
  scope: 'CLOUDFRONT',
  defaultAction: { allow: {} },
  rules: [
    // Rate limiting, SQL injection, XSS, Core rules, Bot protection
  ]
});

// Associate with CloudFront
this.distribution = new cloudfront.Distribution(this, 'Distribution', {
  webAclId: webAcl.attrArn,
  // ... other config
});
```

## Customization

### Adjust Rate Limit

Edit `lib/fibonacci-stack.ts`:

```typescript
{
  name: 'RateLimitRule',
  priority: 1,
  statement: {
    rateBasedStatement: {
      limit: 5000, // Change from 2000 to 5000
      aggregateKeyType: 'IP'
    }
  }
}
```

### Exclude Rules

To exclude specific managed rules:

```typescript
{
  name: 'SQLInjectionProtection',
  statement: {
    managedRuleGroupStatement: {
      vendorName: 'AWS',
      name: 'AWSManagedRulesSQLiRuleSet',
      excludedRules: [
        { name: 'SQLi_QUERYARGUMENTS' } // Exclude this rule
      ]
    }
  }
}
```

### Disable Bot Protection (Save $10/month)

Remove or comment out the bot protection rule:

```typescript
// {
//   name: 'BotProtection',
//   priority: 5,
//   ...
// }
```

## Monitoring

### View Metrics

```bash
# Blocked requests (last hour)
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

1. Go to AWS Console → WAF & Shield
2. Select `fibonacci-cloudfront-waf-dev`
3. Click "Sampled requests" tab
4. Filter by time range and rule

## Troubleshooting

### Legitimate Requests Blocked

1. Check sampled requests to identify blocking rule
2. Add rule to `excludedRules` array
3. Redeploy stack

### Rate Limit Too Aggressive

1. Increase `limit` value in rate limit rule
2. Redeploy stack

### Bot Protection Issues

1. Change `inspectionLevel` to `TARGETED`
2. Or add custom allow rule for specific bots

## Documentation

- **[WAF Implementation Guide](./WAF-IMPLEMENTATION.md)** - Detailed implementation documentation
- **[WAF Quick Reference](./WAF-QUICK-REFERENCE.md)** - Quick commands and troubleshooting
- **[Task 34 Checklist](./TASK-34-CHECKLIST.md)** - Implementation checklist

## Security Compliance

- ✅ **Requirement 17.6**: WAF configured on CloudFront
- ✅ **Rate Limiting**: 2,000 req/5min per IP
- ✅ **SQL Injection Protection**: AWS Managed Rules
- ✅ **XSS Protection**: AWS Managed Rules
- ✅ **Bot Protection**: Malicious bot blocking
- ✅ **Monitoring**: CloudWatch metrics and alarms

## Next Steps

1. ✅ Deploy WAF with stack
2. ✅ Verify protection rules are active
3. ✅ Test each protection rule
4. ✅ Monitor CloudWatch metrics
5. ✅ Set up SNS notifications for alarms
6. ⬜ Review sampled requests weekly
7. ⬜ Adjust rules based on traffic patterns
8. ⬜ Document any custom rules added

## Support

For issues or questions:
1. Check [WAF Implementation Guide](./WAF-IMPLEMENTATION.md)
2. Review [Quick Reference](./WAF-QUICK-REFERENCE.md)
3. Check CloudWatch metrics and alarms
4. Review sampled requests in WAF console
5. Contact AWS Support for WAF-specific issues
