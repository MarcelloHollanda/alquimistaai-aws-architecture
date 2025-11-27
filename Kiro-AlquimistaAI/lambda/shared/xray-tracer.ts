import { Tracer } from '@aws-lambda-powertools/tracer';
import { Segment, Subsegment } from 'aws-xray-sdk-core';

/**
 * X-Ray Tracer utility for standardized distributed tracing
 * 
 * Features:
 * - Automatic subsegment creation and management
 * - Standardized annotations for filtering (leadId, tenantId, agent)
 * - Metadata capture for debugging
 * - Error tracking with stack traces
 * - Integration with Lambda Powertools
 * 
 * Requirements: 15.6
 */

// Initialize Powertools Tracer
const tracer = new Tracer({
  serviceName: process.env.POWERTOOLS_SERVICE_NAME || 'fibonacci-service'
});

/**
 * Standard annotations for X-Ray filtering
 */
export interface XRayAnnotations {
  leadId?: string;
  tenantId?: string;
  agent?: string;
  traceId?: string;
  status?: 'success' | 'error' | 'warning';
  [key: string]: string | number | boolean | undefined;
}

/**
 * Metadata for debugging (not indexed, can be any structure)
 */
export interface XRayMetadata {
  [key: string]: any;
}

/**
 * Get the current X-Ray tracer instance
 */
export function getTracer(): Tracer {
  return tracer;
}

/**
 * Type alias for enhanced X-Ray tracer
 */
export type EnhancedXRayTracer = Tracer;

/**
 * Create a tracer instance
 */
export function createTracer(serviceName?: string): Tracer {
  return new Tracer({
    serviceName: serviceName || process.env.POWERTOOLS_SERVICE_NAME || 'fibonacci-service'
  });
}

/**
 * Extract X-Ray context from headers
 */
export function extractXRayContext(headers: Record<string, string | undefined>): { traceId?: string; parentId?: string } {
  const traceHeader = headers['X-Amzn-Trace-Id'] || headers['x-amzn-trace-id'];
  if (!traceHeader) {
    return {};
  }

  const parts = traceHeader.split(';');
  const context: { traceId?: string; parentId?: string } = {};

  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 'Root') {
      context.traceId = value;
    } else if (key === 'Parent') {
      context.parentId = value;
    }
  }

  return context;
}

/**
 * Extract log context from headers
 */
export function extractLogContext(headers: Record<string, string | undefined>): { traceId?: string; requestId?: string } {
  return {
    traceId: headers['X-Amzn-Trace-Id'] || headers['x-amzn-trace-id'],
    requestId: headers['X-Request-Id'] || headers['x-request-id']
  };
}

/**
 * Get the current X-Ray segment
 */
export function getSegment(): Segment | Subsegment | undefined {
  try {
    return tracer.getSegment();
  } catch (error) {
    console.warn('Failed to get X-Ray segment:', error);
    return undefined;
  }
}

/**
 * Create a new subsegment for a specific operation
 * 
 * @param name - Name of the subsegment (e.g., 'ProcessLead', 'EnrichData')
 * @param annotations - Standard annotations for filtering
 * @param metadata - Additional metadata for debugging
 * @returns Subsegment instance or undefined if tracing is disabled
 * 
 * @example
 * const subsegment = createSubsegment('ProcessLead', {
 *   leadId: lead.id,
 *   tenantId: lead.tenantId,
 *   agent: 'recebimento'
 * });
 * 
 * try {
 *   // Your code here
 *   closeSubsegment(subsegment, 'success');
 * } catch (error) {
 *   closeSubsegment(subsegment, 'error', error);
 *   throw error;
 * }
 */
export function createSubsegment(
  name: string,
  annotations?: XRayAnnotations,
  metadata?: XRayMetadata
): Subsegment | undefined {
  try {
    const segment = getSegment();
    if (!segment) {
      return undefined;
    }

    const subsegment = segment.addNewSubsegment(name);

    // Add standard annotations for filtering
    if (annotations) {
      for (const [key, value] of Object.entries(annotations)) {
        if (value !== undefined) {
          subsegment.addAnnotation(key, value);
        }
      }
    }

    // Add metadata for debugging
    if (metadata) {
      for (const [key, value] of Object.entries(metadata)) {
        subsegment.addMetadata(key, value);
      }
    }

    return subsegment;
  } catch (error) {
    console.warn('Failed to create X-Ray subsegment:', error);
    return undefined;
  }
}

/**
 * Close a subsegment with status and optional error
 * 
 * @param subsegment - Subsegment to close
 * @param status - Status of the operation ('success' or 'error')
 * @param error - Optional error object if status is 'error'
 */
