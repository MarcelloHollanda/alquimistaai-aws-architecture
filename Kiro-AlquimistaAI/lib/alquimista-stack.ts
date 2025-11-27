import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as events from 'aws-cdk-lib/aws-events';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as authorizers from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface AlquimistaStackProps extends cdk.StackProps {
  envName: string;
  envConfig: any;
  eventBus: events.EventBus;
  userPool: cognito.UserPool;
  cognitoAuthorizer: authorizers.HttpUserPoolAuthorizer;
  dbCluster: rds.DatabaseCluster;
  dbSecret: rds.DatabaseSecret;
}

export class AlquimistaStack extends cdk.Stack {
  public readonly platformApi: apigatewayv2.HttpApi;
  public readonly listAgentsFunction: nodejs.NodejsFunction;
  public readonly activateAgentFunction: nodejs.NodejsFunction;
  public readonly deactivateAgentFunction: nodejs.NodejsFunction;
  public readonly auditLogFunction: nodejs.NodejsFunction;
  public readonly agentMetricsFunction: nodejs.NodejsFunction;
  public readonly createApprovalFunction: nodejs.NodejsFunction;
  public readonly decideApprovalFunction: nodejs.NodejsFunction;
  public readonly getApprovalFunction: nodejs.NodejsFunction;
  public readonly listApprovalsFunction: nodejs.NodejsFunction;
  public readonly cancelApprovalFunction: nodejs.NodejsFunction;
  
  // Auth-related functions
  public readonly createCompanyFunction: nodejs.NodejsFunction;
  public readonly updateCompanyFunction: nodejs.NodejsFunction;
  public readonly uploadLogoFunction: nodejs.NodejsFunction;
  public readonly createUserFunction: nodejs.NodejsFunction;
  public readonly updateUserFunction: nodejs.NodejsFunction;
  public readonly getUserFunction: nodejs.NodejsFunction;
  public readonly connectIntegrationFunction: nodejs.NodejsFunction;
  public readonly disconnectIntegrationFunction: nodejs.NodejsFunction;
  public readonly listIntegrationsFunction: nodejs.NodejsFunction;
  
  // Trial-related functions
  public readonly trialStartFunction: nodejs.NodejsFunction;
  public readonly trialInvokeFunction: nodejs.NodejsFunction;
  
  // Commercial-related functions
  public readonly commercialContactFunction: nodejs.NodejsFunction;

