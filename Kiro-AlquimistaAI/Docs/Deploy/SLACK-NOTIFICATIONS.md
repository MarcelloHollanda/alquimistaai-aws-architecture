# Slack Notifications Configuration

## Overview

The Fibonacci CI/CD pipeline includes comprehensive Slack notifications for deployment status, manual approval requirements, and system alerts. This document describes the notification system and how to configure it.

## Features

### 1. Deployment Status Notifications
- ✅ **Success notifications** with deployment details and URLs
- ❌ **Failure notifications** with error context and logs
- ⚠️ **Warning notifications** for cancelled deployments
- 🔄 **Rollback notifications** for production failures

### 2. Manual Approval Notifications
- 🔒 **Approval required** notifications for production deployments
- 📋 **Approval context** with commit details and change summary
- 🔗 **Direct links** to GitHub Actions approval interface

### 3. Environment-Specific Notifications
- **Development**: Automatic notifications on every push to `develop`
- **Staging**: Automatic notifications on every push to `main`
- **Production**: Manual approval notifications + deployment status

## Configuration

### 1. Slack Webhook Setup

1. **Create a Slack App**:
   - Go to https://api.slack.com/apps
   - Click "Create New App" → "From scratch"
   - Name: "Fibonacci Deploy Bot"
   - Select your workspace

2. **Enable Incoming Webhooks**:
   - Go to "Incoming Webhooks" in your app settings
   - Toggle "Activate Incoming Webhooks" to On
   - Click "Add New Webhook to Workspace"
   - Select the channel for notifications (e.g., #deployments)
   - Copy the webhook URL

3. **Configure GitHub Secret**:
   ```bash
   # Add to GitHub repository secrets
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```

### 2. Channel Recommendations

- **#deployments**: All deployment notifications
- **#alerts**: Critical alerts and failures
- **#approvals**: Production approval requests

### 3. Notification Customization

The notification system uses reusable GitHub Actions located in:
- `.github/actions/slack-notify/action.yml` - Standard deployment notifications
- `.github/actions/slack-approval/action.yml` - Manual approval notifications

## Notification Types

### Development Deployment
```
✅ Deployment to development succeeded

Environment: development
Branch: develop
Commit: abc12345
Triggered by: developer-name
API URL: https://dev-api.alquimista.ai
GitHub Actions: View deployment logs
```

### Staging Deployment
```
✅ Deployment to staging succeeded

Environment: staging
Branch: main
Commit: def67890
Triggered by: developer-name
API URL: https://staging-api.alquimista.ai
Frontend URL: https://staging.alquimista.ai
GitHub Actions: View deployment logs
```

### Production Approval Required
```
🔒 Manual approval required for production deployment

A production deployment is waiting for manual approval. 
Please review the changes and approve if ready to proceed.

Environment: production
Branch: main
Commit: ghi01234
Requested by: developer-name
Approval Required: Click here to review and approve
```

### Production Deployment Success
```
✅ Deployment to production succeeded

Environment: production
Branch: main
Commit: ghi01234
Triggered by: developer-name
API URL: https://api.alquimista.ai
Frontend URL: https://alquimista.ai
GitHub Actions: View deployment logs
```

### Production Deployment Failure
```
❌ Deployment to production failed

Environment: production
Branch: main
Commit: ghi01234
Triggered by: developer-name
GitHub Actions: View deployment logs

Automatic rollback initiated - manual verification required.
```

## Workflow Integration

### Development Workflow
```yaml
- name: Notify deployment status
  if: always()
  uses: ./.github/actions/slack-notify
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    status: ${{ job.status }}
    environment: 'development'
    branch: ${{ github.ref_name }}
    commit: ${{ github.sha }}
    actor: ${{ github.actor }}
    api-url: ${{ steps.outputs.outputs.api_url }}
```

### Production Approval
```yaml
- name: Send approval notification
  uses: ./.github/actions/slack-approval
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    environment: 'production'
    branch: ${{ github.ref_name }}
    commit: ${{ github.sha }}
    actor: ${{ github.actor }}
    approval-url: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
```

## Troubleshooting

### Common Issues

1. **Webhook URL Not Working**
   - Verify the webhook URL is correct
   - Check that the Slack app has permissions
   - Ensure the channel exists and the bot is invited

2. **Notifications Not Appearing**
   - Check GitHub repository secrets are configured
   - Verify the workflow has access to secrets
   - Check GitHub Actions logs for error messages

3. **Formatting Issues**
   - Slack webhook payload must be valid JSON
   - Special characters in commit messages may need escaping
   - URL encoding may be required for some fields

### Testing Notifications

You can test notifications manually by triggering workflows:

```bash
# Test development deployment
git push origin develop

# Test staging deployment  
git push origin main

# Test production deployment (manual trigger)
# Go to GitHub Actions → Deploy to Production → Run workflow
```

### Webhook Payload Structure

The notification system sends structured payloads to Slack:

```json
{
  "username": "Fibonacci Deploy Bot",
  "icon_emoji": ":rocket:",
  "attachments": [
    {
      "color": "good|danger|warning",
      "fallback": "Deployment notification",
      "pretext": "✅ Deployment to staging succeeded",
      "fields": [
        {
          "title": "Environment",
          "value": "staging",
          "short": true
        }
      ],
      "footer": "Fibonacci CI/CD",
      "ts": 1234567890
    }
  ]
}
```

## Security Considerations

1. **Webhook URL Security**
   - Store webhook URLs in GitHub Secrets, never in code
   - Use repository-level secrets, not organization-level for sensitive projects
   - Rotate webhook URLs periodically

2. **Information Disclosure**
   - Avoid including sensitive information in notifications
   - Use commit SHAs instead of full commit messages
   - Consider using private channels for production notifications

3. **Access Control**
   - Limit who can approve production deployments
   - Use GitHub environment protection rules
   - Monitor approval notifications for unauthorized requests

## Monitoring and Metrics

The notification system provides visibility into:
- Deployment frequency by environment
- Success/failure rates
- Approval response times
- Rollback frequency

Use these metrics to improve your deployment process and identify bottlenecks.

## Future Enhancements

Planned improvements to the notification system:
- Integration with incident management tools
- Automated rollback notifications
- Performance metrics in notifications
- Custom notification templates per team
- Integration with monitoring alerts