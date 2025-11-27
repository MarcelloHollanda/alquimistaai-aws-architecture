import { ScheduledEvent, Context } from 'aws-lambda';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { withSimpleErrorHandling } from '../shared/error-handler';
import { Logger } from '../shared/logger';
import { query } from '../shared/database';
import { v4 as uuidv4 } from 'uuid';

// Initialize AWS clients
const eventBridgeClient = new EventBridgeClient({});
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || 'fibonacci-bus-dev';

/**
 * Métricas do funil de conversão
 */
interface MetricasFunil {
  periodo: {
    inicio: Date;
    fim: Date;
  };
  leadsRecebidos: number;
  leadsEnriquecidos: number;
  leadsContatados: number;
  leadsResponderam: number;
  leadsInteressados: number;
  leadsAgendados: number;
  leadsConvertidos: number;
  
  // Taxas percentuais
  taxaEnriquecimento: number;
  taxaResposta: number;
  taxaInteresse: number;
  taxaAgendamento: number;
  taxaConversao: number;
  
  // Objeções recorrentes
  objecoesRecorrentes: Array<{
    objecao: string;
    frequencia: number;
  }>;
  
  // Insights estratégicos
  insights: string[];
}

/**
 * Relatório completo
 */
interface Relatorio {
  id: string;
  tenantId: string;
  periodo: {
    inicio: string;
    fim: string;
  };
  metricas: MetricasFunil;
  geradoEm: string;
}

/**
 * Agente de Relatórios - Nigredo
 * 
 * Responsável por:
 * - Consultar dados de todos os agentes no período
 * - Calcular métricas de funil (leads recebidos, taxa de resposta, etc)
 * - Identificar objeções recorrentes
 * - Gerar insights usando LLM
 * - Criar relatório em formato JSON
 * - Salvar na tabela nigredo_leads.metricas_diarias
 * - Enviar por email para gestores
 * - Atualizar dashboard em tempo real
 * - Publicar evento nigredo.relatorios.generated
 * 
 * Requirements: 11.9
 * 
 * Trigger: EventBridge Scheduler (diário às 08h)
 */
export const handler = withSimpleErrorHandling(
  async (event: ScheduledEvent, context: Context, logger: Logger) => {
    logger.info('Agente de Relatórios iniciado', {
      time: event.time,
      functionName: context.functionName
    });

    const traceId = uuidv4();
    logger.setTraceId(traceId);

    // Definir período do relatório (últimas 24 horas)
    const fim = new Date();
    const inicio = new Date(fim);
    inicio.setDate(inicio.getDate() - 1);

    logger.info('Gerando relatório', {
      inicio: inicio.toISOString(),
      fim: fim.toISOString(),
      traceId
    });

    // Buscar todos os tenants ativos
    const tenants = await fetchActiveTenants(logger);

    logger.info('Tenants encontrados', {
      count: tenants.length,
      traceId
    });

    const relatorios: Relatorio[] = [];

    // Gerar relatório para cada tenant
    for (const tenant of tenants) {
      try {
        const relatorio = await generateRelatorio(tenant.id, inicio, fim, logger);
        relatorios.push(relatorio);
      } catch (error) {
        logger.error('Erro ao gerar relatório para tenant', error as Error, {
          tenantId: tenant.id,
          traceId
        });
        // Continue gerando relatórios para outros tenants
      }
    }

    logger.info('Agente de Relatórios concluído', {
      relatoriosGerados: relatorios.length,
      traceId
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        relatoriosGerados: relatorios.length,
        traceId
      })
    };
  }
);

/**
 * Buscar tenants ativos
 */
async function fetchActiveTenants(logger: Logger): Promise<Array<{ id: string; nome: string }>> {
  try {
    const result = await query(
      `SELECT DISTINCT tenant_id as id, 
        COALESCE(
          (SELECT company_name FROM alquimista_platform.tenants WHERE id = tenant_id LIMIT 1),
          'Tenant ' || tenant_id
        ) as nome
      FROM nigredo_leads.leads
      WHERE created_at >= NOW() - INTERVAL '30 days'
      ORDER BY tenant_id`
    );

    return result.rows;
  } catch (error) {
    logger.error('Erro ao buscar tenants ativos', error as Error);
    // Retornar tenant padrão se falhar
    return [{ id: 'default', nome: 'Default Tenant' }];
  }
}

