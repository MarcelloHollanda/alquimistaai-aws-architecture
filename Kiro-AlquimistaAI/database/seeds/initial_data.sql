-- Initial Data Seed
-- Purpose: Populate initial catalog of agents, demo tenant, and demo admin user
-- Requirements: 14.1, 14.2

-- ============================================================================
-- Demo Tenant (COMMENTED OUT - Use production data instead)
-- ============================================================================
-- 
-- IMPORTANT: Demo data is commented out. 
-- To use production data, create and run database/seeds/001_production_data.sql
-- See database/seeds/001_production_data.template.sql for template
--
/*
INSERT INTO alquimista_platform.tenants (
    id,
    company_name,
    cnpj,
    subscription_tier,
    subscription_status,
    settings
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Empresa Demo',
    '12.345.678/0001-90',
    'professional',
    'active',
    '{
        "calendarId": "demo@alquimista.ai",
        "salesEmail": "vendas@demo.com",
        "whatsappNumber": "+5511999999999",
        "rateLimits": {
            "messagesPerHour": 100,
            "messagesPerDay": 500
        }
    }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Demo Admin User (COMMENTED OUT - Use production data instead)
-- ============================================================================

INSERT INTO alquimista_platform.users (
    id,
    tenant_id,
    email,
    full_name,
    user_role,
    status
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'admin@demo.com',
    'Admin Demo',
    'admin',
    'active'
) ON CONFLICT (email) DO NOTHING;
*/

-- ============================================================================
-- Agent Catalog - Nigredo Agents (Prospecção)
-- ============================================================================

-- Agent: Recebimento
INSERT INTO alquimista_platform.agents (
    id,
    name,
    display_name,
    description,
    category,
    version,
    status,
    config,
    pricing
) VALUES (
    '10000000-0000-0000-0000-000000000001',
    'nigredo-recebimento',
    'Agente de Recebimento',
    'Higieniza, padroniza e enriquece dados de leads B2B através de pesquisa web e APIs externas. Remove duplicatas e segmenta leads por setor, porte e atividade.',
    'Vendas',
    '1.0.0',
    'active',
    '{
        "lambdaArn": "arn:aws:lambda:us-east-1:ACCOUNT:function:recebimento",
        "requiredPermissions": ["leads.write", "enrichment.read"],
        "defaultSettings": {
            "autoEnrichment": true,
            "deduplication": true
        }
    }'::jsonb,
    '{
        "model": "subscription",
        "costPerExecution": 0.0,
        "includedInTiers": ["professional", "enterprise"]
    }'::jsonb
) ON CONFLICT (name) DO NOTHING;

-- Agent: Estratégia
INSERT INTO alquimista_platform.agents (
    id,
    name,
    display_name,
    description,
    category,
    version,
    status,
    config,
    pricing
) VALUES (
    '10000000-0000-0000-0000-000000000002',
    'nigredo-estrategia',
    'Agente de Estratégia',
    'Cria campanhas segmentadas com mensagens personalizadas para cada estágio do funil. Gera variações para testes A/B e define canal ideal por segmento.',
    'Vendas',
    '1.0.0',
    'active',
    '{
        "lambdaArn": "arn:aws:lambda:us-east-1:ACCOUNT:function:estrategia",
        "requiredPermissions": ["campaigns.write", "leads.read"],
        "defaultSettings": {
            "abTesting": true,
            "autoApproval": false
        }
    }'::jsonb,
    '{
        "model": "subscription",
        "costPerExecution": 0.0,
        "includedInTiers": ["professional", "enterprise"]
    }'::jsonb
) ON CONFLICT (name) DO NOTHING;