  constructor(scope: Construct, id: string, props: AlquimistaStackProps) {
    super(scope, id, props);

    // ========================================
    // Lambda Functions para API da Plataforma
    // ========================================

    // Variáveis de ambiente comuns para todas as Lambdas
    const commonEnvironment = {
      POWERTOOLS_SERVICE_NAME: 'alquimista-platform',
      EVENT_BUS_NAME: props.eventBus.eventBusName,
      DB_SECRET_ARN: props.dbSecret.secretArn,
      USER_POOL_ID: props.userPool.userPoolId,
      NODE_OPTIONS: '--enable-source-maps'
    };

    // Configuração comum de bundling
    const commonBundling = {
      minify: true,
      sourceMap: true,
      target: 'es2021',
      externalModules: ['@aws-sdk/*']
    };

    // Lambda: Listar agentes disponíveis no marketplace
    this.listAgentsFunction = new nodejs.NodejsFunction(this, 'ListAgentsFunction', {
      functionName: `alquimista-list-agents-${props.envName}`,
      entry: 'lambda/platform/list-agents.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      environment: commonEnvironment,
      bundling: commonBundling,
      tracing: lambda.Tracing.ACTIVE,
      description: 'Lista agentes disponíveis no marketplace'
    });

    // Lambda: Ativar agente para tenant
    this.activateAgentFunction = new nodejs.NodejsFunction(this, 'ActivateAgentFunction', {
      functionName: `alquimista-activate-agent-${props.envName}`,
      entry: 'lambda/platform/activate-agent.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      environment: commonEnvironment,
      bundling: commonBundling,
      tracing: lambda.Tracing.ACTIVE,
      description: 'Ativa agente para tenant específico'
    });

    // Lambda: Desativar agente
    this.deactivateAgentFunction = new nodejs.NodejsFunction(this, 'DeactivateAgentFunction', {
      functionName: `alquimista-deactivate-agent-${props.envName}`,
      entry: 'lambda/platform/deactivate-agent.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      environment: commonEnvironment,
      bundling: commonBundling,
      tracing: lambda.Tracing.ACTIVE,
      description: 'Desativa agente para tenant específico'
    });

    // Lambda: Consultar audit logs
    this.auditLogFunction = new nodejs.NodejsFunction(this, 'AuditLogFunction', {
      functionName: `alquimista-audit-log-${props.envName}`,
      entry: 'lambda/platform/audit-log.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: commonEnvironment,
      bundling: commonBundling,
      tracing: lambda.Tracing.ACTIVE,
      description: 'Consulta logs de auditoria da plataforma'
    });

    // Lambda: Obter métricas de agentes
    this.agentMetricsFunction = new nodejs.NodejsFunction(this, 'AgentMetricsFunction', {
      functionName: `alquimista-agent-metrics-${props.envName}`,
      entry: 'lambda/platform/agent-metrics.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: commonEnvironment,
      bundling: commonBundling,
      tracing: lambda.Tracing.ACTIVE,
      description: 'Calcula e retorna métricas de performance e custo por agente'
    });

    // Lambda: Criar solicitação de aprovação
    this.createApprovalFunction = new nodejs.NodejsFunction(this, 'CreateApprovalFunction', {
      functionName: `alquimista-create-approval-${props.envName}`,
      entry: 'lambda/platform/approval-flow.ts',
      handler: 'createHandler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      environment: commonEnvironment,
      bundling: commonBundling,
      tracing: lambda.Tracing.ACTIVE,
      description: 'Cria solicitação de aprovação para ações críticas'
    });

    // Lambda: Processar decisão de aprovação
    this.decideApprovalFunction = new nodejs.NodejsFunction(this, 'DecideApprovalFunction', {
      functionName: `alquimista-decide-approval-${props.envName}`,
      entry: 'lambda/platform/approval-flow.ts',
      handler: 'decideHandler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      environment: commonEnvironment,
      bundling: commonBundling,
      tracing: lambda.Tracing.ACTIVE,
      description: 'Processa decisão de aprovação (aprovar/rejeitar)'
    });

    // Lambda: Obter detalhes de aprovação
    this.getApprovalFunction = new nodejs.NodejsFunction(this, 'GetApprovalFunction', {
      functionName: `alquimista-get-approval-${props.envName}`,
      entry: 'lambda/platform/approval-flow.ts',
      handler: 'getHandler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      environment: commonEnvironment,
      bundling: commonBundling,
      tracing: lambda.Tracing.ACTIVE,
      description: 'Obtém detalhes de uma solicitação de aprovação'
    });

    // Lambda: Listar aprovações
    this.listApprovalsFunction = new nodejs.NodejsFunction(this, 'ListApprovalsFunction', {
      functionName: `alquimista-list-approvals-${props.envName}`,
      entry: 'lambda/platform/approval-flow.ts',
      handler: 'listHandler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      environment: commonEnvironment,
      bundling: commonBundling,
      tracing: lambda.Tracing.ACTIVE,
      description: 'Lista solicitações de aprovação do tenant'
    });

    // Lambda: Cancelar aprovação
    this.cancelApprovalFunction = new nodejs.NodejsFunction(this, 'CancelApprovalFunction', {
      functionName: `alquimista-cancel-approval-${props.envName}`,
      entry: 'lambda/platform/approval-flow.ts',
      handler: 'cancelHandler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      environment: commonEnvironment,
      bundling: commonBundling,
      tracing: lambda.Tracing.ACTIVE,
      description: 'Cancela solicitação de aprovação pendente'
    });

    // ========================================
    // Lambda Functions para Autenticação
    // ========================================

    // Lambda: Criar empresa
    this.createCompanyFunction = new nodejs.NodejsFunction(this, 'CreateCompanyFunction', {
      functionName: `alquimista-create-company-${props.envName}`,
      entry: 'lambda/platform/create-company.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      environment: commonEnvironment,
      bundling: commonBundling,
      tracing: lambda.Tracing.ACTIVE,
      description: 'Cria nova empresa no sistema'
    });

    // Lambda: Atualizar empresa
    this.updateCompanyFunction = new nodejs.NodejsFunction(this, 'UpdateCompanyFunction', {
      functionName: `alquimista-update-company-${props.envName}`,
      entry: 'lambda/platform/update-company.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      environment: commonEnvironment,
      bundling: commonBundling,
      tracing: lambda.Tracing.ACTIVE,
      description: 'Atualiza dados da empresa'
    });

    // Lambda: Upload de logo
    this.uploadLogoFunction = new nodejs.NodejsFunction(this, 'UploadLogoFunction', {
      functionName: `alquimista-upload-logo-${props.envName}`,
      entry: 'lambda/platform/upload-logo.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(30),
      environment: {
        ...commonEnvironment,
        LOGOS_BUCKET: `alquimistaai-logos-${props.envName}`
      },
      bundling: commonBundling,
      tracing: lambda.Tracing.ACTIVE,
      description: 'Faz upload de logomarca da empresa'
    });

    // Lambda: Criar usuário
    this.createUserFunction = new nodejs.NodejsFunction(this, 'CreateUserFunction', {
      functionName: `alquimista-create-user-${props.envName}`,
      entry: 'lambda/platform/create-user.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      environment: commonEnvironment,
      bundling: commonBundling,
      tracing: lambda.Tracing.ACTIVE,
      description: 'Cria novo usuário no sistema'
    });

    // Lambda: Atualizar usuário
    this.updateUserFunction = new nodejs.NodejsFunction(this, 'UpdateUserFunction', {
      functionName: `alquimista-update-user-${props.envName}`,
      entry: 'lambda/platform/update-user.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      environment: commonEnvironment,
      bundling: commonBundling,
      tracing: lambda.Tracing.ACTIVE,
      description: 'Atualiza dados do usuário'
    });

    // Lambda: Obter usuário
    this.getUserFunction = new nodejs.NodejsFunction(this, 'GetUserFunction', {
      functionName: `alquimista-get-user-${props.envName}`,
      entry: 'lambda/platform/get-user.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      environment: commonEnvironment,
      bundling: commonBundling,
      tracing: lambda.Tracing.ACTIVE,
      description: 'Obtém dados do usuário'
    });

    // Lambda: Conectar integração
    this.connectIntegrationFunction = new nodejs.NodejsFunction(this, 'ConnectIntegrationFunction', {
      functionName: `alquimista-connect-integration-${props.envName}`,
      entry: 'lambda/platform/connect-integration.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      environment: commonEnvironment,
      bundling: commonBundling,
      tracing: lambda.Tracing.ACTIVE,
      description: 'Conecta integração externa'
    });

    // Lambda: Desconectar integração
    this.disconnectIntegrationFunction = new nodejs.NodejsFunction(this, 'DisconnectIntegrationFunction', {
      functionName: `alquimista-disconnect-integration-${props.envName}`,
      entry: 'lambda/platform/disconnect-integration.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      environment: commonEnvironment,
      bundling: commonBundling,
      tracing: lambda.Tracing.ACTIVE,
      description: 'Desconecta integração externa'
    });

    // Lambda: Listar integrações
    this.listIntegrationsFunction = new nodejs.NodejsFunction(this, 'ListIntegrationsFunction', {
      functionName: `alquimista-list-integrations-${props.envName}`,
      entry: 'lambda/platform/list-integrations.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      environment: commonEnvironment,
      bundling: commonBundling,
      tracing: lambda.Tracing.ACTIVE,
      description: 'Lista integrações do tenant'
    });

    // ========================================
    // Lambda Functions para Sistema de Trials
    // ========================================

    // Lambda: Iniciar trial
    this.trialStartFunction = new nodejs.NodejsFunction(this, 'TrialStartFunction', {
      functionName: `alquimista-trial-start-${props.envName}`,
      entry: 'lambda/platform/trial-start.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      environment: commonEnvironment,
      bundling: commonBundling,
      tracing: lambda.Tracing.ACTIVE,
      description: 'Inicia ou recupera trial de agente/SubNúcleo'
    });

    // Lambda: Processar interação de trial
    this.trialInvokeFunction = new nodejs.NodejsFunction(this, 'TrialInvokeFunction', {
      functionName: `alquimista-trial-invoke-${props.envName}`,
      entry: 'lambda/platform/trial-invoke.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(30),
      environment: commonEnvironment,
      bundling: commonBundling,
      tracing: lambda.Tracing.ACTIVE,
      description: 'Processa mensagem de trial e valida limites'
    });

    // ========================================
    // Lambda Functions para Contato Comercial
    // ========================================

    // Lambda: Processar contato comercial
    this.commercialContactFunction = new nodejs.NodejsFunction(this, 'CommercialContactFunction', {
      functionName: `alquimista-commercial-contact-${props.envName}`,
      entry: 'lambda/platform/commercial-contact.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: {
        ...commonEnvironment,
        COMMERCIAL_EMAIL_FROM: 'noreply@alquimista.ai',
        COMMERCIAL_EMAIL_TO: 'alquimistafibonacci@gmail.com'
      },
      bundling: commonBundling,
      tracing: lambda.Tracing.ACTIVE,
      description: 'Processa solicitações de contato comercial'
    });

