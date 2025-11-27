import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { withSimpleErrorHandling } from '../shared/error-handler';
import { Logger } from '../shared/logger';
import { query, getPool } from '../shared/database';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { createWhatsAppMCPServer } from '../../mcp-integrations/servers/whatsapp';
import { 
  validateConsent, 
  detectDescadastroKeywords, 
  handleDescadastro as lgpdHandleDescadastro 
} from '../shared/lgpd-compliance';

// Use AWS SDK v2 for Lambda and Bedrock (v3 not available in dependencies)
const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();
const bedrockRuntime = new AWS.BedrockRuntime({ region: process.env.AWS_REGION || 'us-east-1' });

// Initialize AWS clients
const eventBridgeClient = new EventBridgeClient({});
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || 'fibonacci-bus-dev';
const SENTIMENT_LAMBDA_ARN = process.env.SENTIMENT_LAMBDA_ARN || '';

// Initialize WhatsApp MCP Server
const whatsappServer = createWhatsAppMCPServer({
  timeout: 30000,
  maxRetries: 3
});

/**
 * Webhook payload schema validation
 */
const WebhookPayloadSchema = z.object({
  from: z.string().min(1, 'From is required'), // Phone number or email
  message: z.string().min(1, 'Message is required'),
  channel: z.enum(['whatsapp', 'email']),
  messageId: z.string().optional(),
  timestamp: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;

/**
 * Lead data from database
 */
interface Lead {
  id: string;
  tenantId: string;
  empresa: string;
  contato: string;
  telefone?: string;
  email?: string;
  status: string;
  segmento?: string;
  metadata: Record<string, any>;
}

/**
 * Interaction history
 */
interface Interacao {
  id: string;
  leadId: string;
  tipo: 'enviado' | 'recebido';
  canal: string;
  mensagem: string;
  sentimento?: string;
  intensidade?: number;
  createdAt: Date;
  metadata: Record<string, any>;
}

/**
 * Sentiment analysis result
 */
interface SentimentResult {
  sentiment: 'positivo' | 'neutro' | 'negativo' | 'irritado';
  score: number; // 0-100
  shouldBlock: boolean;
  blockReason?: string;
}

/**
 * LLM response generation result
 */
interface LLMResponse {
  message: string;
  tone: string;
  nextAction: 'agendamento' | 'nutricao' | 'descarte' | 'escalate_human';
  confidence: number;
}

/**
 * Agente de Atendimento - Nigredo
 * 
 * Responsável por:
 * - Receber webhook do WhatsApp/Email
 * - Identificar lead no banco de dados
 * - Consultar histórico de interações
 * - Chamar Agente de Análise de Sentimento (invocação síncrona)
 * - Receber classificação emocional (positivo, neutro, negativo, irritado)
 * - Ajustar tom da resposta baseado no sentimento
 * - Usar LLM (Bedrock ou similar) para gerar resposta
 * - Aplicar prompt template com contexto do lead
 * - Validar resposta contra políticas de marca
 * - Enviar resposta via MCP whatsapp
 * - Atualizar histórico de interações
 * - Decidir próximo passo (agendamento, nutrição, descarte)
 * - Publicar evento apropriado
 * 
 * Requirements: 11.6, 11.7
 */
export const handler = withSimpleErrorHandling(
  async (event: APIGatewayProxyEvent, context: Context, logger: Logger): Promise<APIGatewayProxyResult> => {
    const traceId = uuidv4();
    logger.setTraceId(traceId);

    logger.info('Agente de Atendimento iniciado', {
      functionName: context.functionName
    });

    try {
      // Step 1: Parse and validate webhook payload
      const payload = parseWebhookPayload(event, logger);

      logger.info('Webhook recebido', {
        from: payload.from,
        channel: payload.channel,
        messageLength: payload.message.length
      });

      // Step 2: Identify lead in database
      const lead = await identificarLead(payload, logger);

      if (!lead) {
        logger.warn('Lead não encontrado', {
          from: payload.from,
          channel: payload.channel
        });

        return {
          statusCode: 404,
          body: JSON.stringify({
            message: 'Lead not found',
            traceId
          })
        };
      }

      // Update logger context with lead and tenant information
      logger.updateContext({ 
        leadId: lead.id,
        tenantId: lead.tenantId 
      });

      logger.info('Lead identificado', {
        empresa: lead.empresa
      });

      // LGPD: Validate consent before processing
      const db = await getPool();
      const hasConsent = await validateConsent(db, lead.id);
      
      if (!hasConsent) {
        logger.warn('Lead sem consentimento LGPD', {
          leadId: lead.id,
          empresa: lead.empresa
        });

        // Send message requesting consent
        const consentMessage = `Olá! Para continuar nossa conversa, precisamos do seu consentimento para processar seus dados conforme a LGPD. Você autoriza? Responda SIM para continuar.`;
        
        if (lead.telefone && payload.channel === 'whatsapp') {
          await whatsappServer.sendMessage({
            to: lead.telefone,
            message: consentMessage,
            idempotencyKey: `consent-request-${lead.id}-${Date.now()}`
          });
        }

        return {
          statusCode: 200,
          body: JSON.stringify({
            message: 'Consent required',
            leadId: lead.id,
            traceId
          })
        };
      }

      // Step 3: Fetch interaction history
      const historico = await consultarHistorico(lead.id, logger);

      logger.info('Histórico consultado', {
        interactionCount: historico.length
      });

      // Step 4: Register incoming message
      await registrarInteracao(
        lead.id,
        'recebido',
        payload.channel,
        payload.message,
        null,
        null,
        traceId,
        logger,
        payload.metadata
      );

      // Step 5: Analyze sentiment
      const sentimentResult = await analisarSentimento(payload.message, logger, traceId);

      logger.info('Sentimento analisado', {
        leadId: lead.id,
        sentiment: sentimentResult.sentiment,
        score: sentimentResult.score,
        shouldBlock: sentimentResult.shouldBlock,
        traceId
      });

      // Step 6: Handle descadastro if detected
      if (sentimentResult.shouldBlock) {
        await handleDescadastro(lead, sentimentResult.blockReason || 'Descadastro solicitado', logger, traceId);

        return {
          statusCode: 200,
          body: JSON.stringify({
            message: 'Descadastro processed',
            leadId: lead.id,
            traceId
          })
        };
      }

      // Step 7: Generate response using LLM
      const llmResponse = await gerarResposta(
        lead,
        historico,
        payload.message,
        sentimentResult,
        logger,
        traceId
      );

      logger.info('Resposta gerada', {
        leadId: lead.id,
        tone: llmResponse.tone,
        nextAction: llmResponse.nextAction,
        confidence: llmResponse.confidence,
        traceId
      });

      // Step 8: Validate response against brand policies
      const validatedResponse = validarResposta(llmResponse.message, logger);

      // Step 9: Send response via MCP
      await enviarResposta(
        lead,
        validatedResponse,
        payload.channel,
        logger,
        traceId
      );

      // Step 10: Register outgoing message
      await registrarInteracao(
        lead.id,
        'enviado',
        payload.channel,
        validatedResponse,
        sentimentResult.sentiment,
        sentimentResult.score,
        traceId,
        logger,
        {
          tone: llmResponse.tone,
          nextAction: llmResponse.nextAction,
          confidence: llmResponse.confidence
        }
      );

      // Step 11: Update lead status
      await atualizarStatusLead(lead.id, sentimentResult, llmResponse, logger);

      // Step 12: Publish appropriate event based on next action
      await publicarEvento(lead, llmResponse, sentimentResult, traceId, logger);

      logger.info('Agente de Atendimento concluído', {
        leadId: lead.id,
        nextAction: llmResponse.nextAction,
        traceId
      });

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Message processed successfully',
          leadId: lead.id,
          nextAction: llmResponse.nextAction,
          traceId
        })
      };

    } catch (error) {
      logger.error('Erro ao processar webhook', error as Error, {
        traceId
      });

      return {
        statusCode: 500,
        body: JSON.stringify({
          message: 'Internal server error',
          error: (error as Error).message,
          traceId
        })
      };
    }
  }
);

