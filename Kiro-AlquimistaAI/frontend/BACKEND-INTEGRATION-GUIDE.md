# 🔌 Guia de Integração Frontend-Backend

## 📋 Visão Geral

Este guia detalha como conectar o frontend Next.js com o backend AWS (API Gateway + Lambda).

## 🎯 Endpoints Disponíveis

### API Base URL

```typescript
// Produção
const API_BASE_URL = 'https://api.alquimista.ai';

// Staging
const API_BASE_URL = 'https://api-staging.alquimista.ai';

// Development
const API_BASE_URL = 'https://api-dev.alquimista.ai';
```

### Endpoints Principais

#### 1. Health Check
```typescript
GET /health
Response: { ok: true }
```

#### 2. Eventos
```typescript
POST /events
Body: {
  source: string;
  type: string;
  detail: any;
}
Response: {
  eventId: string;
  status: 'published';
}
```

#### 3. Marketplace de Agentes
```typescript
GET /api/agents
Response: {
  agents: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    version: string;
    status: 'active' | 'inactive';
  }>;
}
```

#### 4. Ativar Agente
```typescript
POST /api/agents/{id}/activate
Headers: {
  Authorization: Bearer <token>
}
Response: {
  success: true;
  activationId: string;
}
```

#### 5. Desativar Agente
```typescript
POST /api/agents/{id}/deactivate
Headers: {
  Authorization: Bearer <token>
}
Response: {
  success: true;
}
```

#### 6. Métricas de Agente
```typescript
GET /api/agents/{id}/metrics
Headers: {
  Authorization: Bearer <token>
}
Response: {
  successRate: number;
  avgExecutionTime: number;
  totalExecutions: number;
  cost: number;
}
```

#### 7. Dashboard Interno
```typescript
GET /internal/dashboard
Headers: {
  Authorization: Bearer <token>
}
Response: {
  metrics: {
    totalLeads: number;
    activeCampaigns: number;
    conversionRate: number;
    revenue: number;
  };
  recentActivity: Array<any>;
}
```

## 🔧 Configuração do Frontend

### 1. Variáveis de Ambiente

Crie um arquivo `.env.local` no diretório `frontend/`:

```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://api.alquimista.ai
NEXT_PUBLIC_API_TIMEOUT=30000

# AWS Cognito (Autenticação)
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_COGNITO_REGION=us-east-1

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_AGENTS=true

# Environment
NEXT_PUBLIC_ENV=production
```

### 2. Cliente API

Crie um cliente API reutilizável em `frontend/src/lib/api-client.ts`:

```typescript
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
      timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000'),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para adicionar token de autenticação
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor para tratamento de erros
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Redirecionar para login
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  private getAuthToken(): string | null {
    // Implementar lógica para obter token do Cognito
    return localStorage.getItem('auth_token');
  }

  // Health Check
  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }

  // Eventos
  async publishEvent(source: string, type: string, detail: any) {
    const response = await this.client.post('/events', {
      source,
      type,
      detail,
    });
    return response.data;
  }

  // Agentes
  async listAgents() {
    const response = await this.client.get('/api/agents');
    return response.data;
  }

  async activateAgent(agentId: string) {
    const response = await this.client.post(`/api/agents/${agentId}/activate`);
    return response.data;
  }

  async deactivateAgent(agentId: string) {
    const response = await this.client.post(`/api/agents/${agentId}/deactivate`);
    return response.data;
  }

  async getAgentMetrics(agentId: string) {
    const response = await this.client.get(`/api/agents/${agentId}/metrics`);
    return response.data;
  }

  // Dashboard
  async getDashboardData() {
    const response = await this.client.get('/internal/dashboard');
    return response.data;
  }
}

export const apiClient = new APIClient();
```

### 3. Hooks Personalizados

Crie hooks para facilitar o uso da API:

#### `frontend/src/hooks/use-agents.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: () => apiClient.listAgents(),
  });
}

