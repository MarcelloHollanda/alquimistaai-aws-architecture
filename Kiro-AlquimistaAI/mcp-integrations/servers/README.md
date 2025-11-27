# MCP Servers

This directory contains MCP (Model Context Protocol) server implementations for integrating external services with the Fibonacci ecosystem.

## Available Servers

### WhatsApp MCP Server

**File**: `whatsapp.ts`

**Purpose**: Integration with WhatsApp Business API for sending messages and checking delivery status.

**Features**:
- Send text messages with idempotency support
- Get message delivery status
- Rate limiting (80 messages/second, 1000/minute, 10000/hour)
- Automatic retry with exponential backoff
- API key stored securely in AWS Secrets Manager
- Structured logging with trace IDs

**Usage**:

```typescript
import { createWhatsAppMCPServer } from './servers/whatsapp';

// Create server instance
const whatsapp = createWhatsAppMCPServer({
  secretName: 'fibonacci/mcp/whatsapp',
  timeout: 30000,
  maxRetries: 3,
  rateLimit: {
    messagesPerSecond: 80,
    messagesPerMinute: 1000,
    messagesPerHour: 10000
  }
});

// Send a message
const response = await whatsapp.sendMessage({
  to: '+5511987654321',
  message: 'Hello from Fibonacci!',
  idempotencyKey: 'unique-key-123' // Optional
});

console.log('Message sent:', response.messageId);

// Check message status
const status = await whatsapp.getMessageStatus(response.messageId);
console.log('Message status:', status.status);
```

**Configuration**:

The WhatsApp API key must be stored in AWS Secrets Manager with the following format:

```json
{
  "apiKey": "your-whatsapp-business-api-key"
}
```

To create the secret:

```bash
aws secretsmanager create-secret \
  --name fibonacci/mcp/whatsapp \
  --secret-string '{"apiKey":"YOUR_API_KEY"}'
```

**Rate Limiting**:

The server implements rate limiting to comply with WhatsApp Business API limits:
- 80 messages per second
- 1000 messages per minute
- 10000 messages per hour

When rate limits are reached, the server will automatically wait before sending the next message.

**Idempotency**:

To prevent duplicate messages, the server supports idempotency keys. If you send the same message with the same idempotency key within a short time window, the server will return the cached response instead of sending a duplicate message.

**Error Handling**:

The server classifies errors into retryable and non-retryable:

- **Retryable errors** (will retry with exponential backoff):
  - Network errors (ECONNREFUSED, ETIMEDOUT, etc.)
  - HTTP 5xx errors
  - Rate limit errors (429)

- **Non-retryable errors** (will fail immediately):
  - Invalid parameters
  - Authentication errors
  - Invalid phone number format
  - Message too long (>4096 characters)

**Requirements**: 13.2, 13.7, 13.8, 13.9, 13.10

---

## Future Servers

### Google Calendar MCP Server (Planned)

**File**: `calendar.ts` (to be implemented)

**Purpose**: Integration with Google Calendar API for scheduling meetings.

**Features**:
- Get availability
- Create events
- Update events
- Delete events

### Data Enrichment MCP Server

**File**: `enrichment.ts`

**Purpose**: Integration with data enrichment services (Receita Federal, Google Places, LinkedIn) for enriching lead data.

**Features**:
- CNPJ lookup via Receita Federal API
- Company information via Google Places API
- LinkedIn company profile lookup (optional)
- Result caching to reduce API calls
- Rate limiting per service
- Automatic retry with exponential backoff
- API keys stored securely in AWS Secrets Manager

**Usage**:

```typescript
import { createEnrichmentMCPServer } from './servers/enrichment';

// Create server instance
const enrichment = createEnrichmentMCPServer({
  secretName: 'fibonacci/mcp/enrichment',
  timeout: 30000,
  maxRetries: 3,
  cacheConfig: {
    enabled: true,
    ttlSeconds: 3600, // 1 hour
    maxEntries: 1000
  },
  rateLimits: {
    receitaFederal: { requestsPerMinute: 3 },
    googlePlaces: { requestsPerMinute: 50 },
    linkedIn: { requestsPerMinute: 20 }
  }
});

// Lookup CNPJ data
const cnpjData = await enrichment.lookupCNPJ({
  cnpj: '00.000.000/0001-91' // Formatting is optional
});

// Lookup company via Google Places
const placesData = await enrichment.lookupPlaces({
  query: 'Empresa Exemplo São Paulo',
  location: { lat: -23.5505, lng: -46.6333 },
  radius: 5000 // meters
});

// Lookup LinkedIn profile (optional)
const linkedInData = await enrichment.lookupLinkedIn({
  companyName: 'Empresa Exemplo',
  domain: 'exemplo.com.br'
});

// Enrich company from all sources
const enrichedData = await enrichment.enrichCompany({
  cnpj: '00.000.000/0001-91',
  companyName: 'Empresa Exemplo',
  includeLinkedIn: true
});

console.log('Enriched from sources:', enrichedData.sources);
```

