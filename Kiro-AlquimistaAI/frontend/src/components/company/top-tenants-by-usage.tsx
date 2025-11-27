'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

interface TopTenant {
  tenant_id: string;
  tenant_name: string;
  total_requests: number;
  success_rate: number;
}

interface TopTenantsByUsageProps {
  tenants: TopTenant[];
}

export function TopTenantsByUsage({ tenants }: TopTenantsByUsageProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Tenants por Uso</CardTitle>
        <CardDescription>
          Clientes com maior volume de requisições
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tenants.slice(0, 5).map((tenant, index) => (
            <Link
              key={tenant.tenant_id}
              href={`${ROUTES.COMPANY_TENANTS}/${tenant.tenant_id}`}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-bold">
                  {index + 1}
                </div>
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{tenant.tenant_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {tenant.total_requests.toLocaleString()} requisições
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant={tenant.success_rate >= 95 ? 'default' : 'secondary'}
                  className="flex items-center space-x-1"
                >
                  <TrendingUp className="h-3 w-3" />
                  <span>{tenant.success_rate.toFixed(1)}%</span>
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
