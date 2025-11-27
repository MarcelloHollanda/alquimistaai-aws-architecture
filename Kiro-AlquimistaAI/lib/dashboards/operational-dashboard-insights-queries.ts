/**
 * CloudWatch Logs Insights Queries para Painel Operacional
 * 
 * Queries pré-configuradas para análise de logs do painel operacional
 */

export interface InsightsQuery {
  name: string;
  description: string;
  query: string;
  logGroupNames: string[];
}

/**
 * Queries para APIs de Tenant
 */
export const tenantAPIQueries: InsightsQuery[] = [
  {
    name: 'Tenant API Errors',
    description: 'Erros nas APIs de tenant agrupados por tenant',
    query: `fields @timestamp, tenantId, @message, error.message
| filter @message like /ERROR/
| filter path like /\\/tenant\\//
| stats count() as errorCount by tenantId
| sort errorCount desc
| limit 20`,
    logGroupNames: ['/aws/lambda/operational-dashboard-tenant-api']
  },
  {
    name: 'Tenant API Latency',
    description: 'Latência das APIs de tenant por endpoint',
    query: `fields @timestamp, path, @duration
| filter path like /\\/tenant\\//
| stats avg(@duration) as avgLatency, max(@duration) as maxLatency, min(@duration) as minLatency, count() as requests by path
| sort avgLatency desc`,
    logGroupNames: ['/aws/lambda/operational-dashboard-tenant-api']
  },
  {
    name: 'Most Active Tenants',
    description: 'Tenants mais ativos por número de requisições',
    query: `fields @timestamp, tenantId
| filter tenantId != ""
| stats count() as requests by tenantId
| sort requests desc
| limit 20`,
    logGroupNames: ['/aws/lambda/operational-dashboard-tenant-api']
  },
  {
    name: 'Tenant API Status Codes',
    description: 'Distribuição de status codes nas APIs de tenant',
    query: `fields @timestamp, statusCode, path
| filter path like /\\/tenant\\//
| stats count() as requests by statusCode, path
| sort requests desc`,
    logGroupNames: ['/aws/lambda/operational-dashboard-tenant-api']
  },
  {
    name: 'Slow Tenant Requests',
    description: 'Requisições de tenant mais lentas (> 2s)',
    query: `fields @timestamp, tenantId, path, @duration
| filter @duration > 2000
| filter path like /\\/tenant\\//
| sort @duration desc
| limit 50`,
    logGroupNames: ['/aws/lambda/operational-dashboard-tenant-api']
  }
];

/**
 * Queries para APIs Internas
 */
export const internalAPIQueries: InsightsQuery[] = [
  {
    name: 'Internal API Errors',
    description: 'Erros nas APIs internas agrupados por usuário',
    query: `fields @timestamp, userId, @message, error.message
| filter @message like /ERROR/
| filter path like /\\/internal\\//
| stats count() as errorCount by userId
| sort errorCount desc
| limit 20`,
    logGroupNames: ['/aws/lambda/operational-dashboard-internal-api']
  },
  {
    name: 'Internal API Usage by User',
    description: 'Uso das APIs internas por usuário',
    query: `fields @timestamp, userId, path
| filter isInternal = "true"
| stats count() as requests by userId, path
| sort requests desc
| limit 50`,
    logGroupNames: ['/aws/lambda/operational-dashboard-internal-api']
  },
  {
    name: 'Internal API Latency',
    description: 'Latência das APIs internas por endpoint',
    query: `fields @timestamp, path, @duration
| filter path like /\\/internal\\//
| stats avg(@duration) as avgLatency, max(@duration) as maxLatency, percentile(@duration, 95) as p95Latency by path
| sort avgLatency desc`,
    logGroupNames: ['/aws/lambda/operational-dashboard-internal-api']
  },
  {
    name: 'Forbidden Access Attempts',
    description: 'Tentativas de acesso não autorizado',
    query: `fields @timestamp, userId, path, @message
| filter statusCode = 403 or @message like /Forbidden/
| stats count() as attempts by userId, path
| sort attempts desc`,
    logGroupNames: ['/aws/lambda/operational-dashboard-internal-api']
  },
  {
    name: 'Active Internal Users',
    description: 'Usuários internos ativos nas últimas 24h',
    query: `fields @timestamp, userId
| filter isInternal = "true"
| stats count() as requests, min(@timestamp) as firstRequest, max(@timestamp) as lastRequest by userId
| sort requests desc`,
    logGroupNames: ['/aws/lambda/operational-dashboard-internal-api']
  }
];

