import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';

const logger = new Logger({ serviceName: 'alquimista-platform' });
const tracer = new Tracer({ serviceName: 'alquimista-platform' });
const eventBridge = tracer.captureAWSv3Client(new EventBridgeClient({}));

const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME!;

/**
 * Lambda Handler: Desativar agente para tenant
 * 
 * POST /api/agents/{id}/deactivate
 * Body: { reason?: string }
 * 
 * Requirements: 14.7
 */
export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const segment = tracer.getSegment();
  const subsegment = segment?.addNewSubsegment('DeactivateAgent');

  try {
    // Extrair agent ID dos path parameters
    const agentId = event.pathParameters?.id;
    
    if (!agentId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing agent ID' })
      };
    }

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

    // Validar permissões do usuário usando o sistema de permissões
    const { checkPermission, SubjectType, ResourceType, PermissionAction } = await import('./check-permissions');
    
    const permissionCheck = await checkPermission({
      subjectType: SubjectType.USER,
      subjectId: userId,
      resourceType: ResourceType.AGENT,
      resourceId: agentId,
      action: PermissionAction.MANAGE,
      context: {
        tenantId,
        timestamp: new Date(),
        metadata: {
          ipAddress: event.requestContext?.http?.sourceIp
        }
      }
    });

    if (!permissionCheck.allowed) {
      logger.warn('User does not have permission to deactivate agents', {
        userId,
        userRole,
        reason: permissionCheck.reason
      });
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: 'Forbidden: Insufficient permissions',
          reason: permissionCheck.reason
        })
      };
    }

    // Parse do body (opcional)
    let reason = 'User requested deactivation';
    if (event.body) {
      try {
        const body = JSON.parse(event.body);
        reason = body.reason || reason;
      } catch (error) {
        logger.warn('Invalid JSON body', { error });
      }
    }

    logger.info('Deactivating agent', {
      agentId,
      tenantId,
      userId,
      reason
    });

    // Importar função de query do banco de dados
    const { query, transaction } = await import('../shared/database');

    // Executar desativação em uma transação
    const result = await transaction(async (client) => {
      // 1. Validar que o agente existe e está ativo para este tenant
      const activationCheck = await client.query(
        `SELECT aa.id, aa.status, a.name, a.category
         FROM alquimista_platform.agent_activations aa
         JOIN alquimista_platform.agents a ON aa.agent_id = a.id
         WHERE aa.agent_id = $1 AND aa.tenant_id = $2`,
        [agentId, tenantId]
      );

      if (activationCheck.rows.length === 0) {
        throw new Error(`Agent with ID ${agentId} is not activated for this tenant`);
      }

      const activation = activationCheck.rows[0];

      if (activation.status === 'inactive') {
        throw new Error(`Agent ${activation.name} is already inactive for this tenant`);
      }

      // 2. Atualizar status em agent_activations para 'inactive'
      const deactivationId = `deactivation-${Date.now()}`;
      const timestamp = new Date().toISOString();

      await client.query(
        `UPDATE alquimista_platform.agent_activations
         SET status = 'inactive',
             deactivated_at = $1,
             updated_at = $1
         WHERE agent_id = $2 AND tenant_id = $3`,
        [timestamp, agentId, tenantId]
      );

      return { deactivationId, timestamp, agent: activation };
    });

    const { deactivationId, timestamp, agent } = result;

    // Criar trace_id para auditoria
    const { v4: uuidv4 } = await import('uuid');
    const traceId = uuidv4();

    // Registrar ação no audit log
    const { logAgentAction } = await import('./audit-log');
    await logAgentAction({
      traceId,
      tenantId,
      userId,
      agentId,
      actionType: 'agent.deactivated',
      result: 'success',
      context: {
        deactivationId,
        reason,
        agentName: agent.name,
        agentCategory: agent.category,
        ipAddress: event.requestContext?.http?.sourceIp,
        userAgent: event.requestContext?.http?.userAgent
      }
    });

    // Publicar evento de desativação no EventBridge
    const putEventsCommand = new PutEventsCommand({
      Entries: [
        {
          Source: 'alquimista.platform',
          DetailType: 'agent.deactivated',
          Detail: JSON.stringify({
            deactivationId,
            agentId,
            tenantId,
            userId,
            reason,
            timestamp,
            traceId
          }),
          EventBusName: EVENT_BUS_NAME
        }
      ]
    });

    await eventBridge.send(putEventsCommand);

    subsegment?.addAnnotation('agentId', agentId);
    subsegment?.addAnnotation('tenantId', tenantId);
    subsegment?.addMetadata('reason', reason);
    subsegment?.close();

    logger.info('Agent deactivated successfully', {
      deactivationId,
      agentId,
      agentName: agent.name,
      tenantId
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        deactivationId,
        agent: {
          id: agentId,
          name: agent.name,
          category: agent.category
        },
        tenantId,
        reason,
        deactivatedAt: timestamp,
        message: `Agent ${agent.name} deactivated successfully`
      })
    };

  } catch (error) {
    logger.error('Error deactivating agent', { error });
    subsegment?.addError(error as Error);
    subsegment?.close();

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Registrar falha no audit log
    try {
      const { v4: uuidv4 } = await import('uuid');
      const traceId = uuidv4();
      const { logAgentAction } = await import('./audit-log');
      
      // Extrair informações do evento
      const agentId = event.pathParameters?.id;
      // @ts-ignore
      const tenantId = event.requestContext.authorizer?.jwt?.claims?.['custom:tenant_id'] as string;
      // @ts-ignore
      const userId = event.requestContext.authorizer?.jwt?.claims?.sub as string;

      if (agentId && tenantId && userId) {
        await logAgentAction({
          traceId,
          tenantId,
          userId,
          agentId,
          actionType: 'agent.deactivated',
          result: 'failure',
          context: {
            ipAddress: event.requestContext?.http?.sourceIp,
            userAgent: event.requestContext?.http?.userAgent
          },
          errorMessage
        });
      }
    } catch (auditError) {
      logger.error('Failed to create audit log for error', { auditError });
    }

    // Handle specific error cases
    if (errorMessage.includes('not activated for this tenant')) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'Agent not found',
          message: errorMessage
        })
      };
    }

    if (errorMessage.includes('already inactive')) {
      return {
        statusCode: 409,
        body: JSON.stringify({
          error: 'Agent already inactive',
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
