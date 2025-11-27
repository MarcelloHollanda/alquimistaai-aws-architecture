// Clientes AWS configurados para o Micro Agente
// AlquimistaAI - Padrão Oficial

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { SQSClient } from '@aws-sdk/client-sqs';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { EventBridgeClient } from '@aws-sdk/client-eventbridge';

// Configuração comum para todos os clientes
const clientConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
};

// DynamoDB
export const dynamoClient = new DynamoDBClient(clientConfig);
export const docClient = DynamoDBDocumentClient.from(dynamoClient);

// SQS
export const sqsClient = new SQSClient(clientConfig);

// Secrets Manager
export const secretsClient = new SecretsManagerClient(clientConfig);

// EventBridge
export const eventBridgeClient = new EventBridgeClient(clientConfig);

// Configurações de ambiente
export const config = {
  tables: {
    contacts: process.env.CONTACTS_TABLE!,
    campaigns: process.env.CAMPAIGNS_TABLE!,
    messages: process.env.MESSAGES_TABLE!,
    interactions: process.env.INTERACTIONS_TABLE!,
    schedules: process.env.SCHEDULES_TABLE!,
  },
  queues: {
    messageQueue: process.env.MESSAGE_QUEUE_URL!,
    dlq: process.env.DLQ_URL!,
  },
  secrets: {
    whatsapp: process.env.WHATSAPP_SECRET_ARN!,
    email: process.env.EMAIL_SECRET_ARN!,
    calendar: process.env.CALENDAR_SECRET_ARN!,
  },
  environment: process.env.ENVIRONMENT as 'dev' | 'prod',
};
