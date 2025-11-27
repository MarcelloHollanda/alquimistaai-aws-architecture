# Status da Integração Nigredo ↔ Fibonacci

## ✅ RESUMO EXECUTIVO

**A integração entre Nigredo e Fibonacci JÁ ESTÁ COMPLETA no código Lambda.**

O que falta é apenas a infraestrutura Terraform para fazer o deploy.

---

## 📊 Status Atual

### ✅ Código Lambda (100% Completo)

| Componente | Status | Arquivo |
|------------|--------|---------|
| **Fibonacci - Receptor** | ✅ Implementado | `lambda/fibonacci/handle-nigredo-event.ts` |
| **Nigredo - Emissor** | ✅ Implementado | `lambda/nigredo/shared/webhook-sender.ts` |
| **Nigredo - Integração** | ✅ Implementado | `lambda/nigredo/create-lead.ts` |
| **Validação de Payload** | ✅ Implementado | Zod schemas |
| **Retry Logic** | ✅ Implementado | Exponential backoff (3 tentativas) |
| **Logging** | ✅ Implementado | Structured logging + X-Ray |
| **Idempotência** | ✅ Implementado | Por email no Fibonacci |
| **Rate Limiting** | ✅ Implementado | 10 req/hora por IP |

### ⚠️ Infraestrutura (Pendente)

| Componente | Status | Ação Necessária |
|------------|--------|-----------------|
| **Terraform Modules** | ❌ Não existe | Criar `terraform/modules/` |
| **Terraform Envs** | ❌ Não existe | Criar `terraform/envs/dev` e `prod` |
| **Secrets Manager** | ⚠️ Verificar | Criar secrets se não existirem |
| **API Gateway** | ⚠️ CDK atual | Migrar para Terraform |
| **Lambda Deploy** | ⚠️ CDK atual | Migrar para Terraform |

---

## 🔄 Fluxo de Integração (Já Implementado)

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUXO COMPLETO                           │
└─────────────────────────────────────────────────────────────┘

1. Usuário preenche formulário no Nigredo Frontend
   ↓
2. POST /api/leads → Nigredo API (create-lead.ts)
   ↓
3. Nigredo valida dados (Zod schema)
   ↓
4. Nigredo verifica rate limit (10/hora por IP)
   ↓
5. Nigredo insere lead no banco (schema nigredo_leads)
   ↓
6. Nigredo envia webhook para Fibonacci
   │
   ├─ URL: FIBONACCI_WEBHOOK_URL/public/nigredo-event
   ├─ Payload: { eventType, timestamp, lead }
   ├─ Retry: 3 tentativas (1s, 2s, 4s)
   └─ Log: Salva em nigredo_leads.webhook_logs
   ↓
7. Fibonacci recebe webhook (handle-nigredo-event.ts)
   ↓
8. Fibonacci valida signature HMAC (opcional)
   ↓
9. Fibonacci armazena lead (schema nigredo_leads.leads)
   ↓
10. Fibonacci publica evento no EventBridge
    ↓
11. Agentes Nigredo são acionados (via EventBridge)
```

---

## 🎯 O que você precisa fazer

### Opção A: Deploy com CDK (Rápido)

Se você quer fazer deploy **agora** sem esperar Terraform:

1. O código CDK já existe em `lib/`
2. Basta rodar:
   ```bash
   cdk deploy NigredoStack-dev
   cdk deploy FibonacciStack-dev
   ```
3. Configurar secrets no Secrets Manager
4. Testar integração

### Opção B: Migrar para Terraform (Recomendado)

Se você quer seguir o padrão Terraform que mencionou:

1. **Criar estrutura Terraform** (veja `TERRAFORM-MIGRATION-GUIDE.md`)
2. **Criar módulos**:
   - `terraform/modules/app_fibonacci_api/`
   - `terraform/modules/app_nigredo_api/`
   - `terraform/modules/app_nigredo_frontend/`
3. **Instanciar em envs**:
   - `terraform/envs/dev/main.tf`
   - `terraform/envs/prod/main.tf`
4. **Deploy**:
   ```bash
   cd terraform/envs/dev
   terraform init
   terraform plan
   terraform apply
   ```

---

## 🔐 Secrets Necessários

### 1. Fibonacci - Webhook Secret

**Path:** `/repo/aws/fibonacci/nigredo-webhook-secret`

**Valor:** Token HMAC para validar webhooks do Nigredo

**Criar:**
```bash
aws secretsmanager create-secret \
  --name /repo/aws/fibonacci/nigredo-webhook-secret \
  --secret-string "$(openssl rand -hex 32)" \
  --region us-east-1
```

### 2. Nigredo - Fibonacci Integration

**Path:** `/repo/aws/nigredo/fibonacci-integration`

**Valor:**
```json
{
  "FIBONACCI_API_BASE_URL": "https://api-prod.fibonacci.alquimista.ai",
  "FIBONACCI_NIGREDO_TOKEN": "seu-token-aqui"
}
```

**Criar:**
```bash
aws secretsmanager create-secret \
  --name /repo/aws/nigredo/fibonacci-integration \
  --secret-string '{
    "FIBONACCI_API_BASE_URL": "https://api-prod.fibonacci.alquimista.ai",
    "FIBONACCI_NIGREDO_TOKEN": "token-seguro"
  }' \
  --region us-east-1
