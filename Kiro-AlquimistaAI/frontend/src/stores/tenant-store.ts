import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { tenantClient } from '@/lib/api/tenant-client';
import type {
  TenantInfo,
  TenantAgent,
  TenantIntegration,
  TenantUsageData,
  TenantIncident
} from '@/lib/api/tenant-client';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live em milissegundos
}

interface TenantState {
  // Dados do tenant
  tenantInfo: TenantInfo | null;
  agents: TenantAgent[];
  integrations: TenantIntegration[];
  usageData: TenantUsageData | null;
  incidents: TenantIncident[];
  
  // Estado de loading
  isLoadingInfo: boolean;
  isLoadingAgents: boolean;
  isLoadingIntegrations: boolean;
  isLoadingUsage: boolean;
  isLoadingIncidents: boolean;
  
  // Cache timestamps
  cache: {
    tenantInfo?: CacheEntry<TenantInfo>;
    agents?: CacheEntry<TenantAgent[]>;
    integrations?: CacheEntry<TenantIntegration[]>;
    usageData?: CacheEntry<TenantUsageData>;
    incidents?: CacheEntry<TenantIncident[]>;
  };
  
  // Ações
  fetchTenantInfo: (force?: boolean) => Promise<void>;
  fetchAgents: (status?: 'active' | 'inactive' | 'all', force?: boolean) => Promise<void>;
  fetchIntegrations: (force?: boolean) => Promise<void>;
  fetchUsage: (period?: '7d' | '30d' | '90d', agentId?: string, force?: boolean) => Promise<void>;
  fetchIncidents: (limit?: number, offset?: number, force?: boolean) => Promise<void>;
  
  // Invalidação de cache
  invalidateCache: (key?: keyof TenantState['cache']) => void;
  invalidateAllCache: () => void;
  
  // Reset
  reset: () => void;
}

const CACHE_TTL = {
  tenantInfo: 5 * 60 * 1000, // 5 minutos
  agents: 5 * 60 * 1000, // 5 minutos
  integrations: 5 * 60 * 1000, // 5 minutos
  usageData: 2 * 60 * 1000, // 2 minutos
  incidents: 5 * 60 * 1000, // 5 minutos
};

const isCacheValid = <T>(entry: CacheEntry<T> | undefined): boolean => {
  if (!entry) return false;
  return Date.now() - entry.timestamp < entry.ttl;
};

