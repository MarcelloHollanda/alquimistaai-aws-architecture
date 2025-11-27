/**
 * Gerador de Documentos de Inventário
 * Feature: system-inventory-documentation
 * 
 * Gera documentos markdown consolidados do sistema AlquimistaAI.
 * Valida: Requirements 1-10
 */

import { SystemInventory, StackInfo, BackendApiInfo, FrontendInfo, CognitoInfo, CiCdInfo, GuardrailsInfo, EnvironmentVariableInfo, GapInfo, RiskInfo } from './types';
import { sanitize, sanitizeObject } from './sanitizer';

/**
 * Gera o documento principal de inventário
 * 
 * @param inventory - Dados consolidados do sistema
 * @returns Conteúdo markdown do documento
 */
export function generateMainDocument(inventory: SystemInventory): string {
  // Sanitizar todo o inventário antes de processar
  const safeInventory = sanitizeObject(inventory);
  
  const sections: string[] = [];
  
  // Cabeçalho
  sections.push(generateHeader(safeInventory));
  
  // Resumo Executivo
  sections.push(generateExecutiveSummary(safeInventory));
  
  // 1. Infraestrutura AWS
  sections.push(generateInfrastructureSection(safeInventory));
  
  // 2. Bancos de Dados e Migrations
  sections.push(generateDatabaseSection(safeInventory));
  
  // 3. Backends de API
  sections.push(generateBackendsSection(safeInventory));
  
  // 4. Frontend
  sections.push(generateFrontendSection(safeInventory));
  
  // 5. Autenticação & Autorização
  sections.push(generateAuthenticationSection(safeInventory));
  
  // 6. CI/CD e Guardrails
  sections.push(generateCiCdSection(safeInventory));
  
  // 7. Segurança, Custo e Observabilidade
  sections.push(generateGuardrailsSection(safeInventory));
  
  // 8. Variáveis de Ambiente
  sections.push(generateEnvironmentSection(safeInventory));
  
  // 9. Gaps, Riscos e Próximos Passos
  sections.push(generateGapsSection(safeInventory));
  
  return sections.join('\n\n---\n\n');
}

/**
 * Gera o cabeçalho do documento
 */
function generateHeader(inventory: SystemInventory): string {
  const date = inventory.metadata.generatedAt.toLocaleString('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'short'
  });
  
  return `# STATUS GERAL DO SISTEMA ALQUIMISTAAI

**Data de Geração:** ${date}  
**Versão:** ${inventory.metadata.version}  
**Gerado por:** ${inventory.metadata.generatedBy}  
**Região AWS Principal:** ${inventory.infrastructure.region}

---

> **⚠️ AVISO DE SEGURANÇA**  
> Este documento foi automaticamente sanitizado para remover valores sensíveis.  
> Senhas, tokens, chaves de API e outros segredos foram mascarados.`;
}

/**
 * Gera o resumo executivo
 */
function generateExecutiveSummary(inventory: SystemInventory): string {
  const stackCount = inventory.infrastructure.stacks.length;
  const migrationCount = inventory.database.migrations.length;
  const cognitoGroups = inventory.authentication.groups.length;
  const knownGaps = inventory.gaps.known.length;
  
  return `## Resumo Executivo

- **${stackCount} stacks CDK** implantadas na região ${inventory.infrastructure.region}
- **${migrationCount} migrations** de banco de dados documentadas
- **Aurora PostgreSQL Serverless v2** como banco de dados principal
- **3 backends principais:** Fibonacci Orquestrador, Nigredo e Painel Operacional
- **Frontend Next.js** com autenticação Cognito
- **${cognitoGroups} grupos Cognito** configurados para controle de acesso
- **Pipeline CI/CD** com GitHub Actions e OIDC
- **Guardrails** de segurança, custo e observabilidade implementados
- **${knownGaps} gaps conhecidos** documentados para ação futura`;
}

/**
 * Gera a seção de infraestrutura AWS
 */
