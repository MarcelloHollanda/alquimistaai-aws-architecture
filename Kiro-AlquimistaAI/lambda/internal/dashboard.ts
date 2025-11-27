/**
 * Internal Dashboard Handler
 * Provides unified dashboard for AlquimistaAI internal operations
 */

import { APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda';
import { query } from '../shared/database';
import { logger } from '../shared/logger';
import { withSimpleErrorHandling } from '../shared/error-handler';

const INTERNAL_ACCOUNT_ID = 'alquimista-internal-001';

interface SubnucleoMetrics {
  name: string;
  agents: AgentStatus[];
  metrics: DailyMetric[];
  summary: MetricSummary;
}

interface AgentStatus {
  agent_id: string;
  agent_name: string;
  is_active: boolean;
  execution_count: number;
  success_rate: number;
  last_execution: string | null;
}

interface DailyMetric {
  metric_name: string;
  metric_value: number;
  metric_unit: string;
  target_value: number;
  achievement_rate: number;
}

interface MetricSummary {
  total_agents: number;
  active_agents: number;
  total_executions: number;
  avg_success_rate: number;
}

/**
 * Check if user has internal access
 */
function isInternalUser(event: APIGatewayProxyEvent): boolean {
  const authHeader = event.headers.Authorization || event.headers.authorization;
  
  if (!authHeader) {
    return false;
  }

  // TODO: Implement proper JWT validation
  // For now, check for internal token
  const token = authHeader.replace('Bearer ', '');
  return token === process.env.INTERNAL_ACCESS_TOKEN;
}

/**
 * Get metrics for a specific subnucleo
 */
async function getSubnucleoMetrics(subnucleo: string): Promise<SubnucleoMetrics> {
  // Get agents for this subnucleo
  const agentsResult = await query(
    `SELECT 
      agent_id,
      agent_name,
      is_active,
      execution_count,
      success_rate,
      last_execution
    FROM internal_agent_usage
    WHERE subnucleo = $1
    ORDER BY agent_name`,
    [subnucleo]
  );

  const agents: AgentStatus[] = agentsResult.rows;

  // Get today's metrics
  const metricsResult = await query(
    `SELECT 
      metric_name,
      metric_value,
      metric_unit,
      target_value,
      CASE 
        WHEN target_value > 0 THEN (metric_value / target_value * 100)
        ELSE 0
      END as achievement_rate
    FROM internal_operations_metrics
    WHERE subnucleo = $1 
    AND metric_date = CURRENT_DATE
    ORDER BY metric_name`,
    [subnucleo]
  );

  const metrics: DailyMetric[] = metricsResult.rows;

  // Calculate summary
  const summary: MetricSummary = {
    total_agents: agents.length,
    active_agents: agents.filter(a => a.is_active).length,
    total_executions: agents.reduce((sum, a) => sum + (a.execution_count || 0), 0),
    avg_success_rate: agents.length > 0
      ? agents.reduce((sum, a) => sum + (a.success_rate || 0), 0) / agents.length
      : 0
  };

  return {
    name: subnucleo,
    agents,
    metrics,
    summary
  };
}

/**
 * Get platform-wide metrics (Fibonacci)
 */
async function getPlatformMetrics() {
  const result = await query(
    `SELECT 
      COUNT(DISTINCT subnucleo) as total_subnucleos,
      COUNT(*) as total_agents,
      SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_agents,
      SUM(execution_count) as total_executions,
      AVG(success_rate) as avg_success_rate
    FROM internal_agent_usage`
  );

  return result.rows[0];
}

/**
 * Main handler
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    logger.info('Internal dashboard request', {
      path: event.path,
      method: event.httpMethod
    });

    // Check authentication
    if (!isInternalUser(event)) {
      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Unauthorized',
          message: 'Internal access only'
        })
      };
    }

    // Get all subnucleos metrics
    const [nigredo, hermes, sophia, atlas, oracle, fibonacci] = await Promise.all([
      getSubnucleoMetrics('nigredo'),
      getSubnucleoMetrics('hermes'),
      getSubnucleoMetrics('sophia'),
      getSubnucleoMetrics('atlas'),
      getSubnucleoMetrics('oracle'),
      getPlatformMetrics()
    ]);

    const dashboard = {
      account_id: INTERNAL_ACCOUNT_ID,
      timestamp: new Date().toISOString(),
      subnucleos: {
        nigredo,
        hermes,
        sophia,
        atlas,
        oracle
      },
      platform: fibonacci
    };

    logger.info('Dashboard generated successfully', {
      total_agents: fibonacci.total_agents,
      active_agents: fibonacci.active_agents
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(dashboard)
    };

  } catch (error) {
    logger.error('Error generating dashboard', error as Error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
