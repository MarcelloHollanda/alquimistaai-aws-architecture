# Fluxos OAuth - Google e Facebook

## Visão Geral

Documentação completa dos fluxos de autenticação OAuth com Google e Facebook no sistema AlquimistaAI.

---

## Configuração no Cognito

### 1. Google OAuth

#### Pré-requisitos
1. Criar projeto no Google Cloud Console
2. Habilitar Google+ API
3. Criar credenciais OAuth 2.0

#### Configuração no Cognito

```bash
# Via AWS Console
1. Acessar User Pool → Sign-in experience → Federated identity providers
2. Adicionar Google
3. Configurar:
   - Client ID: [seu-client-id].apps.googleusercontent.com
   - Client Secret: [seu-client-secret]
   - Authorized scopes: openid email profile
```

#### Callback URLs

```
Development: http://localhost:3000/auth/callback
Production: https://app.alquimistaai.com/auth/callback
```

### 2. Facebook OAuth

#### Pré-requisitos
1. Criar app no Facebook Developers
2. Adicionar produto "Facebook Login"
3. Obter App ID e App Secret

#### Configuração no Cognito

```bash
# Via AWS Console
1. Acessar User Pool → Sign-in experience → Federated identity providers
2. Adicionar Facebook
3. Configurar:
   - App ID: [seu-app-id]
   - App Secret: [seu-app-secret]
   - Authorized scopes: public_profile email
```

---

## Fluxo Técnico Detalhado

### Fluxo OAuth (Authorization Code Grant)

```
┌─────────┐         ┌──────────┐         ┌─────────┐         ┌──────────┐
│ Usuário │         │ Frontend │         │ Cognito │         │ Provider │
└────┬────┘         └────┬─────┘         └────┬────┘         └────┬─────┘
     │                   │                    │                    │
     │ 1. Clica "Login"  │                    │                    │
     ├──────────────────>│                    │                    │
     │                   │                    │                    │
     │                   │ 2. Redireciona     │                    │
     │                   ├───────────────────>│                    │
     │                   │                    │                    │
     │                   │                    │ 3. Redireciona     │
     │                   │                    ├───────────────────>│
     │                   │                    │                    │
     │                   │                    │ 4. Usuário autentica
     │                   │                    │<───────────────────┤
     │                   │                    │                    │
     │                   │                    │ 5. Retorna code    │
     │                   │                    │<───────────────────┤
     │                   │                    │                    │
     │                   │ 6. Callback + code │                    │
     │                   │<───────────────────┤                    │
     │                   │                    │                    │
     │                   │ 7. Troca code por tokens               │
     │                   ├───────────────────>│                    │
     │                   │                    │                    │
     │                   │ 8. Retorna tokens  │                    │
     │                   │<───────────────────┤                    │
     │                   │                    │                    │
     │ 9. Redireciona    │                    │                    │
     │<──────────────────┤                    │                    │
```

---

## Implementação Frontend

### 1. Botões de Login Social

```typescript
// components/auth/social-login-buttons.tsx
import { signInWithGoogle, signInWithFacebook } from '@/lib/cognito-client';

<Button onClick={signInWithGoogle}>
  Continuar com Google
</Button>

<Button onClick={signInWithFacebook}>
  Continuar com Facebook
</Button>
```

### 2. Função de Redirecionamento

```typescript
// lib/cognito-client.ts
export function signInWithGoogle(): void {
  const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_APP_URL + '/auth/callback';

  const params = new URLSearchParams({
    identity_provider: 'Google',
    redirect_uri: redirectUri,
    response_type: 'code',
    client_id: clientId,
    scope: 'openid email profile',
  });

  window.location.href = `https://${domain}/oauth2/authorize?${params}`;
}
```

### 3. Processar Callback

```typescript
// app/auth/callback/page.tsx
import { handleOAuthCallback } from '@/lib/cognito-client';

const code = searchParams.get('code');
await handleOAuthCallback(code);

// Armazenar tokens em cookies
await fetch('/api/auth/session', {
  method: 'POST',
  body: JSON.stringify({ accessToken, idToken, refreshToken })
});

// Redirecionar
router.push('/app/dashboard');
```

---

## Configuração de Atributos Customizados

### Atributos no Cognito

```json
{
  "custom:tenantId": "uuid-da-empresa",
  "custom:role": "MASTER|ADMIN|OPERATIONAL|READ_ONLY"
}
```

### Mapeamento de Atributos OAuth

#### Google
```
email → email
name → name
picture → picture
```

#### Facebook
```
email → email
name → name
picture → picture
```

### Atualizar Atributos Após Login

```typescript
// Após primeiro login OAuth, atualizar atributos customizados
await adminUpdateUserAttributes({
  UserPoolId: userPoolId,
  Username: username,
  UserAttributes: [
    { Name: 'custom:tenantId', Value: tenantId },
    { Name: 'custom:role', Value: 'MASTER' }
  ]
});
```

---

## Segurança

### Validação de Tokens

```typescript
// middleware.ts
const idToken = request.cookies.get('idToken');
const payload = JSON.parse(
  Buffer.from(idToken.value.split('.')[1], 'base64').toString()
);

// Verificar expiração
if (payload.exp < Math.floor(Date.now() / 1000)) {
  // Token expirado, redirecionar para login
}
```

### Refresh Token Rotation

```typescript
// Quando access token expira
const refreshToken = cookies.get('refreshToken');

// Trocar refresh token por novos tokens
const newTokens = await refreshSession(refreshToken);

// Atualizar cookies
await fetch('/api/auth/session', {
  method: 'POST',
  body: JSON.stringify(newTokens)
});
```

---

## Troubleshooting OAuth

### Erro: "redirect_uri_mismatch"

**Causa**: URL de callback não está configurada no provider  
**Solução**: 
- Google: Adicionar URL em "Authorized redirect URIs"
- Facebook: Adicionar URL em "Valid OAuth Redirect URIs"

### Erro: "invalid_client"

**Causa**: Client ID ou Secret incorretos  
**Solução**: Verificar credenciais no Cognito e no provider

### Erro: "access_denied"

**Causa**: Usuário negou permissões  
**Solução**: Usuário precisa aceitar permissões solicitadas

### Usuário não tem tenantId após OAuth

**Causa**: Atributos customizados não foram configurados  
**Solução**: Implementar Lambda trigger "Pre Token Generation" para adicionar atributos

---

## Lambda Triggers (Opcional)

### Pre Token Generation

```typescript
// Adicionar atributos customizados ao token
export const handler = async (event: any) => {
  // Buscar tenantId do usuário no banco
  const user = await getUserByCognitoSub(event.request.userAttributes.sub);
  
  // Adicionar ao token
  event.response = {
    claimsOverrideDetails: {
      claimsToAddOrOverride: {
        'custom:tenantId': user.tenantId,
        'custom:role': user.role
      }
    }
  };
  
  return event;
};
```

### Post Confirmation

```typescript
// Criar usuário no banco após confirmação
export const handler = async (event: any) => {
  const { sub, email, name } = event.request.userAttributes;
  
  // Criar usuário no banco
  await createUser({
    cognitoSub: sub,
    email,
    name,
    tenantId: event.request.userAttributes['custom:tenantId']
  });
  
  return event;
};
```

---

## Referências

- [Amazon Cognito OAuth 2.0](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-app-integration.html)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login](https://developers.facebook.com/docs/facebook-login)

---

**Última atualização**: 18 de Novembro de 2025
