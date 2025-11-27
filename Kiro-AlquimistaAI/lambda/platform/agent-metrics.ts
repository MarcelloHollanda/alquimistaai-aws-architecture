import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';

const logger = new Logger({ serviceName: 'alquimista-platform' });
const tracer = new Tracer({ serviceName: 'alquimista-platform' });

/**
 * Agent Metrics Interface
 */
export interface AgentMetrics {
  agentId: string;
  agentName: string;
  agentCategory: string;
  tenantId: string;
  
  // Execution Metrics
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRate: number; // Percentage (0-100)
  
  // Performance Metrics
  avgDuration: number; // Average execution time in milliseconds
  minDuration: number;
  maxDuration: number;
  p50Duration: number; // Median
  p95Duration: number;
  p99Duration: number;
  
  // Cost Metrics
  totalCost: number; // Total cost in USD
  avgCostPerExecution: number;
  
  // Time Period
  periodStart: string; // ISO-8601
  periodEnd: string; // ISO-8601
  
  // Last Execution
  lastExecutionAt?: string; // ISO-8601
  lastExecutionResult?: 'success' | 'failure';
}

/**
 * Calculate percentile from sorted array
 */
function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  
  const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, index)];
}

/**
 * Calculate agent metrics from audit logs
 */
async function calculateAgentMetrics(
  agentId: string,
  tenantId: string,
  startDate?: string,
  endDate?: string
): Promise<AgentMetrics> {
  const { query } = await import('../shared/database');
  
  // Default to last 30 days if not specified
  const periodStart = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const periodEnd = endDate || new Date().toISOString();
  
  // Get agent information
  const agentInfo = await query(
    `SELECT id, name, display_name, category FROM alquimista_platform.agents WHERE id = $1`,
    [agentId]
  );
  
  if (agentInfo.rows.length === 0) {
    throw new Error(`Agent with ID ${agentId} not found`);
  }
  
  const agent = agentInfo.rows[0];
  
  // Get execution logs from audit_logs
  const executionLogs = await query(
    `SELECT 
      result,
      context,
      created_at
    FROM alquimista_platform.audit_logs
    WHERE agent_id = $1
      AND tenant_id = $2
      AND action_type LIKE 'agent.executed%'
      AND created_at >= $3
      AND created_at <= $4
    ORDER BY created_at ASC`,
    [agentId, tenantId, periodStart, periodEnd]
  );
  
  const logs = executionLogs.rows;
  const totalExecutions = logs.length;
  
  if (totalExecutions === 0) {
    // No executions in this period
    return {
      agentId,
      agentName: agent.display_name || agent.name,
      agentCategory: agent.category,
      tenantId,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      successRate: 0,
      avgDuration: 0,
      minDuration: 0,
      maxDuration: 0,
      p50Duration: 0,
      p95Duration: 0,
      p99Duration: 0,
      totalCost: 0,
      avgCostPerExecution: 0,
      periodStart,
      periodEnd
    };
  }
  
  // Calculate execution metrics
  let successfulExecutions = 0;
  let failedExecutions = 0;
  const durations: number[] = [];
  let totalCost = 0;
  let lastExecutionAt: string | undefined;
  let lastExecutionResult: 'success' | 'failure' | undefined;
  
  for (const log of logs) {
    // Count successes and failures
    if (log.result === 'success') {
      successfulExecutions++;
    } else if (log.result === 'failure') {
      failedExecutions++;
    }
    
    // Extract duration from context (if available)
    if (log.context && typeof log.context === 'object') {
      const context = log.context as any;
      if (context.duration && typeof context.duration === 'number') {
        durations.push(context.duration);
      }
      
      // Extract cost from context (if available)
      if (context.cost && typeof context.cost === 'number') {
        totalCost += context.cost;
      }
    }
    
    // Track last execution
    lastExecutionAt = log.created_at;
    lastExecutionResult = log.result === 'success' ? 'success' : 'failure';
  }
  
  // Calculate success rate
  const successRate = totalExecutions > 0 
    ? (successfulExecutions / totalExecutions) * 100 
    : 0;
  
  // Calculate duration metrics
  let avgDuration = 0;
  let minDuration = 0;
  let maxDuration = 0;
  let p50Duration = 0;
  let p95Duration = 0;
  let p99Duration = 0;
  
  if (durations.length > 0) {
    avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    minDuration = Math.min(...durations);
    maxDuration = Math.max(...durations);
    
    // Sort for percentile calculations
    const sortedDurations = [...durations].sort((a, b) => a - b);
    p50Duration = calculatePercentile(sortedDurations, 50);
    p95Duration = calculatePercentile(sortedDurations, 95);
    p99Duration = calculatePercentile(sortedDurations, 99);
  }
  
  // Calculate cost metrics
  const avgCostPerExecution = totalExecutions > 0 ? totalCost / totalExecutions : 0;
  
  return {
    agentId,
    agentName: agent.display_name || agent.name,
    agentCategory: agent.category,
    tenantId,
    totalExecutions,
    successfulExecutions,
    failedExecutions,
    successRate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
    avgDuration: Math.round(avgDuration),
    minDuration,
    maxDuration,
    p50Duration,
    p95Duration,
    p99Duration,
    totalCost: Math.round(totalCost * 100) / 100, // Round to 2 decimal places
    avgCostPerExecution: Math.round(avgCostPerExecution * 10000) / 10000, // Round to 4 decimal places
    periodStart,
    periodEnd,
    lastExecutionAt,
    lastExecutionResult
  };
}

