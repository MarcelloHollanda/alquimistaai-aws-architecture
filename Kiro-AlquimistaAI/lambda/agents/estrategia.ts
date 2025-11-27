import { SQSEvent, SQSRecord, Context } from 'aws-lambda';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { withSimpleErrorHandling } from '../shared/error-handler';
import { Logger } from '../shared/logger';
import { query } from '../shared/database';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { createEnrichmentMCPServer, EnrichedCompanyData } from '../../mcp-integrations/servers/enrichment';

// Initialize AWS clients
const eventBridgeClient = new EventBridgeClient({});
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || 'fibonacci-bus-dev';

/**
 * Lead batch input schema validation
 */
const LeadBatchSchema = z.object({
  segmento: z.string(),
  atividade: z.string(),
  leadIds: z.array(z.string()),
  count: z.number(),
  prioridadeMedia: z.number()
});

type LeadBatch = z.infer<typeof LeadBatchSchema>;

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
  cnpj?: string;
  setor?: string;
  porte?: string;
  atividadePrincipal?: string;
  prioridade?: number;
  segmento?: string;
  metadata: Record<string, any>;
}

/**
 * Perfil comercial detalhado
 */
interface PerfilComercial {
  faturamentoEstimado?: number;
  maturidade: 'inicial' | 'crescimento' | 'consolidada' | 'madura';
  potencialCompra: 'baixo' | 'médio' | 'alto';
  cicloVenda: 'curto' | 'médio' | 'longo'; // dias estimados
  decisor: string; // Cargo típico do decisor
  pontosFortes: string[];
  desafios: string[];
}

/**
 * Mensagem de campanha
 */
interface MensagemCampanha {
  tipo: 'topo' | 'meio' | 'fundo';
  variacao: 'A' | 'B' | 'C';
  conteudo: string;
  cta: string; // Call to action
}

/**
 * Campanha criada
 */
interface Campanha {
  id: string;
  tenantId: string;
  nome: string;
  segmento: string;
  atividade: string;
  canal: 'whatsapp' | 'email' | 'multi';
  mensagens: {
    topo: MensagemCampanha[];
    meio: MensagemCampanha[];
    fundo: MensagemCampanha[];
  };
  ritmo: {
    horarios: string[]; // HH:MM format
    frequencia: string; // e.g., "1x/dia", "2x/semana"
    intervaloMinimo: number; // horas entre mensagens
  };
  status: 'rascunho' | 'aprovada' | 'ativa';
  leadIds: string[];
  metadata: Record<string, any>;
}

// Initialize MCP Enrichment Server
const enrichmentServer = createEnrichmentMCPServer({
  timeout: 30000,
  maxRetries: 3,
  cacheConfig: {
    enabled: true,
    ttlSeconds: 3600,
    maxEntries: 1000
  }
});

/**
 * Agente de Estratégia - Nigredo
 * 
 * Responsável por:
 * - Receber lotes de leads segmentados
 * - Pesquisar perfil comercial detalhado via MCP enrichment
 * - Calcular faturamento estimado e maturidade
 * - Criar mensagens para Topo, Meio e Fundo do funil
 * - Gerar variações de mensagens para testes A/B
 * - Definir canal ideal (WhatsApp, Email) por segmento
 * - Planejar ritmo de disparos (horários, frequência)
 * - Gerar pré-visualizações das mensagens
 * - Salvar campanha na tabela nigredo_leads.campanhas
 * - Publicar evento nigredo.estrategia.completed
 * 
 * Requirements: 11.4
 */
export const handler = withSimpleErrorHandling(
  async (event: SQSEvent, context: Context, logger: Logger) => {
    logger.info('Agente de Estratégia iniciado', {
      recordCount: event.Records.length,
      functionName: context.functionName
    });

    const campanhasCriadas: Campanha[] = [];

    for (const record of event.Records) {
      try {
        const campanha = await processRecord(record, logger);
        if (campanha) {
          campanhasCriadas.push(campanha);
        }
      } catch (error) {
        logger.error('Erro ao processar registro SQS', error as Error, {
          messageId: record.messageId
        });
        // Continue processando outros registros
      }
    }

    logger.info('Agente de Estratégia concluído', {
      campanhasCriadas: campanhasCriadas.length
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        campanhasCriadas: campanhasCriadas.length,
        campanhas: campanhasCriadas.map(c => ({
          id: c.id,
          nome: c.nome,
          segmento: c.segmento,
          leadCount: c.leadIds.length
        }))
      })
    };
  }
);

