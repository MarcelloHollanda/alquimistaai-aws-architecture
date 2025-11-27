import { SQSEvent, SQSRecord, Context } from 'aws-lambda';
import { EventBridge } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { createAgentLogger } from '../shared/logger';
import { query, transaction } from '../shared/database';
import {
  CalendarMCPServer,
  createCalendarMCPServer,
  GetAvailabilityParams,
  CreateEventParams,
} from '../../mcp-integrations/servers/calendar';
import {
  WhatsAppMCPServer,
  createWhatsAppMCPServer,
} from '../../mcp-integrations/servers/whatsapp';

const logger = createAgentLogger('agendamento');
const eventBridge = new EventBridge();
const calendarMCP = createCalendarMCPServer();
const whatsappMCP = createWhatsAppMCPServer();

const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || 'fibonacci-bus';

/**
 * Lead interface
 */
interface Lead {
  id: string;
  tenant_id: string;
  empresa: string;
  contato: string;
  telefone?: string;
  email?: string;
  status: string;
  metadata: any;
}

/**
 * Agendamento request from event
 */
interface AgendamentoRequest {
  leadId: string;
  tenantId: string;
  calendarId: string;
  duration?: number; // minutes, default 60
  preferredDates?: string[]; // ISO-8601 dates
  context?: {
    source: string;
    lastMessage: string;
    history: any[];
  };
}

/**
 * Agendamento confirmation
 */
interface AgendamentoConfirmation {
  leadId: string;
  selectedSlot: string; // ISO-8601 datetime
}

/**
 * Agente de Agendamento - Marca reuniões verificando disponibilidade em tempo real
 * 
 * Process Flow:
 * 1. Recebe solicitação de agendamento via EventBridge
 * 2. Consulta disponibilidade via MCP calendar.getAvailability()
 * 3. Propõe 3 horários ao lead via WhatsApp
 * 4. Aguarda confirmação do lead
 * 5. Cria evento no calendário via MCP calendar.createEvent()
 * 6. Envia confirmação por email/WhatsApp
 * 7. Gera briefing comercial com histórico completo
 * 8. Publica evento nigredo.agendamento.confirmed
 * 
 * Requirements: 11.8, 11.10
 */

/**
 * Main handler for Agente de Agendamento
 */
export async function handler(event: SQSEvent, context: Context): Promise<void> {
  logger.info('Agente de Agendamento invoked', {
    recordCount: event.Records.length,
    requestId: context.awsRequestId,
  });

  for (const record of event.Records) {
    const traceId = uuidv4();
    logger.setTraceId(traceId);

    try {
      await processAgendamentoRequest(record, traceId);
    } catch (error) {
      logger.error('Failed to process agendamento request', error as Error, {
        traceId,
        messageId: record.messageId,
      });
      // Re-throw to send to DLQ after retries
      throw error;
    }
  }
}

/**
 * Process a single agendamento request
 */
async function processAgendamentoRequest(
  record: SQSRecord,
  traceId: string
): Promise<void> {
  const startTime = Date.now();

  logger.info('Processing agendamento request', {
    traceId,
    messageId: record.messageId,
  });

  // Parse message body
  const message = JSON.parse(record.body);
  const detail = message.detail || message;

  // Check if this is a schedule request or confirmation
  if (detail.type === 'schedule_request') {
    await handleScheduleRequest(detail as AgendamentoRequest, traceId);
  } else if (detail.type === 'schedule_confirmation') {
    await handleScheduleConfirmation(detail as AgendamentoConfirmation, traceId);
  } else {
    logger.warn('Unknown agendamento message type', {
      traceId,
      type: detail.type,
    });
    return;
  }

  const duration = Date.now() - startTime;
  logger.info('Agendamento request processed successfully', {
    traceId,
    duration,
  });
}

/**
 * Handle schedule request - propose available slots
 */
