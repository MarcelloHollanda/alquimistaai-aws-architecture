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

/**
 * Handler para buscar dados completos do usuário
 * Inclui dados da empresa e papel do usuário
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const client = await pool.connect();
  
  try {
    // Obter userId ou cognitoSub dos path/query parameters
    const userId = event.pathParameters?.userId;
    const cognitoSub = event.queryStringParameters?.cognitoSub;
    
    if (!userId && !cognitoSub) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Forneça userId no path ou cognitoSub como query parameter'
        })
      };
    }

    // Construir query baseado no parâmetro fornecido
    let query: string;
    let params: any[];

    if (userId) {
      query = `
        SELECT 
          u.id,
          u.cognito_sub,
          u.tenant_id,
          u.email,
          u.name,
          u.phone,
          u.language,
          u.timezone,
          u.created_at,
          u.updated_at,
          c.name as company_name,
          c.legal_name as company_legal_name,
          c.cnpj as company_cnpj,
          c.segment as company_segment,
          c.logo_url as company_logo_url,
          ur.role as user_role
        FROM users u
        INNER JOIN companies c ON u.tenant_id = c.tenant_id
        LEFT JOIN user_roles ur ON u.id = ur.user_id AND u.tenant_id = ur.tenant_id
        WHERE u.id = $1
      `;
      params = [userId];
    } else {
      query = `
        SELECT 
          u.id,
          u.cognito_sub,
          u.tenant_id,
          u.email,
          u.name,
          u.phone,
          u.language,
          u.timezone,
          u.created_at,
          u.updated_at,
          c.name as company_name,
          c.legal_name as company_legal_name,
          c.cnpj as company_cnpj,
          c.segment as company_segment,
          c.logo_url as company_logo_url,
          ur.role as user_role
        FROM users u
        INNER JOIN companies c ON u.tenant_id = c.tenant_id
        LEFT JOIN user_roles ur ON u.id = ur.user_id AND u.tenant_id = ur.tenant_id
        WHERE u.cognito_sub = $1
      `;
      params = [cognitoSub];
    }

    const result = await client.query(query, params);

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Usuário não encontrado'
        })
      };
    }

    const user = result.rows[0];

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: {
          id: user.id,
          cognitoSub: user.cognito_sub,
          tenantId: user.tenant_id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          language: user.language,
          timezone: user.timezone,
          role: user.user_role,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        },
        company: {
          tenantId: user.tenant_id,
          name: user.company_name,
          legalName: user.company_legal_name,
          cnpj: user.company_cnpj,
          segment: user.company_segment,
          logoUrl: user.company_logo_url
        }
      })
    };

  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Erro ao buscar usuário',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    };
  } finally {
    client.release();
  }
};
