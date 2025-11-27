import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';
import { NigredoAgentsDashboard } from './dashboards/nigredo-agents-dashboard';
import { BusinessMetricsDashboard } from './dashboards/business-metrics-dashboard';
import { CloudWatchInsightsQueries } from './cloudwatch-insights-queries';
import { NigredoDashboard } from './dashboards/nigredo-dashboard';
import { NigredoInsightsQueries } from './dashboards/nigredo-insights-queries';
import { NigredoAlarms } from './dashboards/nigredo-alarms';

export interface NigredoStackProps extends cdk.StackProps {
  envName: string;
  envConfig: any;
  // Dependências da FibonacciStack
  eventBus: events.EventBus;
  vpc: ec2.Vpc;
  dbCluster: rds.DatabaseCluster;
  dbSecret: rds.DatabaseSecret;
  kmsKey?: any; // KMS key for encryption (optional for backward compatibility)
  /**
   * Web ACL Dev do WAF (opcional - para associação com API Gateway)
   */
  webAclDev?: wafv2.CfnWebACL;
  /**
   * Web ACL Prod do WAF (opcional - para associação com API Gateway)
   */
  webAclProd?: wafv2.CfnWebACL;
}

export class NigredoStack extends cdk.Stack {
  public readonly recebimentoQueue: sqs.Queue;
  public readonly estrategiaQueue: sqs.Queue;
  public readonly disparoQueue: sqs.Queue;
  public readonly atendimentoQueue: sqs.Queue;
  public readonly sentimentoQueue: sqs.Queue;
  public readonly agendamentoQueue: sqs.Queue;
  public readonly relatoriosQueue: sqs.Queue;
  public readonly dlq: sqs.Queue;
  public readonly recebimentoLambda: nodejs.NodejsFunction;
  public readonly estrategiaLambda: nodejs.NodejsFunction;
  public readonly disparoLambda: nodejs.NodejsFunction;
  public readonly atendimentoLambda: nodejs.NodejsFunction;
  public readonly sentimentoLambda: nodejs.NodejsFunction;
  public readonly agendamentoLambda: nodejs.NodejsFunction;
  // API Lambda Functions
  public readonly createLeadLambda: nodejs.NodejsFunction;
  public readonly listLeadsLambda: nodejs.NodejsFunction;
  public readonly getLeadLambda: nodejs.NodejsFunction;
  // API Gateway
  public readonly httpApi: apigatewayv2.HttpApi;

