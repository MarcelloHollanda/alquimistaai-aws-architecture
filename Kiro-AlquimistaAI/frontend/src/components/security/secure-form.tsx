'use client';

import { FormEvent, ReactNode } from 'react';
import { useCSRF } from '@/hooks/use-csrf';
import { secureFormData, rateLimiter } from '@/utils/security';
import { useToast } from '@/hooks/use-toast';

interface SecureFormProps {
  children: ReactNode;
  onSubmit: (data: FormData, csrfToken: string) => Promise<void> | void;
  className?: string;
  rateLimitKey?: string;
  validateBeforeSubmit?: (data: FormData) => boolean;
}

/**
 * Secure form component with CSRF protection and rate limiting
 */
export function SecureForm({
  children,
  onSubmit,
  className = '',
  rateLimitKey,
  validateBeforeSubmit,
}: SecureFormProps) {
  const { token } = useCSRF();
  const { toast } = useToast();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Check rate limit
    const limitKey = rateLimitKey || 'form-submit';
    if (!rateLimiter.isAllowed(limitKey)) {
      toast({
        title: 'Muitas tentativas',
        description: 'Por favor, aguarde um momento antes de tentar novamente.',
        variant: 'destructive',
      });
      return;
    }

    // Get form data
    const formData = new FormData(e.currentTarget);

    // Custom validation
    if (validateBeforeSubmit && !validateBeforeSubmit(formData)) {
      return;
    }

    // Convert FormData to object for sanitization
    const dataObject: Record<string, any> = {};
    formData.forEach((value, key) => {
      dataObject[key] = value;
    });

    // Sanitize data
    const securedData = secureFormData(dataObject);

    // Create new FormData with secured values
    const securedFormData = new FormData();
    Object.entries(securedData).forEach(([key, value]) => {
      securedFormData.append(key, value);
    });

    // Add CSRF token
    if (token) {
      securedFormData.append('_csrf', token);
    }

    try {
      await onSubmit(securedFormData, token || '');
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao enviar o formulário. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className} noValidate>
      {/* CSRF Token Hidden Field */}
      {token && <input type="hidden" name="_csrf" value={token} />}
      
      {children}
    </form>
  );
}
