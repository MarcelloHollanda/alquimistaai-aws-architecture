'use client';

import { useEffect, useState } from 'react';
import { BillingOverview } from '@/components/company/billing-overview';
import { getBillingOverview, type BillingOverview as BillingData } from '@/lib/api/internal-client';

export default function CompanyBillingPage() {
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBillingData() {
      try {
        setLoading(true);
        const data = await getBillingOverview('30d');
        setBillingData(data);
      } catch (err) {
        console.error('Erro ao carregar dados financeiros:', err);
        setError('Erro ao carregar dados financeiros');
      } finally {
        setLoading(false);
      }
    }

    loadBillingData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados financeiros...</p>
        </div>
      </div>
    );
  }

  if (error || !billingData) {
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
        <h1 className="text-3xl font-bold tracking-tight">Visão Financeira</h1>
        <p className="text-muted-foreground mt-2">
          Métricas de receita, MRR, ARR e análise por plano e segmento
        </p>
      </div>

      <BillingOverview data={billingData} />
    </div>
  );
}
