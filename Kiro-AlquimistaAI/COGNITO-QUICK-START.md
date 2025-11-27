# 🚀 Cognito - Quick Start

## Início Rápido - 5 Minutos

### 1. Iniciar o Servidor

```bash
cd frontend
npm run dev
```

### 2. Testar Login

Abra o browser:
```
http://localhost:3000/auth/login
```

Você será redirecionado para o Cognito Hosted UI.

### 3. Verificar Tokens

Após login, abra o console (F12):

```javascript
localStorage.getItem('access_token')
localStorage.getItem('id_token')
localStorage.getItem('refresh_token')
```

### 4. Testar Logout

```
http://localhost:3000/auth/logout
```

---

## ⚠️ Antes de Testar

Configure no AWS Cognito Console:

### Allowed Callback URLs
```
http://localhost:3000/auth/callback
```

### Allowed Sign-out URLs
```
http://localhost:3000/auth/logout-callback
```

### OAuth Flows
- ✅ Authorization code grant

### OAuth Scopes
- ✅ openid
- ✅ email
- ✅ profile

---

## 📁 Arquivos Importantes

- `frontend/.env.local` - Variáveis configuradas
- `frontend/src/app/auth/login/page.tsx` - Login
- `frontend/src/app/auth/callback/route.ts` - Callback (Route Handler)
- `COGNITO-FINAL-IMPLEMENTATION.md` - Documentação completa

---

## 🔗 URLs

### Desenvolvimento
- Login: `http://localhost:3000/auth/login`
- Callback: `http://localhost:3000/auth/callback`
- Logout: `http://localhost:3000/auth/logout`

### Cognito
- Hosted UI: `https://us-east-1y8p2tembv.auth.us-east-1.amazoncognito.com`
- User Pool: `us-east-1_Y8p2TeMbv`
- Client ID: `59fs99tv0sbrmelkqef83itenu`

---

## 📚 Documentação Completa

- `COGNITO-SETUP-COMPLETE.md` - Configuração
- `frontend/COGNITO-CONFIG-REFERENCE.md` - Referência
- `frontend/COGNITO-ROUTES-COMPLETE.md` - Rotas
- `COGNITO-AUTH-IMPLEMENTATION-COMPLETE.md` - Implementação

---

**Status**: ✅ Pronto para testar!
