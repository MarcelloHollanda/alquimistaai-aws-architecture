import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Pool } from 'pg';
import { SecretsManagerClient, DeleteSecretCommand } from '@aws-sdk/client-secrets-manager';

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

interface DisconnectIntegrationRequest {
  tenantId: string;
  integrationName: string;
}

/**
 * Handler para desconectar integração externa
 * Remove credenciais do Secrets Manager e atualiza status no banco
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

    const body: DisconnectIntegrationRequest = JSON.parse(event.body);
    const { tenantId, integrationName } = body;

    // Validações
    if (!tenantId || !integrationName) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Campos obrigatórios: tenantId, integrationName'
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
          error: 'Apenas usuários Master ou Admin podem desconectar integrações'
        })
      };
    }

    // Buscar integração no banco
    const integrationResult = await client.query(
      'SELECT id, secrets_path FROM integrations WHERE tenant_id = $1 AND integration_name = $2',
      [tenantId, integrationName]
    );

    if (integrationResult.rows.length === 0) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Integração não encontrada'
        })
      };
    }

    const integration = integrationResult.rows[0];
    const secretName = integration.secrets_path;

    // Remover secret do Secrets Manager
    if (secretName) {
      try {
        await secretsClient.send(new DeleteSecretCommand({
          SecretId: secretName,
          ForceDeleteWithoutRecovery: false, // Permite recuperação por 30 dias
          RecoveryWindowInDays: 30
        }));
      } catch (error: any) {
        // Se o secret não existir, continuar mesmo assim
        if (error.name !== 'ResourceNotFoundException') {
          console.error('Erro ao deletar secret:', error);
          // Não falhar a operação se o secret não puder ser deletado
        }
      }
    }

    // Atualizar status no banco
    await client.query(
      `UPDATE integrations 
       SET status = 'DISCONNECTED',
           secrets_path = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [integration.id]
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        tenantId,
        integrationName,
        status: 'DISCONNECTED',
        message: 'Integração desconectada com sucesso'
      })
    };

  } catch (error) {
    console.error('Erro ao desconectar integração:', error);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Erro ao desconectar integração',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    };
  } finally {
    client.release();
  }
};
