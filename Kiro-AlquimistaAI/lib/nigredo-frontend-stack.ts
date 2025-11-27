import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

export interface NigredoFrontendStackProps extends cdk.StackProps {
  envName: string;
  envConfig: any;
  kmsKey: kms.Key;
  alarmTopic?: sns.Topic;
}

/**
 * Nigredo Frontend Stack
 * 
 * Stack CDK para hospedar o frontend estático do Nigredo (landing pages)
 * usando S3 + CloudFront + WAF
 */
export class NigredoFrontendStack extends cdk.Stack {
  public readonly siteBucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;
  public readonly webAcl: wafv2.CfnWebACL;
  public readonly oai: cloudfront.OriginAccessIdentity;

  constructor(scope: Construct, id: string, props: NigredoFrontendStackProps) {
    super(scope, id, props);

    const { envName, envConfig, kmsKey, alarmTopic } = props;

    // ========================================
    // S3 Bucket para Hospedagem Estática
    // ========================================
    this.siteBucket = new s3.Bucket(this, 'NigredoSiteBucket', {
      bucketName: `nigredo-site-${envName}-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: envName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: envName !== 'prod',
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    // Tags
    cdk.Tags.of(this.siteBucket).add('Environment', envName);
    cdk.Tags.of(this.siteBucket).add('Service', 'Nigredo');
    cdk.Tags.of(this.siteBucket).add('Component', 'Frontend');

    // ========================================
    // Origin Access Identity (OAI)
    // ========================================
    this.oai = new cloudfront.OriginAccessIdentity(this, 'NigredoOAI', {
      comment: `OAI for Nigredo ${envName} frontend`,
    });

    // Permitir CloudFront acessar o bucket
    this.siteBucket.grantRead(this.oai);

    // ========================================
    // WAF Web ACL
    // ========================================
    this.webAcl = new wafv2.CfnWebACL(this, 'NigredoWebACL', {
      scope: 'CLOUDFRONT',
      defaultAction: { allow: {} },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: `NigredoWebACL-${envName}`,
      },
      rules: [
        // Rate Limiting: 2000 requests per 5 minutes
        {
          name: 'RateLimitRule',
          priority: 1,
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
            },
          },
          action: {
            block: {
              customResponse: {
                responseCode: 429,
              },
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: `RateLimit-${envName}`,
          },
        },
        // AWS Managed Rules - Core Rule Set
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 2,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: `CommonRuleSet-${envName}`,
          },
        },
        // AWS Managed Rules - Known Bad Inputs
        {
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
          priority: 3,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: `KnownBadInputs-${envName}`,
          },
        },
        // AWS Managed Rules - SQL Injection
        {
          name: 'AWSManagedRulesSQLiRuleSet',
          priority: 4,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesSQLiRuleSet',
            },
          },
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: `SQLiRuleSet-${envName}`,
          },
        },
      ],
    });

    // ========================================
    // CloudFront Distribution
    // ========================================
    this.distribution = new cloudfront.Distribution(this, 'NigredoDistribution', {
      comment: `Nigredo ${envName} Frontend Distribution`,
      defaultBehavior: {
        origin: new origins.S3Origin(this.siteBucket, {
          originAccessIdentity: this.oai,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        compress: true,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // US, Canada, Europe
      enableLogging: true,
      logBucket: new s3.Bucket(this, 'NigredoLogBucket', {
        bucketName: `nigredo-logs-${envName}-${this.account}`,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: envName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: envName !== 'prod',
        lifecycleRules: [
          {
            id: 'DeleteOldLogs',
            enabled: true,
            expiration: cdk.Duration.days(90),
          },
        ],
      }),
      logFilePrefix: 'cloudfront/',
      webAclId: this.webAcl.attrArn,
    });

    // Tags
    cdk.Tags.of(this.distribution).add('Environment', envName);
    cdk.Tags.of(this.distribution).add('Service', 'Nigredo');
    cdk.Tags.of(this.distribution).add('Component', 'CDN');

    // ========================================
    // CloudWatch Alarms
    // ========================================
    if (alarmTopic) {
      // Alarm: CloudFront Error Rate > 5%
      const errorRateAlarm = new cloudwatch.Alarm(this, 'NigredoErrorRateAlarm', {
        alarmName: `Nigredo-${envName}-ErrorRate`,
        alarmDescription: 'CloudFront error rate exceeds 5%',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/CloudFront',
          metricName: '5xxErrorRate',
          dimensionsMap: {
            DistributionId: this.distribution.distributionId,
          },
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 5,
        evaluationPeriods: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
      errorRateAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

      // Alarm: Cache Hit Ratio < 80%
      const cacheHitRatioAlarm = new cloudwatch.Alarm(this, 'NigredoCacheHitRatioAlarm', {
        alarmName: `Nigredo-${envName}-CacheHitRatio`,
        alarmDescription: 'CloudFront cache hit ratio below 80%',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/CloudFront',
          metricName: 'CacheHitRate',
          dimensionsMap: {
            DistributionId: this.distribution.distributionId,
          },
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 80,
        evaluationPeriods: 3,
        comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
      cacheHitRatioAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

      // Alarm: WAF Blocked Requests > 100/min
      const wafBlockedAlarm = new cloudwatch.Alarm(this, 'NigredoWAFBlockedAlarm', {
        alarmName: `Nigredo-${envName}-WAFBlocked`,
        alarmDescription: 'WAF blocking more than 100 requests per minute',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/WAFV2',
          metricName: 'BlockedRequests',
          dimensionsMap: {
            WebACL: `NigredoWebACL-${envName}`,
            Region: 'us-east-1', // CloudFront WAF is always in us-east-1
            Rule: 'ALL',
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(1),
        }),
        threshold: 100,
        evaluationPeriods: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
      wafBlockedAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));
    }

    // ========================================
    // Stack Outputs
    // ========================================
    new cdk.CfnOutput(this, 'NigredoDistributionUrl', {
      value: `https://${this.distribution.distributionDomainName}`,
      description: 'Nigredo CloudFront Distribution URL',
      exportName: `Nigredo-${envName}-DistributionUrl`,
    });

    new cdk.CfnOutput(this, 'NigredoSiteBucketName', {
      value: this.siteBucket.bucketName,
      description: 'Nigredo S3 Site Bucket Name',
      exportName: `Nigredo-${envName}-SiteBucketName`,
    });

    new cdk.CfnOutput(this, 'NigredoDistributionId', {
      value: this.distribution.distributionId,
      description: 'Nigredo CloudFront Distribution ID',
      exportName: `Nigredo-${envName}-DistributionId`,
    });

    new cdk.CfnOutput(this, 'NigredoWebACLArn', {
      value: this.webAcl.attrArn,
      description: 'Nigredo WAF Web ACL ARN',
      exportName: `Nigredo-${envName}-WebACLArn`,
    });
  }
}
