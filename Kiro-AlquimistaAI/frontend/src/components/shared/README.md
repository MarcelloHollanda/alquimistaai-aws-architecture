# Componentes Compartilhados - Painel Operacional AlquimistaAI

Este diretório contém componentes reutilizáveis que seguem a identidade visual da AlquimistaAI e são utilizados tanto no Dashboard do Cliente quanto no Painel Operacional Interno.

## Componentes de Métricas

### MetricsCard

Card para exibir métricas com animação de contador e indicadores de tendência.

**Props:**
- `title`: Título da métrica
- `value`: Valor numérico ou string
- `change`: Percentual de mudança (opcional)
- `icon`: Ícone React (opcional)
- `trend`: 'up' | 'down' | 'neutral' (opcional)
- `suffix`: Sufixo do valor (opcional, ex: '%')
- `prefix`: Prefixo do valor (opcional, ex: 'R$')
- `description`: Descrição adicional (opcional)
- `loading`: Estado de carregamento (opcional)
- `animated`: Habilitar animação de contador (padrão: true)

**Exemplo:**
```tsx
import { MetricsCard } from '@/components/shared';
import { Users } from 'lucide-react';

<MetricsCard
  title="Tenants Ativos"
  value={47}
  change={3}
  trend="up"
  icon={<Users className="h-4 w-4" />}
  description="Total de clientes ativos"
/>
```

### UsageChart

Gráfico de uso com suporte a linha, barra e área.

**Props:**
- `type`: 'line' | 'bar' | 'area' (padrão: 'line')
- `data`: Array de dados
- `title`: Título do gráfico
- `description`: Descrição (opcional)
- `dataKeys`: Array de chaves de dados a exibir
- `xAxisKey`: Chave para eixo X (padrão: 'name')
- `colors`: Array de cores (opcional)
- `loading`: Estado de carregamento (opcional)
- `height`: Altura do gráfico (padrão: 300)
- `showLegend`: Mostrar legenda (padrão: true)
- `showGrid`: Mostrar grade (padrão: true)
- `formatYAxis`: Função para formatar eixo Y (opcional)
- `formatTooltip`: Função para formatar tooltip (opcional)

**Exemplo:**
```tsx
import { UsageChart } from '@/components/shared';

const data = [
  { name: 'Jan', requests: 4000, errors: 240 },
  { name: 'Fev', requests: 3000, errors: 139 },
  { name: 'Mar', requests: 2000, errors: 980 },
];

<UsageChart
  type="line"
  data={data}
  title="Requisições Mensais"
  description="Total de requisições e erros por mês"
  dataKeys={['requests', 'errors']}
  formatYAxis={(value) => value.toLocaleString('pt-BR')}
/>
```

### StatusBadge

Badge para exibir status com cores e ícones apropriados.

**Props:**
- `status`: Status (ex: 'active', 'inactive', 'pending', 'error', etc.)
- `label`: Label customizado (opcional)
- `showIcon`: Mostrar ícone (padrão: true)
- `size`: 'sm' | 'md' | 'lg' (padrão: 'md')

**Status suportados:**
- `active`: Verde - Ativo
- `inactive`: Cinza - Inativo
- `pending`: Amarelo - Pendente
- `error`: Vermelho - Erro
- `success`: Verde - Sucesso
- `warning`: Laranja - Atenção
- `suspended`: Vermelho escuro - Suspenso
- `running`: Azul (animado) - Executando
- `completed`: Verde - Concluído
- `failed`: Vermelho - Falhou

**Exemplo:**
```tsx
import { StatusBadge, TenantStatusBadge } from '@/components/shared';

<StatusBadge status="active" />
<StatusBadge status="running" label="Em execução" />
<TenantStatusBadge status="active" />
```

## Componente de Tabela

### DataTable

Tabela de dados com suporte a ordenação, filtros e paginação.

**Props:**
- `data`: Array de dados
- `columns`: Array de definições de colunas
- `loading`: Estado de carregamento (opcional)
- `error`: Mensagem de erro (opcional)
- `emptyMessage`: Mensagem quando vazio (opcional)
- `pagination`: Configuração de paginação (opcional)
- `sortable`: Habilitar ordenação (padrão: false)
- `defaultSortKey`: Chave de ordenação padrão (opcional)
- `defaultSortOrder`: Ordem padrão 'asc' | 'desc' (opcional)
- `onSortChange`: Callback de mudança de ordenação (opcional)
- `filterable`: Habilitar filtros (padrão: false)
- `onFilterChange`: Callback de mudança de filtros (opcional)
- `striped`: Linhas zebradas (padrão: false)
- `hoverable`: Efeito hover (padrão: true)
- `compact`: Modo compacto (padrão: false)

**Definição de Coluna:**
```typescript
interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}
```

