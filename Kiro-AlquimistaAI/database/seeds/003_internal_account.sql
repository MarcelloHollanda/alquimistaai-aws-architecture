-- Seed: Internal Account Setup
-- Description: Configure AlquimistaAI internal account with all agents
-- Version: 003
-- Date: 2024-01-15

-- Insert internal account configuration
INSERT INTO internal_account_config (
  account_id,
  account_type,
  plan_type,
  all_agents_enabled,
  priority_processing,
  unlimited_leads,
  advanced_analytics,
  custom_agents_enabled,
  white_label_enabled
) VALUES (
  'alquimista-internal-001',
  'master_internal',
  'enterprise_unlimited',
  true,
  true,
  true,
  true,
  true,
  false
) ON CONFLICT (account_id) DO UPDATE SET
  all_agents_enabled = EXCLUDED.all_agents_enabled,
  priority_processing = EXCLUDED.priority_processing,
  updated_at = CURRENT_TIMESTAMP;

-- Insert all 32 agents for internal use
-- NIGREDO (10 agents)
INSERT INTO internal_agent_usage (agent_id, agent_name, subnucleo, use_case, is_active) VALUES
('nigredo-qualificacao', 'Agente de Qualificação', 'nigredo', 'Qualify inbound leads from website, Product Hunt, webinars', true),
('nigredo-followup', 'Agente de Follow-up', 'nigredo', 'Automated follow-up sequences for trials and demos', true),
('nigredo-objecoes', 'Agente de Objeções', 'nigredo', 'Handle common objections (price, complexity, integration)', true),
('nigredo-agendamento', 'Agente de Agendamento', 'nigredo', 'Schedule demos, onboarding calls, check-ins', true),
('nigredo-estrategia', 'Agente de Estratégia', 'nigredo', 'Analyze sales pipeline and suggest optimizations', true),
('nigredo-disparo', 'Agente de Disparo', 'nigredo', 'Trigger campaigns based on user behavior', true),
('nigredo-recebimento', 'Agente de Recebimento', 'nigredo', 'Process payments and handle billing', true),
('nigredo-upsell', 'Agente de Upsell', 'nigredo', 'Identify upsell opportunities', true),
('nigredo-retencao', 'Agente de Retenção', 'nigredo', 'Prevent churn and retain customers', true),
('nigredo-contratos', 'Agente de Contratos', 'nigredo', 'Generate and manage sales contracts', true);

-- HERMES (6 agents)
INSERT INTO internal_agent_usage (agent_id, agent_name, subnucleo, use_case, is_active) VALUES
('hermes-social', 'Agente de Social Media', 'hermes', 'Manage LinkedIn, Twitter, Instagram posts', true),
('hermes-email', 'Agente de Email Marketing', 'hermes', 'Newsletter, nurture campaigns, reactivation', true),
('hermes-landing', 'Agente de Landing Pages', 'hermes', 'Create and optimize landing pages', true),
('hermes-seo', 'Agente de SEO', 'hermes', 'Optimize content and monitor rankings', true),
('hermes-ads', 'Agente de Ads', 'hermes', 'Manage Google, Meta, LinkedIn ads', true),
('hermes-conteudo', 'Agente de Conteúdo', 'hermes', 'Create blog posts, videos, ebooks', true);

-- SOPHIA (6 agents)
INSERT INTO internal_agent_usage (agent_id, agent_name, subnucleo, use_case, is_active) VALUES
('sophia-suporte', 'Agente de Suporte', 'sophia', 'Multi-channel customer support (chat, email, WhatsApp)', true),
('sophia-atendimento', 'Agente de Atendimento', 'sophia', 'Answer technical questions and troubleshoot', true),
('sophia-satisfacao', 'Agente de Satisfação', 'sophia', 'NPS, CSAT, CES surveys and follow-up', true),
('sophia-escalacao', 'Agente de Escalação', 'sophia', 'Route complex cases to specialists', true),
('sophia-faq', 'Agente de FAQ', 'sophia', 'Update knowledge base and documentation', true),
('sophia-sentimento', 'Agente de Sentimento', 'sophia', 'Analyze customer sentiment in real-time', true);

