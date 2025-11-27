/**
 * Testes para Tenant Client
 * 
 * Este arquivo contém exemplos de testes unitários para o tenant client.
 * Para executar: npm test tenant-client.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  tenantClient,
  getTenantMe,
  getTenantAgents,
  getTenantIntegrations,
  getTenantUsage,
  getTenantIncidents,
  TenantApiError,
} from '../tenant-client';

// Mock do fetch global
global.fetch = vi.fn();

describe('Tenant Client', () => {
  beforeEach(() => {
    // Limpar mocks antes de cada teste
    vi.clearAllMocks();
  });

  describe('getTenantMe', () => {
    it('deve buscar informações do tenant com sucesso', async () => {
      const mockResponse = {
        id: 'tenant-123',
        name: 'Empresa Teste',
        cnpj: '12.345.678/0001-90',
        segment: 'Tecnologia',
        plan: 'Professional',
        status: 'active',
        mrr_estimate: 1500.00,
        created_at: '2024-01-01T00:00:00Z',
        limits: {
          max_agents: 10,
          max_users: 5,
          max_requests_per_month: 100000,
        },
        usage: {
          active_agents: 5,
          active_users: 3,
          requests_this_month: 45000,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getTenantMe();

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('deve lançar TenantApiError para erro 401', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized', error: 'UNAUTHORIZED' }),
      });

      await expect(getTenantMe()).rejects.toThrow(TenantApiError);
      await expect(getTenantMe()).rejects.toThrow('Sessão expirada');
    });

    it('deve lançar TenantApiError para erro 403', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ message: 'Forbidden', error: 'FORBIDDEN' }),
      });

      await expect(getTenantMe()).rejects.toThrow(TenantApiError);
      await expect(getTenantMe()).rejects.toThrow('Você não tem permissão');
    });

    it('deve fazer retry em caso de erro 500', async () => {
      // Primeira tentativa: erro 500
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      // Segunda tentativa: sucesso
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'tenant-123', name: 'Teste' }),
      });

      const result = await getTenantMe();

      expect(result).toHaveProperty('id', 'tenant-123');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('getTenantAgents', () => {
    it('deve buscar agentes ativos', async () => {
      const mockResponse = {
        agents: [
          {
            id: 'agent-1',
            name: 'Agente SDR',
            segment: 'Vendas',
            status: 'active',
            activated_at: '2024-01-01T00:00:00Z',
            usage_last_30_days: {
              total_requests: 1000,
              success_rate: 98.5,
              avg_response_time_ms: 250,
            },
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getTenantAgents('active');

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('name', 'Agente SDR');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=active'),
        expect.any(Object)
      );
    });

    it('deve buscar todos os agentes', async () => {
      const mockResponse = {
        agents: [
          { id: 'agent-1', name: 'Agente 1', status: 'active' },
          { id: 'agent-2', name: 'Agente 2', status: 'inactive' },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getTenantAgents('all');

      expect(result).toHaveLength(2);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=all'),
        expect.any(Object)
      );
    });
  });

  describe('getTenantUsage', () => {
    it('deve buscar métricas de uso com período padrão', async () => {
      const mockResponse = {
        period: '30d',
        summary: {
          total_requests: 50000,
          successful_requests: 49250,
          failed_requests: 750,
          success_rate: 98.5,
          avg_response_time_ms: 250,
        },
        daily_data: [],
        by_agent: [],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getTenantUsage();

      expect(result.period).toBe('30d');
      expect(result.summary.success_rate).toBe(98.5);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('period=30d'),
        expect.any(Object)
      );
    });

    it('deve buscar métricas filtradas por agente', async () => {
      const mockResponse = {
        period: '7d',
        summary: {
          total_requests: 10000,
          successful_requests: 9850,
          failed_requests: 150,
          success_rate: 98.5,
          avg_response_time_ms: 200,
        },
        daily_data: [],
        by_agent: [],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getTenantUsage('7d', 'agent-123');

      expect(result.period).toBe('7d');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('period=7d'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('agent_id=agent-123'),
        expect.any(Object)
      );
    });
  });

  describe('getTenantIncidents', () => {
    it('deve buscar incidentes com paginação padrão', async () => {
      const mockResponse = {
        incidents: [
          {
            id: 'incident-1',
            severity: 'warning',
            title: 'Lentidão no sistema',
            description: 'Sistema apresentou lentidão',
            created_at: '2024-01-01T00:00:00Z',
            resolved_at: '2024-01-01T01:00:00Z',
          },
        ],
        total: 1,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getTenantIncidents();

      expect(result.incidents).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=20'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('offset=0'),
        expect.any(Object)
      );
    });

    it('deve buscar incidentes com paginação customizada', async () => {
      const mockResponse = {
        incidents: [],
        total: 50,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getTenantIncidents(10, 20);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=10'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('offset=20'),
        expect.any(Object)
      );
    });
  });

  describe('TenantApiError', () => {
    it('deve criar erro com mensagem e código', () => {
      const error = new TenantApiError('Erro de teste', 'TEST_ERROR', 400);

      expect(error.message).toBe('Erro de teste');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('TenantApiError');
    });

    it('deve ser instância de Error', () => {
      const error = new TenantApiError('Erro', 'CODE');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(TenantApiError);
    });
  });

  describe('tenantClient object', () => {
    it('deve exportar todas as funções', () => {
      expect(tenantClient).toHaveProperty('getTenantMe');
      expect(tenantClient).toHaveProperty('getTenantAgents');
      expect(tenantClient).toHaveProperty('getTenantIntegrations');
      expect(tenantClient).toHaveProperty('getTenantUsage');
      expect(tenantClient).toHaveProperty('getTenantIncidents');
    });

    it('deve ter funções que são funções', () => {
      expect(typeof tenantClient.getTenantMe).toBe('function');
      expect(typeof tenantClient.getTenantAgents).toBe('function');
      expect(typeof tenantClient.getTenantIntegrations).toBe('function');
      expect(typeof tenantClient.getTenantUsage).toBe('function');
      expect(typeof tenantClient.getTenantIncidents).toBe('function');
    });
  });
});
