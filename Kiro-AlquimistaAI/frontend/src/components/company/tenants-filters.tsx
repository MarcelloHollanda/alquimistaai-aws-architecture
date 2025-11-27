'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import type { ListTenantsParams } from '@/lib/api/internal-client';

interface TenantsFiltersProps {
  filters: ListTenantsParams;
  onFilterChange: (filters: Partial<ListTenantsParams>) => void;
}

export function TenantsFilters({ filters, onFilterChange }: TenantsFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou CNPJ..."
          value={filters.search || ''}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          className="pl-10"
        />
      </div>

      <Select
        value={filters.status || 'active'}
        onValueChange={(value) => onFilterChange({ status: value as any })}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="active">Ativos</SelectItem>
          <SelectItem value="inactive">Inativos</SelectItem>
          <SelectItem value="suspended">Suspensos</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.plan || 'all'}
        onValueChange={(value) => onFilterChange({ plan: value === 'all' ? undefined : value })}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Plano" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Planos</SelectItem>
          <SelectItem value="starter">Starter</SelectItem>
          <SelectItem value="professional">Professional</SelectItem>
          <SelectItem value="business">Business</SelectItem>
          <SelectItem value="enterprise">Enterprise</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.segment || 'all'}
        onValueChange={(value) => onFilterChange({ segment: value === 'all' ? undefined : value })}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Segmento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Segmentos</SelectItem>
          <SelectItem value="saude">Saúde</SelectItem>
          <SelectItem value="educacao">Educação</SelectItem>
          <SelectItem value="varejo">Varejo</SelectItem>
          <SelectItem value="servicos">Serviços</SelectItem>
          <SelectItem value="tecnologia">Tecnologia</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
