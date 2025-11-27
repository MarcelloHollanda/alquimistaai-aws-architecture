# Backup Quick Reference Guide

## Quick Commands

### Aurora PostgreSQL

```bash
# Create manual snapshot
aws rds create-db-cluster-snapshot \
  --db-cluster-identifier fibonacci-aurora-cluster-prod \
  --db-cluster-snapshot-identifier fibonacci-snapshot-$(date +%Y-%m-%d)

# Restore to point-in-time
aws rds restore-db-cluster-to-point-in-time \
  --source-db-cluster-identifier fibonacci-aurora-cluster-prod \
  --db-cluster-identifier fibonacci-restored \
  --use-latest-restorable-time

# List snapshots
aws rds describe-db-cluster-snapshots \
  --db-cluster-identifier fibonacci-aurora-cluster-prod
```

### S3 Versioning

```bash
# List object versions
aws s3api list-object-versions \
  --bucket fibonacci-site-prod-123456789012 \
  --prefix index.html

# Restore deleted object (remove delete marker)
aws s3api delete-object \
  --bucket fibonacci-site-prod-123456789012 \
  --key index.html \
  --version-id DELETE_MARKER_VERSION_ID
```

### Secrets Manager

```bash
# Trigger rotation
aws secretsmanager rotate-secret \
  --secret-id fibonacci/db/credentials-prod

# Check rotation status
aws secretsmanager describe-secret \
  --secret-id fibonacci/db/credentials-prod
```

## Backup Configuration Summary

| Component | Backup Type | Retention | Frequency | Encryption |
|-----------|-------------|-----------|-----------|------------|
| Aurora PostgreSQL | Automated + Manual | 7 days | Daily at 03:00 UTC | KMS (Customer-managed) |
| S3 Site Bucket | Versioning | Unlimited | Continuous | KMS (Customer-managed) |
| S3 CloudTrail Bucket | Versioning + Lifecycle | 90 days | Continuous | KMS (Customer-managed) |
| Secrets Manager | Automatic Rotation | All versions | Every 30 days | KMS (AWS-managed) |

## Emergency Contacts

- **DevOps On-Call**: +55 11 XXXX-XXXX
- **DevOps Email**: devops@alquimista.ai
- **AWS Support**: Enterprise Support (24/7)

## Common Scenarios

### Scenario 1: Restore Database to 2 Hours Ago

```bash
aws rds restore-db-cluster-to-point-in-time \
  --source-db-cluster-identifier fibonacci-aurora-cluster-prod \
  --db-cluster-identifier fibonacci-restored \
  --restore-to-time "$(date -u -d '2 hours ago' +%Y-%m-%dT%H:%M:%SZ)"
```

### Scenario 2: Restore Deleted S3 File

```bash
# Find the version before deletion
aws s3api list-object-versions \
  --bucket fibonacci-site-prod-123456789012 \
  --prefix path/to/file.js

# Copy previous version as current
aws s3api copy-object \
  --bucket fibonacci-site-prod-123456789012 \
  --copy-source "fibonacci-site-prod-123456789012/path/to/file.js?versionId=VERSION_ID" \
  --key path/to/file.js
```

### Scenario 3: Test Backup Restore

```bash
# Create test restore
aws rds restore-db-cluster-to-point-in-time \
  --source-db-cluster-identifier fibonacci-aurora-cluster-prod \
  --db-cluster-identifier fibonacci-test-$(date +%Y%m%d) \
  --use-latest-restorable-time

# Verify data
psql -h fibonacci-test-YYYYMMDD.cluster-xxx.us-east-1.rds.amazonaws.com \
     -U dbadmin -d fibonacci -c "SELECT COUNT(*) FROM nigredo_leads.leads;"

# Clean up
aws rds delete-db-cluster \
  --db-cluster-identifier fibonacci-test-$(date +%Y%m%d) \
  --skip-final-snapshot
```

## Monitoring

### Check Backup Status

```bash
# Aurora last backup time
aws rds describe-db-clusters \
  --db-cluster-identifier fibonacci-aurora-cluster-prod \
  --query 'DBClusters[0].LatestRestorableTime'

# S3 versioning status
aws s3api get-bucket-versioning \
  --bucket fibonacci-site-prod-123456789012

# Secrets rotation status
aws secretsmanager describe-secret \
  --secret-id fibonacci/db/credentials-prod \
  --query 'RotationEnabled'
```

### CloudWatch Alarms

Monitor these alarms for backup issues:

- `fibonacci-aurora-backup-failed-prod`
- `fibonacci-secrets-rotation-failed-prod`
- `fibonacci-s3-replication-failed-prod` (future)

## See Also

- [Full Backup and Restore Procedures](./BACKUP-RESTORE-PROCEDURES.md)
- [Disaster Recovery Plan](./BACKUP-RESTORE-PROCEDURES.md#disaster-recovery)
- [Testing Backups](./BACKUP-RESTORE-PROCEDURES.md#testing-backups)
