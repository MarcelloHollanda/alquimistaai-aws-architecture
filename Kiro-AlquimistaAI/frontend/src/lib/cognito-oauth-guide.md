# Guia de Uso - Funções OAuth do Cognito

## Visão Geral

Este guia explica como usar as funções OAuth implementadas no `cognito-client.ts` para autenticação com Amazon Cognito via Hosted UI.

## Funções Disponíveis

### 1. `initOAuthFlow()`

Inicia o fluxo OAuth redirecionando o usuário para o Cognito Hosted UI.

**Uso:**
```typescript
import { initOAuthFlow } from '@/lib/cognito-client';

// Em um componente de login
const handleLogin = () => {
  initOAuthFlow();
};
```

**O que acontece:**
- Usuário é redirecionado para `https://{domain}/oauth2/authorize`
- Cognito exibe tela de login
- Após autenticação, Cognito redireciona para `/auth/callback` com código

---

### 2. `exchangeCodeForTokens(code: string)`

Troca o código de autorização por tokens JWT.

**Uso:**
```typescript
import { exchangeCodeForTokens } from '@/lib/cognito-client';

// Na página de callback
const code = searchParams.get('code');
if (code) {
  const tokens = await exchangeCodeForTokens(code);
  // tokens contém: idToken, accessToken, refreshToken, expiresIn
}
```

**Retorno:**
```typescript
{
  idToken: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
```

---

### 3. `storeTokensInCookies(tokens: TokenSet)`

Armazena tokens em cookies HTTP-only seguros.

**Uso:**
```typescript
import { storeTokensInCookies } from '@/lib/cognito-client';

// Após obter tokens
await storeTokensInCookies(tokens);
```

**Características:**
- ✅ Cookies HTTP-only (não acessíveis via JavaScript)
- ✅ Secure flag (apenas HTTPS em produção)
- ✅ SameSite=Strict (proteção CSRF)
- ✅ Expira em 1 hora (ID/Access) ou 30 dias (Refresh)

**Implementação:**
- Chama API route `/api/auth/set-tokens`
- API route define cookies no servidor
- Garante segurança máxima

---

### 4. `getTokensFromCookies()`

Recupera tokens dos cookies (uso limitado no cliente).

**Uso:**
```typescript
import { getTokensFromCookies } from '@/lib/cognito-client';

const tokens = getTokensFromCookies();
if (tokens) {
  // Tokens disponíveis
}
```

**⚠️ IMPORTANTE:**
- Cookies HTTP-only **não são acessíveis** via JavaScript no cliente
- Esta função retorna `null` no cliente
- Para validar tokens, use **middleware** no servidor
- Middleware tem acesso aos cookies HTTP-only

---

### 5. `clearTokensFromCookies()`

Limpa todos os cookies de autenticação.

**Uso:**
```typescript
import { clearTokensFromCookies } from '@/lib/cognito-client';

// Durante logout
await clearTokensFromCookies();
```

**Implementação:**
- Chama API route `/api/auth/clear-tokens`
- API route remove cookies no servidor

---

## Fluxo Completo de Login

```typescript
// 1. Página de Login (/auth/login)
import { initOAuthFlow } from '@/lib/cognito-client';

export default function LoginPage() {
  return (
    <button onClick={() => initOAuthFlow()}>
      Entrar com Cognito
    </button>
  );
}

// 2. Página de Callback (/auth/callback)
import { exchangeCodeForTokens, storeTokensInCookies } from '@/lib/cognito-client';
import { useSearchParams, useRouter } from 'next/navigation';

export default function CallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      
      if (!code) {
        router.push('/auth/login?error=no_code');
        return;
      }

      try {
        // Trocar código por tokens
        const tokens = await exchangeCodeForTokens(code);
        
        // Armazenar em cookies HTTP-only
        await storeTokensInCookies(tokens);
        
        // Extrair grupos e redirecionar
        const groups = extractGroupsFromToken(tokens.idToken);
        const route = getRouteForGroups(groups);
        
        router.push(route);
      } catch (error) {
        console.error('Erro no callback:', error);
        router.push('/auth/login?error=callback_failed');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return <div>Processando login...</div>;
}
```

---

## Fluxo Completo de Logout

```typescript
// Página de Logout (/auth/logout)
import { initLogoutFlow } from '@/lib/cognito-client';

export default function LogoutPage() {
  useEffect(() => {
    const handleLogout = async () => {
      // Limpa cookies e redireciona para Cognito logout
      await initLogoutFlow();
    };

    handleLogout();
  }, []);

  return <div>Encerrando sessão...</div>;
}
```

---

## Validação de Tokens no Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTokenCookies } from '@/lib/server-cookies';

export function middleware(request: NextRequest) {
  // Recuperar tokens dos cookies HTTP-only
  const tokens = getTokenCookies();

  if (!tokens) {
    // Redirecionar para login
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Validar expiração, extrair grupos, etc.
  // ...

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*'],
};
```

---

## Segurança

### Cookies HTTP-only

Os tokens são armazenados em cookies HTTP-only, o que significa:

- ✅ **Não acessíveis via JavaScript** (proteção contra XSS)
- ✅ **Enviados automaticamente** em requisições ao servidor
- ✅ **Validados no middleware** antes de acessar rotas protegidas

### Flags de Segurança

Todos os cookies têm:

- `httpOnly: true` - Não acessível via JavaScript
- `secure: true` - Apenas HTTPS (produção)
- `sameSite: 'strict'` - Proteção CSRF
- `path: '/'` - Disponível em toda aplicação

### Expiração

- **ID Token / Access Token**: 1 hora
- **Refresh Token**: 30 dias

---

## Troubleshooting

### Erro: "Tokens inválidos"

**Causa:** Tokens não foram fornecidos ou estão mal formatados

**Solução:** Verificar se `exchangeCodeForTokens` retornou tokens válidos

### Erro: "Falha ao armazenar tokens"

**Causa:** API route `/api/auth/set-tokens` não está respondendo

**Solução:** Verificar se a API route existe e está funcionando

### Tokens não persistem após refresh

**Causa:** Cookies não estão sendo definidos corretamente

**Solução:** 
1. Verificar se `storeTokensInCookies` foi chamado com `await`
2. Verificar logs do servidor para erros
3. Verificar cookies no DevTools (Application > Cookies)

### Middleware não encontra tokens

**Causa:** Cookies HTTP-only não estão sendo enviados

**Solução:**
1. Verificar se domínio está correto
2. Verificar se `sameSite` está configurado corretamente
3. Em desenvolvimento, usar `http://localhost:3000` (não `127.0.0.1`)

---

## Referências

- [Amazon Cognito OAuth 2.0](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-app-integration.html)
- [Next.js Cookies](https://nextjs.org/docs/app/api-reference/functions/cookies)
- [HTTP-only Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#restrict_access_to_cookies)
