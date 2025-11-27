# Nigredo Prospecting Core - Monitoring Components

This directory contains the monitoring and observability infrastructure for the Nigredo Prospecting Core system.

## Components

### 1. NigredoDashboard (`nigredo-dashboard.ts`)

Comprehensive CloudWatch dashboard for the Nigredo API.

**Features**:
- Lead submission tracking
- Webhook success rate monitoring
- API Gateway metrics (requests, errors, latency)
- Lambda performance by endpoint
- Rate limiting metrics
- Throttle monitoring

**Widgets**: 10 rows, 24 total widgets

**Usage**:
```typescript
import { NigredoDashboard } from './dashboards/nigredo-dashboard';

const dashboard = new NigredoDashboard(this, 'NigredoDashboard', {
  envName: 'dev',
  createLeadLambda: createLeadLambda,
  listLeadsLambda: listLeadsLambda,
  getLeadLambda: getLeadLambda,
  httpApi: httpApi
});
```

### 2. NigredoInsightsQueries (`nigredo-insights-queries.ts`)

Pre-configured CloudWatch Insights queries for deep analysis.

**Queries**:
1. **Top Lead Sources** - Identify most effective marketing channels
2. **Conversion Funnel** - Track lead progression through stages
3. **Error Analysis** - Group errors by endpoint and type
4. **Webhook Failures** - Debug webhook delivery issues
5. **Rate Limit Analysis** - Identify abuse patterns
6. **Performance Analysis** - Analyze API performance by endpoint

**Additional Templates**: 10+ query templates for common scenarios

**Usage**:
```typescript
import { NigredoInsightsQueries } from './dashboards/nigredo-insights-queries';

const queries = new NigredoInsightsQueries(this, 'NigredoInsightsQueries', {
  logGroups: [
    createLeadLambda.logGroup,
    listLeadsLambda.logGroup,
    getLeadLambda.logGroup
  ],
  envName: 'dev'
});
```

### 3. NigredoAlarms (`nigredo-alarms.ts`)

Comprehensive alarm system with critical and warning levels.

**Critical Alarms** (6):
- API Error Rate > 5%
- API Latency > 1000ms (p99)
- Webhook Failure Rate > 10%
- Lambda Errors (per endpoint)

**Warning Alarms** (4):
- API Latency > 500ms (p95)
- Lambda Duration > 500ms (p95)
- Lambda Throttles
- High Rate Limit Hits

**Usage**:
```typescript
import { NigredoAlarms } from './dashboards/nigredo-alarms';

const alarms = new NigredoAlarms(this, 'NigredoAlarms', {
  envName: 'dev',
  createLeadLambda: createLeadLambda,
  listLeadsLambda: listLeadsLambda,
  getLeadLambda: getLeadLambda,
  httpApi: httpApi,
  alarmTopic: alarmTopic
});

// Access alarm arrays
console.log(`Critical alarms: ${alarms.criticalAlarms.length}`);
console.log(`Warning alarms: ${alarms.warningAlarms.length}`);
```

## Integration Example

Complete integration in `lib/nigredo-stack.ts`:

```typescript
import { NigredoDashboard } from './dashboards/nigredo-dashboard';
import { NigredoInsightsQueries } from './dashboards/nigredo-insights-queries';
import { NigredoAlarms } from './dashboards/nigredo-alarms';

// Create SNS topic for alarms
const alarmTopic = new sns.Topic(this, 'NigredoApiAlarmTopic', {
  topicName: `nigredo-api-alarms-${props.envName}`,
  displayName: 'Nigredo API Alarms'
});

// Create dashboard
const dashboard = new NigredoDashboard(this, 'NigredoDashboard', {
  envName: props.envName,
  createLeadLambda: this.createLeadLambda,
  listLeadsLambda: this.listLeadsLambda,
  getLeadLambda: this.getLeadLambda,
  httpApi: this.httpApi
});

// Create insights queries
const queries = new NigredoInsightsQueries(this, 'NigredoApiInsightsQueries', {
  logGroups: [
    this.createLeadLambda.logGroup,
    this.listLeadsLambda.logGroup,
    this.getLeadLambda.logGroup
  ],
  envName: props.envName
});

// Create alarms
const alarms = new NigredoAlarms(this, 'NigredoAlarms', {
  envName: props.envName,
  createLeadLambda: this.createLeadLambda,
  listLeadsLambda: this.listLeadsLambda,
  getLeadLambda: this.getLeadLambda,
  httpApi: this.httpApi,
  alarmTopic: alarmTopic
});
```

## Custom Metrics

The monitoring system expects the following custom metrics to be published by Lambda functions:

### Namespace: `Nigredo/Prospecting`

| Metric Name | Unit | When to Publish |
|-------------|------|-----------------|
| LeadSubmissions | Count | When a lead is successfully created |
| WebhookSuccess | Count | When webhook delivery succeeds |
| WebhookFailure | Count | When webhook delivery fails after retries |
| RateLimitHits | Count | When rate limit is exceeded |

