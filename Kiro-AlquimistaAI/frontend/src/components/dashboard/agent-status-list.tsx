'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getTenantAgents, type TenantAgent } from '@/lib/api/tenant-client';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Bot, TrendingUp, Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function AgentStatusList() {
  const [agents, setAgents] = useState<TenantAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');

  useEffect(() => {
    async function loadAgents() {
      try {
        setLoading(true);
        const data = await getTenantAgents(statusFilter);
        setAgents(data);
        setError(null);
      } catch (err: any) {
        console.error('Erro ao carregar agentes:', err);
        setError(err.message || 'Erro ao carregar agentes');
      } finally {
        setLoading(false);
      }
    }

    loadAgents();
  }, [statusFilter]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="flex items-center space-x-2 pt-6">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">
            {error}
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-gray-500';
      case 'suspended':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'inactive':
        return 'Inativo';
      case 'suspended':
        return 'Suspenso';
      default:
        return status;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Status dos Agentes</CardTitle>
            <CardDescription>
              {agents.length} agente{agents.length !== 1 ? 's' : ''} encontrado{agents.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {agents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum agente encontrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Bot className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold">{agent.name}</h4>
                      <Badge 
                        variant="outline" 
                        className={`${getStatusColor(agent.status)} text-white border-none text-xs`}
                      >
                        {getStatusLabel(agent.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{agent.segment}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <div className="text-right">
                      <p className="font-medium">{agent.usage_last_30_days.total_requests.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">requisições</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <p className="font-medium text-green-600">
                        {agent.usage_last_30_days.success_rate.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">sucesso</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div className="text-right">
                      <p className="font-medium">{agent.usage_last_30_days.avg_response_time_ms}ms</p>
                      <p className="text-xs text-muted-foreground">tempo médio</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
