/**
 * Componente ProtectedRoute - Painel Operacional AlquimistaAI
 * 
 * Componente para proteger rotas baseadas em permissões de usuário
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/use-permissions';
import { Loader2 } from 'lucide-react';
import { isE2ETestBypassEnabledClient, logE2EBypassStatus } from '@/lib/e2e-flags';

/**
 * Props do componente ProtectedRoute
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
  
  /**
   * Requer acesso interno (INTERNAL_ADMIN ou INTERNAL_SUPPORT)
   */
  requireInternal?: boolean;
  
  /**
   * Requer ser administrador interno (INTERNAL_ADMIN)
   */
  requireAdmin?: boolean;
  
  /**
   * Requer acesso a um tenant específico
   */
  requireTenantAccess?: string;
  
  /**
   * Rota de redirecionamento se não tiver permissão
   * @default '/app/dashboard'
   */
  fallbackRoute?: string;
  
  /**
   * Mensagem de erro customizada
   */
  errorMessage?: string;
}

/**
 * Componente para proteger rotas baseadas em permissões
 * 
 * Verifica se o usuário tem as permissões necessárias e redireciona
 * se não tiver acesso.
 * 
 * @example
 * ```tsx
 * // Proteger rota interna
 * <ProtectedRoute requireInternal>
 *   <InternalDashboard />
 * </ProtectedRoute>
 * 
 * // Proteger rota de admin
 * <ProtectedRoute requireAdmin>
 *   <BillingOverview />
 * </ProtectedRoute>
 * 
 * // Proteger rota de tenant específico
 * <ProtectedRoute requireTenantAccess={tenantId}>
 *   <TenantDetails />
 * </ProtectedRoute>
 * ```
 */
export function ProtectedRoute({
  children,
  requireInternal = false,
  requireAdmin = false,
  requireTenantAccess,
  fallbackRoute = '/app/dashboard',
  errorMessage,
}: ProtectedRouteProps) {
  const router = useRouter();
  const {
    claims,
    isLoading,
    hasInternalAccess,
    isAdmin,
    hasTenantAccess,
  } = usePermissions();

  useEffect(() => {
    // Aguardar carregamento dos claims
    if (isLoading) {
      return;
    }

    // Em modo E2E, permitir acesso sem claims
    if (isE2ETestBypassEnabledClient) {
      logE2EBypassStatus('ProtectedRoute');
      console.log('[ProtectedRoute] E2E Bypass ativado - permitindo acesso sem claims');
      return;
    }

    // Se não houver claims, redirecionar para login
    if (!claims) {
      router.push('/login');
      return;
    }

    // Verificar se requer acesso interno
    if (requireInternal && !hasInternalAccess) {
      console.warn('Acesso negado: requer acesso interno');
      if (errorMessage) {
        // TODO: Mostrar toast com mensagem de erro
        console.error(errorMessage);
      }
      router.push(fallbackRoute);
      return;
    }

    // Verificar se requer ser admin
    if (requireAdmin && !isAdmin) {
      console.warn('Acesso negado: requer ser administrador');
      if (errorMessage) {
        // TODO: Mostrar toast com mensagem de erro
        console.error(errorMessage);
      }
      router.push(fallbackRoute);
      return;
    }

    // Verificar se requer acesso a tenant específico
    if (requireTenantAccess && !hasTenantAccess(requireTenantAccess)) {
      console.warn(`Acesso negado: sem permissão para tenant ${requireTenantAccess}`);
      if (errorMessage) {
        // TODO: Mostrar toast com mensagem de erro
        console.error(errorMessage);
      }
      router.push(fallbackRoute);
      return;
    }
  }, [
    claims,
    isLoading,
    hasInternalAccess,
    isAdmin,
    requireInternal,
    requireAdmin,
    requireTenantAccess,
    fallbackRoute,
    errorMessage,
    router,
    hasTenantAccess,
  ]);

  // Mostrar loading enquanto verifica permissões (exceto em modo E2E)
  if (!isE2ETestBypassEnabledClient && (isLoading || !claims)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-sm text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Se estiver em modo E2E, renderizar children diretamente
  if (isE2ETestBypassEnabledClient) {
    return <>{children}</>;
  }

  // Verificar permissões antes de renderizar
  if (requireInternal && !hasInternalAccess) {
    return null;
  }

  if (requireAdmin && !isAdmin) {
    return null;
  }

  if (requireTenantAccess && !hasTenantAccess(requireTenantAccess)) {
    return null;
  }

  // Renderizar children se tiver permissão
  return <>{children}</>;
}

/**
 * HOC para proteger páginas
 * 
 * @example
 * ```tsx
 * export default withProtectedRoute(InternalDashboard, {
 *   requireInternal: true
 * });
 * ```
 */
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'>
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
