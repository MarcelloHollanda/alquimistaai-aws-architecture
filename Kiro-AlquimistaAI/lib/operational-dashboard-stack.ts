import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as authorizers from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import { Construct } from 'constructs';

export interface OperationalDashboardStackProps extends cdk.StackProps {
  envName: string;
  auroraSecretArn: string;
  auroraClusterArn: string;
  vpc?: ec2.IVpc; // VPC para ElastiCache (opcional, cria uma nova se não fornecida)
  
  // Props removidas para evitar dependência cíclica:
  // - userPool: cognito.UserPool
  // - cognitoAuthorizer: authorizers.HttpUserPoolAuthorizer
  // - platformApi: apigatewayv2.HttpApi
}

export class OperationalDashboardStack extends cdk.Stack {
  public readonly commandsTable: dynamodb.Table;
  public readonly aggregateMetricsLambda: lambda.Function;
  public readonly processCommandLambda: lambda.Function;
  public readonly redisCluster: elasticache.CfnCacheCluster;
  public readonly vpc: ec2.IVpc;
  
  // Tenant API Lambdas
  public readonly getTenantMeFunction: nodejs.NodejsFunction;
  public readonly getTenantAgentsFunction: nodejs.NodejsFunction;
  public readonly getTenantIntegrationsFunction: nodejs.NodejsFunction;
  public readonly getTenantUsageFunction: nodejs.NodejsFunction;
  public readonly getTenantIncidentsFunction: nodejs.NodejsFunction;
  
  // Internal API Lambdas
  public readonly listTenantsFunction: nodejs.NodejsFunction;
  public readonly getTenantDetailFunction: nodejs.NodejsFunction;
  public readonly getTenantAgentsInternalFunction: nodejs.NodejsFunction;
  public readonly getUsageOverviewFunction: nodejs.NodejsFunction;
  public readonly getBillingOverviewFunction: nodejs.NodejsFunction;
  public readonly createOperationalCommandFunction: nodejs.NodejsFunction;
  public readonly listOperationalCommandsFunction: nodejs.NodejsFunction;

