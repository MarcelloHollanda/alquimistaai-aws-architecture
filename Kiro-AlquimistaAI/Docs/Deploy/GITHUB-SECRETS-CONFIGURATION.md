# GitHub Secrets Configuration Guide

## Overview

This guide provides step-by-step instructions for configuring GitHub Secrets required for the Fibonacci AWS CI/CD pipelines. These secrets enable automated deployment to AWS environments (dev, staging, production) and integration with external services.

## Required Secrets

### AWS Credentials

#### AWS_ACCESS_KEY_ID
- **Description**: AWS IAM access key ID for programmatic access
- **Required for**: All deployment workflows (dev, staging, prod)
- **Scope**: Repository or Environment-specific
- **Security Level**: Critical

#### AWS_SECRET_ACCESS_KEY
- **Description**: AWS IAM secret access key for programmatic access
- **Required for**: All deployment workflows (dev, staging, prod)
- **Scope**: Repository or Environment-specific
- **Security Level**: Critical

### MCP Integration Secrets (Optional)

#### WHATSAPP_API_KEY
- **Description**: WhatsApp Business API authentication key
- **Required for**: Nigredo agents (disparo, atendimento)
- **Scope**: Repository
- **Security Level**: High
- **Note**: Can be configured post-deployment via AWS Secrets Manager

#### GOOGLE_CALENDAR_CLIENT_ID
- **Description**: Google Calendar API OAuth2 client ID
- **Required for**: Agendamento agent
- **Scope**: Repository
- **Security Level**: Medium
- **Note**: Can be configured post-deployment via AWS Secrets Manager

#### GOOGLE_CALENDAR_CLIENT_SECRET
- **Description**: Google Calendar API OAuth2 client secret
- **Required for**: Agendamento agent
- **Scope**: Repository
- **Security Level**: High
- **Note**: Can be configured post-deployment via AWS Secrets Manager

### Notification Secrets

#### SLACK_WEBHOOK_URL
- **Description**: Slack webhook URL for deployment notifications
- **Required for**: All deployment workflows (dev, staging, prod)
- **Scope**: Repository
- **Security Level**: Medium
- **Setup**: Create Slack app with incoming webhook, add URL to GitHub secrets

## Configuration Methods

### Method 1: Repository Secrets (Recommended for Development)

Repository secrets are available to all workflows in the repository.

**Steps:**

1. Navigate to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret:
   - Name: `AWS_ACCESS_KEY_ID`
   - Value: `<your-aws-access-key-id>`
   - Click **Add secret**
5. Repeat for all required secrets

**Pros:**
- Simple to configure
- Available to all workflows
- Good for development and staging

**Cons:**
- Same credentials used for all environments
- Less granular access control

### Method 2: Environment Secrets (Recommended for Production)

Environment secrets provide environment-specific credentials with approval workflows.

**Steps:**

1. **Create Environments:**
   - Navigate to **Settings** → **Environments**
   - Click **New environment**
   - Create three environments:
     - `development`
     - `staging`
     - `production`

2. **Configure Production Environment Protection:**
   - Select `production` environment
   - Enable **Required reviewers**
   - Add reviewers (team leads, DevOps)
   - Set **Wait timer** (optional, e.g., 5 minutes)
   - Enable **Deployment branches** → Select `main` only

3. **Add Environment-Specific Secrets:**
   - Select environment (e.g., `production`)
   - Click **Add secret**
   - Add secrets specific to that environment:
     - `AWS_ACCESS_KEY_ID` (production IAM user)
     - `AWS_SECRET_ACCESS_KEY` (production IAM user)

4. **Repeat for Each Environment:**
   - Development: Less restrictive IAM permissions
   - Staging: Similar to production
   - Production: Strict IAM permissions with MFA

**Pros:**
- Environment-specific credentials
- Approval workflows for production
- Better security and audit trail
- Granular access control

**Cons:**
- More complex setup
- Requires environment configuration in workflows

## AWS IAM User Setup

### Creating IAM Users for CI/CD

**For Development/Staging:**

```bash
# Create IAM user
aws iam create-user --user-name github-actions-dev

# Attach policies (adjust as needed)
aws iam attach-user-policy \
  --user-name github-actions-dev \
  --policy-arn arn:aws:iam::aws:policy/PowerUserAccess

# Create access key
aws iam create-access-key --user-name github-actions-dev
```

**For Production (More Restrictive):**

