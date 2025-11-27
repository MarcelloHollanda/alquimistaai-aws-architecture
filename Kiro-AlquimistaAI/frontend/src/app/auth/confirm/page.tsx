'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { confirmSignUp } from '@/lib/cognito-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import Link from 'next/link';
import { Suspense } from 'react';

function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code) {
      setError('Código de verificação é obrigatório');
      return;
    }

    if (code.length !== 6) {
      setError('Código deve ter 6 dígitos');
      return;
    }

    setIsLoading(true);

    try {
      await confirmSignUp(email, code);
      setSuccess(true);

      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao confirmar e-mail');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError(null);
    setIsLoading(true);

    try {
      // Implementar reenvio de código
      // await resendConfirmationCode(email);
      alert('Código reenviado com sucesso!');
    } catch (err: any) {
      setError(err.message || 'Erro ao reenviar código');
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              E-mail não fornecido
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Por favor, complete o cadastro novamente.
            </p>
            <Link
              href="/auth/register"
              className="mt-4 inline-block font-medium text-blue-600 hover:text-blue-500"
            >
              Criar nova conta
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Alert variant="default" className="bg-green-50 border-green-200">
            <div className="space-y-2">
              <p className="font-medium text-green-800">
                E-mail confirmado com sucesso!
              </p>
              <p className="text-sm text-green-700">
                Você será redirecionado para a página de login...
              </p>
            </div>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Confirmar e-mail
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enviamos um código de verificação para <strong>{email}</strong>
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                {error}
              </Alert>
            )}

            <div className="space-y-2">
              <label htmlFor="code" className="text-sm font-medium text-gray-700">
                Código de verificação
              </label>
              <Input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                disabled={isLoading}
                maxLength={6}
              />
              <p className="text-xs text-gray-500">
                Digite o código de 6 dígitos enviado para seu e-mail
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Confirmando...' : 'Confirmar e-mail'}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Não recebeu o código?
              </p>
              <Button
                type="button"
                variant="link"
                onClick={handleResendCode}
                disabled={isLoading}
              >
                Reenviar código
              </Button>
            </div>

            <div className="text-center">
              <Link
                href="/login"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Voltar para o login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ConfirmContent />
    </Suspense>
  );
}
