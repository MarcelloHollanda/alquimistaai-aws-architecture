import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { createLogger } from './shared/logger';

// Initialize tracer
const tracer = new Tracer({
  serviceName: process.env.POWERTOOLS_SERVICE_NAME || 'fibonacci-api'
});

// Initialize AWS clients with X-Ray tracing
const eventBridgeClient = tracer.captureAWSv3Client(new EventBridgeClient({}));
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || 'fibonacci-bus-dev';

// Zod schema for event payload validation
const EventPayloadSchema = z.object({
  source: z.string().min(1, 'Source is required'),
  type: z.string().min(1, 'Type is required'),
  detail: z.record(z.any()).or(z.object({}))
});

type EventPayload = z.infer<typeof EventPayloadSchema>;

/**
 * Lambda handler principal para API Gateway
 * Processa requisições HTTP e publica eventos no EventBridge
 * 
 * Features:
 * - Roteamento de requisições HTTP
 * - Validação de payload com Zod
 * - Logging estruturado com Powertools
 * - X-Ray tracing distribuído
 * - Error handling robusto
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Generate trace ID for request tracking
  const traceId = uuidv4();
  
  // Create logger with structured context
  const logger = createLogger('fibonacci-api', { traceId });
  
  // Create X-Ray subsegment for request processing
  const segment = tracer.getSegment();
  const subsegment = segment?.addNewSubsegment('ProcessRequest');
  
  try {
    // Add annotations for X-Ray filtering
    subsegment?.addAnnotation('path', event.path);
    subsegment?.addAnnotation('method', event.httpMethod);
    subsegment?.addAnnotation('traceId', traceId);
    
    logger.info('Processing request', {
      path: event.path,
      method: event.httpMethod,
      requestId: context.awsRequestId
    });

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return buildResponse(200, { message: 'OK' }, traceId);
    }

    // Route based on path and method
    if (event.path === '/health' && event.httpMethod === 'GET') {
      const response = handleHealthCheck(logger, traceId);
      subsegment?.close();
      return response;
    }

    if (event.path === '/events' && event.httpMethod === 'POST') {
      const response = await handleEventPublication(event, logger, traceId, subsegment);
      subsegment?.close();
      return response;
    }

    // Route not found
    logger.warn('Route not found', {
      path: event.path,
      method: event.httpMethod
    });
    
    subsegment?.close();
    return buildResponse(404, {
      error: 'Not Found',
      message: `Route ${event.httpMethod} ${event.path} not found`
    }, traceId);

  } catch (error) {
    // Log error with full context
    const errorDetails: Record<string, any> = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : { error };
    logger.error('Error processing request', error as Error, errorDetails);

    // Add error to X-Ray trace
    if (subsegment && error instanceof Error) {
      subsegment.addError(error);
    }
    subsegment?.close();

    return buildResponse(500, {
      error: 'Internal Server Error',
      message: 'An error occurred processing your request'
    }, traceId);
  }
};

/**
 * Health check endpoint
 * GET /health
 * 
 * Returns service health status
 */
function handleHealthCheck(logger: ReturnType<typeof createLogger>, traceId: string): APIGatewayProxyResult {
  logger.info('Health check requested');

  return buildResponse(200, {
    ok: true,
    service: process.env.POWERTOOLS_SERVICE_NAME || 'fibonacci-api',
    timestamp: new Date().toISOString()
  }, traceId);
}

/**
 * Publicar evento no EventBridge
 * POST /events
 * 
 * Validates payload with Zod and publishes to EventBridge
 */
async function handleEventPublication(
  event: APIGatewayProxyEvent,
  logger: ReturnType<typeof createLogger>,
  traceId: string,
  subsegment?: any
): Promise<APIGatewayProxyResult> {
  
  // Validate request body exists
  if (!event.body) {
    logger.warn('Request body missing');
    return buildResponse(400, {
      error: 'Bad Request',
      message: 'Request body is required'
    }, traceId);
  }

  // Parse JSON body
  let rawPayload: unknown;
  try {
    rawPayload = JSON.parse(event.body);
  } catch (error) {
    logger.warn('Invalid JSON in request body', { error });
    return buildResponse(400, {
      error: 'Bad Request',
      message: 'Invalid JSON in request body'
    }, traceId);
  }

  // Validate payload with Zod
  const validationResult = EventPayloadSchema.safeParse(rawPayload);
  
  if (!validationResult.success) {
    logger.warn('Payload validation failed', {
      errors: validationResult.error.errors
    });
    
    return buildResponse(400, {
      error: 'Validation Error',
      message: 'Invalid payload structure',
      details: validationResult.error.errors.map((err: z.ZodIssue) => ({
        path: err.path.join('.'),
        message: err.message
      }))
    }, traceId);
  }

  const payload = validationResult.data;

  // Create X-Ray subsegment for EventBridge publish
  const publishSegment = subsegment?.addNewSubsegment('PublishToEventBridge');
  publishSegment?.addAnnotation('source', payload.source);
  publishSegment?.addAnnotation('type', payload.type);

  try {
    // Publish event to EventBridge
    const command = new PutEventsCommand({
      Entries: [
        {
          Source: payload.source,
          DetailType: payload.type,
          Detail: JSON.stringify({
            ...payload.detail,
            traceId,
            timestamp: new Date().toISOString()
          }),
          EventBusName: EVENT_BUS_NAME
        }
      ]
    });

    const response = await eventBridgeClient.send(command);

    logger.info('Event published to EventBridge', {
      source: payload.source,
      type: payload.type,
      eventBusName: EVENT_BUS_NAME,
      failedEntryCount: response.FailedEntryCount || 0
    });

    // Check for failed entries
    if (response.FailedEntryCount && response.FailedEntryCount > 0) {
      const failedError = new Error('Failed to publish some events');
      logger.error('Failed to publish some events', failedError, {
        failedEntries: response.Entries
      });

      publishSegment?.addMetadata('failedEntries', response.Entries);
      publishSegment?.close();

      return buildResponse(500, {
        error: 'Event Publication Failed',
        message: 'Failed to publish event to EventBridge'
      }, traceId);
    }

    publishSegment?.close();

    return buildResponse(202, {
      message: 'Event accepted for processing',
      eventBusName: EVENT_BUS_NAME,
      source: payload.source,
      type: payload.type
    }, traceId);

  } catch (error) {
    const errorDetails: Record<string, any> = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : { error };
    logger.error('Error publishing event to EventBridge', error as Error, errorDetails);

    if (publishSegment && error instanceof Error) {
      publishSegment.addError(error);
    }
    publishSegment?.close();

    throw error;
  }
}

/**
 * Helper function to build consistent API responses
 */
function buildResponse(
  statusCode: number,
  body: Record<string, any>,
  traceId?: string
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'X-Trace-Id': traceId || ''
    },
    body: JSON.stringify({
      ...body,
      traceId
    })
  };
}
