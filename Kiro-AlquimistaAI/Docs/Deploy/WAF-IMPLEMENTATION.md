# WAF (Web Application Firewall) Implementation

## Overview

This document describes the AWS WAF implementation for protecting the Fibonacci CloudFront distribution against common web attacks and abuse.

## Architecture

```
Internet → WAF Web ACL → CloudFront → S3 Origin
                ↓
         CloudWatch Metrics
                ↓
         CloudWatch Alarms
```

## WAF Web ACL Configuration

### Scope
- **Type**: CLOUDFRONT
- **Region**: us-east-1 (required for CloudFront WAF)
- **Default Action**: ALLOW (block only what rules identify)

### Protection Rules

#### 1. Rate Limiting Rule (Priority 1)
**Purpose**: Prevent DDoS and abuse by limiting requests per IP

**Configuration**:
- **Limit**: 2,000 requests per 5 minutes per IP
- **Aggregation**: By IP address
- **Action**: Block with custom 429 response
- **Exception**: Health check endpoint (`/health`) is excluded from rate limiting

**Custom Response**:
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

**Use Cases**:
- Prevent brute force attacks
- Mitigate DDoS attempts
- Protect against credential stuffing
- Limit API abuse

#### 2. SQL Injection Protection (Priority 2)
**Purpose**: Block SQL injection attempts

**Configuration**:
- **Type**: AWS Managed Rule Group
- **Rule Set**: `AWSManagedRulesSQLiRuleSet`
- **Action**: Block (default from managed rule group)
- **Excluded Rules**: None

**Protected Against**:
- SQL injection in query strings
- SQL injection in request body
- SQL injection in headers
- SQL injection in cookies

#### 3. XSS Protection (Priority 3)
**Purpose**: Block Cross-Site Scripting (XSS) attacks

**Configuration**:
- **Type**: AWS Managed Rule Group
- **Rule Set**: `AWSManagedRulesKnownBadInputsRuleSet`
- **Action**: Block (default from managed rule group)
- **Excluded Rules**: None

**Protected Against**:
- Reflected XSS
- Stored XSS
- DOM-based XSS
- Script injection attempts

#### 4. Core Rule Set (Priority 4)
**Purpose**: General protection against common web attacks

**Configuration**:
- **Type**: AWS Managed Rule Group
- **Rule Set**: `AWSManagedRulesCommonRuleSet`
- **Action**: Block (default from managed rule group)
- **Excluded Rules**:
  - `SizeRestrictions_BODY` - Allow larger request bodies
  - `GenericRFI_BODY` - Reduce false positives in file uploads

**Protected Against**:
- Local File Inclusion (LFI)
- Remote File Inclusion (RFI)
- Path traversal attacks
- Command injection
- Protocol attacks

#### 5. Bot Protection (Priority 5)
**Purpose**: Block malicious bots while allowing legitimate ones

**Configuration**:
- **Type**: AWS Managed Rule Group
- **Rule Set**: `AWSManagedRulesBotControlRuleSet`
- **Inspection Level**: COMMON
- **Action**: Block (default from managed rule group)

**Protected Against**:
- Malicious bots
- Scrapers
- Automated scanners
- Credential stuffing bots

**Allowed**:
- Search engine crawlers (Google, Bing, etc.)
- Monitoring services
- Legitimate API clients

## CloudWatch Monitoring

### Metrics

All WAF metrics are published to the `AWS/WAFV2` namespace:

1. **BlockedRequests**: Total number of blocked requests
2. **AllowedRequests**: Total number of allowed requests
3. **CountedRequests**: Requests that matched count rules
4. **PassedRequests**: Requests that didn't match any rules

**Dimensions**:
- `WebACL`: fibonacci-cloudfront-waf-{env}
- `Region`: us-east-1
- `Rule`: Rule name or ALL

### Alarms

#### 1. WAF Blocked Requests Alarm
**Purpose**: Alert on high number of blocked requests (possible attack)

**Configuration**:
- **Metric**: BlockedRequests (all rules)
- **Threshold**: 100 requests in 5 minutes
- **Evaluation Periods**: 2
- **Action**: Send SNS notification

