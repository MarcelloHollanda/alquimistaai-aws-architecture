import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';

const logger = new Logger({ serviceName: 'alquimista-platform' });
const tracer = new Tracer({ serviceName: 'alquimista-platform' });

/**
 * Permission Scopes
 * Define os escopos de ação permitidos para cada tipo de recurso
 */
export enum PermissionAction {
  READ = 'read',
  WRITE = 'write',
  EXECUTE = 'execute',
  DELETE = 'delete',
  MANAGE = 'manage'
}

export enum ResourceType {
  AGENT = 'agent',
  TENANT = 'tenant',
  USER = 'user',
  DATA = 'data'
}

export enum SubjectType {
  USER = 'user',
  ROLE = 'role',
  AGENT = 'agent'
}

/**
 * Permission Check Request
 */
export interface PermissionCheckRequest {
  // Quem está tentando executar a ação
  subjectType: SubjectType;
  subjectId: string;
  
  // Qual recurso está sendo acessado
  resourceType: ResourceType;
  resourceId?: string;
  
  // Qual ação está sendo executada
  action: PermissionAction;
  
  // Contexto adicional para validação de constraints
  context?: {
    tenantId?: string;
    timestamp?: Date;
    metadata?: Record<string, any>;
  };
}

/**
 * Permission Check Result
 */
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  constraints?: Record<string, any>;
  permission?: {
    id: string;
    grantedAt: Date;
    expiresAt?: Date;
  };
}

/**
 * Permission Constraint Validator
 */
interface PermissionConstraints {
  timeWindow?: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
  maxExecutions?: number;
  requiresApproval?: boolean;
  allowedDays?: number[]; // 0-6 (Sunday-Saturday)
  ipWhitelist?: string[];
}

/**
 * Check if user/role/agent has permission to perform action on resource
 * 
 * @param request - Permission check request
 * @returns Permission check result
 * 
 * Requirements: 14.3
 */
export async function checkPermission(
  request: PermissionCheckRequest
): Promise<PermissionCheckResult> {
  const segment = tracer.getSegment();
  const subsegment = segment?.addNewSubsegment('CheckPermission');

  try {
    logger.info('Checking permission', {
      subjectType: request.subjectType,
      subjectId: request.subjectId,
      resourceType: request.resourceType,
      resourceId: request.resourceId,
      action: request.action
    });

    // Importar função de query do banco de dados
    const { query } = await import('../shared/database');

    // 1. Buscar permissões diretas do subject
    const directPermissions = await query(
      `SELECT 
        id,
        action,
        constraints,
        granted_at,
        expires_at
      FROM alquimista_platform.permissions
      WHERE subject_type = $1
        AND subject_id = $2
        AND resource_type = $3
        AND ($4::uuid IS NULL OR resource_id = $4)
        AND action = $5
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY granted_at DESC
      LIMIT 1`,
      [
        request.subjectType,
        request.subjectId,
        request.resourceType,
        request.resourceId || null,
        request.action
      ]
    );

    // 2. Se for usuário, buscar permissões baseadas em role
    let rolePermissions: any = { rows: [] };
    if (request.subjectType === SubjectType.USER && request.context?.tenantId) {
      // Buscar role do usuário
      const userResult = await query(
        `SELECT user_role FROM alquimista_platform.users WHERE id = $1`,
        [request.subjectId]
      );

      if (userResult.rows.length > 0) {
        const userRole = userResult.rows[0].user_role;

        // Buscar permissões da role
        rolePermissions = await query(
          `SELECT 
            id,
            action,
            constraints,
            granted_at,
            expires_at
          FROM alquimista_platform.permissions
          WHERE subject_type = $1
            AND subject_id = $2
            AND resource_type = $3
            AND ($4::uuid IS NULL OR resource_id = $4)
            AND action = $5
            AND (expires_at IS NULL OR expires_at > NOW())
          ORDER BY granted_at DESC
          LIMIT 1`,
          [
            SubjectType.ROLE,
            userRole,
            request.resourceType,
            request.resourceId || null,
            request.action
          ]
        );
      }
    }

    // 3. Combinar permissões (diretas têm prioridade sobre role)
    const permissions = [
      ...directPermissions.rows,
      ...rolePermissions.rows
    ];

    if (permissions.length === 0) {
      subsegment?.addAnnotation('allowed', false);
      subsegment?.addAnnotation('reason', 'no_permission');
      subsegment?.close();

      logger.warn('Permission denied: No matching permission found', {
        subjectType: request.subjectType,
        subjectId: request.subjectId,
        resourceType: request.resourceType,
        action: request.action
      });

      return {
        allowed: false,
        reason: 'No permission found for this action'
      };
    }

    const permission = permissions[0];

    // 4. Validar constraints se existirem
    if (permission.constraints && Object.keys(permission.constraints).length > 0) {
      const constraints: PermissionConstraints = permission.constraints;
      const validationResult = validateConstraints(constraints, request.context);

      if (!validationResult.valid) {
        subsegment?.addAnnotation('allowed', false);
        subsegment?.addAnnotation('reason', 'constraint_violation');
        subsegment?.addMetadata('constraint', validationResult.reason);
        subsegment?.close();

        logger.warn('Permission denied: Constraint violation', {
          subjectId: request.subjectId,
          constraint: validationResult.reason
        });

        return {
          allowed: false,
          reason: `Constraint violation: ${validationResult.reason}`,
          constraints: constraints
        };
      }
    }

    // 5. Permissão concedida
    subsegment?.addAnnotation('allowed', true);
    subsegment?.addAnnotation('permissionId', permission.id);
    subsegment?.close();

    logger.info('Permission granted', {
      subjectId: request.subjectId,
      permissionId: permission.id,
      action: request.action
    });

    return {
      allowed: true,
      permission: {
        id: permission.id,
        grantedAt: new Date(permission.granted_at),
        expiresAt: permission.expires_at ? new Date(permission.expires_at) : undefined
      },
      constraints: permission.constraints
    };

  } catch (error) {
    logger.error('Error checking permission', { error });
    subsegment?.addError(error as Error);
    subsegment?.close();

    // Em caso de erro, negar acesso por segurança
    return {
      allowed: false,
      reason: 'Error checking permission: ' + (error instanceof Error ? error.message : 'Unknown error')
    };
  }
}

