/**
 * Lambda: Ingest Contacts
 * 
 * Responsabilidade: Receber contatos (por API/arquivo/evento), normalizar, 
 * validar consentimento/horário, gerar jobs de disparo.
 * 
 * Requisitos: RF-001
 * Estimativa: 2-3h
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { v4 as uuidv4 } from 'uuid';
import { docClient, sqsClient, config } from '../utils/aws-clients';
import { createLogger } from '../utils/logger';
import { Contact, MessageQueueEvent } from '../types/common';

const logger = createLogger({ service: 'ingest-contacts' });

interface IngestContactsPayload {
  tenantId: string;
  campaignId: string;
  contacts: Array<{
    company: string;
    contactName: string;
    phone: string;
    email: string;
    segment?: 'B2B' | 'B2C';
    metadata?: Record<string, any>;
  }>;
}

interface IngestResult {
  ingested: number;
  skipped: number;
  invalid: number;
  errors: Array<{
    contact: string;
    reason: string;
  }>;
}

/**
 * Handler principal da Lambda
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const correlationId = uuidv4();
  const requestLogger = logger.withContext({ correlationId });

  try {
    requestLogger.info('Iniciando ingestão de contatos', {
      path: event.path,
      method: event.httpMethod,
    });

    // Parse do body
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Body vazio' }),
      };
    }

    const payload: IngestContactsPayload = JSON.parse(event.body);

    // Validar payload
    if (!payload.tenantId || !payload.campaignId || !Array.isArray(payload.contacts)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Payload inválido' }),
      };
    }

    requestLogger.info('Payload validado', {
      tenantId: payload.tenantId,
      campaignId: payload.campaignId,
      contactCount: payload.contacts.length,
    });

    // Processar contatos
    const result = await ingestContacts(payload, requestLogger);

    requestLogger.info('Ingestão concluída', result);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        result,
        correlationId,
      }),
    };
  } catch (error) {
    requestLogger.error('Erro ao ingerir contatos', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Erro interno ao processar contatos',
        correlationId,
      }),
    };
  }
};

/**
 * Processa lista de contatos
 */
async function ingestContacts(
  payload: IngestContactsPayload,
  logger: ReturnType<typeof createLogger>
): Promise<IngestResult> {
  const result: IngestResult = {
    ingested: 0,
    skipped: 0,
    invalid: 0,
    errors: [],
  };

  for (const contactData of payload.contacts) {
    try {
      // Validar campos mínimos
      const validation = validateContact(contactData);
      if (!validation.valid) {
        result.invalid++;
        result.errors.push({
          contact: contactData.contactName || 'unknown',
          reason: validation.reason || 'Validação falhou',
        });
        continue;
      }

      // Normalizar dados
      const normalized = normalizeContact(contactData);

      // Verificar duplicata
      const isDuplicate = await checkDuplicate(
        payload.tenantId,
        normalized.phone,
        normalized.email
      );

      if (isDuplicate) {
        result.skipped++;
        logger.info('Contato duplicado, pulando', {
          phone: normalized.phone,
          email: normalized.email,
        });
        continue;
      }

      // Salvar contato no DynamoDB
      const contactId = `CONTACT#${uuidv4()}`;
      const contact: Contact = {
        pk: contactId,
        id: contactId,
        company: normalized.company,
        contactName: normalized.contactName,
        phone: normalized.phone,
        email: normalized.email,
        status: 'active',
        segment: normalized.segment || 'B2B',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          ...contactData.metadata,
          tenantId: payload.tenantId,
          campaignId: payload.campaignId,
        },
      };

      await docClient.send(
        new PutCommand({
          TableName: config.tables.contacts,
          Item: contact,
        })
      );

      // Criar job de disparo na fila SQS
      const messageEvent: MessageQueueEvent = {
        type: 'send_message',
        contactId: contact.pk,
        campaignId: payload.campaignId,
        data: {
          tenantId: payload.tenantId,
          priority: 'medium',
        },
        timestamp: new Date().toISOString(),
      };

      await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: config.queues.messageQueue,
          MessageBody: JSON.stringify(messageEvent),
          MessageGroupId: payload.tenantId, // Para FIFO queue
        })
      );

      result.ingested++;
      logger.info('Contato ingerido com sucesso', {
        contactId: contact.pk,
        phone: contact.phone,
      });
    } catch (error) {
      result.invalid++;
      result.errors.push({
        contact: contactData.contactName || 'unknown',
        reason: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      logger.error('Erro ao processar contato', error);
    }
  }

  return result;
}

