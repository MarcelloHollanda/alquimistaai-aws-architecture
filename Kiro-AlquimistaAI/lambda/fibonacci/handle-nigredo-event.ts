import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { createHmac } from 'crypto';
import { query } from '../shared/database';

const logger = new Logger({ serviceName: 'fibonacci-nigredo-webhook' });
const tracer = new Tracer({ serviceName: 'fibonacci-nigredo-webhook' });
const eventBridge = tracer.captureAWSv3Client(new EventBridgeClient({}));

const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || 'fibonacci-events';
const WEBHOOK_SECRET = process.env.NIGREDO_WEBHOOK_SECRET || 'change-me-in-production';

interface NigredoWebhookPayload {
  event_type: 'lead.created';
  timestamp: string;
  signature?: string;
  lead: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    message: string;
    source?: string;
    utm_params?: {
      utm_source?: string;
      utm_medium?: string;
      utm_campaign?: string;
    };
  };
}

/**
 * Valida a assinatura HMAC do webhook
 */
function validateSignature(payload: string, signature: string): boolean {
  const expectedSignature = createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  
  return signature === expectedSignature;
}

/**
 * Armazena o lead no banco de dados do Fibonacci (schema nigredo_leads)
 */
async function storeLeadInFibonacci(lead: NigredoWebhookPayload['lead']): Promise<string> {
  const segment = tracer.getSegment();
  const subsegment = segment?.addNewSubsegment('storeLeadInFibonacci');
  
  try {
    // Verificar se o lead já existe (por email)
    const existingLead = await query(
      `SELECT id FROM nigredo_leads.leads WHERE email = $1 LIMIT 1`,
      [lead.email]
    );
    
    if (existingLead.rows.length > 0) {
      logger.info('Lead já existe no Fibonacci', {
        leadId: existingLead.rows[0].id,
        email: lead.email,
      });
      
      // Atualizar lead existente com novos dados
      // Mapeia campos do Nigredo para o schema Fibonacci
      await query(
        `UPDATE nigredo_leads.leads 
         SET 
           name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           company = COALESCE($3, company),
           empresa = COALESCE($4, empresa),
           message = COALESCE($5, message),
           utm_source = COALESCE($6, utm_source),
           utm_medium = COALESCE($7, utm_medium),
           utm_campaign = COALESCE($8, utm_campaign),
           updated_at = CURRENT_TIMESTAMP,
           metadata = jsonb_set(
             COALESCE(metadata, '{}'::jsonb),
             '{nigredo_lead_id}',
             to_jsonb($9::text),
             true
           )
         WHERE id = $10`,
        [
          lead.name,
          lead.phone,
          lead.company,
          lead.company, // Map company to empresa as well
          lead.message,
          lead.utm_params?.utm_source,
          lead.utm_params?.utm_medium,
          lead.utm_params?.utm_campaign,
          lead.id, // Nigredo lead ID stored in metadata
          existingLead.rows[0].id,
        ]
      );
      
      return existingLead.rows[0].id;
    }
    
    // Inserir novo lead
    // Mapeia campos do Nigredo para o schema Fibonacci (nigredo_leads.leads)
    // Campos obrigatórios: tenant_id, empresa
    // Usamos um tenant_id padrão para leads públicos do Nigredo
    const result = await query(
      `INSERT INTO nigredo_leads.leads (
        tenant_id,
        empresa,
        contato,
        telefone,
        email,
        status,
        name,
        phone,
        company,
        message,
        utm_source,
        utm_medium,
        utm_campaign,
        metadata,
        created_at,
        updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid,
        $1,
        $2,
        $3,
        $4,
        'novo',
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        jsonb_build_object(
          'nigredo_lead_id', $12,
          'source', $13
        ),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING id`,
      [
        lead.company || 'Não informado', // empresa (required)
        lead.name, // contato
        lead.phone, // telefone
        lead.email, // email
        lead.name, // name (prospecting form field)
        lead.phone, // phone (prospecting form field)
        lead.company, // company (prospecting form field)
        lead.message, // message
        lead.utm_params?.utm_source, // utm_source
        lead.utm_params?.utm_medium, // utm_medium
        lead.utm_params?.utm_campaign, // utm_campaign
        lead.id, // Nigredo lead ID stored in metadata
        lead.source || 'nigredo', // source stored in metadata
      ]
    );
    
    const fibonacciLeadId = result.rows[0].id;
    
    logger.info('Lead criado no Fibonacci', {
      fibonacciLeadId,
      nigredoLeadId: lead.id,
      email: lead.email,
    });
    
    subsegment?.addAnnotation('leadId', fibonacciLeadId);
    subsegment?.addMetadata('lead', { fibonacciLeadId, nigredoLeadId: lead.id });
    
    return fibonacciLeadId;
  } finally {
    subsegment?.close();
  }
}

