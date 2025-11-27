/**
 * Thresholds de Performance - Painel Operacional AlquimistaAI
 * 
 * Baseado nos requisitos 12.1-12.4:
 * - Tempo de resposta < 2s para dashboards (p95)
 * - Taxa de erro < 1%
 * - Suportar 100+ tenants simultâneos
 */

export const dashboardThresholds = {
  // Tempo de resposta total (incluindo rede)
  'http_req_duration': ['p(95)<2000', 'p(99)<3000'], // 95% < 2s, 99% < 3s
  
  // Tempo de espera (processamento no servidor)
  'http_req_waiting': ['p(95)<1500', 'p(99)<2500'],
  
  // Taxa de erro
  'http_req_failed': ['rate<0.01'], // < 1%
  
  // Requisições bem-sucedidas
  'http_reqs': ['rate>10'], // Mínimo 10 req/s
};

export const apiThresholds = {
  // APIs devem ser mais rápidas que dashboards
  'http_req_duration': ['p(95)<1000', 'p(99)<1500'], // 95% < 1s, 99% < 1.5s
  
  'http_req_waiting': ['p(95)<800', 'p(99)<1200'],
  
  'http_req_failed': ['rate<0.01'],
  
  'http_reqs': ['rate>20'], // Mínimo 20 req/s
};

export const internalApiThresholds = {
  // APIs internas podem ser um pouco mais lentas (queries complexas)
  'http_req_duration': ['p(95)<3000', 'p(99)<5000'], // 95% < 3s, 99% < 5s
  
  'http_req_waiting': ['p(95)<2500', 'p(99)<4500'],
  
  'http_req_failed': ['rate<0.01'],
  
  'http_reqs': ['rate>5'], // Mínimo 5 req/s (menos usuários internos)
};

export const commandsThresholds = {
  // Comandos operacionais podem ser mais lentos (operações complexas)
  'http_req_duration': ['p(95)<5000', 'p(99)<10000'], // 95% < 5s, 99% < 10s
  
  'http_req_waiting': ['p(95)<4500', 'p(99)<9500'],
  
  'http_req_failed': ['rate<0.05'], // < 5% (comandos podem falhar por validação)
};

export const cacheThresholds = {
  // Endpoints com cache devem ser muito rápidos
  'http_req_duration{cached:yes}': ['p(95)<200', 'p(99)<500'], // 95% < 200ms
  
  'http_req_duration{cached:no}': ['p(95)<2000', 'p(99)<3000'],
};

export const scalabilityThresholds = {
  // Teste de escalabilidade com 100+ tenants
  'http_req_duration': ['p(95)<2500', 'p(99)<4000'],
  
  'http_req_failed': ['rate<0.02'], // < 2% (mais tolerante com alta carga)
  
  'http_reqs': ['rate>50'], // Mínimo 50 req/s com 100+ VUs
  
  // Duração de iteração (ciclo completo de um usuário)
  'iteration_duration': ['p(95)<10000'], // 95% < 10s
};

/**
 * Thresholds customizados por endpoint
 */
export const endpointThresholds = {
  'GET /tenant/me': {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'], // Endpoint simples
  },
  
  'GET /tenant/agents': {
    'http_req_duration': ['p(95)<1000', 'p(99)<1500'],
  },
  
  'GET /tenant/usage': {
    'http_req_duration': ['p(95)<2000', 'p(99)<3000'], // Query complexa
  },
  
  'GET /internal/tenants': {
    'http_req_duration': ['p(95)<2000', 'p(99)<3000'], // Lista grande
  },
  
  'GET /internal/usage/overview': {
    'http_req_duration': ['p(95)<3000', 'p(99)<5000'], // Agregação complexa
  },
  
  'GET /internal/billing/overview': {
    'http_req_duration': ['p(95)<3000', 'p(99)<5000'], // Cálculos financeiros
  },
  
  'POST /internal/operations/commands': {
    'http_req_duration': ['p(95)<1000', 'p(99)<2000'], // Apenas cria comando
  },
};

/**
 * Função para obter thresholds baseado no tipo de teste
 */
export function getThresholds(testType) {
  switch (testType) {
    case 'dashboard':
      return dashboardThresholds;
    case 'api':
      return apiThresholds;
    case 'internal':
      return internalApiThresholds;
    case 'commands':
      return commandsThresholds;
    case 'cache':
      return cacheThresholds;
    case 'scalability':
      return scalabilityThresholds;
    default:
      return dashboardThresholds;
  }
}

/**
 * Thresholds combinados para teste completo
 */
export const fullLoadTestThresholds = {
  ...dashboardThresholds,
  
  // Adicionar métricas específicas
  'http_req_duration{endpoint:tenant}': ['p(95)<2000'],
  'http_req_duration{endpoint:internal}': ['p(95)<3000'],
  'http_req_duration{endpoint:commands}': ['p(95)<5000'],
  
  // Checks customizados
  'checks': ['rate>0.95'], // 95% dos checks devem passar
};
