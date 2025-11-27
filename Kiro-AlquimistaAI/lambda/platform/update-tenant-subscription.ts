// Lambda Handler: Update Tenant Subscription
// POST /api/billing/subscription
// Descrição: Atualiza a assinatura do tenant (plano + SubNúcleos + agentes)

import { APIGatewayProxyHandler } from 'aws-lambda';
import { query } from '../shared/database';
import { logger } from '../shared/logger';

interface UpdateSubscriptionRequest {
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  selectedSubnucleos: string[];
  selectedAgents?: string[];
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const requestId = event.requestContext.requestId;
  
  // Extrair tenant_id do token JWT
  const tenantId = event.requestContext.authorizer?.claims?.['custom:tenant_id'];
  const userRole = event.requestContext.authorizer?.claims?.['custom:role'];
  
  if (!tenantId) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }

  // Apenas MASTER pode alterar assinatura
  if (userRole !== 'MASTER' && userRole !== 'CEO_ADMIN') {
    return {
      statusCode: 403,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Forbidden - Only MASTER or CEO_ADMIN can update subscription' })
    };
  }

  let requestBody: UpdateSubscriptionRequest;
  try {
    requestBody = JSON.parse(event.body || '{}');
  } catch (error) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Invalid JSON body' })
    };
  }

  const { planId, billingCycle, selectedSubnucleos, selectedAgents } = requestBody;

  if (!planId || !billingCycle || !selectedSubnucleos) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Missing required fields: planId, billingCycle, selectedSubnucleos' })
    };
  }

  logger.info('Updating tenant subscription', {
    requestId,
    tenantId,
    planId,
    billingCycle,
    subnucleosCount: selectedSubnucleos.length
  });

  try {
    // Iniciar transação
    await query('BEGIN');

    // 1. Buscar dados do plano
    const planResult = await query(`
      SELECT * FROM subscription_plans WHERE id = $1 AND is_active = true
    `, [planId]);

    if (planResult.rows.length === 0) {
      await query('ROLLBACK');
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid plan ID' })
      };
    }

    const plan = planResult.rows[0];

    // 2. Validar limites do plano
    if (selectedSubnucleos.length > plan.max_subnucleos) {
      await query('ROLLBACK');
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          error: `Plan allows maximum ${plan.max_subnucleos} subnucleos, but ${selectedSubnucleos.length} selected`
        })
      };
    }

    // 3. Calcular valor
    const amount = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;

    // 4. Criar/Atualizar assinatura
    await query(`
      INSERT INTO tenant_subscriptions (
        tenant_id, plan_id, billing_cycle, status, amount, currency,
        current_period_start, current_period_end
      ) VALUES (
        $1, $2, $3, 'active', $4, 'BRL',
        NOW(), NOW() + INTERVAL '1 month'
      )
      ON CONFLICT (tenant_id)
      DO UPDATE SET
        plan_id = EXCLUDED.plan_id,
        billing_cycle = EXCLUDED.billing_cycle,
        amount = EXCLUDED.amount,
        current_period_start = NOW(),
        current_period_end = NOW() + INTERVAL '1 month',
        updated_at = NOW()
    `, [tenantId, planId, billingCycle, amount]);

    // 5. Desativar SubNúcleos atuais
    await query(`
      UPDATE tenant_subnucleos 
      SET is_active = false, deactivated_at = NOW()
      WHERE tenant_id = $1
    `, [tenantId]);

    // 6. Ativar SubNúcleos selecionados
    for (const subnucleoId of selectedSubnucleos) {
      await query(`
        INSERT INTO tenant_subnucleos (tenant_id, subnucleo_id, is_active)
        VALUES ($1, $2, true)
        ON CONFLICT (tenant_id, subnucleo_id)
        DO UPDATE SET
          is_active = true,
          activated_at = NOW(),
          deactivated_at = NULL
      `, [tenantId, subnucleoId]);
    }

    // 7. Ativar agentes dos SubNúcleos selecionados
    await query(`
      UPDATE tenant_agents 
      SET is_active = false, deactivated_at = NOW()
      WHERE tenant_id = $1
    `, [tenantId]);

    // Buscar agentes dos SubNúcleos selecionados
    const agentsToActivate = await query(`
      SELECT DISTINCT sa.agent_id, sa.subnucleo_id
      FROM subnucleo_agents sa
      WHERE sa.subnucleo_id = ANY($1::uuid[])
    `, [selectedSubnucleos]);

    for (const agent of agentsToActivate.rows) {
      await query(`
        INSERT INTO tenant_agents (tenant_id, agent_id, subnucleo_id, is_active)
        VALUES ($1, $2, $3, true)
        ON CONFLICT (tenant_id, agent_id)
        DO UPDATE SET
          is_active = true,
          subnucleo_id = EXCLUDED.subnucleo_id,
          activated_at = NOW(),
          deactivated_at = NULL
      `, [tenantId, agent.agent_id, agent.subnucleo_id]);
    }

    // Commit transação
    await query('COMMIT');

    logger.info('Subscription updated successfully', {
      requestId,
      tenantId,
      planId,
      subnucleosActivated: selectedSubnucleos.length,
      agentsActivated: agentsToActivate.rows.length
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Subscription updated successfully',
        data: {
          planId,
          billingCycle,
          amount,
          subnucleosCount: selectedSubnucleos.length,
          agentsCount: agentsToActivate.rows.length
        }
      })
    };
  } catch (error) {
    await query('ROLLBACK');
    
    logger.error(`Error updating subscription for tenant=${tenantId}, requestId=${requestId}`, error as Error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to update subscription'
      })
    };
  }
};
