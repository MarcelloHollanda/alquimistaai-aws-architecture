'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RevenueTrend {
  date: string;
  mrr: number;
  new_tenants: number;
  churned_tenants: number;
}

interface RevenueTrendChartProps {
  data: RevenueTrend[];
}

export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  // Formatar dados para o gráfico
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    'MRR (R$)': item.mrr,
    'Novos Tenants': item.new_tenants,
    'Churn': item.churned_tenants,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendência de Receita</CardTitle>
        <CardDescription>
          MRR e movimentação de tenants nos últimos 30 dias
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
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === 'MRR (R$)') {
                  return [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, name];
                }
                return [value, name];
              }}
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="MRR (R$)" 
              stroke="#eab308" 
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="Novos Tenants" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="Churn" 
              stroke="#ef4444" 
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
