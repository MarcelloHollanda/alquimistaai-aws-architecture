/**
 * Layout do Painel Fibonacci
 * 
 * Layout compartilhado para todas as páginas do núcleo Fibonacci
 * Herda o tema visual do AlquimistaAI
 */

import { Inter } from 'next/font/google';
import Link from 'next/link';
import { Network, Home, Settings, Activity, Layers, GitBranch } from 'lucide-react';

const inter = Inter({ subsets: ['latin'] });

export default function FibonacciLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.className} min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50`}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo e Título */}
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg" />
                <span className="text-sm font-semibold text-slate-600">Alquimista.AI</span>
              </Link>
              
              <div className="hidden md:flex items-center space-x-2 pl-4 border-l border-slate-300">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Network className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Fibonacci
                  </h1>
                  <p className="text-xs text-slate-500">Núcleo Orquestrador</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link 
                href="/" 
                className="text-slate-600 hover:text-purple-600 transition-colors flex items-center space-x-1"
              >
                <Home className="w-4 h-4" />
                <span>AlquimistaAI</span>
              </Link>
              <Link 
                href="/dashboard" 
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:shadow-lg transition-all"
              >
                Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Breadcrumb / Context Bar */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm mb-1">Núcleo Orquestrador B2B</p>
              <h2 className="text-2xl md:text-3xl font-bold">Fibonacci</h2>
              <p className="text-purple-100 mt-2 max-w-2xl">
                Orquestra os subnúcleos e integrações da AlquimistaAI
              </p>
            </div>
            
            {/* Quick Actions */}
            <div className="hidden lg:flex items-center space-x-3">
              <Link
                href="/fibonacci/health"
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Activity className="w-4 h-4" />
                <span>Status</span>
              </Link>
              <Link
                href="/nigredo"
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Layers className="w-4 h-4" />
                <span>Nigredo</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            <Link
              href="/fibonacci"
              className="py-4 px-1 border-b-2 border-transparent hover:border-purple-500 text-slate-600 hover:text-purple-600 transition-colors whitespace-nowrap"
            >
              Painel
            </Link>
            <Link
              href="/fibonacci/agentes-fibonacci"
              className="py-4 px-1 border-b-2 border-transparent hover:border-purple-500 text-slate-600 hover:text-purple-600 transition-colors whitespace-nowrap"
            >
              Agentes & Núcleos
            </Link>
            <Link
              href="/fibonacci/integracoes"
              className="py-4 px-1 border-b-2 border-transparent hover:border-purple-500 text-slate-600 hover:text-purple-600 transition-colors whitespace-nowrap"
            >
              Integrações
            </Link>
            <Link
              href="/fibonacci/fluxos"
              className="py-4 px-1 border-b-2 border-transparent hover:border-purple-500 text-slate-600 hover:text-purple-600 transition-colors whitespace-nowrap"
            >
              Fluxos
            </Link>
            <Link
              href="/fibonacci/health"
              className="py-4 px-1 border-b-2 border-transparent hover:border-purple-500 text-slate-600 hover:text-purple-600 transition-colors whitespace-nowrap"
            >
              Status Técnico
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-20 bg-slate-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Network className="w-5 h-5 text-purple-400" />
              <span className="font-semibold">Fibonacci — Núcleo Orquestrador</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-slate-400">
              <Link href="/" className="hover:text-white transition-colors">
                AlquimistaAI
              </Link>
              <Link href="/fibonacci" className="hover:text-white transition-colors">
                Fibonacci
              </Link>
              <Link href="/nigredo" className="hover:text-white transition-colors">
                Nigredo
              </Link>
              <Link href="/docs" className="hover:text-white transition-colors">
                Documentação
              </Link>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-800 text-center text-sm text-slate-500">
            <p>© 2025 Alquimista.AI. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
