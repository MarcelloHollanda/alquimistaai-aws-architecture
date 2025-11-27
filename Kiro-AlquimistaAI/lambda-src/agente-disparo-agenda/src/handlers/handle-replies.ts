import { SQSEvent, SQSRecord, Context } from 'aws-lambda';
import { createLogger } from '../utils/logger';
import { docClient as dynamoClient } from '../utils/aws-clients';
import { mcpClient } from '../utils/mcp-client';
import { getErrorMessage, getErrorStack } from '../utils/validation';

const logger = createLogger({ service: 'handle-replies' });
import { 
  ReplyHandleEvent, 
  Contact, 
  Message, 
  ProcessingResult, 
  TABLE_NAMES,
  MessageStatus
} from '../types/common';
import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

/**
 * Lambda: Handle Replies
 * 
 * Responsável por:
 * - Processar respostas de contatos (WhatsApp/Email/LinkedIn)
 * - Analisar sentimento e intenção via MCP
 * - Atualizar status do contato
 * - Determinar próxima ação (follow-up, agendar reunião, etc.)
 * - Gerar alertas para vendedores quando necessário
 */

export const handler = async (
  event: SQSEvent,
  context: Context
): Promise<void> => {
  const requestId = context.awsRequestId;
  const startTime = Date.now();

  logger.info('Iniciando processamento de respostas', {
    requestId,
    recordsCount: event.Records.length
  });

  const results: ProcessingResult[] = [];

  // Processa cada registro da fila SQS
  for (const record of event.Records) {
    try {
      const result = await processReplyRecord(record, requestId);
      results.push(result);
    } catch (error) {
      const err = error as Error;
      logger.error('Erro ao processar registro de resposta', {
        requestId,
        messageId: record.messageId,
        error: err.message
      });
      
      results.push({
        success: false,
        processed: 0,
        failed: 1,
        errors: [{ error: err.message }]
      });
    }
  }

  // Métricas finais
  const totalProcessed = results.reduce((sum, r) => sum + r.processed, 0);
  const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
  const duration = Date.now() - startTime;

  logger.info('Processamento de respostas concluído', {
    requestId,
    recordsProcessed: event.Records.length,
    repliesProcessed: totalProcessed,
    repliesFailed: totalFailed,
    duration
  });
};

/**
 * Processa um registro individual de resposta
 */
async function processReplyRecord(
  record: SQSRecord,
  requestId: string
): Promise<ProcessingResult> {
  const result: ProcessingResult = {
    success: true,
    processed: 0,
    failed: 0,
    errors: []
  };

  try {
    // Parse do evento
    const replyEvent: ReplyHandleEvent = JSON.parse(record.body);
    
    logger.info('Processando resposta de contato', {
      requestId,
      messageId: replyEvent.messageId,
      contactId: replyEvent.contactId,
      channel: replyEvent.channel,
      receivedAt: replyEvent.receivedAt
    });

    // Busca contato
    const contact = await getContact(replyEvent.contactId, requestId);
    
    if (!contact) {
      throw new Error(`Contato não encontrado: ${replyEvent.contactId}`);
    }

    // Analisa resposta via MCP
    const analysis = await mcpClient.analyzeReply(replyEvent.replyContent, contact);
    
    if (!analysis.success) {
      logger.warn('Falha na análise MCP, usando fallback', {
        requestId,
        contactId: contact.id,
        error: analysis.error
      });
    }

    logger.info('Análise de resposta concluída', {
      requestId,
      contactId: contact.id,
      sentiment: analysis.analysis?.sentiment,
      intent: analysis.analysis?.intent,
      nextAction: analysis.analysis?.nextAction,
      confidence: analysis.analysis?.confidence
    });

    // Registra resposta no DynamoDB
    await saveReply(replyEvent, analysis, requestId);

    // Atualiza status do contato
    await updateContactStatus(contact, analysis, requestId);

    // Determina e executa próxima ação
    await executeNextAction(contact, analysis, replyEvent, requestId);

    result.processed++;
    result.success = true;

    return result;

  } catch (error) {
    const err = error as Error;
    logger.error('Erro ao processar resposta', {
      requestId,
      messageId: record.messageId,
      error: err.message,
      stack: err.stack
    });
    
    return {
      success: false,
      processed: 0,
      failed: 1,
      errors: [{ error: err.message }]
    };
  }
}

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
 * Salva resposta no DynamoDB
 */
