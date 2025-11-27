/**
 * Teste Completo de Performance - Painel Operacional AlquimistaAI
 * 
 * Simula carga real com mix de usuários clientes e equipe interna
 * Valida requisitos 12.1-12.4:
 * - Tempo de resposta < 2s para dashboards
 * - Suporte a 100+ tenants simultâneos
 * - Taxa de erro < 1%
 */

import http from 'k6/http';
import { sleep, check } from 'k6';
import { fullLoadTestThresholds } from '../config/thresholds.js';
import { fullLoadScenario } from '../config/scenarios.js';
import { getTenantToken, getInternalToken, getAuthHeaders } from '../utils/auth.js';
import {
  randomTenantId,
  randomPeriod,
  randomCommandType,
  generateCommandParams,
  generateUsageQueryParams,
  generateTenantsQueryParams,
  toQueryString,
} from '../utils/data-generators.js';
import {
  checkApiResponse,
  thinkTime,
  buildUrl,
  logError,
  generateSummary,
} from '../utils/helpers.js';

// Configuração
const BASE_URL = __ENV.API_BASE_URL || 'https://api-dev.alquimistaai.com';
const TEST_DURATION = __ENV.TEST_DURATION || '9m';

export const options = {
  scenarios: fullLoadScenario,
  thresholds: fullLoadTestThresholds,
};

/**
 * Cenário: Usuário Tenant
 * Simula cliente acessando seu dashboard
 */
export function tenantUser() {
  const tenantId = randomTenantId(100);
  const token = getTenantToken(tenantId);
  const headers = getAuthHeaders(token);
  
  // Fluxo típico de um usuário cliente
  
  // 1. Acessa dashboard principal
  getTenantMe(headers);
  thinkTime(2, 4);
  
  // 2. Visualiza agentes
  getTenantAgents(headers);
  thinkTime(3, 5);
  
  // 3. Verifica uso
  getTenantUsage(headers);
  thinkTime(2, 4);
  
  // 4. Ocasionalmente verifica integrações
  if (Math.random() > 0.7) {
    getTenantIntegrations(headers);
    thinkTime(2, 3);
  }
  
  // 5. Ocasionalmente verifica incidentes
  if (Math.random() > 0.8) {
    getTenantIncidents(headers);
  }
  
  sleep(1);
}

/**
 * Cenário: Usuário Interno
 * Simula equipe interna usando painel operacional
 */
export function internalUser() {
  const userId = `internal-${__VU}`;
  const isAdmin = __VU % 5 === 0;
  const token = getInternalToken(userId, isAdmin);
  const headers = getAuthHeaders(token);
  
  // Fluxo típico de um usuário interno
  
  // 1. Visualiza overview operacional
  getUsageOverview(headers);
  thinkTime(3, 5);
  
  // 2. Lista tenants
  listTenants(headers);
  thinkTime(2, 4);
  
  // 3. Ocasionalmente visualiza detalhes de um tenant
  if (Math.random() > 0.5) {
    getTenantDetail(headers);
    thinkTime(3, 5);
  }
  
  // 4. Admins verificam billing
  if (isAdmin && Math.random() > 0.6) {
    getBillingOverview(headers);
    thinkTime(2, 4);
  }
  
  // 5. Ocasionalmente cria comando operacional
  if (Math.random() > 0.7) {
    createCommand(headers);
    thinkTime(1, 2);
    listCommands(headers);
  }
  
  sleep(1);
}

/**
 * Cenário: Job em Background
 * Simula processos automáticos do sistema
 */
export function backgroundJob() {
  const token = getInternalToken('system-job', true);
  const headers = getAuthHeaders(token);
  
  // Simula agregação de métricas
  getUsageOverview(headers);
  sleep(30); // Jobs rodam a cada 30s
}

// ============================================================================
// Funções de API - Tenant
// ============================================================================

function getTenantMe(headers) {
  const url = `${BASE_URL}/tenant/me`;
  try {
    const response = http.get(url, { 
      headers, 
      tags: { endpoint: 'tenant', api: 'me' } 
    });
    checkApiResponse(response, 'tenant/me', ['id', 'name', 'plan']);
  } catch (error) {
    logError('Erro em tenant/me', error);
  }
}

