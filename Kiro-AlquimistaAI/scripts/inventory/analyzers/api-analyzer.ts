/**
 * Analisador de APIs Backend
 * 
 * Extrai informações sobre APIs do sistema:
 * - Fibonacci Orquestrador
 * - Nigredo
 * - Painel Operacional (Operational Dashboard)
 * - Alquimista Platform
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { BackendApiInfo, LambdaHandlerInfo, ApiGatewayInfo } from '../types';

/**
 * Analisa handlers Lambda em um diretório
 */
function analyzeLambdaHandlers(directory: string): LambdaHandlerInfo[] {
  const handlers: LambdaHandlerInfo[] = [];
  
  try {
    const handlerFiles = glob.sync(`${directory}/**/*.ts`, {
      ignore: ['**/*.test.ts', '**/*.spec.ts', '**/shared/**', '**/types/**']
    });

    for (const file of handlerFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(process.cwd(), file);
      
      // Extrair nome lógico do arquivo
      const fileName = path.basename(file, '.ts');
      const logicalName = fileName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');

      // Tentar extrair propósito dos comentários
      let purpose = '';
      const purposeMatch = content.match(/\/\*\*[\s\S]*?\*\s+([^\n]+)/);
      if (purposeMatch) {
        purpose = purposeMatch[1].trim();
      }

      // Tentar extrair rotas dos comentários
      const routes: string[] = [];
      const routeMatches = content.matchAll(/(GET|POST|PUT|DELETE|PATCH)\s+(\/[^\s\n]+)/g);
      for (const match of routeMatches) {
        routes.push(`${match[1]} ${match[2]}`);
      }

      handlers.push({
        logicalName,
        file: relativePath,
        purpose: purpose || `Handler para ${fileName}`,
        routes
      });
    }
  } catch (error) {
    console.warn(`Erro ao analisar handlers em ${directory}:`, error);
  }

  return handlers;
}

/**
 * Extrai rotas de API Gateway de um arquivo de stack CDK
 */
function extractApiRoutesFromStack(stackFile: string): string[] {
  const routes: string[] = [];
  
  try {
    const content = fs.readFileSync(stackFile, 'utf-8');
    
    // Padrão para encontrar addRoutes
    const routePattern = /addRoutes\s*\(\s*\{[^}]*path:\s*['"]([^'"]+)['"][^}]*methods:\s*\[[^\]]*HttpMethod\.(\w+)[^\]]*\]/g;
    
    let match;
    while ((match = routePattern.exec(content)) !== null) {
      const path = match[1];
      const method = match[2];
      routes.push(`${method} ${path}`);
    }
  } catch (error) {
    console.warn(`Erro ao extrair rotas de ${stackFile}:`, error);
  }

  return routes;
}

/**
 * Extrai informações de API Gateway de um stack CDK
 */
function extractApiGatewayInfo(stackFile: string, apiName: string): ApiGatewayInfo | undefined {
  try {
    const content = fs.readFileSync(stackFile, 'utf-8');
    
    // Procurar por criação de HttpApi
    const apiPattern = new RegExp(`new\\s+apigatewayv2\\.HttpApi\\s*\\([^,]+,\\s*['"]${apiName}['"]`, 'i');
    if (!apiPattern.test(content)) {
      return undefined;
    }

    // Extrair tipo (sempre HTTP para HttpApi)
    const type = 'HTTP';

    // Extrair rotas
    const routes = extractApiRoutesFromStack(stackFile);

    return {
      logicalName: apiName,
      type,
      routes
    };
  } catch (error) {
    console.warn(`Erro ao extrair info de API Gateway de ${stackFile}:`, error);
    return undefined;
  }
}

/**
 * Analisa a API do Fibonacci Orquestrador
 */
export function analyzeFibonacciApi(): BackendApiInfo {
  const stackFile = 'lib/fibonacci-stack.ts';
  
  return {
    name: 'Fibonacci Orquestrador',
    purpose: 'Sistema de orquestração principal para gestão de leads e automações B2B',
    apiGateway: {
      dev: extractApiGatewayInfo(stackFile, 'FibonacciApi') || {
        logicalName: 'FibonacciHttpApi',
        type: 'HTTP',
        routes: []
      },
      prod: extractApiGatewayInfo(stackFile, 'FibonacciApi') || {
        logicalName: 'FibonacciHttpApi',
        type: 'HTTP',
        routes: []
      }
    },
    handlers: analyzeLambdaHandlers('lambda/fibonacci'),
    integrations: [
      'Nigredo (recebe eventos via webhook)',
      'Aurora PostgreSQL',
      'EventBridge',
      'SQS'
    ]
  };
}

/**
 * Analisa a API do Nigredo
 */
export function analyzeNigredoApi(): BackendApiInfo {
  const stackFile = 'lib/nigredo-stack.ts';
  const routes = extractApiRoutesFromStack(stackFile);

  return {
    name: 'Nigredo - Núcleo de Prospecção',
    purpose: 'Sistema dedicado à prospecção e qualificação de leads',
    apiGateway: {
      dev: {
        logicalName: 'NigredoHttpApi',
        type: 'HTTP',
        routes: routes.length > 0 ? routes : [
          'POST /api/leads',
          'GET /api/leads',
          'GET /api/leads/{id}'
        ]
      },
      prod: {
        logicalName: 'NigredoHttpApi',
        type: 'HTTP',
        routes: routes.length > 0 ? routes : [
          'POST /api/leads',
          'GET /api/leads',
          'GET /api/leads/{id}'
        ]
      }
    },
    handlers: analyzeLambdaHandlers('lambda/nigredo'),
    integrations: [
      'Fibonacci (envia eventos via EventBridge)',
      'Aurora PostgreSQL (schema nigredo)',
      'EventBridge',
      'SQS (filas de agentes)',
      'AWS Comprehend (análise de sentimento)',
      'Bedrock (LLM para atendimento)'
    ]
  };
}

