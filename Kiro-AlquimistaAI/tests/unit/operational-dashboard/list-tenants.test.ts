/**
 * Testes unitários para GET /internal/tenants
 * Requisitos: 6.1, 6.2, 12.2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { APIGatewayProxyEventV2 } from 'aws-lambda';

vi.mock('../../../lambda/shared/authorization-middleware', () => ({
  extractAuthContext: vi.fn(),
  requireInternal: vi.fn(),
}));

vi.mock('../../../lambda/shared/database', () => ({
  query: vi.fn(),
}));

vi.mock('../../../lambda/shared/redis-client', () => ({
  getCacheManager: vi.fn(() => Promise.resolve({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(true),
    getOrSet: vi.fn((key: string, fetcher: () => any) => fetcher()),
    invalidate: vi.fn().mockResolvedValue(true),
  })),
  buildCacheKey: vi.fn((...args: any[]) => args.join(':')),
  CacheTTL: {
    TENANTS_LIST: 300,
  },
}));

import { extractAuthContext, requireInternal } from '../../../lambda/shared/authorization-middleware';
import { query } from '../../../lambda/shared/database';

describe('GET /internal/tenants', () => {
  let mockEvent: Partial<APIGatewayProxyEventV2>;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockEvent = {
      requestContext: {
        authorizer: {
          jwt: {
            claims: {
              sub: 'admin-1',
              email: 'admin@alquimista.ai',
              'cognito:groups': ['INTERNAL_ADMIN'],
            },
          },
        },
      } as any,
      queryStringParameters: {},
    };
  });

  it('deve listar todos os tenants ativos', async () => {
    const mockContext = {
      userId: 'admin-1',
      email: 'admin@alquimista.ai',
      groups: ['INTERNAL_ADMIN'],
    };

    const mockTenants = [
      {
        id: 'tenant-1',
        name: 'Empresa A',
        cnpj: '11111111000111',
        segment: 'Tecnologia',
        plan: 'professional',
        status: 'active',
        mrr_estimate: 1500.00,
        active_agents: 5,
        active_users: 3,
        requests_last_30_days: 45000,
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'tenant-2',
        name: 'Empresa B',
        cnpj: '22222222000122',
        segment: 'Saúde',
        plan: 'enterprise',
        status: 'active',
        mrr_estimate: 3000.00,
        active_agents: 10,
        active_users: 8,
        requests_last_30_days: 120000,
        created_at: '2024-01-15T00:00:00Z',
      },
    ];

    (extractAuthContext as any).mockReturnValue(mockContext);
    (requireInternal as any).mockImplementation(() => {});
    
    // Mock query: primeira chamada retorna count, segunda retorna tenants
    (query as any)
      .mockResolvedValueOnce({ rows: [{ total: 2 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: mockTenants, rowCount: 2 });

    const { handler } = await import('../../../lambda/internal/list-tenants');
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.tenants).toHaveLength(2);
    expect(body.total).toBe(2);
    expect(requireInternal).toHaveBeenCalledWith(mockContext);
  });

  it('deve filtrar por status', async () => {
    const mockContext = {
      userId: 'admin-1',
      email: 'admin@alquimista.ai',
      groups: ['INTERNAL_ADMIN'],
    };

    mockEvent.queryStringParameters = { status: 'inactive' };

    const mockInactiveTenants = [
      {
        id: 'tenant-3',
        name: 'Empresa C',
        status: 'inactive',
        cnpj: '',
        segment: '',
        plan: '',
        mrr_estimate: 0,
        created_at: '',
        active_agents: 0,
        active_users: 0,
        requests_last_30_days: 0,
      },
    ];

    (extractAuthContext as any).mockReturnValue(mockContext);
    (requireInternal as any).mockImplementation(() => {});
    (query as any)
      .mockResolvedValueOnce({ rows: [{ total: 1 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: mockInactiveTenants, rowCount: 1 });

    const { handler } = await import('../../../lambda/internal/list-tenants');
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.tenants).toHaveLength(1);
    expect(body.tenants[0].status).toBe('inactive');
  });

  it('deve filtrar por plano', async () => {
    const mockContext = {
      userId: 'admin-1',
      email: 'admin@alquimista.ai',
      groups: ['INTERNAL_ADMIN'],
    };

    mockEvent.queryStringParameters = { plan: 'enterprise' };

    (extractAuthContext as any).mockReturnValue(mockContext);
    (requireInternal as any).mockImplementation(() => {});
    (query as any)
      .mockResolvedValueOnce({ rows: [{ total: 0 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const { handler } = await import('../../../lambda/internal/list-tenants');
    await handler(mockEvent as APIGatewayProxyEventV2);

    expect(query).toHaveBeenCalled();
    const queryCall = (query as any).mock.calls[0];
    expect(queryCall[0]).toContain('plan');
  });

  it('deve buscar por nome ou CNPJ', async () => {
    const mockContext = {
      userId: 'admin-1',
      email: 'admin@alquimista.ai',
      groups: ['INTERNAL_ADMIN'],
    };

    mockEvent.queryStringParameters = { search: 'Empresa A' };

    (extractAuthContext as any).mockReturnValue(mockContext);
    (requireInternal as any).mockImplementation(() => {});
    (query as any)
      .mockResolvedValueOnce({ rows: [{ total: 0 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const { handler } = await import('../../../lambda/internal/list-tenants');
    await handler(mockEvent as APIGatewayProxyEventV2);

    expect(query).toHaveBeenCalled();
    const queryCall = (query as any).mock.calls[0];
    expect(queryCall[0]).toContain('ILIKE');
  });

  it('deve implementar paginação', async () => {
    const mockContext = {
      userId: 'admin-1',
      email: 'admin@alquimista.ai',
      groups: ['INTERNAL_ADMIN'],
    };

    mockEvent.queryStringParameters = { limit: '10', offset: '20' };

    (extractAuthContext as any).mockReturnValue(mockContext);
    (requireInternal as any).mockImplementation(() => {});
    (query as any)
      .mockResolvedValueOnce({ rows: [{ total: 0 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const { handler } = await import('../../../lambda/internal/list-tenants');
    await handler(mockEvent as APIGatewayProxyEventV2);

    expect(query).toHaveBeenCalled();
    const queryCall = (query as any).mock.calls[1]; // Segunda chamada (primeira é count)
    expect(queryCall[0]).toContain('LIMIT');
    expect(queryCall[0]).toContain('OFFSET');
  });

  it('deve ordenar resultados', async () => {
    const mockContext = {
      userId: 'admin-1',
      email: 'admin@alquimista.ai',
      groups: ['INTERNAL_ADMIN'],
    };

    mockEvent.queryStringParameters = { 
      sort_by: 'mrr_estimate', 
      sort_order: 'desc' 
    };

    (extractAuthContext as any).mockReturnValue(mockContext);
    (requireInternal as any).mockImplementation(() => {});
    (query as any)
      .mockResolvedValueOnce({ rows: [{ total: 0 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const { handler } = await import('../../../lambda/internal/list-tenants');
    await handler(mockEvent as APIGatewayProxyEventV2);

    expect(query).toHaveBeenCalled();
    const queryCall = (query as any).mock.calls[1]; // Segunda chamada (primeira é count)
    expect(queryCall[0]).toContain('ORDER BY');
  });

  it('deve negar acesso a usuário não interno', async () => {
    const mockContext = {
      userId: 'user-1',
      email: 'user@tenant.com',
      groups: ['TENANT_ADMIN'],
    };

    (extractAuthContext as any).mockReturnValue(mockContext);
    (requireInternal as any).mockImplementation(() => {
      throw new Error('Forbidden: Internal access required');
    });

    const { handler } = await import('../../../lambda/internal/list-tenants');
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(403);
  });

  it('deve usar valores padrão para paginação', async () => {
    const mockContext = {
      userId: 'admin-1',
      email: 'admin@alquimista.ai',
      groups: ['INTERNAL_ADMIN'],
    };

    // Sem parâmetros de paginação
    mockEvent.queryStringParameters = {};

    (extractAuthContext as any).mockReturnValue(mockContext);
    (requireInternal as any).mockImplementation(() => {});
    (query as any)
      .mockResolvedValueOnce({ rows: [{ total: 0 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const { handler } = await import('../../../lambda/internal/list-tenants');
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.limit).toBe(50); // Valor padrão
    expect(body.offset).toBe(0); // Valor padrão
  });
});
