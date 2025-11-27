import * as cdk from 'aws-cdk-lib';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as budgets from 'aws-cdk-lib/aws-budgets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';

export interface SecurityStackProps extends cdk.StackProps {
  /**
   * Nome do ambiente (dev, prod)
   * Usado para determinar quais recursos criar (Cost Anomaly Monitor apenas em prod)
   * @default 'dev'
   */
  envName?: string;

  /**
   * Email para receber alertas de segurança
   * @default - Nenhuma assinatura de email configurada
   */
  securityAlertEmail?: string;

  /**
   * Email para receber alertas de custo
   * @default - Nenhuma assinatura de email configurada
   */
  costAlertEmail?: string;

  /**
   * Email para receber alertas operacionais
   * @default - Nenhuma assinatura de email configurada
   */
  opsAlertEmail?: string;

  /**
   * Orçamento mensal em USD
   * @default 500
   */
  monthlyBudgetAmount?: number;

  /**
   * ARN da API HTTP do Fibonacci (para alarmes)
   * @default - Nenhum alarme de API criado
   */
  fibonacciApiId?: string;

  /**
   * ARN da Lambda do Fibonacci (para alarmes)
   * @default - Nenhum alarme de Lambda criado
   */
  fibonacciLambdaName?: string;

  /**
   * ARN da API HTTP do Nigredo (para alarmes)
   * @default - Nenhum alarme de API criado
   */
  nigredoApiId?: string;

  /**
   * Nomes das Lambdas do Nigredo (para alarmes)
   * @default - Nenhum alarme de Lambda criado
   */
  nigredoLambdaNames?: string[];

  /**
   * ID do cluster Aurora (para alarmes)
   * @default - Nenhum alarme de Aurora criado
   */
  auroraClusterId?: string;
}

/**
 * Stack de Guardrails de Segurança, Custo e Observabilidade para AlquimistaAI
 * 
 * Implementa:
 * - CloudTrail para auditoria (retenção 90 dias)
 * - SNS Topics para alertas (segurança, custo, operações)
 * - EventBridge Rule para escutar findings do GuardDuty (HIGH/CRITICAL)
 * - AWS Budgets com alertas em 80%, 100%, 120%
 * - Alarmes CloudWatch para Fibonacci, Nigredo e Aurora
 * 
 * NOTA: GuardDuty Detector e Cost Anomaly Monitor são recursos singleton/globais
 * da conta AWS e são gerenciados fora desta stack para evitar conflitos AlreadyExists.
 */
export class SecurityStack extends cdk.Stack {
  public readonly securityAlertTopic: sns.Topic;
  public readonly costAlertTopic: sns.Topic;
  public readonly opsAlertTopic: sns.Topic;
  public readonly cloudTrailBucket: s3.Bucket;
  public readonly trail: cloudtrail.Trail;

