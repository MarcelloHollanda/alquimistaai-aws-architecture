# Documento de Design - Acesso Real ao Painel com Cognito

## Overview

Este documento detalha o design técnico para implementação do fluxo completo de autenticação com Amazon Cognito no Painel Operacional AlquimistaAI. O sistema utilizará Cognito Hosted UI para OAuth 2.0, extrairá grupos do token JWT e redirecionará usuários automaticamente para o dashboard apropriado.

## Architecture

### Fluxo de Autenticação

```
┌─────────┐      ┌──────────────┐      ┌─────────────┐      ┌──────────┐
│ Usuário │─────▶│ /auth/login  │─────▶│   Cognito   │─────▶│ Hosted   │
└─────────┘      └──────────────┘      │  Hosted UI  │      │   UI     │
                                        └─────────────┘      └──────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  Callback   │
                                        │  /auth/     │
                                        │  callback   │
                                        └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  Trocar     │
                                        │  código por │
                                        │  tokens     │
                                        └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  Extrair    │
                                        │  grupos do  │
                                        │  ID token   │
                                        └─────────────┘
                                               │
                        ┌──────────────────────┴──────────────────────┐
                        ▼                                              ▼
                ┌───────────────┐                              ┌──────────────┐
                │ INTERNAL_*    │                              │  TENANT_*    │
                │ /app/company  │                              │ /app/dashboard│
                └───────────────┘                              └──────────────┘
```

### Componentes Principais

1. **Cognito Client** (`frontend/src/lib/cognito-client.ts`)
   - Configuração do Cognito User Pool
   - Iniciar fluxo OAuth (Hosted UI)
   - Trocar código por tokens
   - Gerenciar tokens (armazenamento, renovação)

2. **Auth Store** (`frontend/src/stores/auth-store.ts`)
   - Estado global de autenticação
   - Claims do usuário (sub, email, groups, tenantId)
   - Funções de login/logout
   - Mapeamento de grupos para perfis

3. **Middleware** (`frontend/middleware.ts`)
   - Proteção de rotas
   - Validação de tokens
   - Redirecionamento baseado em grupos
   - Bloqueio de acesso cross-dashboard

4. **Callback Page** (`frontend/src/app/auth/callback/page.tsx`)
   - Processar retorno do Cognito
   - Trocar código por tokens
   - Armazenar tokens em cookies
   - Redirecionar para dashboard apropriado

5. **Login Page** (`frontend/src/app/(auth)/login/page.tsx`)
   - Botão "Entrar" que inicia OAuth
   - Mensagem explicativa sobre login único
   - Tratamento de erros

## Components and Interfaces

### Interface: CognitoConfig

```typescript
interface CognitoConfig {
  userPoolId: string;
  clientId: string;
  domain: string;
  redirectUri: string;
  logoutUri: string;
  region: string;
}
```

### Interface: TokenSet

```typescript
interface TokenSet {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
```

### Interface: UserClaims

```typescript
interface UserClaims {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  'cognito:groups': string[];
  'custom:tenant_id'?: string;
  iss: string;
  iat: number;
  exp: number;
}
```

### Interface: AuthState

```typescript
interface AuthState {
  user: UserClaims | null;
  groups: string[];
  role: 'INTERNAL_ADMIN' | 'INTERNAL_SUPPORT' | 'TENANT_ADMIN' | 'TENANT_USER' | null;
  isAuthenticated: boolean;
  isInternal: boolean;
  tenantId: string | null;
  loading: boolean;
}
```

## Data Models

### Mapeamento de Grupos

```typescript
const GROUP_MAPPING = {
  INTERNAL_ADMIN: {
    role: 'INTERNAL_ADMIN',
    isInternal: true,
    defaultRoute: '/app/company',
    allowedRoutes: ['/app/company/**', '/app/dashboard/**']
  },
  INTERNAL_SUPPORT: {
    role: 'INTERNAL_SUPPORT',
    isInternal: true,
    defaultRoute: '/app/company',
    allowedRoutes: ['/app/company/**', '/app/dashboard/**']
  },
  TENANT_ADMIN: {
    role: 'TENANT_ADMIN',
    isInternal: false,
    defaultRoute: '/app/dashboard',
    allowedRoutes: ['/app/dashboard/**']
  },
  TENANT_USER: {
    role: 'TENANT_USER',
    isInternal: false,
    defaultRoute: '/app/dashboard',
    allowedRoutes: ['/app/dashboard/**']
  }
};
```

