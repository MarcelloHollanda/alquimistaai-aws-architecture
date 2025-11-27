/**
 * Handler: Atualizar empresa (tenant)
 * Rota: PUT /api/companies/{tenantId}
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  port: 5432,
  max: 20,
});

interface UpdateCompanyRequest {
  name?: string;
  legalName?: string;
  cnpj?: string;
  segment?: string;
  logoUrl?: string;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'PUT,OPTIONS',
  };

  try {
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'PUT') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Método não permitido' }),
      };
    }

    const tenantId = event.pathParameters?.tenantId;
    if (!tenantId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'tenantId é obrigatório' }),
      };
    }

    // TODO: Validar permissões (Master ou Admin) via token JWT
    // const userRole = await getUserRoleFromToken(event.headers.Authorization);
    // if (!['MASTER', 'ADMIN'].includes(userRole)) {
    //   return { statusCode: 403, headers, body: JSON.stringify({ error: 'Sem permissão' }) };
    // }

    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Body é obrigatório' }),
      };
    }

    const body: UpdateCompanyRequest = JSON.parse(event.body);

    // Construir query dinâmica
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (body.name) {
      updates.push(`name = $${paramIndex++}`);
      values.push(body.name);
    }
    if (body.legalName) {
      updates.push(`legal_name = $${paramIndex++}`);
      values.push(body.legalName);
    }
    if (body.cnpj) {
      updates.push(`cnpj = $${paramIndex++}`);
      values.push(body.cnpj);
    }
    if (body.segment) {
      updates.push(`segment = $${paramIndex++}`);
      values.push(body.segment);
    }
    if (body.logoUrl) {
      updates.push(`logo_url = $${paramIndex++}`);
      values.push(body.logoUrl);
    }

    if (updates.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Nenhum campo para atualizar' }),
      };
    }

    values.push(tenantId);
    const query = `
      UPDATE companies
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE tenant_id = $${paramIndex}
      RETURNING id, tenant_id, name, legal_name, cnpj, segment, logo_url, updated_at
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Empresa não encontrada' }),
      };
    }

    const company = result.rows[0];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        company: {
          id: company.id,
          tenantId: company.tenant_id,
          name: company.name,
          legalName: company.legal_name,
          cnpj: company.cnpj,
          segment: company.segment,
          logoUrl: company.logo_url,
          updatedAt: company.updated_at,
        },
      }),
    };
  } catch (error: any) {
    console.error('Erro ao atualizar empresa:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erro interno do servidor', message: error.message }),
    };
  }
};
