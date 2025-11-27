# Testes E2E de Rotas do Frontend - AlquimistaAI

## 📋 Objetivo

Garantir que as rotas principais do frontend funcionem corretamente e prevenir regressões, especialmente o erro 404 na rota raiz (`/`) que foi corrigido anteriormente.

---

## 🎯 Cenários Cobertos

### 1. Rotas Públicas (Sem Autenticação)

| Rota | Comportamento Esperado |
|------|------------------------|
| `/` | Não retorna 404, redireciona para `/login` |
| `/login` | Carrega página de login com status 200 |
| `/institucional` | Carrega página institucional com status 200 |
| `/billing` | Carrega página de planos com status 200 |
| `/fibonacci` | Carrega sem erro (200 ou redirect válido) |
| `/nigredo` | Carrega sem erro (200 ou redirect válido) |

### 2. Rotas Protegidas (Sem Autenticação)

| Rota | Comportamento Esperado |
|------|------------------------|
| `/dashboard` | Redireciona para `/login` |
| `/company` | Redireciona para `/login` |
| `/app/dashboard` | Redireciona para `/login` |
| `/app/company` | Redireciona para `/login` |

### 3. Middleware de Segurança

- ✅ Headers de segurança aplicados (CSP, X-Frame-Options, etc.)
- ✅ Rotas públicas acessíveis sem cookies
- ✅ Rotas protegidas bloqueadas sem cookies

### 4. Navegação e Links

- ✅ Links de navegação funcionam corretamente
- ✅ Botões de login redirecionam apropriadamente

### 5. Responsividade e Performance

- ✅ Página raiz carrega em menos de 3 segundos
- ✅ Páginas são responsivas (mobile e desktop)

### 6. Tratamento de Erros

- ✅ Rotas inexistentes retornam 404
- ✅ Página de erro amigável para 404

---

## 🚀 Como Executar os Testes

### Pré-requisitos

1. **Node.js 20+** instalado
2. **Dependências instaladas:**
   ```powershell
   cd frontend
   npm install
   ```

3. **Playwright instalado:**
   ```powershell
   npx playwright install
   ```

### Executar Todos os Testes E2E

```powershell
# Terminal 1 - Subir o servidor Next.js (se ainda não estiver rodando)
cd C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI\frontend
npm run dev

# Terminal 2 - Executar os testes
cd C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI\frontend
npx playwright test
```

### Executar Apenas Testes do Módulo Disparo & Agendamento

```powershell
cd C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI\frontend
npx playwright test tests/e2e/disparo-agenda.spec.ts
```

### Executar em Modo Headed (Ver Navegador)

```powershell
cd C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI\frontend
npx playwright test --headed
```

### Executar em Modo Debug

```powershell
cd C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI\frontend
npx playwright test --debug
```

### Executar para CI/CD

```powershell
cd C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI\frontend
npx playwright test --reporter=line
```

---

## 📊 Estrutura dos Testes

### Arquivo Principal

**Localização:** `tests/e2e/frontend-routes.spec.ts`

### Grupos de Testes

1. **Rotas Públicas - Sem Autenticação**
   - Valida que rotas públicas carregam sem erro
   - Verifica redirecionamentos apropriados

2. **Rotas Protegidas - Sem Autenticação**
   - Valida que rotas protegidas redirecionam para login
   - Garante que não há acesso sem autenticação

3. **Middleware de Segurança**
   - Verifica headers de segurança
   - Valida comportamento com/sem cookies

4. **Navegação e Links**
   - Testa links de navegação
   - Valida redirecionamentos de botões

5. **Responsividade e Performance**
   - Mede tempo de carregamento
   - Testa em diferentes viewports

6. **Tratamento de Erros**
   - Valida páginas 404
   - Verifica mensagens de erro

---

## 🔧 Configuração do Playwright

### Arquivo de Configuração

**Localização:** `frontend/playwright.config.ts`

### Configurações Principais

```typescript
{
  testDir: './tests/e2e',
  baseURL: 'http://localhost:3000', // ← Permite usar page.goto('/rota')
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  use: {
    baseURL: 'http://localhost:3000', // ← IMPORTANTE: configurado aqui
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
  },
  
  webServer: {
    command: 'npm run dev', // ← Executa a partir de frontend/
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
}
```

**Nota:** O `baseURL` configurado permite que os testes usem caminhos relativos como `page.goto('/dashboard/disparo-agenda')` em vez de URLs completas.

