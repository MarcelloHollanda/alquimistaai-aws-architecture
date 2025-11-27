# Log de Implementação PKCE - 25/11/2024

## ❌ Problema Identificado

O código **NÃO implementava PKCE** (Proof Key for Code Exchange), causando erro `invalid_grant` no fluxo OAuth 2.0 com Cognito.

### Sintomas

- Erro `invalid_grant` ao trocar código de autorização por tokens
- Falha no callback após login com Google/Facebook
- Mensagem: "Failed to exchange code for tokens"

### Causa Raiz

**PKCE é obrigatório** para aplicações públicas (SPAs) no OAuth 2.0. Sem ele:

1. O Cognito rejeita a troca de código por tokens
2. Retorna erro `invalid_grant`
3. O fluxo de autenticação falha

## ✅ Solução Implementada

### 1. Geração de PKCE no Início do Fluxo

**Funções afetadas:**
- `initOAuthFlow()`
- `signInWithGoogle()`
- `signInWithFacebook()`

**Implementação:**

```typescript
// Gerar code_verifier (string aleatória de 128 caracteres)
const codeVerifier = generateRandomString(128);

// Gerar code_challenge (SHA-256 + base64url do code_verifier)
const codeChallenge = await generateCodeChallenge(codeVerifier);

// ✅ SALVAR code_verifier em sessionStorage
sessionStorage.setItem('pkce_code_verifier', codeVerifier);

// Adicionar code_challenge na URL de autorização
const url = `https://${domain}/oauth2/authorize?` +
  `...&` +
  `code_challenge=${codeChallenge}&` +
  `code_challenge_method=S256`;
```

### 2. Recuperação e Envio do code_verifier no Callback

**Função afetada:**
- `exchangeCodeForTokens()`

**Implementação:**

```typescript
// ✅ RECUPERAR code_verifier do sessionStorage
const codeVerifier = sessionStorage.getItem('pkce_code_verifier');

if (!codeVerifier) {
  throw new Error('PKCE code_verifier ausente');
}

// ✅ ENVIAR code_verifier no body da requisição
const params = new URLSearchParams({
  grant_type: 'authorization_code',
  client_id: config.clientId,
  redirect_uri: config.redirectUri,
  code,
  code_verifier: codeVerifier, // ✅ CRÍTICO!
});

// ✅ LIMPAR code_verifier após uso
sessionStorage.removeItem('pkce_code_verifier');
```

### 3. Funções Auxiliares Criadas

```typescript
/**
 * Gera string aleatória para PKCE
 */
function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  return Array.from(randomValues)
    .map(v => charset[v % charset.length])
    .join('');
}

/**
 * Gera code_challenge a partir do code_verifier (SHA-256 + base64url)
 */
async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  
  // Converter para base64url
  const base64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
```

## 🔍 Fluxo PKCE Completo

### Passo 1: Início do Login

```
Usuário clica "Login com Google"
         ↓
generateRandomString(128) → code_verifier
         ↓
SHA-256(code_verifier) → hash
         ↓
base64url(hash) → code_challenge
         ↓
sessionStorage.setItem('pkce_code_verifier', code_verifier)
         ↓
Redirecionar para:
/oauth2/authorize?
  ...
  &code_challenge=<code_challenge>
  &code_challenge_method=S256
```

### Passo 2: Callback

```
Cognito redireciona para /auth/callback?code=xxx
         ↓
code_verifier = sessionStorage.getItem('pkce_code_verifier')
         ↓
POST /oauth2/token
  grant_type=authorization_code
  client_id=xxx
  redirect_uri=xxx
  code=xxx
  code_verifier=<code_verifier> ✅
         ↓
Cognito valida:
  SHA-256(code_verifier) == code_challenge original?
         ↓
Se OK: retorna tokens
Se FALHA: invalid_grant
         ↓
