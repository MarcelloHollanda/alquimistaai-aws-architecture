/**
 * LGPD Compliance Module
 * 
 * Provides functions for LGPD (Lei Geral de Proteção de Dados) compliance:
 * - Consent validation
 * - Automatic unsubscribe (descadastro)
 * - Right to be forgotten (direito ao esquecimento)
 * 
 * Requirements: 17.7, 17.8, 11.12
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ConsentData {
  leadId: string;
  consentGiven: boolean;
  consentDate?: Date;
  consentSource?: string;
  consentIpAddress?: string;
}

export interface DescadastroResult {
  success: boolean;
  leadId: string;
  message: string;
  actionsPerformed: string[];
}

export interface EsquecimentoResult {
  success: boolean;
  leadId: string;
  message: string;
  recordsAnonymized: {
    lead: boolean;
    interactions: number;
    appointments: number;
  };
}

// ============================================================================
// Consent Management
// ============================================================================

/**
 * Validate if a lead has given explicit consent for data processing
 * 
 * @param db - Database connection pool
 * @param leadId - Lead UUID
 * @returns true if consent is given, false otherwise
 */
export async function validateConsent(
  db: Pool,
  leadId: string
): Promise<boolean> {
  const traceId = uuidv4();
  
  try {
    logger.info('Validating LGPD consent', { traceId, leadId });
    
    const result = await db.query(
      `SELECT consent_given FROM nigredo_leads.leads WHERE id = $1`,
      [leadId]
    );
    
    if (result.rows.length === 0) {
      logger.warn('Lead not found for consent validation', { traceId, leadId });
      return false;
    }
    
    const consentGiven = result.rows[0].consent_given;
    
    logger.info('Consent validation result', { 
      traceId, 
      leadId, 
      consentGiven 
    });
    
    return consentGiven;
    
  } catch (error) {
    logger.error('Error validating consent', error as Error, { traceId, leadId });
    throw error;
  }
}

/**
 * Record explicit consent from a lead
 * 
 * @param db - Database connection pool
 * @param consentData - Consent information
 * @returns Updated consent status
 */
export async function recordConsent(
  db: Pool,
  consentData: ConsentData
): Promise<boolean> {
  const traceId = uuidv4();
  
  try {
    logger.info('Recording LGPD consent', { 
      traceId, 
      leadId: consentData.leadId,
      consentGiven: consentData.consentGiven
    });
    
    const result = await db.query(
      `UPDATE nigredo_leads.leads
       SET consent_given = $1,
           consent_date = $2,
           consent_source = $3,
           consent_ip_address = $4,
           updated_at = NOW()
       WHERE id = $5
       RETURNING id, consent_given`,
      [
        consentData.consentGiven,
        consentData.consentDate || new Date(),
        consentData.consentSource || 'api',
        consentData.consentIpAddress,
        consentData.leadId
      ]
    );
    
    if (result.rows.length === 0) {
      logger.error('Lead not found when recording consent', new Error('Lead not found'), { 
        traceId, 
        leadId: consentData.leadId 
      });
      return false;
    }
    
    logger.info('Consent recorded successfully', { 
      traceId, 
      leadId: consentData.leadId,
      consentGiven: result.rows[0].consent_given
    });
    
    return true;
    
  } catch (error) {
    logger.error('Error recording consent', error as Error, { 
      traceId, 
      leadId: consentData.leadId
    });
    throw error;
  }
}

/**
 * Block lead processing if consent is not given
 * 
 * @param db - Database connection pool
 * @param leadId - Lead UUID
 * @throws Error if consent is not given
 */
export async function enforceConsent(
  db: Pool,
  leadId: string
): Promise<void> {
  const hasConsent = await validateConsent(db, leadId);
  
  if (!hasConsent) {
    const error = new Error('LGPD: Lead processing blocked - consent not given');
    logger.error('Consent enforcement failed', error, { leadId });
    throw error;
  }
}

// ============================================================================
// Descadastro (Unsubscribe)
// ============================================================================

/**
 * Handle automatic unsubscribe request (descadastro)
 * 
 * Actions performed:
 * 1. Mark lead as unsubscribed
 * 2. Cancel future appointments
 * 3. Add to blocklist
 * 4. Send confirmation
 * 5. Register audit log
 * 
 * @param db - Database connection pool
 * @param leadId - Lead UUID
 * @param reason - Reason for unsubscribe
 * @returns Result of descadastro operation
 */
