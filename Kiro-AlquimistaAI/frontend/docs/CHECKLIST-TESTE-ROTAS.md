# ✅ Checklist de Teste - Rotas e Autenticação

**Data:** 24/11/2024  
**Objetivo:** Validar correção do 404 em `/` e fluxo de autenticação

---

## 🚀 Iniciar Servidor

```powershell
cd frontend
npm run dev
```

Aguardar mensagem: `✓ Ready in X ms`

---

## 📋 Testes Obrigatórios

### ✅ Teste 1: Rota Raiz (Não Autenticado)

**Ação:**
1. Abrir navegador em modo anônimo
2. Acessar: `http://localhost:3000/`

**Resultado Esperado:**
- ✅ Não deve mostrar 404
- ✅ Deve exibir tela de loading
- ✅ Deve redirecionar automaticamente para `/login`

**Status:** [ ] Passou  [ ] Falhou

---

### ✅ Teste 2: Página de Login

**Ação:**
1. Acessar: `http://localhost:3000/login`

**Resultado Esperado:**
- ✅ Exibe título "Painel Operacional AlquimistaAI"
- ✅ Exibe botão "Entrar com Cognito"
- ✅ Não mostra erro 404

**Status:** [ ] Passou  [ ] Falhou

---

### ✅ Teste 3: Proteção de Rota Dashboard

**Ação:**
1. Sem estar autenticado
2. Tentar acessar: `http://localhost:3000/dashboard`

**Resultado Esperado:**
- ✅ Redireciona para `/login`
- ✅ Não permite acesso direto

**Status:** [ ] Passou  [ ] Falhou

---

### ✅ Teste 4: Proteção de Rota Company

**Ação:**
1. Sem estar autenticado
2. Tentar acessar: `http://localhost:3000/company`

**Resultado Esperado:**
- ✅ Redireciona para `/login`
- ✅ Não permite acesso direto

**Status:** [ ] Passou  [ ] Falhou

---

### ✅ Teste 5: Fluxo de Login Completo (Opcional)

**Ação:**
1. Acessar `/login`
2. Clicar em "Entrar com Cognito"
3. Fazer login no Cognito Hosted UI

**Resultado Esperado:**
- ✅ Redireciona para Cognito
- ✅ Após login, retorna para `/auth/callback`
- ✅ Callback processa tokens
- ✅ Redireciona para dashboard apropriado:
  - Usuário interno → `/company`
  - Usuário tenant → `/dashboard`

**Status:** [ ] Passou  [ ] Falhou  [ ] Não testado

---

### ✅ Teste 6: Rota Raiz (Autenticado)

**Ação:**
1. Após estar autenticado
2. Acessar: `http://localhost:3000/`

**Resultado Esperado:**
- ✅ Redireciona automaticamente para área apropriada
- ✅ Não mostra tela de login

**Status:** [ ] Passou  [ ] Falhou  [ ] Não testado

---

## 🔧 Build e Compilação

### ✅ Teste 7: Build de Produção

**Ação:**
```powershell
cd frontend
npm run build
```

**Resultado Esperado:**
- ✅ Build completa sem erros
- ✅ Sem erros de TypeScript
- ✅ Sem erros de rotas
- ✅ Mensagem final: `✓ Compiled successfully`

**Status:** [ ] Passou  [ ] Falhou

---

## 🤖 Testes Automatizados

### Executar Testes E2E

Além dos testes manuais acima, o projeto possui testes automatizados E2E com Playwright:

```powershell
cd frontend
npm run test:e2e:routes
```

**Documentação completa:** [FRONTEND-TESTES-ROTAS-E2E.md](./FRONTEND-TESTES-ROTAS-E2E.md)

**Vantagens dos testes automatizados:**
- ✅ Executam em segundos
- ✅ Cobrem múltiplos navegadores
- ✅ Integrados ao CI/CD
- ✅ Previnem regressões automaticamente

---

## 📊 Resumo dos Testes

| Teste | Status | Observações |
|-------|--------|-------------|
| 1. Rota Raiz (Não Auth) | [ ] | |
| 2. Página de Login | [ ] | |
| 3. Proteção Dashboard | [ ] | |
| 4. Proteção Company | [ ] | |
| 5. Fluxo Login Completo | [ ] | Opcional |
| 6. Rota Raiz (Auth) | [ ] | Opcional |
| 7. Build Produção | [ ] | |
| 8. Testes E2E Automatizados | [ ] | **Recomendado** |

---

## 🐛 Troubleshooting

### Problema: 404 ainda aparece em `/`

**Solução:**
1. Verificar se `frontend/src/app/page.tsx` existe
2. Reiniciar servidor de desenvolvimento
3. Limpar cache: `rm -rf .next` e `npm run dev`

### Problema: Redirecionamento não funciona

**Solução:**
1. Verificar console do navegador para erros
2. Verificar se `useAuthStore` está funcionando
3. Verificar se cookies estão habilitados

### Problema: Build falha

**Solução:**
1. Verificar erros de TypeScript: `npm run type-check`
2. Verificar imports: todos os arquivos importados existem?
3. Limpar node_modules: `rm -rf node_modules && npm install`

---

## ✅ Critérios de Sucesso

Para considerar a correção bem-sucedida, **TODOS** os testes obrigatórios (1-4, 7) devem passar.

**Testes obrigatórios:**
- [x] Teste 1: Rota Raiz (Não Autenticado)
- [x] Teste 2: Página de Login
- [x] Teste 3: Proteção Dashboard
- [x] Teste 4: Proteção Company
- [x] Teste 7: Build de Produção

**Testes opcionais:**
- [ ] Teste 5: Fluxo Login Completo
- [ ] Teste 6: Rota Raiz (Autenticado)

---

**Última atualização:** 24/11/2024
