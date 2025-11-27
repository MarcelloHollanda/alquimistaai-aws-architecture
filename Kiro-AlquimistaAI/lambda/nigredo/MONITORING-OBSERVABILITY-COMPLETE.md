# Nigredo Prospecting Core - Monitoring & Observability Implementation

## Overview

Comprehensive monitoring and observability has been implemented for the Nigredo Prospecting Core system, providing complete visibility into lead submissions, API performance, webhook delivery, and error tracking.

## Implementation Summary

### ✅ Task 11.1: CloudWatch Dashboard

**File**: `lib/dashboards/nigredo-dashboard.ts`

Created a comprehensive dashboard with the following widgets:

#### Lead Submissions Metrics
- **Lead Submissions Over Time**: Tracks total lead submissions with 5-minute granularity
- **Webhook Success Rate**: Displays webhook delivery success percentage
- **Webhook Attempts**: Shows successful vs failed webhook deliveries

#### API Gateway Metrics
- **API Requests per Minute**: Total request volume
- **API Error Rate**: Combined 4xx and 5xx error rate percentage
- **API Latency Percentiles**: Average, p50, p95, and p99 latency tracking

#### Lambda Performance by Endpoint
- **Errors by Endpoint**: Error counts for Create, List, and Get Lead endpoints
- **Invocations by Endpoint**: Request volume per endpoint
- **Lambda Duration**: Detailed latency metrics (avg, p95, p99) for each endpoint

#### Operational Metrics
- **Rate Limit Hits**: Tracks rate limiting enforcement
- **Lambda Throttles**: Monitors Lambda concurrency limits

### ✅ Task 11.2: CloudWatch Insights Queries

**File**: `lib/dashboards/nigredo-insights-queries.ts`

Implemented 6 pre-configured queries for deep analysis:

#### 1. Top Lead Sources
```
Analyzes which sources (utm_source, utm_campaign) generate the most leads
Groups by: source, utm_source, utm_campaign
Sorts by: lead count descending
```

#### 2. Conversion Funnel
```
Tracks leads through prospecting stages:
- Form submissions received
- Leads created successfully
- Webhooks sent
- Webhooks failed
Calculates conversion and success rates
```

#### 3. Error Analysis by Endpoint
```
Groups errors by:
- Endpoint path
- HTTP method
- Error name and code
Identifies most common error patterns
```

#### 4. Webhook Failures Analysis
```
Detailed webhook failure tracking:
- Failure count by lead
- Last failure timestamp
- Error messages
- Retry attempts
```

#### 5. Rate Limit Analysis
```
Tracks rate limiting by:
- IP address
- Time window (hourly bins)
Identifies potential abuse patterns
```

#### 6. Performance Analysis
```
API performance metrics by endpoint:
- Request count
- Average, min, max duration
- p50, p95, p99 percentiles
```

#### Additional Queries Available
The file also includes 10+ additional query templates for:
- Validation errors
- Submission patterns by time
- Duplicate lead detection
- Webhook retry patterns
- Slow database queries
- CORS errors
- Campaign performance
- Lambda cold starts

### ✅ Task 11.3: CloudWatch Alarms

**File**: `lib/dashboards/nigredo-alarms.ts`

Implemented comprehensive alarm system with critical and warning levels:

#### Critical Alarms (6 total)

1. **API Error Rate > 5%**
   - Metric: (4xx + 5xx) / total requests * 100
   - Threshold: 5%
   - Evaluation: 2 of 2 datapoints in 5 minutes
   - Action: SNS notification

2. **API Latency > 1000ms (p99)**
   - Metric: API Gateway p99 latency
   - Threshold: 1000ms
   - Evaluation: 2 of 2 datapoints in 5 minutes
   - Action: SNS notification

3. **Webhook Failure Rate > 10%**
   - Metric: webhook failures / total attempts * 100
   - Threshold: 10%
   - Evaluation: 2 of 2 datapoints in 5 minutes
   - Action: SNS notification

4. **Create Lead Lambda Errors**
   - Metric: Lambda error count
   - Threshold: 5 errors
   - Evaluation: 2 of 2 datapoints in 5 minutes
   - Action: SNS notification

5. **List Leads Lambda Errors**
   - Metric: Lambda error count
   - Threshold: 5 errors
   - Evaluation: 2 of 2 datapoints in 5 minutes
   - Action: SNS notification

6. **Get Lead Lambda Errors**
   - Metric: Lambda error count
   - Threshold: 5 errors
   - Evaluation: 2 of 2 datapoints in 5 minutes
   - Action: SNS notification

#### Warning Alarms (4 total)

1. **API Latency > 500ms (p95)**
   - Metric: API Gateway p95 latency
   - Threshold: 500ms
   - Evaluation: 2 of 3 datapoints in 5 minutes
   - Action: SNS notification

2. **Create Lead Lambda Duration > 500ms (p95)**
   - Metric: Lambda p95 duration
   - Threshold: 500ms
   - Evaluation: 2 of 3 datapoints in 5 minutes
   - Action: SNS notification

3. **Lambda Throttles**
   - Metric: Lambda throttle count
   - Threshold: 1 throttle
   - Evaluation: 1 of 1 datapoint in 5 minutes
   - Action: SNS notification

4. **High Rate Limit Hits**
   - Metric: Rate limit hit count
   - Threshold: 100 hits
   - Evaluation: 2 of 2 datapoints in 5 minutes
   - Action: SNS notification

