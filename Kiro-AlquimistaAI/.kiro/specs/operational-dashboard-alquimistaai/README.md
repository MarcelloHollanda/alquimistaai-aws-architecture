# Painel Operacional AlquimistaAI

## Resumo Executivo

O **Painel Operacional AlquimistaAI** é um sistema dual que diferencia usuários internos da equipe AlquimistaAI de usuários clientes (tenants), fornecendo interfaces e funcionalidades específicas para cada tipo de usuário dentro do mesmo ecossistema de autenticação.

### Objetivos

1. **Dashboard do Cliente**: Interface para clientes visualizarem seus próprios dados, agentes contratados, integrações, uso e suporte
2. **Painel Operacional Interno**: Interface para equipe AlquimistaAI gerenciar todos os clientes, visualizar métricas globais, executar comandos operacionais e monitorar a plataforma

### Benefícios

- **Para Clientes**: Visibilidade completa de sua conta, uso e performance dos agentes
- **Para Equipe Interna**: Visão global da operação, capacidade de troubleshooting e gestão centralizada
- **Para o Negócio**: Melhor suporte aos clientes, decisões baseadas em dados, operação mais eficiente

---

## Arquitetura

### Stack Tecnológico

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
- **Backend**: API Gateway + Lambda (Node.js 20) + Aurora PostgreSQL + DynamoDB
- **Autenticação**: Amazon Cognito com grupos customizados
- **Cache**: ElastiCache Redis
- **Observabilidade**: CloudWatch + X-Ray

### Componentes Principais

1. **Autenticação Multi-Papel**: Cognito com 4 grupos (INTERNAL_ADMIN, INTERNAL_SUPPORT, TENANT_ADMIN, TENANT_USER)
2. **APIs Segregadas**: `/tenant/*` para clientes, `/internal/*` para equipe interna
3. **Modelo de Dados Multi-Tenant**: Isolamento completo de dados entre clientes
4. **Sistema de Comandos**: Execução assíncrona de operações administrativas
5. **Agregação de Métricas**: Job diário para consolidação de dados de uso

---

## Interfaces

### Dashboard do Cliente

Rotas disponíveis para clientes:

- `/app/dashboard` - Visão geral (KPIs, gráficos, status)
- `/app/dashboard/agents` - Agentes contratados
- `/app/dashboard/fibonacci` - SubNúcleos Fibonacci
- `/app/dashboard/integrations` - Integrações (e-mail, WhatsApp, CRM)
- `/app/dashboard/usage` - Métricas de uso detalhadas
- `/app/dashboard/support` - Incidentes e suporte

### Painel Operacional Interno

Rotas disponíveis para equipe interna:

- `/app/company` - Visão geral operacional (KPIs globais)
- `/app/company/tenants` - Lista de todos os clientes
- `/app/company/tenants/[id]` - Detalhes completos de um cliente
- `/app/company/agents` - Visão agregada dos 32 agentes
- `/app/company/integrations` - Mapa de integrações
- `/app/company/operations` - Console de comandos operacionais
- `/app/company/billing` - Visão financeira (MRR, ARR)

---

## Segurança

### Princípios

1. **Isolamento de Dados**: Clientes nunca acessam dados de outros clientes
2. **Validação em Camadas**: Frontend, middleware e backend
3. **Least Privilege**: Cada grupo tem apenas as permissões necessárias
4. **Audit Log**: Todas as ações operacionais são registradas
5. **Secrets Management**: Credenciais armazenadas no Secrets Manager

### Grupos e Permissões

| Grupo | Acesso Dashboard Cliente | Acesso Painel Interno | Acesso Billing |
|-------|-------------------------|----------------------|----------------|
| INTERNAL_ADMIN | ✅ (todos os tenants) | ✅ | ✅ |
| INTERNAL_SUPPORT | ✅ (todos os tenants) | ✅ | ❌ |
| TENANT_ADMIN | ✅ (próprio tenant) | ❌ | ❌ |
| TENANT_USER | ✅ (próprio tenant) | ❌ | ❌ |

---

## Estrutura da Spec

Esta spec está organizada nos seguintes documentos:

1. **[requirements.md](./requirements.md)**: Requisitos funcionais e não funcionais detalhados
2. **[design.md](./design.md)**: Arquitetura técnica, modelo de dados, APIs e componentes
3. **[tasks.md](./tasks.md)**: Plano de implementação com tarefas incrementais
4. **[INDEX.md](./INDEX.md)**: Índice navegável de toda a documentação

---

## Como Usar Esta Spec

### Para Desenvolvedores

1. Leia o [requirements.md](./requirements.md) para entender o que precisa ser construído
2. Estude o [design.md](./design.md) para entender como será construído
3. Siga o [tasks.md](./tasks.md) para implementar de forma incremental
4. Consulte o [INDEX.md](./INDEX.md) para navegação rápida

### Para Product Managers

1. Revise o [requirements.md](./requirements.md) para validar user stories
2. Consulte a matriz de permissões para entender controles de acesso
3. Revise os critérios de aceitação para cada requisito

### Para Arquitetos

1. Analise o [design.md](./design.md) para validar decisões arquiteturais
2. Revise o modelo de dados e estratégias de cache
3. Valide considerações de segurança e performance

---

## Fases de Implementação

### Fase 1 - Fundação (2-3 dias)
- Configurar grupos no Cognito
- Implementar middleware de autorização
- Criar modelo de dados (Aurora + DynamoDB)

### Fase 2 - Backend (5-7 dias)
- Implementar APIs do cliente (/tenant/*)
- Implementar APIs internas (/internal/*)
- Implementar sistema de comandos operacionais
- Implementar job de agregação de métricas

### Fase 3 - Frontend Cliente (4-5 dias)
- Implementar middleware de roteamento
- Criar layout e páginas do dashboard do cliente
- Integrar com APIs

### Fase 4 - Frontend Interno (5-6 dias)
- Criar layout e páginas do painel operacional
- Implementar console de operações
- Integrar com APIs internas

### Fase 5 - Qualidade (6-8 dias)
- Implementar cache Redis
- Adicionar responsividade
- Criar testes completos (unitários, integração, E2E)
- Criar documentação
- Testes de segurança e performance

### Fase 6 - Deploy (1-2 dias)
- Preparar deploy
- Executar em produção
- Validar e monitorar

**Total estimado**: 24-33 dias de desenvolvimento

---

## Status Atual

- [x] Requirements definidos
- [x] Design completo
- [x] Tasks planejadas
- [ ] Implementação iniciada
- [ ] Testes realizados
- [ ] Deploy em produção

---

## Próximos Passos

1. **Revisar e aprovar esta spec** com stakeholders
2. **Configurar ambiente de desenvolvimento** (Cognito, Aurora, DynamoDB)
3. **Iniciar Fase 1** (Fundação)
4. **Implementar incrementalmente** seguindo tasks.md
5. **Validar em cada fase** antes de prosseguir

---

## Contatos

- **Product Owner**: [Nome]
- **Tech Lead**: [Nome]
- **Arquiteto**: [Nome]

---

## Referências

- [Contexto do Projeto AlquimistaAI](../../.kiro/steering/contexto-projeto-alquimista.md)
- [Blueprint Comercial e Assinaturas](../../.kiro/steering/blueprint-comercial-assinaturas.md)
- [Documentação do Cognito](../../docs/auth/)
- [Documentação de APIs](../../docs/ecosystem/API-DOCUMENTATION.md)
