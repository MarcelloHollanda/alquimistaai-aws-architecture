-- Migration 002: Create Nigredo Leads Tables
-- Purpose: Create tables for lead management, campaigns, interactions, scheduling, and LGPD compliance
-- Requirements: 11.11, 11.12

-- ============================================================================
-- Table: nigredo_leads.leads
-- Purpose: Store lead information with enrichment data
-- ============================================================================
CREATE TABLE nigredo_leads.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Company Information
    empresa VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18),
    setor VARCHAR(100),
    porte VARCHAR(50), -- 'MEI' | 'ME' | 'EPP' | 'Média' | 'Grande'
    atividade_principal TEXT,
    
    -- Contact Information
    contato VARCHAR(255),
    telefone VARCHAR(20),
    email VARCHAR(255),
    
    -- Lead Status
    status VARCHAR(50) NOT NULL DEFAULT 'novo',
    -- Status values: 'novo' | 'enriquecido' | 'contatado' | 'respondeu' | 'interessado' | 'agendado' | 'convertido' | 'descartado' | 'descadastrado'
    
    -- Priority and Scoring
    priority_score INTEGER DEFAULT 0 CHECK (priority_score >= 0 AND priority_score <= 100),
    
    -- Metadata (JSON for flexible data storage)
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT leads_email_or_phone_required CHECK (email IS NOT NULL OR telefone IS NOT NULL)
);

COMMENT ON TABLE nigredo_leads.leads IS 'Stores lead information with enrichment data and status tracking';
COMMENT ON COLUMN nigredo_leads.leads.metadata IS 'Flexible JSON storage for source, campaign_id, enrichment_data, etc.';

-- ============================================================================
-- Table: nigredo_leads.campanhas
-- Purpose: Store marketing campaigns with segmentation and messaging
-- ============================================================================
CREATE TABLE nigredo_leads.campanhas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Campaign Information
    nome VARCHAR(255) NOT NULL,
    segmento VARCHAR(100),
    canal VARCHAR(50) NOT NULL, -- 'whatsapp' | 'email' | 'multi'
    
    -- Campaign Messages (JSON structure for funnel stages)
    mensagens JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Structure: { "topo": ["msg1", "msg2"], "meio": ["msg1"], "fundo": ["msg1"] }
    
    -- Campaign Status
    status VARCHAR(50) NOT NULL DEFAULT 'rascunho',
    -- Status values: 'rascunho' | 'aprovada' | 'ativa' | 'pausada' | 'concluida'
    
    -- Campaign Metrics
    metricas JSONB DEFAULT '{"enviados": 0, "entregues": 0, "lidos": 0, "respondidos": 0, "interessados": 0}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE nigredo_leads.campanhas IS 'Stores marketing campaigns with segmentation, messaging, and metrics';

-- ============================================================================
-- Table: nigredo_leads.interacoes
-- Purpose: Store interaction history between agents and leads
-- ============================================================================
CREATE TABLE nigredo_leads.interacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES nigredo_leads.leads(id) ON DELETE CASCADE,
    
    -- Interaction Details
    tipo VARCHAR(50) NOT NULL, -- 'enviado' | 'recebido'
    canal VARCHAR(50) NOT NULL, -- 'whatsapp' | 'email' | 'web'
    mensagem TEXT NOT NULL,
    
    -- Sentiment Analysis
    sentimento VARCHAR(50), -- 'positivo' | 'neutro' | 'negativo' | 'irritado'
    intensidade INTEGER CHECK (intensidade >= 0 AND intensidade <= 100),
    
    -- Tracing
    trace_id UUID NOT NULL,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE nigredo_leads.interacoes IS 'Stores complete interaction history with sentiment analysis';

-- ============================================================================
-- Table: nigredo_leads.agendamentos
-- Purpose: Store scheduled meetings with leads
-- ============================================================================
CREATE TABLE nigredo_leads.agendamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES nigredo_leads.leads(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    
    -- Meeting Details
    data_hora TIMESTAMP NOT NULL,
    duracao INTEGER DEFAULT 60, -- Duration in minutes
    
    -- Meeting Status
    status VARCHAR(50) NOT NULL DEFAULT 'proposto',
    -- Status values: 'proposto' | 'confirmado' | 'realizado' | 'cancelado' | 'remarcado'
    
    -- External Calendar Integration
    calendar_event_id VARCHAR(255),
    
    -- Meeting Briefing
    briefing TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE nigredo_leads.agendamentos IS 'Stores scheduled meetings with leads and calendar integration';

-- ============================================================================
-- Table: nigredo_leads.metricas_diarias
-- Purpose: Store daily aggregated metrics for reporting
-- ============================================================================
CREATE TABLE nigredo_leads.metricas_diarias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    data DATE NOT NULL,
    
    -- Aggregated Metrics (JSON structure)
    metricas JSONB NOT NULL,
    -- Structure: {
    --   "leadsRecebidos": 0,
    --   "leadsEnriquecidos": 0,
    --   "leadsContatados": 0,
    --   "leadsResponderam": 0,
    --   "leadsInteressados": 0,
    --   "leadsAgendados": 0,
    --   "leadsConvertidos": 0,
    --   "taxaEnriquecimento": 0.0,
    --   "taxaResposta": 0.0,
    --   "taxaInteresse": 0.0,
    --   "taxaAgendamento": 0.0,
    --   "taxaConversao": 0.0,
    --   "objecoesRecorrentes": [],
    --   "insights": []
    -- }
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate daily metrics
    CONSTRAINT unique_tenant_date UNIQUE (tenant_id, data)
);

