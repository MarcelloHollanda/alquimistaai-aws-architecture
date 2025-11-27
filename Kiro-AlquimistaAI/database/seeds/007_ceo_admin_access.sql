-- Seed 007: CEO e Administrador AlquimistaAI
-- Descrição: Cria tenant interno AlquimistaAI e usuários administrativos
-- Data: 2025-01-17
-- Autor: Sistema AlquimistaAI

-- ============================================================================
-- TENANT INTERNO: AlquimistaAI (Empresa Proprietária)
-- ============================================================================

INSERT INTO alquimista_platform.tenants (
  id,
  name,
  company_name,
  cnpj,
  email,
  phone,
  status,
  tier,
  metadata
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'alquimista-ai-internal',
  'AlquimistaAI Tecnologia Ltda',
  '00.000.000/0001-00',
  'contato@alquimista.ai',
  '+5584997084444',
  'active',
  'enterprise',
  '{
    "isInternal": true,
    "hasFullAccess": true,
    "canManageAllTenants": true,
    "description": "Tenant interno da AlquimistaAI - Acesso total ao sistema"
  }'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  company_name = EXCLUDED.company_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  metadata = EXCLUDED.metadata;

-- ============================================================================
-- USUÁRIO 1: José Marcello Rocha Hollanda (CEO Administrador)
-- ============================================================================

INSERT INTO alquimista_platform.users (
  id,
  tenant_id,
  email,
  name,
  phone,
  role,
  status,
  metadata
) VALUES (
  '00000000-0000-0000-0001-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'jmrhollanda@gmail.com',
  'José Marcello Rocha Hollanda',
  '+5584997084444',
  'CEO_ADMIN',
  'active',
  '{
    "title": "CEO & Fundador",
    "department": "Executivo",
    "permissions": {
      "fullSystemAccess": true,
      "canManageAllTenants": true,
      "canManageUsers": true,
      "canManageAgents": true,
      "canManageBilling": true,
      "canViewAllData": true,
      "canModifySystemConfig": true,
      "canAccessOperationalDashboard": true
    },
    "accessLevel": "SUPER_ADMIN",
    "description": "CEO e Administrador Principal do Sistema AlquimistaAI"
  }'::jsonb
) ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  metadata = EXCLUDED.metadata;

-- ============================================================================
-- USUÁRIO 2: AlquimistaAI Master (Conta Master)
-- ============================================================================

INSERT INTO alquimista_platform.users (
  id,
  tenant_id,
  email,
  name,
  phone,
  role,
  status,
  metadata
) VALUES (
  '00000000-0000-0000-0001-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'alquimistafibonacci@gmail.com',
  'AlquimistaAI Master',
  '+5584997084444',
  'MASTER',
  'active',
  '{
    "title": "Conta Master do Sistema",
    "department": "Operações",
    "permissions": {
      "fullSystemAccess": true,
      "canManageTenants": true,
      "canManageUsers": true,
      "canManageAgents": true,
      "canViewAllData": true,
      "canAccessOperationalDashboard": true,
      "canReceiveCommercialContacts": true
    },
    "accessLevel": "MASTER",
    "description": "Conta Master para operações e contatos comerciais"
  }'::jsonb
) ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  metadata = EXCLUDED.metadata;

-- ============================================================================
-- ASSINATURA ENTERPRISE COMPLETA PARA TENANT INTERNO
-- ============================================================================

-- Criar assinatura Enterprise (todos os SubNúcleos e agentes)
INSERT INTO tenant_subscriptions (
  tenant_id,
  plan_id,
  billing_cycle,
  status,
  amount,
  currency,
  current_period_start,
  current_period_end
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000004', -- Enterprise Plan
  'yearly',
  'active',
  0.00, -- Sem custo para tenant interno
  'BRL',
  NOW(),
  NOW() + INTERVAL '100 years' -- Assinatura perpétua
) ON CONFLICT (tenant_id) DO UPDATE SET
  plan_id = EXCLUDED.plan_id,
  status = 'active',
  current_period_end = NOW() + INTERVAL '100 years';

-- Ativar todos os 7 SubNúcleos
INSERT INTO tenant_subnucleos (tenant_id, subnucleo_id, is_active)
SELECT 
  '00000000-0000-0000-0000-000000000001',
  id,
  true
