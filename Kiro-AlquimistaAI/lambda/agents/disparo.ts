import { EventBridgeEvent, Context } from 'aws-lambda';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { withSimpleErrorHandling } from '../shared/error-handler';
import { Logger } from '../shared/logger';
import { query } from '../shared/database';
import { v4 as uuidv4 } from 'uuid';
import { createWhatsAppMCPServer } from '../../mcp-integrations/servers/whatsapp';

// Initialize AWS clients
const eventBridgeClient = new EventBridgeClient({});
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || 'fibonacci-bus-dev';

// Initialize WhatsApp MCP Server
const whatsappServer = createWhatsAppMCPServer({
  timeout: 30000,
  maxRetries: 3
});

/**
 * Campanha ativa do banco de dados
 */
interface CampanhaAtiva {
  id: string;
  tenantId: string;
  nome: string;
  segmento: string;
  atividade: string;
  canal: 'whatsapp' | 'email' | 'multi';
  mensagens: {
    topo: Array<{ tipo: string; variacao: string; conteudo: string; cta: string }>;
    meio: Array<{ tipo: string; variacao: string; conteudo: string; cta: string }>;
    fundo: Array<{ tipo: string; variacao: string; conteudo: string; cta: string }>;
  };
  ritmo: {
    horarios: string[];
    frequencia: string;
    intervaloMinimo: number;
  };
  leadIds: string[];
  metadata: Record<string, any>;
}

/**
 * Lead pendente de disparo
 */
interface LeadPendente {
  id: string;
  tenantId: string;
  empresa: string;
  contato: string;
  telefone?: string;
  email?: string;
  status: string;
  ultimoDisparo?: Date;
  estagioFunil: 'topo' | 'meio' | 'fundo';
  variacaoTeste: 'A' | 'B' | 'C';
}

/**
 * Rate limiting por tenant
 */
interface TenantRateLimit {
  tenantId: string;
  mensagensHora: number;
  mensagensDia: number;
  ultimaResetHora: Date;
  ultimaResetDia: Date;
}

// Cache de rate limiting em memória (em produção, usar Redis ou DynamoDB)
const rateLimitCache = new Map<string, TenantRateLimit>();

/**
 * Agente de Disparo - Nigredo
 * 
 * Responsável por:
 * - Consultar campanhas ativas
 * - Verificar horário comercial (08h-18h, seg-sex)
 * - Aplicar rate limiting por tenant (100 msg/hora, 500 msg/dia)
 * - Adicionar variações sutis de horário (±5 min)
 * - Enviar mensagens via MCP WhatsApp ou Email
 * - Usar idempotency key para evitar duplicatas
 * - Atualizar status do lead
 * - Registrar envio na tabela nigredo_leads.interacoes
 * - Publicar evento nigredo.disparo.sent
 * 
 * Requirements: 11.5
 */
export const handler = withSimpleErrorHandling(
  async (event: EventBridgeEvent<string, any>, context: Context, logger: Logger) => {
    const traceId = uuidv4();
    logger.setTraceId(traceId);

    logger.info('Agente de Disparo iniciado', {
      functionName: context.functionName,
      traceId
    });

    // Step 1: Verificar horário comercial
    if (!isHorarioComercial()) {
      logger.info('Fora do horário comercial, pulando disparo', {
        horaAtual: new Date().toISOString(),
        traceId
      });
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Fora do horário comercial',
          disparosRealizados: 0
        })
      };
    }

    // Step 2: Consultar campanhas ativas
    const campanhasAtivas = await consultarCampanhasAtivas(logger);

    if (campanhasAtivas.length === 0) {
      logger.info('Nenhuma campanha ativa encontrada', { traceId });
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Nenhuma campanha ativa',
          disparosRealizados: 0
        })
      };
    }

    logger.info('Campanhas ativas encontradas', {
      count: campanhasAtivas.length,
      traceId
    });

    let totalDisparos = 0;
    let totalErros = 0;

    // Step 3: Processar cada campanha
    for (const campanha of campanhasAtivas) {
      try {
        const resultado = await processarCampanha(campanha, logger, traceId);
        totalDisparos += resultado.disparos;
        totalErros += resultado.erros;
      } catch (error) {
        logger.error('Erro ao processar campanha', error as Error, {
          campanhaId: campanha.id,
          traceId
        });
        totalErros++;
      }
    }

    logger.info('Agente de Disparo concluído', {
      campanhasProcessadas: campanhasAtivas.length,
      totalDisparos,
      totalErros,
      traceId
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        campanhasProcessadas: campanhasAtivas.length,
        disparosRealizados: totalDisparos,
        erros: totalErros
      })
    };
  }
);