-- Agent: Disparo
INSERT INTO alquimista_platform.agents (
    id,
    name,
    display_name,
    description,
    category,
    version,
    status,
    config,
    pricing
) VALUES (
    '10000000-0000-0000-0000-000000000003',
    'nigredo-disparo',
    'Agente de Disparo',
    'Envia mensagens de forma humanizada respeitando horários comerciais e rate limits. Adiciona variações sutis de horário para parecer mais natural.',
    'Vendas',
    '1.0.0',
    'active',
    '{
        "lambdaArn": "arn:aws:lambda:us-east-1:ACCOUNT:function:disparo",
        "requiredPermissions": ["messages.send", "campaigns.read"],
        "defaultSettings": {
            "businessHoursOnly": true,
            "rateLimitPerHour": 100
        }
    }'::jsonb,
    '{
        "model": "usage",
        "costPerExecution": 0.01,
        "includedInTiers": ["enterprise"]
    }'::jsonb
) ON CONFLICT (name) DO NOTHING;

-- Agent: Atendimento
INSERT INTO alquimista_platform.agents (
    id,
    name,
    display_name,
    description,
    category,
    version,
    status,
    config,
    pricing
) VALUES (
    '10000000-0000-0000-0000-000000000004',
    'nigredo-atendimento',
    'Agente de Atendimento',
    'Responde leads com tom consultivo e profissional usando LLM. Analisa sentimento e decide próximo passo (agendamento, nutrição ou descarte).',
    'Vendas',
    '1.0.0',
    'active',
    '{
        "lambdaArn": "arn:aws:lambda:us-east-1:ACCOUNT:function:atendimento",
        "requiredPermissions": ["messages.send", "leads.write", "sentiment.read"],
        "defaultSettings": {
            "autoResponse": true,
            "sentimentAnalysis": true
        }
    }'::jsonb,
    '{
        "model": "usage",
        "costPerExecution": 0.05,
        "includedInTiers": ["enterprise"]
    }'::jsonb
) ON CONFLICT (name) DO NOTHING;

-- Agent: Análise de Sentimento
INSERT INTO alquimista_platform.agents (
    id,
    name,
    display_name,
    description,
    category,
    version,
    status,
    config,
    pricing
) VALUES (
    '10000000-0000-0000-0000-000000000005',
    'nigredo-sentimento',
    'Agente de Análise de Sentimento',
    'Classifica emoção e intensidade das respostas dos leads. Detecta palavras-chave de descadastro para conformidade LGPD.',
    'Pesquisa',
    '1.0.0',
    'active',
    '{
        "lambdaArn": "arn:aws:lambda:us-east-1:ACCOUNT:function:sentimento",
        "requiredPermissions": ["sentiment.analyze"],
        "defaultSettings": {
            "language": "pt-BR",
            "lgpdDetection": true
        }
    }'::jsonb,
    '{
        "model": "subscription",
        "costPerExecution": 0.0,
        "includedInTiers": ["professional", "enterprise"]
    }'::jsonb
) ON CONFLICT (name) DO NOTHING;

-- Agent: Agendamento
INSERT INTO alquimista_platform.agents (
    id,
    name,
    display_name,
    description,
    category,
    version,
    status,
    config,
    pricing
) VALUES (
    '10000000-0000-0000-0000-000000000006',
    'nigredo-agendamento',
    'Agente de Agendamento',
    'Marca reuniões verificando disponibilidade em tempo real via Google Calendar. Gera briefing comercial com histórico completo do lead.',
    'Agenda',
    '1.0.0',
    'active',
    '{
        "lambdaArn": "arn:aws:lambda:us-east-1:ACCOUNT:function:agendamento",
        "requiredPermissions": ["calendar.write", "leads.read"],
        "defaultSettings": {
            "defaultDuration": 60,
            "autoConfirm": false
        }
    }'::jsonb,
    '{
        "model": "subscription",
        "costPerExecution": 0.0,
        "includedInTiers": ["professional", "enterprise"]
    }'::jsonb
) ON CONFLICT (name) DO NOTHING;

