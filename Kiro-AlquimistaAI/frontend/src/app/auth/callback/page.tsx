'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import * as cognitoClient from '@/lib/cognito-client';
import { useAuthStore, determineInitialRoute } from '@/stores/auth-store';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuthFromToken } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    // Prevenir processamento duplicado
    if (hasProcessed) {
      console.log('[Callback] Já processado, ignorando');
      return;
    }

    const processCallback = async () => {
      try {
        setHasProcessed(true);
        console.log('[Callback] Processando callback OAuth');

        // Verificar se há erro na URL
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (errorParam) {
          console.error('[Callback] Erro do Cognito:', errorParam, errorDescription);
          setError(errorDescription || errorParam);
          setProcessing(false);
          return;
        }

        // Obter código de autorização
        const code = searchParams.get('code');

        if (!code) {
          console.error('[Callback] Código de autorização ausente');
          setError('Código de autorização não encontrado');
          setProcessing(false);
          return;
        }

        console.log('[Callback] Código recebido:', code.substring(0, 10) + '...');

        // Trocar código por tokens
        const tokens = await cognitoClient.exchangeCodeForTokens(code);
        console.log('[Callback] Tokens obtidos');

        // Armazenar tokens em cookies
        cognitoClient.storeTokensInCookies(tokens);
        console.log('[Callback] Tokens armazenados em cookies');

        // Configurar autenticação no store
        setAuthFromToken(tokens.idToken);

        // Extrair grupos do token para determinar rota
        const payload = JSON.parse(
          Buffer.from(tokens.idToken.split('.')[1], 'base64').toString()
        );
        const groups: string[] = payload['cognito:groups'] || [];

        // Determinar rota baseada nos grupos
        const route = determineInitialRoute(groups);
        console.log('[Callback] Redirecionando para:', route);

        // Redirecionar
        router.push(route);
      } catch (err: any) {
        console.error('[Callback] Erro ao processar callback:', err);
        setError(err.message || 'Erro ao processar autenticação');
        setProcessing(false);
      }
    };

    processCallback();
  }, [searchParams, router, setAuthFromToken, hasProcessed]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-red-600">
              <svg
                className="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Erro na autenticação
            </h2>
            <p className="mt-2 text-sm text-red-600">{error}</p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/login')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Voltar para o login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Processando autenticação...</p>
          <p className="mt-2 text-sm text-gray-500">
            Aguarde enquanto validamos suas credenciais
          </p>
        </div>
      </div>
    );
  }

  return null;
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Carregando...</p>
          </div>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
