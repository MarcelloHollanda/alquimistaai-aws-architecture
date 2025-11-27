-- ============================================================================
-- MIGRATION 003: ALQUIMISTA PLATFORM TABLES
-- ============================================================================

CREATE TABLE alquimista_platform.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    company_name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18),
    subscription_tier VARCHAR(50) NOT NULL DEFAULT 'free',
    subscription_status VARCHAR(50) NOT NULL DEFAULT 'active',
    settings JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE alquimista_platform.tenants IS 'Stores client companies in multi-tenant architecture';

CREATE TABLE alquimista_platform.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES alquimista_platform.tenants(id) ON DELETE CASCADE,
    
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    cognito_user_id VARCHAR(255) UNIQUE,
    user_role VARCHAR(50) NOT NULL DEFAULT 'viewer',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE alquimista_platform.users IS 'Stores users with tenant association and role-based access';

CREATE TABLE alquimista_platform.agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    config JSONB DEFAULT '{}'::jsonb,
    pricing JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE alquimista_platform.agents IS 'Catalog of available AI agents in the marketplace';

CREATE TABLE alquimista_platform.agent_activations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES alquimista_platform.tenants(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES alquimista_platform.agents(id) ON DELETE CASCADE,
    
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    tenant_config JSONB DEFAULT '{}'::jsonb,
    usage_metrics JSONB DEFAULT '{"executions": 0, "successRate": 0.0, "avgDuration": 0, "totalCost": 0.0}'::jsonb,
    
    activated_at TIMESTAMP DEFAULT NOW(),
    deactivated_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_tenant_agent UNIQUE (tenant_id, agent_id)
);

COMMENT ON TABLE alquimista_platform.agent_activations IS 'Tracks activated agents per tenant with usage metrics';

CREATE TABLE alquimista_platform.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    action VARCHAR(100) NOT NULL,
    subject_type VARCHAR(50) NOT NULL,
    subject_id VARCHAR(255) NOT NULL,
    constraints JSONB DEFAULT '{}'::jsonb,
    
    granted_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    
    CONSTRAINT unique_permission UNIQUE (resource_type, resource_id, action, subject_type, subject_id)
);

COMMENT ON TABLE alquimista_platform.permissions IS 'Stores granular permissions for role-based and resource-based access control';

CREATE TABLE alquimista_platform.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    trace_id UUID NOT NULL,
    tenant_id UUID REFERENCES alquimista_platform.tenants(id) ON DELETE SET NULL,
    user_id UUID REFERENCES alquimista_platform.users(id) ON DELETE SET NULL,
    agent_id UUID REFERENCES alquimista_platform.agents(id) ON DELETE SET NULL,
    
    action_type VARCHAR(100) NOT NULL,
    result VARCHAR(50) NOT NULL,
    context JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE alquimista_platform.audit_logs IS 'Complete audit trail of all agent actions and system events for compliance';

CREATE INDEX idx_tenants_subscription_status ON alquimista_platform.tenants(subscription_status);
CREATE INDEX idx_tenants_created_at ON alquimista_platform.tenants(created_at DESC);

CREATE INDEX idx_users_tenant_id ON alquimista_platform.users(tenant_id);
CREATE INDEX idx_users_email ON alquimista_platform.users(email);
CREATE INDEX idx_users_cognito_user_id ON alquimista_platform.users(cognito_user_id) WHERE cognito_user_id IS NOT NULL;
CREATE INDEX idx_users_tenant_role ON alquimista_platform.users(tenant_id, user_role);
CREATE INDEX idx_users_status ON alquimista_platform.users(status);

CREATE INDEX idx_agents_category ON alquimista_platform.agents(category);
CREATE INDEX idx_agents_status ON alquimista_platform.agents(status);
CREATE INDEX idx_agents_category_status ON alquimista_platform.agents(category, status);

CREATE INDEX idx_activations_tenant_id ON alquimista_platform.agent_activations(tenant_id);
CREATE INDEX idx_activations_agent_id ON alquimista_platform.agent_activations(agent_id);
CREATE INDEX idx_activations_status ON alquimista_platform.agent_activations(status);
CREATE INDEX idx_activations_tenant_status ON alquimista_platform.agent_activations(tenant_id, status);

CREATE INDEX idx_permissions_resource ON alquimista_platform.permissions(resource_type, resource_id);
CREATE INDEX idx_permissions_subject ON alquimista_platform.permissions(subject_type, subject_id);
CREATE INDEX idx_permissions_expires_at ON alquimista_platform.permissions(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX idx_audit_trace_id ON alquimista_platform.audit_logs(trace_id);
CREATE INDEX idx_audit_tenant_id ON alquimista_platform.audit_logs(tenant_id);
CREATE INDEX idx_audit_user_id ON alquimista_platform.audit_logs(user_id);
CREATE INDEX idx_audit_agent_id ON alquimista_platform.audit_logs(agent_id);
CREATE INDEX idx_audit_action_type ON alquimista_platform.audit_logs(action_type);
CREATE INDEX idx_audit_created_at ON alquimista_platform.audit_logs(created_at DESC);
CREATE INDEX idx_audit_tenant_created ON alquimista_platform.audit_logs(tenant_id, created_at DESC);

CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON alquimista_platform.tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON alquimista_platform.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON alquimista_platform.agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activations_updated_at
    BEFORE UPDATE ON alquimista_platform.agent_activations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO public.migrations (migration_name, description) VALUES
('003_create_platform_tables', 'Create alquimista_platform tables for multi-tenant SaaS, users, agents catalog, permissions, and audit logs')
ON CONFLICT (migration_name) DO NOTHING;
