# Plano de Implementação — Painel Operacional AlquimistaAI

## Visão Geral

Este documento define as tarefas de implementação do Painel Operacional AlquimistaAI, organizadas em fases incrementais que permitem desenvolvimento e validação progressivos.

---

## Tarefas

- [x] 1. Configurar Grupos e Papéis no Cognito




  - Criar grupos `INTERNAL_ADMIN`, `INTERNAL_SUPPORT`, `TENANT_ADMIN`, `TENANT_USER` no Cognito User Pool
  - Configurar custom attribute `custom:tenant_id` no User Pool
  - Adicionar usuários de teste em cada grupo
  - Documentar processo de atribuição de grupos
  - _Requisitos: 1.1, 2.1, 2.2_

- [x] 2. Implementar Middleware de Autorização (Backend)


  - Criar `lambda/shared/authorization-middleware.ts` com funções de extração de contexto
  - Implementar `extractAuthContext()` para extrair claims do JWT
  - Implementar `requireInternal()` para validar acesso interno
  - Implementar `requireTenantAccess()` para validar acesso por tenant
  - Adicionar testes unitários para middleware
  - _Requisitos: 2.3, 2.4, 2.5, 11.1_

- [x] 3. Criar Modelo de Dados (Aurora)

- [x] 3.1 Criar migration para tabelas de tenant




  - Criar migration `015_create_operational_dashboard_tables.sql`
  - Implementar tabela `tenant_users` com relacionamento ao Cognito
  - Implementar tabela `tenant_agents` para rastreamento de agentes por tenant
  - Implementar tabela `tenant_integrations` para integrações por tenant
  - Implementar tabela `tenant_usage_daily` para métricas agregadas
  - Implementar tabela `operational_events` para audit log
  - Adicionar índices apropriados em todas as tabelas
  - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_


- [x] 3.2 Criar tabela DynamoDB para comandos operacionais




  - Definir schema da tabela `operational_commands` no CDK
  - Configurar partition key `command_id` e sort key `created_at`
  - Criar GSI `tenant_id-created_at-index`
  - Criar GSI `status-created_at-index`
  - Configurar TTL para auto-delete após 90 dias
  - Habilitar DynamoDB Streams para processamento assíncrono
  - _Requisitos: 7.7, 8.2, 8.3_


