-- Migration 010: Estrutura de Planos de Assinatura
-- Descrição: Cria tabelas para planos, SubNúcleos e relacionamentos
-- Data: 2025-01-17

-- ============================================================================
-- TABELA: subscription_plans
-- Descrição: Planos de assinatura disponíveis (Starter, Profissional, Expert, Enterprise)
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10, 2) NOT NULL,
  price_yearly DECIMAL(10, 2) NOT NULL,
  max_subnucleos INTEGER NOT NULL DEFAULT 0,
  max_agents INTEGER NOT NULL DEFAULT 0,
  max_users INTEGER NOT NULL DEFAULT 1,
  includes_fibonacci BOOLEAN DEFAULT FALSE,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX idx_subscription_plans_sort ON subscription_plans(sort_order);

COMMENT ON TABLE subscription_plans IS 'Planos de assinatura disponíveis';
COMMENT ON COLUMN subscription_plans.max_subnucleos IS 'Número máximo de SubNúcleos incluídos no plano';
COMMENT ON COLUMN subscription_plans.max_agents IS 'Número máximo de agentes que podem ser ativados';
COMMENT ON COLUMN subscription_plans.max_users IS 'Número máximo de usuários permitidos';
COMMENT ON COLUMN subscription_plans.includes_fibonacci IS 'Se inclui acesso ao Fibonacci Orquestrador';

-- ============================================================================
-- TABELA: subnucleos
-- Descrição: SubNúcleos Fibonacci (pacotes de agentes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS subnucleos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_subnucleos_active ON subnucleos(is_active);
CREATE INDEX idx_subnucleos_category ON subnucleos(category);
CREATE INDEX idx_subnucleos_sort ON subnucleos(sort_order);

COMMENT ON TABLE subnucleos IS 'SubNúcleos Fibonacci - pacotes de agentes especializados';
COMMENT ON COLUMN subnucleos.category IS 'Categoria do SubNúcleo: saude, educacao, vendas, etc';

-- ============================================================================
-- TABELA: subnucleo_agents
-- Descrição: Relacionamento entre SubNúcleos e Agentes
-- ============================================================================

CREATE TABLE IF NOT EXISTS subnucleo_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subnucleo_id UUID NOT NULL REFERENCES subnucleos(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES alquimista_platform.agents(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(subnucleo_id, agent_id)
);

-- Índices
CREATE INDEX idx_subnucleo_agents_subnucleo ON subnucleo_agents(subnucleo_id);
CREATE INDEX idx_subnucleo_agents_agent ON subnucleo_agents(agent_id);

COMMENT ON TABLE subnucleo_agents IS 'Relacionamento N:N entre SubNúcleos e Agentes';
COMMENT ON COLUMN subnucleo_agents.is_required IS 'Se o agente é obrigatório no SubNúcleo';

-- ============================================================================
-- TABELA: tenant_subscriptions
-- Descrição: Assinaturas ativas dos tenants
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  
  -- Dados do gateway de pagamento
  provider_customer_id VARCHAR(255),
  provider_subscription_id VARCHAR(255) UNIQUE,
  
  -- Período de cobrança
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMP,
  
  -- Valores
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tenant_id)
);

-- Índices
CREATE INDEX idx_tenant_subscriptions_tenant ON tenant_subscriptions(tenant_id);
CREATE INDEX idx_tenant_subscriptions_plan ON tenant_subscriptions(plan_id);
CREATE INDEX idx_tenant_subscriptions_status ON tenant_subscriptions(status);
CREATE INDEX idx_tenant_subscriptions_provider ON tenant_subscriptions(provider_subscription_id);

COMMENT ON TABLE tenant_subscriptions IS 'Assinaturas ativas dos tenants';
COMMENT ON COLUMN tenant_subscriptions.billing_cycle IS 'Ciclo de cobrança: monthly ou yearly';

-- ============================================================================
-- TABELA: tenant_subnucleos
-- Descrição: SubNúcleos ativados para cada tenant
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_subnucleos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subnucleo_id UUID NOT NULL REFERENCES subnucleos(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  activated_at TIMESTAMP DEFAULT NOW(),
  deactivated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tenant_id, subnucleo_id)
);

