'use client';

import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { listOperationalCommands, type OperationalCommand } from '@/lib/api/internal-client';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CommandHistoryTableProps {
  refreshTrigger?: number;
}

export function CommandHistoryTable({ refreshTrigger }: CommandHistoryTableProps) {
  const [commands, setCommands] = useState<OperationalCommand[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadCommands = async () => {
    try {
      setLoading(true);
      const data = await listOperationalCommands({
        status: statusFilter === 'all' ? undefined : statusFilter as any,
        limit: 20,
      });
      setCommands(data.commands);
    } catch (error) {
      console.error('Erro ao carregar comandos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommands();
  }, [statusFilter, refreshTrigger]);

  // Auto-refresh a cada 10 segundos
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      loadCommands();
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-green-500 text-white';
      case 'ERROR':
        return 'bg-red-500 text-white';
      case 'RUNNING':
        return 'bg-blue-500 text-white';
      case 'PENDING':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (loading && commands.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="PENDING">Pendente</SelectItem>
            <SelectItem value="RUNNING">Executando</SelectItem>
            <SelectItem value="SUCCESS">Sucesso</SelectItem>
            <SelectItem value="ERROR">Erro</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => loadCommands()}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead>Completado em</TableHead>
              <TableHead>Resultado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {commands.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhum comando encontrado
                </TableCell>
              </TableRow>
            ) : (
              commands.map((command) => (
                <TableRow key={command.command_id}>
                  <TableCell className="font-medium">{command.command_type}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(command.status)}>
                      {command.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {command.tenant_name || command.tenant_id || '-'}
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(command.created_at)}</TableCell>
                  <TableCell className="text-sm">
                    {command.completed_at ? formatDate(command.completed_at) : '-'}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm">
                    {command.error_message || command.output || '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
