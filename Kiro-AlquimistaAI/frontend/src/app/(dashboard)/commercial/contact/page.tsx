'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useSelection } from '@/stores/selection-store';
import {
  sendCommercialContact,
  validateCommercialForm,
  formatWhatsApp,
  formatCNPJ,
} from '@/lib/commercial-client';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send } from 'lucide-react';

export default function CommercialContactPage() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    selectedAgents,
    selectedSubnucleos,
    totalAgentsPrice,
    totalSubnucleosBasePrice,
    hasAgents,
    hasSubnucleos,
  } = useSelection();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    cnpj: '',
    contactName: '',
    email: '',
    whatsapp: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateCommercialForm({
      ...formData,
      selectedAgents: selectedAgents.map((a) => a.id),
      selectedSubnucleos: selectedSubnucleos.map((s) => s.id),
    });

    if (!validation.valid) {
      toast({
        title: 'Formulário inválido',
        description: validation.errors.join(', '),
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      await sendCommercialContact({
        ...formData,
        selectedAgents: selectedAgents.map((a) => a.id),
        selectedSubnucleos: selectedSubnucleos.map((s) => s.id),
      });

      toast({
        title: 'Solicitação enviada!',
        description:
          'Nossa equipe comercial entrará em contato em breve por e-mail ou WhatsApp.',
      });

      // Redirecionar após sucesso
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar solicitação',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            Contato Comercial
          </h1>
          <p className="text-gray-600">
            Preencha o formulário e nossa equipe entrará em contato
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Formulário */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Nome da Empresa *
                  </label>
                  <Input
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Sua Empresa Ltda"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    CNPJ (opcional)
                  </label>
                  <Input
                    name="cnpj"
                    value={formData.cnpj}
                    onChange={handleChange}
                    placeholder="00.000.000/0000-00"
                    onBlur={(e) => {
                      if (e.target.value) {
                        e.target.value = formatCNPJ(e.target.value);
                      }
                    }}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Nome do Responsável *
                  </label>
                  <Input
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleChange}
                    placeholder="João Silva"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    E-mail *
                  </label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="joao@empresa.com"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    WhatsApp *
                  </label>
                  <Input
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    placeholder="(84) 99999-9999"
                    onBlur={(e) => {
                      if (e.target.value) {
                        e.target.value = formatWhatsApp(e.target.value);
                      }
                    }}
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Mensagem *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Explique sua necessidade, volume de leads/contatos e expectativas com a IA..."
                    rows={5}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    'Enviando...'
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar Solicitação
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Resumo */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Resumo da Seleção
              </h2>

              {hasAgents && (
                <div className="mb-4">
                  <p className="mb-2 text-sm font-medium text-gray-700">
                    Agentes AlquimistaAI ({selectedAgents.length})
                  </p>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {selectedAgents.map((agent) => (
                      <li key={agent.id}>• {agent.name}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {formatCurrency(totalAgentsPrice)}/mês
                  </p>
                </div>
              )}

              {hasSubnucleos && (
                <div className="mb-4 border-t pt-4">
                  <p className="mb-2 text-sm font-medium text-gray-700">
                    SubNúcleos Fibonacci ({selectedSubnucleos.length})
                  </p>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {selectedSubnucleos.map((subnucleo) => (
                      <li key={subnucleo.id}>• {subnucleo.name}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {formatCurrency(totalSubnucleosBasePrice)}/mês (base)
                  </p>
                  <p className="text-xs text-gray-600">
                    + taxas sob consulta
                  </p>
                </div>
              )}

              <div className="rounded-lg bg-blue-50 p-3">
                <p className="text-xs text-blue-900">
                  Nossa equipe comercial entrará em contato para apresentar uma
                  proposta personalizada.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-gray-100 p-4">
              <p className="mb-2 text-sm font-medium text-gray-900">
                Contatos Diretos
              </p>
              <p className="text-xs text-gray-600">
                E-mail: alquimistafibonacci@gmail.com
              </p>
              <p className="text-xs text-gray-600">
                WhatsApp: +55 84 99708-4444
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
