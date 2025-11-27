-- Migration 009: Create Subscription System Tables
-- Descrição: Cria tabelas para sistema de assinatura, trials e contato comercial
-- Data: 2025-01-17

-- ============================================================================
-- TABELA: trials
-- Descrição: Armazena testes gratuitos de agentes e SubNúcleos (24h ou 5 tokens)
-- ============================================================================

CREATE TABLE IF NOT EXISTS trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('agent', 'subnucleo')),
  target_id UUID NOT NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  usage_count INTEGER DEFAULT 0,
  max_usage INTEGER DEFAULT 5,
  expires_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraint: Um usuário pode ter apenas um trial por target
  UNIQUE(user_id, target_type, target_id)
);

-- Índices para performance
CREATE INDEX idx_trials_user_target ON trials(user_id, target_type, target_id);
CREATE INDEX idx_trials_status ON trials(status);
CREATE INDEX idx_trials_expires_at ON trials(expires_at) WHERE status = 'active';

-- Comentários
COMMENT ON TABLE trials IS 'Testes gratuitos de agentes e SubNúcleos (24h ou 5 tokens)';
COMMENT ON COLUMN trials.user_id IS 'ID do usuário que iniciou o trial';
COMMENT ON COLUMN trials.target_type IS 'Tipo do alvo: agent ou subnucleo';
COMMENT ON COLUMN trials.target_id IS 'ID do agente ou SubNúcleo';
COMMENT ON COLUMN trials.usage_count IS 'Contador de tokens/interações usados';
COMMENT ON COLUMN trials.max_usage IS 'Limite máximo de tokens (padrão: 5)';
COMMENT ON COLUMN trials.expires_at IS 'Data/hora de expiração (started_at + 24h)';

-- ============================================================================
-- TABELA: commercial_requests
-- Descrição: Solicitações de contato comercial para Fibonacci e SubNúcleos
-- ============================================================================

CREATE TABLE IF NOT EXISTS commercial_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  company_name VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18),
  contact_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(20) NOT NULL,
  selected_agents JSONB DEFAULT '[]',
  selected_subnucleos JSONB DEFAULT '[]',
  message TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'proposal_sent', 'closed', 'cancelled')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_commercial_requests_tenant ON commercial_requests(tenant_id);
CREATE INDEX idx_commercial_requests_status ON commercial_requests(status);
CREATE INDEX idx_commercial_requests_created ON commercial_requests(created_at DESC);
CREATE INDEX idx_commercial_requests_email ON commercial_requests(email);

-- Comentários
COMMENT ON TABLE commercial_requests IS 'Solicitações de contato comercial para Fibonacci e SubNúcleos';
COMMENT ON COLUMN commercial_requests.tenant_id IS 'ID do tenant (pode ser NULL se usuário não autenticado)';
COMMENT ON COLUMN commercial_requests.selected_agents IS 'Array JSON com IDs dos agentes selecionados';
COMMENT ON COLUMN commercial_requests.selected_subnucleos IS 'Array JSON com IDs dos SubNúcleos selecionados';
COMMENT ON COLUMN commercial_requests.status IS 'Status da solicitação: pending, contacted, proposal_sent, closed, cancelled';

-- ============================================================================
-- TABELA: payment_events
-- Descrição: Log de eventos de pagamento do gateway (Stripe/Pagar.me)
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  event_type VARCHAR(50) NOT NULL,
  provider_customer_id VARCHAR(255),
  provider_subscription_id VARCHAR(255),
  provider_session_id VARCHAR(255),
  amount DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'BRL',
  status VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_payment_events_tenant ON payment_events(tenant_id);
CREATE INDEX idx_payment_events_subscription ON payment_events(provider_subscription_id);
CREATE INDEX idx_payment_events_session ON payment_events(provider_session_id);
CREATE INDEX idx_payment_events_created ON payment_events(created_at DESC);
CREATE INDEX idx_payment_events_type ON payment_events(event_type);

-- Comentários
COMMENT ON TABLE payment_events IS 'Log de eventos de pagamento do gateway externo';
COMMENT ON COLUMN payment_events.event_type IS 'Tipo do evento: checkout.session.completed, subscription.created, etc';
COMMENT ON COLUMN payment_events.provider_customer_id IS 'ID do customer no gateway (Stripe/Pagar.me)';
COMMENT ON COLUMN payment_events.provider_subscription_id IS 'ID da subscription no gateway';
COMMENT ON COLUMN payment_events.metadata IS 'Dados adicionais do evento em formato JSON';

-- ============================================================================
-- FUNÇÃO: Atualizar updated_at automaticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_trials_updated_at
  BEFORE UPDATE ON trials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commercial_requests_updated_at
  BEFORE UPDATE ON commercial_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNÇÃO: Expirar trials automaticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION expire_trials()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE trials
  SET status = 'expired'
  WHERE status = 'active'
    AND (
      expires_at < NOW()
      OR usage_count >= max_usage
    );
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION expire_trials() IS 'Expira trials que atingiram limite de tempo ou tokens';

-- ============================================================================
-- GRANTS (ajustar conforme roles do projeto)
-- ============================================================================

-- Assumindo que existe um role 'alquimista_app' para a aplicação
-- GRANT SELECT, INSERT, UPDATE ON trials TO alquimista_app;
-- GRANT SELECT, INSERT, UPDATE ON commercial_requests TO alquimista_app;
-- GRANT SELECT, INSERT ON payment_events TO alquimista_app;

-- ============================================================================
-- ROLLBACK (para reverter esta migration se necessário)
-- ============================================================================

-- Para reverter:
-- DROP TRIGGER IF EXISTS update_trials_updated_at ON trials;
-- DROP TRIGGER IF EXISTS update_commercial_requests_updated_at ON commercial_requests;
-- DROP FUNCTION IF EXISTS update_updated_at_column();
-- DROP FUNCTION IF EXISTS expire_trials();
-- DROP TABLE IF EXISTS payment_events;
-- DROP TABLE IF EXISTS commercial_requests;
-- DROP TABLE IF EXISTS trials;
