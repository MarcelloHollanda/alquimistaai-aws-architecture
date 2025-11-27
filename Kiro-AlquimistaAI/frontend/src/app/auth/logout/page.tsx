'use client';

import { useEffect } from 'react';
import { clearTokensFromCookies } from '@/lib/cognito-client';
import { useAuthStore } from '@/stores/auth-store';

const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN_HOST!;
const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;
const logoutUri = process.env.NEXT_PUBLIC_COGNITO_LOGOUT_URI!;

/**
 * Página de Logout
 * 
 * Responsável por:
 * 1. Limpar cookies de autenticação
 * 2. Limpar estado do auth store
 * 3. Redirecionar para endpoint de logout do Cognito
 * 
 * Valida: Requirements 7.1, 7.2
 */
export default function LogoutPage() {
  const { clearAuth } = useAuthStore();

  useEffect(() => {
    console.log('[Logout] Iniciando processo de logout');

    // 1. Limpar cookies de autenticação
    clearTokensFromCookies();
    console.log('[Logout] Cookies limpos');

    // 2. Limpar estado do auth store
    clearAuth();
    console.log('[Logout] Estado de autenticação limpo');

    // 3. Redirecionar para logout do Cognito
    const params = new URLSearchParams({
      client_id: clientId,
      logout_uri: logoutUri,
    });

    const cognitoLogoutUrl = `https://${domain}/logout?${params.toString()}`;
    console.log('[Logout] Redirecionando para Cognito:', cognitoLogoutUrl);

    window.location.href = cognitoLogoutUrl;
  }, [clearAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-700 text-lg">Encerrando sessão...</p>
        <p className="text-gray-500 text-sm mt-2">Aguarde enquanto processamos seu logout</p>
      </div>
    </div>
  );
}
