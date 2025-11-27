-- Migration 003: Create Alquimista Platform Tables
-- Purpose: Create tables for multi-tenant SaaS platform, users, agents catalog, permissions, and audit logs
-- Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8

-- ============================================================================
-- Table: alquimista_platform.tenants
-- Purpose: Store client companies (multi-tenant architecture)
-- ============================================================================
CREATE TABLE alquimista_platform.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Company Information
    company_name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18),
    
    -- Subscription Details
    subscription_tier VARCHAR(50) NOT NULL DEFAULT 'free',
    -- Tiers: 'free' | 'starter' | 'professional' | 'enterprise'
    subscription_status VARCHAR(50) NOT NULL DEFAULT 'active',
    -- Status: 'active' | 'suspended' | 'cancelled'
    
    -- Configuration
    settings JSONB DEFAULT '{}'::jsonb,
    -- Structure: {
    --   "calendarId": "string",
    --   "salesEmail": "string",
    --   "whatsappNumber": "string",
    --   "rateLimits": { "messagesPerHour": 100, "messagesPerDay": 500 }
    -- }
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE alquimista_platform.tenants IS 'Stores client companies in multi-tenant architecture';

-- ============================================================================
-- Table: alquimista_platform.users
-- Purpose: Store users associated with tenants
-- ============================================================================
CREATE TABLE alquimista_platform.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES alquimista_platform.tenants(id) ON DELETE CASCADE,
    
    -- User Information
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    
    -- Authentication (Cognito integration)
    cognito_user_id VARCHAR(255) UNIQUE,
    
    -- Authorization
    user_role VARCHAR(50) NOT NULL DEFAULT 'viewer',
    -- Roles: 'admin' | 'manager' | 'operator' | 'viewer'
    
    -- User Status
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    -- Status: 'active' | 'inactive' | 'suspended'
    
    -- Timestamps
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE alquimista_platform.users IS 'Stores users with tenant association and role-based access';

-- ============================================================================
-- Table: alquimista_platform.agents
-- Purpose: Store catalog of available AI agents
-- ============================================================================
CREATE TABLE alquimista_platform.agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Agent Information
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- Agent Classification
    category VARCHAR(100) NOT NULL,
    -- Categories: 'Conteúdo' | 'Social' | 'Vendas' | 'Pesquisa' | 'Agenda' | 'Finanças'
    
    -- Agent Version
    version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    
    -- Agent Status
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    -- Status: 'active' | 'deprecated' | 'beta' | 'maintenance'
    
    -- Agent Configuration
    config JSONB DEFAULT '{}'::jsonb,
    -- Structure: {
    --   "lambdaArn": "string",
    --   "requiredPermissions": ["permission1", "permission2"],
    --   "defaultSettings": {}
    -- }
    
    -- Pricing
    pricing JSONB DEFAULT '{}'::jsonb,
    -- Structure: {
    --   "model": "free" | "usage" | "subscription",
    --   "costPerExecution": 0.0,
    --   "includedInTiers": ["professional", "enterprise"]
    -- }
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE alquimista_platform.agents IS 'Catalog of available AI agents in the marketplace';

-- ============================================================================
-- Table: alquimista_platform.agent_activations
-- Purpose: Track which agents are activated for each tenant
-- ============================================================================
CREATE TABLE alquimista_platform.agent_activations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES alquimista_platform.tenants(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES alquimista_platform.agents(id) ON DELETE CASCADE,
    
    -- Activation Status
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    -- Status: 'active' | 'inactive' | 'suspended'
    
    -- Agent-specific Configuration for this tenant
    tenant_config JSONB DEFAULT '{}'::jsonb,
    
    -- Usage Metrics
    usage_metrics JSONB DEFAULT '{"executions": 0, "successRate": 0.0, "avgDuration": 0, "totalCost": 0.0}'::jsonb,
    
    -- Timestamps
    activated_at TIMESTAMP DEFAULT NOW(),
    deactivated_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Unique constraint: one activation per tenant-agent pair
    CONSTRAINT unique_tenant_agent UNIQUE (tenant_id, agent_id)
);

COMMENT ON TABLE alquimista_platform.agent_activations IS 'Tracks activated agents per tenant with usage metrics';

-- ============================================================================
-- Table: alquimista_platform.permissions
-- Purpose: Store granular permissions for agents and users
-- ============================================================================
CREATE TABLE alquimista_platform.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Permission Scope
    resource_type VARCHAR(100) NOT NULL,
    -- Types: 'agent' | 'tenant' | 'user' | 'data'
    resource_id UUID,
    
    -- Permission Details
    action VARCHAR(100) NOT NULL,
    -- Actions: 'read' | 'write' | 'execute' | 'delete' | 'manage'
    
    -- Permission Holder
    subject_type VARCHAR(50) NOT NULL,
    -- Types: 'user' | 'role' | 'agent'
    subject_id VARCHAR(255) NOT NULL,
    
    -- Permission Constraints
    constraints JSONB DEFAULT '{}'::jsonb,
    -- Structure: {
    --   "timeWindow": { "start": "09:00", "end": "18:00" },
    --   "maxExecutions": 100,
    --   "requiresApproval": true
    -- }
    
    -- Timestamps
    granted_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    
    -- Unique constraint to prevent duplicate permissions
    CONSTRAINT unique_permission UNIQUE (resource_type, resource_id, action, subject_type, subject_id)
);

