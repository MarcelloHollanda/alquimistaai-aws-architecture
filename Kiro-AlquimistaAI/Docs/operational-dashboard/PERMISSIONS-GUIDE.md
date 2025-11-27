# Guia de Permissões - Painel Operacional AlquimistaAI

## Visão Geral

Este documento detalha a estrutura de permissões e grupos do Painel Operacional AlquimistaAI, incluindo configuração, validação e casos de uso.

---

## Grupos do Cognito

### 1. INTERNAL_ADMIN

**Descrição**: Administradores da equipe AlquimistaAI com acesso total ao sistema.

**Permissões**:
- ✅ Acesso total ao Painel Operacional (`/app/company/*`)
- ✅ Acesso ao Dashboard do Cliente (`/app/dashboard/*`)
- ✅ Todas as APIs internas (`/internal/*`)
- ✅ Visão financeira (`/internal/billing/*`)
- ✅ Criar e executar comandos operacionais
- ✅ Visualizar dados de todos os tenants
- ✅ Modificar configurações de tenants

**Casos de Uso**:
- CEO, CTO, Diretores
- Gerentes de operações
- Administradores de sistema

**Configuração**:
```powershell
.\scripts\create-internal-user.ps1 `
  -Email "admin@alquimista.ai" `
  -Name "Admin AlquimistaAI" `
  -Group "INTERNAL_ADMIN"
