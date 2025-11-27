import { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';
import { extractAuthContext, requireInternal } from '../shared/authorization-middleware';
import { getCacheManager, buildCacheKey, CacheTTL } from '../shared/redis-client';
import { query } from '../shared/database';
import { Logger } from '../shared/logger';

const logger = new Logger('list-tenants');

/**
 * GET /internal/tenants
 * Lista todos os tenants com filtros (apenas usuários internos)
 */
export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> {
  logger.info('GET /internal/tenants', { path: event.rawPath });

  try {
    const context = extractAuthContext(event);
    requireInternal(context);

    const params = event.queryStringParameters || {};
    const status = params.status || 'active';
    const plan = params.plan;
    const segment = params.segment;
    const search = params.search;
    const limit = parseInt(params.limit || '50');
    const offset = parseInt(params.offset || '0');
    const sortBy = params.sort_by || 'name';
    const sortOrder = params.sort_order || 'asc';

    // Inicializar cache
    const cache = await getCacheManager(logger);

    // Criar chave de cache baseada nos parâmetros
    const cacheKey = buildCacheKey('tenants', 'list', {
      status,
      plan,
      segment,
      search,
      limit,
      offset,
      sortBy,
      sortOrder,
    });

    // Tentar obter do cache ou buscar do banco
    const result = await cache.getOrSet(
      cacheKey,
      async () => {
        logger.info('Cache miss - buscando tenants do banco de dados');
        return await listTenants({
          status,
          plan,
          segment,
          search,
          limit,
          offset,
          sortBy,
          sortOrder,
        });
      },
      CacheTTL.TENANTS_LIST
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=300',
        'X-Cache-Status': result === await cache.get(cacheKey) ? 'HIT' : 'MISS',
      },
      body: JSON.stringify(result),
    };
  } catch (error: any) {
    logger.error('Error in GET /internal/tenants', error);

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

async function listTenants(filters: any) {
  const conditions: string[] = [];
  const parameters: any[] = [];
  let paramIndex = 1; // PostgreSQL usa $1, $2, etc.

  // Filtro de status
  if (filters.status !== 'all') {
    conditions.push(`t.status = $${paramIndex}`);
    parameters.push(filters.status);
    paramIndex++;
  }

  // Filtro de plano
  if (filters.plan) {
    conditions.push(`t.plan = $${paramIndex}`);
    parameters.push(filters.plan);
    paramIndex++;
  }

  // Filtro de segmento
  if (filters.segment) {
    conditions.push(`t.segment = $${paramIndex}`);
    parameters.push(filters.segment);
    paramIndex++;
  }

  // Busca por nome ou CNPJ
  if (filters.search) {
    conditions.push(`(t.name ILIKE $${paramIndex} OR t.cnpj ILIKE $${paramIndex})`);
    parameters.push(`%${filters.search}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Query de contagem
  const countSql = `
    SELECT COUNT(*) as total
    FROM tenants t
    ${whereClause}
  `;

  const countResult = await query(countSql, parameters);
  const total = parseInt(countResult.rows[0]?.total || '0');

  // Query principal com métricas
  const validSortColumns = ['name', 'created_at', 'mrr_estimate'];
  const sortColumn = validSortColumns.includes(filters.sortBy) ? filters.sortBy : 'name';
  const sortDirection = filters.sortOrder === 'desc' ? 'DESC' : 'ASC';

  const sql = `
    SELECT 
      t.id,
      t.name,
      t.cnpj,
      t.segment,
      t.plan,
      t.status,
      t.mrr_estimate,
      t.created_at,
      (SELECT COUNT(*) FROM tenant_agents WHERE tenant_id = t.id AND status = 'active') as active_agents,
      (SELECT COUNT(*) FROM tenant_users WHERE tenant_id = t.id AND status = 'active') as active_users,
      (SELECT COALESCE(SUM(total_requests), 0) 
       FROM tenant_usage_daily 
       WHERE tenant_id = t.id 
         AND date >= CURRENT_DATE - INTERVAL '30 days') as requests_last_30_days
    FROM tenants t
    ${whereClause}
    ORDER BY t.${sortColumn} ${sortDirection}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  const queryParams = [...parameters, filters.limit, filters.offset];
  const result = await query(sql, queryParams);

  const tenants = result.rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    cnpj: row.cnpj,
    segment: row.segment,
    plan: row.plan,
    status: row.status,
    mrr_estimate: parseFloat(row.mrr_estimate || '0'),
    created_at: row.created_at,
    active_agents: parseInt(row.active_agents || '0'),
    active_users: parseInt(row.active_users || '0'),
    requests_last_30_days: parseInt(row.requests_last_30_days || '0'),
  }));

  return {
    tenants,
    total,
    limit: filters.limit,
    offset: filters.offset,
  };
}
