import { EventBridgeEvent, Context } from 'aws-lambda';
import { createLogger } from '../utils/logger';
import { docClient as dynamoClient } from '../utils/aws-clients';
import { mcpClient } from '../utils/mcp-client';
import { s3Helper } from '../utils/s3-helper';
import { validateMeetingRequest, getErrorMessage, getErrorStack } from '../utils/validation';

const logger = createLogger({ service: 'schedule-meeting' });
import { 
  MeetingScheduleEvent, 
  Contact, 
  MeetingRequest, 
  TABLE_NAMES,
  MeetingStatus
} from '../types/common';
import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

/**
 * Lambda: Schedule Meeting
 * 
 * Responsável por:
 * - Processar solicitações de agendamento de reuniões
 * - Consultar disponibilidade via Google Calendar
 * - Criar evento no calendário
 * - Gerar briefing automático para o vendedor
 * - Enviar confirmação para o contato
 * - Configurar lembretes automáticos
 */

export const handler = async (
  event: EventBridgeEvent<'Schedule Requested', MeetingScheduleEvent>,
  context: Context
): Promise<void> => {
  const requestId = context.awsRequestId;
  const startTime = Date.now();

  logger.info('Iniciando agendamento de reunião', {
    requestId,
    contactId: event.detail.contactId,
    meetingType: event.detail.type,
    scheduledAt: event.detail.scheduledAt
  });

  try {
    // Valida dados do evento
    const validation = validateMeetingRequest(event.detail);
    if (!validation.isValid) {
      throw new Error(`Dados de agendamento inválidos: ${validation.errors.join(', ')}`);
    }

    // Busca contato
    const contact = await getContact(event.detail.contactId, requestId);
    if (!contact) {
      throw new Error(`Contato não encontrado: ${event.detail.contactId}`);
    }

    // Cria reunião no calendário
    const calendarEvent = await createCalendarEvent(contact, event.detail, requestId);

    // Salva reunião no DynamoDB
    const meeting = await saveMeeting(contact, event.detail, calendarEvent, requestId);

    // Gera briefing automático (se solicitado)
    if (event.detail.generateBriefing !== false) {
      await generateAndSaveBriefing(contact, meeting, requestId);
    }

    // Envia confirmação para o contato
    await sendMeetingConfirmation(contact, meeting, requestId);

    // Configura lembretes
    await setupReminders(meeting, requestId);

    // Atualiza status do contato
    await updateContactStatus(contact.id, 'meeting_scheduled', requestId);

    const duration = Date.now() - startTime;

    logger.info('Reunião agendada com sucesso', {
      requestId,
      contactId: contact.id,
      meetingId: meeting.id,
      scheduledAt: meeting.scheduledAt,
      duration
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Erro ao agendar reunião', {
      requestId,
      contactId: event.detail.contactId,
      error: getErrorMessage(error),
      stack: getErrorStack(error),
      duration
    });

    throw error;
  }
};

/**
 * Busca contato do DynamoDB
 */
async function getContact(contactId: string, requestId: string): Promise<Contact | null> {
  const tableName = TABLE_NAMES.CONTACTS;
  
  const command = new GetCommand({
    TableName: tableName,
    Key: { id: contactId }
  });

  const response = await dynamoClient.send(command);
  
  if (!response.Item) {
    logger.warn('Contato não encontrado', { requestId, contactId });
    return null;
  }

  return response.Item as Contact;
}

/**
 * Cria evento no Google Calendar
 */
async function createCalendarEvent(
  contact: Contact,
  scheduleEvent: MeetingScheduleEvent,
  requestId: string
): Promise<any> {
  const calendarEndpoint = process.env.MCP_CALENDAR_ENDPOINT;
  if (!calendarEndpoint) {
    throw new Error('MCP_CALENDAR_ENDPOINT não configurado');
  }

  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

  logger.info('Criando evento no calendário', {
    requestId,
    contactId: contact.id,
    scheduledAt: scheduleEvent.scheduledAt,
    duration: scheduleEvent.duration
  });

  // Calcula data/hora de término
  const startDate = new Date(scheduleEvent.scheduledAt);
  const endDate = new Date(startDate.getTime() + scheduleEvent.duration * 60000);

  const eventData = {
    calendarId,
    summary: scheduleEvent.title || `Reunião com ${contact.name} (${contact.company || 'Sem empresa'})`,
    description: scheduleEvent.description || `
Reunião ${scheduleEvent.type} com ${contact.name}
Empresa: ${contact.company || 'N/A'}
Email: ${contact.email}
Telefone: ${contact.phone || 'N/A'}
LinkedIn: ${contact.linkedinUrl || 'N/A'}

Tipo de reunião: ${scheduleEvent.type}
    `.trim(),
    startDateTime: startDate.toISOString(),
    endDateTime: endDate.toISOString(),
    attendees: [contact.email],
    conferenceData: {
      createRequest: true // Cria link do Google Meet automaticamente
    },
    location: scheduleEvent.location
  };

  const response = await fetch(`${calendarEndpoint}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MCP_API_KEY}`
    },
    body: JSON.stringify(eventData)
  });

  if (!response.ok) {
    throw new Error(`Calendar API error: ${response.status} ${response.statusText}`);
  }

  const calendarEvent = await response.json() as { id: string; hangoutLink?: string };

  logger.info('Evento criado no calendário', {
    requestId,
    contactId: contact.id,
    eventId: calendarEvent.id,
    meetingLink: calendarEvent.hangoutLink
  });

  return calendarEvent;
}

