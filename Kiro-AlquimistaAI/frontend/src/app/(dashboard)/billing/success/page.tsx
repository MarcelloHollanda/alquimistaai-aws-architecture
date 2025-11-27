'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, ArrowRight, Calendar, CreditCard } from 'lucide-react';
import { formatDate, formatRelativeDate } from '@/utils/billing-formatters';
import confetti from 'canvas-confetti';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Animação de confetti
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: randomInRange(0.1, 0.3),
          y: Math.random() - 0.2,
        },
      });
      
      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: randomInRange(0.7, 0.9),
          y: Math.random() - 0.2,
        },
      });
    }, 250);

    // Simular carregamento
    setTimeout(() => setLoading(false), 1500);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto py-16 space-y-6">
        <div className="text-center space-y-4">
          <Skeleton className="h-16 w-16 rounded-full mx-auto" />
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calcular próxima data de faturamento (30 dias a partir de hoje)
  const nextBillingDate = new Date();
  nextBillingDate.setDate(nextBillingDate.getDate() + 30);

  return (
    <div className="container max-w-2xl mx-auto py-16 space-y-8">
      {/* Ícone de Sucesso */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20">
          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        
        <div>
          <h1 className="text-3xl font-bold">Pagamento Confirmado!</h1>
          <p className="text-muted-foreground mt-2">
            Sua assinatura foi ativada com sucesso
          </p>
        </div>
      </div>

      {/* Detalhes da Assinatura */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Assinatura</CardTitle>
          <CardDescription>
            Informações sobre seu plano contratado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* ID da Sessão */}
          {sessionId && (
            <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
              <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">ID da Transação</p>
                <p className="text-xs text-muted-foreground font-mono break-all">
                  {sessionId}
                </p>
              </div>
            </div>
          )}

          {/* Próximo Faturamento */}
          <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">Próximo Faturamento</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(nextBillingDate)} ({formatRelativeDate(nextBillingDate)})
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Você receberá um e-mail de lembrete 3 dias antes
              </p>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>✓ Acesso imediato a todos os recursos do seu plano</p>
            <p>✓ Fatura enviada para seu e-mail cadastrado</p>
            <p>✓ Suporte prioritário disponível</p>
          </div>
        </CardContent>
      </Card>

      {/* Próximos Passos */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos Passos</CardTitle>
          <CardDescription>
            Comece a usar a plataforma agora mesmo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
              1
            </div>
            <p className="text-sm">Configure seus agentes e SubNúcleos</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
              2
            </div>
            <p className="text-sm">Integre com suas ferramentas favoritas</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
              3
            </div>
            <p className="text-sm">Comece a automatizar seus processos</p>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => router.push('/app/billing/plans')}
        >
          Ver minha assinatura
        </Button>
        
        <Button
          className="flex-1"
          onClick={() => router.push('/app/dashboard')}
        >
          Ir para minha área de trabalho
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Suporte */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          Precisa de ajuda?{' '}
          <a
            href="mailto:suporte@alquimistaai.com"
            className="text-primary hover:underline"
          >
            Entre em contato com nosso suporte
          </a>
        </p>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="container max-w-2xl mx-auto py-16 space-y-6">
        <div className="text-center space-y-4">
          <Skeleton className="h-16 w-16 rounded-full mx-auto" />
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
