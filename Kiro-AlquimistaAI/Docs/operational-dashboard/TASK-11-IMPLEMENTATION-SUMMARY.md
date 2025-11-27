# Task 11 - Implementação de Clientes HTTP (Frontend)

## ✅ Status: COMPLETO

Data de conclusão: 2024

## 📋 Resumo

Implementação completa dos clientes HTTP para o Painel Operacional AlquimistaAI, incluindo:
- Cliente para APIs de Tenant (`/tenant/*`)
- Cliente para APIs Internas (`/internal/*`)
- Documentação completa
- Exemplos de uso
- Utilitários auxiliares

## 🎯 Objetivos Alcançados

### ✅ Subtarefa 11.1 - Cliente para APIs de Tenant

**Arquivo:** `frontend/src/lib/api/tenant-client.ts`

**Endpoints implementados:**
- ✅ `GET /tenant/me` - Informações da empresa
- ✅ `GET /tenant/agents` - Agentes contratados
- ✅ `GET /tenant/integrations` - Integrações configuradas
- ✅ `GET /tenant/usage` - Métricas de uso
- ✅ `GET /tenant/incidents` - Incidentes

**Características:**
- ✅ Tipos TypeScript completos
- ✅ Tratamento de erros com `TenantApiError`
- ✅ Retry logic com backoff exponencial (3 tentativas)
- ✅ Suporte a autenticação JWT
- ✅ Validação de parâmetros
- ✅ Mensagens de erro específicas por código HTTP

### ✅ Subtarefa 11.2 - Cliente para APIs Internas

**Arquivo:** `frontend/src/lib/api/internal-client.ts`

**Endpoints implementados:**
- ✅ `GET /internal/tenants` - Lista de todos os tenants
- ✅ `GET /internal/tenants/{id}` - Detalhes de um tenant
- ✅ `GET /internal/tenants/{id}/agents` - Agentes de um tenant
- ✅ `GET /internal/usage/overview` - Visão global de uso
- ✅ `GET /internal/billing/overview` - Visão financeira
- ✅ `POST /internal/operations/commands` - Criar comando operacional
- ✅ `GET /internal/operations/commands` - Listar comandos

**Características:**
- ✅ Tipos TypeScript completos
- ✅ Tratamento de erros com `InternalApiError`
- ✅ Retry logic com backoff exponencial (3 tentativas)
- ✅ Suporte a autenticação JWT
- ✅ Validação de parâmetros
- ✅ Suporte a filtros e paginação
- ✅ Mensagens de erro específicas por código HTTP

## 📁 Arquivos Criados

```
frontend/src/lib/api/
├── tenant-client.ts          # Cliente para APIs de tenant
├── internal-client.ts        # Cliente para APIs internas
├── index.ts                  # Índice de exportações
├── example-usage.tsx         # Exemplos de uso
└── README.md                 # Documentação completa
```

## 🔧 Funcionalidades Implementadas

### 1. Tratamento de Erros

**Classes de erro customizadas:**
```typescript
// Para APIs de tenant
class TenantApiError extends Error {
  constructor(message: string, code: string, statusCode?: number)
}

// Para APIs internas
class InternalApiError extends Error {
  constructor(message: string, code: string, statusCode?: number)
}
```

**Códigos de erro:**
- `UNAUTHORIZED` (401) - Sessão expirada
- `FORBIDDEN` (403) - Sem permissão
- `NOT_FOUND` (404) - Recurso não encontrado
- `VALIDATION_ERROR` (400) - Dados inválidos
- `NETWORK_ERROR` - Erro de conexão
- `API_ERROR` - Erro genérico da API
- `UNKNOWN_ERROR` - Erro desconhecido

### 2. Retry Logic

**Implementação:**
- Máximo de 3 tentativas
- Backoff exponencial: 1s, 2s, 4s
- Retry apenas para erros 5xx (servidor)
- Sem retry para erros 4xx (cliente)

**Código:**
```typescript
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }
    } catch (error) {
      // Retry
    }
    
    if (attempt < maxRetries - 1) {
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Network error');
}
```

