# Nigredo Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Nigredo Prospecting Core system to AWS. The deployment includes backend APIs (Lambda functions), frontend (Next.js static site), and all supporting infrastructure.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Migration](#database-migration)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Full System Deployment](#full-system-deployment)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Rollback Procedures](#rollback-procedures)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

Ensure the following tools are installed on your system:

- **Node.js**: Version 20.x or higher
- **npm**: Version 9.x or higher
- **AWS CLI**: Version 2.x
- **AWS CDK**: Version 2.x
- **Git**: Latest version
- **PowerShell**: 7.x or higher (Windows)

**Installation Commands**:

```bash
# Check versions
node --version
npm --version
aws --version
cdk --version

# Install AWS CDK globally
npm install -g aws-cdk

# Verify CDK installation
cdk --version
```

### AWS Account Requirements

- **AWS Account**: Active AWS account with appropriate permissions
- **IAM Permissions**: Administrator access or specific permissions for:
  - Lambda
  - API Gateway
  - RDS (Aurora)
  - S3
  - CloudFront
  - CloudWatch
  - Secrets Manager
  - KMS
  - IAM
  - VPC

### AWS Credentials Configuration

Configure AWS credentials using one of the following methods:

**Method 1: AWS CLI Configuration**
```bash
aws configure
# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-1)
# - Default output format (json)
```

**Method 2: Environment Variables**
```bash
# Windows PowerShell
$env:AWS_ACCESS_KEY_ID="your-access-key"
$env:AWS_SECRET_ACCESS_KEY="your-secret-key"
$env:AWS_DEFAULT_REGION="us-east-1"

# Linux/Mac
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="us-east-1"
```

**Method 3: AWS SSO**
```bash
aws sso login --profile your-profile
export AWS_PROFILE=your-profile
```

### Existing Infrastructure

The Nigredo system depends on existing infrastructure from the Fibonacci stack:

- **VPC**: Virtual Private Cloud with public and private subnets
- **Aurora PostgreSQL**: Database cluster (shared)
- **KMS Key**: For encryption at rest
- **Cognito User Pool**: For authentication

**Verify existing infrastructure**:
```bash
# List existing CDK stacks
cdk list

# Expected output should include:
# - FibonacciStack-dev
# - FibonacciStack-staging
# - FibonacciStack-prod
```

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/alquimista-aws-architecture.git
cd alquimista-aws-architecture
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Configure Environment Variables

Create environment-specific configuration files:

**Backend Configuration** (`cdk.context.json`):

```json
{
  "environments": {
    "dev": {
      "account": "123456789012",
      "region": "us-east-1",
      "vpcId": "vpc-xxxxx",
      "dbClusterArn": "arn:aws:rds:us-east-1:123456789012:cluster:fibonacci-dev",
      "dbSecretArn": "arn:aws:secretsmanager:us-east-1:123456789012:secret:fibonacci-db-dev",
      "kmsKeyArn": "arn:aws:kms:us-east-1:123456789012:key/xxxxx",
      "fibonacciWebhookUrl": "https://api-dev.alquimista.ai/public/nigredo-event"
    },
    "staging": {
      "account": "123456789012",
      "region": "us-east-1",
      "vpcId": "vpc-yyyyy",
      "dbClusterArn": "arn:aws:rds:us-east-1:123456789012:cluster:fibonacci-staging",
      "dbSecretArn": "arn:aws:secretsmanager:us-east-1:123456789012:secret:fibonacci-db-staging",
      "kmsKeyArn": "arn:aws:kms:us-east-1:123456789012:key/yyyyy",
      "fibonacciWebhookUrl": "https://api-staging.alquimista.ai/public/nigredo-event"
    },
    "prod": {
      "account": "123456789012",
      "region": "us-east-1",
      "vpcId": "vpc-zzzzz",
      "dbClusterArn": "arn:aws:rds:us-east-1:123456789012:cluster:fibonacci-prod",
      "dbSecretArn": "arn:aws:secretsmanager:us-east-1:123456789012:secret:fibonacci-db-prod",
      "kmsKeyArn": "arn:aws:kms:us-east-1:123456789012:key/zzzzz",
      "fibonacciWebhookUrl": "https://api.alquimista.ai/public/nigredo-event"
    }
  }
}
```