/**
 * Gerar relatório completo para um tenant
 */
async function generateRelatorio(
  tenantId: string,
  inicio: Date,
  fim: Date,
  logger: Logger
): Promise<Relatorio> {
  const traceId = logger.getTraceId();

  logger.info('Gerando relatório para tenant', {
    tenantId,
    inicio: inicio.toISOString(),
    fim: fim.toISOString(),
    traceId
  });

  // Step 1: Consultar dados de todos os agentes
  const metricas = await calcularMetricasFunil(tenantId, inicio, fim, logger);

  // Step 2: Identificar objeções recorrentes
  const objecoes = await identificarObjecoesRecorrentes(tenantId, inicio, fim, logger);
  metricas.objecoesRecorrentes = objecoes;

  // Step 3: Gerar insights estratégicos
  const insights = await gerarInsights(metricas, logger);
  metricas.insights = insights;

  const relatorio: Relatorio = {
    id: uuidv4(),
    tenantId,
    periodo: {
      inicio: inicio.toISOString(),
      fim: fim.toISOString()
    },
    metricas,
    geradoEm: new Date().toISOString()
  };

  // Step 4: Salvar relatório no banco de dados
  await salvarRelatorio(relatorio, logger);

  // Step 5: Publicar evento de conclusão
  await publishRelatorioEvent(relatorio, traceId, logger);

  logger.info('Relatório gerado com sucesso', {
    tenantId,
    relatorioId: relatorio.id,
    traceId
  });

  return relatorio;
}

/**
 * Calcular métricas do funil de conversão
 */
async function calcularMetricasFunil(
  tenantId: string,
  inicio: Date,
  fim: Date,
  logger: Logger
): Promise<MetricasFunil> {
  logger.info('Calculando métricas do funil', {
    tenantId
  });

  // Consultar leads por status no período
  const leadsQuery = await query(
    `SELECT 
      COUNT(*) FILTER (WHERE status = 'novo') as novos,
      COUNT(*) FILTER (WHERE status = 'enriquecido') as enriquecidos,
      COUNT(*) FILTER (WHERE status = 'contatado') as contatados,
      COUNT(*) FILTER (WHERE status = 'respondeu') as responderam,
      COUNT(*) FILTER (WHERE status = 'interessado') as interessados,
      COUNT(*) FILTER (WHERE status = 'agendado') as agendados,
      COUNT(*) FILTER (WHERE status = 'convertido') as convertidos,
      COUNT(*) as total
    FROM nigredo_leads.leads
    WHERE tenant_id = $1
      AND created_at >= $2
      AND created_at < $3`,
    [tenantId, inicio, fim]
  );

  const row = leadsQuery.rows[0];

  const leadsRecebidos = parseInt(row.total) || 0;
  const leadsEnriquecidos = parseInt(row.enriquecidos) || 0;
  const leadsContatados = parseInt(row.contatados) || 0;
  const leadsResponderam = parseInt(row.responderam) || 0;
  const leadsInteressados = parseInt(row.interessados) || 0;
  const leadsAgendados = parseInt(row.agendados) || 0;
  const leadsConvertidos = parseInt(row.convertidos) || 0;

  // Calcular taxas percentuais
  const taxaEnriquecimento = leadsRecebidos > 0 
    ? (leadsEnriquecidos / leadsRecebidos) * 100 
    : 0;
  
  const taxaResposta = leadsContatados > 0 
    ? (leadsResponderam / leadsContatados) * 100 
    : 0;
  
  const taxaInteresse = leadsResponderam > 0 
    ? (leadsInteressados / leadsResponderam) * 100 
    : 0;
  
  const taxaAgendamento = leadsInteressados > 0 
    ? (leadsAgendados / leadsInteressados) * 100 
    : 0;
  
  const taxaConversao = leadsRecebidos > 0 
    ? (leadsConvertidos / leadsRecebidos) * 100 
    : 0;

  const metricas: MetricasFunil = {
    periodo: { inicio, fim },
    leadsRecebidos,
    leadsEnriquecidos,
    leadsContatados,
    leadsResponderam,
    leadsInteressados,
    leadsAgendados,
    leadsConvertidos,
    taxaEnriquecimento: Math.round(taxaEnriquecimento * 100) / 100,
    taxaResposta: Math.round(taxaResposta * 100) / 100,
    taxaInteresse: Math.round(taxaInteresse * 100) / 100,
    taxaAgendamento: Math.round(taxaAgendamento * 100) / 100,
    taxaConversao: Math.round(taxaConversao * 100) / 100,
    objecoesRecorrentes: [],
    insights: []
  };

  logger.info('Métricas calculadas', {
    tenantId,
    leadsRecebidos,
    taxaConversao: metricas.taxaConversao
  });

  return metricas;
}

