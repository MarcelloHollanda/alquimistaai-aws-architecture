# Design Document - Inventário e Documentação do Sistema AlquimistaAI

## Overview

Este documento detalha o design técnico para criação de um inventário completo e consolidado do Sistema AlquimistaAI. O objetivo é produzir dois documentos principais:

1. **STATUS-GERAL-SISTEMA-ALQUIMISTAAI.md** - Documento completo e autossuficiente para leitura humana
2. **STATUS-GERAL-SISTEMA-ALQUIMISTAAI-SHORT-INDEX.md** - Índice compacto otimizado para consumo por IA

Ambos os documentos serão gerados através de análise automatizada do código, infraestrutura e documentação existente, garantindo máxima fidelidade ao estado atual do sistema.

## Architecture

### Abordagem de Coleta de Dados

O processo de documentação seguirá uma abordagem de **análise estática** combinada com **referências cruzadas**:

```
┌─────────────────────────────────────────────────────────────┐
│                    FONTES DE INFORMAÇÃO                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Código     │  │ Documentação │  │   Scripts    │      │
│  │   CDK/TS     │  │   Markdown   │  │  PowerShell  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
│         └──────────────────┼──────────────────┘               │
│                            │                                  │
│                    ┌───────▼────────┐                        │
│                    │  PROCESSADOR   │                        │
│                    │   DE DADOS     │                        │
│                    └───────┬────────┘                        │
│                            │                                  │
│         ┌──────────────────┼──────────────────┐              │
│         │                  │                  │              │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐     │
│  │  Validador   │  │  Sanitizador │  │  Formatador  │     │
│  │ Consistência │  │   Segredos   │  │   Markdown   │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                  │
│                    ┌───────▼────────┐                        │
│                    │   DOCUMENTOS   │                        │
│                    │    GERADOS     │                        │
│                    └────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### Estratégia de Implementação

1. **Fase 1: Análise de Infraestrutura**
   - Ler arquivos CDK em `lib/`
   - Extrair definições de stacks, recursos, outputs
   - Mapear relações entre componentes

2. **Fase 2: Análise de Banco de Dados**
   - Ler migrations em `database/migrations/`
   - Documentar schemas e decisões conhecidas
   - Identificar fluxo oficial vs legado

3. **Fase 3: Análise de APIs**
   - Mapear handlers Lambda em `lambda/`
   - Identificar rotas e integrações
   - Diferenciar APIs (Fibonacci, Nigredo, Painel)

4. **Fase 4: Análise de Frontend**
   - Examinar estrutura Next.js em `frontend/src/app/`
   - Documentar integração Cognito
   - Listar clients de API

5. **Fase 5: Análise de CI/CD e Guardrails**
   - Ler workflows em `.github/workflows/`
   - Documentar scripts de validação
   - Mapear guardrails de segurança/custo

6. **Fase 6: Consolidação e Geração**
   - Compilar informações coletadas
   - Sanitizar valores sensíveis
   - Gerar documentos finais

## Components and Interfaces

### 1. Analisador de Infraestrutura CDK

**Responsabilidade:** Extrair informações de stacks e recursos AWS

**Arquivos Alvo:**
- `bin/app.ts` - Entry point, instanciação de stacks
- `lib/*.ts` - Definições de stacks
- `lib/dashboards/*.ts` - Dashboards CloudWatch

**Dados Extraídos:**
```typescript
interface StackInfo {
  name: string;
  environment: 'dev' | 'prod';
  resources: {
    apis: ApiGatewayInfo[];
    lambdas: LambdaInfo[];
    databases: DatabaseInfo[];
    storage: StorageInfo[];
    security: SecurityInfo[];
  };
}

interface ApiGatewayInfo {
  logicalName: string;
  type: 'HTTP' | 'REST';
  id?: string; // Extraído de outputs ou docs
  baseUrl?: string;
  routes: string[];
}
```

### 2. Analisador de Banco de Dados

**Responsabilidade:** Documentar estado do banco e migrations

**Arquivos Alvo:**
- `database/migrations/*.sql`
- `database/migrations/README-*.md`
- `database/README.md`

**Dados Extraídos:**
```typescript
interface DatabaseInfo {
  engine: string;
  mode: string;
  region: string;
  schemas: string[];
  migrations: MigrationInfo[];
  decisions: string[];
}

interface MigrationInfo {
  number: string;
  filename: string;
  summary: string;
  status: 'applied' | 'pending' | 'skip';
}
```

### 3. Analisador de APIs Backend

**Responsabilidade:** Mapear handlers Lambda e rotas

**Arquivos Alvo:**
- `lambda/fibonacci/*.ts`
- `lambda/nigredo/*.ts`
- `lambda/platform/*.ts`
- `lambda/internal/*.ts`
- `lib/*-stack.ts` (para rotas API Gateway)

**Dados Extraídos:**
```typescript
interface BackendApiInfo {
  name: string; // 'Fibonacci', 'Nigredo', 'Painel'
  purpose: string;
  apiGateway: {
    dev?: ApiGatewayInfo;
    prod?: ApiGatewayInfo;
  };
  handlers: LambdaHandlerInfo[];
  integrations: string[];
}

interface LambdaHandlerInfo {
  logicalName: string;
  file: string;
  purpose: string;
  routes: string[];
}
```

### 4. Analisador de Frontend

**Responsabilidade:** Documentar estrutura Next.js e integrações

**Arquivos Alvo:**
- `frontend/src/app/**/*.tsx`
- `frontend/src/lib/*.ts`
- `frontend/middleware.ts`
- `frontend/.env.local.example`

**Dados Extraídos:**
```typescript
interface FrontendInfo {
  framework: string;
  location: string;
  routes: RouteInfo[];
  cognito: CognitoIntegrationInfo;
  apiClients: ApiClientInfo[];
  tests: TestInfo;
}

interface RouteInfo {
  path: string;
  type: 'auth' | 'dashboard' | 'company' | 'other';
}

interface ApiClientInfo {
  name: string;
  file: string;
  baseUrlSource: string; // Qual env var usa
}
```

### 5. Analisador de Autenticação

**Responsabilidade:** Documentar configuração Cognito

**Arquivos Alvo:**
- Documentos de configuração Cognito
- Scripts de setup em `scripts/`
- Código de integração em `frontend/src/lib/`

**Dados Extraídos:**
```typescript
interface CognitoInfo {
  userPool: {
    name: string;
    region: string;
    id: string;
    clientIds: string[];
    hostedUiDomain: string;
  };
  groups: CognitoGroupInfo[];
  users: CognitoUserInfo[];
}

interface CognitoGroupInfo {
  name: string;
  role: string;
}

interface CognitoUserInfo {
  email: string;
  groups: string[];
  // NUNCA incluir senha
}
```

### 6. Analisador de CI/CD

**Responsabilidade:** Documentar pipeline e guardrails

**Arquivos Alvo:**
- `.github/workflows/*.yml`
- `scripts/*.ps1`
- Documentos em `docs/ci-cd/`

**Dados Extraídos:**
```typescript
interface CiCdInfo {
  workflow: {
    file: string;
    triggers: string[];
    jobs: JobInfo[];
  };
  oidc: {
    role: string;
    provider: string;
  };
  scripts: ScriptInfo[];
  tests: TestLogInfo[];
}
```

### 7. Analisador de Guardrails

**Responsabilidade:** Documentar segurança, custo e observabilidade

**Arquivos Alvo:**
- `lib/security-stack.ts`
- `lib/waf-stack.ts`
- `lib/dashboards/*.ts`
- Documentos em `docs/`

**Dados Extraídos:**
```typescript
interface GuardrailsInfo {
  security: {
    cloudTrail: CloudTrailInfo;
    guardDuty: GuardDutyInfo;
    waf: WafInfo;
    sns: SnsTopicInfo[];
  };
  cost: {
    budgets: BudgetInfo[];
    anomalyDetection: AnomalyDetectionInfo;
  };
  observability: {
    dashboards: DashboardInfo[];
  };
}
```

### 8. Sanitizador de Segredos

**Responsabilidade:** Remover/mascarar valores sensíveis

**Padrões de Detecção:**
```typescript
const SENSITIVE_PATTERNS = {
  awsAccessKey: /AKIA[0-9A-Z]{16}/g,
  awsSecretKey: /[A-Za-z0-9/+=]{40}/g,
  stripeKey: /sk_(live|test)_[0-9a-zA-Z]{24,}/g,
  genericSecret: /(password|secret|token|key)[\s]*[:=][\s]*[^\s]+/gi,
};

function sanitize(text: string): string {
  return text
    .replace(SENSITIVE_PATTERNS.awsAccessKey, 'AKIA************')
    .replace(SENSITIVE_PATTERNS.stripeKey, 'sk_live_********')
    // ... outros padrões
}
```

### 9. Gerador de Documentos

**Responsabilidade:** Compilar dados e gerar markdown

**Estrutura do Documento Principal:**
```markdown
# STATUS GERAL DO SISTEMA ALQUIMISTAAI

## Cabeçalho
- Título, data, versão, executor
- Resumo executivo (5-10 bullets)

## 1. Infraestrutura AWS
- Região principal
- Stacks CDK por ambiente
- Recursos principais

## 2. Bancos de Dados e Migrations
- Aurora PostgreSQL
- Migrations oficiais
- Supabase (legado)

## 3. Backends de API
- Fibonacci Orquestrador
- Nigredo
- Painel Operacional

## 4. Frontend
- Painel Operacional (Next.js)
- Frontends Comerciais (S3 + CloudFront)

## 5. Autenticação & Autorização
- User Pool Cognito
- Grupos e usuários

## 6. CI/CD e Guardrails
- Workflow principal
- Scripts de validação
- Testes

## 7. Segurança, Custo e Observabilidade
- Guardrails de segurança
- Guardrails de custo
- Dashboards

## 8. Variáveis de Ambiente
- Tabela de referência

## 9. Gaps, Riscos e Próximos Passos
- Gaps conhecidos
- Riscos
- Recomendações
```

**Estrutura do Índice Compacto:**
```markdown
# SHORT INDEX — STATUS GERAL ALQUIMISTAAI

## Identificadores-Chave
- AWS Region: us-east-1
- Aurora Cluster: [nome/ARN]
- API Gateway Fibonacci DEV: [ID + URL]
- API Gateway Fibonacci PROD: [ID + URL]
- API Gateway Painel DEV: [ID + URL]
- API Gateway Painel PROD: [ID + URL]
- User Pool Cognito DEV: [ID + nome]
- CloudFront Distributions: [IDs + domínios]
- Buckets S3: [nomes]
- Stacks CDK: [lista]
- Dashboards CloudWatch: [nomes]

## Backends
[Resumo de 2-3 linhas por backend]

## Frontends
[Resumo de 2-3 linhas]

## CI/CD
[Resumo de 2-3 linhas]

## Segurança
[Resumo de 2-3 linhas]

## Variáveis-Chave
[Lista sem valores]
```

## Data Models

### Modelo de Dados Consolidado

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

interface EnvironmentVariableInfo {
  name: string;
  usedIn: string[]; // ['frontend', 'lambda', 'cdk', 'scripts']
  storedIn: string[]; // ['.env.local', 'Secrets Manager', 'SSM']
  description: string;
  // NUNCA incluir value
}

interface GapInfo {
  description: string;
  reference: string; // arquivo:linha
  severity: 'low' | 'medium' | 'high';
}

interface RiskInfo {
  description: string;
  impact: string;
  mitigation?: string;
}
```

## Correctness Properties

*Uma propriedade é uma característica ou comportamento que deve ser verdadeiro em todas as execuções válidas de um sistema - essencialmente, uma declaração formal sobre o que o sistema deve fazer. As propriedades servem como ponte entre especificações legíveis por humanos e garantias de correção verificáveis por máquina.*

### Property 1: Completude de Stacks

*Para qualquer* stack CDK listada no documento, todas as informações obrigatórias (nome, ambiente, recursos principais) devem estar presentes e não vazias.

**Valida: Requirements 1.1, 1.2**

### Property 2: Sanitização de Segredos

*Para qualquer* valor sensível detectado (chaves AWS, tokens, senhas), o documento gerado deve conter apenas a versão mascarada, nunca o valor real.

**Valida: Requirements 5.3, 8.2**

### Property 3: Consistência de Referências

*Para qualquer* referência cruzada a outro documento, o arquivo referenciado deve existir no repositório.

**Valida: Requirements 9.1**

### Property 4: Unicidade de Identificadores

*Para qualquer* recurso AWS documentado (API Gateway, Lambda, etc.), o identificador (ID, ARN, nome lógico) deve ser único dentro de seu tipo e ambiente.

**Valida: Requirements 1.3, 3.1**

### Property 5: Completude de Migrations

*Para qualquer* migration listada, deve haver correspondência entre o arquivo SQL e a entrada na documentação.

**Valida: Requirements 2.3**

### Property 6: Diferenciação de Ambientes

*Para qualquer* recurso que existe em múltiplos ambientes, o documento deve claramente diferenciar entre dev e prod.

**Valida: Requirements 1.5, 3.1**

### Property 7: Formato de Comandos Windows

*Para qualquer* comando ou script documentado, deve usar sintaxe compatível com Windows (PowerShell/cmd), não bash.

**Valida: Constraints do sistema operacional**

### Property 8: Completude de Variáveis de Ambiente

*Para qualquer* variável de ambiente listada, todas as informações obrigatórias (nome, onde é usada, onde é armazenada, descrição) devem estar presentes.

**Valida: Requirements 8.1**

### Property 9: Índice Compacto Sincronizado

*Para qualquer* identificador-chave no índice compacto, deve haver correspondência com informação detalhada no documento principal.

**Valida: Requirements 10.2, 10.3**

### Property 10: Ausência de Valores Sensíveis

*Para qualquer* linha do documento gerado, não deve conter padrões que correspondam a senhas, segredos, chaves privadas ou tokens reais.

**Valida: Requirements 5.4, Constraints de segurança**

## Error Handling

### Estratégias de Tratamento de Erros

1. **Arquivo Não Encontrado**
   - Registrar warning no log
   - Marcar seção como "Informação não disponível"
   - Continuar processamento

2. **Parsing Falhou**
   - Registrar erro com contexto
   - Tentar parsing alternativo
   - Se falhar, usar informação parcial

3. **Inconsistência Detectada**
   - Registrar na seção de Gaps
   - Incluir referência precisa (arquivo:linha)
   - Continuar processamento

4. **Segredo Não Sanitizado**
   - FALHAR imediatamente
   - Não gerar documento
   - Alertar usuário

5. **Referência Cruzada Quebrada**
   - Registrar warning
   - Incluir na seção de Gaps
   - Continuar processamento

### Validações Pré-Geração

```typescript
function validateBeforeGeneration(inventory: SystemInventory): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validação crítica: nenhum segredo exposto
  if (containsSensitiveData(inventory)) {
    errors.push('CRÍTICO: Dados sensíveis detectados no inventário');
  }
  
  // Validação: completude mínima
  if (!inventory.infrastructure.stacks.length) {
    warnings.push('Nenhuma stack CDK encontrada');
  }
  
  // Validação: referências cruzadas
  const brokenRefs = findBrokenReferences(inventory);
  if (brokenRefs.length) {
    warnings.push(`${brokenRefs.length} referências quebradas encontradas`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
```

## Testing Strategy

### Abordagem de Testes

O sistema de documentação será testado através de:

1. **Testes Unitários** - Validar componentes individuais
2. **Testes de Integração** - Validar fluxo completo
3. **Testes de Propriedades** - Validar propriedades de correção

### Testes Unitários

Focar em:
- Analisadores individuais (CDK, Database, API, etc.)
- Sanitizador de segredos
- Formatador de markdown
- Validador de consistência

Exemplo:
```typescript
describe('Sanitizador de Segredos', () => {
  it('deve mascarar chaves AWS', () => {
    const input = 'AWS_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE';
    const output = sanitize(input);
    expect(output).toBe('AWS_ACCESS_KEY=AKIA************');
  });
  
  it('deve mascarar chaves Stripe', () => {
    const input = 'STRIPE_KEY=sk_live_51234567890abcdef';
    const output = sanitize(input);
    expect(output).toBe('STRIPE_KEY=sk_live_********');
  });
});
```

### Testes de Integração

Focar em:
- Fluxo completo de geração
- Validação de documentos gerados
- Verificação de referências cruzadas

Exemplo:
```typescript
describe('Geração de Documentos', () => {
  it('deve gerar documento principal completo', async () => {
    const inventory = await collectSystemInventory();
    const doc = await generateMainDocument(inventory);
    
    expect(doc).toContain('# STATUS GERAL DO SISTEMA ALQUIMISTAAI');
    expect(doc).toContain('## 1. Infraestrutura AWS');
    expect(doc).not.toContain(/AKIA[0-9A-Z]{16}/); // Sem chaves AWS
  });
});
```

### Testes de Propriedades

Usar biblioteca de property-based testing para TypeScript (fast-check):

```typescript
import fc from 'fast-check';

describe('Property: Sanitização de Segredos', () => {
  it('deve mascarar todos os padrões sensíveis', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.string(),
        (prefix, suffix) => {
          const awsKey = `${prefix}AKIAIOSFODNN7EXAMPLE${suffix}`;
          const sanitized = sanitize(awsKey);
          
          // Propriedade: resultado não deve conter chave completa
          return !sanitized.includes('AKIAIOSFODNN7EXAMPLE');
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Configuração:** Cada teste de propriedade deve executar no mínimo 100 iterações.

**Marcação:** Cada teste de propriedade deve incluir comentário:
```typescript
// **Feature: system-inventory-documentation, Property 2: Sanitização de Segredos**
```

## Implementation Notes

### Ordem de Implementação

1. **Primeiro:** Implementar analisadores de dados
2. **Segundo:** Implementar sanitizador de segredos
3. **Terceiro:** Implementar validadores
4. **Quarto:** Implementar gerador de documentos
5. **Quinto:** Implementar testes

### Considerações Especiais

#### Identificação de APIs

**Problema:** Diferenciar API do Fibonacci Orquestrador da API do Painel Operacional

**Solução:**
1. Examinar `lib/fibonacci-stack.ts` para API do Fibonacci
2. Examinar `lib/operational-dashboard-stack.ts` para API do Painel
3. Verificar rotas definidas em cada stack
4. Documentar claramente a diferença

#### Migrations Duplicadas

**Problema:** Migration 009 é duplicada da 008

**Solução:**
1. Documentar explicitamente: "Migration 009 deve ser pulada (duplicada da 008)"
2. Incluir na seção de decisões conhecidas
3. Referenciar documentos que explicam isso

#### Supabase Legado

**Problema:** Código Supabase ainda existe mas não é oficial

**Solução:**
1. Marcar claramente como "LEGADO/LAB"
2. Documentar onde ainda existe
3. Deixar claro que Aurora é o fluxo oficial

### Ferramentas e Bibliotecas

- **TypeScript** - Linguagem principal
- **fast-check** - Property-based testing
- **gray-matter** - Parsing de frontmatter em markdown
- **glob** - Busca de arquivos
- **fs-extra** - Operações de arquivo

### Estrutura de Arquivos

```
scripts/
  generate-system-inventory.ts    # Script principal
  inventory/
    analyzers/
      cdk-analyzer.ts
      database-analyzer.ts
      api-analyzer.ts
      frontend-analyzer.ts
      auth-analyzer.ts
      cicd-analyzer.ts
      guardrails-analyzer.ts
    sanitizer.ts
    validator.ts
    generator.ts
    types.ts
```

### Execução

```powershell
# Gerar inventário
npm run generate:inventory

# Gerar apenas documento principal
npm run generate:inventory:main

# Gerar apenas índice compacto
npm run generate:inventory:index

# Validar sem gerar
npm run validate:inventory
```

## References

- [RESUMO-TECNICO-SISTEMA.md](../../RESUMO-TECNICO-SISTEMA.md)
- [docs/SECURITY-GUARDRAILS-AWS.md](../../docs/SECURITY-GUARDRAILS-AWS.md)
- [docs/COST-GUARDRAILS-AWS.md](../../docs/COST-GUARDRAILS-AWS.md)
- [docs/CI-CD-PIPELINE-ALQUIMISTAAI.md](../../docs/CI-CD-PIPELINE-ALQUIMISTAAI.md)
- [docs/INDEX-OPERATIONS-AWS.md](../../docs/INDEX-OPERATIONS-AWS.md)
- [database/README.md](../../database/README.md)
- [frontend/docs/DIAGNOSTICO-404-LOCAL-RESULTADOS.md](../../frontend/docs/DIAGNOSTICO-404-LOCAL-RESULTADOS.md)
