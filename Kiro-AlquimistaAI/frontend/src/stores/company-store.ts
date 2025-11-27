import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { internalClient } from '@/lib/api/internal-client';
import type {
  TenantListItem,
  TenantDetail,
  TenantAgentDetail,
  UsageOverview,
  BillingOverview,
  OperationalCommand,
  CreateCommandRequest,
  CreateCommandResponse
} from '@/lib/api/internal-client';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live em milissegundos
}

interface CompanyState {
  // Dados operacionais
  tenants: TenantListItem[];
  totalTenants: number;
  selectedTenant: TenantDetail | null;
  selectedTenantAgents: TenantAgentDetail[];
  usageOverview: UsageOverview | null;
  billingOverview: BillingOverview | null;
  commands: OperationalCommand[];
  totalCommands: number;
  
  // Estado de loading
  isLoadingTenants: boolean;
  isLoadingTenantDetail: boolean;
  isLoadingTenantAgents: boolean;
  isLoadingUsageOverview: boolean;
  isLoadingBillingOverview: boolean;
  isLoadingCommands: boolean;
  isCreatingCommand: boolean;
  
  // Filtros e paginação
  tenantsFilters: {
    status?: 'active' | 'inactive' | 'suspended' | 'all';
    plan?: string;
    segment?: string;
    search?: string;
    limit: number;
    offset: number;
    sortBy: 'name' | 'created_at' | 'mrr_estimate';
    sortOrder: 'asc' | 'desc';
  };
  
  commandsFilters: {
    status?: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'ERROR' | 'all';
    commandType?: string;
    tenantId?: string;
    limit: number;
    offset: number;
  };
  
  // Cache
  cache: {
    tenants?: CacheEntry<{ tenants: TenantListItem[]; total: number }>;
    selectedTenant?: CacheEntry<TenantDetail>;
    selectedTenantAgents?: CacheEntry<TenantAgentDetail[]>;
    usageOverview?: CacheEntry<UsageOverview>;
    billingOverview?: CacheEntry<BillingOverview>;
    commands?: CacheEntry<{ commands: OperationalCommand[]; total: number }>;
  };
  
  // Ações - Tenants
  fetchTenants: (filters?: Partial<CompanyState['tenantsFilters']>, force?: boolean) => Promise<void>;
  fetchTenantDetail: (tenantId: string, force?: boolean) => Promise<void>;
  fetchTenantAgents: (tenantId: string, force?: boolean) => Promise<void>;
  setTenantsFilters: (filters: Partial<CompanyState['tenantsFilters']>) => void;
  
  // Ações - Visão Geral
  fetchUsageOverview: (period?: '7d' | '30d' | '90d', force?: boolean) => Promise<void>;
  fetchBillingOverview: (period?: '7d' | '30d' | '90d', force?: boolean) => Promise<void>;
  
  // Ações - Comandos Operacionais
  fetchCommands: (filters?: Partial<CompanyState['commandsFilters']>, force?: boolean) => Promise<void>;
  createCommand: (request: CreateCommandRequest) => Promise<CreateCommandResponse>;
  setCommandsFilters: (filters: Partial<CompanyState['commandsFilters']>) => void;
  
  // Invalidação de cache
  invalidateCache: (key?: keyof CompanyState['cache']) => void;
  invalidateAllCache: () => void;
  
  // Reset
  reset: () => void;
}

const CACHE_TTL = {
  tenants: 5 * 60 * 1000, // 5 minutos
  selectedTenant: 3 * 60 * 1000, // 3 minutos
  selectedTenantAgents: 3 * 60 * 1000, // 3 minutos
  usageOverview: 10 * 60 * 1000, // 10 minutos
  billingOverview: 15 * 60 * 1000, // 15 minutos
  commands: 2 * 60 * 1000, // 2 minutos
};

const isCacheValid = <T>(entry: CacheEntry<T> | undefined): boolean => {
  if (!entry) return false;
  return Date.now() - entry.timestamp < entry.ttl;
};