### Estrutura de Cookies

```typescript
// Cookies armazenados após login
{
  idToken: string;      // httpOnly, secure, sameSite=strict
  accessToken: string;  // httpOnly, secure, sameSite=strict
  refreshToken: string; // httpOnly, secure, sameSite=strict
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: OAuth Redirect Consistency

*For any* usuário não autenticado que acessa uma rota protegida, o sistema deve redirecionar para o Cognito Hosted UI com os parâmetros corretos de OAuth 2.0

**Validates: Requirements 1.2, 1.3**

### Property 2: Token Exchange Correctness

*For any* código de autorização válido retornado pelo Cognito, o sistema deve trocar por um conjunto completo de tokens (ID, Access, Refresh)

**Validates: Requirements 1.4, 6.2**

### Property 3: Claims Extraction Completeness

*For any* ID token válido, o sistema deve extrair corretamente todos os claims obrigatórios (sub, email, cognito:groups)

**Validates: Requirements 2.1, 2.2**

### Property 4: Group Mapping Accuracy

*For any* array de grupos extraído do token, o sistema deve mapear corretamente para exatamente um perfil interno (INTERNAL_ADMIN, INTERNAL_SUPPORT, TENANT_ADMIN, TENANT_USER)

**Validates: Requirements 2.3, 2.4**

### Property 5: Internal User Routing

*For any* usuário com grupo INTERNAL_ADMIN ou INTERNAL_SUPPORT, após login bem-sucedido, o sistema deve redirecionar para /app/company

**Validates: Requirements 3.1, 3.2, 3.4**

### Property 6: Tenant User Routing

*For any* usuário com grupo TENANT_ADMIN ou TENANT_USER, após login bem-sucedido, o sistema deve redirecionar para /app/dashboard

**Validates: Requirements 4.1, 4.2, 4.4**

### Property 7: Cross-Dashboard Access Blocking

*For any* usuário tenant que tenta acessar /app/company/*, o middleware deve bloquear acesso e redirecionar para /app/dashboard

**Validates: Requirements 4.3**

### Property 8: Token Expiration Handling

*For any* token expirado, o middleware deve limpar cookies e redirecionar para login

**Validates: Requirements 5.4**

### Property 9: Cookie Security

*For any* conjunto de tokens armazenado, os cookies devem ter flags httpOnly, secure e sameSite=strict

**Validates: Requirements 6.3**

### Property 10: Logout Completeness

*For any* operação de logout, o sistema deve limpar todos os cookies de autenticação e redirecionar para o endpoint de logout do Cognito

**Validates: Requirements 7.1, 7.2, 7.3**

## Error Handling

### Erros de Configuração

```typescript
class CognitoConfigError extends Error {
  constructor(missingVar: string) {
    super(`Variável de ambiente ausente: ${missingVar}`);
    this.name = 'CognitoConfigError';
  }
}
```

### Erros de Autenticação

```typescript
class AuthenticationError extends Error {
  code: string;
  
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'AuthenticationError';
  }
}

