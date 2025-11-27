# Implementation Plan - Ecossistema Alquimista.AI

Este plano de implementação detalha as tarefas necessárias para construir o Ecossistema Alquimista.AI, seguindo uma abordagem incremental onde cada tarefa constrói sobre as anteriores.

## Phase 1: Foundation and Infrastructure

- [x] 1. Setup do projeto e configuração inicial





  - Criar estrutura de pastas conforme design (bin/, lib/, lambda/, mcp-integrations/, database/, tests/, docs/)
  - Criar package.json com todas as dependências e scripts necessários
  - Criar tsconfig.json com configurações apropriadas
  - Criar cdk.json com contextos para dev/staging/prod
  - Criar .env.example com variáveis de ambiente documentadas
  - Criar .gitignore para excluir node_modules, dist, cdk.out
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 2. Implementar Stack Principal do Fibonacci




  - [x] 2.1 Criar bin/app.ts com lógica de múltiplos ambientes e 3 stacks


    - Implementar leitura de contexto para ambiente (dev/staging/prod)
    - Criar instâncias das 3 stacks (Fibonacci, Nigredo, Alquimista)
    - Configurar tags comuns e específicas por núcleo
    - Estabelecer dependências entre stacks
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

  - [x] 2.2 Criar lib/fibonacci-stack.ts com recursos core


    - Implementar VPC com 2 AZs (public e private isolated subnets)
    - Criar Security Groups para Lambda e Aurora
    - Implementar Aurora Serverless v2 com configurações por ambiente
    - Criar Secret no Secrets Manager para credenciais do banco
    - Implementar EventBridge bus customizado (fibonacci-bus)
    - Criar filas SQS principais e DLQ
    - Implementar Cognito User Pool com atributos customizados
    - Configurar outputs do CloudFormation
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9_

  - [x] 2.3 Implementar S3 + CloudFront para front-end


    - Criar bucket S3 com BlockPublicAccess e versionamento
    - Criar Origin Access Control (OAC) para CloudFront
    - Implementar CloudFront Distribution com cache otimizado
    - Configurar error pages para SPA routing
    - Adicionar bucket policy permitindo acesso apenas do CloudFront
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x] 2.4 Implementar API Gateway + Lambda Handler


    - Criar função Lambda usando NodejsFunction com Node.js 20.x
    - Configurar variáveis de ambiente (POWERTOOLS_SERVICE_NAME, EVENT_BUS_NAME, DB_SECRET_ARN, USER_POOL_ID)
    - Criar HTTP API Gateway com nome fibonacci-api
    - Implementar rota GET /health
    - Implementar rota POST /events
    - Configurar CORS apropriado
    - Conceder permissões IAM para Lambda (EventBridge, Secrets Manager, SQS)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

- [x] 3. Implementar código da Lambda Handler principal







  - Criar lambda/handler.ts com lógica de roteamento
  - Implementar endpoint /health retornando {ok: true}
  - Implementar endpoint /events que publica no EventBridge
  - Adicionar validação de payload usando Zod
  - Implementar error handling com try-catch
  - Adicionar logging estruturado usando Powertools
  - Adicionar X-Ray tracing
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_
-

- [x] 4. Implementar código compartilhado (shared utilities)




  - [x] 4.1 Criar lambda/shared/logger.ts


    - Implementar classe Logger usando Powertools
    - Adicionar métodos info, warn, error, debug
    - Incluir trace_id automaticamente em todos os logs
    - Formatar logs em JSON estruturado
    - _Requirements: 15.5_


  - [x] 4.2 Criar lambda/shared/database.ts

    - Implementar connection pool para PostgreSQL usando pg
    - Criar função para obter credenciais do Secrets Manager
    - Implementar query wrapper com retry logic
    - Adicionar transaction support
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9_

  - [x] 4.3 Criar lambda/shared/error-handler.ts


    - Implementar wrapper withErrorHandling para Lambdas
    - Classificar erros (transient, permanent, critical)
    - Implementar lógica de envio para DLQ
    - Adicionar alertas para erros críticos
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

  - [x] 4.4 Criar lambda/shared/circuit-breaker.ts


    - Implementar classe CircuitBreaker
    - Adicionar estados (closed, open, half-open)
    - Configurar threshold de falhas (5 falhas)
    - Implementar timeout de recuperação (60 segundos)
    - _Requirements: 16.3_

