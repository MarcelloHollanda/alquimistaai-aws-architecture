import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';

const logger = new Logger({ serviceName: 'alquimista-platform' });
const tracer = new Tracer({ serviceName: 'alquimista-platform' });
const eventBridge = tracer.captureAWSv3Client(new EventBridgeClient({}));

const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME!;

/**
 * Lambda Handler: Ativar agente para tenant
 * 
 * POST /api/agents/{id}/activate
 * Body: { permissions?: string[] }
 * 
 * Requirements: 14.7
 */
export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const segment = tracer.getSegment();
  const subsegment = segment?.addNewSubsegment('ActivateAgent');

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
      logger.warn('User does not have permission to activate agents', {
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
    let permissions: string[] = [];
    if (event.body) {
      try {
        const body = JSON.parse(event.body);
        permissions = body.permissions || [];
      } catch (error) {
        logger.warn('Invalid JSON body', { error });
      }
    }

    logger.info('Activating agent', {
      agentId,
      tenantId,
      userId,
      permissions
    });

    // Importar função de query do banco de dados
    const { query, transaction } = await import('../shared/database');

    // Executar ativação em uma transação
    const result = await transaction(async (client) => {
      // 1. Validar que o agente existe no catálogo
      const agentCheck = await client.query(
        `SELECT id, name, category, status FROM alquimista_platform.agents WHERE id = $1`,
        [agentId]
      );

      if (agentCheck.rows.length === 0) {
        throw new Error(`Agent with ID ${agentId} not found in catalog`);
      }

      const agent = agentCheck.rows[0];

      if (agent.status !== 'active') {
        throw new Error(`Agent ${agent.name} is not available (status: ${agent.status})`);
      }

      // 2. Verificar se já está ativo para este tenant
      const activationCheck = await client.query(
        `SELECT id, status FROM alquimista_platform.agent_activations 
         WHERE agent_id = $1 AND tenant_id = $2`,
        [agentId, tenantId]
      );

      if (activationCheck.rows.length > 0 && activationCheck.rows[0].status === 'active') {
        throw new Error(`Agent ${agent.name} is already active for this tenant`);
      }

      // 3. Criar ou atualizar registro em agent_activations
      const activationId = `activation-${Date.now()}`;
      const timestamp = new Date().toISOString();

      if (activationCheck.rows.length > 0) {
        // Reativar agente existente
        await client.query(
          `UPDATE alquimista_platform.agent_activations
           SET status = 'active',
               activated_at = $1,
               updated_at = $1
           WHERE agent_id = $2 AND tenant_id = $3`,
          [timestamp, agentId, tenantId]
        );
      } else {
        // Criar nova ativação
        await client.query(
          `INSERT INTO alquimista_platform.agent_activations
           (id, agent_id, tenant_id, status, activated_at, created_at, updated_at)
           VALUES ($1, $2, $3, 'active', $4, $4, $4)`,
          [activationId, agentId, tenantId, timestamp]
        );
      }

      return { activationId, timestamp, agent };
    });

    const { activationId, timestamp, agent } = result;

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
      actionType: 'agent.activated',
      result: 'success',
      context: {
        activationId,
        permissions,
        agentName: agent.name,
        agentCategory: agent.category,
        ipAddress: event.requestContext?.http?.sourceIp,
        userAgent: event.requestContext?.http?.userAgent
      }
    });

    // Publicar evento de ativação no EventBridge
    const putEventsCommand = new PutEventsCommand({
      Entries: [
        {
          Source: 'alquimista.platform',
          DetailType: 'agent.activated',
          Detail: JSON.stringify({
            activationId,
            agentId,
            tenantId,
            userId,
            permissions,
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
    subsegment?.addMetadata('permissions', permissions);
    subsegment?.close();

    logger.info('Agent activated successfully', {
      activationId,
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
        activationId,
        agent: {
          id: agentId,
          name: agent.name,
          category: agent.category
        },
        tenantId,
        permissions,
        activatedAt: timestamp,
        message: `Agent ${agent.name} activated successfully`
      })
    };

  } catch (error) {
    logger.error('Error activating agent', { error });
    subsegment?.addError(error as Error);
    subsegment?.close();

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Registrar falha no audit log
    try {
      const { v4: uuidv4 } = await import('uuid');
      const traceId = uuidv4();
      const { logAgentAction } = await import('./audit-log');
      
      // Extrair informações do evento (podem não estar disponíveis se erro ocorreu antes)
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
          actionType: 'agent.activated',
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
    if (errorMessage.includes('not found in catalog')) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'Agent not found',
          message: errorMessage
        })
      };
    }

    if (errorMessage.includes('not available')) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Agent not available',
          message: errorMessage
        })
      };
    }

    if (errorMessage.includes('already active')) {
      return {
        statusCode: 409,
        body: JSON.stringify({
          error: 'Agent already active',
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