/**
 * Verificar se está em horário comercial (08h-18h, seg-sex)
 */
function isHorarioComercial(): boolean {
  const now = new Date();
  
  // Converter para timezone de São Paulo (UTC-3)
  const saoPauloTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  
  const diaSemana = saoPauloTime.getDay(); // 0 = Domingo, 6 = Sábado
  const hora = saoPauloTime.getHours();

  // Verificar se é dia útil (segunda a sexta)
  if (diaSemana === 0 || diaSemana === 6) {
    return false;
  }

  // Verificar se está entre 08h e 18h
  if (hora < 8 || hora >= 18) {
    return false;
  }

  return true;
}

/**
 * Consultar campanhas ativas do banco de dados
 */
async function consultarCampanhasAtivas(logger: Logger): Promise<CampanhaAtiva[]> {
  logger.info('Consultando campanhas ativas');

  try {
    const result = await query(
      `SELECT 
        id, tenant_id, nome, segmento, atividade, canal,
        mensagens, ritmo, lead_ids, metadata
      FROM nigredo_leads.campanhas
      WHERE status = 'ativa'
      ORDER BY created_at DESC`,
      []
    );

    const campanhas: CampanhaAtiva[] = result.rows.map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      nome: row.nome,
      segmento: row.segmento,
      atividade: row.atividade,
      canal: row.canal,
      mensagens: row.mensagens,
      ritmo: row.ritmo,
      leadIds: row.lead_ids,
      metadata: row.metadata || {}
    }));

    logger.info('Campanhas ativas consultadas', {
      count: campanhas.length
    });

    return campanhas;
  } catch (error) {
    logger.error('Erro ao consultar campanhas ativas', error as Error);
    throw error;
  }
}

/**
 * Processar uma campanha
 */
async function processarCampanha(
  campanha: CampanhaAtiva,
  logger: Logger,
  traceId: string
): Promise<{ disparos: number; erros: number }> {
  logger.info('Processando campanha', {
    campanhaId: campanha.id,
    nome: campanha.nome,
    leadCount: campanha.leadIds.length,
    traceId
  });

  // Step 1: Verificar rate limiting do tenant
  const rateLimitOk = await verificarRateLimit(campanha.tenantId, logger);
  
  if (!rateLimitOk) {
    logger.warn('Rate limit excedido para tenant', {
      tenantId: campanha.tenantId,
      campanhaId: campanha.id,
      traceId
    });
    return { disparos: 0, erros: 0 };
  }

  // Step 2: Buscar leads pendentes de disparo
  const leadsPendentes = await buscarLeadsPendentes(campanha, logger);

  if (leadsPendentes.length === 0) {
    logger.info('Nenhum lead pendente de disparo', {
      campanhaId: campanha.id,
      traceId
    });
    return { disparos: 0, erros: 0 };
  }

  logger.info('Leads pendentes encontrados', {
    count: leadsPendentes.length,
    campanhaId: campanha.id,
    traceId
  });

  let disparos = 0;
  let erros = 0;

  // Step 3: Processar cada lead
  for (const lead of leadsPendentes) {
    try {
      // Verificar rate limit novamente antes de cada disparo
      const canSend = await verificarRateLimit(campanha.tenantId, logger);
      
      if (!canSend) {
        logger.warn('Rate limit atingido durante processamento', {
          tenantId: campanha.tenantId,
          leadId: lead.id,
          traceId
        });
        break; // Parar de processar esta campanha
      }

      // Enviar mensagem
      await enviarMensagem(lead, campanha, logger, traceId);
      
      // Incrementar contador de rate limit
      await incrementarRateLimit(campanha.tenantId);
      
      disparos++;

      // Adicionar pequeno delay entre mensagens (2 segundos)
      await sleep(2000);

    } catch (error) {
      logger.error('Erro ao enviar mensagem para lead', error as Error, {
        leadId: lead.id,
        campanhaId: campanha.id,
        traceId
      });
      erros++;
    }
  }

  logger.info('Campanha processada', {
    campanhaId: campanha.id,
    disparos,
    erros,
    traceId
  });

  return { disparos, erros };
}