async function saveReply(
  replyEvent: ReplyHandleEvent,
  analysis: any,
  requestId: string
): Promise<void> {
  const tableName = TABLE_NAMES.MESSAGES;
  
  const messageId = `reply_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  const replyMessage: Message = {
    pk: messageId,
    id: messageId,
    contactId: replyEvent.contactId,
    campaignId: '',
    content: replyEvent.replyContent,
    channel: replyEvent.channel,
    type: 'reply',
    status: 'read',
    sentAt: replyEvent.receivedAt,
    createdAt: new Date().toISOString(),
    metadata: {
      ...replyEvent.metadata,
      analysis: analysis.analysis,
      confidence: analysis.analysis?.confidence,
      readAt: new Date().toISOString()
    }
  };

  const command = new PutCommand({
    TableName: tableName,
    Item: {
      ...replyMessage,
      createdAt: new Date().toISOString(),
      requestId
    }
  });

  await dynamoClient.send(command);

  logger.info('Resposta salva no DynamoDB', {
    requestId,
    messageId: replyMessage.id,
    contactId: replyEvent.contactId
  });
}

/**
 * Atualiza status do contato baseado na análise
 */
async function updateContactStatus(
  contact: Contact,
  analysis: any,
  requestId: string
): Promise<void> {
  const tableName = TABLE_NAMES.CONTACTS;
  
  // Determina novo status baseado na análise
  let newStatus = contact.status;
  const sentiment = analysis.analysis?.sentiment || 'neutral';
  const intent = analysis.analysis?.intent || 'unknown';

  if (intent === 'interested' || intent === 'ready_to_buy') {
    newStatus = 'qualified';
  } else if (intent === 'not_interested') {
    newStatus = 'unresponsive';
  } else if (sentiment === 'positive') {
    newStatus = 'responded';
  }

  // Calcula taxa de resposta
  const messageHistory = contact.messageHistory || [];
  const totalMessages = messageHistory.length + 1; // +1 para a resposta atual
  const responseRate = (1 / totalMessages) * 100; // Simplificado

  // Calcula score de engajamento
  const engagementScore = calculateEngagementScore(sentiment, intent, analysis.analysis?.confidence || 0);

  const command = new UpdateCommand({
    TableName: tableName,
    Key: { id: contact.id },
    UpdateExpression: `
      SET #status = :status,
          lastInteractionAt = :now,
          updatedAt = :now,
          responseRate = :responseRate,
          engagementScore = :engagementScore
    `,
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    ExpressionAttributeValues: {
      ':status': newStatus,
      ':now': new Date().toISOString(),
      ':responseRate': responseRate,
      ':engagementScore': engagementScore
    }
  });

  await dynamoClient.send(command);

  logger.info('Status do contato atualizado', {
    requestId,
    contactId: contact.id,
    oldStatus: contact.status,
    newStatus,
    responseRate,
    engagementScore
  });
}

/**
 * Calcula score de engajamento
 */
function calculateEngagementScore(
  sentiment: string,
  intent: string,
  confidence: number
): number {
  let score = 50; // Base score

  // Ajusta por sentimento
  if (sentiment === 'positive') score += 30;
  else if (sentiment === 'neutral') score += 10;
  else if (sentiment === 'negative') score -= 20;

  // Ajusta por intenção
  if (intent === 'ready_to_buy') score += 40;
  else if (intent === 'interested') score += 20;
  else if (intent === 'needs_info') score += 10;
  else if (intent === 'not_interested') score -= 30;

  // Ajusta por confiança
  score = score * confidence;

  // Garante que está entre 0 e 100
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Executa próxima ação baseada na análise
 */
async function executeNextAction(
  contact: Contact,
  analysis: any,
  replyEvent: ReplyHandleEvent,
  requestId: string
): Promise<void> {
  const nextAction = analysis.analysis?.nextAction || 'manual_review';
  const urgency = analysis.analysis?.urgency || 'low';

  logger.info('Determinando próxima ação', {
    requestId,
    contactId: contact.id,
    nextAction,
    urgency
  });

  switch (nextAction) {
    case 'schedule_meeting':
      await triggerMeetingSchedule(contact, urgency, requestId);
      break;
    
    case 'send_info':
      await triggerFollowUpMessage(contact, 'send_info', requestId);
      break;
    
    case 'followup':
      await triggerFollowUpMessage(contact, 'followup', requestId);
      break;
    
    case 'close_deal':
      await notifySalesTeam(contact, 'ready_to_close', urgency, requestId);
      break;
    
    case 'manual_review':
    default:
      await notifySalesTeam(contact, 'needs_review', urgency, requestId);
      break;
  }
}

/**
 * Dispara agendamento de reunião
 */
async function triggerMeetingSchedule(
  contact: Contact,
  urgency: string,
  requestId: string
): Promise<void> {
  logger.info('Disparando agendamento de reunião', {
    requestId,
    contactId: contact.id,
    urgency
  });

  // Publica evento para Lambda de agendamento
  const eventBusName = process.env.EVENT_BUS_NAME;
  if (!eventBusName) {
    logger.warn('EVENT_BUS_NAME não configurado, pulando disparo de agendamento');
    return;
  }

  const { EventBridgeClient, PutEventsCommand } = await import('@aws-sdk/client-eventbridge');
  const eventBridge = new EventBridgeClient({ region: process.env.AWS_REGION });

  const command = new PutEventsCommand({
    Entries: [{
      Source: 'nigredo.handle-replies',
      DetailType: 'Schedule Requested',
      Detail: JSON.stringify({
        contactId: contact.id,
        urgency,
        requestedBy: 'auto',
        meetingType: 'discovery'
      }),
      EventBusName: eventBusName
    }]
  });

  await eventBridge.send(command);

  logger.info('Evento de agendamento publicado', {
    requestId,
    contactId: contact.id
  });
}

/**
 * Dispara mensagem de follow-up
 */
async function triggerFollowUpMessage(
  contact: Contact,
  followUpType: string,
  requestId: string
): Promise<void> {
  logger.info('Disparando follow-up', {
    requestId,
    contactId: contact.id,
    followUpType
  });

  // Publica evento para Lambda de envio de mensagens
  const eventBusName = process.env.EVENT_BUS_NAME;
  if (!eventBusName) {
    logger.warn('EVENT_BUS_NAME não configurado, pulando disparo de follow-up');
    return;
  }

  const { EventBridgeClient, PutEventsCommand } = await import('@aws-sdk/client-eventbridge');
  const eventBridge = new EventBridgeClient({ region: process.env.AWS_REGION });

  const command = new PutEventsCommand({
    Entries: [{
      Source: 'nigredo.handle-replies',
      DetailType: 'Message Send Requested',
      Detail: JSON.stringify({
        contactIds: [contact.id],
        messageType: 'followup',
        channel: contact.phone ? 'whatsapp' : 'email',
        metadata: {
          followUpType,
          triggeredBy: 'auto'
        }
      }),
      EventBusName: eventBusName
    }]
  });

  await eventBridge.send(command);

  logger.info('Evento de follow-up publicado', {
    requestId,
    contactId: contact.id
  });
}

/**
 * Notifica equipe de vendas
 */
async function notifySalesTeam(
  contact: Contact,
  notificationType: string,
  urgency: string,
  requestId: string
): Promise<void> {
  logger.info('Notificando equipe de vendas', {
    requestId,
    contactId: contact.id,
    notificationType,
    urgency
  });

  // Publica evento de notificação
  const eventBusName = process.env.EVENT_BUS_NAME;
  if (!eventBusName) {
    logger.warn('EVENT_BUS_NAME não configurado, pulando notificação');
    return;
  }

  const { EventBridgeClient, PutEventsCommand } = await import('@aws-sdk/client-eventbridge');
  const eventBridge = new EventBridgeClient({ region: process.env.AWS_REGION });

  const command = new PutEventsCommand({
    Entries: [{
      Source: 'nigredo.handle-replies',
      DetailType: 'Sales Notification',
      Detail: JSON.stringify({
        contactId: contact.id,
        contactName: contact.name,
        contactCompany: contact.company,
        notificationType,
        urgency,
        message: `Contato ${contact.name} (${contact.company}) requer atenção: ${notificationType}`
      }),
      EventBusName: eventBusName
    }]
  });

  await eventBridge.send(command);

  logger.info('Notificação enviada', {
    requestId,
    contactId: contact.id,
    notificationType
  });
}
