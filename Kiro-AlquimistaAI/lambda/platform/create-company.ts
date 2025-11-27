/**
 * Handler: Criar empresa (tenant)
 * Rota: POST /api/companies
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Pool } from 'pg';

// Configuração do pool de conexões
const pool = new Pool({
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  port: 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

interface CreateCompanyRequest {
  name: string;
  legalName?: string;
  cnpj: string;
  segment: string;
}

interface CreateCompanyResponse {
  tenantId: string;
  company: {
    id: string;
    tenantId: string;
    name: string;
    legalName?: string;
    cnpj: string;
    segment: string;
    createdAt: string;
  };
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
  };

  try {
    // Validar método
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Método não permitido' }),
      };
    }

    // Parse do body
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Body é obrigatório' }),
      };
    }

    const body: CreateCompanyRequest = JSON.parse(event.body);

    // Validar campos obrigatórios
    if (!body.name || !body.cnpj || !body.segment) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Campos obrigatórios: name, cnpj, segment',
        }),
      };
    }

    // Validar formato do CNPJ (básico)
    const cnpjClean = body.cnpj.replace(/\D/g, '');
    if (cnpjClean.length !== 14) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'CNPJ inválido' }),
      };
    }

    // Verificar se CNPJ já existe
    const checkQuery = 'SELECT id FROM companies WHERE cnpj = $1';
    const checkResult = await pool.query(checkQuery, [body.cnpj]);

    if (checkResult.rows.length > 0) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: 'CNPJ já cadastrado' }),
      };
    }

    // Inserir empresa
    const insertQuery = `
      INSERT INTO companies (name, legal_name, cnpj, segment)
      VALUES ($1, $2, $3, $4)
      RETURNING id, tenant_id, name, legal_name, cnpj, segment, created_at
    `;

    const insertResult = await pool.query(insertQuery, [
      body.name,
      body.legalName || null,
      body.cnpj,
      body.segment,
    ]);

    const company = insertResult.rows[0];

    const response: CreateCompanyResponse = {
      tenantId: company.tenant_id,
      company: {
        id: company.id,
        tenantId: company.tenant_id,
        name: company.name,
        legalName: company.legal_name,
        cnpj: company.cnpj,
        segment: company.segment,
        createdAt: company.created_at,
      },
    };

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(response),
    };
  } catch (error: any) {
    console.error('Erro ao criar empresa:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Erro interno do servidor',
        message: error.message,
      }),
    };
  }
};