- [x] 4. Implementar APIs do Cliente (/tenant/*)

- [x] 4.1 Implementar GET /tenant/me


  - Criar handler `lambda/platform/get-tenant-me.ts`
  - Implementar query para buscar dados do tenant com limites e uso
  - Aplicar middleware de autorização
  - Adicionar validação de tenant_id
  - Retornar dados formatados conforme design
  - _Requisitos: 5.1, 6.1_

- [x] 4.2 Implementar GET /tenant/agents

  - Criar handler `lambda/platform/get-tenant-agents.ts`
  - Implementar query para buscar agentes do tenant com métricas
  - Suportar filtro por status (active, inactive, all)
  - Aplicar middleware de autorização
  - Retornar lista de agentes com estatísticas de uso
  - _Requisitos: 5.2, 6.2_

- [x] 4.3 Implementar GET /tenant/integrations

  - Criar handler `lambda/platform/get-tenant-integrations.ts`
  - Implementar query para buscar integrações do tenant
  - Ocultar credenciais sensíveis (apenas status e metadata)
  - Aplicar middleware de autorização
  - Retornar lista de integrações com status
  - _Requisitos: 5.3, 6.3_

- [x] 4.4 Implementar GET /tenant/usage

  - Criar handler `lambda/platform/get-tenant-usage.ts`
  - Implementar query agregada de métricas por período
  - Suportar filtros por período (7d, 30d, 90d) e agent_id
  - Calcular summary e daily_data
  - Aplicar middleware de autorização
  - Retornar dados formatados para gráficos
  - _Requisitos: 5.4, 6.4, 9.1, 9.2, 9.3, 9.4_

- [x] 4.5 Implementar GET /tenant/incidents


  - Criar handler `lambda/platform/get-tenant-incidents.ts`
  - Implementar query para buscar incidentes do tenant
  - Suportar paginação (limit, offset)
  - Aplicar middleware de autorização
  - Retornar lista de incidentes com total
  - _Requisitos: 5.5, 6.5_

- [x] 5. Implementar APIs Internas (/internal/*)








- [x] 5.1 Implementar GET /internal/tenants


  - Criar handler `lambda/internal/list-tenants.ts`
  - Implementar query com filtros (status, plan, segment, search)
  - Suportar paginação e ordenação
  - Aplicar middleware requireInternal()
  - Implementar cache Redis (5 min TTL)
  - Retornar lista de tenants com métricas agregadas
  - _Requisitos: 6.1, 6.2, 12.2_

- [x] 5.2 Implementar GET /internal/tenants/{id}

  - Criar handler `lambda/internal/get-tenant-detail.ts`
  - Implementar queries para buscar dados completos do tenant
  - Buscar usuários, agentes, integrações, uso e incidentes
  - Aplicar middleware requireInternal()
  - Retornar objeto completo conforme design
  - _Requisitos: 6.2, 6.3_

- [x] 5.3 Implementar GET /internal/tenants/{id}/agents

  - Criar handler `lambda/internal/get-tenant-agents.ts`
  - Implementar query para buscar agentes com configurações
  - Incluir estatísticas detalhadas de uso
  - Aplicar middleware requireInternal()
  - Retornar lista de agentes com opções de gerenciamento
  - _Requisitos: 6.3_

- [x] 5.4 Implementar GET /internal/usage/overview

  - Criar handler `lambda/internal/get-usage-overview.ts`
  - Implementar queries agregadas para métricas globais
  - Calcular top tenants e top agents
  - Gerar daily trends
  - Aplicar middleware requireInternal()
  - Implementar cache Redis (10 min TTL)
  - Retornar visão global de uso
  - _Requisitos: 6.4, 9.1, 9.2, 12.2_

- [x] 5.5 Implementar GET /internal/billing/overview

  - Criar handler `lambda/internal/get-billing-overview.ts`
  - Implementar queries para cálculo de MRR, ARR
  - Agregar por plano e segmento
  - Gerar revenue trend
  - Aplicar middleware requireInternal() com validação INTERNAL_ADMIN
  - Implementar cache Redis (15 min TTL)
  - Retornar visão financeira global
  - _Requisitos: 6.5_

-

- [x] 6. Implementar Sistema de Comandos Operacionais






- [x] 6.1 Implementar POST /internal/operations/commands


  - Criar handler `lambda/internal/create-operational-command.ts`
  - Validar command_type e parameters
  - Criar registro no DynamoDB com status PENDING
  - Aplicar middleware requireInternal()
  - Registrar evento em operational_events
  - Retornar command_id e status
  - _Requisitos: 6.6, 8.1, 8.2, 8.3_

- [x] 6.2 Implementar GET /internal/operations/commands

  - Criar handler `lambda/internal/list-operational-commands.ts`
  - Implementar query no DynamoDB com filtros
  - Suportar filtros por status, command_type, tenant_id
  - Suportar paginação
  - Aplicar middleware requireInternal()
  - Retornar lista de comandos com detalhes
  - _Requisitos: 6.7, 8.7_

- [x] 6.3 Implementar processador de comandos

  - Criar handler `lambda/internal/process-operational-command.ts`
  - Configurar trigger via DynamoDB Streams
  - Implementar lógica para cada tipo de comando
  - Atualizar status do comando (RUNNING, SUCCESS, ERROR)
  - Registrar output e error_message
  - Registrar evento em operational_events
  - _Requisitos: 8.4, 8.5, 8.6_

-


- [x] 7. Implementar Job de Agregação de Métricas


  - Criar handler `lambda/internal/aggregate-daily-metrics.ts`
  - Implementar query de agregação de agent_requests
  - Inserir/atualizar registros em tenant_usage_daily
  - Configurar EventBridge Rule para execução diária (2 AM UTC)
  - Adicionar logging estruturado
  - Implementar tratamento de erros 
e retry
  - _Requisitos: 9.1, 9.2, 9.3, 9.4_

- [x] 8. Configurar Rotas no API Gateway




















  - Adicionar rotas /tenant/* no API Gateway
  - Adicionar rotas /internal/* no API Gateway
  - Configurar authorizer Cognito em todas as rotas
  - Configurar CORS apropriadamente
  - Configurar throttling por rota
  - Documentar endpoints no README
  - _Requisitos: 5.1-5.5, 6.1-6.7_


- [x] 9. Implementar Middleware de Roteamento (Frontend)




  - Criar/atualizar `frontend/middleware.ts`
  - Implementar extração de grupos do token JWT
  - Implementar lógica de redirecionamento baseada em grupos
  - Proteger rotas /app/company/* para usuários internos
  - Redirecionar usuários após login para interface apropriada
  - Adicionar tratamento de erros 403


  - _Requisitos: 1.1, 1.2, 1.3, 1.4, 2.3_

- [x] 10. Implementar Utilitários de Autenticação (Frontend)






  - Criar `frontend/src/lib/auth-utils.ts`
  - Implementar função extractClaims()
  - Implementar hooks useAuth() e usePermissions()
  - Criar componente ProtectedRoute
  - Adicionar validação de permissões em componentes
  - _Requisitos: 1.4, 1.5, 2.4_

- [x] 11. Implementar Clients HTTP (Frontend)




- [x] 11.1 Criar cliente para APIs de tenant


  - Criar `frontend/src/lib/api/tenant-client.ts`
  - Implementar métodos para todos os endpoints /tenant/*
  - Adicionar tratamento de erros
  - Adicionar tipos TypeScript
  - Implementar retry logic
  - _Requisitos: 5.1-5.5_

- [x] 11.2 Criar cliente para APIs internas


  - Criar `frontend/src/lib/api/internal-client.ts`
  - Implementar métodos para todos os endpoints /internal/*
  - Adicionar tratamento de erros
  - Adicionar tipos TypeScript
  - Implementar retry logic
  - _Requisitos: 6.1-6.7_

-

- [x] 12. Implementar Dashboard do Cliente (Frontend)




- [x] 12.1 Criar layout do dashboard


  - Criar `frontend/src/app/(dashboard)/layout.tsx`
  - Implementar sidebar com navegação
  - Implementar header com informações do tenant
  - Reutilizar componentes de layout existentes
  - Aplicar identidade visual AlquimistaAI
  - _Requisitos: 3.1, 10.1, 10.2, 10.3, 10.4_

- [x] 12.2 Criar página de visão geral


  - Criar `frontend/src/app/(dashboard)/dashboard/page.tsx`
  - Implementar componente TenantOverview com KPIs
  - Implementar componente UsageChart
  - Implementar componente AgentStatusList
  - Implementar componente IntegrationStatusList
  - Integrar com tenant-client
  - _Requisitos: 3.1, 3.7, 9.5, 9.6_

- [x] 12.3 Criar página de agentes


  - Criar `frontend/src/app/(dashboard)/dashboard/agents/page.tsx`
  - Implementar lista de agentes com filtros
  - Exibir status e métricas de cada agente
  - Adicionar ações básicas (visualizar detalhes)
  - Integrar com tenant-client
  - _Requisitos: 3.2, 3.7_

- [x] 12.4 Criar página de Fibonacci


  - Criar `frontend/src/app/(dashboard)/dashboard/fibonacci/page.tsx`
  - Exibir status de subnúcleos contratados
  - Mostrar métricas de orquestração
  - Integrar com tenant-client
  - _Requisitos: 3.3, 3.7_

- [x] 12.5 Criar página de integrações


  - Criar `frontend/src/app/(dashboard)/dashboard/integrations/page.tsx`
  - Listar integrações ativas
  - Exibir status e última sincronização
  - Adicionar botões de teste/reconectar
  - Integrar com tenant-client
  - _Requisitos: 3.4, 3.7_

- [x] 12.6 Criar página de uso


  - Criar `frontend/src/app/(dashboard)/dashboard/usage/page.tsx`
  - Implementar seletor de período
  - Implementar gráficos de linha (tendências)
  - Implementar gráficos de barra (por agente)
  - Integrar com tenant-client
  - _Requisitos: 3.5, 3.7, 9.5, 9.6, 9.7_

- [x] 12.7 Criar página de suporte


  - Criar `frontend/src/app/(dashboard)/dashboard/support/page.tsx`
  - Listar incidentes recentes
  - Adicionar formulário de abertura de chamado
  - Integrar com tenant-client
  - _Requisitos: 3.6, 3.7_

- [x] 13. Implementar Painel Operacional Interno (Frontend)





- [x] 13.1 Criar layout do painel operacional


  - Criar `frontend/src/app/(company)/layout.tsx`
  - Implementar sidebar com navegação interna
  - Implementar header com indicadores globais
  - Aplicar accent visual diferenciado
  - Reutilizar componentes base
  - _Requisitos: 4.1, 10.1, 10.2, 10.3, 10.4, 10.5_


- [x] 13.2 Criar página de visão geral operacional

  - Criar `frontend/src/app/(company)/company/page.tsx`
  - Implementar componente GlobalKPIs
  - Implementar gráficos de tendência (uso, receita)
  - Implementar componentes TopTenants e TopAgents
  - Implementar componente RecentIncidents
  - Integrar com internal-client
  - _Requisitos: 4.1, 4.7_

- [x] 13.3 Criar página de lista de tenants


  - Criar `frontend/src/app/(company)/company/tenants/page.tsx`
  - Implementar tabela com filtros e busca
  - Implementar paginação
  - Implementar ordenação por colunas
  - Adicionar ações (visualizar, editar)
  - Integrar com internal-client
  - _Requisitos: 4.2, 4.7, 12.3_

- [x] 13.4 Criar página de detalhes do tenant


  - Criar `frontend/src/app/(company)/company/tenants/[id]/page.tsx`
  - Implementar visualização completa de dados do tenant
  - Exibir usuários, agentes, integrações
  - Exibir resumo de uso e incidentes
  - Adicionar ações operacionais
  - Integrar com internal-client
  - _Requisitos: 4.3, 4.7_


- [x] 13.5 Criar página de visão de agentes


  - Criar `frontend/src/app/(company)/company/agents/page.tsx`
  - Implementar grid de 32 agentes
  - Exibir quantos tenants usam cada agente
  - Mostrar métricas agregadas por agente
  - Integrar com internal-client
  - _Requisitos: 4.4, 4.7_

- [x] 13.6 Criar página de mapa de integrações


  - Criar `frontend/src/app/(company)/company/integrations/page.tsx`
  - Exibir visão agregada de integrações
  - Mostrar quantos tenants por tipo de integração
  - Adicionar filtros e busca
  - Integrar com internal-client
  - _Requisitos: 4.5, 4.7_

- [x] 13.7 Criar página de console de operações


  - Criar `frontend/src/app/(company)/company/operations/page.tsx`
  - Implementar componente CommandForm
  - Implementar componente CommandHistoryTable
  - Adicionar filtros por status e tipo
  - Implementar polling para atualização de status
  - Integrar com internal-client
  - _Requisitos: 4.6, 4.7, 8.1, 8.7_

- [x] 13.8 Criar página de visão financeira


  - Criar `frontend/src/app/(company)/company/billing/page.tsx`
  - Implementar componente BillingOverview
  - Exibir MRR, ARR e tendências
  - Mostrar breakdown por plano e segmento
  - Implementar gráficos de receita
  - Integrar com internal-client
  - _Requisitos: 4.7_

- [x] 14. Implementar Componentes Compartilhados




- [x] 14.1 Criar componentes de métricas


  - Criar `frontend/src/components/shared/metrics-card.tsx`
  - Criar `frontend/src/components/shared/usage-chart.tsx`
  - Criar `frontend/src/components/shared/status-badge.tsx`
  - Reutilizar componentes shadcn/ui existentes
  - Aplicar identidade visual AlquimistaAI
  - _Requisitos: 10.1, 10.2, 10.3_

- [x] 14.2 Criar componente de tabela de dados


  - Criar `frontend/src/components/shared/data-table.tsx`
  - Implementar suporte a filtros
  - Implementar suporte a ordenação
  - Implementar suporte a paginação
  - Adicionar estados de loading e erro
  - _Requisitos: 12.3, 13.1_

- [x] 14.3 Criar componentes de gráficos


  - Criar wrappers para biblioteca de gráficos (recharts)
  - Implementar LineChart, BarChart, DonutChart
  - Aplicar tema AlquimistaAI
  - Adicionar responsividade
  - _Requisitos: 9.5, 9.6, 13.2_

- [x] 15. Implementar Stores de Estado (Frontend)




  - Criar `frontend/src/stores/tenant-store.ts` para dados do tenant
  - Criar `frontend/src/stores/company-store.ts` para dados operacionais
  - Integrar com auth-store existente
  - Implementar cache local de dados
  - Adicionar invalidação de cache
  - _Requisitos: 1.4, 12.2_

- [x] 16. Implementar Cache Redis (Backend)




  - Configurar ElastiCache Redis no CDK
  - Criar `lambda/shared/cache-manager.ts`
  - Implementar funções getCached() e invalidateCache()
  - Aplicar cache em handlers de leitura frequente
  - Configurar TTLs apropriados (5-15 min)
  - _Requisitos: 12.2, 12.3_

- [x] 17. Adicionar Responsividade





  - Ajustar layouts para mobile (min 320px)
  - Implementar menu hambúrguer para telas < 768px
  - Ajustar tamanho de gráficos para mobile
  - Implementar touch-friendly controls
  - Testar em dispositivos móveis
  - _Requisitos: 13.1, 13.2, 13.3, 13.4, 13.5_


- [x] 18. Implementar Tratamento de Erros





  - Criar componente ErrorBoundary para cada seção
  - Implementar toast notifications para erros não críticos
  - Implementar modals para erros que requerem ação
  - Adicionar mensagens de erro específicas por tipo
  - Implementar retry automático para erros de rede
  - _Requisitos: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

- [x] 19. Adicionar Logging e Observabilidade





  - Adicionar structured logging em todos os handlers
  - Configurar CloudWatch Logs Insights queries
  - Criar alarmes para erros críticos
  - Adicionar X-Ray tracing em handlers principais
  - Configurar métricas customizadas no CloudWatch
  - _Requisitos: 11.4_

- [x] 20. Implementar Testes





- [x] 20.1 Criar testes unitários (Backend)


  - Testar middleware de autorização
  - Testar handlers de APIs
  - Testar funções de agregação
  - Testar processador de comandos
  - Cobertura mínima: 80%
  - _Requisitos: Critério de Aceitação Global 2_

- [x] 20.2 Criar testes de integração (Backend)


  - Testar fluxos completos de APIs
  - Testar integração com Aurora
  - Testar integração com DynamoDB
  - Testar processamento de comandos end-to-end
  - Cobertura mínima: 60%
  - _Requisitos: Critério de Aceitação Global 3_

- [x] 20.3 Criar testes E2E (Frontend)


  - Testar fluxo de login e redirecionamento
  - Testar navegação no dashboard do cliente
  - Testar navegação no painel operacional
  - Testar criação de comandos operacionais
  - Usar Playwright ou Cypress
  - _Requisitos: 1.1, 1.2, 1.3_

- [x] 21. Criar Documentação





  - Criar `docs/operational-dashboard/README.md` com visão geral
  - Documentar estrutura de permissões e grupos
  - Documentar APIs com exemplos de uso
  - Documentar comandos operacionais disponíveis
  - Criar guia de troubleshooting
  - Adicionar tooltips em funcionalidades complexas
  - _Requisitos: 15.1, 15.2, 15.3, 15.4, 15.5_
- [x] 22. Realizar Testes de Segurança








- [ ] 22. Realizar Testes de Segurança

  - Executar OWASP ZAP scan
  - Testar isolamento de dados entre tenants
  - Testar validação de permissões em todas as rotas
  - Testar SQL injection e XSS
  - Validar rate limiting
  - Corrigir vulnerabilidades encontradas
  - _Requisitos: 11.1, 11.2, 11.3, 11.5, Critério de Aceitação Global 1_

- [x] 23. Realizar Testes de Performance





  - Executar load testing com k6 ou Artillery
  - Validar tempo de resposta < 2s para dashboards
  - Validar comportamento com 100+ tenants
  - Otimizar queries lentas
  - Ajustar configurações de cache
  - _Requisitos: 12.1, 12.2, 12.3, 12.4_

- [x] 24. Preparar Deploy





  - Atualizar CDK stacks com novos recursos
  - Configurar variáveis de ambiente
  - Criar secrets no Secrets Manager
  - Executar migrations em ambiente dev
  - Validar deploy em ambiente dev
  - Preparar runbook de deploy para produção
  - _Requisitos: Todos_

- [x] 25. Deploy em Produção





  - Executar migrations em produção
  - Deploy de Lambda handlers
  - Deploy de frontend
  - Configurar grupos no Cognito de produção
  - Validar funcionalidades críticas
  - Monitorar logs e métricas
  - _Requisitos: Todos_

---

## Notas de Implementação

### Ordem Recomendada

1. **Fase 1 - Fundação (Tasks 1-3)**: Configurar autenticação e modelo de dados
2. **Fase 2 - Backend (Tasks 4-8)**: Implementar todas as APIs
3. **Fase 3 - Frontend Cliente (Tasks 9-12)**: Implementar dashboard do cliente
4. **Fase 4 - Frontend Interno (Tasks 13-14)**: Implementar painel operacional
5. **Fase 5 - Qualidade (Tasks 15-23)**: Cache, responsividade, testes, documentação
6. **Fase 6 - Deploy (Tasks 24-25)**: Preparação e deploy em produção

### Dependências Críticas

- Task 1 deve ser concluída antes de qualquer teste de autenticação
- Task 2 deve ser concluída antes de Tasks 4-6
- Task 3 deve ser concluída antes de Tasks 4-7
- Tasks 4-8 devem ser concluídas antes de Tasks 11-13
- Task 9 deve ser concluída antes de Tasks 12-13
- Task 16 pode ser implementada em paralelo com Tasks 12-13

### Estimativas de Esforço

- **Fase 1**: 2-3 dias
- **Fase 2**: 5-7 dias
- **Fase 3**: 4-5 dias
- **Fase 4**: 5-6 dias
- **Fase 5**: 6-8 dias (incluindo testes completos)
- **Fase 6**: 1-2 dias

**Total estimado**: 24-33 dias de desenvolvimento

---

## Critérios de Conclusão

- [x] Todos os requisitos Must Have implementados



- [x] Testes de segurança passando (OWASP Top 10)
- [x] Cobertura de testes > 80% (unitários) e > 60% (integração)
- [x] Performance validada (< 2s para dashboards)
- [x] Documentação completa
- [x] Code review aprovado
- [x] Deploy em produção realizado com sucesso
- [x] Monitoramento configurado e funcionando
