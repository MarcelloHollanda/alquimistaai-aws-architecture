# Marketplace API Deployment Checklist

## Pre-Deployment

### 1. Database Schema
Ensure the following tables exist in the `alquimista_platform` schema:

- [ ] `agents` table with columns: id, name, description, category, version, status, pricing, created_at, updated_at
- [ ] `agent_activations` table with columns: id, agent_id, tenant_id, status, activated_by, activated_at, deactivated_by, deactivated_at, deactivation_reason, permissions, created_at, updated_at
- [ ] `audit_logs` table with columns: id, tenant_id, user_id, action_type, resource_type, resource_id, details, created_at

**Migration Script:** Run `database/migrations/003_create_platform_tables.sql`

### 2. Seed Data
Populate the agents catalog with initial agents:

- [ ] Agente de Recebimento (Vendas)
- [ ] Agente de Estratégia (Vendas)
- [ ] Agente de Disparo (Vendas)
- [ ] Agente de Atendimento (Vendas)
- [ ] Agente de Análise de Sentimento (Pesquisa)
- [ ] Agente de Agendamento (Agenda)
- [ ] Agente de Relatórios (Pesquisa)

**Seed Script:** Run `database/seeds/initial_data.sql`

### 3. Environment Variables
Verify the following environment variables are set in the Lambda functions:

- [ ] `POWERTOOLS_SERVICE_NAME=alquimista-platform`
- [ ] `EVENT_BUS_NAME=fibonacci-bus`
- [ ] `DB_SECRET_ARN=arn:aws:secretsmanager:...`
- [ ] `USER_POOL_ID=us-east-1_...`
- [ ] `NODE_OPTIONS=--enable-source-maps`

### 4. IAM Permissions
Verify Lambda execution roles have the following permissions:

- [ ] `secretsmanager:GetSecretValue` on DB secret
- [ ] `events:PutEvents` on EventBridge bus
- [ ] VPC access permissions (if using VPC)
- [ ] CloudWatch Logs permissions
- [ ] X-Ray tracing permissions

### 5. Cognito Configuration
Ensure Cognito User Pool has custom attributes:

- [ ] `custom:tenant_id` (String, mutable: false)
- [ ] `custom:user_role` (String, mutable: true)
- [ ] `custom:company_name` (String, mutable: true)

### 6. Code Quality
- [ ] Run `npm run build` - No TypeScript errors
- [ ] Run `npm run lint` - No linting errors
- [ ] Run `npm run test` - All tests pass (if tests exist)
- [ ] Review code for TODO comments

## Deployment Steps

### 1. Build and Synthesize
```bash
npm run build
npm run synth
```

- [ ] Build completes successfully
- [ ] CDK synth generates CloudFormation template
- [ ] Review synthesized template for correctness

### 2. Review Changes
```bash
npm run diff
```

- [ ] Review all infrastructure changes
- [ ] Verify no unexpected deletions
- [ ] Confirm new resources are correct

### 3. Deploy to Development
```bash
npm run deploy:dev
```

- [ ] Deployment completes successfully
- [ ] Note CloudFormation outputs (API URL, Lambda ARNs)
- [ ] Verify stack status is `CREATE_COMPLETE` or `UPDATE_COMPLETE`

### 4. Run Database Migrations
```bash
npm run db:migrate
npm run db:seed
```

- [ ] Migrations execute successfully
- [ ] Seed data is inserted
- [ ] Verify data in database

### 5. Smoke Tests
Test each endpoint manually:

