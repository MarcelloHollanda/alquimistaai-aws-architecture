# Micro Agente de Disparo Automático & Agendamento

**Versão**: 1.0.0  
**Status**: 🟡 API HTTP Implementada (Aguardando Deploy DEV)

---

## 📋 Visão Geral

Sistema integrado de disparo automático de mensagens e agendamento inteligente de reuniões para o ecossistema Alquimista.AI.

**Componentes Principais**:
1. **Disparo Automático**: Envio massivo via WhatsApp, Email e SMS
2. **Agendamento Inteligente**: Gestão automatizada de reuniões
3. **API HTTP**: Endpoints REST para integração com frontend

---

## 🏗️ Arquitetura

```
Frontend (Next.js)
    ↓ HTTP
API Gateway HTTP (AWS)
    ↓ Lambda Proxy Integration
Lambda API Handler (Node.js 20)
    ↓ EventBridge / SQS
Lambdas Core (ingest, send, handle, schedule)
    ↓
DynamoDB / Aurora / MCP Servers
```

---

## 📡 API HTTP

### Endpoints Disponíveis

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/disparo/overview` | Contadores agregados |
| GET | `/disparo/campaigns` | Lista campanhas |
| POST | `/disparo/contacts/ingest` | Envia contatos para processamento |
| GET | `/agendamento/meetings` | Lista reuniões agendadas |

**Documentação Completa**:
- [API Endpoints (DEV/PROD)](./API-ENDPOINTS-DEV-PROD.md)
- [Contrato HTTP Completo](./API-CONTRATO-HTTP.md)

---

## 🚀 Deploy

### Pré-requisitos

1. **Terraform** >= 1.6.0
2. **AWS CLI** configurado
3. **Node.js** 20.x
4. **Secrets Manager** configurado:
   - `/repo/terraform/agente-disparo-agenda/whatsapp`
   - `/repo/terraform/agente-disparo-agenda/email`
   - `/repo/terraform/agente-disparo-agenda/calendar`

### Deploy em DEV

```powershell
# 1. Ir para o diretório terraform
cd terraform/envs/dev

# 2. Inicializar (primeira vez)
terraform init

# 3. Ver plano
terraform plan

# 4. Aplicar mudanças
terraform apply

# 5. Capturar URL da API
terraform output api_gateway_invoke_url
```

### Configurar Frontend

Após o deploy, adicionar a URL da API no `.env.local` do frontend:

```bash
NEXT_PUBLIC_DISPARO_API_URL=https://<api-id>.execute-api.us-east-1.amazonaws.com/dev
```

---

## 🧪 Testes

### Testar API Manualmente

```powershell
# GET /disparo/overview
Invoke-WebRequest -Uri "https://<api-id>.execute-api.us-east-1.amazonaws.com/dev/disparo/overview"

# POST /disparo/contacts/ingest
$body = @{
  contacts = @(
    @{
      company = "Empresa Teste"
      contactName = "João Silva"
      phone = "+5584997084444"
      email = "joao@teste.com"
    }
  )
} | ConvertTo-Json -Depth 3

Invoke-WebRequest -Uri "https://<api-id>.execute-api.us-east-1.amazonaws.com/dev/disparo/contacts/ingest" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### Testar Frontend + E2E

```powershell
# Terminal 1 - Subir Next.js
cd frontend
npm run dev

# Terminal 2 - Rodar testes E2E
cd frontend
npx playwright test tests/e2e/disparo-agenda.spec.ts
```

---

## 📂 Estrutura de Arquivos