/**
 * Processar um registro SQS
 */
async function processRecord(
  record: SQSRecord,
  logger: Logger
): Promise<Campanha | null> {
  const traceId = uuidv4();
  logger.setTraceId(traceId);

  logger.info('Processando registro SQS', {
    messageId: record.messageId
  });

  // Parse message body
  const message = JSON.parse(record.body);
  const detail = typeof message.detail === 'string' 
    ? JSON.parse(message.detail) 
    : message.detail;

  // Extract batches and tenant ID
  const batches: LeadBatch[] = detail.batches || [];
  const tenantId: string = detail.tenantId || detail.tenant_id || 'default';

  // Update logger context with tenant ID
  logger.updateContext({ tenantId });

  logger.info('Lotes recebidos', {
    batchCount: batches.length
  });

  // Processar cada lote (por enquanto, processar apenas o primeiro)
  // Em produção, pode processar múltiplos lotes em paralelo
  if (batches.length === 0) {
    logger.warn('Nenhum lote recebido');
    return null;
  }

  const batch = batches[0]; // Processar primeiro lote

  // Step 1: Buscar leads do banco de dados
  const leads = await fetchLeads(batch.leadIds, logger);

  if (leads.length === 0) {
    logger.warn('Nenhum lead encontrado', {
      leadIds: batch.leadIds
    });
    return null;
  }

  // Step 2: Pesquisar perfil comercial detalhado
  const perfis = await pesquisarPerfilComercial(leads, logger);

  // Step 3: Criar campanha
  const campanha = await criarCampanha(
    leads,
    perfis,
    batch,
    tenantId,
    logger
  );

  // Step 4: Salvar campanha no banco de dados
  await salvarCampanha(campanha, logger);

  // Step 5: Publicar evento de conclusão
  await publishCompletionEvent(campanha, traceId, logger);

  return campanha;
}

/**
 * Buscar leads do banco de dados
 */
async function fetchLeads(
  leadIds: string[],
  logger: Logger
): Promise<Lead[]> {
  logger.info('Buscando leads do banco de dados', {
    count: leadIds.length
  });

  try {
    const result = await query(
      `SELECT 
        id, tenant_id, empresa, contato, telefone, email, cnpj,
        setor, porte, atividade_principal, prioridade, segmento, metadata
      FROM nigredo_leads.leads
      WHERE id = ANY($1)
      ORDER BY prioridade DESC`,
      [leadIds]
    );

    const leads: Lead[] = result.rows.map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      empresa: row.empresa,
      contato: row.contato,
      telefone: row.telefone,
      email: row.email,
      cnpj: row.cnpj,
      setor: row.setor,
      porte: row.porte,
      atividadePrincipal: row.atividade_principal,
      prioridade: row.prioridade,
      segmento: row.segmento,
      metadata: row.metadata || {}
    }));

    logger.info('Leads encontrados', {
      count: leads.length
    });

    return leads;
  } catch (error) {
    logger.error('Erro ao buscar leads', error as Error);
    throw error;
  }
}

/**
 * Pesquisar perfil comercial detalhado via MCP enrichment
 */
