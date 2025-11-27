'use client';

import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function LazyLoad({ children, fallback }: LazyLoadProps) {
  return (
    <Suspense fallback={fallback || <Skeleton className="w-full h-64" />}>
      {children}
    </Suspense>
  );
}
