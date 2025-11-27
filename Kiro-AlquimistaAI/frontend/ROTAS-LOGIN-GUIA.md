# 🔐 Guia de Rotas de Login - AlquimistaAI

## ✅ Rota Correta de Login

**URL:** `http://localhost:3000/auth/login`

Esta é a rota oficial que implementa o login via **Amazon Cognito OAuth**.

### Características:
- ✅ Integração completa com Cognito
- ✅ Login único (SSO)
- ✅ Redirecionamento automático baseado em perfil
- ✅ Suporte a múltiplos grupos (Internal, Tenant)

---

## 🔄 Redirecionamento Automático

A rota antiga `/login` agora redireciona automaticamente para `/auth/login`.

### Rotas que redirecionam:
- `http://localhost:3000/login` → `http://localhost:3000/auth/login`
- `http://localhost:3000/login/` → `http://localhost:3000/auth/login`

---

## 📋 Estrutura de Rotas de Autenticação

```
frontend/src/app/
├── (auth)/                    # Rotas antigas (redirecionam)
│   ├── login/                 # → Redireciona para /auth/login
│   └── signup/                # → Redireciona para /auth/register
│
└── auth/                      # Rotas oficiais com Cognito
    ├── login/                 # ✅ Login principal
    ├── callback/              # ✅ Callback OAuth
    ├── logout/                # ✅ Logout
    ├── logout-callback/       # ✅ Callback de logout
    ├── register/              # ✅ Registro de novos usuários
    ├── confirm/               # ✅ Confirmação de e-mail
    ├── forgot-password/       # ✅ Recuperação de senha
    └── reset-password/        # ✅ Redefinição de senha
```

---

## 🚀 Fluxo de Login Completo

### 1. Acesso Inicial
```
Usuário acessa: http://localhost:3000/auth/login
```

### 2. Clique em "Entrar com Cognito"
```
Sistema inicia OAuth flow:
→ Redireciona para Cognito Hosted UI
→ Usuário faz login no Cognito
```

### 3. Callback
```
Cognito redireciona para: http://localhost:3000/auth/callback
→ Sistema processa tokens
→ Identifica grupo do usuário (Internal ou Tenant)
```

### 4. Redirecionamento Final
```
Internal → http://localhost:3000/company
Tenant   → http://localhost:3000/dashboard
```

---

## 🔧 Configuração Necessária

### Variáveis de Ambiente (.env.local)

```bash
# Cognito Configuration
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_COGNITO_DOMAIN=alquimistaai-dev
NEXT_PUBLIC_COGNITO_REDIRECT_URI=http://localhost:3000/auth/callback
NEXT_PUBLIC_COGNITO_LOGOUT_URI=http://localhost:3000/auth/logout-callback
NEXT_PUBLIC_AWS_REGION=us-east-1
```

---

## 🐛 Troubleshooting

### Erro 404 em /login
**Solução:** Use `/auth/login` ao invés de `/login`

### Erro "redirect_uri_mismatch"
**Causa:** URL de callback não configurada no Cognito
**Solução:** 
1. Acesse AWS Console → Cognito → User Pools
2. Selecione o pool `alquimistaai-dev`
3. Em "App Integration" → "App clients"
4. Adicione `http://localhost:3000/auth/callback` nas "Allowed callback URLs"

### Erro "invalid_client"
**Causa:** Client ID incorreto ou não configurado
**Solução:** Verifique `NEXT_PUBLIC_COGNITO_CLIENT_ID` no `.env.local`

### Redirecionamento não funciona após login
**Causa:** Tokens não estão sendo salvos corretamente
**Solução:** 
1. Limpe cookies do navegador
2. Verifique console do navegador para erros
3. Confirme que o callback está processando tokens

---

## 📝 Notas Importantes

1. **Sempre use `/auth/login`** para login
2. **Não use `/login`** (rota antiga, apenas redireciona)
3. **Cookies são httpOnly** para segurança
4. **Tokens expiram em 1 hora** (padrão Cognito)
5. **Refresh automático** implementado no middleware

---

## 🔗 Links Úteis

- [Documentação Cognito OAuth](frontend/src/lib/cognito-oauth-guide.md)
- [Guia de Configuração](frontend/src/app/api/auth/README.md)
- [Spec Completa](.kiro/specs/cognito-real-access-dashboard/INDEX.md)

---

## ✅ Checklist de Validação

- [ ] Acesso `http://localhost:3000/auth/login` funciona
- [ ] Botão "Entrar com Cognito" redireciona para Cognito
- [ ] Login no Cognito funciona
- [ ] Callback processa tokens corretamente
- [ ] Redirecionamento para dashboard apropriado funciona
- [ ] Logout funciona corretamente

---

**Última atualização:** 2024
**Versão:** 1.0
