import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as authorizers from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { FibonacciCoreDashboard } from './dashboards/fibonacci-core-dashboard';
import { CloudWatchInsightsQueries } from './cloudwatch-insights-queries';

export interface FibonacciStackProps extends cdk.StackProps {
  envName: string;
  envConfig: any;
  /**
   * Web ACL Dev do WAF (opcional - para associação com API Gateway)
   */
  webAclDev?: wafv2.CfnWebACL;
  /**
   * Web ACL Prod do WAF (opcional - para associação com API Gateway)
   */
  webAclProd?: wafv2.CfnWebACL;
}

export class FibonacciStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly dbCluster: rds.DatabaseCluster;
  public readonly dbSecret: rds.DatabaseSecret;
  public readonly eventBus: events.EventBus;
  public readonly mainQueue: sqs.Queue;
  public readonly dlq: sqs.Queue;
  public readonly userPool: cognito.UserPool;
  public readonly cognitoAuthorizer: authorizers.HttpUserPoolAuthorizer;
  public readonly siteBucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;
  public readonly webAcl: wafv2.CfnWebACL;
  public readonly apiHandler: nodejs.NodejsFunction;
  public readonly httpApi: apigatewayv2.HttpApi;
  public readonly kmsKey: kms.Key;
  public readonly trail: cloudtrail.Trail;
  public readonly trailBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: FibonacciStackProps) {
    super(scope, id, props);

    // ========================================
    // KMS Key para Criptografia
    // ========================================
    this.kmsKey = new kms.Key(this, 'FibonacciKmsKey', {
      alias: `fibonacci-encryption-key-${props.envName}`,
      description: `KMS key for Fibonacci encryption - ${props.envName}`,
      enableKeyRotation: true, // Rotação automática anual
      removalPolicy: props.envConfig.deletionProtection 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
      pendingWindow: cdk.Duration.days(7) // Período de espera antes de deletar
    });

    // Permitir que serviços AWS usem a chave
    this.kmsKey.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'Allow AWS Services',
      principals: [new iam.ServicePrincipal('s3.amazonaws.com')],
      actions: [
        'kms:Decrypt',
        'kms:GenerateDataKey'
      ],
      resources: ['*']
    }));

    this.kmsKey.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'Allow SQS Service',
      principals: [new iam.ServicePrincipal('sqs.amazonaws.com')],
      actions: [
        'kms:Decrypt',
        'kms:GenerateDataKey'
      ],
      resources: ['*']
    }));

    this.kmsKey.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'Allow RDS Service',
      principals: [new iam.ServicePrincipal('rds.amazonaws.com')],
      actions: [
        'kms:Decrypt',
        'kms:GenerateDataKey',
        'kms:CreateGrant'
      ],
      resources: ['*']
    }));

    // ========================================
    // CloudTrail - Auditoria de Ações Administrativas
    // ========================================
    // TEMPORARIAMENTE DESABILITADO - Problema de permissões
    /*
    // Bucket S3 para armazenar logs do CloudTrail
    this.trailBucket = new s3.Bucket(this, 'CloudTrailBucket', {
      bucketName: `fibonacci-cloudtrail-${props.envName}-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          enabled: true,
          expiration: cdk.Duration.days(90), // Retenção de 90 dias
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30) // Mover para IA após 30 dias
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(60) // Mover para Glacier após 60 dias
            }
          ]
        }
      ],
      removalPolicy: props.envConfig.deletionProtection 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: !props.envConfig.deletionProtection
    });

    // Adicionar permissões explícitas para o CloudTrail acessar o bucket
    this.trailBucket.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'AWSCloudTrailAclCheck',
      effect: iam.Effect.ALLOW,
      principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
      actions: ['s3:GetBucketAcl'],
      resources: [this.trailBucket.bucketArn]
    }));

    this.trailBucket.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'AWSCloudTrailWrite',
      effect: iam.Effect.ALLOW,
      principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
      actions: ['s3:PutObject'],
      resources: [`${this.trailBucket.bucketArn}/*`],
      conditions: {
        StringEquals: {
          's3:x-amz-acl': 'bucket-owner-full-control'
        }
      }
    }));

    // CloudTrail para auditoria completa
    this.trail = new cloudtrail.Trail(this, 'FibonacciTrail', {
      trailName: `fibonacci-trail-${props.envName}`,
      bucket: this.trailBucket,
      encryptionKey: this.kmsKey,
      enableFileValidation: true, // Validação de integridade dos logs
      includeGlobalServiceEvents: true, // Incluir eventos de serviços globais (IAM, CloudFront, etc)
      isMultiRegionTrail: true, // Capturar eventos de todas as regiões
      managementEvents: cloudtrail.ReadWriteType.ALL, // Todos os eventos de gerenciamento
      sendToCloudWatchLogs: true, // Enviar logs para CloudWatch Logs
      cloudWatchLogsRetention: props.envName === 'prod' 
        ? logs.RetentionDays.ONE_MONTH 
        : logs.RetentionDays.ONE_WEEK,
      cloudWatchLogGroup: new logs.LogGroup(this, 'CloudTrailLogGroup', {
        logGroupName: `/aws/cloudtrail/fibonacci-${props.envName}`,
        retention: props.envName === 'prod' 
          ? logs.RetentionDays.ONE_MONTH 
          : logs.RetentionDays.ONE_WEEK,
        removalPolicy: props.envConfig.deletionProtection 
          ? cdk.RemovalPolicy.RETAIN 
          : cdk.RemovalPolicy.DESTROY
      })
    });

    // Nota: S3 event selector será adicionado após a criação do site bucket
    // Nota: Lambda event selector será adicionado após a criação das funções Lambda

    // Alarme para detectar atividades suspeitas no CloudTrail
    const unauthorizedApiCallsMetric = new cloudwatch.Metric({
      namespace: 'CloudTrailMetrics',
      metricName: 'UnauthorizedAPICalls',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5)
    });

    const unauthorizedApiCallsAlarm = new cloudwatch.Alarm(this, 'UnauthorizedApiCallsAlarm', {
      alarmName: `fibonacci-unauthorized-api-calls-${props.envName}`,
      alarmDescription: 'Detectadas chamadas de API não autorizadas - Possível tentativa de acesso não autorizado',
      metric: unauthorizedApiCallsMetric,
      threshold: 5,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    // Metric Filter para detectar chamadas não autorizadas
    const unauthorizedApiCallsFilter = new logs.MetricFilter(this, 'UnauthorizedApiCallsFilter', {
      logGroup: this.trail.logGroup!,
      metricNamespace: 'CloudTrailMetrics',
      metricName: 'UnauthorizedAPICalls',
      filterPattern: logs.FilterPattern.literal(
        '{ ($.errorCode = "*UnauthorizedOperation") || ($.errorCode = "AccessDenied*") }'
      ),
      metricValue: '1'
    });

    // Alarme para detectar mudanças em Security Groups
    const securityGroupChangesMetric = new cloudwatch.Metric({
      namespace: 'CloudTrailMetrics',
      metricName: 'SecurityGroupChanges',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5)
    });

    const securityGroupChangesAlarm = new cloudwatch.Alarm(this, 'SecurityGroupChangesAlarm', {
      alarmName: `fibonacci-security-group-changes-${props.envName}`,
      alarmDescription: 'Detectadas mudanças em Security Groups - Revisar alterações',
      metric: securityGroupChangesMetric,
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    // Metric Filter para detectar mudanças em Security Groups
    const securityGroupChangesFilter = new logs.MetricFilter(this, 'SecurityGroupChangesFilter', {
      logGroup: this.trail.logGroup!,
      metricNamespace: 'CloudTrailMetrics',
      metricName: 'SecurityGroupChanges',
      filterPattern: logs.FilterPattern.literal(
        '{ ($.eventName = AuthorizeSecurityGroupIngress) || ($.eventName = AuthorizeSecurityGroupEgress) || ($.eventName = RevokeSecurityGroupIngress) || ($.eventName = RevokeSecurityGroupEgress) || ($.eventName = CreateSecurityGroup) || ($.eventName = DeleteSecurityGroup) }'
      ),
      metricValue: '1'
    });

    // Alarme para detectar mudanças em IAM
    const iamChangesMetric = new cloudwatch.Metric({
      namespace: 'CloudTrailMetrics',
      metricName: 'IAMPolicyChanges',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5)
    });

    const iamChangesAlarm = new cloudwatch.Alarm(this, 'IAMChangesAlarm', {
      alarmName: `fibonacci-iam-changes-${props.envName}`,
      alarmDescription: 'Detectadas mudanças em políticas IAM - Revisar alterações de permissões',
      metric: iamChangesMetric,
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    // Metric Filter para detectar mudanças em IAM
    const iamChangesFilter = new logs.MetricFilter(this, 'IAMChangesFilter', {
      logGroup: this.trail.logGroup!,
      metricNamespace: 'CloudTrailMetrics',
      metricName: 'IAMPolicyChanges',
      filterPattern: logs.FilterPattern.literal(
        '{ ($.eventName = PutUserPolicy) || ($.eventName = PutRolePolicy) || ($.eventName = PutGroupPolicy) || ($.eventName = CreatePolicy) || ($.eventName = DeletePolicy) || ($.eventName = CreatePolicyVersion) || ($.eventName = DeletePolicyVersion) || ($.eventName = AttachUserPolicy) || ($.eventName = DetachUserPolicy) || ($.eventName = AttachRolePolicy) || ($.eventName = DetachRolePolicy) || ($.eventName = AttachGroupPolicy) || ($.eventName = DetachGroupPolicy) }'
      ),
      metricValue: '1'
    });
    */

    // ========================================
    // VPC com 2 AZs (public e private isolated subnets)
    // ========================================
    this.vpc = new ec2.Vpc(this, 'FibonacciVpc', {
      maxAzs: 2,
      natGateways: 0, // Reduzir custos em dev/staging
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC
        },
        {
          cidrMask: 24,
          name: 'PrivateIsolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        }
      ]
    });

    // ========================================
    // VPC Endpoints - Evitar tráfego pela internet pública
    // ========================================
    
    // VPC Endpoint para S3 (Gateway Endpoint - sem custo adicional)
    const s3Endpoint = this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [
        { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
        { subnetType: ec2.SubnetType.PUBLIC }
      ]
    });

    // VPC Endpoint para Secrets Manager (Interface Endpoint)
    const secretsManagerEndpoint = this.vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED
      },
      privateDnsEnabled: true, // Habilitar DNS privado para resolução automática
      open: false // Não abrir para todo o VPC por padrão
    });

    // VPC Endpoint para EventBridge (Interface Endpoint)
    const eventBridgeEndpoint = this.vpc.addInterfaceEndpoint('EventBridgeEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.EVENTBRIDGE,
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED
      },
      privateDnsEnabled: true,
      open: false
    });

    // ========================================
    // Security Groups
    // ========================================
    
    // Security Group para Lambda
    const lambdaSg = new ec2.SecurityGroup(this, 'LambdaSg', {
      vpc: this.vpc,
      description: 'Security group for Lambda functions',
      allowAllOutbound: true
    });

    // Security Group para Aurora
    const dbSg = new ec2.SecurityGroup(this, 'DbSg', {
      vpc: this.vpc,
      description: 'Security group for Aurora cluster',
      allowAllOutbound: false
    });

    // Permitir acesso do Lambda ao Aurora
    dbSg.addIngressRule(
      lambdaSg,
      ec2.Port.tcp(5432),
      'Allow Lambda access to Aurora'
    );

    // Permitir acesso do Lambda aos VPC Endpoints
    // Secrets Manager Endpoint
    secretsManagerEndpoint.connections.allowFrom(
      lambdaSg,
      ec2.Port.tcp(443),
      'Allow Lambda access to Secrets Manager endpoint'
    );

    // EventBridge Endpoint
    eventBridgeEndpoint.connections.allowFrom(
      lambdaSg,
      ec2.Port.tcp(443),
      'Allow Lambda access to EventBridge endpoint'
    );

    // ========================================
    // Secrets Manager - Credenciais do Banco
    // ========================================
    this.dbSecret = new rds.DatabaseSecret(this, 'DbSecret', {
      username: 'dbadmin',
      secretName: `fibonacci/db/credentials-${props.envName}`
    });

    // ========================================
    // Aurora Serverless v2
    // ========================================
    this.dbCluster = new rds.DatabaseCluster(this, 'AuroraCluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_8
      }),
      credentials: rds.Credentials.fromSecret(this.dbSecret),
      writer: rds.ClusterInstance.serverlessV2('writer', {
        publiclyAccessible: false
      }),
      serverlessV2MinCapacity: props.envConfig.aurora.minCapacity,
      serverlessV2MaxCapacity: props.envConfig.aurora.maxCapacity,
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED
      },
      securityGroups: [dbSg],
      defaultDatabaseName: 'fibonacci',
      backup: {
        retention: cdk.Duration.days(7),
        preferredWindow: '03:00-04:00'
      },
      storageEncrypted: true,
      storageEncryptionKey: this.kmsKey, // Usar KMS key customizada
      deletionProtection: props.envConfig.deletionProtection,
      removalPolicy: props.envConfig.deletionProtection 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY
    });

    // Configurar rotação automática de secrets a cada 30 dias
    // A rotação usa uma Lambda function gerenciada pela AWS que é criada automaticamente
    // A função Lambda se conecta ao cluster Aurora através da VPC para atualizar as credenciais
    this.dbSecret.addRotationSchedule('RotationSchedule', {
      automaticallyAfter: cdk.Duration.days(30),
      rotateImmediatelyOnUpdate: false,
      hostedRotation: secretsmanager.HostedRotation.postgreSqlSingleUser({
        functionName: `fibonacci-secret-rotation-${props.envName}`,
        vpc: this.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        },
        securityGroups: [lambdaSg]
      })
    });

    // ========================================
    // EventBridge Bus Customizado
    // ========================================
    this.eventBus = new events.EventBus(this, 'FibonacciBus', {
      eventBusName: `fibonacci-bus-${props.envName}`
    });

    // ========================================
    // SQS - Dead Letter Queue
    // ========================================
    this.dlq = new sqs.Queue(this, 'DeadLetterQueue', {
      queueName: `fibonacci-dlq-${props.envName}`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: this.kmsKey
    });

    // ========================================
    // SQS - Main Queue
    // ========================================
    this.mainQueue = new sqs.Queue(this, 'MainQueue', {
      queueName: `fibonacci-main-${props.envName}`,
      visibilityTimeout: cdk.Duration.seconds(30),
      receiveMessageWaitTime: cdk.Duration.seconds(10), // Long polling
      deadLetterQueue: {
        queue: this.dlq,
        maxReceiveCount: 3
      },
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: this.kmsKey
    });

    // ========================================
    // Filas SQS específicas para cada agente Nigredo
    // ========================================
    const agentQueues = [
      'recebimento',
      'estrategia',
      'disparo',
      'atendimento',
      'sentimento',
      'agendamento',
      'relatorios'
    ];

    agentQueues.forEach(agentName => {
      new sqs.Queue(this, `${agentName}Queue`, {
        queueName: `fibonacci-${agentName}-${props.envName}`,
        visibilityTimeout: cdk.Duration.seconds(30),
        receiveMessageWaitTime: cdk.Duration.seconds(10),
        deadLetterQueue: {
          queue: this.dlq,
          maxReceiveCount: 3
        },
        encryption: sqs.QueueEncryption.KMS,
        encryptionMasterKey: this.kmsKey
      });
    });

    // ========================================
    // EventBridge Rules para roteamento
    // ========================================
    
    // Regra para eventos do Nigredo
    new events.Rule(this, 'NigredoRoutingRule', {
      eventBus: this.eventBus,
      ruleName: `nigredo-routing-${props.envName}`,
      description: 'Route Nigredo events to appropriate queues',
      eventPattern: {
        source: ['nigredo']
      },
      targets: [new targets.SqsQueue(this.mainQueue)]
    });

    // Regra para eventos do Alquimista
    new events.Rule(this, 'AlquimistaRoutingRule', {
      eventBus: this.eventBus,
      ruleName: `alquimista-routing-${props.envName}`,
      description: 'Route Alquimista events to appropriate queues',
      eventPattern: {
        source: ['alquimista']
      },
      targets: [new targets.SqsQueue(this.mainQueue)]
    });

    // Regra de demonstração
    new events.Rule(this, 'DemoRule', {
      eventBus: this.eventBus,
      ruleName: `demo-rule-${props.envName}`,
      description: 'Demo rule for testing',
      eventPattern: {
        source: ['fibonacci.demo']
      },
      targets: [new targets.SqsQueue(this.mainQueue)]
    });

    // ========================================
    // S3 Bucket para Front-End
    // ========================================
    this.siteBucket = new s3.Bucket(this, 'SiteBucket', {
      bucketName: `fibonacci-site-${props.envName}-${cdk.Aws.ACCOUNT_ID}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.kmsKey,
      bucketKeyEnabled: true, // Reduz custos de KMS usando bucket keys
      removalPolicy: props.envConfig.deletionProtection 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: !props.envConfig.deletionProtection
    });

    // ========================================
    // S3 Bucket para Versionamento de Stacks
    // ========================================
    const stackVersionsBucket = new s3.Bucket(this, 'StackVersionsBucket', {
      bucketName: `fibonacci-stack-versions-${props.envName}-${cdk.Aws.ACCOUNT_ID}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.kmsKey,
      bucketKeyEnabled: true,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(90), // Manter versões por 90 dias
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1)
        }
      ],
      removalPolicy: props.envConfig.deletionProtection 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: !props.envConfig.deletionProtection
    });

    // Adicionar logging de eventos de dados para S3 no CloudTrail
    /*
    this.trail.addS3EventSelector([{
      bucket: this.siteBucket,
      objectPrefix: ''
    }], {
      readWriteType: cloudtrail.ReadWriteType.ALL,
      includeManagementEvents: false // Já incluído no trail principal
    });
    */

    // Adicionar logging para bucket de versões
    /*
    this.trail.addS3EventSelector([{
      bucket: stackVersionsBucket,
      objectPrefix: ''
    }], {
      readWriteType: cloudtrail.ReadWriteType.ALL,
      includeManagementEvents: false
    });

    // Adicionar logging para o bucket do CloudTrail também
    this.trail.addS3EventSelector([{
      bucket: this.trailBucket,
      objectPrefix: ''
    }], {
      readWriteType: cloudtrail.ReadWriteType.ALL,
      includeManagementEvents: false
    });
    */

    // ========================================
    // WAF Web ACL - Proteção do CloudFront
    // ========================================
    
    // IMPORTANTE: WAF para CloudFront DEVE ser criado na região us-east-1
    // Mesmo que a stack esteja em outra região
    this.webAcl = new wafv2.CfnWebACL(this, 'CloudFrontWebACL', {
      name: `fibonacci-cloudfront-waf-${props.envName}`,
      scope: 'CLOUDFRONT', // CLOUDFRONT ou REGIONAL
      defaultAction: {
        allow: {} // Permitir por padrão, bloquear apenas o que as regras identificarem
      },
      description: `WAF Web ACL for Fibonacci CloudFront Distribution - ${props.envName}`,
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: `FibonacciCloudFrontWAF-${props.envName}`
      },
      rules: [
        // Regra 1: Rate Limiting - 2000 requisições por 5 minutos por IP
        {
          name: 'RateLimitRule',
          priority: 1,
          statement: {
            rateBasedStatement: {
              limit: 2000, // 2000 requisições
              aggregateKeyType: 'IP', // Agregar por endereço IP
              scopeDownStatement: {
                notStatement: {
                  statement: {
                    byteMatchStatement: {
                      searchString: '/health',
                      fieldToMatch: {
                        uriPath: {}
                      },
                      textTransformations: [{
                        priority: 0,
                        type: 'LOWERCASE'
                      }],
                      positionalConstraint: 'STARTS_WITH'
                    }
                  }
                }
              }
            }
          },
          action: {
            block: {
              customResponse: {
                responseCode: 429,
                customResponseBodyKey: 'rate-limit-response'
              }
            }
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: `RateLimitRule-${props.envName}`
          }
        },
        // Regra 2: Proteção contra SQL Injection usando AWS Managed Rules
        {
          name: 'SQLInjectionProtection',
          priority: 2,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesSQLiRuleSet',
              excludedRules: [] // Não excluir nenhuma regra
            }
          },
          overrideAction: {
            none: {} // Usar a ação padrão do managed rule group
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: `SQLInjectionProtection-${props.envName}`
          }
        },
        // Regra 3: Proteção contra XSS usando AWS Managed Rules
        {
          name: 'XSSProtection',
          priority: 3,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
              excludedRules: [] // Não excluir nenhuma regra
            }
          },
          overrideAction: {
            none: {} // Usar a ação padrão do managed rule group
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: `XSSProtection-${props.envName}`
          }
        },
        // Regra 4: Core Rule Set - Proteção adicional contra ataques comuns
        {
          name: 'CoreRuleSet',
          priority: 4,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
              excludedRules: [
                // Excluir regras que podem causar falsos positivos
                { name: 'SizeRestrictions_BODY' }, // Permitir bodies maiores
                { name: 'GenericRFI_BODY' } // Reduzir falsos positivos em uploads
              ]
            }
          },
          overrideAction: {
            none: {}
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: `CoreRuleSet-${props.envName}`
          }
        },
        // Regra 5: Proteção contra bots maliciosos
        {
          name: 'BotProtection',
          priority: 5,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesBotControlRuleSet',
              managedRuleGroupConfigs: [{
                awsManagedRulesBotControlRuleSet: {
                  inspectionLevel: 'COMMON' // COMMON ou TARGETED
                }
              }]
            }
          },
          overrideAction: {
            none: {}
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: `BotProtection-${props.envName}`
          }
        }
      ],
      customResponseBodies: {
        'rate-limit-response': {
          contentType: 'APPLICATION_JSON',
          content: JSON.stringify({
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED'
          })
        }
      }
    });

    // Criar alarmes para métricas do WAF
    const wafBlockedRequestsMetric = new cloudwatch.Metric({
      namespace: 'AWS/WAFV2',
      metricName: 'BlockedRequests',
      dimensionsMap: {
        WebACL: `fibonacci-cloudfront-waf-${props.envName}`,
        Region: 'us-east-1',
        Rule: 'ALL'
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5)
    });

    const wafBlockedRequestsAlarm = new cloudwatch.Alarm(this, 'WAFBlockedRequestsAlarm', {
      alarmName: `fibonacci-waf-blocked-requests-${props.envName}`,
      alarmDescription: 'Alto número de requisições bloqueadas pelo WAF - Possível ataque em andamento',
      metric: wafBlockedRequestsMetric,
      threshold: 100, // Mais de 100 requisições bloqueadas em 5 minutos
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    const wafRateLimitMetric = new cloudwatch.Metric({
      namespace: 'AWS/WAFV2',
      metricName: 'BlockedRequests',
      dimensionsMap: {
        WebACL: `fibonacci-cloudfront-waf-${props.envName}`,
        Region: 'us-east-1',
        Rule: 'RateLimitRule'
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5)
    });

    const wafRateLimitAlarm = new cloudwatch.Alarm(this, 'WAFRateLimitAlarm', {
      alarmName: `fibonacci-waf-rate-limit-${props.envName}`,
      alarmDescription: 'Rate limiting ativado - IPs excedendo limite de requisições',
      metric: wafRateLimitMetric,
      threshold: 10, // Mais de 10 IPs bloqueados por rate limit
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    // ========================================
    // CloudFront Distribution
    // ========================================
    
    // Origin Access Control (OAC) para CloudFront
    const oac = new cloudfront.CfnOriginAccessControl(this, 'OAC', {
      originAccessControlConfig: {
        name: `fibonacci-oac-${props.envName}`,
        originAccessControlOriginType: 's3',
        signingBehavior: 'always',
        signingProtocol: 'sigv4'
      }
    });

    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      webAclId: this.webAcl.attrArn, // Associar WAF Web ACL ao CloudFront
      defaultBehavior: {
        origin: new origins.S3Origin(this.siteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        compress: true,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5)
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5)
        }
      ],
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021, // Enforce TLS 1.2+
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // US, Canada, Europe
      enabled: true,
      comment: `Fibonacci Front-End Distribution - ${props.envName}`
    });

    // Adicionar bucket policy permitindo acesso apenas do CloudFront
    this.siteBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [this.siteBucket.arnForObjects('*')],
        principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
        conditions: {
          StringEquals: {
            'AWS:SourceArn': `arn:aws:cloudfront::${cdk.Aws.ACCOUNT_ID}:distribution/${this.distribution.distributionId}`
          }
        }
      })
    );

    // ========================================
    // Cognito User Pool
    // ========================================
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `fibonacci-users-${props.envName}`,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: false
        }
      },
      customAttributes: {
        tenant_id: new cognito.StringAttribute({ mutable: false }),
        company_name: new cognito.StringAttribute({ mutable: true }),
        user_role: new cognito.StringAttribute({ mutable: true })
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false
      },
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: true,
        otp: true
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: props.envConfig.deletionProtection 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY
    });

    // App Client para front-end SPA
    this.userPool.addClient('WebClient', {
      userPoolClientName: `fibonacci-web-client-${props.envName}`,
      authFlows: {
        userPassword: true,
        userSrp: true
      },
      generateSecret: false,
      refreshTokenValidity: cdk.Duration.days(30),
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1)
    });

    // ========================================
    // Cognito Authorizer Compartilhado
    // ========================================
    // IMPORTANTE: Criar o authorizer UMA ÚNICA VEZ aqui no FibonacciStack
    // e reutilizar em todos os outros stacks (AlquimistaStack, OperationalDashboardStack)
    // para evitar erro "There is already a Construct with name 'UserPoolAuthorizerClient'"
    this.cognitoAuthorizer = new authorizers.HttpUserPoolAuthorizer(
      'SharedCognitoAuthorizer',
      this.userPool,
      {
        authorizerName: `fibonacci-shared-authorizer-${props.envName}`,
        identitySource: ['$request.header.Authorization']
      }
    );

    // ========================================
    // Lambda Handler para API Gateway
    // ========================================
    this.apiHandler = new nodejs.NodejsFunction(this, 'ApiHandler', {
      functionName: `fibonacci-api-handler-${props.envName}`,
      entry: 'lambda/handler.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      environment: {
        POWERTOOLS_SERVICE_NAME: 'fibonacci-api',
        EVENT_BUS_NAME: this.eventBus.eventBusName,
        DB_SECRET_ARN: this.dbSecret.secretArn,
        USER_POOL_ID: this.userPool.userPoolId,
        NODE_OPTIONS: '--enable-source-maps'
      },
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'es2021',
        externalModules: ['@aws-sdk/*']
      },
      tracing: lambda.Tracing.ACTIVE
    });

    // Criar alias LIVE para blue-green deployment
    const apiHandlerAlias = new lambda.Alias(this, 'ApiHandlerAlias', {
      aliasName: 'LIVE',
      version: this.apiHandler.currentVersion,
      description: 'Alias para blue-green deployment'
    });

    // Conceder permissões para publicar eventos no EventBridge
    this.eventBus.grantPutEventsTo(this.apiHandler);
    this.eventBus.grantPutEventsTo(apiHandlerAlias);

    // Conceder permissões para acessar o Secret do banco
    this.dbSecret.grantRead(this.apiHandler);
    this.dbSecret.grantRead(apiHandlerAlias);

    // Conceder permissões para enviar mensagens para SQS
    this.mainQueue.grantSendMessages(this.apiHandler);
    this.mainQueue.grantSendMessages(apiHandlerAlias);

    // Adicionar logging de eventos de dados para Lambda no CloudTrail
    /*
    this.trail.addLambdaEventSelector([this.apiHandler], {
      readWriteType: cloudtrail.ReadWriteType.ALL,
      includeManagementEvents: false // Já incluído no trail principal
    });
    */

    // ========================================
    // Lambda Handler para Webhook Nigredo
    // ========================================
    const nigredoWebhookHandler = new nodejs.NodejsFunction(this, 'NigredoWebhookHandler', {
      functionName: `fibonacci-nigredo-webhook-${props.envName}`,
      entry: 'lambda/fibonacci/handle-nigredo-event.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      environment: {
        POWERTOOLS_SERVICE_NAME: 'fibonacci-nigredo-webhook',
        EVENT_BUS_NAME: this.eventBus.eventBusName,
        DB_SECRET_ARN: this.dbSecret.secretArn,
        NIGREDO_WEBHOOK_SECRET: props.envConfig.nigredoWebhookSecret || 'change-me-in-production',
        NODE_OPTIONS: '--enable-source-maps'
      },
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED
      },
      securityGroups: [lambdaSg],
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'es2021',
        externalModules: ['@aws-sdk/*']
      },
      tracing: lambda.Tracing.ACTIVE
    });

    // Conceder permissões para publicar eventos no EventBridge
    this.eventBus.grantPutEventsTo(nigredoWebhookHandler);

    // Conceder permissões para acessar o Secret do banco
    this.dbSecret.grantRead(nigredoWebhookHandler);

    // Adicionar logging de eventos de dados para Lambda no CloudTrail
    /*
    this.trail.addLambdaEventSelector([nigredoWebhookHandler], {
      readWriteType: cloudtrail.ReadWriteType.ALL,
      includeManagementEvents: false
    });
    */

    // ========================================
    // HTTP API Gateway
    // ========================================
    this.httpApi = new apigatewayv2.HttpApi(this, 'HttpApi', {
      apiName: `fibonacci-api-${props.envName}`,
      description: 'Fibonacci API Gateway - Orquestrador Central',
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [
          apigatewayv2.CorsHttpMethod.GET,
          apigatewayv2.CorsHttpMethod.POST,
          apigatewayv2.CorsHttpMethod.OPTIONS
        ],
        allowHeaders: ['Content-Type', 'Authorization'],
        maxAge: cdk.Duration.days(1)
      }
    });

    // Integração Lambda usando alias para blue-green deployment
    const lambdaIntegration = new integrations.HttpLambdaIntegration(
      'LambdaIntegration',
      apiHandlerAlias,
      {
        payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_1_0
      }
    );

    // Rota GET /health
    this.httpApi.addRoutes({
      path: '/health',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: lambdaIntegration
    });

    // Rota POST /events
    this.httpApi.addRoutes({
      path: '/events',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: lambdaIntegration
    });

    // Integração Lambda para webhook Nigredo
    const nigredoWebhookIntegration = new integrations.HttpLambdaIntegration(
      'NigredoWebhookIntegration',
      nigredoWebhookHandler,
      {
        payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0
      }
    );

    // Rota POST /public/nigredo-event (webhook público para receber eventos do Nigredo)
    this.httpApi.addRoutes({
      path: '/public/nigredo-event',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: nigredoWebhookIntegration
    });

    // ========================================
    // WAF Association (se fornecido)
    // ========================================
    // Construir ARN da API Gateway HTTP API
    const apiArn = `arn:aws:apigateway:${this.region}::/apis/${this.httpApi.apiId}/stages/$default`;
    
    if (props.webAclDev && props.envName === 'dev') {
      new wafv2.CfnWebACLAssociation(this, 'FibonacciApiWAFAssociation', {
        resourceArn: apiArn,
        webAclArn: props.webAclDev.attrArn,
      });
    }

    if (props.webAclProd && props.envName === 'prod') {
      new wafv2.CfnWebACLAssociation(this, 'FibonacciApiWAFAssociation', {
        resourceArn: apiArn,
        webAclArn: props.webAclProd.attrArn,
      });
    }

    // ========================================
    // CloudFormation Outputs
    // ========================================
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `FibonacciVpcId-${props.envName}`
    });

    new cdk.CfnOutput(this, 'S3EndpointId', {
      value: s3Endpoint.vpcEndpointId,
      description: 'S3 VPC Gateway Endpoint ID',
      exportName: `FibonacciS3EndpointId-${props.envName}`
    });

    new cdk.CfnOutput(this, 'SecretsManagerEndpointId', {
      value: secretsManagerEndpoint.vpcEndpointId,
      description: 'Secrets Manager VPC Interface Endpoint ID',
      exportName: `FibonacciSecretsManagerEndpointId-${props.envName}`
    });

    new cdk.CfnOutput(this, 'EventBridgeEndpointId', {
      value: eventBridgeEndpoint.vpcEndpointId,
      description: 'EventBridge VPC Interface Endpoint ID',
      exportName: `FibonacciEventBridgeEndpointId-${props.envName}`
    });

    new cdk.CfnOutput(this, 'DbClusterArn', {
      value: this.dbCluster.clusterArn,
      description: 'Aurora Cluster ARN',
      exportName: `FibonacciDbClusterArn-${props.envName}`
    });

    new cdk.CfnOutput(this, 'DbSecretName', {
      value: this.dbSecret.secretName,
      description: 'Database Secret Name',
      exportName: `FibonacciDbSecretName-${props.envName}`
    });

    new cdk.CfnOutput(this, 'EventBusName', {
      value: this.eventBus.eventBusName,
      description: 'EventBridge Bus Name',
      exportName: `FibonacciEventBusName-${props.envName}`
    });

    new cdk.CfnOutput(this, 'EventBusArn', {
      value: this.eventBus.eventBusArn,
      description: 'EventBridge Bus ARN',
      exportName: `FibonacciEventBusArn-${props.envName}`
    });

    new cdk.CfnOutput(this, 'MainQueueUrl', {
      value: this.mainQueue.queueUrl,
      description: 'Main Queue URL',
      exportName: `FibonacciMainQueueUrl-${props.envName}`
    });

    new cdk.CfnOutput(this, 'DlqUrl', {
      value: this.dlq.queueUrl,
      description: 'Dead Letter Queue URL',
      exportName: `FibonacciDlqUrl-${props.envName}`
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: `FibonacciUserPoolId-${props.envName}`
    });

    new cdk.CfnOutput(this, 'UserPoolArn', {
      value: this.userPool.userPoolArn,
      description: 'Cognito User Pool ARN',
      exportName: `FibonacciUserPoolArn-${props.envName}`
    });

    new cdk.CfnOutput(this, 'SiteBucketName', {
      value: this.siteBucket.bucketName,
      description: 'S3 Bucket Name for Front-End',
      exportName: `FibonacciSiteBucketName-${props.envName}`
    });

    new cdk.CfnOutput(this, 'CloudFrontUrl', {
      value: `https://${this.distribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL',
      exportName: `FibonacciCloudFrontUrl-${props.envName}`
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: this.distribution.distributionId,
      description: 'CloudFront Distribution ID',
      exportName: `FibonacciDistributionId-${props.envName}`
    });

    new cdk.CfnOutput(this, 'WebAclId', {
      value: this.webAcl.attrId,
      description: 'WAF Web ACL ID',
      exportName: `FibonacciWebAclId-${props.envName}`
    });

    new cdk.CfnOutput(this, 'WebAclArn', {
      value: this.webAcl.attrArn,
      description: 'WAF Web ACL ARN',
      exportName: `FibonacciWebAclArn-${props.envName}`
    });

    new cdk.CfnOutput(this, 'StackVersionsBucketName', {
      value: stackVersionsBucket.bucketName,
      description: 'S3 Bucket Name for Stack Versions',
      exportName: `FibonacciStackVersionsBucketName-${props.envName}`
    });

    new cdk.CfnOutput(this, 'WebAclName', {
      value: `fibonacci-cloudfront-waf-${props.envName}`,
      description: 'WAF Web ACL Name',
      exportName: `FibonacciWebAclName-${props.envName}`
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.httpApi.apiEndpoint,
      description: 'API Gateway URL',
      exportName: `FibonacciApiUrl-${props.envName}`
    });

    new cdk.CfnOutput(this, 'ApiId', {
      value: this.httpApi.apiId,
      description: 'API Gateway ID',
      exportName: `FibonacciApiId-${props.envName}`
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: this.apiHandler.functionName,
      description: 'Lambda Function Name',
      exportName: `FibonacciLambdaFunctionName-${props.envName}`
    });

    new cdk.CfnOutput(this, 'KmsKeyId', {
      value: this.kmsKey.keyId,
      description: 'KMS Key ID for encryption',
      exportName: `FibonacciKmsKeyId-${props.envName}`
    });

    new cdk.CfnOutput(this, 'KmsKeyArn', {
      value: this.kmsKey.keyArn,
      description: 'KMS Key ARN for encryption',
      exportName: `FibonacciKmsKeyArn-${props.envName}`
    });

    // ========================================
    // CloudWatch Dashboard - Fibonacci Core
    // ========================================
    const fibonacciDashboard = new FibonacciCoreDashboard(this, 'FibonacciCoreDashboard', {
      envName: props.envName,
      apiHandler: this.apiHandler,
      httpApi: this.httpApi,
      eventBus: this.eventBus,
      mainQueue: this.mainQueue,
      dlq: this.dlq
    });

    new cdk.CfnOutput(this, 'DashboardName', {
      value: fibonacciDashboard.dashboard.dashboardName,
      description: 'CloudWatch Dashboard Name',
      exportName: `FibonacciDashboardName-${props.envName}`
    });

    // ========================================
    // SNS Topic para Notificações de Alarmes
    // ========================================
    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `fibonacci-alarms-${props.envName}`,
      displayName: 'Fibonacci CloudWatch Alarms'
    });

    // Adicionar email subscription (opcional - pode ser configurado manualmente)
    // alarmTopic.addSubscription(
    //   new sns_subscriptions.EmailSubscription('ops@alquimista.ai')
    // );

    // ========================================
    // CloudWatch Alarms
    // ========================================

    // Alarme 1: Taxa de erro alta (>10 erros em 2 minutos)
    const highErrorRateAlarm = new cloudwatch.Alarm(this, 'HighErrorRateAlarm', {
      alarmName: `fibonacci-high-error-rate-${props.envName}`,
      alarmDescription: 'Taxa de erro acima de 10 em 2 minutos - Requer investigação imediata',
      metric: this.apiHandler.metricErrors({
        period: cdk.Duration.minutes(1),
        statistic: 'Sum'
      }),
      threshold: 10,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    highErrorRateAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));
    highErrorRateAlarm.addOkAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // Alarme 2: Latência alta (p95 > 3 segundos)
    const highLatencyAlarm = new cloudwatch.Alarm(this, 'HighLatencyAlarm', {
      alarmName: `fibonacci-high-latency-${props.envName}`,
      alarmDescription: 'P95 latência acima de 3 segundos - Performance degradada',
      metric: this.apiHandler.metricDuration({
        period: cdk.Duration.minutes(5),
        statistic: 'p95'
      }),
      threshold: 3000, // 3 segundos em milissegundos
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    highLatencyAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));
    highLatencyAlarm.addOkAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // Alarme 3: DLQ não vazia (mensagens na Dead Letter Queue)
    const dlqNotEmptyAlarm = new cloudwatch.Alarm(this, 'DLQNotEmptyAlarm', {
      alarmName: `fibonacci-dlq-not-empty-${props.envName}`,
      alarmDescription: 'Mensagens na DLQ - Falhas recorrentes detectadas',
      metric: this.dlq.metricApproximateNumberOfMessagesVisible({
        period: cdk.Duration.minutes(1),
        statistic: 'Maximum'
      }),
      threshold: 1,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    dlqNotEmptyAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));
    dlqNotEmptyAlarm.addOkAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // Alarme 4: Aurora CPU alta (>80%)
    const auroraCpuAlarm = new cloudwatch.Alarm(this, 'AuroraCpuAlarm', {
      alarmName: `fibonacci-aurora-cpu-high-${props.envName}`,
      alarmDescription: 'Aurora CPU acima de 80% - Considerar escalar capacidade',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          DBClusterIdentifier: this.dbCluster.clusterIdentifier
        },
        period: cdk.Duration.minutes(5),
        statistic: 'Average'
      }),
      threshold: 80,
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    auroraCpuAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));
    auroraCpuAlarm.addOkAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // Alarme 5: Custos acima do budget (usando CloudWatch Metric Math)
    // Nota: Este alarme monitora custos estimados baseado em invocações Lambda
    // Para monitoramento de custos real, use AWS Budgets
    const estimatedCostAlarm = new cloudwatch.Alarm(this, 'EstimatedCostAlarm', {
      alarmName: `fibonacci-estimated-cost-high-${props.envName}`,
      alarmDescription: 'Invocações Lambda acima do esperado - Custos podem exceder budget',
      metric: this.apiHandler.metricInvocations({
        period: cdk.Duration.hours(1),
        statistic: 'Sum'
      }),
      threshold: props.envName === 'prod' ? 50000 : 10000, // Threshold por ambiente
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    estimatedCostAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));
    estimatedCostAlarm.addOkAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // Alarme 6: API Gateway 5xx Errors
    const apiGateway5xxAlarm = new cloudwatch.Alarm(this, 'ApiGateway5xxAlarm', {
      alarmName: `fibonacci-api-5xx-errors-${props.envName}`,
      alarmDescription: 'API Gateway retornando erros 5xx - Problema no servidor',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '5XXError',
        dimensionsMap: {
          ApiId: this.httpApi.apiId
        },
        period: cdk.Duration.minutes(1),
        statistic: 'Sum'
      }),
      threshold: 5,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    apiGateway5xxAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));
    apiGateway5xxAlarm.addOkAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // Alarme 7: Lambda Throttles (concorrência excedida)
    const lambdaThrottleAlarm = new cloudwatch.Alarm(this, 'LambdaThrottleAlarm', {
      alarmName: `fibonacci-lambda-throttles-${props.envName}`,
      alarmDescription: 'Lambda sendo throttled - Considerar aumentar reserved concurrency',
      metric: this.apiHandler.metricThrottles({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum'
      }),
      threshold: 10,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    lambdaThrottleAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));
    lambdaThrottleAlarm.addOkAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // Alarme 8: Main Queue - Mensagens antigas (age of oldest message)
    const oldMessagesAlarm = new cloudwatch.Alarm(this, 'OldMessagesAlarm', {
      alarmName: `fibonacci-old-messages-${props.envName}`,
      alarmDescription: 'Mensagens antigas na fila - Possível problema de processamento',
      metric: this.mainQueue.metricApproximateAgeOfOldestMessage({
        period: cdk.Duration.minutes(5),
        statistic: 'Maximum'
      }),
      threshold: 300, // 5 minutos em segundos
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    oldMessagesAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));
    oldMessagesAlarm.addOkAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // ========================================
    // Composite Alarm - Sistema Crítico
    // ========================================
    // Alarme composto que dispara quando múltiplos alarmes estão ativos
    const criticalSystemAlarm = new cloudwatch.CompositeAlarm(this, 'CriticalSystemAlarm', {
      compositeAlarmName: `fibonacci-critical-system-${props.envName}`,
      alarmDescription: 'CRÍTICO: Múltiplos alarmes ativos - Sistema em estado degradado',
      alarmRule: cloudwatch.AlarmRule.anyOf(
        cloudwatch.AlarmRule.fromAlarm(highErrorRateAlarm, cloudwatch.AlarmState.ALARM),
        cloudwatch.AlarmRule.allOf(
          cloudwatch.AlarmRule.fromAlarm(highLatencyAlarm, cloudwatch.AlarmState.ALARM),
          cloudwatch.AlarmRule.fromAlarm(dlqNotEmptyAlarm, cloudwatch.AlarmState.ALARM)
        )
      )
    });

    criticalSystemAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // ========================================
    // CloudWatch Insights Queries
    // ========================================
    // Queries pré-configuradas para análise de logs e troubleshooting
    const insightsQueries = new CloudWatchInsightsQueries(this, 'InsightsQueries', {
      appName: 'fibonacci',
      stage: props.envName,
      logGroups: [this.apiHandler.logGroup]
    });

    // ========================================
    // CloudFormation Outputs - Alarmes
    // ========================================
    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: alarmTopic.topicArn,
      description: 'SNS Topic ARN para notificações de alarmes',
      exportName: `FibonacciAlarmTopicArn-${props.envName}`
    });

    new cdk.CfnOutput(this, 'AlarmTopicName', {
      value: alarmTopic.topicName,
      description: 'SNS Topic Name para notificações de alarmes',
      exportName: `FibonacciAlarmTopicName-${props.envName}`
    });

    new cdk.CfnOutput(this, 'HighErrorRateAlarmName', {
      value: highErrorRateAlarm.alarmName,
      description: 'Nome do alarme de taxa de erro alta'
    });

    new cdk.CfnOutput(this, 'HighLatencyAlarmName', {
      value: highLatencyAlarm.alarmName,
      description: 'Nome do alarme de latência alta'
    });

    new cdk.CfnOutput(this, 'DLQNotEmptyAlarmName', {
      value: dlqNotEmptyAlarm.alarmName,
      description: 'Nome do alarme de DLQ não vazia'
    });

    new cdk.CfnOutput(this, 'AuroraCpuAlarmName', {
      value: auroraCpuAlarm.alarmName,
      description: 'Nome do alarme de CPU alta do Aurora'
    });

    // ========================================
    // CloudFormation Outputs - CloudWatch Insights Queries
    // ========================================
    new cdk.CfnOutput(this, 'InsightsQueryErrorsByAgent', {
      value: insightsQueries.errorsByAgentQuery.name!,
      description: 'CloudWatch Insights Query: Erros por Agente',
      exportName: `FibonacciInsightsQueryErrorsByAgent-${props.envName}`
    });

    new cdk.CfnOutput(this, 'InsightsQueryLatencyByEndpoint', {
      value: insightsQueries.latencyByEndpointQuery.name!,
      description: 'CloudWatch Insights Query: Latência por Endpoint',
      exportName: `FibonacciInsightsQueryLatencyByEndpoint-${props.envName}`
    });

    new cdk.CfnOutput(this, 'InsightsQueryFunnelConversion', {
      value: insightsQueries.funnelConversionQuery.name!,
      description: 'CloudWatch Insights Query: Taxa de Conversão do Funil',
      exportName: `FibonacciInsightsQueryFunnelConversion-${props.envName}`
    });

    new cdk.CfnOutput(this, 'InsightsQueryMCPCalls', {
      value: insightsQueries.mcpCallsQuery.name!,
      description: 'CloudWatch Insights Query: Análise de Chamadas MCP',
      exportName: `FibonacciInsightsQueryMCPCalls-${props.envName}`
    });

    new cdk.CfnOutput(this, 'InsightsQueryLeadProcessingTime', {
      value: insightsQueries.leadProcessingTimeQuery.name!,
      description: 'CloudWatch Insights Query: Tempo de Processamento de Leads',
      exportName: `FibonacciInsightsQueryLeadProcessingTime-${props.envName}`
    });

    // ========================================
    // CloudFormation Outputs - CloudTrail
    // ========================================
    /*
    new cdk.CfnOutput(this, 'CloudTrailName', {
      value: this.trail.trailArn,
      description: 'ARN do CloudTrail para auditoria',
      exportName: `FibonacciCloudTrailArn-${props.envName}`
    });

    new cdk.CfnOutput(this, 'CloudTrailBucketName', {
      value: this.trailBucket.bucketName,
      description: 'Nome do bucket S3 com logs do CloudTrail',
      exportName: `FibonacciCloudTrailBucket-${props.envName}`
    });
    */

    // CloudTrail outputs comentados temporariamente
    /*
    new cdk.CfnOutput(this, 'CloudTrailLogGroupName', {
      value: this.trail.logGroup?.logGroupName || 'N/A',
      description: 'Nome do CloudWatch Log Group do CloudTrail',
      exportName: `FibonacciCloudTrailLogGroup-${props.envName}`
    });

    new cdk.CfnOutput(this, 'UnauthorizedApiCallsAlarmName', {
      value: unauthorizedApiCallsAlarm.alarmName,
      description: 'Nome do alarme de chamadas não autorizadas'
    });

    new cdk.CfnOutput(this, 'SecurityGroupChangesAlarmName', {
      value: securityGroupChangesAlarm.alarmName,
      description: 'Nome do alarme de mudanças em Security Groups'
    });

    new cdk.CfnOutput(this, 'IAMChangesAlarmName', {
      value: iamChangesAlarm.alarmName,
      description: 'Nome do alarme de mudanças em IAM'
    });
    */
  }
}
