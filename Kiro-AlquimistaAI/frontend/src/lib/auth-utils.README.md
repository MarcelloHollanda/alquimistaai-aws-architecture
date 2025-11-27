# Utilitários de Autenticação - Painel Operacional AlquimistaAI

Este documento descreve os utilitários de autenticação implementados para o Painel Operacional AlquimistaAI, que diferencia usuários internos (equipe AlquimistaAI) de usuários clientes (tenants).

## Visão Geral

O sistema de autenticação utiliza Amazon Cognito com grupos para controlar permissões e acesso a diferentes partes da aplicação:

- **INTERNAL_ADMIN**: Administradores internos (acesso total)
- **INTERNAL_SUPPORT**: Suporte interno (acesso operacional)
- **TENANT_ADMIN**: Administradores de tenant (acesso ao próprio tenant)
- **TENANT_USER**: Usuários de tenant (acesso limitado ao próprio tenant)

## Arquivos

### 1. `auth-utils.ts`

Funções utilitárias para extrair claims do JWT e validar permissões.

**Principais funções:**

- `extractClaims(token)`: Extrai claims do token JWT
- `extractClaimsFromCookies()`: Extrai claims dos cookies do navegador
- `hasInternalAccess(claims)`: Verifica se é usuário interno
- `isInternalAdmin(claims)`: Verifica se é administrador interno
- `hasTenantAccess(claims, tenantId)`: Verifica acesso a tenant específico
- `canAccessInternalRoutes(claims)`: Verifica permissão para rotas internas
- `canAccessBilling(claims)`: Verifica permissão para dados financeiros
- `canExecuteOperationalCommands(claims)`: Verifica permissão para comandos operacionais
- `getInitialRoute(claims)`: Determina rota inicial após login
- `isTokenValid(token)`: Valida se token não expirou

**Interface UserClaims:**

```typescript
interface UserClaims {
  sub: string;              // ID do usuário no Cognito
  email: string;            // Email do usuário
  name?: string;            // Nome do usuário
  tenantId?: string;        // ID do tenant (custom:tenant_id)
  groups: string[];         // Grupos do Cognito
  isInternal: boolean;      // É usuário interno?
  isAdmin: boolean;         // É administrador interno?
  isSupport: boolean;       // É suporte interno?
  isTenantAdmin: boolean;   // É administrador de tenant?
  isTenantUser: boolean;    // É usuário de tenant?
}
```

### 2. `use-permissions.ts`

Hook React para gerenciar permissões do usuário.

**Uso:**

```typescript
import { usePermissions } from '@/hooks/use-permissions';

function MyComponent() {
  const {
    claims,
    isInternal,
    isAdmin,
    canAccessBilling,
    hasTenantAccess,
    displayName,
    userTypeLabel,
  } = usePermissions();

  return (
    <div>
      <p>Olá, {displayName}</p>
      <span>{userTypeLabel}</span>
      
      {isInternal && <InternalMenu />}
      {canAccessBilling && <BillingLink />}
    </div>
  );
}
```

### 3. `protected-route.tsx`

Componente para proteger rotas baseadas em permissões.

**Uso como componente:**

```typescript
import { ProtectedRoute } from '@/components/auth/protected-route';

function InternalPage() {
  return (
    <ProtectedRoute requireInternal>
      <InternalDashboard />
    </ProtectedRoute>
  );
}
```

**Uso como HOC:**

```typescript
import { withProtectedRoute } from '@/components/auth/protected-route';

function BillingPage() {
  return <BillingOverview />;
}

export default withProtectedRoute(BillingPage, {
  requireAdmin: true,
  errorMessage: 'Apenas administradores podem acessar',
});
```

**Props:**

- `requireInternal`: Requer acesso interno (INTERNAL_ADMIN ou INTERNAL_SUPPORT)
- `requireAdmin`: Requer ser administrador interno (INTERNAL_ADMIN)
- `requireTenantAccess`: Requer acesso a tenant específico
- `fallbackRoute`: Rota de redirecionamento se não tiver permissão (default: '/app/dashboard')
- `errorMessage`: Mensagem de erro customizada

### 4. `middleware.ts`

Middleware Next.js para proteção de rotas e roteamento automático.

**Funcionalidades:**

1. **Proteção de rotas**: Verifica autenticação em rotas `/app/*`
2. **Roteamento automático**: Redireciona usuários para interface apropriada
   - Usuários internos → `/app/company`
   - Usuários clientes → `/app/dashboard`
3. **Proteção de rotas internas**: Bloqueia acesso de clientes a `/app/company/*`
4. **Validação de token**: Verifica expiração e validade do JWT

## Fluxo de Autenticação

### 1. Login

```
Usuário faz login
    ↓
Cognito retorna tokens (accessToken, idToken, refreshToken)
    ↓
Tokens armazenados em cookies
    ↓
Middleware extrai grupos do idToken
    ↓
Redireciona para interface apropriada
```