**Frontend Configuration** (`frontend/.env.production`):

```env
NEXT_PUBLIC_API_URL=https://api.alquimista.ai
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_xxxxx
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxx
NEXT_PUBLIC_REGION=us-east-1
```

### 4. Bootstrap CDK (First-time only)

If this is your first CDK deployment in the AWS account/region:

```bash
cdk bootstrap aws://ACCOUNT-ID/REGION

# Example:
cdk bootstrap aws://123456789012/us-east-1
```

---

## Database Migration

Before deploying the backend, run the database migration to create the Nigredo schema.

### 1. Connect to Database

**Option A: Using psql (Recommended)**

```bash
# Get database credentials from Secrets Manager
aws secretsmanager get-secret-value \
  --secret-id fibonacci-db-dev \
  --query SecretString \
  --output text

# Connect to database
psql -h <DB_ENDPOINT> -U <DB_USERNAME> -d fibonacci
```

**Option B: Using AWS RDS Query Editor**

1. Navigate to AWS Console → RDS → Query Editor
2. Select the Aurora cluster
3. Choose database authentication method
4. Connect to the `fibonacci` database

### 2. Run Migration Script

```bash
# From project root
psql -h <DB_ENDPOINT> -U <DB_USERNAME> -d fibonacci -f database/migrations/007_create_nigredo_schema.sql
```

**Expected Output**:
```
CREATE SCHEMA
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE INDEX
CREATE INDEX
...
```

### 3. Verify Migration

```sql
-- Check schema exists
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'nigredo';

-- Check tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'nigredo';

-- Expected tables:
-- - leads
-- - form_submissions
-- - webhook_logs
-- - rate_limits
```

---

## Backend Deployment

Deploy the Nigredo API Lambda functions and API Gateway.

### Using Deployment Script (Recommended)

```powershell
# Deploy to dev environment
.\scripts\deploy-nigredo-backend.ps1 -Environment dev

# Deploy to staging environment
.\scripts\deploy-nigredo-backend.ps1 -Environment staging

# Deploy to production environment
.\scripts\deploy-nigredo-backend.ps1 -Environment prod
```

### Manual Deployment

```bash
# Set environment
export ENV_NAME=dev

# Synthesize CloudFormation template
cdk synth NigredoApiStack-$ENV_NAME

# Deploy stack
cdk deploy NigredoApiStack-$ENV_NAME --require-approval never

# View stack outputs
aws cloudformation describe-stacks \
  --stack-name NigredoApiStack-$ENV_NAME \
  --query 'Stacks[0].Outputs'
```

### Deployment Output

After successful deployment, you'll see outputs like:

```
NigredoApiStack-dev.ApiUrl = https://xxxxx.execute-api.us-east-1.amazonaws.com
NigredoApiStack-dev.CreateLeadFunctionArn = arn:aws:lambda:us-east-1:123456789012:function:nigredo-create-lead-dev
NigredoApiStack-dev.ListLeadsFunctionArn = arn:aws:lambda:us-east-1:123456789012:function:nigredo-list-leads-dev
NigredoApiStack-dev.GetLeadFunctionArn = arn:aws:lambda:us-east-1:123456789012:function:nigredo-get-lead-dev
```

**Save these outputs** - you'll need the API URL for frontend configuration.

---

## Frontend Deployment

Deploy the Next.js frontend to S3 and CloudFront.

### 1. Update Frontend Configuration

Update `frontend/.env.production` with the backend API URL from the previous step:

```env
NEXT_PUBLIC_API_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com
```

### 2. Deploy Frontend Stack

**Using Deployment Script (Recommended)**:

