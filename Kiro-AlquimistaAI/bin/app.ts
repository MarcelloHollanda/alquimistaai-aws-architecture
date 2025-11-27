#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Aspects } from 'aws-cdk-lib';
import { FibonacciStack } from '../lib/fibonacci-stack';
import { NigredoStack } from '../lib/nigredo-stack';
import { AlquimistaStack } from '../lib/alquimista-stack';
import { SecurityStack } from '../lib/security-stack';
import { WAFStack } from '../lib/waf-stack';
import { ObservabilityDashboardStack } from '../lib/observability-dashboard-stack';
import { FrontendStack } from '../lib/frontend-stack';
import { OperationalDashboardStack } from '../lib/operational-dashboard-stack';
import { AuroraMigrationsRunnerStack } from '../lib/aurora-migrations-runner-stack';

const app = new cdk.App();

// Enable cdk-nag if context flag is set
const enableNag = app.node.tryGetContext('enableNag');
if (enableNag) {
  // Import cdk-nag dynamically to avoid dependency issues when not needed
  const { AwsSolutionsChecks, NagSuppressions } = require('cdk-nag');
  Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));
}

// Obter ambiente do contexto (default: dev)
const envName = app.node.tryGetContext('env') || 'dev';
const envConfig = app.node.tryGetContext('environments')[envName];

if (!envConfig) {
  throw new Error(`Environment ${envName} not found in cdk.json`);
}

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT || envConfig.account,
  region: envConfig.region
};

// Tags comuns para todas as stacks
const commonTags = {
  project: 'fibonacci-core',
  owner: 'alquimista.ai',
  env: envName,
  costcenter: 'core',
  'managed-by': 'cdk'
};

// Stack de Segurança (Guardrails) - deve ser criada primeiro
const securityStack = new SecurityStack(app, `SecurityStack-${envName}`, {
  env,
  envName, // Passar envName para controlar recursos condicionais (Cost Anomaly Monitor apenas em prod)
  tags: { ...commonTags, component: 'security-guardrails' },
  description: 'Security Guardrails - CloudTrail, GuardDuty, SNS Alerts',
  securityAlertEmail: process.env.SECURITY_ALERT_EMAIL || envConfig.securityAlertEmail,
});

// Stack de WAF + Edge Security - deve ser criada antes das APIs
const wafStack = new WAFStack(app, `WAFStack-${envName}`, {
  env,
  tags: { ...commonTags, component: 'waf-edge-security' },
  description: 'WAF + Edge Security - Proteção de APIs contra ataques',
  envName,
  envConfig,
  securityAlertTopic: securityStack.securityAlertTopic,
});

// Stack principal do Fibonacci (orquestrador)
const fibonacciStack = new FibonacciStack(app, `FibonacciStack-${envName}`, {
  env,
  tags: { ...commonTags, nucleus: 'fibonacci' },
  description: 'Fibonacci - Núcleo Orquestrador Central',
  envName,
  envConfig,
  webAclDev: wafStack.webAclDev,
  webAclProd: wafStack.webAclProd,
});

// Stack do Nigredo (prospecção)
const nigredoStack = new NigredoStack(app, `NigredoStack-${envName}`, {
  env,
  tags: { ...commonTags, nucleus: 'nigredo' },
  description: 'Nigredo - Núcleo de Prospecção B2B',
  envName,
  envConfig: {
    ...envConfig,
    fibonacciWebhookUrl: `https://${fibonacciStack.httpApi.apiEndpoint}/public/nigredo-event`
  },
  // Dependências da stack Fibonacci
  eventBus: fibonacciStack.eventBus,
  vpc: fibonacciStack.vpc,
  dbCluster: fibonacciStack.dbCluster,
  dbSecret: fibonacciStack.dbSecret,
  kmsKey: fibonacciStack.kmsKey,
  webAclDev: wafStack.webAclDev,
  webAclProd: wafStack.webAclProd,
});

// Stack da Plataforma Alquimista
const alquimistaStack = new AlquimistaStack(app, `AlquimistaStack-${envName}`, {
  env,
  tags: { ...commonTags, nucleus: 'alquimista' },
  description: 'Alquimista - Plataforma SaaS Multi-Tenant',
  envName,
  envConfig,
  // Dependências
  eventBus: fibonacciStack.eventBus,
  userPool: fibonacciStack.userPool,
  cognitoAuthorizer: fibonacciStack.cognitoAuthorizer,
  dbCluster: fibonacciStack.dbCluster,
  dbSecret: fibonacciStack.dbSecret
});