/**
 * Parse and validate webhook payload
 */
function parseWebhookPayload(event: APIGatewayProxyEvent, logger: Logger): WebhookPayload {
  logger.debug('Parsing webhook payload');

  if (!event.body) {
    throw new Error('Missing request body');
  }

  const body = JSON.parse(event.body);

  // Validate schema
  const validationResult = WebhookPayloadSchema.safeParse(body);

  if (!validationResult.success) {
    logger.error('Invalid webhook payload', new Error('Validation failed'), {
      errors: validationResult.error.errors
    });
    throw new Error(`Invalid payload: ${validationResult.error.errors.map(e => e.message).join(', ')}`);
  }

  return validationResult.data;
}

/**
 * Identify lead in database by phone or email
 */
async function identificarLead(
  payload: WebhookPayload,
  logger: Logger
): Promise<Lead | null> {
  logger.debug('Identificando lead', {
    from: payload.from,
    channel: payload.channel
  });

  try {
    let result;

    if (payload.channel === 'whatsapp') {
      // Search by phone number
      result = await query(
        `SELECT 
          id, tenant_id, empresa, contato, telefone, email, status, segmento, metadata
        FROM nigredo_leads.leads
        WHERE telefone = $1
        ORDER BY updated_at DESC
        LIMIT 1`,
        [payload.from]
      );
    } else {
      // Search by email
      result = await query(
        `SELECT 
          id, tenant_id, empresa, contato, telefone, email, status, segmento, metadata
        FROM nigredo_leads.leads
        WHERE email = $1
        ORDER BY updated_at DESC
        LIMIT 1`,
        [payload.from]
      );
    }

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      id: row.id,
      tenantId: row.tenant_id,
      empresa: row.empresa,
      contato: row.contato,
      telefone: row.telefone,
      email: row.email,
      status: row.status,
      segmento: row.segmento,
      metadata: row.metadata || {}
    };

  } catch (error) {
    logger.error('Erro ao identificar lead', error as Error);
    throw error;
  }
}

