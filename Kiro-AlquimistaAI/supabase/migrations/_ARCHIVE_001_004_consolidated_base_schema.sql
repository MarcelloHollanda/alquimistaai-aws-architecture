-- ============================================================================
-- MIGRATIONS 001-004 CONSOLIDADAS - BASE SCHEMA ALQUIMISTA.AI
-- ============================================================================
-- Propósito: Criar estrutura base de schemas e tabelas para o ecossistema
-- Compatível com: Supabase PostgreSQL
-- Dependências: Nenhuma (primeira migration)
-- Próximas migrations: 005-010 (aprovações, LGPD, nigredo, billing, subscriptions, plans)
-- ============================================================================

-- ============================================================================
-- MIGRATION 001: CREATE SCHEMAS
-- ============================================================================

-- Schema: fibonacci_core
-- Propósito: Dados de orquestração central (eventos, traces, métricas)
CREATE SCHEMA IF NOT EXISTS fibonacci_core;
COMMENT ON SCHEMA fibonacci_core IS 'Core orchestration schema for Fibonacci system - stores events, traces, and metrics';

-- Schema: nigredo_leads
-- Propósito: Dados de prospecção e gestão de leads
CREATE SCHEMA IF NOT EXISTS nigredo_leads;
COMMENT ON SCHEMA nigredo_leads IS 'Nigredo prospecting schema - stores leads, campaigns, interactions, and scheduling data';

-- Schema: alquimista_platform
-- Propósito: Dados da plataforma SaaS (tenants, usuários, agentes, permissões)
CREATE SCHEMA IF NOT EXISTS alquimista_platform;
COMMENT ON SCHEMA alquimista_platform IS 'Alquimista platform schema - stores multi-tenant data, users, agents catalog, and permissions';

-- Grant Permissions
GRANT USAGE ON SCHEMA fibonacci_core TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA nigredo_leads TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA alquimista_platform TO postgres, anon, authenticated, service_role;

-- Grant privileges on future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA fibonacci_core GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA nigredo_leads GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA alquimista_platform GRANT ALL ON TABLES TO postgres, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA fibonacci_core GRANT SELECT ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA nigredo_leads GRANT SELECT ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA alquimista_platform GRANT SELECT ON TABLES TO authenticated;

-- Grant privileges on sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA fibonacci_core GRANT ALL ON SEQUENCES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA nigredo_leads GRANT ALL ON SEQUENCES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA alquimista_platform GRANT ALL ON SEQUENCES TO postgres, service_role;

-- ============================================================================
-- MIGRATION TRACKING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP DEFAULT NOW(),
    description TEXT
);

COMMENT ON TABLE public.migrations IS 'Tracks applied database migrations';

-- ============================================================================
-- MIGRATION 002: NIGREDO LEADS TABLES
-- ============================================================================

-- Table: nigredo_leads.leads
CREATE TABLE nigredo_leads.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Company Information
    empresa VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18),
    setor VARCHAR(100),
    porte VARCHAR(50),
    atividade_principal TEXT,
    
    -- Contact Information
    contato VARCHAR(255),
    telefone VARCHAR(20),
    email VARCHAR(255),
    
    -- Lead Status
    status VARCHAR(50) NOT NULL DEFAULT 'novo',
    priority_score INTEGER DEFAULT 0 CHECK (priority_score >= 0 AND priority_score <= 100),
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT leads_email_or_phone_required CHECK (email IS NOT NULL OR telefone IS NOT NULL)
);

COMMENT ON TABLE nigredo_leads.leads IS 'Stores lead information with enrichment data and status tracking';

-- Table: nigredo_leads.campanhas
CREATE TABLE nigredo_leads.campanhas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    nome VARCHAR(255) NOT NULL,
    segmento VARCHAR(100),
    canal VARCHAR(50) NOT NULL,
    mensagens JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'rascunho',
    metricas JSONB DEFAULT '{"enviados": 0, "entregues": 0, "lidos": 0, "respondidos": 0, "interessados": 0}'::jsonb,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE nigredo_leads.campanhas IS 'Stores marketing campaigns with segmentation, messaging, and metrics';

-- Table: nigredo_leads.interacoes
CREATE TABLE nigredo_leads.interacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES nigredo_leads.leads(id) ON DELETE CASCADE,
    
    tipo VARCHAR(50) NOT NULL,
    canal VARCHAR(50) NOT NULL,
    mensagem TEXT NOT NULL,
    sentimento VARCHAR(50),
    intensidade INTEGER CHECK (intensidade >= 0 AND intensidade <= 100),
    trace_id UUID NOT NULL,
    
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE nigredo_leads.interacoes IS 'Stores complete interaction history with sentiment analysis';

