import { SQSEvent, SQSRecord, Context } from 'aws-lambda';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { withSimpleErrorHandling } from '../shared/error-handler';
import { createAgentLogger, Logger } from '../shared/logger';
import { query, getPool } from '../shared/database';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import * as crypto from 'crypto';
import { createEnrichmentMCPServer, EnrichedCompanyData } from '../../mcp-integrations/servers/enrichment';
import { isBlocked, recordConsent } from '../shared/lgpd-compliance';

// Initialize AWS clients
const eventBridgeClient = new EventBridgeClient({});
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || 'fibonacci-bus-dev';

/**
 * Lead input schema validation
 */
const LeadInputSchema = z.object({
  empresa: z.string().min(1, 'Empresa é obrigatória'),
  contato: z.string().min(1, 'Contato é obrigatório'),
  telefone: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
  cnpj: z.string().optional(),
  setor: z.string().optional(),
  porte: z.enum(['MEI', 'ME', 'EPP', 'Média', 'Grande']).optional(),
  atividadePrincipal: z.string().optional(),
  metadata: z.record(z.any()).optional()
}).refine(
  (data) => data.telefone || data.email,
  {
    message: 'Pelo menos telefone ou email deve ser fornecido',
    path: ['telefone']
  }
);

type LeadInput = z.infer<typeof LeadInputSchema>;

/**
 * Lead processado com dados higienizados
 */
interface ProcessedLead {
  id: string;
  tenantId: string;
  empresa: string;
  contato: string;
  telefone?: string;
  email?: string;
  cnpj?: string;
  tipoPessoa: 'PF' | 'PJ';
  setor?: string;
  porte?: string;
  atividadePrincipal?: string;
  status: string;
  prioridade?: number; // Score 0-100
  segmento?: string;
  metadata: Record<string, any>;
  hash: string;
}

/**
 * Lote de leads segmentados
 */
interface LeadBatch {
  segmento: string;
  atividade: string;
  leads: ProcessedLead[];
  prioridadeMedia: number;
}

/**
 * Relatório de inconformidades
 */
