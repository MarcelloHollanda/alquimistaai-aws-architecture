-- Migration 007: Tabela de Log Dry-Run
-- Criada em: 2024-11-27
-- Objetivo: Auditar decisões de canal e disparos pretendidos em modo dry-run

CREATE TABLE IF NOT EXISTS dry_run_log (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Dados do lead
  lead_id UUID,
  lead_nome VARCHAR(500),
  lead_telefone VARCHAR(50),
  lead_email VARCHAR(255),
  lead_documento VARCHAR(20),
  
  -- Decisão de canal
  canal_decidido VARCHAR(20) NOT NULL, -- 'whatsapp' | 'email' | 'calendar' | 'none'
  motivo_decisao TEXT NOT NULL,
  template_selecionado VARCHAR(100),
  
  -- Controle de execução
  disparo_seria_executado BOOLEAN DEFAULT TRUE,
  razao_bloqueio TEXT,
  
  -- Metadata
  ambiente VARCHAR(10) DEFAULT 'dev', -- 'dev' | 'prod'
  feature_flag_enabled BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_dry_run_tenant ON dry_run_log(tenant_id, created_at DESC);
CREATE INDEX idx_dry_run_canal ON dry_run_log(canal_decidido);
CREATE INDEX idx_dry_run_ambiente ON dry_run_log(ambiente, created_at DESC);

-- Comentários
COMMENT ON TABLE dry_run_log IS 'Log de auditoria para testes dry-run do Micro Agente de Disparos';
COMMENT ON COLUMN dry_run_log.canal_decidido IS 'Canal escolhido pela lógica de decisão';
COMMENT ON COLUMN dry_run_log.motivo_decisao IS 'Explicação de por que este canal foi escolhido';
COMMENT ON COLUMN dry_run_log.disparo_seria_executado IS 'Se true, o disparo seria executado em modo real';
COMMENT ON COLUMN dry_run_log.razao_bloqueio IS 'Motivo pelo qual o disparo não seria executado (ex: rate limit)';

-- Rollback
-- DROP TABLE IF EXISTS dry_run_log;
