import { ScheduledEvent } from 'aws-lambda';
import { query } from '../shared/database';
import { Logger } from '../shared/logger';

const logger = new Logger('aggregate-daily-metrics');

interface AggregationResult {
  tenant_id: string;
  agent_id: string | null;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  avg_response_time_ms: number;
  total_tokens_used: number;
}

/**
 * Lambda handler para agregar métricas diárias
 * Executado diariamente às 2 AM UTC via EventBridge
 */
export async function handler(event: ScheduledEvent): Promise<void> {
  logger.info('Starting daily metrics aggregation', { event });

  try {
    // Calcular data de ontem
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    logger.info(`Aggregating metrics for date: ${dateStr}`);

    // Agregar métricas por tenant e agente
    await aggregateMetrics(dateStr);

    logger.info('Daily metrics aggregation completed successfully');
  } catch (error) {
    logger.error('Error aggregating daily metrics', error as Error);
    throw error;
  }
}

/**
 * Agrega métricas de uso diário por tenant e agente
 */
async function aggregateMetrics(date: string): Promise<void> {
  const sql = `
    INSERT INTO tenant_usage_daily (
      tenant_id,
      agent_id,
      date,
      total_requests,
      successful_requests,
      failed_requests,
      avg_response_time_ms,
      total_tokens_used
    )
    SELECT 
      ar.tenant_id,
      ar.agent_id,
      DATE($1) as date,
      COUNT(*) as total_requests,
      COUNT(*) FILTER (WHERE ar.status = 'success') as successful_requests,
      COUNT(*) FILTER (WHERE ar.status = 'error') as failed_requests,
      COALESCE(AVG(ar.response_time_ms)::INTEGER, 0) as avg_response_time_ms,
      COALESCE(SUM(ar.tokens_used), 0) as total_tokens_used
    FROM agent_requests ar
    WHERE DATE(ar.created_at) = DATE($1)
    GROUP BY ar.tenant_id, ar.agent_id
    ON CONFLICT (tenant_id, agent_id, date) 
    DO UPDATE SET
      total_requests = EXCLUDED.total_requests,
      successful_requests = EXCLUDED.successful_requests,
      failed_requests = EXCLUDED.failed_requests,
      avg_response_time_ms = EXCLUDED.avg_response_time_ms,
      total_tokens_used = EXCLUDED.total_tokens_used,
      updated_at = NOW()
  `;

  const result = await query(sql, [date]);

  logger.info('Aggregation result', {
    rowCount: result.rowCount,
    date,
  });

  // Também atualizar contadores na tabela tenant_agents
  await updateTenantAgentsCounters(date);
}

/**
 * Atualiza contadores de uso na tabela tenant_agents
 */
async function updateTenantAgentsCounters(date: string): Promise<void> {
  const sql = `
    UPDATE tenant_agents ta
    SET 
      total_requests = ta.total_requests + COALESCE(tud.total_requests, 0),
      total_errors = ta.total_errors + COALESCE(tud.failed_requests, 0),
      last_used_at = CASE 
        WHEN COALESCE(tud.total_requests, 0) > 0 THEN NOW()
        ELSE ta.last_used_at
      END,
      updated_at = NOW()
    FROM tenant_usage_daily tud
    WHERE ta.tenant_id = tud.tenant_id
      AND ta.agent_id = tud.agent_id
      AND tud.date = DATE(:date)
  `;

  const command = new ExecuteStatementCommand({
    resourceArn: AURORA_CLUSTER_ARN,
    secretArn: AURORA_SECRET_ARN,
    database: DATABASE_NAME,
    sql,
    parameters: [
      {
        name: 'date',
        value: { stringValue: date },
      },
    ],
  });

  const result = await rdsClient.send(command);

  console.log('Updated tenant_agents counters:', {
    numberOfRecordsUpdated: result.numberOfRecordsUpdated,
  });
}
