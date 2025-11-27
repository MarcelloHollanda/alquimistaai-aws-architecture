-- Production Data Seed Template
-- Purpose: Replace demo data with real production data
-- Instructions: 
--   1. Copy this file to 001_production_data.sql
--   2. Replace all [PLACEHOLDER] values with your real data
--   3. DO NOT commit the filled file to version control
--   4. Add 001_production_data.sql to .gitignore

-- ============================================================================
-- Production Tenant
-- ============================================================================

INSERT INTO alquimista_platform.tenants (
    id,
    company_name,
    cnpj,
    subscription_tier,
    subscription_status,'84997084444'
    settings
) VALUES (
    gen_random_uuid(),
    'AlquimistaAI - Trasmut Dades',  -- Ex: "Alquimista AI Ltda"
    '464.076.503-72',          -- Ex: "12.345.678/0001-90"
    '[SUBSCRIPTION_TIER]',  -- Options: 'starter', 'professional', 'enterprise'
    'active',
    '{
        "calendarId": "alquimistafibonacci@gmail.com",      -- Ex: "vendas@suaempresa.com"
        "salesEmail": "alquimistafibonacci@gmail.com",         -- Ex: "vendas@suaempresa.com"
        "whatsappNumber": "+5585997084444",        -- Ex: "+5511987654321"
        "rateLimits": {
            "messagesPerHour": 100,
            "messagesPerDay": 500
        }
    }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Production Admin User
-- ============================================================================

INSERT INTO alquimista_platform.users (
    id,
    tenant_id,
    email,
    full_name,
    user_role,
    status
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM alquimista_platform.tenants WHERE company_name = '[YOUR_COMPANY_NAME]'),
    'alquimistafibonacci@gmail.com',   -- Ex: "admin@suaempresa.com"
    'marcellohollanda',     -- Ex: "João Silva"
    'admin',
    'active'
) ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- Activate Nigredo Agents for Production Tenant
-- ============================================================================

-- Activate all Nigredo agents for production tenant
INSERT INTO alquimista_platform.agent_activations (
    tenant_id,
    agent_id,
    activated_by,
    status
)
SELECT 
    t.id,
    a.id,
    u.id,
    'active'
FROM alquimista_platform.tenants t
CROSS JOIN alquimista_platform.agents a
JOIN alquimista_platform.users u ON u.tenant_id = t.id
WHERE t.company_name = '[YOUR_COMPANY_NAME]'
  AND a.category = 'Prospecção'
  AND u.user_role = 'admin'
ON CONFLICT (tenant_id, agent_id) DO NOTHING;

-- ============================================================================
-- Optional: Add Additional Users
-- ============================================================================

-- Uncomment and fill to add more users
/*
INSERT INTO alquimista_platform.users (
    id,
    tenant_id,
    email,
    full_name,
    user_role,
    status
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM alquimista_platform.tenants WHERE company_name = '[YOUR_COMPANY_NAME]'),
    '[USER_EMAIL]',
    '[USER_NAME]',
    'user',  -- Options: 'admin', 'user', 'viewer'
    'active'
);
*/
