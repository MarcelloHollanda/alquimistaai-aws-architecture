/**
 * Handler Dry-Run - Micro Agente de Disparos & Agendamentos
 * 
 * Fluxo mínimo end-to-end em modo dry-run:
 * 1. Lê 1 lead (ou pequeno lote) da fonte de dados
 * 2. Decide qual canal usar (WhatsApp / Email / Agenda)
 * 3. NÃO dispara mensagens reais quando MICRO_AGENT_DISPARO_ENABLED != "true"
 * 4. Registra o "disparo pretendido" em log estruturado e tabela de auditoria
 * 
 * Variáveis de Ambiente:
 * - MICRO_AGENT_DISPARO_ENABLED: "true" | "false" (default: "false")
 * - DB_SECRET_ARN: ARN do secret com credenciais do Aurora
 * - EVENT_BUS_NAME: Nome do EventBridge bus
 * - ENVIRONMENT: "dev" | "prod"
 */

import { Handler, Context } from 'aws-lambda';
import { 
  decidirCanal, 
  verificarSeDisparoSeriaExecutado, 
  estaEmHorarioComercial,
  Lead,
  CanalDecision 
} from '../utils/canal-decision';

// Interfaces
interface DryRunEvent {
  tenantId?: string;
  leadId?: string;
  batchSize?: number; // Quantos leads processar (default: 1)
}

interface DryRunResponse {
  success: boolean;
  leadsProcessados: number;
  decisoes: Array<{
    lead: {
      id?: string;
      nome: string;
    };
    canal: string;
    motivo: string;
    seria_executado: boolean;
    razao_bloqueio?: string;
  }>;
  logs: string[];
}

interface DryRunLogEntry {
  log_id?: string;
  tenant_id: string;
  lead_id?: string;
  lead_nome: string;
  lead_telefone?: string;
  lead_email?: string;
  lead_documento?: string;
  canal_decidido: string;
  motivo_decisao: string;
  template_selecionado?: string;
  disparo_seria_executado: boolean;
  razao_bloqueio?: string;
  ambiente: string;
  feature_flag_enabled: boolean;
}

/**
 * Handler principal do dry-run
 */
export const handler: Handler = async (
  event: DryRunEvent,
  context: Context
): Promise<DryRunResponse> => {
  const logs: string[] = [];
  const decisoes: DryRunResponse['decisoes'] = [];
  
  // Configuração
  const DISPARO_ENABLED = process.env.MICRO_AGENT_DISPARO_ENABLED === 'true';
  const ENVIRONMENT = process.env.ENVIRONMENT || 'dev';
  const BATCH_SIZE = event.batchSize || 1;
  
  logs.push(`[DRY-RUN] Iniciando em ambiente: ${ENVIRONMENT}`);
  logs.push(`[DRY-RUN] Feature flag DISPARO_ENABLED: ${DISPARO_ENABLED}`);
  logs.push(`[DRY-RUN] Batch size: ${BATCH_SIZE}`);
  
  try {
    // 1. Buscar leads de teste
    const leads = await buscarLeadsDeTeste(BATCH_SIZE, event.tenantId);
    logs.push(`[DRY-RUN] ${leads.length} lead(s) encontrado(s)`);
    
    // 2. Processar cada lead
    for (const lead of leads) {
      logs.push(`\n[DRY-RUN] Processando lead: ${lead.nome}`);
      
      // 2.1. Decidir canal
      const decision = decidirCanal(lead);
      logs.push(`[DRY-RUN] Canal decidido: ${decision.canal}`);
      logs.push(`[DRY-RUN] Motivo: ${decision.motivo}`);
      
      if (decision.template) {
        logs.push(`[DRY-RUN] Template: ${decision.template}`);
      }
      
      if (decision.destino) {
        logs.push(`[DRY-RUN] Destino: ${decision.destino}`);
      }
      
      // 2.2. Verificar se disparo seria executado
      const check = verificarSeDisparoSeriaExecutado(decision, {
        horarioComercial: estaEmHorarioComercial(),
        rateLimitAtingido: false, // TODO: Implementar verificação real
        leadEmBlacklist: false // TODO: Implementar verificação real
      });
      
      logs.push(`[DRY-RUN] Seria executado: ${check.seria_executado}`);
      if (check.razao_bloqueio) {
        logs.push(`[DRY-RUN] Razão de bloqueio: ${check.razao_bloqueio}`);
      }
      
      // 2.3. Registrar decisão
      const logEntry: DryRunLogEntry = {
        tenant_id: event.tenantId || 'default',
        lead_id: lead.lead_id,
        lead_nome: lead.nome,
        lead_telefone: decision.destino && decision.canal === 'whatsapp' ? decision.destino : undefined,
        lead_email: decision.destino && decision.canal === 'email' ? decision.destino : undefined,
        lead_documento: lead.documento,
        canal_decidido: decision.canal,
        motivo_decisao: decision.motivo,
        template_selecionado: decision.template,
        disparo_seria_executado: check.seria_executado,
        razao_bloqueio: check.razao_bloqueio,
        ambiente: ENVIRONMENT,
        feature_flag_enabled: DISPARO_ENABLED
      };
      
      // 2.4. Persistir log (se DB disponível)
      try {
        await persistirDryRunLog(logEntry);
        logs.push(`[DRY-RUN] Log persistido no banco de dados`);
      } catch (error) {
        logs.push(`[DRY-RUN] AVISO: Não foi possível persistir log no banco: ${error}`);
        // Não falhar o dry-run se o banco não estiver disponível
      }
      
      // 2.5. Adicionar à resposta
      decisoes.push({
        lead: {
          id: lead.lead_id,
          nome: lead.nome
        },
        canal: decision.canal,
        motivo: decision.motivo,
        seria_executado: check.seria_executado,
        razao_bloqueio: check.razao_bloqueio
      });
      
      // 2.6. Se DISPARO_ENABLED = true, aqui seria feita a chamada real ao MCP
      if (DISPARO_ENABLED && check.seria_executado && decision.canal !== 'none') {
        logs.push(`[DRY-RUN] ⚠️ DISPARO_ENABLED=true: Disparo SERIA executado aqui`);
        logs.push(`[DRY-RUN] ⚠️ Integração com MCP ${decision.canal.toUpperCase()} não implementada nesta versão`);
        // TODO: Implementar chamada real ao MCP WhatsApp/Email
        // await enviarViaMCP(decision.canal, decision.destino, decision.template, lead);
      }
    }
    
    logs.push(`\n[DRY-RUN] Processamento concluído com sucesso`);
    
    // Log estruturado para CloudWatch
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      service: 'dry-run',
      action: 'process_leads',
      result: 'success',
      leadsProcessados: leads.length,
      decisoes: decisoes,
      environment: ENVIRONMENT,
      featureFlagEnabled: DISPARO_ENABLED
    }));
    
    return {
      success: true,
      leadsProcessados: leads.length,
      decisoes,
      logs
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logs.push(`[DRY-RUN] ERRO: ${errorMessage}`);
    
    // Log de erro estruturado
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      service: 'dry-run',
      action: 'process_leads',
      result: 'failure',
      error: {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      }
    }));
    
    return {
      success: false,
      leadsProcessados: 0,
      decisoes: [],
      logs
    };
  }
};

