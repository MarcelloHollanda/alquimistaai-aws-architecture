import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import { Construct } from 'constructs';

/**
 * Nigredo Prospecting Core Dashboard
 * 
 * Comprehensive monitoring dashboard for the Nigredo prospecting system including:
 * - Lead submissions over time
 * - Webhook success rate
 * - API latency percentiles
 * - Error rates by endpoint
 */

export interface NigredoDashboardProps {
  envName: string;
  createLeadLambda: lambda.IFunction;
  listLeadsLambda: lambda.IFunction;
  getLeadLambda: lambda.IFunction;
  httpApi: apigatewayv2.HttpApi;
}

export class NigredoDashboard extends Construct {
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: NigredoDashboardProps) {
    super(scope, id);

    // ========================================
    // Dashboard Nigredo Prospecting Core
    // ========================================
    this.dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: `Nigredo-Prospecting-${props.envName}`,
      periodOverride: cloudwatch.PeriodOverride.AUTO
    });

    // ========================================
    // Custom Metrics for Business Logic
    // ========================================

    // Lead submissions over time
    const leadSubmissionsMetric = new cloudwatch.Metric({
      namespace: 'Nigredo/Prospecting',
      metricName: 'LeadSubmissions',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
      label: 'Lead Submissions'
    });

    // Webhook success rate
    const webhookSuccessMetric = new cloudwatch.Metric({
      namespace: 'Nigredo/Prospecting',
      metricName: 'WebhookSuccess',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
      label: 'Webhook Success'
    });

    const webhookFailureMetric = new cloudwatch.Metric({
      namespace: 'Nigredo/Prospecting',
      metricName: 'WebhookFailure',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
      label: 'Webhook Failure'
    });

    // Calculate webhook success rate percentage
    const webhookSuccessRateMetric = new cloudwatch.MathExpression({
      expression: '(success / (success + failure)) * 100',
      usingMetrics: {
        success: webhookSuccessMetric,
        failure: webhookFailureMetric
      },
      label: 'Webhook Success Rate (%)',
      period: cdk.Duration.minutes(5)
    });

    // Rate limit hits
    const rateLimitHitsMetric = new cloudwatch.Metric({
      namespace: 'Nigredo/Prospecting',
      metricName: 'RateLimitHits',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
      label: 'Rate Limit Hits'
    });

    // ========================================
    // API Gateway Metrics
    // ========================================

    // Total API requests
    const apiRequestsMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: 'Count',
      dimensionsMap: {
        ApiId: props.httpApi.apiId
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(1),
      label: 'Total Requests'
    });

    // API 4xx errors
    const api4xxErrorsMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: '4XXError',
      dimensionsMap: {
        ApiId: props.httpApi.apiId
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(1),
      label: '4xx Errors'
    });

    // API 5xx errors
    const api5xxErrorsMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: '5XXError',
      dimensionsMap: {
        ApiId: props.httpApi.apiId
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(1),
      label: '5xx Errors'
    });

    // Calculate error rate percentage
    const errorRateMetric = new cloudwatch.MathExpression({
      expression: '((e4xx + e5xx) / requests) * 100',
      usingMetrics: {
        requests: apiRequestsMetric,
        e4xx: api4xxErrorsMetric,
        e5xx: api5xxErrorsMetric
      },
      label: 'Error Rate (%)',
      period: cdk.Duration.minutes(1)
    });

    // API Latency percentiles
    const apiLatencyAvgMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: 'Latency',
      dimensionsMap: {
        ApiId: props.httpApi.apiId
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(1),
      label: 'Average'
    });

    const apiLatencyP50Metric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: 'Latency',
      dimensionsMap: {
        ApiId: props.httpApi.apiId
      },
      statistic: 'p50',
      period: cdk.Duration.minutes(1),
      label: 'p50'
    });

    const apiLatencyP95Metric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: 'Latency',
      dimensionsMap: {
        ApiId: props.httpApi.apiId
      },
      statistic: 'p95',
      period: cdk.Duration.minutes(1),
      label: 'p95'
    });

    const apiLatencyP99Metric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: 'Latency',
      dimensionsMap: {
        ApiId: props.httpApi.apiId
      },
      statistic: 'p99',
      period: cdk.Duration.minutes(1),
      label: 'p99'
    });

    // ========================================
    // Lambda Metrics by Endpoint
    // ========================================

    // Create Lead Lambda metrics
    const createLeadInvocationsMetric = props.createLeadLambda.metricInvocations({
      statistic: 'Sum',
      period: cdk.Duration.minutes(1),
      label: 'Create Lead'
    });

    const createLeadErrorsMetric = props.createLeadLambda.metricErrors({
      statistic: 'Sum',
      period: cdk.Duration.minutes(1),
      label: 'Create Lead Errors'
    });

    const createLeadDurationAvgMetric = props.createLeadLambda.metricDuration({
      statistic: 'Average',
      period: cdk.Duration.minutes(1),
      label: 'Create Lead Avg'
    });

    const createLeadDurationP95Metric = props.createLeadLambda.metricDuration({
      statistic: 'p95',
      period: cdk.Duration.minutes(1),
      label: 'Create Lead p95'
    });

    const createLeadDurationP99Metric = props.createLeadLambda.metricDuration({
      statistic: 'p99',
      period: cdk.Duration.minutes(1),
      label: 'Create Lead p99'
    });

    // List Leads Lambda metrics
    const listLeadsInvocationsMetric = props.listLeadsLambda.metricInvocations({
      statistic: 'Sum',
      period: cdk.Duration.minutes(1),
      label: 'List Leads'
    });

    const listLeadsErrorsMetric = props.listLeadsLambda.metricErrors({
      statistic: 'Sum',
      period: cdk.Duration.minutes(1),
      label: 'List Leads Errors'
    });

    const listLeadsDurationAvgMetric = props.listLeadsLambda.metricDuration({
      statistic: 'Average',
      period: cdk.Duration.minutes(1),
      label: 'List Leads Avg'
    });

    const listLeadsDurationP95Metric = props.listLeadsLambda.metricDuration({
      statistic: 'p95',
      period: cdk.Duration.minutes(1),
      label: 'List Leads p95'
    });

    // Get Lead Lambda metrics
    const getLeadInvocationsMetric = props.getLeadLambda.metricInvocations({
      statistic: 'Sum',
      period: cdk.Duration.minutes(1),
      label: 'Get Lead'
    });

    const getLeadErrorsMetric = props.getLeadLambda.metricErrors({
      statistic: 'Sum',
      period: cdk.Duration.minutes(1),
      label: 'Get Lead Errors'
    });

    const getLeadDurationAvgMetric = props.getLeadLambda.metricDuration({
      statistic: 'Average',
      period: cdk.Duration.minutes(1),
      label: 'Get Lead Avg'
    });

    const getLeadDurationP95Metric = props.getLeadLambda.metricDuration({
      statistic: 'p95',
      period: cdk.Duration.minutes(1),
      label: 'Get Lead p95'
    });

    // ========================================
    // Add Widgets to Dashboard
    // ========================================

    // Row 1: Overview - Lead Submissions
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lead Submissions Over Time',
        left: [leadSubmissionsMetric],
        width: 24,
        height: 6,
        leftYAxis: {
          min: 0
        }
      })
    );

    // Row 2: Webhook Success Rate
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Webhook Success Rate',
        left: [webhookSuccessRateMetric],
        width: 12,
        height: 6,
        leftYAxis: {
          min: 0,
          max: 100,
          label: 'Success Rate (%)'
        }
      }),
      new cloudwatch.GraphWidget({
        title: 'Webhook Attempts',
        left: [webhookSuccessMetric, webhookFailureMetric],
        width: 12,
        height: 6,
        leftYAxis: {
          min: 0,
          label: 'Count'
        }
      })
    );

    // Row 3: API Gateway - Requests and Error Rate
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Requests per Minute',
        left: [apiRequestsMetric],
        width: 12,
        height: 6,
        leftYAxis: {
          min: 0,
          label: 'Requests'
        }
      }),
      new cloudwatch.GraphWidget({
        title: 'API Error Rate',
        left: [errorRateMetric],
        right: [api4xxErrorsMetric, api5xxErrorsMetric],
        width: 12,
        height: 6,
        leftYAxis: {
          min: 0,
          max: 100,
          label: 'Error Rate (%)'
        },
        rightYAxis: {
          min: 0,
          label: 'Error Count'
        }
      })
    );

    // Row 4: API Latency Percentiles
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Latency Percentiles (ms)',
        left: [
          apiLatencyAvgMetric,
          apiLatencyP50Metric,
          apiLatencyP95Metric,
          apiLatencyP99Metric
        ],
        width: 24,
        height: 6,
        leftYAxis: {
          min: 0,
          label: 'Latency (ms)'
        }
      })
    );

    // Row 5: Errors by Endpoint
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Errors by Endpoint',
        left: [
          createLeadErrorsMetric,
          listLeadsErrorsMetric,
          getLeadErrorsMetric
        ],
        width: 24,
        height: 6,
        leftYAxis: {
          min: 0,
          label: 'Error Count'
        }
      })
    );

    // Row 6: Invocations by Endpoint
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Invocations by Endpoint',
        left: [
          createLeadInvocationsMetric,
          listLeadsInvocationsMetric,
          getLeadInvocationsMetric
        ],
        width: 24,
        height: 6,
        leftYAxis: {
          min: 0,
          label: 'Invocations'
        }
      })
    );

    // Row 7: Lambda Duration - Create Lead
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Create Lead Lambda - Duration (ms)',
        left: [
          createLeadDurationAvgMetric,
          createLeadDurationP95Metric,
          createLeadDurationP99Metric
        ],
        width: 12,
        height: 6,
        leftYAxis: {
          min: 0,
          label: 'Duration (ms)'
        }
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Create Lead - Latest Metrics',
        metrics: [
          createLeadInvocationsMetric,
          createLeadErrorsMetric,
          createLeadDurationP99Metric
        ],
        width: 12,
        height: 6
      })
    );

    // Row 8: Lambda Duration - List & Get Leads
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'List Leads Lambda - Duration (ms)',
        left: [
          listLeadsDurationAvgMetric,
          listLeadsDurationP95Metric
        ],
        width: 12,
        height: 6,
        leftYAxis: {
          min: 0,
          label: 'Duration (ms)'
        }
      }),
      new cloudwatch.GraphWidget({
        title: 'Get Lead Lambda - Duration (ms)',
        left: [
          getLeadDurationAvgMetric,
          getLeadDurationP95Metric
        ],
        width: 12,
        height: 6,
        leftYAxis: {
          min: 0,
          label: 'Duration (ms)'
        }
      })
    );

    // Row 9: Rate Limiting
    this.dashboard.addWidgets(
      new cloudwatch.SingleValueWidget({
        title: 'Rate Limit Hits (Last Hour)',
        metrics: [rateLimitHitsMetric],
        width: 12,
        height: 6,
        setPeriodToTimeRange: false
      }),
      new cloudwatch.GraphWidget({
        title: 'Rate Limit Hits Over Time',
        left: [rateLimitHitsMetric],
        width: 12,
        height: 6,
        leftYAxis: {
          min: 0,
          label: 'Hits'
        }
      })
    );

    // Row 10: Lambda Throttles and Concurrent Executions
    const createLeadThrottlesMetric = props.createLeadLambda.metricThrottles({
      statistic: 'Sum',
      period: cdk.Duration.minutes(1),
      label: 'Create Lead'
    });

    const listLeadsThrottlesMetric = props.listLeadsLambda.metricThrottles({
      statistic: 'Sum',
      period: cdk.Duration.minutes(1),
      label: 'List Leads'
    });

    const getLeadThrottlesMetric = props.getLeadLambda.metricThrottles({
      statistic: 'Sum',
      period: cdk.Duration.minutes(1),
      label: 'Get Lead'
    });

    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Throttles',
        left: [
          createLeadThrottlesMetric,
          listLeadsThrottlesMetric,
          getLeadThrottlesMetric
        ],
        width: 24,
        height: 6,
        leftYAxis: {
          min: 0,
          label: 'Throttles'
        }
      })
    );
  }
}