function getTenantAgents(headers) {
  const url = buildUrl(BASE_URL, '/tenant/agents', { status: 'active' });
  try {
    const response = http.get(url, { 
      headers, 
      tags: { endpoint: 'tenant', api: 'agents' } 
    });
    checkApiResponse(response, 'tenant/agents', ['agents']);
  } catch (error) {
    logError('Erro em tenant/agents', error);
  }
}

function getTenantUsage(headers) {
  const params = generateUsageQueryParams();
  const url = buildUrl(BASE_URL, '/tenant/usage', params);
  try {
    const response = http.get(url, { 
      headers, 
      tags: { endpoint: 'tenant', api: 'usage' } 
    });
    checkApiResponse(response, 'tenant/usage', ['summary', 'daily_data']);
  } catch (error) {
    logError('Erro em tenant/usage', error);
  }
}

function getTenantIntegrations(headers) {
  const url = `${BASE_URL}/tenant/integrations`;
  try {
    const response = http.get(url, { 
      headers, 
      tags: { endpoint: 'tenant', api: 'integrations' } 
    });
    checkApiResponse(response, 'tenant/integrations', ['integrations']);
  } catch (error) {
    logError('Erro em tenant/integrations', error);
  }
}

function getTenantIncidents(headers) {
  const url = buildUrl(BASE_URL, '/tenant/incidents', { limit: 20 });
  try {
    const response = http.get(url, { 
      headers, 
      tags: { endpoint: 'tenant', api: 'incidents' } 
    });
    checkApiResponse(response, 'tenant/incidents', ['incidents', 'total']);
  } catch (error) {
    logError('Erro em tenant/incidents', error);
  }
}

// ============================================================================
// Funções de API - Internal
// ============================================================================

function listTenants(headers) {
  const params = generateTenantsQueryParams();
  const url = buildUrl(BASE_URL, '/internal/tenants', params);
  try {
    const response = http.get(url, { 
      headers, 
      tags: { endpoint: 'internal', api: 'tenants-list' } 
    });
    checkApiResponse(response, 'internal/tenants', ['tenants', 'total']);
  } catch (error) {
    logError('Erro em internal/tenants', error);
  }
}

function getTenantDetail(headers) {
  const tenantId = randomTenantId(100);
  const url = `${BASE_URL}/internal/tenants/${tenantId}`;
  try {
    const response = http.get(url, { 
      headers, 
      tags: { endpoint: 'internal', api: 'tenant-detail' } 
    });
    checkApiResponse(response, 'internal/tenants/{id}', ['tenant', 'users']);
  } catch (error) {
    logError('Erro em internal/tenants/{id}', error);
  }
}

function getUsageOverview(headers) {
  const period = randomPeriod();
  const url = buildUrl(BASE_URL, '/internal/usage/overview', { period });
  try {
    const response = http.get(url, { 
      headers, 
      tags: { endpoint: 'internal', api: 'usage-overview' } 
    });
    checkApiResponse(response, 'internal/usage/overview', ['global_stats']);
  } catch (error) {
    logError('Erro em internal/usage/overview', error);
  }
}

function getBillingOverview(headers) {
  const period = randomPeriod();
  const url = buildUrl(BASE_URL, '/internal/billing/overview', { period });
  try {
    const response = http.get(url, { 
      headers, 
      tags: { endpoint: 'internal', api: 'billing-overview' } 
    });
    checkApiResponse(response, 'internal/billing/overview', ['financial_summary']);
  } catch (error) {
    logError('Erro em internal/billing/overview', error);
  }
}

function createCommand(headers) {
  const commandType = randomCommandType();
  const payload = JSON.stringify({
    command_type: commandType,
    parameters: generateCommandParams(commandType),
  });
  
  const url = `${BASE_URL}/internal/operations/commands`;
  try {
    const response = http.post(url, payload, { 
      headers, 
      tags: { endpoint: 'commands', api: 'create' } 
    });
    checkApiResponse(response, 'commands/create', ['command_id', 'status']);
  } catch (error) {
    logError('Erro em commands/create', error);
  }
}

function listCommands(headers) {
  const url = buildUrl(BASE_URL, '/internal/operations/commands', { limit: 50 });
  try {
    const response = http.get(url, { 
      headers, 
      tags: { endpoint: 'commands', api: 'list' } 
    });
    checkApiResponse(response, 'commands/list', ['commands', 'total']);
  } catch (error) {
    logError('Erro em commands/list', error);
  }
}

// ============================================================================
// Lifecycle Hooks
// ============================================================================

