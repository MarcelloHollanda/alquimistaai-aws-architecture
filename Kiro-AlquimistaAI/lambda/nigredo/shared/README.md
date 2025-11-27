# Nigredo Prospecting Core - Shared Utilities

Este diretório contém utilitários compartilhados para as funções Lambda do Nigredo Prospecting Core.

## Módulos

### 1. validation-schemas.ts

Schemas de validação Zod para entrada de dados em todas as funções Lambda do Nigredo.

**Schemas Disponíveis:**

- `CreateLeadSchema` - Validação para criação de leads
- `ListLeadsQuerySchema` - Validação para parâmetros de listagem
- `GetLeadParamsSchema` - Validação para parâmetros de path
- `PhoneSchema` - Validação de telefone (formato E.164)
- `EmailSchema` - Validação de email (RFC 5322)
- `IPAddressSchema` - Validação de endereço IP

**Funções Auxiliares:**

```typescript
// Validar entrada
const result = validateInput(CreateLeadSchema, data);
if (!result.success) {
  return createValidationErrorResponse(result.errors);
}

// Sanitizar texto (previne XSS)
const cleanText = sanitizeText(userInput);

// Extrair IP do evento API Gateway
const ipAddress = extractIPAddress(event);

// Extrair User-Agent
const userAgent = extractUserAgent(event);

// Extrair Referer
const referer = extractReferer(event);
```

**Exemplo de Uso:**

```typescript
import {
  CreateLeadSchema,
  validateInput,
  createValidationErrorResponse,
  extractIPAddress,
} from './shared/validation-schemas';

export async function handler(event: any) {
  // Parse body
  const body = JSON.parse(event.body);
  
  // Validate input
  const validation = validateInput(CreateLeadSchema, body);
  if (!validation.success) {
    return createValidationErrorResponse(validation.errors);
  }
  
  // Extract metadata
  const ipAddress = extractIPAddress(event);
  const userAgent = extractUserAgent(event);
  
  // Use validated data
  const lead = validation.data;
  // ... process lead
}
```

**Requisitos Atendidos:** 1.3, 5.4

---

### 2. rate-limiter.ts

Utilitário de limitação de taxa baseado em IP usando PostgreSQL.

**Configuração:**

- Limite: 10 submissões por hora por IP
- Janela: 1 hora (rolling window)
- Comportamento em erro: Fail open (permite submissão se DB estiver indisponível)

**Funções Principais:**

```typescript
// Verificar rate limit
const result = await checkRateLimit(ipAddress);
if (!result.allowed) {
  // Rate limit excedido
}

// Forçar rate limit (lança exceção se excedido)
await enforceRateLimit(ipAddress);

// Incrementar contador
await incrementRateLimit(ipAddress);

// Bloquear IP (para abuso)
await blockIPAddress(ipAddress, 24); // 24 horas

// Desbloquear IP
await unblockIPAddress(ipAddress);

// Obter estatísticas
const stats = await getRateLimitStats(ipAddress);

// Limpar registros antigos (executar diariamente)
await cleanupOldRateLimits();
```

**Exemplo de Uso:**

```typescript
import {
  enforceRateLimit,
  incrementRateLimit,
  createRateLimitErrorResponse,
  RateLimitError,
} from './shared/rate-limiter';

export async function handler(event: any) {
  const ipAddress = extractIPAddress(event);
  
  try {
    // Check rate limit
    await enforceRateLimit(ipAddress);
    
    // Process submission
    // ...
    
    // Increment counter
    await incrementRateLimit(ipAddress);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    if (error instanceof RateLimitError) {
      return createRateLimitErrorResponse(error);
    }
    throw error;
  }
}
```

**Headers de Rate Limit:**

A resposta de erro 429 inclui headers padrão:

- `Retry-After` - Segundos até reset da janela
- `X-RateLimit-Limit` - Limite máximo (10)
- `X-RateLimit-Remaining` - Submissões restantes
- `X-RateLimit-Reset` - Timestamp ISO 8601 do reset

**Requisitos Atendidos:** 5.3

---

### 3. webhook-sender.ts

Cliente HTTP com lógica de retry para envio de webhooks ao sistema Fibonacci.

**Configuração:**

- Timeout: 5 segundos
- Retries: 3 tentativas
- Backoff: Exponencial (1s, 2s, 4s)
- Logging: Todas as tentativas são registradas no banco

**Funções Principais:**

```typescript
// Enviar webhook com retry
const response = await sendWebhook(webhookUrl, payload, leadId);
if (!response.success) {
  // Webhook falhou após todas as tentativas
}

// Enviar webhook assíncrono (fire and forget)
await sendWebhookAsync(webhookUrl, payload, leadId);

// Criar payload para lead.created
const payload = createLeadCreatedPayload(lead);

// Obter estatísticas de webhook
const stats = await getWebhookStats(leadId);

// Retentar webhook falhado
const response = await retryFailedWebhook(leadId, webhookUrl, payload);
```

**Exemplo de Uso:**

