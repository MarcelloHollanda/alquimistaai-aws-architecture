---
inclusion: always
---

# CONTEXTO DO PROJETO ALQUIMISTA.AI

## Informações do Repositório

- **Nome**: AlquimistaAI AWS Architecture
- **Origem**: github.com/MarcelloHollanda/alquimistaai-aws-architecture
- **Objetivo**: Hospedar na AWS (us-east-1) o ecossistema da Alquimista.AI

## Componentes Principais

### 1. Fibonacci Orquestrador B2B
Sistema de orquestração principal para gestão de leads e automações B2B.

### 2. Nigredo — Núcleo de Prospecção
Sistema dedicado à prospecção e qualificação de leads.

### 3. Demais Microserviços/Agentes Serverless
Agentes especializados para diferentes funções do ecossistema.

---

## PADRÕES OBRIGATÓRIOS (JÁ ADOTADOS)

### Infraestrutura AWS

- **Região AWS**: `us-east-1` (obrigatório)
- **Backend**: API Gateway HTTP + Lambda (Node.js 20)
- **Banco Relacional**: Aurora Serverless v2 (PostgreSQL, Multi-AZ)
- **Frontend**: S3 + CloudFront (sites estáticos / SPAs)
- **IaC**: CDK (AWS Cloud Development Kit) com TypeScript
- **Segredos**: AWS Secrets Manager em paths `/alquimista/<env>/<serviço>/*`
- **Ambientes**: `dev` e `prod` com recursos separados

### Estrutura de Código

- **Lambda**: Código em `lambda/` organizado por serviço
- **Frontend**: Next.js com TypeScript em `frontend/`
- **Infraestrutura**: CDK stacks em `lib/`
- **Database**: Migrations em `database/migrations/`

---

## REGRAS GERAIS PARA EDIÇÃO

### 1. NUNCA Quebrar o Existente

**NUNCA sobrescrever ou apagar código/infra existentes sem antes:**
- Ler o arquivo completo
- Entender o padrão atual
- Adaptar-se ao padrão existente
- Verificar dependências

### 2. Criação de Novos Recursos CDK

Sempre que criar novos recursos CDK:
- Criar stacks em `lib/<nome>-stack.ts`
- Seguir padrão dos stacks existentes (fibonacci-stack, nigredo-stack, alquimista-stack)
- Instanciar no `bin/app.ts`
- Usar tags consistentes (Project, Environment, Component)
- Exportar outputs importantes

### 3. Desenvolvimento de Lambda

Sempre que mexer em Lambda:
- Código em `lambda/<serviço>/`
- Manter padrão de handlers existentes
- Usar módulos compartilhados em `lambda/shared/`
- Implementar logging estruturado
- Adicionar tratamento de erros

### 4. Gerenciamento de Segredos

Qualquer novo segredo:
- Criar no AWS Secrets Manager sob `/alquimista/<env>/<serviço>/*`
- Usar `aws_secretsmanager_secret` no CDK
- Injetar na Lambda via `environment.variables`
- Documentar no README do serviço

---

## NÚCLEO NIGREDO (IMPORTANTE)

### Backend Nigredo API

**Infraestrutura:**
- Lambda Node.js 20 + API Gateway HTTP
- Schema dedicado no Aurora: `nigredo`
- Stack CDK: `lib/nigredo-stack.ts`

**Rotas Implementadas:**
- `GET /api/nigredo/health` - Health check
- `GET /api/nigredo/pipeline/status` - Status do pipeline
- `GET /api/nigredo/pipeline/metrics` - Métricas do pipeline
- `GET /api/nigredo/leads` - Listar leads
- `GET /api/nigredo/leads/{id}` - Detalhes do lead
- `GET /api/nigredo/leads/{id}/timeline` - Timeline do lead
- `GET /api/nigredo/conversations` - Listar conversas
- `GET /api/nigredo/conversations/{id}` - Detalhes da conversa
- `GET /api/nigredo/meetings` - Listar reuniões
- `POST /api/nigredo/meetings` - Criar reunião
- `GET /api/nigredo/reports/summary` - Relatório resumido

### Frontend Nigredo

**Tecnologia:**
- Next.js (TypeScript) com build estático
- Deploy: S3 + CloudFront
- Stack CDK: `lib/nigredo-frontend-stack.ts`

**Variáveis de Ambiente:**
- `NEXT_PUBLIC_NIGREDO_API_BASE_URL` - URL da API Nigredo
- `NEXT_PUBLIC_AWS_REGION` - Região AWS (us-east-1)

### Integração Nigredo ↔ Fibonacci

**Backend Nigredo envia eventos para:**
- `POST /public/nigredo-event` na API do Fibonacci

**Credenciais Necessárias (Secrets Manager):**
- `FIBONACCI_API_BASE_URL` - URL da API Fibonacci
- `FIBONACCI_NIGREDO_TOKEN` - Token de autenticação

