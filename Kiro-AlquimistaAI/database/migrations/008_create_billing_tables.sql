-- Migration 008: Tabelas de Billing e Assinaturas
-- Criado para suportar o sistema de planos e assinaturas AlquimistaAI

-- Tabela de solicitações comerciais
CREATE TABLE IF NOT EXISTS commercial_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  company_name VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18),
  contact_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(20) NOT NULL,
  selected_agents JSONB DEFAULT '[]'::jsonb,
  selected_subnucleos JSONB DEFAULT '[]'::jsonb,
  message TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para commercial_requests
CREATE INDEX idx_commercial_requests_tenant ON commercial_requests(tenant_id);
CREATE INDEX idx_commercial_requests_status ON commercial_requests(status);
CREATE INDEX idx_commercial_requests_created ON commercial_requests(created_at DESC);

-- Tabela de trials (testes gratuitos)
CREATE TABLE IF NOT EXISTS trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('agent', 'subnucleo')),
  target_id UUID NOT NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  usage_count INTEGER DEFAULT 0,
  max_usage INTEGER DEFAULT 5,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'completed')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);

-- Índices para trials
CREATE INDEX idx_trials_user ON trials(user_id);
CREATE INDEX idx_trials_status ON trials(status);
CREATE INDEX idx_trials_expires ON trials(expires_at);

-- Tabela de eventos de pagamento
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
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para payment_events
CREATE INDEX idx_payment_events_tenant ON payment_events(tenant_id);
CREATE INDEX idx_payment_events_type ON payment_events(event_type);
CREATE INDEX idx_payment_events_subscription ON payment_events(provider_subscription_id);
CREATE INDEX idx_payment_events_created ON payment_events(created_at DESC);

-- Tabela de assinaturas
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  provider_customer_id VARCHAR(255),
  provider_subscription_id VARCHAR(255) UNIQUE,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  selected_agents JSONB DEFAULT '[]'::jsonb,
  total_monthly DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para subscriptions
CREATE INDEX idx_subscriptions_tenant ON subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_provider ON subscriptions(provider_subscription_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_commercial_requests_updated_at
  BEFORE UPDATE ON commercial_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trials_updated_at
  BEFORE UPDATE ON trials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários nas tabelas
COMMENT ON TABLE commercial_requests IS 'Solicitações de contato comercial para Fibonacci e SubNúcleos';
COMMENT ON TABLE trials IS 'Testes gratuitos de agentes e SubNúcleos (24h ou 5 tokens)';
COMMENT ON TABLE payment_events IS 'Histórico de eventos de pagamento do gateway';
COMMENT ON TABLE subscriptions IS 'Assinaturas ativas de agentes AlquimistaAI';
