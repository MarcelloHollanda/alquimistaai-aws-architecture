'use client';

/**
 * Exemplos de uso dos componentes compartilhados
 * Este arquivo serve como referência e pode ser removido em produção
 */

import { 
  MetricsCard, 
  UsageChart, 
  StatusBadge,
  DataTable,
  Column,
  LineChart,
  BarChart,
  DonutChart
} from '@/components/shared';
import { Users, Activity, TrendingUp, Server } from 'lucide-react';

// ============================================
// Exemplo 1: MetricsCard
// ============================================

export function MetricsCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <MetricsCard
        title="Tenants Ativos"
        value={47}
        change={3}
        trend="up"
        icon={<Users className="h-4 w-4" />}
        description="Total de clientes ativos"
      />
      
      <MetricsCard
        title="Requisições (24h)"
        value={45230}
        change={8}
        trend="up"
        icon={<Activity className="h-4 w-4" />}
      />
      
      <MetricsCard
        title="Taxa de Sucesso"
        value="99.2"
        suffix="%"
        change={0.3}
        trend="up"
        icon={<TrendingUp className="h-4 w-4" />}
      />
      
      <MetricsCard
        title="MRR Total"
        value="142.5k"
        prefix="R$ "
        change={5.8}
        trend="up"
        icon={<Server className="h-4 w-4" />}
      />
    </div>
  );
}

// ============================================
// Exemplo 2: UsageChart
// ============================================

export function UsageChartExample() {
  const data = [
    { name: 'Jan', requests: 4000, errors: 240, success: 3760 },
    { name: 'Fev', requests: 3000, errors: 139, success: 2861 },
    { name: 'Mar', requests: 2000, errors: 980, success: 1020 },
    { name: 'Abr', requests: 2780, errors: 390, success: 2390 },
    { name: 'Mai', requests: 1890, errors: 480, success: 1410 },
    { name: 'Jun', requests: 2390, errors: 380, success: 2010 },
  ];

  return (
    <div className="space-y-6">
      <UsageChart
        type="line"
        data={data}
        title="Requisições Mensais"
        description="Total de requisições, erros e sucessos por mês"
        dataKeys={['requests', 'errors', 'success']}
        formatYAxis={(value) => value.toLocaleString('pt-BR')}
      />
      
      <UsageChart
        type="bar"
        data={data}
        title="Comparação Mensal"
        dataKeys={['requests', 'errors']}
      />
      
      <UsageChart
        type="area"
        data={data}
        title="Tendência de Sucesso"
        dataKeys={['success']}
      />
    </div>
  );
}

// ============================================
// Exemplo 3: StatusBadge
// ============================================

export function StatusBadgeExample() {
  return (
    <div className="flex flex-wrap gap-2">
      <StatusBadge status="active" />
      <StatusBadge status="inactive" />
      <StatusBadge status="pending" />
      <StatusBadge status="error" />
      <StatusBadge status="success" />
      <StatusBadge status="warning" />
      <StatusBadge status="suspended" />
      <StatusBadge status="running" />
      <StatusBadge status="completed" />
      <StatusBadge status="failed" />
    </div>
  );
}

// ============================================
// Exemplo 4: DataTable
// ============================================

interface Tenant {
  id: string;
  name: string;
  cnpj: string;
  status: string;
  plan: string;
  mrr: number;
  agents: number;
  requests: number;
}