/**
 * Fetch interaction history for lead
 */
async function consultarHistorico(
  leadId: string,
  logger: Logger
): Promise<Interacao[]> {
  logger.debug('Consultando histórico de interações', {
    leadId
  });

  try {
    const result = await query(
      `SELECT 
        id, lead_id, tipo, canal, mensagem, sentimento, intensidade, created_at, metadata
      FROM nigredo_leads.interacoes
      WHERE lead_id = $1
      ORDER BY created_at DESC
      LIMIT 10`,
      [leadId]
    );

    const historico: Interacao[] = result.rows.map(row => ({
      id: row.id,
      leadId: row.lead_id,
      tipo: row.tipo,
      canal: row.canal,
      mensagem: row.mensagem,
      sentimento: row.sentimento,
      intensidade: row.intensidade,
      createdAt: new Date(row.created_at),
      metadata: row.metadata || {}
    }));

    logger.debug('Histórico consultado', {
      leadId,
      count: historico.length
    });

    return historico;

  } catch (error) {
    logger.error('Erro ao consultar histórico', error as Error, {
      leadId
    });
    throw error;
  }
}

/**
 * Analyze sentiment by invoking Sentiment Agent Lambda
 */
async function analisarSentimento(
  message: string,
  logger: Logger,
  traceId: string
): Promise<SentimentResult> {
  logger.debug('Analisando sentimento', {
    messageLength: message.length,
    traceId
  });

  try {
    // Invoke Sentiment Agent Lambda synchronously
    const params = {
      FunctionName: SENTIMENT_LAMBDA_ARN,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify({
        text: message,
        language: 'pt'
      })
    };

    const response = await lambda.invoke(params).promise();

    if (!response.Payload) {
      throw new Error('Empty response from Sentiment Agent');
    }

    const payload = JSON.parse(response.Payload.toString());

    // Map AWS Comprehend sentiment to our format
    const sentimentMap: Record<string, 'positivo' | 'neutro' | 'negativo' | 'irritado'> = {
      'POSITIVE': 'positivo',
      'NEUTRAL': 'neutro',
      'NEGATIVE': 'negativo',
      'MIXED': 'negativo' // Treat mixed as negative for safety
    };

    // Determine if it's "irritado" based on negative score and keywords
    let sentiment = sentimentMap[payload.sentiment] || 'neutro';
    
    if (sentiment === 'negativo' && payload.score > 80) {
      sentiment = 'irritado';
    }

    const result: SentimentResult = {
      sentiment,
      score: payload.score,
      shouldBlock: payload.shouldBlock || false,
      blockReason: payload.blockReason
    };

    logger.debug('Sentimento analisado', {
      sentiment: result.sentiment,
      score: result.score,
      shouldBlock: result.shouldBlock,
      traceId
    });

    return result;

  } catch (error) {
    logger.error('Erro ao analisar sentimento', error as Error, {
      traceId
    });

    // Return neutral sentiment on error to avoid blocking the flow
    return {
      sentiment: 'neutro',
      score: 50,
      shouldBlock: false
    };
  }
}

