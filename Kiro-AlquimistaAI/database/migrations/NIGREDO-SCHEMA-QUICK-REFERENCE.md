# Nigredo Prospecting Core - Database Quick Reference

## Table Relationships

```
nigredo_leads.leads (existing)
    ↓ (1:N)
nigredo_leads.form_submissions
    
nigredo_leads.leads (existing)
    ↓ (1:N)
nigredo_leads.webhook_logs

nigredo_leads.rate_limits (standalone)
```

## Common Queries

### 1. Create a New Lead from Form Submission

```sql
-- Step 1: Check rate limit
SELECT * FROM check_rate_limit('192.168.1.1'::INET);

-- Step 2: If allowed, insert lead
INSERT INTO nigredo_leads.leads (
    tenant_id, name, email, phone, company, message,
    utm_source, utm_medium, utm_campaign,
    ip_address, user_agent, status
) VALUES (
    'tenant-uuid',
    'John Doe',
    'john@example.com',
    '+5511999999999',
    'Acme Inc',
    'Interested in your services',
    'google',
    'cpc',
    'brand-campaign',
    '192.168.1.1'::INET,
    'Mozilla/5.0...',
    'novo'
) RETURNING id;

-- Step 3: Record form submission
INSERT INTO nigredo_leads.form_submissions (
    lead_id, ip_address, user_agent, referer, source, form_type
) VALUES (
    'lead-uuid',
    '192.168.1.1'::INET,
    'Mozilla/5.0...',
    'https://google.com',
    'landing_page',
    'contact'
);

-- Step 4: Increment rate limit
SELECT increment_rate_limit('192.168.1.1'::INET);
```

### 2. Log Webhook Attempt

```sql
-- Log successful webhook
INSERT INTO nigredo_leads.webhook_logs (
    lead_id, webhook_url, payload, status_code, 
    response_body, attempt_number, success
) VALUES (
    'lead-uuid',
    'https://api.fibonacci.com/public/nigredo-event',
    '{"event_type": "lead.created", "lead": {...}}'::JSONB,
    200,
    '{"status": "ok"}',
    1,
    TRUE
);

-- Log failed webhook (for retry)
INSERT INTO nigredo_leads.webhook_logs (
    lead_id, webhook_url, payload, status_code,
    error_message, attempt_number, success
) VALUES (
    'lead-uuid',
    'https://api.fibonacci.com/public/nigredo-event',
    '{"event_type": "lead.created", "lead": {...}}'::JSONB,
    500,
    'Internal Server Error',
    1,
    FALSE
);
```

### 3. Check Rate Limit Before Submission

```sql
-- Check if IP can submit
SELECT * FROM check_rate_limit('192.168.1.1'::INET);

-- Result columns:
-- is_allowed: TRUE if can submit, FALSE if rate limited
-- current_count: Current submission count in window
-- limit_count: Maximum allowed (10)
-- window_reset_at: When the rate limit resets
```

### 4. Get Lead with Submission History

```sql
SELECT 
    l.*,
    json_agg(DISTINCT fs.*) FILTER (WHERE fs.id IS NOT NULL) as form_submissions,
    json_agg(DISTINCT wl.*) FILTER (WHERE wl.id IS NOT NULL) as webhook_logs
FROM nigredo_leads.leads l
LEFT JOIN nigredo_leads.form_submissions fs ON fs.lead_id = l.id
LEFT JOIN nigredo_leads.webhook_logs wl ON wl.lead_id = l.id
WHERE l.id = 'lead-uuid'
GROUP BY l.id;
```

### 5. Get Webhook Delivery Status for Lead

```sql
SELECT 
    lead_id,
    COUNT(*) as total_attempts,
    COUNT(*) FILTER (WHERE success = TRUE) as successful_attempts,
    COUNT(*) FILTER (WHERE success = FALSE) as failed_attempts,
    MAX(sent_at) as last_attempt_at,
    MAX(attempt_number) as max_attempt_number
FROM nigredo_leads.webhook_logs
WHERE lead_id = 'lead-uuid'
GROUP BY lead_id;
```