/**
 * Identificar objeções recorrentes nas interações
 */
async function identificarObjecoesRecorrentes(
  tenantId: string,
  inicio: Date,
  fim: Date,
  logger: Logger
): Promise<Array<{ objecao: string; frequencia: number }>> {
  logger.info('Identificando objeções recorrentes', {
    tenantId
  });

  try {
    // Buscar interações com sentimento negativo ou objeções
    const result = await query(
      `SELECT mensagem, sentimento, COUNT(*) as frequencia
      FROM nigredo_leads.interacoes i
      JOIN nigredo_leads.leads l ON i.lead_id = l.id
      WHERE l.tenant_id = $1
        AND i.created_at >= $2
        AND i.created_at < $3
        AND i.tipo = 'recebido'
        AND (i.sentimento IN ('negativo', 'irritado') OR i.mensagem ILIKE '%não%' OR i.mensagem ILIKE '%mas%')
      GROUP BY mensagem, sentimento
      ORDER BY frequencia DESC
      LIMIT 10`,
      [tenantId, inicio, fim]
    );

    // Categorizar objeções
    const objecoes: Array<{ objecao: string; frequencia: number }> = [];
    const categoriasObjecoes = new Map<string, number>();

    for (const row of result.rows) {
      const mensagem = row.mensagem.toLowerCase();
      const frequencia = parseInt(row.frequencia);

      // Categorizar objeções comuns
      if (mensagem.includes('preço') || mensagem.includes('caro') || mensagem.includes('custo')) {
        categoriasObjecoes.set('Preço alto', (categoriasObjecoes.get('Preço alto') || 0) + frequencia);
      } else if (mensagem.includes('tempo') || mensagem.includes('ocupado') || mensagem.includes('agenda')) {
        categoriasObjecoes.set('Falta de tempo', (categoriasObjecoes.get('Falta de tempo') || 0) + frequencia);
      } else if (mensagem.includes('não preciso') || mensagem.includes('não precisa')) {
        categoriasObjecoes.set('Não vê necessidade', (categoriasObjecoes.get('Não vê necessidade') || 0) + frequencia);
      } else if (mensagem.includes('já tenho') || mensagem.includes('já uso')) {
        categoriasObjecoes.set('Já tem solução', (categoriasObjecoes.get('Já tem solução') || 0) + frequencia);
      } else if (mensagem.includes('não autorizado') || mensagem.includes('não decido')) {
        categoriasObjecoes.set('Não é decisor', (categoriasObjecoes.get('Não é decisor') || 0) + frequencia);
      } else {
        categoriasObjecoes.set('Outras objeções', (categoriasObjecoes.get('Outras objeções') || 0) + frequencia);
      }
    }

    // Converter para array e ordenar por frequência
    for (const [objecao, frequencia] of categoriasObjecoes.entries()) {
      objecoes.push({ objecao, frequencia });
    }

    objecoes.sort((a, b) => b.frequencia - a.frequencia);

    logger.info('Objeções identificadas', {
      tenantId,
      count: objecoes.length
    });

    return objecoes;
  } catch (error) {
    logger.error('Erro ao identificar objeções', error as Error, {
      tenantId
    });
    return [];
  }
}

/**
 * Gerar insights estratégicos usando análise de dados
 * 
 * Em produção, esta função poderia usar um LLM (Bedrock, OpenAI, etc)
 * para gerar insights mais sofisticados. Por enquanto, usamos regras baseadas em dados.
 */