export function closeSubsegment(
  subsegment: Subsegment | undefined,
  status: 'success' | 'error' = 'success',
  error?: Error
): void {
  if (!subsegment) {
    return;
  }

  try {
    // Add status annotation
    subsegment.addAnnotation('status', status);

    // Add error if present
    if (error) {
      subsegment.addError(error);
      subsegment.addMetadata('error', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }

    subsegment.close();
  } catch (err) {
    console.warn('Failed to close X-Ray subsegment:', err);
  }
}

/**
 * Execute a function within a traced subsegment
 * Automatically handles subsegment creation, error tracking, and cleanup
 * 
 * @param name - Name of the subsegment
 * @param fn - Function to execute
 * @param annotations - Standard annotations for filtering
 * @param metadata - Additional metadata for debugging
 * @returns Result of the function
 * 
 * @example
 * const result = await traceSubsegment(
 *   'EnrichLead',
 *   async () => {
 *     return await enrichmentService.enrich(lead);
 *   },
 *   { leadId: lead.id, tenantId: lead.tenantId },
 *   { leadData: lead }
 * );
 */
export async function traceSubsegment<T>(
  name: string,
  fn: () => Promise<T> | T,
  annotations?: XRayAnnotations,
  metadata?: XRayMetadata
): Promise<T> {
  const subsegment = createSubsegment(name, annotations, metadata);

  try {
    const result = await fn();
    closeSubsegment(subsegment, 'success');
    return result;
  } catch (error) {
    closeSubsegment(subsegment, 'error', error as Error);
    throw error;
  }
}

/**
 * Add annotations to the current segment or subsegment
 * 
 * @param annotations - Annotations to add
 */
export function addAnnotations(annotations: XRayAnnotations): void {
  try {
    const segment = getSegment();
    if (!segment) {
      return;
    }

    for (const [key, value] of Object.entries(annotations)) {
      if (value !== undefined) {
        segment.addAnnotation(key, value);
      }
    }
  } catch (error) {
    console.warn('Failed to add X-Ray annotations:', error);
  }
}

/**
 * Add metadata to the current segment or subsegment
 * 
 * @param metadata - Metadata to add
 * @param namespace - Optional namespace for organizing metadata
 */
export function addMetadata(metadata: XRayMetadata, namespace?: string): void {
  try {
    const segment = getSegment();
    if (!segment) {
      return;
    }

    if (namespace) {
      segment.addMetadata(namespace, metadata);
    } else {
      for (const [key, value] of Object.entries(metadata)) {
        segment.addMetadata(key, value);
      }
    }
  } catch (error) {
    console.warn('Failed to add X-Ray metadata:', error);
  }
}

/**
 * Capture an AWS SDK v3 client for automatic X-Ray tracing
 * 
 * @param client - AWS SDK v3 client instance
 * @returns Traced client
 * 
 * @example
 * const dynamoClient = captureAWSClient(new DynamoDBClient({}));
 */
export function captureAWSClient<T>(client: T): T {
  try {
    return tracer.captureAWSv3Client(client);
  } catch (error) {
    console.warn('Failed to capture AWS client for X-Ray:', error);
    return client;
  }
}

/**
 * Wrapper for Lambda handlers to automatically trace execution
 * 
 * @param handler - Lambda handler function
 * @returns Wrapped handler with X-Ray tracing
 * 
 * @example
 * export const handler = withXRayTracing(async (event, context) => {
 *   // Your handler code here
 * });
 */
export function withXRayTracing<TEvent, TResult>(
  handler: (event: TEvent, context: any) => Promise<TResult>
): (event: TEvent, context: any) => Promise<TResult> {
  return async (event: TEvent, context: any): Promise<TResult> => {
    const segment = getSegment();
    
    // Add standard annotations
    addAnnotations({
      functionName: context.functionName,
      functionVersion: context.functionVersion,
      requestId: context.awsRequestId
    });

    // Add event metadata (be careful with sensitive data)
    addMetadata({
      eventType: (event as any).Records ? 'SQS' : 'API',
      timestamp: new Date().toISOString()
    }, 'handler');

    try {
      const result = await handler(event, context);
      addAnnotations({ status: 'success' });
      return result;
    } catch (error) {
      addAnnotations({ status: 'error' });
      if (segment && error instanceof Error) {
        segment.addError(error);
      }
      throw error;
    }
  };
}

/**
 * Helper to trace database queries
 * 
 * @param queryName - Name of the query (e.g., 'GetLead', 'SaveLead')
 * @param query - Query function to execute
 * @param params - Query parameters for metadata
 * @returns Query result
 */
export async function traceQuery<T>(
  queryName: string,
  query: () => Promise<T>,
  params?: Record<string, any>
): Promise<T> {
  return traceSubsegment(
    `DB:${queryName}`,
    query,
    { operation: 'database' },
    { queryParams: params }
  );
}

/**
 * Helper to trace HTTP/API calls
 * 
 * @param serviceName - Name of the external service (e.g., 'WhatsApp', 'Calendar')
 * @param operation - Operation name (e.g., 'sendMessage', 'createEvent')
 * @param call - API call function to execute
 * @param params - Call parameters for metadata
 * @returns API call result
 */
export async function traceAPICall<T>(
  serviceName: string,
  operation: string,
  call: () => Promise<T>,
  params?: Record<string, any>
): Promise<T> {
  return traceSubsegment(
    `API:${serviceName}:${operation}`,
    call,
    { 
      operation: 'external_api',
      service: serviceName
    },
    { callParams: params }
  );
}

/**
 * Helper to trace MCP calls
 * 
 * @param server - MCP server name (e.g., 'whatsapp', 'calendar')
 * @param method - MCP method name
 * @param call - MCP call function to execute
 * @param params - Call parameters for metadata
 * @returns MCP call result
 */
export async function traceMCPCall<T>(
  server: string,
  method: string,
  call: () => Promise<T>,
  params?: Record<string, any>
): Promise<T> {
  return traceSubsegment(
    `MCP:${server}:${method}`,
    call,
    { 
      operation: 'mcp',
      mcpServer: server,
      mcpMethod: method
    },
    { mcpParams: params }
  );
}

/**
 * Export tracer instance for direct use if needed
 */
export { tracer };