/**
 * Salva reunião no DynamoDB
 */
async function saveMeeting(
  contact: Contact,
  scheduleEvent: MeetingScheduleEvent,
  calendarEvent: any,
  requestId: string
): Promise<MeetingRequest> {
  const tableName = TABLE_NAMES.MEETINGS;
  
  const meeting: MeetingRequest = {
    id: `meeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    contactId: contact.id,
    scheduledAt: scheduleEvent.scheduledAt,
    duration: scheduleEvent.duration,
    type: scheduleEvent.type,
    status: 'scheduled',
    title: scheduleEvent.title,
    description: scheduleEvent.description,
    location: scheduleEvent.location,
    meetingUrl: calendarEvent.hangoutLink || calendarEvent.conferenceData?.entryPoints?.[0]?.uri,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      ...scheduleEvent.metadata,
      calendarEventId: calendarEvent.id,
      requestId
    }
  };

  const command = new PutCommand({
    TableName: tableName,
    Item: meeting
  });

  await dynamoClient.send(command);

  logger.info('Reunião salva no DynamoDB', {
    requestId,
    meetingId: meeting.id,
    contactId: contact.id
  });

  return meeting;
}

/**
 * Gera e salva briefing automático
 */
async function generateAndSaveBriefing(
  contact: Contact,
  meeting: MeetingRequest,
  requestId: string
): Promise<void> {
  logger.info('Gerando briefing automático', {
    requestId,
    contactId: contact.id,
    meetingId: meeting.id
  });

  // Gera briefing via MCP
  const briefingResponse = await mcpClient.generateBriefing(contact, {
    meetingId: meeting.id,
    scheduledAt: meeting.scheduledAt,
    type: meeting.type,
    duration: meeting.duration
  });

  if (!briefingResponse.success) {
    logger.warn('Falha ao gerar briefing via MCP, usando fallback', {
      requestId,
      contactId: contact.id,
      error: briefingResponse.error
    });
  }

  const briefing = briefingResponse.briefing || {
    summary: `Briefing para reunião com ${contact.name} (${contact.company})`,
    keyPoints: ['Revisar histórico de conversas', 'Preparar proposta comercial'],
    recommendations: ['Focar em pain points identificados'],
    riskFactors: ['Briefing gerado automaticamente - revisar manualmente'],
    nextSteps: ['Confirmar agenda', 'Enviar material preparatório']
  };

  // Formata briefing em markdown
  const briefingMarkdown = `
# Briefing Comercial - ${contact.company || contact.name}

## 📊 Dados da Empresa
- **Nome**: ${contact.name}
- **Empresa**: ${contact.company || 'N/A'}
- **Cargo**: ${contact.position || 'N/A'}
- **Setor**: ${contact.industry || 'N/A'}
- **Localização**: ${contact.location || 'N/A'}
- **Email**: ${contact.email}
- **Telefone**: ${contact.phone || 'N/A'}
- **LinkedIn**: ${contact.linkedinUrl || 'N/A'}

## 📈 Resumo
${briefing.summary}

## 🎯 Pontos-Chave
${briefing.keyPoints.map(point => `- ${point}`).join('\n')}

## 💡 Recomendações
${briefing.recommendations.map(rec => `- ${rec}`).join('\n')}

## ⚠️ Fatores de Risco
${briefing.riskFactors.map(risk => `- ${risk}`).join('\n')}

## 📋 Próximos Passos
${briefing.nextSteps.map(step => `- ${step}`).join('\n')}

## 📅 Detalhes da Reunião
- **Data/Hora**: ${new Date(meeting.scheduledAt).toLocaleString('pt-BR')}
- **Duração**: ${meeting.duration} minutos
- **Tipo**: ${meeting.type}
- **Link**: ${meeting.meetingUrl || 'A definir'}

---
*Briefing gerado automaticamente em ${new Date().toLocaleString('pt-BR')}*
*Meeting ID: ${meeting.id} | Contact ID: ${contact.id}*
  `.trim();

  // Salva briefing no S3
  const s3Key = await s3Helper.uploadBriefing(
    briefingMarkdown,
    contact.id,
    meeting.id
  );

  // Atualiza reunião com link do briefing
  await updateMeetingBriefing(meeting.id, s3Key, requestId);

  logger.info('Briefing gerado e salvo', {
    requestId,
    meetingId: meeting.id,
    s3Key
  });
}

/**
 * Atualiza reunião com informações do briefing
 */
async function updateMeetingBriefing(
  meetingId: string,
  briefingS3Key: string,
  requestId: string
): Promise<void> {
  const tableName = TABLE_NAMES.MEETINGS;
  
  const command = new UpdateCommand({
    TableName: tableName,
    Key: { id: meetingId },
    UpdateExpression: 'SET briefingS3Key = :s3Key, briefingGenerated = :true, updatedAt = :now',
    ExpressionAttributeValues: {
      ':s3Key': briefingS3Key,
      ':true': true,
      ':now': new Date().toISOString()
    }
  });

  await dynamoClient.send(command);
}

/**
 * Envia confirmação de reunião para o contato
 */
async function sendMeetingConfirmation(
  contact: Contact,
  meeting: MeetingRequest,
  requestId: string
): Promise<void> {
  logger.info('Enviando confirmação de reunião', {
    requestId,
    contactId: contact.id,
    meetingId: meeting.id
  });

  const channel = contact.phone ? 'whatsapp' : 'email';
  const meetingDate = new Date(meeting.scheduledAt).toLocaleString('pt-BR');

  const confirmationMessage = `
Olá ${contact.name}! 👋

Sua reunião foi agendada com sucesso! 🎉

📅 **Data/Hora**: ${meetingDate}
⏱️ **Duração**: ${meeting.duration} minutos
🎯 **Tipo**: ${meeting.type}
${meeting.meetingUrl ? `🔗 **Link**: ${meeting.meetingUrl}` : ''}

Aguardamos você!

Caso precise reagendar, entre em contato conosco.
  `.trim();

  // Envia via canal apropriado
  const endpoint = channel === 'whatsapp' 
    ? process.env.MCP_WHATSAPP_ENDPOINT 
    : process.env.MCP_EMAIL_ENDPOINT;

  if (!endpoint) {
    logger.warn(`Endpoint ${channel} não configurado, pulando confirmação`);
    return;
  }

  const payload = channel === 'whatsapp'
    ? { to: contact.phone, message: confirmationMessage }
    : { 
        to: contact.email, 
        subject: 'Reunião Agendada - Alquimista.AI',
        body: confirmationMessage 
      };

  const response = await fetch(`${endpoint}/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MCP_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    logger.warn('Falha ao enviar confirmação', {
      requestId,
      contactId: contact.id,
      channel,
      status: response.status
    });
  } else {
    logger.info('Confirmação enviada com sucesso', {
      requestId,
      contactId: contact.id,
      channel
    });
  }
}

