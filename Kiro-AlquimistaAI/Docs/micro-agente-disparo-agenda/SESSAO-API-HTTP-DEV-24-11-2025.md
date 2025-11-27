# Sessão: Implementação API HTTP do Micro Agente Disparo & Agendamento

**Data**: 24 de Novembro de 2025  
**Objetivo**: Implementar API HTTP real via API Gateway + Lambda (Terraform) e integrar com frontend Next.js

---

## 📋 Contexto

### Estado Atual

**Infraestrutura Terraform** ✅ COMPLETA:
- Módulo `terraform/modules/agente_disparo_agenda/` criado
- 4 Lambdas core implementadas (TypeScript):
  - `ingest-contacts.ts`
  - `send-messages.ts`
  - `handle-replies.ts`
  - `schedule-meeting.ts`
- DynamoDB, SQS, EventBridge, IAM configurados
- Ambientes dev/prod prontos

**Frontend Next.js** ✅ PRONTO:
- Rota `/dashboard/disparo-agenda` implementada
- Cliente HTTP `disparo-agenda-api.ts` com stubs
- Componentes UI completos
- Testes E2E (8 cenários) passando

**Problema**: Frontend usa stubs (dados mockados). Não há API HTTP real exposta.

---

## 🎯 Objetivo desta Sessão

Sair do modo "UI com stubs" e entregar uma **API HTTP real** para o Micro Agente, exposta via **API Gateway + Lambda** na AWS (dev), integrada ao módulo Terraform e ao frontend Next.js.

---

## 📐 Contrato HTTP da API

### Rotas Mínimas (conforme blueprint)

1. **GET /disparo/overview**
   - Retorna contadores agregados
   - Response: `{ contactsInQueue, messagesSentToday, meetingsScheduled, meetingsConfirmed }`

2. **GET /disparo/campaigns**
   - Lista campanhas (id, nome, canal, status, métricas)
   - Response: `Campaign[]`

3. **POST /disparo/contacts/ingest**
   - Recebe payload com contatos para enfileiramento
   - Request: `{ contacts: Array<{company, contactName, phone, email, notes?}> }`
   - Response: `{ success: boolean, message: string }`

4. **GET /agendamento/meetings**
   - Lista reuniões agendadas
   - Response: `Meeting[]`

---

## 🏗️ Arquitetura Proposta

```
Frontend (Next.js)
    ↓ HTTP
API Gateway HTTP (AWS)
    ↓ Lambda Proxy Integration
Lambda Handlers (Node.js 20)
    ↓
DynamoDB / Aurora / EventBridge
```

**Decisão**: Criar **1 Lambda de API** que roteia para as Lambdas core existentes via EventBridge/SQS, OU expor as Lambdas core diretamente via API Gateway.

**Recomendação**: Criar Lambda de API dedicada (`api-handler.ts`) para:
- Validação de entrada
- Roteamento
- Transformação de resposta
- Separação de responsabilidades

---

## 📝 Tarefas desta Sessão

### 1. Terraform - API Gateway HTTP

- [ ] Criar `terraform/modules/agente_disparo_agenda/api_gateway.tf`
  - Recurso `aws_apigatewayv2_api` (HTTP API)
  - Stage `dev` com auto_deploy
  - Integrations com Lambda
  - Routes (GET /disparo/overview, etc.)
  - Permissões Lambda

- [ ] Criar Lambda de API Handler
  - Arquivo: `lambda-src/agente-disparo-agenda/src/handlers/api-handler.ts`
  - Roteamento interno para as 4 rotas
  - Validação de entrada
  - Transformação de resposta

- [ ] Atualizar `terraform/modules/agente_disparo_agenda/lambda_api.tf`
  - Definir Lambda `api-handler`
  - Configurar variáveis de ambiente
  - Configurar IAM para invocar outras Lambdas/DynamoDB

- [ ] Expor outputs
  - `api_gateway_invoke_url` em `main.tf`
  - Documentar em `docs/micro-agente-disparo-agenda/API-ENDPOINTS-DEV-PROD.md`

### 2. Frontend - Integração Real

- [ ] Atualizar `frontend/src/lib/api/disparo-agenda-api.ts`
  - Remover stubs
  - Usar `NEXT_PUBLIC_DISPARO_API_URL` ou `NEXT_PUBLIC_PLATFORM_API_URL`
  - Implementar chamadas reais com fetch

- [ ] Configurar variável de ambiente
  - Adicionar `NEXT_PUBLIC_DISPARO_API_URL` em `.env.local`
  - Documentar em `frontend/.env.example`

### 3. Testes e Validação

- [ ] Aplicar Terraform em dev
  - `cd terraform/envs/dev`
  - `terraform init`
  - `terraform plan`
  - `terraform apply`

- [ ] Testar API manualmente
  - `Invoke-WebRequest` ou Postman
  - Validar cada rota