function generateInfrastructureSection(inventory: SystemInventory): string {
  let content = `## 1. Infraestrutura AWS

### 1.1 Região Principal

**us-east-1** (Norte da Virgínia)

### 1.2 Stacks CDK

O sistema utiliza AWS CDK (Cloud Development Kit) com TypeScript para gerenciar a infraestrutura como código.

`;

  // Agrupar stacks por ambiente
  const devStacks = inventory.infrastructure.stacks.filter(s => s.environment === 'dev');
  const prodStacks = inventory.infrastructure.stacks.filter(s => s.environment === 'prod');
  
  if (devStacks.length > 0) {
    content += `#### Ambiente DEV\n\n`;
    for (const stack of devStacks) {
      content += generateStackDetails(stack);
    }
  }
  
  if (prodStacks.length > 0) {
    content += `\n#### Ambiente PROD\n\n`;
    for (const stack of prodStacks) {
      content += generateStackDetails(stack);
    }
  }
  
  return content;
}

/**
 * Gera detalhes de uma stack
 */
function generateStackDetails(stack: StackInfo): string {
  let content = `**${stack.name}**\n\n`;
  
  // APIs
  if (stack.resources.apis.length > 0) {
    content += `- **APIs:**\n`;
    for (const api of stack.resources.apis) {
      content += `  - ${api.logicalName} (${api.type})`;
      if (api.id) content += ` - ID: ${api.id}`;
      if (api.baseUrl) content += ` - URL: ${api.baseUrl}`;
      content += '\n';
      if (api.routes.length > 0) {
        content += `    - Rotas: ${api.routes.slice(0, 5).join(', ')}${api.routes.length > 5 ? '...' : ''}\n`;
      }
    }
  }
  
  // Lambdas
  if (stack.resources.lambdas.length > 0) {
    content += `- **Lambdas:** ${stack.resources.lambdas.length} funções\n`;
    const topLambdas = stack.resources.lambdas.slice(0, 5);
    for (const lambda of topLambdas) {
      content += `  - ${lambda.logicalName} (${lambda.runtime})`;
      if (lambda.purpose) content += ` - ${lambda.purpose}`;
      content += '\n';
    }
    if (stack.resources.lambdas.length > 5) {
      content += `  - ... e mais ${stack.resources.lambdas.length - 5} funções\n`;
    }
  }
  
  // Databases
  if (stack.resources.databases.length > 0) {
    content += `- **Bancos de Dados:**\n`;
    for (const db of stack.resources.databases) {
      content += `  - ${db.name} (${db.type})`;
      if (db.engine) content += ` - Engine: ${db.engine}`;
      if (db.mode) content += ` - Modo: ${db.mode}`;
      content += '\n';
    }
  }
  
  // Storage
  if (stack.resources.storage.length > 0) {
    content += `- **Storage:**\n`;
    for (const storage of stack.resources.storage) {
      content += `  - ${storage.name} (${storage.type}) - ${storage.purpose}\n`;
    }
  }
  
  // Security
  if (stack.resources.security.length > 0) {
    content += `- **Segurança:**\n`;
    for (const sec of stack.resources.security) {
      content += `  - ${sec.name} (${sec.type}) - ${sec.description}\n`;
    }
  }
  
  content += '\n';
  return content;
}

/**
 * Gera a seção de banco de dados
 */
function generateDatabaseSection(inventory: SystemInventory): string {
  const db = inventory.database;
  
  let content = `## 2. Bancos de Dados e Migrations

### 2.1 Aurora PostgreSQL

- **Engine:** ${db.engine}
- **Modo:** ${db.mode}
- **Região:** ${db.region}

### 2.2 Schemas

`;

  for (const schema of db.schemas) {
    content += `- \`${schema}\`\n`;
  }
  
  content += `\n### 2.3 Migrations Oficiais

Total de migrations: **${db.migrations.length}**

`;

  // Listar migrations
  for (const migration of db.migrations) {
    const statusIcon = migration.status === 'applied' ? '✅' : 
                       migration.status === 'skip' ? '⏭️' : '⏸️';
    content += `${statusIcon} **${migration.number}** - \`${migration.filename}\`\n`;
    content += `   ${migration.summary}\n\n`;
  }
  
  // Decisões conhecidas
  if (db.decisions.length > 0) {
    content += `### 2.4 Decisões Conhecidas\n\n`;
    for (const decision of db.decisions) {
      content += `- ${decision}\n`;
    }
  }
  
  return content;
}

/**
 * Gera a seção de backends
 */
function generateBackendsSection(inventory: SystemInventory): string {
  let content = `## 3. Backends de API

O sistema possui três backends principais, cada um com responsabilidades específicas:

`;

  content += generateBackendDetails('Fibonacci Orquestrador', inventory.backends.fibonacci);
  content += generateBackendDetails('Nigredo - Núcleo de Prospecção', inventory.backends.nigredo);
  content += generateBackendDetails('Painel Operacional', inventory.backends.operationalDashboard);
  
  return content;
}