interface InconformidadeReport {
  totalLeads: number;
  leadsValidos: number;
  leadsInvalidos: number;
  duplicatasRemovidas: number;
  leadsEnriquecidos: number;
  falhasEnriquecimento: number;
  inconformidades: Array<{
    lead: string;
    campo: string;
    motivo: string;
  }>;
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
 * Agente de Recebimento - Nigredo
 * 
 * Responsável por:
 * - Receber planilhas Excel ou JSON com leads
 * - Validar campos obrigatórios
 * - Diferenciar PF de PJ usando validação de CNPJ
 * - Formatar telefones para padrão internacional (+55...)
 * - Formatar emails para lowercase
 * - Remover duplicatas usando hash de email+telefone
 * 
 * Requirements: 11.3
 */
export const handler = withSimpleErrorHandling(
  async (event: SQSEvent, context: Context, logger: Logger) => {
    logger.info('Agente de Recebimento iniciado', {
      recordCount: event.Records.length,
      functionName: context.functionName
    });

    const report: InconformidadeReport = {
      totalLeads: 0,
      leadsValidos: 0,
      leadsInvalidos: 0,
      duplicatasRemovidas: 0,
      leadsEnriquecidos: 0,
      falhasEnriquecimento: 0,
      inconformidades: []
    };

    for (const record of event.Records) {
      try {
        await processRecord(record, logger, report);
      } catch (error) {
        logger.error('Erro ao processar registro SQS', error as Error, {
          messageId: record.messageId
        });
        // Continue processando outros registros
      }
    }

    logger.info('Agente de Recebimento concluído', {
      report
    });

    return {
      statusCode: 200,
      body: JSON.stringify(report)
    };
  }
);

/**
 * Processar um registro SQS
 */
async function processRecord(
  record: SQSRecord,
  logger: Logger,
  report: InconformidadeReport
): Promise<void> {
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

  // Extract leads array and tenant ID
  const leads: LeadInput[] = detail.leads || [];
  const tenantId: string = detail.tenantId || detail.tenant_id || 'default';

  // Update logger context with tenant ID
  logger.updateContext({ tenantId });

  logger.info('Leads recebidos', {
    count: leads.length
  });

  report.totalLeads += leads.length;

  // Step 1: Validar e higienizar leads
  const validatedLeads = await validateAndCleanLeads(leads, tenantId, logger, report);

  // Step 2: Remover duplicatas
  const uniqueLeads = removeDuplicates(validatedLeads, logger, report);

  // Step 3: Enriquecer dados via MCP
  const enrichedLeads = await enrichLeads(uniqueLeads, logger, report);

  // Step 4: Segmentar e priorizar leads
  const segmentedLeads = segmentAndPrioritizeLeads(enrichedLeads, logger);

  // Step 5: Criar lotes homogêneos
  const batches = createBatches(segmentedLeads, logger);

  // Step 6: Persistir leads no banco de dados
  const savedLeads = await saveLeads(segmentedLeads, logger);

  logger.info('Leads salvos no banco de dados', {
    count: savedLeads.length,
    traceId
  });

  // Step 7: Publicar evento de conclusão com lotes
  await publishCompletionEvent(savedLeads, batches, tenantId, traceId, logger);
}

/**
 * Validar e higienizar leads
 */
async function validateAndCleanLeads(
  leads: LeadInput[],
  tenantId: string,
  logger: Logger,
  report: InconformidadeReport
): Promise<ProcessedLead[]> {
  const processedLeads: ProcessedLead[] = [];

  for (const lead of leads) {
    try {
      // Validar schema
      const validationResult = LeadInputSchema.safeParse(lead);

      if (!validationResult.success) {
        report.leadsInvalidos++;
        report.inconformidades.push({
          lead: lead.empresa || 'Desconhecido',
          campo: 'validação',
          motivo: validationResult.error.errors.map(e => e.message).join(', ')
        });
        logger.warn('Lead inválido', {
          empresa: lead.empresa,
          errors: validationResult.error.errors
        });
        continue;
      }

      const validLead = validationResult.data;

      // Higienizar dados
      const telefoneFormatado = validLead.telefone ? formatTelefone(validLead.telefone) : undefined;
      const emailFormatado = validLead.email ? formatEmail(validLead.email) : undefined;

      // LGPD: Check if contact is in blocklist
      const db = await getPool();
      const blocked = await isBlocked(db, telefoneFormatado, emailFormatado);
      if (blocked) {
        report.leadsInvalidos++;
        report.inconformidades.push({
          lead: validLead.empresa,
          campo: 'lgpd',
          motivo: 'Contato está na blocklist (descadastrado anteriormente)'
        });
        logger.warn('Lead bloqueado por LGPD', {
          empresa: validLead.empresa,
          telefone: telefoneFormatado,
          email: emailFormatado
        });
        continue;
      }

      const processed: ProcessedLead = {
        id: uuidv4(),
        tenantId,
        empresa: validLead.empresa.trim(),
        contato: validLead.contato.trim(),
        telefone: telefoneFormatado,
        email: emailFormatado,
        cnpj: validLead.cnpj ? normalizeCNPJ(validLead.cnpj) : undefined,
        tipoPessoa: 'PF', // Default
        setor: validLead.setor,
        porte: validLead.porte,
        atividadePrincipal: validLead.atividadePrincipal,
        status: 'novo',
        metadata: validLead.metadata || {},
        hash: '' // Will be calculated below
      };

      // Diferenciar PF de PJ usando CNPJ
      if (processed.cnpj) {
        if (isValidCNPJ(processed.cnpj)) {
          processed.tipoPessoa = 'PJ';
        } else {
          report.inconformidades.push({
            lead: processed.empresa,
            campo: 'cnpj',
            motivo: 'CNPJ inválido'
          });
          processed.cnpj = undefined; // Remove CNPJ inválido
        }
      }

      // Calcular hash para detecção de duplicatas
      processed.hash = calculateLeadHash(processed.email, processed.telefone);

      processedLeads.push(processed);
      report.leadsValidos++;

    } catch (error) {
      report.leadsInvalidos++;
      report.inconformidades.push({
        lead: lead.empresa || 'Desconhecido',
        campo: 'processamento',
        motivo: (error as Error).message
      });
      logger.error('Erro ao processar lead', error as Error, {
        empresa: lead.empresa
      });
    }
  }

  return processedLeads;
}

/**
 * Formatar telefone para padrão internacional (+55...)
 */
function formatTelefone(telefone: string): string {
  // Remove todos os caracteres não numéricos
  let cleaned = telefone.replace(/\D/g, '');

  // Se não começa com código do país, adiciona +55
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }

  // Adiciona o +
  return '+' + cleaned;
}

/**
 * Formatar email para lowercase
 */
function formatEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Normalizar CNPJ (remover formatação)
 */
function normalizeCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}

/**
 * Validar CNPJ
 */
