'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getTenantUsage, type TenantUsageResponse } from '@/lib/api/tenant-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function UsageChart() {
  const [usageData, setUsageData] = useState<TenantUsageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    async function loadUsageData() {
      try {
        setLoading(true);
        const data = await getTenantUsage(period);
        setUsageData(data);
        setError(null);
      } catch (err: any) {
        console.error('Erro ao carregar dados de uso:', err);
        setError(err.message || 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    }

    loadUsageData();
  }, [period]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !usageData) {
    return (
      <Card className="border-destructive">
        <CardContent className="flex items-center space-x-2 pt-6">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">
            {error || 'Erro ao carregar dados de uso'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = usageData.daily_data.map(day => ({
    date: new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    requisições: day.total_requests,
    sucesso: day.successful_requests,
    falhas: day.failed_requests,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Uso de Requisições</CardTitle>
            <CardDescription>
              Requisições processadas nos últimos {period === '7d' ? '7 dias' : period === '30d' ? '30 dias' : '90 dias'}
            </CardDescription>
          </div>
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
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
            />
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
        
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{usageData.summary.total_requests.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total de Requisições</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{usageData.summary.success_rate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Taxa de Sucesso</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{usageData.summary.avg_response_time_ms}ms</p>
            <p className="text-xs text-muted-foreground">Tempo Médio</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
