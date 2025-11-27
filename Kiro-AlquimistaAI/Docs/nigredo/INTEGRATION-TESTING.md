# Nigredo Integration Testing Guide

## Overview

This document describes the comprehensive integration testing strategy for the Nigredo Prospecting Core system. The integration tests validate the entire system end-to-end, from deployment to production readiness.

## Test Coverage

The integration test suite covers all requirements from the Nigredo specification:

### 14.1 Deployment Testing
- ✅ Run deployment scripts
- ✅ Verify all CloudFormation stacks created
- ✅ Verify Lambda functions deployed
- ✅ Verify SQS queues created
- ✅ Verify EventBridge rules configured
- ✅ Check CloudWatch log groups

### 14.2 Form Submission Flow
- ✅ Submit test lead through API
- ✅ Verify lead stored in database
- ✅ Verify webhook sent to Fibonacci
- ✅ Verify webhook logs recorded
- ✅ Test end-to-end data flow

### 14.3 API Endpoints
- ✅ Test Create Lead API with valid data
- ✅ Test Create Lead API with invalid data (validation)
- ✅ Test List Leads API without authentication (401)
- ✅ Test Get Lead API without authentication (401)
- ✅ Verify error response format

### 14.4 Rate Limiting
- ✅ Submit 11 forms from same IP
- ✅ Verify 11th submission blocked (429)
- ✅ Verify correct error message returned
- ✅ Test rate limit window behavior

### 14.5 Monitoring and Alarms
- ✅ Verify CloudWatch metrics being emitted
- ✅ Verify X-Ray traces appearing
- ✅ Check CloudWatch alarms configured
- ✅ Verify SNS notification topics
- ⚠️ Trigger alarms by simulating errors (manual test recommended)

### 14.6 Performance Testing
- ✅ Run load test with 100 concurrent submissions
- ✅ Verify API latency < 1000ms (p99)
- ✅ Verify no errors under load
- ✅ Check CloudFront cache hit ratio
- ✅ Measure average, min, max latencies

### 14.7 Security Testing
- ✅ Test XSS prevention with malicious inputs
- ✅ Test SQL injection with crafted payloads
- ✅ Verify WAF configured on CloudFront
- ✅ Verify WAF rules active
- ✅ Test authentication bypass attempts

## Running the Tests

### Prerequisites

1. **AWS CLI configured** with appropriate credentials
2. **PowerShell** (Windows) or **PowerShell Core** (cross-platform)
3. **PostgreSQL client** (psql) for database verification
4. **Deployed Nigredo system** in target environment

### Basic Usage

```powershell
# Run all tests in dev environment
.\scripts\test-nigredo-integration.ps1 -Environment dev

# Run tests in staging
.\scripts\test-nigredo-integration.ps1 -Environment staging

# Skip deployment tests (if already deployed)
.\scripts\test-nigredo-integration.ps1 -Environment dev -SkipDeployment

# Skip performance tests (faster execution)
.\scripts\test-nigredo-integration.ps1 -Environment dev -SkipPerformanceTests

# Skip security tests
.\scripts\test-nigredo-integration.ps1 -Environment dev -SkipSecurityTests
```

### Test Execution Flow

```
1. Pre-flight checks (AWS credentials, environment)
2. Deploy to dev environment (optional)
3. Test form submission flow
4. Test API endpoints
5. Test rate limiting
6. Test monitoring and alarms
7. Performance testing (optional)
8. Security testing (optional)
9. Generate test report
```

## Test Results

### Output Format

The test script provides real-time console output with color-coded results:

- ✓ **Green**: Test passed
- ✗ **Red**: Test failed
- ⚠ **Yellow**: Warning or skipped test

### Test Report

A detailed JSON report is generated after each test run:

```
nigredo-integration-test-report-dev-20240115120000.json
```

Report structure:
```json
{
  "environment": "dev",
  "testDate": "2024-01-15 12:00:00",
  "duration": "05:30",
  "summary": {
    "totalTests": 25,
    "passedTests": 23,
    "failedTests": 2,
    "passRate": 92.0
  },
  "tests": [
    {
      "testName": "14.1.1 Deployment Script Execution",
      "passed": true,
      "message": "Deployment completed successfully",
      "timestamp": "2024-01-15 12:00:00"
    }
  ]
}
```

## Expected Results

### Passing Criteria

- **Pass Rate**: ≥ 80% of tests should pass
- **Critical Tests**: All deployment and API tests must pass
- **Performance**: P99 latency < 1000ms
- **Security**: All security tests must pass

