// Lambda Handler: Get Tenant Subscription
// GET /api/billing/subscription
// Descrição: Obtém a assinatura atual do tenant

import { APIGatewayProxyHandler } from 'aws-lambda';
import { query } from '../shared/database';
import { logger } from '../shared/logger';

export const handler: APIGatewayProxyHandler = async (event) => {
  const requestId = event.requestContext.requestId;
  
  // Extrair tenant_id do token JWT
  const tenantId = event.requestContext.authorizer?.claims?.['custom:tenant_id'];
  
  if (!tenantId) {
    logger.warn('Unauthorized access - no tenant_id', { requestId });
    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }

  logger.info('Getting tenant subscription', { requestId, tenantId });

  try {
    // Buscar assinatura usando a view
    const subscriptionResult = await query(`
      SELECT * FROM v_tenant_subscription_summary
      WHERE tenant_id = $1
    `, [tenantId]);

    if (subscriptionResult.rows.length === 0) {
      logger.info('No subscription found for tenant', { requestId, tenantId });
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          subscription: null,
          hasSubscription: false
        })
      };
    }

    const subscription = subscriptionResult.rows[0];

    // Buscar SubNúcleos ativos
    const activeSubnucleosResult = await query(`
      SELECT 
        s.id,
        s.name,
        s.display_name as "displayName",
        s.category,
        ts.activated_at as "activatedAt"
      FROM tenant_subnucleos ts
      JOIN subnucleos s ON ts.subnucleo_id = s.id
      WHERE ts.tenant_id = $1 AND ts.is_active = true
      ORDER BY s.sort_order
    `, [tenantId]);

    // Buscar agentes ativos
    const activeAgentsResult = await query(`
      SELECT 
        a.id,
        a.name,
        a.display_name as "displayName",
        a.category,
        ta.subnucleo_id as "subnucleoId",
        ta.activated_at as "activatedAt"
      FROM tenant_agents ta
      JOIN alquimista_platform.agents a ON ta.agent_id = a.id
      WHERE ta.tenant_id = $1 AND ta.is_active = true
      ORDER BY a.category, a.display_name
    `, [tenantId]);

    const response = {
      subscription: {
        ...subscription,
        activeSubnucleos: activeSubnucleosResult.rows,
        activeAgents: activeAgentsResult.rows
      },
      hasSubscription: true
    };

    logger.info('Subscription retrieved successfully', {
      requestId,
      tenantId,
      planName: subscription.plan_name,
      activeSubnucleos: activeSubnucleosResult.rows.length,
      activeAgents: activeAgentsResult.rows.length
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(response)
    };
  } catch (error) {
    logger.error(`Error getting tenant subscription for tenant=${tenantId}, requestId=${requestId}`, error as Error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to retrieve subscription'
      })
    };
  }
};
