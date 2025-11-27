'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Bot, Activity, TrendingUp, DollarSign } from 'lucide-react';
import type { UsageOverview, BillingOverview } from '@/lib/api/internal-client';

interface GlobalKPIsProps {
  usageData: UsageOverview;
  billingData: BillingOverview;
}

export function GlobalKPIs({ usageData, billingData }: GlobalKPIsProps) {
  const kpis = [
    {
      title: 'Tenants Ativos',
      value: usageData.global_stats.active_tenants,
      icon: Users,
      trend: '+3',
      trendLabel: 'vs. mês anterior',
      color: 'text-blue-500',
    },
    {
      title: 'Agentes Deployados',
      value: usageData.global_stats.total_agents_deployed,
      icon: Bot,
      trend: '+12',
      trendLabel: 'novos este mês',
      color: 'text-purple-500',
    },
    {
      title: 'Requisições (30d)',
      value: usageData.global_stats.total_requests.toLocaleString(),
      icon: Activity,
      trend: '+8%',
      trendLabel: 'vs. período anterior',
      color: 'text-green-500',
    },
    {
      title: 'Taxa de Sucesso',
      value: `${usageData.global_stats.global_success_rate.toFixed(1)}%`,
      icon: TrendingUp,
      trend: '+0.3%',
      trendLabel: 'vs. período anterior',
      color: 'text-emerald-500',
    },
    {
      title: 'MRR Total',
      value: `R$ ${(billingData.financial_summary.total_mrr / 1000).toFixed(1)}k`,
      icon: DollarSign,
      trend: `+R$ ${(billingData.financial_summary.new_mrr_this_period / 1000).toFixed(1)}k`,
      trendLabel: 'novo MRR',
      color: 'text-yellow-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {kpis.map((kpi) => (
        <Card key={kpi.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {kpi.title}
            </CardTitle>
            <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600 font-medium">{kpi.trend}</span>{' '}
              {kpi.trendLabel}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
