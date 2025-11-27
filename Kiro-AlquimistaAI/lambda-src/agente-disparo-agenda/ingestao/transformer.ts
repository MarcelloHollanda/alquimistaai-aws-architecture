// transformer.ts - Transformações e explosão de contatos
import { LeadRow, Lead, LeadTelefone, LeadEmail } from './types';
import { LeadsValidator } from './validator';

export class LeadsTransformer {
  private validator: LeadsValidator;

  constructor() {
    this.validator = new LeadsValidator();
  }

  /**
   * Transforma LeadRow em Lead + contatos
   */
  transform(
    row: LeadRow,
    nomeArquivo: string
  ): {
    lead: Lead;
    telefones: Omit<LeadTelefone, 'lead_id'>[];
    emails: Omit<LeadEmail, 'lead_id'>[];
  } {
    const lead: Lead = {
      lead_id_externo: `${nomeArquivo}:${row.linha}`,
      origem_arquivo: nomeArquivo,
      origem_aba: 'Leads',
      nome: row.nome,
      contato_nome: row.contato,
      documento: row.documento,
      email_raw: row.email,
      telefone_raw: row.telefone,
      status: 'novo',
      tags: [],
      data_ingestao: new Date(),
    };

    // Explodir telefones
    const telefones = this.explodeTelefones(row.telefone);

    // Explodir emails
    const emails = this.explodeEmails(row.email);

    return { lead, telefones, emails };
  }

  /**
   * Explode string de telefones separados por |
   */
  private explodeTelefones(
    telefoneRaw: string
  ): Omit<LeadTelefone, 'lead_id'>[] {
    if (!telefoneRaw) return [];

    const telefones = telefoneRaw
      .split('|')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    return telefones.map((telefone, index) => ({
      telefone: this.formatTelefone(telefone),
      telefone_principal: index === 0,
      tipo_origem: this.detectTipoTelefone(telefone),
      valido_para_disparo: this.validator.validateTelefoneBR(telefone),
    }));
  }

  /**
   * Formata telefone para padrão +55 DDD NUMERO
   */
  private formatTelefone(telefone: string): string {
    // Se já tem +, manter como está
    if (telefone.startsWith('+')) {
      return telefone;
    }

    const digits = telefone.replace(/\D/g, '');

    // Se tem 10 ou 11 dígitos, é BR
    if (digits.length === 10 || digits.length === 11) {
      const ddd = digits.substring(0, 2);
      const numero = digits.substring(2);
      return `+55 ${ddd} ${numero}`;
    }

    // Caso contrário, retornar como está
    return telefone;
  }

  /**
   * Detecta tipo de telefone (fixo/móvel/internacional)
   */
  private detectTipoTelefone(telefone: string): string {
    if (this.validator.isInternacional(telefone)) {
      return 'internacional';
    }

    const digits = telefone.replace(/\D/g, '');

    if (digits.length === 11) {
      return 'movel';
    } else if (digits.length === 10) {
      return 'fixo';
    }

    return 'desconhecido';
  }

  /**
   * Explode string de emails separados por |
   */
  private explodeEmails(emailRaw: string): Omit<LeadEmail, 'lead_id'>[] {
    if (!emailRaw) return [];

    const emails = emailRaw
      .split('|')
      .map(e => e.trim())
      .filter(e => e.length > 0);

    return emails.map((email, index) => ({
      email: email.toLowerCase(),
      email_principal: index === 0,
      valido_para_disparo: this.validator.validateEmail(email),
    }));
  }
}