export function useActivateAgent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (agentId: string) => apiClient.activateAgent(agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast({
        title: 'Agente ativado',
        description: 'O agente foi ativado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao ativar agente',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeactivateAgent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (agentId: string) => apiClient.deactivateAgent(agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast({
        title: 'Agente desativado',
        description: 'O agente foi desativado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao desativar agente',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useAgentMetrics(agentId: string) {
  return useQuery({
    queryKey: ['agent-metrics', agentId],
    queryFn: () => apiClient.getAgentMetrics(agentId),
    enabled: !!agentId,
  });
}
```

#### `frontend/src/hooks/use-dashboard.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiClient.getDashboardData(),
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });
}
```

### 4. Configurar React Query

Adicione o provider no `frontend/src/app/layout.tsx`:

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minuto
            retry: 3,
          },
        },
      })
  );

  return (
    <html lang="pt-BR">
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

## 🔐 Autenticação com AWS Cognito

### 1. Instalar Dependências

```bash
cd frontend
npm install @aws-amplify/auth aws-amplify
```

### 2. Configurar Amplify

Crie `frontend/src/lib/amplify-config.ts`:

```typescript
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
      region: process.env.NEXT_PUBLIC_COGNITO_REGION!,
    },
  },
});
```

### 3. Hook de Autenticação

Crie `frontend/src/hooks/use-auth.ts`:

```typescript
import { useState, useEffect } from 'react';
import { signIn, signOut, getCurrentUser, fetchAuthSession } from '@aws-amplify/auth';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    try {
      const { isSignedIn } = await signIn({ username: email, password });
      if (isSignedIn) {
        await checkUser();
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async function logout() {
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }

  async function getToken() {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.idToken?.toString();
    } catch (error) {
      return null;
    }
  }

  return {
    user,
    loading,
    login,
    logout,
    getToken,
    isAuthenticated: !!user,
  };
}
```

## 📊 Exemplo de Uso nos Componentes

### Dashboard Page

```typescript
'use client';

import { useDashboard } from '@/hooks/use-dashboard';
import { MetricsCard } from '@/components/dashboard/metrics-card';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div>Erro ao carregar dashboard</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          title="Total de Leads"
          value={data.metrics.totalLeads}
          icon="users"
        />
        <MetricsCard
          title="Campanhas Ativas"
          value={data.metrics.activeCampaigns}
          icon="megaphone"
        />
        <MetricsCard
          title="Taxa de Conversão"
          value={`${data.metrics.conversionRate}%`}
          icon="trending-up"
        />
        <MetricsCard
          title="Receita"
          value={`R$ ${data.metrics.revenue.toLocaleString()}`}
          icon="dollar-sign"
        />
      </div>
    </div>
  );
}
```

### Agents Page

```typescript
'use client';

import { useAgents, useActivateAgent, useDeactivateAgent } from '@/hooks/use-agents';
import { AgentCard } from '@/components/agents/agent-card';
import { Skeleton } from '@/components/ui/skeleton';

export default function AgentsPage() {
  const { data, isLoading } = useAgents();
  const activateAgent = useActivateAgent();
  const deactivateAgent = useDeactivateAgent();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Marketplace de Agentes</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onActivate={() => activateAgent.mutate(agent.id)}
            onDeactivate={() => deactivateAgent.mutate(agent.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

## 🧪 Testes

### Testar Conexão com Backend

```bash
# No diretório frontend/
npm run dev

# Em outro terminal, testar health check
curl http://localhost:3000/api/health
```

### Testar Autenticação

```typescript
// frontend/src/app/test/page.tsx
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

export default function TestPage() {
  const { user, login, logout, isAuthenticated } = useAuth();

  return (
    <div className="p-8">
      <h1>Teste de Autenticação</h1>
      
      {isAuthenticated ? (
        <div>
          <p>Usuário: {user?.username}</p>
          <Button onClick={logout}>Logout</Button>
        </div>
      ) : (
        <Button onClick={() => login('test@example.com', 'password')}>
          Login
        </Button>
      )}
    </div>
  );
}
```

## 📝 Próximos Passos

1. ✅ Configurar variáveis de ambiente
2. ✅ Implementar cliente API
3. ✅ Configurar autenticação
4. ✅ Criar hooks personalizados
5. ✅ Integrar nos componentes
6. ✅ Testar conexão
7. ✅ Deploy do frontend

## 🆘 Troubleshooting

### CORS Error

Se você receber erro de CORS, verifique se o backend está configurado corretamente:

```typescript
// No backend (lib/fibonacci-stack.ts)
const api = new HttpApi(this, 'FibonacciApi', {
  corsPreflight: {
    allowOrigins: ['https://alquimista.ai', 'http://localhost:3000'],
    allowMethods: [CorsHttpMethod.GET, CorsHttpMethod.POST],
    allowHeaders: ['Content-Type', 'Authorization'],
  },
});
```

### Token Expirado

Se o token expirar, o interceptor do axios automaticamente redireciona para login.

### Timeout

Se as requisições estão demorando muito, aumente o timeout:

```typescript
NEXT_PUBLIC_API_TIMEOUT=60000  // 60 segundos
```

---

**Pronto!** Seu frontend está conectado ao backend AWS! 🎉
