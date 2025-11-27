-- Seed 004: Subscription System Test Data
-- Descrição: Dados de teste para agentes AlquimistaAI e SubNúcleos Fibonacci
-- Data: 2025-01-17

-- ============================================================================
-- AGENTES ALQUIMISTAI (R$ 29,90/mês cada)
-- ============================================================================

-- Inserir agentes na tabela agents (assumindo que a tabela já existe)
-- Se a tabela agents não existir, ajustar conforme schema real

INSERT INTO agents (id, name, segment, description, tags, price_monthly, status, created_at)
VALUES
  -- Agentes de Atendimento
  (
    gen_random_uuid(),
    'Atendimento AI',
    'Atendimento',
    'Agente especializado em atendimento ao cliente 24/7 com respostas inteligentes e empáticas',
    '["atendimento", "suporte", "chat", "24/7"]',
    29.90,
    'active',
    NOW()
  ),
  
  -- Agentes de Vendas
  (
    gen_random_uuid(),
    'Vendas AI',
    'Vendas',
    'Agente focado em qualificação de leads e conversão de vendas com técnicas avançadas',
    '["vendas", "conversão", "leads", "qualificação"]',
    29.90,
    'active',
    NOW()
  ),
  
  -- Agentes de Marketing
  (
    gen_random_uuid(),
    'Social Media AI',
    'Marketing',
    'Criação e agendamento de conteúdo para redes sociais com análise de engajamento',
    '["marketing", "social-media", "conteúdo", "engajamento"]',
    29.90,
    'active',
    NOW()
  ),
  (
    gen_random_uuid(),
    'E-mail Marketing AI',
    'Marketing',
    'Automação de campanhas de e-mail marketing com personalização e segmentação',
    '["marketing", "email", "automação", "campanhas"]',
    29.90,
    'active',
    NOW()
  ),
  (
    gen_random_uuid(),
    'SEO AI',
    'Marketing',
    'Otimização de conteúdo para mecanismos de busca com análise de palavras-chave',
    '["marketing", "seo", "otimização", "conteúdo"]',
    29.90,
    'active',
    NOW()
  ),
  
  -- Agentes de Suporte
  (
    gen_random_uuid(),
    'Suporte Técnico AI',
    'Suporte',
    'Resolução de problemas técnicos com base de conhecimento integrada',
    '["suporte", "técnico", "troubleshooting", "help-desk"]',
    29.90,
    'active',
    NOW()
  ),
  
  -- Agentes de Análise
  (
    gen_random_uuid(),
    'Análise de Sentimento AI',
    'Análise',
    'Análise de sentimento em interações com clientes para insights estratégicos',
    '["análise", "sentimento", "insights", "dados"]',
    29.90,
    'active',
    NOW()
  ),
  (
    gen_random_uuid(),
    'Relatórios AI',
    'Análise',
    'Geração automática de relatórios e dashboards com insights de negócio',
    '["análise", "relatórios", "dashboards", "bi"]',
    29.90,
    'active',
    NOW()
  ),
  
  -- Agentes de Agendamento
  (
    gen_random_uuid(),
    'Agendamento AI',
    'Produtividade',
    'Agendamento inteligente de reuniões e compromissos com integração de calendário',
    '["agendamento", "calendário", "reuniões", "produtividade"]',
    29.90,
    'active',
    NOW()
  ),
  
  -- Agentes de Cobrança
  (
    gen_random_uuid(),
    'Cobrança AI',
    'Financeiro',
    'Automação de cobranças e follow-up de pagamentos com abordagem humanizada',
    '["cobrança", "financeiro", "pagamentos", "follow-up"]',
    29.90,
    'active',
    NOW()
  ),
  
  -- Agentes de Conteúdo
  (
    gen_random_uuid(),
    'Criação de Conteúdo AI',
    'Marketing',
    'Geração de conteúdo otimizado para blogs, artigos e landing pages',
    '["conteúdo", "copywriting", "blogs", "artigos"]',
    29.90,
    'active',
    NOW()
  ),
  
  -- Agentes de Qualificação
  (
    gen_random_uuid(),
    'Qualificação de Leads AI',
    'Vendas',
    'Qualificação automática de leads com scoring e priorização inteligente',
    '["qualificação", "leads", "scoring", "vendas"]',
    29.90,
    'active',
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SUBNÚCLEOS FIBONACCI (R$ 365,00/mês base + taxas sob consulta)
-- ============================================================================

-- Inserir SubNúcleos na tabela subnucleos (assumindo que a tabela já existe)
-- Se a tabela não existir, ajustar conforme schema real

INSERT INTO subnucleos (id, name, description, scope, base_price_monthly, status, created_at)
VALUES
  (
    gen_random_uuid(),
    'Saúde',
    'SubNúcleo especializado em gestão de clínicas, hospitais e consultórios médicos',
    'Agendamento de consultas, prontuário eletrônico, telemedicina, gestão de pacientes',
    365.00,
    'active',
    NOW()
  ),
  (
    gen_random_uuid(),
    'Educação',
    'SubNúcleo para instituições de ensino com gestão acadêmica completa',
    'Matrícula, frequência, notas, comunicação com pais, EAD, biblioteca',
    365.00,
    'active',
    NOW()
  ),
  (
    gen_random_uuid(),
    'Vendas B2B',
    'SubNúcleo focado em vendas corporativas e gestão de pipeline complexo',
    'CRM avançado, gestão de oportunidades, forecasting, automação de vendas',
    365.00,
    'active',
    NOW()
  ),
  (
    gen_random_uuid(),
    'Cobrança',
    'SubNúcleo especializado em recuperação de crédito e gestão de inadimplência',
    'Réguas de cobrança, negociação, acordos, integração bancária, relatórios',
    365.00,
    'active',
    NOW()
  ),
  (
    gen_random_uuid(),
    'Imobiliário',
    'SubNúcleo para imobiliárias e construtoras com gestão completa',
    'Cadastro de imóveis, visitas, propostas, contratos, comissões, portal',
    365.00,
    'active',
    NOW()
  ),
  (
    gen_random_uuid(),
    'Jurídico',
    'SubNúcleo para escritórios de advocacia e departamentos jurídicos',
    'Gestão de processos, prazos, audiências, documentos, timesheet, honorários',
    365.00,
    'active',
    NOW()
  ),
  (
    gen_random_uuid(),
    'Varejo',
    'SubNúcleo para lojas físicas e e-commerce com gestão integrada',
    'PDV, estoque, vendas online, marketplace, fidelidade, omnichannel',
    365.00,
    'active',
    NOW()
  ),
  (
    gen_random_uuid(),
    'Serviços',
    'SubNúcleo para empresas de serviços com gestão de ordens de serviço',
    'Agendamento, execução, checklist, materiais, equipes, faturamento',
    365.00,
    'active',
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- DADOS DE TESTE PARA TRIALS
-- ============================================================================

-- Inserir alguns trials de exemplo (opcional, para testes)
-- Comentado por padrão, descomentar se necessário para testes

/*
INSERT INTO trials (user_id, target_type, target_id, started_at, usage_count, expires_at, status)
VALUES
  (
    (SELECT id FROM users LIMIT 1),
    'agent',
    (SELECT id FROM agents WHERE name = 'Atendimento AI' LIMIT 1),
    NOW() - INTERVAL '2 hours',
    3,
    NOW() + INTERVAL '22 hours',
    'active'
  ),
  (
    (SELECT id FROM users LIMIT 1),
    'subnucleo',
    (SELECT id FROM subnucleos WHERE name = 'Saúde' LIMIT 1),
    NOW() - INTERVAL '25 hours',
    2,
    NOW() - INTERVAL '1 hour',
    'expired'
  );
*/

-- ============================================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON TABLE agents IS 'Agentes AlquimistaAI disponíveis para assinatura (R$ 29,90/mês cada)';
COMMENT ON TABLE subnucleos IS 'SubNúcleos Fibonacci disponíveis (R$ 365,00/mês base + taxas sob consulta)';

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

-- Verificar agentes inseridos
-- SELECT name, segment, price_monthly FROM agents WHERE status = 'active' ORDER BY segment, name;

-- Verificar SubNúcleos inseridos
-- SELECT name, base_price_monthly FROM subnucleos WHERE status = 'active' ORDER BY name;
