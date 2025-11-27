import { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';
import { RDSDataClient, ExecuteStatementCommand, Field } from '@aws-sdk/client-rds-data';
import { extractAuthContext, requireInternal } from '../shared/authorization-middleware';
import { getCacheManager, buildCacheKey, CacheTTL } from '../shared/redis-client';
import { Logger } from '../shared/logger';

const rdsClient = new RDSDataClient({ region: process.env.AWS_REGION || 'us-east-1' });
const logger = new Logger('get-usage-overview');

const AURORA_SECRET_ARN = process.env.AURORA_SECRET_ARN!;
const AURORA_CLUSTER_ARN = process.env.AURORA_CLUSTER_ARN!;
const DATABASE_NAME = 'alquimista_platform';

/**
 * GET /internal/usage/overview
 * Retorna visão global de uso da plataforma (apenas usuários internos)
 */
export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> {
  logger.info('GET /internal/usage/overview', { path: event.rawPath });

  try {
    const context = extractAuthContext(event);
    requireInternal(context);

    const period = event.queryStringParameters?.period || '30d';
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;

    // Inicializar cache
    const cache = await getCacheManager(logger);

    // Criar chave de cache baseada no período
    const cacheKey = buildCacheKey('usage', 'overview', { period });

    // Tentar obter do cache ou buscar do banco
    const overview = await cache.getOrSet(
      cacheKey,
      async () => {
        logger.info('Cache miss - buscando usage overview do banco de dados', { period });
        return await getUsageOverview(days, period);
      },
      CacheTTL.USAGE_OVERVIEW
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=600', // 10 min
        'X-Cache-Status': overview === await cache.get(cacheKey) ? 'HIT' : 'MISS',
      },
      body: JSON.stringify(overview),
    };
  } catch (error: any) {
    logger.error('Error in GET /internal/usage/overview', error);

    const statusCode = error.message.includes('Forbidden') ? 403 : 500;

    return {
      statusCode,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: statusCode === 403 ? 'Forbidden' : 'Internal Server Error',
        message: error.message,
      }),
    };
  }
}

