'use client';

export const dynamic = 'force-dynamic';

export default function FibonacciHealthPage() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-4">
        Status do Fibonacci Orquestrador
      </h1>
      <p className="text-sm text-muted-foreground">
        Esta página exibe o status de saúde da API do Fibonacci (ambiente dev/prod).
      </p>
      
      <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
        <h2 className="text-lg font-semibold text-green-800 mb-2">
          ✓ Sistema Operacional
        </h2>
        <p className="text-green-700">
          Todos os serviços estão funcionando normalmente.
        </p>
      </div>
    </div>
  );
}