### Publishing Example

```typescript
import { MetricUnits } from '@aws-lambda-powertools/metrics';
import { metrics } from '../shared/logger';

// In create-lead.ts
metrics.addMetric('LeadSubmissions', MetricUnits.Count, 1);

// In webhook-sender.ts
if (success) {
  metrics.addMetric('WebhookSuccess', MetricUnits.Count, 1);
} else {
  metrics.addMetric('WebhookFailure', MetricUnits.Count, 1);
}

// In rate-limiter.ts
if (rateLimitExceeded) {
  metrics.addMetric('RateLimitHits', MetricUnits.Count, 1);
}
```

## CloudFormation Outputs

The monitoring components export the following outputs:

```
NigredoDashboardName-{env}
NigredoTopLeadSourcesQuery-{env}
NigredoConversionFunnelQuery-{env}
NigredoErrorAnalysisQuery-{env}
NigredoCriticalAlarmsCount-{env}
NigredoWarningAlarmsCount-{env}
```

## Accessing Monitoring Resources

### Dashboard
```bash
# Get dashboard name
aws cloudformation describe-stacks \
  --stack-name NigredoStack-dev \
  --query "Stacks[0].Outputs[?OutputKey=='NigredoDashboardName'].OutputValue" \
  --output text

# Open in browser
open "https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=$(aws cloudformation describe-stacks --stack-name NigredoStack-dev --query "Stacks[0].Outputs[?OutputKey=='NigredoDashboardName'].OutputValue" --output text)"
```

### Insights Queries
```bash
# List all Nigredo queries
aws logs describe-query-definitions \
  --query "queryDefinitions[?contains(name, 'nigredo')]"
```

### Alarms
```bash
# List all Nigredo alarms
aws cloudwatch describe-alarms \
  --alarm-name-prefix "nigredo-" \
  --query "MetricAlarms[*].[AlarmName,StateValue]" \
  --output table
```

## Alarm Notification Setup

Subscribe to the SNS topic to receive alarm notifications:

```bash
# Get topic ARN
TOPIC_ARN=$(aws cloudformation describe-stacks \
  --stack-name NigredoStack-dev \
  --query "Stacks[0].Outputs[?OutputKey=='AlarmTopicArn'].OutputValue" \
  --output text)

# Subscribe email
aws sns subscribe \
  --topic-arn $TOPIC_ARN \
  --protocol email \
  --notification-endpoint your-email@example.com

# Subscribe SMS
aws sns subscribe \
  --topic-arn $TOPIC_ARN \
  --protocol sms \
  --notification-endpoint +1234567890
```

## Testing Alarms

### Trigger Test Alarm

```bash
# Set alarm to ALARM state manually
aws cloudwatch set-alarm-state \
  --alarm-name "nigredo-create-lead-errors-critical-dev" \
  --state-value ALARM \
  --state-reason "Testing alarm notification"
```

### Reset Alarm

```bash
# Set alarm back to OK state
aws cloudwatch set-alarm-state \
  --alarm-name "nigredo-create-lead-errors-critical-dev" \
  --state-value OK \
  --state-reason "Test complete"
```

## Monitoring Best Practices

1. **Review dashboard daily** - Check for trends and anomalies
2. **Set up SNS subscriptions** - Ensure team receives alarm notifications
3. **Use Insights queries** - Investigate issues quickly with pre-built queries
4. **Monitor webhook success rate** - Critical for Fibonacci integration
5. **Track conversion funnel** - Optimize lead capture process
6. **Adjust alarm thresholds** - Fine-tune based on actual traffic patterns
7. **Document incidents** - Use Insights queries to create incident reports

## Troubleshooting

### Dashboard Not Showing Data

1. Verify Lambda functions are being invoked
2. Check that custom metrics are being published
3. Ensure CloudWatch Logs are enabled
4. Verify IAM permissions for CloudWatch

### Alarms Not Triggering

1. Check alarm state in CloudWatch console
2. Verify SNS topic subscriptions are confirmed
3. Check alarm evaluation periods and thresholds
4. Review CloudWatch Logs for metric data

### Insights Queries Returning No Results

1. Verify log groups exist and contain data
2. Check query time range
3. Ensure structured logging is implemented
4. Verify log field names match query

## Related Documentation

- **Full Implementation Guide**: `lambda/nigredo/MONITORING-OBSERVABILITY-COMPLETE.md`
- **Quick Reference**: `lambda/nigredo/MONITORING-QUICK-REFERENCE.md`
- **Design Document**: `.kiro/specs/nigredo-prospecting-core/design.md`
- **Requirements**: `.kiro/specs/nigredo-prospecting-core/requirements.md`

## Support

For issues or questions about monitoring:
1. Check CloudWatch Logs for detailed error messages
2. Review Insights queries for patterns
3. Consult the implementation guide
4. Contact the platform team

---

**Last Updated**: 2024-01-15
**Version**: 1.0
**Status**: Production Ready