async function handleScheduleRequest(
  request: AgendamentoRequest,
  traceId: string
): Promise<void> {
  // Update logger context with lead and tenant information
  logger.updateContext({ 
    leadId: request.leadId,
    tenantId: request.tenantId 
  });

  logger.info('Handling schedule request');

  // 1. Fetch lead from database
  const lead = await fetchLead(request.leadId, traceId);

  if (!lead) {
    throw new Error(`Lead not found: ${request.leadId}`);
  }

  // 2. Consultar disponibilidade via MCP calendar
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const nextWeek = new Date(tomorrow);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const availabilityParams: GetAvailabilityParams = {
    calendarId: request.calendarId,
    startDate: tomorrow.toISOString().split('T')[0],
    endDate: nextWeek.toISOString().split('T')[0],
    duration: request.duration || 60,
    workingHours: {
      start: '09:00',
      end: '18:00',
    },
    workingDays: [1, 2, 3, 4, 5], // Mon-Fri
  };

  logger.info('Fetching calendar availability', {
    traceId,
    leadId: lead.id,
    calendarId: request.calendarId,
  });

  const availability = await calendarMCP.getAvailability(availabilityParams);

  if (availability.availableSlots.length === 0) {
    logger.warn('No available slots found', {
      traceId,
      leadId: lead.id,
    });

    // Notify lead that no slots are available
    await sendNoSlotsMessage(lead, traceId);
    return;
  }

  // 3. Propor 3 horários ao lead
  const proposedSlots = availability.availableSlots.slice(0, 3);

  logger.info('Proposing slots to lead', {
    traceId,
    leadId: lead.id,
    slotCount: proposedSlots.length,
  });

  await proposeSlots(lead, proposedSlots, request.tenantId, traceId);

  // 4. Save proposed slots to database for later confirmation
  await saveProposedSlots(lead.id, request.tenantId, proposedSlots, request.calendarId, traceId);

  logger.info('Schedule request handled successfully', {
    traceId,
    leadId: lead.id,
    proposedSlots: proposedSlots.length,
  });
}

/**
 * Handle schedule confirmation - create calendar event
 */