  constructor(scope: Construct, id: string, props: NigredoStackProps) {
    super(scope, id, props);

    // ========================================
    // Dead Letter Queue compartilhada
    // ========================================
    this.dlq = new sqs.Queue(this, 'NigredoDlq', {
      queueName: `nigredo-dlq-${props.envName}`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: props.kmsKey ? sqs.QueueEncryption.KMS : sqs.QueueEncryption.SQS_MANAGED,
      encryptionMasterKey: props.kmsKey
    });

    // ========================================
    // Filas SQS específicas para cada agente
    // ========================================

    // Fila para Agente de Recebimento
    this.recebimentoQueue = new sqs.Queue(this, 'RecebimentoQueue', {
      queueName: `nigredo-recebimento-${props.envName}`,
      visibilityTimeout: cdk.Duration.seconds(60), // Tempo para processar planilhas
      receiveMessageWaitTime: cdk.Duration.seconds(10), // Long polling
      deadLetterQueue: {
        queue: this.dlq,
        maxReceiveCount: 3
      },
      encryption: props.kmsKey ? sqs.QueueEncryption.KMS : sqs.QueueEncryption.SQS_MANAGED,
      encryptionMasterKey: props.kmsKey
    });

    // Fila para Agente de Estratégia
    this.estrategiaQueue = new sqs.Queue(this, 'EstrategiaQueue', {
      queueName: `nigredo-estrategia-${props.envName}`,
      visibilityTimeout: cdk.Duration.seconds(120), // Tempo para criar campanhas
      receiveMessageWaitTime: cdk.Duration.seconds(10),
      deadLetterQueue: {
        queue: this.dlq,
        maxReceiveCount: 3
      },
      encryption: props.kmsKey ? sqs.QueueEncryption.KMS : sqs.QueueEncryption.SQS_MANAGED,
      encryptionMasterKey: props.kmsKey
    });

    // Fila para Agente de Disparo
    this.disparoQueue = new sqs.Queue(this, 'DisparoQueue', {
      queueName: `nigredo-disparo-${props.envName}`,
      visibilityTimeout: cdk.Duration.seconds(30), // Tempo para enviar mensagens
      receiveMessageWaitTime: cdk.Duration.seconds(10),
      deadLetterQueue: {
        queue: this.dlq,
        maxReceiveCount: 3
      },
      encryption: props.kmsKey ? sqs.QueueEncryption.KMS : sqs.QueueEncryption.SQS_MANAGED,
      encryptionMasterKey: props.kmsKey
    });

    // Fila para Agente de Atendimento
    this.atendimentoQueue = new sqs.Queue(this, 'AtendimentoQueue', {
      queueName: `nigredo-atendimento-${props.envName}`,
      visibilityTimeout: cdk.Duration.seconds(30), // Tempo para responder leads
      receiveMessageWaitTime: cdk.Duration.seconds(10),
      deadLetterQueue: {
        queue: this.dlq,
        maxReceiveCount: 3
      },
      encryption: props.kmsKey ? sqs.QueueEncryption.KMS : sqs.QueueEncryption.SQS_MANAGED,
      encryptionMasterKey: props.kmsKey
    });

    // Fila para Agente de Análise de Sentimento
    this.sentimentoQueue = new sqs.Queue(this, 'SentimentoQueue', {
      queueName: `nigredo-sentimento-${props.envName}`,
      visibilityTimeout: cdk.Duration.seconds(10), // Análise rápida
      receiveMessageWaitTime: cdk.Duration.seconds(10),
      deadLetterQueue: {
        queue: this.dlq,
        maxReceiveCount: 3
      },
      encryption: props.kmsKey ? sqs.QueueEncryption.KMS : sqs.QueueEncryption.SQS_MANAGED,
      encryptionMasterKey: props.kmsKey
    });

    // Fila para Agente de Agendamento
    this.agendamentoQueue = new sqs.Queue(this, 'AgendamentoQueue', {
      queueName: `nigredo-agendamento-${props.envName}`,
      visibilityTimeout: cdk.Duration.seconds(30), // Tempo para agendar reuniões
      receiveMessageWaitTime: cdk.Duration.seconds(10),
      deadLetterQueue: {
        queue: this.dlq,
        maxReceiveCount: 3
      },
      encryption: props.kmsKey ? sqs.QueueEncryption.KMS : sqs.QueueEncryption.SQS_MANAGED,
      encryptionMasterKey: props.kmsKey
    });

    // Fila para Agente de Relatórios
    this.relatoriosQueue = new sqs.Queue(this, 'RelatoriosQueue', {
      queueName: `nigredo-relatorios-${props.envName}`,
      visibilityTimeout: cdk.Duration.seconds(120), // Tempo para gerar relatórios
      receiveMessageWaitTime: cdk.Duration.seconds(10),
      deadLetterQueue: {
        queue: this.dlq,
        maxReceiveCount: 3
      },
      encryption: props.kmsKey ? sqs.QueueEncryption.KMS : sqs.QueueEncryption.SQS_MANAGED,
      encryptionMasterKey: props.kmsKey
    });

    // ========================================
    // EventBridge Rules para rotear eventos nigredo.*
    // ========================================

    // Regra para eventos de recebimento (nigredo.recebimento.*)
    new events.Rule(this, 'RecebimentoRule', {
      eventBus: props.eventBus,
      ruleName: `nigredo-recebimento-${props.envName}`,
      description: 'Route nigredo.recebimento.* events to Recebimento Queue',
      eventPattern: {
        source: events.Match.prefix('nigredo.recebimento')
      },
      targets: [new targets.SqsQueue(this.recebimentoQueue)]
    });

    // Regra para eventos de estratégia (nigredo.estrategia.*)
    new events.Rule(this, 'EstrategiaRule', {
      eventBus: props.eventBus,
      ruleName: `nigredo-estrategia-${props.envName}`,
      description: 'Route nigredo.estrategia.* events to Estrategia Queue',
      eventPattern: {
        source: events.Match.prefix('nigredo.estrategia')
      },
      targets: [new targets.SqsQueue(this.estrategiaQueue)]
    });

    // Regra para eventos de disparo (nigredo.disparo.*)
    new events.Rule(this, 'DisparoRule', {
      eventBus: props.eventBus,
      ruleName: `nigredo-disparo-${props.envName}`,
      description: 'Route nigredo.disparo.* events to Disparo Queue',
      eventPattern: {
        source: events.Match.prefix('nigredo.disparo')
      },
      targets: [new targets.SqsQueue(this.disparoQueue)]
    });

    // Regra para eventos de atendimento (nigredo.atendimento.*)
    new events.Rule(this, 'AtendimentoRule', {
      eventBus: props.eventBus,
      ruleName: `nigredo-atendimento-${props.envName}`,
      description: 'Route nigredo.atendimento.* events to Atendimento Queue',
      eventPattern: {
        source: events.Match.prefix('nigredo.atendimento')
      },
      targets: [new targets.SqsQueue(this.atendimentoQueue)]
    });

    // Regra para eventos de sentimento (nigredo.sentimento.*)
    new events.Rule(this, 'SentimentoRule', {
      eventBus: props.eventBus,
      ruleName: `nigredo-sentimento-${props.envName}`,
      description: 'Route nigredo.sentimento.* events to Sentimento Queue',
      eventPattern: {
        source: events.Match.prefix('nigredo.sentimento')
      },
      targets: [new targets.SqsQueue(this.sentimentoQueue)]
    });

    // Regra para eventos de agendamento (nigredo.agendamento.*)
    new events.Rule(this, 'AgendamentoRule', {
      eventBus: props.eventBus,
      ruleName: `nigredo-agendamento-${props.envName}`,
      description: 'Route nigredo.agendamento.* events to Agendamento Queue',
      eventPattern: {
        source: events.Match.prefix('nigredo.agendamento')
      },
      targets: [new targets.SqsQueue(this.agendamentoQueue)]
    });

    // Regra para eventos de relatórios (nigredo.relatorios.*)
    new events.Rule(this, 'RelatoriosRule', {
      eventBus: props.eventBus,
      ruleName: `nigredo-relatorios-${props.envName}`,
      description: 'Route nigredo.relatorios.* events to Relatorios Queue',
      eventPattern: {
        source: events.Match.prefix('nigredo.relatorios')
      },
      targets: [new targets.SqsQueue(this.relatoriosQueue)]
    });

    // ========================================
    // Lambda Functions - Agentes Nigredo
    // ========================================

    // Agente de Recebimento Lambda
    this.recebimentoLambda = new nodejs.NodejsFunction(this, 'RecebimentoLambda', {
      functionName: `nigredo-recebimento-${props.envName}`,
      entry: 'lambda/agents/recebimento.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(60),
      environment: {
        POWERTOOLS_SERVICE_NAME: 'nigredo-recebimento',
        LOG_LEVEL: props.envName === 'prod' ? 'INFO' : 'DEBUG',
        EVENT_BUS_NAME: props.eventBus.eventBusName,
        DB_SECRET_ARN: props.dbSecret.secretArn,
        DLQ_URL: this.dlq.queueUrl,
        NODE_OPTIONS: '--enable-source-maps'
      },
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'es2021',
        externalModules: ['aws-sdk']
      },
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED
      },
      tracing: lambda.Tracing.ACTIVE,
      description: 'Agente de Recebimento - Higieniza, valida e enriquece leads'
    });

    // Configurar trigger SQS para Recebimento Lambda
    this.recebimentoLambda.addEventSource(new SqsEventSource(this.recebimentoQueue, {
      batchSize: 10,
      maxBatchingWindow: cdk.Duration.seconds(5),
      reportBatchItemFailures: true
    }));

    // Conceder permissões para EventBridge
    props.eventBus.grantPutEventsTo(this.recebimentoLambda);

    // Conceder permissões para Secrets Manager
    props.dbSecret.grantRead(this.recebimentoLambda);

    // Conceder permissões para Aurora (via Security Group)
    const dbSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(
      this,
      'DbSecurityGroup',
      props.dbCluster.connections.securityGroups[0].securityGroupId
    );

    this.recebimentoLambda.connections.allowTo(
      dbSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Recebimento Lambda to access Aurora'
    );

    // Conceder permissões para DLQ
    this.dlq.grantSendMessages(this.recebimentoLambda);

    // Adicionar política para MCP Enrichment (Secrets Manager)
    this.recebimentoLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['secretsmanager:GetSecretValue'],
      resources: [
        `arn:aws:secretsmanager:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:secret:fibonacci/mcp/*`
      ]
    }));

    // Agente de Estratégia Lambda
    this.estrategiaLambda = new nodejs.NodejsFunction(this, 'EstrategiaLambda', {
      functionName: `nigredo-estrategia-${props.envName}`,
      entry: 'lambda/agents/estrategia.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(120),
      environment: {
        POWERTOOLS_SERVICE_NAME: 'nigredo-estrategia',
        LOG_LEVEL: props.envName === 'prod' ? 'INFO' : 'DEBUG',
        EVENT_BUS_NAME: props.eventBus.eventBusName,
        DB_SECRET_ARN: props.dbSecret.secretArn,
        DLQ_URL: this.dlq.queueUrl,
        NODE_OPTIONS: '--enable-source-maps'
      },
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'es2021',
        externalModules: ['aws-sdk']
      },
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED
      },
      tracing: lambda.Tracing.ACTIVE,
      description: 'Agente de Estratégia - Cria campanhas segmentadas com mensagens personalizadas'
    });

    // Configurar trigger do EventBridge para Estrategia Lambda
    // Trigger quando evento nigredo.recebimento.completed é publicado
    const estrategiaRule = new events.Rule(this, 'EstrategiaEventRule', {
      eventBus: props.eventBus,
      ruleName: `nigredo-estrategia-trigger-${props.envName}`,
      description: 'Trigger Estrategia Lambda when recebimento completes',
      eventPattern: {
        source: ['nigredo.recebimento'],
        detailType: ['recebimento.completed']
      },
      targets: [new targets.LambdaFunction(this.estrategiaLambda)]
    });

    // Conceder permissões para EventBridge
    props.eventBus.grantPutEventsTo(this.estrategiaLambda);

    // Conceder permissões para Secrets Manager
    props.dbSecret.grantRead(this.estrategiaLambda);

    // Conceder permissões para Aurora (via Security Group)
    this.estrategiaLambda.connections.allowTo(
      dbSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Estrategia Lambda to access Aurora'
    );

    // Conceder permissões para DLQ
    this.dlq.grantSendMessages(this.estrategiaLambda);

    // Adicionar política para MCP Enrichment (Secrets Manager)
    this.estrategiaLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['secretsmanager:GetSecretValue'],
      resources: [
        `arn:aws:secretsmanager:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:secret:fibonacci/mcp/*`
      ]
    }));

    // Agente de Disparo Lambda
    this.disparoLambda = new nodejs.NodejsFunction(this, 'DisparoLambda', {
      functionName: `nigredo-disparo-${props.envName}`,
      entry: 'lambda/agents/disparo.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: {
        POWERTOOLS_SERVICE_NAME: 'nigredo-disparo',
        LOG_LEVEL: props.envName === 'prod' ? 'INFO' : 'DEBUG',
        EVENT_BUS_NAME: props.eventBus.eventBusName,
        DB_SECRET_ARN: props.dbSecret.secretArn,
        DLQ_URL: this.dlq.queueUrl,
        NODE_OPTIONS: '--enable-source-maps'
      },
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'es2021',
        externalModules: ['aws-sdk']
      },
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED
      },
      tracing: lambda.Tracing.ACTIVE,
      description: 'Agente de Disparo - Envia mensagens respeitando horário comercial e rate limits'
    });

    // Configurar trigger do EventBridge Scheduler (cron) para Disparo Lambda
    // Executar a cada 15 minutos durante horário comercial (08h-18h, seg-sex)
    const disparoScheduleRule = new events.Rule(this, 'DisparoScheduleRule', {
      ruleName: `nigredo-disparo-schedule-${props.envName}`,
      description: 'Trigger Disparo Lambda every 15 minutes during business hours',
      // Executar de 15 em 15 minutos, de segunda a sexta, das 8h às 18h (horário UTC-3 = UTC+3)
      // Cron: minuto hora dia-do-mês mês dia-da-semana ano
      // 8h BRT = 11h UTC, 18h BRT = 21h UTC
      schedule: events.Schedule.cron({
        minute: '0,15,30,45',
        hour: '11-20', // 8h-17h BRT (última execução às 17:45)
        weekDay: 'MON-FRI'
      }),
      targets: [new targets.LambdaFunction(this.disparoLambda)]
    });

    // Conceder permissões para EventBridge
    props.eventBus.grantPutEventsTo(this.disparoLambda);

    // Conceder permissões para Secrets Manager
    props.dbSecret.grantRead(this.disparoLambda);

    // Conceder permissões para Aurora (via Security Group)
    this.disparoLambda.connections.allowTo(
      dbSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Disparo Lambda to access Aurora'
    );

    // Conceder permissões para DLQ
    this.dlq.grantSendMessages(this.disparoLambda);

    // Adicionar política para MCP WhatsApp (Secrets Manager)
    this.disparoLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['secretsmanager:GetSecretValue'],
      resources: [
        `arn:aws:secretsmanager:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:secret:fibonacci/mcp/*`
      ]
    }));

    // Agente de Atendimento Lambda
    this.atendimentoLambda = new nodejs.NodejsFunction(this, 'AtendimentoLambda', {
      functionName: `nigredo-atendimento-${props.envName}`,
      entry: 'lambda/agents/atendimento.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(30),
      environment: {
        POWERTOOLS_SERVICE_NAME: 'nigredo-atendimento',
        LOG_LEVEL: props.envName === 'prod' ? 'INFO' : 'DEBUG',
        EVENT_BUS_NAME: props.eventBus.eventBusName,
        DB_SECRET_ARN: props.dbSecret.secretArn,
        DLQ_URL: this.dlq.queueUrl,
        SENTIMENT_LAMBDA_ARN: '', // Will be set after Sentiment Lambda is created
        NODE_OPTIONS: '--enable-source-maps'
      },
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'es2021',
        externalModules: ['aws-sdk', '@aws-sdk/client-bedrock-runtime']
      },
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED
      },
      tracing: lambda.Tracing.ACTIVE,
      description: 'Agente de Atendimento - Responde leads com IA usando análise de sentimento'
    });

    // Conceder permissões para EventBridge
    props.eventBus.grantPutEventsTo(this.atendimentoLambda);

    // Conceder permissões para Secrets Manager
    props.dbSecret.grantRead(this.atendimentoLambda);

    // Conceder permissões para Aurora (via Security Group)
    this.atendimentoLambda.connections.allowTo(
      dbSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Atendimento Lambda to access Aurora'
    );

    // Conceder permissões para DLQ
    this.dlq.grantSendMessages(this.atendimentoLambda);

    // Adicionar política para MCP WhatsApp (Secrets Manager)
    this.atendimentoLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['secretsmanager:GetSecretValue'],
      resources: [
        `arn:aws:secretsmanager:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:secret:fibonacci/mcp/*`
      ]
    }));

    // Adicionar política para invocar Sentiment Lambda
    this.atendimentoLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [
        `arn:aws:lambda:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:function:nigredo-sentimento-${props.envName}`
      ]
    }));

    // Adicionar política para Bedrock (LLM)
    this.atendimentoLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'bedrock:InvokeModel',
        'bedrock:InvokeModelWithResponseStream'
      ],
      resources: [
        `arn:aws:bedrock:${cdk.Stack.of(this).region}::foundation-model/anthropic.claude-3-haiku-20240307-v1:0`
      ]
    }));

    // Agente de Análise de Sentimento Lambda
    this.sentimentoLambda = new nodejs.NodejsFunction(this, 'SentimentoLambda', {
      functionName: `nigredo-sentimento-${props.envName}`,
      entry: 'lambda/agents/sentimento.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      environment: {
        POWERTOOLS_SERVICE_NAME: 'nigredo-sentimento',
        LOG_LEVEL: props.envName === 'prod' ? 'INFO' : 'DEBUG',
        NODE_OPTIONS: '--enable-source-maps'
      },
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'es2021',
        externalModules: ['aws-sdk']
      },
      tracing: lambda.Tracing.ACTIVE,
      description: 'Agente de Análise de Sentimento - Classifica sentimento e detecta descadastro (LGPD)'
    });

    // Conceder permissões para AWS Comprehend
    this.sentimentoLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'comprehend:DetectSentiment',
        'comprehend:DetectKeyPhrases',
        'comprehend:BatchDetectSentiment',
        'comprehend:BatchDetectKeyPhrases'
      ],
      resources: ['*'] // Comprehend doesn't support resource-level permissions
    }));

    // Update Atendimento Lambda environment with Sentiment Lambda ARN
    this.atendimentoLambda.addEnvironment(
      'SENTIMENT_LAMBDA_ARN',
      this.sentimentoLambda.functionArn
    );

    // Grant Atendimento Lambda permission to invoke Sentiment Lambda
    this.sentimentoLambda.grantInvoke(this.atendimentoLambda);

    // Agente de Agendamento Lambda
    this.agendamentoLambda = new nodejs.NodejsFunction(this, 'AgendamentoLambda', {
      functionName: `nigredo-agendamento-${props.envName}`,
      entry: 'lambda/agents/agendamento.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: {
        POWERTOOLS_SERVICE_NAME: 'nigredo-agendamento',
        LOG_LEVEL: props.envName === 'prod' ? 'INFO' : 'DEBUG',
        EVENT_BUS_NAME: props.eventBus.eventBusName,
        DB_SECRET_ARN: props.dbSecret.secretArn,
        DLQ_URL: this.dlq.queueUrl,
        NODE_OPTIONS: '--enable-source-maps'
      },
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'es2021',
        externalModules: ['aws-sdk']
      },
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED
      },
      tracing: lambda.Tracing.ACTIVE,
      description: 'Agente de Agendamento - Marca reuniões verificando disponibilidade em tempo real'
    });

    // Configurar trigger do EventBridge para Agendamento Lambda
    // Trigger quando evento nigredo.atendimento.schedule_requested é publicado
    new events.Rule(this, 'AgendamentoEventRule', {
      eventBus: props.eventBus,
      ruleName: `nigredo-agendamento-trigger-${props.envName}`,
      description: 'Trigger Agendamento Lambda when schedule is requested',
      eventPattern: {
        source: ['nigredo.atendimento'],
        detailType: ['schedule_requested']
      },
      targets: [new targets.LambdaFunction(this.agendamentoLambda)]
    });

    // Conceder permissões para EventBridge
    props.eventBus.grantPutEventsTo(this.agendamentoLambda);

    // Conceder permissões para Secrets Manager
    props.dbSecret.grantRead(this.agendamentoLambda);

    // Conceder permissões para Aurora (via Security Group)
    this.agendamentoLambda.connections.allowTo(
      dbSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Agendamento Lambda to access Aurora'
    );

    // Conceder permissões para DLQ
    this.dlq.grantSendMessages(this.agendamentoLambda);

    // Adicionar política para MCP Calendar e WhatsApp (Secrets Manager)
    this.agendamentoLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['secretsmanager:GetSecretValue'],
      resources: [
        `arn:aws:secretsmanager:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:secret:fibonacci/mcp/*`
      ]
    }));

    // ========================================
    // CloudFormation Outputs
    // ========================================

    new cdk.CfnOutput(this, 'RecebimentoQueueUrl', {
      value: this.recebimentoQueue.queueUrl,
      description: 'Nigredo Recebimento Queue URL',
      exportName: `NigredoRecebimentoQueueUrl-${props.envName}`
    });

    new cdk.CfnOutput(this, 'RecebimentoQueueArn', {
      value: this.recebimentoQueue.queueArn,
      description: 'Nigredo Recebimento Queue ARN',
      exportName: `NigredoRecebimentoQueueArn-${props.envName}`
    });

    new cdk.CfnOutput(this, 'EstrategiaQueueUrl', {
      value: this.estrategiaQueue.queueUrl,
      description: 'Nigredo Estrategia Queue URL',
      exportName: `NigredoEstrategiaQueueUrl-${props.envName}`
    });

    new cdk.CfnOutput(this, 'EstrategiaQueueArn', {
      value: this.estrategiaQueue.queueArn,
      description: 'Nigredo Estrategia Queue ARN',
      exportName: `NigredoEstrategiaQueueArn-${props.envName}`
    });

    new cdk.CfnOutput(this, 'DisparoQueueUrl', {
      value: this.disparoQueue.queueUrl,
      description: 'Nigredo Disparo Queue URL',
      exportName: `NigredoDisparoQueueUrl-${props.envName}`
    });

    new cdk.CfnOutput(this, 'DisparoQueueArn', {
      value: this.disparoQueue.queueArn,
      description: 'Nigredo Disparo Queue ARN',
      exportName: `NigredoDisparoQueueArn-${props.envName}`
    });

    new cdk.CfnOutput(this, 'AtendimentoQueueUrl', {
      value: this.atendimentoQueue.queueUrl,
      description: 'Nigredo Atendimento Queue URL',
      exportName: `NigredoAtendimentoQueueUrl-${props.envName}`
    });

    new cdk.CfnOutput(this, 'AtendimentoQueueArn', {
      value: this.atendimentoQueue.queueArn,
      description: 'Nigredo Atendimento Queue ARN',
      exportName: `NigredoAtendimentoQueueArn-${props.envName}`
    });

    new cdk.CfnOutput(this, 'SentimentoQueueUrl', {
      value: this.sentimentoQueue.queueUrl,
      description: 'Nigredo Sentimento Queue URL',
      exportName: `NigredoSentimentoQueueUrl-${props.envName}`
    });

    new cdk.CfnOutput(this, 'SentimentoQueueArn', {
      value: this.sentimentoQueue.queueArn,
      description: 'Nigredo Sentimento Queue ARN',
      exportName: `NigredoSentimentoQueueArn-${props.envName}`
    });

    new cdk.CfnOutput(this, 'AgendamentoQueueUrl', {
      value: this.agendamentoQueue.queueUrl,
      description: 'Nigredo Agendamento Queue URL',
      exportName: `NigredoAgendamentoQueueUrl-${props.envName}`
    });

    new cdk.CfnOutput(this, 'AgendamentoQueueArn', {
      value: this.agendamentoQueue.queueArn,
      description: 'Nigredo Agendamento Queue ARN',
      exportName: `NigredoAgendamentoQueueArn-${props.envName}`
    });

    new cdk.CfnOutput(this, 'RelatoriosQueueUrl', {
      value: this.relatoriosQueue.queueUrl,
      description: 'Nigredo Relatorios Queue URL',
      exportName: `NigredoRelatoriosQueueUrl-${props.envName}`
    });

    new cdk.CfnOutput(this, 'RelatoriosQueueArn', {
      value: this.relatoriosQueue.queueArn,
      description: 'Nigredo Relatorios Queue ARN',
      exportName: `NigredoRelatoriosQueueArn-${props.envName}`
    });

    new cdk.CfnOutput(this, 'NigredoDlqUrl', {
      value: this.dlq.queueUrl,
      description: 'Nigredo Dead Letter Queue URL',
      exportName: `NigredoDlqUrl-${props.envName}`
    });

    new cdk.CfnOutput(this, 'NigredoDlqArn', {
      value: this.dlq.queueArn,
      description: 'Nigredo Dead Letter Queue ARN',
      exportName: `NigredoDlqArn-${props.envName}`
    });

    new cdk.CfnOutput(this, 'RecebimentoLambdaArn', {
      value: this.recebimentoLambda.functionArn,
      description: 'Nigredo Recebimento Lambda ARN',
      exportName: `NigredoRecebimentoLambdaArn-${props.envName}`
    });

    new cdk.CfnOutput(this, 'RecebimentoLambdaName', {
      value: this.recebimentoLambda.functionName,
      description: 'Nigredo Recebimento Lambda Name',
      exportName: `NigredoRecebimentoLambdaName-${props.envName}`
    });

    new cdk.CfnOutput(this, 'EstrategiaLambdaArn', {
      value: this.estrategiaLambda.functionArn,
      description: 'Nigredo Estrategia Lambda ARN',
      exportName: `NigredoEstrategiaLambdaArn-${props.envName}`
    });

    new cdk.CfnOutput(this, 'EstrategiaLambdaName', {
      value: this.estrategiaLambda.functionName,
      description: 'Nigredo Estrategia Lambda Name',
      exportName: `NigredoEstrategiaLambdaName-${props.envName}`
    });

    new cdk.CfnOutput(this, 'DisparoLambdaArn', {
      value: this.disparoLambda.functionArn,
      description: 'Nigredo Disparo Lambda ARN',
      exportName: `NigredoDisparoLambdaArn-${props.envName}`
    });

    new cdk.CfnOutput(this, 'DisparoLambdaName', {
      value: this.disparoLambda.functionName,
      description: 'Nigredo Disparo Lambda Name',
      exportName: `NigredoDisparoLambdaName-${props.envName}`
    });

    new cdk.CfnOutput(this, 'AtendimentoLambdaArn', {
      value: this.atendimentoLambda.functionArn,
      description: 'Nigredo Atendimento Lambda ARN',
      exportName: `NigredoAtendimentoLambdaArn-${props.envName}`
    });

    new cdk.CfnOutput(this, 'AtendimentoLambdaName', {
      value: this.atendimentoLambda.functionName,
      description: 'Nigredo Atendimento Lambda Name',
      exportName: `NigredoAtendimentoLambdaName-${props.envName}`
    });

    new cdk.CfnOutput(this, 'SentimentoLambdaArn', {
      value: this.sentimentoLambda.functionArn,
      description: 'Nigredo Sentimento Lambda ARN',
      exportName: `NigredoSentimentoLambdaArn-${props.envName}`
    });

    new cdk.CfnOutput(this, 'SentimentoLambdaName', {
      value: this.sentimentoLambda.functionName,
      description: 'Nigredo Sentimento Lambda Name',
      exportName: `NigredoSentimentoLambdaName-${props.envName}`
    });

    new cdk.CfnOutput(this, 'AgendamentoLambdaArn', {
      value: this.agendamentoLambda.functionArn,
      description: 'Nigredo Agendamento Lambda ARN',
      exportName: `NigredoAgendamentoLambdaArn-${props.envName}`
    });

    new cdk.CfnOutput(this, 'AgendamentoLambdaName', {
      value: this.agendamentoLambda.functionName,
      description: 'Nigredo Agendamento Lambda Name',
      exportName: `NigredoAgendamentoLambdaName-${props.envName}`
    });

    // ========================================
    // Agente de Relatórios Lambda
    // ========================================

    const relatoriosLambda = new nodejs.NodejsFunction(this, 'RelatoriosLambda', {
      functionName: `nigredo-relatorios-${props.envName}`,
      entry: 'lambda/agents/relatorios.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(120),
      environment: {
        POWERTOOLS_SERVICE_NAME: 'nigredo-relatorios',
        LOG_LEVEL: props.envName === 'prod' ? 'INFO' : 'DEBUG',
        EVENT_BUS_NAME: props.eventBus.eventBusName,
        DB_SECRET_ARN: props.dbSecret.secretArn,
        DLQ_URL: this.dlq.queueUrl,
        NODE_OPTIONS: '--enable-source-maps'
      },
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'es2021',
        externalModules: ['aws-sdk']
      },
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED
      },
      tracing: lambda.Tracing.ACTIVE,
      description: 'Agente de Relatórios - Gera dashboards e métricas de conversão do funil'
    });

    // Configurar trigger do EventBridge Scheduler (diário às 08h BRT = 11h UTC)
    const relatoriosScheduleRule = new events.Rule(this, 'RelatoriosScheduleRule', {
      ruleName: `nigredo-relatorios-schedule-${props.envName}`,
      description: 'Trigger Relatorios Lambda daily at 8am BRT',
      // Executar diariamente às 8h BRT (11h UTC)
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '11', // 8h BRT = 11h UTC
        weekDay: 'MON-FRI'
      }),
      targets: [new targets.LambdaFunction(relatoriosLambda)]
    });

    // Conceder permissões para EventBridge
    props.eventBus.grantPutEventsTo(relatoriosLambda);

    // Conceder permissões para Secrets Manager
    props.dbSecret.grantRead(relatoriosLambda);

    // Conceder permissões para Aurora (via Security Group)
    relatoriosLambda.connections.allowTo(
      dbSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Relatorios Lambda to access Aurora'
    );

    // Conceder permissões para DLQ
    this.dlq.grantSendMessages(relatoriosLambda);

    // CloudFormation Outputs para Relatórios Lambda
    new cdk.CfnOutput(this, 'RelatoriosLambdaArn', {
      value: relatoriosLambda.functionArn,
      description: 'Nigredo Relatorios Lambda ARN',
      exportName: `NigredoRelatoriosLambdaArn-${props.envName}`
    });

    new cdk.CfnOutput(this, 'RelatoriosLambdaName', {
      value: relatoriosLambda.functionName,
      description: 'Nigredo Relatorios Lambda Name',
      exportName: `NigredoRelatoriosLambdaName-${props.envName}`
    });

    // ========================================
    // CloudWatch Dashboards - Nigredo Agents
    // ========================================
    const nigredoAgentsDashboard = new NigredoAgentsDashboard(this, 'NigredoAgentsDashboard', {
      envName: props.envName,
      recebimentoLambda: this.recebimentoLambda,
      estrategiaLambda: this.estrategiaLambda,
      disparoLambda: this.disparoLambda,
      atendimentoLambda: this.atendimentoLambda,
      sentimentoLambda: this.sentimentoLambda,
      agendamentoLambda: this.agendamentoLambda,
      relatoriosLambda: relatoriosLambda
    });

    new cdk.CfnOutput(this, 'AgentsDashboardName', {
      value: nigredoAgentsDashboard.dashboard.dashboardName,
      description: 'Nigredo Agents Dashboard Name',
      exportName: `NigredoAgentsDashboardName-${props.envName}`
    });

    // ========================================
    // CloudWatch Dashboard - Business Metrics
    // ========================================
    const businessMetricsDashboard = new BusinessMetricsDashboard(this, 'BusinessMetricsDashboard', {
      envName: props.envName,
      recebimentoLambda: this.recebimentoLambda,
      estrategiaLambda: this.estrategiaLambda,
      disparoLambda: this.disparoLambda,
      atendimentoLambda: this.atendimentoLambda,
      agendamentoLambda: this.agendamentoLambda
    });

    new cdk.CfnOutput(this, 'BusinessDashboardName', {
      value: businessMetricsDashboard.dashboard.dashboardName,
      description: 'Business Metrics Dashboard Name',
      exportName: `BusinessMetricsDashboardName-${props.envName}`
    });

    // ========================================
    // CloudWatch Insights Queries - Nigredo Agents
    // ========================================
    // Queries corrigidas com sintaxe válida do CloudWatch Logs Insights
    const nigredoInsightsQueries = new CloudWatchInsightsQueries(this, 'NigredoInsightsQueries', {
      appName: 'nigredo',
      stage: props.envName,
      logGroups: [
        this.recebimentoLambda.logGroup,
        this.estrategiaLambda.logGroup,
        this.disparoLambda.logGroup,
        this.atendimentoLambda.logGroup,
        this.sentimentoLambda.logGroup,
        this.agendamentoLambda.logGroup,
        relatoriosLambda.logGroup
      ]
    });

    // Garante que os log groups existam antes das QueryDefinitions
    nigredoInsightsQueries.node.addDependency(this.recebimentoLambda);
    nigredoInsightsQueries.node.addDependency(this.estrategiaLambda);
    nigredoInsightsQueries.node.addDependency(this.disparoLambda);
    nigredoInsightsQueries.node.addDependency(this.atendimentoLambda);
    nigredoInsightsQueries.node.addDependency(this.sentimentoLambda);
    nigredoInsightsQueries.node.addDependency(this.agendamentoLambda);
    nigredoInsightsQueries.node.addDependency(relatoriosLambda);

    new cdk.CfnOutput(this, 'NigredoInsightsQueryErrorsByAgent', {
      value: nigredoInsightsQueries.errorsByAgentQuery.name!,
      description: 'CloudWatch Insights Query: Erros por Agente Nigredo',
      exportName: `NigredoProspecting-InsightsQueryErrorsByAgent-${props.envName}`
    });

    new cdk.CfnOutput(this, 'NigredoInsightsQueryFunnelConversion', {
      value: nigredoInsightsQueries.funnelConversionQuery.name!,
      description: 'CloudWatch Insights Query: Taxa de Conversão do Funil Nigredo',
      exportName: `NigredoProspecting-ProspectConversionQuery-${props.envName}`
    });

    new cdk.CfnOutput(this, 'NigredoInsightsQueryLeadProcessingTime', {
      value: nigredoInsightsQueries.leadProcessingTimeQuery.name!,
      description: 'CloudWatch Insights Query: Tempo de Processamento de Leads Nigredo',
      exportName: `NigredoProspecting-InsightsQueryLeadProcessingTime-${props.envName}`
    });

    // ========================================
    // API Lambda Functions - Prospecting Core
    // ========================================

    // Create Lead Lambda (Public endpoint)
    this.createLeadLambda = new nodejs.NodejsFunction(this, 'CreateLeadLambda', {
      functionName: `nigredo-create-lead-${props.envName}`,
      entry: 'lambda/nigredo/create-lead.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: {
        POWERTOOLS_SERVICE_NAME: 'nigredo-create-lead',
        LOG_LEVEL: props.envName === 'prod' ? 'INFO' : 'DEBUG',
        DB_SECRET_ARN: props.dbSecret.secretArn,
        FIBONACCI_WEBHOOK_URL: props.envConfig.fibonacciWebhookUrl || '',
        DEFAULT_TENANT_ID: props.envConfig.defaultTenantId || '00000000-0000-0000-0000-000000000000',
        NODE_OPTIONS: '--enable-source-maps'
      },
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'es2021',
        externalModules: ['aws-sdk']
      },
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED
      },
      tracing: lambda.Tracing.ACTIVE,
      description: 'Create Lead API - Public endpoint for lead form submissions'
    });

    // Grant permissions
    props.dbSecret.grantRead(this.createLeadLambda);
    this.createLeadLambda.connections.allowTo(
      dbSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Create Lead Lambda to access Aurora'
    );

    // List Leads Lambda (Protected endpoint)
    this.listLeadsLambda = new nodejs.NodejsFunction(this, 'ListLeadsLambda', {
      functionName: `nigredo-list-leads-${props.envName}`,
      entry: 'lambda/nigredo/list-leads.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: {
        POWERTOOLS_SERVICE_NAME: 'nigredo-list-leads',
        LOG_LEVEL: props.envName === 'prod' ? 'INFO' : 'DEBUG',
        DB_SECRET_ARN: props.dbSecret.secretArn,
        DEFAULT_TENANT_ID: props.envConfig.defaultTenantId || '00000000-0000-0000-0000-000000000000',
        NODE_OPTIONS: '--enable-source-maps'
      },
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'es2021',
        externalModules: ['aws-sdk']
      },
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED
      },
      tracing: lambda.Tracing.ACTIVE,
      description: 'List Leads API - Protected endpoint for listing leads with pagination'
    });

    // Grant permissions
    props.dbSecret.grantRead(this.listLeadsLambda);
    this.listLeadsLambda.connections.allowTo(
      dbSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow List Leads Lambda to access Aurora'
    );

    // Get Lead Lambda (Protected endpoint)
    this.getLeadLambda = new nodejs.NodejsFunction(this, 'GetLeadLambda', {
      functionName: `nigredo-get-lead-${props.envName}`,
      entry: 'lambda/nigredo/get-lead.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: {
        POWERTOOLS_SERVICE_NAME: 'nigredo-get-lead',
        LOG_LEVEL: props.envName === 'prod' ? 'INFO' : 'DEBUG',
        DB_SECRET_ARN: props.dbSecret.secretArn,
        DEFAULT_TENANT_ID: props.envConfig.defaultTenantId || '00000000-0000-0000-0000-000000000000',
        NODE_OPTIONS: '--enable-source-maps'
      },
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'es2021',
        externalModules: ['aws-sdk']
      },
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED
      },
      tracing: lambda.Tracing.ACTIVE,
      description: 'Get Lead API - Protected endpoint for retrieving lead details'
    });

    // Grant permissions
    props.dbSecret.grantRead(this.getLeadLambda);
    this.getLeadLambda.connections.allowTo(
      dbSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Get Lead Lambda to access Aurora'
    );

    // ========================================
    // API Gateway HTTP API
    // ========================================

    // Create HTTP API
    this.httpApi = new apigatewayv2.HttpApi(this, 'NigredoHttpApi', {
      apiName: `nigredo-api-${props.envName}`,
      description: 'Nigredo Prospecting Core API',
      corsPreflight: {
        allowOrigins: props.envName === 'prod' 
          ? ['https://alquimista.ai', 'https://www.alquimista.ai']
          : ['*'],
        allowMethods: [
          apigatewayv2.CorsHttpMethod.GET,
          apigatewayv2.CorsHttpMethod.POST,
          apigatewayv2.CorsHttpMethod.OPTIONS
        ],
        allowHeaders: ['Content-Type', 'Authorization', 'X-Correlation-Id'],
        maxAge: cdk.Duration.hours(1)
      }
    });

    // Create Lambda integrations
    const createLeadIntegration = new HttpLambdaIntegration(
      'CreateLeadIntegration',
      this.createLeadLambda
    );

    const listLeadsIntegration = new HttpLambdaIntegration(
      'ListLeadsIntegration',
      this.listLeadsLambda
    );

    const getLeadIntegration = new HttpLambdaIntegration(
      'GetLeadIntegration',
      this.getLeadLambda
    );

    // Add routes
    this.httpApi.addRoutes({
      path: '/api/leads',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: createLeadIntegration
    });

    this.httpApi.addRoutes({
      path: '/api/leads',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: listLeadsIntegration
      // TODO: Add Cognito authorizer when authentication is implemented
    });

    this.httpApi.addRoutes({
      path: '/api/leads/{id}',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: getLeadIntegration
      // TODO: Add Cognito authorizer when authentication is implemented
    });

    // ========================================
    // CloudWatch Alarms for API
    // ========================================

    // Create SNS topic for alarms
    const alarmTopic = new sns.Topic(this, 'NigredoApiAlarmTopic', {
      topicName: `nigredo-api-alarms-${props.envName}`,
      displayName: 'Nigredo API Alarms'
    });

    // Create comprehensive alarms using NigredoAlarms construct
    const nigredoAlarms = new NigredoAlarms(this, 'NigredoAlarms', {
      envName: props.envName,
      createLeadLambda: this.createLeadLambda,
      listLeadsLambda: this.listLeadsLambda,
      getLeadLambda: this.getLeadLambda,
      httpApi: this.httpApi,
      alarmTopic: alarmTopic
    });

    // ========================================
    // CloudWatch Dashboard - Nigredo Prospecting
    // ========================================
    const nigredoDashboard = new NigredoDashboard(this, 'NigredoDashboard', {
      envName: props.envName,
      createLeadLambda: this.createLeadLambda,
      listLeadsLambda: this.listLeadsLambda,
      getLeadLambda: this.getLeadLambda,
      httpApi: this.httpApi
    });

    // ========================================
    // CloudWatch Insights Queries - Nigredo API
    // ========================================
    const nigredoApiInsightsQueries = new NigredoInsightsQueries(this, 'NigredoApiInsightsQueries', {
      logGroups: [
        this.createLeadLambda.logGroup,
        this.listLeadsLambda.logGroup,
        this.getLeadLambda.logGroup
      ],
      envName: props.envName
    });

    // ========================================
    // CloudFormation Outputs for API
    // ========================================

    // ========================================
    // WAF Association (DESABILITADA TEMPORARIAMENTE)
    // ========================================
    // PROBLEMA: AWS::WAFv2::WebACLAssociation não suporta API Gateway HTTP API (v2)
    // - Suporta apenas: API Gateway REST (v1), ALB, CloudFront, Cognito, AppSync, AppRunner
    // - ARN de HTTP API: arn:aws:apigateway:region::/apis/{api-id}/stages/{stage}
    // - ARN de REST API: arn:aws:apigateway:region::/restapis/{api-id}/stages/{stage}
    // 
    // ERRO ATUAL: WAFInvalidParameterException - The ARN isn't valid
    // 
    // SOLUÇÕES FUTURAS:
    // 1. Migrar para API Gateway REST API (v1)
    // 2. Colocar CloudFront ou ALB na frente da HTTP API
    // 3. Usar WAF no CloudFront/ALB em vez de diretamente na API
    //
    // Por enquanto, associação desabilitada para liberar deploy do AuroraMigrationsRunner.
    
    /*
    // Construir ARN da API Gateway HTTP API
    const apiArn = `arn:aws:apigateway:${this.region}::/apis/${this.httpApi.apiId}/stages/$default`;
    
    if (props.webAclDev && props.envName === 'dev') {
      new wafv2.CfnWebACLAssociation(this, 'NigredoApiWAFAssociation', {
        resourceArn: apiArn,
        webAclArn: props.webAclDev.attrArn,
      });
    }

    if (props.webAclProd && props.envName === 'prod') {
      new wafv2.CfnWebACLAssociation(this, 'NigredoApiWAFAssociation', {
        resourceArn: apiArn,
        webAclArn: props.webAclProd.attrArn,
      });
    }
    */

    // ========================================
    // CloudFormation Outputs
    // ========================================

    new cdk.CfnOutput(this, 'NigredoApiUrl', {
      value: this.httpApi.apiEndpoint,
      description: 'Nigredo API Gateway URL',
      exportName: `NigredoApiUrl-${props.envName}`
    });

    new cdk.CfnOutput(this, 'NigredoApiId', {
      value: this.httpApi.apiId,
      description: 'Nigredo API Gateway ID',
      exportName: `NigredoApiId-${props.envName}`
    });

    new cdk.CfnOutput(this, 'CreateLeadLambdaArn', {
      value: this.createLeadLambda.functionArn,
      description: 'Create Lead Lambda ARN',
      exportName: `NigredoCreateLeadLambdaArn-${props.envName}`
    });

    new cdk.CfnOutput(this, 'ListLeadsLambdaArn', {
      value: this.listLeadsLambda.functionArn,
      description: 'List Leads Lambda ARN',
      exportName: `NigredoListLeadsLambdaArn-${props.envName}`
    });

    new cdk.CfnOutput(this, 'GetLeadLambdaArn', {
      value: this.getLeadLambda.functionArn,
      description: 'Get Lead Lambda ARN',
      exportName: `NigredoGetLeadLambdaArn-${props.envName}`
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: alarmTopic.topicArn,
      description: 'SNS Topic ARN for API alarms',
      exportName: `NigredoApiAlarmTopicArn-${props.envName}`
    });

    new cdk.CfnOutput(this, 'NigredoDashboardName', {
      value: nigredoDashboard.dashboard.dashboardName,
      description: 'Nigredo Prospecting Dashboard Name',
      exportName: `NigredoDashboardName-${props.envName}`
    });

    new cdk.CfnOutput(this, 'NigredoTopLeadSourcesQuery', {
      value: nigredoApiInsightsQueries.topLeadSourcesQuery.name!,
      description: 'CloudWatch Insights Query: Top Lead Sources',
      exportName: `NigredoTopLeadSourcesQuery-${props.envName}`
    });

    new cdk.CfnOutput(this, 'NigredoConversionFunnelQuery', {
      value: nigredoApiInsightsQueries.conversionFunnelQuery.name!,
      description: 'CloudWatch Insights Query: Conversion Funnel',
      exportName: `NigredoConversionFunnelQuery-${props.envName}`
    });

    new cdk.CfnOutput(this, 'NigredoErrorAnalysisQuery', {
      value: nigredoApiInsightsQueries.errorAnalysisQuery.name!,
      description: 'CloudWatch Insights Query: Error Analysis',
      exportName: `NigredoErrorAnalysisQuery-${props.envName}`
    });

    new cdk.CfnOutput(this, 'NigredoCriticalAlarmsCount', {
      value: nigredoAlarms.criticalAlarms.length.toString(),
      description: 'Number of critical alarms configured',
      exportName: `NigredoCriticalAlarmsCount-${props.envName}`
    });

    new cdk.CfnOutput(this, 'NigredoWarningAlarmsCount', {
      value: nigredoAlarms.warningAlarms.length.toString(),
      description: 'Number of warning alarms configured',
      exportName: `NigredoWarningAlarmsCount-${props.envName}`
    });
  }
}