-- Table: nigredo_leads.agendamentos
CREATE TABLE nigredo_leads.agendamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES nigredo_leads.leads(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    
    data_hora TIMESTAMP NOT NULL,
    duracao INTEGER DEFAULT 60,
    status VARCHAR(50) NOT NULL DEFAULT 'proposto',
    calendar_event_id VARCHAR(255),
    briefing TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE nigredo_leads.agendamentos IS 'Stores scheduled meetings with leads and calendar integration';

-- Table: nigredo_leads.metricas_diarias
CREATE TABLE nigredo_leads.metricas_diarias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    data DATE NOT NULL,
    metricas JSONB NOT NULL,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_tenant_date UNIQUE (tenant_id, data)
);

COMMENT ON TABLE nigredo_leads.metricas_diarias IS 'Stores daily aggregated metrics for funnel analysis and reporting';

-- Table: nigredo_leads.blocklist
CREATE TABLE nigredo_leads.blocklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES nigredo_leads.leads(id) ON DELETE SET NULL,
    
    telefone VARCHAR(20),
    email VARCHAR(255),
    reason TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT blocklist_contact_required CHECK (telefone IS NOT NULL OR email IS NOT NULL)
);

COMMENT ON TABLE nigredo_leads.blocklist IS 'LGPD compliance - stores contacts who requested removal from communications';

-- ============================================================================
-- MIGRATION 003: ALQUIMISTA PLATFORM TABLES
-- ============================================================================

-- Table: alquimista_platform.tenants
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

-- Table: alquimista_platform.users
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

-- Table: alquimista_platform.agents
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

-- Table: alquimista_platform.agent_activations
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

-- Table: alquimista_platform.permissions
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

-- Table: alquimista_platform.audit_logs
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

-- ============================================================================
-- MIGRATION 004: FIBONACCI CORE TABLES
-- ============================================================================

-- Table: fibonacci_core.events
CREATE TABLE fibonacci_core.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    event_id VARCHAR(255) NOT NULL UNIQUE,
    trace_id UUID NOT NULL,
    source VARCHAR(255) NOT NULL,
    event_type VARCHAR(255) NOT NULL,
    detail JSONB NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'published',
    
    processed_at TIMESTAMP,
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE fibonacci_core.events IS 'Complete history of all events in the fractal ecosystem for audit and replay';

-- Table: fibonacci_core.traces
CREATE TABLE fibonacci_core.traces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    trace_id UUID NOT NULL UNIQUE,
    parent_trace_id UUID,
    tenant_id UUID,
    lead_id UUID,
    
    span_name VARCHAR(255) NOT NULL,
    span_type VARCHAR(100) NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_ms INTEGER,
    status VARCHAR(50) NOT NULL DEFAULT 'in_progress',
    
    annotations JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    error_stack TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE fibonacci_core.traces IS 'Distributed tracing across all agents for performance monitoring and debugging';

-- Table: fibonacci_core.metrics
CREATE TABLE fibonacci_core.metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    metric_name VARCHAR(255) NOT NULL,
    dimensions JSONB NOT NULL,
    value NUMERIC NOT NULL,
    unit VARCHAR(50) NOT NULL,
    
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    aggregation_type VARCHAR(50) NOT NULL,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_metric_period UNIQUE (metric_name, dimensions, period_start, aggregation_type)
);

COMMENT ON TABLE fibonacci_core.metrics IS 'Aggregated metrics for system monitoring, alerting, and dashboards';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Nigredo Leads Indexes
CREATE INDEX idx_leads_tenant_id ON nigredo_leads.leads(tenant_id);
CREATE INDEX idx_leads_status ON nigredo_leads.leads(status);
CREATE INDEX idx_leads_email ON nigredo_leads.leads(email) WHERE email IS NOT NULL;
CREATE INDEX idx_leads_telefone ON nigredo_leads.leads(telefone) WHERE telefone IS NOT NULL;
CREATE INDEX idx_leads_cnpj ON nigredo_leads.leads(cnpj) WHERE cnpj IS NOT NULL;
CREATE INDEX idx_leads_created_at ON nigredo_leads.leads(created_at DESC);
CREATE INDEX idx_leads_tenant_status ON nigredo_leads.leads(tenant_id, status);

CREATE INDEX idx_campanhas_tenant_id ON nigredo_leads.campanhas(tenant_id);
CREATE INDEX idx_campanhas_status ON nigredo_leads.campanhas(status);
CREATE INDEX idx_campanhas_tenant_status ON nigredo_leads.campanhas(tenant_id, status);

CREATE INDEX idx_interacoes_lead_id ON nigredo_leads.interacoes(lead_id);
CREATE INDEX idx_interacoes_trace_id ON nigredo_leads.interacoes(trace_id);
CREATE INDEX idx_interacoes_created_at ON nigredo_leads.interacoes(created_at DESC);
CREATE INDEX idx_interacoes_lead_created ON nigredo_leads.interacoes(lead_id, created_at DESC);

