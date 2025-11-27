import { SQSEvent, SQSRecord, Context } from 'aws-lambda';
import { createLogger } from '../utils/logger';
import { docClient as dynamoClient } from '../utils/aws-clients';
import { mcpClient } from '../utils/mcp-client';

const logger = createLogger({ service: 'send-messages' });
import { 
  MessageSendEvent, 
  Contact, 
  Message, 
  ProcessingResult, 
  TABLE_NAMES,
  MessageChannel
} from '../types/common';
import { GetCommand, PutCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

/**
 * Lambda: Send Messages
 * 
 * Responsável por:
 * - Processar eventos de envio de mensagens da fila SQS
 * - Buscar contatos no DynamoDB
 * - Gerar mensagens personalizadas via MCP
 * - Enviar mensagens via WhatsApp/Email/LinkedIn
 * - Registrar histórico e métricas
 */

export const handler = async (
  event: SQSEvent,
  context: Context
): Promise<void> => {
  const requestId = context.awsRequestId;
  const startTime = Date.now();

  logger.info('Iniciando processamento de mensagens', {
    requestId,
    recordsCount: event.Records.length
  });

  const results: ProcessingResult[] = [];

  // Processa cada registro da fila SQS
  for (const record of event.Records) {
    try {
      const result = await processMessageRecord(record, requestId);
      results.push(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Erro ao processar registro SQS', {
        requestId,
        messageId: record.messageId,
        error: errorMessage
      });
      
      results.push({
        success: false,
        processed: 0,
        failed: 1,
        errors: [{ error: errorMessage }]
      });
    }
  }

  // Métricas finais
  const totalProcessed = results.reduce((sum, r) => sum + r.processed, 0);
  const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
  const duration = Date.now() - startTime;

  logger.info('Processamento de mensagens concluído', {
    requestId,
    recordsProcessed: event.Records.length,
    messagesProcessed: totalProcessed,
    messagesFailed: totalFailed,
    duration
  });
};

/**
 * Processa um registro individual da fila SQS
 */
async function processMessageRecord(
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
    const sendEvent: MessageSendEvent = JSON.parse(record.body);
    
    logger.info('Processando evento de envio', {
      requestId,
      messageId: record.messageId,
      campaignId: sendEvent.campaignId,
      contactsCount: sendEvent.contactIds?.length || 0,
      messageType: sendEvent.messageType,
      channel: sendEvent.channel
    });

    // Busca contatos
    const contacts = await fetchContacts(sendEvent, requestId);
    
    if (contacts.length === 0) {
      logger.warn('Nenhum contato encontrado para envio', {
        requestId,
        campaignId: sendEvent.campaignId
      });
      return result;
    }

    // Processa cada contato
    for (const contact of contacts) {
      try {
        await sendMessageToContact(contact, sendEvent, requestId);
        result.processed++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        result.failed++;
        result.errors.push({
          id: contact.id,
          error: errorMessage
        });
        
        logger.error('Erro ao enviar mensagem para contato', {
          requestId,
          contactId: contact.id,
          error: errorMessage
        });
      }
    }

    result.success = result.failed === 0;
    
    return result;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error('Erro ao processar registro', {
      requestId,
      messageId: record.messageId,
      error: errorMessage
    });
    
    return {
      success: false,
      processed: 0,
      failed: 1,
      errors: [{ error: errorMessage }]
    };
  }
}

/**
 * Busca contatos baseado no evento
 */