```bash
# Create IAM user
aws iam create-user --user-name github-actions-prod

# Create custom policy (least privilege)
cat > github-actions-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:*",
        "s3:*",
        "lambda:*",
        "apigateway:*",
        "events:*",
        "sqs:*",
        "rds:*",
        "ec2:Describe*",
        "ec2:CreateSecurityGroup",
        "ec2:AuthorizeSecurityGroupIngress",
        "iam:GetRole",
        "iam:PassRole",
        "iam:CreateRole",
        "iam:AttachRolePolicy",
        "secretsmanager:*",
        "cognito-idp:*",
        "cloudfront:*",
        "logs:*",
        "cloudwatch:*",
        "xray:*"
      ],
      "Resource": "*"
    }
  ]
}
EOF

# Create policy
aws iam create-policy \
  --policy-name GitHubActionsCDKPolicy \
  --policy-document file://github-actions-policy.json

# Attach policy
aws iam attach-user-policy \
  --user-name github-actions-prod \
  --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/GitHubActionsCDKPolicy

# Create access key
aws iam create-access-key --user-name github-actions-prod
```

### IAM User Best Practices

1. **Separate Users per Environment**
   - `github-actions-dev` for development
   - `github-actions-staging` for staging
   - `github-actions-prod` for production

2. **Least Privilege Principle**
   - Grant only necessary permissions
   - Use custom policies instead of managed policies
   - Regularly audit permissions

3. **Enable MFA for Production**
   ```bash
   aws iam enable-mfa-device \
     --user-name github-actions-prod \
     --serial-number arn:aws:iam::ACCOUNT_ID:mfa/github-actions-prod \
     --authentication-code1 123456 \
     --authentication-code2 789012
   ```

4. **Rotate Access Keys Regularly**
   - Set up key rotation policy (90 days)
   - Use AWS Secrets Manager for automatic rotation
   - Monitor key age with CloudWatch

5. **Enable CloudTrail Logging**
   - Track all API calls made by CI/CD user
   - Set up alerts for suspicious activity
   - Retain logs for compliance

## Configuring Secrets via GitHub CLI

### Install GitHub CLI

```bash
# macOS
brew install gh

# Windows
winget install GitHub.cli

# Linux
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

### Authenticate

```bash
gh auth login
```

### Add Repository Secrets

```bash
# Set AWS credentials
gh secret set AWS_ACCESS_KEY_ID --body "AKIAIOSFODNN7EXAMPLE"
gh secret set AWS_SECRET_ACCESS_KEY --body "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"

# Set MCP integration secrets (optional)
gh secret set WHATSAPP_API_KEY --body "your-whatsapp-api-key"
gh secret set GOOGLE_CALENDAR_CLIENT_ID --body "your-client-id"
gh secret set GOOGLE_CALENDAR_CLIENT_SECRET --body "your-client-secret"

# Set notification secrets (required for notifications)
gh secret set SLACK_WEBHOOK_URL --body "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

### Add Environment Secrets

```bash
# Add secrets to production environment
gh secret set AWS_ACCESS_KEY_ID --env production --body "AKIAIOSFODNN7EXAMPLE"
gh secret set AWS_SECRET_ACCESS_KEY --env production --body "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"

# Add secrets to staging environment
gh secret set AWS_ACCESS_KEY_ID --env staging --body "AKIAIOSFODNN7EXAMPLE"
gh secret set AWS_SECRET_ACCESS_KEY --env staging --body "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"

# Add secrets to development environment
gh secret set AWS_ACCESS_KEY_ID --env development --body "AKIAIOSFODNN7EXAMPLE"
gh secret set AWS_SECRET_ACCESS_KEY --env development --body "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
```

### List Secrets

```bash
# List repository secrets
gh secret list

# List environment secrets
gh secret list --env production
```

### Delete Secrets

```bash
# Delete repository secret
gh secret delete AWS_ACCESS_KEY_ID

# Delete environment secret
gh secret delete AWS_ACCESS_KEY_ID --env production
```

## Configuring Secrets via GitHub Web UI

### Step-by-Step Guide

1. **Navigate to Repository Settings**
   - Go to your repository on GitHub
   - Click **Settings** tab

2. **Access Secrets Configuration**
   - In left sidebar, click **Secrets and variables**
   - Click **Actions**

3. **Add Repository Secret**
   - Click **New repository secret** button
   - Enter secret name (e.g., `AWS_ACCESS_KEY_ID`)
   - Enter secret value
   - Click **Add secret**