CREATE INDEX idx_agendamentos_lead_id ON nigredo_leads.agendamentos(lead_id);
CREATE INDEX idx_agendamentos_tenant_id ON nigredo_leads.agendamentos(tenant_id);
CREATE INDEX idx_agendamentos_data_hora ON nigredo_leads.agendamentos(data_hora);
CREATE INDEX idx_agendamentos_status ON nigredo_leads.agendamentos(status);
CREATE INDEX idx_agendamentos_tenant_data ON nigredo_leads.agendamentos(tenant_id, data_hora);

CREATE INDEX idx_metricas_tenant_data ON nigredo_leads.metricas_diarias(tenant_id, data DESC);

CREATE INDEX idx_blocklist_telefone ON nigredo_leads.blocklist(telefone) WHERE telefone IS NOT NULL;
CREATE INDEX idx_blocklist_email ON nigredo_leads.blocklist(email) WHERE email IS NOT NULL;

-- Platform Indexes
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

-- Core Indexes
CREATE INDEX idx_events_trace_id ON fibonacci_core.events(trace_id);
CREATE INDEX idx_events_source ON fibonacci_core.events(source);
CREATE INDEX idx_events_event_type ON fibonacci_core.events(event_type);
CREATE INDEX idx_events_status ON fibonacci_core.events(status);
CREATE INDEX idx_events_created_at ON fibonacci_core.events(created_at DESC);
CREATE INDEX idx_events_source_type ON fibonacci_core.events(source, event_type);
CREATE INDEX idx_events_metadata_tenant ON fibonacci_core.events((metadata->>'tenantId'));
CREATE INDEX idx_events_metadata_lead ON fibonacci_core.events((metadata->>'leadId'));

CREATE INDEX idx_traces_trace_id ON fibonacci_core.traces(trace_id);
CREATE INDEX idx_traces_parent_trace_id ON fibonacci_core.traces(parent_trace_id) WHERE parent_trace_id IS NOT NULL;
CREATE INDEX idx_traces_tenant_id ON fibonacci_core.traces(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_traces_lead_id ON fibonacci_core.traces(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX idx_traces_service_name ON fibonacci_core.traces(service_name);
CREATE INDEX idx_traces_status ON fibonacci_core.traces(status);
CREATE INDEX idx_traces_start_time ON fibonacci_core.traces(start_time DESC);
CREATE INDEX idx_traces_duration ON fibonacci_core.traces(duration_ms) WHERE duration_ms IS NOT NULL;
CREATE INDEX idx_traces_service_status ON fibonacci_core.traces(service_name, status);

CREATE INDEX idx_metrics_metric_name ON fibonacci_core.metrics(metric_name);
CREATE INDEX idx_metrics_period_start ON fibonacci_core.metrics(period_start DESC);
CREATE INDEX idx_metrics_metric_period ON fibonacci_core.metrics(metric_name, period_start DESC);
CREATE INDEX idx_metrics_dimensions_tenant ON fibonacci_core.metrics((dimensions->>'tenantId'));
CREATE INDEX idx_metrics_dimensions_agent ON fibonacci_core.metrics((dimensions->>'agentName'));

-- ============================================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON nigredo_leads.leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campanhas_updated_at BEFORE UPDATE ON nigredo_leads.campanhas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agendamentos_updated_at BEFORE UPDATE ON nigredo_leads.agendamentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON alquimista_platform.tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON alquimista_platform.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON alquimista_platform.agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activations_updated_at BEFORE UPDATE ON alquimista_platform.agent_activations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Calculate trace duration
CREATE OR REPLACE FUNCTION fibonacci_core.calculate_trace_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
        NEW.duration_ms = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) * 1000;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_trace_duration_trigger
    BEFORE INSERT OR UPDATE ON fibonacci_core.traces
    FOR EACH ROW
    EXECUTE FUNCTION fibonacci_core.calculate_trace_duration();

-- ============================================================================
-- RECORD MIGRATIONS
-- ============================================================================

INSERT INTO public.migrations (migration_name, description) VALUES
('001_create_schemas', 'Create fibonacci_core, nigredo_leads, and alquimista_platform schemas'),
('002_create_leads_tables', 'Create nigredo_leads tables for lead management, campaigns, interactions, scheduling, and LGPD compliance'),
('003_create_platform_tables', 'Create alquimista_platform tables for multi-tenant SaaS, users, agents catalog, permissions, and audit logs'),
('004_create_core_tables', 'Create fibonacci_core tables for event history, distributed tracing, and aggregated metrics')
ON CONFLICT (migration_name) DO NOTHING;

-- ============================================================================
-- FIM DAS MIGRATIONS 001-004
-- ============================================================================
