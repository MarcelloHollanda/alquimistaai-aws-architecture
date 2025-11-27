// loader.ts - Inserção de dados no Aurora PostgreSQL
import { Pool } from 'pg';
import { Lead, LeadTelefone, LeadEmail } from './types';

export class LeadsLoader {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Insere lead e seus contatos no banco
   */
  async insertLead(
    lead: Lead,
    telefones: Omit<LeadTelefone, 'lead_id'>[],
    emails: Omit<LeadEmail, 'lead_id'>[]
  ): Promise<string> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Inserir lead (com upsert)
      const leadResult = await client.query(
        `INSERT INTO leads (
          lead_id_externo, origem_arquivo, origem_aba,
          nome, contato_nome, documento,
          email_raw, telefone_raw,
          status, tags, data_ingestao
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (lead_id_externo) DO UPDATE
        SET 
          nome = EXCLUDED.nome,
          contato_nome = EXCLUDED.contato_nome,
          documento = EXCLUDED.documento,
          email_raw = EXCLUDED.email_raw,
          telefone_raw = EXCLUDED.telefone_raw,
          updated_at = NOW()
        RETURNING lead_id`,
        [
          lead.lead_id_externo,
          lead.origem_arquivo,
          lead.origem_aba,
          lead.nome,
          lead.contato_nome,
          lead.documento,
          lead.email_raw,
          lead.telefone_raw,
          lead.status,
          JSON.stringify(lead.tags),
          lead.data_ingestao,
        ]
      );

      const leadId = leadResult.rows[0].lead_id;

      // 2. Deletar telefones antigos (se for reprocessamento)
      await client.query(
        'DELETE FROM lead_telefones WHERE lead_id = $1',
        [leadId]
      );

      // 3. Inserir telefones
      for (const telefone of telefones) {
        await client.query(
          `INSERT INTO lead_telefones (
            lead_id, telefone, telefone_principal,
            tipo_origem, valido_para_disparo
          ) VALUES ($1, $2, $3, $4, $5)`,
          [
            leadId,
            telefone.telefone,
            telefone.telefone_principal,
            telefone.tipo_origem,
            telefone.valido_para_disparo,
          ]
        );
      }

      // 4. Deletar emails antigos (se for reprocessamento)
      await client.query(
        'DELETE FROM lead_emails WHERE lead_id = $1',
        [leadId]
      );

      // 5. Inserir emails
      for (const email of emails) {
        await client.query(
          `INSERT INTO lead_emails (
            lead_id, email, email_principal, valido_para_disparo
          ) VALUES ($1, $2, $3, $4)`,
          [leadId, email.email, email.email_principal, email.valido_para_disparo]
        );
      }

      await client.query('COMMIT');

      return leadId;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Busca estatísticas de ingestão
   */
  async getStats(): Promise<{
    total_leads: number;
    total_telefones: number;
    total_emails: number;
  }> {
    const result = await this.pool.query(`
      SELECT
        (SELECT COUNT(*) FROM leads) as total_leads,
        (SELECT COUNT(*) FROM lead_telefones) as total_telefones,
        (SELECT COUNT(*) FROM lead_emails) as total_emails
    `);

    return result.rows[0];
  }
}
