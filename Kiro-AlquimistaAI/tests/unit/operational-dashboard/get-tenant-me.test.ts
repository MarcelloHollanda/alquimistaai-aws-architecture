/**
 * Testes unitários para GET /tenant/me
 * Requisitos: 5.1, 6.1
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { APIGatewayProxyEventV2 } from 'aws-lambda';

// Mock do módulo de autorização
const mockExtractAuthContext = vi.fn();
const mockRequireTenantAccess = vi.fn();

vi.mock('../../../lambda/shared/authorization-middleware', () => ({
  extractAuthContext: mockExtractAuthContext,
  requireTenantAccess: mockRequireTenantAccess,
}));

// Mock do módulo de database
const mockQuery = vi.fn();

vi.mock('../../../lambda/shared/database', () => ({
  query: mockQuery,
}));

describe('GET /tenant/me', () => {
  let mockEvent: Partial<APIGatewayProxyEventV2>;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockEvent = {
      requestContext: {
        authorizer: {
          jwt: {
            claims: {
              sub: 'user-123',
              email: 'user@tenant.com',
              'cognito:groups': ['TENANT_ADMIN'],
              'custom:tenant_id': 'tenant-123',
            },
          },
        },
      } as any,
    };
  });

  it('deve retornar dados do tenant com sucesso', async () => {
    const mockContext = {
      userId: 'user-123',
      email: 'user@tenant.com',
      groups: ['TENANT_ADMIN'],
      tenantId: 'tenant-123',
    };

    const mockTenantData = {
      id: 'tenant-123',
      name: 'Empresa Teste',
      cnpj: '12345678000190',
      segment: 'Tecnologia',
      plan: 'professional',
      status: 'active',
      mrr_estimate: 1500.00,
      created_at: '2024-01-01T00:00:00Z',
    };

    const mockLimits = {
      max_agents: 10,
      max_users: 5,
      max_requests_per_month: 100000,
    };

    const mockUsage = {
      active_agents: 5,
      active_users: 3,
      requests_this_month: 45000,
    };

    mockExtractAuthContext.mockReturnValue(mockContext);
    mockRequireTenantAccess.mockReturnValue(undefined); // Acesso permitido
    mockQuery
      .mockResolvedValueOnce({ rows: [mockTenantData] })
      .mockResolvedValueOnce({ rows: [mockLimits] })
      .mockResolvedValueOnce({ rows: [mockUsage] });

    // Importar handler dinamicamente após mocks
    const { handler } = await import('../../../lambda/platform/get-tenant-me');
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.id).toBe('tenant-123');
    expect(body.name).toBe('Empresa Teste');
    expect(body.limits).toBeDefined();
    expect(body.usage).toBeDefined();
  });

  it('deve validar acesso ao tenant', async () => {
    const mockContext = {
      userId: 'user-123',
      email: 'user@tenant.com',
      groups: ['TENANT_ADMIN'],
      tenantId: 'tenant-123',
    };

    mockExtractAuthContext.mockReturnValue(mockContext);
    mockRequireTenantAccess.mockImplementation(() => {
      throw new Error('Forbidden: Tenant access denied');
    });

    const { handler } = await import('../../../lambda/platform/get-tenant-me');
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(403);
    expect(mockRequireTenantAccess).toHaveBeenCalledWith(mockContext, 'tenant-123');
  });

  it('deve retornar erro 400 se tenant_id ausente', async () => {
    const mockContext = {
      userId: 'user-123',
      email: 'user@tenant.com',
      groups: ['TENANT_ADMIN'],
      // tenantId ausente
    };

    mockExtractAuthContext.mockReturnValue(mockContext);

    const { handler } = await import('../../../lambda/platform/get-tenant-me');
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error || body.message).toBeDefined();
  });

  it('deve permitir usuário interno acessar qualquer tenant', async () => {
    const mockContext = {
      userId: 'admin-1',
      email: 'admin@alquimista.ai',
      groups: ['INTERNAL_ADMIN'],
      tenantId: undefined,
    };

    const mockTenantData = {
      id: 'tenant-456',
      name: 'Outro Tenant',
      status: 'active',
    };

    const mockLimits = {
      max_agents: 10,
      max_users: 5,
      max_requests_per_month: 100000,
    };

    const mockUsage = {
      active_agents: 5,
      active_users: 3,
      requests_this_month: 45000,
    };

    mockEvent.queryStringParameters = { tenant_id: 'tenant-456' };

    mockExtractAuthContext.mockReturnValue(mockContext);
    mockRequireTenantAccess.mockReturnValue(undefined); // Acesso permitido para admin
    mockQuery
      .mockResolvedValueOnce({ rows: [mockTenantData] })
      .mockResolvedValueOnce({ rows: [mockLimits] })
      .mockResolvedValueOnce({ rows: [mockUsage] });

    const { handler } = await import('../../../lambda/platform/get-tenant-me');
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(200);
    expect(mockRequireTenantAccess).toHaveBeenCalledWith(mockContext, 'tenant-456');
  });

  it('deve tratar erro de banco de dados', async () => {
    const mockContext = {
      userId: 'user-123',
      email: 'user@tenant.com',
      groups: ['TENANT_ADMIN'],
      tenantId: 'tenant-123',
    };

    mockExtractAuthContext.mockReturnValue(mockContext);
    mockRequireTenantAccess.mockReturnValue(undefined); // Acesso permitido
    mockQuery.mockRejectedValue(new Error('Database connection failed'));

    const { handler } = await import('../../../lambda/platform/get-tenant-me');
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.error || body.message).toBeDefined();
  });
});
