import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface FrontendStackProps extends cdk.StackProps {
  envName: string;
  envConfig: any;
  /**
   * ARN do Web ACL do WAF (obrigatório para prod)
   */
  wafAclArn?: string;
  /**
   * URL da API Fibonacci
   */
  fibonacciApiUrl: string;
  /**
   * URL da API Nigredo
   */
  nigredoApiUrl: string;
}

/**
 * Stack de Frontend para AlquimistaAI
 * 
 * Implementa:
 * - S3 Buckets privados para armazenamento de arquivos estáticos
 * - CloudFront Distributions para distribuição de conteúdo
 * - Origin Access Control (OAC) para acesso seguro S3 → CloudFront
 * - Integração com WAF em produção
 * - Separação completa entre ambientes dev e prod
 */
export class FrontendStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;
  public readonly oac: cloudfront.S3OriginAccessControl;

  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);

    const env = props.envName;

    // ========================================
    // 1. S3 Bucket (Privado)
    // ========================================
    
    this.bucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `alquimistaai-frontend-${env}-${cdk.Aws.ACCOUNT_ID}`,
      // Bucket PRIVADO - acesso apenas via CloudFront OAC
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      // Encryption at rest
      encryption: s3.BucketEncryption.S3_MANAGED,
      // Enforce HTTPS
      enforceSSL: true,
      // Versionamento habilitado
      versioned: true,
      // Lifecycle rules (prod mantém mais versões)
      lifecycleRules: env === 'prod' ? [
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(90),
        },
      ] : [],
      // Removal policy
      removalPolicy: props.envConfig.deletionProtection 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: !props.envConfig.deletionProtection,
    });

    // ========================================
    // 2. Origin Access Control (OAC)
    // ========================================
    
    this.oac = new cloudfront.S3OriginAccessControl(this, 'OAC', {
      originAccessControlName: `alquimistaai-frontend-${env}-oac`,
      description: `OAC for AlquimistaAI Frontend ${env}`,
      signing: cloudfront.Signing.SIGV4_ALWAYS,
    });

    // ========================================
    // 3. CloudFront Distribution
    // ========================================
    
    const distributionProps: cloudfront.DistributionProps = {
      comment: `AlquimistaAI Frontend ${env.toUpperCase()}`,
      enabled: true,
      // Origem S3 com OAC
      defaultBehavior: {
        origin: new origins.S3Origin(this.bucket, {
          originAccessControlId: this.oac.originAccessControlId,
        }),
        // HTTPS obrigatório
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        // Métodos permitidos
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        // Compressão automática
        compress: true,
        // Cache policy otimizada
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      // Documento raiz
      defaultRootObject: 'index.html',
      // Páginas de erro
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
      // Price class (dev: NA+Europa, prod: Global)
      priceClass: env === 'prod' 
        ? cloudfront.PriceClass.PRICE_CLASS_ALL 
        : cloudfront.PriceClass.PRICE_CLASS_100,
      // HTTP/2 e HTTP/3
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
    };

    // Adicionar WAF apenas em produção
    if (env === 'prod' && props.wafAclArn) {
      (distributionProps as any).webAclId = props.wafAclArn;
    }

    this.distribution = new cloudfront.Distribution(this, 'Distribution', distributionProps);

    // ========================================
    // 4. Bucket Policy (permitir acesso via OAC)
    // ========================================
    
    this.bucket.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'AllowCloudFrontServicePrincipal',
      effect: iam.Effect.ALLOW,
      principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
      actions: ['s3:GetObject'],
      resources: [`${this.bucket.bucketArn}/*`],
      conditions: {
        StringEquals: {
          'AWS:SourceArn': `arn:aws:cloudfront::${cdk.Aws.ACCOUNT_ID}:distribution/${this.distribution.distributionId}`,
        },
      },
    }));

    // ========================================
    // Tags
    // ========================================
    
    cdk.Tags.of(this).add('Project', 'AlquimistaAI');
    cdk.Tags.of(this).add('Component', 'Frontend');
    cdk.Tags.of(this).add('Environment', env);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');

    // ========================================
    // Outputs
    // ========================================
    
    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: `https://${this.distribution.distributionDomainName}`,
      description: `URL pública do frontend ${env}`,
      exportName: `AlquimistaAI-Frontend-${env}-Url`,
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
      description: `Nome do bucket S3 ${env}`,
      exportName: `AlquimistaAI-Frontend-${env}-Bucket`,
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: this.distribution.distributionId,
      description: `ID da CloudFront Distribution ${env}`,
      exportName: `AlquimistaAI-Frontend-${env}-DistId`,
    });

    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: this.distribution.distributionDomainName,
      description: `Domain name da CloudFront Distribution ${env}`,
      exportName: `AlquimistaAI-Frontend-${env}-Domain`,
    });
  }
}
