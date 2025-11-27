import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cdk from 'aws-cdk-lib';

/**
 * Centralized metric definitions for the AlquimistaAI system
 */
export class MetricDefinitions {
  /**
   * Lambda metrics
   */
  static lambda = {
    duration: (functionName: string): cloudwatch.Metric => 
      new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Duration',
        dimensionsMap: { FunctionName: functionName },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
        label: `${functionName} Duration`
      }),

    errors: (functionName: string): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Errors',
        dimensionsMap: { FunctionName: functionName },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
        label: `${functionName} Errors`
      }),

    throttles: (functionName: string): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Throttles',
        dimensionsMap: { FunctionName: functionName },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
        label: `${functionName} Throttles`
      }),

    concurrentExecutions: (functionName: string): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'ConcurrentExecutions',
        dimensionsMap: { FunctionName: functionName },
        statistic: 'Maximum',
        period: cdk.Duration.minutes(5),
        label: `${functionName} Concurrent`
      }),

    invocations: (functionName: string): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Invocations',
        dimensionsMap: { FunctionName: functionName },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
        label: `${functionName} Invocations`
      })
  };

  /**
   * API Gateway metrics
   */
  static apiGateway = {
    count: (): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: 'Count',
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
        label: 'Total Requests'
      }),

    latency: (statistic: string = 'Average'): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: 'Latency',
        statistic,
        period: cdk.Duration.minutes(5),
        label: `${statistic} Latency`
      }),

    error4xx: (): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '4XXError',
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
        label: '4XX Errors'
      }),

    error5xx: (): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '5XXError',
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
        label: '5XX Errors'
      }),

    integrationLatency: (statistic: string = 'Average'): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: 'IntegrationLatency',
        statistic,
        period: cdk.Duration.minutes(5),
        label: `${statistic} Integration Latency`
      })
  };

  /**
   * RDS/Aurora metrics
   */
  static rds = {
    cpuUtilization: (): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'CPUUtilization',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
        label: 'CPU Utilization %'
      }),

    databaseConnections: (): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'DatabaseConnections',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
        label: 'Active Connections'
      }),

    readLatency: (): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'ReadLatency',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
        label: 'Read Latency'
      }),

    writeLatency: (): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'WriteLatency',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
        label: 'Write Latency'
      }),

    readIOPS: (): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'ReadIOPS',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
        label: 'Read IOPS'
      }),

    writeIOPS: (): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'WriteIOPS',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
        label: 'Write IOPS'
      }),

    freeableMemory: (): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'FreeableMemory',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
        label: 'Freeable Memory'
      })
  };

  /**
   * Business metrics (custom namespace)
   */
  static business = {
    activeTenants: (): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AlquimistaAI/Business',
        metricName: 'ActiveTenants',
        statistic: 'Maximum',
        period: cdk.Duration.hours(1),
        label: 'Active Tenants'
      }),

    revenue: (): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AlquimistaAI/Business',
        metricName: 'Revenue',
        statistic: 'Sum',
        period: cdk.Duration.hours(24),
        label: 'Daily Revenue'
      }),

    activeSubscriptions: (): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AlquimistaAI/Business',
        metricName: 'ActiveSubscriptions',
        statistic: 'Maximum',
        period: cdk.Duration.hours(24),
        label: 'Active Subscriptions'
      }),

    churnRate: (): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AlquimistaAI/Business',
        metricName: 'ChurnRate',
        statistic: 'Average',
        period: cdk.Duration.hours(24),
        label: 'Churn Rate %'
      })
  };

  /**
   * Nigredo metrics (custom namespace)
   */
  static nigredo = {
    leadsReceived: (): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AlquimistaAI/Nigredo',
        metricName: 'LeadsReceived',
        statistic: 'Sum',
        period: cdk.Duration.minutes(15),
        label: 'Leads Received'
      }),

    leadsProcessed: (): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AlquimistaAI/Nigredo',
        metricName: 'LeadsProcessed',
        statistic: 'Sum',
        period: cdk.Duration.minutes(15),
        label: 'Leads Processed'
      }),

    leadsQualified: (): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AlquimistaAI/Nigredo',
        metricName: 'LeadsQualified',
        statistic: 'Sum',
        period: cdk.Duration.minutes(15),
        label: 'Leads Qualified'
      }),

    leadsCreated: (): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AlquimistaAI/Nigredo',
        metricName: 'LeadsCreated',
        statistic: 'Sum',
        period: cdk.Duration.hours(24),
        label: 'Leads Created Today'
      })
  };

  /**
   * Agents metrics (custom namespace)
   */
  static agents = {
    totalExecutions: (): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AlquimistaAI/Agents',
        metricName: 'TotalExecutions',
        statistic: 'Sum',
        period: cdk.Duration.hours(24),
        label: 'Total Executions'
      }),

    successRate: (): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AlquimistaAI/Agents',
        metricName: 'SuccessRate',
        statistic: 'Average',
        period: cdk.Duration.hours(24),
        label: 'Success Rate %'
      }),

    executionTime: (agentType: string): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AlquimistaAI/Agents',
        metricName: 'ExecutionTime',
        dimensionsMap: { AgentType: agentType },
        statistic: 'Average',
        period: cdk.Duration.minutes(15),
        label: `${agentType} Execution Time`
      }),

    memoryUtilization: (): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AlquimistaAI/Agents',
        metricName: 'MemoryUtilization',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
        label: 'Memory Usage %'
      }),

    cpuUtilization: (): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AlquimistaAI/Agents',
        metricName: 'CPUUtilization',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
        label: 'CPU Usage %'
      }),

    concurrentExecutions: (): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AlquimistaAI/Agents',
        metricName: 'ConcurrentExecutions',
        statistic: 'Maximum',
        period: cdk.Duration.minutes(5),
        label: 'Concurrent Executions'
      })
  };

  /**
   * Security metrics (custom namespace)
   */
  static security = {
    failedLogins: (): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AlquimistaAI/Security',
        metricName: 'FailedLogins',
        statistic: 'Sum',
        period: cdk.Duration.hours(24),
        label: 'Failed Login Attempts'
      }),

    blockedIPs: (): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AlquimistaAI/Security',
        metricName: 'BlockedIPs',
        statistic: 'Sum',
        period: cdk.Duration.hours(24),
        label: 'Blocked IPs'
      }),

    suspiciousActivity: (): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AlquimistaAI/Security',
        metricName: 'SuspiciousActivity',
        statistic: 'Sum',
        period: cdk.Duration.minutes(15),
        label: 'Suspicious Activity'
      }),

    unauthorizedAccess: (): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AlquimistaAI/Security',
        metricName: 'UnauthorizedAccess',
        statistic: 'Sum',
        period: cdk.Duration.minutes(15),
        label: 'Unauthorized Access Attempts'
      })
  };
}