### 6. Get Rate Limit Statistics

```sql
-- Current active rate limits
SELECT 
    ip_address,
    submission_count,
    window_start,
    window_end,
    last_submission_at,
    CASE 
        WHEN submission_count >= 10 THEN 'BLOCKED'
        WHEN submission_count >= 8 THEN 'WARNING'
        ELSE 'OK'
    END as status
FROM nigredo_leads.rate_limits
WHERE window_end > NOW()
ORDER BY submission_count DESC;

-- IPs that hit rate limit today
SELECT 
    ip_address,
    MAX(submission_count) as max_submissions,
    COUNT(*) as windows_hit,
    MAX(last_submission_at) as last_attempt
FROM nigredo_leads.rate_limits
WHERE window_start >= CURRENT_DATE
AND submission_count >= 10
GROUP BY ip_address
ORDER BY max_submissions DESC;
```

### 7. Cleanup Old Data

```sql
-- Clean up old rate limits (run daily)
SELECT cleanup_old_rate_limits();

-- Archive old webhook logs (manual, run monthly)
INSERT INTO nigredo_leads.webhook_logs_archive
SELECT * FROM nigredo_leads.webhook_logs
WHERE sent_at < NOW() - INTERVAL '30 days';

DELETE FROM nigredo_leads.webhook_logs
WHERE sent_at < NOW() - INTERVAL '30 days';

-- Archive old form submissions (manual, run monthly)
DELETE FROM nigredo_leads.form_submissions
WHERE submitted_at < NOW() - INTERVAL '90 days';
```

### 8. Analytics Queries

```sql
-- Form submissions by source (last 7 days)
SELECT 
    source,
    COUNT(*) as submission_count,
    COUNT(DISTINCT ip_address) as unique_ips
FROM nigredo_leads.form_submissions
WHERE submitted_at >= NOW() - INTERVAL '7 days'
GROUP BY source
ORDER BY submission_count DESC;

-- Webhook success rate (last 24 hours)
SELECT 
    COUNT(*) as total_attempts,
    COUNT(*) FILTER (WHERE success = TRUE) as successful,
    COUNT(*) FILTER (WHERE success = FALSE) as failed,
    ROUND(100.0 * COUNT(*) FILTER (WHERE success = TRUE) / COUNT(*), 2) as success_rate_pct
FROM nigredo_leads.webhook_logs
WHERE sent_at >= NOW() - INTERVAL '24 hours';

-- Rate limit hits by hour (today)
SELECT 
    DATE_TRUNC('hour', window_start) as hour,
    COUNT(*) as rate_limit_windows,
    COUNT(*) FILTER (WHERE submission_count >= 10) as blocked_windows,
    SUM(submission_count) as total_submissions
FROM nigredo_leads.rate_limits
WHERE window_start >= CURRENT_DATE
GROUP BY DATE_TRUNC('hour', window_start)
ORDER BY hour DESC;

-- Top submitting IPs (last 7 days)
SELECT 
    ip_address,
    COUNT(*) as submission_count,
    MIN(submitted_at) as first_submission,
    MAX(submitted_at) as last_submission
FROM nigredo_leads.form_submissions
WHERE submitted_at >= NOW() - INTERVAL '7 days'
GROUP BY ip_address
ORDER BY submission_count DESC
LIMIT 20;
```

## Lambda Function Integration Examples

### TypeScript: Check Rate Limit

```typescript
import { DatabaseClient } from './database';

async function checkRateLimit(ipAddress: string): Promise<{
  isAllowed: boolean;
  currentCount: number;
  limitCount: number;
  windowResetAt: Date;
}> {
  const result = await DatabaseClient.query(
    'SELECT * FROM check_rate_limit($1::INET)',
    [ipAddress]
  );
  
  return {
    isAllowed: result.rows[0].is_allowed,
    currentCount: result.rows[0].current_count,
    limitCount: result.rows[0].limit_count,
    windowResetAt: new Date(result.rows[0].window_reset_at)
  };
}
```

