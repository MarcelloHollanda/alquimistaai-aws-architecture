# Stores de Estado - Painel Operacional AlquimistaAI

Este diretório contém os stores de gerenciamento de estado global da aplicação usando Zustand.

## Stores Disponíveis

### 1. `auth-store.ts`
Gerencia autenticação e sessão do usuário.

**Estado:**
- `user`: Dados do usuário autenticado
- `token`: Token JWT
- `isAuthenticated`: Status de autenticação
- `mfaEnabled`: Status de MFA

**Ações principais:**
- `login()`: Autenticar usuário
- `logout()`: Encerrar sessão
- `signup()`: Registrar novo usuário
- `enableMFA()`: Habilitar autenticação de dois fatores

### 2. `tenant-store.ts`
Gerencia dados do tenant (cliente) no Dashboard do Cliente.

**Estado:**
- `tenantInfo`: Informações da empresa
- `agents`: Lista de agentes contratados
- `integrations`: Integrações configuradas
- `usageData`: Dados de uso e métricas
- `incidents`: Histórico de incidentes

**Ações principais:**
- `fetchTenantInfo()`: Buscar informações do tenant
- `fetchAgents()`: Buscar agentes contratados
- `fetchIntegrations()`: Buscar integrações
- `fetchUsage()`: Buscar dados de uso
- `fetchIncidents()`: Buscar incidentes
- `invalidateCache()`: Invalidar cache específico
- `invalidateAllCache()`: Invalidar todo o cache

**Cache:**
- TTL configurável por tipo de dado (2-5 minutos)
- Validação automática de cache
- Opção de forçar refresh com `force: true`

### 3. `company-store.ts`
Gerencia dados operacionais no Painel Operacional Interno.

**Estado:**
- `tenants`: Lista de todos os tenants
- `selectedTenant`: Detalhes do tenant selecionado
- `usageOverview`: Visão geral de uso global
- `billingOverview`: Visão financeira global
- `commands`: Comandos operacionais executados

**Ações principais:**
- `fetchTenants()`: Buscar lista de tenants com filtros
- `fetchTenantDetail()`: Buscar detalhes de um tenant
- `fetchUsageOverview()`: Buscar visão geral de uso
- `fetchBillingOverview()`: Buscar visão financeira
- `fetchCommands()`: Buscar comandos operacionais
- `createCommand()`: Criar novo comando operacional
- `setTenantsFilters()`: Atualizar filtros de tenants
- `setCommandsFilters()`: Atualizar filtros de comandos

**Cache:**
- TTL configurável por tipo de dado (2-15 minutos)
- Invalidação automática ao criar comandos
- Suporte a filtros e paginação

### 4. `agent-store.ts`
Gerencia estado dos agentes de IA.

### 5. `plans-store.ts`
Gerencia planos e assinaturas.

### 6. `selection-store.ts`
Gerencia seleção de agentes e subnúcleos no processo de checkout.

## Padrões de Uso

### Uso Básico

```typescript
import { useTenantStore } from '@/stores/tenant-store';
import { useCompanyStore } from '@/stores/company-store';

function MyComponent() {
  // Acessar estado
  const { tenantInfo, isLoadingInfo } = useTenantStore();
  
  // Acessar ações
  const fetchTenantInfo = useTenantStore(state => state.fetchTenantInfo);
  
  // Usar em useEffect
  useEffect(() => {
    fetchTenantInfo();
  }, []);
  
  return (
    <div>
      {isLoadingInfo ? (
        <Skeleton />
      ) : (
        <div>{tenantInfo?.name}</div>
      )}
    </div>
  );
}
```

### Forçar Refresh de Dados

```typescript
// Buscar dados ignorando cache
await fetchTenantInfo(true); // force = true

// Invalidar cache específico
invalidateCache('tenantInfo');

// Invalidar todo o cache
invalidateAllCache();
```

### Uso com Filtros (Company Store)

```typescript
function TenantsList() {
  const { tenants, tenantsFilters, fetchTenants, setTenantsFilters } = useCompanyStore();
  
  // Atualizar filtros
  const handleFilterChange = (newFilters) => {
    setTenantsFilters(newFilters);
    fetchTenants(newFilters);
  };
  
  // Paginação
  const handleNextPage = () => {
    const newOffset = tenantsFilters.offset + tenantsFilters.limit;
    fetchTenants({ offset: newOffset });
  };
  
  return (
    <div>
      {/* Componente de filtros */}
      {/* Lista de tenants */}
      {/* Paginação */}
    </div>
  );
}
```

### Criar Comando Operacional

