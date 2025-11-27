/**
 * Analisador de Guardrails de Segurança, Custo e Observabilidade
 * 
 * Extrai informações de:
 * - CloudTrail (auditoria)
 * - GuardDuty (detecção de ameaças)
 * - WAF (firewall de aplicação web)
 * - SNS Topics (alertas)
 * - AWS Budgets (orçamento)
 * - Cost Anomaly Detection (detecção de anomalias de custo)
 * - Dashboards CloudWatch (observabilidade)
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  GuardrailsInfo,
  SecurityGuardrailsInfo,
  CostGuardrailsInfo,
  ObservabilityGuardrailsInfo,
  CloudTrailInfo,
  GuardDutyInfo,
  WafInfo,
  SnsTopicInfo,
  BudgetInfo,
  AnomalyDetectionInfo,
  DashboardInfo,
  WebAclInfo,
  IpSetInfo,
  LogGroupInfo
} from '../types';

/**
 * Analisa configuração de guardrails de segurança, custo e observabilidade
 */
export function analyzeGuardrails(workspaceRoot: string): GuardrailsInfo {
  const securityStackPath = path.join(workspaceRoot, 'lib', 'security-stack.ts');
  const wafStackPath = path.join(workspaceRoot, 'lib', 'waf-stack.ts');
  const dashboardsPath = path.join(workspaceRoot, 'lib', 'dashboards');
  
  const securityGuardrails = analyzeSecurityGuardrails(securityStackPath, wafStackPath);
  const costGuardrails = analyzeCostGuardrails(securityStackPath);
  const observabilityGuardrails = analyzeObservabilityGuardrails(dashboardsPath);

  return {
    security: securityGuardrails,
    cost: costGuardrails,
    observability: observabilityGuardrails
  };
}

/**
 * Analisa guardrails de segurança (CloudTrail, GuardDuty, WAF, SNS)
 */
function analyzeSecurityGuardrails(
  securityStackPath: string,
  wafStackPath: string
): SecurityGuardrailsInfo {
  const cloudTrail = analyzeCloudTrail(securityStackPath);
  const guardDuty = analyzeGuardDuty(securityStackPath);
  const waf = analyzeWaf(wafStackPath);
  const snsTopics = analyzeSecuritySnsTopics(securityStackPath);

  return {
    cloudTrail,
    guardDuty,
    waf,
    snsTopics
  };
}

/**
 * Analisa configuração do CloudTrail
 */
