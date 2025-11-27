import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cdk from 'aws-cdk-lib';

export interface MetricWidgetConfig {
  title: string;
  metrics: cloudwatch.IMetric[];
  width?: number;
  height?: number;
  period?: cdk.Duration;
  statistic?: string;
  yAxis?: cloudwatch.YAxisProps;
}

export interface SingleValueWidgetConfig {
  title: string;
  metrics: cloudwatch.IMetric[];
  width?: number;
  height?: number;
  sparkline?: boolean;
}

export class DashboardWidgetFactory {
  /**
   * Creates a standardized graph widget for metrics
   */
  static createMetricWidget(config: MetricWidgetConfig): cloudwatch.GraphWidget {
    return new cloudwatch.GraphWidget({
      title: config.title,
      left: config.metrics,
      width: config.width || 12,
      height: config.height || 6
    });
  }

  /**
   * Creates a single value widget for KPIs
   */
  static createSingleValueWidget(config: SingleValueWidgetConfig): cloudwatch.SingleValueWidget {
    return new cloudwatch.SingleValueWidget({
      title: config.title,
      metrics: config.metrics,
      width: config.width || 6,
      height: config.height || 6,
      sparkline: config.sparkline ?? true
    });
  }

  /**
   * Creates a Lambda performance widget
   */
  static createLambdaPerformanceWidget(
    functionNames: string[],
    title: string = 'Lambda Performance'
  ): cloudwatch.GraphWidget {
    const durationMetrics = functionNames.map(name => 
      new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Duration',
        statistic: 'Average',
        dimensionsMap: { FunctionName: name },
        label: `${name} Duration`,
        period: cdk.Duration.minutes(5)
      })
    );

    const errorMetrics = functionNames.map(name => 
      new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Errors',
        statistic: 'Sum',
        dimensionsMap: { FunctionName: name },
        label: `${name} Errors`,
        period: cdk.Duration.minutes(5)
      })
    );

    return new cloudwatch.GraphWidget({
      title,
      left: durationMetrics,
      right: errorMetrics,
      width: 12,
      height: 6
    });
  }

  /**
   * Creates an API Gateway performance widget
   */
  static createAPIGatewayWidget(
    title: string = 'API Gateway Performance'
  ): cloudwatch.GraphWidget {
    return new cloudwatch.GraphWidget({
      title,
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Count',
          statistic: 'Sum',
          label: 'Requests',
          period: cdk.Duration.minutes(5)
        })
      ],
      right: [
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Latency',
          statistic: 'Average',
          label: 'Avg Latency',
          period: cdk.Duration.minutes(5)
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Latency',
          statistic: 'p95',
          label: 'P95 Latency',
          period: cdk.Duration.minutes(5)
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '4XXError',
          statistic: 'Sum',
          label: '4XX Errors',
          period: cdk.Duration.minutes(5)
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '5XXError',
          statistic: 'Sum',
          label: '5XX Errors',
          period: cdk.Duration.minutes(5)
        })
      ],
      width: 12,
      height: 6
    });
  }

  /**
   * Creates a database performance widget
   */
  static createDatabaseWidget(
    title: string = 'Database Performance'
  ): cloudwatch.GraphWidget {
    return new cloudwatch.GraphWidget({
      title,
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'CPUUtilization',
          statistic: 'Average',
          label: 'CPU %',
          period: cdk.Duration.minutes(5)
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'DatabaseConnections',
          statistic: 'Average',
          label: 'Connections',
          period: cdk.Duration.minutes(5)
        })
      ],
      right: [
        new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'ReadLatency',
          statistic: 'Average',
          label: 'Read Latency',
          period: cdk.Duration.minutes(5)
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'WriteLatency',
          statistic: 'Average',
          label: 'Write Latency',
          period: cdk.Duration.minutes(5)
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'ReadIOPS',
          statistic: 'Average',
          label: 'Read IOPS',
          period: cdk.Duration.minutes(5)
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'WriteIOPS',
          statistic: 'Average',
          label: 'Write IOPS',
          period: cdk.Duration.minutes(5)
        })
      ],
      width: 12,
      height: 6
    });
  }

  /**
   * Creates a business KPI widget
   */
  static createBusinessKPIWidget(
    title: string,
    namespace: string,
    metricName: string,
    statistic: string = 'Sum',
    period: cdk.Duration = cdk.Duration.hours(24)
  ): cloudwatch.SingleValueWidget {
    return new cloudwatch.SingleValueWidget({
      title,
      metrics: [
        new cloudwatch.Metric({
          namespace,
          metricName,
          statistic,
          period
        })
      ],
      width: 4,
      height: 6,
      sparkline: true
    });
  }

  /**
   * Creates a system health score widget
   */
  static createSystemHealthWidget(): cloudwatch.SingleValueWidget {
    return new cloudwatch.SingleValueWidget({
      title: 'System Health Score',
      metrics: [
        new cloudwatch.MathExpression({
          expression: 'IF(m1 < 5 AND m2 < 100 AND m3 < 80, 100, IF(m1 < 10 AND m2 < 200 AND m3 < 90, 75, 50))',
          usingMetrics: {
            m1: new cloudwatch.Metric({
              namespace: 'AWS/Lambda',
              metricName: 'Errors',
              statistic: 'Sum',
              period: cdk.Duration.minutes(5)
            }),
            m2: new cloudwatch.Metric({
              namespace: 'AWS/ApiGateway',
              metricName: 'Latency',
              statistic: 'Average',
              period: cdk.Duration.minutes(5)
            }),
            m3: new cloudwatch.Metric({
              namespace: 'AWS/RDS',
              metricName: 'CPUUtilization',
              statistic: 'Average',
              period: cdk.Duration.minutes(5)
            })
          },
          label: 'Health Score'
        })
      ],
      width: 6,
      height: 6,
      sparkline: true
    });
  }

  /**
   * Creates a cost tracking widget
   */
  static createCostWidget(
    title: string = 'Estimated Monthly Cost'
  ): cloudwatch.SingleValueWidget {
    return new cloudwatch.SingleValueWidget({
      title,
      metrics: [
        new cloudwatch.Metric({
          namespace: 'AWS/Billing',
          metricName: 'EstimatedCharges',
          statistic: 'Maximum',
          period: cdk.Duration.hours(6)
        })
      ],
      width: 6,
      height: 6,
      sparkline: true
    });
  }
}