## Phase 2: Database Schema and Migrations

- [x] 5. Criar schemas e tabelas do banco de dados





  - [x] 5.1 Criar database/migrations/001_create_schemas.sql


    - Criar schema fibonacci_core
    - Criar schema nigredo_leads
    - Criar schema alquimista_platform
    - Configurar permissões apropriadas
    - _Requirements: 7.7_

  - [x] 5.2 Criar database/migrations/002_create_leads_tables.sql


    - Criar tabela nigredo_leads.leads com todos os campos
    - Criar tabela nigredo_leads.campanhas
    - Criar tabela nigredo_leads.interacoes
    - Criar tabela nigredo_leads.agendamentos
    - Criar tabela nigredo_leads.metricas_diarias
    - Criar tabela nigredo_leads.blocklist para LGPD
    - Criar índices apropriados
    - _Requirements: 11.11, 11.12_

  - [x] 5.3 Criar database/migrations/003_create_platform_tables.sql


    - Criar tabela alquimista_platform.tenants
    - Criar tabela alquimista_platform.users
    - Criar tabela alquimista_platform.agents (catálogo)
    - Criar tabela alquimista_platform.agent_activations
    - Criar tabela alquimista_platform.permissions
    - Criar tabela alquimista_platform.audit_logs
    - Criar índices apropriados
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8_

  - [x] 5.4 Criar database/migrations/004_create_core_tables.sql


    - Criar tabela fibonacci_core.events (histórico de eventos)
    - Criar tabela fibonacci_core.traces (rastreamento distribuído)
    - Criar tabela fibonacci_core.metrics (métricas agregadas)
    - Criar índices apropriados
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8_

  - [x] 5.5 Criar scripts/migrate.js


    - Implementar lógica de execução de migrações
    - Conectar ao Aurora usando credenciais do Secrets Manager
    - Executar arquivos SQL em ordem
    - Registrar migrações executadas
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9_

  - [x] 5.6 Criar database/seeds/initial_data.sql


    - Popular catálogo inicial de agentes
    - Criar tenant de demonstração
    - Criar usuário admin de demonstração
    - _Requirements: 14.1, 14.2_



## Phase 3: MCP Integrations

- [x] 6. Implementar base do MCP Client





  - Criar mcp-integrations/base-client.ts com interface MCPClient
  - Implementar método call() com retry logic e exponential backoff
  - Implementar método listTools()
  - Adicionar logging de todas as chamadas MCP com trace_id
  - Implementar timeout configurável
  - _Requirements: 13.1, 13.8, 13.9_

- [x] 7. Implementar MCP Server para WhatsApp




  - Criar mcp-integrations/servers/whatsapp.ts
  - Implementar método sendMessage() usando WhatsApp Business API
  - Implementar método getMessageStatus()
  - Implementar idempotency usando idempotencyKey
  - Configurar rate limiting (80 msg/segundo)
  - Adicionar retry com exponential backoff
  - Armazenar API key no Secrets Manager
  - _Requirements: 13.2, 13.7, 13.8, 13.9, 13.10_

- [x] 8. Implementar MCP Server para Google Calendar



  - Criar mcp-integrations/servers/calendar.ts
  - Implementar método getAvailability()
  - Implementar método createEvent()
  - Implementar método updateEvent()
  - Implementar método deleteEvent()
  - Configurar OAuth2 service account
  - Armazenar credenciais no Secrets Manager
  - _Requirements: 13.3, 13.7, 13.8, 13.9, 13.10_

- [x] 9. Implementar MCP Server para Data Enrichment





  - Criar mcp-integrations/servers/enrichment.ts
  - Implementar integração com Receita Federal API (CNPJ lookup)
  - Implementar integração com Google Places API
  - Implementar integração com LinkedIn API (opcional)
  - Implementar cache de resultados para reduzir chamadas
  - Configurar rate limiting por serviço
  - _Requirements: 13.4, 13.7, 13.8, 13.9, 13.10_

