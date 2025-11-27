# Guia de Teste Manual - Task 9: Fluxo com Usuários DEV

## Objetivo

Validar o fluxo completo de autenticação OAuth 2.0 com Cognito para os 4 usuários DEV configurados, verificando:
- Login via Hosted UI
- Redirecionamento correto baseado em grupos
- Acesso a rotas autorizadas
- Bloqueio de acesso cross-dashboard
- Logout completo

## Pré-requisitos

### 1. Servidor de Desenvolvimento Rodando

```bash
cd frontend
npm run dev
```

O servidor deve estar rodando em: `http://localhost:3000`

### 2. Variáveis de Ambiente Configuradas

Verificar que o arquivo `frontend/.env.local` contém:

```bash
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_Y8p2TeMbv
NEXT_PUBLIC_COGNITO_CLIENT_ID=59fs99tv0sbrmelkqef83itenu
NEXT_PUBLIC_COGNITO_DOMAIN_HOST=us-east-1y8p2tembv.auth.us-east-1.amazoncognito.com
NEXT_PUBLIC_COGNITO_REDIRECT_URI=http://localhost:3000/auth/callback
NEXT_PUBLIC_COGNITO_LOGOUT_URI=http://localhost:3000/auth/logout-callback
NEXT_PUBLIC_COGNITO_REGION=us-east-1
```

### 3. Usuários DEV Configurados no Cognito

| Email | Grupo | Tipo | Rota Esperada |
|-------|-------|------|---------------|
| jmrhollanda@gmail.com | INTERNAL_ADMIN | Interno | /app/company |
| alquimistafibonacci@gmail.com | INTERNAL_SUPPORT | Interno | /app/company |
| marcello@c3comercial.com.br | TENANT_ADMIN | Cliente | /app/dashboard |
| leylany@c3comercial.com.br | TENANT_USER | Cliente | /app/dashboard |

---

## Teste 1: INTERNAL_ADMIN (jmrhollanda@gmail.com)

### Objetivo
Validar que usuário INTERNAL_ADMIN é redirecionado para /app/company e tem acesso completo.

### Passos

1. **Abrir navegador em modo anônimo/privado**
   - Chrome: Ctrl+Shift+N
   - Firefox: Ctrl+Shift+P
   - Edge: Ctrl+Shift+N

2. **Acessar página de login**
   ```
   http://localhost:3000/auth/login
   ```

3. **Clicar em "Entrar com Cognito"**
   - Deve redirecionar para Cognito Hosted UI
   - URL deve conter: `us-east-1y8p2tembv.auth.us-east-1.amazoncognito.com`

4. **Fazer login no Cognito**
   - Email: `jmrhollanda@gmail.com`
   - Senha: [senha configurada no Cognito]

5. **Verificar redirecionamento**
   - ✅ Deve redirecionar para: `http://localhost:3000/app/company`
   - ✅ Deve exibir dashboard interno (Company Panel)
   - ✅ Console do navegador deve mostrar:
     ```
     [Callback] Processando callback OAuth
     [Callback] Tokens obtidos
     [Auth Store] Autenticação configurada: { groups: ['INTERNAL_ADMIN'], role: 'INTERNAL_ADMIN', isInternal: true }
     [Callback] Redirecionando para: /app/company
     ```

6. **Testar acesso a rotas internas**
   - Acessar: `http://localhost:3000/app/company/tenants`
   - ✅ Deve permitir acesso
   - Acessar: `http://localhost:3000/app/company/operations`
   - ✅ Deve permitir acesso

7. **Testar acesso a rotas de cliente**
   - Acessar: `http://localhost:3000/app/dashboard`
   - ✅ Deve redirecionar para: `/app/company` (usuários internos não usam /app/dashboard)

8. **Testar logout**
   - Clicar no botão "Sair" (se disponível) ou acessar: `http://localhost:3000/auth/logout`
   - ✅ Deve limpar cookies
   - ✅ Deve redirecionar para Cognito logout
   - ✅ Deve retornar para: `http://localhost:3000/auth/logout-callback`
   - ✅ Tentar acessar `/app/company` deve redirecionar para login