/**
 * Queries para Comandos Operacionais
 */
export const operationalCommandQueries: InsightsQuery[] = [
  {
    name: 'Operational Commands by Type',
    description: 'Comandos operacionais agrupados por tipo e status',
    query: `fields @timestamp, commandType, status, tenantId
| filter @message like /operational command/ or @message like /command/i
| stats count() as commandCount by commandType, status
| sort commandCount desc`,
    logGroupNames: ['/aws/lambda/operational-dashboard-commands']
  },
  {
    name: 'Failed Operational Commands',
    description: 'Comandos operacionais que falharam',
    query: `fields @timestamp, commandType, commandId, error.message, tenantId
| filter status = "ERROR" or @message like /command.*failed/i
| sort @timestamp desc
| limit 50`,
    logGroupNames: ['/aws/lambda/operational-dashboard-commands']
  },
  {
    name: 'Command Execution Time',
    description: 'Tempo de execução dos comandos operacionais',
    query: `fields @timestamp, commandType, @duration
| filter @message like /command.*completed/i
| stats avg(@duration) as avgDuration, max(@duration) as maxDuration, count() as executions by commandType
| sort avgDuration desc`,
    logGroupNames: ['/aws/lambda/operational-dashboard-commands']
  },
  {
    name: 'Commands by Tenant',
    description: 'Comandos operacionais executados por tenant',
    query: `fields @timestamp, tenantId, commandType, status
| filter tenantId != "" and tenantId != "global"
| stats count() as commandCount by tenantId, commandType
| sort commandCount desc
| limit 30`,
    logGroupNames: ['/aws/lambda/operational-dashboard-commands']
  },
  {
    name: 'Command Success Rate',
    description: 'Taxa de sucesso dos comandos operacionais',
    query: `fields @timestamp, commandType, status
| stats count() as total, 
        sum(case status = "SUCCESS" then 1 else 0 end) as successful,
        sum(case status = "ERROR" then 1 else 0 end) as failed
        by commandType
| fields commandType, total, successful, failed, (successful / total * 100) as successRate
| sort successRate asc`,
    logGroupNames: ['/aws/lambda/operational-dashboard-commands']
  }
];

/**
 * Queries para Agregação de Métricas
 */
export const metricsAggregationQueries: InsightsQuery[] = [
  {
    name: 'Daily Metrics Aggregation Status',
    description: 'Status da agregação diária de métricas',
    query: `fields @timestamp, @message
| filter @message like /Aggregating metrics/ or @message like /Aggregation complete/
| sort @timestamp desc
| limit 20`,
    logGroupNames: ['/aws/lambda/operational-dashboard-aggregate-metrics']
  },
  {
    name: 'Metrics Aggregation Errors',
    description: 'Erros na agregação de métricas',
    query: `fields @timestamp, @message, error.message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 50`,
    logGroupNames: ['/aws/lambda/operational-dashboard-aggregate-metrics']
  },
  {
    name: 'Aggregation Performance',
    description: 'Performance da agregação de métricas',
    query: `fields @timestamp, @duration
| stats avg(@duration) as avgDuration, max(@duration) as maxDuration, count() as executions
| fields avgDuration, maxDuration, executions`,
    logGroupNames: ['/aws/lambda/operational-dashboard-aggregate-metrics']
  }
];

/**
 * Queries para Cache
 */
export const cacheQueries: InsightsQuery[] = [
  {
    name: 'Cache Hit Rate',
    description: 'Taxa de acerto do cache',
    query: `fields @timestamp
| filter @message like /cache/i
| stats sum(case @message like /cache hit/i then 1 else 0 end) as hits,
        sum(case @message like /cache miss/i then 1 else 0 end) as misses
| fields hits, misses, (hits / (hits + misses) * 100) as hitRate`,
    logGroupNames: [
      '/aws/lambda/operational-dashboard-tenant-api',
      '/aws/lambda/operational-dashboard-internal-api'
    ]
  },
  {
    name: 'Cache Performance by Key',
    description: 'Performance do cache por chave',
    query: `fields @timestamp, cacheKey
| filter @message like /cache/i
| stats sum(case @message like /cache hit/i then 1 else 0 end) as hits,
        sum(case @message like /cache miss/i then 1 else 0 end) as misses
        by cacheKey
| fields cacheKey, hits, misses, (hits / (hits + misses) * 100) as hitRate
| sort hitRate asc`,
    logGroupNames: [
      '/aws/lambda/operational-dashboard-tenant-api',
      '/aws/lambda/operational-dashboard-internal-api'
    ]
  }
];