**Configuration**:

The API keys must be stored in AWS Secrets Manager with the following format:

```json
{
  "googlePlacesApiKey": "your-google-places-api-key",
  "linkedInClientId": "your-linkedin-client-id",
  "linkedInClientSecret": "your-linkedin-client-secret",
  "linkedInAccessToken": "your-linkedin-access-token"
}
```

To create the secret:

```bash
aws secretsmanager create-secret \
  --name fibonacci/mcp/enrichment \
  --secret-string '{
    "googlePlacesApiKey": "YOUR_GOOGLE_API_KEY",
    "linkedInClientId": "YOUR_LINKEDIN_CLIENT_ID",
    "linkedInClientSecret": "YOUR_LINKEDIN_CLIENT_SECRET",
    "linkedInAccessToken": "YOUR_LINKEDIN_ACCESS_TOKEN"
  }'
```

**Caching**:

The server implements in-memory caching to reduce API calls:
- CNPJ data cached for 1 hour (configurable)
- Google Places data cached for 1 hour
- LinkedIn data cached for 1 hour
- Maximum 1000 entries per cache (configurable)

**Rate Limiting**:

The server implements rate limiting per service:
- Receita Federal: 3 requests/minute (conservative, free API)
- Google Places: 50 requests/minute (adjust based on your quota)
- LinkedIn: 20 requests/minute (adjust based on your quota)

**Data Sources**:

1. **Receita Federal (CNPJ)**:
   - Free public API via ReceitaWS
   - Returns: company name, legal status, address, activities, size
   - No API key required

2. **Google Places**:
   - Requires Google Cloud API key
   - Returns: name, address, phone, website, rating
   - Paid service (free tier available)

3. **LinkedIn (Optional)**:
   - Requires LinkedIn API access
   - Returns: company profile, industry, size, followers
   - Requires OAuth2 authentication

**Requirements**: 13.4, 13.7, 13.8, 13.9, 13.10

### Sentiment Analysis MCP Server (Planned)

**File**: `sentiment.ts` (to be implemented)

**Purpose**: Integration with AWS Comprehend for sentiment analysis.

**Features**:
- Analyze text sentiment
- Detect language
- Extract key phrases
- Detect entities

---

## Development Guidelines

### Creating a New MCP Server

1. Create a new file in `mcp-integrations/servers/` (e.g., `calendar.ts`)
2. Import the base MCP client: `import { MCPClient, MCPClientConfig, MCPError } from '../base-client'`
3. Define server-specific types and interfaces
4. Implement the server class extending or using MCPClient
5. Implement rate limiting if needed
6. Implement retry logic for transient errors
7. Add structured logging with trace IDs
8. Store credentials in AWS Secrets Manager
9. Export a factory function (e.g., `createCalendarMCPServer`)
10. Update this README with usage examples

### Best Practices

- **Security**: Never hardcode API keys or credentials. Always use AWS Secrets Manager.
- **Logging**: Use structured logging with trace IDs for all operations.
- **Error Handling**: Classify errors as retryable or non-retryable.
- **Rate Limiting**: Implement rate limiting to comply with API provider limits.
- **Idempotency**: Support idempotency keys for operations that should not be duplicated.
- **Validation**: Validate all input parameters before making API calls.
- **Timeouts**: Set appropriate timeouts for all API calls.
- **Retries**: Implement exponential backoff for retryable errors.

### Testing

Each MCP server should have corresponding unit tests in `tests/unit/mcp-integrations/`:

```typescript
describe('WhatsAppMCPServer', () => {
  it('should send message successfully', async () => {
    // Test implementation
  });

  it('should handle rate limiting', async () => {
    // Test implementation
  });

  it('should implement idempotency', async () => {
    // Test implementation
  });
});
```

---

## Troubleshooting

### Error: "Failed to fetch API key from Secrets Manager"

**Cause**: The Lambda function doesn't have permission to read the secret, or the secret doesn't exist.

**Solution**:
1. Verify the secret exists: `aws secretsmanager describe-secret --secret-id fibonacci/mcp/whatsapp`
2. Check Lambda IAM role has `secretsmanager:GetSecretValue` permission
3. Verify the secret name matches the configuration

### Error: "Rate limit exceeded"

**Cause**: Too many messages sent in a short time period.

**Solution**: The server will automatically wait and retry. If this happens frequently, consider:
1. Reducing message sending rate
2. Implementing message queuing
3. Spreading messages over a longer time period

### Error: "Phone number must be in international format"

**Cause**: Phone number doesn't start with `+` or is not in international format.

**Solution**: Format phone numbers as `+[country_code][area_code][number]` (e.g., `+5511987654321`)

### Error: "Message exceeds maximum length"

**Cause**: Message is longer than 4096 characters (WhatsApp limit).

**Solution**: Split long messages into multiple shorter messages.

---

## References

- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [AWS Secrets Manager Documentation](https://docs.aws.amazon.com/secretsmanager/)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
