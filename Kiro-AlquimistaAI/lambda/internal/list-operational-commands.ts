import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { extractAuthContext, requireInternal } from '../shared/authorization-middleware';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const COMMANDS_TABLE = process.env.COMMANDS_TABLE!;

/**
 * GET /internal/operations/commands
 * Lista comandos operacionais executados (apenas usuários internos)
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('GET /internal/operations/commands', { path: event.path });

  try {
    const context = extractAuthContext(event);
    requireInternal(context);

    const params = event.queryStringParameters || {};
    const status = params.status || 'all';
    const commandType = params.command_type;
    const tenantId = params.tenant_id;
    const limit = parseInt(params.limit || '50');
    const offset = parseInt(params.offset || '0');

    const result = await listCommands({
      status,
      commandType,
      tenantId,
      limit,
      offset,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=60',
      },
      body: JSON.stringify(result),
    };
  } catch (error: any) {
    console.error('Error in GET /internal/operations/commands:', error);

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

async function listCommands(filters: any) {
  let commands: any[] = [];

  // Se filtrar por status específico, usar GSI
  if (filters.status !== 'all') {
    const queryResult = await docClient.send(
      new QueryCommand({
        TableName: COMMANDS_TABLE,
        IndexName: 'status-created_at-index',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': filters.status,
        },
        ScanIndexForward: false, // Ordem decrescente por created_at
        Limit: filters.limit + filters.offset,
      })
    );

    commands = queryResult.Items || [];
  }
  // Se filtrar por tenant_id, usar GSI
  else if (filters.tenantId) {
    const queryResult = await docClient.send(
      new QueryCommand({
        TableName: COMMANDS_TABLE,
        IndexName: 'tenant_id-created_at-index',
        KeyConditionExpression: 'tenant_id = :tenant_id',
        ExpressionAttributeValues: {
          ':tenant_id': filters.tenantId,
        },
        ScanIndexForward: false,
        Limit: filters.limit + filters.offset,
      })
    );

    commands = queryResult.Items || [];
  }
  // Caso contrário, fazer scan (menos eficiente, mas necessário para "all")
  else {
    const scanResult = await docClient.send(
      new ScanCommand({
        TableName: COMMANDS_TABLE,
        Limit: filters.limit + filters.offset,
      })
    );

    commands = scanResult.Items || [];
  }

  // Filtrar por command_type se especificado
  if (filters.commandType) {
    commands = commands.filter((cmd) => cmd.command_type === filters.commandType);
  }

  // Ordenar por created_at desc
  commands.sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Aplicar paginação
  const total = commands.length;
  const paginatedCommands = commands.slice(filters.offset, filters.offset + filters.limit);

  // Formatar resposta
  const formattedCommands = paginatedCommands.map((cmd) => ({
    command_id: cmd.command_id,
    command_type: cmd.command_type,
    status: cmd.status,
    tenant_id: cmd.tenant_id || null,
    tenant_name: null, // TODO: Buscar nome do tenant se necessário
    created_by: cmd.created_by,
    created_at: cmd.created_at,
    started_at: cmd.started_at || null,
    completed_at: cmd.completed_at || null,
    output: cmd.output || null,
    error_message: cmd.error_message || null,
  }));

  return {
    commands: formattedCommands,
    total,
  };
}
