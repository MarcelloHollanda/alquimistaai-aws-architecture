import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import { Construct } from 'constructs';

/**
 * CloudWatch Alarms for Nigredo Prospecting Core
 * 
 * Comprehensive alarm configuration including:
 * - Critical: API error rate > 5%
 * - Critical: API latency > 1000ms (p99)
 * - Critical: Webhook failure rate > 10%
 * - Warning: API latency > 500ms (p95)
 */

export interface NigredoAlarmsProps {
  envName: string;
  createLeadLambda: lambda.IFunction;
  listLeadsLambda: lambda.IFunction;
  getLeadLambda: lambda.IFunction;
  httpApi: apigatewayv2.HttpApi;
  alarmTopic: sns.ITopic;
}

export class NigredoAlarms extends Construct {
  public readonly criticalAlarms: cloudwatch.Alarm[];
  public readonly warningAlarms: cloudwatch.Alarm[];

  constructor(scope: Construct, id: string, props: NigredoAlarmsProps) {
    super(scope, id);

    this.criticalAlarms = [];
    this.warningAlarms = [];

    // ========================================
    // Critical Alarms
    // ========================================

    // Critical: API Error Rate > 5%
    const apiErrorRateAlarm = this.createApiErrorRateAlarm(props);
    this.criticalAlarms.push(apiErrorRateAlarm);

    // Critical: API Latency > 1000ms (p99)
    const apiLatencyP99Alarm = this.createApiLatencyP99Alarm(props);
    this.criticalAlarms.push(apiLatencyP99Alarm);

    // Critical: Webhook Failure Rate > 10%
    const webhookFailureRateAlarm = this.createWebhookFailureRateAlarm(props);
    this.criticalAlarms.push(webhookFailureRateAlarm);

    // Critical: Create Lead Lambda Errors
    const createLeadErrorAlarm = this.createLambdaErrorAlarm(
      props.createLeadLambda,
      'CreateLead',
      props.envName,
      props.alarmTopic
    );
    this.criticalAlarms.push(createLeadErrorAlarm);

    // Critical: List Leads Lambda Errors
    const listLeadsErrorAlarm = this.createLambdaErrorAlarm(
      props.listLeadsLambda,
      'ListLeads',
      props.envName,
      props.alarmTopic
    );
    this.criticalAlarms.push(listLeadsErrorAlarm);

    // Critical: Get Lead Lambda Errors
    const getLeadErrorAlarm = this.createLambdaErrorAlarm(
      props.getLeadLambda,
      'GetLead',
      props.envName,
      props.alarmTopic
    );
    this.criticalAlarms.push(getLeadErrorAlarm);

    // ========================================
    // Warning Alarms
    // ========================================

    // Warning: API Latency > 500ms (p95)
    const apiLatencyP95Alarm = this.createApiLatencyP95Alarm(props);
    this.warningAlarms.push(apiLatencyP95Alarm);

    // Warning: Create Lead Lambda Duration > 500ms (p95)
    const createLeadDurationAlarm = this.createLambdaDurationAlarm(
      props.createLeadLambda,
      'CreateLead',
      props.envName,
      props.alarmTopic,
      500
    );
    this.warningAlarms.push(createLeadDurationAlarm);

    // Warning: Lambda Throttles
    const createLeadThrottleAlarm = this.createLambdaThrottleAlarm(
      props.createLeadLambda,
      'CreateLead',
      props.envName,
      props.alarmTopic
    );
    this.warningAlarms.push(createLeadThrottleAlarm);

    // Warning: High Rate Limit Hits
    const rateLimitAlarm = this.createRateLimitAlarm(props);
    this.warningAlarms.push(rateLimitAlarm);

    // ========================================
    // CloudFormation Outputs
    // ========================================

    new cdk.CfnOutput(this, 'CriticalAlarmsCount', {
      value: this.criticalAlarms.length.toString(),
      description: 'Number of critical alarms configured',
      exportName: `${props.envName}-NigredoCriticalAlarmsCount`
    });

    new cdk.CfnOutput(this, 'WarningAlarmsCount', {
      value: this.warningAlarms.length.toString(),
      description: 'Number of warning alarms configured',
      exportName: `${props.envName}-NigredoWarningAlarmsCount`
    });
  }

