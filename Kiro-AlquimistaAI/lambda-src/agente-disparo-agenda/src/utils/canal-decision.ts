/**
 * Módulo de Decisão de Canal
 * 
 * Responsável por decidir qual canal usar (WhatsApp, Email, Calendar)
 * baseado nos dados disponíveis do lead.
 * 
 * Prioridade:
 * 1. WhatsApp (se houver telefone válido)
 * 2. Email (se houver email válido)
 * 3. Calendar (para agendamentos)
 * 4. None (sem canal disponível)
 */

export interface Lead {
  lead_id?: string;
  nome: string;
  contato_nome?: string;
  documento?: string;
  telefone_raw?: string;
  email_raw?: string;
  telefones?: Array<{
    telefone: string;
    valido_para_disparo: boolean;
    telefone_principal: boolean;
  }>;
  emails?: Array<{
    email: string;
    valido_para_disparo: boolean;
    email_principal: boolean;
  }>;
}

export interface CanalDecision {
  canal: 'whatsapp' | 'email' | 'calendar' | 'none';
  motivo: string;
  template?: string;
  destino?: string; // Telefone ou email selecionado
  prioridade: number; // 1 = alta, 2 = média, 3 = baixa
}

/**
 * Valida se um telefone está no formato correto para WhatsApp
 * Formato esperado: +55 DD NNNNNNNNN ou +55 DD NNNNNNNN
 */
export function validarTelefoneWhatsApp(telefone: string): boolean {
  if (!telefone) return false;
  
  // Remove espaços e caracteres especiais
  const cleaned = telefone.replace(/[\s\-\(\)]/g, '');
  
  // Verifica formato +55DDNNNNNNNNN (11 ou 10 dígitos após +55)
  const regex = /^\+55\d{10,11}$/;
  return regex.test(cleaned);
}

/**
 * Valida se um email está em formato válido
 */
export function validarEmail(email: string): boolean {
  if (!email) return false;
  
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

/**
 * Extrai telefones válidos de uma string raw
 * Formato esperado: múltiplos telefones separados por " | "
 */
export function extrairTelefones(telefone_raw?: string): string[] {
  if (!telefone_raw) return [];
  
  return telefone_raw
    .split('|')
    .map(t => t.trim())
    .filter(t => validarTelefoneWhatsApp(t));
}

/**
 * Extrai emails válidos de uma string raw
 * Formato esperado: múltiplos emails separados por " | "
 */
export function extrairEmails(email_raw?: string): string[] {
  if (!email_raw) return [];
  
  return email_raw
    .split('|')
    .map(e => e.trim())
    .filter(e => validarEmail(e));
}

/**
 * Decide qual canal usar para contatar o lead
 * 
 * Lógica de decisão:
 * 1. Prioridade 1: WhatsApp (se houver telefone válido)
 * 2. Prioridade 2: Email (se houver email válido)
 * 3. Prioridade 3: Nenhum canal disponível
 */
export function decidirCanal(lead: Lead): CanalDecision {
  // 1. Tentar WhatsApp primeiro
  let telefonesValidos: string[] = [];
  
  if (lead.telefones && lead.telefones.length > 0) {
    // Se já temos telefones estruturados
    telefonesValidos = lead.telefones
      .filter(t => t.valido_para_disparo)
      .map(t => t.telefone);
  } else if (lead.telefone_raw) {
    // Se temos apenas string raw
    telefonesValidos = extrairTelefones(lead.telefone_raw);
  }
  
  if (telefonesValidos.length > 0) {
    return {
      canal: 'whatsapp',
      motivo: `Lead possui ${telefonesValidos.length} telefone(s) válido(s) para WhatsApp`,
      template: 'cobranca_padrao_whatsapp_v1',
      destino: telefonesValidos[0], // Usar primeiro telefone
      prioridade: 1
    };
  }
  
  // 2. Fallback para Email
  let emailsValidos: string[] = [];
  
  if (lead.emails && lead.emails.length > 0) {
    // Se já temos emails estruturados
    emailsValidos = lead.emails
      .filter(e => e.valido_para_disparo)
      .map(e => e.email);
  } else if (lead.email_raw) {
    // Se temos apenas string raw
    emailsValidos = extrairEmails(lead.email_raw);
  }
  
  if (emailsValidos.length > 0) {
    return {
      canal: 'email',
      motivo: `Lead não possui telefone válido, mas possui ${emailsValidos.length} email(s) válido(s)`,
      template: 'cobranca_padrao_email_v1',
      destino: emailsValidos[0], // Usar primeiro email
      prioridade: 2
    };
  }
  
  // 3. Sem canal disponível
  return {
    canal: 'none',
    motivo: 'Lead não possui telefone nem email válidos para contato',
    prioridade: 3
  };
}

/**
 * Verifica se um disparo seria executado baseado em regras de negócio
 * 
 * Regras que podem bloquear:
 * - Rate limit atingido
 * - Horário fora do comercial
 * - Lead em blacklist
 * - Canal indisponível
 */
export interface DisparoCheck {
  seria_executado: boolean;
  razao_bloqueio?: string;
}

export function verificarSeDisparoSeriaExecutado(
  decision: CanalDecision,
  options: {
    rateLimitAtingido?: boolean;
    horarioComercial?: boolean;
    leadEmBlacklist?: boolean;
  } = {}
): DisparoCheck {
  // Se não há canal, não pode executar
  if (decision.canal === 'none') {
    return {
      seria_executado: false,
      razao_bloqueio: 'Nenhum canal disponível para contato'
    };
  }
  
  // Verificar rate limit
  if (options.rateLimitAtingido) {
    return {
      seria_executado: false,
      razao_bloqueio: 'Rate limit atingido para este tenant/canal'
    };
  }
  
  // Verificar horário comercial
  if (options.horarioComercial === false) {
    return {
      seria_executado: false,
      razao_bloqueio: 'Fora do horário comercial (08:00-18:00)'
    };
  }
  
  // Verificar blacklist
  if (options.leadEmBlacklist) {
    return {
      seria_executado: false,
      razao_bloqueio: 'Lead está em blacklist'
    };
  }
  
  // Tudo OK, disparo seria executado
  return {
    seria_executado: true
  };
}

/**
 * Verifica se está em horário comercial
 * Horário: 08:00 - 18:00, Segunda a Sexta
 */
export function estaEmHorarioComercial(data: Date = new Date()): boolean {
  const hora = data.getHours();
  const diaSemana = data.getDay(); // 0 = Domingo, 6 = Sábado
  
  // Verificar se é dia útil (Segunda a Sexta)
  if (diaSemana === 0 || diaSemana === 6) {
    return false;
  }
  
  // Verificar se está entre 08:00 e 18:00
  return hora >= 8 && hora < 18;
}