function isValidCNPJ(cnpj: string): boolean {
  // Remove formatação
  const cleaned = cnpj.replace(/\D/g, '');

  // CNPJ deve ter 14 dígitos
  if (cleaned.length !== 14) {
    return false;
  }

  // Verifica se todos os dígitos são iguais (inválido)
  if (/^(\d)\1+$/.test(cleaned)) {
    return false;
  }

  // Validação dos dígitos verificadores
  let tamanho = cleaned.length - 2;
  let numeros = cleaned.substring(0, tamanho);
  const digitos = cleaned.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) {
    return false;
  }

  tamanho = tamanho + 1;
  numeros = cleaned.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1))) {
    return false;
  }

  return true;
}

/**
 * Calcular hash único para lead (email + telefone)
 */
function calculateLeadHash(email?: string, telefone?: string): string {
  const data = `${email || ''}|${telefone || ''}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Remover duplicatas usando hash
 */
function removeDuplicates(
  leads: ProcessedLead[],
  logger: Logger,
  report: InconformidadeReport
): ProcessedLead[] {
  const seen = new Set<string>();
  const unique: ProcessedLead[] = [];

  for (const lead of leads) {
    if (seen.has(lead.hash)) {
      report.duplicatasRemovidas++;
      logger.debug('Duplicata removida', {
        empresa: lead.empresa,
        hash: lead.hash
      });
      continue;
    }

    seen.add(lead.hash);
    unique.push(lead);
  }

  logger.info('Duplicatas removidas', {
    total: leads.length,
    unique: unique.length,
    duplicates: report.duplicatasRemovidas
  });

  return unique;
}

/**
 * Enriquecer leads com dados externos via MCP
 */
async function enrichLeads(
  leads: ProcessedLead[],
  logger: Logger,
  report: InconformidadeReport
): Promise<ProcessedLead[]> {
  const enrichedLeads: ProcessedLead[] = [];

  for (const lead of leads) {
    try {
      logger.debug('Enriquecendo lead', {
        id: lead.id,
        empresa: lead.empresa,
        hasCNPJ: !!lead.cnpj
      });

      let enrichmentData: EnrichedCompanyData | null = null;

      // Tentar enriquecer dados
      try {
        enrichmentData = await enrichmentServer.enrichCompany({
          cnpj: lead.cnpj,
          companyName: lead.empresa,
          includeLinkedIn: false // LinkedIn é opcional e pode ter custo
        });

        // Completar campos faltantes com dados enriquecidos
        if (enrichmentData.cnpj) {
          lead.setor = lead.setor || enrichmentData.cnpj.atividadePrincipal?.descricao;
          lead.porte = lead.porte || enrichmentData.cnpj.porte;
          lead.atividadePrincipal = lead.atividadePrincipal || enrichmentData.cnpj.atividadePrincipal?.descricao;
          
          // Atualizar telefone e email se não fornecidos
          if (!lead.telefone && enrichmentData.cnpj.telefone) {
            lead.telefone = formatTelefone(enrichmentData.cnpj.telefone);
          }
          if (!lead.email && enrichmentData.cnpj.email) {
            lead.email = formatEmail(enrichmentData.cnpj.email);
          }

          // Adicionar dados completos ao metadata
          lead.metadata.enrichment = {
            sources: enrichmentData.sources,
            date: enrichmentData.enrichmentDate,
            cnpj: {
              razaoSocial: enrichmentData.cnpj.razaoSocial,
              nomeFantasia: enrichmentData.cnpj.nomeFantasia,
              situacaoCadastral: enrichmentData.cnpj.situacaoCadastral,
              dataAbertura: enrichmentData.cnpj.dataAbertura,
              capitalSocial: enrichmentData.cnpj.capitalSocial,
              endereco: enrichmentData.cnpj.endereco
            }
          };
        }

        if (enrichmentData.places) {
          lead.metadata.enrichment = lead.metadata.enrichment || {};
          lead.metadata.enrichment.places = {
            name: enrichmentData.places.name,
            address: enrichmentData.places.formattedAddress,
            phone: enrichmentData.places.phoneNumber,
            website: enrichmentData.places.website,
            rating: enrichmentData.places.rating
          };

          // Atualizar telefone se não fornecido
          if (!lead.telefone && enrichmentData.places.phoneNumber) {
            lead.telefone = formatTelefone(enrichmentData.places.phoneNumber);
          }
        }

        report.leadsEnriquecidos++;
        logger.info('Lead enriquecido com sucesso', {
          id: lead.id,
          empresa: lead.empresa,
          sources: enrichmentData.sources
        });

      } catch (enrichError) {
        report.falhasEnriquecimento++;
        report.inconformidades.push({
          lead: lead.empresa,
          campo: 'enriquecimento',
          motivo: (enrichError as Error).message
        });
        logger.warn('Falha ao enriquecer lead', {
          id: lead.id,
          empresa: lead.empresa,
          error: (enrichError as Error).message
        });
        // Continue sem enriquecimento
      }

      // Atualizar status para 'enriquecido' se teve sucesso
      if (enrichmentData && enrichmentData.sources.length > 0) {
        lead.status = 'enriquecido';
      }

      enrichedLeads.push(lead);

    } catch (error) {
      logger.error('Erro ao processar enriquecimento do lead', error as Error, {
        id: lead.id,
        empresa: lead.empresa
      });
      // Adicionar lead sem enriquecimento
      enrichedLeads.push(lead);
    }
  }

  logger.info('Enriquecimento concluído', {
    total: leads.length,
    enriquecidos: report.leadsEnriquecidos,
    falhas: report.falhasEnriquecimento
  });

  return enrichedLeads;
}

/**
 * Segmentar e priorizar leads
 */
function segmentAndPrioritizeLeads(
  leads: ProcessedLead[],
  logger: Logger
): ProcessedLead[] {
  logger.info('Iniciando segmentação e priorização', {
    count: leads.length
  });

  for (const lead of leads) {
    // Calcular score de prioridade (0-100)
    lead.prioridade = calculatePriorityScore(lead);

    // Definir segmento baseado em setor e porte
    lead.segmento = determineSegment(lead);

    logger.debug('Lead segmentado e priorizado', {
      id: lead.id,
      empresa: lead.empresa,
      prioridade: lead.prioridade,
      segmento: lead.segmento
    });
  }

  // Ordenar por prioridade (maior para menor)
  leads.sort((a, b) => (b.prioridade || 0) - (a.prioridade || 0));

  logger.info('Segmentação e priorização concluída', {
    count: leads.length,
    prioridadeMedia: leads.reduce((sum, l) => sum + (l.prioridade || 0), 0) / leads.length
  });

  return leads;
}

/**
 * Calcular score de prioridade (0-100)
 */
function calculatePriorityScore(lead: ProcessedLead): number {
  let score = 50; // Base score

  // Porte da empresa (+30 pontos para grandes empresas)
  if (lead.porte === 'Grande') {
    score += 30;
  } else if (lead.porte === 'Média') {
    score += 20;
  } else if (lead.porte === 'EPP') {
    score += 10;
  } else if (lead.porte === 'ME') {
    score += 5;
  }

  // Tipo de pessoa (+10 pontos para PJ)
  if (lead.tipoPessoa === 'PJ') {
    score += 10;
  }

  // Dados completos (+10 pontos)
  if (lead.telefone && lead.email && lead.cnpj) {
    score += 10;
  }

  // Enriquecimento bem-sucedido (+10 pontos)
  if (lead.metadata.enrichment && lead.metadata.enrichment.sources?.length > 0) {
    score += 10;
  }

  // Setor prioritário (+10 pontos para tecnologia, serviços, indústria)
  const setoresPrioritarios = ['tecnologia', 'software', 'serviços', 'indústria', 'consultoria'];
  if (lead.setor && setoresPrioritarios.some(s => lead.setor!.toLowerCase().includes(s))) {
    score += 10;
  }

  // Garantir que score está entre 0 e 100
  return Math.max(0, Math.min(100, score));
}

/**
 * Determinar segmento do lead
 */
function determineSegment(lead: ProcessedLead): string {
  // Segmentar por porte e setor
  const porte = lead.porte || 'Indefinido';
  const setor = lead.setor || 'Geral';

  // Simplificar setor para categorias principais
  let setorSimplificado = 'Outros';

  if (setor.toLowerCase().includes('tecnologia') || setor.toLowerCase().includes('software')) {
    setorSimplificado = 'Tecnologia';
  } else if (setor.toLowerCase().includes('serviços') || setor.toLowerCase().includes('consultoria')) {
    setorSimplificado = 'Serviços';
  } else if (setor.toLowerCase().includes('indústria') || setor.toLowerCase().includes('manufatura')) {
    setorSimplificado = 'Indústria';
  } else if (setor.toLowerCase().includes('comércio') || setor.toLowerCase().includes('varejo')) {
    setorSimplificado = 'Comércio';
  } else if (setor.toLowerCase().includes('saúde') || setor.toLowerCase().includes('médico')) {
    setorSimplificado = 'Saúde';
  } else if (setor.toLowerCase().includes('educação') || setor.toLowerCase().includes('ensino')) {
    setorSimplificado = 'Educação';
  }

  return `${setorSimplificado} - ${porte}`;
}

/**
 * Criar lotes homogêneos por atividade
 */
function createBatches(
  leads: ProcessedLead[],
  logger: Logger
): LeadBatch[] {
  logger.info('Criando lotes homogêneos', {
    count: leads.length
  });

  // Agrupar por segmento e atividade
  const groups = new Map<string, ProcessedLead[]>();

  for (const lead of leads) {
    const key = `${lead.segmento}|${lead.atividadePrincipal || 'Geral'}`;
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    
    groups.get(key)!.push(lead);
  }

  // Criar lotes
  const batches: LeadBatch[] = [];

  for (const [key, groupLeads] of groups.entries()) {
    const [segmento, atividade] = key.split('|');
    
    const prioridadeMedia = groupLeads.reduce((sum, l) => sum + (l.prioridade || 0), 0) / groupLeads.length;

    batches.push({
      segmento,
      atividade,
      leads: groupLeads,
      prioridadeMedia
    });
  }

  // Ordenar lotes por prioridade média (maior para menor)
  batches.sort((a, b) => b.prioridadeMedia - a.prioridadeMedia);

  logger.info('Lotes criados', {
    batchCount: batches.length,
    totalLeads: leads.length
  });

  return batches;
}

/**
 * Salvar leads no banco de dados
 */
async function saveLeads(
  leads: ProcessedLead[],
  logger: Logger
): Promise<ProcessedLead[]> {
  const savedLeads: ProcessedLead[] = [];

  for (const lead of leads) {
    try {
      await query(
        `INSERT INTO nigredo_leads.leads (
          id, tenant_id, empresa, contato, telefone, email, cnpj,
          tipo_pessoa, setor, porte, atividade_principal, status, prioridade, segmento,
          metadata, hash, consent_given, consent_date, consent_source, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW())
        ON CONFLICT (hash, tenant_id) DO UPDATE SET
          updated_at = NOW(),
          status = EXCLUDED.status,
          prioridade = EXCLUDED.prioridade,
          segmento = EXCLUDED.segmento`,
        [
          lead.id,
          lead.tenantId,
          lead.empresa,
          lead.contato,
          lead.telefone,
          lead.email,
          lead.cnpj,
          lead.tipoPessoa,
          lead.setor,
          lead.porte,
          lead.atividadePrincipal,
          lead.status,
          lead.prioridade,
          lead.segmento,
          JSON.stringify(lead.metadata),
          lead.hash,
          false, // consent_given - default to false, must be explicitly granted
          null,  // consent_date - will be set when consent is given
          'api'  // consent_source - indicates lead was received via API
        ]
      );

      savedLeads.push(lead);

      logger.debug('Lead salvo', {
        id: lead.id,
        empresa: lead.empresa,
        tipoPessoa: lead.tipoPessoa
      });
    } catch (error) {
      logger.error('Erro ao salvar lead', error as Error, {
        id: lead.id,
        empresa: lead.empresa
      });
      // Continue salvando outros leads
    }
  }

  return savedLeads;
}

/**
 * Publicar evento de conclusão no EventBridge
 */
async function publishCompletionEvent(
  leads: ProcessedLead[],
  batches: LeadBatch[],
  tenantId: string,
  traceId: string,
  logger: Logger
): Promise<void> {
  try {
    // Preparar dados dos lotes para o evento
    const batchesData = batches.map(batch => ({
      segmento: batch.segmento,
      atividade: batch.atividade,
      leadIds: batch.leads.map(l => l.id),
      count: batch.leads.length,
      prioridadeMedia: batch.prioridadeMedia
    }));

    const command = new PutEventsCommand({
      Entries: [
        {
          Source: 'nigredo.recebimento',
          DetailType: 'recebimento.completed',
          Detail: JSON.stringify({
            tenantId,
            leadIds: leads.map(l => l.id),
            count: leads.length,
            batches: batchesData,
            batchCount: batches.length,
            prioridadeMedia: leads.reduce((sum, l) => sum + (l.prioridade || 0), 0) / leads.length,
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
      leadCount: leads.length,
      batchCount: batches.length,
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
