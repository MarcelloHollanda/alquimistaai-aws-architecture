'use client';

import { useState } from 'react';
import { IntegrationsMap } from '@/components/company/integrations-map';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

// Mock data
const mockIntegrations = [
  { type: 'email', name: 'Gmail', tenant_count: 45, status: 'active' },
  { type: 'email', name: 'Outlook', tenant_count: 32, status: 'active' },
  { type: 'whatsapp', name: 'WhatsApp Business', tenant_count: 38, status: 'active' },
  { type: 'crm', name: 'Salesforce', tenant_count: 15, status: 'active' },
  { type: 'crm', name: 'HubSpot', tenant_count: 22, status: 'active' },
  { type: 'calendar', name: 'Google Calendar', tenant_count: 28, status: 'active' },
  { type: 'calendar', name: 'Outlook Calendar', tenant_count: 18, status: 'active' },
  { type: 'payment', name: 'Stripe', tenant_count: 12, status: 'active' },
];

export default function CompanyIntegrationsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredIntegrations = mockIntegrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || integration.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mapa de Integrações</h1>
        <p className="text-muted-foreground mt-2">
          Visão agregada de todas as integrações configuradas pelos tenants
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar integração..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="email">E-mail</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="crm">CRM</SelectItem>
            <SelectItem value="calendar">Calendário</SelectItem>
            <SelectItem value="payment">Pagamento</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mapa de Integrações */}
      <IntegrationsMap integrations={filteredIntegrations} />
    </div>
  );
}
