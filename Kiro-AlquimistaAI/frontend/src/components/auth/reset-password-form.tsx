'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { confirmPassword } from '@/lib/cognito-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { validatePassword } from '@/lib/validators';
import { translateCognitoError } from '@/lib/cognito-errors';

interface ResetPasswordFormProps {
  email: string;
}

export function ResetPasswordForm({ email }: ResetPasswordFormProps) {
  const router = useRouter();
  
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPasswordValue, setConfirmPasswordValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ 
    code?: string; 
    password?: string; 
    confirmPassword?: string 
  }>({});
  const [success, setSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: { code?: string; password?: string; confirmPassword?: string } = {};

    if (!code) {
      newErrors.code = 'Código de verificação é obrigatório';
    } else if (code.length !== 6) {
      newErrors.code = 'Código deve ter 6 dígitos';
    }

    if (!password) {
      newErrors.password = 'Nova senha é obrigatória';
    } else {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        newErrors.password = passwordValidation.message || 'Senha inválida';
      }
    }

    if (!confirmPasswordValue) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (password !== confirmPasswordValue) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await confirmPassword(email, code, password);
      setSuccess(true);
      
      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        router.push('/login');
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
            Senha redefinida com sucesso!
          </p>
          <p className="text-sm text-green-700">
            Você será redirecionado para a página de login...
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
          Digite o código de verificação enviado para <strong>{email}</strong>
        </p>
      </div>

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
          className={errors.code ? 'border-red-500' : ''}
        />
        {errors.code && (
          <p className="text-sm text-red-500">{errors.code}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-gray-700">
          Nova senha
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          disabled={isLoading}
          className={errors.password ? 'border-red-500' : ''}
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password}</p>
        )}
        <p className="text-xs text-gray-500">
          Mínimo 8 caracteres, com maiúsculas, minúsculas, números e caracteres especiais
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
          Confirmar nova senha
        </label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPasswordValue}
          onChange={(e) => setConfirmPasswordValue(e.target.value)}
          placeholder="••••••••"
          disabled={isLoading}
          className={errors.confirmPassword ? 'border-red-500' : ''}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-red-500">{errors.confirmPassword}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? 'Redefinindo...' : 'Redefinir senha'}
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
