'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CompanyHeader } from '@/components/company/company-header';
import { CompanySidebar } from '@/components/company/company-sidebar';
import { useAuthStore } from '@/stores/auth-store';
import { usePermissions } from '@/hooks/use-permissions';
import { ROUTES } from '@/lib/constants';
import { isE2ETestBypassEnabledClient, logE2EBypassStatus } from '@/lib/e2e-flags';

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { isInternal, loading } = usePermissions();

  // Em modo de teste E2E, permitir acesso sem autenticação
  const isE2EBypassEnabled = isE2ETestBypassEnabledClient;

  useEffect(() => {
    // Debug para E2E
    if (typeof window !== 'undefined' && isE2EBypassEnabled) {
      logE2EBypassStatus('CompanyLayout');
      console.log('[CompanyLayout] isAuthenticated:', isAuthenticated);
      console.log('[CompanyLayout] isE2EBypassEnabled:', isE2EBypassEnabled);
    }

    if (!isAuthenticated && !isE2EBypassEnabled) {
      router.push(ROUTES.LOGIN);
      return;
    }

    // Em modo E2E, não verificar permissões
    if (isE2EBypassEnabled) {
      return;
    }

    // Aguardar carregamento das permissões
    if (loading) return;

    // Redirecionar se não for usuário interno
    if (!isInternal) {
      router.push(ROUTES.DASHBOARD_OVERVIEW);
    }
  }, [isAuthenticated, isInternal, loading, router, isE2EBypassEnabled]);

  // Mostrar loading enquanto verifica permissões (exceto em modo E2E)
  if (!isE2EBypassEnabled && (loading || !isAuthenticated || !isInternal)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <CompanyHeader />
      <div className="flex">
        <CompanySidebar />
        {/* Responsivo: sem margem em mobile, com margem em desktop */}
        <main className="flex-1 md:ml-64 mt-16 p-4 sm:p-6 lg:p-8 w-full">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