**Exemplo:**
```tsx
import { DataTable, Column } from '@/components/shared';
import { StatusBadge } from '@/components/shared';

interface Tenant {
  id: string;
  name: string;
  status: string;
  mrr: number;
}

const columns: Column<Tenant>[] = [
  {
    key: 'name',
    label: 'Nome',
    sortable: true,
    filterable: true,
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (value) => <StatusBadge status={value} />,
  },
  {
    key: 'mrr',
    label: 'MRR',
    sortable: true,
    render: (value) => `R$ ${value.toLocaleString('pt-BR')}`,
  },
];

<DataTable
  data={tenants}
  columns={columns}
  sortable
  filterable
  pagination={{
    total: 100,
    pageSize: 20,
    currentPage: 1,
    onPageChange: (page) => console.log(page),
  }}
/>
```

## Componentes de Gráficos

### LineChart

Gráfico de linhas com tema AlquimistaAI.

**Props:**
- `data`: Array de dados
- `title`: Título (opcional)
- `description`: Descrição (opcional)
- `dataKeys`: Array de chaves de dados
- `xAxisKey`: Chave para eixo X (padrão: 'name')
- `colors`: Array de cores (opcional)
- `loading`: Estado de carregamento (opcional)
- `height`: Altura (padrão: 300)
- `showLegend`: Mostrar legenda (padrão: true)
- `showGrid`: Mostrar grade (padrão: true)
- `formatYAxis`: Função para formatar eixo Y (opcional)
- `formatTooltip`: Função para formatar tooltip (opcional)
- `curved`: Linhas curvas (padrão: true)
- `showDots`: Mostrar pontos (padrão: true)

**Exemplo:**
```tsx
import { LineChart } from '@/components/shared';

<LineChart
  data={data}
  title="Tendência de Uso"
  dataKeys={['requests', 'errors']}
  curved
  showDots
/>
```

### BarChart

Gráfico de barras com tema AlquimistaAI.

**Props:**
- Similar ao LineChart, com adições:
- `stacked`: Barras empilhadas (padrão: false)
- `horizontal`: Orientação horizontal (padrão: false)

**Exemplo:**
```tsx
import { BarChart } from '@/components/shared';

<BarChart
  data={data}
  title="Uso por Agente"
  dataKeys={['requests']}
  horizontal
/>
```

### DonutChart

Gráfico de rosca (donut) com tema AlquimistaAI.

**Props:**
- `data`: Array de dados com `name` e `value`
- `title`: Título (opcional)
- `description`: Descrição (opcional)
- `colors`: Array de cores (opcional)
- `loading`: Estado de carregamento (opcional)
- `height`: Altura (padrão: 300)
- `showLegend`: Mostrar legenda (padrão: true)
- `showLabels`: Mostrar labels (padrão: true)
- `formatValue`: Função para formatar valores (opcional)
- `innerRadius`: Raio interno (padrão: 60)
- `outerRadius`: Raio externo (padrão: 80)
- `centerLabel`: Label no centro (opcional)
- `centerValue`: Valor no centro (opcional)

**Exemplo:**
```tsx
import { DonutChart } from '@/components/shared';

const data = [
  { name: 'Starter', value: 30 },
  { name: 'Professional', value: 50 },
  { name: 'Enterprise', value: 20 },
];

<DonutChart
  data={data}
  title="Distribuição por Plano"
  centerLabel="Total"
  centerValue={100}
/>
```

## Identidade Visual AlquimistaAI

### Cores Padrão

Os componentes utilizam as seguintes cores por padrão:

- **Laranja AlquimistaAI**: `#FF6B35`
- **Azul AlquimistaAI**: `#004E89`
- **Verde**: `#10B981`
- **Amarelo**: `#F59E0B`
- **Roxo**: `#8B5CF6`
- **Rosa**: `#EC4899`

### Responsividade

Todos os componentes são responsivos e se adaptam a diferentes tamanhos de tela:

- **Mobile**: ≥ 320px
- **Tablet**: ≥ 768px
- **Desktop**: ≥ 1024px

### Estados

Todos os componentes suportam os seguintes estados:

- **Loading**: Skeleton com animação de pulse
- **Empty**: Mensagem quando não há dados
- **Error**: Mensagem de erro com estilo apropriado

## Boas Práticas

1. **Sempre forneça `loading` state** para melhor UX
2. **Use `formatYAxis` e `formatTooltip`** para formatar números adequadamente
3. **Forneça `description`** para contexto adicional
4. **Use cores consistentes** com a identidade AlquimistaAI
5. **Teste responsividade** em diferentes tamanhos de tela

## Requisitos Validados

- ✅ **Requisito 10.1**: Reutilização de paleta de cores AlquimistaAI
- ✅ **Requisito 10.2**: Reutilização de tipografia existente
- ✅ **Requisito 10.3**: Reutilização de componentes UI (shadcn/ui)
- ✅ **Requisito 9.5**: Gráficos de linha para tendências temporais
- ✅ **Requisito 9.6**: Gráficos de barra para comparações
- ✅ **Requisito 12.3**: Paginação em listas
- ✅ **Requisito 13.1**: Ordenação de dados
- ✅ **Requisito 13.2**: Métricas customizadas no CloudWatch