/**
 * Analisa a API do Painel Operacional
 */
export function analyzeOperationalDashboardApi(): BackendApiInfo {
  const stackFile = 'lib/operational-dashboard-stack.ts';
  const routes = extractApiRoutesFromStack(stackFile);

  return {
    name: 'Painel Operacional',
    purpose: 'API para dashboard operacional interno e gestão de tenants',
    apiGateway: {
      dev: {
        logicalName: 'OperationalDashboardApi',
        type: 'HTTP',
        routes: routes.length > 0 ? routes : [
          'GET /tenant/me',
          'GET /tenant/agents',
          'GET /tenant/integrations',
          'GET /tenant/usage',
          'GET /tenant/incidents',
          'GET /internal/tenants',
          'GET /internal/tenants/{id}',
          'GET /internal/tenants/{id}/agents',
          'GET /internal/usage/overview',
          'GET /internal/billing/overview',
          'POST /internal/operations/commands',
          'GET /internal/operations/commands'
        ]
      },
      prod: {
        logicalName: 'OperationalDashboardApi',
        type: 'HTTP',
        routes: routes.length > 0 ? routes : [
          'GET /tenant/me',
          'GET /tenant/agents',
          'GET /tenant/integrations',
          'GET /tenant/usage',
          'GET /tenant/incidents',
          'GET /internal/tenants',
          'GET /internal/tenants/{id}',
          'GET /internal/tenants/{id}/agents',
          'GET /internal/usage/overview',
          'GET /internal/billing/overview',
          'POST /internal/operations/commands',
          'GET /internal/operations/commands'
        ]
      }
    },
    handlers: [
      ...analyzeLambdaHandlers('lambda/platform'),
      ...analyzeLambdaHandlers('lambda/internal')
    ],
    integrations: [
      'Aurora PostgreSQL',
      'DynamoDB (operational_commands)',
      'ElastiCache Redis (cache)',
      'Cognito (autenticação)',
      'EventBridge'
    ]
  };
}

/**
 * Analisa a API da Plataforma Alquimista
 */
export function analyzeAlquimistaPlatformApi(): BackendApiInfo {
  const stackFile = 'lib/alquimista-stack.ts';
  const routes = extractApiRoutesFromStack(stackFile);

  return {
    name: 'Alquimista Platform',
    purpose: 'API para marketplace de agentes, assinaturas e gestão de plataforma',
    apiGateway: {
      dev: {
        logicalName: 'AlquimistaPlatformApi',
        type: 'HTTP',
        routes: routes.length > 0 ? routes : [
          'GET /api/agents',
          'POST /api/agents/{id}/activate',
          'POST /api/agents/{id}/deactivate',
          'GET /api/audit-logs',
          'GET /api/agents/{id}/metrics',
          'GET /api/agents/metrics',
          'POST /api/approvals',
          'GET /api/approvals',
          'GET /api/approvals/{id}',
          'POST /api/approvals/{id}/decide',
          'DELETE /api/approvals/{id}',
          'POST /api/companies',
          'GET /api/companies/{tenantId}',
          'PUT /api/companies/{tenantId}',
          'POST /api/upload/logo',
          'POST /api/users',
          'PUT /api/users/{userId}',
          'GET /api/users/{userId}',
          'POST /api/integrations',
          'DELETE /api/integrations/{integrationId}',
          'GET /api/integrations',
          'POST /api/trials/start',
          'POST /api/trials/invoke',
          'POST /api/commercial/contact'
        ]
      },
      prod: {
        logicalName: 'AlquimistaPlatformApi',
        type: 'HTTP',
        routes: routes.length > 0 ? routes : [
          'GET /api/agents',
          'POST /api/agents/{id}/activate',
          'POST /api/agents/{id}/deactivate',
          'GET /api/audit-logs',
          'GET /api/agents/{id}/metrics',
          'GET /api/agents/metrics',
          'POST /api/approvals',
          'GET /api/approvals',
          'GET /api/approvals/{id}',
          'POST /api/approvals/{id}/decide',
          'DELETE /api/approvals/{id}',
          'POST /api/companies',
          'GET /api/companies/{tenantId}',
          'PUT /api/companies/{tenantId}',
          'POST /api/upload/logo',
          'POST /api/users',
          'PUT /api/users/{userId}',
          'GET /api/users/{userId}',
          'POST /api/integrations',
          'DELETE /api/integrations/{integrationId}',
          'GET /api/integrations',
          'POST /api/trials/start',
          'POST /api/trials/invoke',
          'POST /api/commercial/contact'
        ]
      }
    },
    handlers: analyzeLambdaHandlers('lambda/platform'),
    integrations: [
      'Aurora PostgreSQL',
      'Cognito (autenticação)',
      'EventBridge',
      'S3 (logos)',
      'SES (e-mails comerciais)',
      'Stripe (pagamentos)'
    ]
  };
}

/**
 * Analisa todas as APIs do sistema
 */
export function analyzeAllApis(): {
  fibonacci: BackendApiInfo;
  nigredo: BackendApiInfo;
  operationalDashboard: BackendApiInfo;
  alquimistaPlatform: BackendApiInfo;
} {
  return {
    fibonacci: analyzeFibonacciApi(),
    nigredo: analyzeNigredoApi(),
    operationalDashboard: analyzeOperationalDashboardApi(),
    alquimistaPlatform: analyzeAlquimistaPlatformApi()
  };
}
