# Guia Rápido - Acesso Real ao Painel com Cognito

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Configuração do Cognito](#configuração-do-cognito)
- [Fluxo de Autenticação](#fluxo-de-autenticação)
- [Testando Usuários DEV](#testando-usuários-dev)
- [Troubleshooting](#troubleshooting)
- [Arquivos Criados/Modificados](#arquivos-criadosmodificados)
- [Exemplos de Uso](#exemplos-de-uso)

---

## Visão Geral

Este sistema implementa autenticação completa com Amazon Cognito usando OAuth 2.0 e Hosted UI. Os usuários são automaticamente redirecionados para o dashboard apropriado baseado em seus grupos Cognito:

- **INTERNAL_ADMIN / INTERNAL_SUPPORT** → `/app/company` (Dashboard Interno)
- **TENANT_ADMIN / TENANT_USER** → `/app/dashboard` (Dashboard do Cliente)

### Características Principais

✅ Login único via Cognito Hosted UI  
✅ Redirecionamento automático por grupo  
✅ Proteção de rotas com middleware  
✅ Bloqueio de acesso cross-dashboard  
✅ Logout completo com limpeza de sessão  
✅ Tokens seguros em cookies HTTP-only  

---

## Variáveis de Ambiente

### Desenvolvimento (.env.local)

```bash
# Cognito Configuration
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_Y8p2TeMbv
NEXT_PUBLIC_COGNITO_CLIENT_ID=59fs99tv0sbrmelkqef83itenu
NEXT_PUBLIC_COGNITO_DOMAIN_HOST=us-east-1y8p2tembv.auth.us-east-1.amazoncognito.com
NEXT_PUBLIC_COGNITO_REDIRECT_URI=http://localhost:3000/auth/callback
NEXT_PUBLIC_COGNITO_LOGOUT_URI=http://localhost:3000/auth/login
NEXT_PUBLIC_AWS_REGION=us-east-1
```

### Produção (.env.production)

```bash
# Cognito Configuration
NEXT_PUBLIC_COGNITO_USER_POOL_ID=<prod-pool-id>
NEXT_PUBLIC_COGNITO_CLIENT_ID=<prod-client-id>
NEXT_PUBLIC_COGNITO_DOMAIN_HOST=<prod-domain>.auth.us-east-1.amazoncognito.com
NEXT_PUBLIC_COGNITO_REDIRECT_URI=https://app.alquimista.ai/auth/callback
NEXT_PUBLIC_COGNITO_LOGOUT_URI=https://app.alquimista.ai/auth/login
NEXT_PUBLIC_AWS_REGION=us-east-1
```

### ⚠️ Importante

- Todas as variáveis devem começar com `NEXT_PUBLIC_` para serem acessíveis no cliente
- URLs de callback devem estar registradas no Cognito App Client
- Domínio do Hosted UI deve ser exatamente como configurado no Cognito

---

## Configuração do Cognito

### 1. User Pool

**Nome:** `fibonacci-users-dev` (DEV) / `fibonacci-users-prod` (PROD)  
**ID:** `us-east-1_Y8p2TeMbv` (DEV)  
**Região:** `us-east-1`

### 2. App Client

**Client ID:** `59fs99tv0sbrmelkqef83itenu` (DEV)  
**Tipo:** Public client (sem client secret)

**Configurações OAuth:**
- ✅ Authorization code grant
- ✅ Allowed OAuth Flows: Authorization code grant
- ✅ Allowed OAuth Scopes: `openid`, `email`, `profile`

**Callback URLs (DEV):**
```
http://localhost:3000/auth/callback
```

**Sign out URLs (DEV):**
```
http://localhost:3000/auth/login
```

### 3. Hosted UI Domain

**Domínio:** `us-east-1y8p2tembv.auth.us-east-1.amazoncognito.com`

**URL Completa:**
```
https://us-east-1y8p2tembv.auth.us-east-1.amazoncognito.com/login?client_id=59fs99tv0sbrmelkqef83itenu&response_type=code&scope=openid+email+profile&redirect_uri=http://localhost:3000/auth/callback
```

### 4. Grupos Cognito

| Grupo | Descrição | Dashboard |
|-------|-----------|-----------|
| `INTERNAL_ADMIN` | Administrador interno | `/app/company` |
| `INTERNAL_SUPPORT` | Suporte interno | `/app/company` |
| `TENANT_ADMIN` | Administrador do cliente | `/app/dashboard` |
| `TENANT_USER` | Usuário do cliente | `/app/dashboard` |

---

## Fluxo de Autenticação

### Diagrama de Sequência

```
┌─────────┐      ┌──────────┐      ┌─────────┐      ┌──────────┐      ┌────────────┐
│ Usuário │      │  Login   │      │ Cognito │      │ Callback │      │ Middleware │
│         │      │   Page   │      │ Hosted  │      │   Page   │      │            │
└────┬────┘      └────┬─────┘      └────┬────┘      └────┬─────┘      └─────┬──────┘
     │                │                  │                │                   │
     │──Click Login──▶│                  │                │                   │
     │                │                  │                │                   │
     │                │──Redirect───────▶│                │                   │
     │                │                  │                │                   │
     │                │                  │◀─Hosted UI────▶│                   │
     │                │                  │  (Login Form)  │                   │
     │                │                  │                │                   │
     │                │                  │──Code─────────▶│                   │
     │                │                  │                │                   │
     │                │                  │                │──Exchange Code───▶│
     │                │                  │                │   for Tokens      │
     │                │                  │                │                   │
     │                │                  │                │◀─Tokens──────────│
     │                │                  │                │                   │
     │                │                  │                │──Store Cookies───▶│
     │                │                  │                │                   │
     │                │                  │                │──Extract Groups──▶│
     │                │                  │                │                   │
     │◀─Redirect to Dashboard────────────────────────────│                   │
     │  (/app/company ou /app/dashboard)                 │                   │
     │                │                  │                │                   │
```

### Passo a Passo

1. **Usuário acessa rota protegida** → Middleware detecta ausência de token
2. **Redirecionamento para login** → `/auth/login`
3. **Click em "Entrar"** → Inicia OAuth flow
4. **Redirect para Cognito** → Hosted UI exibe formulário
5. **Usuário faz login** → Cognito valida credenciais
6. **Cognito retorna código** → Redirect para `/auth/callback?code=...`
7. **Troca código por tokens** → Backend chama `/oauth2/token`
8. **Armazenamento seguro** → Tokens salvos em cookies HTTP-only
9. **Extração de grupos** → Decodifica ID token e extrai `cognito:groups`
10. **Redirecionamento final** → Baseado no grupo do usuário

---

## Testando Usuários DEV

### 1. Usuário: jmrhollanda@gmail.com (INTERNAL_ADMIN)

**Grupo:** `INTERNAL_ADMIN`  
**Dashboard Esperado:** `/app/company`

**Teste:**
```bash
# 1. Acesse http://localhost:3000/auth/login
# 2. Clique em "Entrar"
# 3. Faça login com jmrhollanda@gmail.com
# 4. Verifique redirecionamento para /app/company
# 5. Tente acessar /app/dashboard (deve permitir - admin tem acesso total)
# 6. Clique em "Sair" e verifique logout completo
```

**Resultado Esperado:**
- ✅ Login bem-sucedido
- ✅ Redirecionamento para `/app/company`
- ✅ Acesso permitido a todas as rotas
- ✅ Logout limpa sessão completamente

---

### 2. Usuário: alquimistafibonacci@gmail.com (INTERNAL_SUPPORT)

**Grupo:** `INTERNAL_SUPPORT`  
**Dashboard Esperado:** `/app/company`

**Teste:**
```bash
# 1. Acesse http://localhost:3000/auth/login
# 2. Clique em "Entrar"
# 3. Faça login com alquimistafibonacci@gmail.com
# 4. Verifique redirecionamento para /app/company
# 5. Tente acessar /app/dashboard (deve permitir - suporte tem acesso total)
# 6. Clique em "Sair" e verifique logout completo
```

**Resultado Esperado:**
- ✅ Login bem-sucedido
- ✅ Redirecionamento para `/app/company`
- ✅ Acesso permitido a todas as rotas
- ✅ Logout limpa sessão completamente

---

### 3. Usuário: marcello@c3comercial.com.br (TENANT_ADMIN)

**Grupo:** `TENANT_ADMIN`  
**Dashboard Esperado:** `/app/dashboard`  
**Tenant ID:** `c3comercial`

**Teste:**
```bash
# 1. Acesse http://localhost:3000/auth/login
# 2. Clique em "Entrar"
# 3. Faça login com marcello@c3comercial.com.br
# 4. Verifique redirecionamento para /app/dashboard
# 5. Tente acessar /app/company (deve BLOQUEAR e redirecionar)
# 6. Verifique que só acessa rotas /app/dashboard/*
# 7. Clique em "Sair" e verifique logout completo
```

**Resultado Esperado:**
- ✅ Login bem-sucedido
- ✅ Redirecionamento para `/app/dashboard`
- ❌ Acesso bloqueado a `/app/company`
- ✅ Acesso permitido apenas a `/app/dashboard/*`
- ✅ Logout limpa sessão completamente

---

### 4. Usuário: leylany@c3comercial.com.br (TENANT_USER)

**Grupo:** `TENANT_USER`  
**Dashboard Esperado:** `/app/dashboard`  
**Tenant ID:** `c3comercial`

**Teste:**
```bash
# 1. Acesse http://localhost:3000/auth/login
# 2. Clique em "Entrar"
# 3. Faça login com leylany@c3comercial.com.br
# 4. Verifique redirecionamento para /app/dashboard
# 5. Tente acessar /app/company (deve BLOQUEAR e redirecionar)
# 6. Verifique que só acessa rotas /app/dashboard/*
# 7. Clique em "Sair" e verifique logout completo
```

**Resultado Esperado:**
- ✅ Login bem-sucedido
- ✅ Redirecionamento para `/app/dashboard`
- ❌ Acesso bloqueado a `/app/company`
- ✅ Acesso permitido apenas a `/app/dashboard/*`
- ✅ Logout limpa sessão completamente

---

## Troubleshooting

### Erro: "Variável de ambiente ausente"

**Sintoma:**
```
CognitoConfigError: Variável de ambiente ausente: NEXT_PUBLIC_COGNITO_USER_POOL_ID
```

**Solução:**
1. Verifique se o arquivo `.env.local` existe na raiz do projeto frontend
2. Confirme que todas as variáveis estão definidas
3. Reinicie o servidor de desenvolvimento: `npm run dev`

---

### Erro: "Código de autorização inválido"

**Sintoma:**
```
AuthenticationError: INVALID_CODE - Código ausente ou inválido
```

**Causas Possíveis:**
- URL de callback não registrada no Cognito
- Código já foi usado (códigos são de uso único)
- Código expirado (válido por 10 minutos)

**Solução:**
1. Verifique as Callback URLs no Cognito App Client
2. Tente fazer login novamente (novo código será gerado)
3. Verifique se o domínio está correto

---

### Erro: "Token expirado"

**Sintoma:**
- Redirecionamento automático para login
- Mensagem: "Sua sessão expirou"

**Solução:**
- Isso é comportamento esperado após 1 hora (expiração do ID token)
- Faça login novamente
- **Futuro:** Implementar renovação automática com refresh token

---

### Erro: "Acesso negado" ao tentar acessar dashboard

**Sintoma:**
- Usuário tenant tenta acessar `/app/company`
- Redirecionado automaticamente para `/app/dashboard`

**Solução:**
- Isso é comportamento esperado (proteção cross-dashboard)
- Usuários tenant só podem acessar `/app/dashboard/*`
- Verifique o grupo do usuário no Cognito

---

### Erro: "Redirect URI mismatch"

**Sintoma:**
```
error=invalid_request&error_description=Redirect URI mismatch
```

**Solução:**
1. Acesse o Cognito Console
2. Vá para App Client Settings
3. Adicione a URL exata em "Callback URLs":
   - DEV: `http://localhost:3000/auth/callback`
   - PROD: `https://app.alquimista.ai/auth/callback`
4. Salve as alterações

---

### Erro: "Groups claim ausente"

**Sintoma:**
```
AuthenticationError: MISSING_GROUPS - Claim cognito:groups ausente
```

**Solução:**
1. Verifique se o usuário está em algum grupo no Cognito
2. Acesse Cognito Console → Users → Selecione o usuário
3. Vá para "Group memberships"
4. Adicione o usuário a um grupo apropriado

---

### Cookies não estão sendo salvos

**Sintoma:**
- Login parece funcionar, mas usuário é redirecionado para login novamente
- Cookies não aparecem no DevTools

**Solução:**
1. Verifique se está usando HTTPS em produção (cookies secure)
2. Em desenvolvimento, use `http://localhost` (não `127.0.0.1`)
3. Verifique configurações de SameSite no navegador
4. Limpe cookies e cache do navegador

---

## Arquivos Criados/Modificados

### Arquivos Criados

```
frontend/
├── src/
│   ├── app/
│   │   └── auth/
│   │       ├── callback/
│   │       │   └── page.tsx              # ✅ Página de callback OAuth
│   │       ├── logout/
│   │       │   └── page.tsx              # ✅ Página de logout
│   │       └── logout-callback/
│   │           └── page.tsx              # ✅ Callback pós-logout
│   └── lib/
│       └── cognito-client.ts             # ✅ Cliente Cognito com OAuth
└── .env.local.example                     # ✅ Template de variáveis

docs/
└── operational-dashboard/
    └── ACCESS-QUICK-REFERENCE.md          # ✅ Este documento
```

### Arquivos Modificados

```
frontend/
├── src/
│   ├── app/
│   │   └── auth/
│   │       └── login/
│   │           └── page.tsx              # ✅ Atualizado com OAuth
│   ├── stores/
│   │   └── auth-store.ts                 # ✅ Mapeamento de grupos
│   └── middleware.ts                      # ✅ Proteção de rotas
└── .env.local                             # ✅ Variáveis configuradas
```

---

## Exemplos de Uso

### 1. Iniciar Fluxo de Login

```typescript
// frontend/src/lib/cognito-client.ts
import { initOAuthFlow } from '@/lib/cognito-client';

// Em um componente
const handleLogin = () => {
  initOAuthFlow();
  // Usuário será redirecionado para Cognito Hosted UI
};
```

### 2. Verificar Autenticação no Componente

```typescript
// frontend/src/components/exemplo.tsx
'use client';

import { useAuthStore } from '@/stores/auth-store';

export function ExemploComponente() {
  const { isAuthenticated, user, role } = useAuthStore();

  if (!isAuthenticated) {
    return <div>Você precisa fazer login</div>;
  }

  return (
    <div>
      <h1>Bem-vindo, {user?.email}</h1>
      <p>Seu perfil: {role}</p>
    </div>
  );
}
```

### 3. Proteger Rota Manualmente

```typescript
// frontend/src/app/exemplo/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

export default function PaginaProtegida() {
  const router = useRouter();
  const { isAuthenticated, isInternal } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    } else if (!isInternal) {
      router.push('/app/dashboard');
    }
  }, [isAuthenticated, isInternal, router]);

  return <div>Conteúdo protegido</div>;
}
```

### 4. Fazer Logout

```typescript
// frontend/src/components/header.tsx
'use client';

import { useRouter } from 'next/navigation';

export function Header() {
  const router = useRouter();

  const handleLogout = () => {
    router.push('/auth/logout');
    // Sistema limpará cookies e redirecionará para Cognito
  };

  return (
    <button onClick={handleLogout}>
      Sair
    </button>
  );
}
```

### 5. Acessar Claims do Usuário

```typescript
// frontend/src/components/perfil.tsx
'use client';

import { useAuthStore } from '@/stores/auth-store';

export function PerfilUsuario() {
  const { user, groups, tenantId } = useAuthStore();

  return (
    <div>
      <p>Email: {user?.email}</p>
      <p>Grupos: {groups.join(', ')}</p>
      {tenantId && <p>Tenant: {tenantId}</p>}
    </div>
  );
}
```

### 6. Verificar Permissões

```typescript
// frontend/src/lib/permissions.ts
import { useAuthStore } from '@/stores/auth-store';

export function usePermissions() {
  const { role, isInternal } = useAuthStore();

  return {
    canAccessCompanyPanel: isInternal,
    canAccessTenantDashboard: true,
    canManageUsers: role === 'INTERNAL_ADMIN' || role === 'TENANT_ADMIN',
    canViewReports: true,
    canEditSettings: role === 'INTERNAL_ADMIN' || role === 'TENANT_ADMIN',
  };
}

// Uso em componente
export function ConfiguracoesPage() {
  const { canEditSettings } = usePermissions();

  if (!canEditSettings) {
    return <div>Você não tem permissão para editar configurações</div>;
  }

  return <div>Formulário de configurações...</div>;
}
```

---

## Comandos Úteis

### Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
cd frontend
npm run dev

# Acessar aplicação
http://localhost:3000

# Limpar cache do Next.js
rm -rf .next
npm run dev
```

### Testes

```bash
# Executar testes unitários
npm test

# Executar testes de integração
npm run test:integration

# Executar testes E2E
npm run test:e2e
```

### Validação

```bash
# Validar configuração do Cognito
cd scripts
./validate-cognito-setup.ps1

# Validar fluxo de autenticação
cd .kiro/specs/cognito-real-access-dashboard
./validate-auth-flow.ps1
```

---

## Próximos Passos

### Melhorias Futuras

1. **Renovação Automática de Tokens**
   - Usar refresh token antes da expiração
   - Renovação silenciosa em background

2. **MFA (Multi-Factor Authentication)**
   - Suporte a autenticação multi-fator
   - Configuração por usuário

3. **Social Login**
   - Google, Facebook, Microsoft
   - Configuração no Cognito

4. **Remember Me**
   - Sessão persistente
   - Configuração de duração customizada

5. **Audit Log**
   - Registrar todos os logins
   - Registrar tentativas falhadas
   - Dashboard de segurança

---

## Referências

- [Amazon Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [OAuth 2.0 Authorization Code Flow](https://oauth.net/2/grant-types/authorization-code/)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [JWT (JSON Web Tokens)](https://jwt.io/)

---

## Suporte

Para dúvidas ou problemas:

1. Consulte a seção [Troubleshooting](#troubleshooting)
2. Verifique os logs do navegador (DevTools → Console)
3. Verifique os logs do servidor (`npm run dev`)
4. Consulte a documentação do Cognito
5. Entre em contato com a equipe de desenvolvimento

---

**Última atualização:** 2024  
**Versão:** 1.0.0  
**Autor:** Equipe AlquimistaAI