/**
 * Busca leads de teste da fonte de dados
 * 
 * NOTA: Esta é uma implementação mock para dry-run.
 * Na implementação real, isso virá de:
 * - Tabela `leads` após ingestão
 * - View `leads_para_disparo`
 * - Endpoint/fila específica
 */
async function buscarLeadsDeTeste(
  batchSize: number,
  tenantId?: string
): Promise<Lead[]> {
  // TODO: Implementar busca real no banco de dados
  // Por enquanto, retornar dados mock baseados em Leads_Consolidados_Telefones_Emails
  
  return [
    {
      lead_id: 'mock-lead-001',
      nome: 'Empresa Teste Ltda',
      contato_nome: 'joao.silva',
      documento: '12345678000199',
      telefone_raw: '(84)99708-4444',
      email_raw: 'contato@empresateste.com.br'
    },
    {
      lead_id: 'mock-lead-002',
      nome: 'Comércio Exemplo ME',
      contato_nome: 'maria.santos',
      documento: '98765432000188',
      telefone_raw: '', // Sem telefone
      email_raw: 'financeiro@comercioexemplo.com.br'
    },
    {
      lead_id: 'mock-lead-003',
      nome: 'Indústria Sem Contato SA',
      contato_nome: '',
      documento: '11223344000177',
      telefone_raw: '', // Sem telefone
      email_raw: '' // Sem email
    }
  ].slice(0, batchSize);
}

/**
 * Persiste log de dry-run no banco de dados
 * 
 * NOTA: Requer que a migration 007 tenha sido executada
 */
async function persistirDryRunLog(logEntry: DryRunLogEntry): Promise<void> {
  // TODO: Implementar persistência real no Aurora
  // Por enquanto, apenas simular
  
  const DB_SECRET_ARN = process.env.DB_SECRET_ARN;
  
  if (!DB_SECRET_ARN) {
    throw new Error('DB_SECRET_ARN não configurado');
  }
  
  // Simulação de INSERT
  console.log('[DRY-RUN] Simulando INSERT em dry_run_log:', JSON.stringify(logEntry, null, 2));
  
  // Na implementação real:
  // const dbClient = await getDbClient(DB_SECRET_ARN);
  // await dbClient.query(`
  //   INSERT INTO dry_run_log (
  //     tenant_id, lead_id, lead_nome, lead_telefone, lead_email, lead_documento,
  //     canal_decidido, motivo_decisao, template_selecionado,
  //     disparo_seria_executado, razao_bloqueio, ambiente, feature_flag_enabled
  //   ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
  // `, [
  //   logEntry.tenant_id, logEntry.lead_id, logEntry.lead_nome,
  //   logEntry.lead_telefone, logEntry.lead_email, logEntry.lead_documento,
  //   logEntry.canal_decidido, logEntry.motivo_decisao, logEntry.template_selecionado,
  //   logEntry.disparo_seria_executado, logEntry.razao_bloqueio,
  //   logEntry.ambiente, logEntry.feature_flag_enabled
  // ]);
}
