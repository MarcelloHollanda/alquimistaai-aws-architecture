'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { 
  LayoutDashboard, 
  Users, 
  Bot, 
  Plug,
  Terminal,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useMobileMenu } from '@/hooks/use-mobile-menu';

export function CompanySidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { isMobile, isMobileMenuOpen, closeMobileMenu } = useMobileMenu();

  const navigation = [
    { 
      name: 'Visão Geral', 
      href: ROUTES.COMPANY_OVERVIEW, 
      icon: LayoutDashboard,
      description: 'Dashboard operacional'
    },
    { 
      name: 'Tenants', 
      href: ROUTES.COMPANY_TENANTS, 
      icon: Users,
      description: 'Gerenciar clientes'
    },
    { 
      name: 'Agentes', 
      href: ROUTES.COMPANY_AGENTS, 
      icon: Bot,
      description: 'Visão de agentes'
    },
    { 
      name: 'Integrações', 
      href: ROUTES.COMPANY_INTEGRATIONS, 
      icon: Plug,
      description: 'Mapa de integrações'
    },
    { 
      name: 'Operações', 
      href: ROUTES.COMPANY_OPERATIONS, 
      icon: Terminal,
      description: 'Console operacional'
    },
    { 
      name: 'Financeiro', 
      href: ROUTES.COMPANY_BILLING, 
      icon: DollarSign,
      description: 'Visão financeira'
    },
  ];

  return (
    <>
      {/* Overlay para mobile */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      <aside
        id="mobile-sidebar"
        className={cn(
          'fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] border-r bg-background transition-all duration-300',
          // Mobile: slide in/out
          isMobile && !isMobileMenuOpen && '-translate-x-full',
          isMobile && isMobileMenuOpen && 'translate-x-0',
          // Desktop: normal behavior
          !isMobile && (collapsed ? 'w-16' : 'w-64'),
          // Mobile: sempre largura completa quando aberto
          isMobile && 'w-64'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Botão de fechar em mobile */}
          {isMobile && (
            <div className="flex justify-end p-2 border-b">
              <Button
                variant="ghost"
                size="sm"
                onClick={closeMobileMenu}
                className="md:hidden"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-1 px-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={isMobile ? closeMobileMenu : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors touch-manipulation min-h-[44px]',
                      isActive
                        ? 'bg-purple-500 text-white'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted'
                    )}
                    title={collapsed && !isMobile ? item.description : undefined}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {(!collapsed || isMobile) && (
                      <div className="flex flex-col">
                        <span>{item.name}</span>
                        <span className="text-xs opacity-70">{item.description}</span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="border-t p-4">
            {/* Botão de colapsar apenas em desktop */}
            {!isMobile && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center"
                onClick={() => setCollapsed(!collapsed)}
              >
                {collapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Recolher
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