```typescript
function OperationsConsole() {
  const { createCommand, isCreatingCommand } = useCompanyStore();
  
  const handleCreateCommand = async () => {
    try {
      const command = await createCommand({
        command_type: 'RESTART_AGENT',
        tenant_id: 'tenant-123',
        parameters: { agent_id: 'agent-456' }
      });
      
      toast.success('Comando criado com sucesso');
    } catch (error) {
      toast.error('Erro ao criar comando');
    }
  };
  
  return (
    <Button onClick={handleCreateCommand} disabled={isCreatingCommand}>
      {isCreatingCommand ? 'Criando...' : 'Criar Comando'}
    </Button>
  );
}
```

## Sistema de Cache

### Configuração de TTL

Os TTLs (Time To Live) são configurados por tipo de dado:

**Tenant Store:**
- `tenantInfo`: 5 minutos
- `agents`: 5 minutos
- `integrations`: 5 minutos
- `usageData`: 2 minutos
- `incidents`: 5 minutos

**Company Store:**
- `tenants`: 5 minutos
- `selectedTenant`: 3 minutos
- `usageOverview`: 10 minutos
- `billingOverview`: 15 minutos
- `commands`: 2 minutos

### Validação de Cache

O cache é validado automaticamente antes de cada requisição:

```typescript
const isCacheValid = <T>(entry: CacheEntry<T> | undefined): boolean => {
  if (!entry) return false;
  return Date.now() - entry.timestamp < entry.ttl;
};
```

### Invalidação de Cache

```typescript
// Invalidar cache específico
invalidateCache('tenantInfo');

// Invalidar todo o cache
invalidateAllCache();

// Cache é invalidado automaticamente ao criar comandos
await createCommand(request); // Invalida cache de commands
```

## Persistência

Os stores usam `zustand/middleware/persist` para persistir dados no localStorage:

**Tenant Store:**
- Persiste: `tenantInfo`, `agents`, `integrations`
- Não persiste: cache, estados de loading

**Company Store:**
- Persiste: `tenantsFilters`, `commandsFilters`
- Não persiste: dados, cache, estados de loading

**Auth Store:**
- Persiste: `user`, `token`, `isAuthenticated`, `mfaEnabled`

## Integração com API Clients

Os stores utilizam os clients HTTP para comunicação com o backend:

```typescript
import { tenantClient } from '@/lib/api/tenant-client';
import { internalClient } from '@/lib/api/internal-client';

// Tenant Store usa tenantClient
const data = await tenantClient.getTenantInfo();

// Company Store usa internalClient
const data = await internalClient.listTenants(filters);
```

## Tratamento de Erros

Todos os métodos de fetch incluem tratamento de erros:

```typescript
try {
  const data = await tenantClient.getTenantInfo();
  set({ tenantInfo: data, isLoadingInfo: false });
} catch (error) {
  console.error('Error fetching tenant info:', error);
  set({ isLoadingInfo: false });
  throw error; // Re-throw para componente tratar
}
```

## Reset de Estado

Ambos os stores incluem método `reset()` para limpar todo o estado:

```typescript
// Útil ao fazer logout
const { reset: resetTenant } = useTenantStore();
const { reset: resetCompany } = useCompanyStore();
const { logout } = useAuthStore();

const handleLogout = () => {
  logout();
  resetTenant();
  resetCompany();
};
```

## Boas Práticas

1. **Use seletores específicos** para evitar re-renders desnecessários:
   ```typescript
   // ❌ Ruim - re-render em qualquer mudança
   const store = useTenantStore();
   
   // ✅ Bom - re-render apenas quando tenantInfo muda
   const tenantInfo = useTenantStore(state => state.tenantInfo);
   ```

2. **Invalide cache quando necessário**:
   ```typescript
   // Após criar/atualizar dados
   await updateTenant(data);
   invalidateCache('tenantInfo');
   fetchTenantInfo(true);
   ```

3. **Use force refresh com moderação**:
   ```typescript
   // Apenas quando realmente necessário
   await fetchTenantInfo(true); // Ignora cache
   ```

4. **Trate erros nos componentes**:
   ```typescript
   try {
     await fetchTenantInfo();
   } catch (error) {
     toast.error('Erro ao carregar dados');
   }
   ```

5. **Combine com React Query para casos complexos**:
   - Stores para estado global simples
   - React Query para dados com requisitos complexos de cache/sincronização

## Requisitos Atendidos

- ✅ **Requisito 1.4**: Armazenamento de tipo de usuário em estado global
- ✅ **Requisito 12.2**: Cache local de dados com TTL configurável
- ✅ Integração com auth-store existente
- ✅ Invalidação de cache
- ✅ Persistência seletiva de dados
- ✅ Tratamento de erros
- ✅ Estados de loading
- ✅ Suporte a filtros e paginação
