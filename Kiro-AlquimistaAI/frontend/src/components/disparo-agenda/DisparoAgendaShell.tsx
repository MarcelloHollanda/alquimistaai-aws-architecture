'use client';

type DisparoAgendaShellProps = {
  children?: React.ReactNode;
};

/**
 * Shell mínimo para a página Disparo & Agendamento
 * 
 * Componente ultra-simplificado para garantir que a rota funciona
 * sem dependências complexas de auth, API ou contexto.
 * 
 * Após validar que a rota está saudável, o conteúdo completo
 * será reintroduzido gradualmente.
 */
export function DisparoAgendaShell({ children }: DisparoAgendaShellProps) {
  // Debug para E2E
  if (typeof window !== 'undefined') {
    console.log('[DisparoAgendaShell] Componente renderizado');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-6 py-4">
        <h1 className="text-2xl font-semibold">Disparo &amp; Agendamento</h1>
        <p className="text-sm text-gray-600 mt-1">
          Gerencie campanhas de mensagens e agendamentos de reuniões
        </p>
      </header>
      
      <main className="flex-1 px-6 py-4">
        {children ?? (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Shell mínimo carregado. Conteúdo detalhado será adicionado depois.
            </p>
            
            {/* Cards de overview minimalistas */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
              <div className="rounded-lg border p-4">
                <h2 className="text-sm font-medium text-gray-600">Contatos na Fila</h2>
                <p className="text-2xl font-bold">0</p>
              </div>
              
              <div className="rounded-lg border p-4">
                <h2 className="text-sm font-medium text-gray-600">Mensagens Enviadas</h2>
                <p className="text-2xl font-bold">0</p>
              </div>
              
              <div className="rounded-lg border p-4">
                <h2 className="text-sm font-medium text-gray-600">Reuniões Agendadas</h2>
                <p className="text-2xl font-bold">0</p>
              </div>
              
              <div className="rounded-lg border p-4">
                <h2 className="text-sm font-medium text-gray-600">Reuniões Confirmadas</h2>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