FROM subnucleos
WHERE is_active = true
ON CONFLICT (tenant_id, subnucleo_id) DO UPDATE SET
  is_active = true,
  activated_at = NOW();

-- Ativar todos os 32 agentes
INSERT INTO tenant_agents (tenant_id, agent_id, is_active)
SELECT 
  '00000000-0000-0000-0000-000000000001',
  id,
  true
FROM alquimista_platform.agents
WHERE status = 'active'
ON CONFLICT (tenant_id, agent_id) DO UPDATE SET
  is_active = true,
  activated_at = NOW();

-- ============================================================================
-- PERMISSÕES ESPECIAIS
-- ============================================================================

-- Garantir que CEO_ADMIN tem todas as permissões
INSERT INTO user_permissions (user_id, permission_key, granted_at) VALUES
('00000000-0000-0000-0001-000000000001', 'system.full_access', NOW()),
('00000000-0000-0000-0001-000000000001', 'tenants.manage_all', NOW()),
('00000000-0000-0000-0001-000000000001', 'users.manage_all', NOW()),
('00000000-0000-0000-0001-000000000001', 'agents.manage_all', NOW()),
('00000000-0000-0000-0001-000000000001', 'billing.manage_all', NOW()),
('00000000-0000-0000-0001-000000000001', 'data.view_all', NOW()),
('00000000-0000-0000-0001-000000000001', 'config.modify_system', NOW()),
('00000000-0000-0000-0001-000000000001', 'dashboard.operational_access', NOW())
ON CONFLICT (user_id, permission_key) DO NOTHING;

-- Garantir que MASTER tem permissões operacionais
INSERT INTO user_permissions (user_id, permission_key, granted_at) VALUES
('00000000-0000-0000-0001-000000000002', 'system.full_access', NOW()),
('00000000-0000-0000-0001-000000000002', 'tenants.manage', NOW()),
('00000000-0000-0000-0001-000000000002', 'users.manage', NOW()),
('00000000-0000-0000-0001-000000000002', 'agents.manage', NOW()),
('00000000-0000-0000-0001-000000000002', 'data.view_all', NOW()),
('00000000-0000-0000-0001-000000000002', 'dashboard.operational_access', NOW()),
('00000000-0000-0000-0001-000000000002', 'commercial.receive_contacts', NOW())
ON CONFLICT (user_id, permission_key) DO NOTHING;

-- ============================================================================
-- RESUMO
-- ============================================================================

DO $$
DECLARE
  subnucleos_count INTEGER;
  agents_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO subnucleos_count 
  FROM tenant_subnucleos 
  WHERE tenant_id = '00000000-0000-0000-0000-000000000001' AND is_active = true;
  
  SELECT COUNT(*) INTO agents_count 
  FROM tenant_agents 
  WHERE tenant_id = '00000000-0000-0000-0000-000000000001' AND is_active = true;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Seed 007: CEO e Administrador AlquimistaAI';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tenant Interno: AlquimistaAI Tecnologia';
  RAISE NOTICE '';
  RAISE NOTICE 'USUÁRIOS CRIADOS:';
  RAISE NOTICE '  1. José Marcello Rocha Hollanda (CEO_ADMIN)';
  RAISE NOTICE '     Email: jmrhollanda@gmail.com';
  RAISE NOTICE '     Telefone: +5584997084444';
  RAISE NOTICE '     Acesso: SUPER_ADMIN (Acesso Total)';
  RAISE NOTICE '';
  RAISE NOTICE '  2. AlquimistaAI Master (MASTER)';
  RAISE NOTICE '     Email: alquimistafibonacci@gmail.com';
  RAISE NOTICE '     Telefone: +5584997084444';
  RAISE NOTICE '     Acesso: MASTER (Operações)';
  RAISE NOTICE '';
  RAISE NOTICE 'ASSINATURA:';
  RAISE NOTICE '  Plano: Enterprise (Perpétuo)';
  RAISE NOTICE '  SubNúcleos ativos: %', subnucleos_count;
  RAISE NOTICE '  Agentes ativos: %', agents_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;