  constructor(scope: Construct, id: string, props?: SecurityStackProps) {
    super(scope, id, props);

    // Priorizar envName da prop, depois context, depois default 'dev'
    const env = props?.envName || this.node.tryGetContext('env') || 'dev';

    // ========================================
    // 1. S3 Bucket para CloudTrail Logs
    // ========================================
    this.cloudTrailBucket = new s3.Bucket(this, 'CloudTrailBucket', {
      // Removido bucketName para permitir geração automática e evitar conflitos
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          enabled: true,
          expiration: cdk.Duration.days(90), // Retenção de 90 dias
        },
      ],
      removalPolicy: env === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: env !== 'prod',
    });

    // ========================================
    // 2. CloudTrail
    // ========================================
    this.trail = new cloudtrail.Trail(this, 'AuditTrail', {
      // Removido trailName para permitir geração automática e evitar conflitos
      bucket: this.cloudTrailBucket,
      enableFileValidation: true,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: false, // Apenas us-east-1 para reduzir custos
      managementEvents: cloudtrail.ReadWriteType.ALL,
    });

    // ========================================
    // 3. GuardDuty Detector
    // ========================================
    // IMPORTANTE: GuardDuty Detector é um recurso SINGLETON por conta/região
    // Assumimos que GuardDuty já está habilitado na conta (gerenciado fora desta stack)
    // Esta stack apenas configura o EventBridge Rule para escutar findings do GuardDuty

    // ========================================
    // 4. SNS Topic para Alertas de Segurança
    // ========================================
    this.securityAlertTopic = new sns.Topic(this, 'SecurityAlertTopic', {
      // Removido topicName para permitir geração automática e evitar conflitos
      displayName: 'AlquimistaAI Security Alerts',
    });

    // Adicionar assinatura de email se fornecida
    if (props?.securityAlertEmail) {
      this.securityAlertTopic.addSubscription(
        new subscriptions.EmailSubscription(props.securityAlertEmail)
      );
    }

    // ========================================
    // 5. EventBridge Rule: GuardDuty → SNS
    // ========================================
    const guardDutyRule = new events.Rule(this, 'GuardDutyHighSeverityRule', {
      // Removido ruleName para permitir geração automática e evitar conflitos
      description: 'Notifica sobre achados HIGH/CRITICAL do GuardDuty',
      eventPattern: {
        source: ['aws.guardduty'],
        detailType: ['GuardDuty Finding'],
        detail: {
          severity: [7, 7.0, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 8, 8.0, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9],
        },
      },
    });

    guardDutyRule.addTarget(
      new targets.SnsTopic(this.securityAlertTopic, {
        message: events.RuleTargetInput.fromText(
          `🚨 ALERTA DE SEGURANÇA - GuardDuty\n\n` +
          `Tipo: ${events.EventField.fromPath('$.detail.type')}\n` +
          `Severidade: ${events.EventField.fromPath('$.detail.severity')}\n` +
          `Região: ${events.EventField.fromPath('$.region')}\n` +
          `Conta: ${events.EventField.fromPath('$.account')}\n` +
          `Descrição: ${events.EventField.fromPath('$.detail.description')}\n` +
          `Recurso: ${events.EventField.fromPath('$.detail.resource.resourceType')}\n\n` +
          `Ação recomendada: Revisar o achado no console do GuardDuty.`
        ),
      })
    );

    // ========================================
    // 6. SNS Topic para Alertas de Custo
    // ========================================
    this.costAlertTopic = new sns.Topic(this, 'CostAlertTopic', {
      // Removido topicName para permitir geração automática e evitar conflitos
      displayName: 'AlquimistaAI Cost Alerts',
    });

    // Adicionar assinatura de email se fornecida
    if (props?.costAlertEmail) {
      this.costAlertTopic.addSubscription(
        new subscriptions.EmailSubscription(props.costAlertEmail)
      );
    }

    // ========================================
    // 7. AWS Budget com Alertas 80%, 100%, 120%
    // ========================================
    const monthlyBudget = props?.monthlyBudgetAmount || 500;

    const budget = new budgets.CfnBudget(this, 'MonthlyBudget', {
      budget: {
        budgetName: `alquimista-monthly-budget-${env}`,
        budgetType: 'COST',
        timeUnit: 'MONTHLY',
        budgetLimit: {
          amount: monthlyBudget,
          unit: 'USD',
        },
      },
      notificationsWithSubscribers: [
        // Alerta 80% - Aviso Antecipado
        {
          notification: {
            notificationType: 'FORECASTED',
            comparisonOperator: 'GREATER_THAN',
            threshold: 80,
            thresholdType: 'PERCENTAGE',
          },
          subscribers: [
            {
              subscriptionType: 'SNS',
              address: this.costAlertTopic.topicArn,
            },
          ],
        },
        // Alerta 100% - Estouro do Orçamento
        {
          notification: {
            notificationType: 'ACTUAL',
            comparisonOperator: 'GREATER_THAN',
            threshold: 100,
            thresholdType: 'PERCENTAGE',
          },
          subscribers: [
            {
              subscriptionType: 'SNS',
              address: this.costAlertTopic.topicArn,
            },
          ],
        },
        // Alerta 120% - Anomalia Grave
        {
          notification: {
            notificationType: 'ACTUAL',
            comparisonOperator: 'GREATER_THAN',
            threshold: 120,
            thresholdType: 'PERCENTAGE',
          },
          subscribers: [
            {
              subscriptionType: 'SNS',
              address: this.costAlertTopic.topicArn,
            },
          ],
        },
      ],
    });

    // Garantir que o SNS Topic seja criado antes do Budget
    budget.node.addDependency(this.costAlertTopic);

    // ========================================
    // 8. Cost Anomaly Detection
    // ========================================
    // IMPORTANTE: Cost Anomaly Monitor é um recurso GLOBAL da conta AWS
    // Nesta conta, o Cost Anomaly Monitor é gerenciado fora desta stack (já existe)
    // Esta stack apenas cria Budgets + SNS Alerts para monitoramento de custos
    // O Cost Anomaly Monitor existente pode ser configurado manualmente no console AWS
    // para enviar alertas para o costAlertTopic criado por esta stack

    // ========================================
    // 9. SNS Topic para Alertas Operacionais
    // ========================================
    this.opsAlertTopic = new sns.Topic(this, 'OpsAlertTopic', {
      // Removido topicName para permitir geração automática e evitar conflitos
      displayName: 'AlquimistaAI Operational Alerts',
    });

    // Adicionar assinatura de email se fornecida
    if (props?.opsAlertEmail) {
      this.opsAlertTopic.addSubscription(
        new subscriptions.EmailSubscription(props.opsAlertEmail)
      );
    }

    // ========================================
    // 10. Alarmes CloudWatch - Fibonacci
    // ========================================
    if (props?.fibonacciApiId) {
      // Alarme para erros 5XX no API Gateway do Fibonacci
      const fibonacci5xxMetric = new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '5XXError',
        dimensionsMap: {
          ApiId: props.fibonacciApiId,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      });

      const fibonacci5xxAlarm = new cloudwatch.Alarm(this, 'Fibonacci5XXAlarm', {
        // Removido alarmName para permitir geração automática e evitar conflitos
        alarmDescription: 'Erros 5XX no API Gateway do Fibonacci - Investigar problemas no backend',
        metric: fibonacci5xxMetric,
        threshold: 5,
        evaluationPeriods: 1,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });

      fibonacci5xxAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.opsAlertTopic));
    }

    if (props?.fibonacciLambdaName) {
      // Alarme para erros na Lambda do Fibonacci
      const fibonacciLambdaErrorsMetric = new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Errors',
        dimensionsMap: {
          FunctionName: props.fibonacciLambdaName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      });

      const fibonacciLambdaErrorsAlarm = new cloudwatch.Alarm(this, 'FibonacciLambdaErrorsAlarm', {
        // Removido alarmName para permitir geração automática e evitar conflitos
        alarmDescription: 'Erros na Lambda do Fibonacci - Verificar logs e código',
        metric: fibonacciLambdaErrorsMetric,
        threshold: 3,
        evaluationPeriods: 1,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });

      fibonacciLambdaErrorsAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.opsAlertTopic));

      // Alarme para throttles na Lambda do Fibonacci
      const fibonacciLambdaThrottlesMetric = new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Throttles',
        dimensionsMap: {
          FunctionName: props.fibonacciLambdaName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      });

      const fibonacciLambdaThrottlesAlarm = new cloudwatch.Alarm(this, 'FibonacciLambdaThrottlesAlarm', {
        // Removido alarmName para permitir geração automática e evitar conflitos
        alarmDescription: 'Throttles na Lambda do Fibonacci - Considerar aumentar concorrência',
        metric: fibonacciLambdaThrottlesMetric,
        threshold: 1,
        evaluationPeriods: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });

      fibonacciLambdaThrottlesAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.opsAlertTopic));
    }

    // ========================================
    // 11. Alarmes CloudWatch - Nigredo
    // ========================================
    if (props?.nigredoApiId) {
      // Alarme para erros 5XX no API Gateway do Nigredo
      const nigredo5xxMetric = new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '5XXError',
        dimensionsMap: {
          ApiId: props.nigredoApiId,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      });

      const nigredo5xxAlarm = new cloudwatch.Alarm(this, 'Nigredo5XXAlarm', {
        // Removido alarmName para permitir geração automática e evitar conflitos
        alarmDescription: 'Erros 5XX no API Gateway do Nigredo - Investigar problemas no backend',
        metric: nigredo5xxMetric,
        threshold: 5,
        evaluationPeriods: 1,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });

      nigredo5xxAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.opsAlertTopic));
    }

    if (props?.nigredoLambdaNames && props.nigredoLambdaNames.length > 0) {
      // Criar alarmes para cada Lambda do Nigredo
      props.nigredoLambdaNames.forEach((lambdaName, index) => {
        const nigredoLambdaErrorsMetric = new cloudwatch.Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Errors',
          dimensionsMap: {
            FunctionName: lambdaName,
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        });

        const nigredoLambdaErrorsAlarm = new cloudwatch.Alarm(this, `NigredoLambdaErrorsAlarm${index}`, {
          // Removido alarmName para permitir geração automática e evitar conflitos
          alarmDescription: `Erros na Lambda ${lambdaName} do Nigredo - Verificar logs`,
          metric: nigredoLambdaErrorsMetric,
          threshold: 3,
          evaluationPeriods: 1,
          comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
          treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        });

        nigredoLambdaErrorsAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.opsAlertTopic));
      });
    }

    // ========================================
    // 12. Alarmes CloudWatch - Aurora
    // ========================================
    if (props?.auroraClusterId) {
      // Alarme para CPU alta no Aurora
      const auroraCpuMetric = new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          DBClusterIdentifier: props.auroraClusterId,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      });

      const auroraCpuAlarm = new cloudwatch.Alarm(this, 'AuroraCPUAlarm', {
        // Removido alarmName para permitir geração automática e evitar conflitos
        alarmDescription: 'CPU alta no Aurora - Verificar queries e considerar scaling',
        metric: auroraCpuMetric,
        threshold: 80,
        evaluationPeriods: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });

      auroraCpuAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.opsAlertTopic));

      // Alarme para conexões altas no Aurora
      const auroraConnectionsMetric = new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'DatabaseConnections',
        dimensionsMap: {
          DBClusterIdentifier: props.auroraClusterId,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      });

      const auroraConnectionsAlarm = new cloudwatch.Alarm(this, 'AuroraConnectionsAlarm', {
        // Removido alarmName para permitir geração automática e evitar conflitos
        alarmDescription: 'Conexões altas no Aurora - Verificar connection pooling',
        metric: auroraConnectionsMetric,
        threshold: 80,
        evaluationPeriods: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });

      auroraConnectionsAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.opsAlertTopic));
    }

    // ========================================
    // Tags
    // ========================================
    // Tags são aplicadas via app.ts para evitar duplicatas case-insensitive
    // Não adicionar tags aqui para evitar conflito com commonTags do app.ts

    // ========================================
    // Outputs
    // ========================================
    new cdk.CfnOutput(this, 'CloudTrailBucketName', {
      value: this.cloudTrailBucket.bucketName,
      description: 'Nome do bucket S3 para logs do CloudTrail',
      exportName: `${env}-CloudTrailBucketName`,
    });

    new cdk.CfnOutput(this, 'CloudTrailName', {
      value: this.trail.trailArn,
      description: 'ARN do CloudTrail',
      exportName: `${env}-CloudTrailArn`,
    });

    // GuardDutyDetectorId output removido - GuardDuty gerenciado fora desta stack

    new cdk.CfnOutput(this, 'SecurityAlertTopicArn', {
      value: this.securityAlertTopic.topicArn,
      description: 'ARN do tópico SNS para alertas de segurança',
      exportName: `${env}-SecurityAlertTopicArn`,
    });

    new cdk.CfnOutput(this, 'CostAlertTopicArn', {
      value: this.costAlertTopic.topicArn,
      description: 'ARN do tópico SNS para alertas de custo',
      exportName: `${env}-CostAlertTopicArn`,
    });

    new cdk.CfnOutput(this, 'MonthlyBudgetName', {
      value: `alquimista-monthly-budget-${env}`,
      description: 'Nome do AWS Budget mensal',
    });

    new cdk.CfnOutput(this, 'MonthlyBudgetAmount', {
      value: monthlyBudget.toString(),
      description: 'Valor do orçamento mensal em USD',
    });

    // CostAnomalyMonitorArn output movido para dentro do bloco condicional (apenas prod)

    new cdk.CfnOutput(this, 'OpsAlertTopicArn', {
      value: this.opsAlertTopic.topicArn,
      description: 'ARN do tópico SNS para alertas operacionais',
      exportName: `${env}-OpsAlertTopicArn`,
    });
  }
}
