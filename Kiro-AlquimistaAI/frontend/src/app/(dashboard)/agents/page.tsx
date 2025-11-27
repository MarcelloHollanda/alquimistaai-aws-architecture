'use client';

import { useEffect, useState } from 'react';
import { AgentCard } from '@/components/agents/agent-card';
import { AgentConfig } from '@/components/agents/agent-config';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter } from 'lucide-react';
import { useAgentStore } from '@/stores/agent-store';
import { useToast } from '@/hooks/use-toast';
import { SUBNUCLEO_LABELS } from '@/lib/constants';
import type { Agent } from '@/types';

export default function AgentsPage() {
  const { toast } = useToast();
  const { agents, loading, selectedAgent, fetchAgents, toggleAgent, updateConfig, setSelectedAgent } = useAgentStore();
  const [search, setSearch] = useState('');
  const [selectedSubnucleo, setSelectedSubnucleo] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(search.toLowerCase()) ||
      agent.description.toLowerCase().includes(search.toLowerCase());
    const matchesSubnucleo = !selectedSubnucleo || agent.subnucleo === selectedSubnucleo;
    return matchesSearch && matchesSubnucleo;
  });

  const groupedAgents = filteredAgents.reduce((acc, agent) => {
    const subnucleo = agent.subnucleo || 'outros';
    if (!acc[subnucleo]) acc[subnucleo] = [];
    acc[subnucleo].push(agent);
    return acc;
  }, {} as Record<string, Agent[]>);

  const handleToggle = async (agentId: string) => {
    await toggleAgent(agentId);
    const agent = agents.find(a => a.id === agentId);
    toast({
      title: agent?.isActive ? 'Agente desativado' : 'Agente ativado',
      description: `${agent?.name} foi ${agent?.isActive ? 'desativado' : 'ativado'} com sucesso`,
    });
  };

  const handleConfigure = (agent: Agent) => {
    setSelectedAgent(agent);
  };

  const handleSaveConfig = async (config: Record<string, any>) => {
    if (!selectedAgent) return;
    await updateConfig(selectedAgent.id, config);
    toast({
      title: 'Configurações salvas',
      description: 'As configurações foram atualizadas com sucesso',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando agentes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Agentes</h1>
        <p className="text-muted-foreground mt-2">
          Ative, desative e configure seus 32 agentes de IA
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar agentes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* Subnúcleo filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedSubnucleo === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedSubnucleo(null)}
        >
          Todos ({agents.length})
        </Button>
        {Object.entries(SUBNUCLEO_LABELS).map(([key, label]) => {
          const count = agents.filter(a => a.subnucleo === key).length;
          return (
            <Button
              key={key}
              variant={selectedSubnucleo === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSubnucleo(key)}
            >
              {label} ({count})
            </Button>
          );
        })}
      </div>

      {/* Agent groups */}
      {Object.entries(groupedAgents).map(([subnucleo, groupAgents]) => (
        <div key={subnucleo}>
          <h2 className="text-2xl font-bold tracking-tight mb-4">
            {SUBNUCLEO_LABELS[subnucleo as keyof typeof SUBNUCLEO_LABELS]}
            <span className="text-muted-foreground ml-2">({groupAgents.length})</span>
          </h2>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groupAgents.map(agent => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onToggle={() => handleToggle(agent.id)}
                onConfigure={() => handleConfigure(agent)}
              />
            ))}
          </div>
        </div>
      ))}

      {filteredAgents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum agente encontrado</p>
        </div>
      )}

      {/* Config Panel */}
      {selectedAgent && (
        <AgentConfig
          agent={selectedAgent}
          onSave={handleSaveConfig}
          onClose={() => setSelectedAgent(null)}
        />
      )}
    </div>
  );
}
