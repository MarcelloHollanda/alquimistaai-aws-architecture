-- Migration: 014_create_auth_integrations
-- Descrição: Criar tabela integrations para gerenciar integrações externas
-- Data: 2024-01-XX
-- Autor: Sistema de Autenticação Cognito

-- ============================================================================
-- TABELA: integrations
-- Descrição: Armazena status e metadados das integrações externas por tenant
-- ============================================================================

CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES companies(tenant_id) ON DELETE CASCADE,
  integration_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
  secrets_path TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  last_sync_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, integration_name)
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

-- Índice para busca por tenant_id (usado para listar integrações do tenant)
CREATE INDEX IF NOT EXISTS idx_integrations_tenant_id ON integrations(tenant_id);

-- Índice para busca por status (usado para monitoramento)
CREATE INDEX IF NOT EXISTS idx_integrations_status ON integrations(status);

-- Índice composto para busca por tenant + status
CREATE INDEX IF NOT EXISTS idx_integrations_tenant_status ON integrations(tenant_id, status);

-- Índice GIN para busca em metadata JSONB
CREATE INDEX IF NOT EXISTS idx_integrations_metadata ON integrations USING GIN (metadata);

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE integrations IS 'Integrações externas configuradas por tenant';
COMMENT ON COLUMN integrations.id IS 'ID único da integração';
COMMENT ON COLUMN integrations.tenant_id IS 'ID do tenant';
COMMENT ON COLUMN integrations.integration_name IS 'Nome da integração (google, meta, twilio, etc)';
COMMENT ON COLUMN integrations.status IS 'Status da integração (connected, disconnected, error)';
COMMENT ON COLUMN integrations.secrets_path IS 'Path no Secrets Manager onde as credenciais estão armazenadas';
COMMENT ON COLUMN integrations.metadata IS 'Metadados adicionais da integração (JSON)';
COMMENT ON COLUMN integrations.last_sync_at IS 'Data da última sincronização bem-sucedida';
COMMENT ON COLUMN integrations.error_message IS 'Mensagem de erro (se status = error)';
COMMENT ON COLUMN integrations.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN integrations.updated_at IS 'Data da última atualização';

-- ============================================================================
-- INTEGRAÇÕES DISPONÍVEIS
-- ============================================================================

/*
Integrações suportadas:

1. google
   - Gmail API
   - Google Calendar API
   - Google Drive API
   
2. meta
   - WhatsApp Business API
   - Facebook Messenger API
   - Instagram API
   
3. twilio
   - SMS API
   - Voice API
   - WhatsApp API
   
4. evolution
   - WhatsApp API (alternativa)
   
5. vonage
   - SMS API
   - Voice API
   
6. stripe
   - Payment API
   
7. pagarme
   - Payment API (Brasil)
   
8. mailgun
   - Email API
   
9. sendgrid
   - Email API
   
10. aws-ses
    - Email API (AWS)
*/

-- ============================================================================
-- TRIGGER: Atualizar updated_at automaticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION update_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_integrations_updated_at();

-- ============================================================================
-- TRIGGER: Validar secrets_path quando status = connected
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_integration_secrets_path()
RETURNS TRIGGER AS $$
BEGIN
  -- Se status é connected, secrets_path deve estar preenchido
  IF NEW.status = 'connected' AND (NEW.secrets_path IS NULL OR NEW.secrets_path = '') THEN
    RAISE EXCEPTION 'secrets_path é obrigatório quando status = connected';
  END IF;
  
  -- Se status é connected, atualizar last_sync_at
  IF NEW.status = 'connected' AND OLD.status != 'connected' THEN
    NEW.last_sync_at = NOW();
  END IF;
  
  -- Se status é disconnected, limpar error_message
  IF NEW.status = 'disconnected' THEN
    NEW.error_message = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_integration_secrets_path
  BEFORE INSERT OR UPDATE ON integrations
  FOR EACH ROW
  EXECUTE FUNCTION validate_integration_secrets_path();

-- ============================================================================
-- FUNÇÃO: Obter integrações ativas de um tenant
-- ============================================================================

CREATE OR REPLACE FUNCTION get_active_integrations(p_tenant_id UUID)
RETURNS TABLE (
  integration_name VARCHAR,
  secrets_path TEXT,
  metadata JSONB,
  last_sync_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.integration_name,
    i.secrets_path,
    i.metadata,
    i.last_sync_at
  FROM integrations i
  WHERE i.tenant_id = p_tenant_id
    AND i.status = 'connected'
  ORDER BY i.integration_name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_active_integrations IS 'Retorna todas as integrações ativas de um tenant';

-- ============================================================================
-- FUNÇÃO: Marcar integração como erro
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_integration_error(
  p_tenant_id UUID,
  p_integration_name VARCHAR,
  p_error_message TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE integrations
  SET
    status = 'error',
    error_message = p_error_message,
    updated_at = NOW()
  WHERE tenant_id = p_tenant_id
    AND integration_name = p_integration_name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION mark_integration_error IS 'Marca uma integração como erro com mensagem';

-- ============================================================================
-- DADOS DE EXEMPLO (OPCIONAL - APENAS PARA DEV)
-- ============================================================================

-- Inserir integrações de exemplo para desenvolvimento
-- NOTA: Comentar ou remover em produção
/*
INSERT INTO integrations (tenant_id, integration_name, status, secrets_path, metadata)
SELECT
  tenant_id,
  'google',
  'disconnected',
  NULL,
  '{"scopes": ["gmail", "calendar"]}'::JSONB
FROM companies
WHERE cnpj = '12.345.678/0001-90'
ON CONFLICT (tenant_id, integration_name) DO NOTHING;

INSERT INTO integrations (tenant_id, integration_name, status, secrets_path, metadata)
SELECT
  tenant_id,
  'meta',
  'disconnected',
  NULL,
  '{"platforms": ["whatsapp", "messenger"]}'::JSONB
FROM companies
WHERE cnpj = '12.345.678/0001-90'
ON CONFLICT (tenant_id, integration_name) DO NOTHING;
*/

-- ============================================================================
-- ROLLBACK
-- ============================================================================

-- Para reverter esta migration, execute:
-- DROP FUNCTION IF EXISTS mark_integration_error(UUID, VARCHAR, TEXT);
-- DROP FUNCTION IF EXISTS get_active_integrations(UUID);
-- DROP TRIGGER IF EXISTS trigger_validate_integration_secrets_path ON integrations;
-- DROP FUNCTION IF EXISTS validate_integration_secrets_path();
-- DROP TRIGGER IF EXISTS trigger_update_integrations_updated_at ON integrations;
-- DROP FUNCTION IF EXISTS update_integrations_updated_at();
-- DROP TABLE IF EXISTS integrations CASCADE;
