/**
 * Cenários de Teste - Painel Operacional AlquimistaAI
 * 
 * Define diferentes cenários de carga para simular uso real
 */

/**
 * Smoke Test - Teste mínimo para verificar funcionalidade básica
 */
export const smokeTest = {
  executor: 'constant-vus',
  vus: 1,
  duration: '30s',
};

/**
 * Load Test - Carga normal esperada
 */
export const loadTest = {
  executor: 'ramping-vus',
  startVUs: 0,
  stages: [
    { duration: '1m', target: 10 },  // Ramp-up para 10 VUs
    { duration: '5m', target: 10 },  // Manter 10 VUs
    { duration: '1m', target: 0 },   // Ramp-down
  ],
  gracefulRampDown: '30s',
};

/**
 * Stress Test - Carga alta para encontrar limites
 */
export const stressTest = {
  executor: 'ramping-vus',
  startVUs: 0,
  stages: [
    { duration: '2m', target: 20 },   // Ramp-up para 20 VUs
    { duration: '5m', target: 20 },   // Manter 20 VUs
    { duration: '2m', target: 50 },   // Aumentar para 50 VUs
    { duration: '5m', target: 50 },   // Manter 50 VUs
    { duration: '2m', target: 0 },    // Ramp-down
  ],
  gracefulRampDown: '30s',
};

/**
 * Spike Test - Picos súbitos de carga
 */
export const spikeTest = {
  executor: 'ramping-vus',
  startVUs: 0,
  stages: [
    { duration: '30s', target: 10 },  // Carga normal
    { duration: '30s', target: 100 }, // Pico súbito
    { duration: '1m', target: 100 },  // Manter pico
    { duration: '30s', target: 10 },  // Volta ao normal
    { duration: '30s', target: 0 },   // Ramp-down
  ],
  gracefulRampDown: '30s',
};

/**
 * Soak Test - Teste de longa duração
 */
export const soakTest = {
  executor: 'constant-vus',
  vus: 20,
  duration: '30m',
};

/**
 * Breakpoint Test - Encontrar ponto de quebra
 */
export const breakpointTest = {
  executor: 'ramping-arrival-rate',
  startRate: 10,
  timeUnit: '1s',
  preAllocatedVUs: 50,
  maxVUs: 200,
  stages: [
    { duration: '2m', target: 10 },   // 10 req/s
    { duration: '2m', target: 20 },   // 20 req/s
    { duration: '2m', target: 50 },   // 50 req/s
    { duration: '2m', target: 100 },  // 100 req/s
    { duration: '2m', target: 200 },  // 200 req/s
  ],
};

/**
 * Cenário: Dashboard do Cliente
 * Simula 50 usuários clientes acessando seus dashboards
 */
export const tenantDashboardScenario = {
  executor: 'ramping-vus',
  exec: 'tenantDashboard',
  startVUs: 0,
  stages: [
    { duration: '1m', target: 10 },
    { duration: '5m', target: 50 },
    { duration: '1m', target: 0 },
  ],
  gracefulRampDown: '30s',
  tags: { scenario: 'tenant-dashboard' },
};

/**
 * Cenário: Painel Operacional Interno
 * Simula 20 usuários internos acessando painel operacional
 */
export const internalPanelScenario = {
  executor: 'ramping-vus',
  exec: 'internalPanel',
  startVUs: 0,
  stages: [
    { duration: '1m', target: 5 },
    { duration: '5m', target: 20 },
    { duration: '1m', target: 0 },
  ],
  gracefulRampDown: '30s',
  tags: { scenario: 'internal-panel' },
};

/**
 * Cenário: APIs de Tenant
 * Testa endpoints /tenant/* isoladamente
 */
export const tenantApisScenario = {
  executor: 'constant-arrival-rate',
  rate: 50, // 50 requisições por segundo
  timeUnit: '1s',
  duration: '5m',
  preAllocatedVUs: 20,
  maxVUs: 100,
  exec: 'tenantApis',
  tags: { scenario: 'tenant-apis' },
};

