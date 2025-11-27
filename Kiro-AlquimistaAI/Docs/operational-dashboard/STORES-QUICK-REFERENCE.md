# Stores - Guia Rápido de Referência

## 🎯 Visão Geral

Guia rápido para uso dos stores de estado do Painel Operacional AlquimistaAI.

## 📦 Stores Disponíveis

### 1. Tenant Store (Dashboard do Cliente)

```typescript
import { useTenantStore } from '@/stores/tenant-store';
```

**Dados:**
- `tenantInfo` - Informações da empresa
- `agents` - Agentes contratados
- `integrations` - Integrações configuradas
- `usageData` - Métricas de uso
- `incidents` - Histórico de incidentes

**Ações:**
```typescript
fetchTenantInfo()      // Buscar info do tenant
fetchAgents(status)    // Buscar agentes
fetchIntegrations()    // Buscar integrações
fetchUsage(period)     // Buscar métricas
fetchIncidents()       // Buscar incidentes
invalidateCache(key)   // Invalidar cache
reset()                // Resetar estado
```

### 2. Company Store (Painel Operacional)

```typescript
import { useCompanyStore } from '@/stores/company-store';
```

**Dados:**
- `tenants` - Lista de tenants
- `selectedTenant` - Tenant selecionado
- `usageOverview` - Visão global de uso
- `billingOverview` - Visão financeira
- `commands` - Comandos operacionais

**Ações:**
```typescript
fetchTenants(filters)        // Buscar tenants
fetchTenantDetail(id)        // Buscar detalhes
fetchUsageOverview(period)   // Buscar uso global
fetchBillingOverview(period) // Buscar visão financeira
fetchCommands(filters)       // Buscar comandos
createCommand(request)       // Criar comando
setTenantsFilters(filters)   // Atualizar filtros
reset()                      // Resetar estado
```

## 🚀 Uso Rápido

### Buscar Dados

```typescript
function MyComponent() {
  const { tenantInfo, fetchTenantInfo } = useTenantStore();
  
  useEffect(() => {
    fetchTenantInfo();
  }, []);
  
  return <div>{tenantInfo?.name}</div>;
}
```

### Forçar Refresh

```typescript
// Ignorar cache
await fetchTenantInfo(true);

// Ou invalidar cache primeiro
invalidateCache('tenantInfo');
await fetchTenantInfo();
```

### Filtros e Paginação

```typescript
const { tenants, fetchTenants, setTenantsFilters } = useCompanyStore();

// Atualizar filtros
setTenantsFilters({ status: 'active', search: 'empresa' });
fetchTenants();

// Próxima página
fetchTenants({ offset: 50 });
```

### Criar Comando

```typescript
const { createCommand } = useCompanyStore();

await createCommand({
  command_type: 'RESTART_AGENT',
  tenant_id: 'tenant-123',
  parameters: { agent_id: 'agent-456' }
});
```

## ⚡ Performance

### Usar Seletores Específicos

```typescript
// ❌ Ruim - Re-render em qualquer mudança
const store = useTenantStore();

// ✅ Bom - Re-render apenas quando tenantInfo muda
const tenantInfo = useTenantStore(state => state.tenantInfo);
```

### Cache TTL

| Store | Dado | TTL |
|-------|------|-----|
| Tenant | tenantInfo | 5 min |
| Tenant | agents | 5 min |
| Tenant | usageData | 2 min |
| Company | tenants | 5 min |
| Company | usageOverview | 10 min |
| Company | billingOverview | 15 min |

## 🔄 Invalidação de Cache

```typescript
// Cache específico
invalidateCache('tenantInfo');

// Todo o cache
invalidateAllCache();

// Após mutação
await updateTenant(data);
invalidateCache('tenantInfo');
await fetchTenantInfo(true);
```

## 🧹 Logout

```typescript
const { logout } = useAuthStore();
const { reset: resetTenant } = useTenantStore();
const { reset: resetCompany } = useCompanyStore();

const handleLogout = () => {
  logout();
  resetTenant();
  resetCompany();
};
```

## 📊 Estados de Loading

```typescript
const {
  isLoadingInfo,
  isLoadingAgents,
  isLoadingUsage
} = useTenantStore();

if (isLoadingInfo) return <Skeleton />;
```

## 🎨 Exemplos Completos

### Dashboard do Cliente

```typescript
function TenantDashboard() {
  const {
    tenantInfo,
    agents,
    usageData,
    fetchTenantInfo,
    fetchAgents,
    fetchUsage
  } = useTenantStore();

  useEffect(() => {
    fetchTenantInfo();
    fetchAgents('active');
    fetchUsage('30d');
  }, []);

  return (
    <div>
      <h1>{tenantInfo?.name}</h1>
      <div>Agentes: {agents.length}</div>
      <div>Requisições: {usageData?.summary.total_requests}</div>
    </div>
  );
}
```

### Lista de Tenants

```typescript
function TenantsList() {
  const {
    tenants,
    tenantsFilters,
    fetchTenants,
    setTenantsFilters
  } = useCompanyStore();

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleSearch = (search: string) => {
    setTenantsFilters({ search, offset: 0 });
    fetchTenants();
  };

  return (
    <div>
      <input onChange={(e) => handleSearch(e.target.value)} />
      {tenants.map(tenant => (
        <div key={tenant.id}>{tenant.name}</div>
      ))}
    </div>
  );
}
```

### Console de Operações

```typescript
function OperationsConsole() {
  const {
    commands,
    fetchCommands,
    createCommand
  } = useCompanyStore();

  useEffect(() => {
    fetchCommands();
    
    // Polling
    const interval = setInterval(() => {
      fetchCommands({ status: 'PENDING' });
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const handleCreate = async () => {
    await createCommand({
      command_type: 'HEALTH_CHECK',
      parameters: {}
    });
    fetchCommands(undefined, true);
  };

  return (
    <div>
      <button onClick={handleCreate}>Executar</button>
      {commands.map(cmd => (
        <div key={cmd.command_id}>
          {cmd.command_type} - {cmd.status}
        </div>
      ))}
    </div>
  );
}
```

## 🐛 Tratamento de Erros

```typescript
try {
  await fetchTenantInfo();
} catch (error) {
  if (error.code === 'UNAUTHORIZED') {
    // Redirecionar para login
  } else if (error.code === 'FORBIDDEN') {
    // Mostrar mensagem de permissão
  } else {
    // Erro genérico
    toast.error('Erro ao carregar dados');
  }
}
```

## 📚 Documentação Completa

- [README dos Stores](../../frontend/src/stores/README.md)
- [Exemplos de Uso](../../frontend/src/stores/example-usage.tsx)
- [Resumo de Implementação](./TASK-15-IMPLEMENTATION-SUMMARY.md)

## 🔗 Links Úteis

- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Tenant Client API](../../frontend/src/lib/api/tenant-client.ts)
- [Internal Client API](../../frontend/src/lib/api/internal-client.ts)