/**
 * Queries para Segurança e Auditoria
 */
export const securityQueries: InsightsQuery[] = [
  {
    name: 'Authorization Failures',
    description: 'Falhas de autorização',
    query: `fields @timestamp, userId, tenantId, path, @message
| filter statusCode = 403 or @message like /Forbidden/ or @message like /Unauthorized/
| stats count() as failures by userId, path
| sort failures desc
| limit 50`,
    logGroupNames: [
      '/aws/lambda/operational-dashboard-tenant-api',
      '/aws/lambda/operational-dashboard-internal-api'
    ]
  },
  {
    name: 'Tenant Isolation Violations',
    description: 'Tentativas de acesso a dados de outros tenants',
    query: `fields @timestamp, userId, tenantId, requestedTenantId, @message
| filter @message like /tenant.*mismatch/i or @message like /access denied/i
| sort @timestamp desc
| limit 50`,
    logGroupNames: [
      '/aws/lambda/operational-dashboard-tenant-api'
    ]
  },
  {
    name: 'Suspicious Activity',
    description: 'Atividade suspeita (múltiplas falhas de autorização)',
    query: `fields @timestamp, userId, sourceIp
| filter statusCode = 403 or @message like /Forbidden/
| stats count() as failures by userId, sourceIp
| filter failures > 10
| sort failures desc`,
    logGroupNames: [
      '/aws/lambda/operational-dashboard-tenant-api',
      '/aws/lambda/operational-dashboard-internal-api'
    ]
  }
];

/**
 * Queries Gerais
 */
export const generalQueries: InsightsQuery[] = [
  {
    name: 'Error Summary',
    description: 'Resumo de erros em todos os componentes',
    query: `fields @timestamp, @message, error.message, error.name
| filter @message like /ERROR/
| stats count() as errorCount by error.name, error.message
| sort errorCount desc
| limit 20`,
    logGroupNames: [
      '/aws/lambda/operational-dashboard-tenant-api',
      '/aws/lambda/operational-dashboard-internal-api',
      '/aws/lambda/operational-dashboard-commands'
    ]
  },
  {
    name: 'Request Volume by Hour',
    description: 'Volume de requisições por hora',
    query: `fields @timestamp
| stats count() as requests by bin(1h)
| sort @timestamp desc`,
    logGroupNames: [
      '/aws/lambda/operational-dashboard-tenant-api',
      '/aws/lambda/operational-dashboard-internal-api'
    ]
  },
  {
    name: 'Cold Starts',
    description: 'Cold starts das funções Lambda',
    query: `fields @timestamp, @duration, @initDuration
| filter @type = "REPORT"
| filter @initDuration > 0
| stats count() as coldStarts, avg(@initDuration) as avgInitDuration, max(@initDuration) as maxInitDuration
| fields coldStarts, avgInitDuration, maxInitDuration`,
    logGroupNames: [
      '/aws/lambda/operational-dashboard-tenant-api',
      '/aws/lambda/operational-dashboard-internal-api',
      '/aws/lambda/operational-dashboard-commands'
    ]
  }
];

/**
 * Todas as queries organizadas por categoria
 */
export const allQueries = {
  tenantAPI: tenantAPIQueries,
  internalAPI: internalAPIQueries,
  operationalCommands: operationalCommandQueries,
  metricsAggregation: metricsAggregationQueries,
  cache: cacheQueries,
  security: securityQueries,
  general: generalQueries
};

/**
 * Obter todas as queries em uma lista plana
 */
export function getAllQueries(): InsightsQuery[] {
  return [
    ...tenantAPIQueries,
    ...internalAPIQueries,
    ...operationalCommandQueries,
    ...metricsAggregationQueries,
    ...cacheQueries,
    ...securityQueries,
    ...generalQueries
  ];
}

/**
 * Obter query por nome
 */
export function getQueryByName(name: string): InsightsQuery | undefined {
  return getAllQueries().find(q => q.name === name);
}