-- Índices
CREATE INDEX idx_tenant_subnucleos_tenant ON tenant_subnucleos(tenant_id);
CREATE INDEX idx_tenant_subnucleos_subnucleo ON tenant_subnucleos(subnucleo_id);
CREATE INDEX idx_tenant_subnucleos_active ON tenant_subnucleos(tenant_id, is_active);

COMMENT ON TABLE tenant_subnucleos IS 'SubNúcleos ativados para cada tenant';

-- ============================================================================
-- TABELA: tenant_agents
-- Descrição: Agentes ativados individualmente para cada tenant (dentro dos SubNúcleos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES alquimista_platform.agents(id) ON DELETE CASCADE,
  subnucleo_id UUID REFERENCES subnucleos(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  activated_at TIMESTAMP DEFAULT NOW(),
  deactivated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tenant_id, agent_id)
);

-- Índices
CREATE INDEX idx_tenant_agents_tenant ON tenant_agents(tenant_id);
CREATE INDEX idx_tenant_agents_agent ON tenant_agents(agent_id);
CREATE INDEX idx_tenant_agents_subnucleo ON tenant_agents(subnucleo_id);
CREATE INDEX idx_tenant_agents_active ON tenant_agents(tenant_id, is_active);

COMMENT ON TABLE tenant_agents IS 'Agentes ativados para cada tenant';
COMMENT ON COLUMN tenant_agents.subnucleo_id IS 'SubNúcleo de origem do agente (pode ser NULL)';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subnucleos_updated_at
  BEFORE UPDATE ON subnucleos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_subscriptions_updated_at
  BEFORE UPDATE ON tenant_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_subnucleos_updated_at
  BEFORE UPDATE ON tenant_subnucleos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_agents_updated_at
  BEFORE UPDATE ON tenant_agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS ÚTEIS
-- ============================================================================

-- View: Resumo de assinatura do tenant
CREATE OR REPLACE VIEW v_tenant_subscription_summary AS
SELECT 
  t.id as tenant_id,
  t.company_name,
  ts.id as subscription_id,
  sp.name as plan_name,
  sp.display_name as plan_display_name,
  ts.billing_cycle,
  ts.status,
  ts.amount,
  ts.current_period_end,
  COUNT(DISTINCT tsu.subnucleo_id) as active_subnucleos,
  COUNT(DISTINCT ta.agent_id) as active_agents,
  sp.max_subnucleos,
  sp.max_agents,
  sp.includes_fibonacci
FROM tenants t
LEFT JOIN tenant_subscriptions ts ON t.id = ts.tenant_id
LEFT JOIN subscription_plans sp ON ts.plan_id = sp.id
LEFT JOIN tenant_subnucleos tsu ON t.id = tsu.tenant_id AND tsu.is_active = TRUE
LEFT JOIN tenant_agents ta ON t.id = ta.tenant_id AND ta.is_active = TRUE
GROUP BY t.id, t.company_name, ts.id, sp.name, sp.display_name, ts.billing_cycle, 
         ts.status, ts.amount, ts.current_period_end, sp.max_subnucleos, 
         sp.max_agents, sp.includes_fibonacci;

COMMENT ON VIEW v_tenant_subscription_summary IS 'Resumo da assinatura e uso de cada tenant';

-- ============================================================================
-- ROLLBACK
-- ============================================================================

-- Para reverter:
-- DROP VIEW IF EXISTS v_tenant_subscription_summary;
-- DROP TRIGGER IF EXISTS update_tenant_agents_updated_at ON tenant_agents;
-- DROP TRIGGER IF EXISTS update_tenant_subnucleos_updated_at ON tenant_subnucleos;
-- DROP TRIGGER IF EXISTS update_tenant_subscriptions_updated_at ON tenant_subscriptions;
-- DROP TRIGGER IF EXISTS update_subnucleos_updated_at ON subnucleos;
-- DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
-- DROP TABLE IF EXISTS tenant_agents;
-- DROP TABLE IF EXISTS tenant_subnucleos;
-- DROP TABLE IF EXISTS tenant_subscriptions;
-- DROP TABLE IF EXISTS subnucleo_agents;
-- DROP TABLE IF EXISTS subnucleos;
-- DROP TABLE IF EXISTS subscription_plans;
