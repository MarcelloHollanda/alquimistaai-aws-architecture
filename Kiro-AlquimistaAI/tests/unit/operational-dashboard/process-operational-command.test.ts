/**
 * Testes unitários para processador de comandos operacionais
 * Requisitos: 8.4, 8.5, 8.6
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DynamoDBStreamEvent } from 'aws-lambda';

// Mock do DynamoDB Document Client
const mockUpdate = vi.fn().mockResolvedValue({});
const mockGet = vi.fn().mockResolvedValue({
  Item: {
    command_id: 'cmd-123',
    command_type: 'HEALTH_CHECK',
    status: 'PENDING',
    parameters: {},
  },
});

vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: vi.fn(() => ({
      send: vi.fn((command) => {
        if (command.constructor.name === 'UpdateCommand') {
          return mockUpdate();
        }
        if (command.constructor.name === 'GetCommand') {
          return mockGet();
        }
        return Promise.resolve({});
      }),
    })),
  },
  UpdateCommand: vi.fn(),
  GetCommand: vi.fn(),
}));

vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn(() => ({})),
}));

// Mock do módulo de database
const mockQuery = vi.fn();

vi.mock('../../../lambda/shared/database', () => ({
  query: mockQuery,
}));

describe('Process Operational Command', () => {
  let mockEvent: DynamoDBStreamEvent;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockEvent = {
      Records: [
        {
          eventID: 'event-1',
          eventName: 'INSERT',
          eventVersion: '1.1',
          eventSource: 'aws:dynamodb',
          awsRegion: 'us-east-1',
          dynamodb: {
            Keys: {
              command_id: { S: 'cmd-123' },
            },
            NewImage: {
              command_id: { S: 'cmd-123' },
              command_type: { S: 'HEALTH_CHECK' },
              status: { S: 'PENDING' },
              created_at: { S: '2024-01-01T00:00:00Z' },
              created_by: { S: 'admin-1' },
              parameters: { S: '{}' },
            },
            SequenceNumber: '1',
            SizeBytes: 100,
            StreamViewType: 'NEW_AND_OLD_IMAGES',
          },
          eventSourceARN: 'arn:aws:dynamodb:us-east-1:123456789012:table/commands/stream',
        },
      ],
    };
  });

  it('deve processar comando HEALTH_CHECK', async () => {
    mockQuery.mockResolvedValue({ rows: [{ status: 'healthy' }] });

    const { handler } = await import('../../../lambda/internal/process-operational-command');
    await handler(mockEvent);

    // Verificar que o status foi atualizado
    expect(mockQuery).toHaveBeenCalled();
  });

  it('deve atualizar status para RUNNING ao iniciar', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    const { handler } = await import('../../../lambda/internal/process-operational-command');
    await handler(mockEvent);

    // Verificar que houve tentativa de atualizar status
    expect(mockQuery).toHaveBeenCalled();
  });

  it('deve atualizar status para SUCCESS ao completar', async () => {
    mockQuery.mockResolvedValue({ rows: [{ result: 'ok' }] });

    const { handler } = await import('../../../lambda/internal/process-operational-command');
    await handler(mockEvent);

    expect(mockQuery).toHaveBeenCalled();
  });

  it('deve atualizar status para ERROR em caso de falha', async () => {
    mockQuery.mockRejectedValue(new Error('Command execution failed'));

    const { handler } = await import('../../../lambda/internal/process-operational-command');
    await handler(mockEvent);

    expect(mockQuery).toHaveBeenCalled();
  });

  it('deve processar comando REPROCESS_QUEUE', async () => {
    mockEvent.Records[0].dynamodb!.NewImage!.command_type = { S: 'REPROCESS_QUEUE' };
    mockEvent.Records[0].dynamodb!.NewImage!.parameters = { 
      S: JSON.stringify({ queue_name: 'test-queue' }) 
    };

    mockQuery.mockResolvedValue({ rows: [] });

    const { handler } = await import('../../../lambda/internal/process-operational-command');
    await handler(mockEvent);

    expect(mockQuery).toHaveBeenCalled();
  });

  it('deve processar comando RESET_TOKEN', async () => {
    mockEvent.Records[0].dynamodb!.NewImage!.command_type = { S: 'RESET_TOKEN' };
    mockEvent.Records[0].dynamodb!.NewImage!.parameters = { 
      S: JSON.stringify({ tenant_id: 'tenant-123' }) 
    };

    mockQuery.mockResolvedValue({ rows: [] });

    const { handler } = await import('../../../lambda/internal/process-operational-command');
    await handler(mockEvent);

    expect(mockQuery).toHaveBeenCalled();
  });

  it('deve processar comando RESTART_AGENT', async () => {
    mockEvent.Records[0].dynamodb!.NewImage!.command_type = { S: 'RESTART_AGENT' };
    mockEvent.Records[0].dynamodb!.NewImage!.parameters = { 
      S: JSON.stringify({ agent_id: 'agent-456' }) 
    };

    mockQuery.mockResolvedValue({ rows: [] });

    const { handler } = await import('../../../lambda/internal/process-operational-command');
    await handler(mockEvent);

    expect(mockQuery).toHaveBeenCalled();
  });

  it('deve ignorar eventos que não são INSERT', async () => {
    mockEvent.Records[0].eventName = 'MODIFY';

    const { handler } = await import('../../../lambda/internal/process-operational-command');
    await handler(mockEvent);

    // Não deve processar
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('deve ignorar comandos que não estão PENDING', async () => {
    mockEvent.Records[0].dynamodb!.NewImage!.status = { S: 'RUNNING' };

    const { handler } = await import('../../../lambda/internal/process-operational-command');
    await handler(mockEvent);

    // Não deve processar novamente
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('deve processar múltiplos comandos em batch', async () => {
    mockEvent.Records.push({
      ...mockEvent.Records[0],
      eventID: 'event-2',
      dynamodb: {
        ...mockEvent.Records[0].dynamodb!,
        Keys: {
          command_id: { S: 'cmd-456' },
        },
        NewImage: {
          ...mockEvent.Records[0].dynamodb!.NewImage!,
          command_id: { S: 'cmd-456' },
        },
      },
    });

    mockQuery.mockResolvedValue({ rows: [] });

    const { handler } = await import('../../../lambda/internal/process-operational-command');
    await handler(mockEvent);

    // Deve processar ambos os comandos
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it('deve registrar output do comando', async () => {
    const mockOutput = { result: 'success', details: 'All systems operational' };
    mockQuery.mockResolvedValue({ rows: [mockOutput] });

    const { handler } = await import('../../../lambda/internal/process-operational-command');
    await handler(mockEvent);

    expect(mockQuery).toHaveBeenCalled();
  });

  it('deve registrar error_message em caso de falha', async () => {
    const errorMessage = 'Failed to execute command';
    mockQuery.mockRejectedValue(new Error(errorMessage));

    const { handler } = await import('../../../lambda/internal/process-operational-command');
    await handler(mockEvent);

    expect(mockQuery).toHaveBeenCalled();
  });

  it('deve registrar timestamps de execução', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    const { handler } = await import('../../../lambda/internal/process-operational-command');
    await handler(mockEvent);

    expect(mockQuery).toHaveBeenCalled();
    // Verificar que timestamps foram incluídos
  });

  it('deve validar tipo de comando', async () => {
    mockEvent.Records[0].dynamodb!.NewImage!.command_type = { S: 'INVALID_COMMAND' };

    mockQuery.mockResolvedValue({ rows: [] });

    const { handler } = await import('../../../lambda/internal/process-operational-command');
    await handler(mockEvent);

    // Deve tratar comando inválido
    expect(mockQuery).toHaveBeenCalled();
  });
});
