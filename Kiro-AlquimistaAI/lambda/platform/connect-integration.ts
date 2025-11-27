import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Pool } from 'pg';
import { SecretsManagerClient, CreateSecretCommand, UpdateSecretCommand, DescribeSecretCommand } from '@aws-sdk/client-secrets-manager';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION || 'us-east-1' });

interface ConnectIntegrationRequest {
  tenantId: string;
  integrationName: string;
  credentials: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Handler para conectar integração externa
 * Armazena credenciais no Secrets Manager e atualiza status no banco
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const client = await pool.connect();
  
  try {
    // Parse do body
    if (!event.body) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Body da requisição é obrigatório'
        })
      };
    }

    const body: ConnectIntegrationRequest = JSON.parse(event.body);
    const { tenantId, integrationName, credentials, metadata } = body;

    // Validações
    if (!tenantId || !integrationName || !credentials) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Campos obrigatórios: tenantId, integrationName, credentials'
        })
      };
    }

    // Obter cognito_sub e papel do usuário autenticado
    const cognitoSub = event.requestContext.authorizer?.claims?.sub;
    
    if (!cognitoSub) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Usuário não autenticado'
        })
      };
    }

    // Verificar permissões (Master ou Admin)
    const roleCheck = await client.query(
      `SELECT ur.role 
       FROM users u
       INNER JOIN user_roles ur ON u.id = ur.user_id
       WHERE u.cognito_sub = $1 AND u.tenant_id = $2`,
      [cognitoSub, tenantId]
    );

    if (roleCheck.rows.length === 0) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Usuário não pertence a esta empresa'
        })
      };
    }

    const userRole = roleCheck.rows[0].role;
    if (userRole !== 'MASTER' && userRole !== 'ADMIN') {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Apenas usuários Master ou Admin podem conectar integrações'
        })
      };
    }

    // Definir path do secret
    const env = process.env.ENVIRONMENT || 'dev';
    const secretName = `/alquimista/${env}/${tenantId}/${integrationName}`;

    // Tentar criar ou atualizar secret
    try {
      // Verificar se secret já existe
      await secretsClient.send(new DescribeSecretCommand({ SecretId: secretName }));
      
      // Secret existe, atualizar
      await secretsClient.send(new UpdateSecretCommand({
        SecretId: secretName,
        SecretString: JSON.stringify(credentials)
      }));
    } catch (error: any) {
      if (error.name === 'ResourceNotFoundException') {
        // Secret não existe, criar
        await secretsClient.send(new CreateSecretCommand({
          Name: secretName,
          SecretString: JSON.stringify(credentials),
          Description: `Credenciais de ${integrationName} para tenant ${tenantId}`,
          Tags: [
            { Key: 'Project', Value: 'Alquimista' },
            { Key: 'Environment', Value: env },
            { Key: 'TenantId', Value: tenantId },
            { Key: 'Integration', Value: integrationName }
          ]
        }));
      } else {
        throw error;
      }
    }

    // Iniciar transação
    await client.query('BEGIN');

    // Verificar se integração já existe
    const integrationCheck = await client.query(
      'SELECT id FROM integrations WHERE tenant_id = $1 AND integration_name = $2',
      [tenantId, integrationName]
    );

    if (integrationCheck.rows.length > 0) {
      // Atualizar integração existente
      await client.query(
        `UPDATE integrations 
         SET status = 'CONNECTED', 
             secrets_path = $1, 
             metadata = $2,
             updated_at = NOW()
         WHERE tenant_id = $3 AND integration_name = $4`,
        [secretName, metadata ? JSON.stringify(metadata) : null, tenantId, integrationName]
      );
    } else {
      // Criar nova integração
      await client.query(
        `INSERT INTO integrations (tenant_id, integration_name, status, secrets_path, metadata)
         VALUES ($1, $2, 'CONNECTED', $3, $4)`,
        [tenantId, integrationName, secretName, metadata ? JSON.stringify(metadata) : null]
      );
    }

    // Commit da transação
    await client.query('COMMIT');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        tenantId,
        integrationName,
        status: 'CONNECTED',
        secretsPath: secretName
      })
    };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao conectar integração:', error);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Erro ao conectar integração',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    };
  } finally {
    client.release();
  }
};
