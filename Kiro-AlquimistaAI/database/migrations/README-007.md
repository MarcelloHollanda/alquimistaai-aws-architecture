# Migration 007: Nigredo Prospecting Core Schema

## Overview

This migration creates the database schema for the Nigredo Prospecting Core system, which handles public prospecting forms, webhook delivery, and rate limiting.

## Requirements

- **1.2**: Store lead information in Aurora Database
- **3.3**: Use dedicated schema within existing Aurora PostgreSQL cluster
- **5.1**: Encrypt all data at rest using AWS KMS

## Tables Created

### 1. `nigredo_leads.form_submissions`

Tracks all form submissions with request metadata for rate limiting and analytics.

**Columns:**
- `id` (UUID): Primary key
- `lead_id` (UUID): Foreign key to leads table
- `ip_address` (INET): IP address of submitter (required)
- `user_agent` (TEXT): Browser user agent string
- `referer` (TEXT): HTTP referer header
- `source` (VARCHAR): Submission source (landing_page, embedded_form, api)
- `form_type` (VARCHAR): Type of form (contact, demo_request, newsletter)
- `submitted_at` (TIMESTAMP): Submission timestamp

**Indexes:**
- `idx_form_submissions_lead_id`: For lead lookups
- `idx_form_submissions_ip`: For rate limiting queries
- `idx_form_submissions_submitted_at`: For time-based queries
- `idx_form_submissions_source`: For analytics

### 2. `nigredo_leads.webhook_logs`

Logs all webhook delivery attempts to the Fibonacci system with retry tracking.

**Columns:**
- `id` (UUID): Primary key
- `lead_id` (UUID): Foreign key to leads table
- `webhook_url` (TEXT): Target webhook URL
- `payload` (JSONB): Webhook payload
- `status_code` (INTEGER): HTTP response status code
- `response_body` (TEXT): HTTP response body
- `attempt_number` (INTEGER): Retry attempt (1-3)
- `success` (BOOLEAN): Delivery success flag
- `error_message` (TEXT): Error details if failed
- `sent_at` (TIMESTAMP): Attempt timestamp

**Indexes:**
- `idx_webhook_logs_lead_id`: For lead lookups
- `idx_webhook_logs_success`: For success rate queries
- `idx_webhook_logs_sent_at`: For time-based queries
- `idx_webhook_logs_lead_success`: For lead webhook history

### 3. `nigredo_leads.rate_limits`

Tracks submission rate limits per IP address (10 submissions per hour).

**Columns:**
- `id` (UUID): Primary key
- `ip_address` (INET): IP address being tracked
- `submission_count` (INTEGER): Number of submissions in window
- `window_start` (TIMESTAMP): Start of rate limit window
- `window_end` (TIMESTAMP): End of window (computed: window_start + 1 hour)
- `last_submission_at` (TIMESTAMP): Last submission time
- `blocked_until` (TIMESTAMP): Block expiration time (for abuse)

**Indexes:**
- `idx_rate_limits_ip`: For rate limit checks
- `idx_rate_limits_window`: For window queries
- `idx_rate_limits_blocked`: For blocked IP queries

**Constraints:**
- `unique_ip_window`: Ensures one record per IP per window

## Functions Created

### 1. `cleanup_old_rate_limits()`

Removes rate limit records older than 24 hours to prevent table bloat.

**Usage:**
```sql
SELECT cleanup_old_rate_limits();
```

**Recommended:** Run daily via scheduled Lambda or cron job.

### 2. `check_rate_limit(p_ip_address INET)`

Checks if an IP address is allowed to submit based on rate limits.

**Returns:**
- `is_allowed` (BOOLEAN): Whether submission is allowed
- `current_count` (INTEGER): Current submission count
- `limit_count` (INTEGER): Maximum allowed (10)
- `window_reset_at` (TIMESTAMP): When the window resets

**Usage:**
```sql
SELECT * FROM check_rate_limit('192.168.1.1'::INET);
```

### 3. `increment_rate_limit(p_ip_address INET)`

Increments the submission count for an IP address in the current window.

**Usage:**
```sql
SELECT increment_rate_limit('192.168.1.1'::INET);
```