async function pesquisarPerfilComercial(
  leads: Lead[],
  logger: Logger
): Promise<Map<string, PerfilComercial>> {
  logger.info('Pesquisando perfil comercial detalhado', {
    count: leads.length
  });

  const perfis = new Map<string, PerfilComercial>();

  for (const lead of leads) {
    try {
      logger.debug('Pesquisando perfil comercial', {
        leadId: lead.id,
        empresa: lead.empresa
      });

      // Tentar enriquecer dados se ainda não foi feito
      let enrichmentData: EnrichedCompanyData | null = null;

      if (lead.cnpj) {
        try {
          enrichmentData = await enrichmentServer.enrichCompany({
            cnpj: lead.cnpj,
            companyName: lead.empresa,
            includeLinkedIn: false
          });
        } catch (enrichError) {
          logger.warn('Falha ao enriquecer dados para perfil comercial', {
            leadId: lead.id,
            error: (enrichError as Error).message
          });
        }
      }

      // Calcular perfil comercial
      const perfil = calcularPerfilComercial(lead, enrichmentData, logger);
      perfis.set(lead.id, perfil);

      logger.debug('Perfil comercial calculado', {
        leadId: lead.id,
        maturidade: perfil.maturidade,
        potencialCompra: perfil.potencialCompra
      });

    } catch (error) {
      logger.error('Erro ao pesquisar perfil comercial', error as Error, {
        leadId: lead.id
      });
      // Criar perfil padrão
      perfis.set(lead.id, {
        maturidade: 'inicial',
        potencialCompra: 'médio',
        cicloVenda: 'médio',
        decisor: 'Gerente',
        pontosFortes: [],
        desafios: []
      });
    }
  }

  logger.info('Perfis comerciais pesquisados', {
    count: perfis.size
  });

  return perfis;
}

/**
 * Calcular perfil comercial baseado em dados do lead e enrichment
 */
function calcularPerfilComercial(
  lead: Lead,
  enrichmentData: EnrichedCompanyData | null,
  logger: Logger
): PerfilComercial {
  const perfil: PerfilComercial = {
    maturidade: 'inicial',
    potencialCompra: 'médio',
    cicloVenda: 'médio',
    decisor: 'Gerente',
    pontosFortes: [],
    desafios: []
  };

  // Calcular faturamento estimado baseado em capital social e porte
  if (enrichmentData?.cnpj?.capitalSocial) {
    perfil.faturamentoEstimado = estimarFaturamento(
      enrichmentData.cnpj.capitalSocial,
      lead.porte
    );
  }

  // Determinar maturidade baseado em data de abertura
  if (enrichmentData?.cnpj?.dataAbertura) {
    const dataAbertura = parseDataAbertura(enrichmentData.cnpj.dataAbertura);
    const anosOperacao = (Date.now() - dataAbertura.getTime()) / (1000 * 60 * 60 * 24 * 365);

    if (anosOperacao < 2) {
      perfil.maturidade = 'inicial';
    } else if (anosOperacao < 5) {
      perfil.maturidade = 'crescimento';
    } else if (anosOperacao < 10) {
      perfil.maturidade = 'consolidada';
    } else {
      perfil.maturidade = 'madura';
    }
  }

  // Determinar potencial de compra baseado em porte e setor
  perfil.potencialCompra = determinarPotencialCompra(lead.porte, lead.setor);

  // Determinar ciclo de venda baseado em porte e setor
  perfil.cicloVenda = determinarCicloVenda(lead.porte, lead.setor);

  // Determinar decisor típico baseado em porte
  perfil.decisor = determinarDecisor(lead.porte);

  // Identificar pontos fortes
  perfil.pontosFortes = identificarPontosFortes(lead, enrichmentData);

  // Identificar desafios
  perfil.desafios = identificarDesafios(lead, enrichmentData);

  return perfil;
}

/**
 * Estimar faturamento baseado em capital social e porte
 */
function estimarFaturamento(capitalSocial: number, porte?: string): number {
  // Multiplicadores baseados em porte
  const multiplicadores: Record<string, number> = {
    'MEI': 2,
    'ME': 5,
    'EPP': 10,
    'Média': 20,
    'Grande': 50,
    'Demais': 30
  };

  const multiplicador = multiplicadores[porte || 'Demais'] || 10;
  return capitalSocial * multiplicador;
}

/**
 * Parse data de abertura (formato DD/MM/YYYY)
 */
function parseDataAbertura(dataStr: string): Date {
  const [dia, mes, ano] = dataStr.split('/').map(Number);
  return new Date(ano, mes - 1, dia);
}

/**
 * Determinar potencial de compra
 */
function determinarPotencialCompra(porte?: string, setor?: string): 'baixo' | 'médio' | 'alto' {
  // Portes com maior potencial
  if (porte === 'Grande' || porte === 'Média') {
    return 'alto';
  }

  // Setores com maior potencial
  const setoresAlto = ['tecnologia', 'software', 'financeiro', 'saúde'];
  if (setor && setoresAlto.some(s => setor.toLowerCase().includes(s))) {
    return 'alto';
  }

  if (porte === 'EPP') {
    return 'médio';
  }

  return 'baixo';
}

