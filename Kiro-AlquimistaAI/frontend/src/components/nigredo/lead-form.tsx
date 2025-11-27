'use client';

/**
 * Lead Form Component
 * Formulário de captura de leads do Nigredo com validação e integração com API
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateLead } from '@/hooks/use-nigredo';

// Schema de validação Zod
const leadFormSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  email: z.string()
    .email('Email inválido')
    .max(255, 'Email muito longo'),
  phone: z.string()
    .optional()
    .refine((val) => !val || /^\+?[1-9]\d{1,14}$/.test(val.replace(/[\s\-\(\)]/g, '')), {
      message: 'Telefone inválido (use formato internacional)',
    }),
  company: z.string()
    .min(2, 'Nome da empresa deve ter pelo menos 2 caracteres')
    .max(100, 'Nome da empresa deve ter no máximo 100 caracteres')
    .optional(),
  message: z.string()
    .min(10, 'Mensagem deve ter pelo menos 10 caracteres')
    .max(1000, 'Mensagem deve ter no máximo 1000 caracteres'),
});

type LeadFormData = z.infer<typeof leadFormSchema>;

export interface LeadFormProps {
  onSuccess?: (leadId: string) => void;
  onError?: (error: Error) => void;
  source?: string;
  className?: string;
}

export function LeadForm({ onSuccess, onError, source = 'website', className = '' }: LeadFormProps) {
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const createLeadMutation = useCreateLead();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
  });

  const onSubmit = async (data: LeadFormData) => {
    try {
      setSubmitStatus('idle');
      setErrorMessage('');

      // Capturar UTM params da URL se disponíveis
      const urlParams = new URLSearchParams(window.location.search);
      const utmSource = urlParams.get('utm_source') || undefined;
      const utmMedium = urlParams.get('utm_medium') || undefined;
      const utmCampaign = urlParams.get('utm_campaign') || undefined;

      const result = await createLeadMutation.mutateAsync({
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        message: data.message,
        utmSource,
        utmMedium,
        utmCampaign,
      });

      setSubmitStatus('success');
      reset();
      
      if (onSuccess && result.data?.id) {
        onSuccess(result.data.id);
      }
    } catch (error: any) {
      console.error('Erro ao enviar formulário:', error);
      setSubmitStatus('error');
      
      // Extrair mensagem de erro
      const message = error.response?.data?.error?.message || 
                     error.response?.data?.message ||
                     error.message ||
                     'Erro ao enviar formulário. Tente novamente.';
      
      setErrorMessage(message);
      
      if (onError) {
        onError(error);
      }
    }
  };

  return (
    <div className={className}>
      {submitStatus === 'success' ? (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-green-800 mb-2">
            Obrigado pelo seu interesse!
          </h3>
          <p className="text-green-700 mb-6">
            Recebemos suas informações e entraremos em contato em breve.
          </p>
          <Button
            onClick={() => setSubmitStatus('idle')}
            variant="outline"
            className="border-green-300 text-green-700 hover:bg-green-50"
          >
            Enviar outro formulário
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Nome */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-semibold text-slate-700 mb-2"
            >
              Nome completo <span className="text-red-500">*</span>
            </label>
            <Input
              id="name"
              type="text"
              placeholder="João Silva"
              {...register('name')}
              className={errors.name ? 'border-red-500' : ''}
              aria-invalid={errors.name ? 'true' : 'false'}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-slate-700 mb-2"
            >
              Email profissional <span className="text-red-500">*</span>
            </label>
            <Input
              id="email"
              type="email"
              placeholder="joao@empresa.com"
              {...register('email')}
              className={errors.email ? 'border-red-500' : ''}
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Telefone */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-semibold text-slate-700 mb-2"
            >
              Telefone (opcional)
            </label>
            <Input
              id="phone"
              type="tel"
              placeholder="+55 11 99999-9999"
              {...register('phone')}
              className={errors.phone ? 'border-red-500' : ''}
              aria-invalid={errors.phone ? 'true' : 'false'}
              aria-describedby={errors.phone ? 'phone-error' : undefined}
            />
            {errors.phone && (
              <p id="phone-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* Empresa */}
          <div>
            <label
              htmlFor="company"
              className="block text-sm font-semibold text-slate-700 mb-2"
            >
              Empresa (opcional)
            </label>
            <Input
              id="company"
              type="text"
              placeholder="Minha Empresa Ltda"
              {...register('company')}
              className={errors.company ? 'border-red-500' : ''}
              aria-invalid={errors.company ? 'true' : 'false'}
              aria-describedby={errors.company ? 'company-error' : undefined}
            />
            {errors.company && (
              <p id="company-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.company.message}
              </p>
            )}
          </div>

          {/* Mensagem */}
          <div>
            <label
              htmlFor="message"
              className="block text-sm font-semibold text-slate-700 mb-2"
            >
              Como podemos ajudar? <span className="text-red-500">*</span>
            </label>
            <textarea
              id="message"
              rows={4}
              placeholder="Conte-nos sobre seu interesse em automatizar a prospecção..."
              {...register('message')}
              className={`flex w-full rounded-md border ${
                errors.message ? 'border-red-500' : 'border-input'
              } bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
              aria-invalid={errors.message ? 'true' : 'false'}
              aria-describedby={errors.message ? 'message-error' : undefined}
            />
            {errors.message && (
              <p id="message-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.message.message}
              </p>
            )}
            <p className="mt-1 text-xs text-slate-500">
              Mínimo 10 caracteres, máximo 1000 caracteres
            </p>
          </div>

          {/* Error Message */}
          {submitStatus === 'error' && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-red-800 mb-1">
                  Erro ao enviar formulário
                </h4>
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-6 text-lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Enviando...
              </>
            ) : (
              'Quero Conhecer o Nigredo'
            )}
          </Button>

          <p className="text-xs text-center text-slate-500">
            Ao enviar este formulário, você concorda com nossa{' '}
            <a href="/privacidade" className="text-purple-600 hover:underline">
              Política de Privacidade
            </a>
            {' '}e{' '}
            <a href="/termos" className="text-purple-600 hover:underline">
              Termos de Uso
            </a>
          </p>
        </form>
      )}
    </div>
  );
}