- [x] 10. Implementar MCP Server para Sentiment Analysis






  - Criar mcp-integrations/servers/sentiment.ts
  - Implementar integração com AWS Comprehend
  - Implementar método analyze() que retorna sentiment e score
  - Implementar detecção de palavras-chave de descadastro
  - Configurar batch processing para otimizar custos
  - _Requirements: 13.5, 13.7, 13.8, 13.9, 13.10_

## Phase 4: Nigredo Stack - Agentes de Prospecção

- [x] 11. Criar Stack do Nigredo












  - Criar lib/nigredo-stack.ts
  - Receber dependências da FibonacciStack (eventBus, vpc, dbCluster, dbSecret)
  - Criar filas SQS específicas para cada agente
  - Criar regras do EventBridge para rotear eventos nigredo.*
  - Configurar outputs do CloudFormation
  - _Requirements: 11.1, 11.2, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

- [x] 12. Implementar Agente de Recebimento






  - [x] 12.1 Criar lambda/agents/recebimento.ts


    - Implementar handler que recebe planilha Excel ou JSON
    - Validar campos obrigatórios (empresa, contato, telefone/email)
    - Diferenciar PF de PJ usando validação de CNPJ
    - Formatar telefones para padrão internacional (+55...)
    - Formatar emails para lowercase
    - Remover duplicatas usando hash de email+telefone
    - _Requirements: 11.3_


  - [x] 12.2 Implementar enriquecimento de dados



    - Chamar MCP enrichment para buscar dados da Receita Federal
    - Chamar MCP enrichment para buscar dados do Google Places
    - Completar campos faltantes (setor, porte, atividade_principal)
    - Gerar relatório de inconformidades
    - _Requirements: 11.3_




  - [x] 12.3 Implementar segmentação e priorização




    - Segmentar leads por setor, porte e atividade
    - Calcular score de prioridade (0-100)
    - Criar lotes homogêneos por atividade
    - Ordenar do maior para menor potencial
    - _Requirements: 11.3_

  - [x] 12.4 Implementar persistência e publicação de evento




    - Salvar leads na tabela nigredo_leads.leads
    - Publicar evento nigredo.recebimento.completed com lotes priorizados
    - Registrar trace_id para auditoria
    - _Requirements: 11.3, 11.10, 11.11_


  - [x] 12.5 Adicionar Lambda à NigredoStack



    - Criar função Lambda com 1024MB, 60s timeout
    - Configurar trigger da fila SQS RecebimentoQueue
    - Conceder permissões para EventBridge, Secrets Manager, Aurora
    - _Requirements: 11.2_
- [x] 13. Implementar Agente de Estratégia

  - [x] 13.1 Criar lambda/agents/estrategia.ts


    - Implementar handler que recebe lotes de leads
    - Pesquisar perfil comercial detalhado via MCP enrichment
    - Calcular faturamento estimado e maturidade
    - _Requirements: 11.4_

  - [x] 13.2 Implementar criação de campanhas

    - Criar mensagens para Topo, Meio e Fundo do funil
    - Gerar variações de mensagens para testes A/B
    - Definir canal ideal (WhatsApp, Email) por segmento
    - Planejar ritmo de disparos (horários, frequência)
    - _Requirements: 11.4_

  - [x] 13.3 Implementar aprovação e persistência

    - Gerar pré-visualizações das mensagens
    - Salvar campanha na tabela nigredo_leads.campanhas
    - Publicar evento nigredo.estrategia.completed
    - _Requirements: 11.4_

  - [x] 13.4 Adicionar Lambda à NigredoStack


    - Criar função Lambda com 1024MB, 120s timeout
    - Configurar trigger do EventBridge (nigredo.recebimento.completed)
    - Conceder permissões necessárias
    - _Requirements: 11.2_

