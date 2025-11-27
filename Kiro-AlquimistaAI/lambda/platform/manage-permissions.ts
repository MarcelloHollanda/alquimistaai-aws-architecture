import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import {
  grantPermission,
  revokePermission,
  listPermissions,
  SubjectType,
  ResourceType,
  PermissionAction,
  PermissionGrantRequest
} from './check-permissions';

const logger = new Logger({ serviceName: 'alquimista-platform' });
const tracer = new Tracer({ serviceName: 'alquimista-platform' });

/**
 * Lambda Handler: Manage permissions (grant, revoke, list)
 * 
 * POST /api/permissions - Grant permission
 * DELETE /api/permissions/{id} - Revoke permission
 * GET /api/permissions - List permissions for current user
 * 
 * Requirements: 14.3
 */
export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const segment = tracer.getSegment();
  const subsegment = segment?.addNewSubsegment('ManagePermissions');

  try {
    // Extract user information from JWT
    // @ts-ignore
    const userId = event.requestContext.authorizer?.jwt?.claims?.sub as string;
    // @ts-ignore
    const userRole = event.requestContext.authorizer?.jwt?.claims?.['custom:user_role'] as string;
    // @ts-ignore
    const tenantId = event.requestContext.authorizer?.jwt?.claims?.['custom:tenant_id'] as string;

    if (!userId || !tenantId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized: Missing user information' })
      };
    }

    const method = event.requestContext.http.method;
    const path = event.requestContext.http.path;

    // Route based on HTTP method
    if (method === 'POST' && path === '/api/permissions') {
      return await handleGrantPermission(event, userId, userRole, tenantId, subsegment);
    } else if (method === 'DELETE' && path.startsWith('/api/permissions/')) {
      return await handleRevokePermission(event, userId, userRole, subsegment);
    } else if (method === 'GET' && path === '/api/permissions') {
      return await handleListPermissions(event, userId, userRole, subsegment);
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Not found' })
      };
    }

  } catch (error) {
    logger.error('Error managing permissions', { error });
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
 * Handle grant permission request
 */
async function handleGrantPermission(
  event: APIGatewayProxyEventV2,
  userId: string,
  userRole: string,
  tenantId: string,
  subsegment: any
): Promise<APIGatewayProxyResultV2> {
  // Only admins can grant permissions
  if (userRole !== 'admin') {
    logger.warn('User attempted to grant permission without admin role', {
      userId,
      userRole
    });

    return {
      statusCode: 403,
      body: JSON.stringify({
        error: 'Forbidden',
        message: 'Only administrators can grant permissions'
      })
    };
  }

  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing request body' })
    };
  }

  try {
    const body = JSON.parse(event.body);

    // Validate required fields
    if (!body.subjectType || !body.subjectId || !body.resourceType || !body.action) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required fields',
          required: ['subjectType', 'subjectId', 'resourceType', 'action']
        })
      };
    }

    // Validate enum values
    if (!Object.values(SubjectType).includes(body.subjectType)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Invalid subjectType',
          validValues: Object.values(SubjectType)
        })
      };
    }

    if (!Object.values(ResourceType).includes(body.resourceType)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Invalid resourceType',
          validValues: Object.values(ResourceType)
        })
      };
    }

    if (!Object.values(PermissionAction).includes(body.action)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Invalid action',
          validValues: Object.values(PermissionAction)
        })
      };
    }

    // Build grant request
    const grantRequest: PermissionGrantRequest = {
      subjectType: body.subjectType,
      subjectId: body.subjectId,
      resourceType: body.resourceType,
      resourceId: body.resourceId,
      action: body.action,
      constraints: body.constraints,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      grantedBy: userId
    };

    logger.info('Granting permission', {
      grantRequest,
      grantedBy: userId
    });

    // Grant permission
    const { permissionId } = await grantPermission(grantRequest);

    subsegment?.addAnnotation('permissionId', permissionId);
    subsegment?.close();

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        permissionId,
        message: 'Permission granted successfully'
      })
    };

  } catch (error) {
    logger.error('Error granting permission', { error });
    throw error;
  }
}

/**
 * Handle revoke permission request
 */
async function handleRevokePermission(
  event: APIGatewayProxyEventV2,
  userId: string,
  userRole: string,
  subsegment: any
): Promise<APIGatewayProxyResultV2> {
  // Only admins can revoke permissions
  if (userRole !== 'admin') {
    logger.warn('User attempted to revoke permission without admin role', {
      userId,
      userRole
    });

    return {
      statusCode: 403,
      body: JSON.stringify({
        error: 'Forbidden',
        message: 'Only administrators can revoke permissions'
      })
    };
  }

  const permissionId = event.pathParameters?.id;

  if (!permissionId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing permission ID' })
    };
  }

  try {
    logger.info('Revoking permission', {
      permissionId,
      revokedBy: userId
    });

    await revokePermission(permissionId);

    subsegment?.addAnnotation('permissionId', permissionId);
    subsegment?.close();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Permission revoked successfully'
      })
    };

  } catch (error) {
    logger.error('Error revoking permission', { error });
    throw error;
  }
}

/**
 * Handle list permissions request
 */
async function handleListPermissions(
  event: APIGatewayProxyEventV2,
  userId: string,
  userRole: string,
  subsegment: any
): Promise<APIGatewayProxyResultV2> {
  try {
    // Determine which permissions to list
    let subjectType: SubjectType;
    let subjectId: string;

    // Query parameters can override (admin only)
    const queryParams = event.queryStringParameters || {};

    if (queryParams.subjectType && queryParams.subjectId) {
      // Admin can list permissions for any subject
      if (userRole !== 'admin') {
        return {
          statusCode: 403,
          body: JSON.stringify({
            error: 'Forbidden',
            message: 'Only administrators can list permissions for other subjects'
          })
        };
      }

      subjectType = queryParams.subjectType as SubjectType;
      subjectId = queryParams.subjectId;
    } else {
      // List permissions for current user
      subjectType = SubjectType.USER;
      subjectId = userId;
    }

    logger.info('Listing permissions', {
      subjectType,
      subjectId,
      requestedBy: userId
    });

    const permissions = await listPermissions(subjectType, subjectId);

    subsegment?.addMetadata('permissionsCount', permissions.length);
    subsegment?.close();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        permissions,
        total: permissions.length
      })
    };

  } catch (error) {
    logger.error('Error listing permissions', { error });
    throw error;
  }
}
