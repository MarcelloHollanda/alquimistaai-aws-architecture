# Sistema de Inventário e Documentação - AlquimistaAI

## Visão Geral

Este sistema gera automaticamente documentação completa e consolidada do Sistema AlquimistaAI através de análise estática do código, infraestrutura e documentação existente.

## Documentos Gerados

O sistema produz dois documentos principais:

1. **STATUS-GERAL-SISTEMA-ALQUIMISTAAI.md** - Documento completo e autossuficiente para leitura humana
2. **STATUS-GERAL-SISTEMA-ALQUIMISTAAI-SHORT-INDEX.md** - Índice compacto otimizado para consumo por IA

Ambos são salvos no diretório `docs/` na raiz do projeto.

## Como Executar

### Pré-requisitos

```bash
# Instalar dependências
npm install
```

### Comandos Disponíveis

```bash
# Gerar inventário completo (ambos os documentos)
npm run generate:inventory

# Gerar apenas documento principal
npm run generate:inventory:main

# Gerar apenas índice compacto
npm run generate:inventory:index

# Validar sem gerar documentos
npm run validate:inventory
```

### Execução Direta

```bash
# Executar script TypeScript diretamente
npx ts-node scripts/generate-system-inventory.ts

# Com opções
npx ts-node scripts/generate-system-inventory.ts --main-only
npx ts-node scripts/generate-system-inventory.ts --index-only
npx ts-node scripts/generate-system-inventory.ts --validate-only
```

## Estrutura de Arquivos

```
scripts/
  generate-system-inventory.ts    # Script principal de execução
  inventory/
    README.md                      # Este arquivo
    types.ts                       # Definições de tipos TypeScript
    sanitizer.ts                   # Sanitização de segredos
    validator.ts                   # Validação de consistência
    generator.ts                   # Geração de documentos
    analyzers/
      index.ts                     # Exportações centralizadas
      cdk-analyzer.ts              # Análise de infraestrutura CDK
      database-analyzer.ts         # Análise de banco de dados
      api-analyzer.ts              # Análise de APIs backend
      frontend-analyzer.ts         # Análise de frontend
      auth-analyzer.ts             # Análise de autenticação
      cicd-analyzer.ts             # Análise de CI/CD
      guardrails-analyzer.ts       # Análise de guardrails
      code-analyzer.ts             # Análise de código-fonte
```

## Estrutura de Dados

### Tipos Principais

```typescript
interface SystemInventory {
  metadata: {
    generatedAt: Date;
    generatedBy: string;
    version: string;
  };
  
  infrastructure: {
    region: string;
    stacks: StackInfo[];
  };
  
  database: DatabaseInfo;
  
  backends: {
    fibonacci: BackendApiInfo;
    nigredo: BackendApiInfo;
    operationalDashboard: BackendApiInfo;
  };
  
  frontend: {
    operationalPanel: FrontendInfo;
    commercialSites: FrontendDeploymentInfo;
  };
  
  authentication: CognitoInfo;
  cicd: CiCdInfo;
  guardrails: GuardrailsInfo;
  
  environment: {
    variables: EnvironmentVariableInfo[];
    integrations: ExternalIntegrationInfo[];
  };
  
  gaps: {
    known: GapInfo[];
    risks: RiskInfo[];
    nextSteps: string[];
  };
}
```

### Informações de Stack

```typescript
interface StackInfo {
  name: string;
  environment: 'dev' | 'prod';
  file: string;
  resources: {
    apis: ApiGatewayInfo[];
    lambdas: LambdaInfo[];
    databases: DatabaseInfo[];
    storage: StorageInfo[];
    security: SecurityInfo[];
  };
}
```

### Informações de API

```typescript
interface BackendApiInfo {
  name: string;
  purpose: string;
  apiGateway: {
    dev?: ApiGatewayInfo;
    prod?: ApiGatewayInfo;
  };
  handlers: LambdaHandlerInfo[];
  integrations: string[];
}
```