export const useCompanyStore = create<CompanyState>()((set, get) => ({
      // Estado inicial
      tenants: [],
      totalTenants: 0,
      selectedTenant: null,
      selectedTenantAgents: [],
      usageOverview: null,
      billingOverview: null,
      commands: [],
      totalCommands: 0,
      
      isLoadingTenants: false,
      isLoadingTenantDetail: false,
      isLoadingTenantAgents: false,
      isLoadingUsageOverview: false,
      isLoadingBillingOverview: false,
      isLoadingCommands: false,
      isCreatingCommand: false,
      
      tenantsFilters: {
        status: 'active',
        limit: 50,
        offset: 0,
        sortBy: 'name',
        sortOrder: 'asc'
      },
      
      commandsFilters: {
        status: 'all',
        limit: 50,
        offset: 0
      },
      
      cache: {},
      
      // Buscar lista de tenants
      fetchTenants: async (filters, force = false) => {
        const { cache, tenantsFilters } = get();
        const finalFilters = { ...tenantsFilters, ...filters };
        
        // Verificar cache
        if (!force && cache.tenants && isCacheValid(cache.tenants)) {
          set({
            tenants: cache.tenants.data.tenants,
            totalTenants: cache.tenants.data.total,
            tenantsFilters: finalFilters
          });
          return;
        }
        
        set({ isLoadingTenants: true, tenantsFilters: finalFilters });
        try {
          const data = await internalClient.listTenants(finalFilters);
          const cacheEntry: CacheEntry<{ tenants: TenantListItem[]; total: number }> = {
            data: { tenants: data.tenants, total: data.total },
            timestamp: Date.now(),
            ttl: CACHE_TTL.tenants
          };
          
          set({
            tenants: data.tenants,
            totalTenants: data.total,
            isLoadingTenants: false,
            cache: { ...cache, tenants: cacheEntry }
          });
        } catch (error) {
          console.error('Error fetching tenants:', error);
          set({ isLoadingTenants: false });
          throw error;
        }
      },
      
      // Buscar detalhes de um tenant
      fetchTenantDetail: async (tenantId, force = false) => {
        const { cache } = get();
        
        // Verificar cache
        if (!force && cache.selectedTenant && isCacheValid(cache.selectedTenant) && cache.selectedTenant.data.tenant.id === tenantId) {
          set({ selectedTenant: cache.selectedTenant.data });
          return;
        }
        
        set({ isLoadingTenantDetail: true });
        try {
          const data = await internalClient.getTenantDetail(tenantId);
          const cacheEntry: CacheEntry<TenantDetail> = {
            data,
            timestamp: Date.now(),
            ttl: CACHE_TTL.selectedTenant
          };
          
          set({
            selectedTenant: data,
            isLoadingTenantDetail: false,
            cache: { ...cache, selectedTenant: cacheEntry }
          });
        } catch (error) {
          console.error('Error fetching tenant detail:', error);
          set({ isLoadingTenantDetail: false });
          throw error;
        }
      },
      
      // Buscar agentes de um tenant
      fetchTenantAgents: async (tenantId, force = false) => {
        const { cache } = get();
        
        // Verificar cache
        if (!force && cache.selectedTenantAgents && isCacheValid(cache.selectedTenantAgents)) {
          set({ selectedTenantAgents: cache.selectedTenantAgents.data });
          return;
        }
        
        set({ isLoadingTenantAgents: true });
        try {
          const data = await internalClient.getTenantAgents(tenantId);
          const cacheEntry: CacheEntry<TenantAgentDetail[]> = {
            data,
            timestamp: Date.now(),
            ttl: CACHE_TTL.selectedTenantAgents
          };
          
          set({
            selectedTenantAgents: data,
            isLoadingTenantAgents: false,
            cache: { ...cache, selectedTenantAgents: cacheEntry }
          });
        } catch (error) {
          console.error('Error fetching tenant agents:', error);
          set({ isLoadingTenantAgents: false });
          throw error;
        }
      },
      
      // Atualizar filtros de tenants
      setTenantsFilters: (filters) => {
        const { tenantsFilters } = get();
        set({ tenantsFilters: { ...tenantsFilters, ...filters } });
      },
      
      // Buscar visão geral de uso
      fetchUsageOverview: async (period = '30d', force = false) => {
        const { cache } = get();
        
        // Verificar cache
        if (!force && cache.usageOverview && isCacheValid(cache.usageOverview)) {
          set({ usageOverview: cache.usageOverview.data });
          return;
        }
        
        set({ isLoadingUsageOverview: true });
        try {
          const data = await internalClient.getUsageOverview(period);
          const cacheEntry: CacheEntry<UsageOverview> = {
            data,
            timestamp: Date.now(),
            ttl: CACHE_TTL.usageOverview
          };
          
          set({
            usageOverview: data,
            isLoadingUsageOverview: false,
            cache: { ...cache, usageOverview: cacheEntry }
          });
        } catch (error) {
          console.error('Error fetching usage overview:', error);
          set({ isLoadingUsageOverview: false });
          throw error;
        }
      },
      
      // Buscar visão geral de billing
      fetchBillingOverview: async (period = '30d', force = false) => {
        const { cache } = get();
        
        // Verificar cache
        if (!force && cache.billingOverview && isCacheValid(cache.billingOverview)) {
          set({ billingOverview: cache.billingOverview.data });
          return;
        }
        
        set({ isLoadingBillingOverview: true });
        try {
          const data = await internalClient.getBillingOverview(period);
          const cacheEntry: CacheEntry<BillingOverview> = {
            data,
            timestamp: Date.now(),
            ttl: CACHE_TTL.billingOverview
          };
          
          set({
            billingOverview: data,
            isLoadingBillingOverview: false,
            cache: { ...cache, billingOverview: cacheEntry }
          });
        } catch (error) {
          console.error('Error fetching billing overview:', error);
          set({ isLoadingBillingOverview: false });
          throw error;
        }
      },
      
      // Buscar comandos operacionais
      fetchCommands: async (filters, force = false) => {
        const { cache, commandsFilters } = get();
        const finalFilters = { ...commandsFilters, ...filters };
        
        // Verificar cache
        if (!force && cache.commands && isCacheValid(cache.commands)) {
          set({
            commands: cache.commands.data.commands,
            totalCommands: cache.commands.data.total,
            commandsFilters: finalFilters
          });
          return;
        }
        
        set({ isLoadingCommands: true, commandsFilters: finalFilters });
        try {
          const data = await internalClient.listOperationalCommands(finalFilters);
          const cacheEntry: CacheEntry<{ commands: OperationalCommand[]; total: number }> = {
            data: { commands: data.commands, total: data.total },
            timestamp: Date.now(),
            ttl: CACHE_TTL.commands
          };
          
          set({
            commands: data.commands,
            totalCommands: data.total,
            isLoadingCommands: false,
            cache: { ...cache, commands: cacheEntry }
          });
        } catch (error) {
          console.error('Error fetching commands:', error);
          set({ isLoadingCommands: false });
          throw error;
        }
      },
      
      // Criar comando operacional
      createCommand: async (request) => {
        set({ isCreatingCommand: true });
        try {
          const response = await internalClient.createOperationalCommand(request);
          
          // Invalidar cache de comandos
          const { cache } = get();
          const newCache = { ...cache };
          delete newCache.commands;
          set({ cache: newCache, isCreatingCommand: false });
          
          return response;
        } catch (error) {
          console.error('Error creating command:', error);
          set({ isCreatingCommand: false });
          throw error;
        }
      },
      
      // Atualizar filtros de comandos
      setCommandsFilters: (filters) => {
        const { commandsFilters } = get();
        set({ commandsFilters: { ...commandsFilters, ...filters } });
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
          tenants: [],
          totalTenants: 0,
          selectedTenant: null,
          selectedTenantAgents: [],
          usageOverview: null,
          billingOverview: null,
          commands: [],
          totalCommands: 0,
          isLoadingTenants: false,
          isLoadingTenantDetail: false,
          isLoadingTenantAgents: false,
          isLoadingUsageOverview: false,
          isLoadingBillingOverview: false,
          isLoadingCommands: false,
          isCreatingCommand: false,
          tenantsFilters: {
            status: 'active',
            limit: 50,
            offset: 0,
            sortBy: 'name',
            sortOrder: 'asc'
          },
          commandsFilters: {
            status: 'all',
            limit: 50,
            offset: 0
          },
          cache: {}
        });
      }
    })
);
