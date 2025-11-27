'use client';

import { useState } from 'react';
import { CommandForm } from '@/components/company/command-form';
import { CommandHistoryTable } from '@/components/company/command-history-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function OperationsConsolePage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCommandCreated = () => {
    // Atualizar histórico quando um novo comando for criado
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Console de Operações</h1>
        <p className="text-muted-foreground mt-2">
          Executar comandos operacionais e visualizar histórico
        </p>
      </div>

      {/* Formulário de Comando */}
      <Card>
        <CardHeader>
          <CardTitle>Executar Comando</CardTitle>
          <CardDescription>
            Selecione o tipo de comando e configure os parâmetros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CommandForm onCommandCreated={handleCommandCreated} />
        </CardContent>
      </Card>

      {/* Histórico de Comandos */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Comandos</CardTitle>
          <CardDescription>
            Comandos executados recentemente e seus status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CommandHistoryTable refreshTrigger={refreshTrigger} />
        </CardContent>
      </Card>
    </div>
  );
}
