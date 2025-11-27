# GitHub Secrets Setup - Quick Start

## 🚀 Quick Setup (5 Minutes)

### Prerequisites
- GitHub repository access (admin)
- AWS account with IAM permissions
- GitHub CLI installed (optional but recommended)

### Step 1: Create AWS IAM User

```bash
# Create IAM user for GitHub Actions
aws iam create-user --user-name github-actions-prod

# Attach policy (adjust based on your needs)
aws iam attach-user-policy \
  --user-name github-actions-prod \
  --policy-arn arn:aws:iam::aws:policy/PowerUserAccess

# Generate access key
aws iam create-access-key --user-name github-actions-prod
```

**Save the output:**
- `AccessKeyId` → This is your `AWS_ACCESS_KEY_ID`
- `SecretAccessKey` → This is your `AWS_SECRET_ACCESS_KEY`

### Step 2: Add Secrets to GitHub

#### Option A: Using GitHub CLI (Recommended)

```bash
# Install GitHub CLI
brew install gh  # macOS
winget install GitHub.cli  # Windows

# Authenticate
gh auth login

# Add secrets
gh secret set AWS_ACCESS_KEY_ID --body "AKIAIOSFODNN7EXAMPLE"
gh secret set AWS_SECRET_ACCESS_KEY --body "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"

# Verify
gh secret list
```

#### Option B: Using GitHub Web UI

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add `AWS_ACCESS_KEY_ID` with your access key
5. Add `AWS_SECRET_ACCESS_KEY` with your secret key

### Step 3: Test the Setup

```bash
# Trigger a test deployment
git checkout develop
git commit --allow-empty -m "test: verify secrets configuration"
git push origin develop

# Check workflow status
gh run list --workflow=deploy-dev.yml
```

## ✅ That's It!

Your CI/CD pipeline is now configured and ready to use.

---

## 📚 Need More Details?

### Full Documentation
- **[Complete Configuration Guide](./GITHUB-SECRETS-CONFIGURATION.md)** - Comprehensive setup instructions
- **[Quick Reference](./GITHUB-SECRETS-QUICK-REFERENCE.md)** - Command cheat sheet
- **[Implementation Checklist](./TASK-38-CHECKLIST.md)** - Step-by-step checklist

### Environment-Specific Setup

For production environments, use environment secrets with approval workflows:

```bash
# Create production environment secret
gh secret set AWS_ACCESS_KEY_ID --env production --body "YOUR_KEY"
gh secret set AWS_SECRET_ACCESS_KEY --env production --body "YOUR_SECRET"
```

Then configure protection rules in GitHub:
1. Go to **Settings** → **Environments** → **production**
2. Enable **Required reviewers** (add 2+ reviewers)
3. Set **Wait timer** (e.g., 5 minutes)
4. Restrict to **main** branch only

### Optional Secrets

#### MCP Integrations
```bash
gh secret set WHATSAPP_API_KEY --body "your-whatsapp-key"
gh secret set GOOGLE_CALENDAR_CLIENT_ID --body "your-client-id"
gh secret set GOOGLE_CALENDAR_CLIENT_SECRET --body "your-client-secret"
```

#### Slack Notifications
```bash
gh secret set SLACK_WEBHOOK_URL --body "https://hooks.slack.com/services/YOUR/WEBHOOK"
gh secret set SLACK_CHANNEL --body "#deployments"
```

---

## 🔒 Security Best Practices

1. **Use separate IAM users per environment**
   - `github-actions-dev` for development
   - `github-actions-staging` for staging
   - `github-actions-prod` for production

2. **Enable MFA for production IAM user**
   ```bash
   aws iam enable-mfa-device --user-name github-actions-prod \
     --serial-number arn:aws:iam::ACCOUNT:mfa/github-actions-prod \
     --authentication-code1 123456 --authentication-code2 789012
   ```

3. **Rotate keys regularly** (every 90 days for production)

4. **Use environment secrets for production** (not repository secrets)

5. **Enable secret scanning** in repository settings

---

## 🐛 Troubleshooting

### "Secret not found" error
```bash
# Verify secret exists (case-sensitive!)
gh secret list

# Re-add if needed
gh secret set AWS_ACCESS_KEY_ID --body "YOUR_KEY"
```

### "Invalid credentials" error
```bash
# Test credentials locally
aws sts get-caller-identity

# Check IAM user
aws iam get-user --user-name github-actions-prod

# Verify access key is active
aws iam list-access-keys --user-name github-actions-prod
```

### "Permission denied" error
```bash
# Check IAM policies
aws iam list-attached-user-policies --user-name github-actions-prod

# Simulate required action
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::ACCOUNT:user/github-actions-prod \
  --action-names cloudformation:CreateStack
```

---

## 📞 Support

- **Documentation Issues:** Create an issue in the repository
- **AWS IAM Questions:** Check [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- **GitHub Actions Help:** See [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

**Quick Links:**
- [Full Configuration Guide](./GITHUB-SECRETS-CONFIGURATION.md)
- [Quick Reference](./GITHUB-SECRETS-QUICK-REFERENCE.md)
- [Implementation Checklist](./TASK-38-CHECKLIST.md)
- [CI/CD Implementation Summary](./TASK-38-IMPLEMENTATION-SUMMARY.md)

**Last Updated:** 2024-11-12
