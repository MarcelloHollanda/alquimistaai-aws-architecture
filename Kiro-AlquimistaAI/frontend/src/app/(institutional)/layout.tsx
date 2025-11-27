import { Inter } from 'next/font/google';
import Link from 'next/link';
import { SkipLinks } from '@/components/accessibility/skip-links';

const inter = Inter({ subsets: ['latin'] });

export default function InstitutionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.className} min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50`}>
      <SkipLinks />
      
      {/* Navigation */}
      <nav 
        id="navigation"
        className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50"
        role="navigation"
        aria-label="Navegação principal"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/institucional" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg" />
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Alquimista.AI
              </span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/institucional" className="text-slate-600 hover:text-purple-600 transition-colors">
                Início
              </Link>
              <Link href="/fibonacci" className="text-slate-600 hover:text-purple-600 transition-colors">
                Fibonacci
              </Link>
              <Link href="/nigredo" className="text-slate-600 hover:text-purple-600 transition-colors">
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

      {/* Content */}
      <main id="main-content" className="pt-16" role="main">
        {children}
      </main>

      {/* Footer */}
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
