# GitHub Configuration

This directory contains GitHub-specific configuration files for CI/CD, security scanning, and automated dependency management.

## Contents

### workflows/
Contains GitHub Actions workflow definitions.

#### test.yml
Automated testing workflow that runs on all branches and pull requests.

**Triggers:**
- Push to any branch
- Pull requests to any branch

**Jobs:**
1. **test** - Runs linter, tests, build, and coverage

**Features:**
- Node.js 20.x with npm caching
- Linting with ESLint
- Unit and integration tests
- Code coverage reporting
- Coverage artifacts (30-day retention)
- PR comments with coverage summary

#### deploy-dev.yml
Automated deployment to development environment.

**Triggers:**
- Push to `develop` branch

**Jobs:**
1. **test** - Runs full test suite
2. **deploy** - Deploys to AWS development environment

**Features:**
- Automatic deployment on merge to develop
- CDK deployment with `--context env=dev`
- Smoke tests (health checks)
- Deployment notifications

#### deploy-staging.yml
Automated deployment to staging environment.

**Triggers:**
- Push to `main` branch

**Jobs:**
1. **test** - Runs tests and security scan
2. **deploy** - Deploys to AWS staging environment

**Features:**
- Automatic deployment on merge to main
- Security scanning before deployment
- CDK deployment with `--context env=staging`
- Comprehensive smoke tests
- CloudWatch alarms verification
- Deployment summary

#### deploy-prod.yml
Manual deployment to production environment with approval workflow.

**Triggers:**
- Manual dispatch only (`workflow_dispatch`)

**Jobs:**
1. **test** - Runs tests and security scan
2. **deploy** - Deploys to AWS production environment (requires approval)

**Features:**
- Manual trigger only
- Required reviewers (2+)
- Wait timer (5 minutes)
- Branch restrictions (main only)
- Comprehensive health checks
- Automatic rollback on failure
- Detailed deployment summary

#### security-scan.yml
Automated security vulnerability scanning workflow.

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Daily at 2 AM UTC (scheduled)
- Manual dispatch

**Jobs:**
1. **security-scan** - Runs npm audit and security checks
2. **dependency-review** - Reviews dependency changes in PRs

**Features:**
- Blocks deployment on critical vulnerabilities
- Posts security status as PR comments
- Uploads audit reports as artifacts (30-day retention)
- Checks license compliance

### dependabot.yml
Dependabot configuration for automatic dependency updates.

**Schedule:** Weekly on Mondays at 9 AM BRT

**Update Groups:**
- `aws-sdk` - AWS SDK packages
- `powertools` - AWS Lambda Powertools
- `dev-dependencies` - Development tools
- `typescript` - TypeScript and type definitions

**Features:**
- Automatic PR creation
- Grouped updates for easier review
- Conventional commit messages
- Security labels and reviewers
- Auto-rebase strategy

## Usage

### Configuring GitHub Secrets

Before using CI/CD workflows, configure required secrets:

```bash
# Install GitHub CLI
brew install gh  # macOS
winget install GitHub.cli  # Windows

# Authenticate
gh auth login

# Add AWS credentials (required)
gh secret set AWS_ACCESS_KEY_ID --body "YOUR_ACCESS_KEY"
gh secret set AWS_SECRET_ACCESS_KEY --body "YOUR_SECRET_KEY"

# Or add to specific environment (recommended)
gh secret set AWS_ACCESS_KEY_ID --env production --body "YOUR_KEY"
gh secret set AWS_SECRET_ACCESS_KEY --env production --body "YOUR_SECRET"

# Verify secrets
gh secret list
gh secret list --env production
```

**See:** [GitHub Secrets Configuration Guide](../Docs/Deploy/GITHUB-SECRETS-CONFIGURATION.md)

### Running Tests Locally

```bash
# Run all tests
npm test

# Run linter
npm run lint

# Run build
npm run build

# Generate coverage
npm test -- --coverage
```

### Running Security Scans Locally

```bash
# Run security check
npm run security:check

# Run npm audit
npm run audit

# Fix vulnerabilities
npm run audit:fix
```

### Deploying to Environments

```bash
# Deploy to development (automatic on push to develop)
git checkout develop
git push origin develop

# Deploy to staging (automatic on push to main)
git checkout main
git push origin main

# Deploy to production (manual trigger)
gh workflow run deploy-prod.yml

# Check deployment status
gh run list --workflow=deploy-prod.yml
gh run view --log
```

