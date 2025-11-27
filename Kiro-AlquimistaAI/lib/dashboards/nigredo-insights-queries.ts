import * as cdk from 'aws-cdk-lib';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

/**
 * CloudWatch Insights Queries for Nigredo Prospecting Core
 * 
 * Pre-configured queries for analyzing:
 * - Top lead sources
 * - Conversion funnel metrics
 * - Error analysis by endpoint
 */

export interface NigredoInsightsQueriesProps {
  /**
   * Log groups for the Nigredo API Lambda functions
   */
  logGroups: logs.ILogGroup[];
  
  /**
   * Environment name (dev, staging, prod)
   */
  envName: string;
}

export class NigredoInsightsQueries extends Construct {
  public readonly topLeadSourcesQuery: logs.CfnQueryDefinition;
  public readonly conversionFunnelQuery: logs.CfnQueryDefinition;
  public readonly errorAnalysisQuery: logs.CfnQueryDefinition;
  public readonly webhookFailuresQuery: logs.CfnQueryDefinition;
  public readonly rateLimitAnalysisQuery: logs.CfnQueryDefinition;
  public readonly performanceAnalysisQuery: logs.CfnQueryDefinition;

  constructor(scope: Construct, id: string, props: NigredoInsightsQueriesProps) {
    super(scope, id);

    const logGroupNames = props.logGroups.map(lg => lg.logGroupName);

    // ========================================
    // Query 1: Top Lead Sources
    // ========================================
    // Analyzes which sources (utm_source, utm_campaign) generate the most leads
    this.topLeadSourcesQuery = new logs.CfnQueryDefinition(this, 'TopLeadSourcesQuery', {
      name: `${props.envName}/nigredo/top-lead-sources`,
      queryString: `fields @timestamp, leadData.source, leadData.utm_source, leadData.utm_campaign, leadData.utm_medium
| filter @message like /Lead created successfully/
| stats count() as leadCount by leadData.source, leadData.utm_source, leadData.utm_campaign
| sort leadCount desc
| limit 20`,
      logGroupNames: logGroupNames
    });

    // ========================================
    // Query 2: Conversion Funnel
    // ========================================
    // Tracks leads through the prospecting funnel stages
    this.conversionFunnelQuery = new logs.CfnQueryDefinition(this, 'ConversionFunnelQuery', {
      name: `${props.envName}/nigredo/conversion-funnel`,
      queryString: `fields @timestamp, @message, leadId, webhookStatus
| stats 
    count(@message like /Form submission received/) as formSubmissions,
    count(@message like /Lead created successfully/) as leadsCreated,
    count(@message like /Webhook sent successfully/) as webhooksSent,
    count(@message like /Webhook failed/) as webhooksFailed
| extend conversionRate = (leadsCreated / formSubmissions) * 100
| extend webhookSuccessRate = (webhooksSent / (webhooksSent + webhooksFailed)) * 100`,
      logGroupNames: logGroupNames
    });

    // ========================================
    // Query 3: Error Analysis by Endpoint
    // ========================================
    // Analyzes errors grouped by endpoint and error type
    this.errorAnalysisQuery = new logs.CfnQueryDefinition(this, 'ErrorAnalysisQuery', {
      name: `${props.envName}/nigredo/error-analysis`,
      queryString: `fields @timestamp, level, error.message, error.name, error.code, requestContext.http.path as endpoint, requestContext.http.method as method
| filter level = "ERROR"
| stats count() as errorCount by endpoint, method, error.name, error.code
| sort errorCount desc
| limit 50`,
      logGroupNames: logGroupNames
    });

    // ========================================
    // Query 4: Webhook Failures Analysis
    // ========================================
    // Detailed analysis of webhook delivery failures
    this.webhookFailuresQuery = new logs.CfnQueryDefinition(this, 'WebhookFailuresQuery', {
      name: `${props.envName}/nigredo/webhook-failures`,
      queryString: `fields @timestamp, leadId, webhookUrl, webhookStatus, webhookError, attemptNumber
| filter @message like /Webhook failed/ or @message like /Webhook retry/
| stats 
    count() as failureCount,
    latest(@timestamp) as lastFailure,
    latest(webhookError) as lastError,
    max(attemptNumber) as maxAttempts
  by leadId, webhookUrl
| sort failureCount desc
| limit 50`,
      logGroupNames: logGroupNames
    });

    // ========================================
    // Query 5: Rate Limit Analysis
    // ========================================
    // Analyzes rate limit hits by IP address
    this.rateLimitAnalysisQuery = new logs.CfnQueryDefinition(this, 'RateLimitAnalysisQuery', {
      name: `${props.envName}/nigredo/rate-limit-analysis`,
      queryString: `fields @timestamp, ipAddress, @message
| filter @message like /Rate limit exceeded/
| stats count() as rateLimitHits by ipAddress, bin(1h) as hour
| sort rateLimitHits desc
| limit 100`,
      logGroupNames: logGroupNames
    });

    // ========================================
    // Query 6: Performance Analysis
    // ========================================
    // Analyzes API performance by endpoint
    this.performanceAnalysisQuery = new logs.CfnQueryDefinition(this, 'PerformanceAnalysisQuery', {
      name: `${props.envName}/nigredo/performance-analysis`,
      queryString: `fields @timestamp, requestContext.http.path as endpoint, requestContext.http.method as method, duration
| filter duration > 0
| stats 
    count() as requestCount,
    avg(duration) as avgDuration,
    min(duration) as minDuration,
    max(duration) as maxDuration,
    pct(duration, 50) as p50,
    pct(duration, 95) as p95,
    pct(duration, 99) as p99
  by endpoint, method
| sort p99 desc`,
      logGroupNames: logGroupNames
    });

    // ========================================
    // CloudFormation Outputs
    // ========================================

    new cdk.CfnOutput(this, 'TopLeadSourcesQueryName', {
      value: this.topLeadSourcesQuery.name!,
      description: 'CloudWatch Insights Query: Top Lead Sources',
      exportName: `${props.envName}-Nigredo-TopLeadSourcesQuery`
    });

    new cdk.CfnOutput(this, 'ConversionFunnelQueryName', {
      value: this.conversionFunnelQuery.name!,
      description: 'CloudWatch Insights Query: Conversion Funnel',
      exportName: `${props.envName}-Nigredo-ConversionFunnelQuery`
    });

    new cdk.CfnOutput(this, 'ErrorAnalysisQueryName', {
      value: this.errorAnalysisQuery.name!,
      description: 'CloudWatch Insights Query: Error Analysis',
      exportName: `${props.envName}-Nigredo-ErrorAnalysisQuery`
    });

    new cdk.CfnOutput(this, 'WebhookFailuresQueryName', {
      value: this.webhookFailuresQuery.name!,
      description: 'CloudWatch Insights Query: Webhook Failures',
      exportName: `${props.envName}-Nigredo-WebhookFailuresQuery`
    });

    new cdk.CfnOutput(this, 'RateLimitAnalysisQueryName', {
      value: this.rateLimitAnalysisQuery.name!,
      description: 'CloudWatch Insights Query: Rate Limit Analysis',
      exportName: `${props.envName}-Nigredo-RateLimitAnalysisQuery`
    });

    new cdk.CfnOutput(this, 'PerformanceAnalysisQueryName', {
      value: this.performanceAnalysisQuery.name!,
      description: 'CloudWatch Insights Query: Performance Analysis',
      exportName: `${props.envName}-Nigredo-PerformanceAnalysisQuery`
    });
  }
}