export function setup() {
  console.log('='.repeat(80));
  console.log('TESTE COMPLETO DE PERFORMANCE - PAINEL OPERACIONAL ALQUIMISTAAI');
  console.log('='.repeat(80));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Duração: ${TEST_DURATION}`);
  console.log(`Cenários: ${Object.keys(fullLoadScenario).join(', ')}`);
  console.log('='.repeat(80));
  
  // Validar conectividade
  const healthUrl = `${BASE_URL}/health`;
  const response = http.get(healthUrl);
  
  if (response.status !== 200) {
    throw new Error(`API não está acessível: ${response.status}`);
  }
  
  console.log('✓ API acessível');
  console.log('Iniciando teste...\n');
  
  return {
    startTime: new Date().toISOString(),
  };
}

export function teardown(data) {
  console.log('\n' + '='.repeat(80));
  console.log('TESTE CONCLUÍDO');
  console.log('='.repeat(80));
  console.log(`Início: ${data.startTime}`);
  console.log(`Fim: ${new Date().toISOString()}`);
  console.log('='.repeat(80));
}

/**
 * Função para gerar relatório customizado
 */
export function handleSummary(data) {
  const summary = generateSummary(data);
  
  console.log('\n' + '='.repeat(80));
  console.log('RESUMO DE PERFORMANCE');
  console.log('='.repeat(80));
  
  for (const [key, value] of Object.entries(summary)) {
    console.log(`${key}: ${value}`);
  }
  
  console.log('='.repeat(80));
  
  // Validar thresholds
  const p95 = data.metrics.http_req_duration.values['p(95)'];
  const errorRate = data.metrics.http_req_failed.values.rate;
  
  if (p95 > 2000) {
    console.log(`⚠️  ATENÇÃO: P95 (${p95.toFixed(0)}ms) acima do threshold (2000ms)`);
  } else {
    console.log(`✓ P95 dentro do threshold: ${p95.toFixed(0)}ms < 2000ms`);
  }
  
  if (errorRate > 0.01) {
    console.log(`⚠️  ATENÇÃO: Taxa de erro (${(errorRate * 100).toFixed(2)}%) acima do threshold (1%)`);
  } else {
    console.log(`✓ Taxa de erro dentro do threshold: ${(errorRate * 100).toFixed(2)}% < 1%`);
  }
  
  console.log('='.repeat(80) + '\n');
  
  // Retornar relatórios em múltiplos formatos
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'tests/load/reports/summary.json': JSON.stringify(data, null, 2),
    'tests/load/reports/summary.html': htmlReport(data),
  };
}

/**
 * Gera relatório HTML simples
 */
function htmlReport(data) {
  const summary = generateSummary(data);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Relatório de Performance - Painel Operacional</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #333; }
    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
    tr:nth-child(even) { background-color: #f2f2f2; }
    .pass { color: green; font-weight: bold; }
    .fail { color: red; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Relatório de Performance - Painel Operacional AlquimistaAI</h1>
  <p><strong>Data:</strong> ${new Date().toISOString()}</p>
  
  <h2>Resumo</h2>
  <table>
    <tr><th>Métrica</th><th>Valor</th></tr>
    ${Object.entries(summary).map(([key, value]) => 
      `<tr><td>${key}</td><td>${value}</td></tr>`
    ).join('')}
  </table>
  
  <h2>Thresholds</h2>
  <table>
    <tr><th>Requisito</th><th>Threshold</th><th>Valor</th><th>Status</th></tr>
    <tr>
      <td>Tempo de resposta (P95)</td>
      <td>&lt; 2000ms</td>
      <td>${data.metrics.http_req_duration.values['p(95)'].toFixed(0)}ms</td>
      <td class="${data.metrics.http_req_duration.values['p(95)'] < 2000 ? 'pass' : 'fail'}">
        ${data.metrics.http_req_duration.values['p(95)'] < 2000 ? '✓ PASS' : '✗ FAIL'}
      </td>
    </tr>
    <tr>
      <td>Taxa de erro</td>
      <td>&lt; 1%</td>
      <td>${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%</td>
      <td class="${data.metrics.http_req_failed.values.rate < 0.01 ? 'pass' : 'fail'}">
        ${data.metrics.http_req_failed.values.rate < 0.01 ? '✓ PASS' : '✗ FAIL'}
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Importar textSummary do k6
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
