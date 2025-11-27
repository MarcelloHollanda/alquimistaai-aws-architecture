import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { RDSDataClient, ExecuteStatementCommand } from '@aws-sdk/client-rds-data';
import { extractAuthContext, requireTenantAccess } from '../shared/authorization-middleware';

const rdsClient = new RDSDataClient({ region: process.env.AWS_REGION || 'us-east-1' });

const AURORA_SECRET_ARN = process.env.AURORA_SECRET_ARN!;
const AURORA_CLUSTER_ARN = process.env.AURORA_CLUSTER_ARN!;
const DATABASE_NAME = 'alquimista_platform';

interface Incident {
  id: string;
  severity: string;
  title: string;
  description: string;
  created_at: string;
  resolved_at: string | null;
}

/**
 * GET /tenant/incidents
 * Retorna incidentes que afetaram o tenant
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('GET /tenant/incidents', { path: event.path });

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

    const limit = parseInt(event.queryStringParameters?.limit || '20');
    const offset = parseInt(event.queryStringParameters?.offset || '0');

    const result = await getTenantIncidents(tenantId, limit, offset);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=60',
      },
      body: JSON.stringify(result),
    };
  } catch (error: any) {
    console.error('Error in GET /tenant/incidents:', error);

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

async function getTenantIncidents(
  tenantId: string,
  limit: number,
  offset: number
): Promise<{ incidents: Incident[]; total: number }> {
  // Query: Total de incidentes
  const countSql = `
    SELECT COUNT(*) as total
    FROM operational_events
    WHERE tenant_id = :tenant_id
      AND event_category = 'system'
      AND status IN ('failure', 'pending')
  `;

  const countResult = await rdsClient.send(
    new ExecuteStatementCommand({
      resourceArn: AURORA_CLUSTER_ARN,
      secretArn: AURORA_SECRET_ARN,
      database: DATABASE_NAME,
      sql: countSql,
      parameters: [
        {
          name: 'tenant_id',
          value: { stringValue: tenantId },
        },
      ],
    })
  );

  const total = parseInt(countResult.records?.[0]?.[0]?.longValue?.toString() || '0');

  // Query: Incidentes paginados
  const incidentsSql = `
    SELECT 
      id,
      event_type as severity,
      action as title,
      details->>'description' as description,
      created_at,
      details->>'resolved_at' as resolved_at
    FROM operational_events
    WHERE tenant_id = :tenant_id
      AND event_category = 'system'
      AND status IN ('failure', 'pending')
    ORDER BY created_at DESC
    LIMIT :limit OFFSET :offset
  `;

  const incidentsResult = await rdsClient.send(
    new ExecuteStatementCommand({
      resourceArn: AURORA_CLUSTER_ARN,
      secretArn: AURORA_SECRET_ARN,
      database: DATABASE_NAME,
      sql: incidentsSql,
      parameters: [
        {
          name: 'tenant_id',
          value: { stringValue: tenantId },
        },
        {
          name: 'limit',
          value: { longValue: limit },
        },
        {
          name: 'offset',
          value: { longValue: offset },
        },
      ],
    })
  );

  const incidents = (incidentsResult.records || []).map((record) => ({
    id: record[0]?.stringValue || '',
    severity: record[1]?.stringValue || '',
    title: record[2]?.stringValue || '',
    description: record[3]?.stringValue || '',
    created_at: record[4]?.stringValue || '',
    resolved_at: record[5]?.stringValue || null,
  }));

  return {
    incidents,
    total,
  };
}
