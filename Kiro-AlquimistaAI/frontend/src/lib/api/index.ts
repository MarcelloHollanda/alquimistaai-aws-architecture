/**
 * Índice de Clientes HTTP
 * Painel Operacional AlquimistaAI
 * 
 * Este arquivo exporta todos os clientes HTTP e tipos relacionados
 * para facilitar as importações em outros módulos.
 */

// ============================================================================
// TENANT CLIENT
// ============================================================================

export {
  tenantClient,
  getTenantMe,
  getTenantAgents,
  getTenantIntegrations,
  getTenantUsage,
  getTenantIncidents,
  TenantApiError,
} from './tenant-client';

import { tenantClient } from './tenant-client';
import { TenantApiError } from './tenant-client';

export type {
  TenantInfo,
  TenantAgent,
  TenantAgentsResponse,
  TenantIntegration,
  TenantIntegrationsResponse,
  UsageSummary,
  DailyUsageData,
  AgentUsage,
  TenantUsageResponse,
  Incident,
  TenantIncidentsResponse,
} from './tenant-client';

// ============================================================================
// INTERNAL CLIENT
// ============================================================================

export {
  internalClient,
  listTenants,
  getTenantDetail,
  getTenantAgents as getInternalTenantAgents,
  getUsageOverview,
  getBillingOverview,
  createOperationalCommand,
  listOperationalCommands,
  InternalApiError,
} from './internal-client';

import { internalClient } from './internal-client';
import { InternalApiError } from './internal-client';

export type {
  TenantListItem,
  TenantsListResponse,
  TenantsListParams,
  TenantDetail,
  TenantAgentDetail,
  TenantAgentsDetailResponse,
  UsageOverview,
  BillingOverview,
  CommandType,
  CommandStatus,
  CreateCommandRequest,
  CreateCommandResponse,
  OperationalCommand,
  CommandsListResponse,
  CommandsListParams,
} from './internal-client';

// ============================================================================
// CLIENTES COMBINADOS
// ============================================================================

/**
 * Objeto com todos os clientes disponíveis
 */
export const apiClients = {
  tenant: tenantClient,
  internal: internalClient,
};

/**
 * Tipo união de todos os erros de API
 */
export type ApiError = TenantApiError | InternalApiError;

// ============================================================================
// UTILITÁRIOS
// ============================================================================

/**
 * Verifica se um erro é um erro de API
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof TenantApiError || error instanceof InternalApiError;
}

/**
 * Verifica se um erro é de autenticação (401)
 */
export function isAuthError(error: unknown): boolean {
  if (!isApiError(error)) return false;
  return error.statusCode === 401;
}

/**
 * Verifica se um erro é de permissão (403)
 */
export function isForbiddenError(error: unknown): boolean {
  if (!isApiError(error)) return false;
  return error.statusCode === 403;
}

/**
 * Verifica se um erro é de recurso não encontrado (404)
 */
export function isNotFoundError(error: unknown): boolean {
  if (!isApiError(error)) return false;
  return error.statusCode === 404;
}

/**
 * Extrai mensagem de erro de forma segura
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'Erro desconhecido';
}

/**
 * Extrai código de erro de forma segura
 */
export function getErrorCode(error: unknown): string | undefined {
  if (isApiError(error)) {
    return error.code;
  }
  
  return undefined;
}