/**
 * Handle descadastro (LGPD compliance)
 * Uses the centralized LGPD compliance module
 */
async function handleDescadastro(
  lead: Lead,
  reason: string,
  logger: Logger,
  traceId: string
): Promise<void> {
  logger.info('Processando descadastro via LGPD module', {
    leadId: lead.id,
    reason,
    traceId
  });

  try {
    // Use the centralized LGPD compliance module
    const db = await getPool();
    const result = await lgpdHandleDescadastro(db, lead.id, reason);

    if (!result.success) {
      throw new Error(`Descadastro failed: ${result.message}`);
    }

    logger.info('Descadastro processado com sucesso', {
      leadId: lead.id,
      actionsPerformed: result.actionsPerformed,
      traceId
    });

    // Send confirmation message
    const confirmationMessage = result.message;
    
    if (lead.telefone) {
      await whatsappServer.sendMessage({
        to: lead.telefone,
        message: confirmationMessage,
        idempotencyKey: `descadastro-${lead.id}-${Date.now()}`
      });
    }

    // Publish descadastro event
    await eventBridgeClient.send(new PutEventsCommand({
      Entries: [{
        Source: 'nigredo.atendimento',
        DetailType: 'atendimento.descadastro',
        Detail: JSON.stringify({
          leadId: lead.id,
          tenantId: lead.tenantId,
          reason,
          actionsPerformed: result.actionsPerformed,
          traceId,
          timestamp: new Date().toISOString()
        }),
        EventBusName: EVENT_BUS_NAME
      }]
    }));

  } catch (error) {
    logger.error('Erro ao processar descadastro', error as Error, {
      leadId: lead.id,
      traceId
    });
    throw error;
  }
}

/**
 * Generate response using LLM (Bedrock)
 */
async function gerarResposta(
  lead: Lead,
  historico: Interacao[],
  mensagemLead: string,
  sentimentResult: SentimentResult,
  logger: Logger,
  traceId: string
): Promise<LLMResponse> {
  logger.debug('Gerando resposta com LLM', {
    leadId: lead.id,
    sentiment: sentimentResult.sentiment,
    traceId
  });

  try {
    // Determine tone based on sentiment
    const tone = determinarTom(sentimentResult.sentiment);

    // Build prompt with context
    const prompt = construirPrompt(lead, historico, mensagemLead, tone);

    logger.debug('Prompt construído', {
      leadId: lead.id,
      promptLength: prompt.length,
      tone,
      traceId
    });

    // Call Bedrock (using Claude 3 Haiku for cost optimization)
    const modelId = 'anthropic.claude-3-haiku-20240307-v1:0';
    
    const requestBody = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 500,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    };

    const params = {
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(requestBody)
    };

    const response = await bedrockRuntime.invokeModel(params).promise();

    if (!response.body) {
      throw new Error('Empty response from Bedrock');
    }

    const responseBody = JSON.parse(response.body.toString());
    const message = responseBody.content[0].text;

    // Determine next action based on message content and sentiment
    const nextAction = determinarProximoPasso(message, sentimentResult, historico);

    // Calculate confidence based on sentiment score
    const confidence = calculateConfidence(sentimentResult.score, historico.length);

    logger.debug('Resposta gerada com sucesso', {
      leadId: lead.id,
      messageLength: message.length,
      nextAction,
      confidence,
      traceId
    });

    return {
      message,
      tone,
      nextAction,
      confidence
    };

  } catch (error) {
    logger.error('Erro ao gerar resposta com LLM', error as Error, {
      leadId: lead.id,
      traceId
    });

    // Fallback to template response
    return {
      message: gerarRespostaFallback(sentimentResult.sentiment),
      tone: determinarTom(sentimentResult.sentiment),
      nextAction: 'nutricao',
      confidence: 50
    };
  }
}

