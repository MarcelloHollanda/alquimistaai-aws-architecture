import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { RDSDataClient, ExecuteStatementCommand } from '@aws-sdk/client-rds-data';
import { extractAuthContext, requireInternal } from '../shared/authorization-middleware';
import { v4 as uuidv4 } from 'uuid';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const rdsClient = new RDSDataClient({ region: process.env.AWS_REGION || 'us-east-1' });

const COMMANDS_TABLE = process.env.COMMANDS_TABLE!;
const AURORA_SECRET_ARN = process.env.AURORA_SECRET_ARN!;
const AURORA_CLUSTER_ARN = process.env.AURORA_CLUSTER_ARN!;
const DATABASE_NAME = 'alquimista_platform';

const VALID_COMMAND_TYPES = ['REPROCESS_QUEUE', 'RESET_TOKEN', 'RESTART_AGENT', 'HEALTH_CHECK'];

/**
 * POST /internal/operations/commands
 * Cria um novo comando operacional (apenas usuários internos)
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('POST /internal/operations/commands', { path: event.path });

  try {
    const context = extractAuthContext(event);
    requireInternal(context);

    if (!event.body) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Request body is required',
        }),
      };
    }

    const body = JSON.parse(event.body);
    const { command_type, tenant_id, parameters } = body;

    // Validar command_type
    if (!command_type || !VALID_COMMAND_TYPES.includes(command_type)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Bad Request',
          message: `Invalid command_type. Must be one of: ${VALID_COMMAND_TYPES.join(', ')}`,
        }),
      };
    }

    // Validar parameters
    if (!parameters || typeof parameters !== 'object') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'parameters must be an object',
        }),
      };
    }

    const commandId = uuidv4();
    const createdAt = new Date().toISOString();
    const ttl = Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60; // 90 dias

    // Criar comando no DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: COMMANDS_TABLE,
        Item: {
          command_id: commandId,
          created_at: createdAt,
          tenant_id: tenant_id || null,
          command_type,
          status: 'PENDING',
          created_by: context.sub,
          parameters: JSON.stringify(parameters),
          ttl,
        },
      })
    );

    // Registrar evento operacional no Aurora
    await registerOperationalEvent({
      eventType: 'command_created',
      tenantId: tenant_id,
      userId: context.sub,
      userEmail: context.email,
      resourceType: 'operational_command',
      resourceId: commandId,
      action: `CREATE_${command_type}`,
      status: 'success',
      details: { command_type, parameters },
    });

    console.log('Command created successfully:', { commandId, command_type });

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command_id: commandId,
        status: 'PENDING',
        created_at: createdAt,
        message: 'Comando criado com sucesso. Processamento iniciado.',
      }),
    };
  } catch (error: any) {
    console.error('Error in POST /internal/operations/commands:', error);

    const statusCode = error.message.includes('Forbidden') ? 403 : 500;

    return {
      statusCode,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: statusCode === 403 ? 'Forbidden' : 'Internal Server Error',
        message: error.message,
      }),
    };
  }
}

async function registerOperationalEvent(event: {
  eventType: string;
  tenantId?: string;
  userId: string;
  userEmail: string;
  resourceType: string;
  resourceId: string;
  action: string;
  status: string;
  details: any;
}) {
  const sql = `
    INSERT INTO operational_events (
      event_type,
      event_category,
      tenant_id,
      user_id,
      user_email,
      resource_type,
      resource_id,
      action,
      status,
      details
    ) VALUES (
      :event_type,
      'command',
      :tenant_id,
      :user_id,
      :user_email,
      :resource_type,
      :resource_id,
      :action,
      :status,
      :details::jsonb
    )
  `;

  await rdsClient.send(
    new ExecuteStatementCommand({
      resourceArn: AURORA_CLUSTER_ARN,
      secretArn: AURORA_SECRET_ARN,
      database: DATABASE_NAME,
      sql,
      parameters: [
        { name: 'event_type', value: { stringValue: event.eventType } },
        { name: 'tenant_id', value: event.tenantId ? { stringValue: event.tenantId } : { isNull: true } },
        { name: 'user_id', value: { stringValue: event.userId } },
        { name: 'user_email', value: { stringValue: event.userEmail } },
        { name: 'resource_type', value: { stringValue: event.resourceType } },
        { name: 'resource_id', value: { stringValue: event.resourceId } },
        { name: 'action', value: { stringValue: event.action } },
        { name: 'status', value: { stringValue: event.status } },
        { name: 'details', value: { stringValue: JSON.stringify(event.details) } },
      ],
    })
  );
}