-- Agent: Relatórios
INSERT INTO alquimista_platform.agents (
    id,
    name,
    display_name,
    description,
    category,
    version,
    status,
    config,
    pricing
) VALUES (
    '10000000-0000-0000-0000-000000000007',
    'nigredo-relatorios',
    'Agente de Relatórios',
    'Gera dashboards e métricas de conversão do funil. Identifica objeções recorrentes e gera insights estratégicos usando LLM.',
    'Pesquisa',
    '1.0.0',
    'active',
    '{
        "lambdaArn": "arn:aws:lambda:us-east-1:ACCOUNT:function:relatorios",
        "requiredPermissions": ["metrics.read", "reports.write"],
        "defaultSettings": {
            "frequency": "daily",
            "deliveryTime": "08:00"
        }
    }'::jsonb,
    '{
        "model": "subscription",
        "costPerExecution": 0.0,
        "includedInTiers": ["professional", "enterprise"]
    }'::jsonb
) ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- Agent Catalog - Future Agents (Placeholders)
-- ============================================================================

-- Agent: Criador de Conteúdo
INSERT INTO alquimista_platform.agents (
    id,
    name,
    display_name,
    description,
    category,
    version,
    status,
    config,
    pricing
) VALUES (
    '20000000-0000-0000-0000-000000000001',
    'alquimista-content-creator',
    'Criador de Conteúdo',
    'Gera posts para redes sociais, artigos de blog e newsletters usando LLM. Adapta tom e estilo conforme marca.',
    'Conteúdo',
    '1.0.0',
    'beta',
    '{
        "lambdaArn": "arn:aws:lambda:us-east-1:ACCOUNT:function:content-creator",
        "requiredPermissions": ["content.write"],
        "defaultSettings": {
            "platforms": ["linkedin", "instagram", "blog"]
        }
    }'::jsonb,
    '{
        "model": "usage",
        "costPerExecution": 0.10,
        "includedInTiers": ["enterprise"]
    }'::jsonb
) ON CONFLICT (name) DO NOTHING;

-- Agent: Gerenciador de Redes Sociais
INSERT INTO alquimista_platform.agents (
    id,
    name,
    display_name,
    description,
    category,
    version,
    status,
    config,
    pricing
) VALUES (
    '20000000-0000-0000-0000-000000000002',
    'alquimista-social-manager',
    'Gerenciador de Redes Sociais',
    'Agenda e publica posts automaticamente. Responde comentários e mensagens diretas com tom apropriado.',
    'Social',
    '1.0.0',
    'beta',
    '{
        "lambdaArn": "arn:aws:lambda:us-east-1:ACCOUNT:function:social-manager",
        "requiredPermissions": ["social.write", "social.read"],
        "defaultSettings": {
            "autoPublish": false,
            "autoReply": true
        }
    }'::jsonb,
    '{
        "model": "subscription",
        "costPerExecution": 0.0,
        "includedInTiers": ["professional", "enterprise"]
    }'::jsonb
) ON CONFLICT (name) DO NOTHING;

-- Agent: Analista Financeiro
INSERT INTO alquimista_platform.agents (
    id,
    name,
    display_name,
    description,
    category,
    version,
    status,
    config,
    pricing
) VALUES (
    '20000000-0000-0000-0000-000000000003',
    'alquimista-financial-analyst',
    'Analista Financeiro',
    'Analisa demonstrativos financeiros e gera relatórios de performance. Identifica tendências e anomalias.',
    'Finanças',
    '1.0.0',
    'beta',
    '{
        "lambdaArn": "arn:aws:lambda:us-east-1:ACCOUNT:function:financial-analyst",
        "requiredPermissions": ["finance.read", "reports.write"],
        "defaultSettings": {
            "currency": "BRL",
            "reportFrequency": "monthly"
        }
    }'::jsonb,
    '{
        "model": "subscription",
        "costPerExecution": 0.0,
        "includedInTiers": ["enterprise"]
    }'::jsonb
) ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- Activate Nigredo Agents for Demo Tenant (COMMENTED OUT)
-- ============================================================================
--
-- IMPORTANT: Demo agent activations are commented out.
-- Production agent activations are handled in 001_production_data.sql
--
/*
-- Activate all Nigredo agents for demo tenant
INSERT INTO alquimista_platform.agent_activations (
    tenant_id,
    agent_id,
    status,
    tenant_config
) VALUES
    ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'active', '{}'::jsonb),
    ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'active', '{}'::jsonb),
    ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'active', '{}'::jsonb),
    ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'active', '{}'::jsonb),
    ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'active', '{}'::jsonb),
    ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006', 'active', '{}'::jsonb),
    ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000007', 'active', '{}'::jsonb)
ON CONFLICT (tenant_id, agent_id) DO NOTHING;
*/

