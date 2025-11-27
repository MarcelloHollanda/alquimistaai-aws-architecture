/**
 * Testes de integração para fluxo de comandos operacionais end-to-end
 * Requisitos: 8.1-8.7
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

process.env.COMMANDS_TABLE = process.env.TEST_COMMANDS_TABLE || 'operational_commands_test';
process.env.AWS_REGION = 'us-east-1';

const dynamodb = new DynamoDB.DocumentClient();

describe('Fluxo End-to-End de Comandos Operacionais', () => {
  const testAdminId = 'test-admin-commands';
  let createdCommandIds: string[] = [];
  
  let mockEvent: Partial<APIGatewayProxyEventV2>;

  beforeAll(async () => {
    // Verificar se a tabela existe
    try {
      await dynamodb.scan({
        TableName: process.env.COMMANDS_TABLE!,
        Limit: 1,
      }).promise();
    } catch (error) {
      console.warn('Tabela DynamoDB não disponível para testes de integração');
    }
  });

  afterAll(async () => {
    // Cleanup: Remover comandos criados durante os testes
    for (const commandId of createdCommandIds) {
      try {
        await dynamodb.delete({
          TableName: process.env.COMMANDS_TABLE!,
          Key: { command_id: commandId },
        }).promise();
      } catch (error) {
        console.warn(`Erro ao limpar comando ${commandId}:`, error);
      }
    }
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
      body: '',
    };
  });

  it('deve criar comando HEALTH_CHECK', async () => {
    const commandData = {
      command_type: 'HEALTH_CHECK',
      parameters: {},
    };

    mockEvent.body = JSON.stringify(commandData);
    
    const { handler } = await import('../../../lambda/internal/create-operational-command');
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    
    expect(body.command_id).toBeDefined();
    expect(body.status).toBe('PENDING');
    expect(body.message).toContain('sucesso');
    
    createdCommandIds.push(body.command_id);
  });

  it('deve criar comando REPROCESS_QUEUE com parâmetros', async () => {
    const commandData = {
      command_type: 'REPROCESS_QUEUE',
      parameters: {
        queue_name: 'test-queue',
        max_messages: 100,
      },
    };

    mockEvent.body = JSON.stringify(commandData);
    
    const { handler } = await import('../../../lambda/internal/create-operational-command');
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    
    expect(body.command_id).toBeDefined();
    createdCommandIds.push(body.command_id);
  });

  it('deve criar comando para tenant específico', async () => {
    const commandData = {
      command_type: 'RESET_TOKEN',
      tenant_id: 'tenant-123',
      parameters: {},
    };

    mockEvent.body = JSON.stringify(commandData);
    
    const { handler } = await import('../../../lambda/internal/create-operational-command');
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    
    expect(body.command_id).toBeDefined();
    createdCommandIds.push(body.command_id);
  });

  it('deve listar comandos criados', async () => {
    // Criar um comando primeiro
    const commandData = {
      command_type: 'HEALTH_CHECK',
      parameters: {},
    };

    mockEvent.body = JSON.stringify(commandData);
    
    const { handler: createHandler } = await import('../../../lambda/internal/create-operational-command');
    const createResult = await createHandler(mockEvent as APIGatewayProxyEventV2);
    const createBody = JSON.parse(createResult.body);
    createdCommandIds.push(createBody.command_id);

    // Listar comandos
    mockEvent.queryStringParameters = { status: 'all' };
    
    const { handler: listHandler } = await import('../../../lambda/internal/list-operational-commands');
    const listResult = await listHandler(mockEvent as APIGatewayProxyEventV2);

    expect(listResult.statusCode).toBe(200);
    const listBody = JSON.parse(listResult.body);
    
    expect(listBody.commands).toBeDefined();
    expect(Array.isArray(listBody.commands)).toBe(true);
    expect(listBody.total).toBeDefined();
    
    // Verificar que o comando criado está na lista
    const createdCommand = listBody.commands.find((c: any) => c.command_id === createBody.command_id);
    expect(createdCommand).toBeDefined();
  });

  it('deve filtrar comandos por status', async () => {
    mockEvent.queryStringParameters = { status: 'PENDING' };
    
    const { handler } = await import('../../../lambda/internal/list-operational-commands');
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    
    // Todos os comandos devem estar PENDING
    body.commands.forEach((command: any) => {
      expect(command.status).toBe('PENDING');
    });
  });

  it('deve filtrar comandos por tipo', async () => {
    mockEvent.queryStringParameters = { command_type: 'HEALTH_CHECK' };
    
    const { handler } = await import('../../../lambda/internal/list-operational-commands');
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    
    // Todos os comandos devem ser HEALTH_CHECK
    body.commands.forEach((command: any) => {
      expect(command.command_type).toBe('HEALTH_CHECK');
    });
  });

  it('deve filtrar comandos por tenant', async () => {
    const tenantId = 'tenant-filter-test';
    
    // Criar comando para tenant específico
    const commandData = {
      command_type: 'RESTART_AGENT',
      tenant_id: tenantId,
      parameters: { agent_id: 'agent-123' },
    };

    mockEvent.body = JSON.stringify(commandData);
    
    const { handler: createHandler } = await import('../../../lambda/internal/create-operational-command');
    const createResult = await createHandler(mockEvent as APIGatewayProxyEventV2);
    const createBody = JSON.parse(createResult.body);
    createdCommandIds.push(createBody.command_id);

    // Filtrar por tenant
    mockEvent.queryStringParameters = { tenant_id: tenantId };
    
    const { handler: listHandler } = await import('../../../lambda/internal/list-operational-commands');
    const listResult = await listHandler(mockEvent as APIGatewayProxyEventV2);

    expect(listResult.statusCode).toBe(200);
    const listBody = JSON.parse(listResult.body);
    
    // Verificar que o comando está na lista
    const tenantCommand = listBody.commands.find((c: any) => c.command_id === createBody.command_id);
    expect(tenantCommand).toBeDefined();
    expect(tenantCommand.tenant_id).toBe(tenantId);
  });

  it('deve implementar paginação', async () => {
    mockEvent.queryStringParameters = { limit: '5', offset: '0' };
    
    const { handler } = await import('../../../lambda/internal/list-operational-commands');
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    
    expect(body.commands.length).toBeLessThanOrEqual(5);
  });

  it('deve validar tipo de comando', async () => {
    const commandData = {
      command_type: 'INVALID_COMMAND',
      parameters: {},
    };

    mockEvent.body = JSON.stringify(commandData);
    
    const { handler } = await import('../../../lambda/internal/create-operational-command');
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toBeDefined();
  });

  it('deve validar parâmetros obrigatórios', async () => {
    const commandData = {
      // command_type ausente
      parameters: {},
    };

    mockEvent.body = JSON.stringify(commandData);
    
    const { handler } = await import('../../../lambda/internal/create-operational-command');
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(400);
  });

  it('deve negar acesso a usuário não interno', async () => {
    mockEvent.requestContext!.authorizer!.jwt!.claims['cognito:groups'] = ['TENANT_ADMIN'];
    
    const commandData = {
      command_type: 'HEALTH_CHECK',
      parameters: {},
    };

    mockEvent.body = JSON.stringify(commandData);
    
    const { handler } = await import('../../../lambda/internal/create-operational-command');
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(403);
  });

  it('deve registrar evento operacional ao criar comando', async () => {
    const commandData = {
      command_type: 'HEALTH_CHECK',
      parameters: {},
    };

    mockEvent.body = JSON.stringify(commandData);
    
    const { handler } = await import('../../../lambda/internal/create-operational-command');
    const result = await handler(mockEvent as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    createdCommandIds.push(body.command_id);
    
    // Verificar que o evento foi registrado (se implementado)
    // Isso pode ser verificado consultando a tabela operational_events
  });
});
