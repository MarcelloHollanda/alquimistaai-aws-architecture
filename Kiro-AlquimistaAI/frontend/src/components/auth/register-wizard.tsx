'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

interface FormData {
  // Passo 1 - Dados pessoais
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  
  // Passo 2 - Dados da empresa
  companyName: string;
  companyLegalName: string;
  cnpj: string;
  segment: string;
  logo?: File;
  
  // Passo 3 - Papel
  role: string;
}

const SEGMENTS = [
  'E-commerce',
  'Serviços Financeiros',
  'Saúde e Bem-estar',
  'Educação',
  'Tecnologia',
  'Varejo',
  'Imobiliário',
  'Consultoria',
  'Marketing e Publicidade',
  'Indústria',
  'Outro',
];

export function RegisterWizard() {
  const router = useRouter();
  const { signUp, isLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    companyName: '',
    companyLegalName: '',
    cnpj: '',
    segment: '',
    role: 'MASTER', // Primeiro usuário sempre é MASTER
  });

  const progress = (step / 3) * 100;

  const updateField = (field: keyof FormData, value: string | File) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateStep1 = () => {
    if (!formData.name || !formData.email || !formData.password) {
      setError('Preencha todos os campos obrigatórios');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return false;
    }

    if (formData.password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('E-mail inválido');
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    if (!formData.companyName || !formData.cnpj || !formData.segment) {
      setError('Preencha todos os campos obrigatórios');
      return false;
    }

    // Validação básica de CNPJ (apenas formato)
    const cnpjClean = formData.cnpj.replace(/\D/g, '');
    if (cnpjClean.length !== 14) {
      setError('CNPJ inválido');
      return false;
    }

    return true;
  };

  const handleNext = () => {
    setError('');

    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;

    setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    try {
      // 1. Criar empresa no backend
      const companyResponse = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.companyName,
          legalName: formData.companyLegalName,
          cnpj: formData.cnpj,
          segment: formData.segment,
        }),
      });

      if (!companyResponse.ok) {
        throw new Error('Erro ao criar empresa');
      }

      const { tenantId } = await companyResponse.json();

      // 2. Upload da logo (se houver)
      if (formData.logo) {
        const logoFormData = new FormData();
        logoFormData.append('file', formData.logo);
        logoFormData.append('tenantId', tenantId);

        await fetch('/api/upload/logo', {
          method: 'POST',
          body: logoFormData,
        });
      }

      // 3. Criar usuário no Cognito
      await signUp({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
        tenantId,
      });

      // 4. Criar registro de usuário no backend
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          phone: formData.phone,
          tenantId,
          role: formData.role,
        }),
      });

      // Redirecionar para confirmação
      router.push(`/auth/confirm?email=${encodeURIComponent(formData.email)}`);
    } catch (error: any) {
      setError(error.message || 'Erro ao criar conta');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Passo {step} de 3
          </span>
          <span className="text-sm text-gray-500">
            {step === 1 && 'Dados pessoais'}
            {step === 2 && 'Dados da empresa'}
            {step === 3 && 'Confirmação'}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step 1: Dados Pessoais */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <Label htmlFor="name">Nome completo *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="João Silva"
              disabled={isLoading}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="email">E-mail *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="joao@empresa.com"
              disabled={isLoading}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="phone">Telefone/WhatsApp</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="(11) 99999-9999"
              disabled={isLoading}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="password">Senha *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Mínimo de 8 caracteres
            </p>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirmar senha *</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              className="mt-1"
            />
          </div>
        </div>
      )}

      {/* Step 2: Dados da Empresa */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <Label htmlFor="companyName">Nome fantasia *</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => updateField('companyName', e.target.value)}
              placeholder="Minha Empresa"
              disabled={isLoading}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="companyLegalName">Razão social</Label>
            <Input
              id="companyLegalName"
              value={formData.companyLegalName}
              onChange={(e) => updateField('companyLegalName', e.target.value)}
              placeholder="Minha Empresa LTDA"
              disabled={isLoading}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="cnpj">CNPJ *</Label>
            <Input
              id="cnpj"
              value={formData.cnpj}
              onChange={(e) => updateField('cnpj', e.target.value)}
              placeholder="00.000.000/0000-00"
              disabled={isLoading}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="segment">Segmento de atuação *</Label>
            <Select
              value={formData.segment}
              onValueChange={(value) => updateField('segment', value)}
              disabled={isLoading}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione o segmento" />
              </SelectTrigger>
              <SelectContent>
                {SEGMENTS.map((segment) => (
                  <SelectItem key={segment} value={segment}>
                    {segment}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="logo">Logomarca (opcional)</Label>
            <Input
              id="logo"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) updateField('logo', file);
              }}
              disabled={isLoading}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG ou SVG até 2MB
            </p>
          </div>
        </div>
      )}

      {/* Step 3: Confirmação */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-4">Revise seus dados</h3>
            
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600">Nome:</span>
                <span className="ml-2 font-medium">{formData.name}</span>
              </div>
              <div>
                <span className="text-gray-600">E-mail:</span>
                <span className="ml-2 font-medium">{formData.email}</span>
              </div>
              <div>
                <span className="text-gray-600">Empresa:</span>
                <span className="ml-2 font-medium">{formData.companyName}</span>
              </div>
              <div>
                <span className="text-gray-600">CNPJ:</span>
                <span className="ml-2 font-medium">{formData.cnpj}</span>
              </div>
              <div>
                <span className="text-gray-600">Segmento:</span>
                <span className="ml-2 font-medium">{formData.segment}</span>
              </div>
              <div>
                <span className="text-gray-600">Papel:</span>
                <span className="ml-2 font-medium">Master (Administrador Principal)</span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Importante:</strong> Você receberá um e-mail de confirmação. 
              Clique no link para ativar sua conta.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-6 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="mt-8 flex justify-between">
        {step > 1 && (
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={isLoading}
          >
            Voltar
          </Button>
        )}

        <div className="ml-auto">
          {step < 3 ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={isLoading}
            >
              Próximo
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? 'Criando conta...' : 'Criar conta'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
