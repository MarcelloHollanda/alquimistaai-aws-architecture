/**
 * Teste de Performance - APIs de Tenant (/tenant/*)
 * 
 * Testa endpoints acessados por usuários clientes
 */

import http from 'k6/http';
import { sleep } from 'k6';
import { apiThresholds } from '../config/thresholds.js';
import { tenantApisScenario } from '../config/scenarios.js';
import { getTenantToken, getAuthHeaders } from '../utils/auth.js';
import {
  randomTenantId,
  randomPeriod,
  generateUsageQueryParams,
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
    tenant_apis: tenantApisScenario,
  },
  thresholds: apiThresholds,
};

/**
 * Função principal de teste
 */
export default function () {
  const tenantId = randomTenantId(100);
  const token = getTenantToken(tenantId);
  const headers = getAuthHeaders(token);
  
  // Teste 1: GET /tenant/me
  testGetTenantMe(headers);
  thinkTime(1, 3);
  
  // Teste 2: GET /tenant/agents
  testGetTenantAgents(headers);
  thinkTime(1, 3);
  
  // Teste 3: GET /tenant/integrations
  testGetTenantIntegrations(headers);
  thinkTime(1, 3);
  
  // Teste 4: GET /tenant/usage
  testGetTenantUsage(headers);
  thinkTime(1, 3);
  
  // Teste 5: GET /tenant/incidents
  testGetTenantIncidents(headers);
  
  sleep(1);
}

/**
 * Testa GET /tenant/me
 */
function testGetTenantMe(headers) {
  const url = `${BASE_URL}/tenant/me`;
  
  try {
    const response = http.get(url, { headers, tags: { endpoint: 'tenant-me' } });
    
    checkApiResponse(response, 'GET /tenant/me', [
      'id',
      'name',
      'plan',
      'status',
      'limits',
      'usage',
    ]);
  } catch (error) {
    logError('Erro em GET /tenant/me', error, { url });
  }
}

/**
 * Testa GET /tenant/agents
 */
function testGetTenantAgents(headers) {
  const status = Math.random() > 0.5 ? 'active' : 'all';
  const url = buildUrl(BASE_URL, '/tenant/agents', { status });
  
  try {
    const response = http.get(url, { headers, tags: { endpoint: 'tenant-agents' } });
    
    checkApiResponse(response, 'GET /tenant/agents', ['agents']);
  } catch (error) {
    logError('Erro em GET /tenant/agents', error, { url });
  }
}

/**
 * Testa GET /tenant/integrations
 */
function testGetTenantIntegrations(headers) {
  const url = `${BASE_URL}/tenant/integrations`;
  
  try {
    const response = http.get(url, { headers, tags: { endpoint: 'tenant-integrations' } });
    
    checkApiResponse(response, 'GET /tenant/integrations', ['integrations']);
  } catch (error) {
    logError('Erro em GET /tenant/integrations', error, { url });
  }
}

/**
 * Testa GET /tenant/usage
 */
function testGetTenantUsage(headers) {
  const params = generateUsageQueryParams();
  const url = buildUrl(BASE_URL, '/tenant/usage', params);
  
  try {
    const response = http.get(url, { headers, tags: { endpoint: 'tenant-usage' } });
    
    checkApiResponse(response, 'GET /tenant/usage', [
      'period',
      'summary',
      'daily_data',
      'by_agent',
    ]);
  } catch (error) {
    logError('Erro em GET /tenant/usage', error, { url });
  }
}

/**
 * Testa GET /tenant/incidents
 */
function testGetTenantIncidents(headers) {
  const params = {
    limit: 20,
    offset: 0,
  };
  const url = buildUrl(BASE_URL, '/tenant/incidents', params);
  
  try {
    const response = http.get(url, { headers, tags: { endpoint: 'tenant-incidents' } });
    
    checkApiResponse(response, 'GET /tenant/incidents', ['incidents', 'total']);
  } catch (error) {
    logError('Erro em GET /tenant/incidents', error, { url });
  }
}

/**
 * Função de setup (executada uma vez antes do teste)
 */
export function setup() {
  console.log('Iniciando teste de APIs de Tenant');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Cenário: ${JSON.stringify(tenantApisScenario)}`);
}

/**
 * Função de teardown (executada uma vez após o teste)
 */
export function teardown(data) {
  console.log('Teste de APIs de Tenant concluído');
}