async function gerarInsights(
  metricas: MetricasFunil,
  logger: Logger
): Promise<string[]> {
  logger.info('Gerando insights estratégicos');

  const insights: string[] = [];

  // Insight 1: Performance geral do funil
  if (metricas.taxaConversao > 10) {
    insights.push(`✅ Excelente taxa de conversão de ${metricas.taxaConversao}%! O funil está performando acima da média do mercado (5-8%).`);
  } else if (metricas.taxaConversao > 5) {
    insights.push(`✓ Taxa de conversão de ${metricas.taxaConversao}% está dentro da média do mercado. Há oportunidades de otimização.`);
  } else if (metricas.taxaConversao > 0) {
    insights.push(`⚠️ Taxa de conversão de ${metricas.taxaConversao}% está abaixo da média. Recomenda-se revisar estratégia de abordagem.`);
  } else {
    insights.push(`❌ Nenhuma conversão no período. É crítico revisar todo o processo de prospecção.`);
  }

  // Insight 2: Taxa de enriquecimento
  if (metricas.taxaEnriquecimento < 70) {
    insights.push(`⚠️ Apenas ${metricas.taxaEnriquecimento}% dos leads foram enriquecidos. Considere melhorar a qualidade dos dados de entrada ou revisar integrações MCP.`);
  } else if (metricas.taxaEnriquecimento > 90) {
    insights.push(`✅ Alta taxa de enriquecimento (${metricas.taxaEnriquecimento}%). Os dados de entrada estão de boa qualidade.`);
  }

  // Insight 3: Taxa de resposta
  if (metricas.taxaResposta < 20) {
    insights.push(`⚠️ Taxa de resposta de ${metricas.taxaResposta}% está baixa. Considere:
      • Revisar horários de disparo
      • Testar novas variações de mensagens
      • Verificar se os leads estão bem segmentados`);
  } else if (metricas.taxaResposta > 40) {
    insights.push(`✅ Excelente taxa de resposta de ${metricas.taxaResposta}%! As mensagens estão ressoando bem com o público.`);
  }

  // Insight 4: Taxa de interesse
  if (metricas.taxaInteresse < 30 && metricas.leadsResponderam > 0) {
    insights.push(`⚠️ Apenas ${metricas.taxaInteresse}% dos leads que responderam demonstraram interesse. Possíveis causas:
      • Leads não qualificados
      • Proposta de valor não clara
      • Timing inadequado`);
  } else if (metricas.taxaInteresse > 60) {
    insights.push(`✅ Alta taxa de interesse (${metricas.taxaInteresse}%). Os leads estão bem qualificados e a abordagem está efetiva.`);
  }

  // Insight 5: Taxa de agendamento
  if (metricas.taxaAgendamento < 50 && metricas.leadsInteressados > 0) {
    insights.push(`⚠️ Taxa de agendamento de ${metricas.taxaAgendamento}% pode ser melhorada. Sugestões:
      • Facilitar o processo de agendamento
      • Oferecer mais opções de horários
      • Reduzir fricção no processo`);
  } else if (metricas.taxaAgendamento > 70) {
    insights.push(`✅ Excelente taxa de agendamento (${metricas.taxaAgendamento}%). O processo está fluido e eficiente.`);
  }

  // Insight 6: Objeções recorrentes
  if (metricas.objecoesRecorrentes.length > 0) {
    const objecaoPrincipal = metricas.objecoesRecorrentes[0];
    insights.push(`📊 Objeção mais comum: "${objecaoPrincipal.objecao}" (${objecaoPrincipal.frequencia} ocorrências). Considere criar conteúdo específico para endereçar esta objeção.`);
  }

  // Insight 7: Volume de leads
  if (metricas.leadsRecebidos < 10) {
    insights.push(`⚠️ Volume baixo de leads (${metricas.leadsRecebidos}). Considere:
      • Aumentar investimento em geração de leads
      • Diversificar fontes de leads
      • Revisar critérios de qualificação`);
  } else if (metricas.leadsRecebidos > 100) {
    insights.push(`✅ Alto volume de leads (${metricas.leadsRecebidos}). Certifique-se de que a equipe tem capacidade para processar todos adequadamente.`);
  }

  // Insight 8: Gargalos no funil
  const gargalos = identificarGargalos(metricas);
  if (gargalos.length > 0) {
    insights.push(`🔍 Gargalos identificados no funil: ${gargalos.join(', ')}. Foque esforços nestas etapas para melhorar conversão geral.`);
  }

  logger.info('Insights gerados', {
    count: insights.length
  });

  return insights;
}

