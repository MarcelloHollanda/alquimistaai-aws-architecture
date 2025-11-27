# Task 9: Resumo Visual - Teste com Usuários DEV

## 🎯 Objetivo

Validar o fluxo completo de autenticação OAuth 2.0 com os 4 usuários DEV configurados no Cognito.

---

## 📋 Checklist Rápido

### Pré-requisitos
- [ ] Servidor rodando em `http://localhost:3000`
- [ ] Variáveis de ambiente configuradas em `.env.local`
- [ ] Usuários DEV configurados no Cognito

### Testes por Usuário
- [ ] ✅ INTERNAL_ADMIN (jmrhollanda@gmail.com)
- [ ] ✅ INTERNAL_SUPPORT (alquimistafibonacci@gmail.com)
- [ ] ✅ TENANT_ADMIN (marcello@c3comercial.com.br)
- [ ] ✅ TENANT_USER (leylany@c3comercial.com.br)

### Validações Críticas
- [ ] Redirecionamento correto por grupo
- [ ] Bloqueio cross-dashboard (tenant → /app/company)
- [ ] Logout completo funcional

---

## 🔄 Fluxo de Autenticação

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO OAUTH 2.0 - COGNITO                    │
└─────────────────────────────────────────────────────────────────┘

1. Usuário acessa /auth/login
   │
   ├─→ Clica "Entrar com Cognito"
   │
2. Redireciona para Cognito Hosted UI
   │
   ├─→ us-east-1y8p2tembv.auth.us-east-1.amazoncognito.com
   │
3. Usuário faz login no Cognito
   │
   ├─→ Email + Senha
   │
4. Cognito redireciona para /auth/callback?code=...
   │
   ├─→ Callback captura código
   │
5. Troca código por tokens
   │
   ├─→ POST /oauth2/token
   ├─→ Recebe: idToken, accessToken, refreshToken
   │
6. Armazena tokens em cookies
   │
   ├─→ httpOnly, secure, sameSite=strict
   │
7. Extrai grupos do ID token
   │
   ├─→ cognito:groups: ['INTERNAL_ADMIN'] ou ['TENANT_ADMIN']
   │
8. Determina rota baseada em grupos
   │
   ├─→ INTERNAL_* → /app/company
   └─→ TENANT_* → /app/dashboard
```

---

## 👥 Matriz de Usuários DEV

| Email | Grupo | Tipo | Rota Inicial | Acesso /app/company | Acesso /app/dashboard |
|-------|-------|------|--------------|---------------------|----------------------|
| jmrhollanda@gmail.com | INTERNAL_ADMIN | Interno | `/app/company` | ✅ Permitido | ➡️ Redirect → /app/company |
| alquimistafibonacci@gmail.com | INTERNAL_SUPPORT | Interno | `/app/company` | ✅ Permitido | ➡️ Redirect → /app/company |
| marcello@c3comercial.com.br | TENANT_ADMIN | Cliente | `/app/dashboard` | ❌ **BLOQUEADO** | ✅ Permitido |
| leylany@c3comercial.com.br | TENANT_USER | Cliente | `/app/dashboard` | ❌ **BLOQUEADO** | ✅ Permitido |

---

## 🔐 Regras de Acesso

### Usuários Internos (INTERNAL_ADMIN, INTERNAL_SUPPORT)

```
✅ PERMITIDO:
   /app/company
   /app/company/tenants
   /app/company/operations
   /app/company/agents
   /app/company/integrations
   /app/company/billing

➡️ REDIRECIONADO:
   /app → /app/company
   /app/dashboard → /app/company
```

### Usuários Tenant (TENANT_ADMIN, TENANT_USER)

```
✅ PERMITIDO:
   /app/dashboard
   /app/dashboard/agents
   /app/dashboard/usage
   /app/dashboard/integrations
   /app/dashboard/fibonacci
   /app/dashboard/support

❌ BLOQUEADO:
   /app/company → Redirect → /app/dashboard?error=forbidden

➡️ REDIRECIONADO:
   /app → /app/dashboard
