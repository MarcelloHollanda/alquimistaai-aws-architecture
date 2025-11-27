-- Migration 007: Create Nigredo Prospecting Core Schema
-- Purpose: Create tables for public prospecting forms, webhooks, and rate limiting
-- Requirements: 1.2, 3.3, 5.1

-- ============================================================================
-- Table: nigredo_leads.form_submissions
-- Purpose: Track all form submissions with IP and user agent for rate limiting
-- ============================================================================
CREATE TABLE IF NOT EXISTS nigredo_leads.form_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES nigredo_leads.leads(id) ON DELETE CASCADE,
    
    -- Request Information
    ip_address INET NOT NULL,
    user_agent TEXT,
    referer TEXT,
    
    -- Submission Metadata
    source VARCHAR(100), -- 'landing_page', 'embedded_form', 'api'
    form_type VARCHAR(100), -- 'contact', 'demo_request', 'newsletter'
    
    -- Timestamp
    submitted_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE nigredo_leads.form_submissions IS 'Tracks all form submissions with request metadata for rate limiting and analytics';
COMMENT ON COLUMN nigredo_leads.form_submissions.ip_address IS 'IP address of the submitter for rate limiting';
COMMENT ON COLUMN nigredo_leads.form_submissions.user_agent IS 'Browser user agent string for analytics';

-- ============================================================================
-- Table: nigredo_leads.webhook_logs
-- Purpose: Log all webhook delivery attempts to Fibonacci system
-- ============================================================================
CREATE TABLE IF NOT EXISTS nigredo_leads.webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES nigredo_leads.leads(id) ON DELETE CASCADE,
    
    -- Webhook Details
    webhook_url TEXT NOT NULL,
    payload JSONB NOT NULL,
    
    -- Response Information
    status_code INTEGER,
    response_body TEXT,
    
    -- Retry Information
    attempt_number INTEGER DEFAULT 1 CHECK (attempt_number >= 1 AND attempt_number <= 3),
    success BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    
    -- Timestamp
    sent_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE nigredo_leads.webhook_logs IS 'Logs all webhook delivery attempts with retry tracking';
COMMENT ON COLUMN nigredo_leads.webhook_logs.attempt_number IS 'Retry attempt number (1-3)';
COMMENT ON COLUMN nigredo_leads.webhook_logs.success IS 'Whether the webhook was successfully delivered';

-- ============================================================================
-- Table: nigredo_leads.rate_limits
-- Purpose: Track submission rate limits per IP address
-- ============================================================================
CREATE TABLE IF NOT EXISTS nigredo_leads.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address INET NOT NULL,
    
    -- Rate Limit Tracking
    submission_count INTEGER DEFAULT 1 CHECK (submission_count >= 0),
    window_start TIMESTAMP DEFAULT NOW(),
    window_end TIMESTAMP GENERATED ALWAYS AS (window_start + INTERVAL '1 hour') STORED,
    
    -- Metadata
    last_submission_at TIMESTAMP DEFAULT NOW(),
    blocked_until TIMESTAMP,
    
    -- Unique constraint per IP per time window
    CONSTRAINT unique_ip_window UNIQUE (ip_address, window_start)
);

COMMENT ON TABLE nigredo_leads.rate_limits IS 'Tracks submission rate limits per IP address (10 submissions per hour)';
COMMENT ON COLUMN nigredo_leads.rate_limits.submission_count IS 'Number of submissions in current window';
COMMENT ON COLUMN nigredo_leads.rate_limits.window_start IS 'Start of the rate limit window';
COMMENT ON COLUMN nigredo_leads.rate_limits.window_end IS 'End of the rate limit window (window_start + 1 hour)';
COMMENT ON COLUMN nigredo_leads.rate_limits.blocked_until IS 'Timestamp until which the IP is blocked (for abuse prevention)';

-- ============================================================================
-- Indexes for Performance Optimization
-- ============================================================================

-- Form submissions indexes
CREATE INDEX idx_form_submissions_lead_id ON nigredo_leads.form_submissions(lead_id);
CREATE INDEX idx_form_submissions_ip ON nigredo_leads.form_submissions(ip_address, submitted_at DESC);
CREATE INDEX idx_form_submissions_submitted_at ON nigredo_leads.form_submissions(submitted_at DESC);
CREATE INDEX idx_form_submissions_source ON nigredo_leads.form_submissions(source);

-- Webhook logs indexes
CREATE INDEX idx_webhook_logs_lead_id ON nigredo_leads.webhook_logs(lead_id);
CREATE INDEX idx_webhook_logs_success ON nigredo_leads.webhook_logs(success, sent_at DESC);
CREATE INDEX idx_webhook_logs_sent_at ON nigredo_leads.webhook_logs(sent_at DESC);
CREATE INDEX idx_webhook_logs_lead_success ON nigredo_leads.webhook_logs(lead_id, success);