4. **Add Environment Secret**
   - Click **Environments** in left sidebar
   - Select or create environment
   - Scroll to **Environment secrets**
   - Click **Add secret**
   - Enter name and value
   - Click **Add secret**

5. **Verify Configuration**
   - Secrets should appear in list (values hidden)
   - Check "Updated" timestamp
   - Verify environment associations

## Verifying Secrets Configuration

### Test Workflow

Create a test workflow to verify secrets are accessible:

```yaml
# .github/workflows/test-secrets.yml
name: Test Secrets

on:
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Test AWS credentials
        run: |
          if [ -z "${{ secrets.AWS_ACCESS_KEY_ID }}" ]; then
            echo "❌ AWS_ACCESS_KEY_ID not configured"
            exit 1
          fi
          echo "✅ AWS_ACCESS_KEY_ID is configured"
          
          if [ -z "${{ secrets.AWS_SECRET_ACCESS_KEY }}" ]; then
            echo "❌ AWS_SECRET_ACCESS_KEY not configured"
            exit 1
          fi
          echo "✅ AWS_SECRET_ACCESS_KEY is configured"
      
      - name: Test AWS connection
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Verify AWS access
        run: |
          aws sts get-caller-identity
          echo "✅ AWS credentials are valid"
```

### Manual Verification

```bash
# Trigger test workflow
gh workflow run test-secrets.yml

# Check workflow status
gh run list --workflow=test-secrets.yml

# View workflow logs
gh run view --log
```

## Security Best Practices

### 1. Never Commit Secrets to Repository

```bash
# Add to .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo "*.pem" >> .gitignore
echo "*.key" >> .gitignore

# Scan for accidentally committed secrets
git secrets --scan
```

### 2. Use Environment-Specific Secrets

- Development: Less sensitive, can be shared
- Staging: Similar to production
- Production: Highly restricted, MFA required

### 3. Rotate Secrets Regularly

```bash
# Create rotation schedule
# Every 90 days for production
# Every 180 days for dev/staging

# Automate with AWS Secrets Manager
aws secretsmanager rotate-secret \
  --secret-id fibonacci/github/prod \
  --rotation-lambda-arn arn:aws:lambda:us-east-1:ACCOUNT:function:RotateSecret
```

### 4. Monitor Secret Usage

```bash
# Enable CloudTrail logging
aws cloudtrail create-trail \
  --name github-actions-audit \
  --s3-bucket-name my-audit-bucket

# Create CloudWatch alarm for unusual activity
aws cloudwatch put-metric-alarm \
  --alarm-name github-actions-high-api-calls \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --metric-name CallCount \
  --namespace AWS/Usage \
  --period 300 \
  --statistic Sum \
  --threshold 1000
```

### 5. Limit Secret Scope

- Use environment secrets for production
- Use repository secrets only for dev/staging
- Never use organization secrets for sensitive data

### 6. Enable Secret Scanning

GitHub automatically scans for exposed secrets. Enable additional protection:

1. Go to **Settings** → **Code security and analysis**
2. Enable **Secret scanning**
3. Enable **Push protection**
4. Review and resolve any alerts

### 7. Audit Secret Access

```bash
# Review audit log
gh api /repos/OWNER/REPO/actions/secrets/audit

# Check who has access to secrets
gh api /repos/OWNER/REPO/collaborators
```

## Troubleshooting

### Secret Not Found Error

**Problem:** Workflow fails with "secret not found"

**Solution:**
```bash
# Verify secret exists
gh secret list

# Check secret name (case-sensitive)
# Correct: AWS_ACCESS_KEY_ID
# Wrong: aws_access_key_id

# Re-add secret if needed
gh secret set AWS_ACCESS_KEY_ID --body "your-key"
```

### Invalid AWS Credentials

**Problem:** Workflow fails with "InvalidClientTokenId"

**Solution:**
```bash
# Verify credentials locally
aws sts get-caller-identity \
  --profile github-actions

# Check IAM user exists
aws iam get-user --user-name github-actions-prod

# Verify access key is active
aws iam list-access-keys --user-name github-actions-prod

# Rotate access key if needed
aws iam create-access-key --user-name github-actions-prod
```

### Permission Denied Errors

**Problem:** Workflow fails with "AccessDenied" or "UnauthorizedOperation"