/**
 * Determine tone based on sentiment
 */
function determinarTom(sentiment: string): string {
  const toneMap: Record<string, string> = {
    'positivo': 'entusiasmado e proativo',
    'neutro': 'profissional e informativo',
    'negativo': 'empático e compreensivo',
    'irritado': 'calmo, respeitoso e conciliador'
  };

  return toneMap[sentiment] || 'profissional e informativo';
}

/**
 * Build LLM prompt with context
 */
function construirPrompt(
  lead: Lead,
  historico: Interacao[],
  mensagemLead: string,
  tone: string
): string {
  // Build interaction history summary
  const historicoTexto = historico
    .slice(0, 5) // Last 5 interactions
    .reverse() // Chronological order
    .map(i => `${i.tipo === 'enviado' ? 'Você' : lead.contato}: ${i.mensagem}`)
    .join('\n');

  const prompt = `Você é um consultor comercial profissional representando uma empresa de tecnologia.

CONTEXTO DO LEAD:
- Empresa: ${lead.empresa}
- Contato: ${lead.contato}
- Segmento: ${lead.segmento || 'Não especificado'}

HISTÓRICO DE CONVERSAS:
${historicoTexto || 'Primeira interação'}

ÚLTIMA MENSAGEM DO LEAD:
"${mensagemLead}"

INSTRUÇÕES:
1. Responda de forma ${tone}
2. Mantenha postura profissional e consultiva
3. NÃO mencione que você é um robô ou IA
4. Foque em entender as necessidades do lead
5. Seja conciso (máximo 3 parágrafos)
6. Use linguagem natural e brasileira
7. Se o lead demonstrar interesse, sugira agendar uma conversa
8. Se o lead tiver objeções, seja empático e ofereça valor

POLÍTICAS DA MARCA:
- Sempre respeite o tempo do lead
- Não seja insistente ou agressivo
- Foque em resolver problemas, não em vender
- Use emojis com moderação (máximo 2 por mensagem)

Gere uma resposta apropriada:`;

  return prompt;
}

/**
 * Determine next action based on message and sentiment
 */
function determinarProximoPasso(
  message: string,
  sentimentResult: SentimentResult,
  historico: Interacao[]
): 'agendamento' | 'nutricao' | 'descarte' | 'escalate_human' {
  const messageLower = message.toLowerCase();

  // Check for scheduling keywords
  const schedulingKeywords = [
    'agendar',
    'reunião',
    'conversar',
    'ligar',
    'call',
    'meeting',
    'horário',
    'disponibilidade'
  ];

  if (schedulingKeywords.some(keyword => messageLower.includes(keyword))) {
    return 'agendamento';
  }

  // Check sentiment
  if (sentimentResult.sentiment === 'irritado') {
    return 'escalate_human';
  }

  if (sentimentResult.sentiment === 'negativo' && historico.length > 3) {
    return 'descarte';
  }

  if (sentimentResult.sentiment === 'positivo' && historico.length >= 2) {
    return 'agendamento';
  }

  // Default to nurturing
  return 'nutricao';
}

/**
 * Calculate confidence score
 */
function calculateConfidence(sentimentScore: number, interactionCount: number): number {
  // Base confidence on sentiment score
  let confidence = sentimentScore;

  // Adjust based on interaction count
  if (interactionCount >= 3) {
    confidence = Math.min(100, confidence + 10);
  }

  if (interactionCount >= 5) {
    confidence = Math.min(100, confidence + 10);
  }

  return Math.round(confidence);
}