-- Rate limits indexes
CREATE INDEX idx_rate_limits_ip ON nigredo_leads.rate_limits(ip_address, window_start DESC);
CREATE INDEX idx_rate_limits_window ON nigredo_leads.rate_limits(window_start, window_end);
CREATE INDEX idx_rate_limits_blocked ON nigredo_leads.rate_limits(blocked_until) WHERE blocked_until IS NOT NULL;

-- ============================================================================
-- Function: Clean up old rate limit records
-- Purpose: Remove rate limit records older than 24 hours
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
    DELETE FROM nigredo_leads.rate_limits
    WHERE window_end < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_rate_limits() IS 'Removes rate limit records older than 24 hours to prevent table bloat';

-- ============================================================================
-- Function: Check rate limit for IP address
-- Purpose: Check if an IP address has exceeded the rate limit
-- ============================================================================

CREATE OR REPLACE FUNCTION check_rate_limit(p_ip_address INET)
RETURNS TABLE (
    is_allowed BOOLEAN,
    current_count INTEGER,
    limit_count INTEGER,
    window_reset_at TIMESTAMP
) AS $$
DECLARE
    v_current_count INTEGER;
    v_window_start TIMESTAMP;
    v_blocked_until TIMESTAMP;
    v_limit_count INTEGER := 10; -- 10 submissions per hour
BEGIN
    -- Check if IP is currently blocked
    SELECT blocked_until INTO v_blocked_until
    FROM nigredo_leads.rate_limits
    WHERE ip_address = p_ip_address
    AND blocked_until > NOW()
    ORDER BY blocked_until DESC
    LIMIT 1;
    
    IF v_blocked_until IS NOT NULL THEN
        RETURN QUERY SELECT FALSE, v_limit_count, v_limit_count, v_blocked_until;
        RETURN;
    END IF;
    
    -- Get current window count
    SELECT submission_count, window_start INTO v_current_count, v_window_start
    FROM nigredo_leads.rate_limits
    WHERE ip_address = p_ip_address
    AND window_end > NOW()
    ORDER BY window_start DESC
    LIMIT 1;
    
    -- If no active window found, allow submission
    IF v_current_count IS NULL THEN
        RETURN QUERY SELECT TRUE, 0, v_limit_count, NOW() + INTERVAL '1 hour';
        RETURN;
    END IF;
    
    -- Check if limit exceeded
    IF v_current_count >= v_limit_count THEN
        RETURN QUERY SELECT FALSE, v_current_count, v_limit_count, v_window_start + INTERVAL '1 hour';
    ELSE
        RETURN QUERY SELECT TRUE, v_current_count, v_limit_count, v_window_start + INTERVAL '1 hour';
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_rate_limit(INET) IS 'Checks if an IP address is allowed to submit based on rate limits';

-- ============================================================================
-- Function: Increment rate limit counter
-- Purpose: Increment submission count for an IP address
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_rate_limit(p_ip_address INET)
RETURNS void AS $$
DECLARE
    v_window_start TIMESTAMP;
BEGIN
    -- Try to find active window
    SELECT window_start INTO v_window_start
    FROM nigredo_leads.rate_limits
    WHERE ip_address = p_ip_address
    AND window_end > NOW()
    ORDER BY window_start DESC
    LIMIT 1;
    
    IF v_window_start IS NOT NULL THEN
        -- Update existing window
        UPDATE nigredo_leads.rate_limits
        SET submission_count = submission_count + 1,
            last_submission_at = NOW()
        WHERE ip_address = p_ip_address
        AND window_start = v_window_start;
    ELSE
        -- Create new window
        INSERT INTO nigredo_leads.rate_limits (ip_address, submission_count, window_start, last_submission_at)
        VALUES (p_ip_address, 1, NOW(), NOW())
        ON CONFLICT (ip_address, window_start) DO UPDATE
        SET submission_count = nigredo_leads.rate_limits.submission_count + 1,
            last_submission_at = NOW();
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_rate_limit(INET) IS 'Increments the submission count for an IP address in the current window';

-- ============================================================================
-- Add additional columns to existing leads table for prospecting forms
-- ============================================================================

