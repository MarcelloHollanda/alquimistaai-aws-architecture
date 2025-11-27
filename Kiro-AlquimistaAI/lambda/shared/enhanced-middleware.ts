import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Logger, EnhancedLogger, createLogger } from './logger';
import { tracer, EnhancedXRayTracer, createTracer, extractXRayContext, extractLogContext } from './xray-tracer';

export interface EnhancedContext {
  logger: Logger;
  tracer: typeof tracer;
  event: APIGatewayProxyEvent;
  lambdaContext: Context;
}

export type EnhancedHandler = (ctx: EnhancedContext) => Promise<APIGatewayProxyResult>;

/**
 * Middleware que adiciona logging e tracing avançados automaticamente
 */
export function withEnhancedObservability(
  serviceName: string,
  handler: EnhancedHandler
) {
  return async (
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> => {
    // Extrair contexto de trace dos headers
    const headers = event.headers || {};
    const logContext = extractLogContext(headers);
    const traceContext = extractXRayContext(headers);

    // Criar logger e tracer com contexto
    const logger = createLogger(serviceName, {
      ...logContext,
      operation: `${event.httpMethod} ${event.path}`,
      userId: event.requestContext?.authorizer?.claims?.sub,
      tenantId: headers['x-tenant-id'] || headers['X-Tenant-Id']
    });

    const tracer = createTracer(serviceName);

    // Log da requisição recebida
    logger.info('Request received', {
      operation: 'request.received',
      customMetrics: {
        httpMethod: event.httpMethod,
        path: event.path,
        userAgent: headers['user-agent'] || headers['User-Agent'],
        sourceIp: event.requestContext?.identity?.sourceIp
      }
    });

    const startTime = Date.now();

    try {
      // Executar handler com trace automático
      const result = await handler({
        logger,
        tracer,
        event,
        lambdaContext: context
      });

      const duration = Date.now() - startTime;

      // Log da resposta bem-sucedida
      logger.logApiRequest(
        event.httpMethod,
        event.path,
        {
          statusCode: result.statusCode,
          duration
        }
      );

      // Adicionar headers de trace na resposta
      return {
        ...result,
        headers: {
          ...result.headers,
          ...(traceContext.traceId ? { 'X-Trace-Id': traceContext.traceId } : {})
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log do erro
      logger.error('Request failed', error as Error, {
        operation: 'request.failed',
        duration,
        statusCode: 500,
        customMetrics: {
          httpMethod: event.httpMethod,
          path: event.path,
          errorType: (error as Error).name
        }
      });

      // Retornar erro com headers de trace
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          ...(traceContext.traceId ? { 'X-Trace-Id': traceContext.traceId } : {})
        },
        body: JSON.stringify({
          error: 'Internal Server Error',
          ...(traceContext.traceId ? { traceId: traceContext.traceId } : {})
        })
      };
    }
  };
}

/**
 * Middleware simplificado para funções internas (não-HTTP)
 */
export function withEnhancedLogging<TEvent, TResult>(
  serviceName: string,
  handler: (event: TEvent, logger: EnhancedLogger, tracer: EnhancedXRayTracer) => Promise<TResult>
) {
  return async (event: TEvent, context: Context): Promise<TResult> => {
    const logger = createLogger(serviceName, {
      traceId: context.awsRequestId
    });
    const tracer = createTracer(serviceName);

    logger.info('Function invoked', {
      operation: 'function.invoked',
      customMetrics: {
        functionName: context.functionName,
        eventType: typeof event
      }
    });

    const startTime = Date.now();

    try {
      const result = await handler(event, logger, tracer);

      const duration = Date.now() - startTime;
      logger.finishOperation(true, { duration });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.finishOperation(false, { 
        duration,
        errorMessage: (error as Error).message
      });
      throw error;
    }
  };
}
