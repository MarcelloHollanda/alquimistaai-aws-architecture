/**
 * Nigredo Prospecting Core - Create Lead Lambda
 * 
 * POST /api/leads
 * Public endpoint for lead form submissions
 * 
 * Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 5.3, 5.4, 7.1, 7.2, 7.3
 */

import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from 'aws-lambda';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { Logger } from '../shared/logger';
import { getClient } from '../shared/database';
import { v4 as uuidv4 } from 'uuid';
import {
  getTracer,
  traceSubsegment,
  traceQuery,
  traceAPICall,
  addAnnotations,
  addMetadata,
} from '../shared/xray-tracer';

// Import shared utilities
import {
  CreateLeadSchema,
  validateInput,
  createValidationErrorResponse,
  extractIPAddress,
  extractUserAgent,
  extractReferer,
} from './shared/validation-schemas';

import {
  enforceRateLimit,
  createRateLimitErrorResponse,
  RateLimitError,
} from './shared/rate-limiter';

import {
  sendWebhook,
  createLeadCreatedPayload,
} from './shared/webhook-sender';

// Initialize tracer and metrics
const tracer = getTracer();
const metrics = new Metrics({
  namespace: 'Nigredo/Prospecting',
  serviceName: 'nigredo-create-lead',
});
const logger = new Logger('nigredo-create-lead');

// Environment variables
const FIBONACCI_WEBHOOK_URL = process.env.FIBONACCI_WEBHOOK_URL || '';
const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000000';

/**
 * Main Lambda handler
 */