/**
 * Determinar ciclo de venda
 */
function determinarCicloVenda(porte?: string, setor?: string): 'curto' | 'médio' | 'longo' {
  // Grandes empresas têm ciclo mais longo
  if (porte === 'Grande') {
    return 'longo';
  }

  // Setores com ciclo mais longo
  const setoresLongo = ['financeiro', 'governo', 'indústria'];
  if (setor && setoresLongo.some(s => setor.toLowerCase().includes(s))) {
    return 'longo';
  }

  // MEI e ME têm ciclo mais curto
  if (porte === 'MEI' || porte === 'ME') {
    return 'curto';
  }

  return 'médio';
}

/**
 * Determinar decisor típico
 */
function determinarDecisor(porte?: string): string {
  const decisores: Record<string, string> = {
    'MEI': 'Proprietário',
    'ME': 'Proprietário/Sócio',
    'EPP': 'Diretor',
    'Média': 'Diretor/VP',
    'Grande': 'VP/C-Level',
    'Demais': 'Gerente'
  };

  return decisores[porte || 'Demais'] || 'Gerente';
}

/**
 * Identificar pontos fortes
 */
function identificarPontosFortes(
  lead: Lead,
  enrichmentData: EnrichedCompanyData | null
): string[] {
  const pontos: string[] = [];

  if (lead.porte === 'Grande' || lead.porte === 'Média') {
    pontos.push('Empresa consolidada no mercado');
  }

  if (enrichmentData?.cnpj?.situacaoCadastral === 'ATIVA') {
    pontos.push('Situação cadastral regular');
  }

  if (enrichmentData?.places?.rating && enrichmentData.places.rating >= 4.0) {
    pontos.push(`Boa reputação online (${enrichmentData.places.rating} estrelas)`);
  }

  if (lead.setor?.toLowerCase().includes('tecnologia')) {
    pontos.push('Setor de tecnologia (inovador)');
  }

  return pontos;
}

/**
 * Identificar desafios
 */
function identificarDesafios(
  lead: Lead,
  enrichmentData: EnrichedCompanyData | null
): string[] {
  const desafios: string[] = [];

  if (lead.porte === 'MEI' || lead.porte === 'ME') {
    desafios.push('Orçamento limitado');
    desafios.push('Equipe reduzida');
  }

  if (!lead.telefone && !lead.email) {
    desafios.push('Dificuldade de contato');
  }

  // Desafios comuns por setor
  const desafiosPorSetor: Record<string, string[]> = {
    'comércio': ['Alta concorrência', 'Margens apertadas'],
    'serviços': ['Dependência de mão de obra', 'Sazonalidade'],
    'indústria': ['Custos operacionais altos', 'Complexidade logística']
  };

  if (lead.setor) {
    for (const [setor, desafiosSetor] of Object.entries(desafiosPorSetor)) {
      if (lead.setor.toLowerCase().includes(setor)) {
        desafios.push(...desafiosSetor);
        break;
      }
    }
  }

  return desafios;
}


/**
 * Criar campanha com mensagens personalizadas
 */