/**
 * Gera detalhes de um backend
 */
function generateBackendDetails(title: string, backend: BackendApiInfo): string {
  let content = `### ${title}\n\n`;
  content += `**Propósito:** ${backend.purpose}\n\n`;
  
  // API Gateway DEV
  if (backend.apiGateway.dev) {
    const api = backend.apiGateway.dev;
    content += `**API Gateway DEV:**\n`;
    content += `- Tipo: ${api.type}\n`;
    if (api.id) content += `- ID: ${api.id}\n`;
    if (api.baseUrl) content += `- URL Base: ${api.baseUrl}\n`;
    if (api.routes.length > 0) {
      content += `- Rotas principais:\n`;
      for (const route of api.routes.slice(0, 10)) {
        content += `  - ${route}\n`;
      }
      if (api.routes.length > 10) {
        content += `  - ... e mais ${api.routes.length - 10} rotas\n`;
      }
    }
    content += '\n';
  }
  
  // API Gateway PROD
  if (backend.apiGateway.prod) {
    const api = backend.apiGateway.prod;
    content += `**API Gateway PROD:**\n`;
    content += `- Tipo: ${api.type}\n`;
    if (api.id) content += `- ID: ${api.id}\n`;
    if (api.baseUrl) content += `- URL Base: ${api.baseUrl}\n`;
    content += '\n';
  }
  
  // Handlers
  if (backend.handlers.length > 0) {
    content += `**Handlers Lambda:** ${backend.handlers.length} funções\n\n`;
    const topHandlers = backend.handlers.slice(0, 8);
    for (const handler of topHandlers) {
      content += `- \`${handler.file}\` - ${handler.purpose}\n`;
    }
    if (backend.handlers.length > 8) {
      content += `- ... e mais ${backend.handlers.length - 8} handlers\n`;
    }
    content += '\n';
  }
  
  // Integrações
  if (backend.integrations.length > 0) {
    content += `**Integrações:**\n`;
    for (const integration of backend.integrations) {
      content += `- ${integration}\n`;
    }
    content += '\n';
  }
  
  return content;
}

/**
 * Gera a seção de frontend
 */
function generateFrontendSection(inventory: SystemInventory): string {
  const frontend = inventory.frontend.operationalPanel;
  const commercial = inventory.frontend.commercialSites;
  
  let content = `## 4. Frontend

### 4.1 Painel Operacional (Next.js)

- **Framework:** ${frontend.framework}
- **Localização:** \`${frontend.location}\`
- **Total de Rotas:** ${frontend.routes.length}

#### Rotas por Tipo

`;

  // Agrupar rotas por tipo
  const routesByType: Record<string, string[]> = {};
  for (const route of frontend.routes) {
    if (!routesByType[route.type]) {
      routesByType[route.type] = [];
    }
    routesByType[route.type].push(route.path);
  }
  
  for (const [type, routes] of Object.entries(routesByType)) {
    content += `**${type}** (${routes.length} rotas):\n`;
    for (const route of routes.slice(0, 5)) {
      content += `- ${route}\n`;
    }
    if (routes.length > 5) {
      content += `- ... e mais ${routes.length - 5} rotas\n`;
    }
    content += '\n';
  }
  
  // Integração Cognito
  content += `#### Integração com Cognito\n\n`;
  content += `- **User Pool ID:** ${frontend.cognito.userPoolId}\n`;
  content += `- **Client ID:** ${frontend.cognito.clientId}\n`;
  content += `- **Região:** ${frontend.cognito.region}\n`;
  content += `- **Hosted UI Domain:** ${frontend.cognito.hostedUiDomain}\n`;
  content += `- **Redirect URI:** ${frontend.cognito.redirectUri}\n`;
  content += `- **Logout URI:** ${frontend.cognito.logoutUri}\n`;
  content += `- **Auth Flow:** ${frontend.cognito.authFlow}\n`;
  content += `- **Middleware Protection:** ${frontend.cognito.middlewareProtection ? 'Sim' : 'Não'}\n\n`;
  
  // API Clients
  if (frontend.apiClients.length > 0) {
    content += `#### API Clients\n\n`;
    for (const client of frontend.apiClients) {
      content += `- **${client.name}** (\`${client.file}\`) - Base URL: ${client.baseUrlSource}\n`;
    }
    content += '\n';
  }
  
  // Testes
  content += `#### Status de Testes\n\n`;
  content += `- **Unit:** ${frontend.tests.unit.passing}/${frontend.tests.unit.total} - ${frontend.tests.unit.status}\n`;
  content += `- **Integration:** ${frontend.tests.integration.passing}/${frontend.tests.integration.total} - ${frontend.tests.integration.status}\n`;
  content += `- **E2E:** ${frontend.tests.e2e.passing}/${frontend.tests.e2e.total} - ${frontend.tests.e2e.status}\n`;
  content += `- **Security:** ${frontend.tests.security.passing}/${frontend.tests.security.total} - ${frontend.tests.security.status}\n\n`;
  
  // Sites Comerciais
  content += `### 4.2 Sites Comerciais\n\n`;
  content += `- **Tipo de Deploy:** ${commercial.type}\n`;
  if (commercial.bucket) content += `- **Bucket S3:** ${commercial.bucket}\n`;
  if (commercial.distributionId) content += `- **CloudFront Distribution:** ${commercial.distributionId}\n`;
  if (commercial.domain) content += `- **Domínio:** ${commercial.domain}\n`;
  
  return content;
}