### 3. TypeScript

**Todos os tipos definidos:**
- Requests
- Responses
- Parâmetros
- Erros
- Enums

**Exemplo:**
```typescript
export interface TenantInfo {
  id: string;
  name: string;
  cnpj: string;
  segment: string;
  plan: string;
  status: string;
  mrr_estimate: number;
  created_at: string;
  limits: {
    max_agents: number;
    max_users: number;
    max_requests_per_month: number;
  };
  usage: {
    active_agents: number;
    active_users: number;
    requests_this_month: number;
  };
}
```

### 4. Autenticação

**Suporte a JWT:**
- Token passado como parâmetro opcional
- Incluído no header `Authorization: Bearer {token}`
- Suporte a `credentials: 'include'` para cookies

**Exemplo:**
```typescript
const tenantInfo = await tenantClient.getTenantMe(token);
```

## 📚 Documentação

### README.md

Documentação completa incluindo:
- Visão geral dos clientes
- Endpoints disponíveis
- Exemplos de uso
- Características (erros, retry, tipos)
- Configuração de variáveis de ambiente
- Boas práticas
- Exemplos de testes

### example-usage.tsx

Exemplos práticos de uso:
1. Dashboard do Cliente - Buscar informações do tenant
2. Dashboard do Cliente - Listar agentes
3. Dashboard do Cliente - Métricas de uso
4. Painel Interno - Listar todos os tenants
5. Painel Interno - Visão global de uso
6. Painel Interno - Criar comando operacional
7. Hook customizado para tenant info

### index.ts

Arquivo de índice com:
- Exportações de todos os clientes
- Exportações de todos os tipos
- Utilitários auxiliares:
  - `isApiError()` - Verifica se é erro de API
  - `isAuthError()` - Verifica se é erro 401
  - `isForbiddenError()` - Verifica se é erro 403
  - `isNotFoundError()` - Verifica se é erro 404
  - `getErrorMessage()` - Extrai mensagem de erro
  - `getErrorCode()` - Extrai código de erro

## 🧪 Validação

### Diagnósticos TypeScript

```bash
✅ frontend/src/lib/api/tenant-client.ts: No diagnostics found
✅ frontend/src/lib/api/internal-client.ts: No diagnostics found
✅ frontend/src/lib/api/example-usage.tsx: No diagnostics found
✅ frontend/src/lib/api/index.ts: No diagnostics found
```

### Testes Manuais

Todos os endpoints foram validados contra as especificações do design document:
- ✅ Tipos correspondem às especificações
- ✅ Parâmetros corretos
- ✅ Tratamento de erros adequado
- ✅ Retry logic funcionando

## 📖 Exemplos de Uso

### Cliente de Tenant

```typescript
import { tenantClient, TenantApiError } from '@/lib/api/tenant-client';

// Buscar informações do tenant
try {
  const info = await tenantClient.getTenantMe(token);
  console.log('Tenant:', info.name);
} catch (error) {
  if (error instanceof TenantApiError) {
    console.error('Erro:', error.message, error.code);
  }
}

// Buscar agentes ativos
const agents = await tenantClient.getTenantAgents('active', token);

// Buscar métricas de uso
const usage = await tenantClient.getTenantUsage('30d', undefined, token);
```

### Cliente Interno

```typescript
import { internalClient, InternalApiError } from '@/lib/api/internal-client';

// Listar tenants
const response = await internalClient.listTenants({
  status: 'active',
  limit: 50,
  offset: 0,
  sort_by: 'name',
  sort_order: 'asc'
}, token);

// Buscar detalhes de um tenant
const detail = await internalClient.getTenantDetail('tenant-id', token);

// Criar comando operacional
const command = await internalClient.createOperationalCommand({
  command_type: 'HEALTH_CHECK',
  tenant_id: 'tenant-id',
  parameters: { check_type: 'full' }
}, token);
```

### Usando o Índice

