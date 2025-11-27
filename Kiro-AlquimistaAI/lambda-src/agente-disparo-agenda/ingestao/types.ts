// types.ts - Tipos TypeScript para ingestão de leads

export interface LeadRow {
  linha: number;
  nome: string;
  contato: string;
  documento: string;
  email: string;
  telefone: string;
}

export interface Lead {
  lead_id?: string;
  lead_id_externo: string;
  origem_arquivo: string;
  origem_aba: string;
  nome: string;
  contato_nome: string;
  documento: string;
  email_raw: string;
  telefone_raw: string;
  status: string;
  tags: string[];
  data_ingestao: Date;
}

export interface LeadTelefone {
  telefone_id?: string;
  lead_id: string;
  telefone: string;
  telefone_principal: boolean;
  tipo_origem: string;
  valido_para_disparo: boolean;
}

export interface LeadEmail {
  email_id?: string;
  lead_id: string;
  email: string;
  email_principal: boolean;
  valido_para_disparo: boolean;
}

export interface IngestaoResult {
  success: boolean;
  arquivo: string;
  leads_processados: number;
  telefones_criados: number;
  emails_criados: number;
  erros: string[];
}
