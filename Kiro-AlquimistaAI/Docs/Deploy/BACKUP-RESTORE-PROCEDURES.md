# Backup and Restore Procedures - Fibonacci Ecosystem

## Overview

This document describes the backup and restore procedures for all critical components of the Fibonacci Ecosystem, including Aurora PostgreSQL, S3 buckets, and Secrets Manager.

## Table of Contents

1. [Aurora PostgreSQL Backups](#aurora-postgresql-backups)
2. [S3 Bucket Versioning](#s3-bucket-versioning)
3. [Secrets Manager Rotation](#secrets-manager-rotation)
4. [Restore Procedures](#restore-procedures)
5. [Disaster Recovery](#disaster-recovery)
6. [Testing Backups](#testing-backups)

---

## Aurora PostgreSQL Backups

### Automatic Backups

Aurora PostgreSQL is configured with automatic daily backups:

- **Retention Period**: 7 days
- **Backup Window**: 03:00-04:00 UTC (daily)
- **Backup Type**: Automated snapshots
- **Storage**: Encrypted using KMS customer-managed key

### Configuration Details

```typescript
backup: {
  retention: cdk.Duration.days(7),
  preferredWindow: '03:00-04:00'
}
```

### Manual Snapshots

To create a manual snapshot for long-term retention:

#### Using AWS Console

1. Navigate to RDS → Databases
2. Select the Aurora cluster (e.g., `fibonacci-aurora-cluster-prod`)
3. Click **Actions** → **Take snapshot**
4. Enter snapshot name: `fibonacci-manual-snapshot-YYYY-MM-DD`
5. Click **Take snapshot**

#### Using AWS CLI

```bash
# Create manual snapshot
aws rds create-db-cluster-snapshot \
  --db-cluster-identifier fibonacci-aurora-cluster-prod \
  --db-cluster-snapshot-identifier fibonacci-manual-snapshot-$(date +%Y-%m-%d) \
  --region us-east-1

# List all snapshots
aws rds describe-db-cluster-snapshots \
  --db-cluster-identifier fibonacci-aurora-cluster-prod \
  --region us-east-1

# Check snapshot status
aws rds describe-db-cluster-snapshots \
  --db-cluster-snapshot-identifier fibonacci-manual-snapshot-2025-01-15 \
  --region us-east-1
```

#### Using PowerShell

```powershell
# Create manual snapshot
$snapshotName = "fibonacci-manual-snapshot-$(Get-Date -Format 'yyyy-MM-dd')"
New-RDSDBClusterSnapshot `
  -DBClusterIdentifier fibonacci-aurora-cluster-prod `
  -DBClusterSnapshotIdentifier $snapshotName `
  -Region us-east-1

# List all snapshots
Get-RDSDBClusterSnapshot `
  -DBClusterIdentifier fibonacci-aurora-cluster-prod `
  -Region us-east-1

# Check snapshot status
Get-RDSDBClusterSnapshot `
  -DBClusterSnapshotIdentifier $snapshotName `
  -Region us-east-1
```

### Backup Verification

Verify that backups are being created successfully:

```bash
# Check latest automated backup
aws rds describe-db-clusters \
  --db-cluster-identifier fibonacci-aurora-cluster-prod \
  --query 'DBClusters[0].LatestRestorableTime' \
  --region us-east-1

# List recent automated backups
aws rds describe-db-cluster-automated-backups \
  --db-cluster-identifier fibonacci-aurora-cluster-prod \
  --region us-east-1
```

---

## S3 Bucket Versioning

### Enabled Buckets

The following S3 buckets have versioning enabled:

1. **Site Bucket** (`fibonacci-site-{env}-{account-id}`)
   - Stores front-end static assets
   - Versioning: Enabled
   - Encryption: KMS with customer-managed key

2. **CloudTrail Bucket** (`fibonacci-cloudtrail-{env}-{account}`)
   - Stores audit logs
   - Versioning: Enabled
   - Lifecycle: 90 days retention with transitions to IA and Glacier

### Viewing Object Versions

#### Using AWS Console

1. Navigate to S3 → Buckets
2. Select the bucket (e.g., `fibonacci-site-prod-123456789012`)
3. Toggle **Show versions** switch
4. View all versions of each object

#### Using AWS CLI

```bash
# List all versions of objects in a bucket
aws s3api list-object-versions \
  --bucket fibonacci-site-prod-123456789012 \
  --region us-east-1

# List versions of a specific object
aws s3api list-object-versions \
  --bucket fibonacci-site-prod-123456789012 \
  --prefix index.html \
  --region us-east-1
```

#### Using PowerShell

```powershell
# List all versions of objects in a bucket
Get-S3Version `
  -BucketName fibonacci-site-prod-123456789012 `
  -Region us-east-1

# List versions of a specific object
Get-S3Version `
  -BucketName fibonacci-site-prod-123456789012 `
  -Prefix index.html `
  -Region us-east-1
```

### Restoring Previous Versions

To restore a previous version of an object:

#### Using AWS Console

1. Navigate to S3 → Buckets → Select bucket
2. Toggle **Show versions**
3. Find the version you want to restore
4. Click on the version ID
5. Click **Download** or **Copy** to restore

#### Using AWS CLI

```bash
# Copy a specific version to restore it as the current version
aws s3api copy-object \
  --bucket fibonacci-site-prod-123456789012 \
  --copy-source fibonacci-site-prod-123456789012/index.html?versionId=VERSION_ID \
  --key index.html \
  --region us-east-1
```

---

## Secrets Manager Rotation

### Automatic Rotation Configuration

Database credentials are automatically rotated every 30 days:

- **Rotation Schedule**: Every 30 days
- **Rotation Type**: Single user rotation (PostgreSQL)
- **Rotation Lambda**: Automatically created by CDK
- **Secret Name**: `fibonacci/db/credentials-{env}`

### Configuration Details

```typescript
this.dbSecret.addRotationSchedule('RotationSchedule', {
  automaticallyAfter: cdk.Duration.days(30),
  hostedRotation: rds.HostedRotation.postgresqlSingleUser()
});
```

### Monitoring Rotation

#### Check Rotation Status

```bash
# Get secret rotation configuration
aws secretsmanager describe-secret \
  --secret-id fibonacci/db/credentials-prod \
  --region us-east-1

# View rotation history
aws secretsmanager list-secret-version-ids \
  --secret-id fibonacci/db/credentials-prod \
  --region us-east-1
```

#### Using PowerShell

```powershell
# Get secret rotation configuration
Get-SECSecretValue `
  -SecretId fibonacci/db/credentials-prod `
  -Region us-east-1

# View rotation history
Get-SECSecretVersionList `
  -SecretId fibonacci/db/credentials-prod `
  -Region us-east-1
```

### Manual Rotation

To manually trigger a rotation:

#### Using AWS Console

1. Navigate to Secrets Manager
2. Select the secret (e.g., `fibonacci/db/credentials-prod`)
3. Click **Rotate secret immediately**
4. Confirm the rotation

#### Using AWS CLI

```bash
# Trigger immediate rotation
aws secretsmanager rotate-secret \
  --secret-id fibonacci/db/credentials-prod \
  --region us-east-1

# Check rotation status
aws secretsmanager describe-secret \
  --secret-id fibonacci/db/credentials-prod \
  --query 'RotationEnabled' \
  --region us-east-1
```

### Rotation Troubleshooting

If rotation fails:

1. **Check Lambda Logs**:
   ```bash
   aws logs tail /aws/lambda/SecretsManagerRotation-fibonacci-db-credentials-prod \
     --follow \
     --region us-east-1
   ```

2. **Verify VPC Configuration**: Ensure the rotation Lambda has access to the Aurora cluster

3. **Check IAM Permissions**: Verify the rotation Lambda has necessary permissions

4. **Manual Intervention**: If rotation fails repeatedly, you may need to manually update the secret and reset rotation

---

## Restore Procedures

### Aurora PostgreSQL Restore

#### Restore from Automated Backup (Point-in-Time Recovery)

**Use Case**: Restore database to a specific point in time within the last 7 days

##### Using AWS Console

1. Navigate to RDS → Databases
2. Select the Aurora cluster
3. Click **Actions** → **Restore to point in time**
4. Select restore time (any time within last 7 days)
5. Configure new cluster settings:
   - **DB cluster identifier**: `fibonacci-aurora-cluster-prod-restored`
   - **VPC**: Select the same VPC
   - **Subnet group**: Select the same subnet group
   - **Security groups**: Select the same security groups
6. Click **Restore DB cluster**
7. Wait for cluster to become available (5-15 minutes)

##### Using AWS CLI

```bash
# Restore to specific point in time
aws rds restore-db-cluster-to-point-in-time \
  --source-db-cluster-identifier fibonacci-aurora-cluster-prod \
  --db-cluster-identifier fibonacci-aurora-cluster-prod-restored \
  --restore-to-time "2025-01-15T10:30:00Z" \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --db-subnet-group-name fibonacci-db-subnet-group \
  --region us-east-1

# Restore to latest restorable time
aws rds restore-db-cluster-to-point-in-time \
  --source-db-cluster-identifier fibonacci-aurora-cluster-prod \
  --db-cluster-identifier fibonacci-aurora-cluster-prod-restored \
  --use-latest-restorable-time \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --db-subnet-group-name fibonacci-db-subnet-group \
  --region us-east-1
```

##### Using PowerShell

```powershell
# Restore to specific point in time
Restore-RDSDBClusterToPointInTime `
  -SourceDBClusterIdentifier fibonacci-aurora-cluster-prod `
  -DBClusterIdentifier fibonacci-aurora-cluster-prod-restored `
  -RestoreToTime "2025-01-15T10:30:00Z" `
  -VpcSecurityGroupId sg-xxxxxxxxx `
  -DBSubnetGroupName fibonacci-db-subnet-group `
  -Region us-east-1

# Restore to latest restorable time
Restore-RDSDBClusterToPointInTime `
  -SourceDBClusterIdentifier fibonacci-aurora-cluster-prod `
  -DBClusterIdentifier fibonacci-aurora-cluster-prod-restored `
  -UseLatestRestorableTime $true `
  -VpcSecurityGroupId sg-xxxxxxxxx `
  -DBSubnetGroupName fibonacci-db-subnet-group `
  -Region us-east-1
```

#### Restore from Manual Snapshot

**Use Case**: Restore database from a specific manual snapshot

##### Using AWS Console

1. Navigate to RDS → Snapshots
2. Select the snapshot to restore
3. Click **Actions** → **Restore snapshot**
4. Configure new cluster settings (same as above)
5. Click **Restore DB cluster**

##### Using AWS CLI

```bash
# Restore from snapshot
aws rds restore-db-cluster-from-snapshot \
  --db-cluster-identifier fibonacci-aurora-cluster-prod-restored \
  --snapshot-identifier fibonacci-manual-snapshot-2025-01-15 \
  --engine aurora-postgresql \
  --engine-version 15.8 \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --db-subnet-group-name fibonacci-db-subnet-group \
  --region us-east-1

# Add writer instance to restored cluster
aws rds create-db-instance \
  --db-instance-identifier fibonacci-aurora-cluster-prod-restored-writer \
  --db-instance-class db.serverless \
  --engine aurora-postgresql \
  --db-cluster-identifier fibonacci-aurora-cluster-prod-restored \
  --region us-east-1
```

#### Post-Restore Steps

After restoring the database:

1. **Verify Data Integrity**:
   ```sql
   -- Connect to restored cluster
   psql -h fibonacci-aurora-cluster-prod-restored.cluster-xxxxxxxxx.us-east-1.rds.amazonaws.com \
        -U dbadmin -d fibonacci
   
   -- Check row counts
   SELECT schemaname, tablename, n_live_tup 
   FROM pg_stat_user_tables 
   ORDER BY n_live_tup DESC;
   
   -- Verify recent data
   SELECT COUNT(*) FROM nigredo_leads.leads 
   WHERE created_at > NOW() - INTERVAL '24 hours';
   ```

2. **Update Application Configuration**:
   - Update Lambda environment variables to point to restored cluster
   - Or update DNS/endpoint if using Route53

3. **Test Application**:
   - Run smoke tests
   - Verify API endpoints
   - Check agent functionality

4. **Clean Up**:
   - Delete old cluster if restore is successful
   - Or keep both for comparison

### S3 Object Restore

#### Restore Deleted Object

If an object was deleted, you can restore it from a previous version:

```bash
# List delete markers
aws s3api list-object-versions \
  --bucket fibonacci-site-prod-123456789012 \
  --prefix index.html \
  --query 'DeleteMarkers[0].VersionId' \
  --region us-east-1

# Remove delete marker to restore object
aws s3api delete-object \
  --bucket fibonacci-site-prod-123456789012 \
  --key index.html \
  --version-id DELETE_MARKER_VERSION_ID \
  --region us-east-1
```

#### Restore Entire Bucket

To restore an entire bucket to a previous state:

1. **Create a new bucket** for restored content
2. **Copy all versions** from a specific date:
   ```bash
   # This requires a custom script to iterate through versions
   # and copy objects from a specific date
   ```

3. **Use AWS Backup** (if configured) to restore from backup vault

---

## Disaster Recovery

### Recovery Time Objective (RTO) and Recovery Point Objective (RPO)

| Component | RPO | RTO | Notes |
|-----------|-----|-----|-------|
| Aurora PostgreSQL | 5 minutes | 15-30 minutes | Point-in-time recovery |
| S3 Static Assets | 0 (versioned) | 5 minutes | Immediate version restore |
| Secrets Manager | 0 (versioned) | 1 minute | Previous version restore |
| Lambda Functions | 0 (IaC) | 10 minutes | Redeploy from CDK |

### Disaster Recovery Scenarios

#### Scenario 1: Accidental Data Deletion

**Problem**: Critical data was accidentally deleted from Aurora

**Solution**:
1. Identify the time before deletion
2. Restore cluster to point-in-time before deletion
3. Export affected data from restored cluster
4. Import data back to production cluster
5. Verify data integrity

**Estimated Recovery Time**: 30-60 minutes

#### Scenario 2: Database Corruption

**Problem**: Database corruption detected

**Solution**:
1. Create manual snapshot of current state (for forensics)
2. Restore from latest automated backup or manual snapshot
3. Verify data integrity
4. Update application to use restored cluster
5. Investigate root cause

**Estimated Recovery Time**: 30-45 minutes

#### Scenario 3: Accidental S3 Object Deletion

**Problem**: Critical front-end files deleted from S3

**Solution**:
1. List object versions to find deleted objects
2. Remove delete markers to restore objects
3. Verify CloudFront cache invalidation
4. Test application functionality

**Estimated Recovery Time**: 5-10 minutes

#### Scenario 4: Region Failure

**Problem**: Entire AWS region is unavailable

**Solution**:
1. **Aurora**: Restore from snapshot in different region
2. **S3**: Enable cross-region replication (future enhancement)
3. **Lambda**: Deploy CDK stack to different region
4. **Route53**: Update DNS to point to new region

**Estimated Recovery Time**: 2-4 hours (requires pre-planning)

### Cross-Region Backup Strategy (Future Enhancement)

For production environments, consider:

1. **Aurora Global Database**: Replicate to secondary region
2. **S3 Cross-Region Replication**: Automatic replication to backup region
3. **Multi-Region Deployment**: Active-passive or active-active setup

---

## Testing Backups

### Monthly Backup Testing Checklist

Perform these tests monthly to ensure backups are working:

#### Aurora Backup Test

```bash
# 1. Create test restore
aws rds restore-db-cluster-to-point-in-time \
  --source-db-cluster-identifier fibonacci-aurora-cluster-prod \
  --db-cluster-identifier fibonacci-test-restore-$(date +%Y%m%d) \
  --use-latest-restorable-time \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --db-subnet-group-name fibonacci-db-subnet-group \
  --region us-east-1

# 2. Wait for cluster to be available
aws rds wait db-cluster-available \
  --db-cluster-identifier fibonacci-test-restore-$(date +%Y%m%d) \
  --region us-east-1

# 3. Connect and verify data
psql -h fibonacci-test-restore-YYYYMMDD.cluster-xxx.us-east-1.rds.amazonaws.com \
     -U dbadmin -d fibonacci -c "SELECT COUNT(*) FROM nigredo_leads.leads;"

# 4. Delete test cluster
aws rds delete-db-cluster \
  --db-cluster-identifier fibonacci-test-restore-$(date +%Y%m%d) \
  --skip-final-snapshot \
  --region us-east-1
```

#### S3 Versioning Test

```bash
# 1. Upload test file
echo "Test content v1" > test-backup.txt
aws s3 cp test-backup.txt s3://fibonacci-site-prod-123456789012/

# 2. Overwrite file
echo "Test content v2" > test-backup.txt
aws s3 cp test-backup.txt s3://fibonacci-site-prod-123456789012/

# 3. List versions
aws s3api list-object-versions \
  --bucket fibonacci-site-prod-123456789012 \
  --prefix test-backup.txt

# 4. Restore previous version
aws s3api copy-object \
  --bucket fibonacci-site-prod-123456789012 \
  --copy-source "fibonacci-site-prod-123456789012/test-backup.txt?versionId=VERSION_ID" \
  --key test-backup.txt

# 5. Clean up
aws s3 rm s3://fibonacci-site-prod-123456789012/test-backup.txt
```

#### Secrets Rotation Test

```bash
# 1. Check current rotation status
aws secretsmanager describe-secret \
  --secret-id fibonacci/db/credentials-prod \
  --query 'RotationEnabled'

# 2. Trigger manual rotation
aws secretsmanager rotate-secret \
  --secret-id fibonacci/db/credentials-prod

# 3. Monitor rotation
aws secretsmanager describe-secret \
  --secret-id fibonacci/db/credentials-prod \
  --query 'RotationEnabled'

# 4. Verify application still works after rotation
curl https://api.fibonacci.prod/health
```

### Backup Testing Schedule

| Test | Frequency | Owner | Duration |
|------|-----------|-------|----------|
| Aurora Point-in-Time Restore | Monthly | DevOps | 30 min |
| Aurora Snapshot Restore | Quarterly | DevOps | 45 min |
| S3 Version Restore | Monthly | DevOps | 10 min |
| Secrets Rotation | Monthly | DevOps | 15 min |
| Full DR Drill | Annually | DevOps + Engineering | 4 hours |

---

## Backup Monitoring

### CloudWatch Alarms

The following alarms are configured to monitor backup health:

1. **Aurora Backup Failed**: Triggers if automated backup fails
2. **Secrets Rotation Failed**: Triggers if secret rotation fails
3. **S3 Replication Failed**: (Future) Triggers if cross-region replication fails

### Backup Metrics Dashboard

View backup metrics in CloudWatch:

1. Navigate to CloudWatch → Dashboards
2. Select `fibonacci-core-dashboard-{env}`
3. View backup-related metrics:
   - Last successful backup time
   - Backup size
   - Backup duration
   - Rotation success rate

---

## Compliance and Audit

### Backup Compliance Requirements

- **LGPD**: Backups must be encrypted and access-controlled
- **Retention**: Minimum 7 days for operational data
- **Audit Trail**: All backup and restore operations logged in CloudTrail

### Audit Queries

```bash
# List all backup-related CloudTrail events
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=ResourceType,AttributeValue=AWS::RDS::DBCluster \
  --start-time $(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%S) \
  --region us-east-1

# List all S3 version operations
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=PutObject \
  --start-time $(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%S) \
  --region us-east-1
```

---

## Contact and Escalation

### Backup Issues Escalation

| Severity | Response Time | Contact |
|----------|---------------|---------|
| Critical (Production data loss) | Immediate | DevOps On-Call + CTO |
| High (Backup failure) | 1 hour | DevOps Team Lead |
| Medium (Restore test failure) | 4 hours | DevOps Engineer |
| Low (Documentation update) | 1 day | DevOps Engineer |

### Support Contacts

- **DevOps Team**: devops@alquimista.ai
- **On-Call**: +55 11 XXXX-XXXX
- **AWS Support**: Enterprise Support (24/7)

---

## Appendix

### Useful Commands Reference

#### Aurora

```bash
# List all clusters
aws rds describe-db-clusters --region us-east-1

# Get cluster endpoint
aws rds describe-db-clusters \
  --db-cluster-identifier fibonacci-aurora-cluster-prod \
  --query 'DBClusters[0].Endpoint' \
  --region us-east-1

# List all snapshots
aws rds describe-db-cluster-snapshots \
  --db-cluster-identifier fibonacci-aurora-cluster-prod \
  --region us-east-1
```

#### S3

```bash
# List all buckets
aws s3 ls

# Get bucket versioning status
aws s3api get-bucket-versioning \
  --bucket fibonacci-site-prod-123456789012

# List all versions
aws s3api list-object-versions \
  --bucket fibonacci-site-prod-123456789012
```

#### Secrets Manager

```bash
# List all secrets
aws secretsmanager list-secrets --region us-east-1

# Get secret value
aws secretsmanager get-secret-value \
  --secret-id fibonacci/db/credentials-prod \
  --region us-east-1

# List secret versions
aws secretsmanager list-secret-version-ids \
  --secret-id fibonacci/db/credentials-prod \
  --region us-east-1
```

### Related Documentation

- [AWS RDS Backup and Restore](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.Managing.Backups.html)
- [S3 Versioning](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Versioning.html)
- [Secrets Manager Rotation](https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html)
- [CloudTrail Logging](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-user-guide.html)

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-15  
**Next Review**: 2025-04-15