### TypeScript: Create Lead with Transaction

```typescript
async function createLeadFromForm(data: FormData): Promise<string> {
  const client = await DatabaseClient.getClient();
  
  try {
    await client.query('BEGIN');
    
    // 1. Check rate limit
    const rateLimitResult = await client.query(
      'SELECT * FROM check_rate_limit($1::INET)',
      [data.ipAddress]
    );
    
    if (!rateLimitResult.rows[0].is_allowed) {
      throw new Error('Rate limit exceeded');
    }
    
    // 2. Insert lead
    const leadResult = await client.query(
      `INSERT INTO nigredo_leads.leads 
       (tenant_id, name, email, phone, company, message, ip_address, user_agent, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7::INET, $8, 'novo')
       RETURNING id`,
      [data.tenantId, data.name, data.email, data.phone, data.company, 
       data.message, data.ipAddress, data.userAgent]
    );
    
    const leadId = leadResult.rows[0].id;
    
    // 3. Record form submission
    await client.query(
      `INSERT INTO nigredo_leads.form_submissions 
       (lead_id, ip_address, user_agent, referer, source, form_type)
       VALUES ($1, $2::INET, $3, $4, $5, $6)`,
      [leadId, data.ipAddress, data.userAgent, data.referer, 
       data.source, data.formType]
    );
    
    // 4. Increment rate limit
    await client.query(
      'SELECT increment_rate_limit($1::INET)',
      [data.ipAddress]
    );
    
    await client.query('COMMIT');
    return leadId;
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

### TypeScript: Log Webhook Attempt

```typescript
async function logWebhookAttempt(
  leadId: string,
  webhookUrl: string,
  payload: object,
  response: {
    statusCode: number;
    body: string;
  },
  attemptNumber: number,
  error?: string
): Promise<void> {
  await DatabaseClient.query(
    `INSERT INTO nigredo_leads.webhook_logs 
     (lead_id, webhook_url, payload, status_code, response_body, 
      attempt_number, success, error_message)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      leadId,
      webhookUrl,
      JSON.stringify(payload),
      response.statusCode,
      response.body,
      attemptNumber,
      response.statusCode >= 200 && response.statusCode < 300,
      error || null
    ]
  );
}
```

## Monitoring Queries for CloudWatch

### Query 1: Rate Limit Violations (Last Hour)

```sql
SELECT COUNT(*) as rate_limit_violations
FROM nigredo_leads.rate_limits
WHERE window_start >= NOW() - INTERVAL '1 hour'
AND submission_count >= 10;
```

### Query 2: Webhook Failure Rate (Last Hour)

```sql
SELECT 
    ROUND(100.0 * COUNT(*) FILTER (WHERE success = FALSE) / COUNT(*), 2) as failure_rate_pct
FROM nigredo_leads.webhook_logs
WHERE sent_at >= NOW() - INTERVAL '1 hour';
```

### Query 3: Form Submissions (Last Hour)

```sql
SELECT COUNT(*) as submission_count
FROM nigredo_leads.form_submissions
WHERE submitted_at >= NOW() - INTERVAL '1 hour';
```

## Best Practices

1. **Always check rate limit before creating lead**
2. **Use transactions when creating lead + form submission**
3. **Log all webhook attempts (success and failure)**
4. **Run cleanup_old_rate_limits() daily**
5. **Archive old webhook logs monthly**
6. **Monitor rate limit violations for abuse detection**
7. **Set up CloudWatch alarms for webhook failure rate > 10%**
8. **Use prepared statements to prevent SQL injection**
9. **Validate email and phone formats before insertion**
10. **Sanitize message field to prevent XSS**
