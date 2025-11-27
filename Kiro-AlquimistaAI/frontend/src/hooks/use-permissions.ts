/**
 * Hook de Permissões - Painel Operacional AlquimistaAI
 * 
 * Hook para verificar permissões do usuário baseadas em grupos do Cognito
 */

'use client';

import { useMemo } from 'react';
import { 
  UserClaims, 
  extractClaimsFromCookies,
  hasInternalAccess,
  isInternalAdmin,
  hasTenantAccess,
  canAccessInternalRoutes,
  canAccessBilling,
  canExecuteOperationalCommands,
  getInitialRoute,
  getDisplayName,
  getUserTypeLabel,
  getUserTypeBadgeColor,
} from '@/lib/auth-utils';

/**
 * Interface de retorno do hook usePermissions
 */
export interface UsePermissionsReturn {
  claims: UserClaims | null;
  isLoading: boolean;
  
  // Verificações de tipo de usuário
  isInternal: boolean;
  isAdmin: boolean;
  isSupport: boolean;
  isTenantAdmin: boolean;
  isTenantUser: boolean;
  
  // Verificações de permissões
  hasInternalAccess: boolean;
  canAccessInternalRoutes: boolean;
  canAccessBilling: boolean;
  canExecuteOperationalCommands: boolean;
  
  // Funções de verificação
  hasTenantAccess: (tenantId: string) => boolean;
  
  // Informações de exibição
  displayName: string;
  userTypeLabel: string;
  userTypeBadgeColor: string;
  initialRoute: string;
}

/**
 * Hook para gerenciar permissões do usuário
 * 
 * Extrai claims do token JWT e fornece funções de verificação de permissões
 * 
 * @returns UsePermissionsReturn com claims e funções de verificação
 */
export function usePermissions(): UsePermissionsReturn {
  // Extrair claims dos cookies
  const claims = useMemo(() => {
    try {
      return extractClaimsFromCookies();
    } catch (error) {
      console.error('Erro ao extrair claims:', error);
      return null;
    }
  }, []);

  // Verificações de tipo de usuário
  const isInternal = claims?.isInternal ?? false;
  const isAdmin = claims?.isAdmin ?? false;
  const isSupport = claims?.isSupport ?? false;
  const isTenantAdmin = claims?.isTenantAdmin ?? false;
  const isTenantUser = claims?.isTenantUser ?? false;

  // Verificações de permissões
  const hasInternalAccessValue = claims ? hasInternalAccess(claims) : false;
  const canAccessInternalRoutesValue = claims ? canAccessInternalRoutes(claims) : false;
  const canAccessBillingValue = claims ? canAccessBilling(claims) : false;
  const canExecuteOperationalCommandsValue = claims ? canExecuteOperationalCommands(claims) : false;

  // Função para verificar acesso a tenant específico
  const hasTenantAccessFn = (tenantId: string): boolean => {
    if (!claims) return false;
    return hasTenantAccess(claims, tenantId);
  };

  // Informações de exibição
  const displayName = claims ? getDisplayName(claims) : '';
  const userTypeLabel = claims ? getUserTypeLabel(claims) : '';
  const userTypeBadgeColor = claims ? getUserTypeBadgeColor(claims) : '';
  const initialRoute = claims ? getInitialRoute(claims) : '/app/dashboard';

  return {
    claims,
    isLoading: false,
    
    // Verificações de tipo de usuário
    isInternal,
    isAdmin,
    isSupport,
    isTenantAdmin,
    isTenantUser,
    
    // Verificações de permissões
    hasInternalAccess: hasInternalAccessValue,
    canAccessInternalRoutes: canAccessInternalRoutesValue,
    canAccessBilling: canAccessBillingValue,
    canExecuteOperationalCommands: canExecuteOperationalCommandsValue,
    
    // Funções de verificação
    hasTenantAccess: hasTenantAccessFn,
    
    // Informações de exibição
    displayName,
    userTypeLabel,
    userTypeBadgeColor,
    initialRoute,
  };
}
