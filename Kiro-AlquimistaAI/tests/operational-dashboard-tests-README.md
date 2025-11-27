# Testes do Painel Operacional AlquimistaAI

Este documento descreve os testes implementados para o Painel Operacional AlquimistaAI, incluindo testes unitários, de integração e end-to-end (E2E).

## Estrutura de Testes

```
tests/
├── unit/
│   └── operational-dashboard/
│       ├── get-tenant-me.test.ts
│       ├── list-tenants.test.ts
│       ├── aggregate-daily-metrics.test.ts
│       └── process-operational-command.test.ts
├── integration/
│   └── operational-dashboard/
│       ├── tenant-apis-flow.test.ts
│       ├── internal-apis-flow.test.ts
│       └── commands-flow.test.ts
└── e2e/
    └── operational-dashboard/
        ├── login-redirect.spec.ts
        ├── tenant-dashboard.spec.ts
        ├── company-panel.spec.ts
        └── operational-commands.spec.ts
```

## Requisitos

### Dependências

```bash
npm install --save-dev vitest @vitest/coverage-v8 @playwright/test
```

### Variáveis de Ambiente

#### Para Testes Unitários e de Integração

```bash
# Banco de dados de teste
TEST_DB_HOST=localhost
TEST_DB_NAME=alquimista_test
TEST_DB_USER=postgres
TEST_DB_PASSWORD=postgres

# DynamoDB de teste
TEST_COMMANDS_TABLE=operational_commands_test
AWS_REGION=us-east-1
```

#### Para Testes E2E

```bash
# Usuário interno de teste
TEST_INTERNAL_EMAIL=admin@alquimista.ai
TEST_INTERNAL_PASSWORD=TestPassword123!

# Usuário cliente de teste
TEST_TENANT_EMAIL=user@tenant.com
TEST_TENANT_PASSWORD=TestPassword123!

# URL base da aplicação
BASE_URL=http://localhost:3000
```

## Executando os Testes

### Testes Unitários

```bash
# Executar todos os testes unitários
npm run test:unit

# Executar testes unitários em modo watch
npm run test:unit:watch

# Executar testes unitários com cobertura
npm run test:coverage
```

### Testes de Integração

```bash
# Executar todos os testes de integração
npm run test:integration

# Executar testes de integração em modo watch
npm run test:integration:watch
```

**IMPORTANTE**: Os testes de integração requerem:
- Banco de dados Aurora PostgreSQL configurado
- Tabela DynamoDB para comandos operacionais
- Variáveis de ambiente apropriadas

### Testes E2E

```bash
# Executar todos os testes E2E
npm run test:e2e

# Executar testes E2E em modo UI
npm run test:e2e:ui

# Executar testes E2E em modo debug
npm run test:e2e:debug

# Ver relatório dos testes E2E
npm run test:e2e:report
```

**IMPORTANTE**: Os testes E2E requerem:
- Aplicação frontend rodando (automaticamente iniciada pelo Playwright)
- Usuários de teste criados no Cognito
- Backend configurado e acessível

## Cobertura de Testes

### Testes Unitários (Backend)

**Cobertura Mínima**: 80%

**Componentes Testados**:
- ✅ Middleware de autorização
- ✅ Handlers de APIs de tenant
- ✅ Handlers de APIs internas
- ✅ Funções de agregação de métricas
- ✅ Processador de comandos operacionais

### Testes de Integração (Backend)

**Cobertura Mínima**: 60%

**Fluxos Testados**:
- ✅ Fluxo completo de APIs de tenant
- ✅ Fluxo completo de APIs internas
- ✅ Fluxo end-to-end de comandos operacionais
- ✅ Integração com Aurora PostgreSQL
- ✅ Integração com DynamoDB

### Testes E2E (Frontend)

**Fluxos Testados**:
- ✅ Login e redirecionamento baseado em grupos
- ✅ Navegação no dashboard do cliente
- ✅ Navegação no painel operacional
- ✅ Criação de comandos operacionais
- ✅ Validação de permissões
- ✅ Isolamento de dados entre tenants

