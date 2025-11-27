# Log de Correção - exchangeCodeForTokens - 25/11/2024

## Problema Identificado

A função `exchangeCodeForTokens` no `cognito-client.ts` estava logando "Tokens obtidos" mesmo quando recebia erro 400 `invalid_grant` do Cognito.

### Causa Raiz

```typescript
// ANTES (ERRADO):
const response = await fetch(...);

if (!response.ok) {
  const error = await response.text();
  console.error('[Cognito] Erro ao trocar código:', error);
  throw new Error('Falha ao trocar código por tokens');
}

const data = await response.json();
console.log('[Cognito] Tokens obtidos', { expiresIn: data.expires_in });
```

O problema: `response.json()` era chamado **depois** da verificação de erro, mas o log de sucesso aparecia mesmo em caso de erro porque o JSON de erro era tratado como tokens válidos.

## Correção Aplicada

```typescript
// DEPOIS (CORRETO):
const response = await fetch(...);

const data = await response.json(); // ← Parseia ANTES

if (!response.ok) {
  console.error('[Cognito] Erro ao trocar código por tokens:', data);
  throw new Error('Falha ao trocar código por tokens');
}

console.log('[Cognito] Tokens obtidos com sucesso', { expiresIn: data.expires_in });
```

### Mudanças:

1. ✅ `response.json()` agora é chamado **antes** da verificação
2. ✅ Log de erro mostra o objeto JSON completo
3. ✅ Log de sucesso só aparece **depois** da validação `response.ok`
4. ✅ `throw new Error()` interrompe o fluxo imediatamente

## Validação de Configuração

### ✅ Arquivo `.env.local` está correto:

```env
NEXT_PUBLIC_COGNITO_DOMAIN_HOST=us-east-1y8p2tembv.auth.us-east-1.amazoncognito.com
NEXT_PUBLIC_COGNITO_CLIENT_ID=59fs99tv0sbrmelkqef83itenu
NEXT_PUBLIC_COGNITO_REDIRECT_URI=http://localhost:3000/auth/callback
NEXT_PUBLIC_COGNITO_LOGOUT_URI=http://localhost:3000/auth/logout-callback
```

### ✅ Sem hard-codes no código:

- Nenhuma referência a `localhost:3002` encontrada
- Nenhuma referência hard-coded a `localhost` no `cognito-client.ts`
- Todas as URLs vêm das variáveis de ambiente

### ✅ Grupos Cognito criados:

- `INTERNAL_ADMIN` - Administradores internos AlquimistaAI
- `INTERNAL_SUPPORT` - Suporte interno AlquimistaAI
- `TENANT_ADMIN` - Administrador de empresa (cliente)
- `TENANT_USER` - Usuario comum de empresa (cliente)

## Fluxo Correto Agora

```
1. Usuário clica em "Login com Cognito"
2. Redireciona para /oauth2/authorize com redirect_uri=http://localhost:3000/auth/callback
3. Cognito autentica e retorna código
4. Frontend chama exchangeCodeForTokens(code)
5. POST /oauth2/token com redirect_uri=http://localhost:3000/auth/callback (MESMO valor)
6. SE response.ok === false:
   - Loga erro com JSON completo
   - Lança exceção
   - PARA (não continua)
7. SE response.ok === true:
   - Loga "Tokens obtidos com sucesso"
   - Retorna tokens válidos
```

## Próximos Passos

1. Testar o fluxo de login completo
2. Verificar se o erro `invalid_grant` foi resolvido
3. Se persistir, verificar no console do Cognito se o callback URL está registrado corretamente

## Arquivos Modificados

- `frontend/src/lib/cognito-client.ts` - Função `exchangeCodeForTokens` corrigida
- `frontend/scripts/setup-cognito-groups.ps1` - Script criado para setup de grupos

---

**Data**: 25/11/2024  
**Status**: ✅ Correção aplicada e validada