/**
 * Gera a seção de autenticação
 */
function generateAuthenticationSection(inventory: SystemInventory): string {
  const auth = inventory.authentication;
  
  let content = `## 5. Autenticação & Autorização

### 5.1 Amazon Cognito User Pool

- **Nome:** ${auth.userPool.name}
- **Região:** ${auth.userPool.region}
- **User Pool ID:** ${auth.userPool.id}
- **Hosted UI Domain:** ${auth.userPool.hostedUiDomain}

#### Client IDs

`;

  for (const clientId of auth.userPool.clientIds) {
    content += `- ${clientId}\n`;
  }
  
  content += `\n### 5.2 Grupos Cognito\n\n`;
  
  for (const group of auth.groups) {
    content += `**${group.name}**\n`;
    content += `- Função: ${group.role}\n\n`;
  }
  
  // Usuários DEV (apenas emails e grupos, SEM senhas)
  if (auth.users.length > 0) {
    content += `### 5.3 Usuários DEV\n\n`;
    content += `> ⚠️ Apenas para ambiente de desenvolvimento. Senhas não são incluídas neste documento.\n\n`;
    
    for (const user of auth.users) {
      content += `- **${user.email}**\n`;
      content += `  - Grupos: ${user.groups.join(', ')}\n\n`;
    }
  }
  
  return content;
}

/**
 * Gera a seção de CI/CD
 */
function generateCiCdSection(inventory: SystemInventory): string {
  const cicd = inventory.cicd;
  
  let content = `## 6. CI/CD e Guardrails

### 6.1 Pipeline GitHub Actions

`;

  if (cicd.workflow.exists) {
    content += `**Arquivo:** \`${cicd.workflow.file}\`\n`;
    if (cicd.workflow.name) content += `**Nome:** ${cicd.workflow.name}\n`;
    content += `\n**Triggers:**\n`;
    for (const trigger of cicd.workflow.triggers) {
      content += `- ${trigger}\n`;
    }
    
    content += `\n**Jobs:**\n\n`;
    for (const job of cicd.workflow.jobs) {
      content += `- **${job.name}** (${job.id})\n`;
      content += `  - Runs on: ${job.runsOn}\n`;
      if (job.environment) content += `  - Environment: ${job.environment}\n`;
      if (job.needs.length > 0) content += `  - Depends on: ${job.needs.join(', ')}\n`;
      content += `  - Steps: ${job.steps}\n\n`;
    }
  } else {
    content += `⚠️ Workflow não encontrado ou com erro: ${cicd.workflow.error}\n\n`;
  }
  
  // OIDC
  content += `### 6.2 Integração OIDC\n\n`;
  if (cicd.oidc.configured) {
    content += `- **Role:** ${cicd.oidc.role}\n`;
    content += `- **Provider:** ${cicd.oidc.provider}\n`;
  } else {
    content += `⚠️ OIDC não configurado ou com erro: ${cicd.oidc.error}\n`;
  }
  
  // Scripts de Validação
  if (cicd.scripts.length > 0) {
    content += `\n### 6.3 Scripts de Validação\n\n`;
    
    const scriptsByType: Record<string, typeof cicd.scripts> = {};
    for (const script of cicd.scripts) {
      if (!scriptsByType[script.type]) {
        scriptsByType[script.type] = [];
      }
      scriptsByType[script.type].push(script);
    }
    
    for (const [type, scripts] of Object.entries(scriptsByType)) {
      content += `**${type}:**\n`;
      for (const script of scripts) {
        content += `- \`${script.path}\` - ${script.description}\n`;
      }
      content += '\n';
    }
  }
  
  // Documentos de Teste
  if (cicd.tests.length > 0) {
    content += `### 6.4 Documentação de Testes\n\n`;
    for (const test of cicd.tests) {
      content += `- [${test.title}](${test.path}) (${test.type})\n`;
    }
  }
  
  return content;
}

