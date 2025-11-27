/**
 * Lambda: Send Reminders (SKELETON)
 * 
 * Responsabilidade: Enviar lembretes automáticos antes das reuniões.
 * - 24h antes: lembrete ao lead
 * - 1h antes: lembrete ao lead e vendedor
 * 
 * Requisitos: RF-008
 * Estimativa: 1-2h
 * Status: SKELETON - Implementação completa pendente
 */

import { EventBridgeEvent } from 'aws-lambda';
import { createLogger } from '../utils/logger';

const logger = createLogger({ service: 'send-reminders' });

interface ReminderEvent {
  meetingId: string;
  leadId: string;
  tenantId: string;
  scheduledAt: string;
  reminderType: '24h' | '1h';
}

/**
 * Handler principal da Lambda
 * 
 * TODO: Implementar lógica completa de lembretes
 * - Buscar dados da reunião
 * - Buscar dados do lead e vendedor
 * - Enviar lembrete ao lead via WhatsApp (24h e 1h antes)
 * - Enviar lembrete ao vendedor via Email (1h antes)
 * - Registrar envio de lembrete
 * - Publicar evento ReminderSentEvent
 */
export const handler = async (
  event: EventBridgeEvent<'Send Reminder', ReminderEvent>
): Promise<void> => {
  logger.info('SKELETON: Send Reminders handler chamado', {
    meetingId: event.detail.meetingId,
    reminderType: event.detail.reminderType,
  });

  // TODO: Implementar lógica completa
  throw new Error('Send Reminders: Implementação pendente');
};
