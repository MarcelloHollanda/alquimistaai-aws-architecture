'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Building, 
  Bot, 
  Activity, 
  DollarSign,
  Terminal,
  AlertTriangle,
  BarChart3,
  Settings
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard Global',
    href: '/app/internal',
    icon: LayoutDashboard,
  },
  {
    name: 'Tenants',
    href: '/app/internal/tenants',
    icon: Building,
  },
  {
    name: 'Agentes',
    href: '/app/internal/agents',
    icon: Bot,
  },
  {
    name: 'Uso da Plataforma',
    href: '/app/internal/usage',
    icon: BarChart3,
  },
  {
    name: 'Financeiro',
    href: '/app/internal/billing',
    icon: DollarSign,
  },
  {
    name: 'Operações',
    href: '/app/internal/operations',
    icon: Terminal,
  },
  {
    name: 'Incidentes',
    href: '/app/internal/incidents',
    icon: AlertTriangle,
  },
  {
    name: 'Monitoramento',
    href: '/app/internal/monitoring',
    icon: Activity,
  },
  {
    name: 'Configurações',
    href: '/app/internal/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white border-r min-h-screen">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900">
          Painel Interno
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Gestão da Plataforma
        </p>
      </div>

      <nav className="px-3 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
