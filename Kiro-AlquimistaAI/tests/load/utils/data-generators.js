/**
 * Geradores de Dados para Testes de Performance
 */

/**
 * Gera ID de tenant aleatório
 */
export function randomTenantId(max = 100) {
  return `tenant-${Math.floor(Math.random() * max) + 1}`;
}

/**
 * Gera ID de agente aleatório
 */
export function randomAgentId(max = 32) {
  return `agent-${Math.floor(Math.random() * max) + 1}`;
}

/**
 * Gera ID de usuário aleatório
 */
export function randomUserId(max = 1000) {
  return `user-${Math.floor(Math.random() * max) + 1}`;
}

/**
 * Gera período aleatório
 */
export function randomPeriod() {
  const periods = ['7d', '30d', '90d'];
  return periods[Math.floor(Math.random() * periods.length)];
}

/**
 * Gera status aleatório
 */
export function randomStatus() {
  const statuses = ['active', 'inactive', 'suspended'];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

/**
 * Gera tipo de comando aleatório
 */
export function randomCommandType() {
  const types = ['REPROCESS_QUEUE', 'RESET_TOKEN', 'RESTART_AGENT', 'HEALTH_CHECK'];
  return types[Math.floor(Math.random() * types.length)];
}

/**
 * Gera parâmetros de comando baseado no tipo
 */
export function generateCommandParams(commandType) {
  switch (commandType) {
    case 'REPROCESS_QUEUE':
      return {
        queueName: `queue-${Math.floor(Math.random() * 10)}`,
        startDate: new Date(Date.now() - 86400000).toISOString(),
        endDate: new Date().toISOString(),
      };
      
    case 'RESET_TOKEN':
      return {
        tenantId: randomTenantId(),
        integrationId: `integration-${Math.floor(Math.random() * 20)}`,
      };
      
    case 'RESTART_AGENT':
      return {
        tenantId: randomTenantId(),
        agentId: randomAgentId(),
      };
      
    case 'HEALTH_CHECK':
      return {
        services: ['api', 'database', 'cache', 'queue'],
      };
      
    default:
      return {};
  }
}

/**
 * Gera query params para listagem de tenants
 */
export function generateTenantsQueryParams() {
  const params = {};
  
  if (Math.random() > 0.5) {
    params.status = randomStatus();
  }
  
  if (Math.random() > 0.7) {
    params.plan = ['starter', 'professional', 'enterprise'][Math.floor(Math.random() * 3)];
  }
  
  if (Math.random() > 0.8) {
    params.segment = ['saude', 'educacao', 'vendas', 'financeiro'][Math.floor(Math.random() * 4)];
  }
  
  if (Math.random() > 0.6) {
    params.search = `empresa-${Math.floor(Math.random() * 50)}`;
  }
  
  params.limit = [10, 20, 50][Math.floor(Math.random() * 3)];
  params.offset = Math.floor(Math.random() * 5) * params.limit;
  
  return params;
}

/**
 * Gera query params para uso
 */
export function generateUsageQueryParams() {
  const params = {
    period: randomPeriod(),
  };
  
  if (Math.random() > 0.5) {
    params.agent_id = randomAgentId();
  }
  
  return params;
}

/**
 * Gera query params para comandos
 */
export function generateCommandsQueryParams() {
  const params = {};
  
  if (Math.random() > 0.5) {
    params.status = ['PENDING', 'RUNNING', 'SUCCESS', 'ERROR'][Math.floor(Math.random() * 4)];
  }
  
  if (Math.random() > 0.7) {
    params.command_type = randomCommandType();
  }
  
  if (Math.random() > 0.6) {
    params.tenant_id = randomTenantId();
  }
  
  params.limit = [20, 50, 100][Math.floor(Math.random() * 3)];
  params.offset = Math.floor(Math.random() * 3) * params.limit;
  
  return params;
}

/**
 * Gera dados de tenant para teste
 */
export function generateTenantData(id) {
  return {
    id: `tenant-${id}`,
    name: `Empresa Teste ${id}`,
    cnpj: `${String(id).padStart(8, '0')}000100`,
    segment: ['saude', 'educacao', 'vendas', 'financeiro'][id % 4],
    plan: ['starter', 'professional', 'enterprise'][id % 3],
    status: 'active',
    mrr_estimate: 1000 + (id * 100),
  };
}

/**
 * Gera dados de agente para teste
 */
export function generateAgentData(id) {
  return {
    id: `agent-${id}`,
    name: `Agente ${id}`,
    segment: ['saude', 'educacao', 'vendas'][id % 3],
    description: `Descrição do agente ${id}`,
    priceMonthly: 29.90,
  };
}

/**
 * Gera dados de uso para teste
 */
export function generateUsageData(days = 30) {
  const data = [];
  const now = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toISOString().split('T')[0],
      total_requests: Math.floor(Math.random() * 1000) + 100,
      successful_requests: Math.floor(Math.random() * 950) + 50,
      failed_requests: Math.floor(Math.random() * 50),
      avg_response_time_ms: Math.floor(Math.random() * 500) + 100,
    });
  }
  
  return data;
}

