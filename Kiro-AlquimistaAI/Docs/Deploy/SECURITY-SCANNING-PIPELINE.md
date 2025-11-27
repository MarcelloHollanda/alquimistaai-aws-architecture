# Security Scanning Pipeline Implementation

## Overview

This document describes the comprehensive security scanning pipeline implemented for the Fibonacci AWS Setup project. The pipeline includes both dependency vulnerability scanning (npm audit) and infrastructure security validation (cdk-nag).

## Components

### 1. Enhanced Security Check Script

**Location**: `scripts/security-check.js`

**Features**:
- **npm audit**: Scans for known vulnerabilities in dependencies
- **cdk-nag**: Validates CDK infrastructure against AWS security best practices
- **Automated reporting**: Generates comprehensive security reports
- **Deployment blocking**: Prevents deployment when critical issues are found

**Usage**:
```bash
# Run full security scan (npm audit + cdk-nag)
npm run security:full

# Run only dependency scan
npm run security:check

# Run only CDK security validation
npm run cdk:nag
```

### 2. CDK-NAG Integration

**Package**: `cdk-nag@^2.28.195`

**Configuration**: 
- Enabled via context flag: `--context enableNag=true`
- Integrated into CDK app at `bin/app.ts`
- Uses AWS Solutions Checks ruleset

**Rules Checked**:
- IAM policies and permissions
- Encryption at rest and in transit
- Network security configurations
- Lambda runtime versions
- S3 bucket security
- CloudFront security
- API Gateway security
- Cognito security

### 3. GitHub Actions Integration

**Workflows Updated**:
- `test.yml`: Runs security scan on all pushes and PRs
- `deploy-dev.yml`: Blocks dev deployment if critical issues found
- `deploy-staging.yml`: Blocks staging deployment if critical issues found
- `security-scan.yml`: Enhanced with cdk-nag validation

**Security Gates**:
- **Critical vulnerabilities**: Block deployment immediately
- **Critical CDK-NAG issues**: Block deployment immediately
- **High vulnerabilities**: Allow with warnings
- **CDK-NAG warnings**: Allow with warnings

## Security Scan Process

### 1. Dependency Vulnerability Scanning

```bash
npm audit --json
```

**Severity Levels**:
- **Critical**: Blocks deployment
- **High**: Allows deployment with warnings
- **Moderate/Low**: Informational only

### 2. Infrastructure Security Validation

```bash
cdk synth --context enableNag=true
```

**Check Categories**:
- **Errors**: Block deployment (critical security issues)
- **Warnings**: Allow deployment (recommendations)

### 3. Report Generation

**Output**: `Docs/Deploy/SECURITY-SCAN-REPORT.md`

**Contents**:
- Vulnerability summary
- CDK-NAG findings
- Deployment status
- Remediation recommendations
- Next steps

## Common CDK-NAG Rules and Fixes

### AwsSolutions-IAM4: AWS Managed Policies
**Issue**: Using AWS managed policies instead of custom policies
**Fix**: Create specific IAM policies with minimal permissions

### AwsSolutions-IAM5: Wildcard Permissions
**Issue**: Using wildcard (*) in IAM policies
**Fix**: Specify exact resources and actions

### AwsSolutions-L1: Lambda Runtime
**Issue**: Using outdated Lambda runtime
**Fix**: Update to latest Node.js runtime (20.x)

### AwsSolutions-RDS2: RDS Encryption
**Issue**: RDS instance not encrypted
**Fix**: Enable encryption with KMS key

### AwsSolutions-S1: S3 Access Logging
**Issue**: S3 bucket without access logging
**Fix**: Enable server access logging

### AwsSolutions-S2: S3 Public Access
**Issue**: S3 bucket allows public access
**Fix**: Enable BlockPublicAccess

### AwsSolutions-CFR1: CloudFront HTTPS
**Issue**: CloudFront not enforcing HTTPS
**Fix**: Set ViewerProtocolPolicy to REDIRECT_TO_HTTPS

### AwsSolutions-CFR2: CloudFront WAF
**Issue**: CloudFront without WAF protection
**Fix**: Associate Web ACL with distribution

## Suppressing False Positives

If a CDK-NAG finding is a false positive, you can suppress it:

```typescript
import { NagSuppressions } from 'cdk-nag';

// Suppress specific rule for a construct
NagSuppressions.addResourceSuppressions(myConstruct, [
  {
    id: 'AwsSolutions-IAM4',
    reason: 'This managed policy is required for service integration'
  }
]);

// Suppress rule for entire stack
NagSuppressions.addStackSuppressions(this, [
  {
    id: 'AwsSolutions-L1',
    reason: 'Lambda runtime is managed by CDK and will be updated automatically'
  }
]);
```

## Deployment Blocking Logic

### Critical Issues (Block Deployment)
- npm audit: Critical vulnerabilities
- cdk-nag: Error-level findings

### Warning Issues (Allow with Warnings)
- npm audit: High vulnerabilities
- cdk-nag: Warning-level findings

### Informational Issues (Allow)
- npm audit: Moderate/Low vulnerabilities
- cdk-nag: Info-level findings

## Automated Remediation

### Dependency Vulnerabilities
```bash
# Automatic fixes
npm audit fix

# Force fixes (may introduce breaking changes)
npm audit fix --force
```

### CDK Security Issues
1. Review findings in security report
2. Update CDK code to address issues
3. Add suppressions for false positives
4. Re-run security scan

## Monitoring and Alerts

### GitHub Actions
- Security scan runs on every push/PR
- Blocks deployment if critical issues found
- Comments on PRs with security status

### Scheduled Scans
- Daily security scan at 2 AM UTC
- Dependency review on PRs
- Automated Dependabot updates

## Best Practices

### Development
1. Run `npm run security:full` before committing
2. Fix critical vulnerabilities immediately
3. Address high vulnerabilities in next sprint
4. Review CDK-NAG findings regularly

### CI/CD
1. Never bypass security gates in production
2. Use suppressions sparingly and with justification
3. Keep dependencies updated
4. Monitor security reports regularly

### Infrastructure
1. Follow AWS security best practices
2. Use least privilege principle for IAM
3. Enable encryption everywhere
4. Implement defense in depth

## Troubleshooting

### CDK-NAG Fails to Run
```bash
# Install cdk-nag if missing
npm install --save-dev cdk-nag

# Check CDK version compatibility
npm list aws-cdk-lib cdk-nag
```

### False Positive Findings
1. Review the finding carefully
2. Confirm it's actually a false positive
3. Add suppression with clear justification
4. Document the decision

### Performance Issues
- CDK-NAG adds ~30-60 seconds to synth time
- Consider running only on staging/prod deployments
- Use parallel jobs in CI/CD when possible

## Resources

- [cdk-nag Documentation](https://github.com/cdklabs/cdk-nag)
- [AWS Security Best Practices](https://docs.aws.amazon.com/security/)
- [npm audit Documentation](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [GitHub Dependabot](https://docs.github.com/en/code-security/dependabot)
- [OWASP Dependency Check](https://owasp.org/www-project-dependency-check/)

---

*This document is part of the Fibonacci AWS Setup security implementation.*