#!/usr/bin/env node

/**
 * Security Check Script
 * 
 * Executes npm audit and checks for critical/high vulnerabilities
 * Blocks deployment if critical vulnerabilities are found
 * 
 * Usage:
 *   node scripts/security-check.js
 *   npm run security:check
 * 
 * Exit codes:
 *   0 - No critical vulnerabilities found
 *   1 - Critical vulnerabilities found (blocks deployment)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bold');
  console.log('='.repeat(60) + '\n');
}

async function runAudit() {
  logSection('🔍 Running npm audit...');
  
  try {
    // Run npm audit and capture output
    const auditOutput = execSync('npm audit --json', { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    const auditData = JSON.parse(auditOutput);
    return auditData;
    
  } catch (error) {
    // npm audit returns non-zero exit code when vulnerabilities are found
    if (error.stdout) {
      try {
        const auditData = JSON.parse(error.stdout);
        return auditData;
      } catch (parseError) {
        log('❌ Failed to parse npm audit output', 'red');
        console.error(error.stdout);
        process.exit(1);
      }
    }
    throw error;
  }
}

async function runCdkNag() {
  logSection('🔧 Running CDK-NAG security validation...');
  
  try {
    log('Synthesizing CDK with security checks...', 'cyan');
    
    // Run cdk synth with nag enabled
    const nagOutput = execSync('npm run cdk:nag', { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    log('✅ CDK-NAG validation passed', 'green');
    return { passed: true, output: nagOutput };
    
  } catch (error) {
    log('❌ CDK-NAG validation failed', 'red');
    
    // Parse the error output to extract NAG findings
    const errorOutput = error.stderr || error.stdout || '';
    const nagFindings = parseCdkNagOutput(errorOutput);
    
    if (nagFindings.length > 0) {
      log('\n🔍 CDK-NAG Findings:', 'yellow');
      nagFindings.forEach((finding, index) => {
        log(`\n${index + 1}. ${finding.rule}`, 'red');
        log(`   Resource: ${finding.resource}`, 'yellow');
        log(`   Message: ${finding.message}`, 'reset');
        if (finding.suggestion) {
          log(`   Suggestion: ${finding.suggestion}`, 'cyan');
        }
      });
    }
    
    return { 
      passed: false, 
      output: errorOutput,
      findings: nagFindings,
      criticalCount: nagFindings.filter(f => f.severity === 'error').length
    };
  }
}

function parseCdkNagOutput(output) {
  const findings = [];
  const lines = output.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Look for NAG error patterns
    if (line.includes('[Error]') || line.includes('[Warning]')) {
      const severity = line.includes('[Error]') ? 'error' : 'warning';
      
      // Extract rule name (e.g., AwsSolutions-IAM4)
      const ruleMatch = line.match(/AwsSolutions-[A-Z0-9]+/);
      const rule = ruleMatch ? ruleMatch[0] : 'Unknown';
      
      // Extract resource path
      const resourceMatch = line.match(/at (.+?) \(/);
      const resource = resourceMatch ? resourceMatch[1] : 'Unknown resource';
      
      // Get the message (usually on the next line)
      let message = line.split('] ')[1] || '';
      if (!message && i + 1 < lines.length) {
        message = lines[i + 1].trim();
      }
      
      findings.push({
        severity,
        rule,
        resource,
        message,
        suggestion: getSuggestionForRule(rule)
      });
    }
  }
  
  return findings;
}

function getSuggestionForRule(rule) {
  const suggestions = {
    'AwsSolutions-IAM4': 'Use specific IAM policies instead of AWS managed policies',
    'AwsSolutions-IAM5': 'Avoid wildcard permissions in IAM policies',
    'AwsSolutions-L1': 'Use the latest runtime version for Lambda functions',
    'AwsSolutions-RDS2': 'Enable encryption for RDS instances',
    'AwsSolutions-S1': 'Enable server access logging for S3 buckets',
    'AwsSolutions-S2': 'Enable public read/write block for S3 buckets',
    'AwsSolutions-CFR1': 'Use HTTPS viewer protocol policy for CloudFront',
    'AwsSolutions-CFR2': 'Enable WAF for CloudFront distributions',
    'AwsSolutions-APIG2': 'Enable request validation for API Gateway',
    'AwsSolutions-APIG3': 'Enable WAF for API Gateway',
    'AwsSolutions-COG2': 'Enable MFA for Cognito User Pools'
  };
  
  return suggestions[rule] || 'Review AWS security best practices for this resource';
}

function analyzeVulnerabilities(auditData) {
  logSection('📊 Vulnerability Analysis');
  
  const metadata = auditData.metadata || {};
  const vulnerabilities = metadata.vulnerabilities || {};
  
  const critical = vulnerabilities.critical || 0;
  const high = vulnerabilities.high || 0;
  const moderate = vulnerabilities.moderate || 0;
  const low = vulnerabilities.low || 0;
  const info = vulnerabilities.info || 0;
  
  const total = critical + high + moderate + low + info;
  
  console.log(`Total vulnerabilities found: ${total}`);
  console.log('');
  
  if (critical > 0) {
    log(`  🔴 Critical: ${critical}`, 'red');
  } else {
    log(`  ✅ Critical: 0`, 'green');
  }
  
  if (high > 0) {
    log(`  🟠 High: ${high}`, 'yellow');
  } else {
    log(`  ✅ High: 0`, 'green');
  }
  
  if (moderate > 0) {
    log(`  🟡 Moderate: ${moderate}`, 'yellow');
  }
  
  if (low > 0) {
    log(`  🔵 Low: ${low}`, 'blue');
  }
  
  if (info > 0) {
    log(`  ℹ️  Info: ${info}`, 'cyan');
  }
  
  console.log('');
  
  return { critical, high, moderate, low, info, total };
}

function displayVulnerabilityDetails(auditData) {
  if (!auditData.vulnerabilities) {
    return;
  }
  
  logSection('🔎 Vulnerability Details');
  
  const vulns = Object.entries(auditData.vulnerabilities)
    .filter(([_, vuln]) => vuln.severity === 'critical' || vuln.severity === 'high')
    .slice(0, 10); // Show first 10 critical/high vulnerabilities
  
  if (vulns.length === 0) {
    log('No critical or high vulnerabilities to display', 'green');
    return;
  }
  
  vulns.forEach(([name, vuln]) => {
    const severity = vuln.severity.toUpperCase();
    const color = vuln.severity === 'critical' ? 'red' : 'yellow';
    
    log(`\n📦 Package: ${name}`, 'bold');
    log(`   Severity: ${severity}`, color);
    log(`   Via: ${vuln.via.map(v => typeof v === 'string' ? v : v.name).join(', ')}`);
    
    if (vuln.fixAvailable) {
      log(`   ✅ Fix available: ${typeof vuln.fixAvailable === 'object' ? vuln.fixAvailable.name : 'Yes'}`, 'green');
    } else {
      log(`   ⚠️  No fix available yet`, 'yellow');
    }
  });
  
  if (Object.keys(auditData.vulnerabilities).length > 10) {
    console.log(`\n... and ${Object.keys(auditData.vulnerabilities).length - 10} more vulnerabilities`);
  }
}

function generateReport(auditData, auditStats, nagResult) {
  logSection('📝 Generating Security Report');
  
  const reportDir = path.join(__dirname, '..', 'Docs', 'Deploy');
  const reportPath = path.join(reportDir, 'SECURITY-SCAN-REPORT.md');
  
  const timestamp = new Date().toISOString();
  
  const hasCriticalVulns = auditStats.critical > 0;
  const hasCriticalNagIssues = nagResult && !nagResult.passed && nagResult.criticalCount > 0;
  const deploymentBlocked = hasCriticalVulns || hasCriticalNagIssues;
  
  const report = `# Security Scan Report

**Generated:** ${timestamp}

## Summary

### Dependency Vulnerabilities (npm audit)
- **Total Vulnerabilities:** ${auditStats.total}
- **Critical:** ${auditStats.critical}
- **High:** ${auditStats.high}
- **Moderate:** ${auditStats.moderate}
- **Low:** ${auditStats.low}
- **Info:** ${auditStats.info}

### CDK Security Validation (cdk-nag)
- **Status:** ${nagResult ? (nagResult.passed ? '✅ Passed' : '❌ Failed') : '⚠️ Skipped'}
${nagResult && !nagResult.passed ? `- **Critical Issues:** ${nagResult.criticalCount || 0}
- **Total Findings:** ${nagResult.findings ? nagResult.findings.length : 0}` : ''}

## Overall Status

${deploymentBlocked ? '❌ **DEPLOYMENT BLOCKED** - Critical security issues found' : '✅ **DEPLOYMENT ALLOWED** - No critical security issues'}

## Detailed Findings

### Dependency Vulnerabilities

${auditStats.critical > 0 ? `
#### Critical Vulnerabilities Detected

Critical vulnerabilities must be resolved before deployment to production.

**Actions:**
1. Run \`npm audit fix\` to automatically fix vulnerabilities
2. If automatic fix is not available, manually update affected packages
3. Review breaking changes in updated packages
4. Re-run security scan after fixes
` : ''}

${auditStats.high > 0 ? `
#### High Severity Vulnerabilities

High severity vulnerabilities should be addressed as soon as possible.

**Actions:**
1. Review high severity vulnerabilities
2. Plan updates for affected packages
3. Test thoroughly after updates
` : ''}

${auditStats.moderate > 0 || auditStats.low > 0 ? `
#### Moderate/Low Severity Vulnerabilities

These vulnerabilities should be addressed in regular maintenance cycles.
` : ''}

### CDK Security Validation

${nagResult && !nagResult.passed ? `
#### CDK-NAG Security Issues

${nagResult.criticalCount > 0 ? `
**Critical Issues Found:** ${nagResult.criticalCount}

These issues must be resolved before deployment:

${nagResult.findings.filter(f => f.severity === 'error').map(f => `
- **${f.rule}**: ${f.message}
  - Resource: ${f.resource}
  - Suggestion: ${f.suggestion}
`).join('')}
` : ''}

${nagResult.findings.filter(f => f.severity === 'warning').length > 0 ? `
**Warnings Found:** ${nagResult.findings.filter(f => f.severity === 'warning').length}

Consider addressing these warnings for better security posture:

${nagResult.findings.filter(f => f.severity === 'warning').slice(0, 5).map(f => `
- **${f.rule}**: ${f.message}
  - Resource: ${f.resource}
  - Suggestion: ${f.suggestion}
`).join('')}
` : ''}

**Actions:**
1. Review the CDK-NAG findings above
2. Fix security issues in your CDK code
3. Or add suppressions with justification if issues are false positives
4. Re-run: \`npm run security:full\`
` : nagResult && nagResult.passed ? `
✅ All CDK security checks passed. Your infrastructure follows AWS security best practices.
` : `
⚠️ CDK-NAG validation was skipped. Run \`npm run cdk:nag\` to validate your infrastructure security.
`}

## Next Steps

### For Dependency Issues
1. Review the full audit report: \`npm audit\`
2. Fix vulnerabilities: \`npm audit fix\`
3. For manual fixes: \`npm audit fix --force\` (review breaking changes)
4. Re-run security scan: \`npm run security:check\`

### For CDK Security Issues
1. Review CDK-NAG findings: \`npm run cdk:nag\`
2. Fix security issues in your CDK constructs
3. Add suppressions for false positives with proper justification
4. Re-run full security scan: \`npm run security:full\`

## Automated Scanning

This project uses:
- **npm audit** - Scans for known vulnerabilities in dependencies
- **cdk-nag** - Validates CDK infrastructure against AWS security best practices
- **Dependabot** - Automatically creates PRs for dependency updates
- **GitHub Actions** - Runs security scans on every push and PR

## Resources

- [npm audit documentation](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [cdk-nag documentation](https://github.com/cdklabs/cdk-nag)
- [AWS Security Best Practices](https://docs.aws.amazon.com/security/)
- [GitHub Dependabot](https://docs.github.com/en/code-security/dependabot)
- [OWASP Dependency Check](https://owasp.org/www-project-dependency-check/)

---

*This report is automatically generated by \`scripts/security-check.js\`*
`;
  
  try {
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    fs.writeFileSync(reportPath, report);
    log(`✅ Report saved to: ${reportPath}`, 'green');
  } catch (error) {
    log(`⚠️  Failed to save report: ${error.message}`, 'yellow');
  }
}

function checkDeploymentStatus(auditStats, nagResult) {
  logSection('🚀 Deployment Status');
  
  const hasCriticalVulns = auditStats.critical > 0;
  const hasCriticalNagIssues = nagResult && !nagResult.passed && nagResult.criticalCount > 0;
  
  if (hasCriticalVulns || hasCriticalNagIssues) {
    log('❌ DEPLOYMENT BLOCKED', 'red');
    log('', 'reset');
    
    if (hasCriticalVulns) {
      log('Critical vulnerabilities must be resolved before deployment.', 'red');
      log('', 'reset');
      log('Run the following commands to fix:', 'yellow');
      log('  npm audit fix', 'cyan');
      log('  npm audit fix --force  # If automatic fix fails', 'cyan');
      log('', 'reset');
    }
    
    if (hasCriticalNagIssues) {
      log('Critical CDK-NAG security issues must be resolved before deployment.', 'red');
      log('', 'reset');
      log('Review the CDK-NAG findings above and:', 'yellow');
      log('  1. Fix the security issues in your CDK code', 'cyan');
      log('  2. Or add suppressions with justification if issues are false positives', 'cyan');
      log('  3. Re-run: npm run security:full', 'cyan');
      log('', 'reset');
    }
    
    return false;
  }
  
  if (auditStats.high > 0 || (nagResult && !nagResult.passed)) {
    log('⚠️  DEPLOYMENT ALLOWED WITH WARNINGS', 'yellow');
    log('', 'reset');
    
    if (auditStats.high > 0) {
      log(`Found ${auditStats.high} high severity vulnerabilities.`, 'yellow');
      log('Consider fixing these before production deployment.', 'yellow');
    }
    
    if (nagResult && !nagResult.passed && nagResult.criticalCount === 0) {
      log('Found CDK-NAG warnings (non-critical).', 'yellow');
      log('Consider addressing these for better security posture.', 'yellow');
    }
    
    log('', 'reset');
  } else {
    log('✅ DEPLOYMENT ALLOWED', 'green');
    log('', 'reset');
    log('No critical vulnerabilities or security issues found.', 'green');
    log('', 'reset');
  }
  
  return true;
}

async function main() {
  console.log('');
  log('🔒 Fibonacci Security Scanner', 'bold');
  log('Ecossistema Alquimista.AI', 'cyan');
  console.log('');
  
  try {
    // Run npm audit
    const auditData = await runAudit();
    
    // Analyze vulnerabilities
    const auditStats = analyzeVulnerabilities(auditData);
    
    // Display vulnerability details
    displayVulnerabilityDetails(auditData);
    
    // Run CDK-NAG validation
    const nagResult = await runCdkNag();
    
    // Generate comprehensive report
    generateReport(auditData, auditStats, nagResult);
    
    // Check deployment status
    const canDeploy = checkDeploymentStatus(auditStats, nagResult);
    
    // Exit with appropriate code
    if (!canDeploy) {
      process.exit(1);
    }
    
    process.exit(0);
    
  } catch (error) {
    log('❌ Security scan failed', 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main();