/**
 * Gera lista de tenants para teste de escalabilidade
 */
export function generateTenantsList(count) {
  const tenants = [];
  
  for (let i = 1; i <= count; i++) {
    tenants.push(generateTenantData(i));
  }
  
  return tenants;
}

/**
 * Gera lista de agentes para teste
 */
export function generateAgentsList(count = 32) {
  const agents = [];
  
  for (let i = 1; i <= count; i++) {
    agents.push(generateAgentData(i));
  }
  
  return agents;
}

/**
 * Converte objeto em query string
 */
export function toQueryString(params) {
  return Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== null)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
}

/**
 * Gera email aleatório
 */
export function randomEmail() {
  return `user-${Math.floor(Math.random() * 10000)}@test.com`;
}

/**
 * Gera nome de empresa aleatório
 */
export function randomCompanyName() {
  const prefixes = ['Tech', 'Digital', 'Smart', 'Cloud', 'Data'];
  const suffixes = ['Solutions', 'Systems', 'Services', 'Labs', 'Corp'];
  
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  
  return `${prefix} ${suffix}`;
}

/**
 * Gera CNPJ aleatório (formato válido)
 */
export function randomCNPJ() {
  const num = Math.floor(Math.random() * 100000000);
  return `${String(num).padStart(8, '0')}000100`;
}

/**
 * Gera dados de contato comercial
 */
export function generateCommercialContactData() {
  return {
    companyName: randomCompanyName(),
    cnpj: randomCNPJ(),
    contactName: `Contato ${Math.floor(Math.random() * 1000)}`,
    email: randomEmail(),
    whatsapp: `+5584${Math.floor(Math.random() * 100000000)}`,
    selectedAgents: Array.from(
      { length: Math.floor(Math.random() * 5) + 1 },
      () => randomAgentId()
    ),
    selectedSubnucleos: Math.random() > 0.5 ? ['saude', 'vendas'] : [],
    message: 'Mensagem de teste para contato comercial',
  };
}

/**
 * Gera dados de trial
 */
export function generateTrialData() {
  return {
    userId: randomUserId(),
    targetType: Math.random() > 0.5 ? 'agent' : 'subnucleo',
    targetId: randomAgentId(),
    message: 'Mensagem de teste para trial',
  };
}

/**
 * Gera dados de checkout
 */
export function generateCheckoutData() {
  const agentCount = Math.floor(Math.random() * 10) + 1;
  
  return {
    tenantId: randomTenantId(),
    selectedAgents: Array.from({ length: agentCount }, () => randomAgentId()),
    totalAmount: agentCount * 29.90,
  };
}

/**
 * Sleep aleatório para simular comportamento humano
 */
export function randomSleep(min = 1, max = 5) {
  return Math.random() * (max - min) + min;
}

/**
 * Decide aleatoriamente (probabilidade)
 */
export function randomChance(probability = 0.5) {
  return Math.random() < probability;
}