// Códigos de erro:
// - INVALID_CODE: Código de autorização inválido
// - TOKEN_EXCHANGE_FAILED: Falha ao trocar código por tokens
// - INVALID_TOKEN: Token JWT inválido ou mal formatado
// - TOKEN_EXPIRED: Token expirado
// - MISSING_GROUPS: Claim cognito:groups ausente
// - UNAUTHORIZED: Usuário sem permissão para rota
```

### Tratamento de Erros no Callback

```typescript
// Em /auth/callback
try {
  const code = searchParams.get('code');
  if (!code) throw new AuthenticationError('INVALID_CODE', 'Código ausente');
  
  const tokens = await exchangeCodeForTokens(code);
  storeTok ensInCookies(tokens);
  
  const claims = extractClaims(tokens.idToken);
  const route = getRouteForGroups(claims['cognito:groups']);
  
  router.push(route);
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Exibir mensagem amigável
    setError(error.message);
  } else {
    // Erro inesperado
    setError('Erro ao processar autenticação');
  }
}
```

## Testing Strategy

### Unit Tests

1. **Cognito Client Tests**
   - Testar construção de URL do Hosted UI
   - Testar troca de código por tokens (mock)
   - Testar extração de claims do token
   - Testar validação de expiração

2. **Auth Store Tests**
   - Testar mapeamento de grupos para perfis
   - Testar determinação de rota inicial
   - Testar estado de autenticação

3. **Middleware Tests**
   - Testar proteção de rotas públicas vs protegidas
   - Testar validação de tokens
   - Testar redirecionamento por grupo
   - Testar bloqueio cross-dashboard

### Integration Tests

1. **Fluxo de Login Completo**
   - Simular retorno do Cognito com código
   - Verificar troca por tokens
   - Verificar armazenamento em cookies
   - Verificar redirecionamento correto

2. **Fluxo de Logout**
   - Verificar limpeza de cookies
   - Verificar redirecionamento para Cognito logout
   - Verificar bloqueio de acesso após logout

3. **Proteção de Rotas**
   - Verificar bloqueio de rotas protegidas sem auth
   - Verificar acesso permitido com auth válida
   - Verificar bloqueio cross-dashboard

### Manual Tests (DEV)

1. **Teste com jmrhollanda@gmail.com (INTERNAL_ADMIN)**
   - Login → Deve ir para /app/company
   - Tentar acessar /app/dashboard → Permitido
   - Logout → Deve limpar sessão

2. **Teste com alquimistafibonacci@gmail.com (INTERNAL_SUPPORT)**
   - Login → Deve ir para /app/company
   - Tentar acessar /app/dashboard → Permitido
   - Logout → Deve limpar sessão

3. **Teste com marcello@c3comercial.com.br (TENANT_ADMIN)**
   - Login → Deve ir para /app/dashboard
   - Tentar acessar /app/company → Bloqueado, redirecionar para /app/dashboard
   - Logout → Deve limpar sessão

4. **Teste com leylany@c3comercial.com.br (TENANT_USER)**
   - Login → Deve ir para /app/dashboard
   - Tentar acessar /app/company → Bloqueado, redirecionar para /app/dashboard
   - Logout → Deve limpar sessão

## Security Considerations

### Token Storage

- Usar cookies HTTP-only para prevenir acesso via JavaScript
- Usar flag Secure para garantir transmissão apenas via HTTPS
- Usar SameSite=Strict para prevenir CSRF

### Token Validation

- Sempre validar expiração antes de usar token
- Validar issuer (iss) do token
- Validar audience (aud) do token

### Route Protection

- Middleware deve validar TODOS os acessos a /app/*
- Nunca confiar em estado do cliente
- Sempre re-validar grupos no servidor

### Error Messages

- Não expor detalhes técnicos em mensagens de erro
- Usar mensagens genéricas para falhas de autenticação
- Logar detalhes técnicos apenas no servidor

## Configuration

### Environment Variables

```bash
# .env.local (Development)
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_Y8p2TeMbv
NEXT_PUBLIC_COGNITO_CLIENT_ID=59fs99tv0sbrmelkqef83itenu
NEXT_PUBLIC_COGNITO_DOMAIN_HOST=us-east-1y8p2tembv.auth.us-east-1.amazoncognito.com
NEXT_PUBLIC_COGNITO_REDIRECT_URI=http://localhost:3000/auth/callback
NEXT_PUBLIC_COGNITO_LOGOUT_URI=http://localhost:3000/auth/login
NEXT_PUBLIC_AWS_REGION=us-east-1