```typescript
import {
  sendWebhook,
  createLeadCreatedPayload,
  WebhookPayload,
} from './shared/webhook-sender';

export async function handler(event: any) {
  // Create lead in database
  const lead = await createLead(data);
  
  // Create webhook payload
  const payload = createLeadCreatedPayload(lead);
  
  // Send webhook to Fibonacci
  const webhookUrl = process.env.FIBONACCI_WEBHOOK_URL!;
  const response = await sendWebhook(webhookUrl, payload, lead.id);
  
  if (!response.success) {
    logger.warn('Webhook failed after retries', {
      leadId: lead.id,
      error: response.error,
    });
    // Continue anyway - webhook failures shouldn't block lead creation
  }
  
  return {
    statusCode: 201,
    body: JSON.stringify({ id: lead.id }),
  };
}
```

**Payload do Webhook:**

```json
{
  "eventType": "lead.created",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "lead": {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "+5511999999999",
    "company": "Acme Inc",
    "message": "Interessado em seus serviços",
    "utmSource": "google",
    "utmMedium": "cpc",
    "utmCampaign": "brand-campaign",
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Logging de Webhooks:**

Todas as tentativas são registradas na tabela `nigredo_leads.webhook_logs`:

- URL do webhook
- Payload enviado
- Status code da resposta
- Corpo da resposta
- Número da tentativa (1-3)
- Sucesso/falha
- Mensagem de erro (se houver)
- Timestamp

**Requisitos Atendidos:** 2.2, 2.3, 2.4, 2.5

---

## Variáveis de Ambiente

As seguintes variáveis de ambiente devem ser configuradas nas funções Lambda:

```bash
# Database
DB_SECRET_ARN=arn:aws:secretsmanager:region:account:secret:name

# Webhook
FIBONACCI_WEBHOOK_URL=https://api.fibonacci.com/public/nigredo-event
```

---

## Dependências

- `zod` - Validação de schemas
- `pg` - Cliente PostgreSQL
- `@aws-lambda-powertools/logger` - Logging estruturado
- `https` / `http` - Cliente HTTP nativo do Node.js

---

## Testes

Para testar os utilitários:

```bash
# Executar testes unitários
npm test lambda/nigredo/shared/

# Testar validação
npm test lambda/nigredo/shared/validation-schemas.test.ts

# Testar rate limiting
npm test lambda/nigredo/shared/rate-limiter.test.ts

# Testar webhook sender
npm test lambda/nigredo/shared/webhook-sender.test.ts
```

---

## Manutenção

### Limpeza de Rate Limits

Execute diariamente via Lambda agendado:

```typescript
import { cleanupOldRateLimits } from './shared/rate-limiter';

export async function handler() {
  await cleanupOldRateLimits();
  return { statusCode: 200 };
}
```

### Monitoramento de Webhooks

Consultas úteis para monitoramento:

```sql
-- Taxa de sucesso de webhooks (últimas 24h)
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE success = TRUE) as successful,
  ROUND(100.0 * COUNT(*) FILTER (WHERE success = TRUE) / COUNT(*), 2) as success_rate
FROM nigredo_leads.webhook_logs
WHERE sent_at >= NOW() - INTERVAL '24 hours';

-- Webhooks falhados recentes
SELECT lead_id, webhook_url, error_message, sent_at
FROM nigredo_leads.webhook_logs
WHERE success = FALSE
AND sent_at >= NOW() - INTERVAL '1 hour'
ORDER BY sent_at DESC;
```

---

## Segurança

### Prevenção de XSS

Todos os inputs de texto são sanitizados automaticamente pela função `sanitizeText()`:

- Remove tags HTML
- Remove caracteres perigosos (`<`, `>`, `'`, `"`)
- Trim de espaços em branco

### Rate Limiting

- Limite de 10 submissões/hora por IP
- IPs podem ser bloqueados manualmente para abuso
- Fail open em caso de erro no banco (não bloqueia usuários legítimos)

### Webhook Security

- Timeout de 5 segundos previne hanging requests
- Retry com backoff exponencial previne sobrecarga
- Todas as tentativas são logadas para auditoria
- User-Agent customizado para identificação

---

## Troubleshooting

### Rate Limit não está funcionando

1. Verificar se a função `check_rate_limit()` existe no banco
2. Verificar se a tabela `rate_limits` existe
3. Verificar logs do Lambda para erros de conexão com DB
4. Verificar se `DB_SECRET_ARN` está configurado corretamente

### Webhooks falhando

1. Verificar se `FIBONACCI_WEBHOOK_URL` está configurado
2. Verificar conectividade de rede (VPC, Security Groups)
3. Verificar logs na tabela `webhook_logs`
4. Testar URL manualmente com curl
5. Verificar timeout (5s pode ser insuficiente para alguns endpoints)

### Validação rejeitando inputs válidos

1. Verificar formato do telefone (deve ser E.164: +5511999999999)
2. Verificar formato do email (RFC 5322)
3. Verificar tamanho da mensagem (máximo 1000 caracteres)
4. Verificar logs para detalhes do erro de validação

---

## Referências

- [Zod Documentation](https://zod.dev/)
- [E.164 Phone Format](https://en.wikipedia.org/wiki/E.164)
- [RFC 5322 Email Format](https://tools.ietf.org/html/rfc5322)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)
