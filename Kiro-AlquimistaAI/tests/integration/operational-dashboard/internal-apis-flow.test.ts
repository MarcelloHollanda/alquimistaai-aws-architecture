/**
 * Testes de integração para fluxo completo de APIs internas
 * Requisitos: 6.1-6.7
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { APIGatewayProxyEventV2 } from 'aws-lambda';

process.env.DB_HOST = process.env.TEST_DB_HOST || 'localhost';
process.env.DB_NAME = process.env.TEST_DB_NAME || 'alquimista_test';
process.env.DB_USER = process.env.TEST_DB_USER || 'postgres';
process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD || 'postgres';

describe('Fluxo Completo de APIs Internas', () => {
  const testTenantId = 'test-tenant-internal';
  const testAdminId = 'test-admin-internal';
  
  let mockEvent: Partial<APIGatewayProxyEventV2>;

  beforeAll(async () => {
    const { query } = await import('../../../lambda/shared/database');
    
    // Criar tenant de teste
    await query(`
      INSERT INTO tenants (id, name, cnpj, segment, plan, status, mrr_estimate)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO NOTHING
    `, [testTenantId, 'Tenant Interno Teste', '98765432000190', 'Saúde', 'enterprise', 'active', 3000.00]);
    
    // Criar usuários de teste
    await query(`
      INSERT INTO tenant_users (tenant_id, cognito_sub, email, full_name, role)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT DO NOTHING
    `, [testTenantId, 'user-sub-1', 'user1@tenant.com', 'Usuário 1', 'ADMIN']);
    
    // Criar agentes de teste
    await query(`
      INSERT INTO tenant_agents (tenant_id, agent_id, status)
      SELECT $1, id, 'active'
      FROM agents
      LIMIT 5
      ON CONFLICT DO NOTHING
    `, [testTenantId]);
  });

  afterAll(async () => {
    const { query } = await import('../../../lambda/shared/database');
    
    await query('DELETE FROM tenant_users WHERE tenant_id = $1', [testTenantId]);
    await query('DELETE FROM tenant_agents WHERE tenant_id = $1', [testTenantId]);
    await query('DELETE FROM tenant_integrations WHERE tenant_id = $1', [testTenantId]);
    await query('DELETE FROM tenant_usage_daily WHERE tenant_id = $1', [testTenantId]);
    await query('DELETE FROM tenants WHERE id = $1', [testTenantId]);
  });

  beforeEach(() => {
    mockEvent = {
      requestContext: {
        authorizer: {
          jwt: {
            claims: {
              sub: testAdminId,
              email: 'admin@alquimista.ai',
              'cognito:groups': ['INTERNAL_ADMIN'],
            },
          },
        },
      } as any,
      queryStringParameters: {},
    };
  });

  it('deve listar todos os tenants', async () => {
    mockEvent.queryStringParameters = { status: 'all' };
    
    const { handler } = await import('../../../lambda/internal/list-tenants');
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    
    expect(body.tenants).toBeDefined();
    expect(Array.isArray(body.tenants)).toBe(true);
    expect(body.total).toBeDefined();
    expect(body.limit).toBeDefined();
    expect(body.offset).toBeDefined();
    
    // Verificar que o tenant de teste está na lista
    const testTenant = body.tenants.find((t: any) => t.id === testTenantId);
    expect(testTenant).toBeDefined();
  });

  it('deve buscar detalhes completos de um tenant', async () => {
    const { handler } = await import('../../../lambda/internal/get-tenant-detail');
    
    mockEvent.pathParameters = { id: testTenantId };
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    
    expect(body.tenant).toBeDefined();
    expect(body.tenant.id).toBe(testTenantId);
    expect(body.users).toBeDefined();
    expect(Array.isArray(body.users)).toBe(true);
    expect(body.agents).toBeDefined();
    expect(Array.isArray(body.agents)).toBe(true);
    expect(body.integrations).toBeDefined();
    expect(body.usage_summary).toBeDefined();
  });

  it('deve buscar agentes de um tenant específico', async () => {
    const { handler } = await import('../../../lambda/internal/get-tenant-agents');
    
    mockEvent.pathParameters = { id: testTenantId };
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    
    expect(body.agents).toBeDefined();
    expect(Array.isArray(body.agents)).toBe(true);
    expect(body.agents.length).toBeGreaterThan(0);
    
    // Verificar estrutura detalhada
    body.agents.forEach((agent: any) => {
      expect(agent.id).toBeDefined();
      expect(agent.name).toBeDefined();
      expect(agent.status).toBeDefined();
      expect(agent.usage_stats).toBeDefined();
    });
  });

  it('deve buscar visão geral de uso da plataforma', async () => {
    mockEvent.queryStringParameters = { period: '30d' };
    
    const { handler } = await import('../../../lambda/internal/get-usage-overview');
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    
    expect(body.period).toBe('30d');
    expect(body.global_stats).toBeDefined();
    expect(body.global_stats.total_tenants).toBeDefined();
    expect(body.global_stats.active_tenants).toBeDefined();
    expect(body.global_stats.total_agents_deployed).toBeDefined();
    expect(body.top_tenants_by_usage).toBeDefined();
    expect(body.top_agents_by_usage).toBeDefined();
    expect(body.daily_trends).toBeDefined();
  });

  it('deve buscar visão financeira global', async () => {
    mockEvent.queryStringParameters = { period: '30d' };
    
    const { handler } = await import('../../../lambda/internal/get-billing-overview');
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    
    expect(body.period).toBe('30d');
    expect(body.financial_summary).toBeDefined();
    expect(body.financial_summary.total_mrr).toBeDefined();
    expect(body.financial_summary.total_arr).toBeDefined();
    expect(body.by_plan).toBeDefined();
    expect(body.by_segment).toBeDefined();
    expect(body.revenue_trend).toBeDefined();
  });

  it('deve filtrar tenants por status', async () => {
    mockEvent.queryStringParameters = { status: 'active' };
    
    const { handler } = await import('../../../lambda/internal/list-tenants');
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    
    // Todos os tenants devem estar ativos
    body.tenants.forEach((tenant: any) => {
      expect(tenant.status).toBe('active');
    });
  });

  it('deve filtrar tenants por plano', async () => {
    mockEvent.queryStringParameters = { plan: 'enterprise' };
    
    const { handler } = await import('../../../lambda/internal/list-tenants');
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    
    // Verificar que o tenant de teste está na lista (é enterprise)
    const testTenant = body.tenants.find((t: any) => t.id === testTenantId);
    if (testTenant) {
      expect(testTenant.plan).toBe('enterprise');
    }
  });

  it('deve buscar tenants por nome ou CNPJ', async () => {
    mockEvent.queryStringParameters = { search: 'Interno' };
    
    const { handler } = await import('../../../lambda/internal/list-tenants');
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    
    // Deve encontrar o tenant de teste
    const testTenant = body.tenants.find((t: any) => t.id === testTenantId);
    expect(testTenant).toBeDefined();
  });

  it('deve implementar paginação corretamente', async () => {
    mockEvent.queryStringParameters = { limit: '5', offset: '0' };
    
    const { handler } = await import('../../../lambda/internal/list-tenants');
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    
    expect(body.tenants.length).toBeLessThanOrEqual(5);
    expect(body.limit).toBe(5);
    expect(body.offset).toBe(0);
  });

  it('deve ordenar tenants por MRR', async () => {
    mockEvent.queryStringParameters = { 
      sort_by: 'mrr_estimate', 
      sort_order: 'desc' 
    };
    
    const { handler } = await import('../../../lambda/internal/list-tenants');
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    
    // Verificar ordenação
    if (body.tenants.length > 1) {
      for (let i = 0; i < body.tenants.length - 1; i++) {
        expect(body.tenants[i].mrr_estimate).toBeGreaterThanOrEqual(
          body.tenants[i + 1].mrr_estimate
        );
      }
    }
  });

  it('deve negar acesso a usuário não interno', async () => {
    // Mudar para usuário tenant
    mockEvent.requestContext!.authorizer!.jwt!.claims['cognito:groups'] = ['TENANT_ADMIN'];
    
    const { handler } = await import('../../../lambda/internal/list-tenants');
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(403);
  });

  it('deve permitir INTERNAL_SUPPORT acessar dados', async () => {
    mockEvent.requestContext!.authorizer!.jwt!.claims['cognito:groups'] = ['INTERNAL_SUPPORT'];
    
    const { handler } = await import('../../../lambda/internal/list-tenants');
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(200);
  });

  it('deve negar INTERNAL_SUPPORT acessar billing', async () => {
    mockEvent.requestContext!.authorizer!.jwt!.claims['cognito:groups'] = ['INTERNAL_SUPPORT'];
    
    const { handler } = await import('../../../lambda/internal/get-billing-overview');
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(403);
  });
});
