# 🧪 Guia de Validação Manual - Autenticação Cognito

## 📋 Pré-requisitos

```bash
✅ Servidor de desenvolvimento rodando (npm run dev)
✅ Variáveis de ambiente configuradas (.env.local)
✅ Cognito User Pool configurado
✅ 4 usuários DEV criados no Cognito
```

---

## 🚀 Início Rápido

### 1. Iniciar Servidor

```bash
cd frontend
npm run dev
```

**Aguarde a mensagem:**
```
✓ Ready in 2.5s
○ Local:   http://localhost:3000
```

### 2. Abrir Navegador

```
http://localhost:3000/auth/login
```

---

## 👤 Teste 1: INTERNAL_ADMIN

### Usuário
```
Email: jmrhollanda@gmail.com
Senha: [senha configurada no Cognito]
Grupo: INTERNAL_ADMIN
```

### Passos

1. **Acessar página de login**
   ```
   http://localhost:3000/auth/login
   ```

2. **Clicar em "Entrar"**
   - Deve redirecionar para Cognito Hosted UI
   - URL deve conter: `us-east-1y8p2tembv.auth.us-east-1.amazoncognito.com`

3. **Fazer login no Cognito**
   - Inserir email: `jmrhollanda@gmail.com`
   - Inserir senha
   - Clicar em "Sign in"

4. **Verificar redirecionamento**
   - ✅ Deve redirecionar para: `http://localhost:3000/app/company`
   - ✅ Deve exibir dashboard interno
   - ✅ Deve mostrar nome do usuário no header

5. **Testar acesso a rotas**
   ```bash
   # Tentar acessar dashboard do cliente
   http://localhost:3000/app/dashboard
   ```
   - ✅ Deve PERMITIR acesso (admin tem acesso total)

6. **Verificar cookies**
   - Abrir DevTools → Application → Cookies
   - ✅ Deve ter cookie `idToken`
   - ✅ Deve ter cookie `accessToken`
   - ✅ Deve ter cookie `refreshToken`
   - ✅ Cookies devem ter flags: `HttpOnly`, `Secure` (em prod)

7. **Fazer logout**
   - Clicar em "Sair" no header
   - ✅ Deve redirecionar para Cognito logout
   - ✅ Deve limpar todos os cookies
   - ✅ Deve redirecionar para `/auth/login`

8. **Verificar logout completo**
   ```bash
   # Tentar acessar rota protegida
   http://localhost:3000/app/company
   ```
   - ✅ Deve redirecionar para `/auth/login`

### ✅ Resultado Esperado

```
[✅] Login bem-sucedido
[✅] Redirecionamento para /app/company
[✅] Acesso permitido a /app/dashboard
[✅] Cookies armazenados corretamente
[✅] Logout completo
[✅] Redirecionamento após logout
```

---

## 👤 Teste 2: INTERNAL_SUPPORT

### Usuário
```
Email: alquimistafibonacci@gmail.com
Senha: [senha configurada no Cognito]
Grupo: INTERNAL_SUPPORT
```

### Passos

1. **Acessar página de login**
   ```
   http://localhost:3000/auth/login
   ```

2. **Clicar em "Entrar"**
   - Deve redirecionar para Cognito Hosted UI

3. **Fazer login no Cognito**
   - Inserir email: `alquimistafibonacci@gmail.com`
   - Inserir senha
   - Clicar em "Sign in"

4. **Verificar redirecionamento**
   - ✅ Deve redirecionar para: `http://localhost:3000/app/company`
   - ✅ Deve exibir dashboard interno
   - ✅ Deve mostrar nome do usuário no header

5. **Testar acesso a rotas**
   ```bash
   # Tentar acessar dashboard do cliente
   http://localhost:3000/app/dashboard
   ```
   - ✅ Deve PERMITIR acesso (suporte tem acesso total)