COMMENT ON TABLE alquimista_platform.permissions IS 'Stores granular permissions for role-based and resource-based access control';

-- ============================================================================
-- Table: alquimista_platform.audit_logs
-- Purpose: Store audit trail of all agent actions and system events
-- ============================================================================
CREATE TABLE alquimista_platform.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Tracing
    trace_id UUID NOT NULL,
    
    -- Actor Information
    tenant_id UUID REFERENCES alquimista_platform.tenants(id) ON DELETE SET NULL,
    user_id UUID REFERENCES alquimista_platform.users(id) ON DELETE SET NULL,
    agent_id UUID REFERENCES alquimista_platform.agents(id) ON DELETE SET NULL,
    
    -- Action Details
    action_type VARCHAR(100) NOT NULL,
    -- Types: 'agent.activated' | 'agent.deactivated' | 'agent.executed' | 'user.login' | 'data.accessed' | 'permission.granted'
    
    -- Action Result
    result VARCHAR(50) NOT NULL,
    -- Results: 'success' | 'failure' | 'partial'
    
    -- Action Context
    context JSONB DEFAULT '{}'::jsonb,
    -- Structure: {
    --   "resource": "string",
    --   "parameters": {},
    --   "ipAddress": "string",
    --   "userAgent": "string"
    -- }
    
    -- Error Information (if applicable)
    error_message TEXT,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE alquimista_platform.audit_logs IS 'Complete audit trail of all agent actions and system events for compliance';

-- ============================================================================
-- Indexes for Performance Optimization
-- ============================================================================

-- Tenants table indexes
CREATE INDEX idx_tenants_subscription_status ON alquimista_platform.tenants(subscription_status);
CREATE INDEX idx_tenants_created_at ON alquimista_platform.tenants(created_at DESC);

-- Users table indexes
CREATE INDEX idx_users_tenant_id ON alquimista_platform.users(tenant_id);
CREATE INDEX idx_users_email ON alquimista_platform.users(email);
CREATE INDEX idx_users_cognito_user_id ON alquimista_platform.users(cognito_user_id) WHERE cognito_user_id IS NOT NULL;
CREATE INDEX idx_users_tenant_role ON alquimista_platform.users(tenant_id, user_role);
CREATE INDEX idx_users_status ON alquimista_platform.users(status);

-- Agents table indexes
CREATE INDEX idx_agents_category ON alquimista_platform.agents(category);
CREATE INDEX idx_agents_status ON alquimista_platform.agents(status);
CREATE INDEX idx_agents_category_status ON alquimista_platform.agents(category, status);

-- Agent_activations table indexes
CREATE INDEX idx_activations_tenant_id ON alquimista_platform.agent_activations(tenant_id);
CREATE INDEX idx_activations_agent_id ON alquimista_platform.agent_activations(agent_id);
CREATE INDEX idx_activations_status ON alquimista_platform.agent_activations(status);
CREATE INDEX idx_activations_tenant_status ON alquimista_platform.agent_activations(tenant_id, status);

-- Permissions table indexes
CREATE INDEX idx_permissions_resource ON alquimista_platform.permissions(resource_type, resource_id);
CREATE INDEX idx_permissions_subject ON alquimista_platform.permissions(subject_type, subject_id);
CREATE INDEX idx_permissions_expires_at ON alquimista_platform.permissions(expires_at) WHERE expires_at IS NOT NULL;

-- Audit_logs table indexes
CREATE INDEX idx_audit_trace_id ON alquimista_platform.audit_logs(trace_id);
CREATE INDEX idx_audit_tenant_id ON alquimista_platform.audit_logs(tenant_id);
CREATE INDEX idx_audit_user_id ON alquimista_platform.audit_logs(user_id);
CREATE INDEX idx_audit_agent_id ON alquimista_platform.audit_logs(agent_id);
CREATE INDEX idx_audit_action_type ON alquimista_platform.audit_logs(action_type);
CREATE INDEX idx_audit_created_at ON alquimista_platform.audit_logs(created_at DESC);
CREATE INDEX idx_audit_tenant_created ON alquimista_platform.audit_logs(tenant_id, created_at DESC);

-- ============================================================================
-- Trigger: Update updated_at timestamp automatically
-- ============================================================================

-- Apply trigger to tables with updated_at column
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON alquimista_platform.tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON alquimista_platform.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON alquimista_platform.agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activations_updated_at BEFORE UPDATE ON alquimista_platform.agent_activations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Record Migration
-- ============================================================================

INSERT INTO public.migrations (migration_name, description)
VALUES ('003_create_platform_tables', 'Create alquimista_platform tables for multi-tenant SaaS, users, agents catalog, permissions, and audit logs')
ON CONFLICT (migration_name) DO NOTHING;
