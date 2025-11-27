'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createOperationalCommand } from '@/lib/api/internal-client';
import { Loader2, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CommandFormProps {
  onCommandCreated?: () => void;
}

export function CommandForm({ onCommandCreated }: CommandFormProps) {
  const [commandType, setCommandType] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [parameters, setParameters] = useState('{}');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commandType) {
      toast({
        title: 'Erro',
        description: 'Selecione um tipo de comando',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      // Validar JSON dos parâmetros
      let parsedParams = {};
      try {
        parsedParams = JSON.parse(parameters);
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Parâmetros devem ser um JSON válido',
          variant: 'destructive',
        });
        return;
      }

      await createOperationalCommand({
        command_type: commandType as any,
        tenant_id: tenantId || undefined,
        parameters: parsedParams,
      });

      toast({
        title: 'Sucesso',
        description: 'Comando criado e processamento iniciado',
      });

      // Resetar formulário
      setCommandType('');
      setTenantId('');
      setParameters('{}');
      
      // Notificar componente pai
      onCommandCreated?.();
    } catch (error) {
      console.error('Erro ao criar comando:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao criar comando operacional',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="commandType">Tipo de Comando *</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-semibold mb-1">Tipos de Comando:</p>
                  <ul className="text-sm space-y-1">
                    <li><strong>Reprocessar Fila:</strong> Reprocessa mensagens em fila</li>
                    <li><strong>Resetar Token:</strong> Reseta token de integração</li>
                    <li><strong>Reiniciar Agente:</strong> Reinicia agente específico</li>
                    <li><strong>Health Check:</strong> Verifica saúde do sistema</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select value={commandType} onValueChange={setCommandType}>
              <SelectTrigger id="commandType">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="REPROCESS_QUEUE">Reprocessar Fila</SelectItem>
                <SelectItem value="RESET_TOKEN">Resetar Token</SelectItem>
                <SelectItem value="RESTART_AGENT">Reiniciar Agente</SelectItem>
                <SelectItem value="HEALTH_CHECK">Health Check</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="tenantId">Tenant ID (opcional)</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    UUID do tenant para comandos específicos. Deixe vazio para comandos globais.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="tenantId"
              placeholder="UUID do tenant"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="parameters">Parâmetros (JSON)</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-md">
                <p className="font-semibold mb-1">Exemplos de Parâmetros:</p>
                <div className="text-sm space-y-2">
                  <div>
                    <p className="font-medium">REPROCESS_QUEUE:</p>
                    <code className="text-xs">{"{"}"queue_name": "leads", "message_ids": ["id1"]{"}"}</code>
                  </div>
                  <div>
                    <p className="font-medium">RESET_TOKEN:</p>
                    <code className="text-xs">{"{"}"integration_id": "uuid"{"}"}</code>
                  </div>
                  <div>
                    <p className="font-medium">RESTART_AGENT:</p>
                    <code className="text-xs">{"{"}"agent_id": "uuid"{"}"}</code>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
          <Textarea
            id="parameters"
            placeholder='{"key": "value"}'
            value={parameters}
            onChange={(e) => setParameters(e.target.value)}
            rows={4}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Insira os parâmetros do comando em formato JSON
          </p>
        </div>

        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Executar Comando
        </Button>
      </form>
    </TooltipProvider>
  );
}
