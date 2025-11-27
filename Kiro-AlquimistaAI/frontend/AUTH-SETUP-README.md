# 🔐 Setup de Autenticação com Amazon Cognito

Este guia explica como configurar a autenticação completa com Amazon Cognito User Pools, incluindo login social (Google e Facebook).

## 📋 Pré-requisitos

- Conta AWS ativa
- Node.js 20.x instalado
- Projeto Next.js 14 configurado

## 🚀 Passo 1: Criar Cognito User Pool

### 1.1 Via AWS Console

1. Acesse o AWS Console → Amazon Cognito
2. Clique em "Create user pool"
3. Configure:
   - **Sign-in options**: Email
   - **Password policy**: Customize (mínimo 8 caracteres)
   - **MFA**: Optional
   - **User account recovery**: Email only
   - **Self-service sign-up**: Enabled
   - **Attribute verification**: Email
   - **Required attributes**: name, email
   - **Custom attributes**: tenantId (String), role (String)

### 1.2 Configurar App Client

1. Em "App integration" → "App clients"
2. Criar novo App Client:
   - **App type**: Public client
   - **App client name**: alquimista-web
   - **Authentication flows**: 
     - ALLOW_USER_PASSWORD_AUTH
     - ALLOW_REFRESH_TOKEN_AUTH
   - **OAuth 2.0 grant types**:
     - Authorization code grant
   - **OAuth scopes**:
     - email
     - openid
     - profile

### 1.3 Configurar Hosted UI Domain

1. Em "App integration" → "Domain"
2. Criar domínio: `alquimista-{seu-id}` (ou custom domain)
3. Salvar o domínio completo: `https://alquimista-{seu-id}.auth.us-east-1.amazoncognito.com`

## 🔗 Passo 2: Configurar Login Social

### 2.1 Google OAuth

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione existente
3. Vá em "APIs & Services" → "Credentials"
4. Criar "OAuth 2.0 Client ID":
   - **Application type**: Web application
   - **Authorized redirect URIs**: 
     ```
     https://alquimista-{seu-id}.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
     ```
5. Copie o **Client ID** e **Client Secret**

6. No Cognito:
   - Vá em "Sign-in experience" → "Federated identity providers"
   - Adicionar "Google"
   - Cole Client ID e Client Secret
   - Scopes: `profile email openid`

### 2.2 Facebook OAuth