6. **Fazer logout**
   - Clicar em "Sair" no header
   - ✅ Deve limpar sessão completamente

### ✅ Resultado Esperado

```
[✅] Login bem-sucedido
[✅] Redirecionamento para /app/company
[✅] Acesso permitido a /app/dashboard
[✅] Logout completo
```

---

## 👤 Teste 3: TENANT_ADMIN

### Usuário
```
Email: marcello@c3comercial.com.br
Senha: [senha configurada no Cognito]
Grupo: TENANT_ADMIN
Tenant ID: c3comercial
```

### Passos

1. **Acessar página de login**
   ```
   http://localhost:3000/auth/login
   ```

2. **Clicar em "Entrar"**
   - Deve redirecionar para Cognito Hosted UI

3. **Fazer login no Cognito**
   - Inserir email: `marcello@c3comercial.com.br`
   - Inserir senha
   - Clicar em "Sign in"

4. **Verificar redirecionamento**
   - ✅ Deve redirecionar para: `http://localhost:3000/app/dashboard`
   - ✅ Deve exibir dashboard do cliente
   - ✅ Deve mostrar nome do tenant no header

5. **Testar bloqueio de acesso**
   ```bash
   # Tentar acessar dashboard interno
   http://localhost:3000/app/company
   ```
   - ✅ Deve BLOQUEAR acesso
   - ✅ Deve redirecionar para `/app/dashboard`
   - ✅ Deve exibir mensagem de erro (opcional)

6. **Verificar acesso permitido**
   ```bash
   # Acessar rotas do dashboard
   http://localhost:3000/app/dashboard/agents
   http://localhost:3000/app/dashboard/usage
   http://localhost:3000/app/dashboard/integrations
   ```
   - ✅ Deve PERMITIR acesso a todas as rotas `/app/dashboard/*`

7. **Fazer logout**
   - Clicar em "Sair" no header
   - ✅ Deve limpar sessão completamente

### ✅ Resultado Esperado

```
[✅] Login bem-sucedido
[✅] Redirecionamento para /app/dashboard
[❌] Acesso BLOQUEADO a /app/company
[✅] Acesso permitido a /app/dashboard/*
[✅] Logout completo
```

---

## 👤 Teste 4: TENANT_USER

### Usuário
```
Email: leylany@c3comercial.com.br
Senha: [senha configurada no Cognito]
Grupo: TENANT_USER
Tenant ID: c3comercial
```

### Passos

1. **Acessar página de login**
   ```
   http://localhost:3000/auth/login
   ```

2. **Clicar em "Entrar"**
   - Deve redirecionar para Cognito Hosted UI

3. **Fazer login no Cognito**
   - Inserir email: `leylany@c3comercial.com.br`
   - Inserir senha
   - Clicar em "Sign in"

4. **Verificar redirecionamento**
   - ✅ Deve redirecionar para: `http://localhost:3000/app/dashboard`
   - ✅ Deve exibir dashboard do cliente
   - ✅ Deve mostrar nome do tenant no header

5. **Testar bloqueio de acesso**
   ```bash
   # Tentar acessar dashboard interno
   http://localhost:3000/app/company
   ```
   - ✅ Deve BLOQUEAR acesso
   - ✅ Deve redirecionar para `/app/dashboard`

6. **Verificar acesso permitido**
   ```bash
   # Acessar rotas do dashboard
   http://localhost:3000/app/dashboard/agents
   http://localhost:3000/app/dashboard/usage
   ```
   - ✅ Deve PERMITIR acesso a rotas `/app/dashboard/*`

7. **Fazer logout**
   - Clicar em "Sair" no header
   - ✅ Deve limpar sessão completamente

### ✅ Resultado Esperado

```
[✅] Login bem-sucedido
[✅] Redirecionamento para /app/dashboard
[❌] Acesso BLOQUEADO a /app/company
[✅] Acesso permitido a /app/dashboard/*
[✅] Logout completo
```

---

