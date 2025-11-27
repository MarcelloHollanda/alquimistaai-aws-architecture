# 🤝 Guia de Contribuição - Ecossistema Alquimista.AI

Obrigado por considerar contribuir para o Ecossistema Alquimista.AI! Este documento fornece diretrizes detalhadas para contribuições efetivas e alinhadas com nossa arquitetura fractal serverless.

## 📋 Índice

- [Código de Conduta](#código-de-conduta)
- [Como Contribuir](#como-contribuir)
- [Tipos de Contribuição](#tipos-de-contribuição)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Padrões de Desenvolvimento](#padrões-de-desenvolvimento)
- [Arquitetura e Estrutura](#arquitetura-e-estrutura)
- [Processo de Pull Request](#processo-de-pull-request)
- [Testes](#testes)
- [Documentação](#documentação)
- [Reportar Issues](#reportar-issues)
- [Segurança](#segurança)
- [Comunidade](#comunidade)

## 📜 Código de Conduta

Este projeto adere ao [Contributor Covenant](https://www.contributor-covenant.org/). Ao participar, você deve seguir este código.

## 🚀 Como Contribuir

### 1. Fork e Clone
```bash
# Fork o repositório no GitHub
# Clone seu fork
git clone https://github.com/SEU_USUARIO/AlquimistaAI.git
cd AlquimistaAI

# Adicione o repositório original como upstream
git remote add upstream https://github.com/MarcelloHollanda/AlquimistaAI.git
```

### 2. Configurar Ambiente
```bash
# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas configurações

# Execute testes para verificar setup
npm test
```

### 3. Criar Branch
```bash
# Crie uma branch para sua feature/fix
git checkout -b feature/nome-da-feature
# ou
git checkout -b fix/nome-do-bug
# ou
git checkout -b docs/atualizacao-documentacao
```

## 🎯 Tipos de Contribuição

### 🐛 Bug Fixes
- Correções de bugs existentes
- Melhorias de performance
- Correções de segurança

### ✨ Novas Features
- Novos agentes Nigredo
- Integrações MCP adicionais
- Funcionalidades da plataforma Alquimista

### 📚 Documentação
- Guias de uso
- Documentação técnica
- Exemplos e tutoriais

### 🧪 Testes
- Testes unitários
- Testes de integração
- Testes de carga

### 🔧 Infraestrutura
- Melhorias na arquitetura CDK
- Otimizações de custos
- Configurações de segurança

## 📝 Padrões de Desenvolvimento

### Conventional Commits
Use o padrão [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>[escopo opcional]: <descrição>

[corpo opcional]

[rodapé opcional]
```

**Tipos:**
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (não afeta lógica)
- `refactor`: Refatoração de código
- `test`: Adição/correção de testes
- `chore`: Tarefas de manutenção

**Exemplos:**
```bash
git commit -m "feat(agents): adiciona agente de relatórios"
git commit -m "fix(auth): corrige validação de token JWT"
git commit -m "docs: atualiza guia de instalação"
```

### Estrutura de Código

#### TypeScript
```typescript
// Use interfaces para tipos
interface AgentConfig {
  name: string;
  enabled: boolean;
  timeout: number;
}

// Use async/await ao invés de Promises
async function processLead(lead: Lead): Promise<ProcessResult> {
  try {
    const result = await enrichLead(lead);
    return { success: true, data: result };
  } catch (error) {
    logger.error('Failed to process lead', { error, leadId: lead.id });
    throw error;
  }
}

// Use JSDoc para documentação
/**
 * Processa um lead através do pipeline de enriquecimento
 * @param lead - Lead a ser processado
 * @returns Resultado do processamento
 */
```

#### AWS CDK
```typescript
// Use constructs reutilizáveis
export class AgentLambda extends Construct {
  public readonly function: nodejs.NodejsFunction;

  constructor(scope: Construct, id: string, props: AgentLambdaProps) {
    super(scope, id);
    
    this.function = new nodejs.NodejsFunction(this, 'Function', {
      // configuração...
    });
  }
}

// Organize stacks logicamente
export class NigredoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: NigredoStackProps) {
    super(scope, id, props);
    
    // Agrupe recursos relacionados
    this.createQueues();
    this.createLambdas();
    this.createEventRules();
  }
}
```

### Testes

#### Estrutura de Testes
```typescript
// tests/unit/agents/recebimento.test.ts
describe('Agente de Recebimento', () => {
  let agent: RecebimentoAgent;
  
  beforeEach(() => {
    agent = new RecebimentoAgent();
  });

  describe('processLead', () => {
    it('deve processar lead válido com sucesso', async () => {
      // Arrange
      const lead = createMockLead();
      
      // Act
      const result = await agent.processLead(lead);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.data.email).toBe(lead.email);
    });

    it('deve rejeitar lead com email inválido', async () => {
      // Arrange
      const lead = createMockLead({ email: 'invalid-email' });
      
      // Act & Assert
      await expect(agent.processLead(lead)).rejects.toThrow('Invalid email');
    });
  });
});
```

#### Cobertura de Testes
- Mantenha cobertura > 80%
- Teste casos de sucesso e falha
- Use mocks para dependências externas
- Teste integração entre componentes

### Documentação

#### README de Componentes
```markdown
# Agente de Recebimento

## Visão Geral
Processa e valida leads de planilhas Excel/CSV.

## Funcionalidades
- ✅ Validação de email e telefone
- ✅ Enriquecimento com APIs externas
- ✅ Detecção de duplicatas

## Uso
\`\`\`typescript
const agent = new RecebimentoAgent();
const result = await agent.processLead(lead);
\`\`\`

## Configuração
| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `TIMEOUT` | Timeout em ms | 30000 |
```

#### JSDoc
```typescript
/**
 * Agente responsável pelo recebimento e validação de leads
 * 
 * @example
 * ```typescript
 * const agent = new RecebimentoAgent();
 * const result = await agent.processLead(lead);
 * ```
 */
export class RecebimentoAgent {
  /**
   * Processa um lead através do pipeline de validação
   * 
   * @param lead - Lead a ser processado
   * @param options - Opções de processamento
   * @returns Resultado do processamento com dados enriquecidos
   * 
   * @throws {ValidationError} Quando dados do lead são inválidos
   * @throws {EnrichmentError} Quando falha ao enriquecer dados
   */
  async processLead(lead: Lead, options?: ProcessOptions): Promise<ProcessResult> {
    // implementação...
  }
}
```

## 🔄 Processo de Pull Request

### 1. Antes de Submeter
```bash
# Sincronize com upstream
git fetch upstream
git checkout main
git merge upstream/main

# Rebase sua branch
git checkout feature/sua-feature
git rebase main

# Execute testes
npm test
npm run lint
npm run type-check

# Execute build
npm run build
```

### 2. Checklist do PR
- [ ] Código segue padrões estabelecidos
- [ ] Testes adicionados/atualizados
- [ ] Documentação atualizada
- [ ] Commits seguem Conventional Commits
- [ ] Build passa sem erros
- [ ] Cobertura de testes mantida

### 3. Template do PR
```markdown
## 📋 Descrição
Breve descrição das mudanças.

## 🔄 Tipo de Mudança
- [ ] Bug fix (mudança que corrige um issue)
- [ ] Nova feature (mudança que adiciona funcionalidade)
- [ ] Breaking change (mudança que quebra compatibilidade)
- [ ] Documentação

## 🧪 Como Testar
1. Passos para testar as mudanças
2. Comandos específicos
3. Resultados esperados

## 📝 Checklist
- [ ] Código testado localmente
- [ ] Testes passando
- [ ] Documentação atualizada
- [ ] Commits seguem padrão
```

## 🐛 Reportar Issues

### Template de Bug Report
```markdown
## 🐛 Descrição do Bug
Descrição clara e concisa do bug.

## 🔄 Passos para Reproduzir
1. Vá para '...'
2. Clique em '...'
3. Veja o erro

## ✅ Comportamento Esperado
O que deveria acontecer.

## 📱 Ambiente
- OS: [Windows/Mac/Linux]
- Node.js: [versão]
- AWS Region: [região]
- Environment: [dev/staging/prod]

## 📋 Logs
```
Cole logs relevantes aqui
```

## 💡 Context Adicional
Qualquer informação adicional sobre o problema.
```

### Template de Feature Request
```markdown
## 🚀 Feature Request

## 📋 Descrição
Descrição clara da feature desejada.

## 💡 Motivação
Por que esta feature é necessária?

## 🎯 Solução Proposta
Como você imagina que deveria funcionar?

## 🔄 Alternativas Consideradas
Outras abordagens que você considerou?

## 📝 Contexto Adicional
Informações adicionais relevantes.
```

## 🛠️ Configuração do Ambiente

### Pré-requisitos
- Node.js 20.x
- AWS CLI configurado
- Git
- Editor com suporte TypeScript

### Variáveis de Ambiente
```bash
# .env.local
AWS_REGION=us-east-1
AWS_PROFILE=default
LOG_LEVEL=debug

# Para testes locais
TEST_DB_URL=postgresql://localhost:5432/test
MOCK_EXTERNAL_APIS=true
```

### Scripts Úteis
```bash
# Desenvolvimento
npm run dev          # Inicia desenvolvimento
npm run watch        # Watch mode para testes
npm run lint:fix     # Corrige problemas de lint

# Testes
npm run test:unit    # Testes unitários
npm run test:int     # Testes de integração
npm run test:e2e     # Testes end-to-end
npm run test:cov     # Cobertura de testes

# Build e Deploy
npm run build        # Build do projeto
npm run deploy:dev   # Deploy para dev
npm run diff         # CDK diff
```

## 🎯 Áreas de Contribuição

### 🤖 Agentes
- Novos agentes especializados
- Melhorias nos agentes existentes
- Integração com novas APIs

### 🏗️ Infraestrutura
- Otimizações de performance
- Melhorias de segurança
- Redução de custos AWS

### 📊 Monitoramento
- Novas métricas de negócio
- Dashboards customizados
- Alertas inteligentes

### 📚 Documentação
- Guias de uso
- Tutoriais
- Exemplos práticos

### 🧪 Testes
- Cobertura de testes
- Testes de performance
- Testes de segurança

## 🏆 Reconhecimento

Contribuidores são reconhecidos:
- No README.md
- Em releases notes
- No hall da fama do projeto

## 📞 Suporte

- **Issues**: Para bugs e features
- **Discussions**: Para perguntas gerais
- **Slack**: #alquimista-dev (para contribuidores)

---

**Obrigado por contribuir para o AlquimistaAI! 🚀**
## 🏗️ Arq
uitetura e Estrutura

### Estrutura do Projeto
```
AlquimistaAI/
├── bin/                    # Entry points CDK
├── lib/                    # Stacks CDK
│   ├── fibonacci-stack.ts  # Infraestrutura base
│   ├── nigredo-stack.ts    # Agentes de prospecção
│   └── alquimista-stack.ts # Plataforma SaaS
├── lambda/                 # Código das funções Lambda
│   ├── shared/            # Utilitários compartilhados
│   ├── agents/            # Agentes Nigredo
│   └── platform/          # APIs da plataforma
├── mcp-integrations/      # Conectores MCP
├── database/              # Schemas e migrações
├── docs/                  # Documentação
├── tests/                 # Testes automatizados
└── scripts/               # Scripts de automação
```

### Princípios Arquiteturais

#### 1. Arquitetura Fractal
- Cada núcleo (Fibonacci, Nigredo, Alquimista) é independente
- Comunicação via EventBridge
- Isolamento de responsabilidades

#### 2. Serverless First
- Preferir serviços gerenciados AWS
- Auto-scaling automático
- Pay-per-use

#### 3. Event-Driven
- Comunicação assíncrona
- Desacoplamento de componentes
- Resiliência através de filas

#### 4. Security by Design
- Princípio de menor privilégio
- Criptografia em repouso e trânsito
- Auditoria completa

## 🛠️ Padrões de Desenvolvimento

### Conventional Commits
Usamos [Conventional Commits](https://www.conventionalcommits.org/) para mensagens de commit:

```bash
# Formato
<tipo>[escopo opcional]: <descrição>

# Exemplos
feat(agents): adicionar agente de análise de sentimento
fix(fibonacci): corrigir timeout do API Gateway
docs(readme): atualizar instruções de instalação
test(nigredo): adicionar testes para agente de disparo
refactor(shared): otimizar logger compartilhado
```

#### Tipos de Commit
- **feat**: Nova funcionalidade
- **fix**: Correção de bug
- **docs**: Documentação
- **style**: Formatação (não afeta lógica)
- **refactor**: Refatoração de código
- **test**: Adição/modificação de testes
- **chore**: Tarefas de manutenção

### Padrões de Código TypeScript

#### 1. Nomenclatura
```typescript
// Classes: PascalCase
class EventProcessor {}

// Interfaces: PascalCase com 'I' prefix
interface IEventHandler {}

// Funções e variáveis: camelCase
const processEvent = () => {}
const eventCount = 10

// Constantes: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3

// Enums: PascalCase
enum EventType {
  LEAD_RECEIVED = 'lead.received',
  CAMPAIGN_CREATED = 'campaign.created'
}
```

#### 2. Estrutura de Arquivos
```typescript
// lambda/agents/exemplo.ts
import { EventBridgeEvent } from 'aws-lambda'
import { Logger } from '../shared/logger'
import { DatabaseClient } from '../shared/database'

interface ExemploEvent {
  leadId: string
  action: string
}

export class ExemploAgent {
  private logger: Logger
  private db: DatabaseClient

  constructor() {
    this.logger = new Logger('ExemploAgent')
    this.db = new DatabaseClient()
  }

  async handler(event: EventBridgeEvent<string, ExemploEvent>) {
    // Implementação
  }
}

// Export para Lambda
export const handler = new ExemploAgent().handler
```

#### 3. Error Handling
```typescript
import { withErrorHandling } from '../shared/error-handler'

export const handler = withErrorHandling(async (event) => {
  try {
    // Lógica principal
    return { statusCode: 200, body: 'Success' }
  } catch (error) {
    // Errors são capturados pelo wrapper
    throw error
  }
})
```

#### 4. Logging Estruturado
```typescript
import { Logger } from '../shared/logger'

const logger = new Logger('AgentName')

// Sempre incluir trace_id e contexto relevante
logger.info('Processing lead', {
  leadId: 'lead-123',
  tenantId: 'tenant-456',
  action: 'enrich_data'
})
```

### Padrões CDK

#### 1. Estrutura de Stack
```typescript
export interface StackProps extends cdk.StackProps {
  envName: string
  envConfig: EnvironmentConfig
}

export class ExemploStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props)

    // Recursos organizados por seção
    this.createVpcResources()
    this.createDatabaseResources()
    this.createLambdaResources()
    this.createOutputs()
  }

  private createVpcResources() {
    // Implementação VPC
  }
}
```

#### 2. Naming Conventions
```typescript
// Recursos CDK: PascalCase descritivo
const apiHandler = new nodejs.NodejsFunction(this, 'ApiHandler', {
  functionName: `fibonacci-api-handler-${props.envName}`,
  // ...
})

// Outputs: Descritivos e exportáveis
new cdk.CfnOutput(this, 'ApiEndpoint', {
  value: api.url,
  exportName: `FibonacciApiEndpoint-${props.envName}`
})
```

## 🧪 Testes

### Estrutura de Testes
```
tests/
├── unit/                  # Testes unitários
│   ├── agents/           # Testes dos agentes
│   ├── shared/           # Testes de utilitários
│   └── stacks/           # Testes das stacks CDK
├── integration/          # Testes de integração
│   ├── api/             # Testes de API
│   └── workflows/       # Testes de fluxos completos
├── e2e/                 # Testes end-to-end
└── load/                # Testes de carga
```

### Padrões de Teste

#### 1. Testes Unitários
```typescript
// tests/unit/agents/recebimento.test.ts
import { RecebimentoAgent } from '../../../lambda/agents/recebimento'

describe('RecebimentoAgent', () => {
  let agent: RecebimentoAgent

  beforeEach(() => {
    agent = new RecebimentoAgent()
  })

  describe('processLead', () => {
    it('should validate required fields', async () => {
      const invalidLead = { empresa: '' }
      
      await expect(agent.processLead(invalidLead))
        .rejects.toThrow('Campo empresa é obrigatório')
    })

    it('should format phone number correctly', async () => {
      const lead = {
        empresa: 'Test Corp',
        telefone: '11999999999'
      }

      const result = await agent.processLead(lead)
      expect(result.telefone).toBe('+5511999999999')
    })
  })
})
```

#### 2. Testes de Integração
```typescript
// tests/integration/api/health.test.ts
import { APIGatewayProxyEvent } from 'aws-lambda'
import { handler } from '../../../lambda/handler'

describe('API Health Check', () => {
  it('should return 200 for health endpoint', async () => {
    const event: APIGatewayProxyEvent = {
      httpMethod: 'GET',
      path: '/health',
      // ... outros campos
    }

    const result = await handler(event, {} as any)
    
    expect(result.statusCode).toBe(200)
    expect(JSON.parse(result.body)).toEqual({ ok: true })
  })
})
```

### Executar Testes
```bash
# Todos os testes
npm test

# Testes específicos
npm run test:unit
npm run test:integration
npm run test:e2e

# Com cobertura
npm run test:coverage

# Watch mode
npm run test:watch
```

## 📚 Documentação

### Padrões de Documentação

#### 1. README de Componentes
Cada agente deve ter um README.md explicando:
- Propósito e responsabilidades
- Input/Output esperados
- Configuração necessária
- Exemplos de uso
- Métricas e SLAs

#### 2. Comentários no Código
```typescript
/**
 * Processa lead recebido realizando higienização e enriquecimento
 * 
 * @param lead - Dados brutos do lead
 * @param context - Contexto da execução (tenantId, traceId)
 * @returns Lead processado e enriquecido
 * 
 * @throws {ValidationError} Quando campos obrigatórios estão ausentes
 * @throws {EnrichmentError} Quando APIs externas falham
 */
async processLead(lead: RawLead, context: ProcessingContext): Promise<ProcessedLead> {
  // Implementação
}
```

#### 3. Documentação de APIs
```typescript
// Usar JSDoc para documentar APIs
/**
 * @api {post} /events Publicar Evento
 * @apiName PublishEvent
 * @apiGroup Events
 * 
 * @apiParam {String} source Origem do evento
 * @apiParam {String} type Tipo do evento
 * @apiParam {Object} detail Detalhes do evento
 * 
 * @apiSuccess {String} eventId ID do evento publicado
 * @apiSuccess {String} status Status da publicação
 * 
 * @apiError {String} error Descrição do erro
 */
```

## 🔒 Segurança

### Diretrizes de Segurança

#### 1. Secrets e Credenciais
```typescript
// ❌ Nunca fazer isso
const apiKey = 'sk-1234567890abcdef'

// ✅ Usar Secrets Manager
const secret = await secretsManager.getSecretValue({
  SecretId: 'fibonacci/mcp/whatsapp'
}).promise()
```

#### 2. Validação de Input
```typescript
import { z } from 'zod'

const LeadSchema = z.object({
  empresa: z.string().min(1),
  email: z.string().email().optional(),
  telefone: z.string().regex(/^\+55\d{10,11}$/).optional()
})

// Sempre validar inputs
const validatedLead = LeadSchema.parse(rawLead)
```

#### 3. Logs Seguros
```typescript
// ❌ Nunca logar dados sensíveis
logger.info('Processing lead', { lead: fullLeadData })

// ✅ Logar apenas IDs e metadados
logger.info('Processing lead', {
  leadId: lead.id,
  tenantId: context.tenantId,
  action: 'enrich_data'
})
```

### Reportar Vulnerabilidades
Para reportar vulnerabilidades de segurança:
1. **NÃO** abra issue público
2. Envie email para: security@alquimista.ai
3. Inclua detalhes da vulnerabilidade
4. Aguarde resposta em até 48h

## 🔄 Processo de Pull Request

### Antes de Submeter

#### 1. Checklist Técnico
- [ ] Código compila sem erros (`npm run build`)
- [ ] Testes passam (`npm test`)
- [ ] Linter passa (`npm run lint`)
- [ ] Cobertura de testes mantida
- [ ] Documentação atualizada

#### 2. Checklist de Segurança
- [ ] Sem credenciais hardcoded
- [ ] Inputs validados
- [ ] Logs não expõem dados sensíveis
- [ ] Permissões IAM seguem menor privilégio

#### 3. Checklist de Arquitetura
- [ ] Segue padrões estabelecidos
- [ ] Não quebra compatibilidade
- [ ] Performance considerada
- [ ] Observabilidade incluída

### Template de PR
```markdown
## 🔄 Tipo de Mudança
- [ ] Bug fix (mudança que corrige um issue)
- [ ] Nova feature (mudança que adiciona funcionalidade)
- [ ] Breaking change (mudança que quebra compatibilidade)
- [ ] Documentação

## 📝 Descrição
Descreva suas mudanças em detalhes.

## 🧪 Como Testar
Instruções para testar as mudanças.

## 📋 Checklist
- [ ] Código testado localmente
- [ ] Testes passando
- [ ] Documentação atualizada
- [ ] Commits seguem padrão
```

### Processo de Review

#### 1. Revisão Automática
- GitHub Actions executam testes
- Security scan automático
- Verificação de padrões de código

#### 2. Revisão Manual
- Mínimo 2 aprovações necessárias
- Revisão de arquitetura
- Revisão de segurança
- Revisão de performance

#### 3. Merge
- Squash and merge preferido
- Mensagem de commit seguindo padrão
- Deploy automático para dev/staging

## 🐛 Reportar Issues

### Tipos de Issues

#### 1. Bug Report
```markdown
**Descrição do Bug**
Descrição clara do que está acontecendo.

**Reproduzir**
Passos para reproduzir:
1. Vá para '...'
2. Clique em '....'
3. Role para baixo até '....'
4. Veja o erro

**Comportamento Esperado**
O que deveria acontecer.

**Screenshots**
Se aplicável, adicione screenshots.

**Ambiente**
- OS: [e.g. macOS]
- Node Version: [e.g. 20.x]
- AWS Region: [e.g. us-east-1]
```

#### 2. Feature Request
```markdown
**Problema Relacionado**
Descrição do problema que esta feature resolveria.

**Solução Proposta**
Descrição da solução desejada.

**Alternativas Consideradas**
Outras soluções consideradas.

**Contexto Adicional**
Qualquer contexto adicional sobre a feature.
```

### Labels de Issues
- `bug`: Algo não está funcionando
- `enhancement`: Nova feature ou melhoria
- `documentation`: Melhorias na documentação
- `good first issue`: Bom para iniciantes
- `help wanted`: Ajuda extra é bem-vinda
- `priority:high`: Alta prioridade
- `priority:medium`: Média prioridade
- `priority:low`: Baixa prioridade

## 👥 Comunidade

### Canais de Comunicação
- **GitHub Discussions**: Discussões gerais e dúvidas
- **GitHub Issues**: Bugs e feature requests
- **Email**: contato@alquimista.ai
- **Slack**: #alquimista-ai (convite via email)

### Eventos
- **Monthly Sync**: Primeira sexta de cada mês
- **Architecture Review**: Conforme necessário
- **Hackathons**: Trimestrais

### Reconhecimento
Contribuidores são reconhecidos através de:
- Menção no CHANGELOG
- Badge de contribuidor
- Convite para eventos especiais
- Possibilidade de se tornar maintainer

## 📊 Métricas de Contribuição

### KPIs da Comunidade
- Tempo médio de resposta a PRs: <48h
- Tempo médio de resolução de issues: <7 dias
- Taxa de aprovação de PRs: >80%
- Satisfação dos contribuidores: >4.5/5

### Processo de Melhoria
- Review mensal das métricas
- Feedback dos contribuidores
- Ajustes no processo conforme necessário

---

## 🙏 Agradecimentos

Obrigado por contribuir para o Ecossistema Alquimista.AI! Sua contribuição ajuda a democratizar a automação inteligente e impactar positivamente empresas ao redor do mundo.

**Juntos, transformamos processos em oportunidades! 🚀**