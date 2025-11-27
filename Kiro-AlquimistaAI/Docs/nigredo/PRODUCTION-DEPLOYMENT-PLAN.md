# Nigredo Production Deployment Plan

## Overview

This document outlines the production deployment plan for the Nigredo Prospecting Core system. All development and integration testing has been completed successfully.

## Pre-Deployment Checklist

### 1. Tests Status ✓

**Completed:**
- ✓ Database schema migrations tested
- ✓ Lambda functions implemented and validated
- ✓ API endpoints tested (Create, List, Get Lead)
- ✓ Frontend landing page and form implemented
- ✓ Webhook integration with Fibonacci tested
- ✓ Rate limiting validated
- ✓ Security features tested (XSS, SQL injection prevention)
- ✓ Monitoring and observability configured
- ✓ End-to-end integration tests passed

**Optional (Skipped per spec):**
- Unit tests marked as optional
- Component tests marked as optional

### 2. Security Checklist ✓

**Authentication & Authorization:**
- ✓ Cognito JWT validation for protected endpoints
- ✓ Public endpoint (POST /api/leads) properly exposed
- ✓ Protected endpoints (GET /api/leads, GET /api/leads/{id}) secured

**Data Protection:**
- ✓ KMS encryption for Aurora database
- ✓ KMS encryption for S3 buckets
- ✓ TLS 1.2+ for all data in transit
- ✓ Secrets Manager for database credentials

**Input Validation:**
- ✓ Zod schema validation on all inputs
- ✓ XSS prevention with input sanitization
- ✓ SQL injection prevention with parameterized queries
- ✓ Rate limiting (10 submissions/hour per IP)

**WAF Configuration:**
- ✓ Rate limiting rules (2000 req/5min)
- ✓ AWS Managed Rules for SQL injection
- ✓ AWS Managed Rules for XSS
- ✓ Bot protection enabled

**Network Security:**
- ✓ Lambdas in private subnets
- ✓ Security groups configured
- ✓ VPC endpoints for AWS services
- ✓ CloudFront with Origin Access Identity

### 3. Infrastructure Readiness ✓

**Backend (Nigredo API Stack):**
- ✓ Lambda functions: create-lead, list-leads, get-lead
- ✓ API Gateway HTTP API configured
- ✓ Database schema `nigredo` created
- ✓ CloudWatch Log Groups configured
- ✓ X-Ray tracing enabled
- ✓ IAM roles and policies defined

**Frontend (Nigredo Frontend Stack):**
- ✓ S3 bucket for static hosting
- ✓ CloudFront distribution configured
- ✓ WAF Web ACL attached
- ✓ Cache policies optimized
- ✓ Compression enabled (gzip, brotli)

**Integration:**
- ✓ Fibonacci webhook endpoint implemented
- ✓ Webhook retry logic with exponential backoff
- ✓ Event flow validated end-to-end

### 4. Monitoring & Observability ✓

**CloudWatch Dashboards:**
- ✓ Nigredo Core Dashboard (lead submissions, API metrics)
- ✓ Nigredo Agents Dashboard (webhook success rate)
- ✓ Business Metrics Dashboard

**CloudWatch Alarms:**
- ✓ Critical: API error rate > 5%
- ✓ Critical: API latency > 1000ms (p99)
- ✓ Critical: Webhook failure rate > 10%
- ✓ Warning: API latency > 500ms (p95)
- ✓ SNS notifications configured

**Logging & Tracing:**
- ✓ Structured logging with correlation IDs
- ✓ X-Ray distributed tracing
- ✓ CloudWatch Insights queries defined

### 5. Documentation ✓

**Technical Documentation:**
- ✓ API Documentation (docs/nigredo/API.md)
- ✓ Deployment Guide (docs/nigredo/DEPLOYMENT.md)
- ✓ Operations Runbook (docs/nigredo/OPERATIONS.md)
- ✓ Integration Testing Guide (docs/nigredo/INTEGRATION-TESTING.md)

**Deployment Scripts:**
- ✓ Backend deployment (scripts/deploy-nigredo-backend.ps1)
- ✓ Frontend deployment (scripts/deploy-nigredo-frontend.ps1)
- ✓ Full deployment (scripts/deploy-nigredo-full.ps1)
- ✓ Verification script (scripts/verify-nigredo-deployment.ps1)

## Deployment Strategy

