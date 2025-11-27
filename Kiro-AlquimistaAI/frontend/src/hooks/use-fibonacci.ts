/**
 * Fibonacci React Query Hooks
 * 
 * Hooks customizados para consumir a API do Fibonacci usando React Query
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  getFibonacciHealth,
  getFibonacciMetrics,
  getFibonacciIntegrations,
  getFibonacciIntegration,
  type FibonacciHealthResponse,
  type FibonacciMetricsResponse,
  type FibonacciIntegration,
} from '@/lib/fibonacci-api';

/**
 * Hook para verificar o status de saúde da API Fibonacci
 * 
 * @param options - Opções do React Query
 * @returns Query result com dados de saúde
 */
export function useFibonacciHealth(options?: {
  refetchInterval?: number;
  enabled?: boolean;
}): UseQueryResult<FibonacciHealthResponse, Error> {
  return useQuery({
    queryKey: ['fibonacci', 'health'],
    queryFn: getFibonacciHealth,
    refetchInterval: options?.refetchInterval || 30000, // Refetch a cada 30s por padrão
    enabled: options?.enabled !== false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook para obter métricas gerais do Fibonacci
 * 
 * @param options - Opções do React Query
 * @returns Query result com métricas
 */
export function useFibonacciMetrics(options?: {
  refetchInterval?: number;
  enabled?: boolean;
}): UseQueryResult<FibonacciMetricsResponse, Error> {
  return useQuery({
    queryKey: ['fibonacci', 'metrics'],
    queryFn: getFibonacciMetrics,
    refetchInterval: options?.refetchInterval || 60000, // Refetch a cada 60s por padrão
    enabled: options?.enabled !== false,
    retry: 2,
  });
}

/**
 * Hook para listar todas as integrações do Fibonacci
 * 
 * @param options - Opções do React Query
 * @returns Query result com lista de integrações
 */
export function useFibonacciIntegrations(options?: {
  refetchInterval?: number;
  enabled?: boolean;
}): UseQueryResult<FibonacciIntegration[], Error> {
  return useQuery({
    queryKey: ['fibonacci', 'integrations'],
    queryFn: getFibonacciIntegrations,
    refetchInterval: options?.refetchInterval,
    enabled: options?.enabled !== false,
    retry: 2,
    // Cache por 5 minutos
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obter detalhes de uma integração específica
 * 
 * @param id - ID da integração
 * @param options - Opções do React Query
 * @returns Query result com detalhes da integração
 */
export function useFibonacciIntegration(
  id: string | null,
  options?: {
    enabled?: boolean;
  }
): UseQueryResult<FibonacciIntegration, Error> {
  return useQuery({
    queryKey: ['fibonacci', 'integrations', id],
    queryFn: () => getFibonacciIntegration(id!),
    enabled: !!id && options?.enabled !== false,
    retry: 2,
  });
}

/**
 * Hook combinado que retorna status geral do Fibonacci
 * Combina health + metrics em um único hook conveniente
 * 
 * @returns Objeto com dados de saúde e métricas
 */
export function useFibonacciStatus() {
  const health = useFibonacciHealth();
  const metrics = useFibonacciMetrics({ enabled: health.isSuccess });

  return {
    // Health data
    isHealthy: health.data?.ok ?? false,
    service: health.data?.service,
    environment: health.data?.environment,
    dbStatus: health.data?.db_status,
    
    // Metrics data
    totalEvents: metrics.data?.total_events ?? 0,
    activeIntegrations: metrics.data?.active_integrations ?? 0,
    totalLeadsProcessed: metrics.data?.total_leads_processed ?? 0,
    uptimeSeconds: metrics.data?.uptime_seconds ?? 0,
    lastEventAt: metrics.data?.last_event_at,
    
    // Loading states
    isLoading: health.isLoading || metrics.isLoading,
    isError: health.isError || metrics.isError,
    error: health.error || metrics.error,
    
    // Refetch functions
    refetchHealth: health.refetch,
    refetchMetrics: metrics.refetch,
  };
}