- [x] 14. Implementar Agente de Disparo





  - [x] 14.1 Criar lambda/agents/disparo.ts


    - Implementar handler que consulta campanhas ativas
    - Verificar horário comercial (08h-18h, seg-sex)
    - Aplicar rate limiting por tenant (100 msg/hora, 500 msg/dia)
    - Adicionar variações sutis de horário (±5 min)
    - _Requirements: 11.5_

  - [x] 14.2 Implementar envio via MCP

    - Chamar MCP whatsapp.sendMessage() ou email
    - Usar idempotency key para evitar duplicatas
    - Atualizar status do lead
    - Registrar envio na tabela nigredo_leads.interacoes
    - _Requirements: 11.5_

  - [x] 14.3 Implementar publicação de evento

    - Publicar evento nigredo.disparo.sent
    - Incluir trace_id e metadata
    - _Requirements: 11.5, 11.10_

  - [x] 14.4 Adicionar Lambda à NigredoStack


    - Criar função Lambda com 512MB, 30s timeout
    - Configurar trigger do EventBridge Scheduler (cron)
    - Conceder permissões necessárias
    - _Requirements: 11.2_

- [x] 15. Implementar Agente de Atendimento



  - [x] 15.1 Criar lambda/agents/atendimento.ts


    - Implementar handler que recebe webhook do WhatsApp/Email
    - Identificar lead no banco de dados
    - Consultar histórico de interações
    - _Requirements: 11.6_

  - [x] 15.2 Implementar análise de sentimento

    - Chamar Agente de Análise de Sentimento (invocação síncrona)
    - Receber classificação emocional (positivo, neutro, negativo, irritado)
    - Ajustar tom da resposta baseado no sentimento
    - _Requirements: 11.6, 11.7_

  - [x] 15.3 Implementar geração de resposta

    - Usar LLM (Bedrock ou similar) para gerar resposta
    - Aplicar prompt template com contexto do lead
    - Validar resposta contra políticas de marca
    - _Requirements: 11.6_

  - [x] 15.4 Implementar envio e decisão de próximo passo

    - Enviar resposta via MCP whatsapp
    - Atualizar histórico de interações
    - Decidir próximo passo (agendamento, nutrição, descarte)
    - Publicar evento apropriado
    - _Requirements: 11.6_

  - [x] 15.5 Adicionar Lambda à NigredoStack


    - Criar função Lambda com 1024MB, 30s timeout
    - Configurar trigger via API Gateway (webhook)
    - Conceder permissões necessárias
    - _Requirements: 11.2_

- [x] 16. Implementar Agente de Análise de Sentimento





  - Criar lambda/agents/sentimento.ts
  - Implementar handler que recebe texto da mensagem
  - Pré-processar texto (normalização, tokenização)
  - Chamar MCP sentiment.analyze()
  - Classificar sentimento e calcular intensidade (0-100)
  - Detectar palavras-chave de descadastro (LGPD)
  - Retornar classificação estruturada
  - Adicionar Lambda à NigredoStack (512MB, 10s timeout)
  - _Requirements: 11.7, 11.12_
-

- [x] 17. Implementar Agente de Agendamento




  - [x] 17.1 Criar lambda/agents/agendamento.ts


    - Implementar handler que recebe solicitação de agendamento
    - Consultar disponibilidade via MCP calendar.getAvailability()
    - Propor 3 horários ao lead
    - _Requirements: 11.8_

  - [x] 17.2 Implementar confirmação e criação de evento

    - Aguardar confirmação do lead
    - Criar evento no calendário via MCP calendar.createEvent()
    - Enviar confirmação por email/WhatsApp
    - _Requirements: 11.8_

  - [x] 17.3 Implementar briefing comercial

    - Gerar briefing com histórico completo do lead
    - Incluir classificações, objeções e insights
    - Salvar na tabela nigredo_leads.agendamentos
    - Publicar evento nigredo.agendamento.confirmed
    - _Requirements: 11.8, 11.10_

  - [x] 17.4 Adicionar Lambda à NigredoStack


    - Criar função Lambda com 512MB, 30s timeout
    - Configurar trigger do EventBridge (nigredo.atendimento.schedule_requested)
    - Conceder permissões necessárias
    - _Requirements: 11.2_

