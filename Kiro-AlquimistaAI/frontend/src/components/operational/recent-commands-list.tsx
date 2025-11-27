'use client';

import { useEffect, useState } from 'react';
import { useOperationalClient } from '@/hooks/use-operational-client';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Terminal, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

interface OperationalCommand {
  id: string;
  command_type: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'ERROR';
  tenant_id?: string;
  tenant_name?: string;
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

export function RecentCommandsList() {
  const { getOperationalCommands } = useOperationalClient();
  const [commands, setCommands] = useState<OperationalCommand[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCommands = async () => {
      try {
        const data = await getOperationalCommands({
          limit: 10,
          offset: 0
        });
        setCommands(data.commands || []);
      } catch (error) {
        console.error('Error loading operational commands:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCommands();
  }, [getOperationalCommands]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'ERROR':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'RUNNING':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <Badge variant="default" className="bg-green-100 text-green-700">Sucesso</Badge>;
      case 'ERROR':
        return <Badge variant="destructive">Erro</Badge>;
      case 'RUNNING':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Executando</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  const getCommandLabel = (type: string) => {
    const labels: Record<string, string> = {
      'REPROCESS_QUEUE': 'Reprocessar Fila',
      'RESET_TOKEN': 'Resetar Token',
      'RESTART_AGENT': 'Reiniciar Agente',
      'HEALTH_CHECK': 'Verificação de Saúde'
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start space-x-3 p-3 border rounded-lg">
            <Skeleton className="h-5 w-5 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (commands.length === 0) {
    return (
      <div className="text-center py-8">
        <Terminal className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Nenhum comando executado recentemente</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {commands.map((command) => (
        <div key={command.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
          {getStatusIcon(command.status)}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-medium text-gray-900">
                {getCommandLabel(command.command_type)}
              </h4>
              {getStatusBadge(command.status)}
            </div>
            
            {command.tenant_name && (
              <p className="text-xs text-gray-500 mb-1">
                Tenant: {command.tenant_name}
              </p>
            )}
            
            {command.error_message && (
              <p className="text-xs text-red-600 mb-1">
                {command.error_message}
              </p>
            )}
            
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>
                Criado: {new Date(command.created_at).toLocaleString('pt-BR')}
              </span>
              {command.completed_at && (
                <span>
                  Concluído: {new Date(command.completed_at).toLocaleString('pt-BR')}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
