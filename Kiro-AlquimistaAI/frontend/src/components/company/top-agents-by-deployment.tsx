'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Users } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

interface TopAgent {
  agent_id: string;
  agent_name: string;
  total_requests: number;
  deployed_count: number;
}

interface TopAgentsByDeploymentProps {
  agents: TopAgent[];
}

export function TopAgentsByDeployment({ agents }: TopAgentsByDeploymentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Agentes por Deployment</CardTitle>
        <CardDescription>
          Agentes mais utilizados pelos clientes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {agents.slice(0, 5).map((agent, index) => (
            <Link
              key={agent.agent_id}
              href={ROUTES.COMPANY_AGENTS}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold">
                  {index + 1}
                </div>
                <div className="flex items-center space-x-2">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{agent.agent_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {agent.total_requests.toLocaleString()} requisições
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant="outline"
                  className="flex items-center space-x-1"
                >
                  <Users className="h-3 w-3" />
                  <span>{agent.deployed_count} tenants</span>
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
