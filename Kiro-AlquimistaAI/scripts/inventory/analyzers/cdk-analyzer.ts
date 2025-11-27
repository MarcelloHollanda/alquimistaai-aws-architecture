/**
 * Analisador de Infraestrutura CDK
 * 
 * Extrai informações de stacks, recursos AWS, outputs e mapeamentos
 * a partir dos arquivos CDK em TypeScript.
 */

import * as fs from 'fs';
import * as path from 'path';
import { 
  StackInfo, 
  ApiGatewayInfo, 
  LambdaInfo, 
  DatabaseInfo, 
  StorageInfo, 
  SecurityInfo 
} from '../types';

export interface CdkAnalyzerResult {
  stacks: StackInfo[];
  region: string;
  account: string;
}

/**
 * Analisa a infraestrutura CDK do projeto
 */
export async function analyzeCdkInfrastructure(
  workspaceRoot: string
): Promise<CdkAnalyzerResult> {
  const binPath = path.join(workspaceRoot, 'bin', 'app.ts');
  const libPath = path.join(workspaceRoot, 'lib');

  // Ler arquivo principal do CDK
  const appContent = fs.readFileSync(binPath, 'utf-8');

  // Extrair região e conta
  const region = extractRegion(appContent);
  const account = extractAccount(appContent);

  // Identificar stacks instanciadas
  const stackNames = extractStackNames(appContent);

  // Analisar cada stack
  const stacks: StackInfo[] = [];
  for (const stackName of stackNames) {
    const stackInfo = await analyzeStack(stackName, libPath, workspaceRoot);
    if (stackInfo) {
      stacks.push(stackInfo);
    }
  }

  return {
    stacks,
    region,
    account
  };
}

/**
 * Extrai a região AWS do arquivo app.ts
 */
function extractRegion(appContent: string): string {
  // Procurar por region: 'us-east-1' ou similar
  const regionMatch = appContent.match(/region:\s*['"]([^'"]+)['"]/);
  if (regionMatch) {
    return regionMatch[1];
  }

  // Procurar em envConfig
  const envConfigMatch = appContent.match(/envConfig\.region/);
  if (envConfigMatch) {
    return 'us-east-1'; // Default baseado no contexto do projeto
  }

  return 'us-east-1';
}

/**
 * Extrai a conta AWS (ou placeholder)
 */
function extractAccount(appContent: string): string {
  const accountMatch = appContent.match(/account:\s*['"]([^'"]+)['"]/);
  if (accountMatch) {
    return accountMatch[1];
  }

  // Procurar por CDK_DEFAULT_ACCOUNT
  if (appContent.includes('CDK_DEFAULT_ACCOUNT')) {
    return '${CDK_DEFAULT_ACCOUNT}';
  }

  return '${AWS_ACCOUNT}';
}

/**
 * Extrai nomes das stacks instanciadas no app.ts
 */
