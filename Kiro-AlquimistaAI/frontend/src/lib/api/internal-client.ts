/**
 * Cliente HTTP para APIs Internas (/internal/*)
 * Painel Operacional AlquimistaAI - Painel Operacional Interno
 * 
 * Este cliente fornece acesso às APIs internas para a equipe AlquimistaAI,
 * com visão global de todos os tenants e funcionalidades operacionais.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://ogsd1547nd.execute-api.us-east-1.amazonaws.com'
    : 'https://c5loeivg0k.execute-api.us-east-1.amazonaws.com');

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

// --- Lista de Tenants ---

export interface TenantListItem {
  id: string;
  name: string;
  cnpj: string;
  segment: string;
  plan: string;
  status: string;
  mrr_estimate: number;
  active_agents: number;
  active_users: number;
  requests_last_30_days: number;
  created_at: string;
}

export interface TenantsListResponse {
  tenants: TenantListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface TenantsListParams {
  status?: 'active' | 'inactive' | 'suspended' | 'all';
  plan?: string;
  segment?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sort_by?: 'name' | 'created_at' | 'mrr_estimate';
  sort_order?: 'asc' | 'desc';
}

// --- Detalhes do Tenant ---

export interface TenantDetail {
  tenant: {
    id: string;
    name: string;
    cnpj: string;
    segment: string;
    plan: string;
    status: string;
    mrr_estimate: number;
    created_at: string;
    updated_at: string;
  };
  users: Array<{
    id: string;
    email: string;
    full_name: string;
    role: string;
    last_login_at: string | null;
  }>;
  agents: Array<{
    id: string;
    name: string;
    status: string;
    activated_at: string;
    usage_last_30_days: {
      total_requests: number;
      success_rate: number;
    };
  }>;
  integrations: Array<{
    id: string;
    type: string;
    name: string;
    status: string;
    last_sync_at: string | null;
  }>;
  usage_summary: {
    requests_last_7_days: number;
    requests_last_30_days: number;
    success_rate_last_30_days: number;
  };
  recent_incidents: Array<{
    id: string;
    severity: string;
    title: string;
    created_at: string;
  }>;
}

// --- Agentes do Tenant ---

export interface TenantAgentDetail {
  id: string;
  name: string;
  status: string;
  config: Record<string, any>;
  activated_at: string;
  deactivated_at: string | null;
  usage_stats: {
    total_requests: number;
    success_rate: number;
    avg_response_time_ms: number;
    last_request_at: string | null;
  };
}

export interface TenantAgentsDetailResponse {
  agents: TenantAgentDetail[];
}

// --- Visão de Uso Global ---

export interface UsageOverview {
  period: string;
  global_stats: {
    total_tenants: number;
    active_tenants: number;
    total_agents_deployed: number;
    total_requests: number;
    global_success_rate: number;
    avg_response_time_ms: number;
  };
  top_tenants_by_usage: Array<{
    tenant_id: string;
    tenant_name: string;
    total_requests: number;
    success_rate: number;
  }>;
  top_agents_by_usage: Array<{
    agent_id: string;
    agent_name: string;
    total_requests: number;
    deployed_count: number;
  }>;
  daily_trends: Array<{
    date: string;
    total_requests: number;
    success_rate: number;
    active_tenants: number;
  }>;
}

// --- Visão Financeira ---

export interface BillingOverview {
  period: string;
  financial_summary: {
    total_mrr: number;
    total_arr: number;
    avg_mrr_per_tenant: number;
    new_mrr_this_period: number;
    churned_mrr_this_period: number;
  };
  by_plan: Array<{
    plan_name: string;
    tenant_count: number;
    total_mrr: number;
  }>;
  by_segment: Array<{
    segment: string;
    tenant_count: number;
    total_mrr: number;
  }>;
  revenue_trend: Array<{
    date: string;
    mrr: number;
    new_tenants: number;
    churned_tenants: number;
  }>;
}

// --- Comandos Operacionais ---

export type CommandType = 'REPROCESS_QUEUE' | 'RESET_TOKEN' | 'RESTART_AGENT' | 'HEALTH_CHECK';
export type CommandStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'ERROR';

export interface CreateCommandRequest {
  command_type: CommandType;
  tenant_id?: string;
  parameters: Record<string, any>;
}

export interface CreateCommandResponse {
  command_id: string;
  status: 'PENDING';
  created_at: string;
  message: string;
}

export interface OperationalCommand {
  command_id: string;
  command_type: string;
  status: CommandStatus;
  tenant_id: string | null;
  tenant_name: string | null;
  created_by: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  output: string | null;
  error_message: string | null;
}

export interface CommandsListResponse {
  commands: OperationalCommand[];
  total: number;
}

export interface CommandsListParams {
  status?: CommandStatus | 'all';
  command_type?: string;
  tenant_id?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// CLASSE DE ERRO CUSTOMIZADA
// ============================================================================

export class InternalApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'InternalApiError';
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

  throw new InternalApiError(
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
        throw new InternalApiError(
          'Sessão expirada. Faça login novamente.',
          'UNAUTHORIZED',
          401
        );
      }

      if (response.status === 403) {
        throw new InternalApiError(
          'Você não tem permissão para acessar este recurso.',
          'FORBIDDEN',
          403
        );
      }

      if (response.status === 404) {
        throw new InternalApiError(
          'Recurso não encontrado.',
          'NOT_FOUND',
          404
        );
      }

      throw new InternalApiError(
        errorData.message || 'Erro ao processar requisição.',
        errorData.error || 'API_ERROR',
        response.status
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof InternalApiError) {
      throw error;
    }

    console.error('Erro na requisição:', error);
    throw new InternalApiError(
      'Erro ao carregar dados. Tente novamente.',
      'UNKNOWN_ERROR',
      500
    );
  }
}

/**
 * Função auxiliar para fazer requisições POST
 */
