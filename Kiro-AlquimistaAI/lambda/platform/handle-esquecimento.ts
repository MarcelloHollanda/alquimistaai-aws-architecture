/**
 * Handle Direito ao Esquecimento API
 * 
 * Provides API endpoint for processing LGPD right to be forgotten requests
 * 
 * Requirements: 17.8, 11.12
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { withSimpleErrorHandling } from '../shared/error-handler';
import { Logger } from '../shared/logger';
import { getPool } from '../shared/database';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { handleDireitoEsquecimento } from '../shared/lgpd-compliance';

/**
 * Esquecimento request schema validation
 */
const EsquecimentoRequestSchema = z.object({
  leadId: z.string().uuid('Lead ID must be a valid UUID'),
  email: z.string().email().optional(),
  telefone: z.string().optional(),
  confirmacao: z.boolean().refine(val => val === true, {
    message: 'Confirmação explícita é necessária para direito ao esquecimento'
  })
}).refine(
  (data) => data.leadId || data.email || data.telefone,
  {
    message: 'Pelo menos leadId, email ou telefone deve ser fornecido',
    path: ['leadId']
  }
);

type EsquecimentoRequest = z.infer<typeof EsquecimentoRequestSchema>;

/**
 * Handle Direito ao Esquecimento API Handler
 * 
 * POST /api/lgpd/esquecimento
 * 
 * Body:
 * {
 *   "leadId": "uuid",
 *   "email": "optional@email.com",
 *   "telefone": "+5511999999999",
 *   "confirmacao": true
 * }
 * 
 * Requirements: 17.8, 11.12
 */
export const handler = withSimpleErrorHandling(
  async (event: APIGatewayProxyEvent, context: Context, logger: Logger): Promise<APIGatewayProxyResult> => {
    const traceId = uuidv4();
    logger.setTraceId(traceId);

    logger.info('Handle Direito ao Esquecimento API iniciado', {
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
      const validationResult = EsquecimentoRequestSchema.safeParse(body);

      if (!validationResult.success) {
        logger.warn('Invalid esquecimento request', {
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

      logger.info('Processing direito ao esquecimento request', {
        leadId: request.leadId,
        confirmacao: request.confirmacao,
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
          logger.warn('Lead not found for esquecimento', {
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

      // Process direito ao esquecimento
      const esquecimentoResult = await handleDireitoEsquecimento(db, leadId);

      if (!esquecimentoResult.success) {
        logger.error('Direito ao esquecimento failed', new Error(esquecimentoResult.message), {
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
            error: 'Failed to process direito ao esquecimento',
            message: esquecimentoResult.message,
            traceId
          })
        };
      }

      logger.info('Direito ao esquecimento processed successfully', {
        leadId,
        recordsAnonymized: esquecimentoResult.recordsAnonymized,
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
          message: esquecimentoResult.message,
          leadId: esquecimentoResult.leadId,
          recordsAnonymized: esquecimentoResult.recordsAnonymized,
          traceId
        })
      };

    } catch (error) {
      logger.error('Error processing direito ao esquecimento', error as Error, {
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
