'use client';

import { useEffect, useState } from 'react';
import { GlobalKPIs } from '@/components/company/global-kpis';
import { UsageTrendChart } from '@/components/company/usage-trend-chart';
import { RevenueTrendChart } from '@/components/company/revenue-trend-chart';
import { TopTenantsByUsage } from '@/components/company/top-tenants-by-usage';
import { TopAgentsByDeployment } from '@/components/company/top-agents-by-deployment';
import { RecentIncidents } from '@/components/company/recent-incidents';
import { getUsageOverview, getBillingOverview } from '@/lib/api/internal-client';
import type { UsageOverview, BillingOverview } from '@/lib/api/internal-client';

export default function CompanyOverviewPage() {
  const [usageData, setUsageData] = useState<UsageOverview | null>(null);
  const [billingData, setBillingData] = useState<BillingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [usage, billing] = await Promise.all([
          getUsageOverview('30d'),
          getBillingOverview('30d'),
        ]);
        setUsageData(usage);
        setBillingData(billing);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError('Erro ao carregar dados do painel operacional');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando painel operacional...</p>
        </div>
      </div>
    );
  }

  if (error || !usageData || !billingData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Erro ao carregar dados'}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="text-primary hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Painel Operacional AlquimistaAI</h1>
        <p className="text-muted-foreground mt-2">
          Visão geral de todos os clientes, métricas e operações da plataforma
        </p>
      </div>

      {/* KPIs Globais */}
      <GlobalKPIs usageData={usageData} billingData={billingData} />

      {/* Gráficos de Tendência */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UsageTrendChart data={usageData.daily_trends} />
        <RevenueTrendChart data={billingData.revenue_trend} />
      </div>

      {/* Top Tenants e Agentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopTenantsByUsage tenants={usageData.top_tenants_by_usage} />
        <TopAgentsByDeployment agents={usageData.top_agents_by_usage} />
      </div>

      {/* Incidentes Recentes */}
      <RecentIncidents />
    </div>
  );
}