```powershell
# Deploy to dev environment
.\scripts\deploy-nigredo-frontend.ps1 -Environment dev

# Deploy to staging environment
.\scripts\deploy-nigredo-frontend.ps1 -Environment staging

# Deploy to production environment
.\scripts\deploy-nigredo-frontend.ps1 -Environment prod
```

**Manual Deployment**:

```bash
# Set environment
export ENV_NAME=dev

# Build Next.js application
cd frontend
npm run build
cd ..

# Deploy CDK stack (creates S3 bucket and CloudFront)
cdk deploy NigredoFrontendStack-$ENV_NAME --require-approval never

# Get S3 bucket name from stack outputs
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name NigredoFrontendStack-$ENV_NAME \
  --query 'Stacks[0].Outputs[?OutputKey==`BucketName`].OutputValue' \
  --output text)

# Upload build to S3
aws s3 sync frontend/out s3://$BUCKET_NAME --delete

# Get CloudFront distribution ID
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name NigredoFrontendStack-$ENV_NAME \
  --query 'Stacks[0].Outputs[?OutputKey==`DistributionId`].OutputValue' \
  --output text)

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

### 3. Frontend Deployment Output

```
NigredoFrontendStack-dev.CloudFrontUrl = https://dxxxxx.cloudfront.net
NigredoFrontendStack-dev.BucketName = nigredo-frontend-dev-xxxxx
NigredoFrontendStack-dev.DistributionId = EXXXXXXXXXXXXX
```

---

## Full System Deployment

Deploy both backend and frontend in one command.

```powershell
# Deploy to dev environment
.\scripts\deploy-nigredo-full.ps1 -Environment dev

# Deploy to staging environment
.\scripts\deploy-nigredo-full.ps1 -Environment staging

# Deploy to production environment
.\scripts\deploy-nigredo-full.ps1 -Environment prod
```

**What this script does**:
1. Runs database migration (if needed)
2. Deploys backend API stack
3. Builds frontend application
4. Deploys frontend stack
5. Uploads frontend build to S3
6. Invalidates CloudFront cache
7. Runs smoke tests
8. Displays deployment summary

---

## Post-Deployment Verification

### 1. Health Check

```bash
# Check API health
curl https://xxxxx.execute-api.us-east-1.amazonaws.com/health

# Expected response:
# {"status":"healthy","timestamp":"2024-01-15T10:30:00.000Z","version":"1.0.0"}
```

### 2. Test Create Lead Endpoint

```bash
curl -X POST https://xxxxx.execute-api.us-east-1.amazonaws.com/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "message": "This is a test lead"
  }'

# Expected response:
# {"id":"...","status":"success","message":"Lead criado com sucesso"}
```

### 3. Verify Frontend

1. Open CloudFront URL in browser: `https://dxxxxx.cloudfront.net`
2. Verify landing page loads correctly
3. Test form submission
4. Check success message appears

### 4. Check CloudWatch Logs

```bash
# View Create Lead Lambda logs
aws logs tail /aws/lambda/nigredo-create-lead-dev --follow

# View List Leads Lambda logs
aws logs tail /aws/lambda/nigredo-list-leads-dev --follow
```

### 5. Verify Database Records

```sql
-- Connect to database
psql -h <DB_ENDPOINT> -U <DB_USERNAME> -d fibonacci

-- Check leads table
SELECT * FROM nigredo.leads ORDER BY created_at DESC LIMIT 5;

-- Check webhook logs
SELECT * FROM nigredo.webhook_logs ORDER BY sent_at DESC LIMIT 5;
```

### 6. Check CloudWatch Metrics

Navigate to AWS Console → CloudWatch → Dashboards → `Nigredo-Dashboard-dev`

Verify the following metrics are being recorded:
- Lead submissions count
- Webhook success rate
- API latency
- Error rates

---

## Rollback Procedures

### Rollback Backend

```bash
# List previous stack versions
aws cloudformation list-stack-resources \
  --stack-name NigredoApiStack-dev

# Rollback to previous version
cdk deploy NigredoApiStack-dev --rollback

# Or use CloudFormation directly
aws cloudformation rollback-stack \
  --stack-name NigredoApiStack-dev
```

