'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ArrowUpDown, Eye, Edit } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import type { Tenant, ListTenantsParams } from '@/lib/api/internal-client';

interface TenantsTableProps {
  tenants: Tenant[];
  total: number;
  loading: boolean;
  filters: ListTenantsParams;
  onPageChange: (offset: number) => void;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

export function TenantsTable({ 
  tenants, 
  total, 
  loading, 
  filters, 
  onPageChange, 
  onSortChange 
}: TenantsTableProps) {
  const [sortBy, setSortBy] = useState(filters.sort_by || 'name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(filters.sort_order || 'asc');

  const handleSort = (column: string) => {
    const newSortOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(column);
    setSortOrder(newSortOrder);
    onSortChange(column, newSortOrder);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500 text-white';
      case 'inactive':
        return 'bg-gray-500 text-white';
      case 'suspended':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
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

  const currentPage = Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1;
  const totalPages = Math.ceil(total / (filters.limit || 50));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground mb-2">Nenhum tenant encontrado</p>
        <p className="text-sm text-muted-foreground">
          Tente ajustar os filtros de busca
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('name')}
                  className="flex items-center space-x-1"
                >
                  <span>Nome</span>
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Segmento</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('mrr_estimate')}
                  className="flex items-center space-x-1"
                >
                  <span>MRR</span>
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Agentes</TableHead>
              <TableHead>Uso (30d)</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell className="font-medium">{tenant.name}</TableCell>
                <TableCell className="text-muted-foreground">{tenant.cnpj}</TableCell>
                <TableCell>{tenant.segment}</TableCell>
                <TableCell>
                  <Badge variant="outline">{tenant.plan}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(tenant.status)}>
                    {getStatusLabel(tenant.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  R$ {tenant.mrr_estimate.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell>{tenant.active_agents}</TableCell>
                <TableCell>{tenant.requests_last_30_days.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Link href={`${ROUTES.COMPANY_TENANTS}/${tenant.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {((filters.offset || 0) + 1)} a {Math.min((filters.offset || 0) + (filters.limit || 50), total)} de {total} tenants
        </p>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange((filters.offset || 0) - (filters.limit || 50))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange((filters.offset || 0) + (filters.limit || 50))}
            disabled={currentPage === totalPages}
          >
            Próxima
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
