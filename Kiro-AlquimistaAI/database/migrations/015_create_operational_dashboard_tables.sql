-- Migration 015: Criar tabelas para Painel Operacional AlquimistaAI
-- Data: 2024-11-18
-- Descrição: Tabelas para gerenciamento de tenants, usuários, agentes, integrações e métricas

-- ========================================
-- Tabela: tenant_users
-- Relaciona usuários do Cognito com tenants
-- ========================================
CREATE TABLE IF NOT EXISTS tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cognito_sub VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'user', 'viewer')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

CREATE INDEX idx_tenant_users_tenant_id ON tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_cognito_sub ON tenant_users(cognito_sub);
CREATE INDEX idx_tenant_users_email ON tenant_users(email);
CREATE INDEX idx_tenant_users_status ON tenant_users(status);

COMMENT ON TABLE tenant_users IS 'Usuários do Cognito associados a tenants';
COMMENT ON COLUMN tenant_users.cognito_sub IS 'Subject (sub) do usuário no Cognito';
COMMENT ON COLUMN tenant_users.role IS 'Papel do usuário no tenant: admin, user, viewer';

-- ========================================
-- Tabela: tenant_agents
-- Rastreamento de agentes ativados por tenant
-- ========================================
CREATE TABLE IF NOT EXISTS tenant_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    config JSONB DEFAULT '{}',
    activated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deactivated_at TIMESTAMP,
    last_used_at TIMESTAMP,
    total_requests INTEGER NOT NULL DEFAULT 0,
    total_errors INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, agent_id)
);

CREATE INDEX idx_tenant_agents_tenant_id ON tenant_agents(tenant_id);
CREATE INDEX idx_tenant_agents_agent_id ON tenant_agents(agent_id);
CREATE INDEX idx_tenant_agents_status ON tenant_agents(status);
CREATE INDEX idx_tenant_agents_activated_at ON tenant_agents(activated_at);

COMMENT ON TABLE tenant_agents IS 'Agentes ativados por tenant com configurações e métricas';
COMMENT ON COLUMN tenant_agents.config IS 'Configurações específicas do agente para este tenant';
COMMENT ON COLUMN tenant_agents.total_requests IS 'Total de requisições feitas a este agente';

-- ========================================
-- Tabela: tenant_integrations
-- Integrações externas configuradas por tenant
-- ========================================
CREATE TABLE IF NOT EXISTS tenant_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    integration_type VARCHAR(100) NOT NULL,
    integration_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error', 'pending')),
    config JSONB NOT NULL DEFAULT '{}',
    credentials_encrypted TEXT,
    last_sync_at TIMESTAMP,
    last_sync_status VARCHAR(50),
    last_error TEXT,
    sync_count INTEGER NOT NULL DEFAULT 0,
    error_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, integration_type, integration_name)
);

CREATE INDEX idx_tenant_integrations_tenant_id ON tenant_integrations(tenant_id);
CREATE INDEX idx_tenant_integrations_type ON tenant_integrations(integration_type);
CREATE INDEX idx_tenant_integrations_status ON tenant_integrations(status);
CREATE INDEX idx_tenant_integrations_last_sync ON tenant_integrations(last_sync_at);

COMMENT ON TABLE tenant_integrations IS 'Integrações externas configuradas por tenant';
COMMENT ON COLUMN tenant_integrations.integration_type IS 'Tipo de integração: crm, email, calendar, etc';
COMMENT ON COLUMN tenant_integrations.credentials_encrypted IS 'Credenciais criptografadas (nunca retornar via API)';

-- ========================================
-- Tabela: tenant_usage_daily
-- Métricas agregadas diárias por tenant e agente
-- ========================================
CREATE TABLE IF NOT EXISTS tenant_usage_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    total_requests INTEGER NOT NULL DEFAULT 0,
    successful_requests INTEGER NOT NULL DEFAULT 0,
    failed_requests INTEGER NOT NULL DEFAULT 0,
    avg_response_time_ms INTEGER NOT NULL DEFAULT 0,
    total_tokens_used BIGINT NOT NULL DEFAULT 0,
    total_cost_usd DECIMAL(10, 4) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, agent_id, date)
);