## Como Funciona

### Fluxo de Execução

1. **Coleta de Dados**
   - Cada analisador examina arquivos específicos
   - Extrai informações relevantes
   - Retorna dados estruturados

2. **Validação**
   - Verifica completude de informações
   - Valida referências cruzadas
   - Detecta inconsistências

3. **Sanitização**
   - Remove valores sensíveis
   - Mascara segredos e credenciais
   - Garante segurança dos documentos

4. **Geração**
   - Compila dados coletados
   - Formata em markdown
   - Salva documentos finais

### Analisadores Disponíveis

#### 1. CDK Analyzer
Analisa infraestrutura AWS definida em CDK.

**Arquivos Analisados:**
- `bin/app.ts`
- `lib/*.ts`
- `lib/dashboards/*.ts`

**Dados Extraídos:**
- Stacks CDK e seus ambientes
- Recursos AWS (APIs, Lambdas, bancos, storage)
- Outputs e exports

#### 2. Database Analyzer
Analisa banco de dados e migrations.

**Arquivos Analisados:**
- `database/migrations/*.sql`
- `database/migrations/README-*.md`
- `database/README.md`

**Dados Extraídos:**
- Configuração Aurora
- Schemas de banco
- Migrations aplicadas
- Decisões conhecidas

#### 3. API Analyzer
Analisa handlers Lambda e rotas de API.

**Arquivos Analisados:**
- `lambda/fibonacci/*.ts`
- `lambda/nigredo/*.ts`
- `lambda/platform/*.ts`
- `lambda/internal/*.ts`

**Dados Extraídos:**
- Handlers Lambda
- Rotas de API Gateway
- Integrações entre serviços

#### 4. Frontend Analyzer
Analisa estrutura Next.js e integrações.

**Arquivos Analisados:**
- `frontend/src/app/**/*.tsx`
- `frontend/src/lib/*.ts`
- `frontend/middleware.ts`

**Dados Extraídos:**
- Rotas Next.js
- API clients
- Integração Cognito
- Status de testes

#### 5. Auth Analyzer
Analisa configuração de autenticação.

**Arquivos Analisados:**
- Documentos de configuração Cognito
- Scripts em `scripts/`
- Código de integração

**Dados Extraídos:**
- User Pool Cognito
- Grupos e permissões
- Usuários DEV (sem senhas)
- Hosted UI

#### 6. CI/CD Analyzer
Analisa pipeline de CI/CD.

**Arquivos Analisados:**
- `.github/workflows/*.yml`
- `scripts/*.ps1`
- Documentos em `docs/ci-cd/`

**Dados Extraídos:**
- Workflow principal
- Jobs e triggers
- Integração OIDC
- Scripts de validação

#### 7. Guardrails Analyzer
Analisa guardrails de segurança, custo e observabilidade.

**Arquivos Analisados:**
- `lib/security-stack.ts`
- `lib/waf-stack.ts`
- `lib/dashboards/*.ts`

**Dados Extraídos:**
- CloudTrail, GuardDuty, WAF
- AWS Budgets
- Dashboards CloudWatch

## Sanitização de Segredos

O sistema detecta e mascara automaticamente valores sensíveis:

### Padrões Detectados

```typescript
const SENSITIVE_PATTERNS = {
  awsAccessKey: /AKIA[0-9A-Z]{16}/g,
  awsSecretKey: /[A-Za-z0-9/+=]{40}/g,
  stripeKey: /sk_(live|test)_[0-9a-zA-Z]{24,}/g,
  genericSecret: /(password|secret|token|key)[\s]*[:=][\s]*[^\s]+/gi,
};
```

### Exemplos de Mascaramento

```
ANTES: AWS_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
DEPOIS: AWS_ACCESS_KEY=AKIA************

ANTES: STRIPE_KEY=sk_live_51234567890abcdef
DEPOIS: STRIPE_KEY=sk_live_********

ANTES: password=minha_senha_secreta
DEPOIS: password=********
```