COMMENT ON TABLE nigredo_leads.metricas_diarias IS 'Stores daily aggregated metrics for funnel analysis and reporting';

-- ============================================================================
-- Table: nigredo_leads.blocklist
-- Purpose: LGPD compliance - store blocked contacts who requested removal
-- ============================================================================
CREATE TABLE nigredo_leads.blocklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES nigredo_leads.leads(id) ON DELETE SET NULL,
    
    -- Contact Information (for blocking future communications)
    telefone VARCHAR(20),
    email VARCHAR(255),
    
    -- Removal Details
    reason TEXT,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT blocklist_contact_required CHECK (telefone IS NOT NULL OR email IS NOT NULL)
);

COMMENT ON TABLE nigredo_leads.blocklist IS 'LGPD compliance - stores contacts who requested removal from communications';

-- ============================================================================
-- Indexes for Performance Optimization
-- ============================================================================

-- Leads table indexes
CREATE INDEX idx_leads_tenant_id ON nigredo_leads.leads(tenant_id);
CREATE INDEX idx_leads_status ON nigredo_leads.leads(status);
CREATE INDEX idx_leads_email ON nigredo_leads.leads(email) WHERE email IS NOT NULL;
CREATE INDEX idx_leads_telefone ON nigredo_leads.leads(telefone) WHERE telefone IS NOT NULL;
CREATE INDEX idx_leads_cnpj ON nigredo_leads.leads(cnpj) WHERE cnpj IS NOT NULL;
CREATE INDEX idx_leads_created_at ON nigredo_leads.leads(created_at DESC);
CREATE INDEX idx_leads_tenant_status ON nigredo_leads.leads(tenant_id, status);

-- Campanhas table indexes
CREATE INDEX idx_campanhas_tenant_id ON nigredo_leads.campanhas(tenant_id);
CREATE INDEX idx_campanhas_status ON nigredo_leads.campanhas(status);
CREATE INDEX idx_campanhas_tenant_status ON nigredo_leads.campanhas(tenant_id, status);

-- Interacoes table indexes
CREATE INDEX idx_interacoes_lead_id ON nigredo_leads.interacoes(lead_id);
CREATE INDEX idx_interacoes_trace_id ON nigredo_leads.interacoes(trace_id);
CREATE INDEX idx_interacoes_created_at ON nigredo_leads.interacoes(created_at DESC);
CREATE INDEX idx_interacoes_lead_created ON nigredo_leads.interacoes(lead_id, created_at DESC);

-- Agendamentos table indexes
CREATE INDEX idx_agendamentos_lead_id ON nigredo_leads.agendamentos(lead_id);
CREATE INDEX idx_agendamentos_tenant_id ON nigredo_leads.agendamentos(tenant_id);
CREATE INDEX idx_agendamentos_data_hora ON nigredo_leads.agendamentos(data_hora);
CREATE INDEX idx_agendamentos_status ON nigredo_leads.agendamentos(status);
CREATE INDEX idx_agendamentos_tenant_data ON nigredo_leads.agendamentos(tenant_id, data_hora);

-- Metricas_diarias table indexes
CREATE INDEX idx_metricas_tenant_data ON nigredo_leads.metricas_diarias(tenant_id, data DESC);

-- Blocklist table indexes
CREATE INDEX idx_blocklist_telefone ON nigredo_leads.blocklist(telefone) WHERE telefone IS NOT NULL;
CREATE INDEX idx_blocklist_email ON nigredo_leads.blocklist(email) WHERE email IS NOT NULL;

-- ============================================================================
-- Trigger: Update updated_at timestamp automatically
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at column
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON nigredo_leads.leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campanhas_updated_at BEFORE UPDATE ON nigredo_leads.campanhas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agendamentos_updated_at BEFORE UPDATE ON nigredo_leads.agendamentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Record Migration
-- ============================================================================

INSERT INTO public.migrations (migration_name, description)
VALUES ('002_create_leads_tables', 'Create nigredo_leads tables for lead management, campaigns, interactions, scheduling, and LGPD compliance')
ON CONFLICT (migration_name) DO NOTHING;
