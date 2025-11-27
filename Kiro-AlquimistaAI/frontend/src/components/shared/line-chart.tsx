'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  TooltipProps
} from 'recharts';
import { cn } from '@/lib/utils';

interface ChartData {
  [key: string]: any;
}

interface LineChartProps {
  data: ChartData[];
  title?: string;
  description?: string;
  dataKeys: string[];
  xAxisKey?: string;
  colors?: string[];
  loading?: boolean;
  className?: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  formatYAxis?: (value: number) => string;
  formatTooltip?: (value: number) => string;
  curved?: boolean;
  showDots?: boolean;
}

const DEFAULT_COLORS = [
  '#FF6B35', // Laranja AlquimistaAI
  '#004E89', // Azul AlquimistaAI
  '#10B981', // Verde
  '#F59E0B', // Amarelo
  '#8B5CF6', // Roxo
  '#EC4899', // Rosa
];

export function LineChart({
  data,
  title,
  description,
  dataKeys,
  xAxisKey = 'name',
  colors = DEFAULT_COLORS,
  loading = false,
  className,
  height = 300,
  showLegend = true,
  showGrid = true,
  formatYAxis,
  formatTooltip,
  curved = true,
  showDots = true,
}: LineChartProps) {
  
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium text-sm mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">
              {formatTooltip 
                ? formatTooltip(entry.value as number) 
                : (entry.value as number).toLocaleString('pt-BR')}
            </span>
          </div>
        ))}
      </div>
    );
  };

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
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart
        data={data}
        margin={{ 
          top: 5, 
          right: window.innerWidth < 640 ? 10 : 30, 
          left: window.innerWidth < 640 ? 0 : 20, 
          bottom: 5 
        }}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
        <XAxis 
          dataKey={xAxisKey}
          tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
          tickLine={false}
          angle={window.innerWidth < 640 ? -45 : 0}
          textAnchor={window.innerWidth < 640 ? 'end' : 'middle'}
          height={window.innerWidth < 640 ? 60 : 30}
        />
        <YAxis 
          tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
          tickLine={false}
          tickFormatter={formatYAxis}
          width={window.innerWidth < 640 ? 40 : 60}
        />
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend wrapperStyle={{ fontSize: window.innerWidth < 640 ? '10px' : '12px' }} />}
        {dataKeys.map((key, index) => (
          <Line
            key={key}
            type={curved ? 'monotone' : 'linear'}
            dataKey={key}
            stroke={colors[index % colors.length]}
            strokeWidth={window.innerWidth < 640 ? 1.5 : 2}
            dot={showDots ? { r: window.innerWidth < 640 ? 3 : 4 } : false}
            activeDot={showDots ? { r: window.innerWidth < 640 ? 5 : 6 } : false}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
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