/**
 * Verificar rate limiting por tenant
 * Limites: 100 msg/hora, 500 msg/dia
 */
async function verificarRateLimit(tenantId: string, logger: Logger): Promise<boolean> {
  const now = new Date();
  
  // Obter ou criar rate limit do tenant
  let rateLimit = rateLimitCache.get(tenantId);
  
  if (!rateLimit) {
    rateLimit = {
      tenantId,
      mensagensHora: 0,
      mensagensDia: 0,
      ultimaResetHora: now,
      ultimaResetDia: now
    };
    rateLimitCache.set(tenantId, rateLimit);
  }

  // Reset contador de hora se passou 1 hora
  const horaPassada = (now.getTime() - rateLimit.ultimaResetHora.getTime()) / (1000 * 60 * 60);
  if (horaPassada >= 1) {
    rateLimit.mensagensHora = 0;
    rateLimit.ultimaResetHora = now;
  }

  // Reset contador de dia se passou 1 dia
  const diaPassado = (now.getTime() - rateLimit.ultimaResetDia.getTime()) / (1000 * 60 * 60 * 24);
  if (diaPassado >= 1) {
    rateLimit.mensagensDia = 0;
    rateLimit.ultimaResetDia = now;
  }

  // Verificar limites
  if (rateLimit.mensagensHora >= 100) {
    logger.warn('Rate limit de hora excedido', {
      tenantId,
      mensagensHora: rateLimit.mensagensHora
    });
    return false;
  }

  if (rateLimit.mensagensDia >= 500) {
    logger.warn('Rate limit de dia excedido', {
      tenantId,
      mensagensDia: rateLimit.mensagensDia
    });
    return false;
  }

  return true;
}

/**
 * Incrementar contador de rate limit
 */
async function incrementarRateLimit(tenantId: string): Promise<void> {
  const rateLimit = rateLimitCache.get(tenantId);
  
  if (rateLimit) {
    rateLimit.mensagensHora++;
    rateLimit.mensagensDia++;
  }
}

/**
 * Buscar leads pendentes de disparo
 */
async function buscarLeadsPendentes(
  campanha: CampanhaAtiva,
  logger: Logger
): Promise<LeadPendente[]> {
  logger.info('Buscando leads pendentes', {
    campanhaId: campanha.id
  });

  try {
    // Buscar leads que:
    // 1. Pertencem à campanha
    // 2. Não foram disparados recentemente (respeitando intervalo mínimo)
    // 3. Têm telefone ou email dependendo do canal
    const intervaloMinimo = campanha.ritmo.intervaloMinimo || 48; // horas

    const result = await query(
      `SELECT 
        l.id, l.tenant_id, l.empresa, l.contato, l.telefone, l.email, l.status,
        l.metadata->>'ultimoDisparo' as ultimo_disparo,
        COALESCE(l.metadata->>'estagioFunil', 'topo') as estagio_funil,
        COALESCE(l.metadata->>'variacaoTeste', 'A') as variacao_teste
      FROM nigredo_leads.leads l
      WHERE l.id = ANY($1)
        AND l.status IN ('enriquecido', 'contatado', 'respondeu')
        AND (
          l.metadata->>'ultimoDisparo' IS NULL
          OR (NOW() - (l.metadata->>'ultimoDisparo')::timestamp) > INTERVAL '${intervaloMinimo} hours'
        )
        AND (
          ($2 = 'whatsapp' AND l.telefone IS NOT NULL)
          OR ($2 = 'email' AND l.email IS NOT NULL)
          OR ($2 = 'multi' AND (l.telefone IS NOT NULL OR l.email IS NOT NULL))
        )
      ORDER BY l.prioridade DESC
      LIMIT 50`,
      [campanha.leadIds, campanha.canal]
    );

    const leads: LeadPendente[] = result.rows.map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      empresa: row.empresa,
      contato: row.contato,
      telefone: row.telefone,
      email: row.email,
      status: row.status,
      ultimoDisparo: row.ultimo_disparo ? new Date(row.ultimo_disparo) : undefined,
      estagioFunil: row.estagio_funil as 'topo' | 'meio' | 'fundo',
      variacaoTeste: row.variacao_teste as 'A' | 'B' | 'C'
    }));

    logger.info('Leads pendentes encontrados', {
      count: leads.length,
      campanhaId: campanha.id
    });

    return leads;
  } catch (error) {
    logger.error('Erro ao buscar leads pendentes', error as Error, {
      campanhaId: campanha.id
    });
    throw error;
  }
}

