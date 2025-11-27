'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Bot, 
  Activity, 
  Settings,
  AlertTriangle,
  BarChart3
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/app/company',
    icon: LayoutDashboard,
  },
  {
    name: 'Agentes',
    href: '/app/company/agents',
    icon: Bot,
  },
  {
    name: 'Uso & Métricas',
    href: '/app/company/usage',
    icon: BarChart3,
  },
  {
    name: 'Incidentes',
    href: '/app/company/incidents',
    icon: AlertTriangle,
  },
  {
    name: 'Integrações',
    href: '/app/company/integrations',
    icon: Activity,
  },
  {
    name: 'Configurações',
    href: '/app/company/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white border-r min-h-screen">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900">
          Painel da Empresa
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Dashboard Operacional
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
                  ? 'bg-blue-50 text-blue-700'
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
