// Handler: GET /api/agents
// Lista todos os agentes AlquimistaAI disponíveis para assinatura

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { query } from '../shared/database';
import { createLogger } from '../shared/logger';
import { classifyError } from '../shared/error-handler';
import { Agent } from './types/billing';

const logger = createLogger('get-agents');

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Listando agentes AlquimistaAI', { path: event.path });

    // Buscar agentes ativos do banco de dados
    const result = await query<Agent>(`
      SELECT 
        id,
        name,
        segment,
        description,
        tags,
        29.90 as "priceMonthly",
        is_active as "isActive"
      FROM agents
      WHERE is_active = true
      ORDER BY segment, name
    `);

    const agents = result.rows;

    logger.info('Agentes listados com sucesso', { count: agents.length });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        agents,
        pricing: {
          perAgent: 29.90,
          currency: 'BRL',
          billingPeriod: 'monthly'
        }
      }),
    };
  } catch (error) {
    logger.error('Erro ao listar agentes', error as Error);
    
    const classification = classifyError(error as Error);
    return {
      statusCode: classification.type === 'transient' ? 503 : 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Erro ao listar agentes',
        shouldRetry: classification.shouldRetry
      }),
    };
  }
};
