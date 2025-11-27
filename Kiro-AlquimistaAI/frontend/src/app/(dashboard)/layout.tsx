'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TenantHeader } from '@/components/dashboard/tenant-header';
import { Sidebar } from '@/components/layout/sidebar';
import { useAuthStore } from '@/stores/auth-store';
import { ROUTES } from '@/lib/constants';
import { isE2ETestBypassEnabledClient, logE2EBypassStatus } from '@/lib/e2e-flags';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  // Em modo de teste E2E, permitir acesso sem autenticação
  const isE2EBypassEnabled = isE2ETestBypassEnabledClient || 
    (typeof window !== 'undefined' && document.cookie.includes('mock-signature'));

  useEffect(() => {
    // Debug para E2E
    if (typeof window !== 'undefined') {
      logE2EBypassStatus('DashboardLayout');
      console.log('[DashboardLayout] isAuthenticated:', isAuthenticated);
      console.log('[DashboardLayout] isE2EBypassEnabled:', isE2EBypassEnabled);
    }

    if (!isAuthenticated && !isE2EBypassEnabled) {
      console.log('[DashboardLayout] Redirecionando para login - sem autenticação');
      router.push(ROUTES.LOGIN);
    }
  }, [isAuthenticated, isE2EBypassEnabled, router]);

  if (!isAuthenticated && !isE2EBypassEnabled) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <TenantHeader />
      <div className="flex">
        <Sidebar />
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