/**
 * Valida campos mínimos do contato
 */
function validateContact(contact: any): { valid: boolean; reason?: string } {
  if (!contact.company || contact.company.trim() === '') {
    return { valid: false, reason: 'Campo "company" obrigatório' };
  }

  if (!contact.contactName || contact.contactName.trim() === '') {
    return { valid: false, reason: 'Campo "contactName" obrigatório' };
  }

  if (!contact.phone && !contact.email) {
    return { valid: false, reason: 'Pelo menos "phone" ou "email" obrigatório' };
  }

  // Validação básica de email
  if (contact.email && !isValidEmail(contact.email)) {
    return { valid: false, reason: 'Email inválido' };
  }

  // Validação básica de telefone
  if (contact.phone && !isValidPhone(contact.phone)) {
    return { valid: false, reason: 'Telefone inválido' };
  }

  return { valid: true };
}

/**
 * Normaliza dados do contato
 */
function normalizeContact(contact: any) {
  return {
    company: contact.company.trim(),
    contactName: contact.contactName.trim(),
    phone: normalizePhone(contact.phone),
    email: normalizeEmail(contact.email),
    segment: contact.segment || 'B2B',
  };
}

/**
 * Normaliza telefone para formato canônico
 */
function normalizePhone(phone: string): string {
  if (!phone) return '';
  
  // Remove tudo exceto números
  const digits = phone.replace(/\D/g, '');
  
  // Adiciona +55 se não tiver código do país
  if (digits.length === 11) {
    return `+55${digits}`;
  }
  
  if (digits.length === 13 && digits.startsWith('55')) {
    return `+${digits}`;
  }
  
  return `+${digits}`;
}

/**
 * Normaliza email para lowercase
 */
function normalizeEmail(email: string): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

/**
 * Valida formato de email
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida formato de telefone
 */
function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  // Aceita telefones com 10-15 dígitos
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * Verifica se contato já existe (duplicata)
 */
async function checkDuplicate(
  tenantId: string,
  phone: string,
  email: string
): Promise<boolean> {
  const checkLogger = createLogger({ service: 'check-duplicate' });
  
  try {
    // Query por phone
    if (phone) {
      const phoneResult = await docClient.send(
        new QueryCommand({
          TableName: config.tables.contacts,
          IndexName: 'phone-index', // GSI a ser criado
          KeyConditionExpression: 'phone = :phone',
          FilterExpression: 'metadata.tenantId = :tenantId',
          ExpressionAttributeValues: {
            ':phone': phone,
            ':tenantId': tenantId,
          },
          Limit: 1,
        })
      );

      if (phoneResult.Items && phoneResult.Items.length > 0) {
        return true;
      }
    }

    // Query por email
    if (email) {
      const emailResult = await docClient.send(
        new QueryCommand({
          TableName: config.tables.contacts,
          IndexName: 'email-index', // GSI a ser criado
          KeyConditionExpression: 'email = :email',
          FilterExpression: 'metadata.tenantId = :tenantId',
          ExpressionAttributeValues: {
            ':email': email,
            ':tenantId': tenantId,
          },
          Limit: 1,
        })
      );

      if (emailResult.Items && emailResult.Items.length > 0) {
        return true;
      }
    }

    return false;
  } catch (error) {
    // Em caso de erro, assumir que não é duplicata para não bloquear ingestão
    checkLogger.warn('Erro ao verificar duplicata, assumindo não duplicado', error);
    return false;
  }
}
