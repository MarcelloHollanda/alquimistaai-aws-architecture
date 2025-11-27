import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { createLogger } from '../shared/logger';
import { v4 as uuidv4 } from 'uuid';

const tracer = new Tracer({ serviceName: 'alquimista-subscription' });

/**
 * Lambda Handler: Listar agentes AlquimistaAI disponíveis para assinatura
 * 
 * GET /api/agents
 * Query params:
 *   - segment: Filtrar por segmento (Atendimento, Vendas, Marketing, etc.)
 * 
 * Endpoint público (não requer autenticação)
 * 
 * Requirements: 1, 14
 */
export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const traceId = uuidv4();
  const logger = createLogger('alquimista-subscription', { traceId });
  
  const segment = tracer.getSegment();
  const subsegment = segment?.addNewSubsegment('ListAgents');

  try {
    logger.info('Listing available agents for subscription', {
      queryParams: event.queryStringParameters
    });

    // Extrair filtro de segmento (opcional)
    const segment = event.queryStringParameters?.segment;

    // Importar função de query do banco de dados
    const { query } = await import('../shared/database');

    // Consultar agentes AlquimistaAI disponíveis
    // Tabela: agents (criada na migration 009)
    const queryText = `
      SELECT 
        id,
        name,
        segment,
        description,
        tags,
        price_monthly as "priceMonthly",
        status,
        created_at as "createdAt"
      FROM agents
      WHERE status = 'active'
        AND ($1::text IS NULL OR segment = $1)
      ORDER BY segment ASC, name ASC
    `;

    const result = await query(queryText, [segment || null]);
    const agents = result.rows;

    subsegment?.addAnnotation('segment', segment || 'all');
    subsegment?.addMetadata('agentsCount', agents.length);
    subsegment?.close();

    logger.info('Agents listed successfully', {
      segment,
      count: agents.length
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Endpoint público
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        agents: agents,
        total: agents.length
      })
    };

  } catch (error) {
    logger.error('Error listing agents', error as Error);
    subsegment?.addError(error as Error);
    subsegment?.close();

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