- [x] 18. Implementar Agente de Relatórios




  - [x] 18.1 Criar lambda/agents/relatorios.ts


    - Implementar handler que consulta dados de todos os agentes
    - Calcular métricas de funil (leads recebidos, taxa de resposta, etc)
    - Identificar objeções recorrentes
    - _Requirements: 11.9_

  - [x] 18.2 Implementar geração de insights


    - Usar LLM para gerar insights estratégicos
    - Criar relatório em formato JSON
    - Salvar na tabela nigredo_leads.metricas_diarias
    - _Requirements: 11.9_

  - [x] 18.3 Implementar envio de relatório


    - Gerar PDF do relatório (opcional)
    - Enviar por email para gestores
    - Atualizar dashboard em tempo real
    - Publicar evento nigredo.relatorios.generated
    - _Requirements: 11.9_

  - [x] 18.4 Adicionar Lambda à NigredoStack


    - Criar função Lambda com 1024MB, 120s timeout
    - Configurar trigger do EventBridge Scheduler (diário às 08h)
    - Conceder permissões necessárias
    - _Requirements: 11.2_



## Phase 5: Alquimista Stack - Plataforma SaaS

- [x] 19. Criar Stack da Plataforma Alquimista




  - Criar lib/alquimista-stack.ts
  - Receber dependências da FibonacciStack (eventBus, userPool, dbCluster, dbSecret)
  - Criar Lambdas para API REST da plataforma
  - Criar rotas do API Gateway para marketplace
  - Configurar autorização via Cognito
  - Configurar outputs do CloudFormation
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8_

- [x] 20. Implementar API do Marketplace




  - [x] 20.1 Criar lambda/platform/list-agents.ts


    - Implementar handler que lista agentes disponíveis
    - Filtrar por categoria (Conteúdo, Social, Vendas, Pesquisa, Agenda, Finanças)
    - Retornar nome, descrição, categoria, versão e status
    - _Requirements: 14.2_

  - [x] 20.2 Criar lambda/platform/activate-agent.ts


    - Implementar handler que ativa agente para tenant
    - Validar permissões do usuário
    - Criar registro em agent_activations
    - Publicar evento alquimista.agent.activated
    - _Requirements: 14.7_

  - [x] 20.3 Criar lambda/platform/deactivate-agent.ts


    - Implementar handler que desativa agente
    - Atualizar status em agent_activations
    - Publicar evento alquimista.agent.deactivated
    - _Requirements: 14.7_

  - [x] 20.4 Adicionar rotas ao API Gateway


    - GET /api/agents (listar agentes)
    - POST /api/agents/{id}/activate (ativar agente)
    - POST /api/agents/{id}/deactivate (desativar agente)
    - Configurar autorização via Cognito
    - _Requirements: 14.2, 14.7_

- [x] 21. Implementar sistema de permissões




  - Criar lambda/platform/check-permissions.ts
  - Implementar lógica de permissões granulares por agente
  - Definir escopos de ação permitidos
  - Validar permissões antes de executar ações
  - _Requirements: 14.3_

- [x] 22. Implementar sistema de auditoria




  - Criar lambda/platform/audit-log.ts
  - Registrar todas as ações de agentes com trace_id, timestamp, agent_id, action_type e result
  - Salvar na tabela alquimista_platform.audit_logs
  - Implementar API para consultar logs de auditoria
  - _Requirements: 14.5_

- [x] 23. Implementar métricas por agente



  - Criar lambda/platform/agent-metrics.ts
  - Calcular taxa de sucesso por agente
  - Calcular tempo médio de execução
  - Calcular custo por agente
  - Expor via API REST
  - _Requirements: 14.6_

- [x] 24. Implementar fluxo de aprovação




  - Criar lambda/platform/approval-flow.ts
  - Implementar aprovação em 1-2 passos para ações críticas
  - Notificar usuários sobre ações pendentes
  - Registrar aprovações/rejeições
  - _Requirements: 14.4_

## Phase 6: Observability and Monitoring

