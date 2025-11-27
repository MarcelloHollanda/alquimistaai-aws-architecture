'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlansStore } from '@/stores/plans-store';
import { useToast } from '@/hooks/use-toast';

export default function PlansPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const {
    plans,
    billingCycle,
    isLoadingPlans,
    setPlans,
    setBillingCycle,
    setSelectedPlan,
    setLoadingPlans,
    resetSelection
  } = usePlansStore();

  useEffect(() => {
    fetchPlans();
    resetSelection();
  }, []);

  const fetchPlans = async () => {
    setLoadingPlans(true);
    try {
      const response = await fetch('/api/billing/plans');
      if (!response.ok) {
        throw new Error('Failed to fetch plans');
      }
      const data = await response.json();
      setPlans(data.plans);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os planos. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoadingPlans(false);
    }
  };

  const selectPlan = (planId: string) => {
    setSelectedPlan(planId);
    router.push('/billing/subnucleos');
  };

  const getPrice = (plan: any) => {
    if (billingCycle === 'yearly') {
      return {
        price: (plan.priceYearly / 12).toFixed(2),
        originalPrice: plan.priceYearly,
        savings: ((plan.priceMonthly * 12 - plan.priceYearly) / (plan.priceMonthly * 12) * 100).toFixed(0)
      };
    }
    return {
      price: plan.priceMonthly.toFixed(2),
      originalPrice: plan.priceMonthly,
      savings: null
    };
  };

  if (isLoadingPlans) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <Skeleton className="h-8 w-64 mx-auto mb-4" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
        
        <div className="flex justify-center mb-8">
          <Skeleton className="h-10 w-48" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="border rounded-lg p-6">
              <Skeleton className="h-6 w-24 mb-4" />
              <Skeleton className="h-8 w-32 mb-4" />
              <div className="space-y-2 mb-6">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Escolha seu Plano</h1>
        <p className="text-lg text-muted-foreground">
          Selecione o plano ideal para sua empresa e comece a automatizar com IA
        </p>
      </div>
      
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-lg border p-1 bg-muted">
          <button
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'monthly' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setBillingCycle('monthly')}
          >
            Mensal
          </button>
          <button
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'yearly' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setBillingCycle('yearly')}
          >
            Anual
            <Badge variant="secondary" className="ml-2">17% OFF</Badge>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const pricing = getPrice(plan);
          const isPopular = plan.name === 'profissional';
          
          return (
            <div 
              key={plan.id} 
              className={`relative border rounded-lg p-6 hover:shadow-lg transition-shadow ${
                isPopular ? 'border-primary shadow-md' : ''
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Mais Popular
                  </Badge>
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">{plan.displayName}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {plan.description}
                </p>
                
                <div className="mb-4">
                  <div className="flex items-baseline justify-center">
                    <span className="text-3xl font-bold">R$ {pricing.price}</span>
                    <span className="text-sm text-muted-foreground ml-1">/mês</span>
                  </div>
                  
                  {pricing.savings && (
                    <div className="text-sm text-green-600 mt-1">
                      Economize {pricing.savings}% no plano anual
                    </div>
                  )}
                  
                  {billingCycle === 'yearly' && (
                    <div className="text-xs text-muted-foreground mt-1">
                      R$ {pricing.originalPrice.toFixed(2)} cobrado anualmente
                    </div>
                  )}
                </div>
              </div>
              
              <ul className="space-y-3 mb-6 text-sm">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  {plan.maxSubnucleos} SubNúcleo{plan.maxSubnucleos > 1 ? 's' : ''}
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Até {plan.maxAgents} agentes
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  {plan.maxUsers === 999999 ? 'Usuários ilimitados' : `${plan.maxUsers} usuários`}
                </li>
                <li className="flex items-center">
                  <span className={`mr-2 ${plan.includesFibonacci ? 'text-green-500' : 'text-red-500'}`}>
                    {plan.includesFibonacci ? '✓' : '✗'}
                  </span>
                  Fibonacci Orquestrador
                </li>
                
                {plan.features && plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Button 
                onClick={() => selectPlan(plan.id)} 
                className={`w-full ${
                  isPopular 
                    ? 'bg-primary hover:bg-primary/90' 
                    : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                }`}
                size="lg"
              >
                Escolher {plan.displayName}
              </Button>
            </div>
          );
        })}
      </div>
      
      <div className="text-center mt-12 text-sm text-muted-foreground">
        <p className="mb-2">
          Todos os planos incluem suporte técnico e atualizações gratuitas
        </p>
        <p>
          Cancele a qualquer momento • Sem taxas de cancelamento • Dados sempre seus
        </p>
      </div>
    </div>
  );
}