### Known Limitations

Some tests may fail initially due to timing:

1. **CloudWatch Metrics**: May take 5-10 minutes to appear
2. **X-Ray Traces**: May take 2-5 minutes to propagate
3. **CloudFront Cache**: May take 10-15 minutes to fully propagate

## Manual Testing

Some scenarios require manual testing:

### 1. Frontend Form Submission

1. Visit the CloudFront distribution URL
2. Fill out the lead form with valid data
3. Submit and verify success message
4. Check database for lead record
5. Verify webhook sent to Fibonacci

### 2. Alarm Triggering

1. Simulate high error rate (submit invalid data repeatedly)
2. Wait 5 minutes for alarm evaluation
3. Check CloudWatch alarms console
4. Verify SNS notification received

### 3. WAF Blocking

1. Send malicious requests to CloudFront URL
2. Verify requests blocked by WAF
3. Check WAF logs in CloudWatch
4. Verify legitimate requests still work

## Troubleshooting

### Common Issues

#### 1. Deployment Failures

**Symptom**: Deployment script fails

**Solutions**:
- Check AWS credentials: `aws sts get-caller-identity`
- Verify Fibonacci stack deployed first
- Check CloudFormation console for error details
- Review CloudWatch logs for Lambda errors

#### 2. Database Connection Failures

**Symptom**: Cannot verify lead in database

**Solutions**:
- Ensure psql is installed and in PATH
- Verify database credentials in Secrets Manager
- Check VPC security groups allow connections
- Verify Lambda has database access

#### 3. Rate Limiting Not Working

**Symptom**: 11th submission not blocked

**Solutions**:
- Check rate limit configuration in Lambda
- Verify rate_limits table exists
- Check Lambda logs for rate limit logic
- Ensure IP address extraction working

#### 4. Performance Test Failures

**Symptom**: High latency or errors under load

**Solutions**:
- Check Lambda concurrency limits
- Verify database connection pool size
- Check CloudWatch metrics for throttling
- Review X-Ray traces for bottlenecks

#### 5. Security Test Failures

**Symptom**: XSS or SQL injection not prevented

**Solutions**:
- Verify input validation schemas
- Check sanitization logic in Lambda
- Review database query parameterization
- Test with different payloads

## CI/CD Integration

### GitHub Actions

```yaml
name: Nigredo Integration Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Install PowerShell
        run: |
          sudo apt-get update
          sudo apt-get install -y powershell
      
      - name: Run Integration Tests
        run: |
          pwsh ./scripts/test-nigredo-integration.ps1 -Environment dev -SkipDeployment
      
      - name: Upload Test Report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-report
          path: nigredo-integration-test-report-*.json
```

## Best Practices

### 1. Test Isolation

- Use unique email addresses for each test run
- Clean up test data after execution
- Use separate environments for testing

### 2. Test Data

- Use realistic but fake data
- Include edge cases (long strings, special characters)
- Test with various locales and formats

### 3. Performance Testing

- Run performance tests during off-peak hours
- Monitor system resources during tests
- Gradually increase load to find limits

### 4. Security Testing

- Never use real credentials in tests
- Test with known attack patterns
- Verify all security controls active

### 5. Monitoring

- Check CloudWatch logs during tests
- Monitor X-Ray traces for errors
- Review metrics after test completion

## Maintenance

### Updating Tests

When adding new features:

1. Add corresponding test cases
2. Update test documentation
3. Verify tests pass in all environments
4. Update CI/CD pipeline if needed

### Test Data Cleanup

Periodically clean up test data:

```sql
-- Delete test leads older than 7 days
DELETE FROM nigredo.leads 
WHERE source LIKE '%test%' 
AND created_at < NOW() - INTERVAL '7 days';

-- Delete test webhook logs
DELETE FROM nigredo.webhook_logs 
WHERE lead_id IN (
  SELECT id FROM nigredo.leads WHERE source LIKE '%test%'
);
```

## References

- [Nigredo Requirements](./requirements.md)
- [Nigredo Design](./design.md)
- [Nigredo API Documentation](./API.md)
- [Nigredo Operations Runbook](./OPERATIONS.md)
- [Nigredo Deployment Guide](./DEPLOYMENT.md)

## Support

For issues or questions:

1. Check CloudWatch logs
2. Review test report JSON
3. Consult operations runbook
4. Contact DevOps team

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0
**Status**: Active
