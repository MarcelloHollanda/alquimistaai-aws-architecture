-- Seed 005: 32 Agentes AlquimistaAI Completos
-- Descrição: Catálogo completo de todos os 32 agentes organizados por categoria
-- Data: 2025-01-17

-- ============================================================================
-- CATEGORIA: Saúde & Clínicas (4 agentes)
-- ============================================================================

-- 1. Agente de Telemedicina
INSERT INTO alquimista_platform.agents (
  id, name, display_name, description, category, version, status, config, pricing
) VALUES (
  '10000000-0000-0000-0000-000000000001',
  'telemedicina',
  'Agente de Telemedicina',
  'Atendimento médico remoto, triagem de sintomas e agendamento de consultas online.',
  'Saúde',
  '1.0.0',
  'active',
  '{"lambdaArn": "arn:aws:lambda:us-east-1:ACCOUNT:function:telemedicina", "requiredPermissions": ["health.read", "appointments.write"], "availableForPurchase": true, "tags": ["Saúde", "Telemedicina", "Consultas"]}'::jsonb,
  '{"model": "subscription", "includedInPlans": true}'::jsonb
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  config = EXCLUDED.config,
  pricing = EXCLUDED.pricing;

-- 2. Agente de Atendimento – Clínica Médica
INSERT INTO alquimista_platform.agents (
  id, name, display_name, description, category, version, status, config, pricing
) VALUES (
  '10000000-0000-0000-0000-000000000002',
  'clinica-medica',
  'Agente de Atendimento – Clínica Médica',
  'Atendimento especializado para clínicas médicas, confirmação de consultas e lembretes.',
  'Saúde',
  '1.0.0',
  'active',
  '{"lambdaArn": "arn:aws:lambda:us-east-1:ACCOUNT:function:clinica-medica", "requiredPermissions": ["health.read", "appointments.write"], "availableForPurchase": true, "tags": ["Saúde", "Clínica", "Médica"]}'::jsonb,
  '{"model": "subscription", "includedInPlans": true}'::jsonb
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  config = EXCLUDED.config,
  pricing = EXCLUDED.pricing;

-- 3. Agente de Atendimento – Clínica Odontológica
INSERT INTO alquimista_platform.agents (
  id, name, display_name, description, category, version, status, config, pricing
) VALUES (
  '10000000-0000-0000-0000-000000000003',
  'clinica-odontologica',
  'Agente de Atendimento – Clínica Odontológica',
  'Atendimento especializado para clínicas odontológicas, agendamento e follow-up pós-procedimento.',
  'Saúde',
  '1.0.0',
  'active',
  '{"lambdaArn": "arn:aws:lambda:us-east-1:ACCOUNT:function:clinica-odontologica", "requiredPermissions": ["health.read", "appointments.write"], "availableForPurchase": true, "tags": ["Saúde", "Odontologia"]}'::jsonb,
  '{"model": "subscription", "includedInPlans": true}'::jsonb
) ON CONFLICT (name) DO UPDATE SET display_name = EXCLUDED.display_name, description = EXCLUDED.description;

-- 4. Agente de Saúde e Bem-Estar
INSERT INTO alquimista_platform.agents (id, name, display_name, description, category, version, status, config, pricing) VALUES (
  '10000000-0000-0000-0000-000000000004', 'saude-bem-estar', 'Agente de Saúde e Bem-Estar',
  'Orientações sobre saúde preventiva, bem-estar e hábitos saudáveis.', 'Saúde', '1.0.0', 'active',
  '{"lambdaArn": "arn:aws:lambda:us-east-1:ACCOUNT:function:saude-bem-estar", "availableForPurchase": true}'::jsonb,
  '{"model": "subscription", "includedInPlans": true}'::jsonb
) ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- CATEGORIA: Educação & Cursos (3 agentes)
-- ============================================================================

-- 5-7: Agentes de Educação
INSERT INTO alquimista_platform.agents (id, name, display_name, description, category, version, status, config, pricing) VALUES
('10000000-0000-0000-0000-000000000005', 'consultas-educacionais', 'Agente de Consultas Educacionais', 'Responde dúvidas sobre cursos, matrículas e envia lembretes.', 'Educação', '1.0.0', 'active', '{"availableForPurchase": true}'::jsonb, '{"model": "subscription", "includedInPlans": true}'::jsonb),
('10000000-0000-0000-0000-000000000006', 'alunos-curso-digital', 'Agente de Atendimento – Alunos', 'Suporte técnico e pedagógico para alunos de cursos online.', 'Educação', '1.0.0', 'active', '{"availableForPurchase": true}'::jsonb, '{"model": "subscription", "includedInPlans": true}'::jsonb),
('10000000-0000-0000-0000-000000000007', 'educacao-ead', 'Agente de Educação e EAD', 'Gestão completa de plataformas EAD e engajamento.', 'Educação', '1.0.0', 'active', '{"availableForPurchase": true}'::jsonb, '{"model": "subscription", "includedInPlans": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- CATEGORIA: Eventos & Relacionamento (8 agentes)
-- ============================================================================

INSERT INTO alquimista_platform.agents (id, name, display_name, description, category, version, status, config, pricing) VALUES
('10000000-0000-0000-0000-000000000008', 'agendamento-eventos', 'Agente de Agendamento de Eventos', 'Gestão completa de agendamentos e confirmações.', 'Eventos', '1.0.0', 'active', '{"availableForPurchase": true}'::jsonb, '{"model": "subscription", "includedInPlans": true}'::jsonb),
('10000000-0000-0000-0000-000000000009', 'confirmacao-presenca', 'Agente de Confirmação de Presença', 'Confirmações automáticas e lembretes de eventos.', 'Eventos', '1.0.0', 'active', '{"availableForPurchase": true}'::jsonb, '{"model": "subscription", "includedInPlans": true}'::jsonb),
('10000000-0000-0000-0000-000000000010', 'relacionamento-cliente', 'Agente de Relacionamento com Cliente', 'CRM inteligente e gestão de relacionamento.', 'Eventos', '1.0.0', 'active', '{"availableForPurchase": true}'::jsonb, '{"model": "subscription", "includedInPlans": true}'::jsonb),
('10000000-0000-0000-0000-000000000011', 'pesquisa-satisfacao', 'Agente de Pesquisa de Satisfação', 'Coleta e análise de feedback de clientes.', 'Eventos', '1.0.0', 'active', '{"availableForPurchase": true}'::jsonb, '{"model": "subscription", "includedInPlans": true}'::jsonb),
('10000000-0000-0000-0000-000000000012', 'fidelizacao', 'Agente de Fidelização', 'Programas de fidelidade e retenção de clientes.', 'Eventos', '1.0.0', 'active', '{"availableForPurchase": true}'::jsonb, '{"model": "subscription", "includedInPlans": true}'::jsonb),
('10000000-0000-0000-0000-000000000013', 'reativacao', 'Agente de Reativação', 'Recuperação de clientes inativos.', 'Eventos', '1.0.0', 'active', '{"availableForPurchase": true}'::jsonb, '{"model": "subscription", "includedInPlans": true}'::jsonb),
('10000000-0000-0000-0000-000000000014', 'upsell-crossell', 'Agente de Upsell e Cross-sell', 'Identificação de oportunidades de vendas adicionais.', 'Eventos', '1.0.0', 'active', '{"availableForPurchase": true}'::jsonb, '{"model": "subscription", "includedInPlans": true}'::jsonb),
('10000000-0000-0000-0000-000000000015', 'pos-venda', 'Agente de Pós-Venda', 'Acompanhamento e suporte pós-compra.', 'Eventos', '1.0.0', 'active', '{"availableForPurchase": true}'::jsonb, '{"model": "subscription", "includedInPlans": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- CATEGORIA: Vendas & SDR (3 agentes)
-- ============================================================================

INSERT INTO alquimista_platform.agents (id, name, display_name, description, category, version, status, config, pricing) VALUES
('10000000-0000-0000-0000-000000000016', 'sdr-qualificador', 'Agente SDR – Qualificador de Leads', 'Qualificação de leads usando metodologia SPIN Selling.', 'Vendas', '1.0.0', 'active', '{"availableForPurchase": true}'::jsonb, '{"model": "subscription", "includedInPlans": true}'::jsonb),
('10000000-0000-0000-0000-000000000017', 'vendas-ativas', 'Agente Profissional de Vendas Ativas', 'Prospecção ativa e fechamento de vendas B2B.', 'Vendas', '1.0.0', 'active', '{"availableForPurchase": true}'::jsonb, '{"model": "subscription", "includedInPlans": true}'::jsonb),
('10000000-0000-0000-0000-000000000018', 'vendas-consultivas', 'Agente de Vendas Consultivas', 'Vendas complexas com abordagem consultiva.', 'Vendas', '1.0.0', 'active', '{"availableForPurchase": true}'::jsonb, '{"model": "subscription", "includedInPlans": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- CATEGORIA: Cobrança & Financeiro (3 agentes)
-- ============================================================================

INSERT INTO alquimista_platform.agents (id, name, display_name, description, category, version, status, config, pricing) VALUES
('10000000-0000-0000-0000-000000000019', 'cobranca-amigavel', 'Agente de Cobrança Amigável', 'Cobrança humanizada e eficiente de inadimplentes.', 'Financeiro', '1.0.0', 'active', '{"availableForPurchase": true}'::jsonb, '{"model": "subscription", "includedInPlans": true}'::jsonb),
('10000000-0000-0000-0000-000000000020', 'negociacao-dividas', 'Agente de Negociação de Dívidas', 'Negociação e acordos de pagamento.', 'Financeiro', '1.0.0', 'active', '{"availableForPurchase": true}'::jsonb, '{"model": "subscription", "includedInPlans": true}'::jsonb),
('10000000-0000-0000-0000-000000000021', 'consultoria-financeira', 'Agente de Consultoria Financeira', 'Orientação financeira e planejamento.', 'Financeiro', '1.0.0', 'active', '{"availableForPurchase": true}'::jsonb, '{"model": "subscription", "includedInPlans": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- CATEGORIA: Serviços & Field Service (7 agentes)
-- ============================================================================

INSERT INTO alquimista_platform.agents (id, name, display_name, description, category, version, status, config, pricing) VALUES
('10000000-0000-0000-0000-000000000022', 'agendamento-servicos', 'Agente de Agendamento de Serviços', 'Gestão de agendamentos de serviços técnicos.', 'Serviços', '1.0.0', 'active', '{"availableForPurchase": true}'::jsonb, '{"model": "subscription", "includedInPlans": true}'::jsonb),
('10000000-0000-0000-0000-000000000023', 'rastreamento-entrega', 'Agente de Rastreamento de Entrega', 'Acompanhamento de entregas e logística.', 'Serviços', '1.0.0', 'active', '{"availableForPurchase": true}'::jsonb, '{"model": "subscription", "includedInPlans": true}'::jsonb),
('10000000-0000-0000-0000-000000000024', 'atendimento-imobiliario', 'Agente de Atendimento Imobiliário', 'Gestão de leads e visitas imobiliárias.', 'Serviços', '1.0.0', 'active', '{"availableForPurchase": true}'::jsonb, '{"model": "subscription", "includedInPlans": true}'::jsonb),
('10000000-0000-0000-0000-000000000025', 'reservas-turismo', 'Agente de Reservas e Turismo', 'Gestão de reservas e atendimento turístico.', 'Serviços', '1.0.0', 'active', '{"availableForPurchase": true}'::jsonb, '{"model": "subscription", "includedInPlans": true}'::jsonb),
('10000000-0000-0000-0000-000000000026', 'manutencao-preventiva', 'Agente de Manutenção Preventiva', 'Agendamento e gestão de manutenções.', 'Serviços', '1.0.0', 'active', '{"availableForPurchase": true}'::jsonb, '{"model": "subscription", "includedInPlans": true}'::jsonb),
('10000000-0000-0000-0000-000000000027', 'suporte-tecnico', 'Agente de Suporte Técnico', 'Atendimento técnico e resolução de problemas.', 'Serviços', '1.0.0', 'active', '{"availableForPurchase": true}'::jsonb, '{"model": "subscription", "includedInPlans": true}'::jsonb),
('10000000-0000-0000-0000-000000000028', 'assistencia-domiciliar', 'Agente de Assistência Domiciliar', 'Agendamento de serviços residenciais.', 'Serviços', '1.0.0', 'active', '{"availableForPurchase": true}'::jsonb, '{"model": "subscription", "includedInPlans": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- CATEGORIA: Organizações & Jurídico (4 agentes)
-- ============================================================================

INSERT INTO alquimista_platform.agents (id, name, display_name, description, category, version, status, config, pricing) VALUES
('10000000-0000-0000-0000-000000000029', 'captacao-doacoes', 'Agente de Captação de Doações', 'Gestão de campanhas e captação para ONGs.', 'Organizações', '1.0.0', 'active', '{"availableForPurchase": true}'::jsonb, '{"model": "subscription", "includedInPlans": true}'::jsonb),
('10000000-0000-0000-0000-000000000030', 'recrutamento-selecao', 'Agente de Recrutamento e Seleção', 'Triagem e agendamento de entrevistas.', 'Organizações', '1.0.0', 'active', '{"availableForPurchase": true}'::jsonb, '{"model": "subscription", "includedInPlans": true}'::jsonb),
('10000000-0000-0000-0000-000000000031', 'suporte-ti', 'Agente de Suporte de TI', 'Help desk e suporte técnico interno.', 'Organizações', '1.0.0', 'active', '{"availableForPurchase": true}'::jsonb, '{"model": "subscription", "includedInPlans": true}'::jsonb),
('10000000-0000-0000-0000-000000000032', 'consultoria-juridica', 'Agente de Consultoria Jurídica', 'Triagem e agendamento de consultas jurídicas.', 'Organizações', '1.0.0', 'active', '{"availableForPurchase": true}'::jsonb, '{"model": "subscription", "includedInPlans": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- RESUMO
-- ============================================================================

DO $$
DECLARE
  agent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO agent_count FROM alquimista_platform.agents WHERE config->>'availableForPurchase' = 'true';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Seed 005: 32 Agentes AlquimistaAI';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Agentes disponíveis: %', agent_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;