-- ============================================================================
-- Default Permissions for Admin Role
-- ============================================================================

-- Grant all permissions to admin role
INSERT INTO alquimista_platform.permissions (
    resource_type,
    resource_id,
    action,
    subject_type,
    subject_id
) VALUES
    ('agent', NULL, 'read', 'role', 'admin'),
    ('agent', NULL, 'write', 'role', 'admin'),
    ('agent', NULL, 'execute', 'role', 'admin'),
    ('agent', NULL, 'manage', 'role', 'admin'),
    ('tenant', NULL, 'read', 'role', 'admin'),
    ('tenant', NULL, 'write', 'role', 'admin'),
    ('tenant', NULL, 'manage', 'role', 'admin'),
    ('user', NULL, 'read', 'role', 'admin'),
    ('user', NULL, 'write', 'role', 'admin'),
    ('user', NULL, 'manage', 'role', 'admin'),
    ('data', NULL, 'read', 'role', 'admin'),
    ('data', NULL, 'write', 'role', 'admin')
ON CONFLICT (resource_type, resource_id, action, subject_type, subject_id) DO NOTHING;

-- Grant read permissions to manager role
INSERT INTO alquimista_platform.permissions (
    resource_type,
    resource_id,
    action,
    subject_type,
    subject_id
) VALUES
    ('agent', NULL, 'read', 'role', 'manager'),
    ('agent', NULL, 'execute', 'role', 'manager'),
    ('tenant', NULL, 'read', 'role', 'manager'),
    ('user', NULL, 'read', 'role', 'manager'),
    ('data', NULL, 'read', 'role', 'manager'),
    ('data', NULL, 'write', 'role', 'manager')
ON CONFLICT (resource_type, resource_id, action, subject_type, subject_id) DO NOTHING;

-- Grant read-only permissions to viewer role
INSERT INTO alquimista_platform.permissions (
    resource_type,
    resource_id,
    action,
    subject_type,
    subject_id
) VALUES
    ('agent', NULL, 'read', 'role', 'viewer'),
    ('tenant', NULL, 'read', 'role', 'viewer'),
    ('data', NULL, 'read', 'role', 'viewer')
ON CONFLICT (resource_type, resource_id, action, subject_type, subject_id) DO NOTHING;

-- ============================================================================
-- Summary
-- ============================================================================

DO $$
DECLARE
    tenant_count INTEGER;
    user_count INTEGER;
    agent_count INTEGER;
    activation_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO tenant_count FROM alquimista_platform.tenants;
    SELECT COUNT(*) INTO user_count FROM alquimista_platform.users;
    SELECT COUNT(*) INTO agent_count FROM alquimista_platform.agents;
    SELECT COUNT(*) INTO activation_count FROM alquimista_platform.agent_activations;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Initial Data Seed Complete';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tenants: %', tenant_count;
    RAISE NOTICE 'Users: %', user_count;
    RAISE NOTICE 'Agents in Catalog: %', agent_count;
    RAISE NOTICE 'Agent Activations: %', activation_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;
