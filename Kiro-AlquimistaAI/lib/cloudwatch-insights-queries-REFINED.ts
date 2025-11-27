// lib/cloudwatch-insights-queries-REFINED.ts
// 
// VERSÃO REFINADA DAS QUERIES - Para usar quando os logs estruturados estiverem implementados
// 
// Esta é uma versão avançada que assume logs estruturados em JSON com campos específicos
// do domínio Nigredo. Use esta versão quando as Lambdas estiverem logando em formato JSON.
//
// CONTRATO DE LOGS ESPERADO:
// {
//   "app": "nigredo",
//   "env": "dev",
//   "level": "INFO",
//   "message": "texto...",
//   "leadId": "lead_123",
//   "agentId": "agent_456",
//   "agentName": "Agente Carla",
//   "funnelStage": "qualified",
//   "eventType": "lead_received",
//   "endpoint": "/public/agent-interest",
//   "statusCode": 200,
//   "latencyMs": 123,
//   "mcpTool": "whatsapp_broadcast",
//   "mcpStatus": "success"
// }

import { Construct } from 'constructs';
import * as logs from 'aws-cdk-lib/aws-logs';

export interface CloudWatchInsightsQueriesProps {
  appName: string;
  stage: string;
  logGroups: logs.ILogGroup[];
}

export class CloudWatchInsightsQueriesRefined extends Construct {
  public readonly leadProcessingTimeQuery: logs.CfnQueryDefinition;
  public readonly errorsByAgentQuery: logs.CfnQueryDefinition;
  public readonly funnelConversionQuery: logs.CfnQueryDefinition;
  public readonly mcpCallsQuery: logs.CfnQueryDefinition;
  public readonly latencyByEndpointQuery: logs.CfnQueryDefinition;

  constructor(scope: Construct, id: string, props: CloudWatchInsightsQueriesProps) {
    super(scope, id);

    const logGroupNames = props.logGroups
      .map((lg) => lg.logGroupName)
      .filter((name): name is string => !!name && name.trim().length > 0);

    const commonProps =
      logGroupNames.length > 0
        ? { logGroupNames }
        : {};

    //
    // 1) LeadProcessingTimeQuery
    //    Tempo total de processamento por lead (da primeira à última interação)
    //
    this.leadProcessingTimeQuery = new logs.CfnQueryDefinition(this, 'LeadProcessingTimeQuery', {
      name: `${props.appName}-${props.stage}-lead-processing-time`,
      queryString: [
        'fields @timestamp, leadId, eventType, funnelStage',
        `| filter app = "${props.appName}" and env = "${props.stage}"`,
        '| filter ispresent(leadId)',
        '| stats',
        '    min(@timestamp) as firstEventTime,',
        '    max(@timestamp) as lastEventTime,',
        '    (lastEventTime - firstEventTime)/1000 as processingSeconds',
        '  by leadId',
        '| sort processingSeconds desc',
        '| limit 50',
      ].join('\n'),
      ...commonProps,
    });

    //
    // 2) ErrorsByAgentQuery
    //    Erros e warnings agrupados por agente
    //
    this.errorsByAgentQuery = new logs.CfnQueryDefinition(this, 'ErrorsByAgentQuery', {
      name: `${props.appName}-${props.stage}-errors-by-agent`,
      queryString: [
        'fields @timestamp, level, message, agentId, agentName',
        `| filter app = "${props.appName}" and env = "${props.stage}"`,
        '| filter level in ["ERROR", "WARN"]',
        '      or message like /ERROR|Error|Exception/',
        '| stats',
        '    count(*) as errorCount',
        '  by agentId, agentName',
        '| sort errorCount desc',
        '| limit 50',
      ].join('\n'),
      ...commonProps,
    });

    //
    // 3) FunnelConversionQuery
    //    Quantidade de leads por estágio do funil
    //
    this.funnelConversionQuery = new logs.CfnQueryDefinition(this, 'FunnelConversionQuery', {
      name: `${props.appName}-${props.stage}-funnel-conversion`,
      queryString: [
        'fields @timestamp, leadId, funnelStage',
        `| filter app = "${props.appName}" and env = "${props.stage}"`,
        '| filter ispresent(leadId) and ispresent(funnelStage)',
        '| stats',
        '    count_distinct(leadId) as leads',
        '  by funnelStage',
        '| sort leads desc',
      ].join('\n'),
      ...commonProps,
    });

    //
    // 4) MCPCallsQuery
    //    Visão por ferramenta MCP (volume, sucesso/erro, latência)
    //
    this.mcpCallsQuery = new logs.CfnQueryDefinition(this, 'MCPCallsQuery', {
      name: `${props.appName}-${props.stage}-mcp-calls`,
      queryString: [
        'fields @timestamp, mcpTool, mcpStatus, latencyMs, message',
        `| filter app = "${props.appName}" and env = "${props.stage}"`,
        '| filter ispresent(mcpTool)',
        '| stats',
        '    count(*) as calls,',
        '    avg(latencyMs) as avgLatencyMs,',
        '    pct(latencyMs, 90) as p90LatencyMs,',
        '    pct(latencyMs, 99) as p99LatencyMs',
        '  by mcpTool, mcpStatus',
        '| sort calls desc',
        '| limit 50',
      ].join('\n'),
      ...commonProps,
    });

    //
    // 5) LatencyByEndpointQuery
    //    Latência por endpoint (p90/p99) para achar gargalos
    //
    this.latencyByEndpointQuery = new logs.CfnQueryDefinition(this, 'LatencyByEndpointQuery', {
      name: `${props.appName}-${props.stage}-latency-by-endpoint`,
      queryString: [
        'fields @timestamp, endpoint, latencyMs, statusCode',
        `| filter app = "${props.appName}" and env = "${props.stage}"`,
        '| filter ispresent(endpoint) and ispresent(latencyMs)',
        '| stats',
        '    count(*) as requests,',
        '    avg(latencyMs) as avgLatencyMs,',
        '    pct(latencyMs, 90) as p90LatencyMs,',
        '    pct(latencyMs, 99) as p99LatencyMs',
        '  by endpoint',
        '| sort p90LatencyMs desc',
        '| limit 50',
      ].join('\n'),
      ...commonProps,
    });
  }
}