async function post<T>(endpoint: string, body: any, token?: string): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        throw new InternalApiError(
          'Sessão expirada. Faça login novamente.',
          'UNAUTHORIZED',
          401
        );
      }

      if (response.status === 403) {
        throw new InternalApiError(
          'Você não tem permissão para executar esta ação.',
          'FORBIDDEN',
          403
        );
      }

      if (response.status === 400) {
        throw new InternalApiError(
          errorData.message || 'Dados inválidos.',
          'VALIDATION_ERROR',
          400
        );
      }

      throw new InternalApiError(
        errorData.message || 'Erro ao processar requisição.',
        errorData.error || 'API_ERROR',
        response.status
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof InternalApiError) {
      throw error;
    }

    console.error('Erro na requisição:', error);
    throw new InternalApiError(
      'Erro ao processar requisição. Tente novamente.',
      'UNKNOWN_ERROR',
      500
    );
  }
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * GET /internal/tenants
 * Lista todos os tenants com filtros
 * 
 * @param params - Parâmetros de filtro e paginação
 * @param token - Token JWT de autenticação
 * @returns Lista de tenants com paginação
 */
export async function listTenants(
  params: TenantsListParams = {},
  token?: string
): Promise<TenantsListResponse> {
  const queryParams = new URLSearchParams();
  
  if (params.status) queryParams.append('status', params.status);
  if (params.plan) queryParams.append('plan', params.plan);
  if (params.segment) queryParams.append('segment', params.segment);
  if (params.search) queryParams.append('search', params.search);
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.offset) queryParams.append('offset', params.offset.toString());
  if (params.sort_by) queryParams.append('sort_by', params.sort_by);
  if (params.sort_order) queryParams.append('sort_order', params.sort_order);
  
  const endpoint = `/internal/tenants${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  return get<TenantsListResponse>(endpoint, token);
}

/**
 * GET /internal/tenants/{id}
 * Retorna detalhes completos de um tenant específico
 * 
 * @param tenantId - ID do tenant
 * @param token - Token JWT de autenticação
 * @returns Detalhes completos do tenant
 */
export async function getTenantDetail(
  tenantId: string,
  token?: string
): Promise<TenantDetail> {
  if (!tenantId) {
    throw new InternalApiError(
      'ID do tenant é obrigatório',
      'VALIDATION_ERROR',
      400
    );
  }
  
  return get<TenantDetail>(`/internal/tenants/${encodeURIComponent(tenantId)}`, token);
}

/**
 * GET /internal/tenants/{id}/agents
 * Retorna agentes do tenant com opções de gerenciamento
 * 
 * @param tenantId - ID do tenant
 * @param token - Token JWT de autenticação
 * @returns Lista de agentes com detalhes
 */
export async function getTenantAgents(
  tenantId: string,
  token?: string
): Promise<TenantAgentDetail[]> {
  if (!tenantId) {
    throw new InternalApiError(
      'ID do tenant é obrigatório',
      'VALIDATION_ERROR',
      400
    );
  }
  
  const response = await get<TenantAgentsDetailResponse>(
    `/internal/tenants/${encodeURIComponent(tenantId)}/agents`,
    token
  );
  return response.agents;
}

/**
 * GET /internal/usage/overview
 * Retorna visão global de uso da plataforma
 * 
 * @param period - Período: '7d' | '30d' | '90d' (default: '30d')
 * @param token - Token JWT de autenticação
 * @returns Visão global de uso
 */
export async function getUsageOverview(
  period: '7d' | '30d' | '90d' = '30d',
  token?: string
): Promise<UsageOverview> {
  return get<UsageOverview>(`/internal/usage/overview?period=${period}`, token);
}

/**
 * GET /internal/billing/overview
 * Retorna visão financeira global
 * 
 * @param period - Período: '7d' | '30d' | '90d' (default: '30d')
 * @param token - Token JWT de autenticação
 * @returns Visão financeira global
 */
export async function getBillingOverview(
  period: '7d' | '30d' | '90d' = '30d',
  token?: string
): Promise<BillingOverview> {
  return get<BillingOverview>(`/internal/billing/overview?period=${period}`, token);
}

/**
 * POST /internal/operations/commands
 * Cria um novo comando operacional
 * 
 * @param request - Dados do comando
 * @param token - Token JWT de autenticação
 * @returns Informações do comando criado
 */
export async function createOperationalCommand(
  request: CreateCommandRequest,
  token?: string
): Promise<CreateCommandResponse> {
  // Validação básica
  if (!request.command_type) {
    throw new InternalApiError(
      'Tipo de comando é obrigatório',
      'VALIDATION_ERROR',
      400
    );
  }

  if (!request.parameters) {
    throw new InternalApiError(
      'Parâmetros são obrigatórios',
      'VALIDATION_ERROR',
      400
    );
  }

  return post<CreateCommandResponse>('/internal/operations/commands', request, token);
}

/**
 * GET /internal/operations/commands
 * Lista comandos operacionais executados
 * 
 * @param params - Parâmetros de filtro e paginação
 * @param token - Token JWT de autenticação
 * @returns Lista de comandos
 */
export async function listOperationalCommands(
  params: CommandsListParams = {},
  token?: string
): Promise<CommandsListResponse> {
  const queryParams = new URLSearchParams();
  
  if (params.status) queryParams.append('status', params.status);
  if (params.command_type) queryParams.append('command_type', params.command_type);
  if (params.tenant_id) queryParams.append('tenant_id', params.tenant_id);
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.offset) queryParams.append('offset', params.offset.toString());
  
  const endpoint = `/internal/operations/commands${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  return get<CommandsListResponse>(endpoint, token);
}

// ============================================================================
// CLIENTE EXPORTADO
// ============================================================================

/**
 * Cliente de APIs Internas com todas as funções
 */
export const internalClient = {
  listTenants,
  getTenantDetail,
  getTenantAgents,
  getUsageOverview,
  getBillingOverview,
  createOperationalCommand,
  listOperationalCommands,
};

export default internalClient;
