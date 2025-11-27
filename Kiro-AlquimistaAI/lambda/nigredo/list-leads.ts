/**
 * Nigredo Prospecting Core - List Leads Lambda
 * 
 * GET /api/leads
 * Protected endpoint for listing leads with pagination and filters
 * 
 * Requirements: 6.2, 6.4, 7.1, 7.3
 */

import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from 'aws-lambda';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { Logger } from '../shared/logger';
import { getClient } from '../shared/database';
import { v4 as uuidv4 } from 'uuid';
import {
  traceSubsegment,
  traceQuery,
  addAnnotations,
  addMetadata,
} from '../shared/xray-tracer';
import { z } from 'zod';

// Initialize metrics and logger
const metrics = new Metrics({
  namespace: 'Nigredo/Prospecting',
  serviceName: 'nigredo-list-leads',
});
const logger = new Logger('nigredo-list-leads');

// Environment variables
const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000000';

// Query parameters schema
const ListLeadsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().optional(),
  source: z.string().optional(),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
  search: z.string().min(2).max(100).optional(),
});

type ListLeadsQuery = z.infer<typeof ListLeadsQuerySchema>;

interface Lead {
  id: string;
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
  created_at: Date;
  updated_at: Date;
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
    operation: 'list-leads',
  });

  const startTime = Date.now();

  try {
    logger.info('Processing list leads request', {
      correlationId,
      requestId: context.awsRequestId,
    });

    // ========================================================================
    // 1. Extract and validate tenant ID from JWT
    // ========================================================================
    
    const tenantId = await traceSubsegment(
      'ExtractTenantId',
      () => {
        // Extract tenant ID from JWT claims
        // For now, use default tenant ID (will be updated when Cognito is integrated)
        const tid = DEFAULT_TENANT_ID;
        
        logger.info('Tenant ID extracted', {
          correlationId,
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
    // 2. Parse and validate query parameters
    // ========================================================================
    
    const queryParams = await traceSubsegment(
      'ValidateQueryParams',
      () => {
        const params = event.queryStringParameters || {};
        
        try {
          const validated = ListLeadsQuerySchema.parse(params);
          
          logger.info('Query parameters validated', {
            correlationId,
            params: validated,
          });

          addMetadata({
            queryParams: validated,
          }, 'request');

          return validated;
        } catch (error) {
          if (error instanceof z.ZodError) {
            logger.warn('Query parameter validation failed', {
              correlationId,
              errors: error.errors,
            });

            throw new Error('Invalid query parameters');
          }
          throw error;
        }
      },
      { operation: 'validate_params' }
    );

    // ========================================================================
    // 3. Build dynamic SQL query with filters
    // ========================================================================
    
    const { query, countQuery, values } = await traceSubsegment(
      'BuildQuery',
      () => {
        const conditions: string[] = ['tenant_id = $1'];
        const queryValues: any[] = [tenantId];
        let paramIndex = 2;

        // Add status filter
        if (queryParams.status) {
          conditions.push(`status = $${paramIndex}`);
          queryValues.push(queryParams.status);
          paramIndex++;
        }

        // Add source filter
        if (queryParams.source) {
          conditions.push(`source = $${paramIndex}`);
          queryValues.push(queryParams.source);
          paramIndex++;
        }

        // Add date range filters
        if (queryParams.from_date) {
          conditions.push(`created_at >= $${paramIndex}`);
          queryValues.push(queryParams.from_date);
          paramIndex++;
        }

        if (queryParams.to_date) {
          conditions.push(`created_at <= $${paramIndex}`);
          queryValues.push(queryParams.to_date);
          paramIndex++;
        }

        // Add search filter
        if (queryParams.search) {
          conditions.push(`(
            name ILIKE $${paramIndex} OR 
            email ILIKE $${paramIndex} OR 
            company ILIKE $${paramIndex}
          )`);
          queryValues.push(`%${queryParams.search}%`);
          paramIndex++;
        }

        const whereClause = conditions.join(' AND ');
        const offset = (queryParams.page - 1) * queryParams.limit;

        const selectQuery = `
          SELECT 
            id, name, email, phone, company, message,
            source, utm_source, utm_medium, utm_campaign,
            status, created_at, updated_at
          FROM nigredo_leads.leads
          WHERE ${whereClause}
          ORDER BY created_at DESC
          LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        const countSql = `
          SELECT COUNT(*) as total
          FROM nigredo_leads.leads
          WHERE ${whereClause}
        `;

        queryValues.push(queryParams.limit, offset);

        logger.info('Query built', {
          correlationId,
          conditions: conditions.length,
          hasSearch: !!queryParams.search,
        });

        return {
          query: selectQuery,
          countQuery: countSql,
          values: queryValues,
        };
      },
      { operation: 'build_query' }
    );

    // ========================================================================
    // 4. Execute database queries
    // ========================================================================
    
    const { leads, total } = await traceSubsegment(
      'QueryDatabase',
      async () => {
        const client = await getClient();

        try {
          // Get total count
          const countResult = await traceQuery(
            'CountLeads',
            () => client.query(countQuery, values.slice(0, -2)),
            { tenantId }
          );

          const totalCount = parseInt(countResult.rows[0].total, 10);

          // Get leads
          const leadsResult = await traceQuery(
            'SelectLeads',
            () => client.query(query, values),
            {
              tenantId,
              page: queryParams.page,
              limit: queryParams.limit,
            }
          );

          const leadsData: Lead[] = leadsResult.rows;

          logger.info('Leads queried successfully', {
            correlationId,
            count: leadsData.length,
            total: totalCount,
          });

          return {
            leads: leadsData,
            total: totalCount,
          };
        } finally {
          client.release();
        }
      },
      {
        operation: 'database',
        tenantId,
      }
    );

    // ========================================================================
    // 5. Build response with pagination metadata
    // ========================================================================
    
    const totalPages = Math.ceil(total / queryParams.limit);

    const response = {
      leads,
      pagination: {
        page: queryParams.page,
        limit: queryParams.limit,
        total,
        total_pages: totalPages,
        has_next: queryParams.page < totalPages,
        has_prev: queryParams.page > 1,
      },
    };

    // ========================================================================
    // 6. Emit metrics and return response
    // ========================================================================
    
    const duration = Date.now() - startTime;
    
    metrics.addMetric('ListLeadsSuccess', MetricUnit.Count, 1);
    metrics.addMetric('ListLeadsDuration', MetricUnit.Milliseconds, duration);
    metrics.addMetric('LeadsReturned', MetricUnit.Count, leads.length);
    metrics.publishStoredMetrics();

    addAnnotations({
      status: 'success',
      leadsCount: leads.length,
    });

    addMetadata({
      pagination: response.pagination,
    }, 'response');

    logger.info('List leads completed successfully', {
      correlationId,
      count: leads.length,
      total,
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
    logger.error('Error listing leads', error as Error, {
      correlationId,
    });

    addAnnotations({
      error: true,
      status: 'error',
    });

    metrics.addMetric('ListLeadsError', MetricUnit.Count, 1);
    metrics.publishStoredMetrics();

    // Handle specific error types
    if (error.message === 'Invalid query parameters') {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-Id': correlationId,
          'X-Request-Id': context.awsRequestId,
        },
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Invalid query parameters',
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
        message: 'Failed to list leads',
        requestId: correlationId,
      }),
    };
  }
};
