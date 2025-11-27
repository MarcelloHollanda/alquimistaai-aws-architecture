'use client';

import { useState } from 'react';
import { ChartWidget } from '@/components/analytics/chart-widget';
import { PeriodSelector } from '@/components/analytics/period-selector';
import { ConversionFunnel } from '@/components/analytics/conversion-funnel';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Mock data
const leadsData = [
  { name: 'Jan', value: 400 },
  { name: 'Fev', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Abr', value: 800 },
  { name: 'Mai', value: 700 },
  { name: 'Jun', value: 900 },
];

const conversionData = [
  { name: 'Jan', value: 24 },
  { name: 'Fev', value: 28 },
  { name: 'Mar', value: 32 },
  { name: 'Abr', value: 35 },
  { name: 'Mai', value: 33 },
  { name: 'Jun', value: 38 },
];

const agentPerformanceData = [
  { name: 'Qualificação', value: 450 },
  { name: 'Follow-up', value: 380 },
  { name: 'Atendimento', value: 320 },
  { name: 'Sentimento', value: 280 },
  { name: 'Relatórios', value: 150 },
];

const funnelStages = [
  { name: 'Leads Capturados', value: 5000, percentage: 100 },
  { name: 'Leads Qualificados', value: 3500, percentage: 70 },
  { name: 'Oportunidades', value: 1750, percentage: 35 },
  { name: 'Propostas Enviadas', value: 875, percentage: 17.5 },
  { name: 'Vendas Fechadas', value: 350, percentage: 7 },
];

export default function AnalyticsPage() {
  const { toast } = useToast();
  const [period, setPeriod] = useState('30d');

  const handleExport = (format: 'pdf' | 'csv') => {
    toast({
      title: 'Exportando dados',
      description: `Gerando arquivo ${format.toUpperCase()}...`,
    });
    
    // TODO: Implement actual export
    setTimeout(() => {
      toast({
        title: 'Exportação concluída',
        description: `Arquivo ${format.toUpperCase()} baixado com sucesso`,
      });
    }, 1500);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Análise detalhada de performance e métricas
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <PeriodSelector selected={period} onChange={setPeriod} />
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Conversion Funnel */}
      <ConversionFunnel stages={funnelStages} />

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <ChartWidget
          type="area"
          data={leadsData}
          title="Leads Processados"
          description="Evolução mensal de leads"
          dataKey="value"
        />
        
        <ChartWidget
          type="line"
          data={conversionData}
          title="Taxa de Conversão"
          description="Percentual de conversão ao longo do tempo"
          dataKey="value"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ChartWidget
          type="bar"
          data={agentPerformanceData}
          title="Performance por Agente"
          description="Execuções por agente no período"
          dataKey="value"
        />
        
        <ChartWidget
          type="pie"
          data={agentPerformanceData}
          title="Distribuição de Uso"
          description="Proporção de uso por agente"
          dataKey="value"
        />
      </div>
    </div>
  );
}
