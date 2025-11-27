'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Página de Callback de Logout
 * 
 * Esta página é chamada pelo Cognito após o logout ser processado.
 * Exibe mensagem de sucesso e redireciona para a página de login.
 * 
 * Valida: Requirements 7.3, 7.5
 */
export default function LogoutCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    console.log('[Logout Callback] Logout concluído pelo Cognito');

    // Aguardar 2 segundos e redirecionar para login
    const timer = setTimeout(() => {
      console.log('[Logout Callback] Redirecionando para login');
      router.push('/login');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md">
        <div className="text-green-500 mb-4">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Logout Realizado</h2>
        <p className="text-gray-600 mb-4">Você foi desconectado com sucesso</p>
        <p className="text-sm text-gray-500">Redirecionando para página de login...</p>
      </div>
    </div>
  );
}