async function getUsageOverview(days: number, period: string) {
  // Query: Estatísticas globais
  const globalStatsSql = `
    SELECT 
      (SELECT COUNT(*) FROM tenants) as total_tenants,
      (SELECT COUNT(*) FROM tenants WHERE status = 'active') as active_tenants,
      (SELECT COUNT(*) FROM tenant_agents WHERE status = 'active') as total_agents_deployed,
      COALESCE(SUM(total_requests), 0) as total_requests,
      COALESCE(SUM(successful_requests), 0) as successful_requests,
      COALESCE(AVG(avg_response_time_ms)::INTEGER, 0) as avg_response_time_ms
    FROM tenant_usage_daily
    WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
  `;

  const globalStatsResult = await rdsClient.send(
    new ExecuteStatementCommand({
      resourceArn: AURORA_CLUSTER_ARN,
      secretArn: AURORA_SECRET_ARN,
      database: DATABASE_NAME,
      sql: globalStatsSql,
    })
  );

  const statsRecord = globalStatsResult.records?.[0] || [];
  const totalRequests = parseInt(statsRecord[3]?.longValue?.toString() || '0');
  const successfulRequests = parseInt(statsRecord[4]?.longValue?.toString() || '0');
  const globalSuccessRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;

  // Query: Top tenants por uso
  const topTenantsSql = `
    SELECT 
      t.id,
      t.name,
      SUM(tud.total_requests) as total_requests,
      SUM(tud.successful_requests) as successful_requests
    FROM tenant_usage_daily tud
    INNER JOIN tenants t ON tud.tenant_id = t.id
    WHERE tud.date >= CURRENT_DATE - INTERVAL '${days} days'
    GROUP BY t.id, t.name
    ORDER BY total_requests DESC
    LIMIT 10
  `;

  const topTenantsResult = await rdsClient.send(
    new ExecuteStatementCommand({
      resourceArn: AURORA_CLUSTER_ARN,
      secretArn: AURORA_SECRET_ARN,
      database: DATABASE_NAME,
      sql: topTenantsSql,
    })
  );

  const topTenants = (topTenantsResult.records || []).map((r: Field[]) => {
    const tenantTotal = parseInt(r[2]?.longValue?.toString() || '0');
    const tenantSuccess = parseInt(r[3]?.longValue?.toString() || '0');
    return {
      tenant_id: r[0]?.stringValue || '',
      tenant_name: r[1]?.stringValue || '',
      total_requests: tenantTotal,
      success_rate: tenantTotal > 0 ? Math.round((tenantSuccess / tenantTotal) * 10000) / 100 : 0,
    };
  });

  // Query: Top agents por uso
  const topAgentsSql = `
    SELECT 
      a.id,
      a.name,
      SUM(tud.total_requests) as total_requests,
      COUNT(DISTINCT tud.tenant_id) as deployed_count
    FROM tenant_usage_daily tud
    INNER JOIN agents a ON tud.agent_id = a.id
    WHERE tud.date >= CURRENT_DATE - INTERVAL '${days} days'
    GROUP BY a.id, a.name
    ORDER BY total_requests DESC
    LIMIT 10
  `;

  const topAgentsResult = await rdsClient.send(
    new ExecuteStatementCommand({
      resourceArn: AURORA_CLUSTER_ARN,
      secretArn: AURORA_SECRET_ARN,
      database: DATABASE_NAME,
      sql: topAgentsSql,
    })
  );

  const topAgents = (topAgentsResult.records || []).map((r: Field[]) => ({
    agent_id: r[0]?.stringValue || '',
    agent_name: r[1]?.stringValue || '',
    total_requests: parseInt(r[2]?.longValue?.toString() || '0'),
    deployed_count: parseInt(r[3]?.longValue?.toString() || '0'),
  }));

  // Query: Tendências diárias
  const dailyTrendsSql = `
    SELECT 
      date,
      SUM(total_requests) as total_requests,
      SUM(successful_requests) as successful_requests,
      COUNT(DISTINCT tenant_id) as active_tenants
    FROM tenant_usage_daily
    WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
    GROUP BY date
    ORDER BY date ASC
  `;

  const dailyTrendsResult = await rdsClient.send(
    new ExecuteStatementCommand({
      resourceArn: AURORA_CLUSTER_ARN,
      secretArn: AURORA_SECRET_ARN,
      database: DATABASE_NAME,
      sql: dailyTrendsSql,
    })
  );

  const dailyTrends = (dailyTrendsResult.records || []).map((r: Field[]) => {
    const dayTotal = parseInt(r[1]?.longValue?.toString() || '0');
    const daySuccess = parseInt(r[2]?.longValue?.toString() || '0');
    return {
      date: r[0]?.stringValue || '',
      total_requests: dayTotal,
      success_rate: dayTotal > 0 ? Math.round((daySuccess / dayTotal) * 10000) / 100 : 0,
      active_tenants: parseInt(r[3]?.longValue?.toString() || '0'),
    };
  });

  return {
    period,
    global_stats: {
      total_tenants: parseInt(statsRecord[0]?.longValue?.toString() || '0'),
      active_tenants: parseInt(statsRecord[1]?.longValue?.toString() || '0'),
      total_agents_deployed: parseInt(statsRecord[2]?.longValue?.toString() || '0'),
      total_requests: totalRequests,
      global_success_rate: Math.round(globalSuccessRate * 100) / 100,
      avg_response_time_ms: parseInt(statsRecord[5]?.longValue?.toString() || '0'),
    },
    top_tenants_by_usage: topTenants,
    top_agents_by_usage: topAgents,
    daily_trends: dailyTrends,
  };
}
