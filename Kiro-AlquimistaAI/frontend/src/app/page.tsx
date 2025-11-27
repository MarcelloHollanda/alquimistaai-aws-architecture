'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { ROUTES } from '@/lib/constants';

/**
 * Página Raiz (/)
 * 
 * Comportamento:
 * - Usuário NÃO autenticado: redireciona para /login
 * - Usuário autenticado (interno): redireciona para /company
 * - Usuário autenticado (tenant): redireciona para /dashboard
 * 
 * Esta página serve como ponto de entrada do sistema e garante
 * que o usuário seja direcionado para a área apropriada baseado
 * no seu estado de autenticação e perfil.
 */
export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, isInternal } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // Evitar problemas de hidratação
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Pequeno delay para garantir que o store está hidratado
    const timer = setTimeout(() => {
      // Determinar rota de destino baseada no estado de autenticação
      if (!isAuthenticated) {
        // Usuário não autenticado → login
        console.log('[Root] Usuário não autenticado, redirecionando para login');
        router.replace(ROUTES.LOGIN);
      } else {
        // Usuário autenticado → área interna apropriada
        const targetRoute = isInternal ? ROUTES.COMPANY_OVERVIEW : ROUTES.DASHBOARD_OVERVIEW;
        console.log('[Root] Usuário autenticado, redirecionando para:', targetRoute);
        router.replace(targetRoute);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [mounted, isAuthenticated, isInternal, router]);

  // Exibir loading enquanto redireciona
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
        <p className="text-gray-600 font-medium">Carregando...</p>
        <p className="text-sm text-gray-500 mt-2">Redirecionando para a área apropriada</p>
      </div>
    </div>
  );
}