**Response**:
1. Check CloudWatch Logs Insights for attack patterns
2. Review blocked IPs in WAF sampled requests
3. Consider adding IP-based block rules if needed
4. Escalate to security team if sustained attack

#### 2. WAF Rate Limit Alarm
**Purpose**: Alert when rate limiting is actively blocking IPs

**Configuration**:
- **Metric**: BlockedRequests (RateLimitRule only)
- **Threshold**: 10 IPs blocked in 5 minutes
- **Evaluation Periods**: 1
- **Action**: Send SNS notification

**Response**:
1. Review which IPs are being rate limited
2. Check if legitimate users are affected
3. Consider adjusting rate limit threshold if needed
4. Investigate if this is a distributed attack

## Viewing WAF Metrics

### AWS Console

1. Navigate to **WAF & Shield** → **Web ACLs**
2. Select `fibonacci-cloudfront-waf-{env}`
3. Click **Metrics** tab
4. View real-time metrics and sampled requests

### CloudWatch Console

1. Navigate to **CloudWatch** → **Metrics**
2. Select **WAFV2** namespace
3. Filter by WebACL: `fibonacci-cloudfront-waf-{env}`
4. Create custom graphs and dashboards

### AWS CLI

```bash
# Get blocked requests in last hour
aws cloudwatch get-metric-statistics \
  --namespace AWS/WAFV2 \
  --metric-name BlockedRequests \
  --dimensions Name=WebACL,Value=fibonacci-cloudfront-waf-dev Name=Region,Value=us-east-1 Name=Rule,Value=ALL \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum

# Get rate limit blocks
aws cloudwatch get-metric-statistics \
  --namespace AWS/WAFV2 \
  --metric-name BlockedRequests \
  --dimensions Name=WebACL,Value=fibonacci-cloudfront-waf-dev Name=Region,Value=us-east-1 Name=Rule,Value=RateLimitRule \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

## Viewing Sampled Requests

WAF automatically samples requests that match rules. To view them:

### AWS Console

1. Navigate to **WAF & Shield** → **Web ACLs**
2. Select `fibonacci-cloudfront-waf-{env}`
3. Click **Sampled requests** tab
4. Filter by:
   - Time range
   - Rule name
   - Action (Block/Allow/Count)
   - IP address

### Information Available

For each sampled request:
- **Timestamp**: When the request was made
- **Source IP**: Client IP address
- **URI**: Requested path
- **Action**: Block, Allow, or Count
- **Rule**: Which rule matched
- **Headers**: Request headers
- **Country**: Geographic origin

## Testing WAF Rules

### 1. Test Rate Limiting

```bash
# Send 2100 requests rapidly (should trigger rate limit)
for i in {1..2100}; do
  curl -s https://YOUR_CLOUDFRONT_URL/ > /dev/null &
done
wait

# Check if you get 429 responses
curl -v https://YOUR_CLOUDFRONT_URL/
```

### 2. Test SQL Injection Protection

```bash
# Should be blocked by SQLi rule
curl "https://YOUR_CLOUDFRONT_URL/?id=1' OR '1'='1"

# Should be blocked
curl "https://YOUR_CLOUDFRONT_URL/?query=SELECT * FROM users"
```

### 3. Test XSS Protection

```bash
# Should be blocked by XSS rule
curl "https://YOUR_CLOUDFRONT_URL/?search=<script>alert('xss')</script>"

# Should be blocked
curl "https://YOUR_CLOUDFRONT_URL/?input=<img src=x onerror=alert(1)>"
```

### 4. Test Bot Protection

```bash
# Legitimate user agent - should be allowed
curl -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
  https://YOUR_CLOUDFRONT_URL/

