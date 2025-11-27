'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { forgotPassword } from '@/lib/cognito-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { validateEmail } from '@/lib/validators';
import { translateCognitoError } from '@/lib/cognito-errors';

export function ForgotPasswordForm() {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email) {
      setError('E-mail é obrigatório');
      return;
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setError(emailValidation.message || 'E-mail inválido');
      return;
    }

    setIsLoading(true);

    try {
      await forgotPassword(email);
      setSuccess(true);
      
      // Redirecionar para página de reset após 2 segundos
      setTimeout(() => {
        router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (err: any) {
      const errorMessage = translateCognitoError(err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Alert variant="default" className="bg-green-50 border-green-200">
        <div className="space-y-2">
          <p className="font-medium text-green-800">
            Código enviado com sucesso!
          </p>
          <p className="text-sm text-green-700">
            Verifique seu e-mail e insira o código de verificação na próxima tela.
          </p>
        </div>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          {error}
        </Alert>
      )}

      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          Digite seu e-mail e enviaremos um código de verificação para redefinir sua senha.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-gray-700">
          E-mail
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          disabled={isLoading}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? 'Enviando...' : 'Enviar código'}
      </Button>

      <div className="text-center">
        <Button
          type="button"
          variant="link"
          onClick={() => router.push('/login')}
          disabled={isLoading}
        >
          Voltar para login
        </Button>
      </div>
    </form>
  );
}
