import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Power, Settings, TrendingUp } from 'lucide-react';
import type { Agent } from '@/types';

interface AgentCardProps {
  agent: Agent;
  onToggle: () => void;
  onConfigure: () => void;
}

export function AgentCard({ agent, onToggle, onConfigure }: AgentCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{agent.name}</CardTitle>
              {agent.tier === 'enterprise' && (
                <Badge variant="secondary">Premium</Badge>
              )}
            </div>
            <CardDescription>{agent.description}</CardDescription>
          </div>
          <Badge variant={agent.isActive ? 'default' : 'secondary'}>
            {agent.isActive ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mock metrics */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-2xl font-bold">1.2K</div>
            <div className="text-xs text-muted-foreground">Execuções</div>
          </div>
          <div>
            <div className="text-2xl font-bold">98%</div>
            <div className="text-xs text-muted-foreground">Sucesso</div>
          </div>
          <div>
            <div className="text-2xl font-bold flex items-center justify-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span>15%</span>
            </div>
            <div className="text-xs text-muted-foreground">Crescimento</div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={agent.isActive ? 'destructive' : 'default'}
            size="sm"
            className="flex-1"
            onClick={onToggle}
          >
            <Power className="h-4 w-4 mr-1" />
            {agent.isActive ? 'Desativar' : 'Ativar'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onConfigure}
          >
            <Settings className="h-4 w-4 mr-1" />
            Configurar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
