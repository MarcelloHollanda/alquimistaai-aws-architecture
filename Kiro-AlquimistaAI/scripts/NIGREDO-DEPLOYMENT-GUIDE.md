# Nigredo Deployment Guide

This guide explains how to use the Nigredo deployment scripts to deploy the prospecting core system.

## Overview

The Nigredo system consists of two main components:
1. **Backend**: Lambda functions, SQS queues, EventBridge rules, and database schema
2. **Frontend**: Next.js landing pages hosted on S3 + CloudFront

## Deployment Scripts

### 1. Backend Deployment (`deploy-nigredo-backend.ps1`)

Deploys the Nigredo API stack including:
- Lambda functions (recebimento, estrategia, disparo, atendimento, sentimento, agendamento)
- SQS queues for agent communication
- EventBridge rules for event routing
- Database migrations (007_create_nigredo_schema.sql)

**Usage:**
```powershell
# Deploy to dev environment
.\scripts\deploy-nigredo-backend.ps1

# Deploy to staging
.\scripts\deploy-nigredo-backend.ps1 -Environment staging

# Deploy to production
.\scripts\deploy-nigredo-backend.ps1 -Environment prod

# Skip database migrations
.\scripts\deploy-nigredo-backend.ps1 -SkipMigrations

# Skip health checks
.\scripts\deploy-nigredo-backend.ps1 -SkipHealthCheck
```

**What it does:**
1. Verifies AWS credentials and prerequisites
2. Builds TypeScript code
3. Runs database migrations (creates nigredo schema tables)
4. Deploys NigredoStack with CDK
5. Verifies Lambda functions and SQS queues are healthy
6. Saves stack outputs to `nigredo-backend-outputs-{env}.json`

**Duration:** ~10-15 minutes

### 2. Frontend Deployment (`deploy-nigredo-frontend.ps1`)

Deploys the Nigredo frontend landing pages:
- Builds Next.js application
- Uploads static files to S3
- Invalidates CloudFront cache

**Usage:**
```powershell
# Deploy to dev environment
.\scripts\deploy-nigredo-frontend.ps1

# Deploy to staging
.\scripts\deploy-nigredo-frontend.ps1 -Environment staging

# Deploy to production
.\scripts\deploy-nigredo-frontend.ps1 -Environment prod

# Skip build (use existing build)
.\scripts\deploy-nigredo-frontend.ps1 -SkipBuild

# Skip CloudFront invalidation
.\scripts\deploy-nigredo-frontend.ps1 -SkipInvalidation
```

**What it does:**
1. Verifies AWS credentials and NigredoFrontendStack exists
2. Installs npm dependencies
3. Builds Next.js application
4. Uploads build to S3 with proper cache headers
5. Invalidates CloudFront cache
6. Verifies deployment

**Duration:** ~5-10 minutes (plus 5-10 minutes for cache invalidation)

### 3. Full Deployment (`deploy-nigredo-full.ps1`)

Orchestrates complete deployment of both backend and frontend:
- Deploys backend first
- Deploys frontend second
- Runs smoke tests
- Provides comprehensive deployment summary

**Usage:**
```powershell
# Full deployment to dev
.\scripts\deploy-nigredo-full.ps1

# Full deployment to staging
.\scripts\deploy-nigredo-full.ps1 -Environment staging

# Full deployment to production (requires confirmation)
.\scripts\deploy-nigredo-full.ps1 -Environment prod

# Skip backend deployment
.\scripts\deploy-nigredo-full.ps1 -SkipBackend

# Skip frontend deployment
.\scripts\deploy-nigredo-full.ps1 -SkipFrontend

# Skip smoke tests
.\scripts\deploy-nigredo-full.ps1 -SkipSmokeTests
```

