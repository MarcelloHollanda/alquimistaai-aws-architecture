import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { RDSDataClient, ExecuteStatementCommand } from '@aws-sdk/client-rds-data';
import { extractAuthContext, requireTenantAccess } from '../shared/authorization-middleware';

const rdsClient = new RDSDataClient({ region: process.env.AWS_REGION || 'us-east-1' });

const AURORA_SECRET_ARN = process.env.AURORA_SECRET_ARN!;
const AURORA_CLUSTER_ARN = process.env.AURORA_CLUSTER_ARN!;
const DATABASE_NAME = 'alquimista_platform';

interface AgentInfo {
  id: string;
  name: string;
  segment: string;
  status: string;
  activated_at: string;
  usage_last_30_days: {
    total_requests: number;
    success_rate: number;
    avg_response_time_ms: number;
  };
}

/**
 * GET /tenant/agents
 * Retorna agentes contratados pelo tenant
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('GET /tenant/agents', { path: event.path });

  try {
    const context = extractAuthContext(event);

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

    requireTenantAccess(context, tenantId);

    // Filtro de status
    const statusFilter = event.queryStringParameters?.status || 'active';

    const agents = await getTenantAgents(tenantId, statusFilter);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=300',
      },
      body: JSON.stringify({ agents }),
    };
  } catch (error: any) {
    console.error('Error in GET /tenant/agents:', error);

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

async function getTenantAgents(tenantId: string, statusFilter: string): Promise<AgentInfo[]> {
  let statusCondition = '';
  if (statusFilter !== 'all') {
    statusCondition = 'AND ta.status = :status';
  }

  const sql = `
    SELECT 
      a.id,
      a.name,
      a.segment,
      ta.status,
      ta.activated_at,
      COALESCE(SUM(tud.total_requests), 0) as total_requests_30d,
      COALESCE(SUM(tud.successful_requests), 0) as successful_requests_30d,
      COALESCE(AVG(tud.avg_response_time_ms)::INTEGER, 0) as avg_response_time_ms
    FROM tenant_agents ta
    INNER JOIN agents a ON ta.agent_id = a.id
    LEFT JOIN tenant_usage_daily tud ON ta.tenant_id = tud.tenant_id 
      AND ta.agent_id = tud.agent_id
      AND tud.date >= CURRENT_DATE - INTERVAL '30 days'
    WHERE ta.tenant_id = :tenant_id
      ${statusCondition}
    GROUP BY a.id, a.name, a.segment, ta.status, ta.activated_at
    ORDER BY ta.activated_at DESC
  `;

  const parameters: any[] = [
    {
      name: 'tenant_id',
      value: { stringValue: tenantId },
    },
  ];

  if (statusFilter !== 'all') {
    parameters.push({
      name: 'status',
      value: { stringValue: statusFilter },
    });
  }

  const result = await rdsClient.send(
    new ExecuteStatementCommand({
      resourceArn: AURORA_CLUSTER_ARN,
      secretArn: AURORA_SECRET_ARN,
      database: DATABASE_NAME,
      sql,
      parameters,
    })
  );

  if (!result.records) {
    return [];
  }

  return result.records.map((record) => {
    const totalRequests = parseInt(record[5]?.longValue?.toString() || '0');
    const successfulRequests = parseInt(record[6]?.longValue?.toString() || '0');
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;

    return {
      id: record[0]?.stringValue || '',
      name: record[1]?.stringValue || '',
      segment: record[2]?.stringValue || '',
      status: record[3]?.stringValue || '',
      activated_at: record[4]?.stringValue || '',
      usage_last_30_days: {
        total_requests: totalRequests,
        success_rate: Math.round(successRate * 100) / 100,
        avg_response_time_ms: parseInt(record[7]?.longValue?.toString() || '0'),
      },
    };
  });
}
