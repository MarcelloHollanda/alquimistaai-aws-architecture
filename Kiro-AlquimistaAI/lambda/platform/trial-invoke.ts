/**
 * Handler: POST /api/trials/invoke
 * 
 * Processa uma mensagem de teste e valida limites do trial.
 * 
 * Regras de Negócio:
 * - Valida que trial não expirou (24h desde início)
 * - Valida que não excedeu 5 tokens de interação
 * - Incrementa contador de uso atomicamente
 * - Retorna resposta do agente/SubNúcleo
 * - Retorna erro 403 se trial expirado
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { query } from '../shared/database';
import { Logger } from '../shared/logger';

const logger = new Logger('trial-invoke');

interface TrialInvokeRequest {
  userId: string;
  targetType: 'agent' | 'subnucleo';
  targetId: string;
  message: string;
}

interface TrialInvokeResponse {
  response: string;
  remainingTokens: number;
  expiresAt: string;
}

interface TrialExpiredResponse {
  error: string;
  message: string;
  expiresAt?: string;
}

/**
 * Função mock para processar mensagem com agente/SubNúcleo
 * TODO: Integrar com sistema real de agentes
 */
async function processWithAgent(
  targetType: string,
  targetId: string,
  message: string
): Promise<string> {
  // Mock de resposta
  logger.info('Processing message with agent (mock)', {
    targetType,
    targetId,
    messageLength: message.length,
  });

  // Simular processamento
  await new Promise((resolve) => setTimeout(resolve, 100));

  return `Esta é uma resposta de teste do ${targetType} ${targetId}. Você disse: "${message}". Em produção, esta resposta virá do agente real de IA.`;
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

    const request: TrialInvokeRequest = JSON.parse(event.body);

    // Validar campos obrigatórios
    if (!request.userId || !request.targetType || !request.targetId || !request.message) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'userId, targetType, targetId e message são obrigatórios',
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

    // Validar tamanho da mensagem
    if (request.message.length > 5000) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'MESSAGE_TOO_LONG',
          message: 'Mensagem não pode exceder 5000 caracteres',
        }),
      };
    }

    logger.info('Invoking trial', {
      userId: request.userId,
      targetType: request.targetType,
      targetId: request.targetId,
      messageLength: request.message.length,
    });

    const now = new Date();

    // Buscar trial ativo
    const trialResult = await query(
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
        AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1`,
      [request.userId, request.targetType, request.targetId]
    );

    // Verificar se trial existe
    if (trialResult.rows.length === 0) {
      logger.warn('Trial not found', {
        userId: request.userId,
        targetType: request.targetType,
        targetId: request.targetId,
      });

      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'TRIAL_NOT_FOUND',
          message: 'Trial não encontrado. Inicie um novo teste.',
        }),
      };
    }

    const trial = trialResult.rows[0];
    const expiresAt = new Date(trial.expires_at);

    // Validar limite de tempo (24 horas)
    if (now > expiresAt) {
      logger.info('Trial expired by time', {
        trialId: trial.id,
        expiresAt: expiresAt.toISOString(),
        now: now.toISOString(),
      });

      // Marcar como expirado
      await query(
        `UPDATE trials 
        SET status = 'expired', updated_at = NOW()
        WHERE id = $1`,
        [trial.id]
      );

      const expiredResponse: TrialExpiredResponse = {
        error: 'TRIAL_EXPIRED',
        message: 'Seu período de teste para esta IA terminou. Assine o agente ou fale com nosso time comercial.',
        expiresAt: expiresAt.toISOString(),
      };

      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expiredResponse),
      };
    }

    // Validar limite de tokens (5 interações)
    if (trial.usage_count >= trial.max_usage) {
      logger.info('Trial expired by token limit', {
        trialId: trial.id,
        usageCount: trial.usage_count,
        maxUsage: trial.max_usage,
      });

      // Marcar como expirado
      await query(
        `UPDATE trials 
        SET status = 'expired', updated_at = NOW()
        WHERE id = $1`,
        [trial.id]
      );

      const expiredResponse: TrialExpiredResponse = {
        error: 'TRIAL_EXPIRED',
        message: 'Você atingiu o limite de 5 interações de teste. Assine o agente ou fale com nosso time comercial.',
        expiresAt: expiresAt.toISOString(),
      };

      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expiredResponse),
      };
    }

    // Incrementar contador de uso atomicamente
    // Usar UPDATE com WHERE para garantir que não excede limite
    const updateResult = await query(
      `UPDATE trials 
      SET usage_count = usage_count + 1, updated_at = NOW()
      WHERE id = $1 AND usage_count < max_usage
      RETURNING id, usage_count, max_usage`,
      [trial.id]
    );

    // Verificar se update foi bem-sucedido (race condition check)
    if (updateResult.rows.length === 0) {
      logger.warn('Failed to increment usage count - race condition', {
        trialId: trial.id,
      });

      const expiredResponse: TrialExpiredResponse = {
        error: 'TRIAL_EXPIRED',
        message: 'Você atingiu o limite de interações de teste.',
      };

      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expiredResponse),
      };
    }

    const updatedTrial = updateResult.rows[0];
    const remainingTokens = updatedTrial.max_usage - updatedTrial.usage_count;

    logger.info('Trial usage incremented', {
      trialId: trial.id,
      usageCount: updatedTrial.usage_count,
      remainingTokens,
    });

    // Processar mensagem com agente/SubNúcleo
    const agentResponse = await processWithAgent(
      request.targetType,
      request.targetId,
      request.message
    );

    logger.info('Trial invocation successful', {
      trialId: trial.id,
      remainingTokens,
    });

    const response: TrialInvokeResponse = {
      response: agentResponse,
      remainingTokens,
      expiresAt: expiresAt.toISOString(),
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response),
    };
  } catch (error) {
    logger.error('Error in trial-invoke handler', error as Error);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'INTERNAL_ERROR',
        message: 'Erro ao processar mensagem de trial',
      }),
    };
  }
};

