/**
 * Tipos e Interfaces para o Sistema de Inventário e Documentação
 * Sistema AlquimistaAI
 * 
 * Este arquivo contém todas as definições de tipos usadas pelos analisadores,
 * validadores e geradores de documentação do sistema.
 */

// ============================================================================
// TIPOS BÁSICOS
// ============================================================================

export type Environment = 'dev' | 'prod';
export type ApiType = 'HTTP' | 'REST';
export type RouteType = 'auth' | 'dashboard' | 'company' | 'other';
export type MigrationStatus = 'applied' | 'pending' | 'skip';
export type Severity = 'low' | 'medium' | 'high';

// ============================================================================
// INFRAESTRUTURA AWS
// ============================================================================

export interface StackInfo {
  name: string;
  environment: Environment;
  resources: {
    apis: ApiGatewayInfo[];
    lambdas: LambdaInfo[];
    databases: DatabaseResourceInfo[];
    storage: StorageInfo[];
    security: SecurityInfo[];
  };
}

export interface ApiGatewayInfo {
  logicalName: string;
  type: ApiType;
  id?: string;
  baseUrl?: string;
  routes: string[];
}

export interface LambdaInfo {
  logicalName: string;
  runtime: string;
  handler: string;
  file: string;
  purpose?: string;
}

export interface DatabaseResourceInfo {
  type: string;
  name: string;
  engine?: string;
  mode?: string;
}

export interface StorageInfo {
  type: 'S3' | 'EFS' | 'DynamoDB';
  name: string;
  purpose: string;
}

export interface SecurityInfo {
  type: 'WAF' | 'SecurityGroup' | 'IAM' | 'KMS';
  name: string;
  description: string;
}

// ============================================================================
// BANCO DE DADOS
// ============================================================================

export interface DatabaseInfo {
  engine: string;
  mode: string;
  region: string;
  schemas: string[];
  migrations: MigrationInfo[];
  decisions: string[];
}

export interface MigrationInfo {
  number: string;
  filename: string;
  summary: string;
  status: MigrationStatus;
}

// ============================================================================
// BACKENDS DE API
// ============================================================================

export interface BackendApiInfo {
  name: string;
  purpose: string;
  apiGateway: {
    dev?: ApiGatewayInfo;
    prod?: ApiGatewayInfo;
  };
  handlers: LambdaHandlerInfo[];
  integrations: string[];
}

export interface LambdaHandlerInfo {
  logicalName: string;
  file: string;
  purpose: string;
  routes: string[];
}

// ============================================================================
// FRONTEND
// ============================================================================

export interface FrontendInfo {
  framework: string;
  location: string;
  routes: RouteInfo[];
  cognito: CognitoIntegrationInfo;
  apiClients: ApiClientInfo[];
  tests: TestInfo;
}

export interface RouteInfo {
  path: string;
  type: 'auth' | 'dashboard' | 'company' | 'billing' | 'commercial' | 'fibonacci' | 'nigredo' | 'institutional' | 'other';
  file?: string;
}

export interface CognitoIntegrationInfo {
  userPoolId: string;
  clientId: string;
  region: string;
  hostedUiDomain: string;
  redirectUri: string;
  logoutUri: string;
  authFlow: string;
  groups: CognitoGroupInfo[];
  middlewareProtection: boolean;
  files: string[];
}

export interface ApiClientInfo {
  name: string;
  file: string;
  baseUrlSource: string;
}

export interface TestInfo {
  unit: TestCategoryInfo;
  integration: TestCategoryInfo;
  e2e: TestCategoryInfo;
  security: TestCategoryInfo;
}

export interface TestCategoryInfo {
  total: number;
  passing: number;
  status: 'passando' | 'falhando' | 'não executado';
}

export interface FrontendDeploymentInfo {
  type: 'S3+CloudFront' | 'Amplify' | 'Vercel';
  bucket?: string;
  distributionId?: string;
  domain?: string;
}

