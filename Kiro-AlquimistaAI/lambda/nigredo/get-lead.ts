/**
 * Nigredo Prospecting Core - Get Lead Lambda
 * 
 * GET /api/leads/{id}
 * Protected endpoint for retrieving individual lead details
 * 
 * Requirements: 6.3, 6.4, 7.1, 7.3
 */

import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from 'aws-lambda';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { Logger } from '../shared/logger';
import { getClient } from '../shared/database';
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';
import {
  traceSubsegment,
  traceQuery,
  addAnnotations,
  addMetadata,
} from '../shared/xray-tracer';

// Initialize metrics and logger
const metrics = new Metrics({
  namespace: 'Nigredo/Prospecting',
  serviceName: 'nigredo-get-lead',
});
const logger = new Logger('nigredo-get-lead');

// Environment variables
const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000000';

interface Lead {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  message: string;
  source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  status: string;
  ip_address: string;
  user_agent: string;
  created_at: Date;
  updated_at: Date;
}

interface WebhookLog {
  id: string;
  webhook_url: string;
  status_code: number | null;
  attempt_number: number;
  success: boolean;
  error_message: string | null;
  sent_at: Date;
}

/**
 * Main Lambda handler
 */
export const handler = async (
  event: APIGatewayProxyEventV2,
  context: Context
): Promise<APIGatewayProxyResultV2> => {
  const correlationId = uuidv4();
  
  logger.updateContext({
    traceId: correlationId,
    requestId: context.awsRequestId,
    functionName: context.functionName,
  });

  addAnnotations({
    correlationId,
    service: 'nigredo-prospecting',
    operation: 'get-lead',
  });

  const startTime = Date.now();

  try {
    logger.info('Processing get lead request', {
      correlationId,
      requestId: context.awsRequestId,
    });

    // ========================================================================
    // 1. Extract and validate lead ID from path parameter
    // ========================================================================
    
    const leadId = await traceSubsegment(
      'ValidateLeadId',
      () => {
        const id = event.pathParameters?.id;
        
        if (!id) {
          throw new Error('MISSING_LEAD_ID');
        }

        if (!uuidValidate(id)) {
          throw new Error('INVALID_LEAD_ID');
        }

        logger.info('Lead ID validated', {
          correlationId,
          leadId: id,
        });

        addAnnotations({
          leadId: id,
        });

        return id;
      },
      { operation: 'validate_lead_id' }
    );

    // Update logger context with lead ID
    logger.updateContext({ leadId });

    // ========================================================================
    // 2. Extract tenant ID (for authorization)
    // ========================================================================
    
    const tenantId = await traceSubsegment(
      'ExtractTenantId',
      () => {
        // For now, use default tenant ID (will be updated when Cognito is integrated)
        const tid = DEFAULT_TENANT_ID;
        
        logger.info('Tenant ID extracted', {
          correlationId,
          leadId,
          tenantId: tid,
        });

        addAnnotations({
          tenantId: tid,
        });

        return tid;
      },
      { operation: 'extract_tenant' }
    );

    // ========================================================================
    // 3. Query lead details from database
    // ========================================================================
    
    const lead = await traceSubsegment(
      'QueryLead',
      async () => {
        const client = await getClient();

        try {
          const leadQuery = `
            SELECT 
              id, tenant_id, name, email, phone, company, message,
              source, utm_source, utm_medium, utm_campaign,
              status, ip_address, user_agent, created_at, updated_at
            FROM nigredo_leads.leads
            WHERE id = $1 AND tenant_id = $2
          `;

          const result = await traceQuery(
            'SelectLead',
            () => client.query(leadQuery, [leadId, tenantId]),
            { leadId, tenantId }
          );

          if (result.rows.length === 0) {
            throw new Error('LEAD_NOT_FOUND');
          }

          const leadData: Lead = result.rows[0];

          logger.info('Lead retrieved successfully', {
            correlationId,
            leadId,
            email: leadData.email,
          });

          return leadData;
        } finally {
          client.release();
        }
      },
      {
        operation: 'database',
        leadId,
        tenantId,
      }
    );

    // ========================================================================
    // 4. Query webhook history for the lead
    // ========================================================================
    
    const webhookHistory = await traceSubsegment(
      'QueryWebhookHistory',
      async () => {
        const client = await getClient();

        try {
          const webhookQuery = `
            SELECT 
              id, webhook_url, status_code, attempt_number,
              success, error_message, sent_at
            FROM nigredo_leads.webhook_logs
            WHERE lead_id = $1
            ORDER BY sent_at DESC
            LIMIT 10
          `;

          const result = await traceQuery(
            'SelectWebhookLogs',
            () => client.query(webhookQuery, [leadId]),
            { leadId }
          );

          const logs: WebhookLog[] = result.rows;

          logger.info('Webhook history retrieved', {
            correlationId,
            leadId,
            webhookCount: logs.length,
          });

          return logs;
        } finally {
          client.release();
        }
      },
      {
        operation: 'database',
        leadId,
      }
    );

    // ========================================================================
    // 5. Build response
    // ========================================================================
    
    const response = {
      lead: {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        message: lead.message,
        source: lead.source,
        utm_params: {
          utm_source: lead.utm_source,
          utm_medium: lead.utm_medium,
          utm_campaign: lead.utm_campaign,
        },
        status: lead.status,
        created_at: lead.created_at,
        updated_at: lead.updated_at,
      },
      webhook_history: webhookHistory.map(log => ({
        id: log.id,
        webhook_url: log.webhook_url,
        status_code: log.status_code,
        attempt_number: log.attempt_number,
        success: log.success,
        error_message: log.error_message,
        sent_at: log.sent_at,
      })),
    };

    // ========================================================================
    // 6. Emit metrics and return response
    // ========================================================================
    
    const duration = Date.now() - startTime;
    
    metrics.addMetric('GetLeadSuccess', MetricUnit.Count, 1);
    metrics.addMetric('GetLeadDuration', MetricUnit.Milliseconds, duration);
    metrics.publishStoredMetrics();

    addAnnotations({
      status: 'success',
      hasWebhookHistory: webhookHistory.length > 0,
    });

    addMetadata({
      lead: {
        id: lead.id,
        status: lead.status,
        webhookCount: webhookHistory.length,
      },
    }, 'response');

    logger.info('Get lead completed successfully', {
      correlationId,
      leadId,
      durationMs: duration,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-Id': correlationId,
        'X-Request-Id': context.awsRequestId,
      },
      body: JSON.stringify(response),
    };

  } catch (error: any) {
    logger.error('Error getting lead', error as Error, {
      correlationId,
    });

    addAnnotations({
      error: true,
      status: 'error',
    });

    metrics.addMetric('GetLeadError', MetricUnit.Count, 1);
    metrics.publishStoredMetrics();

    // Handle specific error types
    if (error.message === 'MISSING_LEAD_ID') {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-Id': correlationId,
          'X-Request-Id': context.awsRequestId,
        },
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Lead ID is required',
          requestId: correlationId,
        }),
      };
    }

    if (error.message === 'INVALID_LEAD_ID') {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-Id': correlationId,
          'X-Request-Id': context.awsRequestId,
        },
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Invalid lead ID format',
          requestId: correlationId,
        }),
      };
    }

    if (error.message === 'LEAD_NOT_FOUND') {
      metrics.addMetric('LeadNotFound', MetricUnit.Count, 1);
      
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-Id': correlationId,
          'X-Request-Id': context.awsRequestId,
        },
        body: JSON.stringify({
          error: 'Not Found',
          message: 'Lead not found',
          requestId: correlationId,
        }),
      };
    }

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-Id': correlationId,
        'X-Request-Id': context.awsRequestId,
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to retrieve lead',
        requestId: correlationId,
      }),
    };
  }
};