```
.
├── terraform/
│   ├── modules/agente_disparo_agenda/
│   │   ├── main.tf                    # Módulo principal
│   │   ├── api_gateway.tf             # API Gateway HTTP ✅ NOVO
│   │   ├── lambda_api.tf              # Lambda API Handler ✅ NOVO
│   │   ├── lambda_disparo.tf          # Lambda send-messages
│   │   ├── lambda_agendamento.tf      # Lambdas de agendamento
│   │   ├── dynamodb.tf                # Tabelas DynamoDB
│   │   ├── sqs.tf                     # Filas SQS
│   │   ├── eventbridge_*.tf           # EventBridge
│   │   ├── iam.tf                     # Roles e Policies
│   │   └── alarms.tf                  # CloudWatch Alarms
│   └── envs/
│       ├── dev/main.tf                # Ambiente DEV
│       └── prod/main.tf               # Ambiente PROD
│
├── lambda-src/agente-disparo-agenda/
│   └── src/
│       ├── handlers/
│       │   ├── api-handler.ts         # API HTTP Handler ✅ NOVO
│       │   ├── ingest-contacts.ts     # Ingestão de contatos
│       │   ├── send-messages.ts       # Envio de mensagens
│       │   ├── handle-replies.ts      # Processamento de respostas
│       │   └── schedule-meeting.ts    # Agendamento de reuniões
│       ├── types/
│       │   └── common.ts              # Tipos TypeScript
│       └── utils/
│           ├── aws-clients.ts         # Clientes AWS
│           ├── logger.ts              # Logger estruturado
│           ├── mcp-client.ts          # Cliente MCP
│           ├── validation.ts          # Validações
│           └── s3-helper.ts           # Helper S3
│
├── frontend/
│   └── src/
│       ├── app/(dashboard)/disparo-agenda/
│       │   └── page.tsx               # Página principal
│       ├── components/disparo-agenda/
│       │   ├── overview-cards.tsx     # Cards de overview
│       │   ├── campaigns-table.tsx    # Tabela de campanhas
│       │   ├── contacts-upload.tsx    # Upload de contatos
│       │   └── meetings-table.tsx     # Tabela de reuniões
│       └── lib/api/
│           └── disparo-agenda-api.ts  # Cliente HTTP ✅ ATUALIZADO
│
└── docs/micro-agente-disparo-agenda/
    ├── README.md                      # Este arquivo
    ├── API-ENDPOINTS-DEV-PROD.md      # Endpoints por ambiente ✅ NOVO
    ├── API-CONTRATO-HTTP.md           # Contrato completo ✅ NOVO
    └── SESSAO-API-HTTP-DEV-24-11-2025.md  # Resumo da sessão ✅ NOVO
```

---

## 📚 Documentação

### Specs e Design
- [Requirements](../../.kiro/specs/micro-agente-disparo-agendamento/requirements.md)
- [Design](../../.kiro/specs/micro-agente-disparo-agendamento/design.md)
- [Tasks](../../.kiro/specs/micro-agente-disparo-agendamento/tasks.md)
- [Implementation Status](../../.kiro/specs/micro-agente-disparo-agendamento/IMPLEMENTATION-STATUS.md)

### Blueprints e Contexto
- [Blueprint Disparo & Agendamento](../../.kiro/steering/blueprint-disparo-agendamento.md)
- [Contexto Projeto Alquimista](../../.kiro/steering/contexto-projeto-alquimista.md)

### API
- [API Endpoints (DEV/PROD)](./API-ENDPOINTS-DEV-PROD.md)
- [Contrato HTTP Completo](./API-CONTRATO-HTTP.md)

### Sessões de Implementação
- [Sessão: API HTTP DEV (24/11/2025)](./SESSAO-API-HTTP-DEV-24-11-2025.md)

---

## ✅ Status de Implementação

### Infraestrutura Terraform ✅ COMPLETA
- [x] Módulo base
- [x] DynamoDB (5 tabelas)
- [x] SQS (filas + DLQ)
- [x] EventBridge (scheduler + rules)
- [x] IAM (roles + policies)
- [x] CloudWatch Alarms
- [x] **API Gateway HTTP** ✅ NOVO
- [x] **Lambda API Handler** ✅ NOVO

### Lambdas Core ✅ COMPLETAS
- [x] `ingest-contacts.ts`
- [x] `send-messages.ts`
- [x] `handle-replies.ts`
- [x] `schedule-meeting.ts`
- [x] **`api-handler.ts`** ✅ NOVO

### Frontend ✅ PRONTO
- [x] Rota `/dashboard/disparo-agenda`
- [x] Componentes UI
- [x] **Cliente HTTP (integração real)** ✅ ATUALIZADO
- [x] Testes E2E (8 cenários)

### Pendente
- [ ] Deploy Terraform em DEV
- [ ] Testes manuais da API
- [ ] Validação E2E com backend real
- [ ] Deploy em PROD

---

## 🔧 Troubleshooting

### API retorna 404
- Verificar se o Terraform foi aplicado com sucesso
- Verificar se a URL da API está correta no `.env.local`
- Verificar logs do API Gateway: `/aws/apigateway/micro-agente-disparo-agendamento-dev`

### Lambda retorna 500
- Verificar logs da Lambda: `/aws/lambda/micro-agente-disparo-agendamento-dev-api-handler`
- Verificar se as variáveis de ambiente estão configuradas
- Verificar se as permissões IAM estão corretas

### Frontend usa stubs
- Verificar se `NEXT_PUBLIC_DISPARO_API_URL` está configurada no `.env.local`
- Verificar console do navegador para warnings

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Consultar documentação completa em `docs/micro-agente-disparo-agenda/`
2. Verificar logs no CloudWatch
3. Consultar specs em `.kiro/specs/micro-agente-disparo-agendamento/`

---

**Última Atualização**: 2025-11-24  
**Mantido por**: Equipe AlquimistaAI