/**
 * Cenário: APIs Internas
 * Testa endpoints /internal/* isoladamente
 */
export const internalApisScenario = {
  executor: 'constant-arrival-rate',
  rate: 20, // 20 requisições por segundo
  timeUnit: '1s',
  duration: '5m',
  preAllocatedVUs: 10,
  maxVUs: 50,
  exec: 'internalApis',
  tags: { scenario: 'internal-apis' },
};

/**
 * Cenário: Comandos Operacionais
 * Testa criação e listagem de comandos
 */
export const operationalCommandsScenario = {
  executor: 'constant-vus',
  vus: 5,
  duration: '3m',
  exec: 'operationalCommands',
  tags: { scenario: 'operational-commands' },
};

/**
 * Cenário: Teste de Cache
 * Valida efetividade do cache Redis
 */
export const cacheTestScenario = {
  executor: 'ramping-vus',
  exec: 'cacheTest',
  startVUs: 0,
  stages: [
    { duration: '30s', target: 10 },  // Primeira rodada (cache miss)
    { duration: '2m', target: 10 },   // Segunda rodada (cache hit)
    { duration: '30s', target: 50 },  // Alta carga com cache
    { duration: '2m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  tags: { scenario: 'cache-test' },
};

/**
 * Cenário: Escalabilidade com 100+ Tenants
 * Simula sistema com muitos tenants simultâneos
 */
export const scalabilityScenario = {
  executor: 'ramping-vus',
  exec: 'scalabilityTest',
  startVUs: 0,
  stages: [
    { duration: '2m', target: 50 },   // 50 tenants
    { duration: '3m', target: 50 },
    { duration: '2m', target: 100 },  // 100 tenants
    { duration: '5m', target: 100 },
    { duration: '2m', target: 150 },  // 150 tenants (stress)
    { duration: '3m', target: 150 },
    { duration: '2m', target: 0 },
  ],
  gracefulRampDown: '1m',
  tags: { scenario: 'scalability' },
};

/**
 * Cenário Completo - Todos os tipos de usuários
 * Simula uso real com mix de clientes e equipe interna
 */
export const fullLoadScenario = {
  tenantUsers: {
    executor: 'ramping-vus',
    exec: 'tenantUser',
    startVUs: 0,
    stages: [
      { duration: '2m', target: 30 },
      { duration: '5m', target: 30 },
      { duration: '2m', target: 0 },
    ],
    tags: { user_type: 'tenant' },
  },
  
  internalUsers: {
    executor: 'ramping-vus',
    exec: 'internalUser',
    startVUs: 0,
    stages: [
      { duration: '2m', target: 10 },
      { duration: '5m', target: 10 },
      { duration: '2m', target: 0 },
    ],
    tags: { user_type: 'internal' },
  },
  
  backgroundJobs: {
    executor: 'constant-vus',
    exec: 'backgroundJob',
    vus: 2,
    duration: '9m',
    tags: { user_type: 'system' },
  },
};

/**
 * Função para obter cenário baseado no tipo de teste
 */
export function getScenario(testType) {
  switch (testType) {
    case 'smoke':
      return smokeTest;
    case 'load':
      return loadTest;
    case 'stress':
      return stressTest;
    case 'spike':
      return spikeTest;
    case 'soak':
      return soakTest;
    case 'breakpoint':
      return breakpointTest;
    case 'tenant-dashboard':
      return tenantDashboardScenario;
    case 'internal-panel':
      return internalPanelScenario;
    case 'tenant-apis':
      return tenantApisScenario;
    case 'internal-apis':
      return internalApisScenario;
    case 'commands':
      return operationalCommandsScenario;
    case 'cache':
      return cacheTestScenario;
    case 'scalability':
      return scalabilityScenario;
    case 'full':
      return fullLoadScenario;
    default:
      return loadTest;
  }
}