  /**
   * Create API Error Rate Alarm (Critical)
   * Triggers when error rate exceeds 5%
   */
  private createApiErrorRateAlarm(props: NigredoAlarmsProps): cloudwatch.Alarm {
    // Calculate error rate: (4xx + 5xx) / total requests * 100
    const totalRequestsMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: 'Count',
      dimensionsMap: {
        ApiId: props.httpApi.apiId
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5)
    });

    const error4xxMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: '4XXError',
      dimensionsMap: {
        ApiId: props.httpApi.apiId
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5)
    });

    const error5xxMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: '5XXError',
      dimensionsMap: {
        ApiId: props.httpApi.apiId
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5)
    });

    const errorRateMetric = new cloudwatch.MathExpression({
      expression: '((e4xx + e5xx) / requests) * 100',
      usingMetrics: {
        requests: totalRequestsMetric,
        e4xx: error4xxMetric,
        e5xx: error5xxMetric
      },
      period: cdk.Duration.minutes(5)
    });

    const alarm = new cloudwatch.Alarm(this, 'ApiErrorRateAlarm', {
      alarmName: `nigredo-api-error-rate-critical-${props.envName}`,
      alarmDescription: 'CRITICAL: Nigredo API error rate exceeds 5%',
      metric: errorRateMetric,
      threshold: 5,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    alarm.addAlarmAction(new cloudwatch_actions.SnsAction(props.alarmTopic));

    return alarm;
  }

  /**
   * Create API Latency P99 Alarm (Critical)
   * Triggers when p99 latency exceeds 1000ms
   */
  private createApiLatencyP99Alarm(props: NigredoAlarmsProps): cloudwatch.Alarm {
    const latencyP99Metric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: 'Latency',
      dimensionsMap: {
        ApiId: props.httpApi.apiId
      },
      statistic: 'p99',
      period: cdk.Duration.minutes(5)
    });

    const alarm = new cloudwatch.Alarm(this, 'ApiLatencyP99Alarm', {
      alarmName: `nigredo-api-latency-p99-critical-${props.envName}`,
      alarmDescription: 'CRITICAL: Nigredo API p99 latency exceeds 1000ms',
      metric: latencyP99Metric,
      threshold: 1000,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    alarm.addAlarmAction(new cloudwatch_actions.SnsAction(props.alarmTopic));

    return alarm;
  }

  /**
   * Create API Latency P95 Alarm (Warning)
   * Triggers when p95 latency exceeds 500ms
   */
  private createApiLatencyP95Alarm(props: NigredoAlarmsProps): cloudwatch.Alarm {
    const latencyP95Metric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: 'Latency',
      dimensionsMap: {
        ApiId: props.httpApi.apiId
      },
      statistic: 'p95',
      period: cdk.Duration.minutes(5)
    });

    const alarm = new cloudwatch.Alarm(this, 'ApiLatencyP95Alarm', {
      alarmName: `nigredo-api-latency-p95-warning-${props.envName}`,
      alarmDescription: 'WARNING: Nigredo API p95 latency exceeds 500ms',
      metric: latencyP95Metric,
      threshold: 500,
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    alarm.addAlarmAction(new cloudwatch_actions.SnsAction(props.alarmTopic));

    return alarm;
  }

  /**
   * Create Webhook Failure Rate Alarm (Critical)
   * Triggers when webhook failure rate exceeds 10%
   */
  private createWebhookFailureRateAlarm(props: NigredoAlarmsProps): cloudwatch.Alarm {
    const webhookSuccessMetric = new cloudwatch.Metric({
      namespace: 'Nigredo/Prospecting',
      metricName: 'WebhookSuccess',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5)
    });

    const webhookFailureMetric = new cloudwatch.Metric({
      namespace: 'Nigredo/Prospecting',
      metricName: 'WebhookFailure',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5)
    });

    const webhookFailureRateMetric = new cloudwatch.MathExpression({
      expression: '(failure / (success + failure)) * 100',
      usingMetrics: {
        success: webhookSuccessMetric,
        failure: webhookFailureMetric
      },
      period: cdk.Duration.minutes(5)
    });

    const alarm = new cloudwatch.Alarm(this, 'WebhookFailureRateAlarm', {
      alarmName: `nigredo-webhook-failure-rate-critical-${props.envName}`,
      alarmDescription: 'CRITICAL: Nigredo webhook failure rate exceeds 10%',
      metric: webhookFailureRateMetric,
      threshold: 10,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    alarm.addAlarmAction(new cloudwatch_actions.SnsAction(props.alarmTopic));

    return alarm;
  }

  /**
   * Create Lambda Error Alarm (Critical)
   * Triggers when Lambda errors exceed threshold
   */
  private createLambdaErrorAlarm(
    lambdaFunction: lambda.IFunction,
    functionName: string,
    envName: string,
    alarmTopic: sns.ITopic
  ): cloudwatch.Alarm {
    const errorMetric = lambdaFunction.metricErrors({
      statistic: 'Sum',
      period: cdk.Duration.minutes(5)
    });

    const alarm = new cloudwatch.Alarm(this, `${functionName}ErrorAlarm`, {
      alarmName: `nigredo-${functionName.toLowerCase()}-errors-critical-${envName}`,
      alarmDescription: `CRITICAL: Nigredo ${functionName} Lambda errors exceed threshold`,
      metric: errorMetric,
      threshold: 5,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    alarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    return alarm;
  }

  /**
   * Create Lambda Duration Alarm (Warning)
   * Triggers when Lambda duration exceeds threshold
   */
  private createLambdaDurationAlarm(
    lambdaFunction: lambda.IFunction,
    functionName: string,
    envName: string,
    alarmTopic: sns.ITopic,
    thresholdMs: number
  ): cloudwatch.Alarm {
    const durationMetric = lambdaFunction.metricDuration({
      statistic: 'p95',
      period: cdk.Duration.minutes(5)
    });

    const alarm = new cloudwatch.Alarm(this, `${functionName}DurationAlarm`, {
      alarmName: `nigredo-${functionName.toLowerCase()}-duration-warning-${envName}`,
      alarmDescription: `WARNING: Nigredo ${functionName} Lambda p95 duration exceeds ${thresholdMs}ms`,
      metric: durationMetric,
      threshold: thresholdMs,
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    alarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    return alarm;
  }

  /**
   * Create Lambda Throttle Alarm (Warning)
   * Triggers when Lambda throttles occur
   */
  private createLambdaThrottleAlarm(
    lambdaFunction: lambda.IFunction,
    functionName: string,
    envName: string,
    alarmTopic: sns.ITopic
  ): cloudwatch.Alarm {
    const throttleMetric = lambdaFunction.metricThrottles({
      statistic: 'Sum',
      period: cdk.Duration.minutes(5)
    });

    const alarm = new cloudwatch.Alarm(this, `${functionName}ThrottleAlarm`, {
      alarmName: `nigredo-${functionName.toLowerCase()}-throttles-warning-${envName}`,
      alarmDescription: `WARNING: Nigredo ${functionName} Lambda is being throttled`,
      metric: throttleMetric,
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    alarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    return alarm;
  }

  /**
   * Create Rate Limit Alarm (Warning)
   * Triggers when rate limit hits are high
   */
  private createRateLimitAlarm(props: NigredoAlarmsProps): cloudwatch.Alarm {
    const rateLimitMetric = new cloudwatch.Metric({
      namespace: 'Nigredo/Prospecting',
      metricName: 'RateLimitHits',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5)
    });

    const alarm = new cloudwatch.Alarm(this, 'RateLimitAlarm', {
      alarmName: `nigredo-rate-limit-hits-warning-${props.envName}`,
      alarmDescription: 'WARNING: High number of rate limit hits detected',
      metric: rateLimitMetric,
      threshold: 100,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    alarm.addAlarmAction(new cloudwatch_actions.SnsAction(props.alarmTopic));

    return alarm;
  }
}
