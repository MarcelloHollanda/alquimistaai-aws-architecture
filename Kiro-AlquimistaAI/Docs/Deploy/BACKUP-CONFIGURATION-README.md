# Backup Configuration - Fibonacci Ecosystem

## Quick Start

This document provides a quick overview of the backup configuration for the Fibonacci Ecosystem.

## What's Configured

### ✅ Aurora PostgreSQL Backups
- **Retention**: 7 days
- **Window**: 03:00-04:00 UTC daily
- **Type**: Automated snapshots + Point-in-time recovery
- **Encryption**: KMS customer-managed key

### ✅ S3 Bucket Versioning
- **Site Bucket**: All versions retained
- **CloudTrail Bucket**: 90-day lifecycle with IA/Glacier transitions
- **Encryption**: KMS customer-managed key

### ✅ Secrets Manager Rotation
- **Schedule**: Every 30 days
- **Type**: PostgreSQL single user
- **Downtime**: Zero (seamless rotation)

## Quick Commands

### Check Backup Status

```bash
# Aurora
aws rds describe-db-clusters \
  --db-cluster-identifier fibonacci-aurora-cluster-prod \
  --query 'DBClusters[0].LatestRestorableTime'

# S3
aws s3api get-bucket-versioning \
  --bucket fibonacci-site-prod-123456789012

# Secrets
aws secretsmanager describe-secret \
  --secret-id fibonacci/db/credentials-prod \
  --query 'RotationEnabled'
```

### Create Manual Backup

```bash
# Aurora snapshot
aws rds create-db-cluster-snapshot \
  --db-cluster-identifier fibonacci-aurora-cluster-prod \
  --db-cluster-snapshot-identifier fibonacci-snapshot-$(date +%Y-%m-%d)
```

### Restore from Backup

```bash
# Aurora point-in-time restore
aws rds restore-db-cluster-to-point-in-time \
  --source-db-cluster-identifier fibonacci-aurora-cluster-prod \
  --db-cluster-identifier fibonacci-restored \
  --use-latest-restorable-time
```

## Documentation

- **[Full Procedures](./BACKUP-RESTORE-PROCEDURES.md)** - Complete backup and restore guide
- **[Quick Reference](./BACKUP-QUICK-REFERENCE.md)** - Common commands and scenarios
- **[Implementation Checklist](./TASK-36-CHECKLIST.md)** - Verification and testing
- **[Implementation Summary](./TASK-36-IMPLEMENTATION-SUMMARY.md)** - Technical details

## Recovery Objectives

| Component | RPO | RTO |
|-----------|-----|-----|
| Aurora PostgreSQL | 5 minutes | 15-30 minutes |
| S3 Static Assets | 0 (zero) | 5 minutes |
| Secrets Manager | 0 (zero) | 1 minute |

## Support

- **DevOps**: devops@alquimista.ai
- **On-Call**: +55 11 XXXX-XXXX
- **AWS Support**: Enterprise (24/7)

## Testing Schedule

- **Aurora Restore**: Monthly
- **S3 Version Restore**: Monthly
- **Secrets Rotation**: Monthly
- **Full DR Drill**: Annually

---

For detailed information, see [BACKUP-RESTORE-PROCEDURES.md](./BACKUP-RESTORE-PROCEDURES.md)
