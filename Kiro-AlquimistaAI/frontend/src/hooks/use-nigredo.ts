/**
 * Nigredo React Query Hooks
 * Hooks para consumir a API do Nigredo com React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nigredoApiMethods, type CreateLeadRequest } from '@/lib/nigredo-api';

// Query Keys
export const nigredoKeys = {
  all: ['nigredo'] as const,
  health: () => [...nigredoKeys.all, 'health'] as const,
  leads: () => [...nigredoKeys.all, 'leads'] as const,
  leadsList: (filters?: Record<string, any>) => [...nigredoKeys.leads(), 'list', filters] as const,
  lead: (id: string) => [...nigredoKeys.leads(), 'detail', id] as const,
};

// Health Check Hook
export function useNigredoHealth() {
  return useQuery({
    queryKey: nigredoKeys.health(),
    queryFn: async () => {
      const response = await nigredoApiMethods.health();
      return response.data;
    },
    staleTime: 30000, // 30 seconds
    retry: 3,
  });
}

// List Leads Hook
export function useLeads(params?: {
  page?: number;
  limit?: number;
  status?: string;
  source?: string;
  from_date?: string;
  to_date?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: nigredoKeys.leadsList(params),
    queryFn: async () => {
      const response = await nigredoApiMethods.listLeads(params);
      return response.data;
    },
    staleTime: 10000, // 10 seconds
    enabled: true, // Only fetch when authenticated
  });
}

// Get Lead Detail Hook
export function useLead(id: string) {
  return useQuery({
    queryKey: nigredoKeys.lead(id),
    queryFn: async () => {
      const response = await nigredoApiMethods.getLead(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: 30000, // 30 seconds
  });
}

// Create Lead Mutation Hook
export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateLeadRequest) => {
      const response = await nigredoApiMethods.createLead(data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate leads list to refetch
      queryClient.invalidateQueries({ queryKey: nigredoKeys.leads() });
    },
  });
}

// Placeholder hooks for future implementation
export function useDashboardStats() {
  return useQuery({
    queryKey: [...nigredoKeys.all, 'dashboard', 'stats'],
    queryFn: async () => {
      // TODO: Implement when endpoint is available
      return {
        total_leads: 0,
        new_leads: 0,
        qualified_leads: 0,
        active_conversations: 0,
        scheduled_meetings: 0,
      };
    },
    enabled: false, // Disable until endpoint is ready
  });
}

export function usePipelineMetrics() {
  return useQuery({
    queryKey: [...nigredoKeys.all, 'pipeline', 'metrics'],
    queryFn: async () => {
      // TODO: Implement when endpoint is available
      return {
        conversion_rate: 0,
        response_rate: 0,
        meeting_rate: 0,
        avg_response_time: 0,
      };
    },
    enabled: false, // Disable until endpoint is ready
  });
}

export function useConversations() {
  return useQuery({
    queryKey: [...nigredoKeys.all, 'conversations'],
    queryFn: async () => {
      // TODO: Implement when endpoint is available
      return [];
    },
    enabled: false, // Disable until endpoint is ready
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: [...nigredoKeys.all, 'conversations', id],
    queryFn: async () => {
      // TODO: Implement when endpoint is available
      return null;
    },
    enabled: false, // Disable until endpoint is ready
  });
}

export function useMeetings() {
  return useQuery({
    queryKey: [...nigredoKeys.all, 'meetings'],
    queryFn: async () => {
      // TODO: Implement when endpoint is available
      return [];
    },
    enabled: false, // Disable until endpoint is ready
  });
}

export function useReportsSummary() {
  return useQuery({
    queryKey: [...nigredoKeys.all, 'reports', 'summary'],
    queryFn: async () => {
      // TODO: Implement when endpoint is available
      return {
        total_leads: 0,
        response_rate: 0,
        meeting_rate: 0,
        conversion_rate: 0,
      };
    },
    enabled: false, // Disable until endpoint is ready
  });
}
