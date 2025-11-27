/**
 * Handler: POST /api/trials/start
 * 
 * Inicia ou recupera um trial existente para um usuário testar um agente ou SubNúcleo.
 * 
 * Regras de Negócio:
 * - Trial dura 24 horas OU 5 tokens de interação (o que ocorrer primeiro)
 * - Um usuário pode ter apenas 1 trial ativo por target (agent/subnucleo)
 * - Se trial já existe e está ativo, retorna dados existentes
 * - Se trial expirou, permite criar novo trial
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { query } from '../shared/database';
import { Logger } from '../shared/logger';

const logger = new Logger('trial-start');

interface TrialStartRequest {
  userId: string;
  targetType: 'agent' | 'subnucleo';
  targetId: string;
}

interface TrialStartResponse {
  trialId: string;
  startedAt: string;
  expiresAt: string;
  remainingTokens: number;
  status: 'active' | 'expired';
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'MISSING_BODY',
          message: 'Request body é obrigatório',
        }),
      };
    }

    const request: TrialStartRequest = JSON.parse(event.body);

    // Validar campos obrigatórios
    if (!request.userId || !request.targetType || !request.targetId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'userId, targetType e targetId são obrigatórios',
        }),
      };
    }

    // Validar targetType
    if (request.targetType !== 'agent' && request.targetType !== 'subnucleo') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'INVALID_TARGET_TYPE',
          message: 'targetType deve ser "agent" ou "subnucleo"',
        }),
      };
    }

    logger.info('Starting trial', {
      userId: request.userId,
      targetType: request.targetType,
      targetId: request.targetId,
    });

    // Verificar se já existe trial para este usuário e target
    const existingTrialResult = await query(
      `SELECT 
        id,
        started_at,
        expires_at,
        usage_count,
        max_usage,
        status
      FROM trials
      WHERE user_id = $1 
        AND target_type = $2 
        AND target_id = $3
      ORDER BY created_at DESC
      LIMIT 1`,
      [request.userId, request.targetType, request.targetId]
    );

    const now = new Date();

    // Se existe trial ativo, retornar dados existentes
    if (existingTrialResult.rows.length > 0) {
      const existingTrial = existingTrialResult.rows[0];
      const expiresAt = new Date(existingTrial.expires_at);
      const isExpired = now > expiresAt || existingTrial.usage_count >= existingTrial.max_usage;

      // Se trial ainda está ativo, retornar
      if (!isExpired && existingTrial.status === 'active') {
        const remainingTokens = existingTrial.max_usage - existingTrial.usage_count;

        logger.info('Returning existing active trial', {
          trialId: existingTrial.id,
          remainingTokens,
        });

        const response: TrialStartResponse = {
          trialId: existingTrial.id,
          startedAt: existingTrial.started_at.toISOString(),
          expiresAt: existingTrial.expires_at.toISOString(),
          remainingTokens,
          status: 'active',
        };

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(response),
        };
      }

      // Se trial expirou, atualizar status
      if (isExpired && existingTrial.status === 'active') {
        await query(
          `UPDATE trials 
          SET status = 'expired', updated_at = NOW()
          WHERE id = $1`,
          [existingTrial.id]
        );

        logger.info('Marked trial as expired', {
          trialId: existingTrial.id,
        });
      }
    }

    // Criar novo trial
    const startedAt = now;
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24 horas
    const maxUsage = 5;

    const newTrialResult = await query(
      `INSERT INTO trials (
        user_id,
        target_type,
        target_id,
        started_at,
        expires_at,
        usage_count,
        max_usage,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, started_at, expires_at, usage_count, max_usage, status`,
      [
        request.userId,
        request.targetType,
        request.targetId,
        startedAt,
        expiresAt,
        0, // usage_count inicial
        maxUsage,
        'active',
      ]
    );

    const newTrial = newTrialResult.rows[0];

    logger.info('Created new trial', {
      trialId: newTrial.id,
      userId: request.userId,
      targetType: request.targetType,
      targetId: request.targetId,
      expiresAt: expiresAt.toISOString(),
    });

    const response: TrialStartResponse = {
      trialId: newTrial.id,
      startedAt: newTrial.started_at.toISOString(),
      expiresAt: newTrial.expires_at.toISOString(),
      remainingTokens: maxUsage,
      status: 'active',
    };

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response),
    };
  } catch (error) {
    logger.error('Error in trial-start handler', error as Error);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'INTERNAL_ERROR',
        message: 'Erro ao processar solicitação de trial',
      }),
    };
  }
};
