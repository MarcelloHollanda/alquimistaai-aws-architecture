'use client';

import { useState, useEffect } from 'react';
import { AgentCardBilling } from './agent-card-billing';
import { TrialModal } from './trial-modal';
import { listAgents, Agent } from '@/lib/agents-client';
import { Skeleton } from '@/components/ui/skeleton';

export function AgentsGridBilling() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [trialModalOpen, setTrialModalOpen] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const data = await listAgents();
      setAgents(data);
    } catch (error) {
      console.error('Erro ao carregar agentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestClick = (agent: Agent) => {
    setSelectedAgent(agent);
    setTrialModalOpen(true);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-lg border p-6">
            <Skeleton className="mb-4 h-6 w-3/4" />
            <Skeleton className="mb-2 h-4 w-1/2" />
            <Skeleton className="mb-4 h-20 w-full" />
            <div className="mb-4 flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="mb-4 h-8 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 flex-1" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-gray-600">Nenhum agente disponível no momento.</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          Agentes AlquimistaAI
        </h2>
        <p className="text-gray-600">
          Cada agente custa <strong>R$ 29,90/mês</strong>. Monte seu plano
          escolhendo quantos agentes desejar.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <AgentCardBilling
            key={agent.id}
            agent={agent}
            onTestClick={() => handleTestClick(agent)}
          />
        ))}
      </div>

      {selectedAgent && (
        <TrialModal
          open={trialModalOpen}
          onClose={() => {
            setTrialModalOpen(false);
            setSelectedAgent(null);
          }}
          targetType="agent"
          targetId={selectedAgent.id}
          targetName={selectedAgent.name}
        />
      )}
    </>
  );
}
