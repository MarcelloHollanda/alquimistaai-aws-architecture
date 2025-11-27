/**
 * Testes unitários para agregação de métricas diárias
 * Requisitos: 9.1, 9.2, 9.3, 9.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScheduledEvent } from 'aws-lambda';

vi.mock('../../../lambda/shared/database', () => ({
  query: vi.fn(),
}));

import { query } from '../../../lambda/shared/database';

describe('Aggregate Daily Metrics', () => {
  let mockEvent: ScheduledEvent;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockEvent = {
      version: '0',
      id: 'event-id',
      'detail-type': 'Scheduled Event',
      source: 'aws.events',
      account: '123456789012',
      time: '2024-01-02T02:00:00Z',
      region: 'us-east-1',
      resources: [],
      detail: {},
    };
  });

  it('deve agregar métricas do dia anterior', async () => {
    (query as any).mockResolvedValue({ rowCount: 10 });

    const { handler } = await import('../../../lambda/internal/aggregate-daily-metrics');
    await handler(mockEvent);

    expect(query).toHaveBeenCalled();
    const queryCall = (query as any).mock.calls[0];
    
    // Verificar que a query contém INSERT INTO tenant_usage_daily
    expect(queryCall[0]).toContain('INSERT INTO tenant_usage_daily');
    expect(queryCall[0]).toContain('tenant_id');
    expect(queryCall[0]).toContain('agent_id');
    expect(queryCall[0]).toContain('total_requests');
    expect(queryCall[0]).toContain('successful_requests');
    expect(queryCall[0]).toContain('failed_requests');
  });

  it('deve calcular data do dia anterior corretamente', async () => {
    (query as any).mockResolvedValue({ rowCount: 5 });

    const { handler } = await import('../../../lambda/internal/aggregate-daily-metrics');
    await handler(mockEvent);

    const queryCall = (query as any).mock.calls[0];
    const queryParams = queryCall[1];
    
    // Verificar que a data é do dia anterior
    const yesterday = new Date(mockEvent.time);
    yesterday.setDate(yesterday.getDate() - 1);
    const expectedDate = yesterday.toISOString().split('T')[0];
    
    expect(queryParams[0]).toBe(expectedDate);
  });

  it('deve agregar por tenant e agente', async () => {
    (query as any).mockResolvedValue({ rowCount: 15 });

    const { handler } = await import('../../../lambda/internal/aggregate-daily-metrics');
    await handler(mockEvent);

    const queryCall = (query as any).mock.calls[0];
    
    // Verificar GROUP BY
    expect(queryCall[0]).toContain('GROUP BY');
    expect(queryCall[0]).toContain('tenant_id');
    expect(queryCall[0]).toContain('agent_id');
  });

  it('deve calcular métricas agregadas', async () => {
    (query as any).mockResolvedValue({ rowCount: 8 });

    const { handler } = await import('../../../lambda/internal/aggregate-daily-metrics');
    await handler(mockEvent);

    const queryCall = (query as any).mock.calls[0];
    
    // Verificar cálculos
    expect(queryCall[0]).toContain('COUNT(*)'); // total_requests
    expect(queryCall[0]).toContain('AVG'); // avg_response_time_ms
    expect(queryCall[0]).toContain('SUM'); // total_tokens_used
  });

  it('deve usar ON CONFLICT para atualizar registros existentes', async () => {
    (query as any).mockResolvedValue({ rowCount: 3 });

    const { handler } = await import('../../../lambda/internal/aggregate-daily-metrics');
    await handler(mockEvent);

    const queryCall = (query as any).mock.calls[0];
    
    // Verificar ON CONFLICT
    expect(queryCall[0]).toContain('ON CONFLICT');
    expect(queryCall[0]).toContain('DO UPDATE SET');
  });

  it('deve tratar erro de banco de dados', async () => {
    (query as any).mockRejectedValue(new Error('Database error'));

    const { handler } = await import('../../../lambda/internal/aggregate-daily-metrics');
    
    // Não deve lançar erro, apenas logar
    await expect(handler(mockEvent)).rejects.toThrow('Database error');
  });

  it('deve logar início e fim da agregação', async () => {
    const consoleSpy = vi.spyOn(console, 'log');
    (query as any).mockResolvedValue({ rowCount: 5 });

    const { handler } = await import('../../../lambda/internal/aggregate-daily-metrics');
    await handler(mockEvent);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Aggregating metrics'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('complete'));
  });

  it('deve filtrar por data específica', async () => {
    (query as any).mockResolvedValue({ rowCount: 7 });

    const { handler } = await import('../../../lambda/internal/aggregate-daily-metrics');
    await handler(mockEvent);

    const queryCall = (query as any).mock.calls[0];
    
    // Verificar filtro WHERE DATE(created_at) = DATE($1)
    expect(queryCall[0]).toContain('WHERE');
    expect(queryCall[0]).toContain('DATE');
    expect(queryCall[0]).toContain('created_at');
  });

  it('deve agregar apenas requisições do dia anterior', async () => {
    (query as any).mockResolvedValue({ rowCount: 12 });

    const { handler } = await import('../../../lambda/internal/aggregate-daily-metrics');
    await handler(mockEvent);

    const queryCall = (query as any).mock.calls[0];
    const queryParams = queryCall[1];
    
    // Data deve ser do dia anterior
    const eventDate = new Date(mockEvent.time);
    const yesterday = new Date(eventDate);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const expectedDate = yesterday.toISOString().split('T')[0];
    expect(queryParams[0]).toBe(expectedDate);
  });
});