/**
 * Enviar mensagem para lead
 */
async function enviarMensagem(
  lead: LeadPendente,
  campanha: CampanhaAtiva,
  logger: Logger,
  traceId: string
): Promise<void> {
  logger.info('Enviando mensagem', {
    leadId: lead.id,
    empresa: lead.empresa,
    canal: campanha.canal,
    estagioFunil: lead.estagioFunil,
    traceId
  });

  // Step 1: Selecionar mensagem apropriada baseada no estágio do funil e variação de teste
  const mensagem = selecionarMensagem(campanha, lead);

  if (!mensagem) {
    logger.warn('Nenhuma mensagem encontrada para lead', {
      leadId: lead.id,
      estagioFunil: lead.estagioFunil,
      variacaoTeste: lead.variacaoTeste,
      traceId
    });
    return;
  }

  // Step 2: Personalizar mensagem com dados do lead
  const mensagemPersonalizada = personalizarMensagem(mensagem.conteudo, lead);

  // Step 3: Adicionar variação sutil de horário (±5 min)
  await adicionarVariacaoHorario();

  // Step 4: Gerar idempotency key
  const idempotencyKey = gerarIdempotencyKey(lead.id, campanha.id, mensagem.variacao);

  // Step 5: Enviar via canal apropriado
  let messageId: string;
  let canal: string;

  if (campanha.canal === 'whatsapp' || (campanha.canal === 'multi' && lead.telefone)) {
    // Enviar via WhatsApp
    const response = await whatsappServer.sendMessage({
      to: lead.telefone!,
      message: mensagemPersonalizada,
      idempotencyKey
    });

    messageId = response.messageId;
    canal = 'whatsapp';

    logger.info('Mensagem enviada via WhatsApp', {
      leadId: lead.id,
      messageId,
      status: response.status,
      traceId
    });

  } else if (campanha.canal === 'email' || (campanha.canal === 'multi' && lead.email)) {
    // Enviar via Email (implementação futura)
    // Por enquanto, simular envio
    messageId = uuidv4();
    canal = 'email';

    logger.info('Mensagem enviada via Email (simulado)', {
      leadId: lead.id,
      messageId,
      traceId
    });

  } else {
    throw new Error(`Canal não suportado ou lead sem contato: ${campanha.canal}`);
  }

  // Step 6: Atualizar status do lead
  await atualizarStatusLead(lead.id, mensagem.tipo, logger);

  // Step 7: Registrar interação no banco de dados
  await registrarInteracao(lead, campanha, mensagem, messageId, canal, logger, traceId);

  // Step 8: Publicar evento de disparo
  await publicarEventoDisparo(lead, campanha, mensagem, messageId, canal, traceId, logger);
}

/**
 * Selecionar mensagem apropriada baseada no estágio do funil e variação de teste
 */
function selecionarMensagem(
  campanha: CampanhaAtiva,
  lead: LeadPendente
): { tipo: string; variacao: string; conteudo: string; cta: string } | null {
  // Selecionar mensagens do estágio apropriado
  let mensagens: any[];

  if (lead.estagioFunil === 'topo') {
    mensagens = campanha.mensagens.topo;
  } else if (lead.estagioFunil === 'meio') {
    mensagens = campanha.mensagens.meio;
  } else {
    mensagens = campanha.mensagens.fundo;
  }

  // Filtrar pela variação de teste
  const mensagensFiltradas = mensagens.filter(m => m.variacao === lead.variacaoTeste);

  if (mensagensFiltradas.length === 0) {
    // Se não encontrar mensagem da variação, usar primeira disponível
    return mensagens[0] || null;
  }

  // Retornar primeira mensagem da variação
  return mensagensFiltradas[0];
}

/**
 * Personalizar mensagem com dados do lead
 */
function personalizarMensagem(template: string, lead: LeadPendente): string {
  let mensagem = template;

  // Substituir placeholders
  mensagem = mensagem.replace(/\{empresa\}/g, lead.empresa);
  mensagem = mensagem.replace(/\{contato\}/g, lead.contato);

  return mensagem;
}

/**
 * Adicionar variação sutil de horário (±5 min)
 */