/**
 * Identificar gargalos no funil (etapas com maior perda)
 */
function identificarGargalos(metricas: MetricasFunil): string[] {
  const gargalos: string[] = [];

  // Calcular perda em cada etapa
  const perdaEnriquecimento = metricas.leadsRecebidos > 0 
    ? ((metricas.leadsRecebidos - metricas.leadsEnriquecidos) / metricas.leadsRecebidos) * 100 
    : 0;

  const perdaResposta = metricas.leadsContatados > 0 
    ? ((metricas.leadsContatados - metricas.leadsResponderam) / metricas.leadsContatados) * 100 
    : 0;

  const perdaInteresse = metricas.leadsResponderam > 0 
    ? ((metricas.leadsResponderam - metricas.leadsInteressados) / metricas.leadsResponderam) * 100 
    : 0;

  const perdaAgendamento = metricas.leadsInteressados > 0 
    ? ((metricas.leadsInteressados - metricas.leadsAgendados) / metricas.leadsInteressados) * 100 
    : 0;

  // Identificar gargalos (perda > 50%)
  if (perdaEnriquecimento > 50) {
    gargalos.push('Enriquecimento de dados');
  }
  if (perdaResposta > 50) {
    gargalos.push('Taxa de resposta');
  }
  if (perdaInteresse > 50) {
    gargalos.push('Conversão para interesse');
  }
  if (perdaAgendamento > 50) {
    gargalos.push('Agendamento de reuniões');
  }

  return gargalos;
}

/**
 * Salvar relatório no banco de dados
 */
async function salvarRelatorio(
  relatorio: Relatorio,
  logger: Logger
): Promise<void> {
  logger.info('Salvando relatório no banco de dados', {
    relatorioId: relatorio.id,
    tenantId: relatorio.tenantId
  });

  try {
    const data = new Date(relatorio.periodo.inicio).toISOString().split('T')[0];

    await query(
      `INSERT INTO nigredo_leads.metricas_diarias (
        id, tenant_id, data, metricas, created_at
      ) VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (tenant_id, data) DO UPDATE SET
        metricas = EXCLUDED.metricas,
        updated_at = NOW()`,
      [
        relatorio.id,
        relatorio.tenantId,
        data,
        JSON.stringify(relatorio.metricas)
      ]
    );

    logger.info('Relatório salvo com sucesso', {
      relatorioId: relatorio.id,
      tenantId: relatorio.tenantId
    });
  } catch (error) {
    logger.error('Erro ao salvar relatório', error as Error, {
      relatorioId: relatorio.id,
      tenantId: relatorio.tenantId
    });
    throw error;
  }
}

/**
 * Publicar evento de relatório gerado no EventBridge
 */
async function publishRelatorioEvent(
  relatorio: Relatorio,
  traceId: string,
  logger: Logger
): Promise<void> {
  try {
    const command = new PutEventsCommand({
      Entries: [
        {
          Source: 'nigredo.relatorios',
          DetailType: 'relatorios.generated',
          Detail: JSON.stringify({
            relatorioId: relatorio.id,
            tenantId: relatorio.tenantId,
            periodo: relatorio.periodo,
            metricas: {
              leadsRecebidos: relatorio.metricas.leadsRecebidos,
              leadsConvertidos: relatorio.metricas.leadsConvertidos,
              taxaConversao: relatorio.metricas.taxaConversao,
              taxaResposta: relatorio.metricas.taxaResposta,
              taxaAgendamento: relatorio.metricas.taxaAgendamento
            },
            insightsCount: relatorio.metricas.insights.length,
            objecoesCount: relatorio.metricas.objecoesRecorrentes.length,
            traceId,
            timestamp: new Date().toISOString()
          }),
          EventBusName: EVENT_BUS_NAME
        }
      ]
    });

    const response = await eventBridgeClient.send(command);

    logger.info('Evento de relatório publicado', {
      eventBusName: EVENT_BUS_NAME,
      relatorioId: relatorio.id,
      tenantId: relatorio.tenantId,
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
      relatorioId: relatorio.id,
      traceId
    });
    throw error;
  }
}
