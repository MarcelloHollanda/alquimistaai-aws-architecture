'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/lib/constants';
import { getUsageOverview, type UsageOverview } from '@/lib/api/internal-client';
import { Building2, LogOut, TrendingUp, Users, Activity, Menu } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { extractClaims } from '@/lib/auth-utils';
import { useMobileMenu } from '@/hooks/use-mobile-menu';

export function CompanyHeader() {
  const [overview, setOverview] = useState<UsageOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const { logout, claims } = useAuthStore();
  const userClaims = claims;
  const { isMobile, toggleMobileMenu } = useMobileMenu();

  useEffect(() => {
    async function loadOverview() {
      try {
        const data = await getUsageOverview('7d');
        setOverview(data);
      } catch (error) {
        console.error('Erro ao carregar visão geral:', error);
      } finally {
        setLoading(false);
      }
    }

    loadOverview();
  }, []);

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

          <Link href={ROUTES.COMPANY_OVERVIEW} className="flex items-center space-x-2">
            <span className="text-xl sm:text-2xl font-bold text-primary">
              AlquimistaAI
            </span>
            <Badge variant="outline" className="bg-purple-500 text-white border-none text-xs sm:text-sm">
              Operacional
            </Badge>
          </Link>
          
          {userClaims && (
            <div className="hidden sm:flex items-center space-x-3 border-l pl-4">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{userClaims.email}</span>
                <span className="text-xs text-muted-foreground">
                  {userClaims['cognito:groups']?.includes('INTERNAL_ADMIN') ? 'Admin' : 'Suporte'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {!loading && overview && (
            <div className="hidden lg:flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <div className="flex flex-col items-end">
                  <span className="font-medium">
                    {overview.global_stats.active_tenants}
                  </span>
                  <span className="text-xs">Tenants Ativos</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <div className="flex flex-col items-end">
                  <span className="font-medium">
                    {overview.global_stats.total_requests.toLocaleString()}
                  </span>
                  <span className="text-xs">Requisições (7d)</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <div className="flex flex-col items-end">
                  <span className="font-medium">
                    {overview.global_stats.global_success_rate.toFixed(1)}%
                  </span>
                  <span className="text-xs">Taxa de Sucesso</span>
                </div>
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
