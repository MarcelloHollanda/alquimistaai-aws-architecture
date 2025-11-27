'use client';

import { useEffect, useState } from 'react';
import { AgentsGrid } from '@/components/company/agents-grid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Users, Activity } from 'lucide-react';

// Mock data - será substituído pela API real
const mockAgentsData = Array.from({ length: 32 }, (_, i) => ({
  id: `agent-${i + 1}`,
  name: `Agente ${i + 1}`,
  segment: ['Vendas', 'Atendimento', 'Marketing', 'Suporte'][i % 4],
  deployed_count: Math.floor(Math.random() * 50) + 1,
  total_requests: Math.floor(Math.random() * 100000) + 1000,
  success_rate: 95 + Math.random() * 5,
}));

export default function CompanyAgentsPage() {
  const [agents, setAgents] = useState(mockAgentsData);
  const [loading, setLoading] = useState(false);

  const totalDeployments = agents.reduce((sum, agent) => sum + agent.deployed_count, 0);
  const totalRequests = agents.reduce((sum, agent) => sum + agent.total_requests, 0);
  const avgSuccessRate = agents.reduce((sum, agent) => sum + agent.success_rate, 0) / agents.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Visão de Agentes</h1>
        <p className="text-muted-foreground mt-2">
          Grid completo dos 32 agentes AlquimistaAI e suas métricas
        </p>
      </div>

      {/* KPIs dos Agentes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Deployments</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeployments}</div>
            <p className="text-xs text-muted-foreground">
              Agentes ativos em todos os tenants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Requisições</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Requisições processadas (30d)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso Média</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSuccessRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Média de todos os agentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid de Agentes */}
      <AgentsGrid agents={agents} />
    </div>
  );
}