/**
 * Validate permission constraints
 */
function validateConstraints(
  constraints: PermissionConstraints,
  context?: PermissionCheckRequest['context']
): { valid: boolean; reason?: string } {
  const now = context?.timestamp || new Date();

  // Validar janela de tempo
  if (constraints.timeWindow) {
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM
    const { start, end } = constraints.timeWindow;

    if (currentTime < start || currentTime > end) {
      return {
        valid: false,
        reason: `Action only allowed between ${start} and ${end}`
      };
    }
  }

  // Validar dias permitidos
  if (constraints.allowedDays) {
    const currentDay = now.getDay(); // 0-6 (Sunday-Saturday)
    
    if (!constraints.allowedDays.includes(currentDay)) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const allowedDayNames = constraints.allowedDays.map(d => dayNames[d]).join(', ');
      return {
        valid: false,
        reason: `Action only allowed on: ${allowedDayNames}`
      };
    }
  }

  // Validar aprovação requerida
  if (constraints.requiresApproval) {
    const hasApproval = context?.metadata?.approved === true;
    
    if (!hasApproval) {
      return {
        valid: false,
        reason: 'This action requires approval'
      };
    }
  }

  // Validar IP whitelist
  if (constraints.ipWhitelist && constraints.ipWhitelist.length > 0) {
    const clientIp = context?.metadata?.ipAddress;
    
    if (!clientIp || !constraints.ipWhitelist.includes(clientIp)) {
      return {
        valid: false,
        reason: 'IP address not in whitelist'
      };
    }
  }

  return { valid: true };
}

/**
 * Grant permission to subject for resource action
 * 
 * @param grantRequest - Permission grant request
 * @returns Created permission ID
 */
export interface PermissionGrantRequest {
  subjectType: SubjectType;
  subjectId: string;
  resourceType: ResourceType;
  resourceId?: string;
  action: PermissionAction;
  constraints?: PermissionConstraints;
  expiresAt?: Date;
  grantedBy: string; // User ID who granted the permission
}