/**
 * Gera a seção de guardrails
 */
function generateGuardrailsSection(inventory: SystemInventory): string {
  const guardrails = inventory.guardrails;
  
  let content = `## 7. Segurança, Custo e Observabilidade

### 7.1 Guardrails de Segurança

`;

  // CloudTrail
  if (guardrails.security.cloudTrail.enabled) {
    const ct = guardrails.security.cloudTrail;
    content += `#### CloudTrail\n\n`;
    content += `- **Trail Name:** ${ct.trailName}\n`;
    content += `- **Bucket:** ${ct.bucketName}\n`;
    content += `- **Região:** ${ct.region}\n`;
    content += `- **Retenção:** ${ct.retentionDays} dias\n`;
    content += `- **Validação de Logs:** ${ct.logFileValidation ? 'Sim' : 'Não'}\n`;
    content += `- **Multi-Region:** ${ct.multiRegion ? 'Sim' : 'Não'}\n\n`;
  }
  
  // GuardDuty
  if (guardrails.security.guardDuty.enabled) {
    const gd = guardrails.security.guardDuty;
    content += `#### GuardDuty\n\n`;
    content += `- **Detector ID:** ${gd.detectorId}\n`;
    content += `- **Região:** ${gd.region}\n`;
    content += `- **Frequência de Publicação:** ${gd.findingPublishingFrequency}\n`;
    content += `- **Proteção S3:** ${gd.s3Protection ? 'Sim' : 'Não'}\n`;
    content += `- **Proteção Malware:** ${gd.malwareProtection ? 'Sim' : 'Não'}\n\n`;
  }
  
  // WAF
  if (guardrails.security.waf.enabled) {
    const waf = guardrails.security.waf;
    content += `#### WAF (Web Application Firewall)\n\n`;
    content += `**WebACLs:** ${waf.webAcls.length}\n\n`;
    for (const acl of waf.webAcls) {
      content += `- **${acl.name}** (${acl.scope} - ${acl.environment})\n`;
      content += `  - Ação Padrão: ${acl.defaultAction}\n`;
      content += `  - Descrição: ${acl.description}\n`;
      content += `  - Regras: ${acl.rules.length}\n\n`;
    }
    
    if (waf.logGroups.length > 0) {
      content += `**Log Groups:**\n`;
      for (const lg of waf.logGroups) {
        content += `- ${lg.name} (${lg.environment}) - Retenção: ${lg.retentionDays} dias\n`;
      }
      content += '\n';
    }
  }
  
  // SNS Topics
  if (guardrails.security.snsTopics.length > 0) {
    content += `#### SNS Topics de Segurança\n\n`;
    for (const topic of guardrails.security.snsTopics) {
      content += `- **${topic.displayName}** (\`${topic.name}\`)\n`;
      content += `  - Propósito: ${topic.purpose}\n`;
      if (topic.subscriptions.length > 0) {
        content += `  - Subscriptions: ${topic.subscriptions.join(', ')}\n`;
      }
      content += '\n';
    }
  }
  
  // Guardrails de Custo
  content += `### 7.2 Guardrails de Custo\n\n`;
  
  if (guardrails.cost.budgets.length > 0) {
    content += `#### AWS Budgets\n\n`;
    for (const budget of guardrails.cost.budgets) {
      content += `- **${budget.name}**\n`;
      content += `  - Tipo: ${budget.budgetType}\n`;
      content += `  - Período: ${budget.timeUnit}\n`;
      content += `  - Valor: ${budget.currency} ${budget.amount.toFixed(2)}\n`;
      content += `  - Limiares: ${budget.thresholds.join('%, ')}%\n`;
      content += `  - Notificações: ${budget.notificationTypes.join(', ')}\n\n`;
    }
  }
  
  if (guardrails.cost.anomalyDetection) {
    const ad = guardrails.cost.anomalyDetection;
    content += `#### Cost Anomaly Detection\n\n`;
    content += `- **Monitor:** ${ad.monitorName}\n`;
    content += `- **Tipo:** ${ad.monitorType}\n`;
    content += `- **Dimensão:** ${ad.dimension}\n`;
    content += `- **Limiar:** ${ad.threshold}%\n`;
    content += `- **Frequência:** ${ad.frequency}\n\n`;
  }
  
  // Guardrails de Observabilidade
  content += `### 7.3 Guardrails de Observabilidade\n\n`;
  
  if (guardrails.observability.dashboards.length > 0) {
    content += `#### CloudWatch Dashboards\n\n`;
    for (const dashboard of guardrails.observability.dashboards) {
      content += `**${dashboard.name}**\n`;
      content += `- Propósito: ${dashboard.purpose}\n`;
      content += `- Widgets: ${dashboard.widgets.length}\n`;
      if (dashboard.widgets.length > 0) {
        content += `  - ${dashboard.widgets.slice(0, 5).join(', ')}`;
        if (dashboard.widgets.length > 5) {
          content += `, ... e mais ${dashboard.widgets.length - 5}`;
        }
        content += '\n';
      }
      content += '\n';
    }
  }
  
  return content;
}

