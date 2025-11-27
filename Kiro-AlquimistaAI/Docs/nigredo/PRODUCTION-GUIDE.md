# Nigredo Production Guide

## Overview

This guide provides all necessary information for operating the Nigredo Prospecting Core system in production.

**Last Updated:** 2024-01-15  
**Environment:** Production  
**Status:** Deployed

## Production URLs

### API Endpoints

**Base URL:** `https://api.alquimista.ai/nigredo` (Update after deployment)

**Public Endpoints:**
- `POST /api/leads` - Create new lead (no auth required)
- `GET /health` - Health check endpoint

**Protected Endpoints (Requires JWT):**
- `GET /api/leads` - List leads with pagination
- `GET /api/leads/{id}` - Get lead details

### Frontend

**Landing Page:** `https://nigredo.alquimista.ai` (Update after deployment)

**CloudFront Distribution ID:** (Update after deployment)

## Architecture Overview

```
Internet → CloudFront → S3 (Frontend)
                     ↓
Internet → WAF → API Gateway → Lambda → Aurora PostgreSQL
                                      ↓
                                   Fibonacci (Webhook)
```

## Access Instructions

### AWS Console Access

**Account ID:** (Your AWS Account ID)  
**Region:** us-east-1 (N. Virginia)

**Required IAM Permissions:**
- CloudWatch Logs: Read access
- CloudWatch Metrics: Read access
- Lambda: Read access
- API Gateway: Read access
- RDS: Read access (for database queries)

### Database Access

**Connection Method:** Via AWS Secrets Manager

**Secret ARN:** (Retrieved from Fibonacci stack outputs)

**Schema:** `nigredo`

**Tables:**
- `nigredo.leads` - Lead records
- `nigredo.form_submissions` - Submission tracking
- `nigredo.webhook_logs` - Webhook delivery logs
- `nigredo.rate_limits` - Rate limiting data

**Connection Example:**
```bash
# Get database credentials
aws secretsmanager get-secret-value --secret-id <SECRET_ARN>

# Connect via psql (from bastion host or VPN)
psql -h <DB_HOST> -U <DB_USER> -d <DB_NAME>
```

### API Authentication

**Method:** AWS Cognito JWT tokens

**User Pool ID:** (Retrieved from Fibonacci stack)

**Client ID:** (Retrieved from Fibonacci stack)

**Token Endpoint:**
```
POST https://cognito-idp.us-east-1.amazonaws.com/
```

**Example API Call with Auth:**
```bash
# Get JWT token (via Cognito authentication)
TOKEN="<your-jwt-token>"

# List leads
curl -H "Authorization: Bearer $TOKEN" \
  https://api.alquimista.ai/nigredo/api/leads
```

## Monitoring & Observability

### CloudWatch Dashboards

**Nigredo Core Dashboard:**
- URL: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=Nigredo-Core-prod
- Metrics: Lead submissions, API latency, error rates

**Nigredo Agents Dashboard:**
- URL: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=Nigredo-Agents-prod
- Metrics: Webhook success rate, agent performance

### Key Metrics

**Lead Submissions:**
- Metric: `NigredoLeadSubmissions`
- Namespace: `Nigredo/API`
- Expected: Varies by traffic

**API Latency:**
- Metric: `ApiLatency`
- Namespace: `Nigredo/API`
- Target: < 1000ms (p99)

**Webhook Success Rate:**
- Metric: `NigredoWebhookSuccess`
- Namespace: `Nigredo/Webhooks`
- Target: > 90%

**Error Rate:**
- Metric: `ApiErrors`
- Namespace: `Nigredo/API`
- Target: < 5%

### CloudWatch Alarms

**Critical Alarms:**
1. **High Error Rate**
   - Condition: Error rate > 5% for 5 minutes
   - Action: SNS notification to on-call

2. **High Latency**
   - Condition: P99 latency > 1000ms for 5 minutes
   - Action: SNS notification to on-call

3. **Webhook Failures**
   - Condition: Failure rate > 10% for 5 minutes
   - Action: SNS notification to on-call

**Warning Alarms:**
1. **Elevated Latency**
   - Condition: P95 latency > 500ms for 10 minutes
   - Action: SNS notification to team

### Log Groups

**Lambda Functions:**
- `/aws/lambda/NigredoStack-prod-CreateLead`
- `/aws/lambda/NigredoStack-prod-ListLeads`
- `/aws/lambda/NigredoStack-prod-GetLead`

