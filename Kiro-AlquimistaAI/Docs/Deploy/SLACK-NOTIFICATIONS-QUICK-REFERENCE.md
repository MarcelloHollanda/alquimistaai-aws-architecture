# Slack Notifications - Quick Reference

## Setup Checklist

- [ ] Create Slack app and webhook
- [ ] Add `SLACK_WEBHOOK_URL` to GitHub secrets
- [ ] Test notifications on development environment
- [ ] Configure production approval channel
- [ ] Document notification channels for team

## GitHub Secrets Required

```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

## Notification Triggers

| Environment | Trigger | Notification Type |
|-------------|---------|-------------------|
| Development | Push to `develop` | Automatic deployment status |
| Staging | Push to `main` | Automatic deployment status |
| Production | Manual workflow dispatch | Approval required + deployment status |

## Notification Actions

### Standard Deployment Notification
```yaml
uses: ./.github/actions/slack-notify
with:
  webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
  status: ${{ job.status }}
  environment: 'staging'
  branch: ${{ github.ref_name }}
  commit: ${{ github.sha }}
  actor: ${{ github.actor }}
  api-url: ${{ steps.outputs.outputs.api_url }}
  cloudfront-url: ${{ steps.outputs.outputs.cloudfront_url }}
```

### Manual Approval Notification
```yaml
uses: ./.github/actions/slack-approval
with:
  webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
  environment: 'production'
  branch: ${{ github.ref_name }}
  commit: ${{ github.sha }}
  actor: ${{ github.actor }}
  approval-url: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
```

## Status Icons

- ✅ Success
- ❌ Failure  
- ⚠️ Warning/Cancelled
- 🔒 Approval Required
- 🔄 Rollback

## Testing Commands

```bash
# Test dev notifications
git push origin develop

# Test staging notifications
git push origin main

# Test production approval
# GitHub Actions → Deploy to Production → Run workflow
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No notifications | Check `SLACK_WEBHOOK_URL` secret |
| Wrong channel | Verify webhook channel configuration |
| Formatting errors | Check JSON payload in action logs |
| Permission denied | Ensure bot is invited to channel |

## Channel Recommendations

- `#deployments` - All deployment notifications
- `#alerts` - Critical failures and rollbacks  
- `#approvals` - Production approval requests