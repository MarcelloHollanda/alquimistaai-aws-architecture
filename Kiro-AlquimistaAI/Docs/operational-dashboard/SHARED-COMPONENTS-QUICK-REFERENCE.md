# Guia Rápido - Componentes Compartilhados

## 🚀 Início Rápido

```tsx
import { 
  MetricsCard, 
  StatusBadge, 
  DataTable, 
  LineChart 
} from '@/components/shared';
```

## 📊 MetricsCard

```tsx
<MetricsCard
  title="Tenants Ativos"
  value={47}
  change={3}
  trend="up"
  icon={<Users />}
/>
```

**Props principais:**
- `value`: number | string
- `change`: number (percentual)
- `trend`: 'up' | 'down' | 'neutral'
- `loading`: boolean

## 🏷️ StatusBadge

```tsx
<StatusBadge status="active" />
<StatusBadge status="running" />
<StatusBadge status="error" />
```

**Status disponíveis:**
- active, inactive, pending
- error, success, warning
- suspended, running, completed, failed

## 📋 DataTable

```tsx
const columns: Column<T>[] = [
  { key: 'name', label: 'Nome', sortable: true },
  { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
];

<DataTable
  data={items}
  columns={columns}
  sortable
  filterable
  pagination={{ total, pageSize, currentPage, onPageChange }}
/>
```

## 📈 LineChart

```tsx
<LineChart
  data={data}
  title="Tendência"
  dataKeys={['requests', 'errors']}
  curved
  showDots
/>
```

## 📊 BarChart

```tsx
<BarChart
  data={data}
  title="Comparação"
  dataKeys={['value']}
  horizontal
/>
```

## 🍩 DonutChart

```tsx
<DonutChart
  data={[
    { name: 'A', value: 30 },
    { name: 'B', value: 70 },
  ]}
  title="Distribuição"
  centerLabel="Total"
  centerValue={100}
/>
```

## 🎨 Cores AlquimistaAI

```typescript
const COLORS = [
  '#FF6B35', // Laranja
  '#004E89', // Azul
  '#10B981', // Verde
  '#F59E0B', // Amarelo
  '#8B5CF6', // Roxo
  '#EC4899', // Rosa
];
```

## 📱 Responsividade

Todos os componentes são responsivos:
- Mobile: ≥ 320px
- Tablet: ≥ 768px
- Desktop: ≥ 1024px

## 🔄 Estados

Todos suportam:
- `loading={true}` - Skeleton animado
- `error="mensagem"` - Exibe erro
- Dados vazios - Mensagem apropriada

## 💡 Dicas

1. Use `formatYAxis` e `formatTooltip` para formatar números
2. Combine `MetricsCard` com ícones do `lucide-react`
3. Use `render` em colunas para customizar células
4. Prefira `DataTable` para listas grandes (>50 itens)
5. Use `DonutChart` para proporções e percentuais

## 📚 Documentação Completa

Ver: `frontend/src/components/shared/README.md`

## 🎯 Exemplos Práticos

Ver: `frontend/src/components/shared/examples.tsx`