- [x] 25. Implementar CloudWatch Dashboards




  - [x] 25.1 Criar dashboard Fibonacci Core


    - Adicionar métricas de API Gateway (requests/min, errors, latency)
    - Adicionar métricas de Lambda (invocations, errors, duration)
    - Adicionar métricas de EventBridge (events published)
    - Adicionar métricas de SQS (messages in flight, DLQ count)
    - _Requirements: 15.1, 15.2_

  - [x] 25.2 Criar dashboard Nigredo Agents


    - Adicionar métricas de leads processados por agente
    - Adicionar taxa de sucesso por agente
    - Adicionar tempo médio de processamento
    - Adicionar erros por agente
    - Adicionar MCP calls por serviço
    - _Requirements: 15.2_

  - [x] 25.3 Criar dashboard Business Metrics


    - Adicionar funil de conversão
    - Adicionar taxa de resposta
    - Adicionar taxa de agendamento
    - Adicionar custo por lead
    - Adicionar ROI por campanha
    - _Requirements: 15.2, 15.7, 15.8_

- [x] 26. Configurar CloudWatch Alarms





  - Criar alarme para taxa de erro alta (>10 erros em 2 min)
  - Criar alarme para latência alta (p95 >3s)
  - Criar alarme para DLQ não vazia
  - Criar alarme para Aurora CPU alta (>80%)
  - Criar alarme para custos acima do budget
  - Configurar notificações via SNS/Email
  - _Requirements: 15.3, 15.4_

- [x] 27. Configurar X-Ray Tracing



  - Habilitar tracing em todas as Lambdas
  - Instrumentar código com subsegments customizados
  - Adicionar annotations para filtros (leadId, tenantId)
  - Adicionar metadata para debugging
  - _Requirements: 15.6_

- [x] 28. Implementar Structured Logging




  - Atualizar todas as Lambdas para usar logger compartilhado
  - Garantir que todos os logs incluem trace_id
  - Adicionar contexto relevante (agent, leadId, tenantId)
  - Formatar logs em JSON estruturado
  - _Requirements: 15.5_

- [x] 29. Criar CloudWatch Insights Queries




  - Criar query para erros por agente
  - Criar query para latência por endpoint
  - Criar query para taxa de conversão do funil
  - Salvar queries no console do CloudWatch
  - _Requirements: 15.2_

## Phase 7: Security and Compliance

- [x] 30. Implementar IAM Roles com menor privilégio




  - Revisar todas as Lambda execution roles
  - Remover permissões desnecessárias
  - Adicionar apenas permissões específicas necessárias
  - Documentar permissões de cada role
  - _Requirements: 17.3_

- [x] 31. Configurar criptografia





  - Habilitar criptografia em repouso para Aurora usando KMS
  - Habilitar criptografia em repouso para S3
  - Habilitar criptografia em repouso para SQS
  - Garantir TLS 1.2+ para todos os dados em trânsito
  - _Requirements: 17.1, 17.2_

- [x] 32. Habilitar CloudTrail





  - Criar trail para auditoria de ações administrativas
  - Configurar logging de eventos de gerenciamento
  - Configurar logging de eventos de dados (S3, Lambda)
  - Armazenar logs em bucket S3 com retenção de 90 dias
  - _Requirements: 17.4_

- [x] 33. Implementar VPC Endpoints





  - Criar VPC endpoint para S3
  - Criar VPC endpoint para Secrets Manager
  - Criar VPC endpoint para EventBridge
  - Evitar tráfego pela internet pública
  - _Requirements: 17.5_

- [x] 34. Configurar WAF no CloudFront





  - Criar Web ACL com regras de proteção
  - Adicionar rate limiting (2000 req/5min por IP)
  - Adicionar proteção contra SQL injection
  - Adicionar proteção contra XSS
  - Associar Web ACL ao CloudFront
  - _Requirements: 17.6_

