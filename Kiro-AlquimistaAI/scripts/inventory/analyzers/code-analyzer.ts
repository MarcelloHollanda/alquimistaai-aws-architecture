/**
 * Analisador de código para inventário do sistema
 * Examina arquivos do projeto para extrair informações
 */
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { 
  FrontendInfo, 
  ApiClientInfo, 
  CognitoIntegrationInfo,
  EnvironmentVariableInfo,
  ExternalIntegrationInfo,
  GapInfo 
} from '../types';

// Tipo local para rotas do frontend
interface FrontendRouteInfo {
  path: string;
  type: 'auth' | 'dashboard' | 'company' | 'other';
}

export class CodeAnalyzer {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * Analisa informações do frontend Next.js
   */
  async analyzeFrontend(): Promise<FrontendInfo | null> {
    console.log('🔍 Analisando frontend Next.js...');
    
    try {
      const frontendPath = path.join(this.projectRoot, 'frontend');
      
      // Verifica se existe diretório frontend
      if (!fs.existsSync(frontendPath)) {
        console.log('⚠️  Diretório frontend não encontrado');
        return null;
      }

      // Detecta framework
      const packageJsonPath = path.join(frontendPath, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        return null;
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      
      let framework = 'unknown';
      if (packageJson.dependencies?.['next']) {
        framework = 'Next.js';
      } else if (packageJson.dependencies?.['react']) {
        framework = 'React';
      } else if (packageJson.dependencies?.['vue']) {
        framework = 'Vue';
      }

      // Analisa rotas
      const routes = await this.analyzeRoutes(frontendPath, framework);

      // Analisa clientes de API
      const apiClients = await this.analyzeApiClients(frontendPath);

      // Analisa integração com Cognito
      const cognitoIntegration = await this.analyzeCognitoIntegration(frontendPath);

      return {
        framework,
        version: packageJson.dependencies?.[framework.toLowerCase()] || packageJson.dependencies?.['next'] || 'unknown',
        location: frontendPath,
        routes: routes as any, // Cast temporário - tipos serão ajustados no inventário final
        cognito: cognitoIntegration || {
          userPoolId: '',
          clientId: '',
          region: '',
          hostedUiDomain: '',
          redirectSignIn: '',
          redirectSignOut: ''
        },
        apiClients,
        tests: {
          unit: 0,
          integration: 0,
          e2e: 0
        }
      };
    } catch (error) {
      console.error('Erro ao analisar frontend:', error);
      return null;
    }
  }

  /**
   * Analisa rotas do frontend (Next.js App Router)
   */
  private async analyzeRoutes(frontendPath: string, framework: string): Promise<FrontendRouteInfo[]> {
    const routes: FrontendRouteInfo[] = [];

    if (framework !== 'Next.js') {
      return routes;
    }

    try {
      // Next.js App Router
      const appPath = path.join(frontendPath, 'src', 'app');
      if (!fs.existsSync(appPath)) {
        return routes;
      }

      const routeFiles = await glob('**/page.{ts,tsx,js,jsx}', {
        cwd: appPath,
        absolute: false
      });

      for (const file of routeFiles) {
        const routePath = this.convertFilePathToRoute(file);
        const fullPath = path.join(appPath, file);
        const content = fs.readFileSync(fullPath, 'utf-8');

        routes.push({
          path: routePath,
          type: this.inferRouteType(routePath, content)
        });
      }

      return routes;
    } catch (error) {
      console.error('Erro ao analisar rotas:', error);
      return routes;
    }
  }

  /**
   * Converte caminho de arquivo para rota
   */
  private convertFilePathToRoute(filePath: string): string {
    let route = filePath
      .replace(/\/page\.(ts|tsx|js|jsx)$/, '')
      .replace(/\\/g, '/');

    // Trata rotas dinâmicas [id]
    route = route.replace(/\[([^\]]+)\]/g, ':$1');

    // Trata grupos de rotas (auth), (dashboard)
    route = route.replace(/\([^)]+\)\//g, '');

    return '/' + route;
  }

  /**
   * Infere o tipo de rota baseado no caminho e conteúdo
   */
  private inferRouteType(routePath: string, content: string): 'auth' | 'dashboard' | 'company' | 'other' {
    if (routePath.includes('/auth/') || routePath.includes('/login') || routePath.includes('/signup')) return 'auth';
    if (routePath.includes('/dashboard/')) return 'dashboard';
    if (routePath.includes('/company/')) return 'company';
    return 'other';
  }

  /**
   * Verifica se a rota é protegida
   */
  private isProtectedRoute(content: string): boolean {
    return content.includes('ProtectedRoute') || 
           content.includes('requireAuth') ||
           content.includes('middleware') ||
           content.includes('getServerSession');
  }

