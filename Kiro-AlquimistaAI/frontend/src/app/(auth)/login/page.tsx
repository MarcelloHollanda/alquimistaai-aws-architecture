'use client';

import { initOAuthFlow } from '@/lib/cognito-client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

/**
 * Página de Login - Painel Operacional AlquimistaAI
 * 
 * ROTA OFICIAL: /login
 * 
 * Esta é a página oficial de login do sistema, integrada com Amazon Cognito OAuth 2.0.
 * 
 * Fluxo de autenticação:
 * 1. Usuário acessa /login
 * 2. Clica em "Entrar com Cognito"
 * 3. É redirecionado para Cognito Hosted UI
 * 4. Após autenticação, retorna para /auth/callback
 * 5. Callback processa tokens e redireciona para dashboard apropriado
 */
function LoginContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar se há parâmetros de erro na URL
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (errorParam) {
      setError(errorDescription || 'Erro ao fazer login. Tente novamente.');
    }
  }, [searchParams]);

  const handleLogin = () => {
    try {
      initOAuthFlow();
    } catch (err) {
      console.error('[Login] Erro ao iniciar OAuth:', err);
      setError('Erro ao iniciar login. Verifique a configuração do sistema.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Painel Operacional AlquimistaAI
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Acesso seguro via login único
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800">
                <strong>Login Único:</strong> Use suas credenciais corporativas para acessar o painel.
                Você será redirecionado automaticamente para o dashboard apropriado baseado no seu perfil.
              </p>
            </div>

            <Button
              onClick={handleLogin}
              className="w-full"
              size="lg"
            >
              Entrar com Cognito
            </Button>

            <div className="mt-4 text-center text-xs text-gray-500">
              <p>Acesso restrito a usuários autorizados</p>
              <p className="mt-1">
                Problemas para acessar? Entre em contato com o suporte.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} AlquimistaAI. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
