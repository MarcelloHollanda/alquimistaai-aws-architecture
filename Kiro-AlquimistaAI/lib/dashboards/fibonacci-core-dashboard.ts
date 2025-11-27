import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as events from 'aws-cdk-lib/aws-events';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

export interface FibonacciCoreDashboardProps {
  envName: string;
  apiHandler: lambda.IFunction;
  httpApi: apigatewayv2.HttpApi;
  eventBus: events.EventBus;
  mainQueue: sqs.Queue;
  dlq: sqs.Queue;
  agentQueues?: sqs.Queue[];
}

export class FibonacciCoreDashboard extends Construct {
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: FibonacciCoreDashboardProps) {
    super(scope, id);

    // ========================================
    // Dashboard Fibonacci Core
    // ========================================
    this.dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: `Fibonacci-Core-${props.envName}`,
      periodOverride: cloudwatch.PeriodOverride.AUTO
    });

    // ========================================
    // API Gateway Metrics
    // ========================================
    
    // Requests per minute
    const apiRequestsMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: 'Count',
      dimensionsMap: {
        ApiId: props.httpApi.apiId
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(1)
    });

    // API Errors (4xx)
    const api4xxErrorsMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: '4XXError',
      dimensionsMap: {
        ApiId: props.httpApi.apiId
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(1)
    });

    // API Errors (5xx)
    const api5xxErrorsMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: '5XXError',
      dimensionsMap: {
        ApiId: props.httpApi.apiId
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(1)
    });

    // API Latency
    const apiLatencyMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: 'Latency',
      dimensionsMap: {
        ApiId: props.httpApi.apiId
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(1)
    });

    const apiLatencyP95Metric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: 'Latency',
      dimensionsMap: {
        ApiId: props.httpApi.apiId
      },
      statistic: 'p95',
      period: cdk.Duration.minutes(1)
    });

    const apiLatencyP99Metric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: 'Latency',
      dimensionsMap: {
        ApiId: props.httpApi.apiId
      },
      statistic: 'p99',
      period: cdk.Duration.minutes(1)
    });

    // ========================================
    // Lambda Metrics
    // ========================================
    
    // Lambda Invocations
    const lambdaInvocationsMetric = props.apiHandler.metricInvocations({
      statistic: 'Sum',
      period: cdk.Duration.minutes(1)
    });

    // Lambda Errors
    const lambdaErrorsMetric = props.apiHandler.metricErrors({
      statistic: 'Sum',
      period: cdk.Duration.minutes(1)
    });

    // Lambda Throttles
    const lambdaThrottlesMetric = props.apiHandler.metricThrottles({
      statistic: 'Sum',
      period: cdk.Duration.minutes(1)
    });

    // Lambda Duration
    const lambdaDurationAvgMetric = props.apiHandler.metricDuration({
      statistic: 'Average',
      period: cdk.Duration.minutes(1)
    });

    const lambdaDurationP95Metric = props.apiHandler.metricDuration({
      statistic: 'p95',
      period: cdk.Duration.minutes(1)
    });

    const lambdaDurationP99Metric = props.apiHandler.metricDuration({
      statistic: 'p99',
      period: cdk.Duration.minutes(1)
    });

    // Lambda Concurrent Executions
    const lambdaConcurrentExecutionsMetric = new cloudwatch.Metric({
      namespace: 'AWS/Lambda',
      metricName: 'ConcurrentExecutions',
      dimensionsMap: {
        FunctionName: props.apiHandler.functionName
      },
      statistic: 'Maximum',
      period: cdk.Duration.minutes(1)
    });

    // ========================================
    // EventBridge Metrics
    // ========================================
    
    // Events Published
    const eventsPublishedMetric = new cloudwatch.Metric({
      namespace: 'AWS/Events',
      metricName: 'Invocations',
      dimensionsMap: {
        EventBusName: props.eventBus.eventBusName
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(1)
    });

    // Failed Invocations
    const eventsFailedMetric = new cloudwatch.Metric({
      namespace: 'AWS/Events',
      metricName: 'FailedInvocations',
      dimensionsMap: {
        EventBusName: props.eventBus.eventBusName
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(1)
    });

    // ========================================
    // SQS Metrics
    // ========================================
    
    // Main Queue - Messages in Flight
    const mainQueueInFlightMetric = props.mainQueue.metricApproximateNumberOfMessagesVisible({
      statistic: 'Average',
      period: cdk.Duration.minutes(1)
    });

    // Main Queue - Messages Sent
    const mainQueueSentMetric = props.mainQueue.metricNumberOfMessagesSent({
      statistic: 'Sum',
      period: cdk.Duration.minutes(1)
    });

    // Main Queue - Messages Received
    const mainQueueReceivedMetric = props.mainQueue.metricNumberOfMessagesReceived({
      statistic: 'Sum',
      period: cdk.Duration.minutes(1)
    });

    // DLQ - Message Count
    const dlqMessageCountMetric = props.dlq.metricApproximateNumberOfMessagesVisible({
      statistic: 'Maximum',
      period: cdk.Duration.minutes(1)
    });

    // ========================================
    // Add Widgets to Dashboard
    // ========================================

    // Row 1: API Gateway Overview
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Gateway - Requests/min',
        left: [apiRequestsMetric],
        width: 12,
        height: 6
      }),
      new cloudwatch.GraphWidget({
        title: 'API Gateway - Errors',
        left: [api4xxErrorsMetric, api5xxErrorsMetric],
        width: 12,
        height: 6,
        leftYAxis: {
          min: 0
        }
      })
    );

    // Row 2: API Gateway Latency
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Gateway - Latency (ms)',
        left: [apiLatencyMetric, apiLatencyP95Metric, apiLatencyP99Metric],
        width: 24,
        height: 6,
        leftYAxis: {
          min: 0
        }
      })
    );

    // Row 3: Lambda Invocations and Errors
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda - Invocations',
        left: [lambdaInvocationsMetric],
        width: 8,
        height: 6
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda - Errors & Throttles',
        left: [lambdaErrorsMetric, lambdaThrottlesMetric],
        width: 8,
        height: 6,
        leftYAxis: {
          min: 0
        }
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda - Concurrent Executions',
        left: [lambdaConcurrentExecutionsMetric],
        width: 8,
        height: 6,
        leftYAxis: {
          min: 0
        }
      })
    );

    // Row 4: Lambda Duration
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda - Duration (ms)',
        left: [lambdaDurationAvgMetric, lambdaDurationP95Metric, lambdaDurationP99Metric],
        width: 24,
        height: 6,
        leftYAxis: {
          min: 0
        }
      })
    );

    // Row 5: EventBridge Metrics
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'EventBridge - Events Published',
        left: [eventsPublishedMetric],
        width: 12,
        height: 6
      }),
      new cloudwatch.GraphWidget({
        title: 'EventBridge - Failed Invocations',
        left: [eventsFailedMetric],
        width: 12,
        height: 6,
        leftYAxis: {
          min: 0
        }
      })
    );

    // Row 6: SQS Main Queue
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'SQS Main Queue - Messages In Flight',
        left: [mainQueueInFlightMetric],
        width: 8,
        height: 6,
        leftYAxis: {
          min: 0
        }
      }),
      new cloudwatch.GraphWidget({
        title: 'SQS Main Queue - Messages Sent',
        left: [mainQueueSentMetric],
        width: 8,
        height: 6
      }),
      new cloudwatch.GraphWidget({
        title: 'SQS Main Queue - Messages Received',
        left: [mainQueueReceivedMetric],
        width: 8,
        height: 6
      })
    );

    // Row 7: DLQ Alert
    this.dashboard.addWidgets(
      new cloudwatch.SingleValueWidget({
        title: 'DLQ - Message Count (ALERT IF > 0)',
        metrics: [dlqMessageCountMetric],
        width: 24,
        height: 6,
        setPeriodToTimeRange: false
      })
    );

    // ========================================
    // Add Agent Queues if provided
    // ========================================
    if (props.agentQueues && props.agentQueues.length > 0) {
      const agentQueueMetrics = props.agentQueues.map(queue => 
        queue.metricApproximateNumberOfMessagesVisible({
          statistic: 'Average',
          period: cdk.Duration.minutes(1),
          label: queue.queueName
        })
      );

      this.dashboard.addWidgets(
        new cloudwatch.GraphWidget({
          title: 'Agent Queues - Messages In Flight',
          left: agentQueueMetrics,
          width: 24,
          height: 6,
          leftYAxis: {
            min: 0
          }
        })
      );
    }
  }
}
