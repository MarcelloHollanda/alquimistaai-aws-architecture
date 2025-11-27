'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

interface PeriodSelectorProps {
  selected: string;
  onChange: (period: string) => void;
}

const periods = [
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
  { value: '1y', label: '1 ano' },
];

export function PeriodSelector({ selected, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <div className="flex gap-1">
        {periods.map((period) => (
          <Button
            key={period.value}
            variant={selected === period.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange(period.value)}
          >
            {period.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
