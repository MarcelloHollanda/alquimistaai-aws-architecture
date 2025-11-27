// Lambda Handler: Create Checkout Session
// POST /api/billing/create-checkout-session
// Descrição: Cria uma sessão de checkout no Stripe

import { APIGatewayProxyHandler } from 'aws-lambda';
import { query } from '../shared/database';
import { logger } from '../shared/logger';
import { getStripeClient, getOrCreateStripeCustomer } from '../shared/stripe-client';

interface CreateCheckoutRequest {
  tenantId: string;
  planId: string;
  periodicity: 'monthly' | 'annual';
  selectedAgents: string[];
  selectedSubnucleos: string[];
}

interface CheckoutSessionResponse {
  checkoutUrl: string;
  sessionId: string;
  expiresAt: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const requestId = event.requestContext.requestId;

  // Parse request body
  let requestBody: CreateCheckoutRequest;
  try {
    requestBody = JSON.parse(event.body || '{}');
  } catch (error) {
    logger.warn('Invalid JSON in request body', { requestId });
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'VALIDATION_ERROR',
        message: 'JSON inválido no corpo da requisição',
      }),
    };
  }

  const { tenantId, planId, periodicity, selectedAgents, selectedSubnucleos } = requestBody;

  // Validar campos obrigatórios
  if (!tenantId || !planId || !periodicity) {
    logger.warn('Missing required fields', { requestId, requestBody });
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'VALIDATION_ERROR',
        message: 'tenantId, planId e periodicity são obrigatórios',
      }),
    };
  }

  logger.info('Creating checkout session', {
    requestId,
    tenantId,
    planId,
    periodicity,
    agentsCount: selectedAgents?.length || 0,
    subnucleosCount: selectedSubnucleos?.length || 0,
  });

  try {
    // Buscar dados do tenant
    const tenantResult = await query(`
      SELECT 
        id,
        company_name,
        email,
        cnpj
      FROM tenants
      WHERE id = $1
    `, [tenantId]);

    if (tenantResult.rows.length === 0) {
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

    const tenant = tenantResult.rows[0];

    // Buscar dados do plano
    const planResult = await query(`
      SELECT 
        id,
        name,
        price_monthly,
        price_annual,
        stripe_price_id_monthly,
        stripe_price_id_annual
      FROM plans
      WHERE id = $1
    `, [planId]);

    if (planResult.rows.length === 0) {
      logger.warn('Plan not found', { requestId, planId });
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'NOT_FOUND',
          message: 'Plano não encontrado',
        }),
      };
    }

    const plan = planResult.rows[0];

    // Buscar assinatura existente para pegar stripe_customer_id
    const subscriptionResult = await query(`
      SELECT stripe_customer_id
      FROM subscriptions
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [tenantId]);

    const existingCustomerId = subscriptionResult.rows[0]?.stripe_customer_id;

    // Inicializar Stripe
    const stripe = await getStripeClient();

    // Criar ou recuperar Stripe Customer
    const customerId = await getOrCreateStripeCustomer(
      tenantId,
      tenant.email,
      tenant.company_name,
      existingCustomerId
    );

    // Preparar line items
    const lineItems: Array<{ price: string; quantity: number }> = [];

    // Adicionar plano base
    const stripePriceId = periodicity === 'monthly' 
      ? plan.stripe_price_id_monthly 
      : plan.stripe_price_id_annual;

    if (!stripePriceId) {
      logger.error('Stripe price ID not configured for plan', {
        requestId,
        planId,
        periodicity,
      });
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'CONFIGURATION_ERROR',
          message: 'Plano não configurado corretamente no Stripe',
        }),
      };
    }

    lineItems.push({
      price: stripePriceId,
      quantity: 1,
    });

    // Adicionar agentes (se houver)
    if (selectedAgents && selectedAgents.length > 0) {
      const agentsResult = await query(`
        SELECT 
          id,
          name,
          stripe_price_id
        FROM alquimista_platform.agents
        WHERE id = ANY($1)
      `, [selectedAgents]);

      for (const agent of agentsResult.rows) {
        if (agent.stripe_price_id) {
          lineItems.push({
            price: agent.stripe_price_id,
            quantity: 1,
          });
        }
      }
    }

    // Adicionar SubNúcleos (se houver)
    if (selectedSubnucleos && selectedSubnucleos.length > 0) {
      const subnucleosResult = await query(`
        SELECT 
          id,
          name,
          stripe_price_id
        FROM subnucleos
        WHERE id = ANY($1)
      `, [selectedSubnucleos]);

      for (const subnucleo of subnucleosResult.rows) {
        if (subnucleo.stripe_price_id) {
          lineItems.push({
            price: subnucleo.stripe_price_id,
            quantity: 1,
          });
        }
      }
    }

    // URLs de retorno
    const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'https://app.alquimistaai.com';
    const successUrl = `${frontendBaseUrl}/app/billing/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${frontendBaseUrl}/app/billing/cancel`;

    // Criar sessão de checkout no Stripe
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        tenantId,
        planId,
        periodicity,
        selectedAgents: JSON.stringify(selectedAgents || []),
        selectedSubnucleos: JSON.stringify(selectedSubnucleos || []),
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
      },
    });

    logger.info('Checkout session created successfully', {
      requestId,
      tenantId,
      sessionId: session.id,
      customerId,
      lineItemsCount: lineItems.length,
    });

    const response: CheckoutSessionResponse = {
      checkoutUrl: session.url!,
      sessionId: session.id,
      expiresAt: new Date(session.expires_at * 1000).toISOString(),
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    logger.error('Error creating checkout session', {
      requestId,
      tenantId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Verificar se é erro do Stripe
    if (error && typeof error === 'object' && 'type' in error) {
      const stripeError = error as any;
      
      if (stripeError.type === 'StripeCardError') {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            error: 'CARD_ERROR',
            message: 'Erro no cartão de crédito',
          }),
        };
      }

      if (stripeError.type === 'StripeInvalidRequestError') {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            error: 'STRIPE_ERROR',
            message: 'Requisição inválida para o Stripe',
          }),
        };
      }
    }

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'INTERNAL_ERROR',
        message: 'Erro ao criar sessão de checkout',
      }),
    };
  }
};
