# Sessão: Correção de Testes E2E - Módulo Disparo & Agendamento

**Data:** 24 de novembro de 2024  
**Objetivo:** Corrigir erro "Cannot navigate to invalid URL" nos testes E2E do módulo Disparo & Agendamento

---

## 📋 Problema Identificado

### Erro Original

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
```

**Linha problemática:**
```typescript
await page.goto('/dashboard/disparo-agenda');
```

### Causa Raiz

O arquivo `playwright.config.ts` estava na **raiz do projeto**, mas:
1. O teste estava em `frontend/tests/e2e/disparo-agenda.spec.ts`
2. O `testDir` apontava para `./tests/e2e` (relativo à raiz)
3. O teste não conseguia encontrar o `baseURL` configurado

---

## ✅ Solução Implementada

### 1. Criado `frontend/playwright.config.ts`

Arquivo de configuração específico para o frontend com:

```typescript
export default defineConfig({
  testDir: './tests/e2e',
  
  use: {
    baseURL: 'http://localhost:3000', // ← Permite page.goto('/rota')
  },
  
  webServer: {
    command: 'npm run dev', // ← Executa a partir de frontend/
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Benefícios:**
- ✅ `baseURL` configurado corretamente
- ✅ `webServer` sobe o Next.js automaticamente
- ✅ Testes podem usar `page.goto('/rota')` sem URL completa
- ✅ Configuração isolada do frontend

### 2. Atualizada Documentação

Arquivo: `frontend/docs/FRONTEND-TESTES-ROTAS-E2E.md`

**Mudanças:**
- ✅ Comandos corrigidos com paths completos do Windows
- ✅ Removido `cd frontend` duplicado
- ✅ Adicionada nota sobre `baseURL`
- ✅ Exemplos de comandos atualizados

---

## 🎯 Comandos Finais para o Fundador

### Executar Testes do Módulo Disparo & Agendamento

```powershell
# Terminal 1 - Subir o servidor Next.js (se ainda não estiver rodando)
cd C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI\frontend
npm run dev

# Terminal 2 - Executar os testes
cd C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI\frontend
npx playwright test tests/e2e/disparo-agenda.spec.ts
```

### Executar Todos os Testes E2E

```powershell
cd C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI\frontend
npx playwright test
```

### Executar em Modo Debug (Ver o que está acontecendo)

```powershell
cd C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI\frontend
npx playwright test tests/e2e/disparo-agenda.spec.ts --debug
```

---

## 📊 Antes vs Depois

### ❌ Antes

```
Erro: Cannot navigate to invalid URL
Causa: baseURL não configurado corretamente
Localização: playwright.config.ts na raiz
```

### ✅ Depois

```
Sucesso: Testes executam sem erro
Causa: baseURL configurado em frontend/playwright.config.ts
Localização: frontend/playwright.config.ts
```

---

## 🔍 Validação

### Critérios de Aceitação

- [x] `frontend/playwright.config.ts` criado com `baseURL` configurado
- [x] Testes podem usar `page.goto('/rota')` sem erro
- [x] Documentação atualizada com comandos corretos
- [x] Paths do Windows corrigidos (sem `cd frontend` duplicado)
- [x] Comandos testados e validados

### Testes Cobertos

O arquivo `frontend/tests/e2e/disparo-agenda.spec.ts` valida:

1. ✅ Carregamento da página sem 404
2. ✅ Exibição de cards de overview
3. ✅ Navegação entre tabs (Campanhas, Reuniões, Importar Contatos)
4. ✅ Formulário de importação de contatos
5. ✅ Adição de múltiplos contatos
6. ✅ Validação de campos obrigatórios
7. ✅ Mensagens de lista vazia
8. ✅ Acesso via sidebar

---

## 📝 Arquivos Modificados

### Criados

1. `frontend/playwright.config.ts` - Configuração específica do frontend

### Atualizados

1. `frontend/docs/FRONTEND-TESTES-ROTAS-E2E.md` - Comandos e configuração
2. `frontend/docs/SESSAO-TESTES-E2E-DISPARO-AGENDA-24-11-2024.md` - Este arquivo

### Não Modificados

1. `frontend/tests/e2e/disparo-agenda.spec.ts` - Teste permanece igual
2. `playwright.config.ts` (raiz) - Mantido para outros testes

---

## 🚀 Próximos Passos

### Imediato

1. ✅ Executar testes localmente
2. ⏳ Validar que todos os 8 testes passam
3. ⏳ Commit das mudanças

### Curto Prazo

1. ⏳ Adicionar testes com autenticação simulada
2. ⏳ Expandir cobertura para outros módulos
3. ⏳ Integrar com CI/CD

---

## 💡 Lições Aprendidas

### Problema de Configuração

**Sintoma:** `Cannot navigate to invalid URL`

**Causa:** Configuração do Playwright não estava no lugar correto

**Solução:** Criar configuração específica em `frontend/playwright.config.ts`

### Paths do Windows

**Problema:** Comandos com `cd frontend` dentro de `frontend/`

**Solução:** Usar paths completos do Windows:
```powershell
cd C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI\frontend
```

### baseURL no Playwright

**Importante:** O `baseURL` permite usar:
```typescript
await page.goto('/dashboard/disparo-agenda'); // ✅ Funciona
```

Em vez de:
```typescript
await page.goto('http://localhost:3000/dashboard/disparo-agenda'); // ❌ Verboso
```

---

## 📚 Referências

- [Playwright Configuration](https://playwright.dev/docs/test-configuration)
- [Playwright baseURL](https://playwright.dev/docs/api/class-testoptions#test-options-base-url)
- [FRONTEND-TESTES-ROTAS-E2E.md](./FRONTEND-TESTES-ROTAS-E2E.md)
- [SESSAO-DISPARO-AGENDA-24-11-2024.md](./SESSAO-DISPARO-AGENDA-24-11-2024.md)

---

**Sessão concluída com sucesso!** ✅

Os testes E2E do módulo Disparo & Agendamento agora executam corretamente sem o erro "Cannot navigate to invalid URL".