**What it does:**
1. Runs pre-deployment checks
2. Deploys backend (calls deploy-nigredo-backend.ps1)
3. Deploys frontend (calls deploy-nigredo-frontend.ps1)
4. Runs smoke tests:
   - Verifies Lambda functions are active
   - Checks SQS queues exist
   - Validates EventBridge rules
   - Confirms CloudFront distribution status
   - Checks S3 bucket contents
5. Saves comprehensive outputs to `nigredo-deployment-outputs-{env}.json`

**Duration:** ~15-25 minutes

## Prerequisites

### Required Tools
- **AWS CLI**: Configured with valid credentials
- **Node.js**: Version 18 or higher
- **npm**: For dependency management
- **PowerShell**: Version 5.1 or higher
- **PostgreSQL Client** (optional): For running migrations manually

### AWS Resources
The following must be deployed before Nigredo:
- **FibonacciStack**: Core infrastructure (VPC, Aurora, EventBridge, Cognito)
- **AWS Account**: With appropriate permissions

### Permissions Required
- CloudFormation: Create/update stacks
- Lambda: Create/update functions
- SQS: Create/manage queues
- EventBridge: Create/manage rules
- S3: Create/manage buckets, upload objects
- CloudFront: Create/manage distributions, invalidations
- Secrets Manager: Read database credentials
- RDS: Connect to Aurora (for migrations)

## Deployment Workflow

### First-Time Deployment

1. **Deploy Fibonacci Stack** (if not already deployed):
   ```powershell
   npm run deploy:dev
   ```

2. **Deploy Nigredo Backend**:
   ```powershell
   .\scripts\deploy-nigredo-backend.ps1 -Environment dev
   ```

3. **Deploy Nigredo Frontend Stack** (infrastructure):
   ```powershell
   npx cdk deploy NigredoFrontendStack-dev --context env=dev
   ```

4. **Deploy Nigredo Frontend** (application):
   ```powershell
   .\scripts\deploy-nigredo-frontend.ps1 -Environment dev
   ```

**OR** use the full deployment script:
```powershell
.\scripts\deploy-nigredo-full.ps1 -Environment dev
```

### Updating Existing Deployment

**Backend only:**
```powershell
.\scripts\deploy-nigredo-backend.ps1 -Environment dev
```

**Frontend only:**
```powershell
.\scripts\deploy-nigredo-frontend.ps1 -Environment dev
```

**Both:**
```powershell
.\scripts\deploy-nigredo-full.ps1 -Environment dev
```

## Environment-Specific Considerations

### Development (`dev`)
- Fastest deployment
- No confirmation prompts
- Minimal resources
- Short retention periods

### Staging (`staging`)
- Production-like environment
- Used for testing before prod
- Moderate resources

### Production (`prod`)
- Requires explicit confirmation: Type `DEPLOY` when prompted
- Maximum resources
- Long retention periods
- Deletion protection enabled
- Extra monitoring and alarms

## Troubleshooting

### Backend Deployment Issues

**Error: "Fibonacci stack not found"**
- Solution: Deploy Fibonacci stack first: `npm run deploy:dev`

**Error: "Database credentials not found"**
- Solution: Ensure Fibonacci stack is fully deployed and Secrets Manager secret exists

**Error: "psql not found"**
- Solution: Install PostgreSQL client or use `-SkipMigrations` flag
- Migrations can be run manually later

**Error: "Lambda function not active"**
- Solution: Wait a few minutes and check CloudWatch logs
- May need to redeploy: `npx cdk deploy NigredoStack-dev --context env=dev`

### Frontend Deployment Issues

**Error: "Frontend stack not found"**
- Solution: Deploy infrastructure first: `npx cdk deploy NigredoFrontendStack-dev --context env=dev`

**Error: "Build failed"**
- Solution: Check Node.js version (requires 18+)
- Ensure all dependencies are installed: `cd frontend && npm install`

**Error: "S3 upload failed"**
- Solution: Check AWS credentials and S3 bucket permissions
- Verify bucket exists: `aws s3 ls s3://nigredo-site-dev-{account-id}`