## Detalhes dos Testes

### 1. Testes Unitários

#### get-tenant-me.test.ts
- Testa endpoint GET /tenant/me
- Valida acesso ao tenant
- Verifica isolamento de dados
- Testa permissões de usuário interno

#### list-tenants.test.ts
- Testa endpoint GET /internal/tenants
- Valida filtros (status, plano, segmento)
- Testa busca por nome/CNPJ
- Verifica paginação e ordenação

#### aggregate-daily-metrics.test.ts
- Testa agregação de métricas diárias
- Valida cálculos de métricas
- Verifica agrupamento por tenant e agente
- Testa ON CONFLICT para atualizações

#### process-operational-command.test.ts
- Testa processamento de comandos
- Valida tipos de comando (HEALTH_CHECK, REPROCESS_QUEUE, etc.)
- Verifica atualização de status
- Testa registro de output e erros

### 2. Testes de Integração

#### tenant-apis-flow.test.ts
- Testa fluxo completo de APIs de tenant
- Valida isolamento de dados
- Verifica integração com banco de dados
- Testa filtros e paginação

#### internal-apis-flow.test.ts
- Testa fluxo completo de APIs internas
- Valida permissões de usuário interno
- Verifica agregações e métricas globais
- Testa acesso a dados de múltiplos tenants

#### commands-flow.test.ts
- Testa criação de comandos operacionais
- Valida armazenamento no DynamoDB
- Verifica listagem e filtros
- Testa validação de parâmetros

### 3. Testes E2E

#### login-redirect.spec.ts
- Testa login de usuário interno
- Testa login de usuário cliente
- Valida redirecionamento baseado em grupos
- Verifica bloqueio de acesso não autorizado

#### tenant-dashboard.spec.ts
- Testa navegação no dashboard do cliente
- Valida exibição de KPIs
- Verifica gráficos e métricas
- Testa filtros e períodos

#### company-panel.spec.ts
- Testa navegação no painel operacional
- Valida exibição de KPIs globais
- Verifica lista de tenants
- Testa filtros e busca

#### operational-commands.spec.ts
- Testa criação de comandos
- Valida formulário de comando
- Verifica histórico de comandos
- Testa filtros e atualização de status

## Configuração de CI/CD

### GitHub Actions

```yaml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:unit

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:integration
        env:
          TEST_DB_HOST: localhost
          TEST_DB_NAME: alquimista_test
          TEST_DB_USER: postgres
          TEST_DB_PASSWORD: postgres

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
        env:
          BASE_URL: http://localhost:3000
```

## Troubleshooting

### Testes Unitários Falhando

1. Verificar que os mocks estão configurados corretamente
2. Verificar que as dependências estão instaladas
3. Limpar cache: `npm run test:unit -- --clearCache`

### Testes de Integração Falhando

1. Verificar conexão com banco de dados
2. Verificar que as tabelas existem
3. Verificar variáveis de ambiente
4. Verificar que o DynamoDB Local está rodando (se aplicável)

### Testes E2E Falhando

1. Verificar que o frontend está rodando
2. Verificar que os usuários de teste existem no Cognito
3. Verificar variáveis de ambiente
4. Executar em modo debug: `npm run test:e2e:debug`
5. Ver screenshots de falhas em `test-results/`

## Melhores Práticas

1. **Isolamento**: Cada teste deve ser independente
2. **Cleanup**: Sempre limpar dados de teste após execução
3. **Mocks**: Usar mocks para dependências externas em testes unitários
4. **Dados Reais**: Usar dados reais em testes de integração
5. **Seletores Estáveis**: Usar data-testid em testes E2E
6. **Timeouts**: Configurar timeouts apropriados para operações assíncronas
7. **Assertions Claras**: Usar mensagens descritivas em assertions

## Próximos Passos

- [ ] Adicionar testes de performance
- [ ] Adicionar testes de segurança (OWASP)
- [ ] Implementar testes de carga
- [ ] Adicionar testes de acessibilidade
- [ ] Configurar relatórios de cobertura no CI/CD

## Referências

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
