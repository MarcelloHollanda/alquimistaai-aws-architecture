# Log de Correção: Redirect URI Centralizado - 25/11/2024

## Problema Identificado

Possível inconsistência no `redirect_uri` entre:
- URL de autorização (`/oauth2/authorize`)
- Troca de código por token (`/oauth2/token`)

Isso causa erro `invalid_grant` no Cognito.

## Análise Realizada

### ✅ Arquivo: `frontend/src/lib/cognito-client.ts`

**Status**: CORRETO

Ambas as funções usam a mesma constante centralizada:

```typescript
function getCognitoConfig(): CognitoConfig {
  const config = {
    redirectUri: process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI || '',
    // ...
  };
  return config;
}

// Na URL de autorização
export const initOAuthFlow = (): void => {
  const config = getCognitoConfig();
  const url = `https://${config.domain}/oauth2/authorize?` +
    `redirect_uri=${encodeURIComponent(config.redirectUri)}`;
  // ...
}

// Na troca de código por token
export const exchangeCodeForTokens = async (code: string): Promise<TokenSet> => {
  const config = getCognitoConfig();
  const params = new URLSearchParams({
    redirect_uri: config.redirectUri, // ✅ MESMA CONSTANTE
    // ...
  });
  // ...
}
```

### ✅ Arquivo: `frontend/.env.local`

**Status**: CORRETO

```env
NEXT_PUBLIC_COGNITO_REDIRECT_URI=http://localhost:3000/auth/callback
```

### ✅ Arquivo: `frontend/src/app/auth/callback/page.tsx`

**Status**: CORRETO

Não há redirect_uri hardcoded. Usa apenas `cognitoClient.exchangeCodeForTokens(code)`.

## Verificação de Possíveis Problemas

### 1. Porta Diferente (localhost:3002 vs localhost:3000)

❌ **NÃO ENCONTRADO** - Não há referências a `localhost:3002` no código.

### 2. Trailing Slash

✅ **OK** - Não há trailing slash em `/auth/callback`

### 3. Protocolo (http vs https)

✅ **OK** - Usando `http://localhost:3000` consistentemente em dev

### 4. URL Encoding

✅ **OK** - Usando `encodeURIComponent()` na URL de autorização

## Checklist de Validação

- [x] `getCognitoConfig()` retorna sempre a mesma constante
- [x] `initOAuthFlow()` usa `config.redirectUri`
- [x] `exchangeCodeForTokens()` usa `config.redirectUri`
- [x] `.env.local` tem valor correto
- [x] Não há valores hardcoded em outros arquivos
- [x] Callback page não manipula redirect_uri

## Configuração no Cognito Console

Para garantir que funcione, verifique no AWS Cognito Console:

1. **User Pool** → **App Integration** → **App client settings**
2. **Callback URL(s)**: `http://localhost:3000/auth/callback`
3. **Sign out URL(s)**: `http://localhost:3000/auth/logout-callback`
4. **Allowed OAuth Flows**: ✅ Authorization code grant
5. **Allowed OAuth Scopes**: ✅ openid, ✅ email

## Comandos de Teste

```powershell
# Verificar variáveis de ambiente
cd frontend
Get-Content .env.local | Select-String "REDIRECT_URI"

# Buscar por redirect_uri hardcoded
cd ..
rg "localhost:3002" frontend/src --type ts --type tsx
rg "redirect_uri.*http" frontend/src --type ts --type tsx
```

## Conclusão

✅ **O código está CORRETO e centralizado.**

O `redirect_uri` é obtido de uma única fonte (`getCognitoConfig()`) e usado consistentemente em:
- Autorização OAuth
- Troca de código por token

Se ainda houver erro `invalid_grant`, verificar:
1. Configuração no Cognito Console (callback URLs)
2. Valor exato em `.env.local`
3. Cache do navegador (limpar cookies/localStorage)
4. Logs do navegador para ver qual URL está sendo usada

---

**Data**: 25/11/2024  
**Autor**: Kiro AI  
**Status**: ✅ Validado
