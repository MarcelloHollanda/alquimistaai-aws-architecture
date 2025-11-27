/**
 * Exemplos de Uso - Cliente API Disparo e Agendamento
 * 
 * Este arquivo contém exemplos práticos de como usar o cliente
 * em componentes React com React Query.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { disparoAgendaApiMethods, type IngestContactPayload } from './disparo-agenda-api';

// ============================================================================
// EXEMPLO 1: Hook para Overview
// ============================================================================

export function useDisparoOverview() {
  return useQuery({
    queryKey: ['disparo-agenda', 'overview'],
    queryFn: async () => {
      const { data } = await disparoAgendaApiMethods.getOverview();
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 30 * 1000, // Atualiza a cada 30 segundos
  });
}

// Uso no componente:
// const { data, isLoading, error } = useDisparoOverview();

// ============================================================================
// EXEMPLO 2: Hook para Campanhas
// ============================================================================

export function useDisparoCampaigns() {
  return useQuery({
    queryKey: ['disparo-agenda', 'campaigns'],
    queryFn: async () => {
      const { data } = await disparoAgendaApiMethods.getCampaigns();
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

// ============================================================================
// EXEMPLO 3: Hook para Ingerir Contatos (Mutation)
// ============================================================================

export function useIngestContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contacts: IngestContactPayload[]) => 
      disparoAgendaApiMethods.ingestContacts(contacts),
    onSuccess: () => {
      // Invalida o cache do overview para atualizar o total de contatos
      queryClient.invalidateQueries({ queryKey: ['disparo-agenda', 'overview'] });
    },
  });
}

// Uso no componente:
// const ingestMutation = useIngestContacts();
// ingestMutation.mutate([{ name: 'João', phone: '+5584999887766' }]);

// ============================================================================
// EXEMPLO 4: Hook para Reuniões
// ============================================================================

interface UseMeetingsParams {
  status?: string;
  from_date?: string;
  to_date?: string;
}

export function useMeetings(params?: UseMeetingsParams) {
  return useQuery({
    queryKey: ['disparo-agenda', 'meetings', params],
    queryFn: async () => {
      const { data } = await disparoAgendaApiMethods.getMeetings(params);
      return data;
    },
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
}

// ============================================================================
// EXEMPLO 5: Hook para Criar Reunião (Mutation)
// ============================================================================

export function useCreateMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: disparoAgendaApiMethods.createMeeting,
    onSuccess: () => {
      // Invalida o cache de reuniões para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['disparo-agenda', 'meetings'] });
    },
  });
}

// Uso no componente:
// const createMutation = useCreateMeeting();
// createMutation.mutate({
//   leadId: 'lead-123',
//   urgency: 'high',
//   meetingType: 'demo'
// });

// ============================================================================
// EXEMPLO 6: Hook para Confirmar Reunião (Mutation)
// ============================================================================

export function useConfirmMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (meetingId: string) => 
      disparoAgendaApiMethods.confirmMeeting(meetingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disparo-agenda', 'meetings'] });
    },
  });
}

// ============================================================================
// EXEMPLO 7: Hook para Cancelar Reunião (Mutation)
// ============================================================================

export function useCancelMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ meetingId, reason }: { meetingId: string; reason?: string }) => 
      disparoAgendaApiMethods.cancelMeeting(meetingId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disparo-agenda', 'meetings'] });
    },
  });
}

// ============================================================================
// EXEMPLO 8: Componente Completo
// ============================================================================

export function DisparoAgendaExampleComponent() {
  const { data: overview, isLoading: overviewLoading } = useDisparoOverview();
  const { data: campaigns, isLoading: campaignsLoading } = useDisparoCampaigns();
  const ingestMutation = useIngestContacts();

  const handleIngestContacts = () => {
    const contacts: IngestContactPayload[] = [
      {
        name: 'João Silva',
        phone: '+5584999887766',
        email: 'joao@example.com',
        tags: ['lead-quente']
      }
    ];

    ingestMutation.mutate(contacts, {
      onSuccess: () => {
        alert('Contatos ingeridos com sucesso!');
      },
      onError: (error) => {
        console.error('Erro ao ingerir contatos:', error);
        alert('Erro ao ingerir contatos');
      }
    });
  };

  if (overviewLoading || campaignsLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Disparo e Agendamento</h1>
      
      {/* Overview */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white rounded shadow">
          <p className="text-sm text-gray-600">Total de Contatos</p>
          <p className="text-2xl font-bold">{overview?.totalContacts || 0}</p>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <p className="text-sm text-gray-600">Campanhas</p>
          <p className="text-2xl font-bold">{overview?.totalCampaigns || 0}</p>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <p className="text-sm text-gray-600">Mensagens (24h)</p>
          <p className="text-2xl font-bold">{overview?.messagesSentLast24h || 0}</p>
        </div>
      </div>

      {/* Campanhas */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Campanhas</h2>
        <div className="space-y-2">
          {campaigns?.campaigns.map((campaign) => (
            <div key={campaign.id} className="p-3 bg-white rounded shadow">
              <p className="font-medium">{campaign.name}</p>
              <p className="text-sm text-gray-600">Status: {campaign.status}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Ação */}
      <button
        onClick={handleIngestContacts}
        disabled={ingestMutation.isPending}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {ingestMutation.isPending ? 'Enviando...' : 'Ingerir Contatos de Exemplo'}
      </button>
    </div>
  );
}

// ============================================================================
// EXEMPLO 9: Tratamento de Erros Avançado
// ============================================================================

export function useDisparoOverviewWithErrorHandling() {
  return useQuery({
    queryKey: ['disparo-agenda', 'overview'],
    queryFn: async () => {
      try {
        const { data } = await disparoAgendaApiMethods.getOverview();
        return data;
      } catch (error) {
        // Tratamento customizado de erro
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { status: number } };
          if (axiosError.response?.status === 401) {
            // Redirecionar para login
            window.location.href = '/auth/login';
          } else if (axiosError.response?.status === 403) {
            // Mostrar mensagem de permissão negada
            throw new Error('Você não tem permissão para acessar este recurso');
          }
        }
        throw error;
      }
    },
    retry: (failureCount, error) => {
      // Não retenta em erros de autenticação/autorização
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status: number } };
        if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
          return false;
        }
      }
      // Retenta até 3 vezes para outros erros
      return failureCount < 3;
    },
  });
}