  /**
   * Analisa clientes de API no frontend
   */
  private async analyzeApiClients(frontendPath: string): Promise<ApiClientInfo[]> {
    const clients: ApiClientInfo[] = [];

    try {
      const libPath = path.join(frontendPath, 'src', 'lib');
      if (!fs.existsSync(libPath)) {
        return clients;
      }

      const clientFiles = await glob('*-{client,api}.{ts,tsx}', {
        cwd: libPath,
        absolute: false
      });

      for (const file of clientFiles) {
        const fullPath = path.join(libPath, file);
        const content = fs.readFileSync(fullPath, 'utf-8');

        const clientName = file.replace(/-(client|api)\.(ts|tsx)$/, '');
        const baseUrl = this.extractBaseUrl(content);
        const endpoints = this.extractEndpoints(content);

        clients.push({
          name: clientName,
          file: `frontend/src/lib/${file}`,
          baseUrlSource: baseUrl
        });
      }

      return clients;
    } catch (error) {
      console.error('Erro ao analisar clientes de API:', error);
      return clients;
    }
  }

  /**
   * Extrai base URL de um cliente de API
   */
  private extractBaseUrl(content: string): string {
    const baseUrlMatch = content.match(/baseURL\s*[:=]\s*['"`]([^'"`]+)['"`]/);
    if (baseUrlMatch) {
      return baseUrlMatch[1];
    }

    const envMatch = content.match(/process\.env\.([A-Z_]+)/);
    if (envMatch) {
      return `\${${envMatch[1]}}`;
    }

    return 'unknown';
  }

  /**
   * Extrai endpoints de um cliente de API
   */
  private extractEndpoints(content: string): string[] {
    const endpoints: string[] = [];
    
    // Procura por padrões de chamadas de API
    const patterns = [
      /['"`]\/api\/[^'"`]+['"`]/g,
      /axios\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g,
      /fetch\(['"`]([^'"`]+)['"`]/g
    ];

    for (const pattern of patterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const endpoint = match[1] || match[2];
        if (endpoint && endpoint.startsWith('/')) {
          endpoints.push(endpoint);
        }
      }
    }

    return [...new Set(endpoints)].sort();
  }

  /**
   * Analisa integração com Cognito
   */
  private async analyzeCognitoIntegration(frontendPath: string): Promise<CognitoIntegrationInfo | null> {
    try {
      const cognitoClientPath = path.join(frontendPath, 'src', 'lib', 'cognito-client.ts');
      
      if (!fs.existsSync(cognitoClientPath)) {
        return null;
      }

      const content = fs.readFileSync(cognitoClientPath, 'utf-8');

      const envVars = this.extractCognitoEnvVars(content);
      
      return {
        userPoolId: envVars.find(v => v.includes('USER_POOL')) || '',
        clientId: envVars.find(v => v.includes('CLIENT_ID')) || '',
        region: envVars.find(v => v.includes('REGION')) || 'us-east-1',
        hostedUiDomain: '',
        redirectSignIn: '',
        redirectSignOut: ''
      };
    } catch (error) {
      console.error('Erro ao analisar integração Cognito:', error);
      return null;
    }
  }

  /**
   * Extrai features do Cognito implementadas
   */
  private extractCognitoFeatures(content: string): string[] {
    const features: string[] = [];

    if (content.includes('signIn') || content.includes('login')) features.push('login');
    if (content.includes('signUp') || content.includes('register')) features.push('signup');
    if (content.includes('signOut') || content.includes('logout')) features.push('logout');
    if (content.includes('forgotPassword')) features.push('password-recovery');
    if (content.includes('confirmSignUp')) features.push('email-confirmation');
    if (content.includes('resendConfirmationCode')) features.push('resend-code');
    if (content.includes('changePassword')) features.push('change-password');
    if (content.includes('OAuth') || content.includes('federatedSignIn')) features.push('social-login');
    if (content.includes('MFA') || content.includes('mfa')) features.push('mfa');

    return features;
  }

  /**
   * Extrai variáveis de ambiente do Cognito
   */
  private extractCognitoEnvVars(content: string): string[] {
    const envVars: string[] = [];
    const envPattern = /process\.env\.([A-Z_]+)/g;
    
    const matches = content.matchAll(envPattern);
    for (const match of matches) {
      if (match[1].includes('COGNITO') || match[1].includes('USER_POOL') || match[1].includes('CLIENT_ID')) {
        envVars.push(match[1]);
      }
    }

    return [...new Set(envVars)].sort();
  }

  /**
   * Analisa variáveis de ambiente
   */
  async analyzeEnvironmentVariables(): Promise<EnvironmentVariableInfo[]> {
    console.log('🔍 Analisando variáveis de ambiente...');
    
    const envVars: EnvironmentVariableInfo[] = [];
    const envFiles = ['.env', '.env.local', '.env.production', 'frontend/.env.local'];

    for (const envFile of envFiles) {
      const envPath = path.join(this.projectRoot, envFile);
      
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        const lines = content.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const [name] = trimmed.split('=');
            if (name) {
              const existing = envVars.find(v => v.name === name.trim());
              if (!existing) {
                envVars.push({
                  name: name.trim(),
                  usedIn: this.findEnvVarUsage(name.trim()),
                  storedIn: [envFile],
                  description: this.inferEnvVarDescription(name.trim())
                });
              } else {
                existing.storedIn.push(envFile);
              }
            }
          }
        }
      }
    }

    return envVars;
  }

  /**
   * Encontra onde uma variável de ambiente é usada
   */
  private findEnvVarUsage(varName: string): string[] {
    const usage: string[] = [];

    // Verifica no frontend
    const frontendPath = path.join(this.projectRoot, 'frontend');
    if (fs.existsSync(frontendPath)) {
      usage.push('frontend');
    }

    // Verifica em lambdas
    const lambdaPath = path.join(this.projectRoot, 'lambda');
    if (fs.existsSync(lambdaPath)) {
      usage.push('lambda');
    }

    // Verifica em CDK
    const libPath = path.join(this.projectRoot, 'lib');
    if (fs.existsSync(libPath)) {
      usage.push('cdk');
    }

    return usage;
  }

  /**
   * Infere descrição de uma variável de ambiente
   */
  private inferEnvVarDescription(varName: string): string {
    const name = varName.toLowerCase();

    if (name.includes('api') && name.includes('url')) return 'URL base da API';
    if (name.includes('cognito') && name.includes('pool')) return 'ID do User Pool do Cognito';
    if (name.includes('cognito') && name.includes('client')) return 'Client ID do Cognito';
    if (name.includes('region')) return 'Região AWS';
    if (name.includes('database') || name.includes('db')) return 'Configuração de banco de dados';
    if (name.includes('secret')) return 'Chave secreta';
    if (name.includes('key')) return 'Chave de API ou acesso';
    if (name.includes('stripe')) return 'Configuração do Stripe';
    
    return 'Variável de ambiente';
  }

  /**
   * Analisa integrações externas
   */
  async analyzeExternalIntegrations(): Promise<ExternalIntegrationInfo[]> {
    console.log('🔍 Analisando integrações externas...');
    
    const integrations: ExternalIntegrationInfo[] = [];

    // Analisa package.json para detectar integrações
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      // Stripe
      if (deps['stripe'] || deps['@stripe/stripe-js']) {
        integrations.push({
          name: 'Stripe',
          type: 'payment',
          purpose: 'Processamento de pagamentos e assinaturas',
          credentials: 'Armazenadas no Secrets Manager'
        });
      }

      // AWS SDK
      if (deps['@aws-sdk/client-cognito-identity-provider']) {
        integrations.push({
          name: 'AWS Cognito',
          type: 'authentication',
          purpose: 'Autenticação e gerenciamento de usuários',
          credentials: 'Configurado via variáveis de ambiente'
        });
      }

      // Outros SDKs AWS
      if (deps['@aws-sdk/client-s3']) {
        integrations.push({
          name: 'AWS S3',
          type: 'storage',
          purpose: 'Armazenamento de arquivos',
          credentials: 'IAM Roles'
        });
      }
    }

    return integrations;
  }

  /**
   * Identifica gaps conhecidos no sistema
   */
  async identifyGaps(): Promise<GapInfo[]> {
    console.log('🔍 Identificando gaps conhecidos...');
    
    const gaps: GapInfo[] = [];

    // Verifica documentação
    const docsPath = path.join(this.projectRoot, 'docs');
    if (!fs.existsSync(docsPath)) {
      gaps.push({
        description: 'Diretório de documentação não encontrado',
        reference: '/docs',
        severity: 'medium'
      });
    }

    // Verifica testes
    const testsPath = path.join(this.projectRoot, 'tests');
    if (!fs.existsSync(testsPath)) {
      gaps.push({
        description: 'Diretório de testes não encontrado',
        reference: '/tests',
        severity: 'high'
      });
    }

    // Verifica CI/CD
    const githubWorkflowsPath = path.join(this.projectRoot, '.github', 'workflows');
    if (!fs.existsSync(githubWorkflowsPath)) {
      gaps.push({
        description: 'Workflows de CI/CD não configurados',
        reference: '.github/workflows',
        severity: 'medium'
      });
    }

    // Verifica monitoramento
    const hasCloudWatch = fs.existsSync(path.join(this.projectRoot, 'lib', 'dashboards'));
    if (!hasCloudWatch) {
      gaps.push({
        description: 'Dashboards de monitoramento não configurados',
        reference: 'lib/dashboards',
        severity: 'high'
      });
    }

    return gaps;
  }
}
