# API Routes de Autenticação

Este diretório contém as API routes necessárias para gerenciar cookies HTTP-only de autenticação.

## Rotas Disponíveis

### POST `/api/auth/set-tokens`

Armazena tokens JWT em cookies HTTP-only seguros.

**Request Body:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

**Response:**
```json
{
  "success": true
}
```

**Cookies Definidos:**
- `idToken` - HTTP-only, Secure, SameSite=Strict, Max-Age=3600
- `accessToken` - HTTP-only, Secure, SameSite=Strict, Max-Age=3600
- `refreshToken` - HTTP-only, Secure, SameSite=Strict, Max-Age=2592000 (30 dias)

**Uso:**
```typescript
const response = await fetch('/api/auth/set-tokens', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(tokens),
});
```

---

### POST `/api/auth/clear-tokens`

Remove todos os cookies de autenticação.

**Request Body:** Nenhum

**Response:**
```json
{
  "success": true
}
```

**Cookies Removidos:**
- `idToken`
- `accessToken`
- `refreshToken`

**Uso:**
```typescript
const response = await fetch('/api/auth/clear-tokens', {
  method: 'POST',
});
```

---

## Segurança

### Por que API Routes?

Cookies HTTP-only **não podem ser definidos via JavaScript** no cliente (`document.cookie`). Apenas o servidor pode definir cookies HTTP-only.

**Benefícios:**
- ✅ Proteção contra XSS (Cross-Site Scripting)
- ✅ Tokens não acessíveis via JavaScript malicioso
- ✅ Enviados automaticamente em requisições ao servidor

### Flags de Segurança

Todos os cookies são definidos com:

```typescript
{
  httpOnly: true,        // Não acessível via JavaScript
  secure: true,          // Apenas HTTPS (produção)
  sameSite: 'strict',    // Proteção CSRF
  path: '/',             // Disponível em toda aplicação
  maxAge: 3600           // Expira em 1 hora
}
```

---

## Fluxo de Uso

### 1. Login (Callback)

```typescript
// /auth/callback/page.tsx
const code = searchParams.get('code');
const tokens = await exchangeCodeForTokens(code);

// Armazenar em cookies HTTP-only via API route
await fetch('/api/auth/set-tokens', {
  method: 'POST',
  body: JSON.stringify(tokens),
});
```

### 2. Validação (Middleware)

```typescript
// middleware.ts
import { getTokenCookies } from '@/lib/server-cookies';

export function middleware(request: NextRequest) {
  // Cookies HTTP-only são acessíveis no servidor
  const tokens = getTokenCookies();
  
  if (!tokens) {
    return NextResponse.redirect('/auth/login');
  }
  
  // Validar tokens, extrair grupos, etc.
}
```

### 3. Logout

```typescript
// /auth/logout/page.tsx
await fetch('/api/auth/clear-tokens', {
  method: 'POST',
});

// Redirecionar para Cognito logout
window.location.href = cognitoLogoutUrl;
```

---

## Troubleshooting

### Erro 400: "Tokens inválidos"

**Causa:** Request body não contém `idToken` e `accessToken`

**Solução:** Verificar se tokens foram obtidos corretamente de `exchangeCodeForTokens`

### Erro 500: "Erro ao armazenar tokens"

**Causa:** Erro interno ao definir cookies

**Solução:** Verificar logs do servidor para detalhes

### Cookies não aparecem no DevTools

**Causa:** Cookies HTTP-only não são visíveis na aba "Application > Cookies" do DevTools

**Solução:** Isso é esperado! Cookies HTTP-only são intencionalmente ocultos do JavaScript. Verificar no middleware se estão presentes.

### Cookies não são enviados em requisições

**Causa:** Domínio ou `sameSite` incorreto

**Solução:**
1. Usar `http://localhost:3000` (não `127.0.0.1`)
2. Verificar se `sameSite: 'strict'` está correto
3. Em produção, usar HTTPS

---

## Referências

- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Next.js Cookies](https://nextjs.org/docs/app/api-reference/functions/cookies)
- [HTTP-only Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#restrict_access_to_cookies)
- [OWASP Cookie Security](https://owasp.org/www-community/controls/SecureCookieAttribute)
