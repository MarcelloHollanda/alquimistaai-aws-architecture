-- Migration: 013_create_auth_user_roles
-- Descrição: Criar tabela user_roles para sistema de permissões
-- Data: 2024-01-XX
-- Autor: Sistema de Autenticação Cognito

-- ============================================================================
-- TABELA: user_roles
-- Descrição: Armazena papéis (roles) dos usuários no sistema
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES companies(tenant_id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('MASTER', 'ADMIN', 'OPERATIONAL', 'READ_ONLY')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, tenant_id)
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

-- Índice para busca por user_id (usado para verificar permissões)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- Índice para busca por tenant_id (usado para listar usuários do tenant)
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant_id ON user_roles(tenant_id);

-- Índice para busca por role (usado para listar usuários por papel)
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Índice composto para busca por tenant + role
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant_role ON user_roles(tenant_id, role);

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE user_roles IS 'Papéis (roles) dos usuários no sistema';
COMMENT ON COLUMN user_roles.id IS 'ID único do registro';
COMMENT ON COLUMN user_roles.user_id IS 'ID do usuário';
COMMENT ON COLUMN user_roles.tenant_id IS 'ID do tenant';
COMMENT ON COLUMN user_roles.role IS 'Papel do usuário (MASTER, ADMIN, OPERATIONAL, READ_ONLY)';
COMMENT ON COLUMN user_roles.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN user_roles.updated_at IS 'Data da última atualização';

-- ============================================================================
-- DESCRIÇÃO DOS PAPÉIS
-- ============================================================================

/*
MASTER:
  - Primeiro usuário de cada tenant
  - Permissões totais
  - Pode gerenciar usuários, empresa e integrações
  - Pode alterar configurações críticas

ADMIN:
  - Administrador do tenant
  - Pode gerenciar usuários e empresa
  - Pode configurar integrações
  - Não pode excluir o tenant

OPERATIONAL:
  - Usuário operacional
  - Pode usar a plataforma normalmente
  - Pode criar e editar dados
  - Não pode gerenciar usuários ou configurações

READ_ONLY:
  - Usuário somente leitura
  - Pode visualizar dados
  - Não pode criar ou editar
  - Não pode acessar configurações
*/

-- ============================================================================
-- TRIGGER: Atualizar updated_at automaticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_roles_updated_at();

-- ============================================================================
-- TRIGGER: Garantir apenas um MASTER por tenant
-- ============================================================================

CREATE OR REPLACE FUNCTION check_single_master_per_tenant()
RETURNS TRIGGER AS $$
DECLARE
  master_count INTEGER;
BEGIN
  -- Se o papel não é MASTER, permitir
  IF NEW.role != 'MASTER' THEN
    RETURN NEW;
  END IF;
  
  -- Contar quantos MASTER já existem para este tenant
  SELECT COUNT(*) INTO master_count
  FROM user_roles
  WHERE tenant_id = NEW.tenant_id
    AND role = 'MASTER'
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);
  
  -- Se já existe um MASTER, não permitir
  IF master_count > 0 THEN
    RAISE EXCEPTION 'Já existe um usuário MASTER para este tenant';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_single_master_per_tenant
  BEFORE INSERT OR UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION check_single_master_per_tenant();

-- ============================================================================
-- FUNÇÃO: Verificar se usuário tem permissão
-- ============================================================================

CREATE OR REPLACE FUNCTION user_has_permission(
  p_user_id UUID,
  p_tenant_id UUID,
  p_required_role VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  user_role VARCHAR;
  role_hierarchy JSONB := '{"MASTER": 4, "ADMIN": 3, "OPERATIONAL": 2, "READ_ONLY": 1}'::JSONB;
BEGIN
  -- Buscar papel do usuário
  SELECT role INTO user_role
  FROM user_roles
  WHERE user_id = p_user_id
    AND tenant_id = p_tenant_id;
  
  -- Se usuário não tem papel, retornar false
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar hierarquia
  RETURN (role_hierarchy->>user_role)::INTEGER >= (role_hierarchy->>p_required_role)::INTEGER;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION user_has_permission IS 'Verifica se usuário tem permissão baseado na hierarquia de papéis';

-- ============================================================================
-- DADOS DE EXEMPLO (OPCIONAL - APENAS PARA DEV)
-- ============================================================================

-- Inserir papel de exemplo para desenvolvimento
-- NOTA: Comentar ou remover em produção
/*
INSERT INTO user_roles (user_id, tenant_id, role)
SELECT
  u.id,
  u.tenant_id,
  'MASTER'
FROM users u
WHERE u.email = 'admin@example.com'
ON CONFLICT (user_id, tenant_id) DO NOTHING;
*/

-- ============================================================================
-- ROLLBACK
-- ============================================================================

-- Para reverter esta migration, execute:
-- DROP TRIGGER IF EXISTS trigger_check_single_master_per_tenant ON user_roles;
-- DROP FUNCTION IF EXISTS check_single_master_per_tenant();
-- DROP TRIGGER IF EXISTS trigger_update_user_roles_updated_at ON user_roles;
-- DROP FUNCTION IF EXISTS update_user_roles_updated_at();
-- DROP FUNCTION IF EXISTS user_has_permission(UUID, UUID, VARCHAR);
-- DROP TABLE IF EXISTS user_roles CASCADE;
