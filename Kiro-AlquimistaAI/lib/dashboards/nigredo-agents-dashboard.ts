import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export interface NigredoAgentsDashboardProps {
  envName: string;
  recebimentoLambda: lambda.IFunction;
  estrategiaLambda: lambda.IFunction;
  disparoLambda: lambda.IFunction;
  atendimentoLambda: lambda.IFunction;
  sentimentoLambda: lambda.IFunction;
  agendamentoLambda: lambda.IFunction;
  relatoriosLambda?: lambda.IFunction;
}

export class NigredoAgentsDashboard extends Construct {
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: NigredoAgentsDashboardProps) {
    super(scope, id);

    // ========================================
    // Dashboard Nigredo Agents
    // ========================================
    this.dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: `Nigredo-Agents-${props.envName}`,
      periodOverride: cloudwatch.PeriodOverride.AUTO
    });

    // ========================================
    // Helper function to create agent metrics
    // ========================================
    const createAgentMetrics = (agentLambda: lambda.IFunction, agentName: string) => {
      return {
        invocations: agentLambda.metricInvocations({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
          label: agentName
        }),
        errors: agentLambda.metricErrors({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
          label: agentName
        }),
        duration: agentLambda.metricDuration({
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
          label: agentName
        }),
        durationP95: agentLambda.metricDuration({
          statistic: 'p95',
          period: cdk.Duration.minutes(5),
          label: `${agentName} (p95)`
        }),
        throttles: agentLambda.metricThrottles({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
          label: agentName
        }),
        concurrentExecutions: new cloudwatch.Metric({
          namespace: 'AWS/Lambda',
          metricName: 'ConcurrentExecutions',
          dimensionsMap: {
            FunctionName: agentLambda.functionName
          },
          statistic: 'Maximum',
          period: cdk.Duration.minutes(5),
          label: agentName
        })
      };
    };

    // ========================================
    // Create metrics for all agents
    // ========================================
    const recebimentoMetrics = createAgentMetrics(props.recebimentoLambda, 'Recebimento');
    const estrategiaMetrics = createAgentMetrics(props.estrategiaLambda, 'Estratégia');
    const disparoMetrics = createAgentMetrics(props.disparoLambda, 'Disparo');
    const atendimentoMetrics = createAgentMetrics(props.atendimentoLambda, 'Atendimento');
    const sentimentoMetrics = createAgentMetrics(props.sentimentoLambda, 'Sentimento');
    const agendamentoMetrics = createAgentMetrics(props.agendamentoLambda, 'Agendamento');
    
    let relatoriosMetrics;
    if (props.relatoriosLambda) {
      relatoriosMetrics = createAgentMetrics(props.relatoriosLambda, 'Relatórios');
    }

    // ========================================
    // Calculate success rate (invocations - errors) / invocations * 100
    // ========================================
    const createSuccessRateMetric = (invocations: cloudwatch.IMetric, errors: cloudwatch.IMetric, label: string) => {
      // Remove accents and special characters, keep only alphanumerics and underscores
      const uniqueId = label
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special chars
        .replace(/\s+/g, '_')
        .toLowerCase();
      return new cloudwatch.MathExpression({
        expression: `(${uniqueId}_inv - ${uniqueId}_err) / ${uniqueId}_inv * 100`,
        usingMetrics: {
          [`${uniqueId}_inv`]: invocations,
          [`${uniqueId}_err`]: errors
        },
        label: label,
        period: cdk.Duration.minutes(5)
      });
    };

    const recebimentoSuccessRate = createSuccessRateMetric(
      recebimentoMetrics.invocations,
      recebimentoMetrics.errors,
      'Recebimento'
    );
    const estrategiaSuccessRate = createSuccessRateMetric(
      estrategiaMetrics.invocations,
      estrategiaMetrics.errors,
      'Estratégia'
    );
    const disparoSuccessRate = createSuccessRateMetric(
      disparoMetrics.invocations,
      disparoMetrics.errors,
      'Disparo'
    );
    const atendimentoSuccessRate = createSuccessRateMetric(
      atendimentoMetrics.invocations,
      atendimentoMetrics.errors,
      'Atendimento'
    );
    const sentimentoSuccessRate = createSuccessRateMetric(
      sentimentoMetrics.invocations,
      sentimentoMetrics.errors,
      'Sentimento'
    );
    const agendamentoSuccessRate = createSuccessRateMetric(
      agendamentoMetrics.invocations,
      agendamentoMetrics.errors,
      'Agendamento'
    );

    // ========================================
    // Add Widgets to Dashboard
    // ========================================

    // Row 1: Leads Processados por Agente (Invocations)
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Leads Processados por Agente (Invocations)',
        left: [
          recebimentoMetrics.invocations,
          estrategiaMetrics.invocations,
          disparoMetrics.invocations,
          atendimentoMetrics.invocations,
          sentimentoMetrics.invocations,
          agendamentoMetrics.invocations
        ],
        width: 24,
        height: 6,
        leftYAxis: {
          min: 0
        }
      })
    );

    // Row 2: Taxa de Sucesso por Agente (%)
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Taxa de Sucesso por Agente (%)',
        left: [
          recebimentoSuccessRate,
          estrategiaSuccessRate,
          disparoSuccessRate,
          atendimentoSuccessRate,
          sentimentoSuccessRate,
          agendamentoSuccessRate
        ],
        width: 24,
        height: 6,
        leftYAxis: {
          min: 0,
          max: 100
        }
      })
    );

    // Row 3: Tempo Médio de Processamento (Duration)
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Tempo Médio de Processamento (ms)',
        left: [
          recebimentoMetrics.duration,
          estrategiaMetrics.duration,
          disparoMetrics.duration,
          atendimentoMetrics.duration,
          sentimentoMetrics.duration,
          agendamentoMetrics.duration
        ],
        width: 24,
        height: 6,
        leftYAxis: {
          min: 0
        }
      })
    );

    // Row 4: Tempo de Processamento P95 (Duration P95)
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Tempo de Processamento P95 (ms)',
        left: [
          recebimentoMetrics.durationP95,
          estrategiaMetrics.durationP95,
          disparoMetrics.durationP95,
          atendimentoMetrics.durationP95,
          sentimentoMetrics.durationP95,
          agendamentoMetrics.durationP95
        ],
        width: 24,
        height: 6,
        leftYAxis: {
          min: 0
        }
      })
    );

    // Row 5: Erros por Agente
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Erros por Agente',
        left: [
          recebimentoMetrics.errors,
          estrategiaMetrics.errors,
          disparoMetrics.errors,
          atendimentoMetrics.errors,
          sentimentoMetrics.errors,
          agendamentoMetrics.errors
        ],
        width: 24,
        height: 6,
        leftYAxis: {
          min: 0
        }
      })
    );

    // Row 6: Throttles por Agente
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Throttles por Agente',
        left: [
          recebimentoMetrics.throttles,
          estrategiaMetrics.throttles,
          disparoMetrics.throttles,
          atendimentoMetrics.throttles,
          sentimentoMetrics.throttles,
          agendamentoMetrics.throttles
        ],
        width: 24,
        height: 6,
        leftYAxis: {
          min: 0
        }
      })
    );

    // Row 7: Concurrent Executions por Agente
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Concurrent Executions por Agente',
        left: [
          recebimentoMetrics.concurrentExecutions,
          estrategiaMetrics.concurrentExecutions,
          disparoMetrics.concurrentExecutions,
          atendimentoMetrics.concurrentExecutions,
          sentimentoMetrics.concurrentExecutions,
          agendamentoMetrics.concurrentExecutions
        ],
        width: 24,
        height: 6,
        leftYAxis: {
          min: 0
        }
      })
    );

    // Row 8: Individual Agent Details - Recebimento
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Agente Recebimento - Detalhes',
        left: [recebimentoMetrics.invocations],
        right: [recebimentoMetrics.errors, recebimentoMetrics.throttles],
        width: 12,
        height: 6
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Recebimento - Última Execução',
        metrics: [
          recebimentoMetrics.duration,
          recebimentoMetrics.errors
        ],
        width: 12,
        height: 6
      })
    );

    // Row 9: Individual Agent Details - Estratégia
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Agente Estratégia - Detalhes',
        left: [estrategiaMetrics.invocations],
        right: [estrategiaMetrics.errors, estrategiaMetrics.throttles],
        width: 12,
        height: 6
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Estratégia - Última Execução',
        metrics: [
          estrategiaMetrics.duration,
          estrategiaMetrics.errors
        ],
        width: 12,
        height: 6
      })
    );

    // Row 10: Individual Agent Details - Disparo
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Agente Disparo - Detalhes',
        left: [disparoMetrics.invocations],
        right: [disparoMetrics.errors, disparoMetrics.throttles],
        width: 12,
        height: 6
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Disparo - Última Execução',
        metrics: [
          disparoMetrics.duration,
          disparoMetrics.errors
        ],
        width: 12,
        height: 6
      })
    );

    // Row 11: Individual Agent Details - Atendimento
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Agente Atendimento - Detalhes',
        left: [atendimentoMetrics.invocations],
        right: [atendimentoMetrics.errors, atendimentoMetrics.throttles],
        width: 12,
        height: 6
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Atendimento - Última Execução',
        metrics: [
          atendimentoMetrics.duration,
          atendimentoMetrics.errors
        ],
        width: 12,
        height: 6
      })
    );

    // Row 12: MCP Calls Metrics (Custom Metrics)
    // Note: These would need to be published by the Lambda functions using CloudWatch custom metrics
    const mcpWhatsAppCalls = new cloudwatch.Metric({
      namespace: 'Fibonacci/MCP',
      metricName: 'WhatsAppCalls',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
      label: 'WhatsApp API'
    });

    const mcpCalendarCalls = new cloudwatch.Metric({
      namespace: 'Fibonacci/MCP',
      metricName: 'CalendarCalls',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
      label: 'Google Calendar'
    });

    const mcpEnrichmentCalls = new cloudwatch.Metric({
      namespace: 'Fibonacci/MCP',
      metricName: 'EnrichmentCalls',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
      label: 'Data Enrichment'
    });

    const mcpSentimentCalls = new cloudwatch.Metric({
      namespace: 'Fibonacci/MCP',
      metricName: 'SentimentCalls',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
      label: 'Sentiment Analysis'
    });

    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'MCP Calls por Serviço',
        left: [
          mcpWhatsAppCalls,
          mcpCalendarCalls,
          mcpEnrichmentCalls,
          mcpSentimentCalls
        ],
        width: 24,
        height: 6,
        leftYAxis: {
          min: 0
        }
      })
    );

    // Row 13: MCP Errors (Custom Metrics)
    const mcpWhatsAppErrors = new cloudwatch.Metric({
      namespace: 'Fibonacci/MCP',
      metricName: 'WhatsAppErrors',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
      label: 'WhatsApp API'
    });

    const mcpCalendarErrors = new cloudwatch.Metric({
      namespace: 'Fibonacci/MCP',
      metricName: 'CalendarErrors',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
      label: 'Google Calendar'
    });

    const mcpEnrichmentErrors = new cloudwatch.Metric({
      namespace: 'Fibonacci/MCP',
      metricName: 'EnrichmentErrors',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
      label: 'Data Enrichment'
    });

    const mcpSentimentErrors = new cloudwatch.Metric({
      namespace: 'Fibonacci/MCP',
      metricName: 'SentimentErrors',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
      label: 'Sentiment Analysis'
    });

    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'MCP Errors por Serviço',
        left: [
          mcpWhatsAppErrors,
          mcpCalendarErrors,
          mcpEnrichmentErrors,
          mcpSentimentErrors
        ],
        width: 24,
        height: 6,
        leftYAxis: {
          min: 0
        }
      })
    );

    // Add Relatórios agent if provided
    if (relatoriosMetrics) {
      this.dashboard.addWidgets(
        new cloudwatch.GraphWidget({
          title: 'Agente Relatórios - Detalhes',
          left: [relatoriosMetrics.invocations],
          right: [relatoriosMetrics.errors, relatoriosMetrics.throttles],
          width: 12,
          height: 6
        }),
        new cloudwatch.SingleValueWidget({
          title: 'Relatórios - Última Execução',
          metrics: [
            relatoriosMetrics.duration,
            relatoriosMetrics.errors
          ],
          width: 12,
          height: 6
        })
      );
    }
  }
}