**Log Insights Queries:**

**Top Lead Sources:**
```
fields @timestamp, source, count(*) as submissions
| filter @message like /Lead created/
| stats count() by source
| sort submissions desc
```

**Error Analysis:**
```
fields @timestamp, @message, error
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100
```

**Webhook Failures:**
```
fields @timestamp, lead_id, error_message
| filter @message like /Webhook failed/
| sort @timestamp desc
```

### X-Ray Tracing

**Service Map:** https://console.aws.amazon.com/xray/home?region=us-east-1#/service-map

**Trace Analysis:**
- View end-to-end request flow
- Identify bottlenecks
- Debug integration issues

## Operational Procedures

### Daily Operations

**Morning Checklist:**
1. Check CloudWatch dashboards for anomalies
2. Review alarm status (should be green)
3. Check error logs for any issues
4. Verify webhook success rate > 90%

**Weekly Tasks:**
1. Review performance trends
2. Analyze lead sources and conversion
3. Check database growth and optimize if needed
4. Review and update documentation

### Common Tasks

#### View Recent Leads

```sql
SELECT 
  id,
  name,
  email,
  company,
  source,
  created_at
FROM nigredo.leads
ORDER BY created_at DESC
LIMIT 20;
```

#### Check Webhook Status

```sql
SELECT 
  l.id,
  l.email,
  wl.success,
  wl.attempt_number,
  wl.sent_at,
  wl.error_message
FROM nigredo.leads l
LEFT JOIN nigredo.webhook_logs wl ON l.id = wl.lead_id
WHERE l.created_at > NOW() - INTERVAL '24 hours'
ORDER BY l.created_at DESC;
```

#### Monitor Rate Limiting

```sql
SELECT 
  ip_address,
  submission_count,
  window_start
FROM nigredo.rate_limits
WHERE window_start > NOW() - INTERVAL '1 hour'
ORDER BY submission_count DESC;
```

#### Invalidate CloudFront Cache

```bash
aws cloudfront create-invalidation \
  --distribution-id <DISTRIBUTION_ID> \
  --paths "/*"
```

### Incident Response

**Severity Levels:**

**P1 - Critical (Response: Immediate)**
- System completely down
- Data loss or corruption
- Security breach

**P2 - High (Response: < 1 hour)**
- Partial system outage
- High error rate (> 10%)
- Webhook failures (> 25%)

**P3 - Medium (Response: < 4 hours)**
- Performance degradation
- Non-critical feature broken
- Elevated error rate (5-10%)

**P4 - Low (Response: Next business day)**
- Minor bugs
- Documentation issues
- Enhancement requests

**Incident Response Steps:**

1. **Acknowledge**
   - Confirm incident in monitoring system
   - Notify team via incident channel

2. **Assess**
   - Check CloudWatch dashboards
   - Review recent deployments
   - Identify affected components

3. **Mitigate**
   - Apply immediate fixes if possible
   - Consider rollback if recent deployment
   - Implement workarounds

4. **Resolve**
   - Deploy permanent fix
   - Verify system health
   - Update documentation

5. **Post-Mortem**
   - Document incident timeline
   - Identify root cause
   - Create action items to prevent recurrence

### Rollback Procedure

**When to Rollback:**
- Critical bugs in production
- Performance degradation
- Security vulnerabilities
- Data integrity issues

**Rollback Steps:**

1. **Notify Stakeholders**
   ```
   Incident: Production rollback initiated
   Reason: [Brief description]
   ETA: 15 minutes
   ```

2. **Stop New Traffic** (if needed)
   - Update WAF rules to block traffic
   - Or update DNS to maintenance page

3. **Rollback Backend**
   ```powershell
   cdk destroy NigredoStack-prod --force
   # Deploy previous version
   git checkout <previous-commit>
   cdk deploy NigredoStack-prod
   ```

4. **Rollback Frontend**
   ```powershell
   cdk destroy NigredoFrontendStack-prod --force
   # Deploy previous version
   git checkout <previous-commit>
   cdk deploy NigredoFrontendStack-prod
   ```

5. **Restore Database** (if needed)
   ```bash
   aws rds restore-db-cluster-from-snapshot \
     --db-cluster-identifier <CLUSTER_ID> \
     --snapshot-identifier <SNAPSHOT_ID>
   ```

6. **Verify System**
   - Run validation script
   - Check all critical functionality
   - Monitor for 30 minutes

7. **Update Status**
   - Notify stakeholders of completion
   - Update status page
   - Document rollback reason

