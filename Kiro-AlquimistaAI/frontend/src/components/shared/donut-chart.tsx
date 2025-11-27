'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip,
  Legend,
  TooltipProps
} from 'recharts';
import { cn } from '@/lib/utils';

interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

interface DonutChartProps {
  data: ChartData[];
  title?: string;
  description?: string;
  colors?: string[];
  loading?: boolean;
  className?: string;
  height?: number;
  showLegend?: boolean;
  showLabels?: boolean;
  formatValue?: (value: number) => string;
  innerRadius?: number;
  outerRadius?: number;
  centerLabel?: string;
  centerValue?: string | number;
}

const DEFAULT_COLORS = [
  '#FF6B35', // Laranja AlquimistaAI
  '#004E89', // Azul AlquimistaAI
  '#10B981', // Verde
  '#F59E0B', // Amarelo
  '#8B5CF6', // Roxo
  '#EC4899', // Rosa
  '#06B6D4', // Cyan
  '#F43F5E', // Rose
];

export function DonutChart({
  data,
  title,
  description,
  colors = DEFAULT_COLORS,
  loading = false,
  className,
  height = 300,
  showLegend = true,
  showLabels = true,
  formatValue,
  innerRadius = 60,
  outerRadius = 80,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  
  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0];
    const total = payload[0].payload.total || 0;
    const percentage = total > 0 ? ((data.value as number) / total * 100).toFixed(1) : 0;

    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <div className="flex items-center gap-2 mb-1">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: data.payload.fill }}
          />
          <span className="font-medium text-sm">{data.name}</span>
        </div>
        <div className="text-xs space-y-0.5">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Valor:</span>
            <span className="font-medium">
              {formatValue 
                ? formatValue(data.value as number) 
                : (data.value as number).toLocaleString('pt-BR')}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Percentual:</span>
            <span className="font-medium">{percentage}%</span>
          </div>
        </div>
      </div>
    );
  };

  const renderLabel = (entry: any) => {
    if (!showLabels) return '';
    const percent = entry.percent * 100;
    return `${entry.name}: ${percent.toFixed(0)}%`;
  };

  // Calcular total para o centro
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const dataWithTotal = data.map(item => ({ ...item, total }));

  if (loading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        {(title || description) && (
          <CardHeader>
            {title && <div className="h-6 w-48 bg-muted rounded mb-2"></div>}
            {description && <div className="h-4 w-64 bg-muted rounded"></div>}
          </CardHeader>
        )}
        <CardContent>
          <div className="w-full bg-muted rounded" style={{ height }}></div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        {(title || description) && (
          <CardHeader>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent>
          <div 
            className="flex items-center justify-center text-muted-foreground"
            style={{ height }}
          >
            <p>Nenhum dado disponível</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const content = (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={dataWithTotal}
            cx="50%"
            cy="50%"
            labelLine={showLabels}
            label={showLabels ? renderLabel : false}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            fill="#8884d8"
            dataKey="value"
            paddingAngle={2}
          >
            {dataWithTotal.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={colors[index % colors.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}
        </PieChart>
      </ResponsiveContainer>
      
      {/* Centro do donut com label e valor */}
      {(centerLabel || centerValue) && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          {centerLabel && (
            <p className="text-xs text-muted-foreground mb-1">{centerLabel}</p>
          )}
          {centerValue && (
            <p className="text-2xl font-bold">
              {typeof centerValue === 'number' 
                ? centerValue.toLocaleString('pt-BR')
                : centerValue}
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (!title && !description) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Card className={className}>
      <CardHeader>
        {title && <CardTitle>{title}</CardTitle>}
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
}