export async function grantPermission(
  grantRequest: PermissionGrantRequest
): Promise<{ permissionId: string }> {
  const segment = tracer.getSegment();
  const subsegment = segment?.addNewSubsegment('GrantPermission');

  try {
    logger.info('Granting permission', {
      subjectType: grantRequest.subjectType,
      subjectId: grantRequest.subjectId,
      resourceType: grantRequest.resourceType,
      action: grantRequest.action
    });

    const { query } = await import('../shared/database');

    // Inserir nova permissão
    const result = await query(
      `INSERT INTO alquimista_platform.permissions
        (subject_type, subject_id, resource_type, resource_id, action, constraints, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (resource_type, resource_id, action, subject_type, subject_id)
      DO UPDATE SET
        constraints = EXCLUDED.constraints,
        expires_at = EXCLUDED.expires_at,
        granted_at = NOW()
      RETURNING id`,
      [
        grantRequest.subjectType,
        grantRequest.subjectId,
        grantRequest.resourceType,
        grantRequest.resourceId || null,
        grantRequest.action,
        grantRequest.constraints ? JSON.stringify(grantRequest.constraints) : null,
        grantRequest.expiresAt || null
      ]
    );

    const permissionId = result.rows[0].id;

    subsegment?.addAnnotation('permissionId', permissionId);
    subsegment?.close();

    logger.info('Permission granted successfully', {
      permissionId,
      subjectId: grantRequest.subjectId,
      action: grantRequest.action
    });

    return { permissionId };

  } catch (error) {
    logger.error('Error granting permission', { error });
    subsegment?.addError(error as Error);
    subsegment?.close();
    throw error;
  }
}

/**
 * Revoke permission
 * 
 * @param permissionId - Permission ID to revoke
 */
export async function revokePermission(permissionId: string): Promise<void> {
  const segment = tracer.getSegment();
  const subsegment = segment?.addNewSubsegment('RevokePermission');

  try {
    logger.info('Revoking permission', { permissionId });

    const { query } = await import('../shared/database');

    await query(
      `DELETE FROM alquimista_platform.permissions WHERE id = $1`,
      [permissionId]
    );

    subsegment?.addAnnotation('permissionId', permissionId);
    subsegment?.close();

    logger.info('Permission revoked successfully', { permissionId });

  } catch (error) {
    logger.error('Error revoking permission', { error });
    subsegment?.addError(error as Error);
    subsegment?.close();
    throw error;
  }
}

/**
 * List all permissions for a subject
 * 
 * @param subjectType - Subject type
 * @param subjectId - Subject ID
 * @returns List of permissions
 */
export async function listPermissions(
  subjectType: SubjectType,
  subjectId: string
): Promise<any[]> {
  const segment = tracer.getSegment();
  const subsegment = segment?.addNewSubsegment('ListPermissions');

  try {
    logger.info('Listing permissions', { subjectType, subjectId });

    const { query } = await import('../shared/database');

    const result = await query(
      `SELECT 
        id,
        resource_type,
        resource_id,
        action,
        constraints,
        granted_at,
        expires_at
      FROM alquimista_platform.permissions
      WHERE subject_type = $1
        AND subject_id = $2
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY granted_at DESC`,
      [subjectType, subjectId]
    );

    subsegment?.addMetadata('permissionsCount', result.rows.length);
    subsegment?.close();

    logger.info('Permissions listed successfully', {
      subjectType,
      subjectId,
      count: result.rows.length
    });

    return result.rows;

  } catch (error) {
    logger.error('Error listing permissions', { error });
    subsegment?.addError(error as Error);
    subsegment?.close();
    throw error;
  }
}

/**
 * Check if user has specific role
 * Helper function for role-based access control
 */
export async function hasRole(
  userId: string,
  requiredRole: string | string[]
): Promise<boolean> {
  try {
    const { query } = await import('../shared/database');

    const result = await query(
      `SELECT user_role FROM alquimista_platform.users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return false;
    }

    const userRole = result.rows[0].user_role;
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    return roles.includes(userRole);

  } catch (error) {
    logger.error('Error checking user role', { error });
    return false;
  }
}

/**
 * Middleware function to validate permissions before executing actions
 * Can be used as a wrapper for Lambda handlers
 */
export function withPermissionCheck(
  requiredPermission: Omit<PermissionCheckRequest, 'context'>
) {
  return function (handler: Function) {
    return async function (event: any, context: any) {
      // Extract user information from event
      const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
      const tenantId = event.requestContext?.authorizer?.jwt?.claims?.['custom:tenant_id'];
      const ipAddress = event.requestContext?.http?.sourceIp;

      if (!userId) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: 'Unauthorized' })
        };
      }

      // Check permission
      const permissionCheck = await checkPermission({
        ...requiredPermission,
        subjectType: SubjectType.USER,
        subjectId: userId,
        context: {
          tenantId,
          timestamp: new Date(),
          metadata: { ipAddress }
        }
      });

      if (!permissionCheck.allowed) {
        logger.warn('Permission denied', {
          userId,
          reason: permissionCheck.reason
        });

        return {
          statusCode: 403,
          body: JSON.stringify({
            error: 'Forbidden',
            reason: permissionCheck.reason
          })
        };
      }

      // Permission granted, execute handler
      return handler(event, context);
    };
  };
}
