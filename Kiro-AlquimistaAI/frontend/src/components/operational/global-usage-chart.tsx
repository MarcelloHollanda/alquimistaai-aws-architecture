'use client';

import { useEffect, useState } from 'react';
import { useOperationalClient } from '@/hooks/use-operational-client';
import { Skeleton } from '@/components/ui/skeleton';

export function GlobalUsageChart() {
  const { getUsageOverview } = useOperationalClient();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const usageData = await getUsageOverview('30d');
        setData(usageData);
      } catch (error) {
        console.error('Error loading global usage data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [getUsageOverview]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-48 w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center text-gray-500">
        <p>Gráfico de uso global será implementado aqui</p>
        <p className="text-xs mt-1">Tendências dos últimos 30 dias</p>
      </div>
    </div>
  );
}