```

---

## 🧪 Como Testar

### 1. Testar criação de lead

```bash
curl -X POST https://api-nigredo-dev.alquimista.ai/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "+5511999999999",
    "company": "Acme Corp",
    "message": "Teste de integração"
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Lead created successfully",
  "data": {
    "id": "uuid-do-lead",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. Verificar webhook no Fibonacci

```bash
# Ver logs do Lambda
aws logs tail /aws/lambda/dev-fibonacci-handle-nigredo-event --follow

# Verificar lead no banco
psql -h <aurora-endpoint> -U <user> -d fibonacci -c \
  "SELECT * FROM nigredo_leads.leads WHERE email = 'joao@example.com';"
```

### 3. Verificar logs de webhook no Nigredo

```sql
SELECT 
  wl.id,
  wl.lead_id,
  wl.webhook_url,
  wl.status_code,
  wl.success,
  wl.attempt_number,
  wl.error_message,
  wl.sent_at
FROM nigredo_leads.webhook_logs wl
JOIN nigredo_leads.leads l ON l.id = wl.lead_id
WHERE l.email = 'joao@example.com'
ORDER BY wl.sent_at DESC;
```

---

## 📈 Monitoramento

### Métricas Disponíveis

**Nigredo:**
- `LeadCreated` - Total de leads criados
- `WebhookSuccess` - Webhooks enviados com sucesso
- `WebhookFailure` - Webhooks que falharam
- `RateLimitExceeded` - Requisições bloqueadas por rate limit

**Fibonacci:**
- `LeadReceived` - Leads recebidos via webhook
- `EventPublished` - Eventos publicados no EventBridge

### CloudWatch Logs

**Nigredo:**
- `/aws/lambda/dev-nigredo-create-lead`
- `/aws/lambda/dev-nigredo-list-leads`
- `/aws/lambda/dev-nigredo-get-lead`

**Fibonacci:**
- `/aws/lambda/dev-fibonacci-handle-nigredo-event`

### X-Ray Traces

Ambos os sistemas têm X-Ray habilitado para rastreamento distribuído:
- Ver traces no console: https://console.aws.amazon.com/xray/
- Filtrar por `correlationId` para seguir uma requisição end-to-end

---

## 🐛 Troubleshooting

### Webhook não está sendo enviado

**Verificar:**
1. `FIBONACCI_WEBHOOK_URL` está configurado?
   ```bash
   aws lambda get-function-configuration \
     --function-name dev-nigredo-create-lead \
     --query 'Environment.Variables.FIBONACCI_WEBHOOK_URL'
   ```

2. Logs do Nigredo mostram tentativa de envio?
   ```bash
   aws logs tail /aws/lambda/dev-nigredo-create-lead --follow
   ```

3. Tabela `webhook_logs` tem registros?
   ```sql
   SELECT * FROM nigredo_leads.webhook_logs ORDER BY sent_at DESC LIMIT 10;
   ```

### Webhook está falhando

**Verificar:**
1. URL do Fibonacci está correta?
2. Fibonacci está respondendo?
   ```bash
   curl -X POST https://api-fibonacci-dev.alquimista.ai/public/nigredo-event \
     -H "Content-Type: application/json" \
     -d '{"eventType":"lead.created","timestamp":"2024-01-15T10:00:00Z","lead":{"id":"test","name":"Test","email":"test@test.com"}}'
   ```

3. Logs do Fibonacci mostram erro?
   ```bash
   aws logs tail /aws/lambda/dev-fibonacci-handle-nigredo-event --follow
   ```

### Lead não aparece no Fibonacci

**Verificar:**
1. Webhook foi enviado com sucesso?
2. Fibonacci processou sem erros?
3. Lead está na tabela `nigredo_leads.leads`?
   ```sql
   SELECT * FROM nigredo_leads.leads ORDER BY created_at DESC LIMIT 10;
   ```

---

## 📚 Documentação Relacionada

- [API Documentation](./API.md) - Documentação completa da API Nigredo
- [Deployment Guide](./DEPLOYMENT.md) - Guia de deploy
- [Operations Guide](./OPERATIONS.md) - Guia operacional
- [Terraform Migration Guide](./TERRAFORM-MIGRATION-GUIDE.md) - Guia de migração para Terraform
- [Integration Testing](./INTEGRATION-TESTING.md) - Testes de integração

---

## ✅ Checklist de Deploy

### Pré-Deploy
- [ ] Código Lambda revisado e testado
- [ ] Secrets criados no Secrets Manager
- [ ] Infraestrutura Terraform criada (ou CDK pronta)
- [ ] Variáveis de ambiente documentadas
- [ ] Testes de integração escritos

### Deploy
- [ ] Deploy do Fibonacci (receptor)
- [ ] Deploy do Nigredo (emissor)
- [ ] Configurar URLs e tokens
- [ ] Testar integração end-to-end

### Pós-Deploy
- [ ] Monitorar logs por 24h
- [ ] Verificar métricas no CloudWatch
- [ ] Testar cenários de erro
- [ ] Documentar URLs de produção
- [ ] Treinar equipe de operações

---

**Status:** ✅ Código completo, aguardando infraestrutura  
**Última atualização:** 2024-01-15  
**Versão:** 1.0
