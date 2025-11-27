/**
 * Analisador de Frontend - Sistema de Inventário AlquimistaAI
 * 
 * Responsável por analisar a estrutura do frontend Next.js e extrair:
 * - Rotas Next.js (auth, dashboard, company, etc.)
 * - API clients em src/lib/
 * - Integração com Cognito
 * - Status de testes
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import type { FrontendInfo, RouteInfo, ApiClientInfo, CognitoIntegrationInfo, TestInfo } from '../types';

/**
 * Analisa a estrutura do frontend Next.js
 */
export async function analyzeFrontend(workspaceRoot: string): Promise<FrontendInfo> {
  const frontendPath = path.join(workspaceRoot, 'frontend');
  
  console.log('[Frontend Analyzer] Iniciando análise do frontend...');
  
  // Verificar se o diretório frontend existe
  if (!fs.existsSync(frontendPath)) {
    console.warn('[Frontend Analyzer] Diretório frontend não encontrado');
    return createEmptyFrontendInfo();
  }

  const routes = await analyzeRoutes(frontendPath);
  const cognito = await analyzeCognitoIntegration(frontendPath);
  const apiClients = await analyzeApiClients(frontendPath);
  const tests = await analyzeTests(workspaceRoot);

  const frontendInfo: FrontendInfo = {
    framework: 'Next.js 14 (App Router)',
    location: 'frontend/',
    routes,
    cognito,
    apiClients,
    tests,
  };

  console.log(`[Frontend Analyzer] Análise concluída: ${routes.length} rotas, ${apiClients.length} clients`);
  
  return frontendInfo;
}

/**
 * Analisa as rotas Next.js no diretório src/app
 */
async function analyzeRoutes(frontendPath: string): Promise<RouteInfo[]> {
  const routes: RouteInfo[] = [];
  const appPath = path.join(frontendPath, 'src', 'app');

  if (!fs.existsSync(appPath)) {
    console.warn('[Frontend Analyzer] Diretório src/app não encontrado');
    return routes;
  }

  // Buscar todos os arquivos page.tsx e layout.tsx
  const pattern = path.join(appPath, '**', '+(page|layout).tsx').replace(/\\/g, '/');
  const files = await glob(pattern);

  for (const file of files) {
    const relativePath = path.relative(appPath, file);
    const routePath = extractRoutePath(relativePath);
    const routeType = determineRouteType(routePath);

    routes.push({
      path: routePath,
      type: routeType,
      file: path.relative(frontendPath, file),
    });
  }

  // Ordenar rotas por path
  routes.sort((a, b) => a.path.localeCompare(b.path));

  console.log(`[Frontend Analyzer] Encontradas ${routes.length} rotas`);
  
  return routes;
}

/**
 * Extrai o caminho da rota a partir do caminho do arquivo
 */
function extractRoutePath(relativePath: string): string {
  // Remover page.tsx ou layout.tsx
  let routePath = relativePath
    .replace(/\\/g, '/')
    .replace(/\/(page|layout)\.tsx$/, '');

  // Remover grupos de rotas (auth), (dashboard), etc.
  routePath = routePath.replace(/\([^)]+\)\/?/g, '');

  // Converter [param] para :param
  routePath = routePath.replace(/\[([^\]]+)\]/g, ':$1');

  // Adicionar / no início se não tiver
  if (!routePath.startsWith('/')) {
    routePath = '/' + routePath;
  }

  // Remover / no final se tiver (exceto para root)
  if (routePath !== '/' && routePath.endsWith('/')) {
    routePath = routePath.slice(0, -1);
  }

  return routePath;
}

/**
 * Determina o tipo da rota baseado no caminho
 */
function determineRouteType(routePath: string): RouteInfo['type'] {
  if (routePath.startsWith('/auth') || routePath.startsWith('/login') || routePath.startsWith('/signup')) {
    return 'auth';
  }
  
  if (routePath.startsWith('/app/dashboard') || routePath.startsWith('/dashboard')) {
    return 'dashboard';
  }
  
  if (routePath.startsWith('/app/company') || routePath.startsWith('/company')) {
    return 'company';
  }
  
  if (routePath.startsWith('/app/billing') || routePath.startsWith('/billing')) {
    return 'billing';
  }
  
  if (routePath.startsWith('/app/commercial') || routePath.startsWith('/commercial')) {
    return 'commercial';
  }
  
  if (routePath.startsWith('/fibonacci')) {
    return 'fibonacci';
  }
  
  if (routePath.startsWith('/nigredo')) {
    return 'nigredo';
  }
  
  if (routePath === '/' || routePath.startsWith('/institutional')) {
    return 'institutional';
  }
  
  return 'other';
}

/**
 * Analisa a integração com Cognito
 */