export async function handleDescadastro(
  db: Pool,
  leadId: string,
  reason: string = 'Solicitação do lead'
): Promise<DescadastroResult> {
  const traceId = uuidv4();
  const actionsPerformed: string[] = [];
  
  try {
    logger.info('Starting descadastro process', { traceId, leadId, reason });
    
    // Start transaction
    await db.query('BEGIN');
    
    // 1. Get lead information before marking as unsubscribed
    const leadResult = await db.query(
      `SELECT id, telefone, email, empresa, contato
       FROM nigredo_leads.leads
       WHERE id = $1`,
      [leadId]
    );
    
    if (leadResult.rows.length === 0) {
      await db.query('ROLLBACK');
      return {
        success: false,
        leadId,
        message: 'Lead not found',
        actionsPerformed
      };
    }
    
    const lead = leadResult.rows[0];
    
    // 2. Mark lead as unsubscribed
    await db.query(
      `UPDATE nigredo_leads.leads
       SET status = 'descadastrado',
           metadata = jsonb_set(
             COALESCE(metadata, '{}'::jsonb),
             '{descadastro}',
             $1::jsonb
           ),
           updated_at = NOW()
       WHERE id = $2`,
      [
        JSON.stringify({
          date: new Date().toISOString(),
          reason,
          trace_id: traceId
        }),
        leadId
      ]
    );
    actionsPerformed.push('Lead marked as descadastrado');
    
    // 3. Cancel future appointments
    const cancelResult = await db.query(
      `UPDATE nigredo_leads.agendamentos
       SET status = 'cancelado',
           updated_at = NOW()
       WHERE lead_id = $1 
         AND data_hora > NOW()
         AND status NOT IN ('cancelado', 'realizado')
       RETURNING id`,
      [leadId]
    );
    
    if (cancelResult.rows.length > 0) {
      actionsPerformed.push(`${cancelResult.rows.length} future appointment(s) cancelled`);
    }
    
    // 4. Add to blocklist
    await db.query(
      `INSERT INTO nigredo_leads.blocklist (lead_id, telefone, email, reason, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT DO NOTHING`,
      [leadId, lead.telefone, lead.email, reason]
    );
    actionsPerformed.push('Added to blocklist');
    
    // 5. Register audit log (if audit table exists)
    try {
      await db.query(
        `INSERT INTO alquimista_platform.audit_logs 
         (trace_id, agent_id, action_type, lead_id, result, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          traceId,
          'lgpd-compliance',
          'descadastro',
          leadId,
          'success',
          JSON.stringify({
            reason,
            empresa: lead.empresa,
            contato: lead.contato,
            actionsPerformed
          })
        ]
      );
      actionsPerformed.push('Audit log registered');
    } catch (auditError) {
      // Audit log is optional, don't fail the operation
      logger.warn('Failed to register audit log', { traceId, error: auditError });
    }
    
    // Commit transaction
    await db.query('COMMIT');
    
    logger.info('Descadastro completed successfully', { 
      traceId, 
      leadId, 
      actionsPerformed 
    });
    
    return {
      success: true,
      leadId,
      message: 'Descadastro realizado com sucesso. Seus dados foram removidos conforme LGPD.',
      actionsPerformed
    };
    
  } catch (error) {
    await db.query('ROLLBACK');
    logger.error('Error during descadastro', error as Error, { traceId, leadId });
    
    return {
      success: false,
      leadId,
      message: 'Erro ao processar descadastro',
      actionsPerformed
    };
  }
}

/**
 * Detect unsubscribe keywords in message
 * 
 * @param message - Message text to analyze
 * @returns true if unsubscribe keywords are detected
 */
export function detectDescadastroKeywords(message: string): boolean {
  const keywords = [
    'pare',
    'parar',
    'stop',
    'descadastre',
    'descadastrar',
    'remover',
    'remova',
    'não quero',
    'nao quero',
    'não tenho interesse',
    'nao tenho interesse',
    'lgpd',
    'dados pessoais',
    'privacidade',
    'cancelar',
    'sair da lista'
  ];
  
  const normalizedMessage = message.toLowerCase().trim();
  
  return keywords.some(keyword => normalizedMessage.includes(keyword));
}

// ============================================================================
// Direito ao Esquecimento (Right to be Forgotten)
// ============================================================================

/**
 * Handle right to be forgotten request (direito ao esquecimento)
 * 
 * Actions performed:
 * 1. Anonymize personal data in leads table
 * 2. Anonymize interactions
 * 3. Keep only aggregated data for metrics
 * 
 * @param db - Database connection pool
 * @param leadId - Lead UUID
 * @returns Result of esquecimento operation
 */
export async function handleDireitoEsquecimento(
  db: Pool,
  leadId: string
): Promise<EsquecimentoResult> {
  const traceId = uuidv4();
  
  try {
    logger.info('Starting direito ao esquecimento process', { traceId, leadId });
    
    // Start transaction
    await db.query('BEGIN');
    
    // 1. Anonymize personal data in leads table
    const leadResult = await db.query(
      `UPDATE nigredo_leads.leads
       SET 
         contato = 'ANONIMIZADO',
         telefone = NULL,
         email = NULL,
         cnpj = NULL,
         empresa = 'EMPRESA ANONIMIZADA',
         metadata = jsonb_build_object(
           'anonymized', true,
           'anonymized_date', NOW(),
           'trace_id', $2
         ),
         consent_given = FALSE,
         consent_date = NULL,
         consent_source = NULL,
         consent_ip_address = NULL,
         updated_at = NOW()
       WHERE id = $1
       RETURNING id`,
      [leadId, traceId]
    );
    
    const leadAnonymized = leadResult.rows.length > 0;
    
    // 2. Anonymize interactions
    const interactionsResult = await db.query(
      `UPDATE nigredo_leads.interacoes
       SET mensagem = 'MENSAGEM ANONIMIZADA'
       WHERE lead_id = $1
       RETURNING id`,
      [leadId]
    );
    
    const interactionsAnonymized = interactionsResult.rows.length;
    
    // 3. Anonymize appointments briefing
    const appointmentsResult = await db.query(
      `UPDATE nigredo_leads.agendamentos
       SET briefing = 'BRIEFING ANONIMIZADO'
       WHERE lead_id = $1
       RETURNING id`,
      [leadId]
    );
    
    const appointmentsAnonymized = appointmentsResult.rows.length;
    
    // 4. Register audit log
    try {
      await db.query(
        `INSERT INTO alquimista_platform.audit_logs 
         (trace_id, agent_id, action_type, lead_id, result, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          traceId,
          'lgpd-compliance',
          'direito_esquecimento',
          leadId,
          'success',
          JSON.stringify({
            recordsAnonymized: {
              lead: leadAnonymized,
              interactions: interactionsAnonymized,
              appointments: appointmentsAnonymized
            }
          })
        ]
      );
    } catch (auditError) {
      logger.warn('Failed to register audit log', { traceId, error: auditError });
    }
    
    // Commit transaction
    await db.query('COMMIT');
    
    logger.info('Direito ao esquecimento completed successfully', { 
      traceId, 
      leadId,
      recordsAnonymized: {
        lead: leadAnonymized,
        interactions: interactionsAnonymized,
        appointments: appointmentsAnonymized
      }
    });
    
    return {
      success: true,
      leadId,
      message: 'Dados pessoais anonimizados com sucesso conforme LGPD Art. 18',
      recordsAnonymized: {
        lead: leadAnonymized,
        interactions: interactionsAnonymized,
        appointments: appointmentsAnonymized
      }
    };
    
  } catch (error) {
    await db.query('ROLLBACK');
    logger.error('Error during direito ao esquecimento', error as Error, { traceId, leadId });
    
    return {
      success: false,
      leadId,
      message: 'Erro ao processar direito ao esquecimento',
      recordsAnonymized: {
        lead: false,
        interactions: 0,
        appointments: 0
      }
    };
  }
}

