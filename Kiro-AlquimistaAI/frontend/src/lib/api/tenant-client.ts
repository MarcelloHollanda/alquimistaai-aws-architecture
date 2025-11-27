/**
 * Cliente HTTP para APIs de Tenant (/tenant/*)
 * Painel Operacional AlquimistaAI - Dashboard do Cliente
 * 
 * Este cliente fornece acesso às APIs específicas para clientes (tenants),
 * garantindo isolamento de dados e validação de permissões.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://ogsd1547nd.execute-api.us-east-1.amazonaws.com'
    : 'https://c5loeivg0k.execute-api.us-east-1.amazonaws.com');

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface TenantInfo {
  id: string;
  name: string;
  cnpj: string;
  segment: string;
  plan: string;
  status: string;
  mrr_estimate: number;
  created_at: string;
  limits: {
    max_agents: number;
    max_users: number;
    max_requests_per_month: number;
  };
  usage: {
    active_agents: number;
    active_users: number;
    requests_this_month: number;
  };
}

export interface TenantAgent {
  id: string;
  name: string;
  segment: string;
  status: string;
  activated_at: string;
  usage_last_30_days: {
    total_requests: number;
    success_rate: number;
    avg_response_time_ms: number;
  };
}

export interface TenantAgentsResponse {
  agents: TenantAgent[];
}

export interface TenantIntegration {
  id: string;
  type: string;
  name: string;
  status: string;
  last_sync_at: string | null;
  last_error: string | null;
}

export interface TenantIntegrationsResponse {
  integrations: TenantIntegration[];
}

export interface UsageSummary {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  success_rate: number;
  avg_response_time_ms: number;
}

export interface DailyUsageData {
  date: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  avg_response_time_ms: number;
}

export interface AgentUsage {
  agent_id: string;
  agent_name: string;
  total_requests: number;
  success_rate: number;
}

export interface TenantUsageResponse {
  period: string;
  summary: UsageSummary;
  daily_data: DailyUsageData[];
  by_agent: AgentUsage[];
}

export interface Incident {
  id: string;
  severity: string;
  title: string;
  description: string;
  created_at: string;
  resolved_at: string | null;
}

export interface TenantIncidentsResponse {
  incidents: Incident[];
  total: number;
}

// ============================================================================
// CLASSE DE ERRO CUSTOMIZADA
// ============================================================================

export class TenantApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'TenantApiError';
  }
}

// ============================================================================
// FUNÇÃO DE RETRY COM BACKOFF EXPONENCIAL
// ============================================================================

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // Se a resposta for bem-sucedida ou erro do cliente (4xx), não fazer retry
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }

      // Para erros de servidor (5xx), fazer retry
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error as Error;
    }

    // Aguardar antes de tentar novamente (backoff exponencial)
    if (attempt < maxRetries - 1) {
      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new TenantApiError(
    'Erro de conexão. Tente novamente.',
    'NETWORK_ERROR',
    0
  );
}

// ============================================================================
// FUNÇÕES DE REQUISIÇÃO
// ============================================================================

/**
 * Função auxiliar para fazer requisições GET
 */
async function get<T>(endpoint: string, token?: string): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetchWithRetry(url, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        throw new TenantApiError(
          'Sessão expirada. Faça login novamente.',
          'UNAUTHORIZED',
          401
        );
      }

      if (response.status === 403) {
        throw new TenantApiError(
          'Você não tem permissão para acessar este recurso.',
          'FORBIDDEN',
          403
        );
      }

      if (response.status === 404) {
        throw new TenantApiError(
          'Recurso não encontrado.',
          'NOT_FOUND',
          404
        );
      }

      throw new TenantApiError(
        errorData.message || 'Erro ao processar requisição.',
        errorData.error || 'API_ERROR',
        response.status
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TenantApiError) {
      throw error;
    }

    console.error('Erro na requisição:', error);
    throw new TenantApiError(
      'Erro ao carregar dados. Tente novamente.',
      'UNKNOWN_ERROR',
      500
    );
  }
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * GET /tenant/me
 * Retorna informações da empresa do tenant autenticado
 * 
 * @param token - Token JWT de autenticação
 * @returns Informações do tenant
 */
export async function getTenantMe(token?: string): Promise<TenantInfo> {
  return get<TenantInfo>('/tenant/me', token);
}

/**
 * GET /tenant/agents
 * Retorna agentes contratados pelo tenant
 * 
 * @param status - Filtro por status: 'active' | 'inactive' | 'all' (default: 'active')
 * @param token - Token JWT de autenticação
 * @returns Lista de agentes do tenant
 */
export async function getTenantAgents(
  status: 'active' | 'inactive' | 'all' = 'active',
  token?: string
): Promise<TenantAgent[]> {
  const endpoint = `/tenant/agents?status=${status}`;
  const response = await get<TenantAgentsResponse>(endpoint, token);
  return response.agents;
}

/**
 * GET /tenant/integrations
 * Retorna integrações configuradas pelo tenant
 * 
 * @param token - Token JWT de autenticação
 * @returns Lista de integrações do tenant
 */
export async function getTenantIntegrations(token?: string): Promise<TenantIntegration[]> {
  const response = await get<TenantIntegrationsResponse>('/tenant/integrations', token);
  return response.integrations;
}

/**
 * GET /tenant/usage
 * Retorna métricas de uso do tenant
 * 
 * @param period - Período: '7d' | '30d' | '90d' (default: '30d')
 * @param agentId - ID do agente (opcional, para filtrar por agente específico)
 * @param token - Token JWT de autenticação
 * @returns Métricas de uso do tenant
 */
export async function getTenantUsage(
  period: '7d' | '30d' | '90d' = '30d',
  agentId?: string,
  token?: string
): Promise<TenantUsageResponse> {
  let endpoint = `/tenant/usage?period=${period}`;
  
  if (agentId) {
    endpoint += `&agent_id=${encodeURIComponent(agentId)}`;
  }
  
  return get<TenantUsageResponse>(endpoint, token);
}

/**
 * GET /tenant/incidents
 * Retorna incidentes que afetaram o tenant
 * 
 * @param limit - Número máximo de resultados (default: 20)
 * @param offset - Offset para paginação (default: 0)
 * @param token - Token JWT de autenticação
 * @returns Lista de incidentes e total
 */
export async function getTenantIncidents(
  limit: number = 20,
  offset: number = 0,
  token?: string
): Promise<TenantIncidentsResponse> {
  const endpoint = `/tenant/incidents?limit=${limit}&offset=${offset}`;
  return get<TenantIncidentsResponse>(endpoint, token);
}

// ============================================================================
// CLIENTE EXPORTADO
// ============================================================================

/**
 * Cliente de APIs de Tenant com todas as funções
 */
export const tenantClient = {
  getTenantMe,
  getTenantAgents,
  getTenantIntegrations,
  getTenantUsage,
  getTenantIncidents,
};

export default tenantClient;
