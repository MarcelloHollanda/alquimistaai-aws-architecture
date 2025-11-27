/**
 * Teste de Performance - APIs Internas (/internal/*)
 * 
 * Testa endpoints acessados pela equipe interna
 */

import http from 'k6/http';
import { sleep } from 'k6';
import { internalApiThresholds, commandsThresholds } from '../config/thresholds.js';
import { internalApisScenario } from '../config/scenarios.js';
import { getInternalToken, getAuthHeaders } from '../utils/auth.js';
import {
  randomTenantId,
  randomCommandType,
  generateCommandParams,
  generateTenantsQueryParams,
  generateCommandsQueryParams,
  toQueryString,
} from '../utils/data-generators.js';
import {
  checkApiResponse,
  checkPaginatedResponse,
  thinkTime,
  buildUrl,
  logError,
} from '../utils/helpers.js';

// Configuração
const BASE_URL = __ENV.API_BASE_URL || 'https://api-dev.alquimistaai.com';

export const options = {
  scenarios: {
    internal_apis: internalApisScenario,
  },
  thresholds: {
    ...internalApiThresholds,
    'http_req_duration{endpoint:commands}': commandsThresholds['http_req_duration'],
  },
};

/**
 * Função principal de teste
 */
export default function () {
  const userId = `internal-${__VU}`;
  const isAdmin = __VU % 5 === 0; // 20% admins
  const token = getInternalToken(userId, isAdmin);
  const headers = getAuthHeaders(token);
  
  // Teste 1: GET /internal/tenants
  testListTenants(headers);
  thinkTime(2, 4);
  
  // Teste 2: GET /internal/tenants/{id}
  testGetTenantDetail(headers);
  thinkTime(2, 4);
  
  // Teste 3: GET /internal/usage/overview
  testGetUsageOverview(headers);
  thinkTime(2, 4);
  
  // Teste 4: GET /internal/billing/overview (apenas admins)
  if (isAdmin) {
    testGetBillingOverview(headers);
    thinkTime(2, 4);
  }
  
  // Teste 5: POST /internal/operations/commands
  testCreateCommand(headers);
  thinkTime(1, 2);
  
  // Teste 6: GET /internal/operations/commands
  testListCommands(headers);
  
  sleep(1);
}

/**
 * Testa GET /internal/tenants
 */
function testListTenants(headers) {
  const params = generateTenantsQueryParams();
  const url = buildUrl(BASE_URL, '/internal/tenants', params);
  
  try {
    const response = http.get(url, { 
      headers, 
      tags: { endpoint: 'internal-tenants' } 
    });
    
    checkApiResponse(response, 'GET /internal/tenants', [
      'tenants',
      'total',
      'limit',
      'offset',
    ]);
  } catch (error) {
    logError('Erro em GET /internal/tenants', error, { url });
  }
}

/**
 * Testa GET /internal/tenants/{id}
 */
function testGetTenantDetail(headers) {
  const tenantId = randomTenantId(100);
  const url = `${BASE_URL}/internal/tenants/${tenantId}`;
  
  try {
    const response = http.get(url, { 
      headers, 
      tags: { endpoint: 'internal-tenant-detail' } 
    });
    
    checkApiResponse(response, 'GET /internal/tenants/{id}', [
      'tenant',
      'users',
      'agents',
      'integrations',
      'usage_summary',
    ]);
  } catch (error) {
    logError('Erro em GET /internal/tenants/{id}', error, { url });
  }
}

/**
 * Testa GET /internal/usage/overview
 */
function testGetUsageOverview(headers) {
  const period = ['7d', '30d', '90d'][Math.floor(Math.random() * 3)];
  const url = buildUrl(BASE_URL, '/internal/usage/overview', { period });
  
  try {
    const response = http.get(url, { 
      headers, 
      tags: { endpoint: 'internal-usage-overview' } 
    });
    
    checkApiResponse(response, 'GET /internal/usage/overview', [
      'period',
      'global_stats',
      'top_tenants_by_usage',
      'top_agents_by_usage',
      'daily_trends',
    ]);
  } catch (error) {
    logError('Erro em GET /internal/usage/overview', error, { url });
  }
}

/**
 * Testa GET /internal/billing/overview
 */
function testGetBillingOverview(headers) {
  const period = ['7d', '30d', '90d'][Math.floor(Math.random() * 3)];
  const url = buildUrl(BASE_URL, '/internal/billing/overview', { period });
  
  try {
    const response = http.get(url, { 
      headers, 
      tags: { endpoint: 'internal-billing-overview' } 
    });
    
    checkApiResponse(response, 'GET /internal/billing/overview', [
      'period',
      'financial_summary',
      'by_plan',
      'by_segment',
      'revenue_trend',
    ]);
  } catch (error) {
    logError('Erro em GET /internal/billing/overview', error, { url });
  }
}

/**
 * Testa POST /internal/operations/commands
 */
function testCreateCommand(headers) {
  const commandType = randomCommandType();
  const params = generateCommandParams(commandType);
  
  const payload = JSON.stringify({
    command_type: commandType,
    tenant_id: Math.random() > 0.5 ? randomTenantId(100) : undefined,
    parameters: params,
  });
  
  const url = `${BASE_URL}/internal/operations/commands`;
  
  try {
    const response = http.post(url, payload, { 
      headers, 
      tags: { endpoint: 'commands' } 
    });
    
    checkApiResponse(response, 'POST /internal/operations/commands', [
      'command_id',
      'status',
      'created_at',
    ]);
  } catch (error) {
    logError('Erro em POST /internal/operations/commands', error, { url });
  }
}

/**
 * Testa GET /internal/operations/commands
 */
function testListCommands(headers) {
  const params = generateCommandsQueryParams();
  const url = buildUrl(BASE_URL, '/internal/operations/commands', params);
  
  try {
    const response = http.get(url, { 
      headers, 
      tags: { endpoint: 'commands-list' } 
    });
    
    checkApiResponse(response, 'GET /internal/operations/commands', [
      'commands',
      'total',
    ]);
  } catch (error) {
    logError('Erro em GET /internal/operations/commands', error, { url });
  }
}

/**
 * Função de setup
 */
export function setup() {
  console.log('Iniciando teste de APIs Internas');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Cenário: ${JSON.stringify(internalApisScenario)}`);
}

/**
 * Função de teardown
 */
export function teardown(data) {
  console.log('Teste de APIs Internas concluído');
}
