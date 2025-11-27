'use client';

import { useSearchParams } from 'next/navigation';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import Link from 'next/link';
import { Suspense } from 'react';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              E-mail não fornecido
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Por favor, inicie o processo de recuperação de senha novamente.
            </p>
            <Link
              href="/auth/forgot-password"
              className="mt-4 inline-block font-medium text-blue-600 hover:text-blue-500"
            >
              Recuperar senha
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Redefinir senha
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ou{' '}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              voltar para o login
            </Link>
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <ResetPasswordForm email={email} />
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