/**
 * Gera a seção de variáveis de ambiente
 */
function generateEnvironmentSection(inventory: SystemInventory): string {
  let content = `## 8. Variáveis de Ambiente

### 8.1 Tabela de Referência

> ⚠️ Valores sensíveis não são incluídos neste documento. Consulte AWS Secrets Manager ou SSM Parameter Store.

| Variável | Usado Em | Armazenado Em | Descrição |
|----------|----------|---------------|-----------|
`;

  for (const envVar of inventory.environment.variables) {
    const usedIn = envVar.usedIn.join(', ');
    const storedIn = envVar.storedIn.join(', ');
    content += `| \`${envVar.name}\` | ${usedIn} | ${storedIn} | ${envVar.description} |\n`;
  }
  
  // Integrações Externas
  if (inventory.environment.integrations.length > 0) {
    content += `\n### 8.2 Integrações Externas\n\n`;
    for (const integration of inventory.environment.integrations) {
      content += `**${integration.name}** (${integration.type})\n`;
      content += `- Arquivos: ${integration.files.join(', ')}\n`;
      content += `- Variáveis necessárias: ${integration.variables.join(', ')}\n\n`;
    }
  }
  
  return content;
}

/**
 * Gera a seção de gaps e riscos
 */
function generateGapsSection(inventory: SystemInventory): string {
  let content = `## 9. Gaps, Riscos e Próximos Passos

### 9.1 Gaps Conhecidos

`;

  if (inventory.gaps.known.length === 0) {
    content += `✅ Nenhum gap conhecido no momento.\n\n`;
  } else {
    // Agrupar por severidade
    const high = inventory.gaps.known.filter(g => g.severity === 'high');
    const medium = inventory.gaps.known.filter(g => g.severity === 'medium');
    const low = inventory.gaps.known.filter(g => g.severity === 'low');
    
    if (high.length > 0) {
      content += `#### Alta Severidade\n\n`;
      for (const gap of high) {
        content += `- **${gap.description}**\n`;
        content += `  - Referência: \`${gap.reference}\`\n\n`;
      }
    }
    
    if (medium.length > 0) {
      content += `#### Média Severidade\n\n`;
      for (const gap of medium) {
        content += `- **${gap.description}**\n`;
        content += `  - Referência: \`${gap.reference}\`\n\n`;
      }
    }
    
    if (low.length > 0) {
      content += `#### Baixa Severidade\n\n`;
      for (const gap of low) {
        content += `- **${gap.description}**\n`;
        content += `  - Referência: \`${gap.reference}\`\n\n`;
      }
    }
  }
  
  // Riscos
  content += `### 9.2 Riscos Identificados\n\n`;
  
  if (inventory.gaps.risks.length === 0) {
    content += `✅ Nenhum risco identificado no momento.\n\n`;
  } else {
    for (const risk of inventory.gaps.risks) {
      content += `**${risk.description}**\n`;
      content += `- Impacto: ${risk.impact}\n`;
      if (risk.mitigation) {
        content += `- Mitigação: ${risk.mitigation}\n`;
      }
      content += '\n';
    }
  }
  
  // Próximos Passos
  content += `### 9.3 Próximos Passos Recomendados\n\n`;
  
  if (inventory.gaps.nextSteps.length === 0) {
    content += `✅ Sistema está completo e operacional.\n`;
  } else {
    for (let i = 0; i < inventory.gaps.nextSteps.length; i++) {
      content += `${i + 1}. ${inventory.gaps.nextSteps[i]}\n`;
    }
  }
  
  return content;
}

