-- Seed 005 Part 1: 32 Agentes AlquimistaAI
-- Descrição: Catálogo completo de agentes organizados por categoria

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
  '{"lambdaArn": "arn:aws:lambda:us-east-1:ACCOUNT:function:telemedicina", "requiredPermissions": ["health.read", "appointments.write"]}'::jsonb,
  '{"model": "subscription", "includedInPlans": true}'::jsonb
) ON CONFLICT (name) DO NOTHING;

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
  '{"lambdaArn": "arn:aws:lambda:us-east-1:ACCOUNT:function:clinica-medica", "requiredPermissions": ["health.read", "appointments.write"]}'::jsonb,
  '{"model": "subscription", "includedInPlans": true}'::jsonb
) ON CONFLICT (name) DO NOTHING;

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
  '{"lambdaArn": "arn:aws:lambda:us-east-1:ACCOUNT:function:clinica-odontologica", "requiredPermissions": ["health.read", "appointments.write"]}'::jsonb,
  '{"model": "subscription", "includedInPlans": true}'::jsonb
) ON CONFLICT (name) DO NOTHING;

-- 4. Agente de Saúde e Bem-Estar
INSERT INTO alquimista_platform.agents (
  id, name, display_name, description, category, version, status, config, pricing
) VALUES (
  '10000000-0000-0000-0000-000000000004',
  'saude-bem-estar',
  'Agente de Saúde e Bem-Estar',
  'Orientações sobre saúde preventiva, bem-estar e hábitos saudáveis.',
  'Saúde',
  '1.0.0',
  'active',
  '{"lambdaArn": "arn:aws:lambda:us-east-1:ACCOUNT:function:saude-bem-estar", "requiredPermissions": ["health.read"]}'::jsonb,
  '{"model": "subscription", "includedInPlans": true}'::jsonb
) ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- CATEGORIA: Educação & Cursos (3 agentes)
-- ============================================================================

-- 5. Agente de Consultas Educacionais e Lembretes
INSERT INTO alquimista_platform.agents (
  id, name, display_name, description, category, version, status, config, pricing
) VALUES (
  '10000000-0000-0000-0000-000000000005',
  'consultas-educacionais',
  'Agente de Consultas Educacionais e Lembretes',
  'Responde dúvidas sobre cursos, matrículas e envia lembretes de aulas.',
  'Educação',
  '1.0.0',
  'active',
  '{"lambdaArn": "arn:aws:lambda:us-east-1:ACCOUNT:function:consultas-educacionais", "requiredPermissions": ["education.read", "messages.send"]}'::jsonb,
  '{"model": "subscription", "includedInPlans": true}'::jsonb
) ON CONFLICT (name) DO NOTHING;

-- 6. Agente de Atendimento – Alunos de Curso Digital
INSERT INTO alquimista_platform.agents (
  id, name, display_name, description, category, version, status, config, pricing
) VALUES (
  '10000000-0000-0000-0000-000000000006',
  'alunos-curso-digital',
  'Agente de Atendimento – Alunos de Curso Digital',
  'Suporte técnico e pedagógico para alunos de cursos online.',
  'Educação',
  '1.0.0',
  'active',
  '{"lambdaArn": "arn:aws:lambda:us-east-1:ACCOUNT:function:alunos-curso-digital", "requiredPermissions": ["education.read", "support.write"]}'::jsonb,
  '{"model": "subscription", "includedInPlans": true}'::jsonb
) ON CONFLICT (name) DO NOTHING;

-- 7. Agente de Educação e EAD
INSERT INTO alquimista_platform.agents (
  id, name, display_name, description, category, version, status, config, pricing
) VALUES (
  '10000000-0000-0000-0000-000000000007',
  'educacao-ead',
  'Agente de Educação e EAD',
  'Gestão completa de plataformas EAD, engajamento de alunos e suporte.',
  'Educação',
  '1.0.0',
  'active',
  '{"lambdaArn": "arn:aws:lambda:us-east-1:ACCOUNT:function:educacao-ead", "requiredPermissions": ["education.read", "education.write"]}'::jsonb,
  '{"model": "subscription", "includedInPlans": true}'::jsonb
) ON CONFLICT (name) DO NOTHING;