async function criarCampanha(
  leads: Lead[],
  perfis: Map<string, PerfilComercial>,
  batch: LeadBatch,
  tenantId: string,
  logger: Logger
): Promise<Campanha> {
  logger.info('Criando campanha', {
    segmento: batch.segmento,
    atividade: batch.atividade,
    leadCount: leads.length
  });

  const campanhaId = uuidv4();

  // Determinar canal ideal baseado no segmento
  const canal = determinarCanalIdeal(batch.segmento, leads);

  // Criar mensagens para cada estágio do funil
  const mensagensTopo = criarMensagensTopo(batch.segmento, batch.atividade, perfis, leads);
  const mensagensMeio = criarMensagensMeio(batch.segmento, batch.atividade, perfis, leads);
  const mensagensFundo = criarMensagensFundo(batch.segmento, batch.atividade, perfis, leads);

  // Planejar ritmo de disparos
  const ritmo = planejarRitmoDisparos(batch.segmento, perfis, leads);

  const campanha: Campanha = {
    id: campanhaId,
    tenantId,
    nome: `Campanha ${batch.segmento} - ${batch.atividade}`,
    segmento: batch.segmento,
    atividade: batch.atividade,
    canal,
    mensagens: {
      topo: mensagensTopo,
      meio: mensagensMeio,
      fundo: mensagensFundo
    },
    ritmo,
    status: 'aprovada', // Em produção, seria 'rascunho' até aprovação humana
    leadIds: leads.map(l => l.id),
    metadata: {
      criadoEm: new Date().toISOString(),
      prioridadeMedia: batch.prioridadeMedia,
      perfilMaturidade: calcularMaturidadeMedia(perfis),
      perfilPotencial: calcularPotencialMedio(perfis)
    }
  };

  logger.info('Campanha criada', {
    id: campanha.id,
    nome: campanha.nome,
    canal: campanha.canal,
    leadCount: campanha.leadIds.length
  });

  return campanha;
}

/**
 * Determinar canal ideal (WhatsApp, Email ou Multi)
 */
function determinarCanalIdeal(
  segmento: string,
  leads: Lead[]
): 'whatsapp' | 'email' | 'multi' {
  // Contar quantos leads têm telefone vs email
  const comTelefone = leads.filter(l => l.telefone).length;
  const comEmail = leads.filter(l => l.email).length;

  // Se maioria tem ambos, usar multi-canal
  if (comTelefone > leads.length * 0.7 && comEmail > leads.length * 0.7) {
    return 'multi';
  }

  // Se maioria tem telefone, usar WhatsApp
  if (comTelefone > comEmail) {
    return 'whatsapp';
  }

  // Caso contrário, usar email
  return 'email';
}

/**
 * Criar mensagens para Topo do Funil (Awareness)
 */
function criarMensagensTopo(
  segmento: string,
  atividade: string,
  perfis: Map<string, PerfilComercial>,
  leads: Lead[]
): MensagemCampanha[] {
  const mensagens: MensagemCampanha[] = [];

  // Variação A - Abordagem educativa
  mensagens.push({
    tipo: 'topo',
    variacao: 'A',
    conteudo: `Olá! 👋

Notei que sua empresa atua no segmento de ${atividade}.

Você sabia que empresas desse setor estão enfrentando desafios como:
• Digitalização de processos
• Otimização de custos operacionais
• Aumento de produtividade

Temos ajudado empresas similares a superar esses desafios.

Gostaria de conhecer mais sobre como podemos ajudar?`,
    cta: 'Sim, tenho interesse!'
  });

  // Variação B - Abordagem de valor
  mensagens.push({
    tipo: 'topo',
    variacao: 'B',
    conteudo: `Olá! 👋

Empresas do segmento de ${atividade} estão alcançando resultados impressionantes:
• 30% de redução de custos
• 50% de aumento em produtividade
• Processos 3x mais rápidos

Quer saber como sua empresa pode alcançar resultados similares?`,
    cta: 'Quero saber mais'
  });

  // Variação C - Abordagem consultiva
  mensagens.push({
    tipo: 'topo',
    variacao: 'C',
    conteudo: `Olá! 👋

Estou fazendo uma pesquisa com empresas de ${atividade} para entender os principais desafios do setor.

Posso fazer 3 perguntas rápidas? Em troca, compartilho insights valiosos que coletamos de outras empresas.`,
    cta: 'Sim, pode perguntar'
  });

  return mensagens;
}

/**
 * Criar mensagens para Meio do Funil (Consideration)
 */
