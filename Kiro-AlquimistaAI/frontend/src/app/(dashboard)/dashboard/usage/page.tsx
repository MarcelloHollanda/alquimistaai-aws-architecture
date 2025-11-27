'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getTenantUsage, getTenantAgents, type TenantUsageResponse, type TenantAgent } from '@/lib/api/tenant-client';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function UsagePage() {
  const [usageData, setUsageData] = useState<TenantUsageResponse | null>(null);
  const [agents, setAgents] = useState<TenantAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [period, selectedAgent]);

  async function loadData() {
    try {
      setLoading(true);
      const [usage, agentsList] = await Promise.all([
        getTenantUsage(period, selectedAgent === 'all' ? undefined : selectedAgent),
        agents.length === 0 ? getTenantAgents('all') : Promise.resolve(agents)
      ]);
      setUsageData(usage);
      if (agents.length === 0) {
        setAgents(agentsList);
      }
      setError(null);
    } catch (err: any) {
      console.error('Erro ao carregar dados de uso:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  const getPeriodLabel = (p: string) => {
    switch (p) {
      case '7d': return '7 dias';
      case '30d': return '30 dias';
      case '90d': return '90 dias';
      default: return p;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !usageData) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Uso</h1>
        <Card className="border-destructive">
          <CardContent className="flex items-center space-x-2 pt-6">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">
              {error || 'Erro ao carregar dados de uso'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const trendChartData = usageData.daily_data.map(day => ({
    date: new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    requisições: day.total_requests,
    sucesso: day.successful_requests,
    falhas: day.failed_requests,
  }));

  const agentChartData = usageData.by_agent.map(agent => ({
    name: agent.agent_name,
    requisições: agent.total_requests,
    sucesso: (agent.success_rate / 100) * agent.total_requests,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Uso</h1>
          <p className="text-muted-foreground mt-2">
            Análise detalhada do uso dos seus agentes
          </p>
        </div>
        <div className="flex space-x-2">
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Agentes</SelectItem>
              {agents.map(agent => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Requisições
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageData.summary.total_requests.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Últimos {getPeriodLabel(period)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Sucesso
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {usageData.summary.success_rate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {usageData.summary.successful_requests.toLocaleString()} requisições bem-sucedidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tempo Médio de Resposta
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageData.summary.avg_response_time_ms}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Média do período
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Tendências */}
      <Card>
        <CardHeader>
          <CardTitle>Tendência de Uso</CardTitle>
          <CardDescription>
            Requisições processadas ao longo do tempo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={trendChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="requisições" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="Total"
              />
              <Line 
                type="monotone" 
                dataKey="sucesso" 
                stroke="#82ca9d" 
                strokeWidth={2}
                name="Sucesso"
              />
              <Line 
                type="monotone" 
                dataKey="falhas" 
                stroke="#ff6b6b" 
                strokeWidth={2}
                name="Falhas"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico por Agente */}
      {selectedAgent === 'all' && usageData.by_agent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uso por Agente</CardTitle>
            <CardDescription>
              Comparação de requisições entre agentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={agentChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={100} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="requisições" fill="#8884d8" name="Total" />
                <Bar dataKey="sucesso" fill="#82ca9d" name="Sucesso" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
