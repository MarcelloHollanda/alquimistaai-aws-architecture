/**
 * Testes para tenant-store
 * Painel Operacional AlquimistaAI - Dashboard do Cliente
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useTenantStore } from '../tenant-store';
import { tenantClient } from '@/lib/api/tenant-client';

// Mock do tenant-client
jest.mock('@/lib/api/tenant-client', () => ({
  tenantClient: {
    getTenantInfo: jest.fn(),
    getAgents: jest.fn(),
    getIntegrations: jest.fn(),
    getUsage: jest.fn(),
    getIncidents: jest.fn(),
  },
}));

describe('useTenantStore', () => {
  beforeEach(() => {
    // Limpar store antes de cada teste
    const { result } = renderHook(() => useTenantStore());
    act(() => {
      result.current.reset();
    });
    
    // Limpar mocks
    jest.clearAllMocks();
  });

  describe('fetchTenantInfo', () => {
    it('deve buscar informações do tenant com sucesso', async () => {
      const mockTenantInfo = {
        id: 'tenant-1',
        name: 'Empresa Teste',
        cnpj: '12.345.678/0001-90',
        segment: 'Tecnologia',
        plan: 'Professional',
        status: 'active',
        mrr_estimate: 1500,
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

      (tenantClient.getTenantInfo as jest.Mock).mockResolvedValue(mockTenantInfo);

      const { result } = renderHook(() => useTenantStore());

      expect(result.current.isLoadingInfo).toBe(false);
      expect(result.current.tenantInfo).toBeNull();

      await act(async () => {
        await result.current.fetchTenantInfo();
      });

      expect(result.current.isLoadingInfo).toBe(false);
      expect(result.current.tenantInfo).toEqual(mockTenantInfo);
      expect(tenantClient.getTenantInfo).toHaveBeenCalledTimes(1);
    });

    it('deve usar cache quando disponível', async () => {
      const mockTenantInfo = {
        id: 'tenant-1',
        name: 'Empresa Teste',
        cnpj: '12.345.678/0001-90',
        segment: 'Tecnologia',
        plan: 'Professional',
        status: 'active',
        mrr_estimate: 1500,
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

      (tenantClient.getTenantInfo as jest.Mock).mockResolvedValue(mockTenantInfo);

      const { result } = renderHook(() => useTenantStore());

      // Primeira chamada - busca da API
      await act(async () => {
        await result.current.fetchTenantInfo();
      });

      expect(tenantClient.getTenantInfo).toHaveBeenCalledTimes(1);

      // Segunda chamada - deve usar cache
      await act(async () => {
        await result.current.fetchTenantInfo();
      });

      expect(tenantClient.getTenantInfo).toHaveBeenCalledTimes(1); // Não deve chamar novamente
    });

    it('deve forçar refresh quando force=true', async () => {
      const mockTenantInfo = {
        id: 'tenant-1',
        name: 'Empresa Teste',
        cnpj: '12.345.678/0001-90',
        segment: 'Tecnologia',
        plan: 'Professional',
        status: 'active',
        mrr_estimate: 1500,
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

      (tenantClient.getTenantInfo as jest.Mock).mockResolvedValue(mockTenantInfo);

      const { result } = renderHook(() => useTenantStore());

      // Primeira chamada
      await act(async () => {
        await result.current.fetchTenantInfo();
      });

      expect(tenantClient.getTenantInfo).toHaveBeenCalledTimes(1);

      // Segunda chamada com force=true
      await act(async () => {
        await result.current.fetchTenantInfo(true);
      });

      expect(tenantClient.getTenantInfo).toHaveBeenCalledTimes(2); // Deve chamar novamente
    });

    it('deve tratar erros corretamente', async () => {
      const mockError = new Error('Erro ao buscar tenant');
      (tenantClient.getTenantInfo as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => useTenantStore());

      await expect(
        act(async () => {
          await result.current.fetchTenantInfo();
        })
      ).rejects.toThrow('Erro ao buscar tenant');

      expect(result.current.isLoadingInfo).toBe(false);
      expect(result.current.tenantInfo).toBeNull();
    });
  });

  describe('invalidateCache', () => {
    it('deve invalidar cache específico', async () => {
      const mockTenantInfo = {
        id: 'tenant-1',
        name: 'Empresa Teste',
        cnpj: '12.345.678/0001-90',
        segment: 'Tecnologia',
        plan: 'Professional',
        status: 'active',
        mrr_estimate: 1500,
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

      (tenantClient.getTenantInfo as jest.Mock).mockResolvedValue(mockTenantInfo);

      const { result } = renderHook(() => useTenantStore());

      // Buscar dados
      await act(async () => {
        await result.current.fetchTenantInfo();
      });

      expect(tenantClient.getTenantInfo).toHaveBeenCalledTimes(1);

      // Invalidar cache
      act(() => {
        result.current.invalidateCache('tenantInfo');
      });

      // Buscar novamente - deve chamar API
      await act(async () => {
        await result.current.fetchTenantInfo();
      });

      expect(tenantClient.getTenantInfo).toHaveBeenCalledTimes(2);
    });

    it('deve invalidar todo o cache', async () => {
      const { result } = renderHook(() => useTenantStore());

      // Buscar vários dados
      (tenantClient.getTenantInfo as jest.Mock).mockResolvedValue({});
      (tenantClient.getAgents as jest.Mock).mockResolvedValue({ agents: [] });

      await act(async () => {
        await result.current.fetchTenantInfo();
        await result.current.fetchAgents();
      });

      // Invalidar todo o cache
      act(() => {
        result.current.invalidateAllCache();
      });

      // Buscar novamente - deve chamar APIs
      await act(async () => {
        await result.current.fetchTenantInfo();
        await result.current.fetchAgents();
      });

      expect(tenantClient.getTenantInfo).toHaveBeenCalledTimes(2);
      expect(tenantClient.getAgents).toHaveBeenCalledTimes(2);
    });
  });

  describe('reset', () => {
    it('deve resetar todo o estado', async () => {
      const mockTenantInfo = {
        id: 'tenant-1',
        name: 'Empresa Teste',
        cnpj: '12.345.678/0001-90',
        segment: 'Tecnologia',
        plan: 'Professional',
        status: 'active',
        mrr_estimate: 1500,
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

      (tenantClient.getTenantInfo as jest.Mock).mockResolvedValue(mockTenantInfo);

      const { result } = renderHook(() => useTenantStore());

      // Buscar dados
      await act(async () => {
        await result.current.fetchTenantInfo();
      });

      expect(result.current.tenantInfo).toEqual(mockTenantInfo);

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.tenantInfo).toBeNull();
      expect(result.current.agents).toEqual([]);
      expect(result.current.integrations).toEqual([]);
      expect(result.current.usageData).toBeNull();
      expect(result.current.incidents).toEqual([]);
    });
  });
});