function criarMensagensMeio(
  segmento: string,
  atividade: string,
  perfis: Map<string, PerfilComercial>,
  leads: Lead[]
): MensagemCampanha[] {
  const mensagens: MensagemCampanha[] = [];

  // Variação A - Case de sucesso
  mensagens.push({
    tipo: 'meio',
    variacao: 'A',
    conteudo: `Ótimo! 🎯

Deixa eu te contar sobre a [Empresa X], que também atua em ${atividade}.

Eles estavam enfrentando:
❌ Processos manuais demorados
❌ Falta de visibilidade de dados
❌ Custos operacionais altos

Após implementar nossa solução:
✅ 40% de redução no tempo de processos
✅ Dashboards em tempo real
✅ ROI de 300% em 6 meses

Quer ver como isso funcionaria na sua empresa?`,
    cta: 'Sim, quero ver!'
  });

  // Variação B - Demonstração de valor
  mensagens.push({
    tipo: 'meio',
    variacao: 'B',
    conteudo: `Perfeito! 📊

Preparei uma análise rápida do potencial de economia para empresas como a sua:

• Economia estimada: R$ 50-100k/ano
• Tempo de implementação: 30-60 dias
• ROI esperado: 6-12 meses

Gostaria de receber uma análise personalizada para sua empresa?`,
    cta: 'Sim, quero a análise'
  });

  // Variação C - Prova social
  mensagens.push({
    tipo: 'meio',
    variacao: 'C',
    conteudo: `Que bom! 🌟

Atualmente trabalhamos com mais de 50 empresas de ${atividade}, incluindo:
• [Cliente 1]
• [Cliente 2]
• [Cliente 3]

Todas alcançaram resultados significativos nos primeiros 3 meses.

Quer conversar com um dos nossos clientes para ouvir a experiência deles?`,
    cta: 'Sim, quero conversar'
  });

  return mensagens;
}

/**
 * Criar mensagens para Fundo do Funil (Decision)
 */
function criarMensagensFundo(
  segmento: string,
  atividade: string,
  perfis: Map<string, PerfilComercial>,
  leads: Lead[]
): MensagemCampanha[] {
  const mensagens: MensagemCampanha[] = [];

  // Variação A - Proposta comercial
  mensagens.push({
    tipo: 'fundo',
    variacao: 'A',
    conteudo: `Excelente! 🎉

Preparei uma proposta personalizada para sua empresa com:

📋 Escopo detalhado da solução
💰 Investimento e condições especiais
📈 Projeção de resultados
🗓️ Cronograma de implementação

Podemos agendar 30 minutos para eu apresentar a proposta?

Tenho disponibilidade:
• Terça, 14h
• Quarta, 10h
• Quinta, 15h

Qual horário funciona melhor para você?`,
    cta: 'Agendar reunião'
  });

  // Variação B - Trial/Piloto
  mensagens.push({
    tipo: 'fundo',
    variacao: 'B',
    conteudo: `Perfeito! 🚀

Que tal começarmos com um projeto piloto?

✨ Implementação em 1 área específica
✨ Duração: 30 dias
✨ Investimento reduzido
✨ Sem compromisso de longo prazo

Assim você pode ver os resultados antes de expandir.

Vamos agendar uma conversa para definir o piloto?`,
    cta: 'Sim, vamos agendar'
  });

  // Variação C - Urgência/Escassez
  mensagens.push({
    tipo: 'fundo',
    variacao: 'C',
    conteudo: `Ótima notícia! ⚡

Temos uma condição especial válida até o final do mês:

🎁 20% de desconto na implementação
🎁 3 meses de suporte premium grátis
🎁 Treinamento completo da equipe

São apenas 5 vagas disponíveis e já temos 3 empresas confirmadas.

Podemos agendar uma reunião esta semana para garantir sua vaga?`,
    cta: 'Quero garantir minha vaga'
  });

  return mensagens;
}

/**
 * Planejar ritmo de disparos
 */
function planejarRitmoDisparos(
  segmento: string,
  perfis: Map<string, PerfilComercial>,
  leads: Lead[]
): Campanha['ritmo'] {
  // Horários comerciais otimizados
  const horarios = [
    '09:30', // Início da manhã
    '11:00', // Meio da manhã
    '14:30', // Início da tarde
    '16:00'  // Meio da tarde
  ];

  // Frequência baseada no ciclo de venda médio
  const ciclosMedios = Array.from(perfis.values()).map(p => p.cicloVenda);
  const cicloMaisComum = ciclosMedios.sort((a, b) => 
    ciclosMedios.filter(c => c === a).length - ciclosMedios.filter(c => c === b).length
  )[0];

  let frequencia: string;
  let intervaloMinimo: number;

  if (cicloMaisComum === 'curto') {
    frequencia = '1x/dia';
    intervaloMinimo = 24; // 24 horas
  } else if (cicloMaisComum === 'longo') {
    frequencia = '2x/semana';
    intervaloMinimo = 72; // 3 dias
  } else {
    frequencia = '3x/semana';
    intervaloMinimo = 48; // 2 dias
  }

  return {
    horarios,
    frequencia,
    intervaloMinimo
  };
}

