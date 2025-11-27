-- ============================================================================
-- MIGRATION 002: NIGREDO LEADS TABLES
-- ============================================================================

CREATE TABLE nigredo_leads.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    empresa VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18),
    setor VARCHAR(100),
    porte VARCHAR(50),
    atividade_principal TEXT,
    
    contato VARCHAR(255),
    telefone VARCHAR(20),
    email VARCHAR(255),
    
    status VARCHAR(50) NOT NULL DEFAULT 'novo',
    priority_score INTEGER DEFAULT 0 CHECK (priority_score >= 0 AND priority_score <= 100),
    
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT leads_email_or_phone_required CHECK (email IS NOT NULL OR telefone IS NOT NULL)
);

COMMENT ON TABLE nigredo_leads.leads IS 'Stores lead information with enrichment data and status tracking';

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

CREATE TABLE nigredo_leads.metricas_diarias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    data DATE NOT NULL,
    metricas JSONB NOT NULL,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_tenant_date UNIQUE (tenant_id, data)
);

COMMENT ON TABLE nigredo_leads.metricas_diarias IS 'Stores daily aggregated metrics for funnel analysis and reporting';

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

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON nigredo_leads.leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campanhas_updated_at
    BEFORE UPDATE ON nigredo_leads.campanhas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agendamentos_updated_at
    BEFORE UPDATE ON nigredo_leads.agendamentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO public.migrations (migration_name, description) VALUES
('002_create_leads_tables', 'Create nigredo_leads tables for lead management, campaigns, interactions, scheduling, and LGPD compliance')
ON CONFLICT (migration_name) DO NOTHING;
