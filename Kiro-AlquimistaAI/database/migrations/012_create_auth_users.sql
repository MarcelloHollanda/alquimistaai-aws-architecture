-- Migration: 012_create_auth_users
-- Descrição: Criar tabela users para sistema de autenticação
-- Data: 2024-01-XX
-- Autor: Sistema de Autenticação Cognito

-- ============================================================================
-- TABELA: users
-- Descrição: Armazena dados dos usuários autenticados via Cognito
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cognito_sub VARCHAR(255) UNIQUE NOT NULL,
  tenant_id UUID NOT NULL REFERENCES companies(tenant_id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  language VARCHAR(10) DEFAULT 'pt-BR',
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

-- Índice para busca por tenant_id (usado em todas as queries multi-tenant)
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);

-- Índice para busca por cognito_sub (usado na autenticação)
CREATE INDEX IF NOT EXISTS idx_users_cognito_sub ON users(cognito_sub);

-- Índice para busca por email (usado no login e recuperação de senha)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Índice composto para busca por tenant + email
CREATE INDEX IF NOT EXISTS idx_users_tenant_email ON users(tenant_id, email);

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE users IS 'Usuários autenticados via Amazon Cognito';
COMMENT ON COLUMN users.id IS 'ID único do usuário';
COMMENT ON COLUMN users.cognito_sub IS 'Subject (sub) do usuário no Cognito';
COMMENT ON COLUMN users.tenant_id IS 'ID do tenant ao qual o usuário pertence';
COMMENT ON COLUMN users.email IS 'E-mail do usuário (único)';
COMMENT ON COLUMN users.name IS 'Nome completo do usuário';
COMMENT ON COLUMN users.phone IS 'Telefone/WhatsApp do usuário';
COMMENT ON COLUMN users.language IS 'Idioma preferido do usuário';
COMMENT ON COLUMN users.timezone IS 'Fuso horário do usuário';
COMMENT ON COLUMN users.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN users.updated_at IS 'Data da última atualização';

-- ============================================================================
-- TRIGGER: Atualizar updated_at automaticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- ============================================================================
-- CONSTRAINT: Validar formato de e-mail
-- ============================================================================

ALTER TABLE users ADD CONSTRAINT check_email_format 
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- ============================================================================
-- CONSTRAINT: Validar idioma
-- ============================================================================

ALTER TABLE users ADD CONSTRAINT check_language_format 
  CHECK (language IN ('pt-BR', 'en-US', 'es-ES'));

-- ============================================================================
-- DADOS DE EXEMPLO (OPCIONAL - APENAS PARA DEV)
-- ============================================================================

-- Inserir usuário de exemplo para desenvolvimento
-- NOTA: Comentar ou remover em produção
/*
INSERT INTO users (
  cognito_sub,
  tenant_id,
  email,
  name,
  phone,
  language,
  timezone
)
SELECT
  'example-cognito-sub-123',
  tenant_id,
  'admin@example.com',
  'Administrador Exemplo',
  '+55 11 99999-9999',
  'pt-BR',
  'America/Sao_Paulo'
FROM companies
WHERE cnpj = '12.345.678/0001-90'
ON CONFLICT (email) DO NOTHING;
*/

-- ============================================================================
-- ROLLBACK
-- ============================================================================

-- Para reverter esta migration, execute:
-- DROP TRIGGER IF EXISTS trigger_update_users_updated_at ON users;
-- DROP FUNCTION IF EXISTS update_users_updated_at();
-- DROP TABLE IF EXISTS users CASCADE;
