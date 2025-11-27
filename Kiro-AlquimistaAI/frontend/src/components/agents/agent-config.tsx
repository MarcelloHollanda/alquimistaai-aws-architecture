'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';
import type { Agent } from '@/types';

interface AgentConfigProps {
  agent: Agent;
  onSave: (config: Record<string, any>) => void;
  onClose: () => void;
}

export function AgentConfig({ agent, onSave, onClose }: AgentConfigProps) {
  const [config, setConfig] = useState<Record<string, any>>({
    maxExecutions: 100,
    timeout: 30,
    retryAttempts: 3,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l shadow-lg overflow-y-auto">
        <Card className="border-0 rounded-none">
          <CardHeader className="border-b">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Configurar {agent.name}</CardTitle>
                <CardDescription className="mt-2">
                  Ajuste as configurações do agente
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="maxExecutions" className="text-sm font-medium">
                  Máximo de Execuções por Dia
                </label>
                <Input
                  id="maxExecutions"
                  type="number"
                  value={config.maxExecutions}
                  onChange={(e) => setConfig({ ...config, maxExecutions: parseInt(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">
                  Limite diário de execuções do agente
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="timeout" className="text-sm font-medium">
                  Timeout (segundos)
                </label>
                <Input
                  id="timeout"
                  type="number"
                  value={config.timeout}
                  onChange={(e) => setConfig({ ...config, timeout: parseInt(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">
                  Tempo máximo de execução
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="retryAttempts" className="text-sm font-medium">
                  Tentativas de Retry
                </label>
                <Input
                  id="retryAttempts"
                  type="number"
                  value={config.retryAttempts}
                  onChange={(e) => setConfig({ ...config, retryAttempts: parseInt(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">
                  Número de tentativas em caso de falha
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  Salvar Configurações
                </Button>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