### Triggering Workflows Manually

1. Go to repository Actions tab
2. Select "Security Scan" workflow
3. Click "Run workflow"
4. Select branch and run

### Reviewing Dependabot PRs

1. Check PRs labeled with `dependencies` and `security`
2. Review changelog and breaking changes
3. Verify CI/CD passes
4. Merge if tests pass

### Viewing Security Reports

1. Go to Actions tab
2. Select a workflow run
3. Download artifacts
4. Review `SECURITY-SCAN-REPORT.md`

## Configuration

### Modifying Security Scan

Edit `.github/workflows/security-scan.yml`:

```yaml
# Change schedule
schedule:
  - cron: '0 2 * * *'  # Daily at 2 AM UTC

# Change severity threshold
run: npm audit --audit-level=critical

# Change artifact retention
retention-days: 30
```

### Modifying Dependabot

Edit `.github/dependabot.yml`:

```yaml
# Change schedule
schedule:
  interval: "weekly"
  day: "monday"
  time: "09:00"

# Change PR limit
open-pull-requests-limit: 10

# Add/remove update groups
groups:
  my-group:
    patterns:
      - "package-*"
```

## Best Practices

### Security Scanning

1. ✅ Always run security check before committing
2. ✅ Fix critical vulnerabilities immediately
3. ✅ Review security scan results in PRs
4. ✅ Keep dependencies up to date
5. ✅ Document security decisions

### Dependabot

1. ✅ Review PRs promptly (within 1 week)
2. ✅ Test changes thoroughly
3. ✅ Merge minor/patch updates quickly
4. ✅ Review major updates carefully
5. ✅ Keep Dependabot configuration updated

### CI/CD

1. ✅ Never bypass security checks
2. ✅ Review workflow logs regularly
3. ✅ Keep workflows up to date
4. ✅ Monitor workflow failures
5. ✅ Document workflow changes

## Troubleshooting

### Security Scan Fails

**Problem:** Workflow fails with security errors

**Solution:**
```bash
# Run locally to debug
npm run security:check

# Fix vulnerabilities
npm audit fix

# Commit and push
git add package-lock.json
git commit -m "fix: resolve security vulnerabilities"
git push
```

### Dependabot PRs Conflict

**Problem:** Dependabot PR has merge conflicts

**Solution:**
```bash
# Comment on PR to trigger rebase
@dependabot rebase

# Or close and reopen PR
@dependabot recreate
```

### Workflow Not Triggering

**Problem:** Workflow doesn't run on push/PR

**Solution:**
1. Check workflow file syntax (YAML)
2. Verify branch names in triggers
3. Check repository settings → Actions
4. Review workflow permissions

## Resources

### Documentation
- [GitHub Actions](https://docs.github.com/en/actions)
- [Dependabot](https://docs.github.com/en/code-security/dependabot)
- [Dependency Review](https://github.com/actions/dependency-review-action)
- [AWS CDK](https://docs.aws.amazon.com/cdk/)

### CI/CD Documentation
- [GitHub Secrets Configuration](../Docs/Deploy/GITHUB-SECRETS-CONFIGURATION.md)
- [GitHub Secrets Quick Reference](../Docs/Deploy/GITHUB-SECRETS-QUICK-REFERENCE.md)
- [Task 38 Checklist](../Docs/Deploy/TASK-38-CHECKLIST.md)
- [Task 38 Implementation Summary](../Docs/Deploy/TASK-38-IMPLEMENTATION-SUMMARY.md)

### Security Documentation
- [Security Scanning Guide](../Docs/Deploy/SECURITY-SCANNING.md)
- [Security Scanning Quick Reference](../Docs/Deploy/SECURITY-SCANNING-QUICK-REFERENCE.md)
- [Task 37 Implementation Summary](../Docs/Deploy/TASK-37-IMPLEMENTATION-SUMMARY.md)

## Support

For issues or questions:
1. Review documentation
2. Check GitHub Actions logs
3. Review Dependabot logs in Settings
4. Contact DevOps team
5. Create issue in repository

---

**Maintained by:** Alquimista.AI DevOps Team
**Last Updated:** 2024-11-12
