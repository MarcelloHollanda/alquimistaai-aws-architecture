'use client';

import { RegisterWizard } from '@/components/auth/register-wizard';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Cabeçalho */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Criar nova conta</h1>
            <p className="text-gray-600 mt-2">
              Preencha os dados para começar a usar o Alquimista.AI
            </p>
          </div>

          {/* Wizard */}
          <RegisterWizard />

          {/* Link para login */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{' '}
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