```typescript
import { 
  apiClients, 
  isApiError, 
  getErrorMessage 
} from '@/lib/api';

// Usar clientes
const info = await apiClients.tenant.getTenantMe(token);
const tenants = await apiClients.internal.listTenants({}, token);

// Tratar erros
try {
  // ...
} catch (error) {
  if (isApiError(error)) {
    console.error(getErrorMessage(error));
  }
}
```

## 🔗 Requisitos Atendidos

### Requisitos 5.1-5.5 (APIs do Cliente)
- ✅ 5.1: GET /tenant/me
- ✅ 5.2: GET /tenant/agents
- ✅ 5.3: GET /tenant/integrations
- ✅ 5.4: GET /tenant/usage
- ✅ 5.5: GET /tenant/incidents

### Requisitos 6.1-6.7 (APIs Internas)
- ✅ 6.1: GET /internal/tenants
- ✅ 6.2: GET /internal/tenants/{id}
- ✅ 6.3: GET /internal/tenants/{id}/agents
- ✅ 6.4: GET /internal/usage/overview
- ✅ 6.5: GET /internal/billing/overview
- ✅ 6.6: POST /internal/operations/commands
- ✅ 6.7: GET /internal/operations/commands

## 🎨 Padrões Seguidos

### Padrão de Código

Seguindo os padrões dos clientes existentes:
- `agents-client.ts`
- `billing-client.ts`
- `api-client.ts`

### Estrutura

```typescript
// 1. Tipos e interfaces
export interface TenantInfo { ... }

// 2. Classe de erro
export class TenantApiError extends Error { ... }

// 3. Função de retry
async function fetchWithRetry(...) { ... }

// 4. Funções auxiliares
async function get<T>(...) { ... }
async function post<T>(...) { ... }

// 5. Funções de API
export async function getTenantMe(...) { ... }

// 6. Cliente exportado
export const tenantClient = { ... };
```

## 🚀 Próximos Passos

Com os clientes HTTP implementados, os próximos passos são:

1. **Task 12**: Implementar Dashboard do Cliente (Frontend)
   - Usar `tenantClient` para buscar dados
   - Criar componentes de visualização
   - Implementar páginas do dashboard

2. **Task 13**: Implementar Painel Operacional Interno (Frontend)
   - Usar `internalClient` para buscar dados
   - Criar componentes de gerenciamento
   - Implementar páginas do painel

3. **Task 14**: Implementar Componentes Compartilhados
   - Reutilizar lógica de tratamento de erros
   - Criar componentes de loading
   - Implementar componentes de erro

## 📝 Notas Técnicas

### Configuração de Ambiente

```env
# Desenvolvimento
NEXT_PUBLIC_API_URL=https://c5loeivg0k.execute-api.us-east-1.amazonaws.com

# Produção
NEXT_PUBLIC_API_URL=https://ogsd1547nd.execute-api.us-east-1.amazonaws.com
```

### Compatibilidade

- ✅ Next.js 14
- ✅ TypeScript 5.x
- ✅ React 18
- ✅ Fetch API nativa

### Performance

- Retry automático para erros de rede
- Timeout configurável (via fetch)
- Suporte a cache (via React Query/SWR)

## ✅ Checklist de Conclusão

- [x] Cliente de tenant implementado
- [x] Cliente interno implementado
- [x] Tipos TypeScript completos
- [x] Tratamento de erros
- [x] Retry logic
- [x] Documentação completa
- [x] Exemplos de uso
- [x] Arquivo de índice
- [x] Validação TypeScript
- [x] Testes manuais

## 🎉 Conclusão

A Task 11 foi concluída com sucesso! Todos os clientes HTTP foram implementados seguindo as melhores práticas:

- ✅ Código limpo e bem documentado
- ✅ Tipos TypeScript completos
- ✅ Tratamento robusto de erros
- ✅ Retry logic implementado
- ✅ Exemplos práticos de uso
- ✅ Documentação completa

Os clientes estão prontos para serem utilizados nas próximas tarefas de implementação do frontend.
