# Nigredo Testing - Quick Reference

## Quick Commands

### Verify Deployment Status
```powershell
.\scripts\verify-nigredo-deployment.ps1 -Environment dev
```

### Run Full Integration Tests
```powershell
.\scripts\test-nigredo-integration.ps1 -Environment dev
```

### Run Tests (Skip Deployment)
```powershell
.\scripts\test-nigredo-integration.ps1 -Environment dev -SkipDeployment
```

### Run Tests (Skip Performance)
```powershell
.\scripts\test-nigredo-integration.ps1 -Environment dev -SkipPerformanceTests
```

### Run Tests (Skip Security)
```powershell
.\scripts\test-nigredo-integration.ps1 -Environment dev -SkipSecurityTests
```

## Test Categories

| Category | Tests | Duration |
|----------|-------|----------|
| Deployment | Stack verification, Lambda checks | 2-3 min |
| Form Submission | API calls, database verification | 1-2 min |
| API Endpoints | CRUD operations, auth tests | 1-2 min |
| Rate Limiting | 11 submissions, error validation | 1 min |
| Monitoring | Metrics, traces, alarms | 1 min |
| Performance | 100 concurrent requests | 2-3 min |
| Security | XSS, SQL injection, WAF | 1-2 min |
| **Total** | **All tests** | **10-15 min** |

## Expected Results

### Healthy System
```
Total Tests: 25
Passed: 25
Failed: 0
Pass Rate: 100%
```

### Acceptable (New Deployment)
```
Total Tests: 25
Passed: 22-24
Failed: 1-3
Pass Rate: 88-96%
```

Note: Some metrics/traces may not appear immediately after deployment.

## Common Test Failures

### "CloudWatch Metrics Not Found"
- **Cause**: Metrics take 5-10 minutes to appear
- **Action**: Wait and rerun test

### "X-Ray Traces Not Found"
- **Cause**: Traces take 2-5 minutes to propagate
- **Action**: Wait and rerun test

### "Rate Limit Not Triggered"
- **Cause**: Rate limit configuration issue
- **Action**: Check Lambda logs, verify rate_limits table

### "Database Connection Failed"
- **Cause**: psql not installed or VPC access issue
- **Action**: Install psql or check security groups

## Manual Tests

### Test Frontend Form
1. Get CloudFront URL from stack outputs
2. Visit URL in browser
3. Fill out lead form
4. Submit and verify success message

### Test Webhook Delivery
1. Check Fibonacci logs for incoming webhook
2. Verify lead appears in Fibonacci dashboard
3. Check webhook_logs table for delivery status

### Test Alarm Triggering
1. Submit invalid data repeatedly
2. Wait 5 minutes for alarm evaluation
3. Check CloudWatch alarms console
4. Verify SNS notification received

## Monitoring Commands

### View Lambda Logs
```powershell
aws logs tail /aws/lambda/create-lead-dev --follow
```

### Check SQS Queue Depth
```powershell
aws sqs get-queue-attributes --queue-url [QUEUE-URL] --attribute-names ApproximateNumberOfMessages
```

### View CloudWatch Alarms
```powershell
aws cloudwatch describe-alarms --alarm-name-prefix Nigredo-dev
```

### Check X-Ray Traces
```powershell
aws xray get-trace-summaries --start-time [START] --end-time [END]
```

## Troubleshooting

### Script Errors
```powershell
# Check PowerShell version
$PSVersionTable.PSVersion

# Verify AWS CLI
aws --version

# Test AWS credentials
aws sts get-caller-identity
```

### Database Issues
```powershell
# Check psql installation
psql --version

# Test database connection
psql -h [HOST] -U [USER] -d [DATABASE] -c "SELECT 1;"
```

### API Issues
```powershell
# Test API endpoint
Invoke-WebRequest -Uri [API-URL]/api/leads -Method GET
```

## Test Report Location

Reports are saved as:
```
nigredo-integration-test-report-[ENV]-[TIMESTAMP].json
```

Example:
```
nigredo-integration-test-report-dev-20240115120000.json
```

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run Integration Tests
  run: pwsh ./scripts/test-nigredo-integration.ps1 -Environment dev -SkipDeployment
```

### Jenkins
```groovy
stage('Integration Tests') {
    steps {
        pwsh './scripts/test-nigredo-integration.ps1 -Environment dev -SkipDeployment'
    }
}
```

## Support

For detailed information, see:
- [Integration Testing Guide](./INTEGRATION-TESTING.md)
- [Operations Runbook](./OPERATIONS.md)
- [Deployment Guide](./DEPLOYMENT.md)

---

**Quick Tip**: Run `verify-nigredo-deployment.ps1` first to check if system is deployed before running full integration tests.
