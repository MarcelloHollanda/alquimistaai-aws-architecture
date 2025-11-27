'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTenantMe, type TenantInfo } from '@/lib/api/tenant-client';
import { Building2, Users, Bot, TrendingUp, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function TenantOverview() {
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTenantInfo() {
      try {
        setLoading(true);
        const data = await getTenantMe();
        setTenantInfo(data);
        setError(null);
      } catch (err: any) {
        console.error('Erro ao carregar informações do tenant:', err);
        setError(err.message || 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    }

    loadTenantInfo();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !tenantInfo) {
    return (
      <Card className="border-destructive">
        <CardContent className="flex items-center space-x-2 pt-6">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">
            {error || 'Erro ao carregar informações'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const usagePercentage = (tenantInfo.usage.requests_this_month / tenantInfo.limits.max_requests_per_month) * 100;
  const agentsPercentage = (tenantInfo.usage.active_agents / tenantInfo.limits.max_agents) * 100;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Empresa
          </CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{tenantInfo.name}</div>
          <p className="text-xs text-muted-foreground">
            {tenantInfo.segment}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Agentes Ativos
          </CardTitle>
          <Bot className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {tenantInfo.usage.active_agents} / {tenantInfo.limits.max_agents}
          </div>
          <p className="text-xs text-muted-foreground">
            {agentsPercentage.toFixed(0)}% do limite
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Usuários
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {tenantInfo.usage.active_users} / {tenantInfo.limits.max_users}
          </div>
          <p className="text-xs text-muted-foreground">
            Usuários ativos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Requisições (mês)
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {tenantInfo.usage.requests_this_month.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {usagePercentage.toFixed(1)}% do limite
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
