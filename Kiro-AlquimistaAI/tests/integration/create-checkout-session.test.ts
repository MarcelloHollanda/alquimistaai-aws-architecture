/**
 * Integration Tests: POST /api/billing/create-checkout-session
 * 
 * Testa a criação de sessões de checkout do Stripe com dados válidos e inválidos
 */

import { handler } from '../../lambda/platform/create-checkout-session';
import { APIGatewayProxyEvent } from 'aws-lambda';

// Mock do Stripe client
jest.mock('../../lambda/shared/stripe-client', () => ({
  createCheckoutSession: jest.fn(),
  createOrGetCustomer: jest.fn(),
}));

// Mock do database
jest.mock('../../lambda/shared/database', () => ({
  query: jest.fn(),
}));

import { createCheckoutSession, createOrGetCustomer } from '../../lambda/shared/stripe-client';
import { query } from '../../lambda/shared/database';

const mockCreateCheckoutSession = createCheckoutSession as jest.MockedFunction<typeof createCheckoutSession>;
const mockCreateOrGetCustomer = createOrGetCustomer as jest.MockedFunction<typeof createOrGetCustomer>;
const mockQuery = query as jest.MockedFunction<typeof query>;

describe('POST /api/billing/create-checkout-session', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup environment variables
    process.env.FRONTEND_URL = 'https://app.alquimista.ai';
    process.env.STRIPE_AGENT_PRICE_ID = 'price_test_agent';
  });

  const createMockEvent = (body: any): APIGatewayProxyEvent => ({
    body: JSON.stringify(body),
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: '/api/billing/create-checkout-session',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: '',
  });

  describe('Validação de dados', () => {
    it('deve retornar erro 400 quando body está ausente', async () => {
      const event = createMockEvent(null);
      event.body = null;

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        error: 'MISSING_BODY',
        message: 'Request body é obrigatório',
      });
    });

    it('deve retornar erro 400 quando tenantId está ausente', async () => {
      const event = createMockEvent({
        selectedAgents: ['agent-1'],
        userEmail: 'test@example.com',
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        error: 'VALIDATION_ERROR',
        message: 'tenantId, selectedAgents e userEmail são obrigatórios',
      });
    });

    it('deve retornar erro 400 quando selectedAgents está vazio', async () => {
      const event = createMockEvent({
        tenantId: 'tenant-123',
        selectedAgents: [],
        userEmail: 'test@example.com',
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        error: 'INVALID_AGENTS',
        message: 'Pelo menos um agente deve ser selecionado',
      });
    });

    it('deve retornar erro 400 quando email é inválido', async () => {
      const event = createMockEvent({
        tenantId: 'tenant-123',
        selectedAgents: ['agent-1'],
        userEmail: 'invalid-email',
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        error: 'INVALID_EMAIL',
        message: 'Formato de e-mail inválido',
      });
    });
  });

  describe('Criação de sessão com dados válidos', () => {
    it('deve criar sessão de checkout com sucesso', async () => {
      const tenantId = 'tenant-123';
      const selectedAgents = ['agent-1', 'agent-2'];
      const userEmail = 'test@example.com';
      const userName = 'Test User';

      // Mock tenant query
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: tenantId,
            name: 'Test Company',
            cnpj: '12345678000190',
          },
        ],
      } as any);

      // Mock agents query
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 'agent-1', name: 'Agent 1' },
          { id: 'agent-2', name: 'Agent 2' },
        ],
      } as any);

      // Mock Stripe customer creation
      mockCreateOrGetCustomer.mockResolvedValueOnce({
        id: 'cus_test123',
        email: userEmail,
      } as any);

      // Mock Stripe checkout session creation
      mockCreateCheckoutSession.mockResolvedValueOnce({
        id: 'cs_test123',
        url: 'https://checkout.stripe.com/test',
      } as any);

      // Mock subscription intent insert
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const event = createMockEvent({
        tenantId,
        selectedAgents,
        userEmail,
        userName,
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      
      const response = JSON.parse(result.body);
      expect(response).toEqual({
        checkoutUrl: 'https://checkout.stripe.com/test',
        sessionId: 'cs_test123',
        totalAmount: 5980, // 2 agents * 2990 cents
        currency: 'brl',
      });

      // Verify Stripe customer was created
      expect(mockCreateOrGetCustomer).toHaveBeenCalledWith({
        email: userEmail,
        name: userName,
        metadata: {
          tenantId,
          tenantName: 'Test Company',
          cnpj: '12345678000190',
        },
      });

      // Verify Stripe checkout session was created
      expect(mockCreateCheckoutSession).toHaveBeenCalledWith({
        customerId: 'cus_test123',
        customerEmail: userEmail,
        priceId: 'price_test_agent',
        quantity: 2,
        successUrl: expect.stringContaining('/app/billing/success'),
        cancelUrl: expect.stringContaining('/app/billing/cancel'),
        metadata: {
          tenantId,
          agentIds: JSON.stringify(selectedAgents),
          totalAmount: '5980',
          currency: 'brl',
        },
      });
    });

    it('deve retornar erro 404 quando tenant não existe', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
      } as any);

      const event = createMockEvent({
        tenantId: 'nonexistent-tenant',
        selectedAgents: ['agent-1'],
        userEmail: 'test@example.com',
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body)).toEqual({
        error: 'TENANT_NOT_FOUND',
        message: 'Empresa não encontrada',
      });
    });

    it('deve retornar erro 400 quando agentes não existem', async () => {
      // Mock tenant query
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'tenant-123',
            name: 'Test Company',
            cnpj: '12345678000190',
          },
        ],
      } as any);

      // Mock agents query - retorna menos agentes do que solicitado
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 'agent-1', name: 'Agent 1' },
        ],
      } as any);

      const event = createMockEvent({
        tenantId: 'tenant-123',
        selectedAgents: ['agent-1', 'agent-2', 'agent-3'],
        userEmail: 'test@example.com',
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        error: 'INVALID_AGENTS',
        message: 'Um ou mais agentes selecionados não existem',
      });
    });
  });

  describe('Tratamento de erros do Stripe', () => {
    beforeEach(() => {
      // Setup mocks básicos
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'tenant-123', name: 'Test Company', cnpj: '12345678000190' }],
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'agent-1', name: 'Agent 1' }],
      } as any);

      mockCreateOrGetCustomer.mockResolvedValueOnce({
        id: 'cus_test123',
        email: 'test@example.com',
      } as any);
    });

    it('deve tratar erro de cartão do Stripe', async () => {
      const stripeError = new Error('Card declined') as any;
      stripeError.type = 'StripeCardError';

      mockCreateCheckoutSession.mockRejectedValueOnce(stripeError);

      const event = createMockEvent({
        tenantId: 'tenant-123',
        selectedAgents: ['agent-1'],
        userEmail: 'test@example.com',
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        error: 'PAYMENT_ERROR',
        message: 'Erro no processamento do pagamento',
      });
    });

    it('deve tratar erro de request inválido do Stripe', async () => {
      const stripeError = new Error('Invalid request') as any;
      stripeError.type = 'StripeInvalidRequestError';

      mockCreateCheckoutSession.mockRejectedValueOnce(stripeError);

      const event = createMockEvent({
        tenantId: 'tenant-123',
        selectedAgents: ['agent-1'],
        userEmail: 'test@example.com',
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        error: 'INVALID_REQUEST',
        message: 'Dados de pagamento inválidos',
      });
    });

    it('deve tratar erro genérico', async () => {
      mockCreateCheckoutSession.mockRejectedValueOnce(new Error('Unknown error'));

      const event = createMockEvent({
        tenantId: 'tenant-123',
        selectedAgents: ['agent-1'],
        userEmail: 'test@example.com',
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body)).toEqual({
        error: 'INTERNAL_ERROR',
        message: 'Erro ao criar sessão de checkout',
      });
    });
  });

  describe('Cálculo de valores', () => {
    beforeEach(() => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'tenant-123', name: 'Test Company', cnpj: '12345678000190' }],
      } as any);

      mockCreateOrGetCustomer.mockResolvedValueOnce({
        id: 'cus_test123',
        email: 'test@example.com',
      } as any);

      mockCreateCheckoutSession.mockResolvedValueOnce({
        id: 'cs_test123',
        url: 'https://checkout.stripe.com/test',
      } as any);

      mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    });

    it('deve calcular corretamente o valor para 1 agente', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'agent-1', name: 'Agent 1' }],
      } as any);

      const event = createMockEvent({
        tenantId: 'tenant-123',
        selectedAgents: ['agent-1'],
        userEmail: 'test@example.com',
      });

      const result = await handler(event);
      const response = JSON.parse(result.body);

      expect(response.totalAmount).toBe(2990); // R$ 29.90
    });

    it('deve calcular corretamente o valor para 5 agentes', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 'agent-1', name: 'Agent 1' },
          { id: 'agent-2', name: 'Agent 2' },
          { id: 'agent-3', name: 'Agent 3' },
          { id: 'agent-4', name: 'Agent 4' },
          { id: 'agent-5', name: 'Agent 5' },
        ],
      } as any);

      const event = createMockEvent({
        tenantId: 'tenant-123',
        selectedAgents: ['agent-1', 'agent-2', 'agent-3', 'agent-4', 'agent-5'],
        userEmail: 'test@example.com',
      });

      const result = await handler(event);
      const response = JSON.parse(result.body);

      expect(response.totalAmount).toBe(14950); // 5 * R$ 29.90
    });
  });
});
