// Handler: POST /api/commercial/contact
// Processa solicitações de contato comercial para Fibonacci e SubNúcleos

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { query } from '../shared/database';
import { createLogger } from '../shared/logger';
import { classifyError } from '../shared/error-handler';
import { CommercialRequest } from './types/billing';
import * as AWS from 'aws-sdk';

const logger = createLogger('commercial-contact');
const ses = new AWS.SES({ region: process.env.AWS_REGION || 'us-east-1' });

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Processando solicitação comercial', { path: event.path });

    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Body é obrigatório' }),
      };
    }

    const data: CommercialRequest = JSON.parse(event.body);

    // Validações
    if (!data.companyName || !data.contactName || !data.email || !data.whatsapp) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Campos obrigatórios faltando' }),
      };
    }

    // Registrar solicitação no banco
    const result = await query(`
      INSERT INTO commercial_requests (
        tenant_id,
        company_name,
        cnpj,
        contact_name,
        email,
        whatsapp,
        selected_agents,
        selected_subnucleos,
        message,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
      RETURNING id, created_at
    `, [
      data.tenantId || null,
      data.companyName,
      data.cnpj || null,
      data.contactName,
      data.email,
      data.whatsapp,
      JSON.stringify(data.selectedAgents || []),
      JSON.stringify(data.selectedSubnucleos || []),
      data.message || ''
    ]);

    const requestId = result.rows[0].id;

    // Enviar e-mail para equipe comercial
    await sendCommercialEmail(data, requestId);

    // TODO: Integração WhatsApp (opcional)
    // await sendWhatsAppNotification(data);

    logger.info('Solicitação comercial registrada', { requestId });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        message: 'Sua solicitação foi enviada. Nossa equipe comercial entrará em contato por e-mail ou WhatsApp em breve.',
        requestId
      }),
    };
  } catch (error) {
    logger.error('Erro ao processar solicitação comercial', error as Error);
    
    const classification = classifyError(error as Error);
    return {
      statusCode: classification.type === 'transient' ? 503 : 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Erro ao processar solicitação comercial',
        shouldRetry: classification.shouldRetry
      }),
    };
  }
};

async function sendCommercialEmail(data: CommercialRequest, requestId: string): Promise<void> {
  const agentsList = data.selectedAgents?.length 
    ? data.selectedAgents.map(a => `  - ${a}`).join('\n')
    : '  Nenhum agente selecionado';

  const subnucleosList = data.selectedSubnucleos?.length
    ? data.selectedSubnucleos.map(s => `  - ${s}`).join('\n')
    : '  Nenhum SubNúcleo selecionado';

  const emailBody = `
Nova Solicitação Comercial - AlquimistaAI

ID da Solicitação: ${requestId}

=== DADOS DA EMPRESA ===
Empresa: ${data.companyName}
CNPJ: ${data.cnpj || 'Não informado'}

=== CONTATO ===
Nome: ${data.contactName}
E-mail: ${data.email}
WhatsApp: ${data.whatsapp}

=== INTERESSE ===

Agentes AlquimistaAI:
${agentsList}

SubNúcleos Fibonacci:
${subnucleosList}

=== MENSAGEM DO CLIENTE ===
${data.message || 'Nenhuma mensagem adicional'}

---
Responda este cliente o mais breve possível.
  `.trim();

  const params: AWS.SES.SendEmailRequest = {
    Source: process.env.COMMERCIAL_EMAIL_FROM || 'noreply@alquimista.ai',
    Destination: {
      ToAddresses: [process.env.COMMERCIAL_EMAIL_TO || 'alquimistafibonacci@gmail.com']
    },
    Message: {
      Subject: {
        Data: `[AlquimistaAI] Nova Solicitação Comercial - ${data.companyName}`,
        Charset: 'UTF-8'
      },
      Body: {
        Text: {
          Data: emailBody,
          Charset: 'UTF-8'
        }
      }
    }
  };

  await ses.sendEmail(params).promise();
  logger.info('E-mail comercial enviado', { requestId });
}