### Navegadores Testados

- ✅ Chromium (Desktop)
- ✅ Firefox (Desktop)
- ✅ WebKit (Desktop Safari)
- ✅ Mobile Chrome (Pixel 5)
- ✅ Mobile Safari (iPhone 12)

---

## 🔍 Limitações Conhecidas

### 1. Autenticação Real Não Simulada

Os testes atuais **não** simulam autenticação real com Cognito. Eles apenas testam:
- Comportamento de rotas públicas
- Redirecionamentos para login
- Proteção de rotas

**Motivo:** Evitar complexidade de mock de tokens JWT do Cognito em testes locais.

### 2. Conteúdo Dinâmico

Alguns testes verificam apenas que a página carrega (status 200), não o conteúdo específico, pois:
- Conteúdo pode mudar frequentemente
- Foco é prevenir 404, não validar UI completa

### 3. Testes de Integração

Estes são testes E2E de **rotas**, não testes de integração completos. Para testes de integração com backend, veja:
- `tests/integration/`
- `tests/e2e/operational-dashboard/`

---

## 🐛 Troubleshooting

### Problema: Testes falham com "Timeout waiting for page"

**Solução:**
1. Verificar se o servidor dev está rodando:
   ```powershell
   cd frontend
   npm run dev
   ```
2. Aguardar mensagem "Ready in X ms"
3. Executar testes novamente

### Problema: "Browser not found"

**Solução:**
```powershell
npx playwright install
```

### Problema: Testes passam localmente mas falham no CI

**Possíveis causas:**
1. **Timeout muito curto:** Aumentar timeout no `playwright.config.ts`
2. **Recursos limitados:** CI pode ser mais lento
3. **Variáveis de ambiente:** Verificar se estão configuradas no CI

**Solução:**
- Verificar logs do CI
- Baixar artefatos (playwright-report) para análise
- Ajustar configurações de retry e timeout

### Problema: "Port 3000 already in use"

**Solução:**
1. Parar servidor dev existente
2. Ou configurar porta diferente no `playwright.config.ts`:
   ```typescript
   baseURL: 'http://localhost:3001',
   webServer: {
     command: 'cd frontend && PORT=3001 npm run dev',
     url: 'http://localhost:3001',
   }
   ```

---

## 📈 Integração com CI/CD

### Workflow GitHub Actions

**Arquivo:** `.github/workflows/ci-cd-alquimistaai.yml`

### Step Adicionado

```yaml
- name: Instalar dependências do frontend
  working-directory: ./frontend
  run: npm ci

- name: Instalar navegadores Playwright
  working-directory: ./frontend
  run: npx playwright install --with-deps chromium

- name: Executar testes E2E do frontend
  working-directory: ./frontend
  run: npm run test:e2e:ci
  continue-on-error: true

- name: Upload de relatório de testes E2E
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: playwright-report
    path: frontend/playwright-report/
    retention-days: 30
```

### Comportamento no CI

1. **Instalação:** Dependências e navegadores são instalados
2. **Execução:** Testes rodam em modo CI (reporter=line)
3. **Continue-on-error:** Pipeline não falha se testes falharem (por enquanto)
4. **Artefatos:** Relatório HTML é salvo por 30 dias

### Visualizar Relatórios no CI

1. Acessar a execução do workflow no GitHub Actions
2. Ir para "Artifacts"
3. Baixar "playwright-report"
4. Abrir `index.html` no navegador

---

## 📚 Documentação Relacionada

- [CORRECAO-404-MIDDLEWARE-CONSOLIDADO.md](./CORRECAO-404-MIDDLEWARE-CONSOLIDADO.md) - Correção do 404 original
- [FRONTEND-ROTAS-AUTH-DASHBOARD-RESUMO.md](./FRONTEND-ROTAS-AUTH-DASHBOARD-RESUMO.md) - Resumo de rotas e autenticação
- [CHECKLIST-TESTE-ROTAS.md](./CHECKLIST-TESTE-ROTAS.md) - Checklist de testes manuais
- [RESUMO-PARA-CHATGPT.md](./RESUMO-PARA-CHATGPT.md) - Resumo geral do frontend

---

## ✅ Critérios de Aceitação

Para considerar os testes E2E bem-sucedidos:

