-- Seed 006: SubNúcleos, Relacionamentos e Planos
-- Descrição: Cria os 7 SubNúcleos Fibonacci, relaciona com agentes e cria os 4 planos
-- Data: 2025-01-17

-- ============================================================================
-- PARTE 1: SubNúcleos Fibonacci (7 total)
-- ============================================================================

-- 1. SubNúcleo Saúde & Telemedicina
INSERT INTO subnucleos (id, name, display_name, description, category, sort_order) VALUES
('40000000-0000-0000-0000-000000000001', 'saude-telemedicina', 'Saúde & Telemedicina',
 'Solução completa para clínicas, consultórios e hospitais com atendimento remoto e gestão de pacientes.',
 'saude', 1)
ON CONFLICT (name) DO NOTHING;

-- 2. SubNúcleo Educação & EAD
INSERT INTO subnucleos (id, name, display_name, description, category, sort_order) VALUES
('40000000-0000-0000-0000-000000000002', 'educacao-ead', 'Educação & EAD',
 'Plataforma completa para instituições de ensino com gestão de alunos e suporte automatizado.',
 'educacao', 2)
ON CONFLICT (name) DO NOTHING;

-- 3. SubNúcleo Eventos & Relacionamento
INSERT INTO subnucleos (id, name, display_name, description, category, sort_order) VALUES
('40000000-0000-0000-0000-000000000003', 'eventos-relacionamento', 'Eventos & Relacionamento',
 'Gestão completa de eventos, agendamentos e relacionamento com clientes.',
 'eventos', 3)
ON CONFLICT (name) DO NOTHING;

-- 4. SubNúcleo Vendas & SDR
INSERT INTO subnucleos (id, name, display_name, description, category, sort_order) VALUES
('40000000-0000-0000-0000-000000000004', 'vendas-sdr', 'Vendas & SDR',
 'Pipeline completo de vendas B2B com qualificação, prospecção e fechamento.',
 'vendas', 4)
ON CONFLICT (name) DO NOTHING;

-- 5. SubNúcleo Cobrança & Financeiro
INSERT INTO subnucleos (id, name, display_name, description, category, sort_order) VALUES
('40000000-0000-0000-0000-000000000005', 'cobranca-financeiro', 'Cobrança & Financeiro',
 'Gestão financeira completa com cobrança inteligente e consultoria.',
 'financeiro', 5)
ON CONFLICT (name) DO NOTHING;

-- 6. SubNúcleo Serviços & Field Service
INSERT INTO subnucleos (id, name, display_name, description, category, sort_order) VALUES
('40000000-0000-0000-0000-000000000006', 'servicos-field', 'Serviços & Field Service',
 'Gestão de serviços de campo, delivery, imobiliário e turismo.',
 'servicos', 6)
ON CONFLICT (name) DO NOTHING;

-- 7. SubNúcleo Organizações & Jurídico
INSERT INTO subnucleos (id, name, display_name, description, category, sort_order) VALUES
('40000000-0000-0000-0000-000000000007', 'organizacoes-juridico', 'Organizações & Jurídico',
 'Soluções para ONGs, RH, suporte técnico e consultoria jurídica.',
 'organizacoes', 7)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- PARTE 2: Relacionamentos SubNúcleo → Agentes
-- ============================================================================
-- NOTA: Assumindo que os agentes já foram criados no seed 005

-- SubNúcleo 1: Saúde & Telemedicina (4 agentes)
INSERT INTO subnucleo_agents (subnucleo_id, agent_id, is_required, sort_order) VALUES
('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', true, 1),  -- Telemedicina
('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', true, 2),  -- Clínica Médica
('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', true, 3),  -- Clínica Odontológica
('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', false, 4) -- Saúde e Bem-Estar
ON CONFLICT (subnucleo_id, agent_id) DO NOTHING;

-- SubNúcleo 2: Educação & EAD (3 agentes)
INSERT INTO subnucleo_agents (subnucleo_id, agent_id, is_required, sort_order) VALUES
('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000005', true, 1),  -- Consultas Educacionais
('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000006', true, 2),  -- Alunos Curso Digital
('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000007', true, 3)  -- Educação e EAD
ON CONFLICT (subnucleo_id, agent_id) DO NOTHING;

