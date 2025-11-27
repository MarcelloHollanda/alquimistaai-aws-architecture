import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h3 className="text-lg font-semibold mb-4">Produto</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={ROUTES.PRICING} className="text-muted-foreground hover:text-foreground">
                  Preços
                </Link>
              </li>
              <li>
                <Link href="/features" className="text-muted-foreground hover:text-foreground">
                  Funcionalidades
                </Link>
              </li>
              <li>
                <Link href="/agents" className="text-muted-foreground hover:text-foreground">
                  Agentes
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Empresa</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={ROUTES.ABOUT} className="text-muted-foreground hover:text-foreground">
                  Sobre
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-foreground">
                  Blog
                </Link>
              </li>
              <li>
                <Link href={ROUTES.CONTACT} className="text-muted-foreground hover:text-foreground">
                  Contato
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Recursos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/docs" className="text-muted-foreground hover:text-foreground">
                  Documentação
                </Link>
              </li>
              <li>
                <Link href="/api" className="text-muted-foreground hover:text-foreground">
                  API
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-muted-foreground hover:text-foreground">
                  Suporte
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
                  Privacidade
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground">
                  Termos
                </Link>
              </li>
              <li>
                <Link href="/lgpd" className="text-muted-foreground hover:text-foreground">
                  LGPD
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} AlquimistaAI. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
