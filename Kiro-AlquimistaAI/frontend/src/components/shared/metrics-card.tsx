'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Minus, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricsCardProps {
  title: string;
  value: number | string;
  change?: number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  suffix?: string;
  prefix?: string;
  description?: string;
  loading?: boolean;
  className?: string;
  animated?: boolean;
}

export function MetricsCard({
  title,
  value,
  change,
  icon,
  trend = 'neutral',
  suffix = '',
  prefix = '',
  description,
  loading = false,
  className,
  animated = true,
}: MetricsCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === 'number' ? value : 0;

  // Animated counter effect
  useEffect(() => {
    if (!animated || typeof value !== 'number') {
      setDisplayValue(numericValue);
      return;
    }

    let start = 0;
    const duration = 1500; // 1.5 seconds
    const increment = value / (duration / 16); // 60fps

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, animated, numericValue]);

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const getChangeColor = () => {
    if (change === undefined) return '';
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-muted-foreground';
  };

  if (loading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 w-24 bg-muted rounded"></div>
          <div className="h-8 w-8 bg-muted rounded"></div>
        </CardHeader>
        <CardContent>
          <div className="h-8 w-32 bg-muted rounded mb-2"></div>
          <div className="h-4 w-40 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('hover:shadow-md transition-shadow touch-manipulation', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-muted-foreground opacity-70 flex-shrink-0">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-xl sm:text-2xl font-bold tracking-tight break-words">
          {prefix}
          {typeof value === 'number' 
            ? displayValue.toLocaleString('pt-BR') 
            : value}
          {suffix}
        </div>
        
        {(change !== undefined || description) && (
          <div className="mt-2 space-y-1">
            {change !== undefined && (
              <div className="flex items-center gap-1 text-xs flex-wrap">
                {getTrendIcon()}
                <span className={cn('font-medium', getChangeColor())}>
                  {change > 0 ? '+' : ''}{change}%
                </span>
                <span className="text-muted-foreground hidden sm:inline">vs período anterior</span>
              </div>
            )}
            
            {description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {description}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
