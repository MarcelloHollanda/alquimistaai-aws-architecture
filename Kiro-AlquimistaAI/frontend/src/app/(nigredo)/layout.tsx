/**
 * Nigredo Layout
 * Layout que herda o tema visual do AlquimistaAI
 */

import { Inter } from 'next/font/google';
import Link from 'next/link';
import { SkipLinks } from '@/components/accessibility/skip-links';
import { Flame } from 'lucide-react';

const inter = Inter({ subsets: ['latin'] });

export default function NigredoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.className} min-h-screen bg-gradient-to-br from-slate-50 via-white to-pink-50`}>
      <SkipLinks />
      
      {/* Navigation - Mesmo estilo do AlquimistaAI */}
      <nav 
        id="navigation"
        className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50"
        role="navigation"
        aria-label="Navegação principal"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo AlquimistaAI */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg" />
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Alquimista.AI
              </span>
            </Link>
            
            {/* Navegação */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-slate-600 hover:text-purple-600 transition-colors">
                Início
              </Link>
              <Link href="/fibonacci" className="text-slate-600 hover:text-purple-600 transition-colors">
                Fibonacci
              </Link>
              <Link href="/nigredo" className="text-pink-600 font-semibold">
                Nigredo
              </Link>
              <Link href="/billing" className="text-slate-600 hover:text-purple-600 transition-colors">
                Planos
              </Link>
              <Link 
                href="/login" 
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all"
              >
                Acessar
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Nigredo Header - Identifica o núcleo */}
      <div className="pt-16 bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Flame className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Nigredo</h1>
              <p className="text-white/90 text-sm">Núcleo de Prospecção B2B</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-navigation - Navegação interna do Nigredo */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto" aria-label="Navegação Nigredo">
            <Link 
              href="/nigredo/painel" 
              className="py-4 px-1 border-b-2 border-transparent hover:border-pink-500 text-slate-600 hover:text-pink-600 transition-colors whitespace-nowrap"
            >
              Painel
            </Link>
            <Link 
              href="/nigredo/agentes-nigredo" 
              className="py-4 px-1 border-b-2 border-transparent hover:border-pink-500 text-slate-600 hover:text-pink-600 transition-colors whitespace-nowrap"
            >
              Agentes
            </Link>
            <Link 
              href="/nigredo/pipeline" 
              className="py-4 px-1 border-b-2 border-transparent hover:border-pink-500 text-slate-600 hover:text-pink-600 transition-colors whitespace-nowrap"
            >
              Pipeline
            </Link>
            <Link 
              href="/nigredo/conversas" 
              className="py-4 px-1 border-b-2 border-transparent hover:border-pink-500 text-slate-600 hover:text-pink-600 transition-colors whitespace-nowrap"
            >
              Conversas
            </Link>
            <Link 
              href="/nigredo/agendamentos" 
              className="py-4 px-1 border-b-2 border-transparent hover:border-pink-500 text-slate-600 hover:text-pink-600 transition-colors whitespace-nowrap"
            >
              Agendamentos
            </Link>
            <Link 
              href="/nigredo/relatorios" 
              className="py-4 px-1 border-b-2 border-transparent hover:border-pink-500 text-slate-600 hover:text-pink-600 transition-colors whitespace-nowrap"
            >
              Relatórios
            </Link>
            <Link 
              href="/nigredo/governanca" 
              className="py-4 px-1 border-b-2 border-transparent hover:border-pink-500 text-slate-600 hover:text-pink-600 transition-colors whitespace-nowrap"
            >
              Governança
            </Link>
          </nav>
        </div>
      </div>

      {/* Content */}
      <main id="main-content" className="min-h-screen" role="main">
        {children}
      </main>

      {/* Footer - Mesmo do AlquimistaAI */}
      <footer className="bg-slate-900 text-white mt-20" role="contentinfo" aria-label="Rodapé do site">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">Alquimista.AI</h3>
              <p className="text-slate-400 text-sm">
                Transformando negócios com inteligência artificial
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/fibonacci" className="hover:text-white transition-colors">Fibonacci</Link></li>
                <li><Link href="/nigredo" className="hover:text-white transition-colors">Nigredo</Link></li>
                <li><Link href="/billing" className="hover:text-white transition-colors">Planos</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/sobre" className="hover:text-white transition-colors">Sobre</Link></li>
                <li><Link href="/manifesto" className="hover:text-white transition-colors">Manifesto</Link></li>
                <li><Link href="/contato" className="hover:text-white transition-colors">Contato</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/privacidade" className="hover:text-white transition-colors">Privacidade</Link></li>
                <li><Link href="/termos" className="hover:text-white transition-colors">Termos</Link></li>
                <li><Link href="/lgpd" className="hover:text-white transition-colors">LGPD</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-400">
            <p>© 2025 Alquimista.AI. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