/**
 * Gera o índice compacto do sistema
 * Otimizado para consumo por IA
 * 
 * @param inventory - Dados consolidados do sistema
 * @returns Conteúdo markdown do índice compacto
 */
export function generateShortIndex(inventory: SystemInventory): string {
  // Sanitizar todo o inventário antes de processar
  const safeInventory = sanitizeObject(inventory);
  
  const sections: string[] = [];
  
  // Cabeçalho (usar data original antes da sanitização)
  const dateStr = inventory.metadata.generatedAt.toISOString();
  sections.push(`# SHORT INDEX — STATUS GERAL ALQUIMISTAAI

**Gerado em:** ${dateStr}  
**Versão:** ${safeInventory.metadata.version}

> Índice compacto otimizado para parsing por IA`);
  
  // Identificadores-Chave
  sections.push(generateShortIndexIdentifiers(safeInventory));
  
  // Backends
  sections.push(generateShortIndexBackends(safeInventory));
  
  // Frontends
  sections.push(generateShortIndexFrontends(safeInventory));
  
  // CI/CD
  sections.push(generateShortIndexCiCd(safeInventory));
  
  // Segurança
  sections.push(generateShortIndexSecurity(safeInventory));
  
  // Variáveis-Chave
  sections.push(generateShortIndexVariables(safeInventory));
  
  return sections.join('\n\n---\n\n');
}

/**
 * Gera identificadores-chave para o índice compacto
 */
function generateShortIndexIdentifiers(inventory: SystemInventory): string {
  let content = `## Identificadores-Chave

**AWS Region:** ${inventory.infrastructure.region}

**Aurora Cluster:**
- Engine: ${inventory.database.engine}
- Mode: ${inventory.database.mode}
- Schemas: ${inventory.database.schemas.join(', ')}

`;

  // APIs
  const fibApi = inventory.backends.fibonacci.apiGateway;
  const nigApi = inventory.backends.nigredo.apiGateway;
  const dashApi = inventory.backends.operationalDashboard.apiGateway;
  
  if (fibApi.dev) {
    content += `**API Gateway Fibonacci DEV:**\n`;
    if (fibApi.dev.id) content += `- ID: ${fibApi.dev.id}\n`;
    if (fibApi.dev.baseUrl) content += `- URL: ${fibApi.dev.baseUrl}\n`;
  }
  
  if (fibApi.prod) {
    content += `\n**API Gateway Fibonacci PROD:**\n`;
    if (fibApi.prod.id) content += `- ID: ${fibApi.prod.id}\n`;
    if (fibApi.prod.baseUrl) content += `- URL: ${fibApi.prod.baseUrl}\n`;
  }
  
  if (nigApi.dev) {
    content += `\n**API Gateway Nigredo DEV:**\n`;
    if (nigApi.dev.id) content += `- ID: ${nigApi.dev.id}\n`;
    if (nigApi.dev.baseUrl) content += `- URL: ${nigApi.dev.baseUrl}\n`;
  }
  
  if (dashApi.dev) {
    content += `\n**API Gateway Painel DEV:**\n`;
    if (dashApi.dev.id) content += `- ID: ${dashApi.dev.id}\n`;
    if (dashApi.dev.baseUrl) content += `- URL: ${dashApi.dev.baseUrl}\n`;
  }
  
  // Cognito
  content += `\n**User Pool Cognito:**\n`;
  content += `- ID: ${inventory.authentication.userPool.id}\n`;
  content += `- Name: ${inventory.authentication.userPool.name}\n`;
  content += `- Domain: ${inventory.authentication.userPool.hostedUiDomain}\n`;
  
  // CloudFront
  const commercial = inventory.frontend.commercialSites;
  if (commercial.distributionId) {
    content += `\n**CloudFront Distribution:**\n`;
    content += `- ID: ${commercial.distributionId}\n`;
    if (commercial.domain) content += `- Domain: ${commercial.domain}\n`;
  }
  
  // Buckets S3
  if (commercial.bucket) {
    content += `\n**Buckets S3:**\n`;
    content += `- Frontend: ${commercial.bucket}\n`;
  }
  
  // Stacks CDK
  content += `\n**Stacks CDK:**\n`;
  for (const stack of inventory.infrastructure.stacks) {
    content += `- ${stack.name} (${stack.environment})\n`;
  }
  
  // Dashboards
  if (inventory.guardrails.observability.dashboards.length > 0) {
    content += `\n**Dashboards CloudWatch:**\n`;
    for (const dashboard of inventory.guardrails.observability.dashboards) {
      content += `- ${dashboard.name}\n`;
    }
  }
  
  return content;
}