- [x] 35. Implementar conformidade LGPD




  - [x] 35.1 Implementar consentimento explícito


    - Adicionar campo consent na tabela leads
    - Validar consentimento antes de processar dados
    - Bloquear leads sem consentimento
    - _Requirements: 17.7, 11.12_

  - [x] 35.2 Implementar descadastro automático


    - Criar função handleDescadastro()
    - Marcar lead como descadastrado
    - Cancelar agendamentos futuros
    - Adicionar à blocklist
    - Enviar confirmação
    - Registrar auditoria
    - _Requirements: 17.8, 11.12_

  - [x] 35.3 Implementar direito ao esquecimento


    - Criar função handleDireitoEsquecimento()
    - Anonimizar dados pessoais
    - Anonimizar interações
    - Manter apenas dados agregados
    - _Requirements: 17.8, 11.12_

- [x] 36. Configurar backups automáticos




  - Configurar backup diário do Aurora (retenção 7 dias)
  - Habilitar versionamento no S3
  - Configurar rotação de secrets (30 dias)
  - Documentar procedimento de restore
  - _Requirements: 17.9_

- [x] 37. Implementar scan de vulnerabilidades




  - Adicionar npm audit ao pipeline CI/CD
  - Configurar Dependabot para atualizar dependências
  - Executar scan antes de cada deploy
  - Bloquear deploy se vulnerabilidades críticas forem encontradas
  - _Requirements: 17.10_

## Phase 8: CI/CD and Automation
-

- [x] 38. Criar workflow GitHub Actions




  - [x] 38.1 Criar .github/workflows/test.yml


    - Executar npm install
    - Executar npm run lint
    - Executar npm run test
    - Executar npm run build
    - Gerar relatório de cobertura
    - _Requirements: 18.2, 18.3_

  - [x] 38.2 Criar .github/workflows/deploy-dev.yml


    - Trigger em push para branch develop
    - Executar testes
    - Executar cdk deploy --context env=dev
    - Executar smoke tests
    - _Requirements: 18.5_

  - [x] 38.3 Criar .github/workflows/deploy-staging.yml


    - Trigger em push para branch main
    - Executar testes
    - Executar cdk deploy --context env=staging
    - Executar smoke tests
    - _Requirements: 18.5_

  - [x] 38.4 Criar .github/workflows/deploy-prod.yml


    - Trigger manual (workflow_dispatch)
    - Requer aprovação manual
    - Executar testes
    - Executar cdk deploy --context env=prod
    - Executar health checks
    - Rollback automático se health checks falharem
    - _Requirements: 18.5, 18.6_

  - [x] 38.5 Configurar secrets do GitHub


    - AWS_ACCESS_KEY_ID
    - AWS_SECRET_ACCESS_KEY
    - Outros secrets necessários
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7, 18.8, 18.9, 18.10_

- [x] 39. Implementar scan de segurança no pipeline





  - Adicionar step de npm audit
  - Adicionar step de cdk-nag (validação de segurança do CDK)
  - Bloquear deploy se issues críticos forem encontrados
  - _Requirements: 18.4_

- [x] 40. Implementar geração de changelog



  - Configurar conventional commits
  - Gerar changelog automático baseado em commits
  - Criar release notes no GitHub
  - _Requirements: 18.7_

- [x] 41. Configurar notificações




  - Integrar com Slack para notificações de deploy
  - Notificar sucesso/falha de deploys
  - Notificar quando aprovação manual é necessária
  - _Requirements: 18.8_

- [x] 42. Implementar blue-green deployment



  - Configurar alias de Lambda para versões
  - Implementar traffic shifting gradual
  - Rollback automático se métricas degradarem
  - _Requirements: 18.9_

- [x] 43. Implementar versionamento de stacks


  - Adicionar versão às tags das stacks
  - Manter histórico de versões no S3
  - Permitir rollback para versões anteriores
  - _Requirements: 18.10_

## Phase 9: Testing

- [ ]* 44. Implementar testes unitários
  - [ ]* 44.1 Criar tests/unit/agents/recebimento.test.ts
    - Testar higienização de telefone
    - Testar remoção de duplicatas
    - Testar validação de CNPJ
    - Testar segmentação de leads
    - _Requirements: 11.3_

  - [ ]* 44.2 Criar tests/unit/agents/estrategia.test.ts
    - Testar criação de mensagens
    - Testar testes A/B
    - Testar seleção de canal
    - _Requirements: 11.4_

  - [ ]* 44.3 Criar tests/unit/agents/sentimento.test.ts
    - Testar classificação de sentimento
    - Testar detecção de descadastro
    - Testar cálculo de intensidade
    - _Requirements: 11.7_

  - [ ]* 44.4 Criar tests/unit/shared/circuit-breaker.test.ts
    - Testar transição de estados
    - Testar threshold de falhas
    - Testar timeout de recuperação
    - _Requirements: 16.3_