/**
 * Publica evento no EventBridge para trigger dos agentes Nigredo
 */
async function triggerNigredoAgents(fibonacciLeadId: string, lead: NigredoWebhookPayload['lead']): Promise<void> {
  const segment = tracer.getSegment();
  const subsegment = segment?.addNewSubsegment('triggerNigredoAgents');
  
  try {
    const event = {
      Source: 'fibonacci.nigredo',
      DetailType: 'LeadReceived',
      Detail: JSON.stringify({
        fibonacciLeadId,
        nigredoLeadId: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        message: lead.message,
        source: lead.source,
        utmParams: lead.utm_params,
        timestamp: new Date().toISOString(),
      }),
      EventBusName: EVENT_BUS_NAME,
    };
    
    const command = new PutEventsCommand({
      Entries: [event],
    });
    
    const response = await eventBridge.send(command);
    
    if (response.FailedEntryCount && response.FailedEntryCount > 0) {
      logger.error('Falha ao publicar evento no EventBridge', {
        failedCount: response.FailedEntryCount,
        entries: response.Entries,
      });
      throw new Error('Failed to publish event to EventBridge');
    }
    
    logger.info('Evento publicado no EventBridge', {
      fibonacciLeadId,
      nigredoLeadId: lead.id,
      eventBus: EVENT_BUS_NAME,
    });
    
    subsegment?.addAnnotation('eventPublished', 'true');
  } finally {
    subsegment?.close();
  }
}

/**
 * Handler principal do webhook Nigredo
 */
export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const correlationId = event.requestContext.requestId;
  logger.appendKeys({ correlationId });
  
  const segment = tracer.getSegment();
  segment?.addAnnotation('handler', 'handle-nigredo-event');
  
  try {
    logger.info('Webhook Nigredo recebido', {
      path: event.rawPath,
      method: event.requestContext.http.method,
      sourceIp: event.requestContext.http.sourceIp,
    });
    
    // Validar body
    if (!event.body) {
      logger.warn('Webhook sem body');
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: {
            code: 'MISSING_BODY',
            message: 'Request body is required',
          },
          request_id: correlationId,
          timestamp: new Date().toISOString(),
        }),
      };
    }
    
    // Parse payload
    let payload: NigredoWebhookPayload;
    try {
      payload = JSON.parse(event.body);
    } catch (error) {
      logger.warn('Webhook com JSON inválido', { error });
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: {
            code: 'INVALID_JSON',
            message: 'Invalid JSON in request body',
          },
          request_id: correlationId,
          timestamp: new Date().toISOString(),
        }),
      };
    }
    
    // Validar assinatura (se fornecida)
    if (payload.signature) {
      const isValid = validateSignature(event.body, payload.signature);
      if (!isValid) {
        logger.warn('Assinatura do webhook inválida');
        return {
          statusCode: 401,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: {
              code: 'INVALID_SIGNATURE',
              message: 'Invalid webhook signature',
            },
            request_id: correlationId,
            timestamp: new Date().toISOString(),
          }),
        };
      }
    }
    
    // Validar event_type
    if (payload.event_type !== 'lead.created') {
      logger.warn('Tipo de evento desconhecido', { eventType: payload.event_type });
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: {
            code: 'UNKNOWN_EVENT_TYPE',
            message: `Unknown event type: ${payload.event_type}`,
          },
          request_id: correlationId,
          timestamp: new Date().toISOString(),
        }),
      };
    }
    
    // Validar dados do lead
    if (!payload.lead || !payload.lead.id || !payload.lead.email || !payload.lead.name) {
      logger.warn('Dados do lead incompletos', { lead: payload.lead });
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: {
            code: 'INVALID_LEAD_DATA',
            message: 'Lead data is incomplete (id, email, and name are required)',
          },
          request_id: correlationId,
          timestamp: new Date().toISOString(),
        }),
      };
    }
    
    // Processar lead
    const fibonacciLeadId = await storeLeadInFibonacci(payload.lead);
    
    // Trigger agentes Nigredo via EventBridge
    await triggerNigredoAgents(fibonacciLeadId, payload.lead);
    
    logger.info('Webhook processado com sucesso', {
      fibonacciLeadId,
      nigredoLeadId: payload.lead.id,
    });
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Lead received and processed successfully',
        data: {
          fibonacci_lead_id: fibonacciLeadId,
          nigredo_lead_id: payload.lead.id,
        },
        request_id: correlationId,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    logger.error('Erro ao processar webhook Nigredo', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error processing webhook',
        },
        request_id: correlationId,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};