sessionStorage.removeItem('pkce_code_verifier')
```

## 🎯 Pontos Críticos

### ✅ O que DEVE acontecer

1. **code_verifier** gerado no início do fluxo
2. **code_challenge** calculado e enviado para `/authorize`
3. **code_verifier** salvo em `sessionStorage`
4. **code_verifier** recuperado no callback
5. **code_verifier** enviado para `/token`
6. **code_verifier** limpo após uso

### ❌ O que PODE dar errado

1. **code_verifier vazio**: sessionStorage foi limpo ou hot reload
2. **code_verifier diferente**: Múltiplas tentativas de login simultâneas
3. **code_verifier não enviado**: Esqueceu de adicionar no body
4. **code_challenge incorreto**: Erro no cálculo SHA-256 ou base64url

## 📊 Logs de Debug

### Logs Adicionados

```typescript
// No início do fluxo
console.log('[Cognito] PKCE gerado', {
  codeVerifierLength: codeVerifier.length,
  codeChallengeLength: codeChallenge.length,
});

// No callback
console.log('[Cognito] code_verifier recuperado', {
  length: codeVerifier.length,
  preview: codeVerifier.substring(0, 20) + '...',
});

// Em caso de erro
console.error('[Cognito] Erro ao trocar código por tokens:', {
  status: response.status,
  statusText: response.statusText,
  error: data,
  codeVerifierPresent: !!codeVerifier,
  redirectUri: config.redirectUri,
});
```

## 🧪 Como Testar

### 1. Limpar sessionStorage

```javascript
sessionStorage.clear();
```

### 2. Iniciar Login

```
http://localhost:3000
Clicar em "Login com Google"
```

### 3. Verificar Console

```
[Cognito] PKCE gerado { codeVerifierLength: 128, codeChallengeLength: 43 }
[Cognito] Iniciando fluxo OAuth com PKCE
```

### 4. Após Callback

```
[Cognito] code_verifier recuperado { length: 128, preview: 'abc...' }
[Cognito] Trocando código por tokens com PKCE
[Cognito] Tokens obtidos com sucesso { expiresIn: 3600 }
```

### 5. Verificar sessionStorage

```javascript
// Antes do callback
sessionStorage.getItem('pkce_code_verifier'); // deve retornar string de 128 chars

// Depois do callback
sessionStorage.getItem('pkce_code_verifier'); // deve retornar null (foi limpo)
```

## 🔒 Segurança

### Por que PKCE é importante?

1. **Previne ataques de interceptação de código**: Mesmo que um atacante intercepte o `code`, não consegue trocá-lo por tokens sem o `code_verifier`
2. **Obrigatório para SPAs**: Aplicações públicas não podem manter segredos (client_secret)
3. **Padrão OAuth 2.1**: PKCE será obrigatório em todas as aplicações OAuth 2.1

### Especificação

- **RFC 7636**: Proof Key for Code Exchange by OAuth Public Clients
- **code_verifier**: 43-128 caracteres, charset: `[A-Z][a-z][0-9]-._~`
- **code_challenge_method**: `S256` (SHA-256) ou `plain` (não recomendado)

## 📝 Arquivos Modificados

- `frontend/src/lib/cognito-client.ts`
  - ✅ Adicionada função `generateRandomString()`
  - ✅ Adicionada função `generateCodeChallenge()`
  - ✅ Modificada função `initOAuthFlow()` - agora async
  - ✅ Modificada função `signInWithGoogle()` - agora async
  - ✅ Modificada função `signInWithFacebook()` - agora async
  - ✅ Modificada função `exchangeCodeForTokens()` - recupera e envia code_verifier

## ✅ Resultado Esperado

Após essa implementação:

1. ✅ Login com Google funciona sem erro `invalid_grant`
2. ✅ Login com Facebook funciona sem erro `invalid_grant`
3. ✅ OAuth flow completo funciona corretamente
4. ✅ Tokens são obtidos com sucesso
5. ✅ Usuário é redirecionado para dashboard

## 🚀 Próximos Passos

1. Testar login com Google
2. Testar login com Facebook
3. Verificar logs no console
4. Confirmar que não há mais erro `invalid_grant`
5. Adicionar usuário ao grupo `INTERNAL_ADMIN` se necessário

---

**Data**: 25/11/2024  
**Autor**: Kiro AI  
**Tipo**: Correção Crítica - PKCE Implementation  
**Status**: ✅ Implementado