### 2. Acesso a Rotas Protegidas

```
Usuário acessa /app/company
    ↓
Middleware verifica tokens nos cookies
    ↓
Extrai grupos do idToken
    ↓
Verifica se é usuário interno
    ↓
Se SIM: permite acesso
Se NÃO: redireciona para /app/dashboard com erro
```

### 3. Renderização Condicional

```
Componente renderiza
    ↓
usePermissions() extrai claims dos cookies
    ↓
Retorna flags de permissão
    ↓
Componente renderiza condicionalmente baseado nas flags
```

## Matriz de Permissões

| Rota/Funcionalidade | INTERNAL_ADMIN | INTERNAL_SUPPORT | TENANT_ADMIN | TENANT_USER |
|---------------------|----------------|------------------|--------------|-------------|
| `/app/dashboard/*` | ✅ | ✅ | ✅ | ✅ |
| `/app/company/*` | ✅ | ✅ | ❌ | ❌ |
| Dados financeiros | ✅ | ❌ | ❌ | ❌ |
| Comandos operacionais | ✅ | ✅ | ❌ | ❌ |
| Dados de todos os tenants | ✅ | ✅ | ❌ | ❌ |
| Dados do próprio tenant | ✅ | ✅ | ✅ | ✅ |

## Exemplos de Uso

### Exemplo 1: Menu de Navegação Condicional

```typescript
function Navigation() {
  const { isInternal, canAccessBilling } = usePermissions();

  return (
    <nav>
      <a href="/app/dashboard">Dashboard</a>
      
      {isInternal && (
        <>
          <a href="/app/company">Painel Operacional</a>
          <a href="/app/company/tenants">Tenants</a>
        </>
      )}
      
      {canAccessBilling && (
        <a href="/app/company/billing">Financeiro</a>
      )}
    </nav>
  );
}
```

### Exemplo 2: Proteger Página Inteira

```typescript
// app/(company)/company/page.tsx
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function CompanyPage() {
  return (
    <ProtectedRoute requireInternal>
      <h1>Painel Operacional</h1>
      <GlobalKPIs />
      <TenantsList />
    </ProtectedRoute>
  );
}
```

### Exemplo 3: Verificar Acesso a Tenant

```typescript
function TenantDetails({ tenantId }: { tenantId: string }) {
  const { hasTenantAccess } = usePermissions();

  if (!hasTenantAccess(tenantId)) {
    return <div>Você não tem permissão para acessar este tenant</div>;
  }

  return <TenantData tenantId={tenantId} />;
}
```

### Exemplo 4: Botões Condicionais

```typescript
function ActionButtons({ tenantId }: { tenantId: string }) {
  const { isInternal, isAdmin } = usePermissions();

  return (
    <div>
      <button>Ver Detalhes</button>
      
      {isInternal && (
        <button>Editar</button>
      )}
      
      {isAdmin && (
        <button>Suspender</button>
      )}
    </div>
  );
}
```

## Segurança

### Validação em Múltiplas Camadas

1. **Frontend (Middleware)**: Primeira linha de defesa, redireciona usuários não autorizados
2. **Frontend (Componentes)**: Renderização condicional baseada em permissões
3. **Backend (Lambda)**: Validação final de permissões em cada requisição

### Boas Práticas

1. **Nunca confiar apenas no frontend**: Sempre validar permissões no backend
2. **Usar HTTPS**: Todas as comunicações devem ser criptografadas
3. **Validar tokens**: Verificar expiração e assinatura dos tokens
4. **Audit log**: Registrar todas as ações sensíveis
5. **Rate limiting**: Limitar requisições por usuário/tenant

## Troubleshooting

### Problema: Usuário não é redirecionado após login

**Solução**: Verificar se os grupos estão configurados corretamente no Cognito e se o token contém o claim `cognito:groups`.

### Problema: Usuário interno não consegue acessar /app/company

**Solução**: Verificar se o usuário está no grupo `INTERNAL_ADMIN` ou `INTERNAL_SUPPORT` no Cognito.

### Problema: Token expirado não redireciona para login

**Solução**: Verificar se o middleware está configurado corretamente e se os cookies estão sendo limpos ao expirar.

### Problema: Claims não são extraídos corretamente

**Solução**: Verificar se o token JWT está no formato correto e se o cookie `idToken` existe.

## Referências

- [Design Document](../../.kiro/specs/operational-dashboard-alquimistaai/design.md)
- [Requirements Document](../../.kiro/specs/operational-dashboard-alquimistaai/requirements.md)
- [Tasks Document](../../.kiro/specs/operational-dashboard-alquimistaai/tasks.md)
- [Amazon Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [Next.js Middleware Documentation](https://nextjs.org/docs/app/building-your-application/routing/middleware)
