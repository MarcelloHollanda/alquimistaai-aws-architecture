'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
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
  name: string;
  [key: string]: any;
}

interface UsageChartProps {
  type?: 'line' | 'bar' | 'area';
  data: ChartData[];
  title: string;
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
}

const DEFAULT_COLORS = [
  '#FF6B35', // Laranja AlquimistaAI
  '#004E89', // Azul AlquimistaAI
  '#10B981', // Verde
  '#F59E0B', // Amarelo
  '#8B5CF6', // Roxo
  '#EC4899', // Rosa
];

export function UsageChart({
  type = 'line',
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
}: UsageChartProps) {
  
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

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    const xAxisProps = {
      dataKey: xAxisKey,
      tick: { fontSize: 12 },
      tickLine: false,
    };

    const yAxisProps = {
      tick: { fontSize: 12 },
      tickLine: false,
      tickFormatter: formatYAxis,
    };

    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart {...commonProps}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
              <XAxis {...xAxisProps} />
              <YAxis {...yAxisProps} />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
              {dataKeys.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart {...commonProps}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
              <XAxis {...xAxisProps} />
              <YAxis {...yAxisProps} />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
              {dataKeys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={colors[index % colors.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart {...commonProps}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
              <XAxis {...xAxisProps} />
              <YAxis {...yAxisProps} />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
              {dataKeys.map((key, index) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  fill={colors[index % colors.length]}
                  fillOpacity={0.6}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader>
          <div className="h-6 w-48 bg-muted rounded mb-2"></div>
          {description && <div className="h-4 w-64 bg-muted rounded"></div>}
        </CardHeader>
        <CardContent>
          <div className="w-full bg-muted rounded" style={{ height }}></div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
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

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  );
}