## Schema Changes to Existing Tables

### `nigredo_leads.leads` Table

Added columns for prospecting form data:

- `name` (VARCHAR): Lead contact name
- `phone` (VARCHAR): Phone in E.164 format
- `company` (VARCHAR): Company name
- `message` (TEXT): Form message (max 1000 chars)
- `utm_source` (VARCHAR): UTM tracking parameter
- `utm_medium` (VARCHAR): UTM tracking parameter
- `utm_campaign` (VARCHAR): UTM tracking parameter
- `ip_address` (INET): Submission IP address
- `user_agent` (TEXT): Submission user agent

**New Constraints:**
- `leads_message_length`: Message max 1000 characters
- `leads_email_format`: RFC 5322 email validation
- `leads_phone_format`: E.164 phone format validation

**New Indexes:**
- `idx_leads_name`: For name searches
- `idx_leads_phone`: For phone lookups
- `idx_leads_company`: For company searches
- `idx_leads_utm_source`: For UTM analytics
- `idx_leads_ip_address`: For IP tracking

## Running the Migration

### Option 1: Using psql

```bash
psql -h <aurora-endpoint> -U <username> -d <database> -f database/migrations/007_create_nigredo_schema.sql
```

### Option 2: Using AWS RDS Data API

```bash
aws rds-data execute-statement \
  --resource-arn <cluster-arn> \
  --secret-arn <secret-arn> \
  --database <database-name> \
  --sql "$(cat database/migrations/007_create_nigredo_schema.sql)"
```

### Option 3: Using Migration Script

```bash
node scripts/migrate.js
```

## Verification

After running the migration, verify the tables were created:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'nigredo_leads' 
AND table_name IN ('form_submissions', 'webhook_logs', 'rate_limits');

-- Check functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('cleanup_old_rate_limits', 'check_rate_limit', 'increment_rate_limit');

-- Check migration recorded
SELECT * FROM public.migrations WHERE migration_name = '007_create_nigredo_schema';
```

## Rollback

To rollback this migration:

```sql
-- Drop new tables
DROP TABLE IF EXISTS nigredo_leads.rate_limits CASCADE;
DROP TABLE IF EXISTS nigredo_leads.webhook_logs CASCADE;
DROP TABLE IF EXISTS nigredo_leads.form_submissions CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS cleanup_old_rate_limits();
DROP FUNCTION IF EXISTS check_rate_limit(INET);
DROP FUNCTION IF EXISTS increment_rate_limit(INET);

-- Remove new columns from leads table
ALTER TABLE nigredo_leads.leads 
  DROP COLUMN IF EXISTS name,
  DROP COLUMN IF EXISTS phone,
  DROP COLUMN IF EXISTS company,
  DROP COLUMN IF EXISTS message,
  DROP COLUMN IF EXISTS utm_source,
  DROP COLUMN IF EXISTS utm_medium,
  DROP COLUMN IF EXISTS utm_campaign,
  DROP COLUMN IF EXISTS ip_address,
  DROP COLUMN IF EXISTS user_agent;

-- Remove migration record
DELETE FROM public.migrations WHERE migration_name = '007_create_nigredo_schema';
```

## Performance Considerations

1. **Rate Limit Cleanup**: Schedule `cleanup_old_rate_limits()` to run daily
2. **Webhook Logs**: Consider archiving old logs (>30 days) to separate table
3. **Form Submissions**: Consider partitioning by date for high-volume scenarios
4. **Indexes**: All critical query paths are indexed for optimal performance

## Security Notes

1. All data is encrypted at rest using AWS KMS (Aurora cluster level)
2. IP addresses are stored for rate limiting and security auditing
3. User agents are stored for analytics and bot detection
4. Webhook payloads are stored as JSONB for audit trail
5. Rate limiting prevents abuse (10 submissions/hour per IP)

## Next Steps

After running this migration:

1. Update Lambda functions to use new tables
2. Configure scheduled cleanup job for rate limits
3. Set up CloudWatch alarms for webhook failures
4. Test rate limiting functionality
5. Verify webhook logging is working