/**
 * Generate fallback response (when LLM fails)
 */
function gerarRespostaFallback(sentiment: string): string {
  const fallbackResponses: Record<string, string> = {
    'positivo': 'Que ótimo! Fico feliz em poder ajudar. Podemos agendar uma conversa para discutir como podemos apoiar sua empresa?',
    'neutro': 'Obrigado pela sua mensagem. Estou aqui para ajudar. Poderia me contar um pouco mais sobre o que você está buscando?',
    'negativo': 'Entendo sua preocupação. Estamos aqui para ajudar da melhor forma possível. Poderia me contar mais sobre o que não está funcionando para você?',
    'irritado': 'Peço desculpas se causamos algum incômodo. Sua satisfação é muito importante para nós. Como posso ajudar a resolver isso?'
  };

  return fallbackResponses[sentiment] || fallbackResponses['neutro'];
}

/**
 * Validate response against brand policies
 */
function validarResposta(message: string, logger: Logger): string {
  logger.debug('Validando resposta contra políticas da marca');

  let validatedMessage = message;

  // Remove any mentions of being AI/bot
  const aiKeywords = [
    'inteligência artificial',
    'ia',
    'robô',
    'bot',
    'automação',
    'sistema automatizado',
    'assistente virtual'
  ];

  for (const keyword of aiKeywords) {
    const regex = new RegExp(keyword, 'gi');
    if (regex.test(validatedMessage)) {
      logger.warn('Resposta contém menção a AI/bot, removendo', {
        keyword
      });
      // Replace with more natural language
      validatedMessage = validatedMessage.replace(regex, 'nossa equipe');
    }
  }

  // Limit emoji usage (max 2)
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
  const emojis = validatedMessage.match(emojiRegex) || [];
  
  if (emojis.length > 2) {
    logger.warn('Resposta contém muitos emojis, limitando', {
      count: emojis.length
    });
    // Keep only first 2 emojis
    let emojiCount = 0;
    validatedMessage = validatedMessage.replace(emojiRegex, (match) => {
      emojiCount++;
      return emojiCount <= 2 ? match : '';
    });
  }

  // Ensure message is not too long (max 1000 characters for WhatsApp)
  if (validatedMessage.length > 1000) {
    logger.warn('Resposta muito longa, truncando', {
      originalLength: validatedMessage.length
    });
    validatedMessage = validatedMessage.substring(0, 997) + '...';
  }

  return validatedMessage.trim();
}

/**
 * Send response via MCP
 */
async function enviarResposta(
  lead: Lead,
  message: string,
  channel: string,
  logger: Logger,
  traceId: string
): Promise<void> {
  logger.debug('Enviando resposta', {
    leadId: lead.id,
    channel,
    messageLength: message.length,
    traceId
  });

  try {
    if (channel === 'whatsapp' && lead.telefone) {
      // Send via WhatsApp
      const idempotencyKey = `atendimento-${lead.id}-${Date.now()}`;
      
      const response = await whatsappServer.sendMessage({
        to: lead.telefone,
        message,
        idempotencyKey
      });

      logger.info('Resposta enviada via WhatsApp', {
        leadId: lead.id,
        messageId: response.messageId,
        status: response.status,
        traceId
      });

    } else if (channel === 'email' && lead.email) {
      // Send via Email (future implementation)
      logger.info('Resposta enviada via Email (simulado)', {
        leadId: lead.id,
        traceId
      });

    } else {
      throw new Error(`Canal não suportado ou lead sem contato: ${channel}`);
    }

  } catch (error) {
    logger.error('Erro ao enviar resposta', error as Error, {
      leadId: lead.id,
      channel,
      traceId
    });
    throw error;
  }
}

/**
 * Register interaction in database
 */