-- Add columns if they don't exist (for prospecting form data)
DO $$
BEGIN
    -- Add name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'nigredo_leads' 
        AND table_name = 'leads' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE nigredo_leads.leads ADD COLUMN name VARCHAR(100);
        COMMENT ON COLUMN nigredo_leads.leads.name IS 'Lead contact name from prospecting form';
    END IF;
    
    -- Add phone column if it doesn't exist (different from telefone)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'nigredo_leads' 
        AND table_name = 'leads' 
        AND column_name = 'phone'
    ) THEN
        ALTER TABLE nigredo_leads.leads ADD COLUMN phone VARCHAR(20);
        COMMENT ON COLUMN nigredo_leads.leads.phone IS 'Lead phone number in E.164 format from prospecting form';
    END IF;
    
    -- Add company column if it doesn't exist (different from empresa)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'nigredo_leads' 
        AND table_name = 'leads' 
        AND column_name = 'company'
    ) THEN
        ALTER TABLE nigredo_leads.leads ADD COLUMN company VARCHAR(100);
        COMMENT ON COLUMN nigredo_leads.leads.company IS 'Lead company name from prospecting form';
    END IF;
    
    -- Add message column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'nigredo_leads' 
        AND table_name = 'leads' 
        AND column_name = 'message'
    ) THEN
        ALTER TABLE nigredo_leads.leads ADD COLUMN message TEXT;
        COMMENT ON COLUMN nigredo_leads.leads.message IS 'Lead message from prospecting form (max 1000 chars)';
    END IF;
    
    -- Add utm_source column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'nigredo_leads' 
        AND table_name = 'leads' 
        AND column_name = 'utm_source'
    ) THEN
        ALTER TABLE nigredo_leads.leads ADD COLUMN utm_source VARCHAR(100);
        COMMENT ON COLUMN nigredo_leads.leads.utm_source IS 'UTM source parameter for tracking';
    END IF;
    
    -- Add utm_medium column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'nigredo_leads' 
        AND table_name = 'leads' 
        AND column_name = 'utm_medium'
    ) THEN
        ALTER TABLE nigredo_leads.leads ADD COLUMN utm_medium VARCHAR(100);
        COMMENT ON COLUMN nigredo_leads.leads.utm_medium IS 'UTM medium parameter for tracking';
    END IF;
    
    -- Add utm_campaign column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'nigredo_leads' 
        AND table_name = 'leads' 
        AND column_name = 'utm_campaign'
    ) THEN
        ALTER TABLE nigredo_leads.leads ADD COLUMN utm_campaign VARCHAR(100);
        COMMENT ON COLUMN nigredo_leads.leads.utm_campaign IS 'UTM campaign parameter for tracking';
    END IF;
    
    -- Add ip_address column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'nigredo_leads' 
        AND table_name = 'leads' 
        AND column_name = 'ip_address'
    ) THEN
        ALTER TABLE nigredo_leads.leads ADD COLUMN ip_address INET;
        COMMENT ON COLUMN nigredo_leads.leads.ip_address IS 'IP address of the lead submission';
    END IF;
    
    -- Add user_agent column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'nigredo_leads' 
        AND table_name = 'leads' 
        AND column_name = 'user_agent'
    ) THEN
        ALTER TABLE nigredo_leads.leads ADD COLUMN user_agent TEXT;
        COMMENT ON COLUMN nigredo_leads.leads.user_agent IS 'User agent string of the lead submission';
    END IF;
END $$;

-- ============================================================================
-- Add indexes for new columns
-- ============================================================================

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_leads_name ON nigredo_leads.leads(name) WHERE name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_phone ON nigredo_leads.leads(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_company ON nigredo_leads.leads(company) WHERE company IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_utm_source ON nigredo_leads.leads(utm_source) WHERE utm_source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_ip_address ON nigredo_leads.leads(ip_address) WHERE ip_address IS NOT NULL;

-- ============================================================================
-- Add constraints for data integrity
-- ============================================================================

-- Add check constraint for message length (max 1000 characters)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE table_schema = 'nigredo_leads' 
        AND table_name = 'leads' 
        AND constraint_name = 'leads_message_length'
    ) THEN
        ALTER TABLE nigredo_leads.leads 
        ADD CONSTRAINT leads_message_length CHECK (LENGTH(message) <= 1000);
    END IF;
END $$;

-- Add check constraint for email format (RFC 5322 basic validation)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE table_schema = 'nigredo_leads' 
        AND table_name = 'leads' 
        AND constraint_name = 'leads_email_format'
    ) THEN
        ALTER TABLE nigredo_leads.leads 
        ADD CONSTRAINT leads_email_format CHECK (
            email IS NULL OR 
            email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'
        );
    END IF;
END $$;

-- Add check constraint for phone format (E.164 format)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE table_schema = 'nigredo_leads' 
        AND table_name = 'leads' 
        AND constraint_name = 'leads_phone_format'
    ) THEN
        ALTER TABLE nigredo_leads.leads 
        ADD CONSTRAINT leads_phone_format CHECK (
            phone IS NULL OR 
            phone ~ '^\+[1-9]\d{1,14}$'
        );
    END IF;
END $$;

-- ============================================================================
-- Record Migration
-- ============================================================================

INSERT INTO public.migrations (migration_name, description)
VALUES ('007_create_nigredo_schema', 'Create Nigredo Prospecting Core tables for form submissions, webhooks, and rate limiting')
ON CONFLICT (migration_name) DO NOTHING;