/**
 * Gera resumo de backends para o índice compacto
 */
function generateShortIndexBackends(inventory: SystemInventory): string {
  let content = `## Backends

**Fibonacci Orquestrador**
- ${inventory.backends.fibonacci.purpose}
- Handlers: ${inventory.backends.fibonacci.handlers.length}
- Integrações: ${inventory.backends.fibonacci.integrations.join(', ')}

**Nigredo**
- ${inventory.backends.nigredo.purpose}
- Handlers: ${inventory.backends.nigredo.handlers.length}
- Integrações: ${inventory.backends.nigredo.integrations.join(', ')}

**Painel Operacional**
- ${inventory.backends.operationalDashboard.purpose}
- Handlers: ${inventory.backends.operationalDashboard.handlers.length}
`;

  return content;
}

/**
 * Gera resumo de frontends para o índice compacto
 */
function generateShortIndexFrontends(inventory: SystemInventory): string {
  const frontend = inventory.frontend.operationalPanel;
  
  return `## Frontends

**Painel Operacional (Next.js)**
- Framework: ${frontend.framework}
- Rotas: ${frontend.routes.length}
- Cognito: ${frontend.cognito.userPoolId}
- API Clients: ${frontend.apiClients.length}

**Sites Comerciais**
- Deploy: ${inventory.frontend.commercialSites.type}
`;
}

/**
 * Gera resumo de CI/CD para o índice compacto
 */
function generateShortIndexCiCd(inventory: SystemInventory): string {
  const cicd = inventory.cicd;
  
  let content = `## CI/CD

**GitHub Actions**
- Workflow: ${cicd.workflow.exists ? cicd.workflow.file : 'Não configurado'}
- Jobs: ${cicd.workflow.jobs.length}
- OIDC: ${cicd.oidc.configured ? 'Configurado' : 'Não configurado'}
`;

  if (cicd.oidc.configured && cicd.oidc.role) {
    content += `- Role: ${cicd.oidc.role}\n`;
  }
  
  content += `\n**Scripts de Validação:** ${cicd.scripts.length}`;
  
  return content;
}

/**
 * Gera resumo de segurança para o índice compacto
 */
function generateShortIndexSecurity(inventory: SystemInventory): string {
  const sec = inventory.guardrails.security;
  
  return `## Segurança

**CloudTrail:** ${sec.cloudTrail.enabled ? 'Habilitado' : 'Desabilitado'}
**GuardDuty:** ${sec.guardDuty.enabled ? 'Habilitado' : 'Desabilitado'}
**WAF:** ${sec.waf.enabled ? `${sec.waf.webAcls.length} WebACLs` : 'Desabilitado'}
**SNS Topics:** ${sec.snsTopics.length}

**Budgets:** ${inventory.guardrails.cost.budgets.length}
**Anomaly Detection:** ${inventory.guardrails.cost.anomalyDetection ? 'Habilitado' : 'Desabilitado'}
`;
}

/**
 * Gera lista de variáveis-chave para o índice compacto
 */
function generateShortIndexVariables(inventory: SystemInventory): string {
  let content = `## Variáveis-Chave

> Valores não incluídos por segurança. Consulte Secrets Manager/SSM.

`;

  // Listar apenas nomes de variáveis, sem valores
  for (const envVar of inventory.environment.variables.slice(0, 20)) {
    content += `- \`${envVar.name}\` (${envVar.usedIn.join(', ')})\n`;
  }
  
  if (inventory.environment.variables.length > 20) {
    content += `\n... e mais ${inventory.environment.variables.length - 20} variáveis\n`;
  }
  
  return content;
}