- [ ]* 45. Implementar testes de integração
  - [ ]* 45.1 Criar tests/integration/fibonacci-flow.test.ts
    - Testar fluxo completo de prospecção
    - Criar lead → processar recebimento → criar campanha → disparar → atender → agendar
    - Validar eventos publicados no EventBridge
    - Validar dados salvos no banco
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_

  - [ ]* 45.2 Criar tests/integration/mcp-integrations.test.ts
    - Testar integração com WhatsApp (mock)
    - Testar integração com Google Calendar (mock)
    - Testar integração com Data Enrichment (mock)
    - Testar retry logic
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.8, 13.9, 13.10_

- [ ]* 46. Implementar testes E2E
  - [ ]* 46.1 Criar tests/e2e/platform.test.ts usando Playwright
    - Testar login na plataforma
    - Testar navegação para marketplace
    - Testar ativação de agente
    - Testar visualização de dashboard
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8_

- [ ]* 47. Implementar testes de carga
  - [ ]* 47.1 Criar tests/load/api-load.yml usando Artillery
    - Simular 10 req/s por 60s (warm up)
    - Simular 50 req/s por 300s (sustained load)
    - Simular 100 req/s por 60s (spike)
    - Validar latência p95 < 3s
    - Validar taxa de erro < 1%
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 16.8, 16.9, 16.10_

## Phase 10: Documentation and Finalization

- [x] 48. Criar documentação dos agentes


  - Criar docs/agents/recebimento.md
  - Criar docs/agents/estrategia.md
  - Criar docs/agents/disparo.md
  - Criar docs/agents/atendimento.md
  - Criar docs/agents/sentimento.md
  - Criar docs/agents/agendamento.md
  - Criar docs/agents/relatorios.md
  - Documentar inputs, outputs, configurações e exemplos
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9_

- [x] 49. Criar README.md principal


  - Adicionar descrição do projeto
  - Adicionar arquitetura high-level
  - Adicionar pré-requisitos
  - Adicionar instruções de setup
  - Adicionar comandos de deploy
  - Adicionar troubleshooting
  - Adicionar links para documentação detalhada
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 50. Criar guia de contribuição


  - Criar CONTRIBUTING.md
  - Documentar padrões de código
  - Documentar processo de PR
  - Documentar conventional commits
  - _Requirements: 18.7_

- [x] 51. Executar deploy final e validação




  - [x] Verificação completa do sistema realizada
  - [x] Relatório de verificação criado (SYSTEM-VERIFICATION-REPORT.md)
  - [x] Código compilado sem erros
  - [x] Infraestrutura validada
  - [x] Documentação completa
  - [ ] Executar deploy em produção (pendente)
  - [ ] Validar todos os outputs do CloudFormation (pós-deploy)
  - [ ] Executar smoke tests em produção (pós-deploy)
  - [ ] Validar dashboards do CloudWatch (pós-deploy)
  - [ ] Validar alarmes configurados (pós-deploy)
  - [ ] Validar backups automáticos (pós-deploy)
  - [ ] Documentar URLs e credenciais (pós-deploy)
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_

---

## Notes

- Tasks marcadas com `*` são opcionais (testes) e podem ser puladas para MVP mais rápido
- Cada task deve ser executada em ordem, pois há dependências entre elas
- Sempre executar `npm run build` antes de testar mudanças
- Sempre executar `npm run diff` antes de deploy para revisar mudanças
- Sempre validar outputs do CloudFormation após cada deploy
- Manter trace_id em todos os logs para facilitar debugging
- Seguir princípio de menor privilégio para todas as permissões IAM
- Documentar decisões importantes em comentários no código
