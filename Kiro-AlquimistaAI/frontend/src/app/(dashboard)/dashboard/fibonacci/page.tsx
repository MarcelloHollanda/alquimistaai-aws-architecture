'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getTenantAgents, type TenantAgent } from '@/lib/api/tenant-client';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Workflow, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

export default function FibonacciPage() {
  const [subnucleos, setSubnucleos] = useState<TenantAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSubnucleos() {
      try {
        setLoading(true);
        // Buscar agentes que são subnúcleos Fibonacci
        const allAgents = await getTenantAgents('all');
        // Filtrar apenas subnúcleos (assumindo que têm um padrão no nome ou segment)
        const fibonacciSubnucleos = allAgents.filter(agent => 
          agent.segment.toLowerCase().includes('fibonacci') || 
          agent.name.toLowerCase().includes('subnúcleo')
        );
        setSubnucleos(fibonacciSubnucleos);
        setError(null);
      } catch (err: any) {
        console.error('Erro ao carregar subnúcleos:', err);
        setError(err.message || 'Erro ao carregar subnúcleos');
      } finally {
        setLoading(false);
      }
    }

    loadSubnucleos();
  }, []);

  const getStatusIcon = (status: string) => {
    return status === 'active' 
      ? <CheckCircle className="h-5 w-5 text-green-500" />
      : <XCircle className="h-5 w-5 text-gray-500" />;
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-500' : 'bg-gray-500';
  };

  const getStatusLabel = (status: string) => {
    return status === 'active' ? 'Ativo' : 'Inativo';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fibonacci</h1>
        <p className="text-muted-foreground mt-2">
          Status dos SubNúcleos Fibonacci contratados
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
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
      ) : subnucleos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Workflow className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum SubNúcleo Fibonacci contratado</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Entre em contato com nossa equipe comercial para contratar SubNúcleos Fibonacci
              e potencializar sua operação.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Resumo Geral */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  SubNúcleos Ativos
                </CardTitle>
                <Workflow className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {subnucleos.filter(s => s.status === 'active').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  de {subnucleos.length} contratados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Requisições Totais (30d)
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {subnucleos.reduce((acc, s) => acc + s.usage_last_30_days.total_requests, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Todas as orquestrações
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Taxa de Sucesso Média
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {subnucleos.length > 0
                    ? (subnucleos.reduce((acc, s) => acc + s.usage_last_30_days.success_rate, 0) / subnucleos.length).toFixed(1)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Média geral
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de SubNúcleos */}
          <div className="grid gap-4 md:grid-cols-2">
            {subnucleos.map((subnucleo) => (
              <Card key={subnucleo.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {getStatusIcon(subnucleo.status)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{subnucleo.name}</CardTitle>
                        <CardDescription>{subnucleo.segment}</CardDescription>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`${getStatusColor(subnucleo.status)} text-white border-none`}
                    >
                      {getStatusLabel(subnucleo.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Orquestrações</p>
                      <p className="text-xl font-bold">
                        {subnucleo.usage_last_30_days.total_requests.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Sucesso</p>
                      <p className="text-xl font-bold text-green-600">
                        {subnucleo.usage_last_30_days.success_rate.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Tempo Médio</p>
                      <p className="text-xl font-bold">
                        {subnucleo.usage_last_30_days.avg_response_time_ms}ms
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t text-xs text-muted-foreground">
                    Ativado em {new Date(subnucleo.activated_at).toLocaleDateString('pt-BR')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
