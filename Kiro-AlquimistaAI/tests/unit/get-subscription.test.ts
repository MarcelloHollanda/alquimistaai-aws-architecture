/**
 * Testes unitários para o handler get-subscription
 * Requisitos: 8.1, 8.2
 * 
 * Testa:
 * - Cálculo de valores (subtotal, impostos, total)
 * - Formatação de resposta
 * - Tratamento de erros
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { handler } from '../../lambda/platform/get-subscription';

// Mock do módulo database
jest.mock('../../lambda/shared/database', () => ({
  query: jest.fn(),
}));

// Mock do módulo logger
jest.mock('../../lambda/shared/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { query } from '../../lambda/shared/database';
import { logger } from '../../lambda/shared/logger';

const mockQuery = query as jest.MockedFunction<typeof query>;

// Helper para chamar o handler com tipo correto
async function callHandler(event: Partial<APIGatewayProxyEvent>, context: Partial<Context>): Promise<APIGatewayProxyResult> {
  const result = await handler(event as any, context as any, () => {});
  return result as APIGatewayProxyResult;
}

describe('get-subscription handler', () => {
  let mockEvent: Partial<APIGatewayProxyEvent>;
  let mockContext: Partial<Context>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock event
    mockEvent = {
      queryStringParameters: {
        tenantId: 'tenant-123',
      },
      requestContext: {
        requestId: 'request-123',
        authorizer: {},
      } as any,
    };

    // Setup mock context
    mockContext = {
      functionName: 'get-subscription',
      awsRequestId: 'aws-request-123',
    } as any;
  });

  describe('Cálculo de valores', () => {
    it('deve calcular corretamente subtotal, impostos e total com um agente', async () => {
      // Mock dados da empresa
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'tenant-123',
            company_name: 'Empresa Teste',
            cnpj: '11.222.333/0001-81',
          },
        ],
      } as any);

      // Mock dados da assinatura
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'subscription-123',
            plan_id: 'plan-starter',
            plan_name: 'Starter',
            periodicity: 'monthly',
            status: 'active',
            stripe_customer_id: 'cus_123',
            stripe_subscription_id: 'sub_123',
          },
        ],
      } as any);

      // Mock itens da assinatura (1 agente a R$ 29,90)
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'item-1',
            item_type: 'agent',
            item_id: 'agent-1',
            quantity: 1,
            price_monthly: '29.90',
            item_name: 'Agente de Vendas',
          },
        ],
      } as any);

      const response = await callHandler(mockEvent, mockContext);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Subtotal = 29.90
      expect(body.pricing.subtotal).toBe(29.90);
      
      // Impostos = 29.90 * 0.05 = 1.495 ≈ 1.50
      expect(body.pricing.taxes).toBe(1.50);
      
      // Total = 29.90 + 1.50 = 31.40
      expect(body.pricing.total).toBe(31.40);
    });

    it('deve calcular corretamente com múltiplos agentes', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'tenant-123',
            company_name: 'Empresa Teste',
            cnpj: '11.222.333/0001-81',
          },
        ],
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'subscription-123',
            plan_id: 'plan-starter',
            plan_name: 'Starter',
            periodicity: 'monthly',
            status: 'active',
          },
        ],
      } as any);

      // Mock 3 agentes a R$ 29,90 cada
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'item-1',
            item_type: 'agent',
            item_id: 'agent-1',
            quantity: 1,
            price_monthly: '29.90',
            item_name: 'Agente de Vendas',
          },
          {
            id: 'item-2',
            item_type: 'agent',
            item_id: 'agent-2',
            quantity: 1,
            price_monthly: '29.90',
            item_name: 'Agente de Atendimento',
          },
          {
            id: 'item-3',
            item_type: 'agent',
            item_id: 'agent-3',
            quantity: 1,
            price_monthly: '29.90',
            item_name: 'Agente de Cobrança',
          },
        ],
      } as any);

      const response = await callHandler(mockEvent, mockContext);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Subtotal = 29.90 * 3 = 89.70
      expect(body.pricing.subtotal).toBe(89.70);
      
      // Impostos = 89.70 * 0.05 = 4.485 ≈ 4.48 (arredondamento)
      expect(body.pricing.taxes).toBe(4.48);
      
      // Total = 89.70 + 4.48 = 94.18
      expect(body.pricing.total).toBe(94.18);
    });

    it('deve calcular corretamente com agentes e SubNúcleos', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'tenant-123',
            company_name: 'Empresa Teste',
            cnpj: '11.222.333/0001-81',
          },
        ],
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'subscription-123',
            plan_id: 'plan-professional',
            plan_name: 'Profissional',
            periodicity: 'monthly',
            status: 'active',
          },
        ],
      } as any);

      // Mock 2 agentes + 1 SubNúcleo
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'item-1',
            item_type: 'agent',
            item_id: 'agent-1',
            quantity: 1,
            price_monthly: '29.90',
            item_name: 'Agente de Vendas',
          },
          {
            id: 'item-2',
            item_type: 'agent',
            item_id: 'agent-2',
            quantity: 1,
            price_monthly: '29.90',
            item_name: 'Agente de Atendimento',
          },
          {
            id: 'item-3',
            item_type: 'subnucleo',
            item_id: 'subnucleo-1',
            quantity: 1,
            price_monthly: '365.00',
            item_name: 'SubNúcleo Saúde',
          },
        ],
      } as any);

      const response = await callHandler(mockEvent, mockContext);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Subtotal = (29.90 * 2) + 365.00 = 424.80
      expect(body.pricing.subtotal).toBe(424.80);
      
      // Impostos = 424.80 * 0.05 = 21.24
      expect(body.pricing.taxes).toBe(21.24);
      
      // Total = 424.80 + 21.24 = 446.04
      expect(body.pricing.total).toBe(446.04);
    });

    it('deve arredondar valores corretamente para 2 casas decimais', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'tenant-123',
            company_name: 'Empresa Teste',
            cnpj: '11.222.333/0001-81',
          },
        ],
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'subscription-123',
            plan_id: 'plan-starter',
            plan_name: 'Starter',
            periodicity: 'monthly',
            status: 'active',
          },
        ],
      } as any);

      // Valor que gera arredondamento: 33.33
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'item-1',
            item_type: 'agent',
            item_id: 'agent-1',
            quantity: 1,
            price_monthly: '33.33',
            item_name: 'Agente Teste',
          },
        ],
      } as any);

      const response = await callHandler(mockEvent, mockContext);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Subtotal = 33.33
      expect(body.pricing.subtotal).toBe(33.33);
      
      // Impostos = 33.33 * 0.05 = 1.6665 ≈ 1.67
      expect(body.pricing.taxes).toBe(1.67);
      
      // Total = 33.33 + 1.67 = 35.00
      expect(body.pricing.total).toBe(35.00);
    });
  });

  describe('Formatação de resposta', () => {
    beforeEach(() => {
      // Setup padrão de mocks para testes de formatação
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'tenant-123',
            company_name: 'Empresa Teste Ltda',
            cnpj: '11.222.333/0001-81',
          },
        ],
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'subscription-123',
            plan_id: 'plan-starter',
            plan_name: 'Starter',
            periodicity: 'monthly',
            status: 'active',
            stripe_customer_id: 'cus_123',
            stripe_subscription_id: 'sub_123',
          },
        ],
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'item-1',
            item_type: 'agent',
            item_id: 'agent-1',
            quantity: 1,
            price_monthly: '29.90',
            item_name: 'Agente de Vendas',
          },
        ],
      } as any);
    });

    it('deve retornar estrutura de resposta correta', async () => {
      const response = await callHandler(mockEvent, mockContext);

      expect(response.statusCode).toBe(200);
      expect(response.headers).toEqual({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });

      const body = JSON.parse(response.body);

      // Verificar estrutura completa
      expect(body).toHaveProperty('tenantId');
      expect(body).toHaveProperty('companyName');
      expect(body).toHaveProperty('cnpj');
      expect(body).toHaveProperty('plan');
      expect(body).toHaveProperty('agents');
      expect(body).toHaveProperty('subnucleos');
      expect(body).toHaveProperty('pricing');
      expect(body).toHaveProperty('status');
    });

    it('deve formatar corretamente os dados da empresa', async () => {
      const response = await callHandler(mockEvent, mockContext);

      const body = JSON.parse(response.body);

      expect(body.tenantId).toBe('tenant-123');
      expect(body.companyName).toBe('Empresa Teste Ltda');
      expect(body.cnpj).toBe('11.222.333/0001-81');
    });

    it('deve formatar corretamente os dados do plano', async () => {
      const response = await callHandler(mockEvent, mockContext);

      const body = JSON.parse(response.body);

      expect(body.plan).toEqual({
        id: 'plan-starter',
        name: 'Starter',
        periodicity: 'monthly',
      });
    });

    it('deve formatar corretamente a lista de agentes', async () => {
      const response = await callHandler(mockEvent, mockContext);

      const body = JSON.parse(response.body);

      expect(body.agents).toHaveLength(1);
      expect(body.agents[0]).toEqual({
        id: 'agent-1',
        name: 'Agente de Vendas',
        priceMonthly: 29.90,
      });
    });

    it('deve separar corretamente agentes e SubNúcleos', async () => {
      // Override do mock de itens
      mockQuery.mockReset();
      
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'tenant-123',
            company_name: 'Empresa Teste',
            cnpj: '11.222.333/0001-81',
          },
        ],
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'subscription-123',
            plan_id: 'plan-professional',
            plan_name: 'Profissional',
            periodicity: 'monthly',
            status: 'active',
          },
        ],
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'item-1',
            item_type: 'agent',
            item_id: 'agent-1',
            quantity: 1,
            price_monthly: '29.90',
            item_name: 'Agente de Vendas',
          },
          {
            id: 'item-2',
            item_type: 'subnucleo',
            item_id: 'subnucleo-1',
            quantity: 1,
            price_monthly: '365.00',
            item_name: 'SubNúcleo Saúde',
          },
          {
            id: 'item-3',
            item_type: 'agent',
            item_id: 'agent-2',
            quantity: 1,
            price_monthly: '29.90',
            item_name: 'Agente de Atendimento',
          },
        ],
      } as any);

      const response = await callHandler(mockEvent, mockContext);

      const body = JSON.parse(response.body);

      expect(body.agents).toHaveLength(2);
      expect(body.subnucleos).toHaveLength(1);
      
      expect(body.agents[0].id).toBe('agent-1');
      expect(body.agents[1].id).toBe('agent-2');
      expect(body.subnucleos[0].id).toBe('subnucleo-1');
    });

    it('deve retornar CNPJ vazio quando não fornecido', async () => {
      // Override do mock de empresa sem CNPJ
      mockQuery.mockReset();
      
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'tenant-123',
            company_name: 'Empresa Teste',
            cnpj: null,
          },
        ],
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'subscription-123',
            plan_id: 'plan-starter',
            plan_name: 'Starter',
            periodicity: 'monthly',
            status: 'active',
          },
        ],
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [],
      } as any);

      const response = await callHandler(mockEvent, mockContext);

      const body = JSON.parse(response.body);

      expect(body.cnpj).toBe('');
    });
  });

  describe('Tratamento de erros', () => {
    it('deve retornar erro 400 quando tenantId não é fornecido', async () => {
      mockEvent.queryStringParameters = {};
      mockEvent.requestContext = {
        requestId: 'request-123',
        authorizer: {},
      } as any;

      const response = await callHandler(mockEvent, mockContext);

      expect(response.statusCode).toBe(400);
      expect(response.headers?.['Content-Type']).toBe('application/json');
      
      const body = JSON.parse(response.body);
      expect(body.error).toBe('VALIDATION_ERROR');
      expect(body.message).toBe('tenantId é obrigatório');
      
      expect(logger.warn).toHaveBeenCalledWith('Missing tenantId', {
        requestId: 'request-123',
      });
    });

    it('deve retornar erro 404 quando tenant não é encontrado', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
      } as any);

      const response = await callHandler(mockEvent, mockContext);

      expect(response.statusCode).toBe(404);
      
      const body = JSON.parse(response.body);
      expect(body.error).toBe('NOT_FOUND');
      expect(body.message).toBe('Tenant não encontrado');
      
      expect(logger.warn).toHaveBeenCalledWith('Tenant not found', {
        requestId: 'request-123',
        tenantId: 'tenant-123',
      });
    });

    it('deve retornar erro 404 quando assinatura não é encontrada', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'tenant-123',
            company_name: 'Empresa Teste',
            cnpj: '11.222.333/0001-81',
          },
        ],
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [],
      } as any);

      const response = await callHandler(mockEvent, mockContext);

      expect(response.statusCode).toBe(404);
      
      const body = JSON.parse(response.body);
      expect(body.error).toBe('NOT_FOUND');
      expect(body.message).toBe('Assinatura não encontrada');
      
      expect(logger.warn).toHaveBeenCalledWith('No subscription found', {
        requestId: 'request-123',
        tenantId: 'tenant-123',
      });
    });

    it('deve retornar erro 500 quando ocorre erro de banco de dados', async () => {
      const dbError = new Error('Database connection failed');
      mockQuery.mockRejectedValueOnce(dbError);

      const response = await callHandler(mockEvent, mockContext);

      expect(response.statusCode).toBe(500);
      
      const body = JSON.parse(response.body);
      expect(body.error).toBe('DATABASE_ERROR');
      expect(body.message).toBe('Erro ao buscar dados da assinatura');
      
      expect(logger.error).toHaveBeenCalledWith(
        'Error getting subscription',
        dbError,
        {
          requestId: 'request-123',
          tenantId: 'tenant-123',
        }
      );
    });

    it('deve incluir headers CORS em todas as respostas de erro', async () => {
      mockEvent.queryStringParameters = {};
      mockEvent.requestContext = {
        requestId: 'request-123',
        authorizer: {},
      } as any;

      const response = await callHandler(mockEvent, mockContext);

      expect(response.headers).toEqual({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
    });

    it('deve extrair tenantId do JWT quando não está nos query params', async () => {
      mockEvent.queryStringParameters = {};
      mockEvent.requestContext = {
        requestId: 'request-123',
        authorizer: {
          claims: {
            'custom:tenant_id': 'tenant-from-jwt',
          },
        },
      } as any;

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'tenant-from-jwt',
            company_name: 'Empresa JWT',
            cnpj: '11.222.333/0001-81',
          },
        ],
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'subscription-123',
            plan_id: 'plan-starter',
            plan_name: 'Starter',
            periodicity: 'monthly',
            status: 'active',
          },
        ],
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [],
      } as any);

      const response = await callHandler(mockEvent, mockContext);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.tenantId).toBe('tenant-from-jwt');
    });
  });

  describe('Logging', () => {
    beforeEach(() => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'tenant-123',
            company_name: 'Empresa Teste',
            cnpj: '11.222.333/0001-81',
          },
        ],
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'subscription-123',
            plan_id: 'plan-starter',
            plan_name: 'Starter',
            periodicity: 'monthly',
            status: 'active',
          },
        ],
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'item-1',
            item_type: 'agent',
            item_id: 'agent-1',
            quantity: 1,
            price_monthly: '29.90',
            item_name: 'Agente de Vendas',
          },
        ],
      } as any);
    });

    it('deve logar início da requisição', async () => {
      await handler(mockEvent as any, mockContext as any, () => {});

      expect(logger.info).toHaveBeenCalledWith('Getting subscription for checkout', {
        requestId: 'request-123',
        tenantId: 'tenant-123',
      });
    });

    it('deve logar sucesso com detalhes da assinatura', async () => {
      await handler(mockEvent as any, mockContext as any, () => {});

      // Verificar que foi chamado com os parâmetros corretos (segunda chamada)
      expect(logger.info).toHaveBeenCalledTimes(2);
      
      // O total no log não é arredondado, então é 31.395
      const secondCall = (logger.info as jest.Mock).mock.calls[1];
      expect(secondCall[0]).toBe('Subscription retrieved successfully');
      expect(secondCall[1]).toMatchObject({
        requestId: 'request-123',
        tenantId: 'tenant-123',
        planName: 'Starter',
        agentsCount: 1,
        subnucleosCount: 0,
      });
      expect(secondCall[1].total).toBeCloseTo(31.40, 1);
    });
  });
});