export function DataTableExample() {
  const tenants: Tenant[] = [
    {
      id: '1',
      name: 'Empresa A',
      cnpj: '12.345.678/0001-90',
      status: 'active',
      plan: 'Professional',
      mrr: 2990,
      agents: 5,
      requests: 12450,
    },
    {
      id: '2',
      name: 'Empresa B',
      cnpj: '98.765.432/0001-10',
      status: 'active',
      plan: 'Enterprise',
      mrr: 9990,
      agents: 15,
      requests: 45230,
    },
    {
      id: '3',
      name: 'Empresa C',
      cnpj: '11.222.333/0001-44',
      status: 'inactive',
      plan: 'Starter',
      mrr: 990,
      agents: 2,
      requests: 3200,
    },
  ];

  const columns: Column<Tenant>[] = [
    {
      key: 'name',
      label: 'Nome',
      sortable: true,
      filterable: true,
    },
    {
      key: 'cnpj',
      label: 'CNPJ',
      filterable: true,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: 'plan',
      label: 'Plano',
      sortable: true,
      filterable: true,
    },
    {
      key: 'mrr',
      label: 'MRR',
      sortable: true,
      render: (value) => `R$ ${value.toLocaleString('pt-BR')}`,
    },
    {
      key: 'agents',
      label: 'Agentes',
      sortable: true,
    },
    {
      key: 'requests',
      label: 'Requisições',
      sortable: true,
      render: (value) => value.toLocaleString('pt-BR'),
    },
  ];

  return (
    <DataTable
      data={tenants}
      columns={columns}
      sortable
      filterable
      striped
      pagination={{
        total: 100,
        pageSize: 20,
        currentPage: 1,
        onPageChange: (page) => console.log('Page:', page),
      }}
    />
  );
}

// ============================================
// Exemplo 5: LineChart
// ============================================

export function LineChartExample() {
  const data = [
    { date: '01/01', requests: 4000, errors: 240 },
    { date: '02/01', requests: 3000, errors: 139 },
    { date: '03/01', requests: 2000, errors: 980 },
    { date: '04/01', requests: 2780, errors: 390 },
    { date: '05/01', requests: 1890, errors: 480 },
    { date: '06/01', requests: 2390, errors: 380 },
    { date: '07/01', requests: 3490, errors: 430 },
  ];

  return (
    <LineChart
      data={data}
      title="Tendência Semanal"
      description="Requisições e erros nos últimos 7 dias"
      dataKeys={['requests', 'errors']}
      xAxisKey="date"
      curved
      showDots
      formatYAxis={(value) => value.toLocaleString('pt-BR')}
      formatTooltip={(value) => value.toLocaleString('pt-BR')}
    />
  );
}

// ============================================
// Exemplo 6: BarChart
// ============================================

export function BarChartExample() {
  const data = [
    { agent: 'SDR', requests: 4000 },
    { agent: 'Atendimento', requests: 3000 },
    { agent: 'Agendamento', requests: 2000 },
    { agent: 'Follow-up', requests: 2780 },
    { agent: 'Relatórios', requests: 1890 },
  ];

  return (
    <BarChart
      data={data}
      title="Uso por Agente"
      description="Total de requisições por agente"
      dataKeys={['requests']}
      xAxisKey="agent"
      formatYAxis={(value) => value.toLocaleString('pt-BR')}
    />
  );
}

// ============================================
// Exemplo 7: DonutChart
// ============================================

export function DonutChartExample() {
  const data = [
    { name: 'Starter', value: 30 },
    { name: 'Professional', value: 50 },
    { name: 'Enterprise', value: 20 },
  ];

  return (
    <DonutChart
      data={data}
      title="Distribuição por Plano"
      description="Percentual de tenants por plano"
      centerLabel="Total"
      centerValue={100}
      formatValue={(value) => `${value} tenants`}
    />
  );
}

// ============================================
// Exemplo Completo: Dashboard
// ============================================

export function CompleteDashboardExample() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Dashboard Exemplo</h1>
      
      {/* Métricas */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Métricas Principais</h2>
        <MetricsCardExample />
      </section>
      
      {/* Gráficos */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineChartExample />
        <BarChartExample />
      </section>
      
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutChartExample />
        <div>
          <h3 className="text-lg font-semibold mb-4">Status</h3>
          <StatusBadgeExample />
        </div>
      </section>
      
      {/* Tabela */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Lista de Tenants</h2>
        <DataTableExample />
      </section>
    </div>
  );
}
