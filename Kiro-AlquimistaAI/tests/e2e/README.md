# Testes E2E - AlquimistaAI Frontend

## 📋 Visão Geral

Este diretório contém testes End-to-End (E2E) para o frontend do AlquimistaAI, utilizando Playwright como framework de testes.

---

## 🎯 Objetivos

1. **Prevenir Regressões:** Especialmente o erro 404 na rota raiz (`/`)
2. **Validar Rotas:** Garantir que rotas principais funcionam corretamente
3. **Testar Autenticação:** Validar middleware e proteção de rotas
4. **Garantir Qualidade:** Executar testes automaticamente no CI/CD

---

## 📁 Estrutura de Arquivos

```
tests/e2e/
├── README.md                           # Este arquivo
├── frontend-routes.spec.ts             # ✅ NOVO - Testes de rotas principais
├── auth-complete-flow.spec.ts          # Testes de fluxo de autenticação
├── password-recovery.spec.ts           # Testes de recuperação de senha
├── profile-settings.spec.ts            # Testes de configurações de perfil
└── operational-dashboard/              # Testes do painel operacional
    ├── company-panel.spec.ts
    ├── login-redirect.spec.ts
    ├── operational-commands.spec.ts
    └── tenant-dashboard.spec.ts
```

---

## 🚀 Como Executar

### Pré-requisitos

```powershell
# Instalar dependências
cd frontend
npm install

# Instalar navegadores Playwright
npx playwright install
```

### Executar Todos os Testes

```powershell
cd frontend
npm run test:e2e
```

### Executar Testes Específicos

```powershell
# Apenas testes de rotas
npm run test:e2e:routes

# Apenas testes de autenticação
npx playwright test tests/e2e/auth-complete-flow.spec.ts

# Apenas testes do painel operacional
npx playwright test tests/e2e/operational-dashboard/
```

### Modos de Execução

```powershell
# Modo headed (ver navegador)
npm run test:e2e:headed

# Modo debug (passo a passo)
npm run test:e2e:debug

# Modo CI (reporter simplificado)
npm run test:e2e:ci
```

---

## 📊 Cobertura de Testes

### frontend-routes.spec.ts (NOVO)

**Objetivo:** Prevenir regressões de 404 e validar rotas principais

**Cenários:**
- ✅ Rota raiz (/) não retorna 404
- ✅ Rotas públicas acessíveis sem autenticação
- ✅ Rotas protegidas redirecionam para login
- ✅ Middleware de segurança aplica headers
- ✅ Navegação e links funcionam
- ✅ Responsividade e performance
- ✅ Tratamento de erros 404

### auth-complete-flow.spec.ts

**Objetivo:** Validar fluxo completo de autenticação

**Cenários:**
- Login com credenciais válidas
- Login com credenciais inválidas
- Logout
- Sessão expirada
- Tokens JWT

### operational-dashboard/

**Objetivo:** Validar painel operacional interno

**Cenários:**
- Acesso de usuários internos
- Bloqueio de usuários tenants
- Comandos operacionais
- Visualização de métricas

---

## 🔧 Configuração

### Arquivo de Configuração

**Localização:** `playwright.config.ts` (raiz do projeto)

**Principais configurações:**
```typescript
{
  testDir: './tests/e2e',
  baseURL: 'http://localhost:3000',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
}
```

### Navegadores Suportados

- ✅ Chromium (Desktop)
- ✅ Firefox (Desktop)
- ✅ WebKit (Desktop Safari)
- ✅ Mobile Chrome (Pixel 5)
- ✅ Mobile Safari (iPhone 12)

---

## 🐛 Troubleshooting

### Problema: "Browser not found"

```powershell
npx playwright install
```

### Problema: "Port 3000 already in use"

1. Parar servidor dev existente
2. Ou configurar porta diferente no `playwright.config.ts`

### Problema: Testes falham com timeout

1. Verificar se servidor dev está rodando
2. Aumentar timeout no `playwright.config.ts`
3. Verificar logs do console

### Problema: Testes passam localmente mas falham no CI

1. Verificar logs do CI
2. Baixar artefatos (playwright-report)
3. Ajustar configurações de retry

---

## 📈 Integração com CI/CD

### GitHub Actions

Os testes E2E são executados automaticamente no pipeline CI/CD:

```yaml
- name: Executar testes E2E do frontend
  working-directory: ./frontend
  run: npm run test:e2e:ci
```

### Relatórios

Relatórios HTML são salvos como artefatos por 30 dias:
- Acessar workflow no GitHub Actions
- Ir para "Artifacts"
- Baixar "playwright-report"

---

## 📚 Documentação Relacionada

- **[FRONTEND-TESTES-ROTAS-E2E.md](../../frontend/docs/FRONTEND-TESTES-ROTAS-E2E.md)** - Documentação completa dos testes de rotas
- **[CORRECAO-404-MIDDLEWARE-CONSOLIDADO.md](../../frontend/docs/CORRECAO-404-MIDDLEWARE-CONSOLIDADO.md)** - Correção do 404 original
- **[CHECKLIST-TESTE-ROTAS.md](../../frontend/docs/CHECKLIST-TESTE-ROTAS.md)** - Checklist de testes manuais

---

## ✅ Boas Práticas

### Escrevendo Novos Testes

1. **Nomear claramente:** Use nomes descritivos para testes
2. **Isolar testes:** Cada teste deve ser independente
3. **Usar seletores estáveis:** Preferir `getByRole`, `getByText`
4. **Evitar waits fixos:** Usar `waitForURL`, `waitForSelector`
5. **Documentar:** Adicionar comentários explicativos

### Exemplo de Teste

```typescript
test('deve carregar página de login sem erro', async ({ page }) => {
  // Acessar página
  const response = await page.goto('/login');
  
  // Verificar status HTTP
  expect(response?.status()).toBe(200);
  
  // Verificar elementos visíveis
  await expect(page.getByRole('button', { name: /Entrar/i })).toBeVisible();
});
```

---

## 🔄 Próximos Passos

### Curto Prazo
- ✅ Testes de rotas principais implementados
- ⏳ Validar testes no CI/CD
- ⏳ Ajustar timeouts se necessário

### Médio Prazo
- ⏳ Adicionar testes com autenticação simulada
- ⏳ Expandir cobertura para mais rotas
- ⏳ Testes visuais (screenshot comparison)

### Longo Prazo
- ⏳ Testes de acessibilidade (a11y)
- ⏳ Testes de performance (Lighthouse CI)
- ⏳ Integração com ferramentas de monitoramento

---

**Última Atualização:** 24 de novembro de 2024  
**Versão:** 1.0.0
