'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Users, Activity, TrendingUp } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  segment: string;
  deployed_count: number;
  total_requests: number;
  success_rate: number;
}

interface AgentsGridProps {
  agents: Agent[];
}

export function AgentsGrid({ agents }: AgentsGridProps) {
  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'Vendas':
        return 'bg-purple-500 text-white';
      case 'Atendimento':
        return 'bg-green-500 text-white';
      case 'Marketing':
        return 'bg-blue-500 text-white';
      case 'Suporte':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {agents.map((agent) => (
        <Card key={agent.id} className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Bot className="h-8 w-8 text-primary" />
              <Badge className={getSegmentColor(agent.segment)}>
                {agent.segment}
              </Badge>
            </div>
            <CardTitle className="text-lg mt-2">{agent.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Tenants</span>
              </div>
              <span className="font-medium">{agent.deployed_count}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Activity className="h-4 w-4" />
                <span>Requisições</span>
              </div>
              <span className="font-medium">{agent.total_requests.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>Taxa de Sucesso</span>
              </div>
              <span className="font-medium text-green-600">{agent.success_rate.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
