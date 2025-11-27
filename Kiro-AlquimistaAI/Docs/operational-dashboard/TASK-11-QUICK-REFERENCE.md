# 🚀 Task 11 - Guia Rápido de Referência

## Importações Rápidas

### Tenant Client

```typescript
// Importar cliente completo
import { tenantClient } from '@/lib/api/tenant-client';

// Importar funções individuais
import { 
  getTenantMe, 
  getTenantAgents, 
  getTenantUsage 
} from '@/lib/api/tenant-client';

// Importar tipos
import type { 
  TenantInfo, 
  TenantAgent, 
  TenantUsageResponse 
} from '@/lib/api/tenant-client';

// Importar erro
import { TenantApiError } from '@/lib/api/tenant-client';
```

### Internal Client

```typescript
// Importar cliente completo
import { internalClient } from '@/lib/api/internal-client';

// Importar funções individuais
import { 
  listTenants, 
  getTenantDetail, 
  createOperationalCommand 
} from '@/lib/api/internal-client';

// Importar tipos
import type { 
  TenantListItem, 
  TenantDetail, 
  UsageOverview 
} from '@/lib/api/internal-client';

// Importar erro
import { InternalApiError } from '@/lib/api/internal-client';
```

### Usando o Índice

```typescript
// Importar tudo de uma vez
import { 
  tenantClient, 
  internalClient, 
  isApiError, 
  getErrorMessage 
} from '@/lib/api';
```

## Uso Rápido

### 1. Buscar Informações do Tenant

```typescript
const info = await tenantClient.getTenantMe(token);
```

### 2. Listar Agentes

```typescript
// Agentes ativos
const agents = await tenantClient.getTenantAgents('active', token);

// Todos os agentes
const allAgents = await tenantClient.getTenantAgents('all', token);
```

### 3. Buscar Métricas de Uso

```typescript
// Últimos 30 dias
const usage = await tenantClient.getTenantUsage('30d', undefined, token);

// Últimos 7 dias, filtrado por agente
const agentUsage = await tenantClient.getTenantUsage('7d', 'agent-id', token);
```

### 4. Listar Tenants (Interno)

```typescript
const response = await internalClient.listTenants({
  status: 'active',
  limit: 50,
  offset: 0,
  sort_by: 'name',
  sort_order: 'asc'
}, token);
```

### 5. Criar Comando Operacional

```typescript
const command = await internalClient.createOperationalCommand({
  command_type: 'HEALTH_CHECK',
  tenant_id: 'tenant-id',
  parameters: { check_type: 'full' }
}, token);
```

## Tratamento de Erros

### Padrão Básico

```typescript
try {
  const data = await tenantClient.getTenantMe(token);
  // Usar dados
} catch (error) {
  if (error instanceof TenantApiError) {
    console.error('Erro:', error.message);
    console.error('Código:', error.code);
  }
}
```

### Tratamento por Código

```typescript
try {
  const data = await tenantClient.getTenantMe(token);
} catch (error) {
  if (error instanceof TenantApiError) {
    switch (error.code) {
      case 'UNAUTHORIZED':
        // Redirecionar para login
        router.push('/auth/login');
        break;
      case 'FORBIDDEN':
        // Mostrar mensagem de permissão
        toast.error('Você não tem permissão');
        break;
      case 'NOT_FOUND':
        // Recurso não encontrado
        toast.error('Recurso não encontrado');
        break;
      default:
        toast.error(error.message);
    }
  }
}
```

### Usando Utilitários

```typescript
import { isApiError, isAuthError, getErrorMessage } from '@/lib/api';

try {
  const data = await tenantClient.getTenantMe(token);
} catch (error) {
  if (isAuthError(error)) {
    router.push('/auth/login');
  } else if (isApiError(error)) {
    toast.error(getErrorMessage(error));
  }
}
```

## Hooks Customizados

### Hook para Tenant Info

```typescript
function useTenantInfo() {
  const [data, setData] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<TenantApiError | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const info = await tenantClient.getTenantMe();
        setData(info);
      } catch (err) {
        if (err instanceof TenantApiError) {
          setError(err);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { data, loading, error };
}
```

