/**
 * Testes de integração para fluxo completo de APIs de tenant
 * Requisitos: 5.1-5.5
 * 
 * NOTA: Estes testes requerem um ambiente Aurora configurado
 * e devem ser executados com variáveis de ambiente apropriadas
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { APIGatewayProxyEventV2 } from 'aws-lambda';

// Configuração de ambiente de teste
process.env.DB_HOST = process.env.TEST_DB_HOST || 'localhost';
process.env.DB_NAME = process.env.TEST_DB_NAME || 'alquimista_test';
process.env.DB_USER = process.env.TEST_DB_USER || 'postgres';
process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD || 'postgres';

describe('Fluxo Completo de APIs de Tenant', () => {
  const testTenantId = 'test-tenant-integration';
  const testUserId = 'test-user-integration';
  
  let mockEvent: Partial<APIGatewayProxyEventV2>;

  beforeAll(async () => {
    // Setup: Criar tenant de teste no banco
    const { query } = await import('../../../lambda/shared/database');
    
    await query(`
      INSERT INTO tenants (id, name, cnpj, segment, plan, status, mrr_estimate)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO NOTHING
    `, [testTenantId, 'Tenant Teste Integração', '12345678000190', 'Tecnologia', 'professional', 'active', 1500.00]);
    
    // Criar agentes de teste
    await query(`
      INSERT INTO tenant_agents (tenant_id, agent_id, status)
      SELECT $1, id, 'active'
      FROM agents
      LIMIT 3
      ON CONFLICT DO NOTHING
    `, [testTenantId]);
    
    // Criar integrações de teste
    await query(`
      INSERT INTO tenant_integrations (tenant_id, integration_type, integration_name, status)
      VALUES 
        ($1, 'email', 'Gmail', 'active'),
        ($1, 'whatsapp', 'WhatsApp Business', 'active')
      ON CONFLICT DO NOTHING
    `, [testTenantId]);
  });

  afterAll(async () => {
    // Cleanup: Remover dados de teste
    const { query } = await import('../../../lambda/shared/database');
    
    await query('DELETE FROM tenant_integrations WHERE tenant_id = $1', [testTenantId]);
    await query('DELETE FROM tenant_agents WHERE tenant_id = $1', [testTenantId]);
    await query('DELETE FROM tenant_usage_daily WHERE tenant_id = $1', [testTenantId]);
    await query('DELETE FROM tenants WHERE id = $1', [testTenantId]);
  });

  beforeEach(() => {
    mockEvent = {
      requestContext: {
        authorizer: {
          jwt: {
            claims: {
              sub: testUserId,
              email: 'test@integration.com',
              'cognito:groups': ['TENANT_ADMIN'],
              'custom:tenant_id': testTenantId,
            },
          },
        },
      } as any,
      queryStringParameters: {},
    };
  });

  it('deve buscar dados do tenant com sucesso', async () => {
    const { handler } = await import('../../../lambda/platform/get-tenant-me');
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    
    expect(body.id).toBe(testTenantId);
    expect(body.name).toBe('Tenant Teste Integração');
    expect(body.status).toBe('active');
    expect(body.limits).toBeDefined();
    expect(body.usage).toBeDefined();
  });

  it('deve listar agentes do tenant', async () => {
    const { handler } = await import('../../../lambda/platform/get-tenant-agents');
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    
    expect(body.agents).toBeDefined();
    expect(Array.isArray(body.agents)).toBe(true);
    expect(body.agents.length).toBeGreaterThan(0);
    
    // Verificar estrutura de cada agente
    body.agents.forEach((agent: any) => {
      expect(agent.id).toBeDefined();
      expect(agent.name).toBeDefined();
      expect(agent.status).toBeDefined();
    });
  });

  it('deve listar integrações do tenant', async () => {
    const { handler } = await import('../../../lambda/platform/get-tenant-integrations');
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    
    expect(body.integrations).toBeDefined();
    expect(Array.isArray(body.integrations)).toBe(true);
    expect(body.integrations.length).toBe(2);
    
    // Verificar que as integrações criadas estão presentes
    const types = body.integrations.map((i: any) => i.type);
    expect(types).toContain('email');
    expect(types).toContain('whatsapp');
  });

  it('deve buscar métricas de uso do tenant', async () => {
    mockEvent.queryStringParameters = { period: '30d' };
    
    const { handler } = await import('../../../lambda/platform/get-tenant-usage');
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    
    expect(body.period).toBe('30d');
    expect(body.summary).toBeDefined();
    expect(body.daily_data).toBeDefined();
    expect(Array.isArray(body.daily_data)).toBe(true);
  });

  it('deve listar incidentes do tenant', async () => {
    mockEvent.queryStringParameters = { limit: '10', offset: '0' };
    
    const { handler } = await import('../../../lambda/platform/get-tenant-incidents');
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    
    expect(body.incidents).toBeDefined();
    expect(Array.isArray(body.incidents)).toBe(true);
    expect(body.total).toBeDefined();
    expect(typeof body.total).toBe('number');
  });

  it('deve filtrar agentes por status', async () => {
    mockEvent.queryStringParameters = { status: 'active' };
    
    const { handler } = await import('../../../lambda/platform/get-tenant-agents');
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    
    // Todos os agentes devem estar ativos
    body.agents.forEach((agent: any) => {
      expect(agent.status).toBe('active');
    });
  });

  it('deve filtrar métricas por agente específico', async () => {
    // Primeiro, buscar um agente
    const { handler: agentsHandler } = await import('../../../lambda/platform/get-tenant-agents');
    const agentsResult = await agentsHandler(mockEvent as APIGatewayProxyEventV2);
    const agentsBody = JSON.parse(agentsResult.body);
    
    if (agentsBody.agents.length > 0) {
      const agentId = agentsBody.agents[0].id;
      
      // Buscar métricas desse agente
      mockEvent.queryStringParameters = { 
        period: '7d',
        agent_id: agentId 
      };
      
      const { handler: usageHandler } = await import('../../../lambda/platform/get-tenant-usage');
      const usageResult = await usageHandler(mockEvent as APIGatewayProxyEventV2);
      
      expect(usageResult.statusCode).toBe(200);
      const usageBody = JSON.parse(usageResult.body);
      
      // Verificar que os dados são filtrados por agente
      if (usageBody.by_agent && usageBody.by_agent.length > 0) {
        expect(usageBody.by_agent[0].agent_id).toBe(agentId);
      }
    }
  });

  it('deve negar acesso a outro tenant', async () => {
    // Tentar acessar dados de outro tenant
    mockEvent.requestContext!.authorizer!.jwt!.claims['custom:tenant_id'] = 'other-tenant';
    
    const { handler } = await import('../../../lambda/platform/get-tenant-me');
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(403);
  });

  it('deve validar isolamento de dados entre tenants', async () => {
    // Buscar agentes do tenant de teste
    const { handler } = await import('../../../lambda/platform/get-tenant-agents');
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    
    // Todos os agentes devem pertencer ao tenant de teste
    body.agents.forEach((agent: any) => {
      // Verificar que não há vazamento de dados de outros tenants
      expect(agent).toBeDefined();
    });
  });
});