    // ========================================
    // Conceder Permissões às Lambdas
    // ========================================

    // Todas as Lambdas precisam acessar o banco de dados
    props.dbSecret.grantRead(this.listAgentsFunction);
    props.dbSecret.grantRead(this.activateAgentFunction);
    props.dbSecret.grantRead(this.deactivateAgentFunction);
    props.dbSecret.grantRead(this.auditLogFunction);
    props.dbSecret.grantRead(this.agentMetricsFunction);
    props.dbSecret.grantRead(this.createApprovalFunction);
    props.dbSecret.grantRead(this.decideApprovalFunction);
    props.dbSecret.grantRead(this.getApprovalFunction);
    props.dbSecret.grantRead(this.listApprovalsFunction);
    props.dbSecret.grantRead(this.cancelApprovalFunction);

    // Lambdas de ativação/desativação precisam publicar eventos
    props.eventBus.grantPutEventsTo(this.activateAgentFunction);
    props.eventBus.grantPutEventsTo(this.deactivateAgentFunction);
    
    // Lambdas de aprovação precisam publicar eventos
    props.eventBus.grantPutEventsTo(this.createApprovalFunction);
    props.eventBus.grantPutEventsTo(this.decideApprovalFunction);
    props.eventBus.grantPutEventsTo(this.cancelApprovalFunction);