```

---

### 2. INTERNAL_SUPPORT

**Descrição**: Equipe de suporte da AlquimistaAI com acesso operacional.

**Permissões**:
- ✅ Acesso ao Painel Operacional (`/app/company/*`)
- ✅ Acesso ao Dashboard do Cliente (`/app/dashboard/*`)
- ✅ APIs internas de leitura (`GET /internal/*`)
- ❌ Visão financeira (`/internal/billing/*`)
- ✅ Criar comandos operacionais (exceto financeiros)
- ✅ Visualizar dados de todos os tenants
- ⚠️ Modificações limitadas

**Casos de Uso**:
- Analistas de suporte
- Engenheiros de operações
- Customer Success

**Configuração**:
```powershell
.\scripts\create-internal-user.ps1 `
  -Email "suporte@alquimista.ai" `
  -Name "Suporte AlquimistaAI" `
  -Group "INTERNAL_SUPPORT"
```

---

### 3. TENANT_ADMIN

**Descrição**: Administradores de empresas clientes.

**Permissões**:
- ✅ Acesso total ao Dashboard do Cliente (`/app/dashboard/*`)
- ✅ Todas as APIs de tenant (`/tenant/*`)
- ❌ Painel Operacional (`/app/company/*`)
- ❌ APIs internas (`/internal/*`)
- ✅ Gerenciar usuários do tenant
- ✅ Configurar integrações
- ✅ Visualizar métricas do tenant

**Casos de Uso**:
- Administradores da empresa cliente
- Gerentes de TI
- Responsáveis pela conta

**Configuração**:
```powershell
.\scripts\create-tenant-user.ps1 `
  -Email "admin@empresa.com" `
  -Name "Admin Empresa" `
  -TenantId "uuid-do-tenant" `
  -Group "TENANT_ADMIN"
```

---

### 4. TENANT_USER

**Descrição**: Usuários regulares de empresas clientes.

**Permissões**:
- ✅ Acesso ao Dashboard do Cliente (`/app/dashboard/*`)
- ✅ APIs de tenant de leitura (`GET /tenant/*`)
- ❌ Painel Operacional (`/app/company/*`)
- ❌ APIs internas (`/internal/*`)
- ❌ Modificar configurações do tenant
- ✅ Visualizar métricas do tenant
- ⚠️ Acesso limitado a funcionalidades

**Casos de Uso**:
- Usuários finais da empresa cliente
- Operadores
- Analistas

**Configuração**:
```powershell
.\scripts\create-tenant-user.ps1 `
  -Email "usuario@empresa.com" `
  -Name "Usuario Empresa" `
  -TenantId "uuid-do-tenant" `
  -Group "TENANT_USER"
```

---

## Matriz de Permissões Detalhada

### Rotas Frontend

| Rota | INTERNAL_ADMIN | INTERNAL_SUPPORT | TENANT_ADMIN | TENANT_USER |
|------|----------------|------------------|--------------|-------------|
| `/app/dashboard` | ✅ | ✅ | ✅ | ✅ |
| `/app/dashboard/agents` | ✅ | ✅ | ✅ | ✅ |
| `/app/dashboard/fibonacci` | ✅ | ✅ | ✅ | ✅ |
| `/app/dashboard/integrations` | ✅ | ✅ | ✅ | ✅ |
| `/app/dashboard/usage` | ✅ | ✅ | ✅ | ✅ |
| `/app/dashboard/support` | ✅ | ✅ | ✅ | ✅ |
| `/app/company` | ✅ | ✅ | ❌ | ❌ |
| `/app/company/tenants` | ✅ | ✅ | ❌ | ❌ |
| `/app/company/tenants/[id]` | ✅ | ✅ | ❌ | ❌ |
| `/app/company/agents` | ✅ | ✅ | ❌ | ❌ |
| `/app/company/integrations` | ✅ | ✅ | ❌ | ❌ |
| `/app/company/operations` | ✅ | ✅ | ❌ | ❌ |
| `/app/company/billing` | ✅ | ❌ | ❌ | ❌ |

### APIs de Tenant

| Endpoint | INTERNAL_ADMIN | INTERNAL_SUPPORT | TENANT_ADMIN | TENANT_USER |
|----------|----------------|------------------|--------------|-------------|
| `GET /tenant/me` | ✅ | ✅ | ✅ | ✅ |
| `GET /tenant/agents` | ✅ | ✅ | ✅ | ✅ |
| `GET /tenant/integrations` | ✅ | ✅ | ✅ | ⚠️ (limitado) |
| `GET /tenant/usage` | ✅ | ✅ | ✅ | ✅ |
| `GET /tenant/incidents` | ✅ | ✅ | ✅ | ✅ |

### APIs Internas

| Endpoint | INTERNAL_ADMIN | INTERNAL_SUPPORT | TENANT_ADMIN | TENANT_USER |
|----------|----------------|------------------|--------------|-------------|
| `GET /internal/tenants` | ✅ | ✅ | ❌ | ❌ |
| `GET /internal/tenants/{id}` | ✅ | ✅ | ❌ | ❌ |
| `GET /internal/tenants/{id}/agents` | ✅ | ✅ | ❌ | ❌ |
| `GET /internal/usage/overview` | ✅ | ✅ | ❌ | ❌ |
| `GET /internal/billing/overview` | ✅ | ❌ | ❌ | ❌ |
| `POST /internal/operations/commands` | ✅ | ✅ | ❌ | ❌ |
| `GET /internal/operations/commands` | ✅ | ✅ | ❌ | ❌ |

---

## Custom Attributes

### custom:tenant_id

**Descrição**: UUID do tenant associado ao usuário.

**Obrigatório para**:
- `TENANT_ADMIN`
- `TENANT_USER`

**Opcional para**:
- `INTERNAL_ADMIN`
- `INTERNAL_SUPPORT`

**Uso**:
- Filtrar dados por tenant
- Validar acesso a recursos
- Isolamento de dados

**Configuração**:
```typescript
// No Cognito User Pool
{
  Name: 'tenant_id',
  AttributeDataType: 'String',
  Mutable: true,
  Required: false
}
```

---

## Fluxo de Autorização

### 1. Autenticação

```
Usuário → Login → Cognito → JWT Token
```

### 2. Extração de Claims

```typescript
const token = await getToken({ req: request });
const groups = token['cognito:groups'] || [];
const tenantId = token['custom:tenant_id'];
const isInternal = groups.includes('INTERNAL_ADMIN') || 
                   groups.includes('INTERNAL_SUPPORT');
```

### 3. Validação de Acesso

#### Frontend (Middleware)

```typescript
// middleware.ts
if (request.nextUrl.pathname.startsWith('/app/company') && !isInternal) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

#### Backend (Lambda)

```typescript
// authorization-middleware.ts
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

---

## Cenários de Uso

### Cenário 1: Usuário Interno Acessa Dados de Tenant

**Usuário**: `INTERNAL_ADMIN` ou `INTERNAL_SUPPORT`

**Fluxo**:
1. Acessa `/app/company/tenants/[id]`
2. Middleware valida grupo interno
3. API busca dados do tenant especificado
4. Dados são exibidos

**Validação**:
```typescript
const context = extractAuthContext(event);
requireInternal(context); // ✅ Passa
```

### Cenário 2: Usuário de Tenant Acessa Próprios Dados

**Usuário**: `TENANT_ADMIN` ou `TENANT_USER`

**Fluxo**:
1. Acessa `/app/dashboard`
2. Middleware valida autenticação
3. API busca dados filtrados por `tenant_id` do token
4. Dados do tenant são exibidos

**Validação**:
```typescript
const context = extractAuthContext(event);
const tenantId = context.tenantId; // Do token
requireTenantAccess(context, tenantId); // ✅ Passa
```

### Cenário 3: Usuário de Tenant Tenta Acessar Outro Tenant

**Usuário**: `TENANT_ADMIN` com `tenant_id=A`

**Tentativa**: Acessar dados de `tenant_id=B`

**Fluxo**:
1. Tenta acessar `/tenant/me?tenant_id=B`
2. API valida `tenant_id` do token vs. parâmetro
3. Validação falha

**Validação**:
```typescript
const context = extractAuthContext(event);
const requestedTenantId = 'B';
requireTenantAccess(context, requestedTenantId); // ❌ Erro 403
```

### Cenário 4: Usuário de Tenant Tenta Acessar Painel Operacional

**Usuário**: `TENANT_ADMIN`

**Tentativa**: Acessar `/app/company`

**Fluxo**:
1. Tenta acessar `/app/company`
2. Middleware valida grupos
3. Não encontra grupos internos
4. Retorna erro 403

**Validação**:
```typescript
if (request.nextUrl.pathname.startsWith('/app/company') && !isInternal) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

---

## Configuração de Grupos

### Criar Grupos no Cognito

```powershell
# Script automatizado
.\scripts\setup-cognito-groups.ps1
```

**Ou manualmente via AWS CLI**:

```bash
# INTERNAL_ADMIN
aws cognito-idp create-group \
  --user-pool-id us-east-1_XXXXXXXXX \
  --group-name INTERNAL_ADMIN \
  --description "Administradores AlquimistaAI"

# INTERNAL_SUPPORT
aws cognito-idp create-group \
  --user-pool-id us-east-1_XXXXXXXXX \
  --group-name INTERNAL_SUPPORT \
  --description "Equipe de Suporte AlquimistaAI"

# TENANT_ADMIN
aws cognito-idp create-group \
  --user-pool-id us-east-1_XXXXXXXXX \
  --group-name TENANT_ADMIN \
  --description "Administradores de Tenants"

# TENANT_USER
aws cognito-idp create-group \
  --user-pool-id us-east-1_XXXXXXXXX \
  --group-name TENANT_USER \
  --description "Usuários de Tenants"
```

### Adicionar Usuário a Grupo

```bash
aws cognito-idp admin-add-user-to-group \
  --user-pool-id us-east-1_XXXXXXXXX \
  --username usuario@email.com \
  --group-name INTERNAL_ADMIN
```

### Configurar Custom Attribute

```bash
aws cognito-idp admin-update-user-attributes \
  --user-pool-id us-east-1_XXXXXXXXX \
  --username usuario@email.com \
  --user-attributes Name=custom:tenant_id,Value=uuid-do-tenant
```

---

## Validação de Permissões

### Script de Validação

```powershell
# Validar configuração completa
.\scripts\validate-cognito-setup.ps1
```

**Verifica**:
- ✅ Grupos existem
- ✅ Custom attributes configurados
- ✅ Usuários de teste em cada grupo
- ✅ Tokens JWT contêm claims corretos

### Validação Manual

```typescript
// Extrair e validar token
import { getToken } from 'next-auth/jwt';

const token = await getToken({ req });
console.log('Groups:', token['cognito:groups']);
console.log('Tenant ID:', token['custom:tenant_id']);
console.log('Is Internal:', 
  token['cognito:groups']?.includes('INTERNAL_ADMIN') ||
  token['cognito:groups']?.includes('INTERNAL_SUPPORT')
);
```

---

## Troubleshooting

### Problema: Usuário não consegue acessar painel operacional

**Sintomas**:
- Erro 403 ao acessar `/app/company`
- Redirecionamento para `/app/dashboard`

**Soluções**:
1. Verificar se usuário está em grupo interno:
   ```bash
   aws cognito-idp admin-list-groups-for-user \
     --user-pool-id us-east-1_XXXXXXXXX \
     --username usuario@email.com
   ```

2. Adicionar a grupo correto:
   ```bash
   aws cognito-idp admin-add-user-to-group \
     --user-pool-id us-east-1_XXXXXXXXX \
     --username usuario@email.com \
     --group-name INTERNAL_ADMIN
   ```

3. Fazer logout e login novamente para obter novo token

### Problema: Usuário de tenant vê dados de outro tenant

**Sintomas**:
- Dados incorretos no dashboard
- Acesso a recursos de outro tenant

**Soluções**:
1. Verificar `tenant_id` no token:
   ```typescript
   const token = await getToken({ req });
   console.log('Tenant ID:', token['custom:tenant_id']);
   ```

2. Atualizar `tenant_id` do usuário:
   ```bash
   aws cognito-idp admin-update-user-attributes \
     --user-pool-id us-east-1_XXXXXXXXX \
     --username usuario@email.com \
     --user-attributes Name=custom:tenant_id,Value=uuid-correto
   ```

3. Validar middleware de autorização no backend

### Problema: Token JWT não contém grupos

**Sintomas**:
- `cognito:groups` é undefined ou vazio
- Todos os usuários são tratados como não autorizados

**Soluções**:
1. Verificar configuração do Cognito App Client:
   - Habilitar "cognito:groups" em ID Token Claims

2. Recriar sessão do usuário

3. Verificar configuração do NextAuth:
   ```typescript
   // [...nextauth].ts
   callbacks: {
     jwt: async ({ token, user }) => {
       if (user) {
         token['cognito:groups'] = user['cognito:groups'];
       }
       return token;
     }
   }
   ```

---

## Boas Práticas

### 1. Princípio do Menor Privilégio

- Atribuir apenas permissões necessárias
- Usar `TENANT_USER` por padrão
- Elevar para `TENANT_ADMIN` apenas quando necessário

### 2. Auditoria Regular

- Revisar grupos de usuários mensalmente
- Remover usuários inativos
- Validar `tenant_id` está correto

### 3. Separação de Ambientes

- Grupos diferentes para dev/prod
- Usuários de teste apenas em dev
- Validar permissões antes de deploy

### 4. Documentação

- Documentar motivo de permissões especiais
- Manter registro de mudanças de grupos
- Comunicar alterações à equipe

---

## Referências

- [Documentação do Cognito](https://docs.aws.amazon.com/cognito/)
- [JWT Claims](https://jwt.io/)
- [API Endpoints](./API-ENDPOINTS.md)
- [Troubleshooting](./TROUBLESHOOTING.md)

---

**Última atualização**: Janeiro 2024  
**Versão**: 1.0.0
