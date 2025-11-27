import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { v4 as uuidv4 } from 'uuid';

const logger = new Logger({ serviceName: 'alquimista-platform' });
const tracer = new Tracer({ serviceName: 'alquimista-platform' });

/**
 * Audit Log Entry
 */
export interface AuditLogEntry {
  traceId: string;
  tenantId?: string;
  userId?: string;
  agentId?: string;
  actionType: string;
  result: 'success' | 'failure' | 'partial';
  context?: Record<string, any>;
  errorMessage?: string;
}

/**
 * Create audit log entry
 * 
 * @param entry - Audit log entry data
 * @returns Created audit log ID
 * 
 * Requirements: 14.5
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<string> {
  const segment = tracer.getSegment();
  const subsegment = segment?.addNewSubsegment('CreateAuditLog');

  try {
    logger.info('Creating audit log entry', {
      traceId: entry.traceId,
      actionType: entry.actionType,
      result: entry.result
    });

    const { query } = await import('../shared/database');

    const result = await query(
      `INSERT INTO alquimista_platform.audit_logs
        (trace_id, tenant_id, user_id, agent_id, action_type, result, context, error_message)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id`,
      [
        entry.traceId,
        entry.tenantId || null,
        entry.userId || null,
        entry.agentId || null,
        entry.actionType,
        entry.result,
        entry.context ? JSON.stringify(entry.context) : null,
        entry.errorMessage || null
      ]
    );

    const auditLogId = result.rows[0].id;

    subsegment?.addAnnotation('auditLogId', auditLogId);
    subsegment?.addAnnotation('actionType', entry.actionType);
    subsegment?.addAnnotation('result', entry.result);
    subsegment?.close();

    logger.info('Audit log entry created', {
      auditLogId,
      traceId: entry.traceId,
      actionType: entry.actionType
    });

    return auditLogId;

  } catch (error) {
    logger.error('Error creating audit log entry', { error });
    subsegment?.addError(error as Error);
    subsegment?.close();
    throw error;
  }
}

/**
 * Lambda Handler: Query audit logs
 * 
 * GET /api/audit-logs
 * Query params:
 *   - tenantId: Filter by tenant (optional)
 *   - userId: Filter by user (optional)
 *   - agentId: Filter by agent (optional)
 *   - actionType: Filter by action type (optional)
 *   - result: Filter by result (success|failure|partial) (optional)
 *   - startDate: Filter by start date (ISO-8601) (optional)
 *   - endDate: Filter by end date (ISO-8601) (optional)
 *   - limit: Number of results (default: 100, max: 1000)
 *   - offset: Pagination offset (default: 0)
 * 
 * Requirements: 14.5
 */
