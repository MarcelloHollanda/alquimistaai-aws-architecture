import { RegisterWizard } from '@/components/auth/register-wizard';
import { SocialLoginButtons } from '@/components/auth/social-login-buttons';
import Link from 'next/link';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Criar sua conta
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Ou{' '}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              entre na sua conta existente
            </Link>
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Botões de Login Social */}
          <div className="mb-8">
            <SocialLoginButtons />
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Ou cadastre-se com e-mail
                </span>
              </div>
            </div>
          </div>

          {/* Wizard de Cadastro */}
          <RegisterWizard />
        </div>
      </div>
    </div>
  );
}
