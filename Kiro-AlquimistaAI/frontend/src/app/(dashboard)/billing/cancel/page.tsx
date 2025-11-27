'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { XCircle, ArrowLeft, CreditCard, HelpCircle, MessageSquare } from 'lucide-react';

function CancelContent() {
  const router = useRouter();

  return (
    <div className="container max-w-2xl mx-auto py-16 space-y-8">
      {/* Ícone de Cancelamento */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20">
          <XCircle className="h-10 w-10 text-orange-600 dark:text-orange-400" />
        </div>
        
        <div>
          <h1 className="text-3xl font-bold">Pagamento Cancelado</h1>
          <p className="text-muted-foreground mt-2">
            Você cancelou o processo de pagamento
          </p>
        </div>
      </div>

      {/* Informação */}
      <Alert>
        <AlertDescription>
          Não se preocupe! Nenhuma cobrança foi realizada. Você pode tentar novamente quando quiser.
        </AlertDescription>
      </Alert>

      {/* Motivos Comuns */}
      <Card>
        <CardHeader>
          <CardTitle>Por que isso aconteceu?</CardTitle>
          <CardDescription>
            Alguns motivos comuns para cancelamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-muted-foreground mt-2" />
            <p className="text-sm text-muted-foreground">
              Você clicou no botão "Voltar" ou fechou a janela de pagamento
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-muted-foreground mt-2" />
            <p className="text-sm text-muted-foreground">
              Decidiu revisar os detalhes do plano antes de finalizar
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-muted-foreground mt-2" />
            <p className="text-sm text-muted-foreground">
              Encontrou algum problema durante o processo
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Opções */}
      <Card>
        <CardHeader>
          <CardTitle>O que você gostaria de fazer?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            className="w-full justify-start"
            size="lg"
            onClick={() => router.push('/app/billing/checkout')}
          >
            <CreditCard className="mr-2 h-5 w-5" />
            Tentar novamente
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start"
            size="lg"
            onClick={() => router.push('/app/billing/plans')}
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Alterar plano
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start"
            size="lg"
            onClick={() => router.push('/app/dashboard')}
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Voltar para o dashboard
          </Button>
        </CardContent>
      </Card>

      {/* Ajuda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Precisa de Ajuda?
          </CardTitle>
          <CardDescription>
            Nossa equipe está pronta para ajudar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              Se você encontrou algum problema durante o pagamento ou tem dúvidas sobre os planos, 
              estamos aqui para ajudar.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.open('mailto:suporte@alquimistaai.com', '_blank')}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Enviar e-mail
            </Button>
            
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.open('https://wa.me/5584997084444', '_blank')}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              WhatsApp
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center pt-2">
            <p>Horário de atendimento: Segunda a Sexta, 9h às 18h</p>
          </div>
        </CardContent>
      </Card>

      {/* Garantias */}
      <div className="bg-muted p-6 rounded-lg space-y-3">
        <h3 className="font-semibold">Por que escolher a AlquimistaAI?</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>✓ Pagamento 100% seguro via Stripe</p>
          <p>✓ Cancele a qualquer momento, sem multas</p>
          <p>✓ Suporte dedicado em português</p>
          <p>✓ Garantia de satisfação de 7 dias</p>
        </div>
      </div>

      {/* FAQ Rápido */}
      <Card>
        <CardHeader>
          <CardTitle>Perguntas Frequentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium text-sm mb-1">
              Meus dados foram salvos?
            </p>
            <p className="text-sm text-muted-foreground">
              Não. Como você cancelou o pagamento, nenhum dado foi processado ou armazenado.
            </p>
          </div>
          
          <div>
            <p className="font-medium text-sm mb-1">
              Posso mudar de plano depois?
            </p>
            <p className="text-sm text-muted-foreground">
              Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento.
            </p>
          </div>
          
          <div>
            <p className="font-medium text-sm mb-1">
              Quais formas de pagamento são aceitas?
            </p>
            <p className="text-sm text-muted-foreground">
              Aceitamos todos os principais cartões de crédito: Visa, Mastercard, Elo e American Express.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CancelPage() {
  return (
    <Suspense fallback={
      <div className="container max-w-2xl mx-auto py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
        <p className="text-gray-600">Carregando...</p>
      </div>
    }>
      <CancelContent />
    </Suspense>
  );
}