## Maintenance Windows

**Scheduled Maintenance:**
- Day: Sunday
- Time: 02:00 - 04:00 UTC
- Frequency: Monthly (first Sunday)

**Maintenance Activities:**
- Database optimization
- Security patches
- Infrastructure updates
- Performance tuning

**Notification:**
- 7 days advance notice
- Status page update
- Email to stakeholders

## Security

### Data Protection

**Encryption at Rest:**
- Aurora: KMS encryption enabled
- S3: KMS encryption enabled
- Secrets: AWS Secrets Manager

**Encryption in Transit:**
- TLS 1.2+ for all connections
- Certificate: AWS Certificate Manager

**Data Retention:**
- Leads: Indefinite (until user requests deletion)
- Logs: 30 days
- Metrics: 15 months
- Backups: 7 days

### Access Control

**Principle of Least Privilege:**
- Lambda: Only necessary AWS service permissions
- Database: Schema-level isolation
- API: JWT-based authentication

**Audit Logging:**
- CloudTrail: All API calls logged
- Database: Audit triggers on sensitive tables
- Application: Structured logging with user context

### Compliance

**LGPD (Brazilian Data Protection Law):**
- User consent tracking
- Right to deletion (esquecimento)
- Data portability
- Privacy policy

**Security Best Practices:**
- Regular security scans
- Dependency updates
- Penetration testing (quarterly)
- Security training for team

## Performance Optimization

### Current Performance

**API Latency:**
- P50: ~200ms
- P95: ~500ms
- P99: ~800ms

**Frontend Load Time:**
- First Contentful Paint: ~1.2s
- Time to Interactive: ~2.5s
- Lighthouse Score: 92

### Optimization Strategies

**Backend:**
- Connection pooling for database
- Lambda provisioned concurrency for critical functions
- Caching for read-heavy endpoints

**Frontend:**
- CloudFront edge caching
- Image optimization
- Code splitting
- Lazy loading

**Database:**
- Proper indexing on query columns
- Query optimization
- Connection pooling
- Read replicas (future)

## Cost Management

**Monthly Cost Estimate:**
- Lambda: $10-50 (based on traffic)
- API Gateway: $5-20
- Aurora: $100-200 (shared with Fibonacci)
- CloudFront: $5-30
- S3: $1-5
- **Total: ~$120-300/month**

**Cost Optimization:**
- Use Lambda reserved concurrency wisely
- Optimize CloudFront cache hit ratio
- Clean up old logs and metrics
- Right-size database instances

## Disaster Recovery

**Backup Strategy:**
- Database: Automated daily snapshots (7-day retention)
- Infrastructure: CDK code in Git
- Configuration: AWS Secrets Manager

**Recovery Time Objective (RTO):** 1 hour  
**Recovery Point Objective (RPO):** 24 hours

**DR Procedure:**
1. Restore database from latest snapshot
2. Deploy infrastructure from CDK
3. Restore secrets from Secrets Manager
4. Run validation tests
5. Update DNS if needed

## Support Contacts

**On-Call Engineer:**
- Primary: [Name] - [Phone] - [Email]
- Secondary: [Name] - [Phone] - [Email]

**Escalation:**
- Technical Lead: [Name] - [Email]
- DevOps Lead: [Name] - [Email]
- Product Owner: [Name] - [Email]

**External Support:**
- AWS Support: Premium Support Plan
- Security Incidents: security@alquimista.ai

## Additional Resources

**Documentation:**
- API Documentation: [docs/nigredo/API.md](./API.md)
- Deployment Guide: [docs/nigredo/DEPLOYMENT.md](./DEPLOYMENT.md)
- Operations Runbook: [docs/nigredo/OPERATIONS.md](./OPERATIONS.md)
- Integration Testing: [docs/nigredo/INTEGRATION-TESTING.md](./INTEGRATION-TESTING.md)

**Monitoring:**
- CloudWatch Dashboards: [AWS Console](https://console.aws.amazon.com/cloudwatch/)
- X-Ray Service Map: [AWS Console](https://console.aws.amazon.com/xray/)
- CloudTrail: [AWS Console](https://console.aws.amazon.com/cloudtrail/)

**Code Repository:**
- GitHub: https://github.com/alquimista-ai/alquimista-aws-architecture
- Branch: main
- CI/CD: GitHub Actions

---

**Document Version:** 1.0  
**Maintained By:** DevOps Team  
**Review Frequency:** Monthly
