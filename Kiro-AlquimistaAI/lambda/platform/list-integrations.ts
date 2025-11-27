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
 * Handler para listar integrações do tenant
 * Retorna lista com status de cada integração
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const client = await pool.connect();
  
  try {
    // Obter tenantId dos query parameters
    const tenantId = event.queryStringParameters?.tenantId;
    
    if (!tenantId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'tenantId é obrigatório como query parameter'
        })
      };
    }

    // Obter cognito_sub do usuário autenticado
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

    // Verificar se usuário pertence ao tenant
    const userCheck = await client.query(
      'SELECT id FROM users WHERE cognito_sub = $1 AND tenant_id = $2',
      [cognitoSub, tenantId]
    );

    if (userCheck.rows.length === 0) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Você não tem permissão para visualizar integrações desta empresa'
        })
      };
    }

    // Buscar integrações do tenant
    const result = await client.query(
      `SELECT 
        id,
        integration_name,
        status,
        metadata,
        created_at,
        updated_at
       FROM integrations
       WHERE tenant_id = $1
       ORDER BY integration_name ASC`,
      [tenantId]
    );

    // Lista de integrações disponíveis (pode ser expandida)
    const availableIntegrations = [
      {
        name: 'google-calendar',
        displayName: 'Google Calendar',
        description: 'Sincronize reuniões e eventos com Google Calendar',
        category: 'calendar'
      },
      {
        name: 'google-meet',
        displayName: 'Google Meet',
        description: 'Crie e gerencie reuniões no Google Meet',
        category: 'video'
      },
      {
        name: 'whatsapp-business',
        displayName: 'WhatsApp Business',
        description: 'Envie mensagens via WhatsApp Business API',
        category: 'messaging'
      },
      {
        name: 'sendgrid',
        displayName: 'SendGrid',
        description: 'Envie e-mails transacionais e marketing',
        category: 'email'
      },
      {
        name: 'stripe',
        displayName: 'Stripe',
        description: 'Processe pagamentos e gerencie assinaturas',
        category: 'payment'
      },
      {
        name: 'hubspot',
        displayName: 'HubSpot',
        description: 'Sincronize leads e contatos com HubSpot CRM',
        category: 'crm'
      },
      {
        name: 'salesforce',
        displayName: 'Salesforce',
        description: 'Integre com Salesforce CRM',
        category: 'crm'
      },
      {
        name: 'slack',
        displayName: 'Slack',
        description: 'Envie notificações para canais do Slack',
        category: 'messaging'
      }
    ];

    // Mapear integrações conectadas
    const connectedIntegrations = new Map(
      result.rows.map(row => [
        row.integration_name,
        {
          id: row.id,
          status: row.status,
          metadata: row.metadata,
          connectedAt: row.created_at,
          updatedAt: row.updated_at
        }
      ])
    );

    // Combinar integrações disponíveis com status de conexão
    const integrations = availableIntegrations.map(integration => {
      const connected = connectedIntegrations.get(integration.name);
      
      return {
        name: integration.name,
        displayName: integration.displayName,
        description: integration.description,
        category: integration.category,
        status: connected?.status || 'DISCONNECTED',
        metadata: connected?.metadata || null,
        connectedAt: connected?.connectedAt || null,
        updatedAt: connected?.updatedAt || null
      };
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId,
        integrations,
        total: integrations.length,
        connected: integrations.filter(i => i.status === 'CONNECTED').length
      })
    };

  } catch (error) {
    console.error('Erro ao listar integrações:', error);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Erro ao listar integrações',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    };
  } finally {
    client.release();
  }
};