- [x] Arquivo de testes criado (`tests/e2e/frontend-routes.spec.ts`)
- [x] Testes cobrem rotas principais (/, /login, /institucional, /billing, /dashboard, /company)
- [x] Comando `npm run test:e2e` executa sem erros
- [x] Pipeline CI/CD inclui step de testes E2E
- [x] Documentação atualizada

---

## 🔄 Próximos Passos

### Curto Prazo

1. ✅ Executar testes localmente e validar
2. ✅ Commit e push para testar no CI/CD
3. ⏳ Ajustar timeouts se necessário
4. ⏳ Adicionar mais cenários conforme necessário

### Médio Prazo

1. ⏳ Adicionar testes com autenticação simulada
2. ⏳ Expandir cobertura para mais rotas
3. ⏳ Integrar com relatórios de cobertura
4. ⏳ Configurar testes visuais (screenshot comparison)

### Longo Prazo

1. ⏳ Testes de acessibilidade (a11y)
2. ⏳ Testes de performance (Lighthouse CI)
3. ⏳ Testes cross-browser completos
4. ⏳ Integração com ferramentas de monitoramento

---

**Data de Criação:** 24 de novembro de 2024  
**Versão:** 1.0.0  
**Autor:** Kiro AI Assistant  
**Última Atualização:** 24 de novembro de 2024


---

## 🆕 Novos Testes Adicionados

### 7. Módulo Disparo & Agendamento

**Arquivo:** `tests/e2e/disparo-agenda.spec.ts`

**Cenários Cobertos:**
- ✅ Acesso à página `/dashboard/disparo-agenda` sem erro 404
- ✅ Visualização de cards de overview (Contatos na Fila, Mensagens Enviadas, Reuniões Agendadas, Reuniões Confirmadas)
- ✅ Navegação entre tabs (Campanhas, Reuniões, Importar Contatos)
- ✅ Formulário de importação de contatos com validação
- ✅ Adição de múltiplos contatos no formulário
- ✅ Validação de campos obrigatórios
- ✅ Mensagens de lista vazia quando não há dados
- ✅ Acesso via sidebar (link "Disparo & Agendamento")

**Executar apenas estes testes:**
```powershell
cd frontend
npx playwright test tests/e2e/disparo-agenda.spec.ts
```

**Nota:** Este módulo é o primeiro fluxo operacional do Micro Agente de Disparo & Agendamento. Os endpoints de backend ainda estão em desenvolvimento (stubs), mas a UI está funcional e testada.

---

## 🔧 Configuração para o Micro Agente (DEV)

### Variável de Ambiente

Para conectar o frontend ao backend do Micro Agente de Disparo & Agendamento em DEV, configure a variável de ambiente:

```env
NEXT_PUBLIC_DISPARO_AGENDA_API_URL=<api_gateway_invoke_url_dev>
```

**Como obter o valor:**

1. Após executar `terraform apply` no módulo do micro agente:
   ```powershell
   cd terraform/envs/dev
   terraform output api_gateway_invoke_url
   ```

2. Copiar o valor retornado (exemplo: `https://abc123xyz.execute-api.us-east-1.amazonaws.com`)

3. Adicionar ao arquivo `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_DISPARO_AGENDA_API_URL=https://abc123xyz.execute-api.us-east-1.amazonaws.com
   ```

**Fallback:**

Se `NEXT_PUBLIC_DISPARO_AGENDA_API_URL` não estiver configurada, o cliente HTTP usará `NEXT_PUBLIC_API_URL` como fallback. Se nenhuma estiver configurada, o sistema usará stubs (dados mockados) para desenvolvimento.

### Testando a Conexão

Após configurar a variável:

1. Reiniciar o servidor Next.js:
   ```powershell
   cd frontend
   npm run dev
   ```

2. Acessar `http://localhost:3000/dashboard/disparo-agenda`

3. Verificar no console do navegador:
   - ✅ Se aparecer logs de chamadas HTTP → Backend conectado
   - ⚠️ Se aparecer warnings de "stub" → Backend não configurado (usando mocks)

### Rotas do Backend

O cliente HTTP espera as seguintes rotas no API Gateway:

- `GET /disparo/overview` - Contadores agregados
- `GET /disparo/campaigns` - Lista de campanhas
- `POST /disparo/contacts/ingest` - Upload de contatos
- `GET /agendamento/meetings` - Lista de reuniões

**Nota:** Estas rotas são definidas no Terraform do módulo `agente_disparo_agenda`.

