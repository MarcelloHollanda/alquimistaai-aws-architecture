import { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';
import { RDSDataClient, ExecuteStatementCommand, Field } from '@aws-sdk/client-rds-data';
import { extractAuthContext, requireInternal } from '../shared/authorization-middleware';

const rdsClient = new RDSDataClient({ region: process.env.AWS_REGION || 'us-east-1' });

const AURORA_SECRET_ARN = process.env.AURORA_SECRET_ARN!;
const AURORA_CLUSTER_ARN = process.env.AURORA_CLUSTER_ARN!;
const DATABASE_NAME = 'alquimista_platform';

/**
 * GET /internal/tenants/{id}
 * Retorna detalhes completos de um tenant (apenas usuários internos)
 */
export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> {
  console.log('GET /internal/tenants/{id}', { path: event.path });

  try {
    const context = extractAuthContext(event);
    requireInternal(context);

    const tenantId = event.pathParameters?.id;

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

    const tenantDetail = await getTenantDetail(tenantId);

    if (!tenantDetail) {
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
        'Cache-Control': 'private, max-age=300',
      },
      body: JSON.stringify(tenantDetail),
    };
  } catch (error: any) {
    console.error('Error in GET /internal/tenants/{id}:', error);

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

async function getTenantDetail(tenantId: string) {
  // Query: Dados do tenant
  const tenantSql = `
    SELECT 
      id, name, cnpj, segment, plan, status, mrr_estimate, created_at, updated_at
    FROM tenants
    WHERE id = :tenant_id
  `;

  const tenantResult = await rdsClient.send(
    new ExecuteStatementCommand({
      resourceArn: AURORA_CLUSTER_ARN,
      secretArn: AURORA_SECRET_ARN,
      database: DATABASE_NAME,
      sql: tenantSql,
      parameters: [{ name: 'tenant_id', value: { stringValue: tenantId } }],
    })
  );

  if (!tenantResult.records || tenantResult.records.length === 0) {
    return null;
  }

  const tenantRecord = tenantResult.records[0];

  // Query: Usuários
  const usersSql = `
    SELECT id, email, full_name, role, last_login_at
    FROM tenant_users
    WHERE tenant_id = :tenant_id
    ORDER BY created_at DESC
  `;

  const usersResult = await rdsClient.send(
    new ExecuteStatementCommand({
      resourceArn: AURORA_CLUSTER_ARN,
      secretArn: AURORA_SECRET_ARN,
      database: DATABASE_NAME,
      sql: usersSql,
      parameters: [{ name: 'tenant_id', value: { stringValue: tenantId } }],
    })
  );

  const users = (usersResult.records || []).map((r: Field[]) => ({
    id: r[0]?.stringValue || '',
    email: r[1]?.stringValue || '',
    full_name: r[2]?.stringValue || '',
    role: r[3]?.stringValue || '',
    last_login_at: r[4]?.stringValue || null,
  }));

  // Query: Agentes
  const agentsSql = `
    SELECT 
      a.id, a.name, ta.status, ta.activated_at,
      COALESCE(SUM(tud.total_requests), 0) as total_requests,
      COALESCE(SUM(tud.successful_requests), 0) as successful_requests
    FROM tenant_agents ta
    INNER JOIN agents a ON ta.agent_id = a.id
    LEFT JOIN tenant_usage_daily tud ON ta.tenant_id = tud.tenant_id 
      AND ta.agent_id = tud.agent_id
      AND tud.date >= CURRENT_DATE - INTERVAL '30 days'
    WHERE ta.tenant_id = :tenant_id
    GROUP BY a.id, a.name, ta.status, ta.activated_at
    ORDER BY ta.activated_at DESC
  `;

  const agentsResult = await rdsClient.send(
    new ExecuteStatementCommand({
      resourceArn: AURORA_CLUSTER_ARN,
      secretArn: AURORA_SECRET_ARN,
      database: DATABASE_NAME,
      sql: agentsSql,
      parameters: [{ name: 'tenant_id', value: { stringValue: tenantId } }],
    })
  );

  const agents = (agentsResult.records || []).map((r: Field[]) => {
    const totalReq = parseInt(r[4]?.longValue?.toString() || '0');
    const successReq = parseInt(r[5]?.longValue?.toString() || '0');
    return {
      id: r[0]?.stringValue || '',
      name: r[1]?.stringValue || '',
      status: r[2]?.stringValue || '',
      activated_at: r[3]?.stringValue || '',
      usage_last_30_days: {
        total_requests: totalReq,
        success_rate: totalReq > 0 ? Math.round((successReq / totalReq) * 10000) / 100 : 0,
      },
    };
  });

  // Query: Integrações
  const integrationsSql = `
    SELECT id, integration_type, integration_name, status, last_sync_at
    FROM tenant_integrations
    WHERE tenant_id = :tenant_id
    ORDER BY created_at DESC
  `;

  const integrationsResult = await rdsClient.send(
    new ExecuteStatementCommand({
      resourceArn: AURORA_CLUSTER_ARN,
      secretArn: AURORA_SECRET_ARN,
      database: DATABASE_NAME,
      sql: integrationsSql,
      parameters: [{ name: 'tenant_id', value: { stringValue: tenantId } }],
    })
  );

  const integrations = (integrationsResult.records || []).map((r: Field[]) => ({
    id: r[0]?.stringValue || '',
    type: r[1]?.stringValue || '',
    name: r[2]?.stringValue || '',
    status: r[3]?.stringValue || '',
    last_sync_at: r[4]?.stringValue || null,
  }));

  // Query: Resumo de uso
  const usageSql = `
    SELECT 
      COALESCE(SUM(CASE WHEN date >= CURRENT_DATE - 7 THEN total_requests ELSE 0 END), 0) as req_7d,
      COALESCE(SUM(CASE WHEN date >= CURRENT_DATE - 30 THEN total_requests ELSE 0 END), 0) as req_30d,
      COALESCE(SUM(CASE WHEN date >= CURRENT_DATE - 30 THEN successful_requests ELSE 0 END), 0) as success_30d
    FROM tenant_usage_daily
    WHERE tenant_id = :tenant_id
  `;

  const usageResult = await rdsClient.send(
    new ExecuteStatementCommand({
      resourceArn: AURORA_CLUSTER_ARN,
      secretArn: AURORA_SECRET_ARN,
      database: DATABASE_NAME,
      sql: usageSql,
      parameters: [{ name: 'tenant_id', value: { stringValue: tenantId } }],
    })
  );

  const usageRecord = usageResult.records?.[0] || [];
  const req30d = parseInt(usageRecord[1]?.longValue?.toString() || '0');
  const success30d = parseInt(usageRecord[2]?.longValue?.toString() || '0');

  // Query: Incidentes recentes
  const incidentsSql = `
    SELECT id, event_type, action, created_at
    FROM operational_events
    WHERE tenant_id = :tenant_id
      AND event_category = 'system'
      AND status = 'failure'
    ORDER BY created_at DESC
    LIMIT 5
  `;

  const incidentsResult = await rdsClient.send(
    new ExecuteStatementCommand({
      resourceArn: AURORA_CLUSTER_ARN,
      secretArn: AURORA_SECRET_ARN,
      database: DATABASE_NAME,
      sql: incidentsSql,
      parameters: [{ name: 'tenant_id', value: { stringValue: tenantId } }],
    })
  );

  const recentIncidents = (incidentsResult.records || []).map((r: Field[]) => ({
    id: r[0]?.stringValue || '',
    severity: r[1]?.stringValue || '',
    title: r[2]?.stringValue || '',
    created_at: r[3]?.stringValue || '',
  }));

  return {
    tenant: {
      id: tenantRecord[0]?.stringValue || '',
      name: tenantRecord[1]?.stringValue || '',
      cnpj: tenantRecord[2]?.stringValue || '',
      segment: tenantRecord[3]?.stringValue || '',
      plan: tenantRecord[4]?.stringValue || '',
      status: tenantRecord[5]?.stringValue || '',
      mrr_estimate: parseFloat(tenantRecord[6]?.stringValue || '0'),
      created_at: tenantRecord[7]?.stringValue || '',
      updated_at: tenantRecord[8]?.stringValue || '',
    },
    users,
    agents,
    integrations,
    usage_summary: {
      requests_last_7_days: parseInt(usageRecord[0]?.longValue?.toString() || '0'),
      requests_last_30_days: req30d,
      success_rate_last_30_days: req30d > 0 ? Math.round((success30d / req30d) * 10000) / 100 : 0,
    },
    recent_incidents: recentIncidents,
  };
}
