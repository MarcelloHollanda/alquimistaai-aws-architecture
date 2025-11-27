-- schema-ingestao.sql
-- Schema para ingestão de leads no Micro Agente de Disparos & Agendamentos

-- ============================================
-- 1. TABELA PRINCIPAL DE LEADS
-- ============================================

CREATE TABLE IF NOT EXISTS leads (
  lead_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id_externo VARCHAR(255) UNIQUE NOT NULL,
  origem_arquivo VARCHAR(255) NOT NULL,
  origem_aba VARCHAR(100) NOT NULL,
  nome VARCHAR(255),
  contato_nome VARCHAR(255),
  documento VARCHAR(20),
  email_raw TEXT,
  telefone_raw TEXT,
  status VARCHAR(50) DEFAULT 'novo',
  tags JSONB DEFAULT '[]',
  data_ingestao TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE leads IS 'Tabela principal de leads importados de planilhas';
COMMENT ON COLUMN leads.lead_id IS 'ID interno único do lead';
COMMENT ON COLUMN leads.lead_id_externo IS 'ID externo para rastreabilidade (arquivo:linha)';
COMMENT ON COLUMN leads.origem_arquivo IS 'Nome do arquivo de origem';
COMMENT ON COLUMN leads.origem_aba IS 'Nome da aba da planilha';
COMMENT ON COLUMN leads.email_raw IS 'String bruta de emails (pode conter múltiplos separados por |)';
COMMENT ON COLUMN leads.telefone_raw IS 'String bruta de telefones (pode conter múltiplos separados por |)';
COMMENT ON COLUMN leads.status IS 'Status do lead: novo, em_disparo, agendado, contato_efetuado, sem_sucesso, descartado';
COMMENT ON COLUMN leads.tags IS 'Tags adicionais em formato JSON array';

-- ============================================
-- 2. TABELA DE TELEFONES EXPLODIDOS
-- ============================================

CREATE TABLE IF NOT EXISTS lead_telefones (
  telefone_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,
  telefone VARCHAR(50) NOT NULL,
  telefone_principal BOOLEAN DEFAULT FALSE,
  tipo_origem VARCHAR(50) DEFAULT 'nao_classificado',
  valido_para_disparo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE lead_telefones IS 'Telefones explodidos de cada lead';
COMMENT ON COLUMN lead_telefones.telefone_principal IS 'Indica se é o telefone principal (primeiro da lista)';
COMMENT ON COLUMN lead_telefones.tipo_origem IS 'Tipo: movel, fixo, internacional, desconhecido, nao_classificado';
COMMENT ON COLUMN lead_telefones.valido_para_disparo IS 'Se passou nas validações de formato e DDD';

-- ============================================
-- 3. TABELA DE EMAILS EXPLODIDOS
-- ============================================

CREATE TABLE IF NOT EXISTS lead_emails (
  email_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  email_principal BOOLEAN DEFAULT FALSE,
  valido_para_disparo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE lead_emails IS 'Emails explodidos de cada lead';
COMMENT ON COLUMN lead_emails.email_principal IS 'Indica se é o email principal (primeiro da lista)';
COMMENT ON COLUMN lead_emails.valido_para_disparo IS 'Se passou nas validações de formato e sintaxe';

-- ============================================
-- 4. ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índices na tabela leads
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_externo ON leads(lead_id_externo);
CREATE INDEX IF NOT EXISTS idx_leads_origem ON leads(origem_arquivo, origem_aba);
CREATE INDEX IF NOT EXISTS idx_leads_data_ingestao ON leads(data_ingestao DESC);
CREATE INDEX IF NOT EXISTS idx_leads_documento ON leads(documento) WHERE documento IS NOT NULL;

-- Índices na tabela lead_telefones
CREATE INDEX IF NOT EXISTS idx_lead_telefones_lead ON lead_telefones(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_telefones_valido ON lead_telefones(valido_para_disparo);
CREATE INDEX IF NOT EXISTS idx_lead_telefones_principal ON lead_telefones(lead_id, telefone_principal);
CREATE INDEX IF NOT EXISTS idx_lead_telefones_tipo ON lead_telefones(tipo_origem);

-- Índices na tabela lead_emails
CREATE INDEX IF NOT EXISTS idx_lead_emails_lead ON lead_emails(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_emails_valido ON lead_emails(valido_para_disparo);
CREATE INDEX IF NOT EXISTS idx_lead_emails_principal ON lead_emails(lead_id, email_principal);
CREATE INDEX IF NOT EXISTS idx_lead_emails_email ON lead_emails(email);

-- ============================================
-- 5. TRIGGER PARA UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. VIEWS ÚTEIS
-- ============================================

-- View de leads com contatos principais
CREATE OR REPLACE VIEW v_leads_com_contatos AS
SELECT 
    l.lead_id,
    l.lead_id_externo,
    l.nome,
    l.contato_nome,
    l.documento,
    l.status,
    l.tags,
    l.data_ingestao,
    (SELECT email FROM lead_emails WHERE lead_id = l.lead_id AND email_principal = TRUE LIMIT 1) as email_principal,
    (SELECT telefone FROM lead_telefones WHERE lead_id = l.lead_id AND telefone_principal = TRUE LIMIT 1) as telefone_principal,
    (SELECT COUNT(*) FROM lead_emails WHERE lead_id = l.lead_id) as total_emails,
    (SELECT COUNT(*) FROM lead_telefones WHERE lead_id = l.lead_id) as total_telefones
FROM leads l;

COMMENT ON VIEW v_leads_com_contatos IS 'View de leads com seus contatos principais agregados';

-- View de estatísticas de ingestão
CREATE OR REPLACE VIEW v_stats_ingestao AS
SELECT 
    origem_arquivo,
    COUNT(*) as total_leads,
    COUNT(DISTINCT documento) FILTER (WHERE documento IS NOT NULL) as leads_com_documento,
    MIN(data_ingestao) as primeira_ingestao,
    MAX(data_ingestao) as ultima_ingestao,
    COUNT(*) FILTER (WHERE status = 'novo') as leads_novos,
    COUNT(*) FILTER (WHERE status = 'em_disparo') as leads_em_disparo,
    COUNT(*) FILTER (WHERE status = 'agendado') as leads_agendados,
    COUNT(*) FILTER (WHERE status = 'contato_efetuado') as leads_contatados
FROM leads
GROUP BY origem_arquivo
ORDER BY ultima_ingestao DESC;

COMMENT ON VIEW v_stats_ingestao IS 'Estatísticas de ingestão por arquivo';

-- ============================================
-- 7. FUNÇÃO PARA BUSCAR LEADS PARA DISPARO
-- ============================================

CREATE OR REPLACE FUNCTION get_leads_para_disparo(
    p_limit INTEGER DEFAULT 100,
    p_status VARCHAR DEFAULT 'novo'
)
RETURNS TABLE (
    lead_id UUID,
    nome VARCHAR,
    email VARCHAR,
    telefone VARCHAR,
    tipo_contato VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.lead_id,
        l.nome,
        e.email,
        t.telefone,
        CASE 
            WHEN e.email IS NOT NULL AND t.telefone IS NOT NULL THEN 'ambos'
            WHEN e.email IS NOT NULL THEN 'email'
            WHEN t.telefone IS NOT NULL THEN 'telefone'
            ELSE 'nenhum'
        END as tipo_contato
    FROM leads l
    LEFT JOIN lead_emails e ON e.lead_id = l.lead_id AND e.email_principal = TRUE AND e.valido_para_disparo = TRUE
    LEFT JOIN lead_telefones t ON t.lead_id = l.lead_id AND t.telefone_principal = TRUE AND t.valido_para_disparo = TRUE
    WHERE l.status = p_status
    AND (e.email IS NOT NULL OR t.telefone IS NOT NULL)
    ORDER BY l.data_ingestao ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_leads_para_disparo IS 'Busca leads prontos para disparo com contatos válidos';

-- ============================================
-- 8. GRANTS (ajustar conforme necessário)
-- ============================================

-- GRANT SELECT, INSERT, UPDATE, DELETE ON leads TO lambda_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON lead_telefones TO lambda_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON lead_emails TO lambda_user;
-- GRANT SELECT ON v_leads_com_contatos TO lambda_user;
-- GRANT SELECT ON v_stats_ingestao TO lambda_user;
-- GRANT EXECUTE ON FUNCTION get_leads_para_disparo TO lambda_user;

-- ============================================
-- FIM DO SCHEMA
-- ============================================

-- Verificar criação
SELECT 
    'Tabelas criadas:' as info,
    COUNT(*) as total
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('leads', 'lead_telefones', 'lead_emails');
