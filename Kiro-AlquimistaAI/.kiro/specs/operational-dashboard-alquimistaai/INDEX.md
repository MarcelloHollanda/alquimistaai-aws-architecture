# Índice — Painel Operacional AlquimistaAI

## 📋 Documentos Principais

- **[README.md](./README.md)** - Resumo executivo e visão geral da spec
- **[requirements.md](./requirements.md)** - Requisitos funcionais e não funcionais
- **[design.md](./design.md)** - Arquitetura técnica e decisões de design
- **[tasks.md](./tasks.md)** - Plano de implementação com tarefas detalhadas

---

## 🎯 Requisitos (requirements.md)

### Requisitos Funcionais

1. **[Requisito 1: Diferenciação de Usuários](./requirements.md#requisito-1-diferenciação-de-usuários)**
   - Redirecionamento automático baseado em grupos
   - Extração de claims do JWT
   - Validação de permissões

2. **[Requisito 2: Autenticação e Autorização](./requirements.md#requisito-2-autenticação-e-autorização)**
   - Cognito como fonte única
   - 4 grupos de usuários
   - Validação em múltiplas camadas

3. **[Requisito 3: Dashboard do Cliente](./requirements.md#requisito-3-dashboard-do-cliente)**
   - Visão geral, agentes, Fibonacci
   - Integrações, uso, suporte
   - Dados isolados por tenant

4. **[Requisito 4: Painel Operacional Interno](./requirements.md#requisito-4-painel-operacional-interno)**
   - Visão global de todos os clientes
   - Gestão de tenants
   - Console de operações

5. **[Requisito 5: APIs do Cliente](./requirements.md#requisito-5-apis-do-cliente)**
   - GET /tenant/me
   - GET /tenant/agents
   - GET /tenant/integrations
   - GET /tenant/usage
   - GET /tenant/incidents

6. **[Requisito 6: APIs Internas](./requirements.md#requisito-6-apis-internas)**
   - GET /internal/tenants
   - GET /internal/tenants/{id}
   - GET /internal/usage/overview
   - GET /internal/billing/overview
   - POST /internal/operations/commands

7. **[Requisito 7: Modelo de Dados](./requirements.md#requisito-7-modelo-de-dados)**
   - Aurora: tenants, tenant_users, tenant_agents, etc.
   - DynamoDB: operational_commands

8. **[Requisito 8: Comandos Operacionais](./requirements.md#requisito-8-comandos-operacionais)**
   - Criação e execução assíncrona
   - Tipos: REPROCESS_QUEUE, RESET_TOKEN, etc.
   - Histórico e status

9. **[Requisito 9: Métricas e Uso](./requirements.md#requisito-9-métricas-e-uso)**
   - Agregação diária
   - Gráficos e visualizações
   - Filtros por período

10. **[Requisito 10: Identidade Visual](./requirements.md#requisito-10-identidade-visual)**
    - Consistência com AlquimistaAI
    - Reutilização de componentes

11. **[Requisito 11: Segurança e Isolamento](./requirements.md#requisito-11-segurança-e-isolamento)**
    - Validação de tenant_id
    - Prevenção de SQL injection
    - Audit log

12. **[Requisito 12: Performance e Escalabilidade](./requirements.md#requisito-12-performance-e-escalabilidade)**
    - Tempo de resposta < 2s
    - Cache Redis
    - Paginação

13. **[Requisito 13: Responsividade](./requirements.md#requisito-13-responsividade)**
    - Suporte mobile (min 320px)
    - Menu hambúrguer
    - Touch-friendly

14. **[Requisito 14: Tratamento de Erros](./requirements.md#requisito-14-tratamento-de-erros)**
    - Mensagens claras
    - Toast notifications
    - Modals para ações

15. **[Requisito 15: Documentação e Suporte](./requirements.md#requisito-15-documentação-e-suporte)**
    - Tooltips
    - Guias de uso
    - Troubleshooting

### Requisitos Não Funcionais

- **[RNF-1: Compatibilidade](./requirements.md#rnf-1-compatibilidade)**
- **[RNF-2: Disponibilidade](./requirements.md#rnf-2-disponibilidade)**
- **[RNF-3: Backup](./requirements.md#rnf-3-backup)**
- **[RNF-4: Auditoria](./requirements.md#rnf-4-auditoria)**
- **[RNF-5: Conformidade](./requirements.md#rnf-5-conformidade)**
- **[RNF-6: Manutenibilidade](./requirements.md#rnf-6-manutenibilidade)**

### Outros

- **[Matriz de Permissões](./requirements.md#matriz-de-permissões)**
- **[Priorização (Must/Should/Could Have)](./requirements.md#priorização)**
- **[Riscos e Mitigações](./requirements.md#riscos-e-mitigações)**

---

## 🏗️ Design (design.md)

### Arquitetura

- **[Visão Geral](./design.md#visão-geral)**
- **[Princípios de Design](./design.md#princípios-de-design)**
- **[Arquitetura de Alto Nível](./design.md#arquitetura-de-alto-nível)** (diagrama)
- **[Fluxo de Autenticação e Roteamento](./design.md#fluxo-de-autenticação-e-roteamento)**

### Modelo de Dados

- **[Aurora PostgreSQL](./design.md#aurora-postgresql-schema-alquimista_platform)**
  - tenant_users
  - tenant_agents
  - tenant_integrations
  - tenant_usage_daily
  - operational_events
- **[DynamoDB](./design.md#dynamodb)**
  - operational_commands

### APIs

- **[APIs do Cliente (/tenant/*)](./design.md#apis-do-cliente-tenant)**
  - GET /tenant/me
  - GET /tenant/agents
  - GET /tenant/integrations
  - GET /tenant/usage
  - GET /tenant/incidents

- **[APIs Internas (/internal/*)](./design.md#apis-internas-internal)**
  - GET /internal/tenants
  - GET /internal/tenants/{id}
  - GET /internal/tenants/{id}/agents
  - GET /internal/usage/overview
  - GET /internal/billing/overview
  - POST /internal/operations/commands
  - GET /internal/operations/commands

### Frontend

- **[Estrutura de Diretórios](./design.md#estrutura-de-diretórios)**
- **[Componentes Principais](./design.md#componentes-principais)**
  - Dashboard do Cliente
  - Painel Operacional Interno
  - Lista de Tenants
  - Console de Operações

### Backend

- **[Estratégia de Autorização](./design.md#estratégia-de-autorização)**
- **[Middleware de Autorização](./design.md#middleware-de-autorização-backend)**
- **[Exemplo de Handler](./design.md#exemplo-de-handler-com-autorização)**
- **[Agregação de Métricas](./design.md#agregação-de-métricas)**
- **[Processamento de Comandos](./design.md#processamento-de-comandos-operacionais)**
- **[Cache Strategy](./design.md#cache-strategy)**

### Considerações

- **[Performance](./design.md#considerações-de-performance)**
- **[Segurança](./design.md#considerações-de-segurança)**

---

## ✅ Tarefas (tasks.md)

### Fase 1 - Fundação

- **[Task 1: Configurar Grupos e Papéis no Cognito](./tasks.md#tarefas)**
- **[Task 2: Implementar Middleware de Autorização](./tasks.md#tarefas)**
- **[Task 3: Criar Modelo de Dados](./tasks.md#tarefas)**
  - 3.1 Aurora (migration)
  - 3.2 DynamoDB

### Fase 2 - Backend

- **[Task 4: Implementar APIs do Cliente](./tasks.md#tarefas)**
  - 4.1 GET /tenant/me
  - 4.2 GET /tenant/agents
  - 4.3 GET /tenant/integrations
  - 4.4 GET /tenant/usage
  - 4.5 GET /tenant/incidents

- **[Task 5: Implementar APIs Internas](./tasks.md#tarefas)**
  - 5.1 GET /internal/tenants
  - 5.2 GET /internal/tenants/{id}
  - 5.3 GET /internal/tenants/{id}/agents
  - 5.4 GET /internal/usage/overview
  - 5.5 GET /internal/billing/overview

- **[Task 6: Implementar Sistema de Comandos](./tasks.md#tarefas)**
  - 6.1 POST /internal/operations/commands
  - 6.2 GET /internal/operations/commands
  - 6.3 Processador de comandos

- **[Task 7: Implementar Job de Agregação](./tasks.md#tarefas)**
- **[Task 8: Configurar Rotas no API Gateway](./tasks.md#tarefas)**

### Fase 3 - Frontend Cliente

- **[Task 9: Implementar Middleware de Roteamento](./tasks.md#tarefas)**
- **[Task 10: Implementar Utilitários de Autenticação](./tasks.md#tarefas)**
- **[Task 11: Implementar Clients HTTP](./tasks.md#tarefas)**
  - 11.1 tenant-client
  - 11.2 internal-client

- **[Task 12: Implementar Dashboard do Cliente](./tasks.md#tarefas)**
  - 12.1 Layout
  - 12.2 Visão geral
  - 12.3 Agentes
  - 12.4 Fibonacci
  - 12.5 Integrações
  - 12.6 Uso
  - 12.7 Suporte

### Fase 4 - Frontend Interno

- **[Task 13: Implementar Painel Operacional](./tasks.md#tarefas)**
  - 13.1 Layout
  - 13.2 Visão geral operacional
  - 13.3 Lista de tenants
  - 13.4 Detalhes do tenant
  - 13.5 Visão de agentes
  - 13.6 Mapa de integrações
  - 13.7 Console de operações
  - 13.8 Visão financeira

- **[Task 14: Implementar Componentes Compartilhados](./tasks.md#tarefas)**
  - 14.1 Métricas
  - 14.2 Tabela de dados
  - 14.3 Gráficos (opcional)

- **[Task 15: Implementar Stores de Estado](./tasks.md#tarefas)**

### Fase 5 - Qualidade

- **[Task 16: Implementar Cache Redis](./tasks.md#tarefas)**
- **[Task 17: Adicionar Responsividade](./tasks.md#tarefas)**
- **[Task 18: Implementar Tratamento de Erros](./tasks.md#tarefas)**
- **[Task 19: Adicionar Logging e Observabilidade](./tasks.md#tarefas)**
- **[Task 20: Implementar Testes](./tasks.md#tarefas)** (opcional)
  - 20.1 Testes unitários
  - 20.2 Testes de integração
  - 20.3 Testes E2E
- **[Task 21: Criar Documentação](./tasks.md#tarefas)**
- **[Task 22: Realizar Testes de Segurança](./tasks.md#tarefas)**
- **[Task 23: Realizar Testes de Performance](./tasks.md#tarefas)**

### Fase 6 - Deploy

- **[Task 24: Preparar Deploy](./tasks.md#tarefas)**
- **[Task 25: Deploy em Produção](./tasks.md#tarefas)**

---

## 📊 Estimativas

- **Fase 1 - Fundação**: 2-3 dias
- **Fase 2 - Backend**: 5-7 dias
- **Fase 3 - Frontend Cliente**: 4-5 dias
- **Fase 4 - Frontend Interno**: 5-6 dias
- **Fase 5 - Qualidade**: 6-8 dias
- **Fase 6 - Deploy**: 1-2 dias

**Total**: 24-33 dias de desenvolvimento

---

## 🔗 Links Úteis

### Documentação Interna

- [Contexto do Projeto](../../.kiro/steering/contexto-projeto-alquimista.md)
- [Blueprint Comercial](../../.kiro/steering/blueprint-comercial-assinaturas.md)
- [Documentação de Auth](../../docs/auth/)
- [Documentação de APIs](../../docs/ecosystem/API-DOCUMENTATION.md)

### Specs Relacionadas

- [Cognito Auth Complete System](../cognito-auth-complete-system/)
- [Checkout Payment System](../checkout-payment-system/)
- [Frontend Implementation](../frontend-implementation/)

### Recursos AWS

- [Amazon Cognito User Pools](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html)
- [Aurora PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.AuroraPostgreSQL.html)
- [DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html)
- [API Gateway](https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html)

---

## 📝 Glossário Rápido

- **Tenant**: Empresa cliente da AlquimistaAI
- **Usuário Interno**: Membro da equipe AlquimistaAI
- **Dashboard do Cliente**: Interface para usuários clientes
- **Painel Operacional**: Interface para usuários internos
- **MRR**: Monthly Recurring Revenue
- **KPI**: Key Performance Indicator
- **Comando Operacional**: Ação administrativa executada pela equipe interna

---

## 🎯 Status da Spec

- [x] Requirements completos
- [x] Design completo
- [x] Tasks planejadas
- [x] README criado
- [x] INDEX criado
- [ ] Aprovação de stakeholders
- [ ] Implementação iniciada

---

**Última atualização**: 2025-11-18
