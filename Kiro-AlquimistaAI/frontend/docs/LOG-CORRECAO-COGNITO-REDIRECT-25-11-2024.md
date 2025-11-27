# Log de Correção - Cognito Redirect Mismatch

**Data:** 25/11/2024  
**Problema:** Erro `redirect_mismatch` ao tentar fazer login

---

## ❌ Problema Identificado

1. **Redirect Mismatch:**
   - Frontend rodando em: `http://localhost:3000`
   - Cognito configurado para: `http://localhost:3002`
   - Erro: `error=redirect_mismatch&client_id=59fs99tv0sbrmelkqef83itenu`

2. **Content Security Policy:**
   - CSP bloqueando recursos do Google Translate
   - Erro: `Loading the stylesheet 'https://www.gstatic.com/_/translate_http/_/ss/...' violates CSP`

---

## ✅ Correções Aplicadas

### 1. Atualizado `.env.local`

Alterado todas as URLs de `localhost:3002` para `localhost:3000`:

```env
COGNITO_REDIRECT_URI=http://localhost:3000/auth/callback
COGNITO_LOGOUT_REDIRECT_URI=http://localhost:3000/auth/logout
NEXT_PUBLIC_COGNITO_REDIRECT_URI=http://localhost:3000/auth/callback
NEXT_PUBLIC_COGNITO_LOGOUT_URI=http://localhost:3000/auth/logout-callback
```

### 2. Atualizado CSP no Middleware

Adicionado permissões para:
- `https://www.gstatic.com` (Google Translate)
- `https://*.execute-api.us-east-1.amazonaws.com` (API Gateway)
- `https://*.amazoncognito.com` (Cognito)

```typescript
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://www.gstatic.com;
  style-src 'self' 'unsafe-inline' https://www.gstatic.com;
  img-src 'self' data: https: blob:;
  font-src 'self' data: https://www.gstatic.com;
  connect-src 'self' https://api.alquimista.ai https://*.execute-api.us-east-1.amazonaws.com https://*.amazoncognito.com wss://;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
`.replace(/\s{2,}/g, ' ').trim();
```

---

## 🔧 Ação Necessária no AWS Console

**IMPORTANTE:** Você precisa configurar o App Client no Cognito:

### Passo a Passo:

1. **Acessar AWS Console:**
   - Serviço: Amazon Cognito
   - Região: us-east-1
   - User Pool: `us-east-1_Y8p2TeMbv`

2. **Atualizar App Client:**
   - Client ID: `59fs99tv0sbrmelkqef83itenu`
   - Ir em: **App integration** → **App clients**
   - Clicar no client

3. **Configurar OAuth 2.0:**

   **Allowed callback URLs:**
   ```
   http://localhost:3000/auth/callback
   ```

   **Allowed sign-out URLs:**
   ```
   http://localhost:3000/auth/logout-callback
   ```

   **Allowed OAuth Flows:**
   - ✅ Authorization code grant
   
   **Allowed OAuth Scopes:**
   - ✅ openid
   - ✅ email
   - ❌ profile (NÃO marcar - causa invalid_scope)
   - ❌ phone (NÃO marcar - causa invalid_scope)
   - ❌ aws.cognito.signin.user.admin (NÃO marcar)

4. **Salvar alterações**

---

## 🧪 Validação

Após atualizar o Cognito:

1. **Reiniciar o servidor:**
   ```powershell
   cd frontend
   npm run dev
   ```

2. **Testar login:**
   - Acessar: `http://localhost:3000`
   - Clicar em "Login"
   - Verificar se redireciona corretamente para Cognito
   - Após login, verificar se retorna para `/auth/callback`

3. **Verificar console do navegador:**
   - Não deve haver erros de CSP
   - Não deve haver erros de redirect_mismatch

---

## 📋 Checklist

- [x] Atualizado `.env.local` com `localhost:3000`
- [x] Atualizado CSP no middleware
- [x] Corrigido scopes OAuth (removido `profile`)
- [ ] **Atualizar configuração no Cognito (AWS Console)** ⚠️ CRÍTICO
- [ ] Testar fluxo de login completo
- [ ] Verificar ausência de erros no console

---

## ⚠️ ATENÇÃO: Configuração Obrigatória no AWS Console

**O login NÃO funcionará até que você configure o Cognito corretamente!**

### Erros que você verá se não configurar:

1. ❌ `redirect_mismatch` - URLs de callback não configuradas
2. ❌ `invalid_scope` - Scopes OAuth não habilitados

### O que fazer AGORA:

1. Abra o AWS Console
2. Vá para Amazon Cognito → User Pools
3. Selecione: `us-east-1_Y8p2TeMbv`
4. Vá em: **App integration** → **App clients**
5. Clique no client: `59fs99tv0sbrmelkqef83itenu`
6. Clique em **Edit**
7. Configure conforme descrito acima
8. Clique em **Save changes**

---

## 🔗 Referências

- User Pool ID: `us-east-1_Y8p2TeMbv`
- Client ID: `59fs99tv0sbrmelkqef83itenu`
- Domain: `us-east-1y8p2tembv.auth.us-east-1.amazoncognito.com`
