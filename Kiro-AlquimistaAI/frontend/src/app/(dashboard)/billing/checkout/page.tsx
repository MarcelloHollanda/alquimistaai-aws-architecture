'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { billingClient, BillingError } from '@/lib/billing-client';
import { SubscriptionSummary } from '@/types/billing';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  formatCurrency, 
  formatCNPJ, 
  formatPeriodicity,
  formatItemCount 
} from '@/utils/billing-formatters';
import { 
  CreditCard, 
  Shield, 
  ArrowLeft, 
  Building2, 
  FileText,
  CheckCircle2 
} from 'lucide-react';
import Image from 'next/image';

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // Buscar dados da assinatura
  useEffect(() => {
    async function fetchSubscription() {
      if (!user?.tenantId) {
        setError('Usuário não autenticado');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const data = await billingClient.getSubscription(user.tenantId);
        setSubscription(data);
      } catch (err) {
        const error = err as BillingError;
        setError(error.message);
        
        toast({
          title: 'Erro ao carregar dados',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchSubscription();
  }, [user, toast]);

  // Processar pagamento
  async function handlePayment() {
    if (!subscription || !user?.tenantId) return;

    try {
      setProcessing(true);

      const response = await billingClient.createCheckoutSession({
        tenantId: user.tenantId,
        planId: subscription.plan.id,
        periodicity: subscription.plan.periodicity,
        selectedAgents: subscription.agents.map(a => a.id),
        selectedSubnucleos: subscription.subnucleos.map(s => s.id),
      });

      // Redirecionar para Stripe Checkout
      window.location.href = response.checkoutUrl;
    } catch (err) {
      const error = err as BillingError;
      
      toast({
        title: 'Erro ao processar pagamento',
        description: error.message,
        variant: 'destructive',
      });
      
      setProcessing(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !subscription) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>
            {error || 'Não foi possível carregar os dados da assinatura'}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => router.push('/app/billing/plans')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para planos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Finalizar Assinatura</h1>
          <p className="text-muted-foreground mt-1">
            Revise os detalhes e finalize seu pagamento
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Image
            src="/logo-alquimista.png"
            alt="AlquimistaAI"
            width={120}
            height={40}
            className="h-10 w-auto"
          />
        </div>
      </div>

      {/* Dados da Empresa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Dados da Empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nome:</span>
            <span className="font-medium">{subscription.companyName}</span>
          </div>
          {subscription.cnpj && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">CNPJ:</span>
              <span className="font-medium">{formatCNPJ(subscription.cnpj)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo do Plano */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resumo do Plano
          </CardTitle>
          <CardDescription>
            Detalhes da sua assinatura
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Plano Base */}
          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-lg">{subscription.plan.name}</p>
                <p className="text-sm text-muted-foreground">
                  Cobrança {formatPeriodicity(subscription.plan.periodicity).toLowerCase()}
                </p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
          </div>

          <Separator />

          {/* Agentes */}
          {subscription.agents.length > 0 && (
            <div>
              <p className="font-medium mb-2">
                {formatItemCount(subscription.agents.length, 'Agente', 'Agentes')}
              </p>
              <ul className="space-y-1">
                {subscription.agents.map((agent) => (
                  <li key={agent.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{agent.name}</span>
                    <span>{formatCurrency(agent.priceMonthly)}/mês</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* SubNúcleos */}
          {subscription.subnucleos.length > 0 && (
            <div>
              <p className="font-medium mb-2">
                {formatItemCount(subscription.subnucleos.length, 'SubNúcleo', 'SubNúcleos')}
              </p>
              <ul className="space-y-1">
                {subscription.subnucleos.map((subnucleo) => (
                  <li key={subnucleo.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{subnucleo.name}</span>
                    <span>{formatCurrency(subnucleo.priceMonthly)}/mês</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo Financeiro */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Financeiro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(subscription.pricing.subtotal)}</span>
          </div>
          
          {subscription.pricing.taxes > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Impostos e taxas</span>
              <span>{formatCurrency(subscription.pricing.taxes)}</span>
            </div>
          )}
          
          <Separator />
          
          <div className="flex justify-between text-lg font-bold">
            <span>Total a pagar hoje</span>
            <span>{formatCurrency(subscription.pricing.total)}</span>
          </div>

          <div className="text-xs text-muted-foreground pt-2">
            <p>Empresa recebedora: AlquimistaAI Tecnologia Ltda.</p>
            <p>CNPJ: 00.000.000/0000-00</p>
            <div className="flex gap-2 mt-2">
              <span>Aceitamos:</span>
              <span className="font-medium">Visa, Mastercard, Elo, Amex</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aviso de Segurança */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Pagamento processado por parceiro certificado (Stripe). Seus dados de cartão não são 
          armazenados pela AlquimistaAI. Transação 100% segura e criptografada.
        </AlertDescription>
      </Alert>

      {/* Ações */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => router.push('/app/billing/plans')}
          disabled={processing}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Alterar plano
        </Button>
        
        <Button
          className="flex-1"
          size="lg"
          onClick={handlePayment}
          disabled={processing}
        >
          {processing ? (
            <>Processando...</>
          ) : (
            <>
              <CreditCard className="mr-2 h-5 w-5" />
              Pagar com cartão de crédito
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