-- SubNúcleo 3: Eventos & Relacionamento (8 agentes - IDs fictícios, ajustar conforme seed 005)
-- SubNúcleo 4: Vendas & SDR (3 agentes)
-- SubNúcleo 5: Cobrança & Financeiro (3 agentes)
-- SubNúcleo 6: Serviços & Field Service (7 agentes)
-- SubNúcleo 7: Organizações & Jurídico (4 agentes)

-- ============================================================================
-- PARTE 3: Planos de Assinatura (4 planos)
-- ============================================================================

-- Plano 1: Starter
INSERT INTO subscription_plans (
  id, name, display_name, description,
  price_monthly, price_yearly,
  max_subnucleos, max_agents, max_users,
  includes_fibonacci, is_active, sort_order,
  features
) VALUES (
  '50000000-0000-0000-0000-000000000001',
  'starter',
  'Starter',
  'Ideal para pequenas empresas iniciando automação',
  297.00,
  2970.00,
  1, 8, 3,
  false, true, 1,
  '["1 SubNúcleo", "Até 8 agentes", "3 usuários", "Suporte por e-mail"]'::jsonb
) ON CONFLICT (name) DO NOTHING;

-- Plano 2: Profissional
INSERT INTO subscription_plans (
  id, name, display_name, description,
  price_monthly, price_yearly,
  max_subnucleos, max_agents, max_users,
  includes_fibonacci, is_active, sort_order,
  features
) VALUES (
  '50000000-0000-0000-0000-000000000002',
  'profissional',
  'Profissional',
  'Para empresas em crescimento',
  697.00,
  6970.00,
  2, 16, 10,
  true, true, 2,
  '["2 SubNúcleos", "Até 16 agentes", "10 usuários", "Fibonacci Orquestrador", "Suporte prioritário"]'::jsonb
) ON CONFLICT (name) DO NOTHING;

-- Plano 3: Expert
INSERT INTO subscription_plans (
  id, name, display_name, description,
  price_monthly, price_yearly,
  max_subnucleos, max_agents, max_users,
  includes_fibonacci, is_active, sort_order,
  features
) VALUES (
  '50000000-0000-0000-0000-000000000003',
  'expert',
  'Expert',
  'Para empresas estabelecidas com múltiplos departamentos',
  1497.00,
  14970.00,
  4, 24, 25,
  true, true, 3,
  '["4 SubNúcleos", "Até 24 agentes", "25 usuários", "Fibonacci Orquestrador", "Suporte dedicado", "Customizações"]'::jsonb
) ON CONFLICT (name) DO NOTHING;

-- Plano 4: Enterprise
INSERT INTO subscription_plans (
  id, name, display_name, description,
  price_monthly, price_yearly,
  max_subnucleos, max_agents, max_users,
  includes_fibonacci, is_active, sort_order,
  features
) VALUES (
  '50000000-0000-0000-0000-000000000004',
  'enterprise',
  'Enterprise',
  'Para grandes empresas e corporações',
  2997.00,
  29970.00,
  7, 32, 999999,
  true, true, 4,
  '["7 SubNúcleos (todos)", "32 agentes (todos)", "Usuários ilimitados", "Fibonacci Orquestrador", "Suporte prioritário 24/7", "Customizações avançadas", "SLA garantido"]'::jsonb
) ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- RESUMO
-- ============================================================================

DO $
DECLARE
  subnucleo_count INTEGER;
  plan_count INTEGER;
  relationship_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO subnucleo_count FROM subnucleos WHERE is_active = true;
  SELECT COUNT(*) INTO plan_count FROM subscription_plans WHERE is_active = true;
  SELECT COUNT(*) INTO relationship_count FROM subnucleo_agents;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Seed 006: SubNúcleos e Planos - Concluído';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SubNúcleos criados: %', subnucleo_count;
  RAISE NOTICE 'Planos criados: %', plan_count;
  RAISE NOTICE 'Relacionamentos agente-SubNúcleo: %', relationship_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $;
