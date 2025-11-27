import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { RDSDataClient, ExecuteStatementCommand } from '@aws-sdk/client-rds-data';
import { extractAuthContext, requireTenantAccess } from '../shared/authorization-middleware';
import { withBaseHandler } from '../shared/base-handler';
import { checkRateLimit } from '../shared/simple-rate-limiter';
import { validateUuid, sanitizeSqlInput } from '../shared/input-validator';

const rdsClient = new RDSDataClient({ region: process.env.AWS_REGION || 'us-east-1' });

const AURORA_SECRET_ARN = process.env.AURORA_SECRET_ARN!;
const AURORA_CLUSTER_ARN = process.env.AURORA_CLUSTER_ARN!;
const DATABASE_NAME = 'alquimista_platform';

interface TenantInfo {
  id: string;
  name: string;
  cnpj: string;
  segment: string;
  plan: string;
  status: string;
  mrr_estimate: number;
  created_at: string;
  limits: {
    max_agents: number;
    max_users: number;
    max_requests_per_month: number;
  };
  usage: {
    active_agents: number;
    active_users: number;
    requests_this_month: number;
  };
}

/**
 * GET /tenant/me
 * Retorna informações do tenant autenticado
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  return withBaseHandler(event, async (event) => {
    console.log('GET /tenant/me', { path: event.path });

    // Extrair contexto de autenticação
    const context = extractAuthContext(event);

    // Rate limiting por IP
    const sourceIp = event.requestContext?.identity?.sourceIp || 'unknown';
    const ipBlocked = await checkRateLimit(`ip:${sourceIp}`, 100, 60);
    
    if (ipBlocked) {
      return {
        statusCode: 429,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Too many requests from this IP'
        })
      };
    }

    // Usuário interno pode especificar tenant_id via query param
    // Usuário cliente só pode acessar seu próprio tenant
    const tenantId = context.isInternal
      ? event.queryStringParameters?.tenant_id || context.tenantId
      : context.tenantId;

    if (!tenantId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Tenant ID is required',
        }),
      };
    }

    // Validar formato UUID
    validateUuid(tenantId, 'tenant_id');

    // Validar acesso ao tenant
    requireTenantAccess(context, tenantId);

    // Rate limiting por tenant
    const tenantBlocked = await checkRateLimit(`tenant:${tenantId}`, 100, 60);
    
    if (tenantBlocked) {
      return {
        statusCode: 429,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Too many requests for this tenant'
        })
      };
    }

    // Buscar informações do tenant
    const tenantInfo = await getTenantInfo(tenantId);

    if (!tenantInfo) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Not Found',
          message: 'Tenant not found',
        }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=300', // Cache por 5 minutos
      },
      body: JSON.stringify(tenantInfo),
    };
  });
}

/**
 * Busca informações completas do tenant
 */
async function getTenantInfo(tenantId: string): Promise<TenantInfo | null> {
  // Query principal: dados do tenant
  const tenantSql = `
    SELECT 
      id,
      name,
      cnpj,
      segment,
      plan,
      status,
      mrr_estimate,
      created_at
    FROM tenants
    WHERE id = :tenant_id
  `;

  const tenantResult = await rdsClient.send(
    new ExecuteStatementCommand({
      resourceArn: AURORA_CLUSTER_ARN,
      secretArn: AURORA_SECRET_ARN,
      database: DATABASE_NAME,
      sql: tenantSql,
      parameters: [
        {
          name: 'tenant_id',
          value: { stringValue: tenantId },
        },
      ],
    })
  );

  if (!tenantResult.records || tenantResult.records.length === 0) {
    return null;
  }

  const tenant = tenantResult.records[0];

  // Query: contadores de uso
  const usageSql = `
    SELECT 
      (SELECT COUNT(*) FROM tenant_agents WHERE tenant_id = :tenant_id AND status = 'active') as active_agents,
      (SELECT COUNT(*) FROM tenant_users WHERE tenant_id = :tenant_id AND status = 'active') as active_users,
      (SELECT COALESCE(SUM(total_requests), 0) 
       FROM tenant_usage_daily 
       WHERE tenant_id = :tenant_id 
         AND date >= DATE_TRUNC('month', CURRENT_DATE)) as requests_this_month
  `;

  const usageResult = await rdsClient.send(
    new ExecuteStatementCommand({
      resourceArn: AURORA_CLUSTER_ARN,
      secretArn: AURORA_SECRET_ARN,
      database: DATABASE_NAME,
      sql: usageSql,
      parameters: [
        {
          name: 'tenant_id',
          value: { stringValue: tenantId },
        },
      ],
    })
  );

  const usage = usageResult.records?.[0] || [];

  // Definir limites baseados no plano
  const plan = tenant[4]?.stringValue || 'starter';
  const limits = getPlanLimits(plan);

  return {
    id: tenant[0]?.stringValue || '',
    name: tenant[1]?.stringValue || '',
    cnpj: tenant[2]?.stringValue || '',
    segment: tenant[3]?.stringValue || '',
    plan: tenant[4]?.stringValue || '',
    status: tenant[5]?.stringValue || '',
    mrr_estimate: parseFloat(tenant[6]?.stringValue || '0'),
    created_at: tenant[7]?.stringValue || '',
    limits,
    usage: {
      active_agents: parseInt(usage[0]?.longValue?.toString() || '0'),
      active_users: parseInt(usage[1]?.longValue?.toString() || '0'),
      requests_this_month: parseInt(usage[2]?.longValue?.toString() || '0'),
    },
  };
}

/**
 * Retorna limites baseados no plano
 */
function getPlanLimits(plan: string): TenantInfo['limits'] {
  const limits: Record<string, TenantInfo['limits']> = {
    starter: {
      max_agents: 3,
      max_users: 5,
      max_requests_per_month: 10000,
    },
    professional: {
      max_agents: 10,
      max_users: 20,
      max_requests_per_month: 50000,
    },
    enterprise: {
      max_agents: 50,
      max_users: 100,
      max_requests_per_month: 500000,
    },
  };

  return limits[plan] || limits.starter;
}
