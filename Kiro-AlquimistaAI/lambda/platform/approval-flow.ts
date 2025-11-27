import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { v4 as uuidv4 } from 'uuid';

const logger = new Logger({ serviceName: 'alquimista-platform' });
const tracer = new Tracer({ serviceName: 'alquimista-platform' });
const eventBridge = tracer.captureAWSv3Client(new EventBridgeClient({}));

const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME!;

/**
 * Approval Status
 */
export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

/**
 * Approval Request
 */
export interface ApprovalRequest {
  id?: string;
  tenantId: string;
  requestedBy: string;
  actionType: string;
  resourceType: string;
  resourceId?: string;
  actionDetails: Record<string, any>;
  approvers: string[]; // User IDs who can approve
  requiredApprovals: number; // 1 or 2 step approval
  expiresAt?: Date;
}

/**
 * Approval Decision
 */
export interface ApprovalDecision {
  approvalId: string;
  approverId: string;
  decision: 'approve' | 'reject';
  comment?: string;
}

/**
 * Create approval request for critical action
 * 
 * @param request - Approval request data
 * @returns Created approval request ID
 * 
 * Requirements: 14.4
 */
export async function createApprovalRequest(
  request: ApprovalRequest
): Promise<{ approvalId: string; status: ApprovalStatus }> {
  const segment = tracer.getSegment();
  const subsegment = segment?.addNewSubsegment('CreateApprovalRequest');

  try {
    const approvalId = request.id || `approval-${uuidv4()}`;
    const expiresAt = request.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours default

    logger.info('Creating approval request', {
      approvalId,
      tenantId: request.tenantId,
      actionType: request.actionType,
      requiredApprovals: request.requiredApprovals
    });

    const { query } = await import('../shared/database');

    // Create approval request in database
    await query(
      `INSERT INTO alquimista_platform.approval_requests
        (id, tenant_id, requested_by, action_type, resource_type, resource_id, 
         action_details, approvers, required_approvals, status, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        approvalId,
        request.tenantId,
        request.requestedBy,
        request.actionType,
        request.resourceType,
        request.resourceId || null,
        JSON.stringify(request.actionDetails),
        JSON.stringify(request.approvers),
        request.requiredApprovals,
        ApprovalStatus.PENDING,
        expiresAt
      ]
    );

    // Notify approvers
    await notifyApprovers(approvalId, request);

    // Publish event
    await publishApprovalEvent({
      approvalId,
      tenantId: request.tenantId,
      eventType: 'approval.created',
      details: {
        actionType: request.actionType,
        requestedBy: request.requestedBy,
        approvers: request.approvers,
        requiredApprovals: request.requiredApprovals
      }
    });

    subsegment?.addAnnotation('approvalId', approvalId);
    subsegment?.close();

    logger.info('Approval request created', { approvalId });

    return {
      approvalId,
      status: ApprovalStatus.PENDING
    };

  } catch (error) {
    logger.error('Error creating approval request', { error });
    subsegment?.addError(error as Error);
    subsegment?.close();
    throw error;
  }
}

/**
 * Process approval decision
 * 
 * @param decision - Approval decision
 * @returns Updated approval status
 * 
 * Requirements: 14.4
 */
export async function processApprovalDecision(
  decision: ApprovalDecision
): Promise<{ status: ApprovalStatus; canExecute: boolean }> {
  const segment = tracer.getSegment();
  const subsegment = segment?.addNewSubsegment('ProcessApprovalDecision');

  try {
    logger.info('Processing approval decision', {
      approvalId: decision.approvalId,
      approverId: decision.approverId,
      decision: decision.decision
    });

    const { query, transaction } = await import('../shared/database');

    const result = await transaction(async (client) => {
      // Get approval request
      const approvalResult = await client.query(
        `SELECT * FROM alquimista_platform.approval_requests WHERE id = $1`,
        [decision.approvalId]
      );

      if (approvalResult.rows.length === 0) {
        throw new Error(`Approval request ${decision.approvalId} not found`);
      }

      const approval = approvalResult.rows[0];

      // Validate approval is still pending
      if (approval.status !== ApprovalStatus.PENDING) {
        throw new Error(`Approval request is already ${approval.status}`);
      }

      // Check if expired
      if (new Date(approval.expires_at) < new Date()) {
        await client.query(
          `UPDATE alquimista_platform.approval_requests SET status = $1 WHERE id = $2`,
          [ApprovalStatus.EXPIRED, decision.approvalId]
        );
        throw new Error('Approval request has expired');
      }

      // Validate approver is authorized
      const approvers = JSON.parse(approval.approvers);
      if (!approvers.includes(decision.approverId)) {
        throw new Error('User is not authorized to approve this request');
      }

      // Record decision
      await client.query(
        `INSERT INTO alquimista_platform.approval_decisions
          (approval_id, approver_id, decision, comment)
        VALUES ($1, $2, $3, $4)`,
        [decision.approvalId, decision.approverId, decision.decision, decision.comment || null]
      );

      // If rejected, update status immediately
      if (decision.decision === 'reject') {
        await client.query(
          `UPDATE alquimista_platform.approval_requests SET status = $1 WHERE id = $2`,
          [ApprovalStatus.REJECTED, decision.approvalId]
        );

        return {
          status: ApprovalStatus.REJECTED,
          canExecute: false,
          approval
        };
      }

      // Count approvals
      const approvalsResult = await client.query(
        `SELECT COUNT(*) as count FROM alquimista_platform.approval_decisions
         WHERE approval_id = $1 AND decision = 'approve'`,
        [decision.approvalId]
      );

      const approvalCount = parseInt(approvalsResult.rows[0].count);
      const requiredApprovals = approval.required_approvals;

      // Check if we have enough approvals
      if (approvalCount >= requiredApprovals) {
        await client.query(
          `UPDATE alquimista_platform.approval_requests SET status = $1 WHERE id = $2`,
          [ApprovalStatus.APPROVED, decision.approvalId]
        );

        return {
          status: ApprovalStatus.APPROVED,
          canExecute: true,
          approval
        };
      }

      // Still pending more approvals
      return {
        status: ApprovalStatus.PENDING,
        canExecute: false,
        approval
      };
    });

    // Publish event
    await publishApprovalEvent({
      approvalId: decision.approvalId,
      tenantId: result.approval.tenant_id,
      eventType: result.status === ApprovalStatus.APPROVED ? 'approval.approved' : 
                 result.status === ApprovalStatus.REJECTED ? 'approval.rejected' : 
                 'approval.decision_recorded',
      details: {
        approverId: decision.approverId,
        decision: decision.decision,
        status: result.status,
        canExecute: result.canExecute
      }
    });

    // Log audit entry
    const { logUserAction } = await import('./audit-log');
    await logUserAction({
      tenantId: result.approval.tenant_id,
      userId: decision.approverId,
      actionType: `approval.${decision.decision}`,
      result: 'success',
      context: {
        approvalId: decision.approvalId,
        actionType: result.approval.action_type,
        comment: decision.comment
      }
    });

    subsegment?.addAnnotation('status', result.status);
    subsegment?.addAnnotation('canExecute', result.canExecute);
    subsegment?.close();

    logger.info('Approval decision processed', {
      approvalId: decision.approvalId,
      status: result.status,
      canExecute: result.canExecute
    });

    return {
      status: result.status,
      canExecute: result.canExecute
    };

  } catch (error) {
    logger.error('Error processing approval decision', { error });
    subsegment?.addError(error as Error);
    subsegment?.close();
    throw error;
  }
}

/**
 * Notify approvers about pending approval
 */
async function notifyApprovers(
  approvalId: string,
  request: ApprovalRequest
): Promise<void> {
  try {
    logger.info('Notifying approvers', {
      approvalId,
      approvers: request.approvers
    });

    const { query } = await import('../shared/database');

    // Get approver details
    const approversResult = await query(
      `SELECT id, email, full_name FROM alquimista_platform.users WHERE id = ANY($1)`,
      [request.approvers]
    );

    // Create notifications for each approver
    for (const approver of approversResult.rows) {
      await query(
        `INSERT INTO alquimista_platform.notifications
          (user_id, type, title, message, metadata)
        VALUES ($1, $2, $3, $4, $5)`,
        [
          approver.id,
          'approval_required',
          'Approval Required',
          `Action "${request.actionType}" requires your approval`,
          JSON.stringify({
            approvalId,
            actionType: request.actionType,
            resourceType: request.resourceType,
            resourceId: request.resourceId,
            requestedBy: request.requestedBy
          })
        ]
      );

      logger.info('Notification created for approver', {
        approverId: approver.id,
        approverEmail: approver.email
      });
    }

    // TODO: Send email/SMS notifications via SNS or SES
    // This would be implemented based on tenant preferences

  } catch (error) {
    logger.error('Error notifying approvers', { error });
    // Don't throw - notification failure shouldn't block approval creation
  }
}

/**
 * Publish approval event to EventBridge
 */
async function publishApprovalEvent(params: {
  approvalId: string;
  tenantId: string;
  eventType: string;
  details: Record<string, any>;
}): Promise<void> {
  try {
    const putEventsCommand = new PutEventsCommand({
      Entries: [
        {
          Source: 'alquimista.platform',
          DetailType: params.eventType,
          Detail: JSON.stringify({
            approvalId: params.approvalId,
            tenantId: params.tenantId,
            timestamp: new Date().toISOString(),
            ...params.details
          }),
          EventBusName: EVENT_BUS_NAME
        }
      ]
    });

    await eventBridge.send(putEventsCommand);

    logger.info('Approval event published', {
      approvalId: params.approvalId,
      eventType: params.eventType
    });

  } catch (error) {
    logger.error('Error publishing approval event', { error });
    // Don't throw - event publishing failure shouldn't block approval flow
  }
}

/**
 * Lambda Handler: Create approval request
 * 
 * POST /api/approvals
 * Body: ApprovalRequest
 * 
 * Requirements: 14.4
 */
export const createHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const segment = tracer.getSegment();
  const subsegment = segment?.addNewSubsegment('CreateApprovalHandler');

  try {
    // Extract user information from JWT
    // @ts-ignore
    const tenantId = event.requestContext.authorizer?.jwt?.claims?.['custom:tenant_id'] as string;
    // @ts-ignore
    const userId = event.requestContext.authorizer?.jwt?.claims?.sub as string;
    
    if (!tenantId || !userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized: Missing user information' })
      };
    }

    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing request body' })
      };
    }

    const body = JSON.parse(event.body);

    // Validate required fields
    if (!body.actionType || !body.resourceType || !body.actionDetails || !body.approvers) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required fields: actionType, resourceType, actionDetails, approvers'
        })
      };
    }

    // Create approval request
    const request: ApprovalRequest = {
      tenantId,
      requestedBy: userId,
      actionType: body.actionType,
      resourceType: body.resourceType,
      resourceId: body.resourceId,
      actionDetails: body.actionDetails,
      approvers: body.approvers,
      requiredApprovals: body.requiredApprovals || 1,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined
    };

    const result = await createApprovalRequest(request);

    subsegment?.close();

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        approvalId: result.approvalId,
        status: result.status,
        message: 'Approval request created successfully'
      })
    };

  } catch (error) {
    logger.error('Error in create approval handler', { error });
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
 * Lambda Handler: Process approval decision
 * 
 * POST /api/approvals/{id}/decide
 * Body: { decision: 'approve' | 'reject', comment?: string }
 * 
 * Requirements: 14.4
 */
export const decideHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const segment = tracer.getSegment();
  const subsegment = segment?.addNewSubsegment('DecideApprovalHandler');

  try {
    // Extract approval ID from path
    const approvalId = event.pathParameters?.id;
    if (!approvalId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing approval ID' })
      };
    }

    // Extract user information from JWT
    // @ts-ignore
    const userId = event.requestContext.authorizer?.jwt?.claims?.sub as string;
    
    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized: Missing user information' })
      };
    }

    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing request body' })
      };
    }

    const body = JSON.parse(event.body);

    if (!body.decision || !['approve', 'reject'].includes(body.decision)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Invalid decision. Must be "approve" or "reject"'
        })
      };
    }

    // Process decision
    const decision: ApprovalDecision = {
      approvalId,
      approverId: userId,
      decision: body.decision,
      comment: body.comment
    };

    const result = await processApprovalDecision(decision);

    subsegment?.close();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        approvalId,
        status: result.status,
        canExecute: result.canExecute,
        message: result.status === ApprovalStatus.APPROVED 
          ? 'Action approved and can be executed'
          : result.status === ApprovalStatus.REJECTED
          ? 'Action rejected'
          : 'Decision recorded, waiting for more approvals'
      })
    };

  } catch (error) {
    logger.error('Error in decide approval handler', { error });
    subsegment?.addError(error as Error);
    subsegment?.close();

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Handle specific errors
    if (errorMessage.includes('not found')) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Approval request not found' })
      };
    }

    if (errorMessage.includes('already')) {
      return {
        statusCode: 409,
        body: JSON.stringify({ error: errorMessage })
      };
    }

    if (errorMessage.includes('expired')) {
      return {
        statusCode: 410,
        body: JSON.stringify({ error: 'Approval request has expired' })
      };
    }

    if (errorMessage.includes('not authorized')) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: errorMessage })
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

/**
 * Lambda Handler: Get approval request details
 * 
 * GET /api/approvals/{id}
 * 
 * Requirements: 14.4
 */
export const getHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const segment = tracer.getSegment();
  const subsegment = segment?.addNewSubsegment('GetApprovalHandler');

  try {
    // Extract approval ID from path
    const approvalId = event.pathParameters?.id;
    if (!approvalId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing approval ID' })
      };
    }

    // Extract user information from JWT
    // @ts-ignore
    const tenantId = event.requestContext.authorizer?.jwt?.claims?.['custom:tenant_id'] as string;
    // @ts-ignore
    const userId = event.requestContext.authorizer?.jwt?.claims?.sub as string;
    
    if (!tenantId || !userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized: Missing user information' })
      };
    }

    const { query } = await import('../shared/database');

    // Get approval request
    const approvalResult = await query(
      `SELECT 
        ar.*,
        u.email as requester_email,
        u.full_name as requester_name
      FROM alquimista_platform.approval_requests ar
      LEFT JOIN alquimista_platform.users u ON ar.requested_by = u.id
      WHERE ar.id = $1 AND ar.tenant_id = $2`,
      [approvalId, tenantId]
    );

    if (approvalResult.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Approval request not found' })
      };
    }

    const approval = approvalResult.rows[0];

    // Get decisions
    const decisionsResult = await query(
      `SELECT 
        ad.*,
        u.email as approver_email,
        u.full_name as approver_name
      FROM alquimista_platform.approval_decisions ad
      LEFT JOIN alquimista_platform.users u ON ad.approver_id = u.id
      WHERE ad.approval_id = $1
      ORDER BY ad.created_at ASC`,
      [approvalId]
    );

    subsegment?.close();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        approval: {
          id: approval.id,
          tenantId: approval.tenant_id,
          requestedBy: approval.requested_by,
          requesterEmail: approval.requester_email,
          requesterName: approval.requester_name,
          actionType: approval.action_type,
          resourceType: approval.resource_type,
          resourceId: approval.resource_id,
          actionDetails: approval.action_details,
          approvers: JSON.parse(approval.approvers),
          requiredApprovals: approval.required_approvals,
          status: approval.status,
          expiresAt: approval.expires_at,
          createdAt: approval.created_at,
          updatedAt: approval.updated_at
        },
        decisions: decisionsResult.rows.map(d => ({
          id: d.id,
          approverId: d.approver_id,
          approverEmail: d.approver_email,
          approverName: d.approver_name,
          decision: d.decision,
          comment: d.comment,
          createdAt: d.created_at
        }))
      })
    };

  } catch (error) {
    logger.error('Error in get approval handler', { error });
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
 * Lambda Handler: List approval requests
 * 
 * GET /api/approvals
 * Query params:
 *   - status: Filter by status (optional)
 *   - actionType: Filter by action type (optional)
 *   - limit: Number of results (default: 50, max: 100)
 *   - offset: Pagination offset (default: 0)
 * 
 * Requirements: 14.4
 */
export const listHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const segment = tracer.getSegment();
  const subsegment = segment?.addNewSubsegment('ListApprovalsHandler');

  try {
    // Extract user information from JWT
    // @ts-ignore
    const tenantId = event.requestContext.authorizer?.jwt?.claims?.['custom:tenant_id'] as string;
    // @ts-ignore
    const userId = event.requestContext.authorizer?.jwt?.claims?.sub as string;
    
    if (!tenantId || !userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized: Missing user information' })
      };
    }

    // Extract query parameters
    const params = event.queryStringParameters || {};
    const status = params.status;
    const actionType = params.actionType;
    const limit = Math.min(parseInt(params.limit || '50'), 100);
    const offset = parseInt(params.offset || '0');

    const { query } = await import('../shared/database');

    // Build dynamic query
    const conditions: string[] = ['ar.tenant_id = $1'];
    const values: any[] = [tenantId];
    let paramIndex = 2;

    // User can see approvals they requested or can approve
    conditions.push(`(ar.requested_by = $${paramIndex} OR $${paramIndex} = ANY(ar.approvers::text[]))`);
    values.push(userId);
    paramIndex++;

    if (status) {
      conditions.push(`ar.status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (actionType) {
      conditions.push(`ar.action_type = $${paramIndex}`);
      values.push(actionType);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Query approvals
    const approvalsResult = await query(
      `SELECT 
        ar.*,
        u.email as requester_email,
        u.full_name as requester_name,
        (SELECT COUNT(*) FROM alquimista_platform.approval_decisions 
         WHERE approval_id = ar.id AND decision = 'approve') as approval_count
      FROM alquimista_platform.approval_requests ar
      LEFT JOIN alquimista_platform.users u ON ar.requested_by = u.id
      WHERE ${whereClause}
      ORDER BY ar.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    // Count total
    const countResult = await query(
      `SELECT COUNT(*) as total
       FROM alquimista_platform.approval_requests ar
       WHERE ${whereClause}`,
      values
    );

    const total = parseInt(countResult.rows[0].total);

    subsegment?.close();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        approvals: approvalsResult.rows.map(a => ({
          id: a.id,
          requestedBy: a.requested_by,
          requesterEmail: a.requester_email,
          requesterName: a.requester_name,
          actionType: a.action_type,
          resourceType: a.resource_type,
          resourceId: a.resource_id,
          actionDetails: a.action_details,
          approvers: JSON.parse(a.approvers),
          requiredApprovals: a.required_approvals,
          approvalCount: parseInt(a.approval_count),
          status: a.status,
          expiresAt: a.expires_at,
          createdAt: a.created_at
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + approvalsResult.rows.length < total
        }
      })
    };

  } catch (error) {
    logger.error('Error in list approvals handler', { error });
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
 * Lambda Handler: Cancel approval request
 * 
 * DELETE /api/approvals/{id}
 * 
 * Requirements: 14.4
 */
export const cancelHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const segment = tracer.getSegment();
  const subsegment = segment?.addNewSubsegment('CancelApprovalHandler');

  try {
    // Extract approval ID from path
    const approvalId = event.pathParameters?.id;
    if (!approvalId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing approval ID' })
      };
    }

    // Extract user information from JWT
    // @ts-ignore
    const tenantId = event.requestContext.authorizer?.jwt?.claims?.['custom:tenant_id'] as string;
    // @ts-ignore
    const userId = event.requestContext.authorizer?.jwt?.claims?.sub as string;
    
    if (!tenantId || !userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized: Missing user information' })
      };
    }

    const { query } = await import('../shared/database');

    // Get approval request
    const approvalResult = await query(
      `SELECT * FROM alquimista_platform.approval_requests 
       WHERE id = $1 AND tenant_id = $2`,
      [approvalId, tenantId]
    );

    if (approvalResult.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Approval request not found' })
      };
    }

    const approval = approvalResult.rows[0];

    // Only requester can cancel
    if (approval.requested_by !== userId) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Only the requester can cancel this approval' })
      };
    }

    // Can only cancel pending approvals
    if (approval.status !== ApprovalStatus.PENDING) {
      return {
        statusCode: 409,
        body: JSON.stringify({ error: `Cannot cancel approval with status: ${approval.status}` })
      };
    }

    // Update status to cancelled
    await query(
      `UPDATE alquimista_platform.approval_requests SET status = $1 WHERE id = $2`,
      [ApprovalStatus.CANCELLED, approvalId]
    );

    // Publish event
    await publishApprovalEvent({
      approvalId,
      tenantId,
      eventType: 'approval.cancelled',
      details: {
        cancelledBy: userId,
        actionType: approval.action_type
      }
    });

    // Log audit entry
    const { logUserAction } = await import('./audit-log');
    await logUserAction({
      tenantId,
      userId,
      actionType: 'approval.cancelled',
      result: 'success',
      context: {
        approvalId,
        actionType: approval.action_type
      }
    });

    subsegment?.close();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        approvalId,
        status: ApprovalStatus.CANCELLED,
        message: 'Approval request cancelled successfully'
      })
    };

  } catch (error) {
    logger.error('Error in cancel approval handler', { error });
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
