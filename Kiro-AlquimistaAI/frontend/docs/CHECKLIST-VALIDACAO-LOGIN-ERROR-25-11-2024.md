# Checklist de Validação - Login + Error Components

**Data:** 25/11/2024  
**Objetivo:** Validar correções da rota `/login` e componentes de erro globais

---

## ✅ Pré-requisitos

- [ ] Node.js instalado
- [ ] Dependências instaladas (`npm install`)
- [ ] Servidor de desenvolvimento rodando (`npm run dev`)

---

## 🧪 Testes de Validação

### 1. Teste da Rota `/login`

**Objetivo:** Verificar se `/login` redireciona corretamente para `/auth/login`

```powershell
# Acessar no navegador:
http://localhost:3002/login
```

**Resultado esperado:**
- ✅ Redireciona automaticamente para `http://localhost:3002/auth/login`
- ✅ Exibe a página de login com Cognito OAuth
- ✅ Sem erros no console
- ✅ Sem overlay "missing required error components"

**Status:** [ ] Passou | [ ] Falhou

---

### 2. Teste do Error Component

**Objetivo:** Verificar se `error.tsx` exibe UI correta

**Como testar:**
1. Forçar erro em qualquer página (ex: adicionar `throw new Error('teste')` em um componente)
2. Ou acessar uma rota que gera erro

**Resultado esperado:**
- ✅ Exibe card com título "Algo deu errado"
- ✅ Exibe mensagem de erro
- ✅ Botão "Tentar novamente" funciona
- ✅ Botão "Voltar para página inicial" funciona
- ✅ UI usa componentes shadcn/ui (Card, Button)
- ✅ Ícone AlertCircle visível

**Status:** [ ] Passou | [ ] Falhou

---

### 3. Teste do Global Error Component

**Objetivo:** Verificar se `global-error.tsx` captura erros no root layout

**Como testar:**
1. Forçar erro no `layout.tsx` (ex: adicionar `throw new Error('teste')`)
2. Recarregar a página

**Resultado esperado:**
- ✅ Exibe página completa de erro (com html/body)
- ✅ Exibe título "Algo deu errado"
- ✅ Exibe mensagem de erro
- ✅ Botão "Tentar novamente" funciona
- ✅ Botão "Voltar para página inicial" funciona
- ✅ UI com Tailwind CSS

**Status:** [ ] Passou | [ ] Falhou

---

### 4. Teste do Not Found (404)

**Objetivo:** Verificar se `not-found.tsx` exibe UI correta

```powershell
# Acessar no navegador:
http://localhost:3002/rota-que-nao-existe
```

**Resultado esperado:**
- ✅ Exibe card com título "Página não encontrada"
- ✅ Exibe "404" em destaque
- ✅ Botão "Voltar para página inicial" funciona
- ✅ UI usa componentes shadcn/ui (Card, Button)
- ✅ Ícone FileQuestion visível

**Status:** [ ] Passou | [ ] Falhou

---

### 5. Teste de Build de Produção

**Objetivo:** Verificar se build de produção funciona sem erros

```powershell
cd frontend
npm run build
```

**Resultado esperado:**
- ✅ Build completa sem erros
- ✅ Sem warnings sobre missing error components
- ✅ Todos os componentes compilados corretamente

**Status:** [ ] Passou | [ ] Falhou

---

### 6. Teste de Testes E2E

**Objetivo:** Verificar se testes E2E passam

```powershell
cd frontend
npm run test:e2e
```

**Resultado esperado:**
- ✅ Testes de rotas passam
- ✅ Testes de login passam
- ✅ Sem erros relacionados a componentes ausentes

**Status:** [ ] Passou | [ ] Falhou

---

## 🔍 Verificação de Arquivos

### Arquivos Criados

- [ ] `frontend/src/app/login/page.tsx` existe
- [ ] `frontend/src/app/global-error.tsx` existe

### Arquivos Modificados

- [ ] `frontend/src/app/error.tsx` usa shadcn/ui
- [ ] `frontend/src/app/not-found.tsx` usa shadcn/ui

### Arquivos Não Modificados (verificar integridade)

- [ ] `frontend/src/app/layout.tsx` mantém ErrorBoundary
- [ ] `frontend/src/app/(auth)/login/page.tsx` mantém implementação
- [ ] `frontend/src/lib/constants.ts` mantém ROUTES.LOGIN

---

## 🐛 Troubleshooting

### Problema: `/login` não redireciona

**Solução:**
```powershell
# Limpar cache do Next.js
cd frontend
Remove-Item -Recurse -Force .next
npm run dev
```

### Problema: Overlay "missing required error components"

**Solução:**
- Verificar se `global-error.tsx` existe em `src/app/`
- Verificar se `error.tsx` existe em `src/app/`
- Limpar cache e rebuild

### Problema: Erro de importação de componentes

**Solução:**
```powershell
# Verificar se shadcn/ui está instalado
npm list @radix-ui/react-dialog
npm list lucide-react

# Se necessário, reinstalar
npm install
```

---

## 📊 Resumo de Validação

**Total de testes:** 6  
**Testes passados:** [ ] / 6  
**Testes falhados:** [ ] / 6

**Status geral:** [ ] ✅ Aprovado | [ ] ❌ Reprovado

---

## 📝 Notas Adicionais

_Adicione aqui quaisquer observações durante os testes:_

---

**Validado por:** _________________  
**Data:** _________________  
**Hora:** _________________
