'use client';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Error Boundary - App Router
 *
 * Este componente é usado pelo Next.js para tratar erros em runtime
 * na camada de UI. Ele complementa o ErrorBoundary custom usado no layout.
 */
export default function Error({ error, reset }: ErrorProps) {
  // Log básico no console para debug
  console.error('[GlobalError] Erro capturado pela app router:', error);

  return (
    <html lang="pt-BR">
      <body>
        <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-100 px-4">
          <div className="max-w-md w-full text-center space-y-4">
            <h1 className="text-2xl font-bold text-red-700">
              Algo deu errado
            </h1>
            <p className="text-sm text-red-600">
              Ocorreu um erro ao acessar a página solicitada. Você pode tentar novamente
              ou voltar para a página inicial.
            </p>

            <div className="flex flex-col gap-2 mt-4">
              <button
                type="button"
                onClick={() => reset()}
                className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700"
              >
                Tentar novamente
              </button>
              <a
                href="/"
                className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium border border-red-200 text-red-700 hover:bg-red-50"
              >
                Ir para a página inicial
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
