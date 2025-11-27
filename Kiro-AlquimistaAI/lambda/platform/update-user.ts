import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Pool } from 'pg';

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

interface UpdateUserRequest {
  name?: string;
  phone?: string;
  language?: string;
  timezone?: string;
}

/**
 * Handler para atualizar dados do usuário
 * Usuário só pode atualizar seus próprios dados
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const client = await pool.connect();
  
  try {
    // Obter userId dos path parameters
    const userId = event.pathParameters?.userId;
    
    if (!userId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'userId é obrigatório no path'
        })
      };
    }

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

    const body: UpdateUserRequest = JSON.parse(event.body);
    const { name, phone, language, timezone } = body;

    // Validar que pelo menos um campo foi fornecido
    if (!name && !phone && !language && !timezone) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Forneça pelo menos um campo para atualizar: name, phone, language, timezone'
        })
      };
    }

    // Obter cognito_sub do usuário autenticado (do token JWT)
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

    // Verificar se o usuário existe e se o cognito_sub corresponde
    const userCheck = await client.query(
      'SELECT id, cognito_sub, tenant_id FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Usuário não encontrado'
        })
      };
    }

    const user = userCheck.rows[0];

    // Validar permissão: usuário só pode atualizar seus próprios dados
    if (user.cognito_sub !== cognitoSub) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Você não tem permissão para atualizar este usuário'
        })
      };
    }

    // Construir query de atualização dinamicamente
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }

    if (phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(phone || null);
    }

    if (language) {
      updates.push(`language = $${paramCount++}`);
      values.push(language);
    }

    if (timezone) {
      updates.push(`timezone = $${paramCount++}`);
      values.push(timezone);
    }

    updates.push(`updated_at = NOW()`);
    values.push(userId);

    // Executar atualização
    const updateQuery = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, cognito_sub, tenant_id, email, name, phone, language, timezone, updated_at
    `;

    const result = await client.query(updateQuery, values);
    const updatedUser = result.rows[0];

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: updatedUser.id,
        cognitoSub: updatedUser.cognito_sub,
        tenantId: updatedUser.tenant_id,
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone,
        language: updatedUser.language,
        timezone: updatedUser.timezone,
        updatedAt: updatedUser.updated_at
      })
    };

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Erro ao atualizar usuário',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    };
  } finally {
    client.release();
  }
};
