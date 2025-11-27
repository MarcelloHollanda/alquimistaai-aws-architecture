/**
 * Utilitários de Autenticação - Painel Operacional AlquimistaAI
 * 
 * Funções para extrair claims do JWT do Cognito e validar permissões
 * baseadas em grupos para diferenciação entre usuários internos e clientes.
 */

'use client';

/**
 * Interface para claims do usuário extraídos do token JWT
 */
export interface UserClaims {
  sub: string;
  email: string;
  name?: string;
  tenantId?: string;
  groups: string[];
  isInternal: boolean;
  isAdmin: boolean;
  isSupport: boolean;
  isTenantAdmin: boolean;
  isTenantUser: boolean;
}

/**
 * Grupos de usuários do Cognito
 */
export enum UserGroup {
  INTERNAL_ADMIN = 'INTERNAL_ADMIN',
  INTERNAL_SUPPORT = 'INTERNAL_SUPPORT',
  TENANT_ADMIN = 'TENANT_ADMIN',
  TENANT_USER = 'TENANT_USER',
}

/**
 * Extrai claims do token JWT do Cognito
 * 
 * @param token - Token JWT do Cognito (ID Token)
 * @returns UserClaims com informações do usuário e permissões
 */
export function extractClaims(token: string): UserClaims {
  try {
    // Decodificar o payload do JWT (segunda parte do token)
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    );

    // Extrair grupos do Cognito
    const groups: string[] = payload['cognito:groups'] || [];

    // Determinar tipo de usuário baseado nos grupos
    const isInternal = groups.includes(UserGroup.INTERNAL_ADMIN) || 
                       groups.includes(UserGroup.INTERNAL_SUPPORT);
    
    const isAdmin = groups.includes(UserGroup.INTERNAL_ADMIN);
    const isSupport = groups.includes(UserGroup.INTERNAL_SUPPORT);
    const isTenantAdmin = groups.includes(UserGroup.TENANT_ADMIN);
    const isTenantUser = groups.includes(UserGroup.TENANT_USER);

    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name || payload['cognito:username'],
      tenantId: payload['custom:tenant_id'],
      groups,
      isInternal,
      isAdmin,
      isSupport,
      isTenantAdmin,
      isTenantUser,
    };
  } catch (error) {
    console.error('Erro ao extrair claims do token:', error);
    throw new Error('Token inválido');
  }
}

/**
 * Extrai claims do token armazenado nos cookies
 * 
 * @returns UserClaims ou null se não houver token
 */
export function extractClaimsFromCookies(): UserClaims | null {
  if (typeof document === 'undefined') {
    return null;
  }

  try {
    // Buscar ID token dos cookies
    const cookies = document.cookie.split(';');
    const idTokenCookie = cookies.find(c => c.trim().startsWith('idToken='));
    
    if (!idTokenCookie) {
      return null;
    }

    const idToken = idTokenCookie.split('=')[1];
    return extractClaims(idToken);
  } catch (error) {
    console.error('Erro ao extrair claims dos cookies:', error);
    return null;
  }
}

/**
 * Verifica se o usuário tem acesso interno (INTERNAL_ADMIN ou INTERNAL_SUPPORT)
 * 
 * @param claims - Claims do usuário
 * @returns true se o usuário é interno
 */
export function hasInternalAccess(claims: UserClaims): boolean {
  return claims.isInternal;
}

/**
 * Verifica se o usuário é administrador interno
 * 
 * @param claims - Claims do usuário
 * @returns true se o usuário é INTERNAL_ADMIN
 */
export function isInternalAdmin(claims: UserClaims): boolean {
  return claims.isAdmin;
}

/**
 * Verifica se o usuário tem acesso a um tenant específico
 * 
 * @param claims - Claims do usuário
 * @param tenantId - ID do tenant a verificar
 * @returns true se o usuário tem acesso ao tenant
 */
export function hasTenantAccess(claims: UserClaims, tenantId: string): boolean {
  // Usuários internos têm acesso a todos os tenants
  if (claims.isInternal) {
    return true;
  }

  // Usuários de tenant só têm acesso ao próprio tenant
  return claims.tenantId === tenantId;
}

/**
 * Verifica se o usuário tem permissão para acessar rotas internas
 * 
 * @param claims - Claims do usuário
 * @returns true se o usuário pode acessar /app/company/*
 */
export function canAccessInternalRoutes(claims: UserClaims): boolean {
  return claims.isInternal;
}

/**
 * Verifica se o usuário tem permissão para acessar dados financeiros
 * 
 * @param claims - Claims do usuário
 * @returns true se o usuário pode acessar billing overview
 */
export function canAccessBilling(claims: UserClaims): boolean {
  return claims.isAdmin;
}

/**
 * Verifica se o usuário tem permissão para executar comandos operacionais
 * 
 * @param claims - Claims do usuário
 * @returns true se o usuário pode criar comandos operacionais
 */
export function canExecuteOperationalCommands(claims: UserClaims): boolean {
  return claims.isInternal;
}

/**
 * Determina a rota inicial baseada nos grupos do usuário
 * 
 * @param claims - Claims do usuário
 * @returns Rota para redirecionamento após login
 */
export function getInitialRoute(claims: UserClaims): string {
  if (claims.isInternal) {
    return '/app/company';
  }
  return '/app/dashboard';
}

/**
 * Valida se o token ainda é válido (não expirou)
 * 
 * @param token - Token JWT do Cognito
 * @returns true se o token ainda é válido
 */
export function isTokenValid(token: string): boolean {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    );

    const now = Math.floor(Date.now() / 1000);
    return payload.exp && payload.exp > now;
  } catch (error) {
    return false;
  }
}

/**
 * Formata o nome de exibição do usuário
 * 
 * @param claims - Claims do usuário
 * @returns Nome formatado para exibição
 */
export function getDisplayName(claims: UserClaims): string {
  return claims.name || claims.email.split('@')[0];
}

/**
 * Retorna o badge/label do tipo de usuário
 * 
 * @param claims - Claims do usuário
 * @returns Label do tipo de usuário
 */
export function getUserTypeLabel(claims: UserClaims): string {
  if (claims.isAdmin) return 'Administrador Interno';
  if (claims.isSupport) return 'Suporte Interno';
  if (claims.isTenantAdmin) return 'Administrador';
  if (claims.isTenantUser) return 'Usuário';
  return 'Usuário';
}

/**
 * Retorna a cor do badge baseada no tipo de usuário
 * 
 * @param claims - Claims do usuário
 * @returns Classe de cor do Tailwind
 */
export function getUserTypeBadgeColor(claims: UserClaims): string {
  if (claims.isAdmin) return 'bg-purple-100 text-purple-800';
  if (claims.isSupport) return 'bg-blue-100 text-blue-800';
  if (claims.isTenantAdmin) return 'bg-green-100 text-green-800';
  return 'bg-gray-100 text-gray-800';
}
