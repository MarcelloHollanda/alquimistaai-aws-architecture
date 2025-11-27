/**
 * Middleware de Autorização para Painel Operacional AlquimistaAI
 * 
 * Extrai contexto de autenticação do JWT e valida permissões
 */

import { APIGatewayProxyEvent } from 'aws-lambda';

/**
 * Contexto de autenticação extraído do JWT
 */
export interface AuthContext {
  sub: string;
  email: string;
  groups: string[];
  tenantId?: string;
  isInternal: boolean;
}

/**
 * Grupos de usuários suportados
 */
export enum UserGroup {
  INTERNAL_ADMIN = 'INTERNAL_ADMIN',
  INTERNAL_SUPPORT = 'INTERNAL_SUPPORT',
  TENANT_ADMIN = 'TENANT_ADMIN',
  TENANT_USER = 'TENANT_USER'
}

/**
 * Erro de autorização
 */
export class AuthorizationError extends Error {
  constructor(
    message: string,
    public statusCode: number = 403,
    public code: string = 'FORBIDDEN'
  ) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Extrai contexto de autenticação do evento API Gateway
 * 
 * @param event - Evento do API Gateway
 * @returns Contexto de autenticação
 * @throws AuthorizationError se token inválido ou ausente
 */
export function extractAuthContext(event: APIGatewayProxyEvent): AuthContext {
  // Extrair claims do JWT do authorizer context
  const claims = event.requestContext?.authorizer?.claims;
  
  if (!claims) {
    throw new AuthorizationError(
      'Token de autenticação ausente ou inválido',
      401,
      'UNAUTHORIZED'
    );
  }

  // Extrair sub (user ID)
  const sub = claims.sub as string;
  if (!sub) {
    throw new AuthorizationError(
      'User ID não encontrado no token',
      401,
      'INVALID_TOKEN'
    );
  }

  // Extrair email
  const email = claims.email as string || claims['cognito:username'] as string;
  if (!email) {
    throw new AuthorizationError(
      'Email não encontrado no token',
      401,
      'INVALID_TOKEN'
    );
  }

  // Extrair grupos
  const groupsClaim = claims['cognito:groups'];
  let groups: string[] = [];
  
  if (typeof groupsClaim === 'string') {
    groups = groupsClaim.split(',').map(g => g.trim());
  } else if (Array.isArray(groupsClaim)) {
    groups = groupsClaim;
  }

  // Extrair custom attributes
  const tenantId = claims['custom:tenant_id'] as string | undefined;

  // Verificar se é usuário interno
  const isInternal = groups.includes('INTERNAL_ADMIN') || groups.includes('INTERNAL_SUPPORT');

  return {
    sub,
    email,
    groups,
    tenantId,
    isInternal
  };
}

/**
 * Valida se usuário é interno (INTERNAL_ADMIN ou INTERNAL_SUPPORT)
 * 
 * @param authContext - Contexto de autenticação
 * @param requireAdmin - Se true, requer INTERNAL_ADMIN especificamente
 * @throws AuthorizationError se usuário não tem permissão
 */
export function requireInternal(
  authContext: AuthContext,
  requireAdmin: boolean = false
): void {
  const { groups } = authContext;

  // Verificar se tem algum grupo interno
  const hasInternalAccess = groups.some(g => 
    g === UserGroup.INTERNAL_ADMIN || g === UserGroup.INTERNAL_SUPPORT
  );

  if (!hasInternalAccess) {
    throw new AuthorizationError(
      'Internal access required',
      403,
      'FORBIDDEN'
    );
  }

  // Se requer admin especificamente
  if (requireAdmin && !groups.includes(UserGroup.INTERNAL_ADMIN)) {
    throw new AuthorizationError(
      'Admin access required',
      403,
      'FORBIDDEN'
    );
  }
}

/**
 * Valida acesso a recursos de um tenant específico
 * 
 * @param authContext - Contexto de autenticação
 * @param requestedTenantId - ID do tenant sendo acessado
 * @throws AuthorizationError se usuário não tem permissão
 */
export function requireTenantAccess(
  authContext: AuthContext,
  requestedTenantId: string
): void {
  const { isInternal, tenantId } = authContext;

  // Usuários internos têm acesso a todos os tenants
  if (isInternal) {
    return; // Acesso permitido
  }

  // Verificar se tenant_id está configurado
  if (!tenantId) {
    throw new AuthorizationError(
      'Forbidden: tenant access denied',
      403,
      'FORBIDDEN'
    );
  }

  // Verificar se está tentando acessar seu próprio tenant
  if (tenantId !== requestedTenantId) {
    throw new AuthorizationError(
      'Forbidden: tenant access denied',
      403,
      'FORBIDDEN'
    );
  }
}