export const useTenantStore = create<TenantState>()((set, get) => ({
      // Estado inicial
      tenantInfo: null,
      agents: [],
      integrations: [],
      usageData: null,
      incidents: [],
      
      isLoadingInfo: false,
      isLoadingAgents: false,
      isLoadingIntegrations: false,
      isLoadingUsage: false,
      isLoadingIncidents: false,
      
      cache: {},
      
      // Buscar informações do tenant
      fetchTenantInfo: async (force = false) => {
        const { cache } = get();
        
        // Verificar cache
        if (!force && cache.tenantInfo && isCacheValid(cache.tenantInfo)) {
          set({ tenantInfo: cache.tenantInfo.data });
          return;
        }
        
        set({ isLoadingInfo: true });
        try {
          const data = await tenantClient.getTenantInfo();
          const cacheEntry: CacheEntry<TenantInfo> = {
            data,
            timestamp: Date.now(),
            ttl: CACHE_TTL.tenantInfo
          };
          
          set({
            tenantInfo: data,
            isLoadingInfo: false,
            cache: { ...cache, tenantInfo: cacheEntry }
          });
        } catch (error) {
          console.error('Error fetching tenant info:', error);
          set({ isLoadingInfo: false });
          throw error;
        }
      },
      
      // Buscar agentes do tenant
      fetchAgents: async (status = 'active', force = false) => {
        const { cache } = get();
        
        // Verificar cache
        if (!force && cache.agents && isCacheValid(cache.agents)) {
          set({ agents: cache.agents.data });
          return;
        }
        
        set({ isLoadingAgents: true });
        try {
          const data = await tenantClient.getAgents(status);
          const cacheEntry: CacheEntry<TenantAgent[]> = {
            data: data.agents,
            timestamp: Date.now(),
            ttl: CACHE_TTL.agents
          };
          
          set({
            agents: data.agents,
            isLoadingAgents: false,
            cache: { ...cache, agents: cacheEntry }
          });
        } catch (error) {
          console.error('Error fetching agents:', error);
          set({ isLoadingAgents: false });
          throw error;
        }
      },
      
      // Buscar integrações do tenant
      fetchIntegrations: async (force = false) => {
        const { cache } = get();
        
        // Verificar cache
        if (!force && cache.integrations && isCacheValid(cache.integrations)) {
          set({ integrations: cache.integrations.data });
          return;
        }
        
        set({ isLoadingIntegrations: true });
        try {
          const data = await tenantClient.getIntegrations();
          const cacheEntry: CacheEntry<TenantIntegration[]> = {
            data: data.integrations,
            timestamp: Date.now(),
            ttl: CACHE_TTL.integrations
          };
          
          set({
            integrations: data.integrations,
            isLoadingIntegrations: false,
            cache: { ...cache, integrations: cacheEntry }
          });
        } catch (error) {
          console.error('Error fetching integrations:', error);
          set({ isLoadingIntegrations: false });
          throw error;
        }
      },
      
      // Buscar dados de uso
      fetchUsage: async (period = '30d', agentId, force = false) => {
        const { cache } = get();
        
        // Verificar cache
        if (!force && cache.usageData && isCacheValid(cache.usageData)) {
          set({ usageData: cache.usageData.data });
          return;
        }
        
        set({ isLoadingUsage: true });
        try {
          const data = await tenantClient.getUsage(period, agentId);
          const cacheEntry: CacheEntry<TenantUsageData> = {
            data,
            timestamp: Date.now(),
            ttl: CACHE_TTL.usageData
          };
          
          set({
            usageData: data,
            isLoadingUsage: false,
            cache: { ...cache, usageData: cacheEntry }
          });
        } catch (error) {
          console.error('Error fetching usage:', error);
          set({ isLoadingUsage: false });
          throw error;
        }
      },
      
      // Buscar incidentes
      fetchIncidents: async (limit = 20, offset = 0, force = false) => {
        const { cache } = get();
        
        // Verificar cache
        if (!force && cache.incidents && isCacheValid(cache.incidents)) {
          set({ incidents: cache.incidents.data });
          return;
        }
        
        set({ isLoadingIncidents: true });
        try {
          const data = await tenantClient.getIncidents(limit, offset);
          const cacheEntry: CacheEntry<TenantIncident[]> = {
            data: data.incidents,
            timestamp: Date.now(),
            ttl: CACHE_TTL.incidents
          };
          
          set({
            incidents: data.incidents,
            isLoadingIncidents: false,
            cache: { ...cache, incidents: cacheEntry }
          });
        } catch (error) {
          console.error('Error fetching incidents:', error);
          set({ isLoadingIncidents: false });
          throw error;
        }
      },
      
      // Invalidar cache específico
      invalidateCache: (key) => {
        const { cache } = get();
        if (key) {
          const newCache = { ...cache };
          delete newCache[key];
          set({ cache: newCache });
        }
      },
      
      // Invalidar todo o cache
      invalidateAllCache: () => {
        set({ cache: {} });
      },
      
      // Reset completo do estado
      reset: () => {
        set({
          tenantInfo: null,
          agents: [],
          integrations: [],
          usageData: null,
          incidents: [],
          isLoadingInfo: false,
          isLoadingAgents: false,
          isLoadingIntegrations: false,
          isLoadingUsage: false,
          isLoadingIncidents: false,
          cache: {}
        });
      }
    })
);