## 🔍 Checklist de Validação

### Funcionalidades Gerais

```
[  ] Login via Cognito Hosted UI funciona
[  ] Redirecionamento após login funciona
[  ] Cookies são armazenados corretamente
[  ] Logout limpa cookies
[  ] Logout redireciona para Cognito
[  ] Middleware protege rotas
```

### INTERNAL_ADMIN

```
[  ] Login bem-sucedido
[  ] Redirecionamento para /app/company
[  ] Acesso permitido a /app/dashboard
[  ] Logout completo
```

### INTERNAL_SUPPORT

```
[  ] Login bem-sucedido
[  ] Redirecionamento para /app/company
[  ] Acesso permitido a /app/dashboard
[  ] Logout completo
```

### TENANT_ADMIN

```
[  ] Login bem-sucedido
[  ] Redirecionamento para /app/dashboard
[  ] Acesso BLOQUEADO a /app/company
[  ] Acesso permitido a /app/dashboard/*
[  ] Logout completo
```

### TENANT_USER

```
[  ] Login bem-sucedido
[  ] Redirecionamento para /app/dashboard
[  ] Acesso BLOQUEADO a /app/company
[  ] Acesso permitido a /app/dashboard/*
[  ] Logout completo
```

---

## 🐛 Troubleshooting

### Erro: "Redirect URI mismatch"

**Solução:**
```bash
# Verificar Callback URLs no Cognito
# Deve conter exatamente:
http://localhost:3000/auth/callback
```

### Erro: "Código de autorização inválido"

**Solução:**
```bash
# Fazer login novamente
# Códigos são de uso único
```

### Erro: "Variável de ambiente ausente"

**Solução:**
```bash
# Verificar .env.local
# Reiniciar servidor: npm run dev
```

### Cookies não estão sendo salvos

**Solução:**
```bash
# Usar http://localhost (não 127.0.0.1)
# Limpar cookies do navegador
# Verificar DevTools → Application → Cookies
```

---

## 📊 Relatório de Validação

### Template

```markdown
# Relatório de Validação Manual

**Data:** [data]
**Testador:** [nome]

## Teste 1: INTERNAL_ADMIN
- [ ] Login: ✅ / ❌
- [ ] Redirecionamento: ✅ / ❌
- [ ] Acesso: ✅ / ❌
- [ ] Logout: ✅ / ❌
- **Observações:** [observações]

## Teste 2: INTERNAL_SUPPORT
- [ ] Login: ✅ / ❌
- [ ] Redirecionamento: ✅ / ❌
- [ ] Acesso: ✅ / ❌
- [ ] Logout: ✅ / ❌
- **Observações:** [observações]

## Teste 3: TENANT_ADMIN
- [ ] Login: ✅ / ❌
- [ ] Redirecionamento: ✅ / ❌
- [ ] Bloqueio: ✅ / ❌
- [ ] Logout: ✅ / ❌
- **Observações:** [observações]

## Teste 4: TENANT_USER
- [ ] Login: ✅ / ❌
- [ ] Redirecionamento: ✅ / ❌
- [ ] Bloqueio: ✅ / ❌
- [ ] Logout: ✅ / ❌
- **Observações:** [observações]

## Conclusão
- **Status Geral:** ✅ APROVADO / ❌ REPROVADO
- **Problemas Encontrados:** [lista]
- **Recomendações:** [lista]
```

---

## 📞 Suporte

**Documentação Completa:**
- `docs/operational-dashboard/ACCESS-QUICK-REFERENCE.md`

**Arquivos de Referência:**
- `.kiro/specs/cognito-real-access-dashboard/design.md`
- `.kiro/specs/cognito-real-access-dashboard/requirements.md`

**Contato:**
- Equipe de desenvolvimento

---

**Guia criado em:** 19 de novembro de 2024  
**Versão:** 1.0.0  
**Autor:** Kiro AI Assistant