### Hook para Lista de Tenants

```typescript
function useTenantsList(params: TenantsListParams) {
  const [data, setData] = useState<TenantsListResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const response = await internalClient.listTenants(params);
        setData(response);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params]);

  return { data, loading };
}
```

## React Query

### Setup

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* ... */}
    </QueryClientProvider>
  );
}
```

### Query para Tenant Info

```typescript
import { useQuery } from '@tanstack/react-query';
import { tenantClient } from '@/lib/api/tenant-client';

function useTenantInfo(token: string) {
  return useQuery({
    queryKey: ['tenant', 'me'],
    queryFn: () => tenantClient.getTenantMe(token),
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
  });
}

// Uso
const { data, isLoading, error } = useTenantInfo(token);
```

### Query para Lista de Tenants

```typescript
function useTenantsList(params: TenantsListParams, token: string) {
  return useQuery({
    queryKey: ['tenants', 'list', params],
    queryFn: () => internalClient.listTenants(params, token),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}
```

### Mutation para Criar Comando

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

function useCreateCommand(token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateCommandRequest) =>
      internalClient.createOperationalCommand(request, token),
    onSuccess: () => {
      // Invalidar cache de comandos
      queryClient.invalidateQueries({ queryKey: ['commands'] });
    },
  });
}

// Uso
const { mutate, isPending } = useCreateCommand(token);

mutate({
  command_type: 'HEALTH_CHECK',
  parameters: {}
});
```

## Componentes de Exemplo

### Loading State

```typescript
function TenantDashboard() {
  const [info, setInfo] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await tenantClient.getTenantMe();
        setInfo(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div>Carregando...</div>;
  }

  return <div>{info?.name}</div>;
}
```

### Error State

```typescript
function TenantDashboard() {
  const [info, setInfo] = useState<TenantInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await tenantClient.getTenantMe();
        setInfo(data);
      } catch (err) {
        if (err instanceof TenantApiError) {
          setError(err.message);
        }
      }
    }
    load();
  }, []);

  if (error) {
    return <div>Erro: {error}</div>;
  }

  return <div>{info?.name}</div>;
}
```

## Variáveis de Ambiente

```env
# Desenvolvimento
NEXT_PUBLIC_API_URL=https://c5loeivg0k.execute-api.us-east-1.amazonaws.com

# Produção
NEXT_PUBLIC_API_URL=https://ogsd1547nd.execute-api.us-east-1.amazonaws.com
```

## Códigos de Status HTTP

| Código | Significado | Ação |
|--------|-------------|------|
| 200 | OK | Sucesso |
| 400 | Bad Request | Validar dados |
| 401 | Unauthorized | Redirecionar para login |
| 403 | Forbidden | Mostrar erro de permissão |
| 404 | Not Found | Recurso não encontrado |
| 500 | Internal Server Error | Retry automático |

## Tipos Principais

### Tenant Client

```typescript
TenantInfo
TenantAgent
TenantIntegration
TenantUsageResponse
TenantIncidentsResponse
TenantApiError
```

### Internal Client

```typescript
TenantListItem
TenantDetail
TenantAgentDetail
UsageOverview
BillingOverview
OperationalCommand
InternalApiError
```

## Comandos Úteis

```bash
# Executar testes
npm test tenant-client.test.ts

# Verificar tipos
npx tsc --noEmit

# Build
npm run build
```

## Links Úteis

- [README Completo](./README.md)
- [Exemplos de Uso](../../frontend/src/lib/api/example-usage.tsx)
- [Design Document](../../.kiro/specs/operational-dashboard-alquimistaai/design.md)
- [Requirements Document](../../.kiro/specs/operational-dashboard-alquimistaai/requirements.md)

## Suporte

Para dúvidas ou problemas:
1. Consulte o README completo
2. Veja os exemplos de uso
3. Verifique a documentação do design
4. Consulte os testes de exemplo
