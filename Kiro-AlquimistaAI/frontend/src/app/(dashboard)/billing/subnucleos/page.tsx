'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePlansStore } from '@/stores/plans-store';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Check, X } from 'lucide-react';

export default function SubnucleosPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const {
    subnucleos,
    selectedPlanId,
    selectedSubnucleos,
    selectedAgents,
    billingCycle,
    isLoadingSubnucleos,
    isUpdatingSubscription,
    setSubnucleos,
    toggleSubnucleo,
    toggleAgent,
    setLoadingSubnucleos,
    setUpdatingSubscription,
    getSelectedPlan,
    getSelectedSubnucleos,
    getTotalPrice,
    canSelectMoreSubnucleos,
    getSelectedAgentsCount
  } = usePlansStore();

  const selectedPlan = getSelectedPlan();

  useEffect(() => {
    if (!selectedPlanId) {
      router.push('/billing/plans');
      return;
    }
    fetchSubnucleos();
  }, [selectedPlanId]);

  const fetchSubnucleos = async () => {
    setLoadingSubnucleos(true);
    try {
      const response = await fetch('/api/billing/subnucleos');
      if (!response.ok) {
        throw new Error('Failed to fetch subnucleos');
      }
      const data = await response.json();
      setSubnucleos(data.subnucleos);
    } catch (error) {
      console.error('Error fetching subnucleos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os SubNúcleos. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoadingSubnucleos(false);
    }
  };

  const handleConfirmSelection = async () => {
    if (selectedSubnucleos.length === 0) {
      toast({
        title: 'Seleção obrigatória',
        description: 'Selecione pelo menos um SubNúcleo para continuar.',
        variant: 'destructive'
      });
      return;
    }

    setUpdatingSubscription(true);
    try {
      const response = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planId: selectedPlanId,
          billingCycle,
          selectedSubnucleos,
          selectedAgents
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update subscription');
      }

      const result = await response.json();
      
      toast({
        title: 'Sucesso!',
        description: 'Sua assinatura foi atualizada com sucesso.',
        variant: 'default'
      });

      router.push('/billing/success');
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar assinatura.',
        variant: 'destructive'
      });
    } finally {
      setUpdatingSubscription(false);
    }
  };

  if (!selectedPlan) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p>Nenhum plano selecionado. Redirecionando...</p>
      </div>
    );
  }

  if (isLoadingSubnucleos) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="border rounded-lg p-6">
              <Skeleton className="h-6 w-48 mb-4" />
              <Skeleton className="h-4 w-full mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-36" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/billing/plans')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Planos
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">
          Selecione seus SubNúcleos
        </h1>
        <p className="text-muted-foreground">
          Plano {selectedPlan.displayName}: Selecione até {selectedPlan.maxSubnucleos} SubNúcleo(s)
        </p>
      </div>

      {/* Alert de Limite */}
      {!canSelectMoreSubnucleos() && (
        <Alert className="mb-6">
          <AlertDescription>
            Você atingiu o limite de {selectedPlan.maxSubnucleos} SubNúcleo(s) do seu plano.
            Desmarque um SubNúcleo para selecionar outro.
          </AlertDescription>
        </Alert>
      )}

      {/* Grid de SubNúcleos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {subnucleos.map((subnucleo) => {
          const isSelected = selectedSubnucleos.includes(subnucleo.id);
          const canSelect = canSelectMoreSubnucleos() || isSelected;
          
          return (
            <div
              key={subnucleo.id}
              className={`border rounded-lg p-6 transition-all ${
                isSelected 
                  ? 'border-primary bg-primary/5 shadow-md' 
                  : canSelect 
                    ? 'hover:border-primary/50 hover:shadow-sm cursor-pointer' 
                    : 'opacity-50 cursor-not-allowed'
              }`}
              onClick={() => canSelect && toggleSubnucleo(subnucleo.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">
                    {subnucleo.displayName}
                  </h3>
                  <Badge variant="secondary" className="mb-2">
                    {subnucleo.category}
                  </Badge>
                </div>
                
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  isSelected 
                    ? 'bg-primary border-primary' 
                    : 'border-gray-300'
                }`}>
                  {isSelected && <Check className="h-4 w-4 text-white" />}
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                {subnucleo.description}
              </p>
              
              {/* Lista de Agentes */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Agentes inclusos ({subnucleo.agents.length}):
                </p>
                <div className="space-y-1">
                  {subnucleo.agents.slice(0, 3).map((agent) => (
                    <div key={agent.id} className="flex items-center text-sm">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="text-muted-foreground">{agent.displayName}</span>
                      {agent.isRequired && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Obrigatório
                        </Badge>
                      )}
                    </div>
                  ))}
                  {subnucleo.agents.length > 3 && (
                    <p className="text-xs text-muted-foreground ml-6">
                      + {subnucleo.agents.length - 3} agentes adicionais
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumo e Ações */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground">
              SubNúcleos selecionados: {selectedSubnucleos.length} de {selectedPlan.maxSubnucleos}
            </p>
            <p className="text-sm text-muted-foreground">
              Agentes inclusos: {getSelectedAgentsCount()}
            </p>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">
              R$ {getTotalPrice().toFixed(2)}
              <span className="text-sm font-normal text-muted-foreground">
                /{billingCycle === 'yearly' ? 'ano' : 'mês'}
              </span>
            </p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/billing/plans')}
            className="flex-1"
          >
            Voltar
          </Button>
          
          <Button
            onClick={handleConfirmSelection}
            disabled={selectedSubnucleos.length === 0 || isUpdatingSubscription}
            className="flex-1"
          >
            {isUpdatingSubscription ? 'Processando...' : 'Confirmar Seleção'}
          </Button>
        </div>
      </div>
    </div>
  );
}
