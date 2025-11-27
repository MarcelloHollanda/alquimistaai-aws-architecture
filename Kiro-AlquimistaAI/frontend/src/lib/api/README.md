# Clientes HTTP - Painel Operacional AlquimistaAI

Este diretório contém os clientes HTTP para as APIs do Painel Operacional AlquimistaAI.

## Estrutura

```
api/
├── tenant-client.ts      # Cliente para APIs de tenant (/tenant/*)
├── internal-client.ts    # Cliente para APIs internas (/internal/*)
└── README.md            # Este arquivo
```

## Clientes Disponíveis

### 1. Tenant Client (`tenant-client.ts`)

Cliente para APIs específicas de clientes (tenants). Fornece acesso aos dados e funcionalidades do dashboard do cliente.

**Endpoints:**
- `GET /tenant/me` - Informações da empresa
- `GET /tenant/agents` - Agentes contratados
- `GET /tenant/integrations` - Integrações configuradas
- `GET /tenant/usage` - Métricas de uso
- `GET /tenant/incidents` - Incidentes

**Exemplo de uso:**

```typescript
import { tenantClient, TenantApiError } from '@/lib/api/tenant-client';

// Buscar informações do tenant
try {
  const tenantInfo = await tenantClient.getTenantMe(token);
  console.log('Tenant:', tenantInfo.name);
} catch (error) {
  if (error instanceof TenantApiError) {
    console.error('Erro:', error.message, error.code);
  }
}

// Buscar agentes ativos
const agents = await tenantClient.getTenantAgents('active', token);

// Buscar métricas de uso dos últimos 30 dias
const usage = await tenantClient.getTenantUsage('30d', undefined, token);
```

### 2. Internal Client (`internal-client.ts`)

Cliente para APIs internas da equipe AlquimistaAI. Fornece visão global de todos os tenants e funcionalidades operacionais.

**Endpoints:**
- `GET /internal/tenants` - Lista de todos os tenants
- `GET /internal/tenants/{id}` - Detalhes de um tenant
- `GET /internal/tenants/{id}/agents` - Agentes de um tenant
- `GET /internal/usage/overview` - Visão global de uso
- `GET /internal/billing/overview` - Visão financeira
- `POST /internal/operations/commands` - Criar comando operacional
- `GET /internal/operations/commands` - Listar comandos

**Exemplo de uso:**

```typescript
import { internalClient, InternalApiError } from '@/lib/api/internal-client';

// Listar tenants ativos
try {
  const response = await internalClient.listTenants({
    status: 'active',
    limit: 50,
    offset: 0,
    sort_by: 'name',
    sort_order: 'asc'
  }, token);
  
  console.log('Total de tenants:', response.total);
  console.log('Tenants:', response.tenants);
} catch (error) {
  if (error instanceof InternalApiError) {
    console.error('Erro:', error.message, error.code);
  }
}

// Buscar detalhes de um tenant
const tenantDetail = await internalClient.getTenantDetail('tenant-id', token);

// Criar comando operacional
const command = await internalClient.createOperationalCommand({
  command_type: 'HEALTH_CHECK',
  tenant_id: 'tenant-id',
  parameters: { check_type: 'full' }
}, token);
```

## Características

### ✅ Tratamento de Erros

Ambos os clientes possuem classes de erro customizadas:
- `TenantApiError` - Para erros do tenant client
- `InternalApiError` - Para erros do internal client

Códigos de erro comuns:
- `UNAUTHORIZED` (401) - Sessão expirada
- `FORBIDDEN` (403) - Sem permissão
- `NOT_FOUND` (404) - Recurso não encontrado
- `VALIDATION_ERROR` (400) - Dados inválidos
- `NETWORK_ERROR` - Erro de conexão
- `API_ERROR` - Erro genérico da API
- `UNKNOWN_ERROR` - Erro desconhecido

### ✅ Retry Logic

Implementação de retry com backoff exponencial:
- Máximo de 3 tentativas
- Delays: 1s, 2s, 4s
- Retry apenas para erros 5xx (servidor)
- Sem retry para erros 4xx (cliente)

### ✅ TypeScript

Todos os tipos e interfaces estão completamente tipados:
- Requests
- Responses
- Parâmetros
- Erros

### ✅ Autenticação

Suporte para token JWT:
- Passado como parâmetro opcional
- Incluído no header `Authorization: Bearer {token}`
- Suporte a `credentials: 'include'` para cookies

## Configuração

### Variáveis de Ambiente

```env
# URL base da API
NEXT_PUBLIC_API_URL=https://api.alquimista.ai

# Desenvolvimento
NEXT_PUBLIC_API_URL=https://c5loeivg0k.execute-api.us-east-1.amazonaws.com

# Produção
NEXT_PUBLIC_API_URL=https://ogsd1547nd.execute-api.us-east-1.amazonaws.com
```

## Boas Práticas

### 1. Sempre tratar erros

```typescript
try {
  const data = await tenantClient.getTenantMe(token);
  // Usar dados
} catch (error) {
  if (error instanceof TenantApiError) {
    // Tratar erro específico
    if (error.code === 'UNAUTHORIZED') {
      // Redirecionar para login
    }
  }
}
```

### 2. Usar tipos TypeScript

```typescript
import type { TenantInfo, TenantAgent } from '@/lib/api/tenant-client';

const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
const [agents, setAgents] = useState<TenantAgent[]>([]);
```

### 3. Implementar loading states

```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

async function loadData() {
  setLoading(true);
  setError(null);
  
  try {
    const data = await tenantClient.getTenantMe(token);
    // Processar dados
  } catch (error) {
    if (error instanceof TenantApiError) {
      setError(error.message);
    }
  } finally {
    setLoading(false);
  }
}
```

### 4. Cache de dados

Considere usar React Query ou SWR para cache automático:

```typescript
import { useQuery } from '@tanstack/react-query';
import { tenantClient } from '@/lib/api/tenant-client';

function useTenantInfo(token: string) {
  return useQuery({
    queryKey: ['tenant', 'me'],
    queryFn: () => tenantClient.getTenantMe(token),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
```

## Testes

### Exemplo de teste unitário

```typescript
import { tenantClient, TenantApiError } from '@/lib/api/tenant-client';

describe('tenantClient', () => {
  it('deve buscar informações do tenant', async () => {
    const info = await tenantClient.getTenantMe('mock-token');
    expect(info).toHaveProperty('id');
    expect(info).toHaveProperty('name');
  });

  it('deve lançar erro para token inválido', async () => {
    await expect(
      tenantClient.getTenantMe('invalid-token')
    ).rejects.toThrow(TenantApiError);
  });
});
```

## Requisitos

- **Requisitos 5.1-5.5**: APIs do Cliente (tenant-client)
- **Requisitos 6.1-6.7**: APIs Internas (internal-client)

## Próximos Passos

Após implementar os clientes HTTP, os próximos passos são:

1. **Task 12**: Implementar Dashboard do Cliente (Frontend)
2. **Task 13**: Implementar Painel Operacional Interno (Frontend)
3. **Task 14**: Implementar Componentes Compartilhados

## Suporte

Para dúvidas ou problemas, consulte:
- [Design Document](../../.kiro/specs/operational-dashboard-alquimistaai/design.md)
- [Requirements Document](../../.kiro/specs/operational-dashboard-alquimistaai/requirements.md)
- [Tasks Document](../../.kiro/specs/operational-dashboard-alquimistaai/tasks.md)
