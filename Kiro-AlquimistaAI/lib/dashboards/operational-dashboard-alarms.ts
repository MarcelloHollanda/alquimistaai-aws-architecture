import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

/**
 * Propriedades para configuração de alarmes do Painel Operacional
 */
export interface OperationalDashboardAlarmsProps {
  /**
   * Funções Lambda do painel operacional
   */
  functions: {
    tenantAPI?: lambda.IFunction;
    internalAPI?: lambda.IFunction;
    operationalCommands?: lambda.IFunction;
    aggregateMetrics?: lambda.IFunction;
  };

  /**
   * E-mail para notificações de alarmes
   */
  alarmEmail?: string;

  /**
   * Ambiente (dev, prod)
   */
  environment: string;

  /**
   * Prefixo para nomes de alarmes
   */
  alarmPrefix?: string;
}

/**
 * Construct para criar alarmes do Painel Operacional
 */
export class OperationalDashboardAlarms extends Construct {
  public readonly alarmTopic: sns.Topic;
  public readonly alarms: cloudwatch.Alarm[];

  constructor(scope: Construct, id: string, props: OperationalDashboardAlarmsProps) {
    super(scope, id);

    this.alarms = [];
    const prefix = props.alarmPrefix || 'OperationalDashboard';

    // Criar tópico SNS para notificações
    this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      displayName: `${prefix} Alarms - ${props.environment}`,
      topicName: `${prefix}-Alarms-${props.environment}`
    });

    // Adicionar assinatura de e-mail se fornecido
    if (props.alarmEmail) {
      this.alarmTopic.addSubscription(
        new subscriptions.EmailSubscription(props.alarmEmail)
      );
    }

    // Criar alarmes para cada função
    if (props.functions.tenantAPI) {
      this.createFunctionAlarms(
        'TenantAPI',
        props.functions.tenantAPI,
        prefix
      );
    }

    if (props.functions.internalAPI) {
      this.createFunctionAlarms(
        'InternalAPI',
        props.functions.internalAPI,
        prefix
      );
    }

    if (props.functions.operationalCommands) {
      this.createFunctionAlarms(
        'OperationalCommands',
        props.functions.operationalCommands,
        prefix
      );
      this.createCommandSpecificAlarms(prefix);
    }

    if (props.functions.aggregateMetrics) {
      this.createMetricsAggregationAlarms(
        props.functions.aggregateMetrics,
        prefix
      );
    }

    // Criar alarmes de métricas customizadas
    this.createCustomMetricAlarms(prefix);

    // Criar alarmes de segurança
    this.createSecurityAlarms(prefix);
  }

  /**
   * Criar alarmes padrão para uma função Lambda
   */
  private createFunctionAlarms(
    name: string,
    func: lambda.IFunction,
    prefix: string
  ): void {
    // Alarme de taxa de erro alta
    const errorRateAlarm = new cloudwatch.Alarm(this, `${name}HighErrorRate`, {
      alarmName: `${prefix}-${name}-HighErrorRate`,
      alarmDescription: `Taxa de erro alta em ${name}`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Errors',
        dimensionsMap: {
          FunctionName: func.functionName
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5)
      }),
      threshold: 10,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });
    errorRateAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.alarmTopic));
    this.alarms.push(errorRateAlarm);

    // Alarme de latência alta
    const latencyAlarm = new cloudwatch.Alarm(this, `${name}HighLatency`, {
      alarmName: `${prefix}-${name}-HighLatency`,
      alarmDescription: `Latência alta em ${name} (> 2s)`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Duration',
        dimensionsMap: {
          FunctionName: func.functionName
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5)
      }),
      threshold: 2000, // 2 segundos
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });
    latencyAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.alarmTopic));
    this.alarms.push(latencyAlarm);

    // Alarme de throttling
    const throttlingAlarm = new cloudwatch.Alarm(this, `${name}Throttling`, {
      alarmName: `${prefix}-${name}-Throttling`,
      alarmDescription: `Throttling detectado em ${name}`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Throttles',
        dimensionsMap: {
          FunctionName: func.functionName
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5)
      }),
      threshold: 5,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });
    throttlingAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.alarmTopic));
    this.alarms.push(throttlingAlarm);

    // Alarme de concurrent executions alto
    const concurrentExecutionsAlarm = new cloudwatch.Alarm(this, `${name}HighConcurrency`, {
      alarmName: `${prefix}-${name}-HighConcurrency`,
      alarmDescription: `Execuções concorrentes altas em ${name}`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'ConcurrentExecutions',
        dimensionsMap: {
          FunctionName: func.functionName
        },
        statistic: 'Maximum',
        period: cdk.Duration.minutes(5)
      }),
      threshold: 50,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });
    concurrentExecutionsAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.alarmTopic));
    this.alarms.push(concurrentExecutionsAlarm);
  }

  /**
   * Criar alarmes específicos para comandos operacionais
   */
  private createCommandSpecificAlarms(prefix: string): void {
    // Alarme de comandos falhando
    const commandFailuresAlarm = new cloudwatch.Alarm(this, 'CommandFailures', {
      alarmName: `${prefix}-CommandFailures`,
      alarmDescription: 'Múltiplos comandos operacionais falhando',
      metric: new cloudwatch.Metric({
        namespace: 'AlquimistaAI/OperationalDashboard',
        metricName: 'OperationalCommandError',
        statistic: 'Sum',
        period: cdk.Duration.minutes(15)
      }),
      threshold: 3,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });
    commandFailuresAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.alarmTopic));
    this.alarms.push(commandFailuresAlarm);

    // Alarme de taxa de sucesso baixa de comandos
    const commandSuccessRateAlarm = new cloudwatch.Alarm(this, 'LowCommandSuccessRate', {
      alarmName: `${prefix}-LowCommandSuccessRate`,
      alarmDescription: 'Taxa de sucesso de comandos operacionais abaixo de 80%',
      metric: new cloudwatch.MathExpression({
        expression: '(success / (success + errors)) * 100',
        usingMetrics: {
          success: new cloudwatch.Metric({
            namespace: 'AlquimistaAI/OperationalDashboard',
            metricName: 'OperationalCommandSuccess',
            statistic: 'Sum',
            period: cdk.Duration.minutes(30)
          }),
          errors: new cloudwatch.Metric({
            namespace: 'AlquimistaAI/OperationalDashboard',
            metricName: 'OperationalCommandError',
            statistic: 'Sum',
            period: cdk.Duration.minutes(30)
          })
        },
        period: cdk.Duration.minutes(30)
      }),
      threshold: 80,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });
    commandSuccessRateAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.alarmTopic));
    this.alarms.push(commandSuccessRateAlarm);
  }

  /**
   * Criar alarmes para agregação de métricas
   */
  private createMetricsAggregationAlarms(
    func: lambda.IFunction,
    prefix: string
  ): void {
    // Alarme de falha na agregação
    const aggregationFailureAlarm = new cloudwatch.Alarm(this, 'MetricsAggregationFailure', {
      alarmName: `${prefix}-MetricsAggregationFailure`,
      alarmDescription: 'Falha na agregação diária de métricas',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Errors',
        dimensionsMap: {
          FunctionName: func.functionName
        },
        statistic: 'Sum',
        period: cdk.Duration.hours(1)
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING
    });
    aggregationFailureAlarm.addAlarmAction(new cloudwatch.SnsAction(this.alarmTopic));
    this.alarms.push(aggregationFailureAlarm);

    // Alarme de agregação não executada
    const aggregationNotRunningAlarm = new cloudwatch.Alarm(this, 'MetricsAggregationNotRunning', {
      alarmName: `${prefix}-MetricsAggregationNotRunning`,
      alarmDescription: 'Agregação de métricas não executada nas últimas 25 horas',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Invocations',
        dimensionsMap: {
          FunctionName: func.functionName
        },
        statistic: 'Sum',
        period: cdk.Duration.hours(25)
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING
    });
    aggregationNotRunningAlarm.addAlarmAction(new cloudwatch.SnsAction(this.alarmTopic));
    this.alarms.push(aggregationNotRunningAlarm);
  }

  /**
   * Criar alarmes de métricas customizadas
   */
  private createCustomMetricAlarms(prefix: string): void {
    // Alarme de cache hit rate baixo
    const lowCacheHitRateAlarm = new cloudwatch.Alarm(this, 'LowCacheHitRate', {
      alarmName: `${prefix}-LowCacheHitRate`,
      alarmDescription: 'Taxa de acerto do cache abaixo de 50%',
      metric: new cloudwatch.MathExpression({
        expression: '(hits / (hits + misses)) * 100',
        usingMetrics: {
          hits: new cloudwatch.Metric({
            namespace: 'AlquimistaAI/OperationalDashboard',
            metricName: 'CacheHit',
            statistic: 'Sum',
            period: cdk.Duration.minutes(15)
          }),
          misses: new cloudwatch.Metric({
            namespace: 'AlquimistaAI/OperationalDashboard',
            metricName: 'CacheMiss',
            statistic: 'Sum',
            period: cdk.Duration.minutes(15)
          })
        },
        period: cdk.Duration.minutes(15)
      }),
      threshold: 50,
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });
    lowCacheHitRateAlarm.addAlarmAction(new cloudwatch.SnsAction(this.alarmTopic));
    this.alarms.push(lowCacheHitRateAlarm);

    // Alarme de latência de API alta
    const highAPILatencyAlarm = new cloudwatch.Alarm(this, 'HighAPILatency', {
      alarmName: `${prefix}-HighAPILatency`,
      alarmDescription: 'Latência média de APIs acima de 1.5s',
      metric: new cloudwatch.Metric({
        namespace: 'AlquimistaAI/OperationalDashboard',
        metricName: 'APILatency',
        statistic: 'Average',
        period: cdk.Duration.minutes(5)
      }),
      threshold: 1500,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });
    highAPILatencyAlarm.addAlarmAction(new cloudwatch.SnsAction(this.alarmTopic));
    this.alarms.push(highAPILatencyAlarm);
  }

  /**
   * Criar alarmes de segurança
   */
  private createSecurityAlarms(prefix: string): void {
    // Alarme de múltiplas falhas de autorização
    const authorizationFailuresAlarm = new cloudwatch.Alarm(this, 'HighAuthorizationFailures', {
      alarmName: `${prefix}-HighAuthorizationFailures`,
      alarmDescription: 'Múltiplas falhas de autorização detectadas',
      metric: new cloudwatch.Metric({
        namespace: 'AlquimistaAI/OperationalDashboard',
        metricName: 'AuthorizationFailure',
        statistic: 'Sum',
        period: cdk.Duration.minutes(10)
      }),
      threshold: 20,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });
    authorizationFailuresAlarm.addAlarmAction(new cloudwatch.SnsAction(this.alarmTopic));
    this.alarms.push(authorizationFailuresAlarm);

    // Alarme de tentativas de violação de isolamento de tenant
    const tenantIsolationViolationAlarm = new cloudwatch.Alarm(this, 'TenantIsolationViolation', {
      alarmName: `${prefix}-TenantIsolationViolation`,
      alarmDescription: 'Tentativas de acesso a dados de outros tenants',
      metric: new cloudwatch.Metric({
        namespace: 'AlquimistaAI/OperationalDashboard',
        metricName: 'TenantIsolationViolation',
        statistic: 'Sum',
        period: cdk.Duration.minutes(5)
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });
    tenantIsolationViolationAlarm.addAlarmAction(new cloudwatch.SnsAction(this.alarmTopic));
    this.alarms.push(tenantIsolationViolationAlarm);
  }

  /**
   * Criar alarme composto (composite alarm)
   */
  public createCompositeAlarm(
    id: string,
    alarmName: string,
    alarmDescription: string,
    alarmRule: cloudwatch.IAlarmRule
  ): cloudwatch.CompositeAlarm {
    const compositeAlarm = new cloudwatch.CompositeAlarm(this, id, {
      alarmName,
      alarmDescription,
      compositeAlarmName: alarmName,
      alarmRule
    });
    compositeAlarm.addAlarmAction(new cloudwatch.SnsAction(this.alarmTopic));
    return compositeAlarm;
  }
}