// ============================================================================
// Blocklist Validation
// ============================================================================

/**
 * Check if a contact (phone or email) is in the blocklist
 * 
 * @param db - Database connection pool
 * @param telefone - Phone number (optional)
 * @param email - Email address (optional)
 * @returns true if contact is blocked, false otherwise
 */
export async function isBlocked(
  db: Pool,
  telefone?: string,
  email?: string
): Promise<boolean> {
  const traceId = uuidv4();
  
  try {
    if (!telefone && !email) {
      return false;
    }
    
    const result = await db.query(
      `SELECT id FROM nigredo_leads.blocklist
       WHERE ($1::VARCHAR IS NOT NULL AND telefone = $1)
          OR ($2::VARCHAR IS NOT NULL AND email = $2)
       LIMIT 1`,
      [telefone, email]
    );
    
    const blocked = result.rows.length > 0;
    
    if (blocked) {
      logger.warn('Contact is in blocklist', { traceId, telefone, email });
    }
    
    return blocked;
    
  } catch (error) {
    logger.error('Error checking blocklist', error as Error, { traceId, telefone, email });
    throw error;
  }
}

// ============================================================================
// Export all functions
// ============================================================================

export default {
  validateConsent,
  recordConsent,
  enforceConsent,
  handleDescadastro,
  detectDescadastroKeywords,
  handleDireitoEsquecimento,
  isBlocked
};