  constructor(scope: Construct, id: string, props: OperationalDashboardStackProps) {
    super(scope, id, props);

    const { envName, auroraSecretArn, auroraClusterArn } = props;
    
    // Nota: userPool, cognitoAuthorizer e platformApi não são mais utilizados
    // após remoção das rotas para evitar dependência cíclica

    // ========================================
    // Variáveis de Ambiente Comuns
    // ========================================
    const commonEnvironment = {
      ENV: envName,
      AURORA_SECRET_ARN: auroraSecretArn,
      AURORA_CLUSTER_ARN: auroraClusterArn,
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      POWERTOOLS_SERVICE_NAME: 'operational-dashboard',
    };

    const commonBundling = {
      minify: true,
      sourceMap: true,
      target: 'es2021',
      externalModules: ['@aws-sdk/*'],
    };

    // ========================================
    // DynamoDB Table: operational_commands
    // ========================================
    this.commandsTable = new dynamodb.Table(this, 'OperationalCommandsTable', {
      tableName: `alquimista-operational-commands-${envName}`,
      partitionKey: {
        name: 'command_id',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'created_at',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      timeToLiveAttribute: 'ttl',
      pointInTimeRecovery: true,
      removalPolicy: envName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // GSI: tenant_id-created_at-index
    this.commandsTable.addGlobalSecondaryIndex({
      indexName: 'tenant_id-created_at-index',
      partitionKey: {
        name: 'tenant_id',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'created_at',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI: status-created_at-index
    this.commandsTable.addGlobalSecondaryIndex({
      indexName: 'status-created_at-index',
      partitionKey: {
        name: 'status',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'created_at',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ========================================
    // VPC e ElastiCache Redis
    // ========================================
    
    // Usar VPC fornecida ou criar uma nova
    this.vpc = props.vpc || new ec2.Vpc(this, 'OperationalDashboardVpc', {
      vpcName: `alquimista-operational-dashboard-vpc-${envName}`,
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Security Group para Redis
    const redisSecurityGroup = new ec2.SecurityGroup(this, 'RedisSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `alquimista-redis-sg-${envName}`,
      description: 'Security group para ElastiCache Redis do Operational Dashboard',
      allowAllOutbound: true,
    });

    // Security Group para Lambdas
    const lambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `alquimista-lambda-sg-${envName}`,
      description: 'Security group para Lambdas que acessam Redis',
      allowAllOutbound: true,
    });

    // Permitir Lambdas acessarem Redis na porta 6379
    redisSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(6379),
      'Permitir acesso das Lambdas ao Redis'
    );

    // Subnet Group para Redis
    const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'Subnet group para ElastiCache Redis',
      subnetIds: this.vpc.isolatedSubnets.map(subnet => subnet.subnetId),
      cacheSubnetGroupName: `alquimista-redis-subnet-group-${envName}`,
    });

    // ElastiCache Redis Cluster
    this.redisCluster = new elasticache.CfnCacheCluster(this, 'RedisCluster', {
      cacheNodeType: envName === 'prod' ? 'cache.t3.medium' : 'cache.t3.micro',
      engine: 'redis',
      numCacheNodes: 1,
      clusterName: `alquimista-redis-${envName}`,
      cacheSubnetGroupName: redisSubnetGroup.cacheSubnetGroupName,
      vpcSecurityGroupIds: [redisSecurityGroup.securityGroupId],
      engineVersion: '7.0',
      port: 6379,
      autoMinorVersionUpgrade: true,
      preferredMaintenanceWindow: 'sun:05:00-sun:06:00',
      snapshotRetentionLimit: envName === 'prod' ? 7 : 1,
      snapshotWindow: '03:00-04:00',
      tags: [
        { key: 'Name', value: `alquimista-redis-${envName}` },
        { key: 'Environment', value: envName },
        { key: 'Project', value: 'Alquimista' },
        { key: 'Component', value: 'OperationalDashboard' },
      ],
    });

    this.redisCluster.addDependency(redisSubnetGroup);

    // Obter endpoint do Redis
    const redisEndpoint = this.redisCluster.attrRedisEndpointAddress;
    const redisPort = this.redisCluster.attrRedisEndpointPort;

    // ========================================
    // Variáveis de Ambiente Comuns (atualizado com Redis)
    // ========================================
    const commonEnvironmentWithCache = {
      ...commonEnvironment,
      REDIS_HOST: redisEndpoint,
      REDIS_PORT: redisPort,
      CACHE_ENABLED: 'true',
    };

    // ========================================
    // Lambda Functions: Tenant APIs (/tenant/*)
    // ========================================

    // GET /tenant/me
    this.getTenantMeFunction = new nodejs.NodejsFunction(this, 'GetTenantMeFunction', {
      functionName: `alquimista-get-tenant-me-${envName}`,
      entry: 'lambda/platform/get-tenant-me.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      environment: commonEnvironmentWithCache,
      bundling: commonBundling,
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_WEEK,
      description: 'Retorna informações da empresa do tenant autenticado',
      vpc: this.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [lambdaSecurityGroup],
    });

    // GET /tenant/agents
    this.getTenantAgentsFunction = new nodejs.NodejsFunction(this, 'GetTenantAgentsFunction', {
      functionName: `alquimista-get-tenant-agents-${envName}`,
      entry: 'lambda/platform/get-tenant-agents.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      environment: commonEnvironmentWithCache,
      bundling: commonBundling,
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_WEEK,
      description: 'Retorna agentes contratados pelo tenant',
      vpc: this.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [lambdaSecurityGroup],
    });

    // GET /tenant/integrations
    this.getTenantIntegrationsFunction = new nodejs.NodejsFunction(this, 'GetTenantIntegrationsFunction', {
      functionName: `alquimista-get-tenant-integrations-${envName}`,
      entry: 'lambda/platform/get-tenant-integrations.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      environment: commonEnvironmentWithCache,
      bundling: commonBundling,
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_WEEK,
      description: 'Retorna integrações configuradas pelo tenant',
      vpc: this.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [lambdaSecurityGroup],
    });

    // GET /tenant/usage
    this.getTenantUsageFunction = new nodejs.NodejsFunction(this, 'GetTenantUsageFunction', {
      functionName: `alquimista-get-tenant-usage-${envName}`,
      entry: 'lambda/platform/get-tenant-usage.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: commonEnvironmentWithCache,
      bundling: commonBundling,
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_WEEK,
      description: 'Retorna métricas de uso do tenant',
      vpc: this.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [lambdaSecurityGroup],
    });

    // GET /tenant/incidents
    this.getTenantIncidentsFunction = new nodejs.NodejsFunction(this, 'GetTenantIncidentsFunction', {
      functionName: `alquimista-get-tenant-incidents-${envName}`,
      entry: 'lambda/platform/get-tenant-incidents.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      environment: commonEnvironmentWithCache,
      bundling: commonBundling,
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_WEEK,
      description: 'Retorna incidentes que afetaram o tenant',
      vpc: this.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [lambdaSecurityGroup],
    });

    // ========================================
    // Lambda Functions: Internal APIs (/internal/*)
    // ========================================

    // GET /internal/tenants
    this.listTenantsFunction = new nodejs.NodejsFunction(this, 'ListTenantsFunction', {
      functionName: `alquimista-list-tenants-${envName}`,
      entry: 'lambda/internal/list-tenants.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: commonEnvironmentWithCache,
      bundling: commonBundling,
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_WEEK,
      description: 'Lista todos os tenants com filtros',
      vpc: this.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [lambdaSecurityGroup],
    });

    // GET /internal/tenants/{id}
    this.getTenantDetailFunction = new nodejs.NodejsFunction(this, 'GetTenantDetailFunction', {
      functionName: `alquimista-get-tenant-detail-${envName}`,
      entry: 'lambda/internal/get-tenant-detail.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: commonEnvironment,
      bundling: commonBundling,
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_WEEK,
      description: 'Retorna detalhes completos de um tenant específico',
    });

    // GET /internal/tenants/{id}/agents
    this.getTenantAgentsInternalFunction = new nodejs.NodejsFunction(this, 'GetTenantAgentsInternalFunction', {
      functionName: `alquimista-get-tenant-agents-internal-${envName}`,
      entry: 'lambda/internal/get-tenant-agents.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: commonEnvironment,
      bundling: commonBundling,
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_WEEK,
      description: 'Retorna agentes do tenant com opções de gerenciamento',
    });

    // GET /internal/usage/overview
    this.getUsageOverviewFunction = new nodejs.NodejsFunction(this, 'GetUsageOverviewFunction', {
      functionName: `alquimista-get-usage-overview-${envName}`,
      entry: 'lambda/internal/get-usage-overview.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: commonEnvironmentWithCache,
      bundling: commonBundling,
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_WEEK,
      description: 'Retorna visão global de uso da plataforma',
      vpc: this.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [lambdaSecurityGroup],
    });

    // GET /internal/billing/overview
    this.getBillingOverviewFunction = new nodejs.NodejsFunction(this, 'GetBillingOverviewFunction', {
      functionName: `alquimista-get-billing-overview-${envName}`,
      entry: 'lambda/internal/get-billing-overview.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: commonEnvironmentWithCache,
      bundling: commonBundling,
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_WEEK,
      description: 'Retorna visão financeira global',
      vpc: this.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [lambdaSecurityGroup],
    });

    // POST /internal/operations/commands
    this.createOperationalCommandFunction = new nodejs.NodejsFunction(this, 'CreateOperationalCommandFunction', {
      functionName: `alquimista-create-operational-command-${envName}`,
      entry: 'lambda/internal/create-operational-command.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      environment: {
        ...commonEnvironment,
        COMMANDS_TABLE: this.commandsTable.tableName,
      },
      bundling: commonBundling,
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_WEEK,
      description: 'Cria um novo comando operacional',
    });

    // GET /internal/operations/commands
    this.listOperationalCommandsFunction = new nodejs.NodejsFunction(this, 'ListOperationalCommandsFunction', {
      functionName: `alquimista-list-operational-commands-${envName}`,
      entry: 'lambda/internal/list-operational-commands.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: {
        ...commonEnvironment,
        COMMANDS_TABLE: this.commandsTable.tableName,
      },
      bundling: commonBundling,
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_WEEK,
      description: 'Lista comandos operacionais executados',
    });

    // ========================================
    // Permissões para Aurora
    // ========================================
    const tenantLambdas = [
      this.getTenantMeFunction,
      this.getTenantAgentsFunction,
      this.getTenantIntegrationsFunction,
      this.getTenantUsageFunction,
      this.getTenantIncidentsFunction,
    ];

    const internalLambdas = [
      this.listTenantsFunction,
      this.getTenantDetailFunction,
      this.getTenantAgentsInternalFunction,
      this.getUsageOverviewFunction,
      this.getBillingOverviewFunction,
    ];

    [...tenantLambdas, ...internalLambdas].forEach((fn) => {
      fn.addToRolePolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'rds-data:ExecuteStatement',
            'rds-data:BatchExecuteStatement',
          ],
          resources: [auroraClusterArn],
        })
      );

      fn.addToRolePolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['secretsmanager:GetSecretValue'],
          resources: [auroraSecretArn],
        })
      );
    });

    // Permissões para DynamoDB
    this.commandsTable.grantReadWriteData(this.createOperationalCommandFunction);
    this.commandsTable.grantReadData(this.listOperationalCommandsFunction);

    // ========================================
    // Lambda: Aggregate Daily Metrics
    // ========================================
    this.aggregateMetricsLambda = new lambda.Function(this, 'AggregateDailyMetrics', {
      functionName: `alquimista-aggregate-metrics-${envName}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'aggregate-daily-metrics.handler',
      code: lambda.Code.fromAsset('lambda/internal'),
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: {
        ENV: envName,
        AURORA_SECRET_ARN: auroraSecretArn,
        AURORA_CLUSTER_ARN: auroraClusterArn,
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Permissões para acessar Aurora via Data API
    this.aggregateMetricsLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'rds-data:ExecuteStatement',
          'rds-data:BatchExecuteStatement',
          'rds-data:BeginTransaction',
          'rds-data:CommitTransaction',
          'rds-data:RollbackTransaction',
        ],
        resources: [auroraClusterArn],
      })
    );

    this.aggregateMetricsLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: [auroraSecretArn],
      })
    );

    // EventBridge Rule: Executar diariamente às 2 AM UTC
    const aggregationRule = new events.Rule(this, 'DailyMetricsAggregationRule', {
      ruleName: `alquimista-daily-metrics-${envName}`,
      description: 'Agrega métricas diárias de uso de agentes por tenant',
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '2',
        day: '*',
        month: '*',
        year: '*',
      }),
    });

    aggregationRule.addTarget(new targets.LambdaFunction(this.aggregateMetricsLambda));

    // ========================================
    // Lambda: Process Operational Command
    // ========================================
    this.processCommandLambda = new lambda.Function(this, 'ProcessOperationalCommand', {
      functionName: `alquimista-process-command-${envName}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'process-operational-command.handler',
      code: lambda.Code.fromAsset('lambda/internal'),
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: {
        ENV: envName,
        COMMANDS_TABLE: this.commandsTable.tableName,
        AURORA_SECRET_ARN: auroraSecretArn,
        AURORA_CLUSTER_ARN: auroraClusterArn,
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Permissões para DynamoDB
    this.commandsTable.grantReadWriteData(this.processCommandLambda);

    // Permissões para Aurora
    this.processCommandLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'rds-data:ExecuteStatement',
          'rds-data:BatchExecuteStatement',
        ],
        resources: [auroraClusterArn],
      })
    );

    this.processCommandLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: [auroraSecretArn],
      })
    );

    // Trigger: DynamoDB Stream
    this.processCommandLambda.addEventSourceMapping('CommandsStreamMapping', {
      eventSourceArn: this.commandsTable.tableStreamArn!,
      startingPosition: lambda.StartingPosition.LATEST,
      batchSize: 10,
      maxBatchingWindow: cdk.Duration.seconds(5),
      retryAttempts: 3,
    });

    // ========================================
    // Cognito Authorizer (Removido)
    // ========================================
    // Removido para evitar dependência cíclica.
    // Quando as rotas forem recriadas, usar o authorizer do FibonacciStack.

    // ========================================
    // Integrações Lambda (Comentadas - Não Utilizadas)
    // ========================================
    // As integrações foram removidas para evitar dependência cíclica.
    // Quando as rotas forem adicionadas no AlquimistaStack ou em uma API separada,
    // descomentar e usar estas integrações.
    
    /*
    // Tenant APIs
    const getTenantMeIntegration = new integrations.HttpLambdaIntegration(
      'GetTenantMeIntegration',
      this.getTenantMeFunction,
      { payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0 }
    );

    const getTenantAgentsIntegration = new integrations.HttpLambdaIntegration(
      'GetTenantAgentsIntegration',
      this.getTenantAgentsFunction,
      { payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0 }
    );

    const getTenantIntegrationsIntegration = new integrations.HttpLambdaIntegration(
      'GetTenantIntegrationsIntegration',
      this.getTenantIntegrationsFunction,
      { payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0 }
    );

    const getTenantUsageIntegration = new integrations.HttpLambdaIntegration(
      'GetTenantUsageIntegration',
      this.getTenantUsageFunction,
      { payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0 }
    );

    const getTenantIncidentsIntegration = new integrations.HttpLambdaIntegration(
      'GetTenantIncidentsIntegration',
      this.getTenantIncidentsFunction,
      { payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0 }
    );

    // Internal APIs
    const listTenantsIntegration = new integrations.HttpLambdaIntegration(
      'ListTenantsIntegration',
      this.listTenantsFunction,
      { payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0 }
    );

    const getTenantDetailIntegration = new integrations.HttpLambdaIntegration(
      'GetTenantDetailIntegration',
      this.getTenantDetailFunction,
      { payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0 }
    );

    const getTenantAgentsInternalIntegration = new integrations.HttpLambdaIntegration(
      'GetTenantAgentsInternalIntegration',
      this.getTenantAgentsInternalFunction,
      { payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0 }
    );

    const getUsageOverviewIntegration = new integrations.HttpLambdaIntegration(
      'GetUsageOverviewIntegration',
      this.getUsageOverviewFunction,
      { payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0 }
    );

    const getBillingOverviewIntegration = new integrations.HttpLambdaIntegration(
      'GetBillingOverviewIntegration',
      this.getBillingOverviewFunction,
      { payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0 }
    );

    const createOperationalCommandIntegration = new integrations.HttpLambdaIntegration(
      'CreateOperationalCommandIntegration',
      this.createOperationalCommandFunction,
      { payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0 }
    );

    const listOperationalCommandsIntegration = new integrations.HttpLambdaIntegration(
      'ListOperationalCommandsIntegration',
      this.listOperationalCommandsFunction,
      { payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0 }
    );
    */

    // ========================================
    // NOTA: Rotas do API Gateway Removidas para Evitar Ciclo
    // ========================================
    // As rotas /tenant/* e /internal/* foram removidas deste stack para evitar
    // dependência cíclica com AlquimistaStack.
    //
    // SOLUÇÃO TEMPORÁRIA:
    // - As Lambdas estão criadas e prontas para uso
    // - As rotas devem ser adicionadas manualmente no AlquimistaStack
    //   OU este stack deve criar sua própria API Gateway
    //
    // PRÓXIMOS PASSOS (pós-migração para Terraform):
    // - Criar API Gateway separada para Operational Dashboard
    // - Ou mover todas as Lambdas para AlquimistaStack
    //
    // Integrações disponíveis para uso:
    // - getTenantMeIntegration
    // - getTenantAgentsIntegration
    // - getTenantIntegrationsIntegration
    // - getTenantUsageIntegration
    // - getTenantIncidentsIntegration
    // - listTenantsIntegration
    // - getTenantDetailIntegration
    // - getTenantAgentsInternalIntegration
    // - getUsageOverviewIntegration
    // - getBillingOverviewIntegration
    // - createOperationalCommandIntegration
    // - listOperationalCommandsIntegration

    // ========================================
    // Outputs
    // ========================================
    new cdk.CfnOutput(this, 'CommandsTableName', {
      value: this.commandsTable.tableName,
      description: 'Nome da tabela DynamoDB de comandos operacionais',
      exportName: `alquimista-commands-table-${envName}`,
    });

    new cdk.CfnOutput(this, 'CommandsTableArn', {
      value: this.commandsTable.tableArn,
      description: 'ARN da tabela DynamoDB de comandos operacionais',
      exportName: `alquimista-commands-table-arn-${envName}`,
    });

    new cdk.CfnOutput(this, 'AggregateMetricsLambdaArn', {
      value: this.aggregateMetricsLambda.functionArn,
      description: 'ARN da Lambda de agregação de métricas',
      exportName: `alquimista-aggregate-metrics-arn-${envName}`,
    });

    new cdk.CfnOutput(this, 'ProcessCommandLambdaArn', {
      value: this.processCommandLambda.functionArn,
      description: 'ARN da Lambda de processamento de comandos',
      exportName: `alquimista-process-command-arn-${envName}`,
    });

    new cdk.CfnOutput(this, 'RedisEndpoint', {
      value: redisEndpoint,
      description: 'Endpoint do ElastiCache Redis',
      exportName: `alquimista-redis-endpoint-${envName}`,
    });

    new cdk.CfnOutput(this, 'RedisPort', {
      value: redisPort,
      description: 'Porta do ElastiCache Redis',
      exportName: `alquimista-redis-port-${envName}`,
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'ID da VPC do Operational Dashboard',
      exportName: `alquimista-operational-dashboard-vpc-${envName}`,
    });

    // ========================================
    // Tags
    // ========================================
    cdk.Tags.of(this).add('Project', 'Alquimista');
    cdk.Tags.of(this).add('Environment', envName);
    cdk.Tags.of(this).add('Component', 'OperationalDashboard');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}
