'use client';

import { TenantOverview } from '@/components/dashboard/tenant-overview';
import { UsageChart } from '@/components/dashboard/usage-chart';
import { AgentStatusList } from '@/components/dashboard/agent-status-list';
import { IntegrationStatusList } from '@/components/dashboard/integration-status-list';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Visão geral das suas operações com AlquimistaAI
        </p>
      </div>

      {/* KPIs do Tenant */}
      <TenantOverview />

      {/* Gráfico de Uso */}
      <UsageChart />

      {/* Status dos Agentes */}
      <AgentStatusList />

      {/* Status das Integrações */}
      <IntegrationStatusList />
    </div>
  );
}