### Resultado Esperado
- ✅ Login bem-sucedido
- ✅ Redirecionamento para /app/company
- ✅ Acesso permitido a todas as rotas internas
- ✅ Redirecionamento de /app/dashboard para /app/company
- ✅ Logout completo funcional

---

## Teste 2: INTERNAL_SUPPORT (alquimistafibonacci@gmail.com)

### Objetivo
Validar que usuário INTERNAL_SUPPORT tem comportamento idêntico ao INTERNAL_ADMIN.

### Passos

1. **Abrir navegador em modo anônimo/privado** (nova janela)

2. **Acessar página de login**
   ```
   http://localhost:3000/auth/login
   ```

3. **Clicar em "Entrar com Cognito"**

4. **Fazer login no Cognito**
   - Email: `alquimistafibonacci@gmail.com`
   - Senha: [senha configurada no Cognito]

5. **Verificar redirecionamento**
   - ✅ Deve redirecionar para: `http://localhost:3000/app/company`
   - ✅ Console deve mostrar: `groups: ['INTERNAL_SUPPORT'], role: 'INTERNAL_SUPPORT', isInternal: true`

6. **Testar acesso a rotas internas**
   - Acessar: `http://localhost:3000/app/company/tenants`
   - ✅ Deve permitir acesso

7. **Testar acesso a rotas de cliente**
   - Acessar: `http://localhost:3000/app/dashboard`
   - ✅ Deve redirecionar para: `/app/company`

8. **Testar logout**
   - Acessar: `http://localhost:3000/auth/logout`
   - ✅ Deve fazer logout completo

### Resultado Esperado
- ✅ Comportamento idêntico ao INTERNAL_ADMIN
- ✅ Acesso completo a rotas internas
- ✅ Redirecionamento correto

---

## Teste 3: TENANT_ADMIN (marcello@c3comercial.com.br)

### Objetivo
Validar que usuário TENANT_ADMIN é redirecionado para /app/dashboard e tem acesso bloqueado a rotas internas.

### Passos

1. **Abrir navegador em modo anônimo/privado** (nova janela)

2. **Acessar página de login**
   ```
   http://localhost:3000/auth/login
   ```

3. **Clicar em "Entrar com Cognito"**

4. **Fazer login no Cognito**
   - Email: `marcello@c3comercial.com.br`
   - Senha: [senha configurada no Cognito]

5. **Verificar redirecionamento**
   - ✅ Deve redirecionar para: `http://localhost:3000/app/dashboard`
   - ✅ Deve exibir dashboard do cliente (Tenant Dashboard)
   - ✅ Console deve mostrar:
     ```
     [Auth Store] Autenticação configurada: { groups: ['TENANT_ADMIN'], role: 'TENANT_ADMIN', isInternal: false, tenantId: 'c3comercial' }
     [Callback] Redirecionando para: /app/dashboard
     ```

6. **Testar acesso a rotas de cliente**
   - Acessar: `http://localhost:3000/app/dashboard/agents`
   - ✅ Deve permitir acesso
   - Acessar: `http://localhost:3000/app/dashboard/usage`
   - ✅ Deve permitir acesso

7. **Testar bloqueio de rotas internas (CRÍTICO)**
   - Acessar: `http://localhost:3000/app/company`
   - ✅ Deve BLOQUEAR acesso
   - ✅ Deve redirecionar para: `/app/dashboard?error=forbidden&message=Você não tem permissão para acessar esta área`
   - ✅ Console deve mostrar:
     ```
     [Middleware] Acesso negado: usuário tenant tentando acessar rota interna
     ```
   
   - Acessar: `http://localhost:3000/app/company/tenants`
   - ✅ Deve BLOQUEAR acesso e redirecionar

8. **Testar logout**
   - Acessar: `http://localhost:3000/auth/logout`
   - ✅ Deve fazer logout completo