CREATE INDEX idx_tenant_usage_daily_tenant_id ON tenant_usage_daily(tenant_id);
CREATE INDEX idx_tenant_usage_daily_agent_id ON tenant_usage_daily(agent_id);
CREATE INDEX idx_tenant_usage_daily_date ON tenant_usage_daily(date DESC);
CREATE INDEX idx_tenant_usage_daily_tenant_date ON tenant_usage_daily(tenant_id, date DESC);

COMMENT ON TABLE tenant_usage_daily IS 'Métricas agregadas diárias por tenant e agente';
COMMENT ON COLUMN tenant_usage_daily.date IS 'Data da agregação (sem hora)';
COMMENT ON COLUMN tenant_usage_daily.total_tokens_used IS 'Total de tokens consumidos (LLM)';

-- ========================================
-- Tabela: operational_events
-- Audit log de eventos operacionais
-- ========================================
CREATE TABLE IF NOT EXISTS operational_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(50) NOT NULL CHECK (event_category IN ('auth', 'tenant', 'agent', 'integration', 'command', 'system')),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    user_id VARCHAR(255),
    user_email VARCHAR(255),
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('success', 'failure', 'pending')),
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_operational_events_event_type ON operational_events(event_type);
CREATE INDEX idx_operational_events_category ON operational_events(event_category);
CREATE INDEX idx_operational_events_tenant_id ON operational_events(tenant_id);
CREATE INDEX idx_operational_events_user_id ON operational_events(user_id);
CREATE INDEX idx_operational_events_created_at ON operational_events(created_at DESC);
CREATE INDEX idx_operational_events_status ON operational_events(status);

COMMENT ON TABLE operational_events IS 'Audit log de todos os eventos operacionais do sistema';
COMMENT ON COLUMN operational_events.event_category IS 'Categoria do evento para filtros rápidos';
COMMENT ON COLUMN operational_events.details IS 'Detalhes adicionais do evento em formato JSON';

-- ========================================
-- Função: Atualizar updated_at automaticamente
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_tenant_users_updated_at
    BEFORE UPDATE ON tenant_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_agents_updated_at
    BEFORE UPDATE ON tenant_agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_integrations_updated_at
    BEFORE UPDATE ON tenant_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_usage_daily_updated_at
    BEFORE UPDATE ON tenant_usage_daily
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Dados iniciais de teste (opcional)
-- ========================================

-- Inserir tenant de teste (se não existir)
INSERT INTO tenants (id, name, cnpj, segment, plan, status, mrr_estimate)
VALUES (
    'test-tenant-001',
    'Tenant Test 1',
    '12.345.678/0001-90',
    'Tecnologia',
    'professional',
    'active',
    299.90
) ON CONFLICT (id) DO NOTHING;

-- ========================================
-- Grants de permissões
-- ========================================

-- Conceder permissões ao usuário da aplicação (ajustar conforme necessário)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_users TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_agents TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_integrations TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_usage_daily TO app_user;
-- GRANT SELECT, INSERT ON operational_events TO app_user;

-- ========================================
-- Rollback (se necessário)
-- ========================================

-- Para reverter esta migration:
-- DROP TRIGGER IF EXISTS update_tenant_usage_daily_updated_at ON tenant_usage_daily;
-- DROP TRIGGER IF EXISTS update_tenant_integrations_updated_at ON tenant_integrations;
-- DROP TRIGGER IF EXISTS update_tenant_agents_updated_at ON tenant_agents;
-- DROP TRIGGER IF EXISTS update_tenant_users_updated_at ON tenant_users;
-- DROP FUNCTION IF EXISTS update_updated_at_column();
-- DROP TABLE IF EXISTS operational_events;
-- DROP TABLE IF EXISTS tenant_usage_daily;
-- DROP TABLE IF EXISTS tenant_integrations;
-- DROP TABLE IF EXISTS tenant_agents;
-- DROP TABLE IF EXISTS tenant_users;
