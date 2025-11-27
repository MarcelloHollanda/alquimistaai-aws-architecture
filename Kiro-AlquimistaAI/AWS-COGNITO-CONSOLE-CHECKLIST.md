# ✅ Checklist - Configuração AWS Cognito Console

## 📋 Informações do User Pool

**User Pool ID:** `us-east-1_Y8p2TeMbv`  
**Região:** `us-east-1` (US East - N. Virginia)  
**Client ID:** `59fs99tv0sbrmelkqef83itenu`  
**Domain:** `us-east-1y8p2tembv.auth.us-east-1.amazoncognito.com`

---

## 🔧 Configurações Necessárias

### 1. App Client Settings

Acesse: **User Pools** → `us-east-1_Y8p2TeMbv` → **App Integration** → **App clients**

#### App Client: `alquimistaai-nextjs-frontend`

**Client ID:** `59fs99tv0sbrmelkqef83itenu`

---

### 2. Allowed Callback URLs ✅

Adicione as seguintes URLs:

#### Desenvolvimento
```
http://localhost:3000/auth/callback
```

#### Produção (quando fizer deploy)
```
https://alquimista.ai/auth/callback
```

**Como configurar:**
1. Clique no App Client
2. Vá em "Hosted UI"
3. Clique em "Edit"
4. Em "Allowed callback URLs", adicione as URLs acima
5. Clique em "Save changes"

---

### 3. Allowed Sign-out URLs ✅

Adicione as seguintes URLs:

#### Desenvolvimento
```
http://localhost:3000/auth/logout-callback
```

#### Produção (quando fizer deploy)
```
https://alquimista.ai/auth/logout-callback
```

**Como configurar:**
1. No mesmo local (Hosted UI settings)
2. Em "Allowed sign-out URLs", adicione as URLs acima
3. Clique em "Save changes"

---

### 4. OAuth 2.0 Flows ✅

Habilite o seguinte flow:

- ✅ **Authorization code grant**

**Como configurar:**
1. Em "OAuth 2.0 grant types"
2. Marque: **Authorization code grant**
3. Desmarque outros flows se não forem necessários
4. Clique em "Save changes"

---

### 5. OAuth Scopes ✅

Habilite os seguintes scopes:

- ✅ **openid**
- ✅ **email**
- ✅ **profile**

**Como configurar:**
1. Em "OpenID Connect scopes"
2. Marque: **openid**, **email**, **profile**
3. Clique em "Save changes"

---

### 6. Identity Providers ✅

Configure os provedores de identidade:

#### Obrigatório
- ✅ **Cognito User Pool** (usuário/senha)

#### Opcional (para futuro)
- ⏳ **Google** (quando ativar)
- ⏳ **Facebook** (quando ativar)

**Como configurar:**
1. Vá em **User Pools** → **Sign-in experience** → **Federated identity providers**
2. Certifique-se que "Cognito user pool" está habilitado
3. Para adicionar Google/Facebook:
   - Clique em "Add identity provider"
   - Siga as instruções para cada provedor

---

### 7. Domain Name ✅

Verifique se o domínio está configurado:

**Domain:** `us-east-1y8p2tembv.auth.us-east-1.amazoncognito.com`

**Como verificar:**
1. Vá em **User Pools** → **App Integration** → **Domain**
2. Deve mostrar: `us-east-1y8p2tembv`
3. URL completa: `https://us-east-1y8p2tembv.auth.us-east-1.amazoncognito.com`

---

## 🧪 Testar Configuração

### 1. Visualizar Página de Login

1. No AWS Console, vá em **App Integration** → **App clients**
2. Clique no seu app client
3. Role até "Hosted UI"
4. Clique em **"View Hosted UI"**

Você deve ver a página de login do Cognito.

### 2. Testar URL Manualmente

Acesse no browser:

```
https://us-east-1y8p2tembv.auth.us-east-1.amazoncognito.com/login?client_id=59fs99tv0sbrmelkqef83itenu&response_type=code&scope=openid+email+profile&redirect_uri=http://localhost:3000/auth/callback
```

Deve abrir a página de login do Cognito.

### 3. Testar Fluxo Completo

1. Inicie o servidor Next.js:
   ```bash
   cd frontend
   npm run dev
   ```

2. Acesse:
   ```
   http://localhost:3000/auth/login
   ```

3. Você será redirecionado para o Cognito

4. Faça login com credenciais válidas

