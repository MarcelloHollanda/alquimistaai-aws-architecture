'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown } from 'lucide-react';

interface FunnelStage {
  name: string;
  value: number;
  percentage: number;
}

interface ConversionFunnelProps {
  stages: FunnelStage[];
}

export function ConversionFunnel({ stages }: ConversionFunnelProps) {
  const maxValue = stages[0]?.value || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funil de Conversão</CardTitle>
        <CardDescription>
          Acompanhe a jornada dos leads através do funil
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const width = (stage.value / maxValue) * 100;
            const dropoff = index > 0 ? stages[index - 1].value - stage.value : 0;
            const dropoffPercentage = index > 0 
              ? ((dropoff / stages[index - 1].value) * 100).toFixed(1)
              : 0;

            return (
              <div key={stage.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{stage.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">
                      {stage.value.toLocaleString('pt-BR')} leads
                    </span>
                    <span className="font-semibold text-primary">
                      {stage.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div className="relative h-12 bg-muted rounded-lg overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center text-white font-medium transition-all duration-500"
                    style={{ width: `${width}%` }}
                  >
                    {width > 20 && `${stage.percentage.toFixed(1)}%`}
                  </div>
                </div>

                {index < stages.length - 1 && (
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <ChevronDown className="h-4 w-4" />
                    {dropoff > 0 && (
                      <span>
                        Perda de {dropoff.toLocaleString('pt-BR')} leads ({dropoffPercentage}%)
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{stages[0]?.value.toLocaleString('pt-BR')}</div>
              <div className="text-xs text-muted-foreground">Total de Leads</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {stages[stages.length - 1]?.value.toLocaleString('pt-BR')}
              </div>
              <div className="text-xs text-muted-foreground">Convertidos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-500">
                {stages[stages.length - 1]?.percentage.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Taxa de Conversão</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
