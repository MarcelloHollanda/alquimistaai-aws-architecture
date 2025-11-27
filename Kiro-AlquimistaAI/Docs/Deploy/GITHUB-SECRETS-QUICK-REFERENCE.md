# GitHub Secrets Quick Reference

## Required Secrets

### AWS Credentials (Required)
```bash
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

### MCP Integrations (Optional)
```bash
WHATSAPP_API_KEY=your-whatsapp-api-key
GOOGLE_CALENDAR_CLIENT_ID=your-google-client-id
GOOGLE_CALENDAR_CLIENT_SECRET=your-google-client-secret
```

### Notifications (Optional)
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_CHANNEL=#deployments
```

## Quick Setup Commands

### Using GitHub CLI

```bash
# Install GitHub CLI
brew install gh  # macOS
winget install GitHub.cli  # Windows

# Authenticate
gh auth login

# Add AWS secrets
gh secret set AWS_ACCESS_KEY_ID --body "YOUR_ACCESS_KEY"
gh secret set AWS_SECRET_ACCESS_KEY --body "YOUR_SECRET_KEY"

# Add to specific environment
gh secret set AWS_ACCESS_KEY_ID --env production --body "YOUR_ACCESS_KEY"
gh secret set AWS_SECRET_ACCESS_KEY --env production --body "YOUR_SECRET_KEY"

# List secrets
gh secret list
gh secret list --env production
```

### Create IAM User

```bash
# Create user
aws iam create-user --user-name github-actions-prod

# Attach policy
aws iam attach-user-policy \
  --user-name github-actions-prod \
  --policy-arn arn:aws:iam::aws:policy/PowerUserAccess

# Create access key
aws iam create-access-key --user-name github-actions-prod
```

## Verification

### Test Secrets

```bash
# Trigger test workflow
gh workflow run test-secrets.yml

# Check status
gh run list --workflow=test-secrets.yml

# View logs
gh run view --log
```

### Verify AWS Access

```bash
# Test credentials
aws sts get-caller-identity

# List IAM user
aws iam get-user --user-name github-actions-prod

# Check policies
aws iam list-attached-user-policies --user-name github-actions-prod
```

## Common Issues

### Secret Not Found
```bash
# Check secret exists (case-sensitive!)
gh secret list

# Re-add if needed
gh secret set AWS_ACCESS_KEY_ID --body "YOUR_KEY"
```

### Invalid Credentials
```bash
# Verify locally
aws sts get-caller-identity

# Check access key status
aws iam list-access-keys --user-name github-actions-prod

# Create new key if needed
aws iam create-access-key --user-name github-actions-prod
```

### Permission Denied
```bash
# Check policies
aws iam list-attached-user-policies --user-name github-actions-prod

# Simulate action
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::ACCOUNT:user/github-actions-prod \
  --action-names cloudformation:CreateStack
```

## Security Checklist

- [ ] Separate IAM users per environment
- [ ] Least privilege IAM policies
- [ ] Environment secrets for production
- [ ] MFA enabled for production IAM user
- [ ] CloudTrail logging enabled
- [ ] Secret rotation schedule (90 days)
- [ ] Secret scanning enabled
- [ ] Push protection enabled
- [ ] Secrets documented internally

## Environments Setup

### Development
```yaml
environment: development
secrets:
  - AWS_ACCESS_KEY_ID (dev IAM user)
  - AWS_SECRET_ACCESS_KEY (dev IAM user)
protection: None
```

### Staging
```yaml
environment: staging
secrets:
  - AWS_ACCESS_KEY_ID (staging IAM user)
  - AWS_SECRET_ACCESS_KEY (staging IAM user)
protection: Optional reviewers
```

### Production
```yaml
environment: production
secrets:
  - AWS_ACCESS_KEY_ID (prod IAM user with MFA)
  - AWS_SECRET_ACCESS_KEY (prod IAM user with MFA)
protection:
  - Required reviewers (2+)
  - Wait timer (5 minutes)
  - Deployment branches (main only)
```

## Rotation Schedule

| Secret | Environment | Frequency | Last Rotation | Next Rotation |
|--------|-------------|-----------|---------------|---------------|
| AWS Keys | Production | 90 days | 2024-11-12 | 2025-02-10 |
| AWS Keys | Staging | 180 days | 2024-11-12 | 2025-05-11 |
| AWS Keys | Development | 180 days | 2024-11-12 | 2025-05-11 |
| MCP Secrets | All | 30 days | Auto | Auto |

## Resources

- [Full Documentation](./GITHUB-SECRETS-CONFIGURATION.md)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

---

**Quick Help:** For detailed instructions, see [GITHUB-SECRETS-CONFIGURATION.md](./GITHUB-SECRETS-CONFIGURATION.md)
