# Tasks · Micro Agente de Disparos & Agendamentos

## Versão: v0.1

## Status Geral

- **Fase Atual**: Planejamento
- **Progresso**: 0% (0/45 tarefas concluídas)
- **Última Atualização**: 2024-11-26

---

## Fase 1: Preparação e Infraestrutura Base

### 1.1. Estrutura de Código

- [ ] **T-001**: Criar estrutura de diretórios em `lambda-src/agente-disparo-agenda/`
  - Prioridade: Alta
  - Estimativa: 30min
  - Dependências: Nenhuma

- [ ] **T-002**: Configurar `package.json` com dependências
  - Prioridade: Alta
  - Estimativa: 30min
  - Dependências: T-001
  - Pacotes: `@aws-sdk/client-s3`, `@aws-sdk/client-eventbridge`, `pg`, `xlsx`, `uuid`

- [ ] **T-003**: Configurar `tsconfig.json` para o micro agente
  - Prioridade: Alta
  - Estimativa: 15min
  - Dependências: T-001

### 1.2. Banco de Dados

- [ ] **T-004**: Criar migration `001_create_leads_table.sql`
  - Prioridade: Alta
  - Estimativa: 1h
  - Dependências: Nenhuma

- [ ] **T-005**: Criar migration `002_create_lead_telefones_table.sql`
  - Prioridade: Alta
  - Estimativa: 30min
  - Dependências: T-004

- [ ] **T-006**: Criar migration `003_create_lead_emails_table.sql`
  - Prioridade: Alta
  - Estimativa: 30min
  - Dependências: T-004

- [ ] **T-007**: Criar migration `004_create_disparos_table.sql`
  - Prioridade: Alta
  - Estimativa: 1h
  - Dependências: T-004

- [ ] **T-008**: Criar migration `005_create_agendamentos_table.sql`
  - Prioridade: Média
  - Estimativa: 45min
  - Dependências: T-004

- [ ] **T-009**: Criar migration `006_create_ingest_jobs_table.sql`
  - Prioridade: Alta
  - Estimativa: 45min
  - Dependências: Nenhuma

- [ ] **T-010**: Executar migrations em ambiente dev
  - Prioridade: Alta
  - Estimativa: 30min
  - Dependências: T-004, T-005, T-006, T-007, T-008, T-009

### 1.3. Secrets Manager

- [ ] **T-011**: Criar secret `/alquimista/dev/disparo-agenda/mcp-whatsapp`
  - Prioridade: Alta
  - Estimativa: 15min
  - Dependências: Nenhuma

- [ ] **T-012**: Criar secret `/alquimista/dev/disparo-agenda/mcp-email`
  - Prioridade: Alta
  - Estimativa: 15min
  - Dependências: Nenhuma

- [ ] **T-013**: Criar secret `/alquimista/dev/disparo-agenda/db-credentials`
  - Prioridade: Alta
  - Estimativa: 15min
  - Dependências: Nenhuma

---

## Fase 2: Implementação de Lambdas

### 2.1. Módulos Compartilhados

- [ ] **T-014**: Implementar `shared/db-client.ts` (conexão Aurora)
  - Prioridade: Alta
  - Estimativa: 2h
  - Dependências: T-002, T-013

- [ ] **T-015**: Implementar `shared/mcp-client.ts` (WhatsApp/Email)
  - Prioridade: Alta
  - Estimativa: 2h
  - Dependências: T-002, T-011, T-012

- [ ] **T-016**: Implementar `shared/eventbridge-client.ts`
  - Prioridade: Alta
  - Estimativa: 1h
  - Dependências: T-002

- [ ] **T-017**: Implementar `shared/validators.ts` (validação de telefone/email)
  - Prioridade: Média
  - Estimativa: 1h
  - Dependências: T-002

### 2.2. Lambda: Ingest Handler

- [ ] **T-018**: Implementar `handlers/ingest.ts` (upload e criação de job)
  - Prioridade: Alta
  - Estimativa: 3h
  - Dependências: T-014, T-016

- [ ] **T-019**: Adicionar validação de arquivo (formato, tamanho)
  - Prioridade: Alta
  - Estimativa: 1h
  - Dependências: T-018

- [ ] **T-020**: Implementar upload para S3
  - Prioridade: Alta
  - Estimativa: 1h
  - Dependências: T-018

### 2.3. Lambda: Ingest Processor

- [ ] **T-021**: Implementar `handlers/ingest-processor.ts` (leitura de planilha)
  - Prioridade: Alta
  - Estimativa: 4h
  - Dependências: T-014, T-017

- [ ] **T-022**: Implementar explosão de emails
  - Prioridade: Alta
  - Estimativa: 2h
  - Dependências: T-021

- [ ] **T-023**: Implementar explosão de telefones
  - Prioridade: Alta
  - Estimativa: 2h
  - Dependências: T-021

- [ ] **T-024**: Implementar tratamento de erros e logging
  - Prioridade: Média
  - Estimativa: 1h
  - Dependências: T-021

### 2.4. Lambda: Disparo Handler

- [ ] **T-025**: Implementar `handlers/disparo.ts` (criação de disparo)
  - Prioridade: Alta
  - Estimativa: 3h
  - Dependências: T-014, T-016

- [ ] **T-026**: Implementar agendamento via EventBridge Scheduler
  - Prioridade: Alta
  - Estimativa: 2h
  - Dependências: T-025

### 2.5. Lambda: Disparo Executor

- [ ] **T-027**: Implementar `handlers/disparo-executor.ts` (envio via MCP)
  - Prioridade: Alta
  - Estimativa: 3h
  - Dependências: T-014, T-015

