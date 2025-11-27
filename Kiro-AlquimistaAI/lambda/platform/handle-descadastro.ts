/**
 * Handle Descadastro API
 * 
 * Provides API endpoint for processing LGPD descadastro (unsubscribe) requests
 * 
 * Requirements: 17.8, 11.12
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { withSimpleErrorHandling } from '../shared/error-handler';
import { Logger } from '../shared/logger';
import { getPool } from '../shared/database';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { handleDescadastro } from '../shared/lgpd-compliance';

/**
 * Descadastro request schema validation
 */
const DescadastroRequestSchema = z.object({
  leadId: z.string().uuid('Lead ID must be a valid UUID'),
  reason: z.string().optional().default('Solicitação do lead'),
  email: z.string().email().optional(),
  telefone: z.string().optional()
}).refine(
  (data) => data.leadId || data.email || data.telefone,
  {
    message: 'Pelo menos leadId, email ou telefone deve ser fornecido',
    path: ['leadId']
  }
);

type DescadastroRequest = z.infer<typeof DescadastroRequestSchema>;

/**
 * Handle Descadastro API Handler
 * 
 * POST /api/lgpd/descadastro
 * 
 * Body:
 * {
 *   "leadId": "uuid",
 *   "reason": "optional reason",
 *   "email": "optional@email.com",
 *   "telefone": "+5511999999999"
 * }
 * 
 * Requirements: 17.8, 11.12
 */
export const handler = withSimpleErrorHandling(
  async (event: APIGatewayProxyEvent, context: Context, logger: Logger): Promise<APIGatewayProxyResult> => {
    const traceId = uuidv4();
    logger.setTraceId(traceId);

    logger.info('Handle Descadastro API iniciado', {
      functionName: context.functionName,
      traceId
    });

    try {
      // Parse and validate request body
      if (!event.body) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            error: 'Request body is required',
            traceId
          })
        };
      }

      const body = JSON.parse(event.body);
      const validationResult = DescadastroRequestSchema.safeParse(body);

      if (!validationResult.success) {
        logger.warn('Invalid descadastro request', {
          errors: validationResult.error.errors,
          traceId
        });

        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            error: 'Invalid request',
            details: validationResult.error.errors,
            traceId
          })
        };
      }

      const request = validationResult.data;

      logger.info('Processing descadastro request', {
        leadId: request.leadId,
        reason: request.reason,
        traceId
      });

      // Get database pool
      const db = await getPool();

      // If leadId is not provided, find it by email or telefone
      let leadId = request.leadId;

      if (!leadId && (request.email || request.telefone)) {
        const result = await db.query(
          `SELECT id FROM nigredo_leads.leads
           WHERE ($1::VARCHAR IS NOT NULL AND email = $1)
              OR ($2::VARCHAR IS NOT NULL AND telefone = $2)
           LIMIT 1`,
          [request.email, request.telefone]
        );

        if (result.rows.length === 0) {
          logger.warn('Lead not found for descadastro', {
            email: request.email,
            telefone: request.telefone,
            traceId
          });

          return {
            statusCode: 404,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
              error: 'Lead not found',
              traceId
            })
          };
        }

        leadId = result.rows[0].id;
      }

      // Process descadastro
      const descadastroResult = await handleDescadastro(db, leadId, request.reason);

      if (!descadastroResult.success) {
        logger.error('Descadastro failed', new Error(descadastroResult.message), {
          leadId,
          traceId
        });

        return {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            error: 'Failed to process descadastro',
            message: descadastroResult.message,
            traceId
          })
        };
      }

      logger.info('Descadastro processed successfully', {
        leadId,
        actionsPerformed: descadastroResult.actionsPerformed,
        traceId
      });

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          message: descadastroResult.message,
          leadId: descadastroResult.leadId,
          actionsPerformed: descadastroResult.actionsPerformed,
          traceId
        })
      };

    } catch (error) {
      logger.error('Error processing descadastro', error as Error, {
        traceId
      });

      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Internal server error',
          message: (error as Error).message,
          traceId
        })
      };
    }
  }
);