**Error: "CloudFront invalidation failed"**
- Solution: Use `-SkipInvalidation` flag and invalidate manually:
  ```powershell
  aws cloudfront create-invalidation --distribution-id {ID} --paths "/*"
  ```

### Smoke Test Failures

**Lambda functions not active:**
- Wait 2-3 minutes for functions to initialize
- Check CloudWatch logs for errors

**SQS queues missing:**
- Redeploy backend stack
- Check CloudFormation events for errors

**CloudFront not deployed:**
- Wait 10-15 minutes for distribution to deploy
- Check distribution status: `aws cloudfront get-distribution --id {ID}`

## Monitoring After Deployment

### CloudWatch Logs
```powershell
# View Lambda logs
aws logs tail /aws/lambda/nigredo-recebimento-dev --follow

# View all Nigredo logs
aws logs tail --follow --filter-pattern "nigredo"
```

### CloudWatch Metrics
```powershell
# Check Lambda invocations
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=nigredo-recebimento-dev \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

### CloudWatch Alarms
```powershell
# List all Nigredo alarms
aws cloudwatch describe-alarms --alarm-name-prefix Nigredo-dev

# Check alarm state
aws cloudwatch describe-alarms --alarm-names Nigredo-dev-ErrorRate
```

### SQS Queue Depth
```powershell
# Get queue URL
$queueUrl = aws sqs get-queue-url --queue-name nigredo-recebimento-dev --query QueueUrl --output text

# Check message count
aws sqs get-queue-attributes --queue-url $queueUrl --attribute-names ApproximateNumberOfMessages
```

## Rollback Procedures

### Backend Rollback
```powershell
# List stack versions
aws cloudformation list-stack-resources --stack-name NigredoStack-dev

# Rollback to previous version
npx cdk deploy NigredoStack-dev --rollback --context env=dev
```

### Frontend Rollback
```powershell
# List S3 object versions
aws s3api list-object-versions --bucket nigredo-site-dev-{account-id}

# Restore previous version
aws s3api copy-object \
  --bucket nigredo-site-dev-{account-id} \
  --copy-source nigredo-site-dev-{account-id}/index.html?versionId={VERSION-ID} \
  --key index.html

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id {ID} --paths "/*"
```

## Output Files

After deployment, the following files are created:

- `nigredo-backend-outputs-{env}.json`: Backend stack outputs
- `nigredo-deployment-outputs-{env}.json`: Full deployment outputs (backend + frontend)

These files contain:
- API Gateway URLs
- Lambda function ARNs
- SQS queue URLs
- CloudFront distribution URL
- S3 bucket names

## Best Practices

1. **Always deploy to dev first**: Test changes in dev before staging/prod
2. **Use full deployment for major changes**: Ensures consistency
3. **Monitor after deployment**: Check CloudWatch logs and alarms
4. **Keep outputs safe**: Save deployment output files for reference
5. **Test thoroughly**: Run smoke tests and manual tests after deployment
6. **Document changes**: Update CHANGELOG.md with deployment notes
7. **Backup before prod**: Ensure database backups are recent
8. **Communicate**: Notify team before production deployments

## Support

For issues or questions:
1. Check CloudWatch logs for error details
2. Review CloudFormation events for stack errors
3. Consult the main README.md for architecture details
4. Check the design document: `.kiro/specs/nigredo-prospecting-core/design.md`

## Related Documentation

- [Nigredo Requirements](../.kiro/specs/nigredo-prospecting-core/requirements.md)
- [Nigredo Design](../.kiro/specs/nigredo-prospecting-core/design.md)
- [Nigredo Tasks](../.kiro/specs/nigredo-prospecting-core/tasks.md)
- [Database Migration 007](../database/migrations/README-007.md)
- [Lambda Implementation Status](../lambda/nigredo/IMPLEMENTATION-STATUS.md)