# Suspicious bot - may be blocked
curl -A "BadBot/1.0" https://YOUR_CLOUDFRONT_URL/
```

## Troubleshooting

### False Positives

If legitimate requests are being blocked:

1. **Identify the blocking rule**:
   - Check sampled requests in WAF console
   - Look for the rule that blocked the request

2. **Analyze the request**:
   - Review request headers, body, and query string
   - Determine why the rule matched

3. **Options to fix**:
   - **Option A**: Exclude the specific rule from the managed rule group
   - **Option B**: Add a custom rule with higher priority to allow the pattern
   - **Option C**: Adjust rate limit threshold if too aggressive

4. **Update CDK code**:
   ```typescript
   excludedRules: [
     { name: 'RuleName' } // Add to excludedRules array
   ]
   ```

### High Rate Limit Blocks

If legitimate users are hitting rate limits:

1. **Check the pattern**:
   - Are requests coming from corporate NAT/proxy?
   - Is it a legitimate high-traffic scenario?

2. **Adjust threshold**:
   ```typescript
   limit: 5000, // Increase from 2000
   ```

3. **Consider IP allowlist**:
   - Add custom rule to allow specific IPs
   - Set higher priority than rate limit rule

### Bot Protection Issues

If legitimate bots are blocked:

1. **Verify bot identity**:
   - Check user agent
   - Verify reverse DNS
   - Check against known bot lists

2. **Adjust inspection level**:
   ```typescript
   inspectionLevel: 'TARGETED' // Less aggressive than COMMON
   ```

3. **Add bot allowlist**:
   - Create custom rule for known good bots
   - Use IP ranges or user agent patterns

## Cost Considerations

### WAF Pricing (us-east-1)

- **Web ACL**: $5.00/month
- **Rules**: $1.00/month per rule (5 rules = $5.00/month)
- **Requests**: $0.60 per 1 million requests
- **Bot Control**: $10.00/month + $1.00 per 1 million requests

### Estimated Monthly Costs

**Development** (100K requests/month):
- Web ACL: $5.00
- Rules: $5.00 (5 rules)
- Requests: $0.06
- Bot Control: $10.10
- **Total**: ~$20/month

**Production** (10M requests/month):
- Web ACL: $5.00
- Rules: $5.00
- Requests: $6.00
- Bot Control: $20.00
- **Total**: ~$36/month

### Cost Optimization

1. **Disable Bot Control in dev/staging**:
   - Remove bot protection rule for non-prod environments
   - Save $10/month per environment

2. **Use COUNT mode for testing**:
   - Set rules to COUNT instead of BLOCK during testing
   - Analyze patterns before enforcing

3. **Monitor request volume**:
   - Set up billing alarms
   - Review WAF metrics regularly

## Security Best Practices

### 1. Regular Review

- **Weekly**: Review sampled requests for new attack patterns
- **Monthly**: Analyze blocked request trends
- **Quarterly**: Review and update rule configurations

### 2. Logging

- Enable WAF logging to S3 or CloudWatch Logs
- Retain logs for compliance requirements
- Use logs for forensic analysis

### 3. Testing

- Test WAF rules in staging before production
- Use COUNT mode to validate rules don't block legitimate traffic
- Perform regular penetration testing

### 4. Updates

- AWS automatically updates managed rule groups
- Review AWS Security Bulletins for new threats
- Update custom rules based on attack patterns

### 5. Integration

- Integrate WAF alerts with incident response workflow
- Automate IP blocking for repeated offenders
- Correlate WAF events with CloudTrail logs

## Compliance

### LGPD Considerations

- WAF logs may contain personal data (IP addresses)
- Implement data retention policies
- Provide mechanism for data deletion requests
- Document WAF configuration in privacy policy

### Audit Requirements

- WAF configuration changes are logged in CloudTrail
- Sampled requests provide evidence of protection
- Metrics demonstrate security posture
- Regular reviews documented in security reports

## References

- [AWS WAF Documentation](https://docs.aws.amazon.com/waf/)
- [AWS Managed Rules](https://docs.aws.amazon.com/waf/latest/developerguide/aws-managed-rule-groups.html)
- [WAF Best Practices](https://docs.aws.amazon.com/waf/latest/developerguide/waf-chapter.html)
- [Bot Control](https://docs.aws.amazon.com/waf/latest/developerguide/aws-managed-rule-groups-bot.html)

## Support

For issues or questions:
1. Check CloudWatch metrics and alarms
2. Review sampled requests in WAF console
3. Consult this documentation
4. Contact AWS Support for WAF-specific issues