### Environment Configuration

**Production Environment Variables:**
```
ENV_NAME=prod
AWS_REGION=us-east-1
DB_SECRET_ARN=<from-fibonacci-stack>
FIBONACCI_WEBHOOK_URL=<from-fibonacci-stack>
RATE_LIMIT_WINDOW=3600
RATE_LIMIT_MAX=10
LOG_LEVEL=INFO
```

### Deployment Steps

#### Phase 1: Backend Deployment (30 minutes)
1. Run database migrations
2. Deploy Nigredo API Stack with CDK
3. Verify Lambda functions deployed
4. Test API endpoints with health checks
5. Verify CloudWatch logs appearing

#### Phase 2: Frontend Deployment (20 minutes)
1. Build Next.js application for production
2. Upload build artifacts to S3
3. Invalidate CloudFront cache
4. Verify CloudFront distribution serving content
5. Test landing page accessibility

#### Phase 3: Integration Validation (20 minutes)
1. Submit test lead through frontend form
2. Verify lead stored in database
3. Verify webhook sent to Fibonacci
4. Verify Fibonacci received and processed event
5. Check CloudWatch metrics and logs

#### Phase 4: Monitoring Setup (10 minutes)
1. Verify CloudWatch dashboards displaying data
2. Test alarm triggers with simulated errors
3. Verify SNS notifications working
4. Review X-Ray traces

**Total Estimated Time:** 80 minutes

### Rollback Plan

**Automated Rollback Triggers:**
- API error rate > 10% for 5 minutes
- API latency > 2000ms (p99) for 5 minutes
- Webhook failure rate > 25% for 5 minutes

**Manual Rollback Procedure:**
1. Run: `cdk destroy NigredoApiStack-prod --force`
2. Run: `cdk destroy NigredoFrontendStack-prod --force`
3. Restore database schema if needed
4. Notify stakeholders of rollback

**Rollback Time:** < 15 minutes

## Risk Assessment

### High Risk Items
None identified - all critical functionality tested

### Medium Risk Items
1. **High traffic spikes** - Mitigated by rate limiting and auto-scaling
2. **Webhook failures** - Mitigated by retry logic and DLQ
3. **Database connection limits** - Mitigated by connection pooling

### Low Risk Items
1. **CloudFront cache issues** - Easy to invalidate
2. **Minor UI bugs** - Can be fixed with frontend-only deployment

## Success Criteria

### Functional Requirements
- [ ] Form submission creates lead in database
- [ ] Webhook successfully delivers to Fibonacci
- [ ] Protected endpoints require authentication
- [ ] Rate limiting blocks excessive submissions
- [ ] Error messages display correctly

### Performance Requirements
- [ ] API latency < 1000ms (p99)
- [ ] Frontend load time < 3 seconds
- [ ] CloudFront cache hit ratio > 80%
- [ ] Lighthouse performance score > 90

### Security Requirements
- [ ] All data encrypted at rest and in transit
- [ ] WAF blocking malicious requests
- [ ] No sensitive data in logs
- [ ] CORS policies enforced

### Observability Requirements
- [ ] CloudWatch metrics being emitted
- [ ] X-Ray traces appearing
- [ ] Alarms configured and tested
- [ ] Dashboards displaying real-time data

## Stakeholder Approval

**Required Approvals:**
- [ ] Technical Lead - Infrastructure review
- [ ] Security Team - Security checklist review
- [ ] Product Owner - Feature acceptance
- [ ] DevOps Lead - Deployment plan review

**Approval Date:** _________________

**Deployment Window:** _________________

**Approved By:**
- Technical Lead: _________________
- Security Team: _________________
- Product Owner: _________________
- DevOps Lead: _________________

## Post-Deployment Actions

1. Monitor system for 24 hours
2. Review CloudWatch metrics and alarms
3. Collect user feedback on landing page
4. Document any issues encountered
5. Schedule post-mortem meeting

## Emergency Contacts

**On-Call Engineer:** _________________
**DevOps Lead:** _________________
**Technical Lead:** _________________

## Notes

- All testing completed successfully in dev environment
- Integration with Fibonacci validated end-to-end
- Monitoring and alerting fully configured
- Documentation complete and up-to-date
- Deployment scripts tested and verified

---

**Document Version:** 1.0
**Last Updated:** 2024-01-15
**Status:** Ready for Production Deployment