async function adicionarVariacaoHorario(): Promise<void> {
  // Gerar delay aleatório entre 0 e 5 minutos (em milissegundos)
  const variacaoMs = Math.random() * 5 * 60 * 1000;
  
  // Aplicar delay apenas se for significativo (> 10 segundos)
  if (variacaoMs > 10000) {
    await sleep(variacaoMs);
  }
}

/**
 * Gerar idempotency key para evitar duplicatas
 */
function gerarIdempotencyKey(leadId: string, campanhaId: string, variacao: string): string {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `disparo-${leadId}-${campanhaId}-${variacao}-${timestamp}`;
}

/**
 * Atualizar status do lead
 */
async function atualizarStatusLead(
  leadId: string,
  estagioFunil: string,
  logger: Logger
): Promise<void> {
  logger.debug('Atualizando status do lead', {
    leadId,
    estagioFunil
  });

  try {
    await query(
      `UPDATE nigredo_leads.leads
      SET 
        status = 'contatado',
        metadata = jsonb_set(
          jsonb_set(metadata, '{ultimoDisparo}', to_jsonb(NOW()::text)),
          '{estagioFunil}', to_jsonb($2::text)
        ),
        updated_at = NOW()
      WHERE id = $1`,
      [leadId, estagioFunil]
    );

    logger.debug('Status do lead atualizado', {
      leadId
    });
  } catch (error) {
    logger.error('Erro ao atualizar status do lead', error as Error, {
      leadId
    });
    throw error;
  }
}

/**
 * Registrar interação no banco de dados
 */
async function registrarInteracao(
  lead: LeadPendente,
  campanha: CampanhaAtiva,
  mensagem: { tipo: string; variacao: string; conteudo: string; cta: string },
  messageId: string,
  canal: string,
  logger: Logger,
  traceId: string
): Promise<void> {
  logger.debug('Registrando interação', {
    leadId: lead.id,
    messageId,
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
        lead.id,
        'enviado',
        canal,
        mensagem.conteudo.substring(0, 500), // Limitar tamanho
        null, // Sentimento será preenchido quando lead responder
        null, // Intensidade será preenchida quando lead responder
        traceId,
        JSON.stringify({
          campanhaId: campanha.id,
          campanhaName: campanha.nome,
          messageId,
          estagioFunil: mensagem.tipo,
          variacaoTeste: mensagem.variacao,
          cta: mensagem.cta
        })
      ]
    );

    logger.debug('Interação registrada', {
      leadId: lead.id,
      messageId,
      traceId
    });
  } catch (error) {
    logger.error('Erro ao registrar interação', error as Error, {
      leadId: lead.id,
      traceId
    });
    throw error;
  }
}

/**
 * Publicar evento de disparo no EventBridge
 */
async function publicarEventoDisparo(
  lead: LeadPendente,
  campanha: CampanhaAtiva,
  mensagem: { tipo: string; variacao: string; conteudo: string; cta: string },
  messageId: string,
  canal: string,
  traceId: string,
  logger: Logger
): Promise<void> {
  try {
    const command = new PutEventsCommand({
      Entries: [
        {
          Source: 'nigredo.disparo',
          DetailType: 'disparo.sent',
          Detail: JSON.stringify({
            leadId: lead.id,
            tenantId: lead.tenantId,
            empresa: lead.empresa,
            campanhaId: campanha.id,
            campanhaName: campanha.nome,
            messageId,
            canal,
            estagioFunil: mensagem.tipo,
            variacaoTeste: mensagem.variacao,
            metadata: {
              contato: lead.contato,
              telefone: lead.telefone ? maskPhoneNumber(lead.telefone) : undefined,
              email: lead.email
            },
            traceId,
            timestamp: new Date().toISOString()
          }),
          EventBusName: EVENT_BUS_NAME
        }
      ]
    });

    const response = await eventBridgeClient.send(command);

    logger.info('Evento de disparo publicado', {
      eventBusName: EVENT_BUS_NAME,
      leadId: lead.id,
      messageId,
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

/**
 * Mask phone number for logging
 */
function maskPhoneNumber(phone: string): string {
  if (phone.length <= 7) {
    return phone;
  }
  const countryCode = phone.substring(0, 3); // +55
  const lastFour = phone.substring(phone.length - 4);
  const masked = '*'.repeat(phone.length - 7);
  return `${countryCode}${masked}${lastFour}`;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
