import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

/**
 * Props para a stack de dashboards de observabilidade
 */
export interface ObservabilityDashboardStackProps extends cdk.StackProps {
  envName: string;
  
  // Recursos do Fibonacci
  fibonacciApiId: string;
  fibonacciApiHandler: lambda.IFunction;
  fibonacciAuroraClusterId: string;
  
  // Recursos do Nigredo
  nigredoApiId: string;
  nigredoLambdas: {
    recebimento: lambda.IFunction;
    estrategia: lambda.IFunction;
    disparo: lambda.IFunction;
    atendimento: lambda.IFunction;
    sentimento: lambda.IFunction;
    agendamento: lambda.IFunction;
  };
}

/**
 * Stack de Dashboards de Observabilidade CloudWatch
 * 
 * Cria dashboards consolidados para monitoramento dos ambientes dev e prod,
 * incluindo métricas de API Gateway, Lambda e Aurora PostgreSQL.
 */
export class ObservabilityDashboardStack extends cdk.Stack {
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: ObservabilityDashboardStackProps) {
    super(scope, id, props);

    // Validar props obrigatórias
    if (!props.fibonacciApiId) {
      throw new Error('fibonacciApiId is required');
    }
    if (!props.fibonacciAuroraClusterId) {
      throw new Error('fibonacciAuroraClusterId is required');
    }
    if (!['dev', 'prod'].includes(props.envName)) {
      throw new Error(`Invalid environment: ${props.envName}`);
    }

    // Nome do dashboard com ambiente
    const dashboardName = `AlquimistaAI-${props.envName.charAt(0).toUpperCase() + props.envName.slice(1)}-Overview`;

    // Criar dashboard principal
    this.dashboard = new cloudwatch.Dashboard(this, 'OverviewDashboard', {
      dashboardName,
      periodOverride: cloudwatch.PeriodOverride.AUTO
    });

    // ========================================
    // Seção 1: API Gateway - Fibonacci
    // ========================================
    
    // Widget 1.1: Latência do API Gateway Fibonacci (p50, p90, p99)
    const fibonacciApiLatencyWidget = new cloudwatch.GraphWidget({
      title: `[${props.envName.toUpperCase()}] Fibonacci - API Gateway Latency`,
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Latency',
          dimensionsMap: { ApiId: props.fibonacciApiId },
          statistic: 'p50',
          period: cdk.Duration.minutes(5),
          label: 'p50',
          color: cloudwatch.Color.GREEN
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Latency',
          dimensionsMap: { ApiId: props.fibonacciApiId },
          statistic: 'p90',
          period: cdk.Duration.minutes(5),
          label: 'p90',
          color: cloudwatch.Color.ORANGE
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Latency',
          dimensionsMap: { ApiId: props.fibonacciApiId },
          statistic: 'p99',
          period: cdk.Duration.minutes(5),
          label: 'p99',
          color: cloudwatch.Color.RED
        })
      ],
      width: 12,
      height: 6,
      leftYAxis: {
        min: 0,
        label: 'Latency (ms)'
      }
    });

    // Widget 1.2: Erros do API Gateway Fibonacci (4xx, 5xx)
    const fibonacciApiErrorsWidget = new cloudwatch.GraphWidget({
      title: `[${props.envName.toUpperCase()}] Fibonacci - API Gateway Errors`,
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '4XXError',
          dimensionsMap: { ApiId: props.fibonacciApiId },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
          label: '4xx Errors',
          color: cloudwatch.Color.ORANGE
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '5XXError',
          dimensionsMap: { ApiId: props.fibonacciApiId },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
          label: '5xx Errors',
          color: cloudwatch.Color.RED
        })
      ],
      width: 12,
      height: 6,
      leftYAxis: {
        min: 0,
        label: 'Error Count'
      }
    });

    // Widget 1.3: Throughput do API Gateway Fibonacci
    const fibonacciApiThroughputWidget = new cloudwatch.GraphWidget({
      title: `[${props.envName.toUpperCase()}] Fibonacci - API Gateway Throughput`,
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Count',
          dimensionsMap: { ApiId: props.fibonacciApiId },
          statistic: 'Sum',
          period: cdk.Duration.minutes(1),
          label: 'Requests/min',
          color: cloudwatch.Color.BLUE
        })
      ],
      width: 24,
      height: 6,
      leftYAxis: {
        min: 0,
        label: 'Requests'
      }
    });

    // Adicionar widgets da seção Fibonacci API Gateway
    this.dashboard.addWidgets(
      fibonacciApiLatencyWidget,
      fibonacciApiErrorsWidget
    );
    this.dashboard.addWidgets(fibonacciApiThroughputWidget);

    // ========================================
    // Seção 2: Lambda - Fibonacci
    // ========================================

    // Widget 2.1: Invocações da Lambda Fibonacci
    const fibonacciLambdaInvocationsWidget = new cloudwatch.GraphWidget({
      title: `[${props.envName.toUpperCase()}] Fibonacci - Lambda Invocations`,
      left: [
        props.fibonacciApiHandler.metricInvocations({
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
          label: 'Invocations',
          color: cloudwatch.Color.BLUE
        })
      ],
      width: 8,
      height: 6,
      leftYAxis: {
        min: 0,
        label: 'Count'
      }
    });

    // Widget 2.2: Erros da Lambda Fibonacci
    const fibonacciLambdaErrorsWidget = new cloudwatch.GraphWidget({
      title: `[${props.envName.toUpperCase()}] Fibonacci - Lambda Errors`,
      left: [
        props.fibonacciApiHandler.metricErrors({
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
          label: 'Errors',
          color: cloudwatch.Color.RED
        })
      ],
      width: 8,
      height: 6,
      leftYAxis: {
        min: 0,
        label: 'Error Count'
      }
    });

    // Widget 2.3: Duração da Lambda Fibonacci (avg, p95)
    const fibonacciLambdaDurationWidget = new cloudwatch.GraphWidget({
      title: `[${props.envName.toUpperCase()}] Fibonacci - Lambda Duration`,
      left: [
        props.fibonacciApiHandler.metricDuration({
          period: cdk.Duration.minutes(5),
          statistic: 'Average',
          label: 'Average',
          color: cloudwatch.Color.GREEN
        }),
        props.fibonacciApiHandler.metricDuration({
          period: cdk.Duration.minutes(5),
          statistic: 'p95',
          label: 'p95',
          color: cloudwatch.Color.ORANGE
        })
      ],
      width: 8,
      height: 6,
      leftYAxis: {
        min: 0,
        label: 'Duration (ms)'
      }
    });

    // Adicionar widgets da seção Fibonacci Lambda
    this.dashboard.addWidgets(
      fibonacciLambdaInvocationsWidget,
      fibonacciLambdaErrorsWidget,
      fibonacciLambdaDurationWidget
    );

    // ========================================
    // Seção 3: API Gateway - Nigredo
    // ========================================

    // Widget 3.1: Latência do API Gateway Nigredo (p50, p90, p99)
    const nigredoApiLatencyWidget = new cloudwatch.GraphWidget({
      title: `[${props.envName.toUpperCase()}] Nigredo - API Gateway Latency`,
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Latency',
          dimensionsMap: { ApiId: props.nigredoApiId },
          statistic: 'p50',
          period: cdk.Duration.minutes(5),
          label: 'p50',
          color: cloudwatch.Color.GREEN
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Latency',
          dimensionsMap: { ApiId: props.nigredoApiId },
          statistic: 'p90',
          period: cdk.Duration.minutes(5),
          label: 'p90',
          color: cloudwatch.Color.ORANGE
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Latency',
          dimensionsMap: { ApiId: props.nigredoApiId },
          statistic: 'p99',
          period: cdk.Duration.minutes(5),
          label: 'p99',
          color: cloudwatch.Color.RED
        })
      ],
      width: 12,
      height: 6,
      leftYAxis: {
        min: 0,
        label: 'Latency (ms)'
      }
    });

    // Widget 3.2: Erros do API Gateway Nigredo (4xx, 5xx)
    const nigredoApiErrorsWidget = new cloudwatch.GraphWidget({
      title: `[${props.envName.toUpperCase()}] Nigredo - API Gateway Errors`,
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '4XXError',
          dimensionsMap: { ApiId: props.nigredoApiId },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
          label: '4xx Errors',
          color: cloudwatch.Color.ORANGE
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '5XXError',
          dimensionsMap: { ApiId: props.nigredoApiId },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
          label: '5xx Errors',
          color: cloudwatch.Color.RED
        })
      ],
      width: 12,
      height: 6,
      leftYAxis: {
        min: 0,
        label: 'Error Count'
      }
    });

    // Widget 3.3: Throughput do API Gateway Nigredo
    const nigredoApiThroughputWidget = new cloudwatch.GraphWidget({
      title: `[${props.envName.toUpperCase()}] Nigredo - API Gateway Throughput`,
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Count',
          dimensionsMap: { ApiId: props.nigredoApiId },
          statistic: 'Sum',
          period: cdk.Duration.minutes(1),
          label: 'Requests/min',
          color: cloudwatch.Color.PURPLE
        })
      ],
      width: 24,
      height: 6,
      leftYAxis: {
        min: 0,
        label: 'Requests'
      }
    });

    // Adicionar widgets da seção Nigredo API Gateway
    this.dashboard.addWidgets(
      nigredoApiLatencyWidget,
      nigredoApiErrorsWidget
    );
    this.dashboard.addWidgets(nigredoApiThroughputWidget);

    // ========================================
    // Seção 4: Lambdas - Nigredo (Principais)
    // ========================================

    // Widget 4.1: Invocações por Lambda Nigredo
    const nigredoLambdaInvocationsWidget = new cloudwatch.GraphWidget({
      title: `[${props.envName.toUpperCase()}] Nigredo - Lambda Invocations`,
      left: [
        props.nigredoLambdas.recebimento.metricInvocations({
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
          label: 'Recebimento'
        }),
        props.nigredoLambdas.estrategia.metricInvocations({
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
          label: 'Estratégia'
        }),
        props.nigredoLambdas.disparo.metricInvocations({
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
          label: 'Disparo'
        }),
        props.nigredoLambdas.atendimento.metricInvocations({
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
          label: 'Atendimento'
        }),
        props.nigredoLambdas.sentimento.metricInvocations({
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
          label: 'Sentimento'
        }),
        props.nigredoLambdas.agendamento.metricInvocations({
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
          label: 'Agendamento'
        })
      ],
      width: 24,
      height: 6,
      leftYAxis: {
        min: 0,
        label: 'Invocations'
      }
    });

    // Widget 4.2: Erros por Lambda Nigredo
    const nigredoLambdaErrorsWidget = new cloudwatch.GraphWidget({
      title: `[${props.envName.toUpperCase()}] Nigredo - Lambda Errors`,
      left: [
        props.nigredoLambdas.recebimento.metricErrors({
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
          label: 'Recebimento'
        }),
        props.nigredoLambdas.estrategia.metricErrors({
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
          label: 'Estratégia'
        }),
        props.nigredoLambdas.disparo.metricErrors({
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
          label: 'Disparo'
        }),
        props.nigredoLambdas.atendimento.metricErrors({
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
          label: 'Atendimento'
        }),
        props.nigredoLambdas.sentimento.metricErrors({
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
          label: 'Sentimento'
        }),
        props.nigredoLambdas.agendamento.metricErrors({
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
          label: 'Agendamento'
        })
      ],
      width: 24,
      height: 6,
      leftYAxis: {
        min: 0,
        label: 'Errors'
      }
    });

    // Widget 4.3: Duração (avg, p95) por Lambda Nigredo
    const nigredoLambdaDurationWidget = new cloudwatch.GraphWidget({
      title: `[${props.envName.toUpperCase()}] Nigredo - Lambda Duration (p95)`,
      left: [
        props.nigredoLambdas.recebimento.metricDuration({
          period: cdk.Duration.minutes(5),
          statistic: 'p95',
          label: 'Recebimento'
        }),
        props.nigredoLambdas.estrategia.metricDuration({
          period: cdk.Duration.minutes(5),
          statistic: 'p95',
          label: 'Estratégia'
        }),
        props.nigredoLambdas.disparo.metricDuration({
          period: cdk.Duration.minutes(5),
          statistic: 'p95',
          label: 'Disparo'
        }),
        props.nigredoLambdas.atendimento.metricDuration({
          period: cdk.Duration.minutes(5),
          statistic: 'p95',
          label: 'Atendimento'
        }),
        props.nigredoLambdas.sentimento.metricDuration({
          period: cdk.Duration.minutes(5),
          statistic: 'p95',
          label: 'Sentimento'
        }),
        props.nigredoLambdas.agendamento.metricDuration({
          period: cdk.Duration.minutes(5),
          statistic: 'p95',
          label: 'Agendamento'
        })
      ],
      width: 24,
      height: 6,
      leftYAxis: {
        min: 0,
        label: 'Duration (ms)'
      }
    });

    // Adicionar widgets da seção Nigredo Lambdas
    this.dashboard.addWidgets(nigredoLambdaInvocationsWidget);
    this.dashboard.addWidgets(nigredoLambdaErrorsWidget);
    this.dashboard.addWidgets(nigredoLambdaDurationWidget);

    // ========================================
    // Seção 5: Aurora PostgreSQL
    // ========================================

    // Widget 5.1: CPU Utilization do Aurora
    const auroraCpuWidget = new cloudwatch.GraphWidget({
      title: `[${props.envName.toUpperCase()}] Aurora - CPU Utilization`,
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'CPUUtilization',
          dimensionsMap: {
            DBClusterIdentifier: props.fibonacciAuroraClusterId
          },
          period: cdk.Duration.minutes(5),
          statistic: 'Average',
          label: 'CPU %',
          color: cloudwatch.Color.BLUE
        })
      ],
      width: 8,
      height: 6,
      leftYAxis: {
        min: 0,
        max: 100,
        label: 'CPU %'
      }
    });

    // Widget 5.2: Database Connections do Aurora
    const auroraConnectionsWidget = new cloudwatch.GraphWidget({
      title: `[${props.envName.toUpperCase()}] Aurora - Database Connections`,
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'DatabaseConnections',
          dimensionsMap: {
            DBClusterIdentifier: props.fibonacciAuroraClusterId
          },
          period: cdk.Duration.minutes(5),
          statistic: 'Average',
          label: 'Connections',
          color: cloudwatch.Color.ORANGE
        })
      ],
      width: 8,
      height: 6,
      leftYAxis: {
        min: 0,
        label: 'Connections'
      }
    });

    // Widget 5.3: Free Storage Space do Aurora
    const auroraStorageWidget = new cloudwatch.GraphWidget({
      title: `[${props.envName.toUpperCase()}] Aurora - Free Storage Space`,
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'FreeLocalStorage',
          dimensionsMap: {
            DBClusterIdentifier: props.fibonacciAuroraClusterId
          },
          period: cdk.Duration.minutes(5),
          statistic: 'Average',
          label: 'Free Storage (bytes)',
          color: cloudwatch.Color.GREEN
        })
      ],
      width: 8,
      height: 6,
      leftYAxis: {
        min: 0,
        label: 'Bytes'
      }
    });

    // Adicionar widgets da seção Aurora
    this.dashboard.addWidgets(
      auroraCpuWidget,
      auroraConnectionsWidget,
      auroraStorageWidget
    );

    // ========================================
    // Tags
    // ========================================
    cdk.Tags.of(this).add('Environment', props.envName);
    cdk.Tags.of(this).add('Project', 'AlquimistaAI');
    cdk.Tags.of(this).add('Component', 'Observability-Dashboard');

    // ========================================
    // CloudFormation Outputs
    // ========================================
    new cdk.CfnOutput(this, 'DashboardName', {
      value: this.dashboard.dashboardName,
      description: `Dashboard de observabilidade para ambiente ${props.envName}`,
      exportName: `ObservabilityDashboardName-${props.envName}`
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${this.dashboard.dashboardName}`,
      description: 'URL do dashboard no console CloudWatch'
    });
  }
}
