'use client';

import { useEffect, useState } from 'react';
import { TenantsTable } from '@/components/company/tenants-table';
import { TenantsFilters } from '@/components/company/tenants-filters';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { listTenants, type Tenant, type ListTenantsParams } from '@/lib/api/internal-client';

export default function TenantsListPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ListTenantsParams>({
    status: 'active',
    limit: 50,
    offset: 0,
    sort_by: 'name',
    sort_order: 'asc',
  });

  useEffect(() => {
    async function loadTenants() {
      try {
        setLoading(true);
        const data = await listTenants(filters);
        setTenants(data.tenants);
        setTotal(data.total);
      } catch (error) {
        console.error('Erro ao carregar tenants:', error);
      } finally {
        setLoading(false);
      }
    }

    loadTenants();
  }, [filters]);

  const handleFilterChange = (newFilters: Partial<ListTenantsParams>) => {
    setFilters(prev => ({ ...prev, ...newFilters, offset: 0 }));
  };

  const handlePageChange = (newOffset: number) => {
    setFilters(prev => ({ ...prev, offset: newOffset }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground mt-2">
            Gerenciar todos os clientes da plataforma
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Tenant
        </Button>
      </div>

      <TenantsFilters 
        filters={filters} 
        onFilterChange={handleFilterChange} 
      />

      <TenantsTable
        tenants={tenants}
        total={total}
        loading={loading}
        filters={filters}
        onPageChange={handlePageChange}
        onSortChange={(sortBy, sortOrder) => {
          setFilters(prev => ({ ...prev, sort_by: sortBy, sort_order: sortOrder }));
        }}
      />
    </div>
  );
}