function extractStackNames(appContent: string): string[] {
  const stackNames: string[] = [];

  // Padrão: new XxxStack(app, 'StackName-${envName}', ...)
  const stackPattern = /new\s+(\w+Stack)\s*\(\s*app\s*,\s*[`'"]([^`'"]+)[`'"]/g;
  let match;

  while ((match = stackPattern.exec(appContent)) !== null) {
    const className = match[1];
    const instanceName = match[2];
    
    // Remover sufixo de ambiente para obter nome base
    const baseName = instanceName.replace(/-\$\{envName\}/, '').replace(/-dev|-prod/, '');
    
    stackNames.push(className);
  }

  return [...new Set(stackNames)]; // Remover duplicatas
}

/**
 * Analisa uma stack específica
 */
async function analyzeStack(
  stackClassName: string,
  libPath: string,
  workspaceRoot: string
): Promise<StackInfo | null> {
  // Converter nome da classe para nome do arquivo
  // Ex: FibonacciStack -> fibonacci-stack.ts
  // Ex: WAFStack -> waf-stack.ts (não w-a-f-stack.ts)
  let fileName = stackClassName.replace(/Stack$/, '');
  
  // Converter camelCase/PascalCase para kebab-case
  // Tratar siglas especialmente (WAF, API, etc)
  fileName = fileName
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2') // WAFStack -> WAF-Stack
    .replace(/([a-z\d])([A-Z])/g, '$1-$2') // camelCase -> camel-Case
    .toLowerCase() + '-stack.ts';

  const stackFilePath = path.join(libPath, fileName);

  if (!fs.existsSync(stackFilePath)) {
    console.warn(`Stack file not found: ${stackFilePath}`);
    return null;
  }

  const stackContent = fs.readFileSync(stackFilePath, 'utf-8');

  // Extrair informações da stack
  const name = extractStackName(stackClassName, stackContent);
  const description = extractStackDescription(stackContent);
  const environment = extractStackEnvironment(stackContent);

  // Extrair recursos
  const apis = extractApiGateways(stackContent);
  const lambdas = extractLambdas(stackContent);
  const databases = extractDatabases(stackContent);
  const storage = extractStorage(stackContent);
  const security = extractSecurity(stackContent);

  return {
    name,
    description,
    environment,
    resources: {
      apis,
      lambdas,
      databases,
      storage,
      security
    }
  };
}

/**
 * Extrai o nome da stack
 */
function extractStackName(className: string, content: string): string {
  // Procurar por stackName ou usar o nome da classe
  const stackNameMatch = content.match(/stackName:\s*['"]([^'"]+)['"]/);
  if (stackNameMatch) {
    return stackNameMatch[1];
  }

  // Usar nome da classe sem 'Stack'
  return className.replace(/Stack$/, '');
}

/**
 * Extrai a descrição da stack
 */
function extractStackDescription(content: string): string {
  const descMatch = content.match(/description:\s*['"]([^'"]+)['"]/);
  return descMatch ? descMatch[1] : '';
}

/**
 * Extrai o ambiente da stack (dev/prod)
 */
function extractStackEnvironment(content: string): 'dev' | 'prod' | 'both' {
  // Verificar se a stack usa envName
  if (content.includes('envName')) {
    return 'both';
  }

  if (content.includes("'prod'") || content.includes('"prod"')) {
    return 'prod';
  }

  if (content.includes("'dev'") || content.includes('"dev"')) {
    return 'dev';
  }

  return 'both';
}

/**
 * Extrai informações de API Gateways
 */
function extractApiGateways(content: string): ApiGatewayInfo[] {
  const apis: ApiGatewayInfo[] = [];

  // Procurar por HttpApi ou RestApi
  const httpApiPattern = /new\s+apigatewayv2\.HttpApi\s*\(\s*this\s*,\s*['"]([^'"]+)['"]/g;
  const restApiPattern = /new\s+apigateway\.RestApi\s*\(\s*this\s*,\s*['"]([^'"]+)['"]/g;

  let match;

  // HTTP APIs
  while ((match = httpApiPattern.exec(content)) !== null) {
    const logicalName = match[1];
    
    // Tentar extrair apiName
    const apiNamePattern = new RegExp(`${logicalName}[^}]*apiName:\\s*['"\`]([^'"\`]+)['"\`]`, 's');
    const apiNameMatch = content.match(apiNamePattern);
    const apiName = apiNameMatch ? apiNameMatch[1] : logicalName;

    // Extrair rotas
    const routes = extractRoutes(content, logicalName);

    apis.push({
      logicalName,
      type: 'HTTP',
      name: apiName,
      routes,
      id: undefined, // Será preenchido em runtime
      baseUrl: undefined // Será preenchido em runtime
    });
  }

  // REST APIs
  while ((match = restApiPattern.exec(content)) !== null) {
    const logicalName = match[1];
    
    const apiNamePattern = new RegExp(`${logicalName}[^}]*restApiName:\\s*['"\`]([^'"\`]+)['"\`]`, 's');
    const apiNameMatch = content.match(apiNamePattern);
    const apiName = apiNameMatch ? apiNameMatch[1] : logicalName;

    const routes = extractRoutes(content, logicalName);

    apis.push({
      logicalName,
      type: 'REST',
      name: apiName,
      routes,
      id: undefined,
      baseUrl: undefined
    });
  }

  return apis;
}

/**
 * Extrai rotas de uma API
 */
function extractRoutes(content: string, apiLogicalName: string): string[] {
  const routes: string[] = [];

  // Procurar por addRoutes
  const routePattern = new RegExp(`${apiLogicalName}\\.addRoutes\\s*\\([^)]*path:\\s*['"]([^'"]+)['"]`, 'g');
  let match;

  while ((match = routePattern.exec(content)) !== null) {
    routes.push(match[1]);
  }

  // Procurar por addRoute (singular)
  const singleRoutePattern = new RegExp(`${apiLogicalName}\\.addRoute\\s*\\([^)]*path:\\s*['"]([^'"]+)['"]`, 'g');
  while ((match = singleRoutePattern.exec(content)) !== null) {
    routes.push(match[1]);
  }

  return [...new Set(routes)]; // Remover duplicatas
}

/**
 * Extrai informações de Lambdas
 */
function extractLambdas(content: string): LambdaInfo[] {
  const lambdas: LambdaInfo[] = [];

  // Procurar por NodejsFunction ou Function
  const nodejsPattern = /new\s+nodejs\.NodejsFunction\s*\(\s*this\s*,\s*['"]([^'"]+)['"]/g;
  const functionPattern = /new\s+lambda\.Function\s*\(\s*this\s*,\s*['"]([^'"]+)['"]/g;

  let match;

  // NodejsFunction
  while ((match = nodejsPattern.exec(content)) !== null) {
    const logicalName = match[1];
    
    // Extrair functionName
    const namePattern = new RegExp(`${logicalName}[^}]*functionName:\\s*['"\`]([^'"\`]+)['"\`]`, 's');
    const nameMatch = content.match(namePattern);
    const functionName = nameMatch ? nameMatch[1] : logicalName;

    // Extrair entry (arquivo)
    const entryPattern = new RegExp(`${logicalName}[^}]*entry:\\s*['"]([^'"]+)['"]`, 's');
    const entryMatch = content.match(entryPattern);
    const file = entryMatch ? entryMatch[1] : '';

    // Extrair description
    const descPattern = new RegExp(`${logicalName}[^}]*description:\\s*['"]([^'"]+)['"]`, 's');
    const descMatch = content.match(descPattern);
    const purpose = descMatch ? descMatch[1] : '';

    lambdas.push({
      logicalName,
      functionName,
      file,
      purpose,
      runtime: 'nodejs20.x',
      routes: [] // Será preenchido ao analisar rotas
    });
  }

  // Lambda Function
  while ((match = functionPattern.exec(content)) !== null) {
    const logicalName = match[1];
    
    const namePattern = new RegExp(`${logicalName}[^}]*functionName:\\s*['"\`]([^'"\`]+)['"\`]`, 's');
    const nameMatch = content.match(namePattern);
    const functionName = nameMatch ? nameMatch[1] : logicalName;

    const descPattern = new RegExp(`${logicalName}[^}]*description:\\s*['"]([^'"]+)['"]`, 's');
    const descMatch = content.match(descPattern);
    const purpose = descMatch ? descMatch[1] : '';

    lambdas.push({
      logicalName,
      functionName,
      file: '',
      purpose,
      runtime: 'nodejs20.x',
      routes: []
    });
  }

  return lambdas;
}

/**
 * Extrai informações de bancos de dados
 */
function extractDatabases(content: string): DatabaseInfo[] {
  const databases: DatabaseInfo[] = [];

  // Procurar por DatabaseCluster (Aurora)
  const auroraPattern = /new\s+rds\.DatabaseCluster\s*\(\s*this\s*,\s*['"]([^'"]+)['"]/g;
  let match;

  while ((match = auroraPattern.exec(content)) !== null) {
    const logicalName = match[1];
    
    // Extrair engine
    const enginePattern = /engine:\s*rds\.DatabaseClusterEngine\.(\w+)/;
    const engineMatch = content.match(enginePattern);
    let engine = 'unknown';
    
    if (engineMatch) {
      const engineType = engineMatch[1];
      if (engineType.includes('auroraPostgres')) {
        engine = 'aurora-postgresql';
      } else if (engineType.includes('auroraMysql')) {
        engine = 'aurora-mysql';
      }
    }

    // Verificar se é Serverless v2
    const mode = content.includes('serverlessV2') ? 'Serverless v2' : 'Provisioned';

    databases.push({
      logicalName,
      type: 'Aurora',
      engine,
      mode,
      region: 'us-east-1', // Será atualizado com a região real
      clusterId: undefined, // Será preenchido em runtime
      clusterArn: undefined
    });
  }

  // Procurar por DynamoDB Tables
  const dynamoPattern = /new\s+dynamodb\.Table\s*\(\s*this\s*,\s*['"]([^'"]+)['"]/g;
  while ((match = dynamoPattern.exec(content)) !== null) {
    const logicalName = match[1];
    
    const tableNamePattern = new RegExp(`${logicalName}[^}]*tableName:\\s*['"\`]([^'"\`]+)['"\`]`, 's');
    const tableNameMatch = content.match(tableNamePattern);
    const tableName = tableNameMatch ? tableNameMatch[1] : logicalName;

    databases.push({
      logicalName,
      type: 'DynamoDB',
      engine: 'dynamodb',
      mode: 'On-Demand',
      region: 'us-east-1',
      tableName
    });
  }

  return databases;
}

/**
 * Extrai informações de storage (S3, etc)
 */
function extractStorage(content: string): StorageInfo[] {
  const storage: StorageInfo[] = [];

  // Procurar por S3 Buckets
  const s3Pattern = /new\s+s3\.Bucket\s*\(\s*this\s*,\s*['"]([^'"]+)['"]/g;
  let match;

  while ((match = s3Pattern.exec(content)) !== null) {
    const logicalName = match[1];
    
    const bucketNamePattern = new RegExp(`${logicalName}[^}]*bucketName:\\s*['"\`]([^'"\`]+)['"\`]`, 's');
    const bucketNameMatch = content.match(bucketNamePattern);
    const bucketName = bucketNameMatch ? bucketNameMatch[1] : logicalName;

    // Verificar se tem encryption
    const encrypted = content.includes('encryption:') && 
                     content.includes(logicalName);

    storage.push({
      logicalName,
      type: 'S3',
      name: bucketName,
      encrypted,
      purpose: extractStoragePurpose(content, logicalName)
    });
  }

  // Procurar por CloudFront Distributions
  const cloudfrontPattern = /new\s+cloudfront\.Distribution\s*\(\s*this\s*,\s*['"]([^'"]+)['"]/g;
  while ((match = cloudfrontPattern.exec(content)) !== null) {
    const logicalName = match[1];

    storage.push({
      logicalName,
      type: 'CloudFront',
      name: logicalName,
      encrypted: true, // CloudFront sempre usa HTTPS
      purpose: 'CDN Distribution'
    });
  }

  return storage;
}

/**
 * Extrai o propósito de um recurso de storage
 */
function extractStoragePurpose(content: string, logicalName: string): string {
  // Procurar por comentários próximos
  const lines = content.split('\n');
  const logicalNameIndex = lines.findIndex(line => line.includes(logicalName));
  
  if (logicalNameIndex > 0) {
    // Verificar linhas anteriores por comentários
    for (let i = logicalNameIndex - 1; i >= Math.max(0, logicalNameIndex - 5); i--) {
      const line = lines[i].trim();
      if (line.startsWith('//')) {
        return line.replace('//', '').trim();
      }
    }
  }

  // Tentar inferir do nome
  if (logicalName.toLowerCase().includes('site')) return 'Website hosting';
  if (logicalName.toLowerCase().includes('log')) return 'Logs storage';
  if (logicalName.toLowerCase().includes('backup')) return 'Backups';
  if (logicalName.toLowerCase().includes('asset')) return 'Assets storage';

  return 'General storage';
}

/**
 * Extrai informações de segurança
 */
function extractSecurity(content: string): SecurityInfo[] {
  const security: SecurityInfo[] = [];

  // Procurar por WAF Web ACLs
  const wafPattern = /new\s+wafv2\.CfnWebACL\s*\(\s*this\s*,\s*['"]([^'"]+)['"]/g;
  let match;

  while ((match = wafPattern.exec(content)) !== null) {
    const logicalName = match[1];
    
    const namePattern = new RegExp(`${logicalName}[^}]*name:\\s*['"\`]([^'"\`]+)['"\`]`, 's');
    const nameMatch = content.match(namePattern);
    const name = nameMatch ? nameMatch[1] : logicalName;

    security.push({
      logicalName,
      type: 'WAF',
      name,
      purpose: 'Web Application Firewall',
      enabled: true
    });
  }

  // Procurar por KMS Keys
  const kmsPattern = /new\s+kms\.Key\s*\(\s*this\s*,\s*['"]([^'"]+)['"]/g;
  while ((match = kmsPattern.exec(content)) !== null) {
    const logicalName = match[1];
    
    const aliasPattern = new RegExp(`${logicalName}[^}]*alias:\\s*['"\`]([^'"\`]+)['"\`]`, 's');
    const aliasMatch = content.match(aliasPattern);
    const alias = aliasMatch ? aliasMatch[1] : logicalName;

    security.push({
      logicalName,
      type: 'KMS',
      name: alias,
      purpose: 'Encryption key',
      enabled: true
    });
  }

  // Procurar por Security Groups
  const sgPattern = /new\s+ec2\.SecurityGroup\s*\(\s*this\s*,\s*['"]([^'"]+)['"]/g;
  while ((match = sgPattern.exec(content)) !== null) {
    const logicalName = match[1];
    
    const descPattern = new RegExp(`${logicalName}[^}]*description:\\s*['"]([^'"]+)['"]`, 's');
    const descMatch = content.match(descPattern);
    const description = descMatch ? descMatch[1] : '';

    security.push({
      logicalName,
      type: 'SecurityGroup',
      name: logicalName,
      purpose: description || 'Network security',
      enabled: true
    });
  }

  // Procurar por CloudTrail
  if (content.includes('cloudtrail.Trail')) {
    const trailPattern = /new\s+cloudtrail\.Trail\s*\(\s*this\s*,\s*['"]([^'"]+)['"]/g;
    while ((match = trailPattern.exec(content)) !== null) {
      const logicalName = match[1];

      security.push({
        logicalName,
        type: 'CloudTrail',
        name: logicalName,
        purpose: 'Audit logging',
        enabled: true
      });
    }
  }

  return security;
}