**Solution:**
```bash
# Check IAM policies
aws iam list-attached-user-policies --user-name github-actions-prod

# Simulate policy
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::ACCOUNT:user/github-actions-prod \
  --action-names cloudformation:CreateStack \
  --resource-arns "*"

# Add missing permissions
aws iam attach-user-policy \
  --user-name github-actions-prod \
  --policy-arn arn:aws:iam::aws:policy/PowerUserAccess
```

### Environment Secret Not Accessible

**Problem:** Workflow can't access environment secret

**Solution:**
1. Verify workflow specifies environment:
   ```yaml
   jobs:
     deploy:
       environment: production
   ```
2. Check environment exists in Settings → Environments
3. Verify secret is added to correct environment
4. Check environment protection rules

## Post-Configuration Steps

### 1. Test Deployment Workflows

```bash
# Test development deployment
git checkout develop
git commit --allow-empty -m "test: trigger dev deployment"
git push origin develop

# Test staging deployment
git checkout main
git commit --allow-empty -m "test: trigger staging deployment"
git push origin main

# Test production deployment (manual trigger)
gh workflow run deploy-prod.yml
```

### 2. Configure AWS Secrets Manager (Optional)

For MCP integrations, store secrets in AWS Secrets Manager:

```bash
# WhatsApp API Key
aws secretsmanager create-secret \
  --name fibonacci/mcp/whatsapp \
  --secret-string '{"apiKey":"your-whatsapp-api-key"}' \
  --region us-east-1

# Google Calendar credentials
aws secretsmanager create-secret \
  --name fibonacci/mcp/calendar \
  --secret-string '{"clientId":"your-client-id","clientSecret":"your-client-secret"}' \
  --region us-east-1

# Enable automatic rotation
aws secretsmanager rotate-secret \
  --secret-id fibonacci/mcp/whatsapp \
  --rotation-lambda-arn arn:aws:lambda:us-east-1:ACCOUNT:function:RotateSecret \
  --rotation-rules AutomaticallyAfterDays=30
```

### 3. Set Up Notifications

Configure Slack notifications for deployment events:

```bash
# Add Slack webhook to secrets
gh secret set SLACK_WEBHOOK_URL --body "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Test notification
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d '{"text":"Test notification from Fibonacci CI/CD"}'
```

### 4. Document Secrets

Create internal documentation:

```markdown
# Fibonacci AWS Secrets Inventory

## Production Secrets
- AWS_ACCESS_KEY_ID: IAM user `github-actions-prod`
- AWS_SECRET_ACCESS_KEY: Rotated every 90 days
- Last rotation: 2024-11-12
- Next rotation: 2025-02-10

## Staging Secrets
- AWS_ACCESS_KEY_ID: IAM user `github-actions-staging`
- AWS_SECRET_ACCESS_KEY: Rotated every 180 days

## Development Secrets
- AWS_ACCESS_KEY_ID: IAM user `github-actions-dev`
- AWS_SECRET_ACCESS_KEY: Rotated every 180 days

## MCP Integration Secrets
- Stored in AWS Secrets Manager
- Accessed by Lambda functions
- Rotated automatically every 30 days
```

## Checklist

Use this checklist to verify secrets configuration:

- [ ] AWS IAM users created for each environment
- [ ] IAM policies configured with least privilege
- [ ] Access keys generated and stored securely
- [ ] GitHub repository secrets configured
- [ ] GitHub environment secrets configured (if using)
- [ ] Environment protection rules set up for production
- [ ] Secrets tested with test workflow
- [ ] AWS credentials verified with `aws sts get-caller-identity`
- [ ] CloudTrail logging enabled for audit
- [ ] Secret rotation schedule documented
- [ ] MCP integration secrets configured (if needed)
- [ ] Slack notifications configured (if needed)
- [ ] Secrets inventory documented
- [ ] Team members trained on secret management
- [ ] Secret scanning enabled in repository

## Resources

### Documentation
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/)

### Internal Documentation
- [CI/CD Workflows](./CICD-WORKFLOWS.md)
- [AWS Setup Guide](../../SETUP.md)
- [Security Best Practices](../../SECURITY.md)

### Tools
- [GitHub CLI](https://cli.github.com/)
- [AWS CLI](https://aws.amazon.com/cli/)
- [git-secrets](https://github.com/awslabs/git-secrets)

## Support

For issues or questions:
1. Review this documentation
2. Check GitHub Actions logs
3. Verify AWS IAM permissions
4. Contact DevOps team
5. Create issue in repository

---

**Maintained by:** Alquimista.AI DevOps Team  
**Last Updated:** 2024-11-12  
**Version:** 1.0.0