export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const segment = tracer.getSegment();
  const subsegment = segment?.addNewSubsegment('QueryAuditLogs');

  try {
    logger.info('Querying audit logs', {
      queryParams: event.queryStringParameters,
      requestContext: event.requestContext
    });

    // Extrair tenant_id do token JWT (Cognito)
    // @ts-ignore - authorizer exists in runtime but not in type definition
    const requestorTenantId = event.requestContext.authorizer?.jwt?.claims?.['custom:tenant_id'] as string;
    // @ts-ignore
    const requestorUserId = event.requestContext.authorizer?.jwt?.claims?.sub as string;
    // @ts-ignore
    const requestorRole = event.requestContext.authorizer?.jwt?.claims?.['custom:user_role'] as string;
    
    if (!requestorTenantId || !requestorUserId) {
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
      subjectId: requestorUserId,
      resourceType: ResourceType.DATA,
      action: PermissionAction.READ,
      context: {
        tenantId: requestorTenantId,
        timestamp: new Date(),
        metadata: {
          ipAddress: event.requestContext?.http?.sourceIp,
          resource: 'audit_logs'
        }
      }
    });

    if (!permissionCheck.allowed) {
      logger.warn('User does not have permission to read audit logs', {
        userId: requestorUserId,
        role: requestorRole,
        reason: permissionCheck.reason
      });
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: 'Forbidden: Insufficient permissions to access audit logs',
          reason: permissionCheck.reason
        })
      };
    }

    // Extrair parâmetros de query
    const params = event.queryStringParameters || {};
    const tenantId = params.tenantId || requestorTenantId; // Default to requestor's tenant
    const userId = params.userId;
    const agentId = params.agentId;
    const actionType = params.actionType;
    const result = params.result;
    const startDate = params.startDate;
    const endDate = params.endDate;
    const limit = Math.min(parseInt(params.limit || '100'), 1000);
    const offset = parseInt(params.offset || '0');

    // Validar que usuário só pode ver logs do próprio tenant (exceto admins)
    if (tenantId !== requestorTenantId && requestorRole !== 'admin') {
      logger.warn('User attempted to access audit logs from different tenant', {
        requestorTenantId,
        requestedTenantId: tenantId
      });
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: 'Forbidden: Cannot access audit logs from other tenants'
        })
      };
    }

    // Construir query dinâmica
    const conditions: string[] = ['tenant_id = $1'];
    const values: any[] = [tenantId];
    let paramIndex = 2;

    if (userId) {
      conditions.push(`user_id = $${paramIndex}`);
      values.push(userId);
      paramIndex++;
    }

    if (agentId) {
      conditions.push(`agent_id = $${paramIndex}`);
      values.push(agentId);
      paramIndex++;
    }

    if (actionType) {
      conditions.push(`action_type = $${paramIndex}`);
      values.push(actionType);
      paramIndex++;
    }

    if (result) {
      conditions.push(`result = $${paramIndex}`);
      values.push(result);
      paramIndex++;
    }

    if (startDate) {
      conditions.push(`created_at >= $${paramIndex}`);
      values.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      conditions.push(`created_at <= $${paramIndex}`);
      values.push(endDate);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Importar função de query do banco de dados
    const { query } = await import('../shared/database');

    // Consultar audit logs
    const queryText = `
      SELECT 
        al.id,
        al.trace_id,
        al.tenant_id,
        al.user_id,
        al.agent_id,
        al.action_type,
        al.result,
        al.context,
        al.error_message,
        al.created_at,
        u.email as user_email,
        u.full_name as user_name,
        a.name as agent_name,
        a.display_name as agent_display_name
      FROM alquimista_platform.audit_logs al
      LEFT JOIN alquimista_platform.users u ON al.user_id = u.id
      LEFT JOIN alquimista_platform.agents a ON al.agent_id = a.id
      WHERE ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    values.push(limit, offset);

    const logsResult = await query(queryText, values);
    const logs = logsResult.rows;

    // Contar total de registros (para paginação)
    const countQuery = `
      SELECT COUNT(*) as total
      FROM alquimista_platform.audit_logs
      WHERE ${whereClause}
    `;

    const countResult = await query(countQuery, values.slice(0, -2)); // Remove limit e offset
    const total = parseInt(countResult.rows[0].total);

    subsegment?.addAnnotation('tenantId', tenantId);
    subsegment?.addMetadata('filters', {
      userId,
      agentId,
      actionType,
      result,
      startDate,
      endDate
    });
    subsegment?.addMetadata('logsCount', logs.length);
    subsegment?.close();

    logger.info('Audit logs queried successfully', {
      tenantId,
      count: logs.length,
      total,
      filters: { userId, agentId, actionType, result }
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        logs: logs,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + logs.length < total
        }
      })
    };

  } catch (error) {
    logger.error('Error querying audit logs', { error });
    subsegment?.addError(error as Error);
    subsegment?.close();

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

/**
 * Helper function to log agent actions
 * Can be called from other Lambda functions to create audit entries
 */
export async function logAgentAction(params: {
  traceId?: string;
  tenantId?: string;
  userId?: string;
  agentId: string;
  actionType: string;
  result: 'success' | 'failure' | 'partial';
  context?: Record<string, any>;
  errorMessage?: string;
}): Promise<string> {
  const traceId = params.traceId || uuidv4();

  return createAuditLog({
    traceId,
    tenantId: params.tenantId,
    userId: params.userId,
    agentId: params.agentId,
    actionType: params.actionType,
    result: params.result,
    context: params.context,
    errorMessage: params.errorMessage
  });
}

/**
 * Helper function to log user actions
 */
export async function logUserAction(params: {
  traceId?: string;
  tenantId: string;
  userId: string;
  actionType: string;
  result: 'success' | 'failure' | 'partial';
  context?: Record<string, any>;
  errorMessage?: string;
}): Promise<string> {
  const traceId = params.traceId || uuidv4();

  return createAuditLog({
    traceId,
    tenantId: params.tenantId,
    userId: params.userId,
    actionType: params.actionType,
    result: params.result,
    context: params.context,
    errorMessage: params.errorMessage
  });
}

/**
 * Helper function to log system events
 */
export async function logSystemEvent(params: {
  traceId?: string;
  tenantId?: string;
  actionType: string;
  result: 'success' | 'failure' | 'partial';
  context?: Record<string, any>;
  errorMessage?: string;
}): Promise<string> {
  const traceId = params.traceId || uuidv4();

  return createAuditLog({
    traceId,
    tenantId: params.tenantId,
    actionType: params.actionType,
    result: params.result,
    context: params.context,
    errorMessage: params.errorMessage
  });
}