```

---

## 🧪 Cenários de Teste

### ✅ Cenário 1: Login INTERNAL_ADMIN

```
1. Abrir: http://localhost:3000/auth/login
2. Clicar: "Entrar com Cognito"
3. Login: jmrhollanda@gmail.com
4. Resultado esperado:
   ✓ Redireciona para: /app/company
   ✓ Console: groups: ['INTERNAL_ADMIN'], isInternal: true
   ✓ Acesso permitido a /app/company/*
```

### ✅ Cenário 2: Login INTERNAL_SUPPORT

```
1. Abrir: http://localhost:3000/auth/login
2. Clicar: "Entrar com Cognito"
3. Login: alquimistafibonacci@gmail.com
4. Resultado esperado:
   ✓ Redireciona para: /app/company
   ✓ Console: groups: ['INTERNAL_SUPPORT'], isInternal: true
   ✓ Comportamento idêntico ao INTERNAL_ADMIN
```

### ✅ Cenário 3: Login TENANT_ADMIN

```
1. Abrir: http://localhost:3000/auth/login
2. Clicar: "Entrar com Cognito"
3. Login: marcello@c3comercial.com.br
4. Resultado esperado:
   ✓ Redireciona para: /app/dashboard
   ✓ Console: groups: ['TENANT_ADMIN'], isInternal: false, tenantId: 'c3comercial'
   ✓ Acesso permitido a /app/dashboard/*
```

### ✅ Cenário 4: Login TENANT_USER

```
1. Abrir: http://localhost:3000/auth/login
2. Clicar: "Entrar com Cognito"
3. Login: leylany@c3comercial.com.br
4. Resultado esperado:
   ✓ Redireciona para: /app/dashboard
   ✓ Console: groups: ['TENANT_USER'], isInternal: false
   ✓ Comportamento idêntico ao TENANT_ADMIN
```

### 🚫 Cenário 5: Bloqueio Cross-Dashboard (CRÍTICO)

```
1. Login como: marcello@c3comercial.com.br (TENANT_ADMIN)
2. Tentar acessar: http://localhost:3000/app/company
3. Resultado esperado:
   ✓ Acesso BLOQUEADO
   ✓ Redireciona para: /app/dashboard?error=forbidden
   ✓ Console: [Middleware] Acesso negado: usuário tenant tentando acessar rota interna
```

### 🔄 Cenário 6: Redirecionamento /app

```
1. Login como: jmrhollanda@gmail.com (INTERNAL_ADMIN)
2. Acessar: http://localhost:3000/app
3. Resultado esperado:
   ✓ Redireciona para: /app/company

4. Login como: marcello@c3comercial.com.br (TENANT_ADMIN)
5. Acessar: http://localhost:3000/app
6. Resultado esperado:
   ✓ Redireciona para: /app/dashboard
```

### 🚪 Cenário 7: Logout Completo

```
1. Login com qualquer usuário
2. Acessar: http://localhost:3000/auth/logout
3. Resultado esperado:
   ✓ Cookies limpos (idToken, accessToken, refreshToken)
   ✓ Redireciona para Cognito logout
   ✓ Retorna para: /auth/logout-callback
   ✓ Tentar acessar /app/* → Redirect para /auth/login
```

---

## 🔍 Logs Esperados

### Login Bem-Sucedido

```javascript
[Cognito] Configuração carregada: { userPoolId: 'us-east-1_Y8p2TeMbv', ... }
[Cognito] Iniciando fluxo OAuth
[Callback] Processando callback OAuth
[Callback] Código recebido: 1234567890...
[Cognito] Trocando código por tokens
[Cognito] Tokens obtidos { expiresIn: 3600 }
[Cognito] Armazenando tokens em cookies
[Auth Store] Processando autenticação
[Auth Store] Claims extraídos: { sub: '...', email: '...', groups: [...] }
[Auth Store] Autenticação configurada: { groups: [...], role: '...', isInternal: ... }
[Callback] Redirecionando para: /app/...
```

### Bloqueio Cross-Dashboard

```javascript
[Middleware] Validação de acesso: { 
  pathname: '/app/company', 
  groups: ['TENANT_ADMIN'], 
  isInternal: false, 
  isTenant: true 
}
[Middleware] Acesso negado: usuário tenant tentando acessar rota interna
```

### Logout

```javascript
[Auth Store] Fazendo logout
[Cognito] Limpando tokens dos cookies
[Cognito] Iniciando logout
```

---

## 🛠️ Comandos Úteis

### Iniciar Servidor de Desenvolvimento

```bash
cd frontend
npm run dev
```

### Executar Validação Automática

```powershell
.\.kiro\specs\cognito-real-access-dashboard\validate-auth-flow.ps1
```

### Verificar Cookies no Navegador

```
DevTools → Application → Cookies → http://localhost:3000
```

Cookies esperados:
- `idToken` (JWT)
- `accessToken` (JWT)
- `refreshToken` (string)

### Decodificar Token JWT

1. Copiar valor do cookie `idToken`
2. Acessar: https://jwt.io
3. Colar token no campo "Encoded"
4. Verificar claims no campo "Decoded"

Claims esperados:
```json
{
  "sub": "...",
  "email": "...",
  "cognito:groups": ["INTERNAL_ADMIN"],
  "custom:tenant_id": "...",
  "exp": 1234567890,
  "iat": 1234567890
}
```

---

## ⚠️ Problemas Comuns

### Problema: "Variáveis de ambiente ausentes"

**Solução:**
```bash
# Verificar .env.local
cat frontend/.env.local

# Copiar exemplo se necessário
cp frontend/.env.local.example frontend/.env.local

# Reiniciar servidor
cd frontend
npm run dev
```

### Problema: "Token inválido"

**Solução:**
1. Verificar que `COGNITO_CLIENT_ID` está correto
2. Verificar que `COGNITO_REDIRECT_URI` está configurado no Cognito
3. Limpar cookies e tentar novamente

### Problema: Redirecionamento incorreto

**Solução:**
1. Abrir DevTools → Console
2. Verificar logs de `[Auth Store]` e `[Middleware]`
3. Verificar grupos no token JWT (https://jwt.io)
4. Verificar que o usuário está no grupo correto no Cognito

### Problema: Bloqueio cross-dashboard não funciona

**Solução:**
1. Verificar que o middleware está sendo executado
2. Verificar logs: `[Middleware] Acesso negado`
3. Verificar que os grupos estão sendo extraídos corretamente
4. Limpar cache do navegador e tentar novamente

---

## ✅ Critérios de Sucesso

A Task 9 está completa quando:

- [ ] Todos os 4 usuários DEV conseguem fazer login
- [ ] Redirecionamento correto para cada grupo
- [ ] Usuários internos acessam /app/company
- [ ] Usuários tenant acessam /app/dashboard
- [ ] **Bloqueio cross-dashboard funciona** (tenant → /app/company)
- [ ] Logout completo funcional
- [ ] Tokens expirados são tratados corretamente
- [ ] Logs no console estão corretos

---

## 📚 Documentos Relacionados

- [TASK-9-MANUAL-TESTING-GUIDE.md](./TASK-9-MANUAL-TESTING-GUIDE.md) - Guia detalhado de testes manuais
- [validate-auth-flow.ps1](./validate-auth-flow.ps1) - Script de validação automática
- [requirements.md](./requirements.md) - Requisitos completos
- [design.md](./design.md) - Design técnico
- [tasks.md](./tasks.md) - Lista de tarefas

---

## 🎉 Próximos Passos

Após completar a Task 9:

1. ✅ Marcar Task 9 como completa
2. ➡️ Prosseguir para Task 10: Criar documentação
3. 📝 Documentar resultados dos testes
4. 📸 Criar screenshots (opcional)
5. ✅ Validar que todos os requirements foram atendidos

---

**Requirements validados:** 9.1, 9.2, 9.3, 9.4, 9.5
