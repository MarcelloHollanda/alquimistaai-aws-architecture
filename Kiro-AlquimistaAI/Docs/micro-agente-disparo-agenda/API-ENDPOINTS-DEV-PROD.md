# API Endpoints - Micro Agente Disparo & Agendamento

**Versão**: 1.0.0  
**Data**: 24 de Novembro de 2025

---

## 📋 Visão Geral

Este documento lista os endpoints HTTP da API do Micro Agente de Disparo & Agendamento, disponíveis via API Gateway HTTP.

---

## 🌍 Ambientes

| Ambiente | API Gateway ID | Invoke URL Base | Status |
|----------|----------------|-----------------|--------|
| **DEV**  | TBD (após apply) | `https://<id>.execute-api.us-east-1.amazonaws.com/dev` | 🟡 Pendente Deploy |
| **PROD** | TBD | `https://<id>.execute-api.us-east-1.amazonaws.com/prod` | ⚪ Não Deployado |

> **Nota**: Os valores reais serão preenchidos após `terraform apply` em cada ambiente.

---

## 📡 Rotas Disponíveis

### 1. GET /disparo/overview

**Descrição**: Retorna contadores agregados do sistema de disparo e agendamento.

**Request**:
```http
GET /disparo/overview HTTP/1.1
Host: <api-id>.execute-api.us-east-1.amazonaws.com
```

**Response** (200 OK):
```json
{
  "contactsInQueue": 0,
  "messagesSentToday": 0,
  "meetingsScheduled": 0,
  "meetingsConfirmed": 0
}
```

**Campos**:
- `contactsInQueue` (number): Contatos aguardando processamento
- `messagesSentToday` (number): Mensagens enviadas hoje
- `meetingsScheduled` (number): Reuniões agendadas (total)
- `meetingsConfirmed` (number): Reuniões confirmadas

---

### 2. GET /disparo/campaigns

**Descrição**: Lista campanhas de disparo ativas e recentes.

**Request**:
```http
GET /disparo/campaigns HTTP/1.1
Host: <api-id>.execute-api.us-east-1.amazonaws.com
```

**Response** (200 OK):
```json
[
  {
    "id": "camp-123",
    "name": "Campanha Q4 2025",
    "status": "active",
    "channel": "whatsapp",
    "messagesSent": 150,
    "messagesTotal": 500,
    "nextRun": "2025-11-25T10:00:00Z"
  }
]
```

**Campos**:
- `id` (string): ID único da campanha
- `name` (string): Nome da campanha
- `status` (string): Status (`pending`, `active`, `paused`, `completed`)
- `channel` (string): Canal (`whatsapp`, `email`, `sms`)
- `messagesSent` (number): Mensagens já enviadas
- `messagesTotal` (number): Total de mensagens planejadas
- `nextRun` (string, opcional): Próxima execução (ISO 8601)

---

### 3. POST /disparo/contacts/ingest

**Descrição**: Envia lote de contatos para ingestão e processamento.

**Request**:
```http
POST /disparo/contacts/ingest HTTP/1.1
Host: <api-id>.execute-api.us-east-1.amazonaws.com
Content-Type: application/json

{
  "contacts": [
    {
      "company": "Empresa XYZ Ltda",
      "contactName": "João Silva",
      "phone": "+5584997084444",
      "email": "joao@empresa.com",
      "notes": "Lead quente - interessado em demo"
    }
  ]
}
```

**Response** (202 Accepted):
```json
{
  "success": true,
  "message": "1 contatos enviados para processamento"
}
```

**Validações**:
- Cada contato deve ter: `company`, `contactName`, `phone`, `email`
- `notes` é opcional
- Telefone deve estar em formato internacional (ex: `+5584997084444`)
- Email deve ser válido

**Erros**:
- `400 Bad Request`: Payload inválido ou campos obrigatórios faltando
- `500 Internal Server Error`: Falha ao processar contatos

---

### 4. GET /agendamento/meetings

**Descrição**: Lista reuniões agendadas.

**Request**:
```http
GET /agendamento/meetings HTTP/1.1
Host: <api-id>.execute-api.us-east-1.amazonaws.com
```

**Response** (200 OK):
```json
[
  {
    "id": "meet-456",
    "leadName": "João Silva",
    "leadCompany": "Empresa XYZ Ltda",
    "scheduledAt": "2025-11-26T14:00:00Z",
    "duration": 60,
    "meetingType": "demo",
    "status": "confirmed",
    "meetingLink": "https://meet.google.com/abc-defg-hij"
  }
]
```

**Campos**:
- `id` (string): ID único da reunião
- `leadName` (string): Nome do lead
- `leadCompany` (string): Empresa do lead
- `scheduledAt` (string): Data/hora agendada (ISO 8601)
- `duration` (number): Duração em minutos
- `meetingType` (string): Tipo (`demo`, `discovery`, `negotiation`, `closing`)
- `status` (string): Status (`proposed`, `confirmed`, `cancelled`, `completed`, `no_show`)
- `meetingLink` (string, opcional): Link da reunião (Google Meet, etc.)

---

## 🔐 Autenticação

**Status Atual**: Sem autenticação (DEV)

**Planejado para PROD**:
- Cognito User Pool
- JWT tokens via Authorization header
- API Key para integrações externas

---

## 🚨 Códigos de Status HTTP

| Código | Significado | Quando Ocorre |
|--------|-------------|---------------|
| 200 | OK | Requisição bem-sucedida (GET) |
| 202 | Accepted | Requisição aceita para processamento assíncrono (POST) |
| 400 | Bad Request | Payload inválido ou campos obrigatórios faltando |
| 404 | Not Found | Rota não encontrada |
| 500 | Internal Server Error | Erro interno do servidor |

---

## 🧪 Testando a API

### Usando PowerShell (Windows)

```powershell
# GET /disparo/overview
Invoke-WebRequest -Uri "https://<api-id>.execute-api.us-east-1.amazonaws.com/dev/disparo/overview" -Method GET

# POST /disparo/contacts/ingest
$body = @{
  contacts = @(
    @{
      company = "Empresa Teste"
      contactName = "João Silva"
      phone = "+5584997084444"
      email = "joao@teste.com"
      notes = "Lead de teste"
    }
  )
} | ConvertTo-Json -Depth 3

Invoke-WebRequest -Uri "https://<api-id>.execute-api.us-east-1.amazonaws.com/dev/disparo/contacts/ingest" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### Usando cURL (Linux/Mac)

```bash
# GET /disparo/overview
curl https://<api-id>.execute-api.us-east-1.amazonaws.com/dev/disparo/overview

# POST /disparo/contacts/ingest
curl -X POST https://<api-id>.execute-api.us-east-1.amazonaws.com/dev/disparo/contacts/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "contacts": [
      {
        "company": "Empresa Teste",
        "contactName": "João Silva",
        "phone": "+5584997084444",
        "email": "joao@teste.com",
        "notes": "Lead de teste"
      }
    ]
  }'
```

---

## 📚 Referências

- **Blueprint**: `.kiro/steering/blueprint-disparo-agendamento.md`
- **Design**: `.kiro/specs/micro-agente-disparo-agendamento/design.md`
- **Terraform Module**: `terraform/modules/agente_disparo_agenda/api_gateway.tf`
- **Lambda Handler**: `lambda-src/agente-disparo-agenda/src/handlers/api-handler.ts`

---

**Última Atualização**: 2025-11-24  
**Mantido por**: Equipe AlquimistaAI

