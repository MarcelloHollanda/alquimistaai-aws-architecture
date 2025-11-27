'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getTenantAgents, type TenantAgent } from '@/lib/api/tenant-client';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Bot, TrendingUp, Clock, Eye } from 'lucide-react';

export default function AgentsPage() {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agentes</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie seus agentes AlquimistaAI
          </p>
        </div>
        <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Agentes Ativos</SelectItem>
            <SelectItem value="inactive">Agentes Inativos</SelectItem>
            <SelectItem value="all">Todos os Agentes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="border-destructive">
          <CardContent className="flex items-center space-x-2 pt-6">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : agents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum agente encontrado</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {statusFilter === 'active' 
                ? 'Você não possui agentes ativos no momento.'
                : statusFilter === 'inactive'
                ? 'Você não possui agentes inativos.'
                : 'Você ainda não possui agentes configurados.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Bot className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <CardDescription>{agent.segment}</CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`${getStatusColor(agent.status)} text-white border-none`}
                  >
                    {getStatusLabel(agent.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Requisições (30d)</p>
                    <p className="text-2xl font-bold">
                      {agent.usage_last_30_days.total_requests.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Taxa de Sucesso</p>
                    <p className="text-2xl font-bold text-green-600">
                      {agent.usage_last_30_days.success_rate.toFixed(1)}%
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{agent.usage_last_30_days.avg_response_time_ms}ms tempo médio</span>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2">
                    Ativado em {new Date(agent.activated_at).toLocaleDateString('pt-BR')}
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
