-- Migration: 011_create_auth_companies
-- Descrição: Criar tabela companies para sistema de autenticação multi-tenant
-- Data: 2024-01-XX
-- Autor: Sistema de Autenticação Cognito

-- ============================================================================
-- TABELA: companies
-- Descrição: Armazena dados das empresas (tenants) no sistema multi-tenant
-- ============================================================================

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255),
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  segment VARCHAR(100) NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

-- Índice para busca por tenant_id (usado em todas as queries multi-tenant)
CREATE INDEX IF NOT EXISTS idx_companies_tenant_id ON companies(tenant_id);

-- Índice para busca por CNPJ (usado no cadastro para verificar duplicatas)
CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON companies(cnpj);

-- Índice para busca por nome (usado em pesquisas)
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE companies IS 'Empresas (tenants) do sistema multi-tenant';
COMMENT ON COLUMN companies.id IS 'ID único da empresa';
COMMENT ON COLUMN companies.tenant_id IS 'ID do tenant (usado para isolamento de dados)';
COMMENT ON COLUMN companies.name IS 'Nome fantasia da empresa';
COMMENT ON COLUMN companies.legal_name IS 'Razão social da empresa';
COMMENT ON COLUMN companies.cnpj IS 'CNPJ da empresa (único)';
COMMENT ON COLUMN companies.segment IS 'Segmento de atuação da empresa';
COMMENT ON COLUMN companies.logo_url IS 'URL da logomarca no S3';
COMMENT ON COLUMN companies.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN companies.updated_at IS 'Data da última atualização';

-- ============================================================================
-- TRIGGER: Atualizar updated_at automaticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_companies_updated_at();

-- ============================================================================
-- DADOS DE EXEMPLO (OPCIONAL - APENAS PARA DEV)
-- ============================================================================

-- Inserir empresa de exemplo para desenvolvimento
-- NOTA: Comentar ou remover em produção
/*
INSERT INTO companies (name, legal_name, cnpj, segment, logo_url)
VALUES (
  'Empresa Exemplo',
  'Empresa Exemplo LTDA',
  '12.345.678/0001-90',
  'Tecnologia',
  'https://alquimistaai-logos.s3.amazonaws.com/example/logo.png'
) ON CONFLICT (cnpj) DO NOTHING;
*/

-- ============================================================================
-- ROLLBACK
-- ============================================================================

-- Para reverter esta migration, execute:
-- DROP TRIGGER IF EXISTS trigger_update_companies_updated_at ON companies;
-- DROP FUNCTION IF EXISTS update_companies_updated_at();
-- DROP TABLE IF EXISTS companies CASCADE;
