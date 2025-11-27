# Security Scanning Quick Reference

## 🚀 Quick Commands

```bash
# Full security scan (recommended)
npm run security:full

# Dependency vulnerabilities only
npm run security:check

# CDK infrastructure security only
npm run cdk:nag

# Fix dependency vulnerabilities
npm audit fix
```

## 🚦 Security Gates

| Issue Type | Severity | Action |
|------------|----------|---------|
| npm audit | Critical | ❌ **BLOCKS DEPLOYMENT** |
| npm audit | High | ⚠️ Allows with warnings |
| npm audit | Moderate/Low | ✅ Informational only |
| cdk-nag | Error | ❌ **BLOCKS DEPLOYMENT** |
| cdk-nag | Warning | ⚠️ Allows with warnings |

## 🔧 Common Fixes

### Dependency Vulnerabilities
```bash
# Try automatic fix first
npm audit fix

# If automatic fix fails
npm audit fix --force
# ⚠️ Review breaking changes!

# Check what will be fixed
npm audit fix --dry-run
```

### CDK Security Issues

**IAM Wildcard Permissions (AwsSolutions-IAM5)**
```typescript
// ❌ Bad
new PolicyStatement({
  actions: ['s3:*'],
  resources: ['*']
});

// ✅ Good
new PolicyStatement({
  actions: ['s3:GetObject', 's3:PutObject'],
  resources: ['arn:aws:s3:::my-bucket/*']
});
```

**Lambda Runtime (AwsSolutions-L1)**
```typescript
// ✅ Always use latest runtime
new NodejsFunction(this, 'MyFunction', {
  runtime: Runtime.NODEJS_20_X  // Latest
});
```

**S3 Public Access (AwsSolutions-S2)**
```typescript
// ✅ Block public access
new Bucket(this, 'MyBucket', {
  blockPublicAccess: BlockPublicAccess.BLOCK_ALL
});
```

## 🚨 Emergency Procedures

### Critical Vulnerability Found
1. **DO NOT DEPLOY** to production
2. Run `npm audit fix`
3. Test thoroughly
4. Re-run `npm run security:full`
5. Deploy after scan passes

### CDK Security Issue
1. Review finding in security report
2. Fix the security issue OR
3. Add suppression with justification:
```typescript
NagSuppressions.addResourceSuppressions(construct, [{
  id: 'AwsSolutions-IAM4',
  reason: 'Service requires this managed policy'
}]);
```

## 📊 Reading Security Reports

**Location**: `Docs/Deploy/SECURITY-SCAN-REPORT.md`

**Key Sections**:
- **Summary**: Overview of all findings
- **Overall Status**: Deployment allowed/blocked
- **Detailed Findings**: Specific issues and fixes
- **Next Steps**: What to do next

## 🔄 CI/CD Integration

**Workflows with Security Scanning**:
- `test.yml`: Every push/PR
- `deploy-dev.yml`: Dev deployments
- `deploy-staging.yml`: Staging deployments
- `security-scan.yml`: Scheduled daily

**Bypass Security (Emergency Only)**:
```yaml
# In workflow file - USE SPARINGLY!
- name: Run security scan
  run: npm run security:full
  continue-on-error: true  # ⚠️ Allows deployment even with critical issues
```

## 🛠️ Troubleshooting

### "cdk-nag not found"
```bash
npm install --save-dev cdk-nag
```

### "CDK synth fails"
```bash
# Check CDK version
npm list aws-cdk-lib

# Update if needed
npm update aws-cdk-lib
```

### "Too many false positives"
- Review each finding carefully
- Add suppressions only for genuine false positives
- Document why each suppression is needed

## 📈 Best Practices

### Before Committing
```bash
# Always run before commit
npm run security:full

# Fix any critical issues
npm audit fix

# Commit and push
git add .
git commit -m "fix: resolve security vulnerabilities"
```

### Regular Maintenance
- Review security reports weekly
- Update dependencies monthly
- Address high-severity issues promptly
- Keep CDK and cdk-nag updated

### Production Deployments
- Never bypass security gates
- Double-check all suppressions
- Monitor for new vulnerabilities
- Have rollback plan ready

## 📞 Getting Help

1. **Check the full documentation**: `Docs/Deploy/SECURITY-SCANNING-PIPELINE.md`
2. **Review security report**: `Docs/Deploy/SECURITY-SCAN-REPORT.md`
3. **Check CDK-NAG docs**: https://github.com/cdklabs/cdk-nag
4. **AWS Security Best Practices**: https://docs.aws.amazon.com/security/

---

*Keep this reference handy for quick security scanning operations!*