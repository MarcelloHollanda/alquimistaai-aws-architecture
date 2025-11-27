'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { BillingOverview as BillingData } from '@/lib/api/internal-client';

interface BillingOverviewProps {
  data: BillingData;
}

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export function BillingOverview({ data }: BillingOverviewProps) {
  const { financial_summary, by_plan, by_segment, revenue_trend } = data;

  // Preparar dados para gráficos
  const planChartData = by_plan.map(item => ({
    name: item.plan_name,
    tenants: item.tenant_count,
    mrr: item.total_mrr,
  }));

  const segmentChartData = by_segment.map(item => ({
    name: item.segment,
    value: item.total_mrr,
  }));

  return (
    <div className="space-y-6">
      {/* KPIs Financeiros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {(financial_summary.total_mrr / 1000).toFixed(1)}k
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600 font-medium">
                +R$ {(financial_summary.new_mrr_this_period / 1000).toFixed(1)}k
              </span>{' '}
              novo MRR
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ARR Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {(financial_summary.total_arr / 1000).toFixed(1)}k
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Receita anual recorrente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR Médio</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {financial_summary.avg_mrr_per_tenant.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Por tenant
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn MRR</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {(financial_summary.churned_mrr_this_period / 1000).toFixed(1)}k
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              MRR perdido
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MRR por Plano */}
        <Card>
          <CardHeader>
            <CardTitle>MRR por Plano</CardTitle>
            <CardDescription>
              Distribuição de receita por tipo de plano
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={planChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <Legend />
                <Bar dataKey="mrr" fill="#8b5cf6" name="MRR" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* MRR por Segmento */}
        <Card>
          <CardHeader>
            <CardTitle>MRR por Segmento</CardTitle>
            <CardDescription>
              Distribuição de receita por segmento de mercado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={segmentChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {segmentChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown por Plano */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Plano</CardTitle>
          <CardDescription>
            Número de tenants e MRR por plano
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {by_plan.map((plan, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{plan.plan_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {plan.tenant_count} tenants
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">
                    R$ {plan.total_mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    MRR médio: R$ {(plan.total_mrr / plan.tenant_count).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
