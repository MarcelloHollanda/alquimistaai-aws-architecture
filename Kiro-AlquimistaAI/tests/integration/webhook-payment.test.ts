/**
 * Integration Tests: POST /api/billing/webhook
 * 
 * Testa o processamento de webhooks do Stripe incluindo validação de assinatura,
 * processamento de eventos e idempotência
 */

import { handler } from '../../lambda/platform/webhook-payment';
import { APIGatewayProxyEvent } from 'aws-lambda';
import Stripe from 'stripe';

// Mock do Stripe client
jest.mock('../../lambda/shared/stripe-client', () => ({
  constructWebhookEvent: jest.fn(),
}));

// Mock do database
jest.mock('../../lambda/shared/database', () => ({
  query: jest.fn(),
}));

import { constructWebhookEvent } from '../../lambda/shared/stripe-client';
import { query } from '../../lambda/shared/database';

const mockConstructWebhookEvent = constructWebhookEvent as jest.MockedFunction<typeof constructWebhookEvent>;
const mockQuery = query as jest.MockedFunction<typeof query>;

describe('POST /api/billing/webhook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test123';
  });

  const createMockEvent = (body: string, signature: string): APIGatewayProxyEvent => ({
    body,
    headers: {
      'stripe-signature': signature,
    },
    multiValueHeaders: {},
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: '/api/billing/webhook',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: '',
  });

  describe('Validação de assinatura', () => {
    it('deve retornar erro 400 quando body está ausente', async () => {
      const event = createMockEvent('', 'sig_test');
      event.body = null;

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        error: 'Missing body or signature',
      });
    });

    it('deve retornar erro 400 quando signature está ausente', async () => {
      const event = createMockEvent('{"type": "test"}', '');
      delete event.headers['stripe-signature'];

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        error: 'Missing body or signature',
      });
    });

    it('deve retornar erro 500 quando webhook secret não está configurado', async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET;

      const event = createMockEvent('{"type": "test"}', 'sig_test');

      const result = await handler(event);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body)).toEqual({
        error: 'Webhook secret not configured',
      });
    });

    it('deve retornar erro 400 quando assinatura é inválida', async () => {
      mockConstructWebhookEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const event = createMockEvent('{"type": "test"}', 'invalid_sig');

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        error: 'Webhook processing failed',
      });
    });
  });

  describe('Processamento de checkout.session.completed', () => {
    const mockSession: Stripe.Checkout.Session = {
      id: 'cs_test123',
      customer: 'cus_test123',
      subscription: 'sub_test123',
      payment_status: 'paid',
    } as any;

    it('deve processar evento com sucesso', async () => {
      mockConstructWebhookEvent.mockReturnValueOnce({
        id: 'evt_test123',
        type: 'checkout.session.completed',
        data: {
          object: mockSession,
        },
      } as any);

      // Mock subscription intent query
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'intent_123',
            tenant_id: 'tenant_123',
            selected_agents: JSON.stringify(['agent-1', 'agent-2']),
            total_amount_cents: 5980,
            currency: 'brl',
          },
        ],
      } as any);

      // Mock subscription insert
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      // Mock subscription intent update
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      // Mock payment event insert
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const event = createMockEvent(JSON.stringify(mockSession), 'sig_test');

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual({ received: true });

      // Verify subscription was created
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO subscriptions'),
        expect.arrayContaining([
          'sub_test123',
          'tenant_123',
          'sub_test123',
          'cus_test123',
          'active',
        ])
      );

      // Verify subscription intent was updated
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE subscription_intents'),
        ['completed', 'intent_123']
      );

      // Verify payment event was logged
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO payment_events'),
        expect.arrayContaining([
          expect.any(String),
          'tenant_123',
          'subscription_activated',
        ])
      );
    });

    it('deve lidar com subscription intent não encontrado', async () => {
      mockConstructWebhookEvent.mockReturnValueOnce({
        id: 'evt_test123',
        type: 'checkout.session.completed',
        data: {
          object: mockSession,
        },
      } as any);

      // Mock subscription intent query - não encontrado
      mockQuery.mockResolvedValueOnce({
        rows: [],
      } as any);

      const event = createMockEvent(JSON.stringify(mockSession), 'sig_test');

      const result = await handler(event);

      // Deve retornar sucesso mesmo sem encontrar o intent
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual({ received: true });

      // Não deve tentar criar subscription
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe('Processamento de invoice.payment_succeeded', () => {
    const mockInvoice: Stripe.Invoice = {
      id: 'in_test123',
      subscription: 'sub_test123',
      amount_paid: 5980,
      currency: 'brl',
      period_start: 1234567890,
      period_end: 1234567890,
    } as any;

    it('deve processar pagamento bem-sucedido', async () => {
      mockConstructWebhookEvent.mockReturnValueOnce({
        id: 'evt_test123',
        type: 'invoice.payment_succeeded',
        data: {
          object: mockInvoice,
        },
      } as any);

      // Mock subscription update
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      // Mock tenant query
      mockQuery.mockResolvedValueOnce({
        rows: [{ tenant_id: 'tenant_123' }],
      } as any);

      // Mock payment event insert
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const event = createMockEvent(JSON.stringify(mockInvoice), 'sig_test');

      const result = await handler(event);

      expect(result.statusCode).toBe(200);

      // Verify subscription status was updated
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE subscriptions'),
        ['active', 'sub_test123']
      );

      // Verify payment event was logged
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO payment_events'),
        expect.arrayContaining([
          expect.any(String),
          'tenant_123',
          'payment_succeeded',
          'in_test123',
          5980,
          'brl',
          'success',
        ])
      );
    });

    it('deve lidar com invoice sem subscription', async () => {
      const invoiceWithoutSub = { ...mockInvoice, subscription: null };

      mockConstructWebhookEvent.mockReturnValueOnce({
        id: 'evt_test123',
        type: 'invoice.payment_succeeded',
        data: {
          object: invoiceWithoutSub,
        },
      } as any);

      const event = createMockEvent(JSON.stringify(invoiceWithoutSub), 'sig_test');

      const result = await handler(event);

      expect(result.statusCode).toBe(200);

      // Não deve tentar atualizar subscription
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  describe('Processamento de invoice.payment_failed', () => {
    const mockFailedInvoice: Stripe.Invoice = {
      id: 'in_test123',
      subscription: 'sub_test123',
      amount_due: 5980,
      currency: 'brl',
      last_finalization_error: {
        message: 'Card declined',
      },
    } as any;

    it('deve processar falha de pagamento', async () => {
      mockConstructWebhookEvent.mockReturnValueOnce({
        id: 'evt_test123',
        type: 'invoice.payment_failed',
        data: {
          object: mockFailedInvoice,
        },
      } as any);

      // Mock subscription update
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      // Mock tenant query
      mockQuery.mockResolvedValueOnce({
        rows: [{ tenant_id: 'tenant_123' }],
      } as any);

      // Mock payment event insert
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const event = createMockEvent(JSON.stringify(mockFailedInvoice), 'sig_test');

      const result = await handler(event);

      expect(result.statusCode).toBe(200);

      // Verify subscription status was updated to past_due
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE subscriptions'),
        ['past_due', 'sub_test123']
      );

      // Verify payment failure was logged
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO payment_events'),
        expect.arrayContaining([
          expect.any(String),
          'tenant_123',
          'payment_failed',
          'in_test123',
          5980,
          'brl',
          'failed',
        ])
      );
    });
  });

  describe('Processamento de customer.subscription.updated', () => {
    const mockSubscription: Stripe.Subscription = {
      id: 'sub_test123',
      status: 'active',
      current_period_start: 1234567890,
      current_period_end: 1234567890,
    } as any;

    it('deve atualizar subscription', async () => {
      mockConstructWebhookEvent.mockReturnValueOnce({
        id: 'evt_test123',
        type: 'customer.subscription.updated',
        data: {
          object: mockSubscription,
        },
      } as any);

      // Mock subscription update
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const event = createMockEvent(JSON.stringify(mockSubscription), 'sig_test');

      const result = await handler(event);

      expect(result.statusCode).toBe(200);

      // Verify subscription was updated
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE subscriptions'),
        expect.arrayContaining([
          'active',
          expect.any(Date),
          expect.any(Date),
          'sub_test123',
        ])
      );
    });
  });

  describe('Processamento de customer.subscription.deleted', () => {
    const mockDeletedSubscription: Stripe.Subscription = {
      id: 'sub_test123',
      status: 'canceled',
      canceled_at: 1234567890,
      cancel_at_period_end: false,
    } as any;

    it('deve cancelar subscription', async () => {
      mockConstructWebhookEvent.mockReturnValueOnce({
        id: 'evt_test123',
        type: 'customer.subscription.deleted',
        data: {
          object: mockDeletedSubscription,
        },
      } as any);

      // Mock subscription update
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      // Mock tenant query
      mockQuery.mockResolvedValueOnce({
        rows: [{ tenant_id: 'tenant_123' }],
      } as any);

      // Mock payment event insert
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const event = createMockEvent(JSON.stringify(mockDeletedSubscription), 'sig_test');

      const result = await handler(event);

      expect(result.statusCode).toBe(200);

      // Verify subscription was cancelled
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE subscriptions'),
        ['cancelled', 'sub_test123']
      );

      // Verify cancellation was logged
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO payment_events'),
        expect.arrayContaining([
          expect.any(String),
          'tenant_123',
          'subscription_cancelled',
        ])
      );
    });
  });

  describe('Idempotência', () => {
    it('deve processar o mesmo evento apenas uma vez', async () => {
      const mockSession: Stripe.Checkout.Session = {
        id: 'cs_test123',
        customer: 'cus_test123',
        subscription: 'sub_test123',
        payment_status: 'paid',
      } as any;

      mockConstructWebhookEvent.mockReturnValue({
        id: 'evt_test123',
        type: 'checkout.session.completed',
        data: {
          object: mockSession,
        },
      } as any);

      // Mock subscription intent query
      mockQuery.mockResolvedValue({
        rows: [
          {
            id: 'intent_123',
            tenant_id: 'tenant_123',
            selected_agents: JSON.stringify(['agent-1']),
            total_amount_cents: 2990,
            currency: 'brl',
          },
        ],
      } as any);

      // Mock outras queries
      mockQuery.mockResolvedValue({ rows: [] } as any);

      const event = createMockEvent(JSON.stringify(mockSession), 'sig_test');

      // Processar o mesmo evento duas vezes
      const result1 = await handler(event);
      const result2 = await handler(event);

      expect(result1.statusCode).toBe(200);
      expect(result2.statusCode).toBe(200);

      // Ambos devem retornar sucesso
      expect(JSON.parse(result1.body)).toEqual({ received: true });
      expect(JSON.parse(result2.body)).toEqual({ received: true });
    });
  });

  describe('Eventos não tratados', () => {
    it('deve retornar sucesso para eventos não implementados', async () => {
      mockConstructWebhookEvent.mockReturnValueOnce({
        id: 'evt_test123',
        type: 'customer.created',
        data: {
          object: {},
        },
      } as any);

      const event = createMockEvent('{}', 'sig_test');

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual({ received: true });

      // Não deve fazer nenhuma query ao banco
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });
});