#### List Agents
```bash
curl -X GET "https://YOUR_API_URL/api/agents" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
- [ ] Returns 200 OK
- [ ] Returns list of agents
- [ ] Filter by category works

#### Activate Agent
```bash
curl -X POST "https://YOUR_API_URL/api/agents/AGENT_ID/activate" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"permissions": ["read", "write"]}'
```
- [ ] Returns 200 OK
- [ ] Agent is activated in database
- [ ] EventBridge event is published
- [ ] Audit log is created

#### Deactivate Agent
```bash
curl -X POST "https://YOUR_API_URL/api/agents/AGENT_ID/deactivate" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Testing"}'
```
- [ ] Returns 200 OK
- [ ] Agent is deactivated in database
- [ ] EventBridge event is published
- [ ] Audit log is created

### 6. Verify Observability

#### CloudWatch Logs
- [ ] Check `/aws/lambda/alquimista-list-agents-dev` for logs
- [ ] Check `/aws/lambda/alquimista-activate-agent-dev` for logs
- [ ] Check `/aws/lambda/alquimista-deactivate-agent-dev` for logs
- [ ] Verify structured JSON logging
- [ ] Verify trace_id in logs

#### X-Ray Traces
- [ ] Open X-Ray console
- [ ] Find traces for API requests
- [ ] Verify service map shows Lambda → Database connections
- [ ] Check for errors or high latency

#### CloudWatch Metrics
- [ ] Lambda invocations metric
- [ ] Lambda errors metric
- [ ] Lambda duration metric
- [ ] API Gateway 4xx/5xx metrics

#### EventBridge Events
- [ ] Check EventBridge console
- [ ] Verify `agent.activated` events are published
- [ ] Verify `agent.deactivated` events are published
- [ ] Check event payload structure

### 7. Security Verification

- [ ] API requires valid JWT token
- [ ] Invalid tokens return 401 Unauthorized
- [ ] Non-admin/manager users cannot activate/deactivate (403 Forbidden)
- [ ] Tenant isolation works (users can only see their tenant's data)
- [ ] Database credentials are stored in Secrets Manager
- [ ] TLS/HTTPS is enforced

### 8. Error Handling Tests

Test error scenarios:

- [ ] Missing JWT token → 401
- [ ] Invalid JWT token → 401
- [ ] Insufficient permissions → 403
- [ ] Agent not found → 404
- [ ] Agent already active → 409
- [ ] Agent already inactive → 409
- [ ] Database connection error → 500

## Post-Deployment

### 1. Documentation
- [ ] Update API documentation with actual API URL
- [ ] Share API reference with frontend team
- [ ] Document any environment-specific configurations

### 2. Monitoring Setup
- [ ] Create CloudWatch dashboard for Marketplace API
- [ ] Set up alarms for high error rates
- [ ] Set up alarms for high latency
- [ ] Configure SNS notifications for alarms

### 3. Performance Baseline
- [ ] Record baseline metrics (latency, throughput)
- [ ] Document expected response times
- [ ] Set performance SLOs

### 4. Backup Verification
- [ ] Verify Aurora automated backups are enabled
- [ ] Test database restore procedure
- [ ] Document backup retention policy

## Staging Deployment

Repeat all steps above for staging environment:

```bash
npm run deploy:staging
```

- [ ] All smoke tests pass in staging
- [ ] Integration tests pass
- [ ] Load tests pass (if applicable)
- [ ] Security scan passes

## Production Deployment

### Pre-Production Checklist
- [ ] All tests pass in staging
- [ ] Security review completed
- [ ] Performance testing completed
- [ ] Disaster recovery plan documented
- [ ] Rollback plan documented
- [ ] Change request approved

### Production Deployment
```bash
npm run deploy:prod
```

- [ ] Deployment requires manual approval
- [ ] Deployment completes successfully
- [ ] Smoke tests pass in production
- [ ] Monitor for 30 minutes post-deployment
- [ ] Verify no increase in error rates
- [ ] Verify no performance degradation

### Post-Production
- [ ] Update runbooks with production URLs
- [ ] Notify stakeholders of successful deployment
- [ ] Schedule post-deployment review
- [ ] Document lessons learned

## Rollback Procedure

If issues are detected:

1. **Immediate Rollback**
   ```bash
   aws cloudformation rollback-stack --stack-name AlquimistaStack-prod
   ```

2. **Manual Rollback**
   ```bash
   git checkout <previous-commit>
   npm run deploy:prod
   ```

3. **Verify Rollback**
   - [ ] Previous version is deployed
   - [ ] Smoke tests pass
   - [ ] Error rates return to normal
   - [ ] Performance returns to baseline

## Troubleshooting

### Common Issues

**Issue:** Lambda timeout
- **Solution:** Increase timeout in `lib/alquimista-stack.ts`
- **Solution:** Optimize database queries
- **Solution:** Add database connection pooling

**Issue:** Database connection errors
- **Solution:** Check VPC configuration
- **Solution:** Verify security group rules
- **Solution:** Check database credentials in Secrets Manager

**Issue:** EventBridge events not published
- **Solution:** Verify IAM permissions
- **Solution:** Check EVENT_BUS_NAME environment variable
- **Solution:** Review CloudWatch Logs for errors

**Issue:** Cognito authorization fails
- **Solution:** Verify User Pool ID is correct
- **Solution:** Check JWT token format
- **Solution:** Verify custom attributes exist

## Support Contacts

- **Infrastructure:** DevOps Team
- **Database:** DBA Team
- **Security:** Security Team
- **On-Call:** PagerDuty rotation

## Sign-Off

- [ ] Development Lead: _________________ Date: _______
- [ ] QA Lead: _________________ Date: _______
- [ ] Security Lead: _________________ Date: _______
- [ ] Product Owner: _________________ Date: _______
