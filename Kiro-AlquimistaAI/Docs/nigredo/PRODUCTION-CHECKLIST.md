# Nigredo Production Deployment Checklist

## Pre-Deployment Verification

### Code Quality
- [x] All code reviewed and approved
- [x] No critical security vulnerabilities
- [x] All linting rules passing
- [x] TypeScript compilation successful
- [x] Dependencies up to date

### Testing
- [x] Integration tests passed
- [x] End-to-end flow validated
- [x] Security testing completed
- [x] Performance testing completed
- [x] Rate limiting tested

### Infrastructure
- [x] CDK stacks synthesize without errors
- [x] All resources properly tagged
- [x] IAM roles follow least privilege
- [x] Encryption enabled for all data stores
- [x] VPC and security groups configured

### Configuration
- [x] Environment variables documented
- [x] Secrets stored in Secrets Manager
- [x] API endpoints configured
- [x] CORS policies defined
- [x] Rate limits configured

### Monitoring
- [x] CloudWatch dashboards created
- [x] CloudWatch alarms configured
- [x] SNS notifications set up
- [x] X-Ray tracing enabled
- [x] Structured logging implemented

### Documentation
- [x] API documentation complete
- [x] Deployment guide written
- [x] Operations runbook created
- [x] Troubleshooting guide available
- [x] Architecture diagrams updated

## Deployment Day Checklist

### T-60 Minutes: Final Preparation
- [ ] Verify AWS credentials configured
- [ ] Confirm deployment window with stakeholders
- [ ] Review rollback procedures
- [ ] Ensure on-call engineer available
- [ ] Open incident channel (Slack/Teams)

### T-30 Minutes: Pre-Deployment
- [ ] Run pre-deployment verification script
- [ ] Backup current database state
- [ ] Take snapshot of current infrastructure
- [ ] Notify stakeholders deployment starting
- [ ] Set status page to "Maintenance"

### T-0: Backend Deployment
- [ ] Run database migrations
  ```powershell
  npm run migrate:prod
  ```
- [ ] Deploy Nigredo API Stack
  ```powershell
  .\scripts\deploy-nigredo-backend.ps1 -Environment prod
  ```
- [ ] Verify Lambda functions deployed
- [ ] Test API health endpoint
- [ ] Check CloudWatch logs for errors

### T+15: Frontend Deployment
- [ ] Build Next.js application
  ```powershell
  cd frontend
  npm run build
  ```
- [ ] Deploy Nigredo Frontend Stack
  ```powershell
  .\scripts\deploy-nigredo-frontend.ps1 -Environment prod
  ```
- [ ] Verify S3 upload successful
- [ ] Invalidate CloudFront cache
- [ ] Test landing page loads

### T+30: Integration Testing
- [ ] Submit test lead through form
- [ ] Verify lead in database
  ```sql
  SELECT * FROM nigredo.leads ORDER BY created_at DESC LIMIT 1;
  ```
- [ ] Verify webhook sent to Fibonacci
- [ ] Check webhook logs
  ```sql
  SELECT * FROM nigredo.webhook_logs ORDER BY sent_at DESC LIMIT 5;
  ```
- [ ] Verify Fibonacci received event

### T+45: Monitoring Validation
- [ ] Open CloudWatch dashboards
- [ ] Verify metrics being emitted
- [ ] Check X-Ray traces appearing
- [ ] Test alarm triggers (optional)
- [ ] Verify SNS notifications working

### T+60: Smoke Tests
- [ ] Test form submission (happy path)
- [ ] Test form validation (error cases)
- [ ] Test rate limiting (11 submissions)
- [ ] Test protected endpoints with auth
- [ ] Test protected endpoints without auth

### T+75: Performance Validation
- [ ] Check API latency metrics
- [ ] Verify CloudFront cache hit ratio
- [ ] Test page load times
- [ ] Run Lighthouse audit
- [ ] Check Lambda cold start times

### T+90: Security Validation
- [ ] Verify WAF blocking malicious requests
- [ ] Test XSS prevention
- [ ] Test SQL injection prevention
- [ ] Verify CORS policies
- [ ] Check encryption at rest

## Post-Deployment Checklist

### Immediate (T+2 Hours)
- [ ] Monitor CloudWatch dashboards
- [ ] Review error logs
- [ ] Check alarm status
- [ ] Verify no critical issues
- [ ] Update status page to "Operational"

### Short-Term (T+24 Hours)
- [ ] Review all CloudWatch metrics
- [ ] Analyze X-Ray traces
- [ ] Check webhook success rate
- [ ] Review user feedback
- [ ] Document any issues

### Medium-Term (T+1 Week)
- [ ] Analyze usage patterns
- [ ] Review performance metrics
- [ ] Optimize based on data
- [ ] Update documentation
- [ ] Schedule post-mortem

## Rollback Checklist

### If Rollback Required
- [ ] Notify stakeholders immediately
- [ ] Stop accepting new traffic
- [ ] Run rollback script
  ```powershell
  cdk destroy NigredoApiStack-prod --force
  cdk destroy NigredoFrontendStack-prod --force
  ```
- [ ] Restore database if needed
- [ ] Verify old system operational
- [ ] Update status page
- [ ] Document rollback reason
- [ ] Schedule incident review

## Success Criteria

### Must Pass
- [ ] Form submission works end-to-end
- [ ] Webhook delivers to Fibonacci
- [ ] Authentication working on protected endpoints
- [ ] Rate limiting blocks excessive requests
- [ ] No critical errors in logs

### Should Pass
- [ ] API latency < 1000ms (p99)
- [ ] Frontend load time < 3 seconds
- [ ] CloudFront cache hit ratio > 80%
- [ ] Lighthouse score > 90
- [ ] Zero security vulnerabilities

### Nice to Have
- [ ] API latency < 500ms (p95)
- [ ] Frontend load time < 2 seconds
- [ ] CloudFront cache hit ratio > 90%
- [ ] Lighthouse score > 95

## Sign-Off

**Deployment Completed By:** _________________

**Date/Time:** _________________

**Deployment Status:** [ ] Success [ ] Partial [ ] Rolled Back

**Issues Encountered:** _________________

**Next Steps:** _________________

---

**Checklist Version:** 1.0
**Last Updated:** 2024-01-15
