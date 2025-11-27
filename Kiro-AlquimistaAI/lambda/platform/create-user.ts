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

interface CreateUserRequest {
  cognitoSub: string;
  tenantId: string;
  email: string;
  name: string;
  phone?: string;
  role: 'MASTER' | 'ADMIN' | 'OPERATIONAL' | 'READ_ONLY';
  language?: string;
  timezone?: string;
}

/**
 * Handler para criar novo usuário no banco de dados
 * Cria registro em users e user_roles
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

    const body: CreateUserRequest = JSON.parse(event.body);
    const {
      cognitoSub,
      tenantId,
      email,
      name,
      phone,
      role,
      language = 'pt-BR',
      timezone = 'America/Sao_Paulo'
    } = body;

    // Validações
    if (!cognitoSub || !tenantId || !email || !name || !role) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Campos obrigatórios: cognitoSub, tenantId, email, name, role'
        })
      };
    }

    // Validar role
    const validRoles = ['MASTER', 'ADMIN', 'OPERATIONAL', 'READ_ONLY'];
    if (!validRoles.includes(role)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: `Role inválido. Use: ${validRoles.join(', ')}`
        })
      };
    }

    // Validar formato de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Formato de e-mail inválido'
        })
      };
    }

    // Iniciar transação
    await client.query('BEGIN');

    // Verificar se tenant existe
    const tenantCheck = await client.query(
      'SELECT id FROM companies WHERE tenant_id = $1',
      [tenantId]
    );

    if (tenantCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Empresa não encontrada'
        })
      };
    }

    // Verificar se usuário já existe (por cognito_sub ou email)
    const userCheck = await client.query(
      'SELECT id FROM users WHERE cognito_sub = $1 OR email = $2',
      [cognitoSub, email]
    );

    if (userCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return {
        statusCode: 409,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Usuário já existe'
        })
      };
    }

    // Inserir usuário
    const userResult = await client.query(
      `INSERT INTO users (
        cognito_sub, tenant_id, email, name, phone, language, timezone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, cognito_sub, tenant_id, email, name, phone, language, timezone, created_at`,
      [cognitoSub, tenantId, email, name, phone || null, language, timezone]
    );

    const user = userResult.rows[0];

    // Inserir papel do usuário
    await client.query(
      `INSERT INTO user_roles (user_id, tenant_id, role)
      VALUES ($1, $2, $3)`,
      [user.id, tenantId, role]
    );

    // Commit da transação
    await client.query('COMMIT');

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        cognitoSub: user.cognito_sub,
        tenantId: user.tenant_id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role,
        language: user.language,
        timezone: user.timezone,
        createdAt: user.created_at
      })
    };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar usuário:', error);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Erro ao criar usuário',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    };
  } finally {
    client.release();
  }
};