### Rollback Frontend

```bash
# List S3 bucket versions
aws s3api list-object-versions \
  --bucket nigredo-frontend-dev-xxxxx \
  --prefix index.html

# Restore previous version
aws s3api copy-object \
  --bucket nigredo-frontend-dev-xxxxx \
  --copy-source nigredo-frontend-dev-xxxxx/index.html?versionId=VERSION_ID \
  --key index.html

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id EXXXXXXXXXXXXX \
  --paths "/*"
```

### Rollback Database Migration

```sql
-- Connect to database
psql -h <DB_ENDPOINT> -U <DB_USERNAME> -d fibonacci

-- Drop Nigredo schema (WARNING: This deletes all data!)
DROP SCHEMA nigredo CASCADE;

-- Re-run previous migration if needed
```

---

## Troubleshooting

### Issue: CDK Deploy Fails with "Stack already exists"

**Solution**:
```bash
# Delete the stack
cdk destroy NigredoApiStack-dev

# Re-deploy
cdk deploy NigredoApiStack-dev
```

### Issue: Lambda Function Timeout

**Symptoms**: API requests return 504 Gateway Timeout

**Solution**:
1. Check CloudWatch Logs for the Lambda function
2. Increase Lambda timeout in CDK stack:
   ```typescript
   timeout: cdk.Duration.seconds(30)
   ```
3. Re-deploy the stack

### Issue: Database Connection Errors

**Symptoms**: Lambda logs show "ECONNREFUSED" or "Connection timeout"

**Solution**:
1. Verify Lambda is in the correct VPC and subnets
2. Check security group rules allow Lambda → Aurora traffic
3. Verify database secret ARN is correct in environment variables
4. Test database connectivity:
   ```bash
   aws rds describe-db-clusters --db-cluster-identifier fibonacci-dev
   ```

### Issue: Frontend Shows 404 Errors

**Symptoms**: CloudFront returns 404 for all routes

**Solution**:
1. Verify S3 bucket has files:
   ```bash
   aws s3 ls s3://nigredo-frontend-dev-xxxxx/
   ```
2. Check CloudFront origin configuration
3. Verify CloudFront distribution is deployed (not "In Progress")
4. Invalidate cache:
   ```bash
   aws cloudfront create-invalidation --distribution-id EXXXXXXXXXXXXX --paths "/*"
   ```

### Issue: CORS Errors in Browser

**Symptoms**: Browser console shows "CORS policy" errors

**Solution**:
1. Verify API Gateway CORS configuration in CDK stack
2. Check allowed origins include your CloudFront domain
3. Re-deploy API Gateway:
   ```bash
   cdk deploy NigredoApiStack-dev
   ```

### Issue: Rate Limiting Not Working

**Symptoms**: Users can submit more than 10 forms per hour

**Solution**:
1. Check `rate_limits` table exists:
   ```sql
   SELECT * FROM nigredo.rate_limits;
   ```
2. Verify rate limiter code is deployed
3. Check CloudWatch Logs for rate limiter errors
4. Test rate limiting:
   ```bash
   for i in {1..12}; do
     curl -X POST https://xxxxx.execute-api.us-east-1.amazonaws.com/api/leads \
       -H "Content-Type: application/json" \
       -d '{"name":"Test","email":"test@example.com","message":"Test message"}';
   done
   ```

### Issue: Webhook Delivery Failures

**Symptoms**: Leads created but not appearing in Fibonacci

**Solution**:
1. Check `webhook_logs` table:
   ```sql
   SELECT * FROM nigredo.webhook_logs WHERE success = false ORDER BY sent_at DESC LIMIT 10;
   ```
2. Verify Fibonacci webhook endpoint is accessible:
   ```bash
   curl -X POST https://api.alquimista.ai/public/nigredo-event \
     -H "Content-Type: application/json" \
     -d '{"event_type":"lead.created","timestamp":"2024-01-15T10:30:00Z","lead":{}}'
   ```
