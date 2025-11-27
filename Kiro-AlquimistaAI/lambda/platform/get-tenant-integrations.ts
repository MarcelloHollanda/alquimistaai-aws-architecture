import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { RDSDataClient, ExecuteStatementCommand } from '@aws-sdk/client-rds-data';
import { extractAuthContext, requireTenantAccess } from '../shared/authorization-middleware';

const rdsClient = new RDSDataClient({ region: process.env.AWS_REGION || 'us-east-1' });

const AURORA_SECRET_ARN = process.env.AURORA_SECRET_ARN!;
const AURORA_CLUSTER_ARN = process.env.AURORA_CLUSTER_ARN!;
const DATABASE_NAME = 'alquimista_platform';

interface IntegrationInfo {
  id: string;
  type: string;
  name: string;
  status: string;
  last_sync_at: string | null;
  last_error: string | null;
}

/**
 * GET /tenant/integrations
 * Retorna integrações configuradas pelo tenant
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('GET /tenant/integrations', { path: event.path });

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

    const integrations = await getTenantIntegrations(tenantId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=300',
      },
      body: JSON.stringify({ integrations }),
    };
  } catch (error: any) {
    console.error('Error in GET /tenant/integrations:', error);

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

async function getTenantIntegrations(tenantId: string): Promise<IntegrationInfo[]> {
  const sql = `
    SELECT 
      id,
      integration_type,
      integration_name,
      status,
      last_sync_at,
      last_error
    FROM tenant_integrations
    WHERE tenant_id = :tenant_id
    ORDER BY created_at DESC
  `;

  const result = await rdsClient.send(
    new ExecuteStatementCommand({
      resourceArn: AURORA_CLUSTER_ARN,
      secretArn: AURORA_SECRET_ARN,
      database: DATABASE_NAME,
      sql,
      parameters: [
        {
          name: 'tenant_id',
          value: { stringValue: tenantId },
        },
      ],
    })
  );

  if (!result.records) {
    return [];
  }

  return result.records.map((record) => ({
    id: record[0]?.stringValue || '',
    type: record[1]?.stringValue || '',
    name: record[2]?.stringValue || '',
    status: record[3]?.stringValue || '',
    last_sync_at: record[4]?.stringValue || null,
    last_error: record[5]?.stringValue || null,
  }));
}
