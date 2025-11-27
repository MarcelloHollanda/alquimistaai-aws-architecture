/**
 * Analisador de Autenticação - Sistema de Inventário AlquimistaAI
 * 
 * Responsável por analisar e documentar a configuração de autenticação:
 * - User Pool Cognito (ID, região, clientes)
 * - Grupos Cognito (INTERNAL_ADMIN, INTERNAL_SUPPORT, TENANT_ADMIN, TENANT_USER)
 * - Usuários DEV (apenas email + grupo, SEM senhas)
 * - Hosted UI Domain
 * - Configuração OAuth
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import type { CognitoInfo, CognitoGroupInfo, CognitoUserInfo } from '../types';

/**
 * Analisa a configuração de autenticação Cognito
 */
export async function analyzeAuthentication(workspaceRoot: string): Promise<CognitoInfo> {
  console.log('[Auth Analyzer] Iniciando análise de autenticação...');
  
  // Analisar configuração do User Pool
  const userPool = await analyzeUserPool(workspaceRoot);
  
  // Analisar grupos Cognito
  const groups = analyzeGroups();
  
  // Analisar usuários DEV (apenas de documentação, SEM senhas)
  const users = await analyzeDevUsers(workspaceRoot);
  
  const cognitoInfo: CognitoInfo = {
    userPool,
    groups,
    users
  };
  
  console.log(`[Auth Analyzer] Análise concluída: ${groups.length} grupos, ${users.length} usuários DEV`);
  
  return cognitoInfo;
}

/**
 * Analisa a configuração do User Pool Cognito
 */
