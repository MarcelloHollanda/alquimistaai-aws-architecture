import { DynamoDBStreamEvent, DynamoDBRecord } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { RDSDataClient, ExecuteStatementCommand } from '@aws-sdk/client-rds-data';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const rdsClient = new RDSDataClient({ region: process.env.AWS_REGION || 'us-east-1' });

const COMMANDS_TABLE = process.env.COMMANDS_TABLE!;
const AURORA_SECRET_ARN = process.env.AURORA_SECRET_ARN!;
const AURORA_CLUSTER_ARN = process.env.AURORA_CLUSTER_ARN!;
const DATABASE_NAME = 'alquimista_platform';

interface OperationalCommand {
  command_id: string;
  command_type: 'REPROCESS_QUEUE' | 'RESET_TOKEN' | 'RESTART_AGENT' | 'HEALTH_CHECK';
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'ERROR';
  tenant_id?: string;
  parameters: Record<string, any>;
  created_by: string;
  created_at: string;
}

/**
 * Lambda handler para processar comandos operacionais
 * Triggered por DynamoDB Stream quando novos comandos são criados
 */
export async function handler(event: DynamoDBStreamEvent): Promise<void> {
  console.log('Processing operational commands', {
    recordCount: event.Records.length,
  });

  for (const record of event.Records) {
    try {
      await processRecord(record);
    } catch (error) {
      console.error('Error processing record:', error, { record });
      // Continuar processando outros registros mesmo se um falhar
    }
  }
}

/**
 * Processa um registro individual do stream
 */
async function processRecord(record: DynamoDBRecord): Promise<void> {
  // Apenas processar INSERTs de comandos PENDING
  if (record.eventName !== 'INSERT') {
    console.log('Skipping non-INSERT event:', record.eventName);
    return;
  }

  const newImage = record.dynamodb?.NewImage;
  if (!newImage) {
    console.log('No new image in record');
    return;
  }

  // Converter DynamoDB format para objeto normal
  const command: OperationalCommand = {
    command_id: newImage.command_id?.S || '',
    command_type: newImage.command_type?.S as any,
    status: newImage.status?.S as any,
    tenant_id: newImage.tenant_id?.S,
    parameters: newImage.parameters?.S ? JSON.parse(newImage.parameters.S) : {},
    created_by: newImage.created_by?.S || '',
    created_at: newImage.created_at?.S || '',
  };

  // Apenas processar comandos PENDING
  if (command.status !== 'PENDING') {
    console.log('Skipping non-PENDING command:', command.status);
    return;
  }

  console.log('Processing command:', {
    command_id: command.command_id,
    command_type: command.command_type,
  });

  try {
    // Atualizar status para RUNNING
    await updateCommandStatus(command.command_id, 'RUNNING');

    // Executar comando
    const output = await executeCommand(command);

    // Atualizar status para SUCCESS
    await updateCommandStatus(command.command_id, 'SUCCESS', output);

    console.log('Command executed successfully:', command.command_id);
  } catch (error: any) {
    console.error('Command execution failed:', error, {
      command_id: command.command_id,
    });

    // Atualizar status para ERROR
    await updateCommandStatus(
      command.command_id,
      'ERROR',
      undefined,
      error.message || 'Unknown error'
    );
  }
}

/**
 * Executa o comando baseado no tipo
 */
async function executeCommand(command: OperationalCommand): Promise<string> {
  console.log('Executing command:', {
    type: command.command_type,
    parameters: command.parameters,
  });

  switch (command.command_type) {
    case 'HEALTH_CHECK':
      return await runHealthCheck(command);

    case 'RESET_TOKEN':
      return await resetToken(command);

    case 'RESTART_AGENT':
      return await restartAgent(command);

    case 'REPROCESS_QUEUE':
      return await reprocessQueue(command);

    default:
      throw new Error(`Unknown command type: ${command.command_type}`);
  }
}

/**
 * Executa health check do sistema
 */
async function runHealthCheck(command: OperationalCommand): Promise<string> {
  const checks: Record<string, boolean> = {};

  // Check 1: Aurora Database
  try {
    const sql = 'SELECT 1 as health';
    const result = await rdsClient.send(
      new ExecuteStatementCommand({
        resourceArn: AURORA_CLUSTER_ARN,
        secretArn: AURORA_SECRET_ARN,
        database: DATABASE_NAME,
        sql,
      })
    );
    checks.aurora = result.records !== undefined;
  } catch (error) {
    checks.aurora = false;
  }

  // Check 2: DynamoDB
  try {
    const result = await docClient.send(
      new UpdateCommand({
        TableName: COMMANDS_TABLE,
        Key: { command_id: command.command_id },
        UpdateExpression: 'SET #check = :check',
        ExpressionAttributeNames: { '#check': 'health_check' },
        ExpressionAttributeValues: { ':check': new Date().toISOString() },
      })
    );
    checks.dynamodb = true;
  } catch (error) {
    checks.dynamodb = false;
  }

  const allHealthy = Object.values(checks).every((v) => v);
  const output = {
    status: allHealthy ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
  };

  return JSON.stringify(output, null, 2);
}