-- ATLAS (6 agents)
INSERT INTO internal_agent_usage (agent_id, agent_name, subnucleo, use_case, is_active) VALUES
('atlas-rh', 'Agente de RH', 'atlas', 'Recruitment, onboarding, team management', true),
('atlas-financeiro', 'Agente Financeiro', 'atlas', 'Track MRR, expenses, forecasting, invoicing', true),
('atlas-documentos', 'Agente de Documentos', 'atlas', 'Generate and organize documentation', true),
('atlas-contratos', 'Agente de Contratos', 'atlas', 'Review and manage contracts', true),
('atlas-compliance', 'Agente de Compliance', 'atlas', 'Monitor LGPD/GDPR compliance', true),
('atlas-recebimento', 'Agente de Recebimento', 'atlas', 'Process payments and collections', true);

-- ORACLE (4 agents)
INSERT INTO internal_agent_usage (agent_id, agent_name, subnucleo, use_case, is_active) VALUES
('oracle-relatorios', 'Agente de Relatórios', 'oracle', 'Daily, weekly, monthly reports for team and board', true),
('oracle-analytics', 'Agente de Analytics', 'oracle', 'User behavior, funnel, cohort analysis', true),
('oracle-previsao', 'Agente de Previsão', 'oracle', 'MRR forecast, churn prediction, LTV prediction', true),
('oracle-competicao', 'Agente de Competição', 'oracle', 'Monitor competitors and market positioning', true);

-- Set initial metrics targets
INSERT INTO internal_operations_metrics (metric_date, subnucleo, metric_name, metric_value, metric_unit, target_value) VALUES
-- Nigredo metrics
(CURRENT_DATE, 'nigredo', 'leads_qualificados_dia', 0, 'leads', 50),
(CURRENT_DATE, 'nigredo', 'taxa_conversao_trial_paid', 0, 'percentage', 25),
(CURRENT_DATE, 'nigredo', 'tempo_medio_fechamento', 0, 'days', 14),
(CURRENT_DATE, 'nigredo', 'pipeline_value', 0, 'BRL', 500000),

-- Hermes metrics
(CURRENT_DATE, 'hermes', 'trafego_organico', 0, 'visits', 50000),
(CURRENT_DATE, 'hermes', 'leads_gerados', 0, 'leads', 1000),
(CURRENT_DATE, 'hermes', 'cac', 0, 'BRL', 300),
(CURRENT_DATE, 'hermes', 'roas', 0, 'ratio', 3),

-- Sophia metrics
(CURRENT_DATE, 'sophia', 'tempo_primeira_resposta', 0, 'hours', 2),
(CURRENT_DATE, 'sophia', 'taxa_resolucao', 0, 'percentage', 90),
(CURRENT_DATE, 'sophia', 'csat', 0, 'score', 4.5),
(CURRENT_DATE, 'sophia', 'nps', 0, 'score', 50),

-- Atlas metrics
(CURRENT_DATE, 'atlas', 'processos_automatizados', 0, 'percentage', 80),
(CURRENT_DATE, 'atlas', 'tempo_onboarding', 0, 'days', 2),
(CURRENT_DATE, 'atlas', 'compliance_score', 100, 'percentage', 100),
(CURRENT_DATE, 'atlas', 'eficiencia_operacional', 0, 'percentage', 30),

-- Oracle metrics
(CURRENT_DATE, 'oracle', 'acuracia_previsoes', 0, 'percentage', 85),
(CURRENT_DATE, 'oracle', 'relatorios_automatizados', 100, 'percentage', 100),
(CURRENT_DATE, 'oracle', 'insights_semana', 0, 'count', 10),
(CURRENT_DATE, 'oracle', 'decisoes_data_driven', 0, 'percentage', 90);

COMMIT;
