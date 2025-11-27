'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TenantDetailView } from '@/components/company/tenant-detail-view';
import { getTenantDetail, type TenantDetail } from '@/lib/api/internal-client';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ROUTES } from '@/lib/constants';

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;
  
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTenantDetail() {
      try {
        setLoading(true);
        const data = await getTenantDetail(tenantId);
        setTenant(data);
      } catch (err) {
        console.error('Erro ao carregar detalhes do tenant:', err);
        setError('Erro ao carregar detalhes do tenant');
      } finally {
        setLoading(false);
      }
    }

    if (tenantId) {
      loadTenantDetail();
    }
  }, [tenantId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando detalhes do tenant...</p>
        </div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Tenant não encontrado'}</p>
          <Button onClick={() => router.push(ROUTES.COMPANY_TENANTS)}>
            Voltar para lista de tenants
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(ROUTES.COMPANY_TENANTS)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      <TenantDetailView tenant={tenant} />
    </div>
  );
}