### Resultado Esperado
- ✅ Login bem-sucedido
- ✅ Redirecionamento para /app/dashboard
- ✅ Acesso permitido a rotas de cliente
- ✅ **BLOQUEIO COMPLETO** de rotas internas (/app/company/*)
- ✅ Logout completo funcional

---

## Teste 4: TENANT_USER (leylany@c3comercial.com.br)

### Objetivo
Validar que usuário TENANT_USER tem comportamento idêntico ao TENANT_ADMIN (bloqueio de rotas internas).

### Passos

1. **Abrir navegador em modo anônimo/privado** (nova janela)

2. **Acessar página de login**
   ```
   http://localhost:3000/auth/login
   ```

3. **Clicar em "Entrar com Cognito"**

4. **Fazer login no Cognito**
   - Email: `leylany@c3comercial.com.br`
   - Senha: [senha configurada no Cognito]

5. **Verificar redirecionamento**
   - ✅ Deve redirecionar para: `http://localhost:3000/app/dashboard`
   - ✅ Console deve mostrar: `groups: ['TENANT_USER'], role: 'TENANT_USER', isInternal: false`

6. **Testar acesso a rotas de cliente**
   - Acessar: `http://localhost:3000/app/dashboard/agents`
   - ✅ Deve permitir acesso

7. **Testar bloqueio de rotas internas (CRÍTICO)**
   - Acessar: `http://localhost:3000/app/company`
   - ✅ Deve BLOQUEAR acesso e redirecionar para /app/dashboard

8. **Testar logout**
   - Acessar: `http://localhost:3000/auth/logout`
   - ✅ Deve fazer logout completo

### Resultado Esperado
- ✅ Comportamento idêntico ao TENANT_ADMIN
- ✅ Bloqueio completo de rotas internas
- ✅ Acesso apenas a rotas de cliente

---

## Teste 5: Validação de Segurança Cross-Dashboard

### Objetivo
Validar que o bloqueio cross-dashboard funciona corretamente.

### Cenário 1: Usuário Interno tentando acessar /app/dashboard

1. Fazer login como `jmrhollanda@gmail.com` (INTERNAL_ADMIN)
2. Acessar: `http://localhost:3000/app/dashboard`
3. ✅ Deve redirecionar para: `/app/company`

### Cenário 2: Usuário Tenant tentando acessar /app/company

1. Fazer login como `marcello@c3comercial.com.br` (TENANT_ADMIN)
2. Acessar: `http://localhost:3000/app/company`
3. ✅ Deve BLOQUEAR e redirecionar para: `/app/dashboard?error=forbidden`

### Cenário 3: Acesso direto a /app

1. Fazer login como `jmrhollanda@gmail.com` (INTERNAL_ADMIN)
2. Acessar: `http://localhost:3000/app`
3. ✅ Deve redirecionar para: `/app/company`

4. Fazer login como `marcello@c3comercial.com.br` (TENANT_ADMIN)
5. Acessar: `http://localhost:3000/app`
6. ✅ Deve redirecionar para: `/app/dashboard`

---

## Teste 6: Validação de Tokens Expirados

### Objetivo
Validar que tokens expirados são tratados corretamente.

### Passos

1. Fazer login com qualquer usuário
2. Abrir DevTools → Application → Cookies
3. Editar o cookie `idToken` e modificar o payload para ter `exp` no passado
4. Tentar acessar qualquer rota protegida
5. ✅ Deve limpar cookies
6. ✅ Deve redirecionar para: `/auth/login?redirect=/app/...&expired=true`

---

## Checklist de Validação Final

### Funcionalidades Básicas
- [ ] Login via Hosted UI funciona para todos os 4 usuários
- [ ] Tokens são armazenados corretamente em cookies
- [ ] Claims são extraídos corretamente do ID token
- [ ] Grupos são mapeados corretamente para roles

### Redirecionamento por Grupo
- [ ] INTERNAL_ADMIN → /app/company
- [ ] INTERNAL_SUPPORT → /app/company
- [ ] TENANT_ADMIN → /app/dashboard
- [ ] TENANT_USER → /app/dashboard

### Controle de Acesso
- [ ] Usuários internos acessam /app/company/*
- [ ] Usuários internos são redirecionados de /app/dashboard para /app/company
- [ ] Usuários tenant acessam /app/dashboard/*
- [ ] Usuários tenant são BLOQUEADOS de /app/company/* (CRÍTICO)

### Logout
- [ ] Logout limpa cookies
- [ ] Logout redireciona para Cognito logout
- [ ] Após logout, acesso a rotas protegidas exige novo login

### Segurança
- [ ] Tokens expirados são detectados e tratados
- [ ] Cookies têm flags de segurança (httpOnly, secure, sameSite)
- [ ] Middleware valida todos os acessos a /app/*

---

## Troubleshooting

### Erro: "Variáveis de ambiente ausentes"

**Solução:**
1. Verificar que `frontend/.env.local` existe
2. Verificar que todas as variáveis `NEXT_PUBLIC_COGNITO_*` estão definidas
3. Reiniciar o servidor de desenvolvimento

### Erro: "Token inválido" ou "Falha ao trocar código"

**Solução:**
1. Verificar que o `COGNITO_CLIENT_ID` está correto
2. Verificar que o `COGNITO_REDIRECT_URI` está configurado no Cognito
3. Verificar que o domínio do Cognito está correto

### Erro: Redirecionamento incorreto

**Solução:**
1. Abrir DevTools → Console
2. Verificar logs de `[Auth Store]` e `[Middleware]`
3. Verificar que os grupos estão corretos no token JWT
4. Decodificar o ID token em https://jwt.io para inspecionar claims

### Erro: Bloqueio cross-dashboard não funciona

**Solução:**
1. Verificar que o middleware está sendo executado
2. Verificar logs no console: `[Middleware] Acesso negado`
3. Verificar que os grupos estão sendo extraídos corretamente

---

## Logs Esperados no Console

### Login bem-sucedido (INTERNAL_ADMIN)

```
[Cognito] Configuração carregada: { userPoolId: 'us-east-1_Y8p2TeMbv', ... }
[Cognito] Iniciando fluxo OAuth
[Callback] Processando callback OAuth
[Callback] Código recebido: 1234567890...
[Cognito] Trocando código por tokens
[Cognito] Tokens obtidos { expiresIn: 3600 }
[Cognito] Armazenando tokens em cookies
[Auth Store] Processando autenticação
[Auth Store] Claims extraídos: { sub: '...', email: 'jmrhollanda@gmail.com', groups: ['INTERNAL_ADMIN'] }
[Auth Store] Autenticação configurada: { groups: ['INTERNAL_ADMIN'], role: 'INTERNAL_ADMIN', isInternal: true }
[Callback] Redirecionando para: /app/company
```

### Bloqueio cross-dashboard (TENANT_ADMIN tentando acessar /app/company)

```
[Middleware] Validação de acesso: { pathname: '/app/company', groups: ['TENANT_ADMIN'], isInternal: false, isTenant: true }
[Middleware] Acesso negado: usuário tenant tentando acessar rota interna
```

---

## Conclusão

Após completar todos os testes acima, você terá validado:

1. ✅ Login OAuth 2.0 via Cognito Hosted UI
2. ✅ Extração e mapeamento de grupos
3. ✅ Redirecionamento correto por perfil
4. ✅ Controle de acesso baseado em grupos
5. ✅ Bloqueio cross-dashboard
6. ✅ Logout completo
7. ✅ Tratamento de tokens expirados

**Requirements validados:** 9.1, 9.2, 9.3, 9.4, 9.5

---

## Próximos Passos

Após validação manual bem-sucedida:

1. Documentar resultados dos testes
2. Criar screenshots de cada fluxo (opcional)
3. Marcar Task 9 como completa
4. Prosseguir para Task 10 (Documentação)