1. Acesse [Facebook Developers](https://developers.facebook.com/)
2. Crie um novo app ou selecione existente
3. Adicione o produto "Facebook Login"
4. Em "Settings" → "Basic":
   - Copie **App ID** e **App Secret**
5. Em "Facebook Login" → "Settings":
   - **Valid OAuth Redirect URIs**:
     ```
     https://alquimista-{seu-id}.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
     ```

6. No Cognito:
   - Vá em "Sign-in experience" → "Federated identity providers"
   - Adicionar "Facebook"
   - Cole App ID e App Secret
   - Scopes: `public_profile,email`

### 2.3 Configurar Callback URLs

No Cognito App Client:
- **Callback URLs**:
  ```
  http://localhost:3000/auth/callback
  https://seu-dominio.com/auth/callback
  ```
- **Sign out URLs**:
  ```
  http://localhost:3000/auth/login
  https://seu-dominio.com/auth/login
  ```

## ⚙️ Passo 3: Configurar Variáveis de Ambiente

Copie `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Preencha com seus valores:

```env
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_COGNITO_DOMAIN=https://alquimista-{seu-id}.auth.us-east-1.amazoncognito.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=https://your-api.execute-api.us-east-1.amazonaws.com
NEXT_PUBLIC_AWS_REGION=us-east-1
```

## 📦 Passo 4: Instalar Dependências

```bash
npm install amazon-cognito-identity-js
npm install zustand
npm install react-icons
npm install @radix-ui/react-label
npm install @radix-ui/react-select
npm install lucide-react
```

## 🏗️ Passo 5: Estrutura de Arquivos Criada

```
frontend/
├── src/
│   ├── lib/
│   │   └── cognito-client.ts          # Cliente Cognito
│   ├── hooks/
│   │   └── use-auth.ts                # Hook de autenticação
│   ├── app/
│   │   ├── auth/
│   │   │   ├── login/page.tsx         # Tela de login
│   │   │   ├── register/page.tsx      # Cadastro
│   │   │   ├── forgot-password/page.tsx
│   │   │   ├── reset-password/page.tsx
│   │   │   └── callback/page.tsx      # OAuth callback
│   │   └── app/
│   │       └── settings/page.tsx      # Configurações
│   └── components/
│       ├── auth/
│       │   └── register-wizard.tsx    # Wizard de cadastro
│       ├── settings/
│       │   ├── profile-tab.tsx        # Aba perfil
│       │   ├── company-tab.tsx        # Aba empresa
│       │   └── integrations-tab.tsx   # Aba integrações
│       └── ui/
│           ├── button.tsx
│           ├── input.tsx
│           ├── label.tsx
│           ├── select.tsx
│           ├── card.tsx
│           ├── tabs.tsx
│           └── progress.tsx
```

## 🧪 Passo 6: Testar

### 6.1 Iniciar aplicação

```bash
npm run dev
```

### 6.2 Testar fluxos

1. **Login com e-mail/senha**: http://localhost:3000/auth/login
2. **Login com Google**: Clicar no botão "Continuar com Google"
3. **Login com Facebook**: Clicar no botão "Continuar com Facebook"
4. **Cadastro**: http://localhost:3000/auth/register
5. **Recuperar senha**: http://localhost:3000/auth/forgot-password
6. **Configurações**: http://localhost:3000/app/settings

## 🔧 Passo 7: Configurar Backend (APIs)

Você precisa criar os seguintes endpoints no backend:

### 7.1 Empresas

```
POST   /api/companies          # Criar empresa
GET    /api/companies/current  # Obter empresa atual
PUT    /api/companies/current  # Atualizar empresa
```

### 7.2 Usuários

```
POST   /api/users              # Criar usuário
GET    /api/users/profile      # Obter perfil
PUT    /api/users/profile      # Atualizar perfil
```

### 7.3 Upload

```
POST   /api/upload/logo        # Upload de logomarca
```

### 7.4 Integrações

```
GET    /api/integrations                      # Listar integrações
POST   /api/integrations/{id}/connect         # Conectar integração
POST   /api/integrations/{id}/disconnect      # Desconectar integração
```

## 🔐 Passo 8: Armazenar Secrets

Use AWS Secrets Manager para armazenar credenciais de integrações:

```bash
# Padrão de nomenclatura
/fibonacci/aws/{tenantId}/google
/fibonacci/aws/{tenantId}/whatsapp
/fibonacci/aws/{tenantId}/meta
/fibonacci/aws/{tenantId}/telephony
```

## 📝 Notas Importantes

1. **Segurança**: Nunca exponha secrets no frontend
2. **Tokens**: Armazene tokens em cookies HttpOnly via backend
3. **CORS**: Configure CORS no API Gateway para permitir seu domínio
4. **HTTPS**: Use HTTPS em produção (obrigatório para OAuth)
5. **Custom Attributes**: Configure no Cognito antes de usar

## 🐛 Troubleshooting

### Erro: "User pool client does not exist"
- Verifique se o Client ID está correto no .env.local

### Erro: "redirect_uri_mismatch"
- Verifique se a URL de callback está configurada no Cognito App Client

### Login social não funciona
- Verifique se o domínio do Hosted UI está configurado
- Confirme que as redirect URIs estão corretas no Google/Facebook

### Erro: "Invalid custom attribute"
- Crie os custom attributes (tenantId, role) no User Pool antes de usar

## 📚 Recursos Adicionais

- [Documentação Cognito](https://docs.aws.amazon.com/cognito/)
- [amazon-cognito-identity-js](https://github.com/aws-amplify/amplify-js/tree/main/packages/amazon-cognito-identity-js)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login Setup](https://developers.facebook.com/docs/facebook-login)

## ✅ Checklist Final

- [ ] Cognito User Pool criado
- [ ] App Client configurado
- [ ] Hosted UI Domain configurado
- [ ] Google OAuth configurado
- [ ] Facebook OAuth configurado
- [ ] Variáveis de ambiente configuradas
- [ ] Dependências instaladas
- [ ] Backend APIs implementadas
- [ ] Testado login com e-mail/senha
- [ ] Testado login social Google
- [ ] Testado login social Facebook
- [ ] Testado cadastro de novo usuário
- [ ] Testado recuperação de senha
- [ ] Testado alteração de perfil

---

**Pronto!** Sua autenticação com Cognito está configurada e funcionando. 🎉