/**
 * Additional useful queries for manual execution
 * 
 * These can be created manually in the CloudWatch console or added programmatically
 */
export const ADDITIONAL_NIGREDO_QUERIES = {
  /**
   * Query to identify leads with validation errors
   */
  validationErrors: `fields @timestamp, leadData.email, leadData.phone, error.message, validationErrors
| filter @message like /Validation error/
| stats count() as errorCount by error.message
| sort errorCount desc
| limit 20`,

  /**
   * Query to analyze form submission patterns by time of day
   */
  submissionPatterns: `fields @timestamp, leadData.source
| filter @message like /Lead created successfully/
| stats count() as submissions by bin(1h) as hour
| sort hour asc`,

  /**
   * Query to identify duplicate lead submissions
   */
  duplicateLeads: `fields @timestamp, leadData.email, leadData.phone
| filter @message like /Lead created successfully/
| stats count() as submissionCount by leadData.email
| filter submissionCount > 1
| sort submissionCount desc`,

  /**
   * Query to analyze webhook retry patterns
   */
  webhookRetries: `fields @timestamp, leadId, attemptNumber, webhookStatus
| filter @message like /Webhook retry/
| stats 
    count() as retryCount,
    max(attemptNumber) as maxAttempts,
    latest(webhookStatus) as finalStatus
  by leadId
| sort retryCount desc
| limit 50`,

  /**
   * Query to analyze API response times by hour
   */
  responseTimesByHour: `fields @timestamp, duration, requestContext.http.path as endpoint
| stats 
    avg(duration) as avgDuration,
    pct(duration, 95) as p95Duration,
    pct(duration, 99) as p99Duration
  by bin(1h) as hour, endpoint
| sort hour desc`,

  /**
   * Query to identify slow database queries
   */
  slowDatabaseQueries: `fields @timestamp, @message, duration, queryType
| filter @message like /Database query/ and duration > 1000
| stats 
    count() as slowQueryCount,
    avg(duration) as avgDuration,
    max(duration) as maxDuration
  by queryType
| sort slowQueryCount desc`,

  /**
   * Query to analyze CORS errors
   */
  corsErrors: `fields @timestamp, requestContext.http.sourceIp, requestContext.http.userAgent, error.message
| filter error.message like /CORS/
| stats count() as corsErrorCount by requestContext.http.sourceIp
| sort corsErrorCount desc
| limit 20`,

  /**
   * Query to track lead sources by campaign
   */
  campaignPerformance: `fields @timestamp, leadData.utm_campaign, leadData.utm_source, leadData.utm_medium
| filter @message like /Lead created successfully/
| stats 
    count() as leadCount,
    count_distinct(leadData.email) as uniqueLeads
  by leadData.utm_campaign, leadData.utm_source
| sort leadCount desc`,

  /**
   * Query to analyze XSS sanitization events
   */
  sanitizationEvents: `fields @timestamp, leadData.message, sanitizedFields
| filter @message like /Input sanitized/
| stats count() as sanitizationCount by sanitizedFields
| sort sanitizationCount desc`,

  /**
   * Query to monitor Lambda cold starts
   */
  coldStarts: `fields @timestamp, @initDuration, @duration, @memorySize
| filter @type = "REPORT" and @initDuration > 0
| stats 
    count() as coldStartCount,
    avg(@initDuration) as avgInitDuration,
    max(@initDuration) as maxInitDuration
  by bin(1h) as hour
| sort hour desc`
};