    // Lambdas de autenticação precisam acessar o banco
    props.dbSecret.grantRead(this.createCompanyFunction);
    props.dbSecret.grantRead(this.updateCompanyFunction);
    props.dbSecret.grantRead(this.uploadLogoFunction);
    props.dbSecret.grantRead(this.createUserFunction);
    props.dbSecret.grantRead(this.updateUserFunction);
    props.dbSecret.grantRead(this.getUserFunction);
    props.dbSecret.grantRead(this.connectIntegrationFunction);
    props.dbSecret.grantRead(this.disconnectIntegrationFunction);
    props.dbSecret.grantRead(this.listIntegrationsFunction);

    // Lambdas de trials precisam acessar o banco
    props.dbSecret.grantRead(this.trialStartFunction);
    props.dbSecret.grantRead(this.trialInvokeFunction);

    // Lambda de contato comercial precisa acessar o banco e enviar e-mails
    props.dbSecret.grantRead(this.commercialContactFunction);
    // Permissão para enviar e-mails via SES será adicionada via IAM policy

    // ========================================
    // HTTP API Gateway para Marketplace
    // ========================================

    this.platformApi = new apigatewayv2.HttpApi(this, 'PlatformApi', {
      apiName: `alquimista-platform-api-${props.envName}`,
      description: 'Alquimista Platform API - Marketplace e Gestão de Agentes',
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [
          apigatewayv2.CorsHttpMethod.GET,
          apigatewayv2.CorsHttpMethod.POST,
          apigatewayv2.CorsHttpMethod.PUT,
          apigatewayv2.CorsHttpMethod.DELETE,
          apigatewayv2.CorsHttpMethod.OPTIONS
        ],
        allowHeaders: ['Content-Type', 'Authorization'],
        maxAge: cdk.Duration.days(1)
      }
    });

    // ========================================
    // Cognito Authorizer para API Gateway
    // ========================================
    
    // Usar o authorizer compartilhado criado no FibonacciStack
    // para evitar erro "There is already a Construct with name 'UserPoolAuthorizerClient'"
    const cognitoAuthorizer = props.cognitoAuthorizer;

    // ========================================
    // Integrações Lambda
    // ========================================

    const listAgentsIntegration = new integrations.HttpLambdaIntegration(
      'ListAgentsIntegration',
      this.listAgentsFunction,
      {
        payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0
      }
    );

    const activateAgentIntegration = new integrations.HttpLambdaIntegration(
      'ActivateAgentIntegration',
      this.activateAgentFunction,
      {
        payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0
      }
    );

    const deactivateAgentIntegration = new integrations.HttpLambdaIntegration(
      'DeactivateAgentIntegration',
      this.deactivateAgentFunction,
      {
        payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0
      }
    );

    const auditLogIntegration = new integrations.HttpLambdaIntegration(
      'AuditLogIntegration',
      this.auditLogFunction,
      {
        payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0
      }
    );

    const agentMetricsIntegration = new integrations.HttpLambdaIntegration(
      'AgentMetricsIntegration',
      this.agentMetricsFunction,
      {
        payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0
      }
    );

    const createApprovalIntegration = new integrations.HttpLambdaIntegration(
      'CreateApprovalIntegration',
      this.createApprovalFunction,
      {
        payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0
      }
    );

    const decideApprovalIntegration = new integrations.HttpLambdaIntegration(
      'DecideApprovalIntegration',
      this.decideApprovalFunction,
      {
        payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0
      }
    );

    const getApprovalIntegration = new integrations.HttpLambdaIntegration(
      'GetApprovalIntegration',
      this.getApprovalFunction,
      {
        payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0
      }
    );

    const listApprovalsIntegration = new integrations.HttpLambdaIntegration(
      'ListApprovalsIntegration',
      this.listApprovalsFunction,
      {
        payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0
      }
    );

    const cancelApprovalIntegration = new integrations.HttpLambdaIntegration(
      'CancelApprovalIntegration',
      this.cancelApprovalFunction,
      {
        payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0
      }
    );

    // Integrações de autenticação
    const createCompanyIntegration = new integrations.HttpLambdaIntegration(
      'CreateCompanyIntegration',
      this.createCompanyFunction,
      {
        payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0
      }
    );

    const updateCompanyIntegration = new integrations.HttpLambdaIntegration(
      'UpdateCompanyIntegration',
      this.updateCompanyFunction,
      {
        payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0
      }
    );

    const uploadLogoIntegration = new integrations.HttpLambdaIntegration(
      'UploadLogoIntegration',
      this.uploadLogoFunction,
      {
        payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0
      }
    );

    const createUserIntegration = new integrations.HttpLambdaIntegration(
      'CreateUserIntegration',
      this.createUserFunction,
      {
        payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0
      }
    );

    const updateUserIntegration = new integrations.HttpLambdaIntegration(
      'UpdateUserIntegration',
      this.updateUserFunction,
      {
        payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0
      }
    );

    const getUserIntegration = new integrations.HttpLambdaIntegration(
      'GetUserIntegration',
      this.getUserFunction,
      {
        payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0
      }
    );

    const connectIntegrationIntegration = new integrations.HttpLambdaIntegration(
      'ConnectIntegrationIntegration',
      this.connectIntegrationFunction,
      {
        payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0
      }
    );

    const disconnectIntegrationIntegration = new integrations.HttpLambdaIntegration(
      'DisconnectIntegrationIntegration',
      this.disconnectIntegrationFunction,
      {
        payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0
      }
    );

    const listIntegrationsIntegration = new integrations.HttpLambdaIntegration(
      'ListIntegrationsIntegration',
      this.listIntegrationsFunction,
      {
        payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0
      }
    );

    // Integrações de trials
    const trialStartIntegration = new integrations.HttpLambdaIntegration(
      'TrialStartIntegration',
      this.trialStartFunction,
      {
        payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0
      }
    );

    const trialInvokeIntegration = new integrations.HttpLambdaIntegration(
      'TrialInvokeIntegration',
      this.trialInvokeFunction,
      {
        payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0
      }
    );

    // Integração de contato comercial
    const commercialContactIntegration = new integrations.HttpLambdaIntegration(
      'CommercialContactIntegration',
      this.commercialContactFunction,
      {
        payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0
      }
    );

    // ========================================
    // Rotas do API Gateway
    // ========================================

    // GET /api/agents - Listar agentes disponíveis (PÚBLICO - sem autenticação)
    this.platformApi.addRoutes({
      path: '/api/agents',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: listAgentsIntegration
      // Sem authorizer - endpoint público para page AlquimistaAI
    });

    // POST /api/agents/{id}/activate - Ativar agente
    this.platformApi.addRoutes({
      path: '/api/agents/{id}/activate',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: activateAgentIntegration,
      authorizer: cognitoAuthorizer
    });

    // POST /api/agents/{id}/deactivate - Desativar agente
    this.platformApi.addRoutes({
      path: '/api/agents/{id}/deactivate',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: deactivateAgentIntegration,
      authorizer: cognitoAuthorizer
    });

    // GET /api/audit-logs - Consultar logs de auditoria
    this.platformApi.addRoutes({
      path: '/api/audit-logs',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: auditLogIntegration,
      authorizer: cognitoAuthorizer
    });

    // GET /api/agents/{id}/metrics - Obter métricas de um agente específico
    this.platformApi.addRoutes({
      path: '/api/agents/{id}/metrics',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: agentMetricsIntegration,
      authorizer: cognitoAuthorizer
    });

    // GET /api/agents/metrics - Obter métricas de todos os agentes ativos
    this.platformApi.addRoutes({
      path: '/api/agents/metrics',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: agentMetricsIntegration,
      authorizer: cognitoAuthorizer
    });

    // POST /api/approvals - Criar solicitação de aprovação
    this.platformApi.addRoutes({
      path: '/api/approvals',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: createApprovalIntegration,
      authorizer: cognitoAuthorizer
    });

    // GET /api/approvals - Listar aprovações
    this.platformApi.addRoutes({
      path: '/api/approvals',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: listApprovalsIntegration,
      authorizer: cognitoAuthorizer
    });

    // GET /api/approvals/{id} - Obter detalhes de aprovação
    this.platformApi.addRoutes({
      path: '/api/approvals/{id}',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: getApprovalIntegration,
      authorizer: cognitoAuthorizer
    });

    // POST /api/approvals/{id}/decide - Processar decisão de aprovação
    this.platformApi.addRoutes({
      path: '/api/approvals/{id}/decide',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: decideApprovalIntegration,
      authorizer: cognitoAuthorizer
    });

    // DELETE /api/approvals/{id} - Cancelar aprovação
    this.platformApi.addRoutes({
      path: '/api/approvals/{id}',
      methods: [apigatewayv2.HttpMethod.DELETE],
      integration: cancelApprovalIntegration,
      authorizer: cognitoAuthorizer
    });

    // ========================================
    // Rotas de Autenticação
    // ========================================

    // POST /api/companies - Criar empresa (PÚBLICO - usado no cadastro)
    this.platformApi.addRoutes({
      path: '/api/companies',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: createCompanyIntegration
      // Sem authorizer - endpoint público para cadastro
    });

    // GET /api/companies/{tenantId} - Obter dados da empresa
    this.platformApi.addRoutes({
      path: '/api/companies/{tenantId}',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: updateCompanyIntegration,
      authorizer: cognitoAuthorizer
    });

    // PUT /api/companies/{tenantId} - Atualizar empresa
    this.platformApi.addRoutes({
      path: '/api/companies/{tenantId}',
      methods: [apigatewayv2.HttpMethod.PUT],
      integration: updateCompanyIntegration,
      authorizer: cognitoAuthorizer
    });

    // POST /api/upload/logo - Upload de logomarca
    this.platformApi.addRoutes({
      path: '/api/upload/logo',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: uploadLogoIntegration,
      authorizer: cognitoAuthorizer
    });

    // POST /api/users - Criar usuário (PÚBLICO - usado no cadastro)
    this.platformApi.addRoutes({
      path: '/api/users',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: createUserIntegration
      // Sem authorizer - endpoint público para cadastro
    });

    // GET /api/users/{userId} - Obter dados do usuário
    this.platformApi.addRoutes({
      path: '/api/users/{userId}',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: getUserIntegration,
      authorizer: cognitoAuthorizer
    });

    // PUT /api/users/{userId} - Atualizar usuário
    this.platformApi.addRoutes({
      path: '/api/users/{userId}',
      methods: [apigatewayv2.HttpMethod.PUT],
      integration: updateUserIntegration,
      authorizer: cognitoAuthorizer
    });

    // GET /api/integrations - Listar integrações
    this.platformApi.addRoutes({
      path: '/api/integrations',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: listIntegrationsIntegration,
      authorizer: cognitoAuthorizer
    });

    // POST /api/integrations/connect - Conectar integração
    this.platformApi.addRoutes({
      path: '/api/integrations/connect',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: connectIntegrationIntegration,
      authorizer: cognitoAuthorizer
    });

    // POST /api/integrations/disconnect - Desconectar integração
    this.platformApi.addRoutes({
      path: '/api/integrations/disconnect',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: disconnectIntegrationIntegration,
      authorizer: cognitoAuthorizer
    });

    // ========================================
    // Rotas de Trials
    // ========================================

    // POST /api/trials/start - Iniciar trial (PÚBLICO - permite teste sem login)
    this.platformApi.addRoutes({
      path: '/api/trials/start',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: trialStartIntegration
      // Sem authorizer - permite teste sem login
    });

    // POST /api/trials/invoke - Processar mensagem de trial (PÚBLICO)
    this.platformApi.addRoutes({
      path: '/api/trials/invoke',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: trialInvokeIntegration
      // Sem authorizer - permite teste sem login
      // Rate limiting será aplicado no API Gateway
    });

    // ========================================
    // Rotas de Contato Comercial
    // ========================================

    // POST /api/commercial/contact - Enviar solicitação comercial (PÚBLICO)
    this.platformApi.addRoutes({
      path: '/api/commercial/contact',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: commercialContactIntegration
      // Sem authorizer - permite contato sem login
      // Rate limiting será aplicado no API Gateway
    });

    // ========================================
    // CloudFormation Outputs
    // ========================================

    new cdk.CfnOutput(this, 'StackName', {
      value: this.stackName,
      description: 'Alquimista Stack Name',
      exportName: `AlquimistaStackName-${props.envName}`
    });

    new cdk.CfnOutput(this, 'PlatformApiUrl', {
      value: this.platformApi.apiEndpoint,
      description: 'Platform API Gateway URL',
      exportName: `AlquimistaPlatformApiUrl-${props.envName}`
    });

    new cdk.CfnOutput(this, 'PlatformApiId', {
      value: this.platformApi.apiId,
      description: 'Platform API Gateway ID',
      exportName: `AlquimistaPlatformApiId-${props.envName}`
    });

    new cdk.CfnOutput(this, 'ListAgentsFunctionName', {
      value: this.listAgentsFunction.functionName,
      description: 'List Agents Lambda Function Name',
      exportName: `AlquimistaListAgentsFunctionName-${props.envName}`
    });

    new cdk.CfnOutput(this, 'ActivateAgentFunctionName', {
      value: this.activateAgentFunction.functionName,
      description: 'Activate Agent Lambda Function Name',
      exportName: `AlquimistaActivateAgentFunctionName-${props.envName}`
    });

    new cdk.CfnOutput(this, 'DeactivateAgentFunctionName', {
      value: this.deactivateAgentFunction.functionName,
      description: 'Deactivate Agent Lambda Function Name',
      exportName: `AlquimistaDeactivateAgentFunctionName-${props.envName}`
    });

    new cdk.CfnOutput(this, 'AuditLogFunctionName', {
      value: this.auditLogFunction.functionName,
      description: 'Audit Log Lambda Function Name',
      exportName: `AlquimistaAuditLogFunctionName-${props.envName}`
    });

    new cdk.CfnOutput(this, 'AgentMetricsFunctionName', {
      value: this.agentMetricsFunction.functionName,
      description: 'Agent Metrics Lambda Function Name',
      exportName: `AlquimistaAgentMetricsFunctionName-${props.envName}`
    });

    new cdk.CfnOutput(this, 'CreateApprovalFunctionName', {
      value: this.createApprovalFunction.functionName,
      description: 'Create Approval Lambda Function Name',
      exportName: `AlquimistaCreateApprovalFunctionName-${props.envName}`
    });

    new cdk.CfnOutput(this, 'DecideApprovalFunctionName', {
      value: this.decideApprovalFunction.functionName,
      description: 'Decide Approval Lambda Function Name',
      exportName: `AlquimistaDecideApprovalFunctionName-${props.envName}`
    });

    new cdk.CfnOutput(this, 'GetApprovalFunctionName', {
      value: this.getApprovalFunction.functionName,
      description: 'Get Approval Lambda Function Name',
      exportName: `AlquimistaGetApprovalFunctionName-${props.envName}`
    });

    new cdk.CfnOutput(this, 'ListApprovalsFunctionName', {
      value: this.listApprovalsFunction.functionName,
      description: 'List Approvals Lambda Function Name',
      exportName: `AlquimistaListApprovalsFunctionName-${props.envName}`
    });

    new cdk.CfnOutput(this, 'CancelApprovalFunctionName', {
      value: this.cancelApprovalFunction.functionName,
      description: 'Cancel Approval Lambda Function Name',
      exportName: `AlquimistaCancelApprovalFunctionName-${props.envName}`
    });

    new cdk.CfnOutput(this, 'TrialStartFunctionName', {
      value: this.trialStartFunction.functionName,
      description: 'Trial Start Lambda Function Name',
      exportName: `AlquimistaTrialStartFunctionName-${props.envName}`
    });

    new cdk.CfnOutput(this, 'TrialInvokeFunctionName', {
      value: this.trialInvokeFunction.functionName,
      description: 'Trial Invoke Lambda Function Name',
      exportName: `AlquimistaTrialInvokeFunctionName-${props.envName}`
    });

    new cdk.CfnOutput(this, 'CommercialContactFunctionName', {
      value: this.commercialContactFunction.functionName,
      description: 'Commercial Contact Lambda Function Name',
      exportName: `AlquimistaCommercialContactFunctionName-${props.envName}`
    });

    // ========================================
    // Permissões SES para envio de e-mails
    // ========================================

    // Adicionar permissão para enviar e-mails via SES
    this.commercialContactFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ses:SendEmail', 'ses:SendRawEmail'],
        resources: ['*'], // Em produção, restringir para domínios específicos
      })
    );
  }
}