**Path no Secrets Manager:**
- `/alquimista/<env>/nigredo/fibonacci-integration`

### Identidade Visual do Nigredo

**IMPORTANTE:**
- NÃO alterar cores, fontes, logo e layout geral
- Qualquer mudança é somente estrutural (código, API, infra)
- Manter consistência com design existente

---

## TAREFAS COMUNS E PADRÕES

### Criar Novo Módulo CDK

```typescript
// lib/novo-servico-stack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class NovoServicoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const env = this.node.tryGetContext('env') || 'dev';
    
    // Implementação aqui
    
    // Tags obrigatórias
    cdk.Tags.of(this).add('Project', 'Alquimista');
    cdk.Tags.of(this).add('Environment', env);
    cdk.Tags.of(this).add('Component', 'NomeDoComponente');
  }
}
```

### Adicionar Rota na API Fibonacci

1. Editar `lambda/fibonacci/<handler>.ts`
2. Seguir padrão de roteamento existente
3. Adicionar validação de entrada
4. Implementar logging estruturado
5. Retornar respostas padronizadas

### Criar Nova Lambda

1. Criar diretório em `lambda/<serviço>/`
2. Implementar handlers
3. Usar módulos compartilhados (`lambda/shared/`)
4. Adicionar ao stack CDK correspondente
5. Configurar variáveis de ambiente
6. Documentar no README

### Adicionar Migration de Banco

1. Criar arquivo em `database/migrations/`
2. Seguir numeração sequencial (ex: `008_descricao.sql`)
3. Incluir rollback quando aplicável
4. Documentar mudanças no README
5. Testar em ambiente dev primeiro

---

## ESTRUTURA DE DIRETÓRIOS

```
alquimistaai-aws-architecture/
├── bin/
│   └── app.ts                    # Entry point do CDK
├── lib/
│   ├── fibonacci-stack.ts        # Stack do Fibonacci
│   ├── nigredo-stack.ts          # Stack do Nigredo
│   ├── alquimista-stack.ts       # Stack da plataforma
│   ├── cognito-stack.ts          # Stack de autenticação
│   └── dashboards/               # Dashboards CloudWatch
├── lambda/
│   ├── fibonacci/                # Lambdas do Fibonacci
│   ├── nigredo/                  # Lambdas do Nigredo
│   ├── platform/                 # Lambdas da plataforma
│   ├── agents/                   # Agentes especializados
│   └── shared/                   # Código compartilhado
├── frontend/
│   ├── src/
│   │   ├── app/                  # Rotas Next.js
│   │   ├── components/           # Componentes React
│   │   ├── lib/                  # Utilitários
│   │   └── hooks/                # React hooks
│   └── public/                   # Assets estáticos
├── database/
│   ├── migrations/               # Migrations SQL
│   └── seeds/                    # Dados iniciais
├── docs/                         # Documentação
└── scripts/                      # Scripts de automação
```

---

## COMANDOS IMPORTANTES

### CDK

```bash
# Compilar TypeScript
npm run build

# Sintetizar template
cdk synth <StackName> --context env=dev

# Deploy
cdk deploy <StackName> --context env=dev

# Listar stacks
cdk list

# Destruir stack
cdk destroy <StackName> --context env=dev
```

### Frontend

```bash
# Desenvolvimento local
cd frontend
npm run dev

# Build de produção
npm run build

# Deploy para S3
npm run deploy
```

### Database

```bash
# Executar migrations
psql -h <host> -U <user> -d <database> -f database/migrations/<file>.sql
```

---

## CHECKLIST ANTES DE FAZER MUDANÇAS

- [ ] Li e entendi o código existente
- [ ] Identifiquei o padrão atual
- [ ] Verifiquei dependências
- [ ] Testei em ambiente dev
- [ ] Documentei as mudanças
- [ ] Atualizei README se necessário
- [ ] Não quebrei funcionalidades existentes
- [ ] Segui os padrões de código do projeto

---

## OBSERVAÇÕES IMPORTANTES

1. **Compatibilidade**: Sempre manter compatibilidade com dev e prod
2. **Documentação**: Documentar mudanças significativas
3. **Testes**: Testar em dev antes de prod
4. **Segurança**: Nunca commitar credenciais ou segredos
5. **Performance**: Considerar impacto de mudanças em performance
6. **Custos**: Estar ciente dos custos AWS das mudanças

---

## PRÓXIMOS PASSOS

Quando receber instruções específicas, sempre:

1. Ler o contexto do arquivo
2. Adaptar ao padrão existente
3. Evitar mudanças desnecessárias
4. Manter compatibilidade com dev e prod
5. Documentar adequadamente

**Aguardando instruções específicas para:**
- Criar módulos CDK
- Adicionar rotas de API
- Ajustar frontend
- Modificar infraestrutura
- Implementar novas funcionalidades
