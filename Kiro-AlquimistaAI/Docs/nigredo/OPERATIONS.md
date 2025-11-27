# Nigredo Operations Runbook

## Overview

This runbook provides operational procedures, monitoring guidelines, and incident response playbooks for the Nigredo Prospecting Core system. It is designed for DevOps engineers, SREs, and on-call personnel.

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Monitoring and Alerting](#monitoring-and-alerting)
3. [Incident Response](#incident-response)
4. [Common Issues and Solutions](#common-issues-and-solutions)
5. [Maintenance Procedures](#maintenance-procedures)
6. [Performance Optimization](#performance-optimization)
7. [Security Operations](#security-operations)
8. [Disaster Recovery](#disaster-recovery)

---

## System Architecture Overview

### Components

**Backend (AWS Lambda)**:
- `nigredo-create-lead-{env}`: Handles form submissions
- `nigredo-list-leads-{env}`: Lists leads with pagination
- `nigredo-get-lead-{env}`: Retrieves lead details
- `nigredo-webhook-sender-{env}`: Sends events to Fibonacci

**Frontend (S3 + CloudFront)**:
- S3 Bucket: `nigredo-frontend-{env}-xxxxx`
- CloudFront Distribution: `dxxxxx.cloudfront.net`

**Database**:
- Aurora PostgreSQL cluster (shared with Fibonacci)
- Schema: `nigredo`
- Tables: `leads`, `form_submissions`, `webhook_logs`, `rate_limits`

**API Gateway**:
- HTTP API: `https://xxxxx.execute-api.{region}.amazonaws.com`
- Routes: `/api/leads`, `/api/leads/{id}`, `/health`

### Dependencies

- **Fibonacci System**: Webhook endpoint for lead events
- **Cognito**: Authentication for protected endpoints
- **Secrets Manager**: Database credentials
- **KMS**: Encryption keys
- **VPC**: Network isolation


---

## Monitoring and Alerting

### CloudWatch Dashboard

**Dashboard Name**: `Nigredo-Dashboard-{env}`

**Access**: AWS Console → CloudWatch → Dashboards → Nigredo-Dashboard-{env}

**Key Widgets**:
1. **Lead Submissions Over Time**: Line chart showing submission trends
2. **Webhook Success Rate**: Gauge showing percentage of successful webhooks
3. **API Latency Percentiles**: P50, P95, P99 latency metrics
4. **Error Rate by Endpoint**: Bar chart of errors per endpoint
5. **Top Lead Sources**: Pie chart of traffic sources
6. **Rate Limit Hits**: Count of rate-limited requests

### Key Metrics

| Metric Name | Description | Normal Range | Alert Threshold |
|-------------|-------------|--------------|-----------------|
| `NigredoLeadSubmissions` | Lead submissions per minute | 0-100 | N/A |
| `NigredoWebhookSuccess` | Successful webhook deliveries | 95-100% | < 90% |
| `NigredoWebhookFailure` | Failed webhook deliveries | 0-5% | > 10% |
| `NigredoApiLatency` | API response time (ms) | 100-500ms | > 1000ms (p99) |
| `NigredoRateLimitHits` | Rate-limited requests | 0-10/hour | > 100/hour |
| `NigredoApiErrors` | API error count | 0-5/hour | > 10/minute |

### CloudWatch Alarms

#### Critical Alarms

**1. High API Error Rate**
- **Alarm Name**: `nigredo-api-error-rate-{env}`
- **Condition**: Error rate > 5% for 5 minutes
- **Action**: SNS notification to on-call team
- **Response**: Follow [High Error Rate Incident](#high-error-rate) procedure

**2. High API Latency**
- **Alarm Name**: `nigredo-api-latency-p99-{env}`
- **Condition**: P99 latency > 1000ms for 5 minutes
- **Action**: SNS notification to on-call team
- **Response**: Follow [High Latency Incident](#high-latency) procedure

**3. Webhook Failure Rate**
- **Alarm Name**: `nigredo-webhook-failure-rate-{env}`
- **Condition**: Failure rate > 10% for 10 minutes
- **Action**: SNS notification to on-call team
- **Response**: Follow [Webhook Failures Incident](#webhook-failures) procedure

#### Warning Alarms

**1. Elevated API Latency**
- **Alarm Name**: `nigredo-api-latency-p95-{env}`
- **Condition**: P95 latency > 500ms for 10 minutes
- **Action**: SNS notification to DevOps team
- **Response**: Investigate and optimize if persistent

**2. Database Connection Errors**
- **Alarm Name**: `nigredo-db-connection-errors-{env}`
- **Condition**: Connection errors > 5 in 5 minutes
- **Action**: SNS notification to DevOps team
- **Response**: Check database health and connection pool

**3. High Rate Limit Hits**
- **Alarm Name**: `nigredo-rate-limit-hits-{env}`
- **Condition**: Rate limit hits > 100 per hour
- **Action**: SNS notification to DevOps team
- **Response**: Investigate potential abuse or adjust limits

### Log Monitoring

**CloudWatch Logs Insights Queries**:

**1. Top Error Messages (Last Hour)**
```sql
fields @timestamp, level, message, error
| filter level = "ERROR"
| stats count() by message
| sort count desc
| limit 10
```

**2. Slow API Requests (> 1 second)**
```sql
fields @timestamp, function, duration_ms, request_id
| filter duration_ms > 1000
| sort duration_ms desc
| limit 20
```

**3. Failed Webhook Deliveries**
```sql
fields @timestamp, lead_id, webhook_url, status_code, error_message
| filter success = false
| sort @timestamp desc
| limit 50
```

**4. Rate Limited Requests**
```sql
fields @timestamp, ip_address, user_agent
| filter message like /rate limit exceeded/i
| stats count() by ip_address
| sort count desc
```

### X-Ray Tracing

**Access**: AWS Console → X-Ray → Service Map

**Use Cases**:
- Identify bottlenecks in request flow
- Trace failed requests end-to-end
- Analyze database query performance
- Debug webhook delivery issues

**Example Trace Analysis**:
1. Navigate to X-Ray Console
2. Select time range (e.g., last 1 hour)
3. Filter by HTTP status code (e.g., 500)
4. Click on trace to see detailed timeline
5. Identify slow subsegments (database, webhook, etc.)


---

## Incident Response

### Incident Severity Levels

| Severity | Description | Response Time | Examples |
|----------|-------------|---------------|----------|
| **P0 - Critical** | Complete service outage | 15 minutes | API completely down, database unavailable |
| **P1 - High** | Major functionality impaired | 30 minutes | High error rate, webhook failures |
| **P2 - Medium** | Degraded performance | 2 hours | Elevated latency, partial failures |
| **P3 - Low** | Minor issues | 1 business day | Cosmetic issues, non-critical bugs |

### Incident Response Process

1. **Detect**: Alarm triggers or user report
2. **Acknowledge**: On-call engineer acknowledges incident
3. **Assess**: Determine severity and impact
4. **Communicate**: Notify stakeholders
5. **Mitigate**: Implement temporary fix
6. **Resolve**: Deploy permanent solution
7. **Document**: Write post-mortem
8. **Review**: Conduct incident review meeting

### Communication Channels

- **Slack**: #nigredo-incidents (real-time updates)
- **Email**: incidents@alquimista.ai (formal notifications)
- **Status Page**: https://status.alquimista.ai (customer-facing)
- **PagerDuty**: On-call escalation

### Incident Playbooks

#### High Error Rate

**Symptoms**:
- CloudWatch alarm: `nigredo-api-error-rate-{env}` triggered
- Error rate > 5% for 5+ minutes
- Multiple 500 errors in logs

**Investigation Steps**:

1. **Check CloudWatch Logs**:
   ```bash
   aws logs tail /aws/lambda/nigredo-create-lead-prod --follow --filter-pattern "ERROR"
   ```

2. **Identify Error Pattern**:
   - Database connection errors?
   - Validation errors?
   - Webhook timeout errors?
   - External service failures?

3. **Check Dependencies**:
   - Database health: Check Aurora cluster status
   - Secrets Manager: Verify secret is accessible
   - Fibonacci webhook: Test endpoint availability
   - VPC/Security Groups: Verify network connectivity

4. **Review Recent Changes**:
   - Check recent deployments
   - Review CloudFormation stack events
   - Check for configuration changes

**Resolution Steps**:

**If Database Connection Errors**:
```bash
# Check database cluster status
aws rds describe-db-clusters --db-cluster-identifier fibonacci-prod

# Check database connections
psql -h <DB_ENDPOINT> -U <DB_USERNAME> -d fibonacci -c "SELECT count(*) FROM pg_stat_activity;"

# If connection pool exhausted, restart Lambda functions
aws lambda update-function-configuration \
  --function-name nigredo-create-lead-prod \
  --environment Variables={FORCE_RESTART=true}
```

**If Webhook Timeout Errors**:
```bash
# Test Fibonacci webhook endpoint
curl -X POST https://api.alquimista.ai/public/nigredo-event \
  -H "Content-Type: application/json" \
  -d '{"event_type":"lead.created","timestamp":"2024-01-15T10:30:00Z","lead":{}}'

# If Fibonacci is down, temporarily disable webhook
# (leads will still be saved, webhooks can be replayed later)
```

**If Validation Errors**:
- Check for malformed requests in logs
- Review recent frontend changes
- Verify API Gateway request validation

**Rollback Procedure**:
```bash
# Rollback to previous Lambda version
aws lambda update-function-code \
  --function-name nigredo-create-lead-prod \
  --s3-bucket lambda-deployments \
  --s3-key nigredo-create-lead-prod-previous.zip

# Or rollback entire stack
cdk deploy NigredoApiStack-prod --rollback
```

#### High Latency

**Symptoms**:
- CloudWatch alarm: `nigredo-api-latency-p99-{env}` triggered
- P99 latency > 1000ms for 5+ minutes
- Slow API responses reported by users

**Investigation Steps**:

1. **Check X-Ray Traces**:
   - Navigate to X-Ray Console
   - Filter by slow requests (> 1000ms)
   - Identify bottleneck subsegments

2. **Analyze Slow Queries**:
   ```sql
   -- Connect to database
   psql -h <DB_ENDPOINT> -U <DB_USERNAME> -d fibonacci
   
   -- Check slow queries
   SELECT query, mean_exec_time, calls
   FROM pg_stat_statements
   WHERE query LIKE '%nigredo%'
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

3. **Check Lambda Performance**:
   ```bash
   # Check Lambda metrics
   aws cloudwatch get-metric-statistics \
     --namespace AWS/Lambda \
     --metric-name Duration \
     --dimensions Name=FunctionName,Value=nigredo-create-lead-prod \
     --start-time 2024-01-15T10:00:00Z \
     --end-time 2024-01-15T11:00:00Z \
     --period 300 \
     --statistics Average,Maximum
   ```

4. **Check Database Performance**:
   - Aurora CPU utilization
   - Aurora connection count
   - Aurora read/write latency

**Resolution Steps**:

**If Database Slow**:
```sql
-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_leads_email ON nigredo.leads(email);
CREATE INDEX CONCURRENTLY idx_leads_created_at ON nigredo.leads(created_at DESC);

-- Analyze tables
ANALYZE nigredo.leads;
ANALYZE nigredo.form_submissions;
```

**If Lambda Cold Starts**:
```bash
# Enable provisioned concurrency
aws lambda put-provisioned-concurrency-config \
  --function-name nigredo-create-lead-prod \
  --provisioned-concurrent-executions 5
```

**If Webhook Timeouts**:
- Reduce webhook timeout from 5s to 3s
- Implement async webhook delivery using SQS
- Add circuit breaker to skip failing webhooks

#### Webhook Failures

**Symptoms**:
- CloudWatch alarm: `nigredo-webhook-failure-rate-{env}` triggered
- Failure rate > 10% for 10+ minutes
- Leads created but not appearing in Fibonacci

**Investigation Steps**:

1. **Check Webhook Logs**:
   ```sql
   -- Connect to database
   psql -h <DB_ENDPOINT> -U <DB_USERNAME> -d fibonacci
   
   -- Check recent webhook failures
   SELECT id, lead_id, status_code, error_message, sent_at
   FROM nigredo.webhook_logs
   WHERE success = false
   ORDER BY sent_at DESC
   LIMIT 20;
   ```

2. **Test Fibonacci Endpoint**:
   ```bash
   # Test webhook endpoint
   curl -v -X POST https://api.alquimista.ai/public/nigredo-event \
     -H "Content-Type: application/json" \
     -d '{
       "event_type": "lead.created",
       "timestamp": "2024-01-15T10:30:00Z",
       "lead": {
         "id": "test-id",
         "name": "Test",
         "email": "test@example.com",
         "message": "Test"
       }
     }'
   ```

3. **Check Fibonacci System Status**:
   - Check Fibonacci CloudWatch dashboard
   - Review Fibonacci Lambda logs
   - Verify Fibonacci database is healthy

**Resolution Steps**:

**If Fibonacci is Down**:
```bash
# Temporarily disable webhook delivery
# Update Lambda environment variable
aws lambda update-function-configuration \
  --function-name nigredo-create-lead-prod \
  --environment Variables={WEBHOOK_ENABLED=false}

# Leads will still be saved, webhooks can be replayed later
```

**If Network Issues**:
- Check VPC routing tables
- Verify security group rules
- Check NAT Gateway health
- Verify DNS resolution

**Replay Failed Webhooks**:
```sql
-- Get failed webhook lead IDs
SELECT DISTINCT lead_id
FROM nigredo.webhook_logs
WHERE success = false
  AND sent_at > NOW() - INTERVAL '1 hour';

-- Manually trigger webhook replay (requires custom script)
-- Or use EventBridge to republish events
```

#### Database Connection Failures

**Symptoms**:
- Lambda logs show "ECONNREFUSED" or "Connection timeout"
- CloudWatch alarm: `nigredo-db-connection-errors-{env}` triggered
- All API endpoints returning 503 errors

**Investigation Steps**:

1. **Check Aurora Cluster Status**:
   ```bash
   aws rds describe-db-clusters --db-cluster-identifier fibonacci-prod
   ```

2. **Check Database Connectivity**:
   ```bash
   # From Lambda VPC (use EC2 bastion or Lambda test)
   psql -h <DB_ENDPOINT> -U <DB_USERNAME> -d fibonacci -c "SELECT 1;"
   ```

3. **Check Security Groups**:
   ```bash
   # List security group rules
   aws ec2 describe-security-groups --group-ids sg-xxxxx
   ```

4. **Check Secrets Manager**:
   ```bash
   # Verify secret is accessible
   aws secretsmanager get-secret-value --secret-id fibonacci-db-prod
   ```

**Resolution Steps**:

**If Aurora is Down**:
```bash
# Check cluster events
aws rds describe-events --source-identifier fibonacci-prod --source-type db-cluster

# If failover needed
aws rds failover-db-cluster --db-cluster-identifier fibonacci-prod
```

**If Security Group Misconfigured**:
```bash
# Add Lambda security group to Aurora ingress rules
aws ec2 authorize-security-group-ingress \
  --group-id sg-aurora-xxxxx \
  --protocol tcp \
  --port 5432 \
  --source-group sg-lambda-xxxxx
```

**If Connection Pool Exhausted**:
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'fibonacci';

-- Kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'fibonacci'
  AND state = 'idle'
  AND state_change < NOW() - INTERVAL '10 minutes';
```

#### Rate Limiting Issues

**Symptoms**:
- Users reporting "Too many requests" errors
- CloudWatch alarm: `nigredo-rate-limit-hits-{env}` triggered
- Legitimate users being blocked

**Investigation Steps**:

1. **Check Rate Limit Hits**:
   ```sql
   -- Connect to database
   psql -h <DB_ENDPOINT> -U <DB_USERNAME> -d fibonacci
   
   -- Check rate limit records
   SELECT ip_address, submission_count, window_start
   FROM nigredo.rate_limits
   WHERE window_start > NOW() - INTERVAL '1 hour'
   ORDER BY submission_count DESC
   LIMIT 20;
   ```

2. **Identify Abusive IPs**:
   ```bash
   # Check CloudWatch Logs for rate-limited requests
   aws logs filter-log-events \
     --log-group-name /aws/lambda/nigredo-create-lead-prod \
     --filter-pattern "rate limit exceeded" \
     --start-time $(date -u -d '1 hour ago' +%s)000
   ```

**Resolution Steps**:

**If Legitimate User Blocked**:
```sql
-- Remove rate limit record for specific IP
DELETE FROM nigredo.rate_limits WHERE ip_address = '192.168.1.100';
```

**If Abuse Detected**:
```bash
# Add IP to WAF block list
aws wafv2 update-ip-set \
  --name nigredo-blocked-ips \
  --scope REGIONAL \
  --id xxxxx \
  --addresses 192.168.1.100/32
```

**If Rate Limit Too Restrictive**:
- Increase limit from 10 to 20 per hour
- Update Lambda environment variable
- Re-deploy stack


---

## Common Issues and Solutions

### Issue: Frontend Not Loading

**Symptoms**: CloudFront returns blank page or 404 errors

**Quick Fix**:
```bash
# Check S3 bucket has files
aws s3 ls s3://nigredo-frontend-prod-xxxxx/

# If empty, re-deploy frontend
cd frontend
npm run build
aws s3 sync out s3://nigredo-frontend-prod-xxxxx/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id EXXXXXXXXXXXXX \
  --paths "/*"
```

### Issue: CORS Errors

**Symptoms**: Browser console shows "CORS policy" errors

**Quick Fix**:
```bash
# Verify API Gateway CORS configuration
aws apigatewayv2 get-apis

# Re-deploy API Gateway with correct CORS
cdk deploy NigredoApiStack-prod
```

### Issue: Form Submission Fails

**Symptoms**: Users report form submission errors

**Quick Fix**:
1. Check CloudWatch Logs for validation errors
2. Test API endpoint directly:
   ```bash
   curl -X POST https://xxxxx.execute-api.us-east-1.amazonaws.com/api/leads \
     -H "Content-Type: application/json" \
     -d '{"name":"Test","email":"test@example.com","message":"Test message"}'
   ```
3. If validation error, check frontend form validation logic
4. If server error, check Lambda logs

### Issue: Leads Not Appearing in Fibonacci

**Symptoms**: Leads created in Nigredo but not visible in Fibonacci dashboard

**Quick Fix**:
```sql
-- Check webhook logs
SELECT * FROM nigredo.webhook_logs
WHERE success = false
ORDER BY sent_at DESC
LIMIT 10;

-- If webhooks failing, test Fibonacci endpoint
curl -X POST https://api.alquimista.ai/public/nigredo-event \
  -H "Content-Type: application/json" \
  -d '{"event_type":"lead.created","timestamp":"2024-01-15T10:30:00Z","lead":{}}'
```

### Issue: High Lambda Costs

**Symptoms**: AWS bill shows unexpected Lambda charges

**Quick Fix**:
1. Check Lambda invocation count in CloudWatch
2. Review Lambda memory allocation (reduce if over-provisioned)
3. Disable provisioned concurrency if not needed
4. Implement caching for GET endpoints

### Issue: Slow Database Queries

**Symptoms**: API latency increasing over time

**Quick Fix**:
```sql
-- Check missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'nigredo'
  AND tablename IN ('leads', 'form_submissions')
ORDER BY abs(correlation) DESC;

-- Add indexes if needed
CREATE INDEX CONCURRENTLY idx_leads_status ON nigredo.leads(status);
CREATE INDEX CONCURRENTLY idx_leads_source ON nigredo.leads(source);

-- Vacuum and analyze
VACUUM ANALYZE nigredo.leads;
VACUUM ANALYZE nigredo.form_submissions;
```

---

## Maintenance Procedures

### Daily Maintenance

**Automated Tasks**:
- CloudWatch Logs retention (7 days for dev, 30 days for prod)
- Rate limit cleanup (delete records older than 24 hours)
- Webhook retry for failed deliveries

**Manual Checks**:
- Review CloudWatch dashboard for anomalies
- Check alarm status (no active alarms)
- Review error logs for patterns

### Weekly Maintenance

**Tasks**:
1. Review CloudWatch Insights queries for trends
2. Analyze top error messages
3. Check database performance metrics
4. Review and optimize slow queries
5. Update documentation if needed

**Database Maintenance**:
```sql
-- Vacuum and analyze tables
VACUUM ANALYZE nigredo.leads;
VACUUM ANALYZE nigredo.form_submissions;
VACUUM ANALYZE nigredo.webhook_logs;
VACUUM ANALYZE nigredo.rate_limits;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'nigredo'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Monthly Maintenance

**Tasks**:
1. Review and update CloudWatch alarms
2. Analyze cost trends and optimize
3. Review security group rules
4. Update Lambda runtime if needed
5. Review and archive old logs
6. Conduct security audit
7. Update dependencies (npm packages)

**Cost Optimization**:
```bash
# Review Lambda costs
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --filter file://lambda-filter.json

# Review CloudFront costs
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --filter file://cloudfront-filter.json
```

### Quarterly Maintenance

**Tasks**:
1. Conduct disaster recovery drill
2. Review and update runbook
3. Review and update incident response procedures
4. Conduct security penetration testing
5. Review and update backup procedures
6. Analyze performance trends and capacity planning

---

## Performance Optimization

### Lambda Optimization

**Memory Allocation**:
- Start with 512 MB
- Monitor actual memory usage in CloudWatch
- Adjust based on usage patterns
- Higher memory = faster CPU but higher cost

**Cold Start Optimization**:
```typescript
// Use top-level imports
import { Client } from 'pg';
const client = new Client();

// Reuse connections
let cachedConnection: Client | null = null;

export const handler = async (event: any) => {
  if (!cachedConnection) {
    cachedConnection = await createConnection();
  }
  // Use cachedConnection
};
```

**Provisioned Concurrency**:
```bash
# Enable for critical functions only
aws lambda put-provisioned-concurrency-config \
  --function-name nigredo-create-lead-prod \
  --provisioned-concurrent-executions 5
```

### Database Optimization

**Connection Pooling**:
```typescript
// Use connection pool
import { Pool } from 'pg';

const pool = new Pool({
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

**Query Optimization**:
```sql
-- Use EXPLAIN ANALYZE to identify slow queries
EXPLAIN ANALYZE
SELECT * FROM nigredo.leads
WHERE status = 'new'
ORDER BY created_at DESC
LIMIT 20;

-- Add indexes for frequently queried columns
CREATE INDEX CONCURRENTLY idx_leads_status_created ON nigredo.leads(status, created_at DESC);
```

**Batch Operations**:
```typescript
// Instead of multiple inserts
for (const lead of leads) {
  await db.query('INSERT INTO nigredo.leads ...');
}

// Use batch insert
await db.query('INSERT INTO nigredo.leads ... VALUES ($1), ($2), ($3)', [...]);
```

### Frontend Optimization

**CloudFront Caching**:
```typescript
// Set cache headers in Next.js
export async function GET() {
  return new Response(data, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
```

**Image Optimization**:
```typescript
// Use Next.js Image component
import Image from 'next/image';

<Image
  src="/logo.png"
  width={200}
  height={100}
  alt="Logo"
  priority
/>
```

**Code Splitting**:
```typescript
// Dynamic imports for heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
});
```

---

## Security Operations

### Security Monitoring

**Daily Checks**:
- Review CloudWatch Logs for suspicious activity
- Check WAF blocked requests
- Monitor rate limit hits
- Review failed authentication attempts

**Weekly Checks**:
- Review IAM access logs
- Check for exposed secrets in logs
- Review security group changes
- Audit database access logs

**Monthly Checks**:
- Conduct security audit
- Review and rotate credentials
- Update security patches
- Review compliance requirements (LGPD)

### Security Incident Response

**If Suspicious Activity Detected**:

1. **Isolate**: Block suspicious IP addresses
   ```bash
   aws wafv2 update-ip-set \
     --name nigredo-blocked-ips \
     --scope REGIONAL \
     --id xxxxx \
     --addresses 192.168.1.100/32
   ```

2. **Investigate**: Review logs and traces
   ```bash
   aws logs filter-log-events \
     --log-group-name /aws/lambda/nigredo-create-lead-prod \
     --filter-pattern "192.168.1.100"
   ```

3. **Contain**: Disable affected resources if needed
   ```bash
   # Disable Lambda function
   aws lambda update-function-configuration \
     --function-name nigredo-create-lead-prod \
     --environment Variables={MAINTENANCE_MODE=true}
   ```

4. **Remediate**: Apply security patches
5. **Document**: Write incident report
6. **Review**: Conduct post-incident review

### Credential Rotation

**Rotate Database Credentials**:
```bash
# Generate new password
NEW_PASSWORD=$(openssl rand -base64 32)

# Update secret in Secrets Manager
aws secretsmanager update-secret \
  --secret-id fibonacci-db-prod \
  --secret-string "{\"username\":\"admin\",\"password\":\"$NEW_PASSWORD\"}"

# Update database password
psql -h <DB_ENDPOINT> -U admin -d fibonacci \
  -c "ALTER USER admin WITH PASSWORD '$NEW_PASSWORD';"

# Restart Lambda functions to pick up new credentials
aws lambda update-function-configuration \
  --function-name nigredo-create-lead-prod \
  --environment Variables={FORCE_RESTART=true}
```

**Rotate API Keys**:
```bash
# Rotate Cognito client secret (if applicable)
aws cognito-idp update-user-pool-client \
  --user-pool-id us-east-1_xxxxx \
  --client-id xxxxxxxxxxxxx \
  --generate-secret
```

---

## Disaster Recovery

### Backup Procedures

**Database Backups**:
- **Automated**: Aurora automated backups (daily, 7-day retention)
- **Manual**: Create snapshot before major changes
  ```bash
  aws rds create-db-cluster-snapshot \
    --db-cluster-identifier fibonacci-prod \
    --db-cluster-snapshot-identifier fibonacci-prod-manual-$(date +%Y%m%d)
  ```

**Frontend Backups**:
- **S3 Versioning**: Enabled on frontend bucket
- **Manual**: Download current version before deployment
  ```bash
  aws s3 sync s3://nigredo-frontend-prod-xxxxx/ ./backup/
  ```

**Infrastructure Backups**:
- **CDK Code**: Version controlled in Git
- **CloudFormation Templates**: Stored in S3 by CDK

### Recovery Procedures

**Restore Database**:
```bash
# List available snapshots
aws rds describe-db-cluster-snapshots \
  --db-cluster-identifier fibonacci-prod

# Restore from snapshot
aws rds restore-db-cluster-from-snapshot \
  --db-cluster-identifier fibonacci-prod-restored \
  --snapshot-identifier fibonacci-prod-snapshot-20240115 \
  --engine aurora-postgresql
```

**Restore Frontend**:
```bash
# List S3 object versions
aws s3api list-object-versions \
  --bucket nigredo-frontend-prod-xxxxx \
  --prefix index.html

# Restore specific version
aws s3api copy-object \
  --bucket nigredo-frontend-prod-xxxxx \
  --copy-source nigredo-frontend-prod-xxxxx/index.html?versionId=VERSION_ID \
  --key index.html

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id EXXXXXXXXXXXXX \
  --paths "/*"
```

**Restore Infrastructure**:
```bash
# Rollback CDK stack
cdk deploy NigredoApiStack-prod --rollback

# Or restore from CloudFormation template
aws cloudformation create-stack \
  --stack-name NigredoApiStack-prod \
  --template-body file://backup/template.json
```

### Business Continuity

**RTO (Recovery Time Objective)**: 1 hour
**RPO (Recovery Point Objective)**: 5 minutes

**Failover Procedures**:
1. Detect outage (automated alarms)
2. Assess impact and severity
3. Notify stakeholders
4. Execute recovery procedures
5. Verify system functionality
6. Update status page
7. Conduct post-mortem

---

## Escalation Procedures

### On-Call Rotation

**Primary On-Call**: DevOps Engineer (24/7)
**Secondary On-Call**: Senior DevOps Engineer (backup)
**Escalation**: Engineering Manager

### Escalation Matrix

| Severity | Initial Response | Escalation (30 min) | Escalation (1 hour) |
|----------|------------------|---------------------|---------------------|
| P0 | On-Call Engineer | Senior Engineer | Engineering Manager |
| P1 | On-Call Engineer | Senior Engineer | Engineering Manager |
| P2 | On-Call Engineer | Senior Engineer | - |
| P3 | DevOps Team | - | - |

### Contact Information

- **On-Call Phone**: +55 11 99999-9999
- **Slack**: #nigredo-incidents
- **Email**: incidents@alquimista.ai
- **PagerDuty**: https://alquimista.pagerduty.com

---

## Appendix

### Useful Commands

**Check System Health**:
```bash
# API health check
curl https://api.alquimista.ai/health

# Database health check
psql -h <DB_ENDPOINT> -U admin -d fibonacci -c "SELECT 1;"

# Lambda function status
aws lambda get-function --function-name nigredo-create-lead-prod
```

**View Logs**:
```bash
# Tail Lambda logs
aws logs tail /aws/lambda/nigredo-create-lead-prod --follow

# Filter logs by error
aws logs filter-log-events \
  --log-group-name /aws/lambda/nigredo-create-lead-prod \
  --filter-pattern "ERROR"
```

**Metrics**:
```bash
# Get Lambda invocation count
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=nigredo-create-lead-prod \
  --start-time 2024-01-15T00:00:00Z \
  --end-time 2024-01-15T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

### Related Documentation

- **API Documentation**: [docs/nigredo/API.md](./API.md)
- **Deployment Guide**: [docs/nigredo/DEPLOYMENT.md](./DEPLOYMENT.md)
- **Architecture Design**: [.kiro/specs/nigredo-prospecting-core/design.md](../../.kiro/specs/nigredo-prospecting-core/design.md)

---

## Changelog

### Version 1.0.0 (2024-01-15)

- Initial operations runbook
- Monitoring and alerting procedures
- Incident response playbooks
- Common issues and solutions
- Maintenance procedures
- Performance optimization guidelines
- Security operations
- Disaster recovery procedures
