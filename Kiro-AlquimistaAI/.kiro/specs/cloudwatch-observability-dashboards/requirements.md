# Requirements Document

## Introdução

Este documento define os requisitos para implementação de dashboards de observabilidade no CloudWatch para os ambientes dev e prod do sistema AlquimistaAI. Os dashboards fornecerão visibilidade em tempo real sobre o estado dos serviços críticos (Fibonacci, Nigredo, Aurora, API Gateway) e permitirão resposta rápida a incidentes.

## Glossário

- **Sistema**: Ecossistema AlquimistaAI hospedado na AWS
- **Dashboard**: Painel visual do CloudWatch que consolida métricas de múltiplos recursos
- **Ambiente**: Contexto de execução (dev ou prod) com recursos AWS separados
- **Widget**: Componente visual individual dentro de um dashboard (gráfico, número, etc.)
- **Fibonacci**: Sistema de orquestração principal B2B
- **Nigredo**: Núcleo de prospecção e qualificação de leads
- **Aurora**: Cluster de banco de dados PostgreSQL serverless v2
- **API Gateway**: Serviço HTTP API que expõe as APIs REST
- **Lambda**: Funções serverless que processam requisições
- **Métrica**: Dado quantitativo coletado sobre um recurso AWS

## Requirements

### Requirement 1

**User Story:** Como operador DevOps, quero visualizar rapidamente o estado geral do ambiente dev, para identificar problemas antes que afetem produção

#### Acceptance Criteria

1. WHEN o Sistema é implantado no ambiente dev, THE Sistema SHALL criar um dashboard chamado "AlquimistaAI-Dev-Overview" no CloudWatch
2. THE Dashboard SHALL incluir widgets que mostram latência p50, p90 e p99 do API Gateway do Fibonacci
3. THE Dashboard SHALL incluir widgets que mostram contagem de erros 4xx e 5xx do API Gateway do Fibonacci
4. THE Dashboard SHALL incluir widgets que mostram throughput (requisições por minuto) do API Gateway do Fibonacci
5. THE Dashboard SHALL incluir widgets que mostram invocações, erros e duração das Lambdas principais do Fibonacci

### Requirement 2

**User Story:** Como operador DevOps, quero visualizar rapidamente o estado geral do ambiente prod, para responder a incidentes de forma eficaz

#### Acceptance Criteria

1. WHEN o Sistema é implantado no ambiente prod, THE Sistema SHALL criar um dashboard chamado "AlquimistaAI-Prod-Overview" no CloudWatch
2. THE Dashboard SHALL incluir widgets que mostram latência p50, p90 e p99 do API Gateway do Fibonacci
3. THE Dashboard SHALL incluir widgets que mostram contagem de erros 4xx e 5xx do API Gateway do Fibonacci
4. THE Dashboard SHALL incluir widgets que mostram throughput (requisições por minuto) do API Gateway do Fibonacci
5. THE Dashboard SHALL incluir widgets que mostram invocações, erros e duração das Lambdas principais do Fibonacci

### Requirement 3

**User Story:** Como operador DevOps, quero monitorar a saúde do banco de dados Aurora, para prevenir problemas de performance e capacidade

#### Acceptance Criteria

1. THE Dashboard SHALL incluir widget que mostra CPUUtilization do cluster Aurora
2. THE Dashboard SHALL incluir widget que mostra DatabaseConnections do cluster Aurora
3. THE Dashboard SHALL incluir widget que mostra FreeStorageSpace do cluster Aurora
4. WHEN o ambiente é dev, THE Dashboard SHALL mostrar métricas do cluster Aurora de dev
5. WHEN o ambiente é prod, THE Dashboard SHALL mostrar métricas do cluster Aurora de prod

### Requirement 4

**User Story:** Como operador DevOps, quero monitorar as Lambdas do Nigredo, para garantir que o núcleo de prospecção está operando corretamente

#### Acceptance Criteria

1. THE Dashboard SHALL incluir widgets que mostram invocações por minuto das Lambdas do Nigredo
2. THE Dashboard SHALL incluir widgets que mostram taxa de erro das Lambdas do Nigredo
3. THE Dashboard SHALL incluir widgets que mostram duração média e p95 das Lambdas do Nigredo
4. WHEN o ambiente é dev, THE Dashboard SHALL mostrar métricas das Lambdas do Nigredo em dev
5. WHEN o ambiente é prod, THE Dashboard SHALL mostrar métricas das Lambdas do Nigredo em prod

### Requirement 5

**User Story:** Como operador DevOps, quero distinguir facilmente entre dashboards de dev e prod, para evitar confusão durante investigação de incidentes

#### Acceptance Criteria

1. THE Dashboard SHALL incluir o nome do ambiente no título do dashboard
2. THE Dashboard SHALL incluir tags com chave "Environment" e valor "dev" ou "prod"
3. THE Dashboard SHALL incluir tags com chave "Project" e valor "AlquimistaAI"
4. THE Widget SHALL incluir prefixo "[DEV]" ou "[PROD]" no título quando aplicável
5. THE Dashboard SHALL usar nomes previsíveis sem IDs dinâmicos

### Requirement 6

**User Story:** Como desenvolvedor de infraestrutura, quero implementar os dashboards via CDK TypeScript, para manter consistência com a infraestrutura existente

#### Acceptance Criteria

1. THE Sistema SHALL criar uma nova stack CDK chamada "ObservabilityDashboardStack"
2. THE Stack SHALL receber referências aos recursos principais via props (APIs, Lambdas, Aurora)
3. THE Stack SHALL ser instanciada no arquivo bin/app.ts
4. THE Stack SHALL criar dashboards para ambos os ambientes (dev e prod)
5. THE Código SHALL incluir comentários em português explicando a intenção dos widgets

### Requirement 7

**User Story:** Como operador DevOps, quero documentação clara sobre os dashboards, para saber onde procurar informações durante incidentes

#### Acceptance Criteria

1. THE Sistema SHALL atualizar o arquivo docs/OBSERVABILITY-GUARDRAILS-AWS.md com seção sobre dashboards
2. THE Documentação SHALL explicar quais métricas cada dashboard apresenta
3. THE Documentação SHALL explicar como acessar os dashboards no console AWS
4. THE Sistema SHALL atualizar o arquivo docs/INDEX-OPERATIONS-AWS.md com link para dashboards
5. THE Documentação SHALL incluir descrição de "o que olhar primeiro" em caso de incidente

### Requirement 8

**User Story:** Como operador DevOps, quero que os dashboards sejam criados automaticamente durante o deploy, para não precisar configurá-los manualmente

#### Acceptance Criteria

1. WHEN o comando "cdk synth" é executado, THE Sistema SHALL sintetizar a stack de dashboards sem erros
2. WHEN o comando "cdk deploy" é executado, THE Sistema SHALL criar os dashboards no CloudWatch
3. WHEN os dashboards são criados, THE Dashboards SHALL aparecer no console CloudWatch
4. WHEN os dashboards são criados, THE Dashboards SHALL mostrar métricas populadas (não vazias)
5. THE Stack SHALL não alterar arquitetura das stacks existentes (Fibonacci/Nigredo/Alquimista/Security)