/**
 * Configura lembretes automáticos
 */
async function setupReminders(
  meeting: MeetingRequest,
  requestId: string
): Promise<void> {
  logger.info('Configurando lembretes', {
    requestId,
    meetingId: meeting.id
  });

  const eventBusName = process.env.EVENT_BUS_NAME;
  if (!eventBusName) {
    logger.warn('EVENT_BUS_NAME não configurado, pulando configuração de lembretes');
    return;
  }

  const { EventBridgeClient, PutEventsCommand } = await import('@aws-sdk/client-eventbridge');
  const eventBridge = new EventBridgeClient({ region: process.env.AWS_REGION });

  const meetingDate = new Date(meeting.scheduledAt);
  
  // Lembrete 24h antes
  const reminder24h = new Date(meetingDate.getTime() - 24 * 60 * 60 * 1000);
  
  // Lembrete 1h antes
  const reminder1h = new Date(meetingDate.getTime() - 60 * 60 * 1000);

  // Publica eventos de lembrete
  const events = [
    {
      Source: 'nigredo.schedule-meeting',
      DetailType: 'Meeting Reminder',
      Detail: JSON.stringify({
        meetingId: meeting.id,
        contactId: meeting.contactId,
        reminderType: '24h',
        scheduledAt: meeting.scheduledAt
      }),
      EventBusName: eventBusName
    },
    {
      Source: 'nigredo.schedule-meeting',
      DetailType: 'Meeting Reminder',
      Detail: JSON.stringify({
        meetingId: meeting.id,
        contactId: meeting.contactId,
        reminderType: '1h',
        scheduledAt: meeting.scheduledAt
      }),
      EventBusName: eventBusName
    }
  ];

  const command = new PutEventsCommand({ Entries: events });
  await eventBridge.send(command);

  logger.info('Lembretes configurados', {
    requestId,
    meetingId: meeting.id,
    reminders: ['24h', '1h']
  });
}

/**
 * Atualiza status do contato
 */
async function updateContactStatus(
  contactId: string,
  status: string,
  requestId: string
): Promise<void> {
  const tableName = TABLE_NAMES.CONTACTS;
  
  const command = new UpdateCommand({
    TableName: tableName,
    Key: { id: contactId },
    UpdateExpression: 'SET #status = :status, updatedAt = :now',
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    ExpressionAttributeValues: {
      ':status': status,
      ':now': new Date().toISOString()
    }
  });

  await dynamoClient.send(command);

  logger.info('Status do contato atualizado', {
    requestId,
    contactId,
    newStatus: status
  });
}
