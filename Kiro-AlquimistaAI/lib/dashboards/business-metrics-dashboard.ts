import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export interface BusinessMetricsDashboardProps {
  envName: string;
  recebimentoLambda: lambda.IFunction;
  estrategiaLambda: lambda.IFunction;
  disparoLambda: lambda.IFunction;
  atendimentoLambda: lambda.IFunction;
  agendamentoLambda: lambda.IFunction;
}

export class BusinessMetricsDashboard extends Construct {
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: BusinessMetricsDashboardProps) {
    super(scope, id);

    // ========================================
    // Dashboard Business Metrics
    // ========================================
    this.dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: `Business-Metrics-${props.envName}`,
      periodOverride: cloudwatch.PeriodOverride.AUTO
    });

    // ========================================
    // Funil de Conversão Metrics
    // ========================================
    
    // Leads Recebidos (custom metric published by Recebimento agent)
    const leadsRecebidosMetric = new cloudwatch.Metric({
      namespace: 'Fibonacci/Business',
      metricName: 'LeadsRecebidos',
      statistic: 'Sum',
      period: cdk.Duration.hours(1),
      label: 'Leads Recebidos'
    });

    // Leads Enriquecidos (custom metric)
    const leadsEnriquecidosMetric = new cloudwatch.Metric({
      namespace: 'Fibonacci/Business',
      metricName: 'LeadsEnriquecidos',
      statistic: 'Sum',
      period: cdk.Duration.hours(1),
      label: 'Leads Enriquecidos'
    });

    // Leads Contatados (custom metric published by Disparo agent)
    const leadsContatadosMetric = new cloudwatch.Metric({
      namespace: 'Fibonacci/Business',
      metricName: 'LeadsContatados',
      statistic: 'Sum',
      period: cdk.Duration.hours(1),
      label: 'Leads Contatados'
    });

    // Leads que Responderam (custom metric published by Atendimento agent)
    const leadsResponderamMetric = new cloudwatch.Metric({
      namespace: 'Fibonacci/Business',
      metricName: 'LeadsResponderam',
      statistic: 'Sum',
      period: cdk.Duration.hours(1),
      label: 'Leads Responderam'
    });

    // Leads Interessados (custom metric)
    const leadsInteressadosMetric = new cloudwatch.Metric({
      namespace: 'Fibonacci/Business',
      metricName: 'LeadsInteressados',
      statistic: 'Sum',
      period: cdk.Duration.hours(1),
      label: 'Leads Interessados'
    });

    // Leads Agendados (custom metric published by Agendamento agent)
    const leadsAgendadosMetric = new cloudwatch.Metric({
      namespace: 'Fibonacci/Business',
      metricName: 'LeadsAgendados',
      statistic: 'Sum',
      period: cdk.Duration.hours(1),
      label: 'Leads Agendados'
    });

    // Leads Convertidos (custom metric)
    const leadsConvertidosMetric = new cloudwatch.Metric({
      namespace: 'Fibonacci/Business',
      metricName: 'LeadsConvertidos',
      statistic: 'Sum',
      period: cdk.Duration.hours(1),
      label: 'Leads Convertidos'
    });

    // ========================================
    // Taxa de Resposta (%)
    // ========================================
    const taxaRespostaMetric = new cloudwatch.MathExpression({
      expression: '(resposta_m2 / resposta_m1) * 100',
      usingMetrics: {
        resposta_m1: leadsContatadosMetric,
        resposta_m2: leadsResponderamMetric
      },
      label: 'Taxa de Resposta (%)',
      period: cdk.Duration.hours(1)
    });

    // ========================================
    // Taxa de Agendamento (%)
    // ========================================
    const taxaAgendamentoMetric = new cloudwatch.MathExpression({
      expression: '(agend_m2 / agend_m1) * 100',
      usingMetrics: {
        agend_m1: leadsInteressadosMetric,
        agend_m2: leadsAgendadosMetric
      },
      label: 'Taxa de Agendamento (%)',
      period: cdk.Duration.hours(1)
    });

    // ========================================
    // Taxa de Conversão Final (%)
    // ========================================
    const taxaConversaoMetric = new cloudwatch.MathExpression({
      expression: '(conv_m2 / conv_m1) * 100',
      usingMetrics: {
        conv_m1: leadsRecebidosMetric,
        conv_m2: leadsConvertidosMetric
      },
      label: 'Taxa de Conversão (%)',
      period: cdk.Duration.hours(1)
    });

    // ========================================
    // Custo por Lead (custom metric)
    // ========================================
    const custoPorLeadMetric = new cloudwatch.Metric({
      namespace: 'Fibonacci/Business',
      metricName: 'CustoPorLead',
      statistic: 'Average',
      period: cdk.Duration.hours(1),
      label: 'Custo por Lead (R$)'
    });

    // ========================================
    // ROI por Campanha (custom metric)
    // ========================================
    const roiCampanhaMetric = new cloudwatch.Metric({
      namespace: 'Fibonacci/Business',
      metricName: 'ROICampanha',
      statistic: 'Average',
      period: cdk.Duration.hours(1),
      label: 'ROI (%)'
    });

    // ========================================
    // Custo Total de Operação (custom metric)
    // ========================================
    const custoTotalMetric = new cloudwatch.Metric({
      namespace: 'Fibonacci/Business',
      metricName: 'CustoTotal',
      statistic: 'Sum',
      period: cdk.Duration.hours(1),
      label: 'Custo Total (R$)'
    });

    // ========================================
    // Receita Estimada (custom metric)
    // ========================================
    const receitaEstimadaMetric = new cloudwatch.Metric({
      namespace: 'Fibonacci/Business',
      metricName: 'ReceitaEstimada',
      statistic: 'Sum',
      period: cdk.Duration.hours(1),
      label: 'Receita Estimada (R$)'
    });

    // ========================================
    // Add Widgets to Dashboard
    // ========================================

    // Row 1: Funil de Conversão - Overview
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Funil de Conversão - Leads por Estágio',
        left: [
          leadsRecebidosMetric,
          leadsEnriquecidosMetric,
          leadsContatadosMetric,
          leadsResponderamMetric,
          leadsInteressadosMetric,
          leadsAgendadosMetric,
          leadsConvertidosMetric
        ],
        width: 24,
        height: 8,
        leftYAxis: {
          min: 0
        },
        stacked: false
      })
    );

    // Row 2: Funil de Conversão - Single Values (Current Period)
    this.dashboard.addWidgets(
      new cloudwatch.SingleValueWidget({
        title: 'Leads Recebidos',
        metrics: [leadsRecebidosMetric],
        width: 4,
        height: 4
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Leads Enriquecidos',
        metrics: [leadsEnriquecidosMetric],
        width: 4,
        height: 4
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Leads Contatados',
        metrics: [leadsContatadosMetric],
        width: 4,
        height: 4
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Leads Responderam',
        metrics: [leadsResponderamMetric],
        width: 4,
        height: 4
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Leads Interessados',
        metrics: [leadsInteressadosMetric],
        width: 4,
        height: 4
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Leads Agendados',
        metrics: [leadsAgendadosMetric],
        width: 4,
        height: 4
      })
    );

    // Row 3: Taxa de Resposta
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Taxa de Resposta (%)',
        left: [taxaRespostaMetric],
        width: 12,
        height: 6,
        leftYAxis: {
          min: 0,
          max: 100
        }
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Taxa de Resposta Atual',
        metrics: [taxaRespostaMetric],
        width: 12,
        height: 6
      })
    );

    // Row 4: Taxa de Agendamento
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Taxa de Agendamento (%)',
        left: [taxaAgendamentoMetric],
        width: 12,
        height: 6,
        leftYAxis: {
          min: 0,
          max: 100
        }
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Taxa de Agendamento Atual',
        metrics: [taxaAgendamentoMetric],
        width: 12,
        height: 6
      })
    );

    // Row 5: Taxa de Conversão Final
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Taxa de Conversão Final (%)',
        left: [taxaConversaoMetric],
        width: 12,
        height: 6,
        leftYAxis: {
          min: 0,
          max: 100
        }
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Taxa de Conversão Atual',
        metrics: [taxaConversaoMetric],
        width: 12,
        height: 6
      })
    );

    // Row 6: Custo por Lead
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Custo por Lead (R$)',
        left: [custoPorLeadMetric],
        width: 12,
        height: 6,
        leftYAxis: {
          min: 0
        }
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Custo Médio por Lead',
        metrics: [custoPorLeadMetric],
        width: 12,
        height: 6
      })
    );

    // Row 7: ROI por Campanha
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'ROI por Campanha (%)',
        left: [roiCampanhaMetric],
        width: 12,
        height: 6,
        leftYAxis: {
          min: 0
        }
      }),
      new cloudwatch.SingleValueWidget({
        title: 'ROI Médio',
        metrics: [roiCampanhaMetric],
        width: 12,
        height: 6
      })
    );

    // Row 8: Custo vs Receita
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Custo Total vs Receita Estimada (R$)',
        left: [custoTotalMetric, receitaEstimadaMetric],
        width: 24,
        height: 6,
        leftYAxis: {
          min: 0
        }
      })
    );

    // Row 9: Métricas de Eficiência
    const eficienciaEnriquecimentoMetric = new cloudwatch.MathExpression({
      expression: '(enriq_m2 / enriq_m1) * 100',
      usingMetrics: {
        enriq_m1: leadsRecebidosMetric,
        enriq_m2: leadsEnriquecidosMetric
      },
      label: 'Taxa de Enriquecimento (%)',
      period: cdk.Duration.hours(1)
    });

    const eficienciaContatoMetric = new cloudwatch.MathExpression({
      expression: '(contato_m2 / contato_m1) * 100',
      usingMetrics: {
        contato_m1: leadsEnriquecidosMetric,
        contato_m2: leadsContatadosMetric
      },
      label: 'Taxa de Contato (%)',
      period: cdk.Duration.hours(1)
    });

    const eficienciaInteresseMetric = new cloudwatch.MathExpression({
      expression: '(interesse_m2 / interesse_m1) * 100',
      usingMetrics: {
        interesse_m1: leadsResponderamMetric,
        interesse_m2: leadsInteressadosMetric
      },
      label: 'Taxa de Interesse (%)',
      period: cdk.Duration.hours(1)
    });

    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Métricas de Eficiência por Estágio (%)',
        left: [
          eficienciaEnriquecimentoMetric,
          eficienciaContatoMetric,
          taxaRespostaMetric,
          eficienciaInteresseMetric,
          taxaAgendamentoMetric,
          taxaConversaoMetric
        ],
        width: 24,
        height: 6,
        leftYAxis: {
          min: 0,
          max: 100
        }
      })
    );

    // Row 10: Campanhas Ativas (custom metric)
    const campanhasAtivasMetric = new cloudwatch.Metric({
      namespace: 'Fibonacci/Business',
      metricName: 'CampanhasAtivas',
      statistic: 'Maximum',
      period: cdk.Duration.hours(1),
      label: 'Campanhas Ativas'
    });

    const mensagensEnviadasMetric = new cloudwatch.Metric({
      namespace: 'Fibonacci/Business',
      metricName: 'MensagensEnviadas',
      statistic: 'Sum',
      period: cdk.Duration.hours(1),
      label: 'Mensagens Enviadas'
    });

    const mensagensEntreguesMetric = new cloudwatch.Metric({
      namespace: 'Fibonacci/Business',
      metricName: 'MensagensEntregues',
      statistic: 'Sum',
      period: cdk.Duration.hours(1),
      label: 'Mensagens Entregues'
    });

    const mensagensLidasMetric = new cloudwatch.Metric({
      namespace: 'Fibonacci/Business',
      metricName: 'MensagensLidas',
      statistic: 'Sum',
      period: cdk.Duration.hours(1),
      label: 'Mensagens Lidas'
    });

    this.dashboard.addWidgets(
      new cloudwatch.SingleValueWidget({
        title: 'Campanhas Ativas',
        metrics: [campanhasAtivasMetric],
        width: 6,
        height: 4
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Mensagens Enviadas',
        metrics: [mensagensEnviadasMetric],
        width: 6,
        height: 4
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Mensagens Entregues',
        metrics: [mensagensEntreguesMetric],
        width: 6,
        height: 4
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Mensagens Lidas',
        metrics: [mensagensLidasMetric],
        width: 6,
        height: 4
      })
    );

    // Row 11: Taxa de Entrega e Leitura
    const taxaEntregaMetric = new cloudwatch.MathExpression({
      expression: '(entrega_m2 / entrega_m1) * 100',
      usingMetrics: {
        entrega_m1: mensagensEnviadasMetric,
        entrega_m2: mensagensEntreguesMetric
      },
      label: 'Taxa de Entrega (%)',
      period: cdk.Duration.hours(1)
    });

    const taxaLeituraMetric = new cloudwatch.MathExpression({
      expression: '(leitura_m2 / leitura_m1) * 100',
      usingMetrics: {
        leitura_m1: mensagensEntreguesMetric,
        leitura_m2: mensagensLidasMetric
      },
      label: 'Taxa de Leitura (%)',
      period: cdk.Duration.hours(1)
    });

    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Taxa de Entrega e Leitura de Mensagens (%)',
        left: [taxaEntregaMetric, taxaLeituraMetric],
        width: 24,
        height: 6,
        leftYAxis: {
          min: 0,
          max: 100
        }
      })
    );

    // Row 12: Objeções e Descadastros (custom metrics)
    const objecoesMetric = new cloudwatch.Metric({
      namespace: 'Fibonacci/Business',
      metricName: 'Objecoes',
      statistic: 'Sum',
      period: cdk.Duration.hours(1),
      label: 'Objeções'
    });

    const descadastrosMetric = new cloudwatch.Metric({
      namespace: 'Fibonacci/Business',
      metricName: 'Descadastros',
      statistic: 'Sum',
      period: cdk.Duration.hours(1),
      label: 'Descadastros (LGPD)'
    });

    const leadsDescartadosMetric = new cloudwatch.Metric({
      namespace: 'Fibonacci/Business',
      metricName: 'LeadsDescartados',
      statistic: 'Sum',
      period: cdk.Duration.hours(1),
      label: 'Leads Descartados'
    });

    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Objeções, Descadastros e Descartes',
        left: [objecoesMetric, descadastrosMetric, leadsDescartadosMetric],
        width: 24,
        height: 6,
        leftYAxis: {
          min: 0
        }
      })
    );
  }
}
