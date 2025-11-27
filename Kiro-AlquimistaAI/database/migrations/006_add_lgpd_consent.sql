-- Migration 006: Add LGPD Consent Fields
-- Purpose: Add consent tracking fields to leads table for LGPD compliance
-- Requirements: 17.7, 11.12

-- ============================================================================
-- Add consent fields to leads table
-- ============================================================================

ALTER TABLE nigredo_leads.leads
ADD COLUMN consent_given BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN consent_date TIMESTAMP,
ADD COLUMN consent_source VARCHAR(100),
ADD COLUMN consent_ip_address VARCHAR(45);

COMMENT ON COLUMN nigredo_leads.leads.consent_given IS 'LGPD: Indicates if lead has given explicit consent for data processing';
COMMENT ON COLUMN nigredo_leads.leads.consent_date IS 'LGPD: Timestamp when consent was given';
COMMENT ON COLUMN nigredo_leads.leads.consent_source IS 'LGPD: Source where consent was obtained (e.g., web_form, api, manual)';
COMMENT ON COLUMN nigredo_leads.leads.consent_ip_address IS 'LGPD: IP address from which consent was given (for audit trail)';

-- ============================================================================
-- Create index for consent queries
-- ============================================================================

CREATE INDEX idx_leads_consent ON nigredo_leads.leads(consent_given, tenant_id);

-- ============================================================================
-- Update existing leads to require consent validation
-- ============================================================================

-- Note: Existing leads will have consent_given = FALSE by default
-- They must be validated before processing
COMMENT ON TABLE nigredo_leads.leads IS 'Stores lead information with enrichment data, status tracking, and LGPD consent';

-- ============================================================================
-- Record Migration
-- ============================================================================

INSERT INTO public.migrations (migration_name, description)
VALUES ('006_add_lgpd_consent', 'Add LGPD consent tracking fields to leads table')
ON CONFLICT (migration_name) DO NOTHING;