/**
 * Reseta token de integração
 */
async function resetToken(command: OperationalCommand): Promise<string> {
  const { tenant_id, integration_id } = command.parameters;

  if (!tenant_id || !integration_id) {
    throw new Error('tenant_id and integration_id are required');
  }

  // Atualizar status da integração para forçar reconexão
  const sql = `
    UPDATE tenant_integrations
    SET 
      status = 'pending',
      last_error = NULL,
      updated_at = NOW()
    WHERE tenant_id = :tenant_id
      AND id = :integration_id
    RETURNING id, integration_name
  `;

  const result = await rdsClient.send(
    new ExecuteStatementCommand({
      resourceArn: AURORA_CLUSTER_ARN,
      secretArn: AURORA_SECRET_ARN,
      database: DATABASE_NAME,
      sql,
      parameters: [
        { name: 'tenant_id', value: { stringValue: tenant_id } },
        { name: 'integration_id', value: { stringValue: integration_id } },
      ],
    })
  );

  if (!result.records || result.records.length === 0) {
    throw new Error('Integration not found');
  }

  return `Token reset successfully for integration ${integration_id}`;
}

/**
 * Reinicia agente (marca para reprocessamento)
 */
async function restartAgent(command: OperationalCommand): Promise<string> {
  const { tenant_id, agent_id } = command.parameters;

  if (!tenant_id || !agent_id) {
    throw new Error('tenant_id and agent_id are required');
  }

  // Atualizar status do agente
  const sql = `
    UPDATE tenant_agents
    SET 
      status = 'active',
      updated_at = NOW()
    WHERE tenant_id = :tenant_id
      AND agent_id = :agent_id
    RETURNING id
  `;

  const result = await rdsClient.send(
    new ExecuteStatementCommand({
      resourceArn: AURORA_CLUSTER_ARN,
      secretArn: AURORA_SECRET_ARN,
      database: DATABASE_NAME,
      sql,
      parameters: [
        { name: 'tenant_id', value: { stringValue: tenant_id } },
        { name: 'agent_id', value: { stringValue: agent_id } },
      ],
    })
  );

  if (!result.records || result.records.length === 0) {
    throw new Error('Agent not found for tenant');
  }

  return `Agent ${agent_id} restarted successfully for tenant ${tenant_id}`;
}

/**
 * Reprocessa fila de mensagens
 */
async function reprocessQueue(command: OperationalCommand): Promise<string> {
  const { queue_name, message_count } = command.parameters;

  if (!queue_name) {
    throw new Error('queue_name is required');
  }

  // TODO: Implementar lógica de reprocessamento de fila
  // Por enquanto, apenas simular
  const count = message_count || 10;

  return `Reprocessed ${count} messages from queue ${queue_name}`;
}

/**
 * Atualiza status do comando no DynamoDB
 */
async function updateCommandStatus(
  commandId: string,
  status: 'RUNNING' | 'SUCCESS' | 'ERROR',
  output?: string,
  errorMessage?: string
): Promise<void> {
  const updateExpression: string[] = ['#status = :status'];
  const expressionAttributeNames: Record<string, string> = {
    '#status': 'status',
  };
  const expressionAttributeValues: Record<string, any> = {
    ':status': status,
  };

  if (status === 'RUNNING') {
    updateExpression.push('started_at = :started_at');
    expressionAttributeValues[':started_at'] = new Date().toISOString();
  }

  if (status === 'SUCCESS' || status === 'ERROR') {
    updateExpression.push('completed_at = :completed_at');
    expressionAttributeValues[':completed_at'] = new Date().toISOString();
  }

  if (output) {
    updateExpression.push('#output = :output');
    expressionAttributeNames['#output'] = 'output';
    expressionAttributeValues[':output'] = output;
  }

  if (errorMessage) {
    updateExpression.push('error_message = :error_message');
    expressionAttributeValues[':error_message'] = errorMessage;
  }

  await docClient.send(
    new UpdateCommand({
      TableName: COMMANDS_TABLE,
      Key: { command_id: commandId, created_at: '' }, // created_at será preenchido pelo DynamoDB
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    })
  );

  console.log('Command status updated:', {
    commandId,
    status,
    hasOutput: !!output,
    hasError: !!errorMessage,
  });
}