export const handler = async (
  event: APIGatewayProxyEventV2,
  context: Context
): Promise<APIGatewayProxyResultV2> => {
  // Generate correlation ID for request tracking
  const correlationId = uuidv4();
  
  // Update logger context with correlation ID
  logger.updateContext({
    traceId: correlationId,
    requestId: context.awsRequestId,
    functionName: context.functionName,
  });

  // Add X-Ray annotations for filtering
  addAnnotations({
    correlationId,
    service: 'nigredo-prospecting',
    operation: 'create-lead',
  });

  // Start timing for performance metrics
  const startTime = Date.now();

  try {
    logger.info('Processing lead creation request', {
      correlationId,
      requestId: context.awsRequestId,
      functionName: context.functionName,
    });

    // ========================================================================
    // 1. Extract request metadata
    // ========================================================================
    
    const ipAddress = await traceSubsegment(
      'ExtractRequestMetadata',
      () => {
        const ip = extractIPAddress(event);
        const ua = extractUserAgent(event);
        const ref = extractReferer(event);
        
        logger.info('Request metadata extracted', {
          correlationId,
          ipAddress: ip,
          userAgent: ua,
          referer: ref,
        });

        // Add metadata for debugging
        addMetadata({
          ipAddress: ip,
          userAgent: ua,
          referer: ref,
        }, 'request');

        return { ip, ua, ref };
      },
      { operation: 'extract_metadata' }
    );

    const userAgent = ipAddress.ua;
    const referer = ipAddress.ref;
    const ip = ipAddress.ip;

    // Add annotations for filtering in X-Ray
    addAnnotations({
      ipAddress: ip,
      hasReferer: !!referer,
    });

    // ========================================================================
    // 2. Check rate limit
    // ========================================================================
    
    try {
      await traceSubsegment(
        'CheckRateLimit',
        async () => {
          await enforceRateLimit(ip);
          logger.info('Rate limit check passed', { correlationId, ipAddress: ip });
        },
        { operation: 'rate_limit_check', ipAddress: ip }
      );

      // Emit metric for successful rate limit check
      metrics.addMetric('RateLimitCheckPassed', MetricUnit.Count, 1);
    } catch (error) {
      if (error instanceof RateLimitError) {
        logger.warn('Rate limit exceeded', {
          correlationId,
          ipAddress: ip,
          currentCount: error.result.currentCount,
          limitCount: error.result.limitCount,
        });

        // Add annotation for filtering rate-limited requests
        addAnnotations({
          rateLimitExceeded: true,
          status: 'error',
        });

        // Emit metric for rate limit exceeded
        metrics.addMetric('RateLimitExceeded', MetricUnit.Count, 1);
        metrics.publishStoredMetrics();

        return createRateLimitErrorResponse(error);
      }
      throw error;
    }

    // ========================================================================
    // 3. Parse and validate request body
    // ========================================================================
    
    if (!event.body) {
      logger.warn('Missing request body', { correlationId });
      
      addAnnotations({
        validationFailed: true,
        status: 'error',
      });

      metrics.addMetric('ValidationError', MetricUnit.Count, 1);
      metrics.publishStoredMetrics();
      
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Correlation-Id': correlationId,
        },
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Request body is required',
        }),
      };
    }

    let body: any;
    try {
      body = JSON.parse(event.body);
    } catch (error) {
      logger.warn('Invalid JSON in request body', { correlationId, error });
      
      addAnnotations({
        validationFailed: true,
        status: 'error',
      });

      metrics.addMetric('ValidationError', MetricUnit.Count, 1);
      metrics.publishStoredMetrics();
      
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Correlation-Id': correlationId,
        },
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Invalid JSON in request body',
        }),
      };
    }

    // Validate input using Zod schema
    const validation = await traceSubsegment(
      'ValidateInput',
      () => {
        const result = validateInput(CreateLeadSchema, body);
        
        if (!result.success) {
          logger.warn('Input validation failed', {
            correlationId,
            errors: result.errors.errors,
          });

          addAnnotations({
            validationFailed: true,
          });

          addMetadata({
            validationErrors: result.errors.errors,
          }, 'validation');
        } else {
          logger.info('Input validated successfully', { correlationId });
        }

        return result;
      },
      { operation: 'input_validation' }
    );
    
    if (!validation.success) {
      metrics.addMetric('ValidationError', MetricUnit.Count, 1);
      metrics.publishStoredMetrics();

      return createValidationErrorResponse(validation.errors);
    }

    const leadData = validation.data;

    // ========================================================================
    // 4. Insert lead into database
    // ========================================================================
    
    const leadId = uuidv4();
    const now = new Date();

    // Update logger context with lead ID
    logger.updateContext({ leadId });

    // Add lead ID annotation for X-Ray filtering
    addAnnotations({
      leadId,
      hasUtmSource: !!leadData.utmSource,
    });

    try {
      const lead = await traceSubsegment(
        'DatabaseTransaction',
        async () => {
          // Start database transaction
          const client = await getClient();
          
          try {
            await traceQuery(
              'BeginTransaction',
              () => client.query('BEGIN')
            );

            // Insert lead
            const insertLeadQuery = `
              INSERT INTO nigredo_leads.leads (
                id, tenant_id, name, email, phone, company, message,
                utm_source, utm_medium, utm_campaign,
                ip_address, user_agent, status, created_at, updated_at
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
              )
              RETURNING *
            `;

            const leadResult = await traceQuery(
              'InsertLead',
              () => client.query(insertLeadQuery, [
                leadId,
                DEFAULT_TENANT_ID,
                leadData.name,
                leadData.email,
                leadData.phone || null,
                leadData.company || null,
                leadData.message || null,
                leadData.utmSource || null,
                leadData.utmMedium || null,
                leadData.utmCampaign || null,
                ip,
                userAgent,
                'novo',
                now,
                now,
              ]),
              {
                leadId,
                email: leadData.email,
              }
            );

            const leadRecord = leadResult.rows[0];

            logger.info('Lead inserted into database', {
              correlationId,
              leadId,
              email: leadData.email,
            });

            // Insert form submission record
            const insertSubmissionQuery = `
              INSERT INTO nigredo_leads.form_submissions (
                lead_id, ip_address, user_agent, referer, source, form_type, submitted_at
              ) VALUES (
                $1, $2::INET, $3, $4, $5, $6, $7
              )
            `;

            await traceQuery(
              'InsertFormSubmission',
              () => client.query(insertSubmissionQuery, [
                leadId,
                ip,
                userAgent,
                referer || null,
                'landing_page',
                'contact',
                now,
              ]),
              { leadId }
            );

            logger.info('Form submission recorded', { correlationId, leadId });

            // Increment rate limit counter
            await traceQuery(
              'IncrementRateLimit',
              () => client.query('SELECT increment_rate_limit($1::INET)', [ip]),
              { ipAddress: ip }
            );

            logger.info('Rate limit incremented', { correlationId, ipAddress: ip });

            // Commit transaction
            await traceQuery(
              'CommitTransaction',
              () => client.query('COMMIT')
            );

            logger.info('Database transaction committed', { correlationId, leadId });

            return leadRecord;
          } catch (error) {
            // Rollback transaction on error
            await client.query('ROLLBACK');
            throw error;
          } finally {
            client.release();
          }
        },
        {
          operation: 'database',
          leadId,
        },
        {
          leadData: {
            email: leadData.email,
            hasPhone: !!leadData.phone,
            hasCompany: !!leadData.company,
          },
        }
      );

      // Emit metric for successful lead creation
      metrics.addMetric('LeadCreated', MetricUnit.Count, 1);
      
      // Emit metric by source if available
      if (leadData.utmSource) {
        metrics.addDimension('source', leadData.utmSource);
        metrics.addMetric('LeadCreatedBySource', MetricUnit.Count, 1);
      }

      // ====================================================================
      // 5. Send webhook to Fibonacci system
      // ====================================================================
      
      if (FIBONACCI_WEBHOOK_URL) {
        const webhookPayload = createLeadCreatedPayload({
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          message: lead.message,
          utm_source: lead.utm_source,
          utm_medium: lead.utm_medium,
          utm_campaign: lead.utm_campaign,
          ip_address: lead.ip_address,
          user_agent: lead.user_agent,
          created_at: lead.created_at,
        });

        logger.info('Sending webhook to Fibonacci', {
          correlationId,
          leadId,
          webhookUrl: FIBONACCI_WEBHOOK_URL,
        });

        // Send webhook asynchronously (don't wait for response)
        // Wrap in traceAPICall for X-Ray tracking
        traceAPICall(
          'Fibonacci',
          'sendLeadWebhook',
          () => sendWebhook(FIBONACCI_WEBHOOK_URL, webhookPayload, leadId),
          { leadId, webhookUrl: FIBONACCI_WEBHOOK_URL }
        )
          .then((response) => {
            if (response.success) {
              logger.info('Webhook sent successfully', {
                correlationId,
                leadId,
                attemptNumber: response.attemptNumber,
              });

              // Emit metric for successful webhook
              metrics.addMetric('WebhookSuccess', MetricUnit.Count, 1);
            } else {
              logger.warn('Webhook failed after retries', {
                correlationId,
                leadId,
                error: response.error,
                attemptNumber: response.attemptNumber,
              });

              // Emit metric for failed webhook
              metrics.addMetric('WebhookFailure', MetricUnit.Count, 1);
            }
          })
          .catch((error) => {
            logger.error('Webhook error', error as Error, {
              correlationId,
              leadId,
            });

            // Emit metric for webhook error
            metrics.addMetric('WebhookError', MetricUnit.Count, 1);
          });
      } else {
        logger.warn('Webhook URL not configured, skipping webhook', {
          correlationId,
          leadId,
        });

        // Emit metric for skipped webhook
        metrics.addMetric('WebhookSkipped', MetricUnit.Count, 1);
      }

      // ====================================================================
      // 6. Add final metadata and annotations
      // ====================================================================
      
      addMetadata({
        lead: {
          id: leadId,
          email: leadData.email,
          source: leadData.utmSource,
          hasPhone: !!leadData.phone,
          hasCompany: !!leadData.company,
        },
      }, 'result');

      addAnnotations({
        status: 'success',
      });

      // ====================================================================
      // 7. Calculate and emit performance metrics
      // ====================================================================
      
      const duration = Date.now() - startTime;
      metrics.addMetric('LeadCreationDuration', MetricUnit.Milliseconds, duration);

      logger.info('Lead created successfully', {
        correlationId,
        leadId,
        email: leadData.email,
        durationMs: duration,
      });

      // Publish all metrics
      metrics.publishStoredMetrics();

      // ====================================================================
      // 8. Return success response
      // ====================================================================
      
      return {
        statusCode: 201,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Correlation-Id': correlationId,
          'X-Request-Id': context.awsRequestId,
        },
        body: JSON.stringify({
          success: true,
          message: 'Lead created successfully',
          data: {
            id: leadId,
            createdAt: now.toISOString(),
          },
        }),
      };

    } catch (error: any) {
      logger.error('Error creating lead', error as Error, {
        correlationId,
        leadId,
      });

      addAnnotations({
        error: true,
        status: 'error',
      });

      // Emit error metric
      metrics.addMetric('LeadCreationError', MetricUnit.Count, 1);
      metrics.publishStoredMetrics();

      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Correlation-Id': correlationId,
          'X-Request-Id': context.awsRequestId,
        },
        body: JSON.stringify({
          error: 'Internal Server Error',
          message: 'Failed to create lead. Please try again later.',
          requestId: correlationId,
        }),
      };
    }

  } catch (error: any) {
    logger.error('Unexpected error in handler', error as Error, {
      correlationId,
    });

    addAnnotations({
      unexpectedError: true,
      status: 'error',
    });

    // Emit error metric
    metrics.addMetric('UnexpectedError', MetricUnit.Count, 1);
    metrics.publishStoredMetrics();

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Correlation-Id': correlationId,
        'X-Request-Id': context.awsRequestId,
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        requestId: correlationId,
      }),
    };
  }
};