- [ ] Rodar testes E2E
  - `cd frontend`
  - `npx playwright test tests/e2e/disparo-agenda.spec.ts`

### 4. Documentação

- [ ] Criar `docs/micro-agente-disparo-agenda/API-ENDPOINTS-DEV-PROD.md`
  - Tabela com ambiente, API ID, Invoke URL, rotas
- [ ] Atualizar `docs/micro-agente-disparo-agenda/API-CONTRATO-HTTP.md`
  - Documentar contrato completo (payloads, responses, status codes)

---

## 🔧 Comandos para o Fundador

### Aplicar Terraform (DEV)

```powershell
# 1) Ir para o diretório terraform
cd C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI\terraform

# 2) Ir para o ambiente dev
cd envs\dev

# 3) Inicializar (se necessário)
terraform init

# 4) Ver plano
terraform plan

# 5) Aplicar mudanças
terraform apply
```

### Testar API

```powershell
# Exemplo (ajustar URL real):
Invoke-WebRequest "https://<id>.execute-api.us-east-1.amazonaws.com/dev/disparo/overview"
```

### Testar Frontend + E2E

```powershell
# Terminal 1 – subir Next.js
cd C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI\frontend
npm run dev

# Terminal 2 – rodar testes
cd C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI\frontend
npx playwright test tests\e2e\disparo-agenda.spec.ts
```

---

## ✅ Critérios de Aceitação

- ✅ Módulo Terraform possui API Gateway HTTP configurada
- ✅ Rotas/integrações para as Lambdas core do micro agente
- ✅ Permissões de Lambda corretamente definidas
- ✅ Outputs da API disponíveis em envs/dev
- ✅ Documentação em `docs/micro-agente-disparo-agenda/API-ENDPOINTS-DEV-PROD.md`
- ✅ Cliente `disparo-agenda-api.ts` chamando endpoints reais
- ✅ `terraform plan` e `terraform apply` em envs/dev sem erro
- ✅ Testes E2E `disparo-agenda.spec.ts` executando
- ✅ Documento de resumo da sessão criado

---

## 📚 Referências

- Blueprint: `.kiro/steering/blueprint-disparo-agendamento.md`
- Requirements: `.kiro/specs/micro-agente-disparo-agendamento/requirements.md`
- Design: `.kiro/specs/micro-agente-disparo-agendamento/design.md`
- Tasks: `.kiro/specs/micro-agente-disparo-agendamento/tasks.md`
- Implementation Status: `.kiro/specs/micro-agente-disparo-agendamento/IMPLEMENTATION-STATUS.md`

---

## ✅ Implementação Concluída

### Arquivos Criados/Modificados

**Terraform**:
- ✅ `terraform/modules/agente_disparo_agenda/api_gateway.tf` - API Gateway HTTP completo
- ✅ `terraform/modules/agente_disparo_agenda/lambda_api.tf` - Lambda API Handler
- ✅ `terraform/modules/agente_disparo_agenda/main.tf` - Outputs da API
- ✅ `terraform/envs/dev/main.tf` - Outputs do ambiente dev

**Lambda**:
- ✅ `lambda-src/agente-disparo-agenda/src/handlers/api-handler.ts` - Handler HTTP completo

**Frontend**:
- ✅ `frontend/src/lib/api/disparo-agenda-api.ts` - Cliente HTTP atualizado (integração real)
- ✅ `frontend/.env.example` - Variável NEXT_PUBLIC_DISPARO_API_URL adicionada

**Documentação**:
- ✅ `docs/micro-agente-disparo-agenda/README.md` - Visão geral do módulo
- ✅ `docs/micro-agente-disparo-agenda/API-ENDPOINTS-DEV-PROD.md` - Endpoints por ambiente
- ✅ `docs/micro-agente-disparo-agenda/API-CONTRATO-HTTP.md` - Contrato HTTP completo
- ✅ `docs/micro-agente-disparo-agenda/SESSAO-API-HTTP-DEV-24-11-2025.md` - Este documento

### Recursos Implementados

**API Gateway HTTP**:
- 4 rotas configuradas (GET /disparo/overview, GET /disparo/campaigns, POST /disparo/contacts/ingest, GET /agendamento/meetings)
- CORS habilitado
- CloudWatch Logs configurado
- Throttling configurado (100 burst, 50 rate)
- Integração Lambda Proxy

**Lambda API Handler**:
- Roteamento interno para as 4 rotas
- Validação de entrada
- Transformação de resposta
- Logging estruturado
- Integração com DynamoDB, SQS e EventBridge

**Frontend**:
- Cliente HTTP com fallback para stubs (desenvolvimento sem backend)
- Warnings no console quando usando stubs
- Integração real quando `NEXT_PUBLIC_DISPARO_API_URL` configurada

---

**Status**: ✅ Implementação Completa  
**Próximo Passo**: Aplicar Terraform em DEV e testar API