/**
 * Lambda Handler: Get agent metrics
 * 
 * GET /api/agents/{id}/metrics
 * Query params:
 *   - startDate: Start date for metrics (ISO-8601) (optional, default: 30 days ago)
 *   - endDate: End date for metrics (ISO-8601) (optional, default: now)
 * 
 * GET /api/agents/metrics (get metrics for all active agents)
 * Query params:
 *   - startDate: Start date for metrics (ISO-8601) (optional, default: 30 days ago)
 *   - endDate: End date for metrics (ISO-8601) (optional, default: now)
 * 
 * Requirements: 14.6
 */
export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const segment = tracer.getSegment();
  const subsegment = segment?.addNewSubsegment('GetAgentMetrics');

  try {
    logger.info('Getting agent metrics', {
      path: event.rawPath,
      queryParams: event.queryStringParameters,
      requestContext: event.requestContext
    });

    // Extrair tenant_id do token JWT (Cognito)
    // @ts-ignore - authorizer exists in runtime but not in type definition
    const tenantId = event.requestContext.authorizer?.jwt?.claims?.['custom:tenant_id'] as string;
    // @ts-ignore
    const userId = event.requestContext.authorizer?.jwt?.claims?.sub as string;
    // @ts-ignore
    const userRole = event.requestContext.authorizer?.jwt?.claims?.['custom:user_role'] as string;
    
    if (!tenantId || !userId) {
      logger.warn('Missing tenant_id or user_id in JWT claims');
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized: Missing user information' })
      };
    }

    // Validar permissões do usuário
    const { checkPermission, SubjectType, ResourceType, PermissionAction } = await import('./check-permissions');
    
    const permissionCheck = await checkPermission({
      subjectType: SubjectType.USER,
      subjectId: userId,
      resourceType: ResourceType.DATA,
      action: PermissionAction.READ,
      context: {
        tenantId,
        timestamp: new Date(),
        metadata: {
          ipAddress: event.requestContext?.http?.sourceIp,
          resource: 'agent_metrics'
        }
      }
    });

    if (!permissionCheck.allowed) {
      logger.warn('User does not have permission to read agent metrics', {
        userId,
        userRole,
        reason: permissionCheck.reason
      });
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: 'Forbidden: Insufficient permissions to access agent metrics',
          reason: permissionCheck.reason
        })
      };
    }

    // Extrair parâmetros de query
    const params = event.queryStringParameters || {};
    const startDate = params.startDate;
    const endDate = params.endDate;
    
    // Extrair agent ID dos path parameters (se presente)
    const agentId = event.pathParameters?.id;
    
    const { query } = await import('../shared/database');
    
    if (agentId) {
      // Get metrics for specific agent
      
      // Verify agent is activated for this tenant
      const activationCheck = await query(
        `SELECT id, status FROM alquimista_platform.agent_activations 
         WHERE agent_id = $1 AND tenant_id = $2`,
        [agentId, tenantId]
      );
      
      if (activationCheck.rows.length === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({
            error: 'Agent not found or not activated for this tenant'
          })
        };
      }
      
      const metrics = await calculateAgentMetrics(agentId, tenantId, startDate, endDate);
      
      subsegment?.addAnnotation('agentId', agentId);
      subsegment?.addAnnotation('tenantId', tenantId);
      subsegment?.addMetadata('metrics', metrics);
      subsegment?.close();
      
      logger.info('Agent metrics retrieved successfully', {
        agentId,
        tenantId,
        totalExecutions: metrics.totalExecutions
      });
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metrics
        })
      };
      
    } else {
      // Get metrics for all active agents
      
      const activeAgents = await query(
        `SELECT agent_id 
         FROM alquimista_platform.agent_activations 
         WHERE tenant_id = $1 AND status = 'active'`,
        [tenantId]
      );
      
      const agentIds = activeAgents.rows.map(row => row.agent_id);
      
      if (agentIds.length === 0) {
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            metrics: [],
            total: 0
          })
        };
      }
      
      // Calculate metrics for all agents in parallel
      const metricsPromises = agentIds.map(id => 
        calculateAgentMetrics(id, tenantId, startDate, endDate)
      );
      
      const allMetrics = await Promise.all(metricsPromises);
      
      // Sort by total executions (descending)
      allMetrics.sort((a, b) => b.totalExecutions - a.totalExecutions);
      
      subsegment?.addAnnotation('tenantId', tenantId);
      subsegment?.addMetadata('agentCount', allMetrics.length);
      subsegment?.close();
      
      logger.info('All agent metrics retrieved successfully', {
        tenantId,
        agentCount: allMetrics.length
      });
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metrics: allMetrics,
          total: allMetrics.length
        })
      };
    }

  } catch (error) {
    logger.error('Error getting agent metrics', { error });
    subsegment?.addError(error as Error);
    subsegment?.close();

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Handle specific error cases
    if (errorMessage.includes('not found')) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'Agent not found',
          message: errorMessage
        })
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: errorMessage
      })
    };
  }
};