- [ ] **T-028**: Implementar retry logic com backoff exponencial
  - Prioridade: Alta
  - Estimativa: 2h
  - Dependências: T-027

- [ ] **T-029**: Implementar Dead Letter Queue
  - Prioridade: Média
  - Estimativa: 1h
  - Dependências: T-027

### 2.6. Lambda: Agendamento Handler

- [ ] **T-030**: Implementar `handlers/agendamento.ts`
  - Prioridade: Média
  - Estimativa: 2h
  - Dependências: T-014

### 2.7. Lambda: Leads Query

- [ ] **T-031**: Implementar `handlers/leads-query.ts` (listagem paginada)
  - Prioridade: Média
  - Estimativa: 2h
  - Dependências: T-014

- [ ] **T-032**: Implementar filtros (status, documento, etc.)
  - Prioridade: Baixa
  - Estimativa: 1h
  - Dependências: T-031

### 2.8. Lambda: Job Status

- [ ] **T-033**: Implementar `handlers/job-status.ts`
  - Prioridade: Média
  - Estimativa: 1h
  - Dependências: T-014

---

## Fase 3: Infraestrutura Terraform

### 3.1. Módulos Terraform

- [ ] **T-034**: Criar módulo `terraform/modules/disparo-agenda/`
  - Prioridade: Alta
  - Estimativa: 1h
  - Dependências: Nenhuma

- [ ] **T-035**: Configurar API Gateway HTTP
  - Prioridade: Alta
  - Estimativa: 2h
  - Dependências: T-034

- [ ] **T-036**: Configurar Lambdas (todas as 7)
  - Prioridade: Alta
  - Estimativa: 3h
  - Dependências: T-034

- [ ] **T-037**: Configurar EventBridge Rules
  - Prioridade: Alta
  - Estimativa: 2h
  - Dependências: T-034

- [ ] **T-038**: Configurar S3 Bucket para ingestão
  - Prioridade: Alta
  - Estimativa: 1h
  - Dependências: T-034

- [ ] **T-039**: Configurar IAM Roles e Policies
  - Prioridade: Alta
  - Estimativa: 2h
  - Dependências: T-034

---

## Fase 4: Testes

### 4.1. Testes Unitários

- [ ] **T-040**: Testes para `shared/validators.ts`
  - Prioridade: Média
  - Estimativa: 1h
  - Dependências: T-017

- [ ] **T-041**: Testes para `handlers/ingest-processor.ts`
  - Prioridade: Alta
  - Estimativa: 2h
  - Dependências: T-021

- [ ] **T-042**: Testes para `handlers/disparo-executor.ts`
  - Prioridade: Alta
  - Estimativa: 2h
  - Dependências: T-027

### 4.2. Testes de Integração

- [ ] **T-043**: Teste end-to-end de ingestão
  - Prioridade: Alta
  - Estimativa: 3h
  - Dependências: T-010, T-021

- [ ] **T-044**: Teste end-to-end de disparo
  - Prioridade: Alta
  - Estimativa: 2h
  - Dependências: T-027

---

## Fase 5: Deploy e Validação

### 5.1. Deploy Dev

- [ ] **T-045**: Deploy completo em ambiente dev
  - Prioridade: Alta
  - Estimativa: 2h
  - Dependências: T-036, T-037, T-038, T-039

---

## Dependências Externas

### MCP Servers

- **MCP WhatsApp**: Deve estar configurado e acessível
- **MCP Email**: Deve estar configurado e acessível

### Infraestrutura Existente

- **Aurora Serverless v2**: Cluster dev já provisionado
- **EventBridge**: Bus `fibonacci-bus-dev` já existente
- **Cognito**: User Pool para autenticação

---

## Riscos e Mitigações

### Risco 1: Planilhas muito grandes (> 500k linhas)

**Impacto**: Timeout da Lambda (15min)

**Mitigação**:
- Processar em batches de 10k linhas
- Usar Step Functions para orquestração (Fase 2)

### Risco 2: Rate limiting dos MCP Servers

**Impacto**: Disparos falhando em massa

**Mitigação**:
- Implementar queue com SQS (Fase 2)
- Throttling configurável por tenant

### Risco 3: Duplicação de leads

**Impacto**: Múltiplos registros para o mesmo lead

**Mitigação**:
- Constraint UNIQUE em `lead_id_externo`
- Validação antes de INSERT

---

## Métricas de Sucesso

- [ ] Ingestão de 200k linhas em < 5 minutos
- [ ] Taxa de erro de disparos < 5%
- [ ] Tempo de resposta da API < 500ms (exceto ingestão)
- [ ] 100% de cobertura de testes unitários em módulos críticos

---

## Notas de Implementação

### Priorização

1. **Fase 1**: Infraestrutura base (crítico para tudo)
2. **Fase 2.1-2.3**: Ingestão de leads (funcionalidade core)
3. **Fase 2.4-2.5**: Disparos (funcionalidade core)
4. **Fase 3**: Terraform (deploy)
5. **Fase 4**: Testes (qualidade)
6. **Fase 2.6-2.8**: Funcionalidades secundárias

### Estimativa Total

- **Desenvolvimento**: ~60 horas
- **Testes**: ~10 horas
- **Deploy e validação**: ~5 horas
- **Total**: ~75 horas (~2 semanas com 1 dev full-time)

---

**Última Atualização**: 2024-11-26  
**Versão**: 0.1  
**Status**: Planejamento  
**Mantido por**: Equipe AlquimistaAI