// ============================================================================
// AUTENTICAÇÃO
// ============================================================================

export interface CognitoInfo {
  userPool: {
    name: string;
    region: string;
    id: string;
    clientIds: string[];
    hostedUiDomain: string;
  };
  groups: CognitoGroupInfo[];
  users: CognitoUserInfo[];
}

export interface CognitoGroupInfo {
  name: string;
  role: string;
}

export interface CognitoUserInfo {
  email: string;
  groups: string[];
  // NUNCA incluir senha
}

// ============================================================================
// CI/CD
// ============================================================================

export interface CiCdInfo {
  workflow: WorkflowInfo;
  oidc: OidcInfo;
  scripts: ScriptInfo[];
  tests: TestLogInfo[];
}

export interface WorkflowInfo {
  file: string;
  exists: boolean;
  name?: string;
  triggers: string[];
  jobs: JobInfo[];
  error?: string;
}

export interface JobInfo {
  id: string;
  name: string;
  runsOn: string;
  needs: string[];
  environment: string | null;
  steps: number;
}

export interface OidcInfo {
  configured: boolean;
  role: string | null;
  provider: string | null;
  error?: string;
}

export interface ScriptInfo {
  name: string;
  path: string;
  description: string;
  type: 'validation' | 'smoke-test' | 'deploy' | 'other';
}

export interface TestLogInfo {
  path: string;
  title: string;
  type: 'summary' | 'workflow-test' | 'validation' | 'checklist' | 'integration';
}

// ============================================================================
// GUARDRAILS
// ============================================================================

export interface GuardrailsInfo {
  security: SecurityGuardrailsInfo;
  cost: CostGuardrailsInfo;
  observability: ObservabilityGuardrailsInfo;
}

export interface SecurityGuardrailsInfo {
  cloudTrail: CloudTrailInfo;
  guardDuty: GuardDutyInfo;
  waf: WafInfo;
  snsTopics: SnsTopicInfo[];
}

export interface CostGuardrailsInfo {
  budgets: BudgetInfo[];
  anomalyDetection: AnomalyDetectionInfo | null;
  snsTopics: SnsTopicInfo[];
}

export interface ObservabilityGuardrailsInfo {
  dashboards: DashboardInfo[];
}

export interface CloudTrailInfo {
  enabled: boolean;
  trailName: string;
  bucketName: string;
  region: string;
  retentionDays: number;
  logFileValidation: boolean;
  multiRegion: boolean;
}

export interface GuardDutyInfo {
  enabled: boolean;
  detectorId: string;
  region: string;
  findingPublishingFrequency: string;
  s3Protection: boolean;
  malwareProtection: boolean;
}

export interface WafInfo {
  enabled: boolean;
  webAcls: WebAclInfo[];
  ipSets: IpSetInfo[];
  logGroups: LogGroupInfo[];
}

export interface WebAclInfo {
  name: string;
  scope: 'REGIONAL' | 'CLOUDFRONT';
  environment: Environment;
  defaultAction: string;
  rules: string[];
  description: string;
}

export interface IpSetInfo {
  name: string;
  scope: 'REGIONAL' | 'CLOUDFRONT';
  ipAddressVersion: string;
  description: string;
  addresses: string[];
}

export interface LogGroupInfo {
  name: string;
  retentionDays: number;
  environment: Environment;
}

export interface SnsTopicInfo {
  name: string;
  displayName: string;
  purpose: string;
  subscriptions: string[];
}

export interface BudgetInfo {
  name: string;
  budgetType: string;
  timeUnit: string;
  amount: number;
  currency: string;
  thresholds: number[];
  notificationTypes: string[];
}

export interface AnomalyDetectionInfo {
  monitorName: string;
  monitorType: string;
  dimension: string;
  threshold: number;
  frequency: string;
}

export interface DashboardInfo {
  name: string;
  widgets: string[];
  purpose: string;
}