## Validação de Consistência

O sistema valida automaticamente:

### 1. Completude de Stacks
Verifica se todas as stacks têm informações obrigatórias.

### 2. Unicidade de Identificadores
Garante que IDs, ARNs e nomes lógicos são únicos.

### 3. Referências Cruzadas
Valida que documentos referenciados existem.

### 4. Diferenciação de Ambientes
Confirma separação clara entre dev e prod.

### 5. Ausência de Segredos
Garante que nenhum valor sensível está exposto.

## Como Adicionar Novos Analisadores

### Passo 1: Criar o Analisador

Crie um novo arquivo em `scripts/inventory/analyzers/`:

```typescript
// scripts/inventory/analyzers/meu-analyzer.ts
import { MeuTipoInfo } from '../types';

export async function analyzeMeuComponente(): Promise<MeuTipoInfo> {
  // 1. Ler arquivos relevantes
  const arquivos = await lerArquivos();
  
  // 2. Extrair informações
  const dados = extrairDados(arquivos);
  
  // 3. Retornar dados estruturados
  return {
    // ... dados estruturados
  };
}
```

### Passo 2: Adicionar Tipos

Adicione tipos necessários em `scripts/inventory/types.ts`:

```typescript
export interface MeuTipoInfo {
  nome: string;
  configuracao: string;
  // ... outros campos
}

// Adicionar ao SystemInventory
export interface SystemInventory {
  // ... campos existentes
  meuComponente: MeuTipoInfo;
}
```

### Passo 3: Integrar no Script Principal

Atualize `scripts/generate-system-inventory.ts`:

```typescript
import { analyzeMeuComponente } from './inventory/analyzers/meu-analyzer';

async function collectSystemInventory(): Promise<SystemInventory> {
  // ... analisadores existentes
  
  console.log('Analisando meu componente...');
  const meuComponente = await analyzeMeuComponente();
  
  return {
    // ... dados existentes
    meuComponente,
  };
}
```

### Passo 4: Atualizar Gerador

Atualize `scripts/inventory/generator.ts` para incluir nova seção:

```typescript
export function generateMainDocument(inventory: SystemInventory): string {
  // ... seções existentes
  
  sections.push('## N. Meu Componente');
  sections.push('');
  sections.push(`**Nome:** ${inventory.meuComponente.nome}`);
  sections.push(`**Configuração:** ${inventory.meuComponente.configuracao}`);
  
  // ... resto do documento
}
```

### Passo 5: Adicionar Testes

Crie testes em `tests/unit/inventory/`:

```typescript
// tests/unit/inventory/meu-analyzer.test.ts
import { describe, it, expect } from 'vitest';
import { analyzeMeuComponente } from '../../../scripts/inventory/analyzers/meu-analyzer';

describe('Meu Analyzer', () => {
  it('deve extrair informações corretamente', async () => {
    const resultado = await analyzeMeuComponente();
    
    expect(resultado.nome).toBeDefined();
    expect(resultado.configuracao).toBeDefined();
  });
});
```

## Exemplos de Uso

### Exemplo 1: Gerar Inventário Completo

```bash
npm run generate:inventory
```

**Saída:**
```
Gerando inventário do sistema...
Analisando infraestrutura CDK...
Analisando banco de dados...
Analisando APIs backend...
Analisando frontend...
Analisando autenticação...
Analisando CI/CD...
Analisando guardrails...
Validando dados coletados...
Sanitizando valores sensíveis...
Gerando documento principal...
Gerando índice compacto...

✓ Documentos gerados com sucesso:
  - docs/STATUS-GERAL-SISTEMA-ALQUIMISTAAI.md
  - docs/STATUS-GERAL-SISTEMA-ALQUIMISTAAI-SHORT-INDEX.md
```

### Exemplo 2: Validar Sem Gerar

```bash
npm run validate:inventory
```

