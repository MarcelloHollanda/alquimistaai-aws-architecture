// lib/cloudwatch-insights-queries.ts
import { Construct } from 'constructs';
import * as logs from 'aws-cdk-lib/aws-logs';

export interface CloudWatchInsightsQueriesProps {
  /**
   * Nome lógico da aplicação (ex: "nigredo")
   */
  appName: string;

  /**
   * Ambiente / stage (ex: "dev", "prod")
   */
  stage: string;

  /**
   * Lista de log groups relevantes (Lambdas do Nigredo, etc.)
   */
  logGroups: logs.ILogGroup[];
}

export class CloudWatchInsightsQueries extends Construct {
  public readonly leadProcessingTimeQuery: logs.CfnQueryDefinition;
  public readonly errorsByAgentQuery: logs.CfnQueryDefinition;
  public readonly funnelConversionQuery: logs.CfnQueryDefinition;
  public readonly mcpCallsQuery: logs.CfnQueryDefinition;
  public readonly latencyByEndpointQuery: logs.CfnQueryDefinition;

  constructor(scope: Construct, id: string, props: CloudWatchInsightsQueriesProps) {
    super(scope, id);

    // Garante que não passamos nomes vazios ou undefined
    const logGroupNames = props.logGroups
      .map((lg) => lg.logGroupName)
      .filter((name): name is string => !!name && name.trim().length > 0);

    const commonProps =
      logGroupNames.length > 0
        ? { logGroupNames }
        : {};

    //
    // 1) LeadProcessingTimeQuery
    //    -> Query simples e válida para tempo de processamento
    //
    this.leadProcessingTimeQuery = new logs.CfnQueryDefinition(this, 'LeadProcessingTimeQuery', {
      name: `${props.appName}-${props.stage}-lead-processing-time`,
      queryString: [
        'fields @timestamp, @message, @logStream',
        '| filter @message like "leadId"',
        '| sort @timestamp desc',
        '| limit 100',
      ].join('\n'),
      ...commonProps,
    });

    //
    // 2) ErrorsByAgentQuery
    //    -> Busca erros nos logs
    //
    this.errorsByAgentQuery = new logs.CfnQueryDefinition(this, 'ErrorsByAgentQuery', {
      name: `${props.appName}-${props.stage}-errors-by-agent`,
      queryString: [
        'fields @timestamp, @message, @logStream',
        '| filter @message like "ERROR" or @message like "Error" or @message like "Exception"',
        '| stats count() as error_count by bin(1h)',
        '| sort error_count desc',
        '| limit 50',
      ].join('\n'),
      ...commonProps,
    });

    //
    // 3) FunnelConversionQuery
    //    -> Análise de conversão do funil
    //
    this.funnelConversionQuery = new logs.CfnQueryDefinition(this, 'FunnelConversionQuery', {
      name: `${props.appName}-${props.stage}-funnel-conversion`,
      queryString: [
        'fields @timestamp, @message, @logStream',
        '| filter @message like "agent"',
        '| stats count() as total_events by bin(1h)',
        '| sort @timestamp desc',
        '| limit 100',
      ].join('\n'),
      ...commonProps,
    });

    //
    // 4) MCPCallsQuery
    //    -> Monitora chamadas MCP
    //
    this.mcpCallsQuery = new logs.CfnQueryDefinition(this, 'MCPCallsQuery', {
      name: `${props.appName}-${props.stage}-mcp-calls`,
      queryString: [
        'fields @timestamp, @message, @logStream',
        '| filter @message like "MCP" or @message like "mcp"',
        '| stats count() as mcp_calls by bin(1h)',
        '| sort @timestamp desc',
        '| limit 100',
      ].join('\n'),
      ...commonProps,
    });

    //
    // 5) LatencyByEndpointQuery
    //    -> Análise de latência
    //
    this.latencyByEndpointQuery = new logs.CfnQueryDefinition(this, 'LatencyByEndpointQuery', {
      name: `${props.appName}-${props.stage}-latency-by-endpoint`,
      queryString: [
        'fields @timestamp, @message, @duration, @logStream',
        '| filter @type = "REPORT"',
        '| stats avg(@duration) as avg_duration, max(@duration) as max_duration, min(@duration) as min_duration by bin(5m)',
        '| sort avg_duration desc',
        '| limit 100',
      ].join('\n'),
      ...commonProps,
    });
  }
}

/**
 * NOTAS SOBRE AS QUERIES:
 * 
 * 1. Todas as queries usam sintaxe válida do CloudWatch Logs Insights
 * 2. Evitamos regex complexos (/.+/) que causavam erros
 * 3. Usamos 'like' com strings entre aspas duplas
 * 4. Campos usados são padrão do CloudWatch (@timestamp, @message, @logStream, @duration, @type)
 * 5. Queries podem ser refinadas depois para usar campos customizados dos logs estruturados
 * 
 * PRÓXIMOS PASSOS PARA REFINAMENTO:
 * - Adicionar campos específicos do schema de logs (leadId, agent, classification, etc.)
 * - Usar filtros mais específicos baseados nos logs estruturados
 * - Adicionar agregações mais complexas quando os logs estiverem padronizados
 */