async function analyzeCognitoIntegration(frontendPath: string): Promise<CognitoIntegrationInfo> {
  const envExamplePath = path.join(frontendPath, '.env.local.example');
  const middlewarePath = path.join(frontendPath, 'middleware.ts');
  const cognitoClientPath = path.join(frontendPath, 'src', 'lib', 'cognito-client.ts');

  const cognito: CognitoIntegrationInfo = {
    userPoolId: '',
    clientId: '',
    region: '',
    hostedUiDomain: '',
    redirectUri: '',
    logoutUri: '',
    authFlow: 'OAuth 2.0 com Hosted UI',
    groups: [
      { name: 'INTERNAL_ADMIN', description: 'Administradores internos da Alquimista.AI' },
      { name: 'INTERNAL_SUPPORT', description: 'Suporte interno da Alquimista.AI' },
      { name: 'TENANT_ADMIN', description: 'Administradores de empresas clientes' },
      { name: 'TENANT_USER', description: 'Usuários de empresas clientes' },
    ],
    middlewareProtection: fs.existsSync(middlewarePath),
    files: [],
  };

  // Extrair configuração do .env.local.example
  if (fs.existsSync(envExamplePath)) {
    const envContent = fs.readFileSync(envExamplePath, 'utf-8');
    
    // Verificar se o conteúdo foi lido corretamente
    if (typeof envContent === 'string') {
      const userPoolIdMatch = envContent.match(/NEXT_PUBLIC_COGNITO_USER_POOL_ID=([^\s\n]+)/);
      if (userPoolIdMatch) {
        cognito.userPoolId = userPoolIdMatch[1];
      }
      
      const clientIdMatch = envContent.match(/NEXT_PUBLIC_COGNITO_CLIENT_ID=([^\s\n]+)/);
      if (clientIdMatch) {
        cognito.clientId = clientIdMatch[1];
      }
      
      const regionMatch = envContent.match(/NEXT_PUBLIC_COGNITO_REGION=([^\s\n]+)/);
      if (regionMatch) {
        cognito.region = regionMatch[1];
      }
      
      const domainMatch = envContent.match(/NEXT_PUBLIC_COGNITO_DOMAIN_HOST=([^\s\n]+)/);
      if (domainMatch) {
        cognito.hostedUiDomain = domainMatch[1];
      }
      
      const redirectMatch = envContent.match(/NEXT_PUBLIC_COGNITO_REDIRECT_URI=([^\s\n]+)/);
      if (redirectMatch) {
        cognito.redirectUri = redirectMatch[1];
      }
      
      const logoutMatch = envContent.match(/NEXT_PUBLIC_COGNITO_LOGOUT_URI=([^\s\n]+)/);
      if (logoutMatch) {
        cognito.logoutUri = logoutMatch[1];
      }

      cognito.files.push('.env.local.example');
    }
  }

  // Adicionar arquivos relacionados ao Cognito
  if (fs.existsSync(middlewarePath)) {
    cognito.files.push('middleware.ts');
  }
  
  if (fs.existsSync(cognitoClientPath)) {
    cognito.files.push('src/lib/cognito-client.ts');
  }

  const authUtilsPath = path.join(frontendPath, 'src', 'lib', 'auth-utils.ts');
  if (fs.existsSync(authUtilsPath)) {
    cognito.files.push('src/lib/auth-utils.ts');
  }

  const useAuthPath = path.join(frontendPath, 'src', 'hooks', 'use-auth.ts');
  if (fs.existsSync(useAuthPath)) {
    cognito.files.push('src/hooks/use-auth.ts');
  }

  console.log('[Frontend Analyzer] Integração Cognito analisada');
  
  return cognito;
}

/**
 * Analisa os API clients em src/lib
 */
async function analyzeApiClients(frontendPath: string): Promise<ApiClientInfo[]> {
  const clients: ApiClientInfo[] = [];
  const libPath = path.join(frontendPath, 'src', 'lib');

  if (!fs.existsSync(libPath)) {
    console.warn('[Frontend Analyzer] Diretório src/lib não encontrado');
    return clients;
  }

  // Buscar arquivos *-client.ts e *-api.ts
  const pattern = path.join(libPath, '**', '*+(client|api).ts').replace(/\\/g, '/');
  const files = await glob(pattern);

  for (const file of files) {
    const fileName = path.basename(file);
    const relativePath = path.relative(frontendPath, file);
    
    // Ler o arquivo para extrair informações
    const content = fs.readFileSync(file, 'utf-8');
    const baseUrlSource = extractBaseUrlSource(content);

    clients.push({
      name: fileName.replace(/\.(ts|tsx)$/, ''),
      file: relativePath,
      baseUrlSource,
    });
  }

  // Ordenar por nome
  clients.sort((a, b) => a.name.localeCompare(b.name));

  console.log(`[Frontend Analyzer] Encontrados ${clients.length} API clients`);
  
  return clients;
}

