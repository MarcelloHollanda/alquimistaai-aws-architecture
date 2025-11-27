'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Pause,
  PlayCircle,
  Ban,
  Loader2
} from 'lucide-react';

type StatusType = 
  | 'active' 
  | 'inactive' 
  | 'pending' 
  | 'error' 
  | 'success' 
  | 'warning'
  | 'suspended'
  | 'running'
  | 'completed'
  | 'failed';

interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig: Record<string, {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  active: {
    label: 'Ativo',
    variant: 'default',
    className: 'bg-green-500 hover:bg-green-600 text-white',
    icon: CheckCircle2,
  },
  inactive: {
    label: 'Inativo',
    variant: 'secondary',
    className: 'bg-gray-500 hover:bg-gray-600 text-white',
    icon: Pause,
  },
  pending: {
    label: 'Pendente',
    variant: 'outline',
    className: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    icon: Clock,
  },
  error: {
    label: 'Erro',
    variant: 'destructive',
    className: 'bg-red-500 hover:bg-red-600 text-white',
    icon: XCircle,
  },
  success: {
    label: 'Sucesso',
    variant: 'default',
    className: 'bg-green-500 hover:bg-green-600 text-white',
    icon: CheckCircle2,
  },
  warning: {
    label: 'Atenção',
    variant: 'outline',
    className: 'bg-orange-500 hover:bg-orange-600 text-white',
    icon: AlertCircle,
  },
  suspended: {
    label: 'Suspenso',
    variant: 'destructive',
    className: 'bg-red-600 hover:bg-red-700 text-white',
    icon: Ban,
  },
  running: {
    label: 'Executando',
    variant: 'default',
    className: 'bg-blue-500 hover:bg-blue-600 text-white',
    icon: Loader2,
  },
  completed: {
    label: 'Concluído',
    variant: 'default',
    className: 'bg-green-500 hover:bg-green-600 text-white',
    icon: CheckCircle2,
  },
  failed: {
    label: 'Falhou',
    variant: 'destructive',
    className: 'bg-red-500 hover:bg-red-600 text-white',
    icon: XCircle,
  },
};

export function StatusBadge({
  status,
  label,
  showIcon = true,
  size = 'md',
  className,
}: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();
  const config = statusConfig[normalizedStatus] || {
    label: status,
    variant: 'outline' as const,
    className: 'bg-gray-500 text-white',
    icon: AlertCircle,
  };

  const Icon = config.icon;
  const displayLabel = label || config.label;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <Badge
      variant={config.variant}
      className={cn(
        config.className,
        sizeClasses[size],
        'inline-flex items-center gap-1.5 font-medium',
        normalizedStatus === 'running' && 'animate-pulse',
        className
      )}
    >
      {showIcon && (
        <Icon 
          className={cn(
            iconSizes[size],
            normalizedStatus === 'running' && 'animate-spin'
          )} 
        />
      )}
      <span>{displayLabel}</span>
    </Badge>
  );
}

// Componente auxiliar para status de tenant
export function TenantStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status} />;
}

// Componente auxiliar para status de comando operacional
export function CommandStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status} />;
}

// Componente auxiliar para status de integração
export function IntegrationStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status} />;
}