// Stack de Dashboards de Observabilidade
const observabilityStack = new ObservabilityDashboardStack(app, `ObservabilityDashboardStack-${envName}`, {
  env,
  tags: { ...commonTags, component: 'observability-dashboards' },
  description: 'Observability Dashboards - CloudWatch Dashboards para monitoramento consolidado',
  envName,
  // Recursos do Fibonacci
  fibonacciApiId: fibonacciStack.httpApi.apiId,
  fibonacciApiHandler: fibonacciStack.apiHandler,
  fibonacciAuroraClusterId: fibonacciStack.dbCluster.clusterIdentifier,
  // Recursos do Nigredo
  nigredoApiId: nigredoStack.httpApi.apiId,
  nigredoLambdas: {
    recebimento: nigredoStack.recebimentoLambda,
    estrategia: nigredoStack.estrategiaLambda,
    disparo: nigredoStack.disparoLambda,
    atendimento: nigredoStack.atendimentoLambda,
    sentimento: nigredoStack.sentimentoLambda,
    agendamento: nigredoStack.agendamentoLambda,
  }
});

// Stack do Painel Operacional
const operationalDashboardStack = new OperationalDashboardStack(app, `OperationalDashboardStack-${envName}`, {
  env,
  tags: { ...commonTags, component: 'operational-dashboard' },
  description: 'Operational Dashboard - Painel operacional com comandos e métricas',
  envName,
  auroraSecretArn: fibonacciStack.dbSecret.secretArn,
  auroraClusterArn: fibonacciStack.dbCluster.clusterArn,
  // Props removidas para evitar dependência cíclica:
  // - userPool, cognitoAuthorizer, platformApi
});

// Stack de Frontend (S3 + CloudFront + WAF)
const frontendStack = new FrontendStack(app, `FrontendStack-${envName}`, {
  env,
  tags: { ...commonTags, component: 'frontend-web' },
  description: 'Frontend Web - S3 + CloudFront + WAF para hospedagem de arquivos estáticos',
  envName,
  envConfig,
  // Integração com WAF (apenas prod)
  wafAclArn: envName === 'prod' ? wafStack.webAclProd.attrArn : undefined,
  // URLs das APIs backend
  fibonacciApiUrl: `https://${fibonacciStack.httpApi.apiEndpoint}`,
  nigredoApiUrl: `https://${nigredoStack.httpApi.apiEndpoint}`,
});

// Stack de Aurora Migrations Runner (Lambda dentro da VPC)
const auroraMigrationsRunnerStack = new AuroraMigrationsRunnerStack(app, `AuroraMigrationsRunnerStack-${envName}`, {
  env,
  tags: { ...commonTags, component: 'aurora-migrations-runner' },
  description: 'Aurora Migrations Runner - Lambda para executar migrations SQL dentro da VPC',
  envName,
  vpc: fibonacciStack.vpc,
  dbCluster: fibonacciStack.dbCluster,
  dbSecret: fibonacciStack.dbSecret,
});

// Adicionar dependências entre stacks
wafStack.addDependency(securityStack); // WAF precisa do SNS Topic de segurança
fibonacciStack.addDependency(wafStack); // Fibonacci precisa dos Web ACLs do WAF
nigredoStack.addDependency(fibonacciStack);
nigredoStack.addDependency(wafStack); // Nigredo precisa dos Web ACLs do WAF
alquimistaStack.addDependency(fibonacciStack);
operationalDashboardStack.addDependency(fibonacciStack); // Operational Dashboard precisa do Aurora
// REMOVIDO: operationalDashboardStack.addDependency(alquimistaStack) - causava ciclo
observabilityStack.addDependency(fibonacciStack);
observabilityStack.addDependency(nigredoStack);
frontendStack.addDependency(wafStack); // Frontend precisa do WAF (prod)
frontendStack.addDependency(fibonacciStack); // Frontend precisa das URLs das APIs
frontendStack.addDependency(nigredoStack);
auroraMigrationsRunnerStack.addDependency(fibonacciStack); // Migrations Runner precisa do Aurora e VPC

app.synth();
