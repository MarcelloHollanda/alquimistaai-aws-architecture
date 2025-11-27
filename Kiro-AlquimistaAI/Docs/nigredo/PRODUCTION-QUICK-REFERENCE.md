# Nigredo Production - Quick Reference

## 🚀 Quick Links

| Resource | URL |
|----------|-----|
| Landing Page | https://nigredo.alquimista.ai |
| API Base URL | https://api.alquimista.ai/nigredo |
| CloudWatch Dashboard | [Nigredo Core Dashboard](https://console.aws.amazon.com/cloudwatch/) |
| X-Ray Traces | [Service Map](https://console.aws.amazon.com/xray/) |
| GitHub Repo | https://github.com/alquimista-ai/alquimista-aws-architecture |

## 📊 Key Metrics

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| API Latency (P99) | < 1000ms | > 2000ms |
| Error Rate | < 5% | > 10% |
| Webhook Success | > 90% | < 75% |
| Frontend Load Time | < 3s | > 5s |

## 🔧 Common Commands

### Deployment

```powershell
# Full production deployment
.\scripts\deploy-nigredo-production.ps1

# Backend only
.\scripts\deploy-nigredo-backend.ps1 -Environment prod

# Frontend only
.\scripts\deploy-nigredo-frontend.ps1 -Environment prod

# Validation
.\scripts\validate-nigredo-production.ps1
```

### Monitoring

```bash
# View recent logs
aws logs tail /aws/lambda/NigredoStack-prod-CreateLead --follow

# Check alarm status
aws cloudwatch describe-alarms --alarm-name-prefix "Nigredo-prod"

# View metrics
aws cloudwatch get-metric-statistics \
  --namespace Nigredo/API \
  --metric-name NigredoLeadSubmissions \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

### Database Queries

```sql
-- Recent leads
SELECT * FROM nigredo.leads ORDER BY created_at DESC LIMIT 10;

-- Webhook status
SELECT success, COUNT(*) FROM nigredo.webhook_logs 
WHERE sent_at > NOW() - INTERVAL '1 hour' 
GROUP BY success;

-- Rate limiting
SELECT ip_address, submission_count FROM nigredo.rate_limits 
WHERE window_start > NOW() - INTERVAL '1 hour' 
ORDER BY submission_count DESC;
```

### CloudFront

```bash
# Invalidate cache
aws cloudfront create-invalidation \
  --distribution-id <DISTRIBUTION_ID> \
  --paths "/*"

# Check distribution status
aws cloudfront get-distribution --id <DISTRIBUTION_ID>
```

## 🚨 Incident Response

### P1 - Critical (Immediate)
1. Check CloudWatch dashboards
2. Review recent deployments
3. Consider immediate rollback
4. Notify team in incident channel

### P2 - High (< 1 hour)
1. Assess impact and scope
2. Review error logs
3. Implement mitigation
4. Monitor closely

### Quick Rollback
```powershell
# Rollback both stacks
cdk destroy NigredoStack-prod --force
cdk destroy NigredoFrontendStack-prod --force

# Deploy previous version
git checkout <previous-commit>
cdk deploy NigredoStack-prod
cdk deploy NigredoFrontendStack-prod
```

## 📞 Contacts

| Role | Contact |
|------|---------|
| On-Call Engineer | [Phone] |
| Technical Lead | [Email] |
| DevOps Lead | [Email] |
| AWS Support | Premium Support |

## 🔐 Access

### AWS Console
- Account: [AWS Account ID]
- Region: us-east-1
- Role: NigredoOperator

### Database
- Secret ARN: (From Fibonacci stack)
- Schema: `nigredo`
- Access: Via Secrets Manager

### API Authentication
- Method: Cognito JWT
- User Pool: (From Fibonacci stack)

## 📈 Health Check

```bash
# API health
curl https://api.alquimista.ai/nigredo/health

# Frontend health
curl -I https://nigredo.alquimista.ai

# Test lead creation
curl -X POST https://api.alquimista.ai/nigredo/api/leads \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"Test message"}'
```

## 🛠️ Troubleshooting

### High Error Rate
1. Check Lambda logs for errors
2. Verify database connectivity
3. Check Fibonacci webhook endpoint
4. Review recent code changes

### High Latency
1. Check database query performance
2. Review Lambda cold starts
3. Check CloudFront cache hit ratio
4. Verify network connectivity

### Webhook Failures
1. Check Fibonacci endpoint status
2. Review webhook logs in database
3. Verify network connectivity
4. Check retry logic

### Rate Limiting Issues
1. Query rate_limits table
2. Check for bot traffic
3. Review WAF logs
4. Adjust limits if needed

## 📝 Maintenance

### Weekly Tasks
- [ ] Review CloudWatch dashboards
- [ ] Check alarm history
- [ ] Review error logs
- [ ] Analyze performance trends

### Monthly Tasks
- [ ] Database optimization
- [ ] Security patches
- [ ] Cost review
- [ ] Documentation updates

## 🔄 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Security review complete
- [ ] Stakeholder approval
- [ ] Backup created

### Deployment
- [ ] Run deployment script
- [ ] Monitor progress
- [ ] Verify health checks
- [ ] Test critical paths

### Post-Deployment
- [ ] Run validation script
- [ ] Monitor for 1 hour
- [ ] Update documentation
- [ ] Notify stakeholders

---

**Last Updated:** 2024-01-15  
**Version:** 1.0
