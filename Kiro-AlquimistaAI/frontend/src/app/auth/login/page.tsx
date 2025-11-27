'use client';

import { initOAuthFlow } from '@/lib/cognito-client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';

/**
 * Página de Login - Rota /auth/login
 * 
 * Esta página é um alias para a rota principal de login,
 * garantindo compatibilidade com URLs que usam /auth/login.
 * 
 * Fluxo de autenticação:
 * 1. Usuário acessa /auth/login
 * 2. Clica em "Entrar com Cognito"
 * 3. É redirecionado para Cognito Hosted UI
 * 4. Após autenticação, retorna para /auth/callback
 * 5. Callback processa tokens e redireciona para dashboard apropriado
 */
function LoginContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Verificar se há parâmetros de erro na URL
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const expired = searchParams.get('expired');

    if (errorParam) {
      setError(errorDescription || 'Erro ao fazer login. Tente novamente.');
    } else if (expired === 'true') {
      setError('Sua sessão expirou. Por favor, faça login novamente.');
    }
  }, [searchParams]);

  const handleLogin = () => {
    try {
      setIsLoading(true);
      initOAuthFlow();
    } catch (err) {
      console.error('[Login] Erro ao iniciar OAuth:', err);
      setError('Erro ao iniciar login. Verifique a configuração do sistema.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">A</span>
            </div>
          </div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Painel Operacional
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            AlquimistaAI - Acesso seguro via login único
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-gray-100">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Login Único:</strong> Use suas credenciais corporativas para acessar o painel.
                Você será redirecionado automaticamente para o dashboard apropriado baseado no seu perfil.
              </p>
            </div>

            <Button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecionando...
                </>
              ) : (
                'Entrar com Cognito'
              )}
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

export default function AuthLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
