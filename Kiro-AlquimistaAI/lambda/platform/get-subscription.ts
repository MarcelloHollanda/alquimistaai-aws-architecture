// Lambda Handler: Get Subscription for Checkout
// GET /api/billing/subscription
// Descrição: Obtém dados completos da assinatura para exibição no checkout

import { APIGatewayProxyHandler } from 'aws-lambda';
import { query } from '../shared/database';
import { logger } from '../shared/logger';

interface SubscriptionSummary {
  tenantId: string;
  companyName: string;
  cnpj: string;
  plan: {
    id: string;
    name: string;
    periodicity: 'monthly' | 'annual';
  };
  agents: Array<{
    id: string;
    name: string;
    priceMonthly: number;
  }>;
  subnucleos: Array<{
    id: string;
    name: string;
    priceMonthly: number;
  }>;
  pricing: {
    subtotal: number;
    taxes: number;
    total: number;
  };
  status: 'active' | 'pending' | 'cancelled' | 'past_due';
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const requestId = event.requestContext.requestId;
  
  // Extrair tenantId dos query parameters ou do JWT
  const tenantId = event.queryStringParameters?.tenantId || 
                   event.requestContext.authorizer?.claims?.['custom:tenant_id'];
  
  if (!tenantId) {
    logger.warn('Missing tenantId', { requestId });
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'VALIDATION_ERROR',
        message: 'tenantId é obrigatório',
      }),
    };
  }

  logger.info('Getting subscription for checkout', { requestId, tenantId });

  try {
    // Buscar dados da empresa
    const companyResult = await query(`
      SELECT 
        id,
        company_name,
        cnpj
      FROM tenants
      WHERE id = $1
    `, [tenantId]);

    if (companyResult.rows.length === 0) {
      logger.warn('Tenant not found', { requestId, tenantId });
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'NOT_FOUND',
          message: 'Tenant não encontrado',
        }),
      };
    }

    const company = companyResult.rows[0];

    // Buscar assinatura atual
    const subscriptionResult = await query(`
      SELECT 
        s.id,
        s.plan_id,
        p.name as plan_name,
        s.periodicity,
        s.status,
        s.stripe_customer_id,
        s.stripe_subscription_id
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.tenant_id = $1
      ORDER BY s.created_at DESC
      LIMIT 1
    `, [tenantId]);

    if (subscriptionResult.rows.length === 0) {
      logger.warn('No subscription found', { requestId, tenantId });
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'NOT_FOUND',
          message: 'Assinatura não encontrada',
        }),
      };
    }

    const subscription = subscriptionResult.rows[0];

    // Buscar itens da assinatura (agentes e SubNúcleos)
    const itemsResult = await query(`
      SELECT 
        si.id,
        si.item_type,
        si.item_id,
        si.quantity,
        si.price_monthly,
        CASE 
          WHEN si.item_type = 'agent' THEN a.name
          WHEN si.item_type = 'subnucleo' THEN sn.name
        END as item_name
      FROM subscription_items si
      LEFT JOIN alquimista_platform.agents a ON si.item_type = 'agent' AND si.item_id = a.id
      LEFT JOIN subnucleos sn ON si.item_type = 'subnucleo' AND si.item_id = sn.id
      WHERE si.subscription_id = $1
    `, [subscription.id]);

    // Separar agentes e SubNúcleos
    const agents = itemsResult.rows
      .filter(item => item.item_type === 'agent')
      .map(item => ({
        id: item.item_id,
        name: item.item_name,
        priceMonthly: parseFloat(item.price_monthly),
      }));

    const subnucleos = itemsResult.rows
      .filter(item => item.item_type === 'subnucleo')
      .map(item => ({
        id: item.item_id,
        name: item.item_name,
        priceMonthly: parseFloat(item.price_monthly),
      }));

    // Calcular valores
    const subtotal = itemsResult.rows.reduce(
      (sum, item) => sum + parseFloat(item.price_monthly) * item.quantity,
      0
    );

    // Impostos (exemplo: 5% - ajustar conforme necessário)
    const taxRate = 0.05;
    const taxes = subtotal * taxRate;
    const total = subtotal + taxes;

    // Montar resposta
    const response: SubscriptionSummary = {
      tenantId: company.id,
      companyName: company.company_name,
      cnpj: company.cnpj || '',
      plan: {
        id: subscription.plan_id,
        name: subscription.plan_name,
        periodicity: subscription.periodicity,
      },
      agents,
      subnucleos,
      pricing: {
        subtotal: Math.round(subtotal * 100) / 100,
        taxes: Math.round(taxes * 100) / 100,
        total: Math.round(total * 100) / 100,
      },
      status: subscription.status,
    };

    logger.info('Subscription retrieved successfully', {
      requestId,
      tenantId,
      planName: subscription.plan_name,
      agentsCount: agents.length,
      subnucleosCount: subnucleos.length,
      total,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    logger.error(
      'Error getting subscription',
      error instanceof Error ? error : undefined,
      {
        requestId,
        tenantId,
      }
    );

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'DATABASE_ERROR',
        message: 'Erro ao buscar dados da assinatura',
      }),
    };
  }
};