/**
 * Calcular maturidade média dos perfis
 */
function calcularMaturidadeMedia(perfis: Map<string, PerfilComercial>): string {
  const maturidades = Array.from(perfis.values()).map(p => p.maturidade);
  const contagem: Record<string, number> = {};

  for (const mat of maturidades) {
    contagem[mat] = (contagem[mat] || 0) + 1;
  }

  // Retornar a maturidade mais comum
  return Object.entries(contagem).sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * Calcular potencial médio dos perfis
 */
function calcularPotencialMedio(perfis: Map<string, PerfilComercial>): string {
  const potenciais = Array.from(perfis.values()).map(p => p.potencialCompra);
  const contagem: Record<string, number> = {};

  for (const pot of potenciais) {
    contagem[pot] = (contagem[pot] || 0) + 1;
  }

  // Retornar o potencial mais comum
  return Object.entries(contagem).sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * Salvar campanha no banco de dados
 */
async function salvarCampanha(
  campanha: Campanha,
  logger: Logger
): Promise<void> {
  logger.info('Salvando campanha no banco de dados', {
    id: campanha.id,
    nome: campanha.nome
  });

  try {
    await query(
      `INSERT INTO nigredo_leads.campanhas (
        id, tenant_id, nome, segmento, atividade, canal,
        mensagens, ritmo, status, lead_ids, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      ON CONFLICT (id) DO UPDATE SET
        updated_at = NOW(),
        status = EXCLUDED.status`,
      [
        campanha.id,
        campanha.tenantId,
        campanha.nome,
        campanha.segmento,
        campanha.atividade,
        campanha.canal,
        JSON.stringify(campanha.mensagens),
        JSON.stringify(campanha.ritmo),
        campanha.status,
        campanha.leadIds,
        JSON.stringify(campanha.metadata)
      ]
    );

    logger.info('Campanha salva com sucesso', {
      id: campanha.id
    });
  } catch (error) {
    logger.error('Erro ao salvar campanha', error as Error, {
      id: campanha.id
    });
    throw error;
  }
}

/**
 * Publicar evento de conclusão no EventBridge
 */
async function publishCompletionEvent(
  campanha: Campanha,
  traceId: string,
  logger: Logger
): Promise<void> {
  try {
    // Gerar pré-visualizações das mensagens
    const previews = {
      topo: campanha.mensagens.topo.map(m => ({
        variacao: m.variacao,
        preview: m.conteudo.substring(0, 100) + '...'
      })),
      meio: campanha.mensagens.meio.map(m => ({
        variacao: m.variacao,
        preview: m.conteudo.substring(0, 100) + '...'
      })),
      fundo: campanha.mensagens.fundo.map(m => ({
        variacao: m.variacao,
        preview: m.conteudo.substring(0, 100) + '...'
      }))
    };

    const command = new PutEventsCommand({
      Entries: [
        {
          Source: 'nigredo.estrategia',
          DetailType: 'estrategia.completed',
          Detail: JSON.stringify({
            campanhaId: campanha.id,
            tenantId: campanha.tenantId,
            nome: campanha.nome,
            segmento: campanha.segmento,
            atividade: campanha.atividade,
            canal: campanha.canal,
            leadCount: campanha.leadIds.length,
            leadIds: campanha.leadIds,
            status: campanha.status,
            previews,
            ritmo: campanha.ritmo,
            metadata: campanha.metadata,
            traceId,
            timestamp: new Date().toISOString()
          }),
          EventBusName: EVENT_BUS_NAME
        }
      ]
    });

    const response = await eventBridgeClient.send(command);

    logger.info('Evento de conclusão publicado', {
      eventBusName: EVENT_BUS_NAME,
      campanhaId: campanha.id,
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
