import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as applicationautoscaling from 'aws-cdk-lib/aws-applicationautoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

export interface AutoScalingConfigProps {
  envName: string;
  dbCluster: rds.DatabaseCluster;
  lambdaFunctions: lambda.Function[];
}

/**
 * Auto-scaling configuration for Aurora, Lambda, and other resources
 */
export class AutoScalingConfig extends Construct {
  constructor(scope: Construct, id: string, props: AutoScalingConfigProps) {
    super(scope, id);

    // ========================================
    // Aurora Serverless v2 Auto-scaling
    // ========================================
    // Aurora Serverless v2 já escala automaticamente entre min e max capacity
    // Mas podemos adicionar alarmes para monitorar o scaling

    // Alarme quando Aurora atinge capacidade máxima
    const auroraMaxCapacityAlarm = new cloudwatch.Alarm(this, 'AuroraMaxCapacityAlarm', {
      alarmName: `fibonacci-aurora-max-capacity-${props.envName}`,
      alarmDescription: 'Aurora atingiu capacidade máxima - Considerar aumentar max capacity',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'ServerlessDatabaseCapacity',
        dimensionsMap: {
          DBClusterIdentifier: props.dbCluster.clusterIdentifier,
        },
        period: cdk.Duration.minutes(5),
        statistic: 'Maximum',
      }),
      threshold: 15.5, // Próximo ao máximo (16 ACUs)
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Alarme para conexões de banco de dados
    const auroraConnectionsAlarm = new cloudwatch.Alarm(this, 'AuroraConnectionsAlarm', {
      alarmName: `fibonacci-aurora-connections-high-${props.envName}`,
      alarmDescription: 'Número alto de conexões ao Aurora - Verificar connection pooling',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'DatabaseConnections',
        dimensionsMap: {
          DBClusterIdentifier: props.dbCluster.clusterIdentifier,
        },
        period: cdk.Duration.minutes(5),
        statistic: 'Average',
      }),
      threshold: 80, // 80% do máximo esperado
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Alarme para deadlocks
    const auroraDeadlocksAlarm = new cloudwatch.Alarm(this, 'AuroraDeadlocksAlarm', {
      alarmName: `fibonacci-aurora-deadlocks-${props.envName}`,
      alarmDescription: 'Deadlocks detectados no Aurora - Revisar queries e transações',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'Deadlocks',
        dimensionsMap: {
          DBClusterIdentifier: props.dbCluster.clusterIdentifier,
        },
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 5,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // ========================================
    // Lambda Provisioned Concurrency (para produção)
    // ========================================
    if (props.envName === 'prod') {
      props.lambdaFunctions.forEach((fn, index) => {
        // Criar alias para provisioned concurrency
        const alias = new lambda.Alias(this, `LambdaAlias${index}`, {
          aliasName: 'provisioned',
          version: fn.currentVersion,
        });

        // Configurar provisioned concurrency
        const target = new applicationautoscaling.ScalableTarget(this, `LambdaScalableTarget${index}`, {
          serviceNamespace: applicationautoscaling.ServiceNamespace.LAMBDA,
          maxCapacity: 10, // Máximo de 10 instâncias provisionadas
          minCapacity: 2, // Mínimo de 2 instâncias sempre warm
          resourceId: `function:${fn.functionName}:${alias.aliasName}`,
          scalableDimension: 'lambda:function:ProvisionedConcurrentExecutions',
        });

        // Target tracking scaling policy baseado em utilização
        target.scaleToTrackMetric(`LambdaScalingPolicy${index}`, {
          targetValue: 0.70, // Manter 70% de utilização
          predefinedMetric: applicationautoscaling.PredefinedMetric.LAMBDA_PROVISIONED_CONCURRENCY_UTILIZATION,
          scaleInCooldown: cdk.Duration.seconds(60),
          scaleOutCooldown: cdk.Duration.seconds(0), // Scale out imediatamente
        });

        // Alarme para cold starts
        const coldStartAlarm = new cloudwatch.Alarm(this, `LambdaColdStartAlarm${index}`, {
          alarmName: `fibonacci-lambda-cold-starts-${fn.functionName}-${props.envName}`,
          alarmDescription: 'Cold starts detectados - Considerar aumentar provisioned concurrency',
          metric: new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'ConcurrentExecutions',
            dimensionsMap: {
              FunctionName: fn.functionName,
            },
            period: cdk.Duration.minutes(1),
            statistic: 'Maximum',
          }),
          threshold: 10, // Mais de 10 execuções concorrentes
          evaluationPeriods: 2,
          comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
          treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        });
      });
    }

    // ========================================
    // Lambda Reserved Concurrency (para todos os ambientes)
    // ========================================
    props.lambdaFunctions.forEach((fn) => {
      // Configurar reserved concurrency para evitar throttling
      // e proteger outros recursos
      const reservedConcurrency = props.envName === 'prod' ? 100 : 20;
      
      fn.addEnvironment('RESERVED_CONCURRENCY', reservedConcurrency.toString());
      
      // Nota: Reserved concurrency deve ser configurado via console ou CLI
      // pois não há suporte direto no CDK para configurar via código
      // Comando: aws lambda put-function-concurrency --function-name <name> --reserved-concurrent-executions <number>
    });

    // ========================================
    // Métricas Customizadas para Auto-scaling
    // ========================================
    
    // Métrica de throughput (requests por segundo)
    const throughputMetric = new cloudwatch.MathExpression({
      expression: 'invocations / PERIOD(invocations)',
      usingMetrics: {
        invocations: props.lambdaFunctions[0].metricInvocations({
          period: cdk.Duration.minutes(1),
          statistic: 'Sum',
        }),
      },
      label: 'Requests per Second',
      period: cdk.Duration.minutes(1),
    });

    // Alarme para throughput alto
    const highThroughputAlarm = new cloudwatch.Alarm(this, 'HighThroughputAlarm', {
      alarmName: `fibonacci-high-throughput-${props.envName}`,
      alarmDescription: 'Throughput alto detectado - Sistema sob carga',
      metric: throughputMetric,
      threshold: props.envName === 'prod' ? 100 : 20, // RPS
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Métrica de error rate (%)
    const errorRateMetric = new cloudwatch.MathExpression({
      expression: '(errors / invocations) * 100',
      usingMetrics: {
        errors: props.lambdaFunctions[0].metricErrors({
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
        }),
        invocations: props.lambdaFunctions[0].metricInvocations({
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
        }),
      },
      label: 'Error Rate (%)',
      period: cdk.Duration.minutes(5),
    });

    // Alarme para error rate alto
    const highErrorRateAlarm = new cloudwatch.Alarm(this, 'HighErrorRatePercentAlarm', {
      alarmName: `fibonacci-high-error-rate-percent-${props.envName}`,
      alarmDescription: 'Taxa de erro acima de 5% - Investigar causas',
      metric: errorRateMetric,
      threshold: 5, // 5%
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // ========================================
    // CloudFormation Outputs
    // ========================================
    new cdk.CfnOutput(this, 'AuroraMaxCapacityAlarmName', {
      value: auroraMaxCapacityAlarm.alarmName,
      description: 'Nome do alarme de capacidade máxima do Aurora',
    });

    new cdk.CfnOutput(this, 'AuroraConnectionsAlarmName', {
      value: auroraConnectionsAlarm.alarmName,
      description: 'Nome do alarme de conexões altas do Aurora',
    });

    new cdk.CfnOutput(this, 'HighThroughputAlarmName', {
      value: highThroughputAlarm.alarmName,
      description: 'Nome do alarme de throughput alto',
    });

    new cdk.CfnOutput(this, 'HighErrorRatePercentAlarmName', {
      value: highErrorRateAlarm.alarmName,
      description: 'Nome do alarme de taxa de erro alta',
    });
  }
}

/**
 * Helper function to calculate optimal Lambda memory based on workload
 */
export function calculateOptimalLambdaMemory(workloadType: 'light' | 'medium' | 'heavy'): number {
  const memoryMap = {
    light: 512,    // Operações simples, pouco processamento
    medium: 1024,  // Processamento moderado, queries complexas
    heavy: 2048,   // Processamento pesado, transformações de dados
  };

  return memoryMap[workloadType];
}

/**
 * Helper function to calculate optimal Lambda timeout based on workload
 */
export function calculateOptimalLambdaTimeout(workloadType: 'light' | 'medium' | 'heavy'): cdk.Duration {
  const timeoutMap = {
    light: cdk.Duration.seconds(10),   // Operações rápidas
    medium: cdk.Duration.seconds(30),  // Operações moderadas
    heavy: cdk.Duration.seconds(60),   // Operações longas
  };

  return timeoutMap[workloadType];
}

/**
 * Helper function to get recommended Aurora capacity based on environment
 */
export function getRecommendedAuroraCapacity(envName: string): { min: number; max: number } {
  const capacityMap: Record<string, { min: number; max: number }> = {
    dev: { min: 0.5, max: 2 },      // Desenvolvimento: mínimo custo
    staging: { min: 0.5, max: 4 },  // Staging: testes de carga
    prod: { min: 2, max: 16 },      // Produção: alta disponibilidade
  };

  return capacityMap[envName] || capacityMap.dev;
}
