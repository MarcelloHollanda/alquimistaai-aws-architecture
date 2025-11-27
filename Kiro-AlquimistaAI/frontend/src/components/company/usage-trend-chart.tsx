'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DailyTrend {
  date: string;
  total_requests: number;
  success_rate: number;
  active_tenants: number;
}

interface UsageTrendChartProps {
  data: DailyTrend[];
}

export function UsageTrendChart({ data }: UsageTrendChartProps) {
  // Formatar dados para o gráfico
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    requisições: item.total_requests,
    'taxa de sucesso': item.success_rate,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendência de Uso</CardTitle>
        <CardDescription>
          Requisições e taxa de sucesso nos últimos 30 dias
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              tick={{ fontSize: 12 }}
              domain={[0, 100]}
            />
            <Tooltip />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="requisições" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="taxa de sucesso" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