**Saída:**
```
Validando inventário...
✓ Completude de stacks: OK
✓ Unicidade de identificadores: OK
✓ Referências cruzadas: OK
✓ Diferenciação de ambientes: OK
✓ Ausência de segredos: OK

Validação concluída com sucesso!
```

### Exemplo 3: Uso Programático

```typescript
import { collectSystemInventory } from './scripts/inventory/analyzers';
import { validateInventory } from './scripts/inventory/validator';
import { generateMainDocument } from './scripts/inventory/generator';

async function exemplo() {
  // Coletar dados
  const inventory = await collectSystemInventory();
  
  // Validar
  const validation = validateInventory(inventory);
  if (!validation.valid) {
    console.error('Validação falhou:', validation.errors);
    return;
  }
  
  // Gerar documento
  const documento = generateMainDocument(inventory);
  console.log(documento);
}
```

## Troubleshooting

### Problema: Arquivo não encontrado

**Erro:**
```
Error: ENOENT: no such file or directory, open 'lib/minha-stack.ts'
```

**Solução:**
- Verifique se o arquivo existe
- Confirme o caminho relativo correto
- O analisador registra warning e continua

### Problema: Parsing falhou

**Erro:**
```
Warning: Failed to parse lib/minha-stack.ts
```

**Solução:**
- Verifique sintaxe TypeScript
- Confirme que arquivo compila
- Analisador usa informação parcial

### Problema: Segredo detectado

**Erro:**
```
CRÍTICO: Dados sensíveis detectados no inventário
```

**Solução:**
- Revise código-fonte
- Remova valores hardcoded
- Use variáveis de ambiente

### Problema: Referência quebrada

**Warning:**
```
Warning: 3 referências quebradas encontradas
```

**Solução:**
- Verifique documentos referenciados
- Atualize links quebrados
- Registrado na seção de Gaps

## Manutenção

### Atualizar Padrões de Sanitização

Edite `scripts/inventory/sanitizer.ts`:

```typescript
const SENSITIVE_PATTERNS = {
  // ... padrões existentes
  meuPadrao: /novo_padrao_regex/g,
};

function sanitize(text: string): string {
  return text
    // ... substituições existentes
    .replace(SENSITIVE_PATTERNS.meuPadrao, 'MASCARADO');
}
```

### Adicionar Validações

Edite `scripts/inventory/validator.ts`:

```typescript
export function validateInventory(inventory: SystemInventory): ValidationResult {
  // ... validações existentes
  
  // Nova validação
  if (!minhaValidacao(inventory)) {
    errors.push('Minha validação falhou');
  }
  
  return { valid: errors.length === 0, errors, warnings };
}
```

## Boas Práticas

### 1. Executar Regularmente

Execute o inventário após mudanças significativas:
- Deploy de nova stack
- Adição de serviços
- Mudanças em migrations
- Atualizações de CI/CD

### 2. Revisar Gaps

Sempre revise a seção de Gaps nos documentos gerados:
- Inconsistências detectadas
- Referências quebradas
- Configurações manuais

### 3. Manter Atualizado

Mantenha analisadores atualizados com mudanças no projeto:
- Novos stacks CDK
- Novos handlers Lambda
- Novas rotas frontend

### 4. Versionar Documentos

Considere versionar documentos gerados:
```bash
cp docs/STATUS-GERAL-SISTEMA-ALQUIMISTAAI.md \
   docs/archive/STATUS-$(date +%Y%m%d).md
```

## Referências

- [Requirements](../../.kiro/specs/system-inventory-documentation/requirements.md)
- [Design](../../.kiro/specs/system-inventory-documentation/design.md)
- [Tasks](../../.kiro/specs/system-inventory-documentation/tasks.md)

## Suporte

Para questões ou problemas:
1. Revise este README
2. Consulte documentos de design e requirements
3. Execute com `--validate-only` para diagnóstico
4. Verifique logs de execução

---

**Última Atualização:** 2024
**Versão:** 1.0.0
**Mantido por:** Equipe AlquimistaAI
