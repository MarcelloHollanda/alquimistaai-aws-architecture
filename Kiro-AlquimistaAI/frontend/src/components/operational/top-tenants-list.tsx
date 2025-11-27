'use client';

import { useEffect, useState } from 'react';
import { useOperationalClient } from '@/hooks/use-operational-client';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Building, TrendingUp } from 'lucide-react';

interface TopTenant {
  id: string;
  name: string;
  total_requests: number;
  active_agents: number;
  mrr_estimate: number;
}

export function TopTenantsList() {
  const { getInternalTenants } = useOperationalClient();
  const [tenants, setTenants] = useState<TopTenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTopTenants = async () => {
      try {
        const data = await getInternalTenants({
          status: 'active',
          limit: 10,
          sort_by: 'mrr_estimate',
          sort_order: 'desc'
        });
        setTenants(data.tenants || []);
      } catch (error) {
        console.error('Error loading top tenants:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTopTenants();
  }, [getInternalTenants]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="text-center py-8">
        <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Nenhum tenant encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tenants.map((tenant, index) => (
        <div key={tenant.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-blue-600">
                #{index + 1}
              </span>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {tenant.name}
              </h4>
            </div>
            <div className="flex items-center space-x-3 text-xs text-gray-500">
              <span>{tenant.active_agents} agentes</span>
              <span>•</span>
              <span>{tenant.total_requests.toLocaleString('pt-BR')} requisições</span>
            </div>
          </div>
          
          <div className="flex-shrink-0 text-right">
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              <TrendingUp className="h-3 w-3 mr-1" />
              R$ {tenant.mrr_estimate.toFixed(2)}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
