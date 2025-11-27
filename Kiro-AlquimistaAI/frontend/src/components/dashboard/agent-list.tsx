'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Grid, List, Power, Settings } from 'lucide-react';
import { SUBNUCLEO_LABELS } from '@/lib/constants';
import type { Agent } from '@/types';

interface AgentListProps {
  agents: Agent[];
  onToggle: (agentId: string) => void;
  onConfigure: (agentId: string) => void;
  groupBy?: 'subnucleo' | 'status';
}

export function AgentList({
  agents,
  onToggle,
  onConfigure,
  groupBy = 'subnucleo',
}: AgentListProps) {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedSubnucleo, setSelectedSubnucleo] = useState<string | null>(null);

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(search.toLowerCase()) ||
      agent.description.toLowerCase().includes(search.toLowerCase());
    const matchesSubnucleo = !selectedSubnucleo || agent.subnucleo === selectedSubnucleo;
    return matchesSearch && matchesSubnucleo;
  });

  const groupedAgents = filteredAgents.reduce((acc, agent) => {
    const key = groupBy === 'subnucleo' ? (agent.subnucleo || 'outros') : (agent.isActive ? 'active' : 'inactive');
    if (!acc[key]) acc[key] = [];
    acc[key].push(agent);
    return acc;
  }, {} as Record<string, Agent[]>);

  return (
    <div className="space-y-6">
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
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Subnúcleo filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedSubnucleo === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedSubnucleo(null)}
        >
          Todos
        </Button>
        {Object.entries(SUBNUCLEO_LABELS).map(([key, label]) => (
          <Button
            key={key}
            variant={selectedSubnucleo === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedSubnucleo(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Agent groups */}
      {Object.entries(groupedAgents).map(([group, groupAgents]) => (
        <div key={group}>
          <h3 className="text-lg font-semibold mb-4">
            {groupBy === 'subnucleo' 
              ? SUBNUCLEO_LABELS[group as keyof typeof SUBNUCLEO_LABELS]
              : group === 'active' ? 'Ativos' : 'Inativos'
            }
            <span className="text-muted-foreground ml-2">({groupAgents.length})</span>
          </h3>
          
          <div className={viewMode === 'grid' 
            ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' 
            : 'space-y-2'
          }>
            {groupAgents.map(agent => (
              <Card key={agent.id} className={viewMode === 'list' ? 'flex items-center' : ''}>
                <CardHeader className={viewMode === 'list' ? 'flex-1 py-4' : ''}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{agent.name}</CardTitle>
                      {viewMode === 'grid' && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {agent.description}
                        </p>
                      )}
                    </div>
                    <Badge variant={agent.isActive ? 'default' : 'secondary'}>
                      {agent.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className={viewMode === 'list' ? 'py-4' : ''}>
                  <div className="flex gap-2">
                    <Button
                      variant={agent.isActive ? 'destructive' : 'default'}
                      size="sm"
                      onClick={() => onToggle(agent.id)}
                    >
                      <Power className="h-4 w-4 mr-1" />
                      {agent.isActive ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onConfigure(agent.id)}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Configurar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {filteredAgents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum agente encontrado</p>
        </div>
      )}
    </div>
  );
}