/**
 * QUERIES ADICIONAIS ÚTEIS
 * 
 * Estas queries podem ser criadas manualmente no console do CloudWatch
 * ou adicionadas programaticamente conforme necessário.
 */
export const ADDITIONAL_REFINED_QUERIES = {
  /**
   * Query para identificar leads que falharam em algum estágio
   */
  failedLeadsByStage: `fields @timestamp, leadId, funnelStage, agentName, message
| filter app = "nigredo" and env = "dev"
| filter level = "ERROR" and ispresent(leadId)
| stats 
    count() as errorCount,
    latest(funnelStage) as lastStage,
    latest(agentName) as lastAgent,
    latest(message) as lastError
  by leadId
| sort errorCount desc
| limit 50`,

  /**
   * Query para análise de taxa de conversão entre estágios
   */
  stageConversionRate: `fields @timestamp, leadId, funnelStage, eventType
| filter app = "nigredo" and env = "dev"
| filter ispresent(leadId) and ispresent(funnelStage)
| stats 
    count_distinct(leadId) as leads
  by funnelStage
| sort funnelStage asc`,

  /**
   * Query para análise de performance por agente
   */
  agentPerformance: `fields @timestamp, agentId, agentName, latencyMs, eventType
| filter app = "nigredo" and env = "dev"
| filter ispresent(agentId) and ispresent(latencyMs)
| stats 
    count(*) as totalEvents,
    avg(latencyMs) as avgLatency,
    pct(latencyMs, 90) as p90Latency,
    pct(latencyMs, 99) as p99Latency
  by agentId, agentName
| sort p90Latency desc
| limit 50`,

  /**
   * Query para análise de leads por fonte
   */
  leadsBySource: `fields @timestamp, leadId, metadata.source, funnelStage
| filter app = "nigredo" and env = "dev"
| filter ispresent(leadId) and ispresent(metadata.source)
| stats 
    count_distinct(leadId) as totalLeads,
    sum(funnelStage = "closedWon") as closedWon,
    (sum(funnelStage = "closedWon") / count_distinct(leadId)) * 100 as conversionRate
  by metadata.source
| sort totalLeads desc`,

  /**
   * Query para análise de horários de pico
   */
  peakHoursAnalysis: `fields @timestamp, leadId, eventType
| filter app = "nigredo" and env = "dev"
| filter ispresent(leadId)
| stats 
    count_distinct(leadId) as leads,
    count(*) as events
  by bin(1h)
| sort @timestamp desc`,

  /**
   * Query para análise de taxa de erro por endpoint
   */
  errorRateByEndpoint: `fields @timestamp, endpoint, statusCode, level
| filter app = "nigredo" and env = "dev"
| filter ispresent(endpoint)
| stats 
    count(*) as totalRequests,
    sum(level = "ERROR" or statusCode >= 400) as errors,
    (sum(level = "ERROR" or statusCode >= 400) / count(*)) * 100 as errorRate
  by endpoint
| sort errorRate desc
| limit 50`,

  /**
   * Query para análise de tempo médio por estágio do funil
   */
  avgTimePerStage: `fields @timestamp, leadId, funnelStage
| filter app = "nigredo" and env = "dev"
| filter ispresent(leadId) and ispresent(funnelStage)
| stats 
    min(@timestamp) as stageStart,
    max(@timestamp) as stageEnd,
    (max(@timestamp) - min(@timestamp))/1000 as stageSeconds
  by leadId, funnelStage
| stats 
    avg(stageSeconds) as avgSeconds,
    pct(stageSeconds, 50) as medianSeconds,
    pct(stageSeconds, 90) as p90Seconds
  by funnelStage
| sort avgSeconds desc`,

  /**
   * Query para análise de sucesso de MCP por ferramenta
   */
  mcpSuccessRate: `fields @timestamp, mcpTool, mcpStatus
| filter app = "nigredo" and env = "dev"
| filter ispresent(mcpTool)
| stats 
    count(*) as totalCalls,
    sum(mcpStatus = "success") as successCalls,
    sum(mcpStatus = "error") as errorCalls,
    (sum(mcpStatus = "success") / count(*)) * 100 as successRate
  by mcpTool
| sort totalCalls desc`,

  /**
   * Query para análise de leads qualificados vs não qualificados
   */
  qualificationAnalysis: `fields @timestamp, leadId, funnelStage, metadata.qualificationScore
| filter app = "nigredo" and env = "dev"
| filter ispresent(leadId)
| stats 
    count_distinct(leadId) as totalLeads,
    sum(funnelStage = "qualified") as qualified,
    sum(funnelStage = "captured") as captured,
    (sum(funnelStage = "qualified") / count_distinct(leadId)) * 100 as qualificationRate
  by bin(1d)
| sort @timestamp desc`,

  /**
   * Query para análise de trace distribuído por lead
   */
  distributedTraceByLead: `fields @timestamp, leadId, agentName, eventType, message, latencyMs
| filter app = "nigredo" and env = "dev"
| filter leadId = "REPLACE_WITH_LEAD_ID"
| sort @timestamp asc
| limit 100`,
};

/**
 * INSTRUÇÕES DE USO:
 * 
 * 1. Para usar esta versão refinada, substitua o import em nigredo-stack.ts:
 *    import { CloudWatchInsightsQueriesRefined } from './cloudwatch-insights-queries-REFINED';
 * 
 * 2. Certifique-se de que suas Lambdas estão logando em formato JSON estruturado
 * 
 * 3. Ajuste os nomes dos campos se necessário (app, env, leadId, etc.)
 * 
 * 4. As queries adicionais podem ser criadas manualmente no console ou
 *    adicionadas ao construct conforme necessário
 * 
 * 5. Para testar uma query no console:
 *    - Vá para CloudWatch → Logs → Insights
 *    - Selecione os log groups
 *    - Cole a query e clique em "Run query"
 */