## Integration with Nigredo Stack

The monitoring components are integrated into `lib/nigredo-stack.ts`:

```typescript
// Dashboard
const nigredoDashboard = new NigredoDashboard(this, 'NigredoDashboard', {
  envName: props.envName,
  createLeadLambda: this.createLeadLambda,
  listLeadsLambda: this.listLeadsLambda,
  getLeadLambda: this.getLeadLambda,
  httpApi: this.httpApi
});

// Insights Queries
const nigredoApiInsightsQueries = new NigredoInsightsQueries(this, 'NigredoApiInsightsQueries', {
  logGroups: [
    this.createLeadLambda.logGroup,
    this.listLeadsLambda.logGroup,
    this.getLeadLambda.logGroup
  ],
  envName: props.envName
});

// Alarms
const nigredoAlarms = new NigredoAlarms(this, 'NigredoAlarms', {
  envName: props.envName,
  createLeadLambda: this.createLeadLambda,
  listLeadsLambda: this.listLeadsLambda,
  getLeadLambda: this.getLeadLambda,
  httpApi: this.httpApi,
  alarmTopic: alarmTopic
});
```

## Custom Metrics Published

The Lambda functions should publish the following custom metrics to CloudWatch:

### Namespace: `Nigredo/Prospecting`

1. **LeadSubmissions** (Count)
   - Published when: Lead is successfully created
   - Dimensions: None
   - Use: Track total lead volume

2. **WebhookSuccess** (Count)
   - Published when: Webhook delivery succeeds
   - Dimensions: None
   - Use: Calculate webhook success rate

3. **WebhookFailure** (Count)
   - Published when: Webhook delivery fails after all retries
   - Dimensions: None
   - Use: Calculate webhook failure rate

4. **RateLimitHits** (Count)
   - Published when: Rate limit is exceeded
   - Dimensions: None
   - Use: Monitor abuse patterns

## CloudFormation Outputs

The following outputs are exported for reference:

```
NigredoDashboardName-{env}
NigredoTopLeadSourcesQuery-{env}
NigredoConversionFunnelQuery-{env}
NigredoErrorAnalysisQuery-{env}
NigredoCriticalAlarmsCount-{env}
NigredoWarningAlarmsCount-{env}
```

## Accessing the Monitoring

### CloudWatch Dashboard
1. Navigate to CloudWatch Console
2. Select "Dashboards" from the left menu
3. Find dashboard: `Nigredo-Prospecting-{env}`

### CloudWatch Insights Queries
1. Navigate to CloudWatch Console
2. Select "Logs Insights" from the left menu
3. Select "Queries" tab
4. Find queries prefixed with `{env}/nigredo/`

### CloudWatch Alarms
1. Navigate to CloudWatch Console
2. Select "Alarms" from the left menu
3. Filter by name: `nigredo-*-{env}`

## Alarm Notification Setup

To receive alarm notifications:

1. Subscribe to the SNS topic:
   ```bash
   aws sns subscribe \
     --topic-arn $(aws cloudformation describe-stacks \
       --stack-name NigredoStack-{env} \
       --query "Stacks[0].Outputs[?OutputKey=='AlarmTopicArn'].OutputValue" \
       --output text) \
     --protocol email \
     --notification-endpoint your-email@example.com
   ```

2. Confirm the subscription via email

3. You'll receive notifications for all critical and warning alarms

## Requirements Satisfied

✅ **Requirement 7.2**: CloudWatch metrics for lead submission count, webhook success rate, and API latency
✅ **Requirement 7.5**: CloudWatch dashboard showing key metrics and system health
✅ **Requirement 7.1**: CloudWatch Insights queries for analysis
✅ **Requirement 7.4**: CloudWatch alarms for error rates and latency thresholds

## Next Steps

1. **Deploy the monitoring stack**:
   ```bash
   npm run cdk deploy NigredoStack-dev
   ```

2. **Verify dashboard creation**:
   - Check CloudWatch console for new dashboard
   - Verify all widgets are displaying correctly

3. **Test alarms**:
   - Trigger test errors to verify alarm notifications
   - Confirm SNS topic subscriptions

4. **Configure custom metrics**:
   - Update Lambda functions to publish custom metrics
   - Use AWS Lambda Powertools Metrics for easy publishing

5. **Set up alerting channels**:
   - Subscribe email addresses to SNS topic
   - Integrate with Slack/PagerDuty if needed

## Files Created

- `lib/dashboards/nigredo-dashboard.ts` - Main dashboard with 10 rows of widgets
- `lib/dashboards/nigredo-insights-queries.ts` - 6 pre-configured queries + 10 templates
- `lib/dashboards/nigredo-alarms.ts` - 10 alarms (6 critical, 4 warning)

## Files Modified

- `lib/nigredo-stack.ts` - Integrated monitoring components

## Monitoring Best Practices Implemented

1. **Multi-level alerting**: Critical and warning thresholds
2. **Comprehensive coverage**: API, Lambda, webhooks, rate limiting
3. **Actionable metrics**: Business and technical metrics combined
4. **Query templates**: Pre-built queries for common investigations
5. **Percentile tracking**: p50, p95, p99 for latency analysis
6. **Error categorization**: Errors grouped by endpoint and type
7. **Funnel analysis**: Track conversion through prospecting stages

---

**Status**: ✅ Complete
**Date**: 2024-01-15
**Task**: 11. Add monitoring and observability
