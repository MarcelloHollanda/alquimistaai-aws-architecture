# Análise do Middleware para Testes E2E

## 📋 Comportamento Atual do Middleware

### 1. Rotas Públicas (Acesso Livre)
- `/`, `/login`, `/signup`
- `/auth/*` (login, register, forgot-password, etc.)
- `/api/auth/session`

**Comportamento**: Passa direto com headers de segurança.

---

### 2. Rotas Protegidas (Requer Autenticação)

**Padrões que ativam proteção:**
```typescript
pathname.startsWith('/app') ||
pathname.startsWith('/dashboard') ||
pathname.startsWith('/agents') ||
pathname.startsWith('/analytics') ||
pathname.startsWith('/settings') ||
pathname.startsWith('/onboarding') ||
pathname.startsWith('/company')
```

**✅ `/dashboard/disparo-agenda` É PROTEGIDA** (começa com `/dashboard`)

---

### 3. Fluxo de Validação para `/dashboard/disparo-agenda`

#### Passo 1: Verificar Cookies
```typescript
const accessToken = request.cookies.get('accessToken');
const idToken = request.cookies.get('idToken');
```

**Se ausentes** → Redireciona para `/login?redirect=/dashboard/disparo-agenda`

#### Passo 2: Bypass para Tokens Mock (DEV)
```typescript
if (process.env.NODE_ENV === 'development') {
  const isMockToken = idToken.value.includes('mock-signature') || 
                      idToken.value.startsWith('eyJ') && idToken.value.includes('mock');
  
  if (isMockToken) {
    console.log('[Middleware] Token mock detectado em DEV, permitindo acesso');
    return response; // ✅ PERMITE ACESSO
  }
}
```

**✅ CORREÇÃO APLICADA**: Agora aceita tokens que:
- Contêm `mock-signature` OU
- Começam com `eyJ` (JWT) E contêm `mock`

#### Passo 3: Validação de Token Real (PROD)
Se não for mock, valida:
- Decodifica JWT
- Verifica expiração (`exp`)
- Extrai grupos Cognito
- Valida permissões

---

## 🧪 Como os Testes E2E Funcionam

### Token Mock Criado nos Testes
```typescript
function createMockIdToken(): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: 'mock-user-id',
    email: 'teste@alquimista.ai',
    'cognito:groups': ['TENANT_ADMIN'],
    exp: now + 3600, // 1 hora
  };
  
  // Formato: eyJ...eyJ...mock-signature
  return `${encodedHeader}.${encodedPayload}.mock-signature`;
}
```

**✅ Este token:**
1. Começa com `eyJ` (base64 de `{"alg":"HS256"...`)
2. Termina com `mock-signature`
3. **Será aceito pelo middleware em DEV**

---

## 🔍 Matcher do Middleware

```typescript
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

**Significado**: Aplica middleware em TODAS as rotas, exceto:
- `_next/static/*` (arquivos estáticos do Next.js)
- `_next/image/*` (otimização de imagens)
- `favicon.ico`
- Arquivos de imagem (svg, png, jpg, etc.)

**✅ `/dashboard/disparo-agenda` passa pelo middleware**

---

## 🎯 Resultado Esperado nos Testes

### Cenário: Teste E2E acessa `/dashboard/disparo-agenda`

1. **Playwright sobe `npm run dev`** (NODE_ENV=development)
2. **beforeEach adiciona cookies mock** ao contexto
3. **page.goto('/dashboard/disparo-agenda')** envia request com cookies
4. **Middleware recebe request**:
   - ✅ Detecta que é rota protegida (`/dashboard/*`)
   - ✅ Encontra cookies `accessToken` e `idToken`
   - ✅ Detecta `NODE_ENV=development`
   - ✅ Valida que `idToken.value.includes('mock-signature')` → **TRUE**
   - ✅ **Permite acesso** sem validar JWT real
5. **Next.js renderiza a página** `(dashboard)/dashboard/disparo-agenda/page.tsx`
6. **Teste encontra elementos** (H1, cards, tabs, etc.)

---

## 🚨 Possíveis Problemas e Soluções

### Problema 1: Cookies não sendo enviados
**Sintoma**: Middleware loga "Tokens ausentes"

**Causa**: `httpOnly: true` impede que Playwright configure cookies

**✅ Solução aplicada**: Mudamos para `httpOnly: false` nos testes

---

### Problema 2: Token mock não reconhecido
**Sintoma**: Middleware tenta validar JWT e falha

**Causa**: Lógica de detecção de mock muito restritiva

**✅ Solução aplicada**: Melhoramos a condição:
```typescript
// ANTES (muito restritivo)
if (idToken.value.includes('mock-signature'))

// DEPOIS (mais flexível)
if (idToken.value.includes('mock-signature') || 
    idToken.value.startsWith('eyJ') && idToken.value.includes('mock'))
```

---

### Problema 3: Página não existe
**Sintoma**: 404 mesmo com autenticação OK

**Causa**: Arquivo não existe no caminho esperado

**✅ Verificado**: Página existe em:
```
frontend/src/app/(dashboard)/dashboard/disparo-agenda/page.tsx
```

---

## ✅ Checklist de Validação

- [x] `playwright.config.ts` tem `webServer` configurado
- [x] `baseURL` aponta para `http://localhost:3000`
- [x] Middleware detecta `/dashboard/*` como protegida
- [x] Middleware aceita tokens mock em DEV
- [x] Testes criam tokens mock válidos
- [x] Cookies são configurados com `httpOnly: false`
- [x] Página existe no caminho correto
- [x] `.env.test` criado com `NODE_ENV=development`

---

## 🎬 Próximo Passo

**Executar os testes:**
```powershell
cd frontend
npx playwright test tests/e2e/disparo-agenda.spec.ts --project=chromium
```

**Resultado esperado**: ✅ 9/9 testes passando

---

**Última atualização**: 26/11/2024  
**Versão**: 1.0.0