async function registrarInteracao(
  leadId: string,
  tipo: 'enviado' | 'recebido',
  canal: string,
  mensagem: string,
  sentimento: string | null,
  intensidade: number | null,
  traceId: string,
  logger: Logger,
  metadata?: Record<string, any>
): Promise<void> {
  logger.debug('Registrando interação', {
    leadId,
    tipo,
    canal,
    traceId
  });

  try {
    await query(
      `INSERT INTO nigredo_leads.interacoes (
        id, lead_id, tipo, canal, mensagem, sentimento, intensidade,
        trace_id, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [
        uuidv4(),
        leadId,
        tipo,
        canal,
        mensagem.substring(0, 1000), // Limit size
        sentimento,
        intensidade,
        traceId,
        JSON.stringify(metadata || {})
      ]
    );

    logger.debug('Interação registrada', {
      leadId,
      tipo,
      traceId
    });

  } catch (error) {
    logger.error('Erro ao registrar interação', error as Error, {
      leadId,
      traceId
    });
    throw error;
  }
}

/**
 * Update lead status
 */
async function atualizarStatusLead(
  leadId: string,
  sentimentResult: SentimentResult,
  llmResponse: LLMResponse,
  logger: Logger
): Promise<void> {
  logger.debug('Atualizando status do lead', {
    leadId,
    nextAction: llmResponse.nextAction
  });

  try {
    let newStatus = 'respondeu';

    if (llmResponse.nextAction === 'agendamento') {
      newStatus = 'interessado';
    } else if (llmResponse.nextAction === 'descarte') {
      newStatus = 'descartado';
    }

    await query(
      `UPDATE nigredo_leads.leads
      SET 
        status = $1,
        metadata = jsonb_set(
          jsonb_set(
            jsonb_set(metadata, '{ultimoAtendimento}', to_jsonb(NOW()::text)),
            '{ultimoSentimento}', to_jsonb($2::text)
          ),
          '{proximoPasso}', to_jsonb($3::text)
        ),
        updated_at = NOW()
      WHERE id = $4`,
      [newStatus, sentimentResult.sentiment, llmResponse.nextAction, leadId]
    );

    logger.debug('Status do lead atualizado', {
      leadId,
      newStatus
    });

  } catch (error) {
    logger.error('Erro ao atualizar status do lead', error as Error, {
      leadId
    });
    throw error;
  }
}

/**
 * Publish appropriate event based on next action
 */
async function publicarEvento(
  lead: Lead,
  llmResponse: LLMResponse,
  sentimentResult: SentimentResult,
  traceId: string,
  logger: Logger
): Promise<void> {
  logger.debug('Publicando evento', {
    leadId: lead.id,
    nextAction: llmResponse.nextAction,
    traceId
  });

  try {
    let detailType = 'atendimento.completed';
    
    if (llmResponse.nextAction === 'agendamento') {
      detailType = 'atendimento.schedule_requested';
    } else if (llmResponse.nextAction === 'escalate_human') {
      detailType = 'atendimento.escalate_human';
    } else if (llmResponse.nextAction === 'descarte') {
      detailType = 'atendimento.disqualified';
    }

    const command = new PutEventsCommand({
      Entries: [{
        Source: 'nigredo.atendimento',
        DetailType: detailType,
        Detail: JSON.stringify({
          leadId: lead.id,
          tenantId: lead.tenantId,
          empresa: lead.empresa,
          nextAction: llmResponse.nextAction,
          sentiment: sentimentResult.sentiment,
          sentimentScore: sentimentResult.score,
          confidence: llmResponse.confidence,
          tone: llmResponse.tone,
          metadata: {
            contato: lead.contato,
            segmento: lead.segmento
          },
          traceId,
          timestamp: new Date().toISOString()
        }),
        EventBusName: EVENT_BUS_NAME
      }]
    });

    const response = await eventBridgeClient.send(command);

    logger.info('Evento publicado', {
      eventBusName: EVENT_BUS_NAME,
      detailType,
      leadId: lead.id,
      failedEntryCount: response.FailedEntryCount || 0,
      traceId
    });

    if (response.FailedEntryCount && response.FailedEntryCount > 0) {
      logger.error('Falha ao publicar evento', new Error('EventBridge failed'), {
        failedEntries: response.Entries,
        traceId
      });
    }

  } catch (error) {
    logger.error('Erro ao publicar evento no EventBridge', error as Error, {
      traceId
    });
    throw error;
  }
}