3. Check Lambda execution role has network access
4. Review CloudWatch Logs for webhook sender Lambda

### Issue: High Lambda Costs

**Symptoms**: AWS bill shows high Lambda charges

**Solution**:
1. Check Lambda invocation count in CloudWatch
2. Reduce Lambda memory if over-provisioned
3. Enable Lambda provisioned concurrency only if needed
4. Review and optimize cold start times
5. Consider implementing caching for GET endpoints

### Issue: CloudWatch Alarms Not Triggering

**Symptoms**: No SNS notifications despite errors

**Solution**:
1. Verify SNS topic exists and has subscriptions:
   ```bash
   aws sns list-subscriptions
   ```
2. Check alarm configuration:
   ```bash
   aws cloudwatch describe-alarms --alarm-names nigredo-api-error-rate-dev
   ```
3. Confirm email subscription (check spam folder)
4. Test alarm manually:
   ```bash
   aws cloudwatch set-alarm-state \
     --alarm-name nigredo-api-error-rate-dev \
     --state-value ALARM \
     --state-reason "Testing alarm"
   ```

---

## Environment-Specific Notes

### Development Environment

- **Purpose**: Testing and development
- **Data**: Test data only
- **Monitoring**: Basic CloudWatch metrics
- **Backups**: Not required
- **Cost**: Optimized for low cost

### Staging Environment

- **Purpose**: Pre-production testing
- **Data**: Anonymized production-like data
- **Monitoring**: Full monitoring with alarms
- **Backups**: Daily automated backups
- **Cost**: Similar to production

### Production Environment

- **Purpose**: Live customer-facing system
- **Data**: Real customer data (LGPD compliant)
- **Monitoring**: Full monitoring with 24/7 alerts
- **Backups**: Automated backups with point-in-time recovery
- **Cost**: Optimized for performance and reliability
- **Deployment**: Requires approval and change management

---

## Deployment Checklist

Use this checklist before deploying to production:

- [ ] All tests passing in staging environment
- [ ] Database migration tested and verified
- [ ] Environment variables configured correctly
- [ ] AWS credentials configured with appropriate permissions
- [ ] CDK bootstrap completed for target account/region
- [ ] Existing infrastructure (VPC, Aurora, KMS) verified
- [ ] Backend deployment successful
- [ ] Frontend build successful
- [ ] Frontend deployment successful
- [ ] Health check endpoint responding
- [ ] Test lead submission successful
- [ ] Webhook delivery to Fibonacci verified
- [ ] CloudWatch metrics being recorded
- [ ] CloudWatch alarms configured and tested
- [ ] SNS notifications working
- [ ] Rate limiting tested and working
- [ ] CORS configuration verified
- [ ] Security groups configured correctly
- [ ] IAM roles have minimum required permissions
- [ ] CloudFront distribution deployed and accessible
- [ ] DNS records updated (if using custom domain)
- [ ] SSL certificate configured (if using custom domain)
- [ ] Rollback procedure documented and tested
- [ ] Stakeholders notified of deployment
- [ ] Documentation updated with production URLs

---

## Additional Resources

- **API Documentation**: [docs/nigredo/API.md](./API.md)
- **Operations Runbook**: [docs/nigredo/OPERATIONS.md](./OPERATIONS.md)
- **Architecture Diagram**: [.kiro/specs/nigredo-prospecting-core/design.md](../../.kiro/specs/nigredo-prospecting-core/design.md)
- **AWS CDK Documentation**: https://docs.aws.amazon.com/cdk/
- **AWS Lambda Best Practices**: https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html
- **Next.js Deployment**: https://nextjs.org/docs/deployment

---

## Support

For deployment support, contact:

- **DevOps Team**: devops@alquimista.ai
- **Slack Channel**: #nigredo-deployment
- **On-Call**: +55 11 99999-9999

---

## Changelog

### Version 1.0.0 (2024-01-15)

- Initial deployment guide
- Backend deployment procedures
- Frontend deployment procedures
- Troubleshooting section
- Environment-specific configurations
