/**
 * Página 404 Global - App Router
 *
 * Usada quando uma rota não é encontrada.
 */
export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">
          Página não encontrada
        </h1>
        <p className="text-sm text-gray-600">
          A rota que você tentou acessar não existe ou foi movida.
        </p>
        <a
          href="/"
          className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium bg-primary text-white hover:opacity-90"
        >
          Voltar para a página inicial
        </a>
      </div>
    </main>
  );
}
