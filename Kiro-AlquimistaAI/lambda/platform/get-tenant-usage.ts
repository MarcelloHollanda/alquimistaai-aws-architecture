import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { RDSDataClient, ExecuteStatementCommand } from '@aws-sdk/client-rds-data';
import { extractAuthContext, requireTenantAccess } from '../shared/authorization-middleware';

const rdsClient = new RDSDataClient({ region: process.env.AWS_REGION || 'us-east-1' });

const AURORA_SECRET_ARN = process.env.AURORA_SECRET_ARN!;
const AURORA_CLUSTER_ARN = process.env.AURORA_CLUSTER_ARN!;
const DATABASE_NAME = 'alquimista_platform';

interface UsageData {
  period: string;
  summary: {
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    success_rate: number;
    avg_response_time_ms: number;
  };
  daily_data: Array<{
    date: string;
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    avg_response_time_ms: number;
  }>;
  by_agent: Array<{
    agent_id: string;
    agent_name: string;
    total_requests: number;
    success_rate: number;
  }>;
}

/**
 * GET /tenant/usage
 * Retorna métricas de uso do tenant
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('GET /tenant/usage', { path: event.path });

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

    const period = event.queryStringParameters?.period || '30d';
    const agentId = event.queryStringParameters?.agent_id;

    const usageData = await getTenantUsage(tenantId, period, agentId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=300',
      },
      body: JSON.stringify(usageData),
    };
  } catch (error: any) {
    console.error('Error in GET /tenant/usage:', error);

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

async function getTenantUsage(
  tenantId: string,
  period: string,
  agentId?: string
): Promise<UsageData> {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;

  // Query: Summary
  let summarySql = `
    SELECT 
      COALESCE(SUM(total_requests), 0) as total_requests,
      COALESCE(SUM(successful_requests), 0) as successful_requests,
      COALESCE(SUM(failed_requests), 0) as failed_requests,
      COALESCE(AVG(avg_response_time_ms)::INTEGER, 0) as avg_response_time_ms
    FROM tenant_usage_daily
    WHERE tenant_id = :tenant_id
      AND date >= CURRENT_DATE - INTERVAL '${days} days'
  `;

  const parameters: any[] = [
    {
      name: 'tenant_id',
      value: { stringValue: tenantId },
    },
  ];

  if (agentId) {
    summarySql += ' AND agent_id = :agent_id';
    parameters.push({
      name: 'agent_id',
      value: { stringValue: agentId },
    });
  }

  const summaryResult = await rdsClient.send(
    new ExecuteStatementCommand({
      resourceArn: AURORA_CLUSTER_ARN,
      secretArn: AURORA_SECRET_ARN,
      database: DATABASE_NAME,
      sql: summarySql,
      parameters,
    })
  );

  const summaryRecord = summaryResult.records?.[0] || [];
  const totalRequests = parseInt(summaryRecord[0]?.longValue?.toString() || '0');
  const successfulRequests = parseInt(summaryRecord[1]?.longValue?.toString() || '0');
  const failedRequests = parseInt(summaryRecord[2]?.longValue?.toString() || '0');
  const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;

  // Query: Daily Data
  let dailySql = `
    SELECT 
      date,
      SUM(total_requests) as total_requests,
      SUM(successful_requests) as successful_requests,
      SUM(failed_requests) as failed_requests,
      AVG(avg_response_time_ms)::INTEGER as avg_response_time_ms
    FROM tenant_usage_daily
    WHERE tenant_id = :tenant_id
      AND date >= CURRENT_DATE - INTERVAL '${days} days'
  `;

  if (agentId) {
    dailySql += ' AND agent_id = :agent_id';
  }

  dailySql += ' GROUP BY date ORDER BY date ASC';

  const dailyResult = await rdsClient.send(
    new ExecuteStatementCommand({
      resourceArn: AURORA_CLUSTER_ARN,
      secretArn: AURORA_SECRET_ARN,
      database: DATABASE_NAME,
      sql: dailySql,
      parameters,
    })
  );

  const dailyData = (dailyResult.records || []).map((record) => ({
    date: record[0]?.stringValue || '',
    total_requests: parseInt(record[1]?.longValue?.toString() || '0'),
    successful_requests: parseInt(record[2]?.longValue?.toString() || '0'),
    failed_requests: parseInt(record[3]?.longValue?.toString() || '0'),
    avg_response_time_ms: parseInt(record[4]?.longValue?.toString() || '0'),
  }));

  // Query: By Agent (se não filtrado por agente específico)
  let byAgent: UsageData['by_agent'] = [];

  if (!agentId) {
    const byAgentSql = `
      SELECT 
        a.id,
        a.name,
        SUM(tud.total_requests) as total_requests,
        SUM(tud.successful_requests) as successful_requests
      FROM tenant_usage_daily tud
      INNER JOIN agents a ON tud.agent_id = a.id
      WHERE tud.tenant_id = :tenant_id
        AND tud.date >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY a.id, a.name
      ORDER BY total_requests DESC
    `;

    const byAgentResult = await rdsClient.send(
      new ExecuteStatementCommand({
        resourceArn: AURORA_CLUSTER_ARN,
        secretArn: AURORA_SECRET_ARN,
        database: DATABASE_NAME,
        sql: byAgentSql,
        parameters: [
          {
            name: 'tenant_id',
            value: { stringValue: tenantId },
          },
        ],
      })
    );

    byAgent = (byAgentResult.records || []).map((record) => {
      const agentTotalRequests = parseInt(record[2]?.longValue?.toString() || '0');
      const agentSuccessfulRequests = parseInt(record[3]?.longValue?.toString() || '0');
      const agentSuccessRate =
        agentTotalRequests > 0 ? (agentSuccessfulRequests / agentTotalRequests) * 100 : 0;

      return {
        agent_id: record[0]?.stringValue || '',
        agent_name: record[1]?.stringValue || '',
        total_requests: agentTotalRequests,
        success_rate: Math.round(agentSuccessRate * 100) / 100,
      };
    });
  }

  return {
    period,
    summary: {
      total_requests: totalRequests,
      successful_requests: successfulRequests,
      failed_requests: failedRequests,
      success_rate: Math.round(successRate * 100) / 100,
      avg_response_time_ms: parseInt(summaryRecord[3]?.longValue?.toString() || '0'),
    },
    daily_data: dailyData,
    by_agent: byAgent,
  };
}
