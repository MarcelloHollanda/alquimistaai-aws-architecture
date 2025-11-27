/**
 * Lambda: API Handler
 * 
 * Roteia requisições HTTP do API Gateway para as funcionalidades do micro agente.
 * 
 * Rotas:
 * - GET /disparo/overview - Contadores agregados
 * - GET /disparo/campaigns - Lista campanhas
 * - POST /disparo/contacts/ingest - Envia contatos para processamento
 * - GET /agendamento/meetings - Lista reuniões
 */

import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient, QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { logger } from '../utils/logger';

// Clientes AWS
const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION_CUSTOM || 'us-east-1' });
const sqs = new SQSClient({ region: process.env.AWS_REGION_CUSTOM || 'us-east-1' });
const eventbridge = new EventBridgeClient({ region: process.env.AWS_REGION_CUSTOM || 'us-east-1' });

// Tabelas DynamoDB
const TABLES = {
  config: process.env.DYNAMODB_CONFIG_TABLE!,
  rateLimit: process.env.DYNAMODB_RATE_LIMIT_TABLE!,
  idempotency: process.env.DYNAMODB_IDEMPOTENCY_TABLE!,
  stats: process.env.DYNAMODB_STATS_TABLE!,
  meetings: process.env.DYNAMODB_MEETINGS_TABLE!,
};

// Filas SQS
const SQS_SEND_QUEUE_URL = process.env.SQS_SEND_QUEUE_URL!;

// EventBridge
const EVENTBRIDGE_BUS_NAME = process.env.EVENTBRIDGE_BUS_NAME!;

/**
 * Handler principal
 */
export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const { routeKey, body } = event;
  
  logger.info('API Request', {
    routeKey,
    method: event.requestContext.http.method,
    path: event.requestContext.http.path,
  });

  try {
    // Roteamento
    switch (routeKey) {
      case 'GET /disparo/overview':
        return await handleGetOverview();
      
      case 'GET /disparo/campaigns':
        return await handleGetCampaigns();
      
      case 'POST /disparo/contacts/ingest':
        return await handlePostContactsIngest(body);
      
      case 'GET /agendamento/meetings':
        return await handleGetMeetings();
      
      default:
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Route not found' }),
        };
    }
  } catch (error: any) {
    logger.error('API Error', { error: error.message, stack: error.stack });
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error', message: error.message }),
    };
  }
}

/**
 * GET /disparo/overview
 * Retorna contadores agregados
 */
async function handleGetOverview(): Promise<APIGatewayProxyResultV2> {
  logger.info('Handling GET /disparo/overview');

  // TODO: Implementar queries reais no DynamoDB
  // Por enquanto, retornar dados mockados para validar integração
  
  const overview = {
    contactsInQueue: 0,
    messagesSentToday: 0,
    meetingsScheduled: 0,
    meetingsConfirmed: 0,
  };

  // Query exemplo: contar contatos na fila
  try {
    const scanResult = await dynamodb.send(new ScanCommand({
      TableName: TABLES.config,
      Select: 'COUNT',
    }));
    
    overview.contactsInQueue = scanResult.Count || 0;
  } catch (error: any) {
    logger.warn('Failed to query contacts', { error: error.message });
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(overview),
  };
}

/**
 * GET /disparo/campaigns
 * Lista campanhas ativas e recentes
 */
async function handleGetCampaigns(): Promise<APIGatewayProxyResultV2> {
  logger.info('Handling GET /disparo/campaigns');

  // TODO: Implementar query real no DynamoDB
  // Por enquanto, retornar array vazio para validar integração
  
  const campaigns: any[] = [];

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(campaigns),
  };
}

/**
 * POST /disparo/contacts/ingest
 * Envia lote de contatos para processamento
 */
async function handlePostContactsIngest(body: string | undefined): Promise<APIGatewayProxyResultV2> {
  logger.info('Handling POST /disparo/contacts/ingest');

  if (!body) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing request body' }),
    };
  }

  let payload: any;
  try {
    payload = JSON.parse(body);
  } catch (error) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON' }),
    };
  }

  // Validar payload
  if (!payload.contacts || !Array.isArray(payload.contacts)) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing or invalid "contacts" field' }),
    };
  }

  const { contacts } = payload;

  // Validar cada contato
  for (const contact of contacts) {
    if (!contact.company || !contact.contactName || !contact.phone || !contact.email) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Invalid contact', 
          message: 'Each contact must have: company, contactName, phone, email' 
        }),
      };
    }
  }

  // Enviar evento para EventBridge (trigger Lambda ingest-contacts)
  try {
    await eventbridge.send(new PutEventsCommand({
      Entries: [
        {
          Source: 'api.disparo-agenda',
          DetailType: 'Contacts Ingest Requested',
          Detail: JSON.stringify({ contacts }),
          EventBusName: EVENTBRIDGE_BUS_NAME,
        },
      ],
    }));

    logger.info('Contacts ingest event sent', { count: contacts.length });

    return {
      statusCode: 202,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: true, 
        message: `${contacts.length} contatos enviados para processamento` 
      }),
    };
  } catch (error: any) {
    logger.error('Failed to send ingest event', { error: error.message });
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to process contacts', message: error.message }),
    };
  }
}

/**
 * GET /agendamento/meetings
 * Lista reuniões agendadas
 */
async function handleGetMeetings(): Promise<APIGatewayProxyResultV2> {
  logger.info('Handling GET /agendamento/meetings');

  // TODO: Implementar query real no DynamoDB
  // Por enquanto, retornar array vazio para validar integração
  
  const meetings: any[] = [];

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(meetings),
  };
}

