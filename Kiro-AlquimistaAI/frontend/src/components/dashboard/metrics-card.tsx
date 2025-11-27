'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: number | string;
  change?: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  suffix?: string;
  prefix?: string;
}

export function MetricsCard({
  title,
  value,
  change,
  icon,
  trend = 'neutral',
  suffix = '',
  prefix = '',
}: MetricsCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === 'number' ? value : 0;

  // Animated counter effect
  useEffect(() => {
    if (typeof value !== 'number') return;

    let start = 0;
    const duration = 2000; // 2 seconds
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
  }, [value]);

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <ArrowDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-500';
      case 'down':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {prefix}
          {typeof value === 'number' ? displayValue.toLocaleString('pt-BR') : value}
          {suffix}
        </div>
        {change !== undefined && (
          <div className="flex items-center gap-1 text-xs mt-1">
            {getTrendIcon()}
            <span className={getTrendColor()}>
              {change > 0 ? '+' : ''}{change}%
            </span>
            <span className="text-muted-foreground">vs mês anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
