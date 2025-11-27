'use client';

import { useState, useMemo } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Search,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  // Paginação
  pagination?: {
    total: number;
    pageSize: number;
    currentPage: number;
    onPageChange: (page: number) => void;
  };
  // Ordenação
  sortable?: boolean;
  defaultSortKey?: string;
  defaultSortOrder?: 'asc' | 'desc';
  onSortChange?: (key: string, order: 'asc' | 'desc') => void;
  // Filtros
  filterable?: boolean;
  onFilterChange?: (filters: Record<string, string>) => void;
  // Estilo
  className?: string;
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  error,
  emptyMessage = 'Nenhum dado encontrado',
  pagination,
  sortable = false,
  defaultSortKey,
  defaultSortOrder = 'asc',
  onSortChange,
  filterable = false,
  onFilterChange,
  className,
  striped = false,
  hoverable = true,
  compact = false,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(defaultSortKey || null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(defaultSortOrder);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  // Ordenação local
  const sortedData = useMemo(() => {
    if (!sortKey || onSortChange) return data; // Se tem callback externo, não ordena localmente

    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal === bVal) return 0;
      
      const comparison = aVal < bVal ? -1 : 1;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [data, sortKey, sortOrder, onSortChange]);

  // Filtros locais
  const filteredData = useMemo(() => {
    if (Object.keys(filters).length === 0 || onFilterChange) return sortedData;

    return sortedData.filter(row => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const cellValue = String(row[key] || '').toLowerCase();
        return cellValue.includes(value.toLowerCase());
      });
    });
  }, [sortedData, filters, onFilterChange]);

  const handleSort = (key: string) => {
    const newOrder = sortKey === key && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortOrder(newOrder);
    
    if (onSortChange) {
      onSortChange(key, newOrder);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const clearFilter = (key: string) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);
    
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const getSortIcon = (columnKey: string) => {
    if (sortKey !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp className="h-4 w-4" />
      : <ArrowDown className="h-4 w-4" />;
  };

  // Loading state
  if (loading) {
    return (
      <div className={cn('rounded-md border', className)}>
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('rounded-md border border-destructive bg-destructive/10 p-4', className)}>
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  // Empty state
  if (filteredData.length === 0) {
    return (
      <div className={cn('rounded-md border', className)}>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">{emptyMessage}</p>
          {Object.keys(filters).length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setFilters({});
                if (onFilterChange) onFilterChange({});
              }}
            >
              Limpar filtros
            </Button>
          )}
        </div>
      </div>
    );
  }

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1;
  const currentPage = pagination?.currentPage || 1;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filtros */}
      {filterable && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Search className="h-4 w-4 mr-2" />
            {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
          </Button>
        </div>
      )}

      {showFilters && filterable && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          {columns.filter(col => col.filterable).map(column => (
            <div key={column.key} className="relative">
              <Input
                placeholder={`Filtrar por ${column.label}`}
                value={filters[column.key] || ''}
                onChange={(e) => handleFilterChange(column.key, e.target.value)}
                className="pr-8"
              />
              {filters[column.key] && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => clearFilter(column.key)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tabela - Responsiva com scroll horizontal em mobile */}
      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead 
                  key={column.key}
                  className={cn('whitespace-nowrap', column.headerClassName)}
                >
                  {column.sortable || sortable ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort(column.key)}
                      className="flex items-center gap-1 -ml-3 h-8 touch-manipulation"
                    >
                      <span className="text-xs sm:text-sm">{column.label}</span>
                      {getSortIcon(column.key)}
                    </Button>
                  ) : (
                    <span className="text-xs sm:text-sm">{column.label}</span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((row, rowIndex) => (
              <TableRow 
                key={rowIndex}
                className={cn(
                  striped && rowIndex % 2 === 1 && 'bg-muted/50',
                  hoverable && 'hover:bg-muted/50 active:bg-muted',
                  compact && 'h-10'
                )}
              >
                {columns.map((column) => (
                  <TableCell 
                    key={column.key}
                    className={cn('whitespace-nowrap text-xs sm:text-sm', column.className)}
                  >
                    {column.render 
                      ? column.render(row[column.key], row)
                      : row[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Paginação - Responsiva */}
      {pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs sm:text-sm text-muted-foreground">
            <span className="hidden sm:inline">Mostrando </span>
            {((currentPage - 1) * pagination.pageSize) + 1}-
            {Math.min(currentPage * pagination.pageSize, pagination.total)} de{' '}
            {pagination.total}
            <span className="hidden sm:inline"> resultados</span>
          </p>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0 touch-manipulation"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0 touch-manipulation"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-xs sm:text-sm text-muted-foreground px-2 whitespace-nowrap">
              Pág. {currentPage}/{totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0 touch-manipulation"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0 touch-manipulation"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