/**
 * Extrai a fonte da URL base do conteúdo do arquivo
 */
function extractBaseUrlSource(content: string): string {
  // Procurar por NEXT_PUBLIC_API_URL ou outras variáveis de ambiente
  if (content.includes('NEXT_PUBLIC_API_URL')) {
    return 'process.env.NEXT_PUBLIC_API_URL';
  }
  
  if (content.includes('NEXT_PUBLIC_FIBONACCI_API_URL')) {
    return 'process.env.NEXT_PUBLIC_FIBONACCI_API_URL';
  }
  
  if (content.includes('NEXT_PUBLIC_NIGREDO_API_URL')) {
    return 'process.env.NEXT_PUBLIC_NIGREDO_API_URL';
  }
  
  // Procurar por baseURL hardcoded
  const baseUrlMatch = content.match(/baseURL:\s*['"]([^'"]+)['"]/);
  if (baseUrlMatch) {
    return `hardcoded: ${baseUrlMatch[1]}`;
  }
  
  return 'não especificado';
}

/**
 * Analisa o status dos testes
 */
async function analyzeTests(workspaceRoot: string): Promise<TestInfo> {
  const testsPath = path.join(workspaceRoot, 'tests');
  
  const testInfo: TestInfo = {
    unit: { total: 0, passing: 0, status: 'não executado' },
    integration: { total: 0, passing: 0, status: 'não executado' },
    e2e: { total: 0, passing: 0, status: 'não executado' },
    security: { total: 0, passing: 0, status: 'não executado' },
  };

  if (!fs.existsSync(testsPath)) {
    console.warn('[Frontend Analyzer] Diretório tests não encontrado');
    return testInfo;
  }

  // Contar testes unitários
  const unitPattern = path.join(testsPath, 'unit', '**', '*.test.ts').replace(/\\/g, '/');
  const unitFiles = await glob(unitPattern);
  testInfo.unit.total = unitFiles.length;

  // Contar testes de integração
  const integrationPattern = path.join(testsPath, 'integration', '**', '*.test.ts').replace(/\\/g, '/');
  const integrationFiles = await glob(integrationPattern);
  testInfo.integration.total = integrationFiles.length;

  // Contar testes E2E
  const e2ePattern = path.join(testsPath, 'e2e', '**', '*.spec.ts').replace(/\\/g, '/');
  const e2eFiles = await glob(e2ePattern);
  testInfo.e2e.total = e2eFiles.length;

  // Contar testes de segurança
  const securityPattern = path.join(testsPath, 'security', '**', '*.test.ts').replace(/\\/g, '/');
  const securityFiles = await glob(securityPattern);
  testInfo.security.total = securityFiles.length;

  // Tentar extrair status de documentos de teste
  const testReportPath = path.join(workspaceRoot, 'docs', 'operational-dashboard', 'TEST-STATUS-REPORT.md');
  if (fs.existsSync(testReportPath)) {
    const reportContent = fs.readFileSync(testReportPath, 'utf-8');
    
    // Verificar se o conteúdo foi lido corretamente
    if (typeof reportContent === 'string') {
      // Extrair informações do relatório
      const securityMatch = reportContent.match(/Testes de Segurança.*?(\d+)\/(\d+)/s);
      if (securityMatch) {
        testInfo.security.passing = parseInt(securityMatch[1]);
        testInfo.security.total = parseInt(securityMatch[2]);
        testInfo.security.status = testInfo.security.passing === testInfo.security.total ? 'passando' : 'falhando';
      }

      const middlewareMatch = reportContent.match(/Testes de Middleware.*?(\d+)\/(\d+)/s);
      if (middlewareMatch) {
        testInfo.unit.passing = parseInt(middlewareMatch[1]);
        testInfo.unit.total = parseInt(middlewareMatch[2]);
        testInfo.unit.status = testInfo.unit.passing === testInfo.unit.total ? 'passando' : 'falhando';
      }
    }
  }

  console.log('[Frontend Analyzer] Status de testes analisado');
  
  return testInfo;
}

/**
 * Cria um objeto FrontendInfo vazio
 */
function createEmptyFrontendInfo(): FrontendInfo {
  return {
    framework: 'Next.js 14 (App Router)',
    location: 'frontend/',
    routes: [],
    cognito: {
      userPoolId: '',
      clientId: '',
      region: '',
      hostedUiDomain: '',
      redirectUri: '',
      logoutUri: '',
      authFlow: 'OAuth 2.0 com Hosted UI',
      groups: [],
      middlewareProtection: false,
      files: [],
    },
    apiClients: [],
    tests: {
      unit: { total: 0, passing: 0, status: 'não executado' },
      integration: { total: 0, passing: 0, status: 'não executado' },
      e2e: { total: 0, passing: 0, status: 'não executado' },
      security: { total: 0, passing: 0, status: 'não executado' },
    },
  };
}