async function analyzeUserPool(workspaceRoot: string): Promise<CognitoInfo['userPool']> {
  const userPool: CognitoInfo['userPool'] = {
    name: 'alquimistaai-dev',
    region: 'us-east-1',
    id: '',
    clientIds: [],
    hostedUiDomain: ''
  };
  
  // Tentar extrair de .env.local.example no frontend
  const envExamplePath = path.join(workspaceRoot, 'frontend', '.env.local.example');
  if (fs.existsSync(envExamplePath)) {
    const envContent = fs.readFileSync(envExamplePath, 'utf-8');
    
    // Extrair User Pool ID
    const userPoolIdMatch = envContent.match(/NEXT_PUBLIC_COGNITO_USER_POOL_ID=([^\s\n]+)/);
    if (userPoolIdMatch) {
      userPool.id = userPoolIdMatch[1];
    }
    
    // Extrair Client ID
    const clientIdMatch = envContent.match(/NEXT_PUBLIC_COGNITO_CLIENT_ID=([^\s\n]+)/);
    if (clientIdMatch) {
      userPool.clientIds.push(clientIdMatch[1]);
    }
    
    // Extrair região
    const regionMatch = envContent.match(/NEXT_PUBLIC_COGNITO_REGION=([^\s\n]+)/);
    if (regionMatch) {
      userPool.region = regionMatch[1];
    }
    
    // Extrair Hosted UI Domain
    const domainMatch = envContent.match(/NEXT_PUBLIC_COGNITO_DOMAIN_HOST=([^\s\n]+)/);
    if (domainMatch) {
      userPool.hostedUiDomain = domainMatch[1];
    }
  }
  
  // Tentar extrair de .env.local (se existir)
  const envLocalPath = path.join(workspaceRoot, 'frontend', '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const envContent = fs.readFileSync(envLocalPath, 'utf-8');
    
    // Só sobrescrever se não tiver valor ainda
    if (!userPool.id) {
      const userPoolIdMatch = envContent.match(/NEXT_PUBLIC_COGNITO_USER_POOL_ID=([^\s\n]+)/);
      if (userPoolIdMatch) {
        userPool.id = userPoolIdMatch[1];
      }
    }
    
    if (userPool.clientIds.length === 0) {
      const clientIdMatch = envContent.match(/NEXT_PUBLIC_COGNITO_CLIENT_ID=([^\s\n]+)/);
      if (clientIdMatch) {
        userPool.clientIds.push(clientIdMatch[1]);
      }
    }
    
    if (!userPool.hostedUiDomain) {
      const domainMatch = envContent.match(/NEXT_PUBLIC_COGNITO_DOMAIN_HOST=([^\s\n]+)/);
      if (domainMatch) {
        userPool.hostedUiDomain = domainMatch[1];
      }
    }
  }
  
  // Tentar extrair de documentos de configuração
  const cognitoDocsPattern = path.join(workspaceRoot, 'docs', '**', '*cognito*.md').replace(/\\/g, '/');
  const cognitoDocs = await glob(cognitoDocsPattern, { nocase: true });
  
  for (const docPath of cognitoDocs) {
    const content = fs.readFileSync(docPath, 'utf-8');
    
    // Procurar por User Pool ID no formato us-east-1_XXXXXXXXX
    if (!userPool.id) {
      const poolIdMatch = content.match(/us-east-1_[A-Za-z0-9]{9}/);
      if (poolIdMatch) {
        userPool.id = poolIdMatch[0];
      }
    }
    
    // Procurar por nome do User Pool
    const poolNameMatch = content.match(/User Pool[:\s]+([a-zA-Z0-9-]+)/i);
    if (poolNameMatch && poolNameMatch[1] !== 'ID') {
      userPool.name = poolNameMatch[1];
    }
    
    // Procurar por Hosted UI Domain
    if (!userPool.hostedUiDomain) {
      const domainMatch = content.match(/([a-z0-9-]+)\.auth\.us-east-1\.amazoncognito\.com/);
      if (domainMatch) {
        userPool.hostedUiDomain = domainMatch[0];
      }
    }
  }
  
  // Tentar extrair do stack CDK (fibonacci-stack.ts)
  const fibonacciStackPath = path.join(workspaceRoot, 'lib', 'fibonacci-stack.ts');
  if (fs.existsSync(fibonacciStackPath)) {
    const stackContent = fs.readFileSync(fibonacciStackPath, 'utf-8');
    
    // Procurar por userPoolName
    const poolNameMatch = stackContent.match(/userPoolName:\s*['"`]([^'"`]+)['"`]/);
    if (poolNameMatch) {
      userPool.name = poolNameMatch[1];
    }
  }
  
  // Se não encontrou ID, usar placeholder
  if (!userPool.id) {
    userPool.id = '${COGNITO_USER_POOL_ID}';
  }
  
  // Se não encontrou Client ID, usar placeholder
  if (userPool.clientIds.length === 0) {
    userPool.clientIds.push('${COGNITO_CLIENT_ID}');
  }
  
  // Se não encontrou Hosted UI Domain, construir baseado no ID
  if (!userPool.hostedUiDomain && userPool.id !== '${COGNITO_USER_POOL_ID}') {
    const poolIdPart = userPool.id.replace('us-east-1_', '').toLowerCase();
    userPool.hostedUiDomain = `us-east-1${poolIdPart}.auth.us-east-1.amazoncognito.com`;
  } else if (!userPool.hostedUiDomain) {
    userPool.hostedUiDomain = '${COGNITO_DOMAIN_HOST}';
  }
  
  console.log(`[Auth Analyzer] User Pool: ${userPool.name} (${userPool.id})`);
  
  return userPool;
}

/**
 * Analisa os grupos Cognito
 * Baseado na documentação e padrões conhecidos do projeto
 */
function analyzeGroups(): CognitoGroupInfo[] {
  // Grupos conhecidos do sistema AlquimistaAI
  const groups: CognitoGroupInfo[] = [
    {
      name: 'INTERNAL_ADMIN',
      role: 'Administradores internos da Alquimista.AI com acesso total ao sistema'
    },
    {
      name: 'INTERNAL_SUPPORT',
      role: 'Equipe de suporte interno com acesso a operações e monitoramento'
    },
    {
      name: 'TENANT_ADMIN',
      role: 'Administradores de empresas clientes (tenants) com gestão completa do tenant'
    },
    {
      name: 'TENANT_USER',
      role: 'Usuários padrão de empresas clientes com acesso limitado'
    }
  ];
  
  console.log(`[Auth Analyzer] Grupos Cognito: ${groups.map(g => g.name).join(', ')}`);
  
  return groups;
}

/**
 * Analisa usuários DEV documentados
 * IMPORTANTE: Extrai apenas email e grupos, NUNCA senhas
 */
async function analyzeDevUsers(workspaceRoot: string): Promise<CognitoUserInfo[]> {
  const users: CognitoUserInfo[] = [];
  
  // Procurar por documentos que mencionam usuários DEV
  const docsPattern = path.join(workspaceRoot, 'docs', '**', '*.md').replace(/\\/g, '/');
  const docs = await glob(docsPattern);
  
  // Procurar também em scripts de setup
  const scriptsPattern = path.join(workspaceRoot, 'scripts', '*cognito*.ps1').replace(/\\/g, '/');
  const scripts = await glob(scriptsPattern, { nocase: true });
  
  const allFiles = [...docs, ...scripts];
  
  for (const filePath of allFiles) {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Procurar por padrões de criação de usuário
    // Exemplo: aws cognito-idp admin-create-user --user-pool-id ... --username email@example.com
    const createUserPattern = /admin-create-user[^\n]*--username\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    let match;
    
    while ((match = createUserPattern.exec(content)) !== null) {
      const email = match[1];
      
      // Verificar se já existe
      if (!users.find(u => u.email === email)) {
        // Tentar extrair grupos próximos ao comando
        const groups = extractGroupsNearEmail(content, email);
        
        users.push({
          email,
          groups
        });
      }
    }
    
    // Procurar por padrões em tabelas de documentação
    // Exemplo: | email@example.com | INTERNAL_ADMIN |
    const tablePattern = /\|\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\s*\|\s*(INTERNAL_ADMIN|INTERNAL_SUPPORT|TENANT_ADMIN|TENANT_USER)/g;
    
    while ((match = tablePattern.exec(content)) !== null) {
      const email = match[1];
      const group = match[2];
      
      // Verificar se já existe
      const existingUser = users.find(u => u.email === email);
      if (existingUser) {
        if (!existingUser.groups.includes(group)) {
          existingUser.groups.push(group);
        }
      } else {
        users.push({
          email,
          groups: [group]
        });
      }
    }
  }
  
  // Procurar em seeds do banco de dados
  const seedsPattern = path.join(workspaceRoot, 'database', 'seeds', '*.sql').replace(/\\/g, '/');
  const seeds = await glob(seedsPattern);
  
  for (const seedPath of seeds) {
    const content = fs.readFileSync(seedPath, 'utf-8');
    
    // Procurar por INSERTs com emails
    const insertPattern = /INSERT\s+INTO\s+\w+\s*\([^)]*email[^)]*\)\s*VALUES\s*\([^)]*'([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})'/gi;
    let match;
    
    while ((match = insertPattern.exec(content)) !== null) {
      const email = match[1];
      
      // Verificar se já existe
      if (!users.find(u => u.email === email)) {
        // Tentar extrair role/grupo do contexto
        const groups = extractGroupsFromSqlContext(content, email);
        
        users.push({
          email,
          groups
        });
      }
    }
  }
  
  // Adicionar usuários conhecidos do sistema se não foram encontrados
  const knownUsers = [
    { email: 'ceo@alquimista.ai', groups: ['INTERNAL_ADMIN'] },
    { email: 'admin@alquimista.ai', groups: ['INTERNAL_ADMIN'] },
    { email: 'support@alquimista.ai', groups: ['INTERNAL_SUPPORT'] }
  ];
  
  for (const knownUser of knownUsers) {
    if (!users.find(u => u.email === knownUser.email)) {
      users.push(knownUser);
    }
  }
  
  console.log(`[Auth Analyzer] Usuários DEV encontrados: ${users.length}`);
  
  return users;
}

/**
 * Extrai grupos mencionados próximos a um email no conteúdo
 */
function extractGroupsNearEmail(content: string, email: string): string[] {
  const groups: string[] = [];
  const knownGroups = ['INTERNAL_ADMIN', 'INTERNAL_SUPPORT', 'TENANT_ADMIN', 'TENANT_USER'];
  
  // Encontrar a posição do email
  const emailIndex = content.indexOf(email);
  if (emailIndex === -1) return groups;
  
  // Extrair contexto (500 caracteres antes e depois)
  const contextStart = Math.max(0, emailIndex - 500);
  const contextEnd = Math.min(content.length, emailIndex + 500);
  const context = content.substring(contextStart, contextEnd);
  
  // Procurar por grupos conhecidos no contexto
  for (const group of knownGroups) {
    if (context.includes(group)) {
      groups.push(group);
    }
  }
  
  // Se não encontrou nenhum grupo, assumir TENANT_USER como padrão
  if (groups.length === 0) {
    groups.push('TENANT_USER');
  }
  
  return groups;
}

/**
 * Extrai grupos do contexto SQL próximo a um email
 */
function extractGroupsFromSqlContext(content: string, email: string): string[] {
  const groups: string[] = [];
  const knownGroups = ['INTERNAL_ADMIN', 'INTERNAL_SUPPORT', 'TENANT_ADMIN', 'TENANT_USER'];
  
  // Encontrar a linha com o email
  const lines = content.split('\n');
  const emailLineIndex = lines.findIndex(line => line.includes(email));
  
  if (emailLineIndex === -1) return groups;
  
  // Verificar linhas próximas (5 antes e 5 depois)
  const contextStart = Math.max(0, emailLineIndex - 5);
  const contextEnd = Math.min(lines.length, emailLineIndex + 5);
  const contextLines = lines.slice(contextStart, contextEnd);
  const context = contextLines.join('\n');
  
  // Procurar por grupos conhecidos
  for (const group of knownGroups) {
    if (context.includes(group)) {
      groups.push(group);
    }
  }
  
  // Procurar por role ou group_name em colunas
  const roleMatch = context.match(/role['"]?\s*,\s*['"]([A-Z_]+)['"]/);
  if (roleMatch && knownGroups.includes(roleMatch[1])) {
    if (!groups.includes(roleMatch[1])) {
      groups.push(roleMatch[1]);
    }
  }
  
  // Se não encontrou nenhum grupo, assumir TENANT_USER
  if (groups.length === 0) {
    groups.push('TENANT_USER');
  }
  
  return groups;
}

/**
 * Valida que nenhuma senha está incluída nos dados
 * Esta função é crítica para segurança
 */
export function validateNoPasswords(cognitoInfo: CognitoInfo): void {
  // Verificar que nenhum usuário tem campo de senha
  for (const user of cognitoInfo.users) {
    const userObj = user as any;
    
    // Verificar campos que não devem existir
    const forbiddenFields = ['password', 'passwd', 'pwd', 'secret', 'token', 'key'];
    for (const field of forbiddenFields) {
      if (field in userObj) {
        throw new Error(
          `SECURITY VIOLATION: User ${user.email} contains forbidden field '${field}'. ` +
          'Passwords and secrets must NEVER be included in inventory.'
        );
      }
    }
  }
  
  console.log('[Auth Analyzer] ✓ Validação de segurança passou: nenhuma senha encontrada');
}

/**
 * Extrai informações de OAuth providers (Google, Facebook, etc)
 */
export async function analyzeOAuthProviders(workspaceRoot: string): Promise<string[]> {
  const providers: string[] = [];
  
  // Procurar em documentos de autenticação
  const authDocsPattern = path.join(workspaceRoot, 'docs', 'auth', '*.md').replace(/\\/g, '/');
  const authDocs = await glob(authDocsPattern);
  
  for (const docPath of authDocs) {
    const content = fs.readFileSync(docPath, 'utf-8');
    
    if (content.includes('Google') && content.includes('OAuth')) {
      providers.push('Google');
    }
    
    if (content.includes('Facebook') && content.includes('OAuth')) {
      providers.push('Facebook');
    }
    
    if (content.includes('Amazon') && content.includes('OAuth')) {
      providers.push('Amazon');
    }
    
    if (content.includes('Apple') && content.includes('OAuth')) {
      providers.push('Apple');
    }
  }
  
  // Procurar no código do frontend
  const cognitoClientPath = path.join(workspaceRoot, 'frontend', 'src', 'lib', 'cognito-client.ts');
  if (fs.existsSync(cognitoClientPath)) {
    const content = fs.readFileSync(cognitoClientPath, 'utf-8');
    
    if (content.includes('Google')) {
      if (!providers.includes('Google')) providers.push('Google');
    }
    
    if (content.includes('Facebook')) {
      if (!providers.includes('Facebook')) providers.push('Facebook');
    }
  }
  
  return providers;
}

/**
 * Extrai URLs de callback configuradas
 */
export async function analyzeCallbackUrls(workspaceRoot: string): Promise<string[]> {
  const urls: string[] = [];
  
  // Procurar em .env.local.example
  const envExamplePath = path.join(workspaceRoot, 'frontend', '.env.local.example');
  if (fs.existsSync(envExamplePath)) {
    const content = fs.readFileSync(envExamplePath, 'utf-8');
    
    const redirectMatch = content.match(/NEXT_PUBLIC_COGNITO_REDIRECT_URI=([^\s\n]+)/);
    if (redirectMatch) {
      urls.push(redirectMatch[1]);
    }
    
    const logoutMatch = content.match(/NEXT_PUBLIC_COGNITO_LOGOUT_URI=([^\s\n]+)/);
    if (logoutMatch) {
      urls.push(logoutMatch[1]);
    }
  }
  
  // URLs padrão conhecidas
  const defaultUrls = [
    'http://localhost:3000/auth/callback',
    'http://localhost:3000/auth/logout-callback',
    'https://app.alquimista.ai/auth/callback',
    'https://app.alquimista.ai/auth/logout-callback'
  ];
  
  for (const url of defaultUrls) {
    if (!urls.includes(url)) {
      urls.push(url);
    }
  }
  
  return urls;
}
