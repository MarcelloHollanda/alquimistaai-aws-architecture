# Nigredo Monitoring - Quick Reference

## Dashboard Access

**Dashboard Name**: `Nigredo-Prospecting-{env}`

**URL Pattern**: 
```
https://console.aws.amazon.com/cloudwatch/home?region={region}#dashboards:name=Nigredo-Prospecting-{env}
```

## Key Metrics at a Glance

### Business Metrics
| Metric | Namespace | Description |
|--------|-----------|-------------|
| LeadSubmissions | Nigredo/Prospecting | Total leads captured |
| WebhookSuccess | Nigredo/Prospecting | Successful webhook deliveries |
| WebhookFailure | Nigredo/Prospecting | Failed webhook deliveries |
| RateLimitHits | Nigredo/Prospecting | Rate limit enforcement count |

### Technical Metrics
| Metric | Source | Description |
|--------|--------|-------------|
| API Requests | API Gateway | Total API calls |
| 4xx Errors | API Gateway | Client errors |
| 5xx Errors | API Gateway | Server errors |
| Latency (p50/p95/p99) | API Gateway | Response time percentiles |
| Lambda Errors | Lambda | Function execution errors |
| Lambda Duration | Lambda | Function execution time |
| Lambda Throttles | Lambda | Concurrency limit hits |

## Critical Alarms (Immediate Action Required)

| Alarm | Threshold | Action |
|-------|-----------|--------|
| API Error Rate | > 5% | Check Lambda logs, verify database connectivity |
| API Latency p99 | > 1000ms | Check database performance, review slow queries |
| Webhook Failure Rate | > 10% | Verify Fibonacci endpoint, check network connectivity |
| Lambda Errors | > 5 in 5min | Check CloudWatch logs for error details |

## Warning Alarms (Monitor Closely)

| Alarm | Threshold | Action |
|-------|-----------|--------|
| API Latency p95 | > 500ms | Review performance, consider optimization |
| Lambda Duration p95 | > 500ms | Profile function, optimize code |
| Lambda Throttles | ≥ 1 | Increase concurrency limit or optimize invocations |
| Rate Limit Hits | > 100 in 5min | Review IP patterns, adjust limits if needed |

## CloudWatch Insights Queries

### Quick Investigation Queries

**Top Lead Sources**
```
Query Name: {env}/nigredo/top-lead-sources
Use Case: Identify which marketing campaigns are most effective
```

**Conversion Funnel**
```
Query Name: {env}/nigredo/conversion-funnel
Use Case: Track lead progression and identify drop-off points
```

**Error Analysis**
```
Query Name: {env}/nigredo/error-analysis
Use Case: Identify most common errors by endpoint
```

**Webhook Failures**
```
Query Name: {env}/nigredo/webhook-failures
Use Case: Debug webhook delivery issues
```

**Rate Limit Analysis**
```
Query Name: {env}/nigredo/rate-limit-analysis
Use Case: Identify potential abuse or legitimate high-volume users
```

**Performance Analysis**
```
Query Name: {env}/nigredo/performance-analysis
Use Case: Identify slow endpoints and optimize
```

## Common Troubleshooting Scenarios

### High Error Rate

1. Check the Error Analysis query
2. Identify the most common error type
3. Review Lambda logs for that endpoint
4. Check database connectivity if DB errors
5. Verify external service availability if webhook errors

### High Latency

1. Check Performance Analysis query
2. Identify slow endpoints
3. Review database query performance
4. Check for Lambda cold starts
5. Consider increasing Lambda memory

### Webhook Failures

1. Check Webhook Failures query
2. Verify Fibonacci endpoint is accessible
3. Check webhook retry logs
4. Verify network connectivity from Lambda VPC
5. Check Fibonacci logs for rejection reasons

### Rate Limiting Issues

1. Check Rate Limit Analysis query
2. Identify IP addresses hitting limits
3. Determine if legitimate traffic or abuse
4. Adjust rate limits if needed
5. Consider implementing IP whitelisting

## Metric Publishing (For Developers)

### Publishing Custom Metrics

```typescript
import { MetricUnits } from '@aws-lambda-powertools/metrics';
import { metrics } from './shared/logger';

// Lead submission
metrics.addMetric('LeadSubmissions', MetricUnits.Count, 1);

// Webhook success
metrics.addMetric('WebhookSuccess', MetricUnits.Count, 1);

// Webhook failure
metrics.addMetric('WebhookFailure', MetricUnits.Count, 1);

// Rate limit hit
metrics.addMetric('RateLimitHits', MetricUnits.Count, 1);
```

## Dashboard Widgets Overview

### Row 1: Lead Submissions
- Line graph showing lead volume over time

### Row 2: Webhook Health
- Success rate gauge (0-100%)
- Success vs failure counts

### Row 3: API Health
- Request volume
- Error rate with 4xx/5xx breakdown

### Row 4: API Latency
- Multi-line graph: avg, p50, p95, p99

### Row 5: Errors by Endpoint
- Stacked area chart showing errors per endpoint

### Row 6: Invocations by Endpoint
- Line graph showing request distribution

### Row 7: Create Lead Performance
- Duration percentiles
- Latest metrics summary

### Row 8: List & Get Lead Performance
- Side-by-side duration graphs

### Row 9: Rate Limiting
- Current hits (single value)
- Hits over time (line graph)

### Row 10: Lambda Throttles
- Throttle counts by function

## SNS Topic Subscription

**Subscribe via CLI**:
```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:{region}:{account}:nigredo-api-alarms-{env} \
  --protocol email \
  --notification-endpoint your-email@example.com
```

**Subscribe via Console**:
1. Navigate to SNS Console
2. Find topic: `nigredo-api-alarms-{env}`
3. Click "Create subscription"
4. Select protocol (email, SMS, etc.)
5. Enter endpoint
6. Confirm subscription

## Alarm States

| State | Color | Meaning |
|-------|-------|---------|
| OK | Green | Metric is within threshold |
| ALARM | Red | Metric exceeded threshold |
| INSUFFICIENT_DATA | Gray | Not enough data to evaluate |

## Best Practices

1. **Review dashboard daily** - Check for trends and anomalies
2. **Investigate warnings promptly** - Prevent escalation to critical
3. **Use Insights queries** - Deep dive into issues quickly
4. **Set up notifications** - Subscribe to SNS topic for alerts
5. **Monitor webhook success rate** - Ensure Fibonacci integration health
6. **Track conversion funnel** - Optimize lead capture process
7. **Review rate limit hits** - Balance security and user experience

## Quick Links

- **CloudWatch Console**: https://console.aws.amazon.com/cloudwatch
- **Lambda Console**: https://console.aws.amazon.com/lambda
- **API Gateway Console**: https://console.aws.amazon.com/apigateway
- **SNS Console**: https://console.aws.amazon.com/sns

## Support

For issues or questions:
1. Check CloudWatch Logs for detailed error messages
2. Review Insights queries for patterns
3. Consult the full documentation: `MONITORING-OBSERVABILITY-COMPLETE.md`
4. Contact the platform team if issues persist

---

**Last Updated**: 2024-01-15
**Version**: 1.0