# .env.production (Production)
NEXT_PUBLIC_COGNITO_USER_POOL_ID=<prod-pool-id>
NEXT_PUBLIC_COGNITO_CLIENT_ID=<prod-client-id>
NEXT_PUBLIC_COGNITO_DOMAIN_HOST=<prod-domain>.auth.us-east-1.amazoncognito.com
NEXT_PUBLIC_COGNITO_REDIRECT_URI=https://app.alquimista.ai/auth/callback
NEXT_PUBLIC_COGNITO_LOGOUT_URI=https://app.alquimista.ai/auth/login
NEXT_PUBLIC_AWS_REGION=us-east-1
```

### Cognito Configuration

- **User Pool**: fibonacci-users-dev (DEV) / fibonacci-users-prod (PROD)
- **App Client**: Configurado com OAuth 2.0
- **Allowed OAuth Flows**: Authorization code grant
- **Allowed OAuth Scopes**: openid, email, profile
- **Callback URLs**: http://localhost:3000/auth/callback (DEV)
- **Sign out URLs**: http://localhost:3000/auth/login (DEV)

## Implementation Notes

### Ordem de Implementação

1. Atualizar `cognito-client.ts` com funções OAuth
2. Atualizar `auth-store.ts` com mapeamento de grupos
3. Implementar página `/auth/callback`
4. Atualizar `middleware.ts` com validação de grupos
5. Atualizar página `/auth/login` com botão OAuth
6. Implementar logout completo
7. Testar com 4 usuários DEV
8. Documentar processo

### Bibliotecas Necessárias

- `amazon-cognito-identity-js`: Já instalada
- `js-cookie`: Para manipulação de cookies (opcional)
- `jsonwebtoken`: Para decodificar JWT (ou usar Buffer nativo)

### Compatibilidade

- Next.js 14+ (App Router)
- React 18+
- TypeScript 5+
- Node.js 20+

## Diagrams

### Sequence Diagram: Login Flow

```
Usuário          Login Page       Cognito          Callback Page      Middleware
   │                 │                │                  │                 │
   │──Click Login───▶│                │                  │                 │
   │                 │──Redirect─────▶│                  │                 │
   │                 │                │◀─Hosted UI──────▶│                 │
   │                 │                │                  │                 │
   │                 │                │──Code───────────▶│                 │
   │                 │                │                  │──Exchange──────▶│
   │                 │                │                  │◀─Tokens────────│
   │                 │                │                  │                 │
   │                 │                │                  │──Store Cookies─▶│
   │                 │                │                  │──Extract Groups─▶│
   │                 │                │                  │                 │
   │◀─Redirect to Dashboard──────────────────────────────│                 │
   │                 │                │                  │                 │
```

### State Diagram: Authentication States

```
┌─────────────┐
│ Unauthenticated │
└─────────────┘
       │
       │ Login
       ▼
┌─────────────┐
│ Authenticating │
└─────────────┘
       │
       │ Success
       ▼
┌─────────────┐
│ Authenticated │
└─────────────┘
       │
       │ Logout / Token Expired
       ▼
┌─────────────┐
│ Unauthenticated │
└─────────────┘
```

## Performance Considerations

- Tokens devem ser validados apenas uma vez por requisição
- Cache de claims do usuário no estado do cliente
- Renovação automática de tokens antes da expiração (futuro)
- Lazy loading de componentes de dashboard

## Monitoring and Logging

### Métricas a Monitorar

- Taxa de sucesso de login
- Tempo de resposta do callback
- Erros de troca de tokens
- Tentativas de acesso não autorizado

### Logs Importantes

```typescript
// Login iniciado
console.log('[Auth] Iniciando login OAuth', { timestamp: Date.now() });

// Callback recebido
console.log('[Auth] Callback recebido', { code: code.substring(0, 10) + '...' });

// Tokens obtidos
console.log('[Auth] Tokens obtidos', { expiresIn: tokens.expiresIn });

// Grupos extraídos
console.log('[Auth] Grupos extraídos', { groups: claims['cognito:groups'] });

// Redirecionamento
console.log('[Auth] Redirecionando', { route, groups });

// Erro
console.error('[Auth] Erro', { error: error.message, code: error.code });
```

## Future Enhancements

1. **Renovação Automática de Tokens**
   - Usar refresh token antes da expiração
   - Renovação silenciosa em background

2. **MFA Support**
   - Suporte a autenticação multi-fator
   - Configuração por usuário

3. **Social Login**
   - Google, Facebook, Microsoft
   - Configuração no Cognito

4. **Remember Me**
   - Sessão persistente
   - Configuração de duração

5. **Audit Log**
   - Registrar todos os logins
   - Registrar tentativas falhadas
   - Dashboard de segurança