function analyzeCloudTrail(securityStackPath: string): CloudTrailInfo {
  if (!fs.existsSync(securityStackPath)) {
    return {
      enabled: false,
      trailName: 'N/A',
      bucketName: 'N/A',
      region: 'us-east-1',
      retentionDays: 0,
      logFileValidation: false,
      multiRegion: false
    };
  }

  const content = fs.readFileSync(securityStackPath, 'utf-8');

  // Extrair nome do trail (pode ser gerado automaticamente)
  const trailNameMatch = content.match(/trailName:\s*['"`]([^'"`]+)['"`]/);
  const trailName = trailNameMatch ? trailNameMatch[1] : 'alquimista-audit-trail-{env}';

  // Extrair nome do bucket (pode ser gerado automaticamente)
  const bucketNameMatch = content.match(/bucketName:\s*['"`]([^'"`]+)['"`]/);
  const bucketName = bucketNameMatch ? bucketNameMatch[1] : 'alquimista-cloudtrail-logs-{account-id}-{env}';

  // Extrair retenção de logs
  const retentionMatch = content.match(/expiration:\s*cdk\.Duration\.days\((\d+)\)/);
  const retentionDays = retentionMatch ? parseInt(retentionMatch[1], 10) : 90;

  // Verificar se log file validation está habilitada
  const logFileValidation = content.includes('enableFileValidation: true');

  // Verificar se é multi-region
  const multiRegion = content.includes('isMultiRegionTrail: true');

  return {
    enabled: true,
    trailName,
    bucketName,
    region: 'us-east-1',
    retentionDays,
    logFileValidation,
    multiRegion
  };
}

/**
 * Analisa configuração do GuardDuty
 */
function analyzeGuardDuty(securityStackPath: string): GuardDutyInfo {
  if (!fs.existsSync(securityStackPath)) {
    return {
      enabled: false,
      detectorId: 'N/A',
      region: 'us-east-1',
      findingPublishingFrequency: 'N/A',
      s3Protection: false,
      malwareProtection: false
    };
  }

  const content = fs.readFileSync(securityStackPath, 'utf-8');

  // GuardDuty é gerenciado fora da stack (singleton)
  // Verificar se há referências ao GuardDuty
  const hasGuardDutyConfig = content.includes('guardduty') || content.includes('GuardDuty');

  // Extrair frequência de publicação (se configurada)
  const frequencyMatch = content.match(/findingPublishingFrequency:\s*['"`]([^'"`]+)['"`]/);
  const findingPublishingFrequency = frequencyMatch ? frequencyMatch[1] : 'FIFTEEN_MINUTES';

  return {
    enabled: hasGuardDutyConfig,
    detectorId: 'Gerenciado fora da stack (singleton)',
    region: 'us-east-1',
    findingPublishingFrequency,
    s3Protection: true,
    malwareProtection: true
  };
}

/**
 * Analisa configuração do WAF
 */
function analyzeWaf(wafStackPath: string): WafInfo {
  if (!fs.existsSync(wafStackPath)) {
    return {
      enabled: false,
      webAcls: [],
      ipSets: [],
      logGroups: []
    };
  }

  const content = fs.readFileSync(wafStackPath, 'utf-8');

  const webAcls = analyzeWebAcls(content);
  const ipSets = analyzeIpSets(content);
  const logGroups = analyzeWafLogGroups(content);

  return {
    enabled: true,
    webAcls,
    ipSets,
    logGroups
  };
}

/**
 * Analisa Web ACLs do WAF
 */
function analyzeWebAcls(wafStackContent: string): WebAclInfo[] {
  const webAcls: WebAclInfo[] = [];

  // Procurar por Web ACLs Dev e Prod
  const devAclMatch = wafStackContent.match(/name:\s*['"`]AlquimistaAI-WAF-Dev['"`]/);
  const prodAclMatch = wafStackContent.match(/name:\s*['"`]AlquimistaAI-WAF-Prod['"`]/);

  if (devAclMatch) {
    webAcls.push({
      name: 'AlquimistaAI-WAF-Dev',
      scope: 'REGIONAL',
      environment: 'dev',
      defaultAction: 'allow',
      rules: extractWafRules(wafStackContent, 'Dev'),
      description: 'WAF Web ACL para APIs Dev - Modo observacao'
    });
  }

  if (prodAclMatch) {
    webAcls.push({
      name: 'AlquimistaAI-WAF-Prod',
      scope: 'REGIONAL',
      environment: 'prod',
      defaultAction: 'allow',
      rules: extractWafRules(wafStackContent, 'Prod'),
      description: 'WAF Web ACL para APIs Prod - Modo bloqueio'
    });
  }

  return webAcls;
}

/**
 * Extrai regras do WAF
 */
function extractWafRules(content: string, environment: string): string[] {
  const rules: string[] = [];

  // Regras comuns
  const commonRules = [
    'BlockedIPsRule',
    'AWSManagedRulesCommonRuleSet',
    'AWSManagedRulesKnownBadInputsRuleSet',
    'AWSManagedRulesSQLiRuleSet',
    `RateLimit${environment}`
  ];

  // Verificar quais regras estão presentes
  for (const rule of commonRules) {
    if (content.includes(rule)) {
      rules.push(rule);
    }
  }

  return rules;
}

/**
 * Analisa IP Sets do WAF
 */
function analyzeIpSets(wafStackContent: string): IpSetInfo[] {
  const ipSets: IpSetInfo[] = [];

  // Procurar por IP Sets
  const allowedIpsMatch = wafStackContent.match(/name:\s*['"`]alquimista-allowed-ips-/);
  const blockedIpsMatch = wafStackContent.match(/name:\s*['"`]alquimista-blocked-ips-/);

  if (allowedIpsMatch) {
    ipSets.push({
      name: 'alquimista-allowed-ips-{env}',
      scope: 'REGIONAL',
      ipAddressVersion: 'IPV4',
      description: 'Allowlist de IPs confiaveis - escritorios, CI/CD e health checks',
      addresses: []
    });
  }

  if (blockedIpsMatch) {
    ipSets.push({
      name: 'alquimista-blocked-ips-{env}',
      scope: 'REGIONAL',
      ipAddressVersion: 'IPV4',
      description: 'Blocklist de IPs maliciosos identificados',
      addresses: []
    });
  }

  return ipSets;
}

/**
 * Analisa Log Groups do WAF
 */
function analyzeWafLogGroups(wafStackContent: string): LogGroupInfo[] {
  const logGroups: LogGroupInfo[] = [];

  // Procurar por Log Groups
  const devLogGroupMatch = wafStackContent.match(/logGroupName:\s*['"`]aws-waf-logs-alquimista-dev['"`]/);
  const prodLogGroupMatch = wafStackContent.match(/logGroupName:\s*['"`]aws-waf-logs-alquimista-prod['"`]/);

  if (devLogGroupMatch) {
    const retentionMatch = wafStackContent.match(/retention:\s*logs\.RetentionDays\.ONE_MONTH/);
    logGroups.push({
      name: 'aws-waf-logs-alquimista-dev',
      retentionDays: retentionMatch ? 30 : 30,
      environment: 'dev'
    });
  }

  if (prodLogGroupMatch) {
    const retentionMatch = wafStackContent.match(/retention:\s*logs\.RetentionDays\.THREE_MONTHS/);
    logGroups.push({
      name: 'aws-waf-logs-alquimista-prod',
      retentionDays: retentionMatch ? 90 : 90,
      environment: 'prod'
    });
  }

  return logGroups;
}

/**
 * Analisa SNS Topics de segurança
 */
function analyzeSecuritySnsTopics(securityStackPath: string): SnsTopicInfo[] {
  if (!fs.existsSync(securityStackPath)) {
    return [];
  }

  const content = fs.readFileSync(securityStackPath, 'utf-8');
  const topics: SnsTopicInfo[] = [];

  // Security Alert Topic
  if (content.includes('SecurityAlertTopic')) {
    topics.push({
      name: 'alquimista-security-alerts-{env}',
      displayName: 'AlquimistaAI Security Alerts',
      purpose: 'Alertas de segurança (GuardDuty HIGH/CRITICAL)',
      subscriptions: []
    });
  }

  // Ops Alert Topic
  if (content.includes('OpsAlertTopic')) {
    topics.push({
      name: 'alquimista-ops-alerts-{env}',
      displayName: 'AlquimistaAI Operational Alerts',
      purpose: 'Alertas operacionais (Lambda, API Gateway, Aurora)',
      subscriptions: []
    });
  }

  return topics;
}

/**
 * Analisa guardrails de custo (Budgets, Cost Anomaly Detection)
 */
function analyzeCostGuardrails(securityStackPath: string): CostGuardrailsInfo {
  const budgets = analyzeBudgets(securityStackPath);
  const anomalyDetection = analyzeAnomalyDetection(securityStackPath);
  const snsTopics = analyzeCostSnsTopics(securityStackPath);

  return {
    budgets,
    anomalyDetection,
    snsTopics
  };
}

/**
 * Analisa configuração de AWS Budgets
 */
function analyzeBudgets(securityStackPath: string): BudgetInfo[] {
  if (!fs.existsSync(securityStackPath)) {
    return [];
  }

  const content = fs.readFileSync(securityStackPath, 'utf-8');
  const budgets: BudgetInfo[] = [];

  // Procurar por configuração de budget
  const budgetMatch = content.match(/budgetName:\s*['"`]alquimista-monthly-budget-/);
  if (!budgetMatch) {
    return budgets;
  }

  // Extrair valor do orçamento
  const amountMatch = content.match(/amount:\s*(\d+)/);
  const amount = amountMatch ? parseInt(amountMatch[1], 10) : 500;

  // Extrair thresholds
  const thresholds: number[] = [];
  const thresholdMatches = content.matchAll(/threshold:\s*(\d+)/g);
  for (const match of thresholdMatches) {
    thresholds.push(parseInt(match[1], 10));
  }

  budgets.push({
    name: 'alquimista-monthly-budget-{env}',
    budgetType: 'COST',
    timeUnit: 'MONTHLY',
    amount,
    currency: 'USD',
    thresholds: thresholds.length > 0 ? thresholds : [80, 100, 120],
    notificationTypes: ['FORECASTED', 'ACTUAL']
  });

  return budgets;
}

/**
 * Analisa configuração de Cost Anomaly Detection
 */
function analyzeAnomalyDetection(securityStackPath: string): AnomalyDetectionInfo | null {
  if (!fs.existsSync(securityStackPath)) {
    return null;
  }

  const content = fs.readFileSync(securityStackPath, 'utf-8');

  // Cost Anomaly Monitor é gerenciado fora da stack (singleton/global)
  // Verificar se há referências
  const hasAnomalyConfig = content.includes('CostAnomaly') || content.includes('anomaly');

  if (!hasAnomalyConfig) {
    return null;
  }

  // Extrair threshold se configurado
  const thresholdMatch = content.match(/threshold:\s*(\d+)/);
  const threshold = thresholdMatch ? parseInt(thresholdMatch[1], 10) : 50;

  return {
    monitorName: 'alquimista-cost-monitor-{env}',
    monitorType: 'DIMENSIONAL',
    dimension: 'SERVICE',
    threshold,
    frequency: 'DAILY'
  };
}

/**
 * Analisa SNS Topics de custo
 */
function analyzeCostSnsTopics(securityStackPath: string): SnsTopicInfo[] {
  if (!fs.existsSync(securityStackPath)) {
    return [];
  }

  const content = fs.readFileSync(securityStackPath, 'utf-8');
  const topics: SnsTopicInfo[] = [];

  // Cost Alert Topic
  if (content.includes('CostAlertTopic')) {
    topics.push({
      name: 'alquimista-cost-alerts-{env}',
      displayName: 'AlquimistaAI Cost Alerts',
      purpose: 'Alertas de custo (Budgets 80%/100%/120%, Anomalias)',
      subscriptions: []
    });
  }

  return topics;
}

/**
 * Analisa guardrails de observabilidade (Dashboards CloudWatch)
 */
function analyzeObservabilityGuardrails(dashboardsPath: string): ObservabilityGuardrailsInfo {
  const dashboards = analyzeDashboards(dashboardsPath);

  return {
    dashboards
  };
}

/**
 * Analisa dashboards CloudWatch
 */
function analyzeDashboards(dashboardsPath: string): DashboardInfo[] {
  if (!fs.existsSync(dashboardsPath)) {
    return [];
  }

  const dashboards: DashboardInfo[] = [];
  const files = fs.readdirSync(dashboardsPath);

  for (const file of files) {
    if (!file.endsWith('.ts') || file.endsWith('.test.ts')) {
      continue;
    }

    const filePath = path.join(dashboardsPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Extrair nome do dashboard
    const nameMatch = content.match(/dashboardName:\s*['"`]([^'"`]+)['"`]/);
    if (!nameMatch) {
      continue;
    }

    const name = nameMatch[1];

    // Extrair widgets
    const widgets = extractDashboardWidgets(content);

    // Determinar propósito baseado no nome do arquivo
    let purpose = 'Dashboard de métricas';
    if (file.includes('fibonacci')) {
      purpose = 'Métricas do Fibonacci Orquestrador (API, Lambda, EventBridge, SQS)';
    } else if (file.includes('nigredo')) {
      purpose = 'Métricas dos Agentes Nigredo (Recebimento, Estratégia, Disparo, Atendimento, etc.)';
    } else if (file.includes('business')) {
      purpose = 'Métricas de negócio (Funil de conversão, ROI, Custo por lead)';
    } else if (file.includes('operational')) {
      purpose = 'Métricas do Painel Operacional (APIs internas, comandos, agregação)';
    }

    dashboards.push({
      name,
      widgets,
      purpose
    });
  }

  return dashboards;
}

/**
 * Extrai widgets de um dashboard
 */
function extractDashboardWidgets(content: string): string[] {
  const widgets: string[] = [];

  // Procurar por GraphWidget
  const graphWidgetMatches = content.matchAll(/new\s+cloudwatch\.GraphWidget\(\{[^}]*title:\s*['"`]([^'"`]+)['"`]/g);
  for (const match of graphWidgetMatches) {
    widgets.push(`Graph: ${match[1]}`);
  }

  // Procurar por SingleValueWidget
  const singleValueMatches = content.matchAll(/new\s+cloudwatch\.SingleValueWidget\(\{[^}]*title:\s*['"`]([^'"`]+)['"`]/g);
  for (const match of singleValueMatches) {
    widgets.push(`SingleValue: ${match[1]}`);
  }

  return widgets;
}