5. Será redirecionado de volta para:
   ```
   http://localhost:3000/dashboard
   ```

6. Verifique os cookies no DevTools:
   - `access_token`
   - `id_token`

---

## 📊 Resumo Visual da Configuração

```
┌─────────────────────────────────────────────────────────┐
│ AWS Cognito User Pool                                   │
│ ID: us-east-1_Y8p2TeMbv                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ App Client: alquimistaai-nextjs-frontend               │
│ Client ID: 59fs99tv0sbrmelkqef83itenu                  │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Hosted UI Settings                              │   │
│ ├─────────────────────────────────────────────────┤   │
│ │                                                 │   │
│ │ Allowed Callback URLs:                          │   │
│ │ ✅ http://localhost:3000/auth/callback          │   │
│ │ ✅ https://alquimista.ai/auth/callback          │   │
│ │                                                 │   │
│ │ Allowed Sign-out URLs:                          │   │
│ │ ✅ http://localhost:3000/auth/logout-callback   │   │
│ │ ✅ https://alquimista.ai/auth/logout-callback   │   │
│ │                                                 │   │
│ │ OAuth 2.0 Flows:                                │   │
│ │ ✅ Authorization code grant                     │   │
│ │                                                 │   │
│ │ OAuth Scopes:                                   │   │
│ │ ✅ openid                                       │   │
│ │ ✅ email                                        │   │
│ │ ✅ profile                                      │   │
│ │                                                 │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ Domain:                                                 │
│ us-east-1y8p2tembv.auth.us-east-1.amazoncognito.com   │
│                                                         │
│ Identity Providers:                                     │
│ ✅ Cognito User Pool                                    │
│ ⏳ Google (opcional)                                    │
│ ⏳ Facebook (opcional)                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist Final

### Configuração AWS
- [ ] Acessar AWS Console → Cognito
- [ ] Localizar User Pool `us-east-1_Y8p2TeMbv`
- [ ] Acessar App Client `59fs99tv0sbrmelkqef83itenu`
- [ ] Adicionar Callback URLs (dev + prod)
- [ ] Adicionar Sign-out URLs (dev + prod)
- [ ] Habilitar Authorization code grant
- [ ] Habilitar scopes: openid, email, profile
- [ ] Verificar domínio configurado
- [ ] Testar "View Hosted UI"

### Teste Local
- [ ] Iniciar servidor: `npm run dev`
- [ ] Acessar `/auth/login`
- [ ] Fazer login no Cognito
- [ ] Verificar redirect para `/dashboard`
- [ ] Verificar cookies no DevTools
- [ ] Testar logout

### Produção (Futuro)
- [ ] Atualizar URLs para domínio de produção
- [ ] Adicionar URLs de produção no Cognito
- [ ] Testar em staging
- [ ] Deploy em produção

---

## 🚨 Problemas Comuns

### Erro: "redirect_uri_mismatch"

**Causa:** URL de callback não está configurada no Cognito

**Solução:**
1. Verifique se a URL está exatamente igual no Cognito
2. Não esqueça o protocolo (`http://` ou `https://`)
3. Não adicione barra no final da URL

### Erro: "invalid_grant"

**Causa:** Código de autorização expirado ou inválido

**Solução:**
1. Tente fazer login novamente
2. Verifique se o código não está sendo reutilizado
3. Códigos expiram em 10 minutos

### Erro: "unauthorized_client"

**Causa:** OAuth flow não habilitado

**Solução:**
1. Verifique se "Authorization code grant" está marcado
2. Salve as alterações
3. Aguarde alguns segundos para propagar

---

## 📞 Links Úteis

### AWS Console
- **Cognito Console:** https://console.aws.amazon.com/cognito/
- **User Pools:** https://console.aws.amazon.com/cognito/v2/idp/user-pools
- **Região:** us-east-1

### Documentação
- **Cognito Hosted UI:** https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-app-integration.html
- **OAuth 2.0:** https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-app-idp-settings.html

---

## 📝 Notas Importantes

1. **URLs devem ser exatas** - Não adicione barra no final
2. **Protocolo importa** - `http://` para dev, `https://` para prod
3. **Mudanças levam alguns segundos** - Aguarde após salvar
4. **Códigos expiram** - Não tente reutilizar códigos de autorização
5. **Teste sempre** - Use "View Hosted UI" para testar rapidamente

---

**Status**: ⏳ Aguardando configuração no AWS Console  
**Próximo**: Configurar e testar localmente
