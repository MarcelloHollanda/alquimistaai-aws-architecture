/**
 * Update Internal Metrics
 * Updates daily metrics for internal operations
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { query } from '../shared/database';
import { logger } from '../shared/logger';
import { withSimpleErrorHandling } from '../shared/error-handler';

interface MetricUpdate {
  subnucleo: string;
  metric_name: string;
  metric_value: number;
  metric_unit?: string;
  metadata?: Record<string, any>;
}

/**
 * Update or insert a metric
 */
async function upsertMetric(update: MetricUpdate): Promise<void> {
  await query(
    `INSERT INTO internal_operations_metrics (
      metric_date,
      subnucleo,
      metric_name,
      metric_value,
      metric_unit,
      metadata
    ) VALUES (
      CURRENT_DATE,
      $1,
      $2,
      $3,
      $4,
      $5
    )
    ON CONFLICT (metric_date, subnucleo, metric_name)
    DO UPDATE SET
      metric_value = EXCLUDED.metric_value,
      metadata = EXCLUDED.metadata,
      created_at = CURRENT_TIMESTAMP`,
    [
      update.subnucleo,
      update.metric_name,
      update.metric_value,
      update.metric_unit || 'count',
      JSON.stringify(update.metadata || {})
    ]
  );
}

/**
 * Update agent execution stats
 */
async function updateAgentStats(
  agentId: string,
  success: boolean
): Promise<void> {
  await query(
    `UPDATE internal_agent_usage
    SET 
      execution_count = execution_count + 1,
      last_execution = CURRENT_TIMESTAMP,
      success_rate = (
        (success_rate * execution_count + $2) / (execution_count + 1)
      ),
      updated_at = CURRENT_TIMESTAMP
    WHERE agent_id = $1`,
    [agentId, success ? 100 : 0]
  );
}

/**
 * Main handler
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    
    logger.info('Updating internal metrics', {
      type: body.type,
      subnucleo: body.subnucleo
    });

    // Handle different update types
    switch (body.type) {
      case 'metric':
        await upsertMetric(body.data as MetricUpdate);
        break;

      case 'agent_execution':
        await updateAgentStats(body.agent_id, body.success);
        break;

      case 'batch':
        // Update multiple metrics at once
        const updates = body.data as MetricUpdate[];
        await Promise.all(updates.map(update => upsertMetric(update)));
        break;

      default:
        throw new Error(`Unknown update type: ${body.type}`);
    }

    logger.info('Metrics updated successfully');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Metrics updated'
      })
    };

  } catch (error) {
    logger.error('Error updating metrics', error as Error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
