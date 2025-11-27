'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/lib/constants';
import { getTenantMe, type TenantInfo } from '@/lib/api/tenant-client';
import { Building2, LogOut, Menu } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useMobileMenu } from '@/hooks/use-mobile-menu';

export function TenantHeader() {
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuthStore();
  const { isMobile, toggleMobileMenu } = useMobileMenu();

  useEffect(() => {
    async function loadTenantInfo() {
      try {
        const data = await getTenantMe();
        setTenantInfo(data);
      } catch (error) {
        console.error('Erro ao carregar informações do tenant:', error);
      } finally {
        setLoading(false);
      }
    }

    loadTenantInfo();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-gray-500';
      case 'suspended':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'inactive':
        return 'Inativo';
      case 'suspended':
        return 'Suspenso';
      default:
        return status;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Botão de menu hambúrguer em mobile */}
          {isMobile && (
            <Button
              id="mobile-menu-button"
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="md:hidden touch-manipulation"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          <Link href={ROUTES.DASHBOARD_OVERVIEW} className="flex items-center space-x-2">
            <span className="text-xl sm:text-2xl font-bold text-primary">
              AlquimistaAI
            </span>
          </Link>
          
          {!loading && tenantInfo && (
            <div className="hidden sm:flex items-center space-x-3 border-l pl-4">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{tenantInfo.name}</span>
                <span className="text-xs text-muted-foreground">
                  Plano: {tenantInfo.plan}
                </span>
              </div>
              <Badge 
                variant="outline" 
                className={`${getStatusColor(tenantInfo.status)} text-white border-none`}
              >
                {getStatusLabel(tenantInfo.status)}
              </Badge>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {!loading && tenantInfo && (
            <div className="hidden md:flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex flex-col items-end">
                <span className="font-medium">
                  {tenantInfo.usage.active_agents} / {tenantInfo.limits.max_agents}
                </span>
                <span className="text-xs">Agentes</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-medium">
                  {tenantInfo.usage.requests_this_month.toLocaleString()} / {tenantInfo.limits.max_requests_per_month.toLocaleString()}
                </span>
                <span className="text-xs">Requisições</span>
              </div>
            </div>
          )}
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={logout}
            className="flex items-center space-x-2 touch-manipulation"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
