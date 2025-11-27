# Design — Painel Operacional AlquimistaAI

## Visão Geral

Este documento descreve a arquitetura técnica, modelo de dados, APIs e componentes do **Painel Operacional AlquimistaAI**, um sistema dual que diferencia usuários internos da equipe AlquimistaAI de usuários clientes (tenants).

## Princípios de Design

1. **Isolamento de Dados**: Garantir que clientes nunca acessem dados de outros clientes
2. **Reutilização**: Aproveitar ao máximo infraestrutura e componentes existentes
3. **Escalabilidade**: Suportar crescimento de tenants sem degradação de performance
4. **Segurança em Camadas**: Validação em frontend, middleware e backend
5. **Consistência Visual**: Manter identidade AlquimistaAI em todas as interfaces

---

## Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────────┐
│                         USUÁRIO                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    AMAZON COGNITO                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │INTERNAL_ADMIN│  │INTERNAL_SUPP │  │ TENANT_ADMIN │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────┬────────────────────────────────────────┘
                     │ JWT Token (groups, tenant_id, sub)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  FRONTEND (Next.js 14)                       │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │  Dashboard Cliente   │  │  Painel Operacional  │        │
│  │  /app/dashboard/*    │  │  /app/company/*      │        │
│  └──────────────────────┘  └──────────────────────┘        │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY                               │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │   /tenant/*          │  │   /internal/*        │        │
│  │  (Cliente APIs)      │  │  (Internal APIs)     │        │
│  └──────────────────────┘  └──────────────────────┘        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    AWS LAMBDA                                │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │  Tenant Handlers     │  │  Internal Handlers   │        │
│  │  - get-tenant-me     │  │  - list-tenants      │        │
│  │  - get-tenant-agents │  │  - get-usage-overview│        │
│  │  - get-tenant-usage  │  │  - create-command    │        │
│  └──────────────────────┘  └──────────────────────┘        │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌──────────────────┐    ┌──────────────────┐
│  AURORA          │    │   DYNAMODB       │
│  PostgreSQL      │    │  Commands        │
│  - tenants       │    │  - operational_  │
│  - tenant_users  │    │    commands      │
│  - tenant_agents │    └──────────────────┘
│  - usage_daily   │
└──────────────────┘
```

---


## Fluxo de Autenticação e Roteamento

### 1. Login e Diferenciação de Usuário

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  
  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  
  const groups = token['cognito:groups'] || [];
  const isInternal = groups.includes('INTERNAL_ADMIN') || groups.includes('INTERNAL_SUPPORT');
  
  // Redirecionar para interface apropriada após login
  if (request.nextUrl.pathname === '/') {
    if (isInternal) {
      return NextResponse.redirect(new URL('/app/company', request.url));
    } else {
      return NextResponse.redirect(new URL('/app/dashboard', request.url));
    }
  }
  
  // Proteger rotas internas
  if (request.nextUrl.pathname.startsWith('/app/company') && !isInternal) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  return NextResponse.next();
}
```

### 2. Extração de Claims do Token

```typescript
// lib/auth-utils.ts
export interface UserClaims {
  sub: string;
  email: string;
  tenantId?: string;
  groups: string[];
  isInternal: boolean;
}

export function extractClaims(token: JWT): UserClaims {
  const groups = (token['cognito:groups'] || []) as string[];
  
  return {
    sub: token.sub as string,
    email: token.email as string,
    tenantId: token['custom:tenant_id'] as string | undefined,
    groups,
    isInternal: groups.includes('INTERNAL_ADMIN') || groups.includes('INTERNAL_SUPPORT')
  };
}
```

---

## Modelo de Dados

### Aurora PostgreSQL (schema: alquimista_platform)

#### Tabela: tenants (existente, ajustes)

```sql
-- Já existe, adicionar colunas se necessário
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS mrr_estimate DECIMAL(10,2);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS segment VARCHAR(100);
```

#### Tabela: tenant_users (nova)

```sql
CREATE TABLE IF NOT EXISTS tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  cognito_sub VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) NOT NULL, -- 'ADMIN', 'USER'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  UNIQUE(tenant_id, email)
);

CREATE INDEX idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_cognito_sub ON tenant_users(cognito_sub);
```

#### Tabela: tenant_agents (nova)

```sql
CREATE TABLE IF NOT EXISTS tenant_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id),
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'suspended'
  config JSONB, -- Configurações específicas do tenant para este agente
  activated_at TIMESTAMP DEFAULT NOW(),
  deactivated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, agent_id)
);

CREATE INDEX idx_tenant_agents_tenant ON tenant_agents(tenant_id);
CREATE INDEX idx_tenant_agents_agent ON tenant_agents(agent_id);
CREATE INDEX idx_tenant_agents_status ON tenant_agents(status);
```


#### Tabela: tenant_integrations (nova)

```sql
CREATE TABLE IF NOT EXISTS tenant_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  integration_type VARCHAR(50) NOT NULL, -- 'email', 'whatsapp', 'crm', 'calendar'
  integration_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'error'
  credentials_secret_arn VARCHAR(500), -- ARN do Secrets Manager
  config JSONB, -- Configurações públicas (não sensíveis)
  last_sync_at TIMESTAMP,
  last_error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tenant_integrations_tenant ON tenant_integrations(tenant_id);
CREATE INDEX idx_tenant_integrations_type ON tenant_integrations(integration_type);
CREATE INDEX idx_tenant_integrations_status ON tenant_integrations(status);
```

#### Tabela: tenant_usage_daily (nova)

```sql
CREATE TABLE IF NOT EXISTS tenant_usage_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id),
  date DATE NOT NULL,
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER,
  total_tokens_used BIGINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, agent_id, date)
);

CREATE INDEX idx_tenant_usage_daily_tenant_date ON tenant_usage_daily(tenant_id, date DESC);
CREATE INDEX idx_tenant_usage_daily_agent_date ON tenant_usage_daily(agent_id, date DESC);
```

#### Tabela: operational_events (nova)

```sql
CREATE TABLE IF NOT EXISTS operational_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL, -- 'command_executed', 'incident', 'maintenance'
  severity VARCHAR(20) NOT NULL, -- 'info', 'warning', 'error', 'critical'
  tenant_id UUID REFERENCES tenants(id),
  user_sub VARCHAR(255), -- Cognito sub do usuário que executou
  title VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_operational_events_type ON operational_events(event_type);
CREATE INDEX idx_operational_events_severity ON operational_events(severity);
CREATE INDEX idx_operational_events_tenant ON operational_events(tenant_id);
CREATE INDEX idx_operational_events_created ON operational_events(created_at DESC);
```

### DynamoDB

#### Tabela: operational_commands

```typescript
interface OperationalCommand {
  command_id: string; // Partition Key (UUID)
  created_at: string; // Sort Key (ISO timestamp)
  tenant_id?: string; // GSI
  command_type: 'REPROCESS_QUEUE' | 'RESET_TOKEN' | 'RESTART_AGENT' | 'HEALTH_CHECK';
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'ERROR';
  created_by: string; // Cognito sub
  parameters: Record<string, any>;
  output?: string;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  ttl: number; // Auto-delete após 90 dias
}

// GSI: tenant_id-created_at-index
// GSI: status-created_at-index
```

---

## APIs

### APIs do Cliente (/tenant/*)

#### GET /tenant/me

Retorna informações da empresa do tenant autenticado.

**Autorização**: TENANT_ADMIN, TENANT_USER, INTERNAL_ADMIN, INTERNAL_SUPPORT

**Response**:
```typescript
{
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


#### GET /tenant/agents

Retorna agentes contratados pelo tenant.

**Autorização**: TENANT_ADMIN, TENANT_USER, INTERNAL_ADMIN, INTERNAL_SUPPORT

**Query Params**:
- `status`: 'active' | 'inactive' | 'all' (default: 'active')

**Response**:
```typescript
{
  agents: Array<{
    id: string;
    name: string;
    segment: string;
    status: string;
    activated_at: string;
    usage_last_30_days: {
      total_requests: number;
      success_rate: number;
      avg_response_time_ms: number;
    };
  }>;
}
```

#### GET /tenant/integrations

Retorna integrações configuradas pelo tenant.

**Autorização**: TENANT_ADMIN, INTERNAL_ADMIN, INTERNAL_SUPPORT

**Response**:
```typescript
{
  integrations: Array<{
    id: string;
    type: string;
    name: string;
    status: string;
    last_sync_at: string | null;
    last_error: string | null;
  }>;
}
```

#### GET /tenant/usage

Retorna métricas de uso do tenant.

**Autorização**: TENANT_ADMIN, TENANT_USER, INTERNAL_ADMIN, INTERNAL_SUPPORT

**Query Params**:
- `period`: '7d' | '30d' | '90d' (default: '30d')
- `agent_id`: UUID (opcional, filtrar por agente)

**Response**:
```typescript
{
  period: string;
  summary: {
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    success_rate: number;
    avg_response_time_ms: number;
  };
  daily_data: Array<{
    date: string;
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    avg_response_time_ms: number;
  }>;
  by_agent: Array<{
    agent_id: string;
    agent_name: string;
    total_requests: number;
    success_rate: number;
  }>;
}
```

#### GET /tenant/incidents

Retorna incidentes que afetaram o tenant.

**Autorização**: TENANT_ADMIN, TENANT_USER, INTERNAL_ADMIN, INTERNAL_SUPPORT

**Query Params**:
- `limit`: number (default: 20)
- `offset`: number (default: 0)

**Response**:
```typescript
{
  incidents: Array<{
    id: string;
    severity: string;
    title: string;
    description: string;
    created_at: string;
    resolved_at: string | null;
  }>;
  total: number;
}
```

---

### APIs Internas (/internal/*)

#### GET /internal/tenants

Lista todos os tenants com filtros.

**Autorização**: INTERNAL_ADMIN, INTERNAL_SUPPORT

**Query Params**:
- `status`: 'active' | 'inactive' | 'suspended' | 'all' (default: 'active')
- `plan`: string (opcional)
- `segment`: string (opcional)
- `search`: string (busca por nome ou CNPJ)
- `limit`: number (default: 50)
- `offset`: number (default: 0)
- `sort_by`: 'name' | 'created_at' | 'mrr_estimate' (default: 'name')
- `sort_order`: 'asc' | 'desc' (default: 'asc')

**Response**:
```typescript
{
  tenants: Array<{
    id: string;
    name: string;
    cnpj: string;
    segment: string;
    plan: string;
    status: string;
    mrr_estimate: number;
    active_agents: number;
    active_users: number;
    requests_last_30_days: number;
    created_at: string;
  }>;
  total: number;
  limit: number;
  offset: number;
}
```


#### GET /internal/tenants/{id}

Retorna detalhes completos de um tenant específico.

**Autorização**: INTERNAL_ADMIN, INTERNAL_SUPPORT

**Response**:
```typescript
{
  tenant: {
    id: string;
    name: string;
    cnpj: string;
    segment: string;
    plan: string;
    status: string;
    mrr_estimate: number;
    created_at: string;
    updated_at: string;
  };
  users: Array<{
    id: string;
    email: string;
    full_name: string;
    role: string;
    last_login_at: string | null;
  }>;
  agents: Array<{
    id: string;
    name: string;
    status: string;
    activated_at: string;
    usage_last_30_days: {
      total_requests: number;
      success_rate: number;
    };
  }>;
  integrations: Array<{
    id: string;
    type: string;
    name: string;
    status: string;
    last_sync_at: string | null;
  }>;
  usage_summary: {
    requests_last_7_days: number;
    requests_last_30_days: number;
    success_rate_last_30_days: number;
  };
  recent_incidents: Array<{
    id: string;
    severity: string;
    title: string;
    created_at: string;
  }>;
}
```

#### GET /internal/tenants/{id}/agents

Retorna agentes do tenant com opções de gerenciamento.

**Autorização**: INTERNAL_ADMIN, INTERNAL_SUPPORT

**Response**:
```typescript
{
  agents: Array<{
    id: string;
    name: string;
    status: string;
    config: Record<string, any>;
    activated_at: string;
    deactivated_at: string | null;
    usage_stats: {
      total_requests: number;
      success_rate: number;
      avg_response_time_ms: number;
      last_request_at: string | null;
    };
  }>;
}
```

#### GET /internal/usage/overview

Retorna visão global de uso da plataforma.

**Autorização**: INTERNAL_ADMIN, INTERNAL_SUPPORT

**Query Params**:
- `period`: '7d' | '30d' | '90d' (default: '30d')

**Response**:
```typescript
{
  period: string;
  global_stats: {
    total_tenants: number;
    active_tenants: number;
    total_agents_deployed: number;
    total_requests: number;
    global_success_rate: number;
    avg_response_time_ms: number;
  };
  top_tenants_by_usage: Array<{
    tenant_id: string;
    tenant_name: string;
    total_requests: number;
    success_rate: number;
  }>;
  top_agents_by_usage: Array<{
    agent_id: string;
    agent_name: string;
    total_requests: number;
    deployed_count: number;
  }>;
  daily_trends: Array<{
    date: string;
    total_requests: number;
    success_rate: number;
    active_tenants: number;
  }>;
}
```

#### GET /internal/billing/overview

Retorna visão financeira global.

**Autorização**: INTERNAL_ADMIN

**Query Params**:
- `period`: '7d' | '30d' | '90d' (default: '30d')

**Response**:
```typescript
{
  period: string;
  financial_summary: {
    total_mrr: number;
    total_arr: number;
    avg_mrr_per_tenant: number;
    new_mrr_this_period: number;
    churned_mrr_this_period: number;
  };
  by_plan: Array<{
    plan_name: string;
    tenant_count: number;
    total_mrr: number;
  }>;
  by_segment: Array<{
    segment: string;
    tenant_count: number;
    total_mrr: number;
  }>;
  revenue_trend: Array<{
    date: string;
    mrr: number;
    new_tenants: number;
    churned_tenants: number;
  }>;
}
```


#### POST /internal/operations/commands

Cria um novo comando operacional.

**Autorização**: INTERNAL_ADMIN, INTERNAL_SUPPORT

**Request Body**:
```typescript
{
  command_type: 'REPROCESS_QUEUE' | 'RESET_TOKEN' | 'RESTART_AGENT' | 'HEALTH_CHECK';
  tenant_id?: string; // Opcional, para comandos específicos de tenant
  parameters: Record<string, any>;
}
```

**Response**:
```typescript
{
  command_id: string;
  status: 'PENDING';
  created_at: string;
  message: 'Comando criado com sucesso. Processamento iniciado.';
}
```

#### GET /internal/operations/commands

Lista comandos operacionais executados.

**Autorização**: INTERNAL_ADMIN, INTERNAL_SUPPORT

**Query Params**:
- `status`: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'ERROR' | 'all' (default: 'all')
- `command_type`: string (opcional)
- `tenant_id`: UUID (opcional)
- `limit`: number (default: 50)
- `offset`: number (default: 0)

**Response**:
```typescript
{
  commands: Array<{
    command_id: string;
    command_type: string;
    status: string;
    tenant_id: string | null;
    tenant_name: string | null;
    created_by: string;
    created_at: string;
    started_at: string | null;
    completed_at: string | null;
    output: string | null;
    error_message: string | null;
  }>;
  total: number;
}
```

---

## Componentes Frontend

### Estrutura de Diretórios

```
frontend/src/
├── app/
│   ├── (dashboard)/              # Layout para clientes
│   │   ├── dashboard/
│   │   │   ├── page.tsx          # Visão geral do cliente
│   │   │   ├── agents/
│   │   │   │   └── page.tsx
│   │   │   ├── fibonacci/
│   │   │   │   └── page.tsx
│   │   │   ├── integrations/
│   │   │   │   └── page.tsx
│   │   │   ├── usage/
│   │   │   │   └── page.tsx
│   │   │   └── support/
│   │   │       └── page.tsx
│   │   └── layout.tsx
│   │
│   └── (company)/                # Layout para equipe interna
│       ├── company/
│       │   ├── page.tsx          # Visão geral operacional
│       │   ├── tenants/
│       │   │   ├── page.tsx      # Lista de tenants
│       │   │   └── [id]/
│       │   │       └── page.tsx  # Detalhes do tenant
│       │   ├── agents/
│       │   │   └── page.tsx
│       │   ├── integrations/
│       │   │   └── page.tsx
│       │   ├── operations/
│       │   │   └── page.tsx
│       │   └── billing/
│       │       └── page.tsx
│       └── layout.tsx
│
├── components/
│   ├── dashboard/                # Componentes do dashboard cliente
│   │   ├── tenant-overview.tsx
│   │   ├── agent-status-card.tsx
│   │   ├── integration-status.tsx
│   │   └── usage-chart.tsx
│   │
│   ├── company/                  # Componentes do painel interno
│   │   ├── global-kpis.tsx
│   │   ├── tenants-table.tsx
│   │   ├── tenant-detail-view.tsx
│   │   ├── agents-grid.tsx
│   │   ├── operations-console.tsx
│   │   ├── command-form.tsx
│   │   ├── command-history.tsx
│   │   └── billing-overview.tsx
│   │
│   └── shared/                   # Componentes compartilhados
│       ├── metrics-card.tsx
│       ├── usage-chart.tsx
│       ├── status-badge.tsx
│       └── data-table.tsx
│
├── lib/
│   ├── api/
│   │   ├── tenant-client.ts     # Cliente para APIs /tenant/*
│   │   └── internal-client.ts   # Cliente para APIs /internal/*
│   ├── auth-utils.ts
│   └── permissions.ts
│
└── stores/
    ├── auth-store.ts
    ├── tenant-store.ts
    └── company-store.ts
```


### Componentes Principais

#### 1. Dashboard do Cliente - Visão Geral

**Arquivo**: `app/(dashboard)/dashboard/page.tsx`

```typescript
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1>Dashboard</h1>
      
      {/* KPIs principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricsCard title="Agentes Ativos" value={8} icon={<Bot />} />
        <MetricsCard title="Requisições (30d)" value={12450} icon={<Activity />} />
        <MetricsCard title="Taxa de Sucesso" value="98.5%" icon={<CheckCircle />} />
        <MetricsCard title="Integrações" value={3} icon={<Link />} />
      </div>
      
      {/* Gráfico de uso */}
      <UsageChart period="30d" />
      
      {/* Status de agentes */}
      <AgentStatusList />
      
      {/* Status de integrações */}
      <IntegrationStatusList />
    </div>
  );
}
```

#### 2. Painel Operacional - Visão Geral

**Arquivo**: `app/(company)/company/page.tsx`

```typescript
export default function CompanyOverviewPage() {
  return (
    <div className="space-y-6">
      <h1>Painel Operacional AlquimistaAI</h1>
      
      {/* KPIs globais */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <MetricsCard title="Tenants Ativos" value={47} trend="+3" />
        <MetricsCard title="Agentes Deployados" value={312} trend="+12" />
        <MetricsCard title="Requisições (24h)" value={45230} trend="+8%" />
        <MetricsCard title="Taxa de Sucesso" value="99.2%" trend="+0.3%" />
        <MetricsCard title="MRR Total" value="R$ 142.5k" trend="+R$ 8.2k" />
      </div>
      
      {/* Gráficos de tendência */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UsageTrendChart />
        <RevenueTrendChart />
      </div>
      
      {/* Top tenants e agentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TopTenantsByUsage />
        <TopAgentsByDeployment />
      </div>
      
      {/* Alertas e incidentes recentes */}
      <RecentIncidents />
    </div>
  );
}
```

#### 3. Lista de Tenants

**Arquivo**: `app/(company)/company/tenants/page.tsx`

```typescript
export default function TenantsListPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1>Tenants</h1>
        <Button>Adicionar Tenant</Button>
      </div>
      
      {/* Filtros */}
      <div className="flex gap-4">
        <Select placeholder="Status">
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
          <option value="all">Todos</option>
        </Select>
        <Select placeholder="Plano">
          <option value="starter">Starter</option>
          <option value="professional">Professional</option>
          <option value="enterprise">Enterprise</option>
        </Select>
        <Input placeholder="Buscar por nome ou CNPJ" />
      </div>
      
      {/* Tabela de tenants */}
      <TenantsTable 
        columns={['Nome', 'Segmento', 'Plano', 'Status', 'MRR', 'Agentes', 'Uso (30d)', 'Ações']}
        sortable
        paginated
      />
    </div>
  );
}
```

#### 4. Console de Operações

**Arquivo**: `app/(company)/company/operations/page.tsx`

```typescript
export default function OperationsConsolePage() {
  return (
    <div className="space-y-6">
      <h1>Console de Operações</h1>
      
      {/* Formulário de comando */}
      <Card>
        <CardHeader>
          <CardTitle>Executar Comando</CardTitle>
        </CardHeader>
        <CardContent>
          <CommandForm />
        </CardContent>
      </Card>
      
      {/* Histórico de comandos */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Comandos</CardTitle>
        </CardHeader>
        <CardContent>
          <CommandHistoryTable />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Estratégia de Autorização

### Middleware de Autorização (Backend)

```typescript
// lambda/shared/authorization-middleware.ts
export interface AuthContext {
  sub: string;
  email: string;
  tenantId?: string;
  groups: string[];
  isInternal: boolean;
}

export function extractAuthContext(event: APIGatewayProxyEvent): AuthContext {
  const claims = event.requestContext.authorizer?.claims;
  
  if (!claims) {
    throw new Error('Unauthorized');
  }
  
  const groups = claims['cognito:groups']?.split(',') || [];
  
  return {
    sub: claims.sub,
    email: claims.email,
    tenantId: claims['custom:tenant_id'],
    groups,
    isInternal: groups.includes('INTERNAL_ADMIN') || groups.includes('INTERNAL_SUPPORT')
  };
}

export function requireInternal(context: AuthContext): void {
  if (!context.isInternal) {
    throw new Error('Forbidden: Internal access required');
  }
}

export function requireTenantAccess(context: AuthContext, tenantId: string): void {
  if (!context.isInternal && context.tenantId !== tenantId) {
    throw new Error('Forbidden: Tenant access denied');
  }
}
```


### Exemplo de Handler com Autorização

```typescript
// lambda/platform/get-tenant-me.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { extractAuthContext, requireTenantAccess } from '../shared/authorization-middleware';
import { getTenantById } from '../shared/database';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const context = extractAuthContext(event);
    
    // Usuário interno pode acessar qualquer tenant via query param
    // Usuário cliente só pode acessar seu próprio tenant
    const tenantId = context.isInternal 
      ? event.queryStringParameters?.tenant_id || context.tenantId
      : context.tenantId;
    
    if (!tenantId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Tenant ID required' })
      };
    }
    
    // Validar acesso
    requireTenantAccess(context, tenantId);
    
    // Buscar dados
    const tenant = await getTenantById(tenantId);
    
    return {
      statusCode: 200,
      body: JSON.stringify(tenant)
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: error.message.includes('Forbidden') ? 403 : 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
```

---

## Agregação de Métricas

### Job de Agregação Diária

```typescript
// lambda/internal/aggregate-daily-metrics.ts
import { ScheduledEvent } from 'aws-lambda';
import { query } from '../shared/database';

export async function handler(event: ScheduledEvent): Promise<void> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];
  
  console.log(`Aggregating metrics for ${dateStr}`);
  
  // Agregar por tenant e agente
  await query(`
    INSERT INTO tenant_usage_daily (
      tenant_id,
      agent_id,
      date,
      total_requests,
      successful_requests,
      failed_requests,
      avg_response_time_ms,
      total_tokens_used
    )
    SELECT 
      tenant_id,
      agent_id,
      DATE($1) as date,
      COUNT(*) as total_requests,
      COUNT(*) FILTER (WHERE status = 'success') as successful_requests,
      COUNT(*) FILTER (WHERE status = 'error') as failed_requests,
      AVG(response_time_ms)::INTEGER as avg_response_time_ms,
      SUM(tokens_used) as total_tokens_used
    FROM agent_requests
    WHERE DATE(created_at) = DATE($1)
    GROUP BY tenant_id, agent_id
    ON CONFLICT (tenant_id, agent_id, date) 
    DO UPDATE SET
      total_requests = EXCLUDED.total_requests,
      successful_requests = EXCLUDED.successful_requests,
      failed_requests = EXCLUDED.failed_requests,
      avg_response_time_ms = EXCLUDED.avg_response_time_ms,
      total_tokens_used = EXCLUDED.total_tokens_used
  `, [dateStr]);
  
  console.log('Aggregation complete');
}
```

### EventBridge Rule

```typescript
// lib/observability-dashboard-stack.ts (adicionar)
const aggregationRule = new events.Rule(this, 'DailyMetricsAggregation', {
  schedule: events.Schedule.cron({
    minute: '0',
    hour: '2', // 2 AM UTC
    day: '*',
    month: '*',
    year: '*'
  })
});

aggregationRule.addTarget(new targets.LambdaFunction(aggregateMetricsLambda));
```

---

## Processamento de Comandos Operacionais

### Lambda de Processamento

```typescript
// lambda/internal/process-operational-command.ts
import { DynamoDBStreamEvent } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamodb = new DynamoDB.DocumentClient();

export async function handler(event: DynamoDBStreamEvent): Promise<void> {
  for (const record of event.Records) {
    if (record.eventName !== 'INSERT') continue;
    
    const command = record.dynamodb?.NewImage;
    if (!command || command.status.S !== 'PENDING') continue;
    
    const commandId = command.command_id.S!;
    const commandType = command.command_type.S!;
    
    try {
      // Atualizar status para RUNNING
      await updateCommandStatus(commandId, 'RUNNING');
      
      // Executar comando
      const output = await executeCommand(commandType, JSON.parse(command.parameters.S || '{}'));
      
      // Atualizar status para SUCCESS
      await updateCommandStatus(commandId, 'SUCCESS', output);
      
    } catch (error) {
      console.error(`Error processing command ${commandId}:`, error);
      await updateCommandStatus(commandId, 'ERROR', null, error.message);
    }
  }
}

async function executeCommand(type: string, params: any): Promise<string> {
  switch (type) {
    case 'REPROCESS_QUEUE':
      return await reprocessQueue(params);
    case 'RESET_TOKEN':
      return await resetToken(params);
    case 'RESTART_AGENT':
      return await restartAgent(params);
    case 'HEALTH_CHECK':
      return await runHealthCheck(params);
    default:
      throw new Error(`Unknown command type: ${type}`);
  }
}

async function updateCommandStatus(
  commandId: string, 
  status: string, 
  output?: string, 
  errorMessage?: string
): Promise<void> {
  const updateExpression = ['status = :status'];
  const expressionValues: any = { ':status': status };
  
  if (status === 'RUNNING') {
    updateExpression.push('started_at = :started_at');
    expressionValues[':started_at'] = new Date().toISOString();
  }
  
  if (status === 'SUCCESS' || status === 'ERROR') {
    updateExpression.push('completed_at = :completed_at');
    expressionValues[':completed_at'] = new Date().toISOString();
  }
  
  if (output) {
    updateExpression.push('output = :output');
    expressionValues[':output'] = output;
  }
  
  if (errorMessage) {
    updateExpression.push('error_message = :error_message');
    expressionValues[':error_message'] = errorMessage;
  }
  
  await dynamodb.update({
    TableName: process.env.COMMANDS_TABLE!,
    Key: { command_id: commandId },
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
    ExpressionAttributeValues: expressionValues
  }).promise();
}
```

---

## Cache Strategy

### Redis para Dados Frequentes

```typescript
// lambda/shared/cache-manager.ts
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD
});

export async function getCached<T>(
  key: string, 
  fetcher: () => Promise<T>, 
  ttl: number = 300
): Promise<T> {
  // Tentar buscar do cache
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Buscar do banco
  const data = await fetcher();
  
  // Armazenar no cache
  await redis.setex(key, ttl, JSON.stringify(data));
  
  return data;
}

export async function invalidateCache(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

### Uso em Handlers

```typescript
// lambda/internal/list-tenants.ts
import { getCached } from '../shared/cache-manager';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const context = extractAuthContext(event);
  requireInternal(context);
  
  const cacheKey = `tenants:list:${JSON.stringify(event.queryStringParameters)}`;
  
  const tenants = await getCached(
    cacheKey,
    () => fetchTenantsFromDatabase(event.queryStringParameters),
    300 // 5 minutos
  );
  
  return {
    statusCode: 200,
    body: JSON.stringify(tenants)
  };
}
```

---

## Considerações de Performance

1. **Índices de Banco de Dados**: Criar índices em colunas frequentemente filtradas
2. **Paginação**: Implementar em todas as listas com mais de 50 itens
3. **Agregação em Background**: Métricas agregadas diariamente via job
4. **Cache**: Redis para dados frequentemente acessados (5-15 min TTL)
5. **Lazy Loading**: Carregar componentes pesados sob demanda
6. **Debouncing**: Em campos de busca e filtros

## Considerações de Segurança

1. **Validação em Múltiplas Camadas**: Frontend, middleware, backend
2. **Prepared Statements**: Sempre usar para prevenir SQL injection
3. **Rate Limiting**: Por tenant e por usuário
4. **Audit Log**: Registrar todas as ações operacionais
5. **Secrets Manager**: Nunca expor credenciais no frontend
6. **HTTPS Only**: Todas as comunicações criptografadas
7. **Token Validation**: Validar JWT em cada requisição

---

## Próximos Passos

Após aprovação deste design, seguir para implementação conforme tasks.md.
