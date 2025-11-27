import { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';
import { RDSDataClient, ExecuteStatementCommand, Field } from '@aws-sdk/client-rds-data';
import { extractAuthContext, requireInternal } from '../shared/authorization-middleware';

const rdsClient = new RDSDataClient({ region: process.env.AWS_REGION || 'us-east-1' });

const AURORA_SECRET_ARN = process.env.AURORA_SECRET_ARN!;
const AURORA_CLUSTER_ARN = process.env.AURORA_CLUSTER_ARN!;
const DATABASE_NAME = 'alquimista_platform';

/**
 * GET /internal/tenants/{id}/agents
 * Retorna agentes do tenant com configurações (apenas usuários internos)
 */
export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> {
  console.log('GET /internal/tenants/{id}/agents', { path: event.path });

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

    const agents = await getTenantAgents(tenantId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=300',
      },
      body: JSON.stringify({ agents }),
    };
  } catch (error: any) {
    console.error('Error in GET /internal/tenants/{id}/agents:', error);

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

async function getTenantAgents(tenantId: string) {
  const sql = `
    SELECT 
      a.id,
      a.name,
      ta.status,
      ta.config,
      ta.activated_at,
      ta.deactivated_at,
      ta.total_requests,
      ta.total_errors,
      ta.last_used_at,
      COALESCE(
        (SELECT AVG(avg_response_time_ms)::INTEGER 
         FROM tenant_usage_daily 
         WHERE tenant_id = ta.tenant_id 
           AND agent_id = ta.agent_id 
           AND date >= CURRENT_DATE - 30), 
        0
      ) as avg_response_time_ms
    FROM tenant_agents ta
    INNER JOIN agents a ON ta.agent_id = a.id
    WHERE ta.tenant_id = :tenant_id
    ORDER BY ta.activated_at DESC
  `;

  const result = await rdsClient.send(
    new ExecuteStatementCommand({
      resourceArn: AURORA_CLUSTER_ARN,
      secretArn: AURORA_SECRET_ARN,
      database: DATABASE_NAME,
      sql,
      parameters: [{ name: 'tenant_id', value: { stringValue: tenantId } }],
    })
  );

  return (result.records || []).map((record: Field[]) => {
    const totalRequests = parseInt(record[6]?.longValue?.toString() || '0');
    const totalErrors = parseInt(record[7]?.longValue?.toString() || '0');
    const successRate = totalRequests > 0 ? ((totalRequests - totalErrors) / totalRequests) * 100 : 0;

    return {
      id: record[0]?.stringValue || '',
      name: record[1]?.stringValue || '',
      status: record[2]?.stringValue || '',
      config: record[3]?.stringValue ? JSON.parse(record[3].stringValue) : {},
      activated_at: record[4]?.stringValue || '',
      deactivated_at: record[5]?.stringValue || null,
      usage_stats: {
        total_requests: totalRequests,
        success_rate: Math.round(successRate * 100) / 100,
        avg_response_time_ms: parseInt(record[9]?.longValue?.toString() || '0'),
        last_request_at: record[8]?.stringValue || null,
      },
    };
  });
}
