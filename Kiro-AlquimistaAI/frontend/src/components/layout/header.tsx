'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href={ROUTES.HOME} className="mr-6 flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">
              AlquimistaAI
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href={ROUTES.PRICING}
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Preços
            </Link>
            <Link
              href={ROUTES.ABOUT}
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Sobre
            </Link>
            <Link
              href={ROUTES.CONTACT}
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Contato
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <Button variant="ghost" asChild>
              <Link href={ROUTES.LOGIN}>Entrar</Link>
            </Button>
            <Button asChild>
              <Link href={ROUTES.SIGNUP}>Começar Grátis</Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