async function fetchContacts(
  event: MessageSendEvent,
  requestId: string
): Promise<Contact[]> {
  const contacts: Contact[] = [];

  // Se IDs específicos foram fornecidos
  if (event.contactIds && event.contactIds.length > 0) {
    for (const contactId of event.contactIds) {
      try {
        const contact = await getContact(contactId);
        if (contact) {
          contacts.push(contact);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        logger.warn('Erro ao buscar contato', {
          requestId,
          contactId,
          error: errorMessage
        });
      }
    }
  }
  // Se é uma campanha, busca todos os contatos elegíveis
  else if (event.campaignId) {
    const campaignContacts = await getContactsForCampaign(event.campaignId);
    contacts.push(...campaignContacts);
  }

  return contacts;
}

/**
 * Busca um contato individual
 */
async function getContact(contactId: string): Promise<Contact | null> {
  const tableName = TABLE_NAMES.CONTACTS;
  
  const command = new GetCommand({
    TableName: tableName,
    Key: { id: contactId }
  });

  const response = await dynamoClient.send(command);
  
  if (!response.Item) {
    logger.warn('Contato não encontrado', { contactId });
    return null;
  }

  return response.Item as Contact;
}

/**
 * Busca contatos para uma campanha
 */
async function getContactsForCampaign(
  campaignId: string
): Promise<Contact[]> {
  const tableName = TABLE_NAMES.CONTACTS;
  
  // Query por campanha (assumindo GSI)
  const command = new QueryCommand({
    TableName: tableName,
    IndexName: 'campaign-index',
    KeyConditionExpression: 'campaignId = :campaignId',
    ExpressionAttributeValues: {
      ':campaignId': campaignId
    },
    Limit: 100 // Limita para evitar sobrecarga
  });

  const response = await dynamoClient.send(command);
  
  return (response.Items || []) as Contact[];
}

/**
 * Envia mensagem para um contato
 */
async function sendMessageToContact(
  contact: Contact,
  event: MessageSendEvent,
  requestId: string
): Promise<void> {
  logger.info('Enviando mensagem para contato', {
    requestId,
    contactId: contact.id,
    channel: event.channel,
    messageType: event.messageType
  });

  // Gera mensagem via MCP (se não houver mensagem customizada)
  let messageContent = event.customMessage;
  
  if (!messageContent) {
    const mcpResponse = await mcpClient.generateMessage(contact, event.messageType);
    
    if (!mcpResponse.success) {
      throw new Error(`Falha ao gerar mensagem via MCP: ${mcpResponse.error}`);
    }
    
    messageContent = mcpResponse.message || mcpResponse.fallbackMessage || '';
  }

  // Envia via canal apropriado
  const messageId = await sendViaChannel(
    contact,
    messageContent,
    event.channel,
    requestId
  );

  // Registra mensagem no DynamoDB
  await saveMessage({
    pk: messageId,
    id: messageId,
    contactId: contact.id,
    campaignId: event.campaignId || '',
    content: messageContent,
    channel: event.channel,
    type: event.messageType,
    status: 'sent',
    sentAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    metadata: event.metadata
  }, requestId);

  // Atualiza histórico do contato
  await updateContactHistory(contact.id, messageId);

  logger.info('Mensagem enviada com sucesso', {
    requestId,
    contactId: contact.id,
    messageId,
    channel: event.channel
  });
}

/**
 * Envia mensagem via canal específico
 */
async function sendViaChannel(
  contact: Contact,
  message: string,
  channel: MessageChannel,
  requestId: string
): Promise<string> {
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

  switch (channel) {
    case 'whatsapp':
      await sendViaWhatsApp(contact, message);
      break;
    
    case 'email':
      await sendViaEmail(contact, message);
      break;
    
    case 'linkedin':
      await sendViaLinkedIn(contact, message);
      break;
    
    default:
      throw new Error(`Canal não suportado: ${channel}`);
  }

  return messageId;
}

/**
 * Envia via WhatsApp
 */
async function sendViaWhatsApp(
  contact: Contact,
  message: string
): Promise<void> {
  if (!contact.phone) {
    throw new Error('Contato não possui telefone');
  }

  const whatsappEndpoint = process.env.MCP_WHATSAPP_ENDPOINT;
  if (!whatsappEndpoint) {
    throw new Error('MCP_WHATSAPP_ENDPOINT não configurado');
  }

  logger.info('Enviando via WhatsApp', {
    contactId: contact.id,
    phone: contact.phone
  });

  const response = await fetch(`${whatsappEndpoint}/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MCP_API_KEY}`
    },
    body: JSON.stringify({
      to: contact.phone,
      message
    })
  });

  if (!response.ok) {
    throw new Error(`WhatsApp API error: ${response.status} ${response.statusText}`);
  }
}

/**
 * Envia via Email
 */
async function sendViaEmail(
  contact: Contact,
  message: string
): Promise<void> {
  if (!contact.email) {
    throw new Error('Contato não possui email');
  }

  const emailEndpoint = process.env.MCP_EMAIL_ENDPOINT;
  if (!emailEndpoint) {
    throw new Error('MCP_EMAIL_ENDPOINT não configurado');
  }

  logger.info('Enviando via Email', {
    contactId: contact.id,
    email: contact.email
  });

  const response = await fetch(`${emailEndpoint}/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MCP_API_KEY}`
    },
    body: JSON.stringify({
      to: contact.email,
      subject: 'Mensagem da Alquimista.AI',
      body: message
    })
  });

  if (!response.ok) {
    throw new Error(`Email API error: ${response.status} ${response.statusText}`);
  }
}

/**
 * Envia via LinkedIn
 */
async function sendViaLinkedIn(
  contact: Contact,
  message: string
): Promise<void> {
  if (!contact.linkedinUrl) {
    throw new Error('Contato não possui LinkedIn');
  }

  const linkedinEndpoint = process.env.MCP_LINKEDIN_ENDPOINT;
  if (!linkedinEndpoint) {
    throw new Error('MCP_LINKEDIN_ENDPOINT não configurado');
  }

  logger.info('Enviando via LinkedIn', {
    contactId: contact.id,
    linkedinUrl: contact.linkedinUrl
  });

  const response = await fetch(`${linkedinEndpoint}/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MCP_API_KEY}`
    },
    body: JSON.stringify({
      profileUrl: contact.linkedinUrl,
      message
    })
  });

  if (!response.ok) {
    throw new Error(`LinkedIn API error: ${response.status} ${response.statusText}`);
  }
}

/**
 * Salva mensagem no DynamoDB
 */
async function saveMessage(message: Message, requestId: string): Promise<void> {
  const tableName = TABLE_NAMES.MESSAGES;
  
  const command = new PutCommand({
    TableName: tableName,
    Item: {
      ...message,
      createdAt: new Date().toISOString(),
      requestId
    }
  });

  await dynamoClient.send(command);
}

/**
 * Atualiza histórico do contato
 */
async function updateContactHistory(
  contactId: string,
  messageId: string
): Promise<void> {
  const tableName = TABLE_NAMES.CONTACTS;
  
  const command = new UpdateCommand({
    TableName: tableName,
    Key: { id: contactId },
    UpdateExpression: 'SET lastInteractionAt = :now, updatedAt = :now, #history = list_append(if_not_exists(#history, :empty), :messageId)',
    ExpressionAttributeNames: {
      '#history': 'messageHistory'
    },
    ExpressionAttributeValues: {
      ':now': new Date().toISOString(),
      ':messageId': [messageId],
      ':empty': []
    }
  });

  await dynamoClient.send(command);
}
