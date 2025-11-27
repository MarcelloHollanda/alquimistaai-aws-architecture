import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import Stripe from 'stripe';
import { query } from '../shared/database';
import { logger } from '../shared/logger';
import { getStripeClient, getStripeWebhookSecret } from '../shared/stripe-client';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const requestId = event.requestContext.requestId;
  const headers = {
    'Content-Type': 'application/json',
  };

  try {
    // Validar método
    if (event.httpMethod !== 'POST') {
      logger.warn('Invalid HTTP method for webhook', { requestId, method: event.httpMethod });
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Método não permitido' }),
      };
    }

    if (!event.body) {
      logger.warn('Missing body in webhook request', { requestId });
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Body é obrigatório' }),
      };
    }

    // Verificar assinatura do webhook
    const signature = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];

    if (!signature) {
      logger.warn('Missing Stripe signature', { requestId });
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Assinatura do webhook ausente' }),
      };
    }

    // Obter stripe client e webhook secret
    const stripe = await getStripeClient();
    const webhookSecret = await getStripeWebhookSecret();

    let stripeEvent: Stripe.Event;

    try {
      stripeEvent = stripe.webhooks.constructEvent(
        event.body,
        signature,
        webhookSecret
      );
    } catch (err) {
      logger.error('Failed to verify webhook signature', {
        requestId,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Assinatura inválida' }),
      };
    }

    logger.info('Webhook received', { requestId, eventType: stripeEvent.type, eventId: stripeEvent.id });

    // Processar evento
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(stripeEvent.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(stripeEvent.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(stripeEvent.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(stripeEvent.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(stripeEvent.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(stripeEvent.data.object as Stripe.Invoice);
        break;

      default:
        logger.info('Unhandled webhook event type', { requestId, eventType: stripeEvent.type });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    logger.error('Error processing webhook', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Erro ao processar webhook',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      }),
    };
  }
};

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  logger.info('Processing checkout completed', { sessionId: session.id });

  const tenantId = session.metadata?.tenantId;
  const selectedAgents = session.metadata?.selectedAgents
    ? JSON.parse(session.metadata.selectedAgents)
    : [];

  if (!tenantId) {
    logger.error('tenantId not found in session metadata', { sessionId: session.id });
    return;
  }

  // Registrar evento
  await query(
    `INSERT INTO payment_events 
     (tenant_id, event_type, provider_customer_id, provider_subscription_id, amount, currency, status, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      tenantId,
      'checkout_completed',
      session.customer as string,
      session.subscription as string,
      session.amount_total ? session.amount_total / 100 : 0,
      'BRL',
      'completed',
      JSON.stringify({
        sessionId: session.id,
        selectedAgents,
      }),
    ]
  );

  logger.info('Checkout completed event recorded', { tenantId, sessionId: session.id });
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  logger.info('Processing subscription created', { subscriptionId: subscription.id });

  const customerId = subscription.customer as string;

  // Buscar tenant pelo customer ID
  const tenantResult = await query(
    `SELECT t.id, t.company_name
     FROM tenants t
     JOIN payment_events pe ON pe.tenant_id = t.id
     WHERE pe.provider_customer_id = $1
     LIMIT 1`,
    [customerId]
  );

  if (tenantResult.rows.length === 0) {
    logger.error('Tenant not found for customer', { customerId });
    return;
  }

  const tenant = tenantResult.rows[0];

  // Buscar metadata do checkout
  const checkoutResult = await query(
    `SELECT metadata
     FROM payment_events
     WHERE provider_customer_id = $1
       AND event_type = 'checkout_completed'
     ORDER BY created_at DESC
     LIMIT 1`,
    [customerId]
  );

  let selectedAgents: string[] = [];
  if (checkoutResult.rows.length > 0) {
    const metadata = checkoutResult.rows[0].metadata;
    selectedAgents = metadata.selectedAgents || [];
  }

  // Calcular total
  const totalMonthly = subscription.items.data.reduce((sum: number, item: Stripe.SubscriptionItem) => {
    return sum + (item.price.unit_amount || 0) / 100;
  }, 0);

  // Criar ou atualizar assinatura
  await query(
    `INSERT INTO subscriptions 
     (tenant_id, stripe_subscription_id, status, current_period_start, current_period_end, 
      stripe_customer_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (stripe_subscription_id) 
     DO UPDATE SET
       status = EXCLUDED.status,
       current_period_start = EXCLUDED.current_period_start,
       current_period_end = EXCLUDED.current_period_end,
       updated_at = NOW()`,
    [
      tenant.id,
      subscription.id,
      subscription.status,
      new Date(subscription.current_period_start * 1000),
      new Date(subscription.current_period_end * 1000),
      customerId,
    ]
  );

  // Registrar evento
  await query(
    `INSERT INTO payment_events 
     (tenant_id, event_type, provider_customer_id, provider_subscription_id, amount, currency, status, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      tenant.id,
      'subscription_created',
      customerId,
      subscription.id,
      totalMonthly,
      'BRL',
      subscription.status,
      JSON.stringify({ selectedAgents }),
    ]
  );

  logger.info('Subscription created event recorded', { tenantId: tenant.id, subscriptionId: subscription.id });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  logger.info('Processing subscription updated', { subscriptionId: subscription.id });

  await query(
    `UPDATE subscriptions
     SET status = $1,
         current_period_start = $2,
         current_period_end = $3,
         updated_at = NOW()
     WHERE stripe_subscription_id = $4`,
    [
      subscription.status,
      new Date(subscription.current_period_start * 1000),
      new Date(subscription.current_period_end * 1000),
      subscription.id,
    ]
  );

  // Registrar evento
  const tenantResult = await query(
    'SELECT tenant_id FROM subscriptions WHERE stripe_subscription_id = $1',
    [subscription.id]
  );

  if (tenantResult.rows.length > 0) {
    await query(
      `INSERT INTO payment_events 
       (tenant_id, event_type, provider_subscription_id, status, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        tenantResult.rows[0].tenant_id,
        'subscription_updated',
        subscription.id,
        subscription.status,
        JSON.stringify({ cancelAtPeriodEnd: subscription.cancel_at_period_end }),
      ]
    );

    logger.info('Subscription updated event recorded', { 
      tenantId: tenantResult.rows[0].tenant_id, 
      subscriptionId: subscription.id 
    });
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  logger.info('Processing subscription deleted', { subscriptionId: subscription.id });

  await query(
    `UPDATE subscriptions
     SET status = 'cancelled',
         updated_at = NOW()
     WHERE stripe_subscription_id = $1`,
    [subscription.id]
  );

  // Registrar evento
  const tenantResult = await query(
    'SELECT tenant_id FROM subscriptions WHERE stripe_subscription_id = $1',
    [subscription.id]
  );

  if (tenantResult.rows.length > 0) {
    await query(
      `INSERT INTO payment_events 
       (tenant_id, event_type, provider_subscription_id, status)
       VALUES ($1, $2, $3, $4)`,
      [
        tenantResult.rows[0].tenant_id,
        'subscription_deleted',
        subscription.id,
        'cancelled',
      ]
    );

    logger.info('Subscription deleted event recorded', { 
      tenantId: tenantResult.rows[0].tenant_id, 
      subscriptionId: subscription.id 
    });
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  logger.info('Processing payment succeeded', { invoiceId: invoice.id });

  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    logger.warn('No subscription ID in invoice', { invoiceId: invoice.id });
    return;
  }

  // Registrar evento
  const tenantResult = await query(
    'SELECT tenant_id FROM subscriptions WHERE stripe_subscription_id = $1',
    [subscriptionId]
  );

  if (tenantResult.rows.length > 0) {
    await query(
      `INSERT INTO payment_events 
       (tenant_id, event_type, provider_subscription_id, amount, currency, status, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        tenantResult.rows[0].tenant_id,
        'payment_succeeded',
        subscriptionId,
        invoice.amount_paid / 100,
        'BRL',
        'succeeded',
        JSON.stringify({ invoiceId: invoice.id }),
      ]
    );

    logger.info('Payment succeeded event recorded', { 
      tenantId: tenantResult.rows[0].tenant_id, 
      invoiceId: invoice.id,
      amount: invoice.amount_paid / 100
    });
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  logger.error('Processing payment failed', { invoiceId: invoice.id });

  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    logger.warn('No subscription ID in failed invoice', { invoiceId: invoice.id });
    return;
  }

  // Atualizar status da assinatura para past_due
  await query(
    `UPDATE subscriptions
     SET status = 'past_due',
         updated_at = NOW()
     WHERE stripe_subscription_id = $1`,
    [subscriptionId]
  );

  // Registrar evento
  const tenantResult = await query(
    'SELECT tenant_id FROM subscriptions WHERE stripe_subscription_id = $1',
    [subscriptionId]
  );

  if (tenantResult.rows.length > 0) {
    await query(
      `INSERT INTO payment_events 
       (tenant_id, event_type, provider_subscription_id, amount, currency, status, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        tenantResult.rows[0].tenant_id,
        'payment_failed',
        subscriptionId,
        invoice.amount_due / 100,
        'BRL',
        'failed',
        JSON.stringify({ invoiceId: invoice.id }),
      ]
    );

    logger.error('Payment failed event recorded', { 
      tenantId: tenantResult.rows[0].tenant_id, 
      invoiceId: invoice.id,
      amount: invoice.amount_due / 100
    });
  }
}
