// Lambda Handler: List Subscription Plans
// GET /api/billing/plans
// Descrição: Lista todos os planos de assinatura disponíveis

import { APIGatewayProxyHandler } from 'aws-lambda';
import { query } from '../shared/database';
import { logger } from '../shared/logger';

export const handler: APIGatewayProxyHandler = async (event) => {
  const requestId = event.requestContext.requestId;
  
  logger.info('Listing subscription plans', { requestId });

  try {
    const result = await query(`
      SELECT 
        id,
        name,
        display_name as "displayName",
        description,
        price_monthly as "priceMonthly",
        price_yearly as "priceYearly",
        max_subnucleos as "maxSubnucleos",
        max_agents as "maxAgents",
        max_users as "maxUsers",
        includes_fibonacci as "includesFibonacci",
        features,
        sort_order as "sortOrder"
      FROM subscription_plans
      WHERE is_active = true
      ORDER BY sort_order, price_monthly
    `);

    logger.info('Plans retrieved successfully', {
      requestId,
      count: result.rows.length
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        plans: result.rows
      })
    };
  } catch (error) {
    logger.error(`Error listing plans, requestId=${requestId}`, error as Error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to retrieve subscription plans'
      })
    };
  }
};
