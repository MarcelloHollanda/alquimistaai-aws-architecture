import { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';
import { RDSDataClient, ExecuteStatementCommand, Field } from '@aws-sdk/client-rds-data';
import { extractAuthContext, requireInternal } from '../shared/authorization-middleware';
import { getCacheManager, buildCacheKey, CacheTTL } from '../shared/redis-client';
import { Logger } from '../shared/logger';

const rdsClient = new RDSDataClient({ region: process.env.AWS_REGION || 'us-east-1' });
const logger = new Logger('get-billing-overview');

const AURORA_SECRET_ARN = process.env.AURORA_SECRET_ARN!;
const AURORA_CLUSTER_ARN = process.env.AURORA_CLUSTER_ARN!;
const DATABASE_NAME = 'alquimista_platform';

/**
 * GET /internal/billing/overview
 * Retorna visão financeira global (apenas INTERNAL_ADMIN)
 */
export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> {
  logger.info('GET /internal/billing/overview', { path: event.rawPath });

  try {
    const context = extractAuthContext(event);
    requireInternal(context);

    // Validar que é INTERNAL_ADMIN
    if (!context.groups.includes('INTERNAL_ADMIN')) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Forbidden',
          message: 'Only INTERNAL_ADMIN can access billing overview',
        }),
      };
    }

    const period = event.queryStringParameters?.period || '30d';
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;

    // Inicializar cache
    const cache = await getCacheManager(logger);

    // Criar chave de cache baseada no período
    const cacheKey = buildCacheKey('billing', 'overview', { period });

    // Tentar obter do cache ou buscar do banco
    const overview = await cache.getOrSet(
      cacheKey,
      async () => {
        logger.info('Cache miss - buscando billing overview do banco de dados', { period });
        return await getBillingOverview(days, period);
      },
      CacheTTL.BILLING_OVERVIEW
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=900', // 15 min
        'X-Cache-Status': overview === await cache.get(cacheKey) ? 'HIT' : 'MISS',
      },
      body: JSON.stringify(overview),
    };
  } catch (error: any) {
    logger.error('Error in GET /internal/billing/overview', error);

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

async function getBillingOverview(days: number, period: string) {
  // Query: Resumo financeiro
  const financialSummarySql = `
    SELECT 
      COALESCE(SUM(mrr_estimate), 0) as total_mrr,
      COALESCE(AVG(mrr_estimate), 0) as avg_mrr_per_tenant,
      COUNT(*) as total_active_tenants
    FROM tenants
    WHERE status = 'active'
  `;

  const financialResult = await rdsClient.send(
    new ExecuteStatementCommand({
      resourceArn: AURORA_CLUSTER_ARN,
      secretArn: AURORA_SECRET_ARN,
      database: DATABASE_NAME,
      sql: financialSummarySql,
    })
  );

  const finRecord = financialResult.records?.[0] || [];
  const totalMrr = parseFloat(finRecord[0]?.stringValue || '0');
  const totalArr = totalMrr * 12;

  // Query: Novos e churned no período
  const churnSql = `
    SELECT 
      COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE - ${days} THEN mrr_estimate ELSE 0 END), 0) as new_mrr,
      COALESCE(SUM(CASE WHEN status = 'inactive' AND updated_at >= CURRENT_DATE - ${days} THEN mrr_estimate ELSE 0 END), 0) as churned_mrr
    FROM tenants
  `;

  const churnResult = await rdsClient.send(
    new ExecuteStatementCommand({
      resourceArn: AURORA_CLUSTER_ARN,
      secretArn: AURORA_SECRET_ARN,
      database: DATABASE_NAME,
      sql: churnSql,
    })
  );

  const churnRecord = churnResult.records?.[0] || [];

  // Query: Por plano
  const byPlanSql = `
    SELECT 
      plan,
      COUNT(*) as tenant_count,
      COALESCE(SUM(mrr_estimate), 0) as total_mrr
    FROM tenants
    WHERE status = 'active'
    GROUP BY plan
    ORDER BY total_mrr DESC
  `;

  const byPlanResult = await rdsClient.send(
    new ExecuteStatementCommand({
      resourceArn: AURORA_CLUSTER_ARN,
      secretArn: AURORA_SECRET_ARN,
      database: DATABASE_NAME,
      sql: byPlanSql,
    })
  );

  const byPlan = (byPlanResult.records || []).map((r: Field[]) => ({
    plan_name: r[0]?.stringValue || '',
    tenant_count: parseInt(r[1]?.longValue?.toString() || '0'),
    total_mrr: parseFloat(r[2]?.stringValue || '0'),
  }));

  // Query: Por segmento
  const bySegmentSql = `
    SELECT 
      segment,
      COUNT(*) as tenant_count,
      COALESCE(SUM(mrr_estimate), 0) as total_mrr
    FROM tenants
    WHERE status = 'active'
    GROUP BY segment
    ORDER BY total_mrr DESC
  `;

  const bySegmentResult = await rdsClient.send(
    new ExecuteStatementCommand({
      resourceArn: AURORA_CLUSTER_ARN,
      secretArn: AURORA_SECRET_ARN,
      database: DATABASE_NAME,
      sql: bySegmentSql,
    })
  );

  const bySegment = (bySegmentResult.records || []).map((r: Field[]) => ({
    segment: r[0]?.stringValue || '',
    tenant_count: parseInt(r[1]?.longValue?.toString() || '0'),
    total_mrr: parseFloat(r[2]?.stringValue || '0'),
  }));

  // Query: Tendência de receita (simulada - em produção viria de tabela de histórico)
  const revenueTrendSql = `
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as new_tenants,
      0 as churned_tenants,
      COALESCE(SUM(mrr_estimate), 0) as mrr
    FROM tenants
    WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `;

  const revenueTrendResult = await rdsClient.send(
    new ExecuteStatementCommand({
      resourceArn: AURORA_CLUSTER_ARN,
      secretArn: AURORA_SECRET_ARN,
      database: DATABASE_NAME,
      sql: revenueTrendSql,
    })
  );

  const revenueTrend = (revenueTrendResult.records || []).map((r: Field[]) => ({
    date: r[0]?.stringValue || '',
    mrr: parseFloat(r[3]?.stringValue || '0'),
    new_tenants: parseInt(r[1]?.longValue?.toString() || '0'),
    churned_tenants: parseInt(r[2]?.longValue?.toString() || '0'),
  }));

  return {
    period,
    financial_summary: {
      total_mrr: Math.round(totalMrr * 100) / 100,
      total_arr: Math.round(totalArr * 100) / 100,
      avg_mrr_per_tenant: Math.round(parseFloat(finRecord[1]?.stringValue || '0') * 100) / 100,
      new_mrr_this_period: Math.round(parseFloat(churnRecord[0]?.stringValue || '0') * 100) / 100,
      churned_mrr_this_period: Math.round(parseFloat(churnRecord[1]?.stringValue || '0') * 100) / 100,
    },
    by_plan: byPlan,
    by_segment: bySegment,
    revenue_trend: revenueTrend,
  };
}