// ============================================================================
// VARIÁVEIS DE AMBIENTE E INTEGRAÇÕES
// ============================================================================

export interface EnvironmentVariableInfo {
  name: string;
  usedIn: string[];
  storedIn: string[];
  description: string;
  // NUNCA incluir value
}

export interface ExternalIntegrationInfo {
  name: string;
  type: string;
  files: string[];
  variables: string[];
}

// ============================================================================
// GAPS E RISCOS
// ============================================================================

export interface GapInfo {
  description: string;
  reference: string;
  severity: Severity;
}

export interface RiskInfo {
  description: string;
  impact: string;
  mitigation?: string;
}

// ============================================================================
// MODELO DE DADOS CONSOLIDADO
// ============================================================================

export interface SystemInventory {
  metadata: {
    generatedAt: Date;
    generatedBy: string;
    version: string;
  };
  
  infrastructure: {
    region: string;
    stacks: StackInfo[];
  };
  
  database: DatabaseInfo;
  
  backends: {
    fibonacci: BackendApiInfo;
    nigredo: BackendApiInfo;
    operationalDashboard: BackendApiInfo;
  };
  
  frontend: {
    operationalPanel: FrontendInfo;
    commercialSites: FrontendDeploymentInfo;
  };
  
  authentication: CognitoInfo;
  
  cicd: CiCdInfo;
  
  guardrails: GuardrailsInfo;
  
  environment: {
    variables: EnvironmentVariableInfo[];
    integrations: ExternalIntegrationInfo[];
  };
  
  gaps: {
    known: GapInfo[];
    risks: RiskInfo[];
    nextSteps: string[];
  };
}

// ============================================================================
// VALIDAÇÃO
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// PADRÕES DE SANITIZAÇÃO
// ============================================================================

export interface SensitivePattern {
  name: string;
  pattern: RegExp;
  replacement: string;
}

export interface SecretPattern {
  name: string;
  pattern: RegExp;
  replacement: string | ((match: string, ...args: any[]) => string);
}

export interface SanitizationResult {
  sanitized: string;
  foundSecrets: string[];
}

export const SENSITIVE_PATTERNS: Record<string, SensitivePattern> = {
  awsAccessKey: {
    name: 'AWS Access Key',
    pattern: /AKIA[0-9A-Z]{16}/g,
    replacement: 'AKIA************'
  },
  awsSecretKey: {
    name: 'AWS Secret Key',
    pattern: /(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{40}(?![A-Za-z0-9/+=])/g,
    replacement: '****************************************'
  },
  stripeKeyLive: {
    name: 'Stripe Live Key',
    pattern: /sk_live_[0-9a-zA-Z]{24,}/g,
    replacement: 'sk_live_************************'
  },
  stripeKeyTest: {
    name: 'Stripe Test Key',
    pattern: /sk_test_[0-9a-zA-Z]{24,}/g,
    replacement: 'sk_test_************************'
  },
  genericSecret: {
    name: 'Generic Secret',
    pattern: /(password|secret|token|key)[\s]*[:=][\s]*["']?([^\s"']+)["']?/gi,
    replacement: '$1=$2'
  },
  email: {
    name: 'Email Address',
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    replacement: '***@***.***'
  },
  jwt: {
    name: 'JWT Token',
    pattern: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
    replacement: 'eyJ***.eyJ***.***'
  }
};

// ============================================================================
// TIPOS AUXILIARES
// ============================================================================

export interface AnalyzerResult<T> {
  success: boolean;
  data?: T;
  errors: string[];
  warnings: string[];
}

export interface FileReference {
  path: string;
  exists: boolean;
  lastModified?: Date;
}

export interface DocumentSection {
  title: string;
  content: string;
  subsections?: DocumentSection[];
}

export interface GeneratorOptions {
  includeMetadata: boolean;
  sanitize: boolean;
  verbose: boolean;
  outputPath: string;
}