async function handleScheduleConfirmation(
  confirmation: AgendamentoConfirmation,
  traceId: string
): Promise<void> {
  logger.info('Handling schedule confirmation', {
    traceId,
    leadId: confirmation.leadId,
    selectedSlot: confirmation.selectedSlot,
  });

  // 1. Fetch lead and proposed slots from database
  const lead = await fetchLead(confirmation.leadId, traceId);

  if (!lead) {
    throw new Error(`Lead not found: ${confirmation.leadId}`);
  }

  const agendamento = await fetchPendingAgendamento(confirmation.leadId, traceId);

  if (!agendamento) {
    throw new Error(`No pending agendamento found for lead: ${confirmation.leadId}`);
  }

  // 2. Criar evento no calendário via MCP
  const selectedSlot = new Date(confirmation.selectedSlot);
  const duration = agendamento.duration || 60;

  const createEventParams: CreateEventParams = {
    calendarId: agendamento.calendar_id,
    summary: `Reunião - ${lead.empresa}`,
    description: await generateBriefing(lead, traceId),
    start: selectedSlot.toISOString(),
    duration,
    attendees: [
      {
        email: lead.email!,
        displayName: lead.contato,
      },
    ],
    conferenceData: {
      createRequest: {
        requestId: uuidv4(),
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  };

  logger.info('Creating calendar event', {
    traceId,
    leadId: lead.id,
    start: selectedSlot.toISOString(),
  });

  const calendarEvent = await calendarMCP.createEvent(createEventParams);

  // 3. Salvar agendamento confirmado no banco
  await saveConfirmedAgendamento(
    lead.id,
    lead.tenant_id,
    selectedSlot,
    duration,
    calendarEvent.eventId,
    createEventParams.description!,
    traceId
  );

  // 4. Enviar confirmação por WhatsApp/Email
  await sendConfirmation(lead, selectedSlot, calendarEvent.htmlLink, calendarEvent.hangoutLink, traceId);

  // 5. Atualizar status do lead
  await updateLeadStatus(lead.id, 'agendado', traceId);

  // 6. Publicar evento nigredo.agendamento.confirmed
  await publishAgendamentoConfirmed(lead, selectedSlot, calendarEvent.eventId, traceId);

  logger.info('Schedule confirmation handled successfully', {
    traceId,
    leadId: lead.id,
    eventId: calendarEvent.eventId,
  });
}

/**
 * Fetch lead from database
 */
async function fetchLead(leadId: string, traceId: string): Promise<Lead | null> {
  const result = await query<Lead>(
    `SELECT * FROM nigredo_leads.leads WHERE id = $1`,
    [leadId]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Propose available slots to lead via WhatsApp
 */
async function proposeSlots(
  lead: Lead,
  slots: any[],
  tenantId: string,
  traceId: string
): Promise<void> {
  if (!lead.telefone) {
    logger.warn('Lead has no phone number, cannot send WhatsApp', {
      traceId,
      leadId: lead.id,
    });
    return;
  }

  // Format slots for message
  const slotsText = slots
    .map((slot, index) => {
      const date = new Date(slot.start);
      const dateStr = date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const timeStr = date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${index + 1}. ${dateStr} às ${timeStr}`;
    })
    .join('\n');

  const message = `Olá ${lead.contato}! 👋

Ótimo! Vamos agendar nossa reunião. Tenho os seguintes horários disponíveis:

${slotsText}

Por favor, responda com o número da opção que melhor se encaixa na sua agenda.`;

  await whatsappMCP.sendMessage({
    to: lead.telefone,
    message,
    idempotencyKey: `${lead.id}-propose-slots-${traceId}`,
  });

  logger.info('Proposed slots sent to lead', {
    traceId,
    leadId: lead.id,
    slotCount: slots.length,
  });
}

/**
 * Send message when no slots are available
 */
async function sendNoSlotsMessage(lead: Lead, traceId: string): Promise<void> {
  if (!lead.telefone) {
    return;
  }

  const message = `Olá ${lead.contato}! 👋

Infelizmente não temos horários disponíveis nos próximos dias. Nossa equipe entrará em contato em breve para encontrar um horário que funcione para ambos.

Obrigado pela compreensão!`;

  await whatsappMCP.sendMessage({
    to: lead.telefone,
    message,
    idempotencyKey: `${lead.id}-no-slots-${traceId}`,
  });
}

/**
 * Save proposed slots to database
 */
async function saveProposedSlots(
  leadId: string,
  tenantId: string,
  slots: any[],
  calendarId: string,
  traceId: string
): Promise<void> {
  await query(
    `INSERT INTO nigredo_leads.agendamentos 
     (id, lead_id, tenant_id, status, calendar_event_id, briefing, created_at, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)`,
    [
      uuidv4(),
      leadId,
      tenantId,
      'proposto',
      null,
      null,
      JSON.stringify({
        proposed_slots: slots,
        calendar_id: calendarId,
        trace_id: traceId,
      }),
    ]
  );

  logger.info('Proposed slots saved to database', {
    traceId,
    leadId,
    slotCount: slots.length,
  });
}

/**
 * Fetch pending agendamento from database
 */
async function fetchPendingAgendamento(
  leadId: string,
  traceId: string
): Promise<any | null> {
  const result = await query(
    `SELECT * FROM nigredo_leads.agendamentos 
     WHERE lead_id = $1 AND status = 'proposto' 
     ORDER BY created_at DESC LIMIT 1`,
    [leadId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    ...row,
    proposed_slots: row.metadata?.proposed_slots || [],
    calendar_id: row.metadata?.calendar_id,
    duration: row.duracao || 60,
  };
}

/**
 * Generate briefing with lead history
 */
async function generateBriefing(lead: Lead, traceId: string): Promise<string> {
  // Fetch interaction history
  const interactions = await query(
    `SELECT tipo, canal, mensagem, sentimento, intensidade, created_at
     FROM nigredo_leads.interacoes
     WHERE lead_id = $1
     ORDER BY created_at DESC
     LIMIT 10`,
    [lead.id]
  );

  // Build briefing
  let briefing = `# Briefing Comercial - ${lead.empresa}\n\n`;
  briefing += `**Contato:** ${lead.contato}\n`;
  briefing += `**Email:** ${lead.email || 'N/A'}\n`;
  briefing += `**Telefone:** ${lead.telefone || 'N/A'}\n`;
  briefing += `**Setor:** ${lead.metadata?.setor || 'N/A'}\n`;
  briefing += `**Porte:** ${lead.metadata?.porte || 'N/A'}\n\n`;

  briefing += `## Histórico de Interações\n\n`;

  if (interactions.rows.length > 0) {
    for (const interaction of interactions.rows) {
      const date = new Date(interaction.created_at).toLocaleDateString('pt-BR');
      const sentiment = interaction.sentimento
        ? ` [${interaction.sentimento}${interaction.intensidade ? ` ${interaction.intensidade}%` : ''}]`
        : '';

      briefing += `- **${date}** (${interaction.canal})${sentiment}: ${interaction.mensagem.substring(0, 100)}...\n`;
    }
  } else {
    briefing += `Nenhuma interação registrada.\n`;
  }

  briefing += `\n## Classificações e Insights\n\n`;
  briefing += `- **Status:** ${lead.status}\n`;
  briefing += `- **Prioridade:** ${lead.metadata?.priority || 'N/A'}\n`;
  briefing += `- **Necessidade Autêntica:** ${lead.metadata?.authentic_need ? 'Sim' : 'Não'}\n`;

  if (lead.metadata?.objections && lead.metadata.objections.length > 0) {
    briefing += `\n## Objeções Identificadas\n\n`;
    for (const objection of lead.metadata.objections) {
      briefing += `- ${objection}\n`;
    }
  }

  briefing += `\n---\n`;
  briefing += `*Briefing gerado automaticamente pelo Agente de Agendamento*\n`;
  briefing += `*Trace ID: ${traceId}*\n`;

  return briefing;
}

/**
 * Save confirmed agendamento to database
 */
async function saveConfirmedAgendamento(
  leadId: string,
  tenantId: string,
  dataHora: Date,
  duracao: number,
  calendarEventId: string,
  briefing: string,
  traceId: string
): Promise<void> {
  // Update existing agendamento or create new one
  await query(
    `UPDATE nigredo_leads.agendamentos
     SET status = 'confirmado',
         data_hora = $1,
         duracao = $2,
         calendar_event_id = $3,
         briefing = $4,
         metadata = jsonb_set(metadata, '{trace_id}', $5::jsonb)
     WHERE lead_id = $6 AND status = 'proposto'`,
    [dataHora, duracao, calendarEventId, briefing, JSON.stringify(traceId), leadId]
  );

  logger.info('Confirmed agendamento saved to database', {
    traceId,
    leadId,
    calendarEventId,
  });
}

/**
 * Send confirmation message to lead
 */
async function sendConfirmation(
  lead: Lead,
  dataHora: Date,
  htmlLink: string,
  hangoutLink: string | undefined,
  traceId: string
): Promise<void> {
  if (!lead.telefone) {
    logger.warn('Lead has no phone number, cannot send confirmation', {
      traceId,
      leadId: lead.id,
    });
    return;
  }

  const dateStr = dataHora.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = dataHora.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  let message = `Olá ${lead.contato}! ✅

Sua reunião está confirmada para:
📅 ${dateStr}
🕐 ${timeStr}

`;

  if (hangoutLink) {
    message += `🔗 Link da reunião: ${hangoutLink}\n\n`;
  }

  message += `Você também receberá um convite por email com todos os detalhes.

Estamos ansiosos para conversar com você!`;

  await whatsappMCP.sendMessage({
    to: lead.telefone,
    message,
    idempotencyKey: `${lead.id}-confirmation-${traceId}`,
  });

  logger.info('Confirmation sent to lead', {
    traceId,
    leadId: lead.id,
  });
}

/**
 * Update lead status
 */
async function updateLeadStatus(
  leadId: string,
  status: string,
  traceId: string
): Promise<void> {
  await query(
    `UPDATE nigredo_leads.leads
     SET status = $1, updated_at = NOW()
     WHERE id = $2`,
    [status, leadId]
  );

  logger.info('Lead status updated', {
    traceId,
    leadId,
    status,
  });
}

/**
 * Publish nigredo.agendamento.confirmed event
 */
async function publishAgendamentoConfirmed(
  lead: Lead,
  dataHora: Date,
  eventId: string,
  traceId: string
): Promise<void> {
  const event = {
    Source: 'nigredo.agendamento',
    DetailType: 'agendamento.confirmed',
    Detail: JSON.stringify({
      leadId: lead.id,
      tenantId: lead.tenant_id,
      empresa: lead.empresa,
      contato: lead.contato,
      dataHora: dataHora.toISOString(),
      calendarEventId: eventId,
      traceId,
      timestamp: new Date().toISOString(),
    }),
    EventBusName: EVENT_BUS_NAME,
  };

  await eventBridge.putEvents({ Entries: [event] }).promise();

  logger.info('Published nigredo.agendamento.confirmed event', {
    traceId,
    leadId: lead.id,
    eventId,
  });
}
