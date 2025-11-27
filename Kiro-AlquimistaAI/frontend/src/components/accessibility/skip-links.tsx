'use client';

export function SkipLinks() {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        className="fixed top-4 left-4 z-50 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold focus:outline-none focus:ring-4 focus:ring-purple-300"
      >
        Pular para o conteúdo principal
      </a>
      <a
        href="#navigation"
        className="fixed top-4 left-40 z-50 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold focus:outline-none focus:ring-4 focus:ring-purple-300"
      >
        Pular para a navegação
      </a>
    </div>
  );
}
