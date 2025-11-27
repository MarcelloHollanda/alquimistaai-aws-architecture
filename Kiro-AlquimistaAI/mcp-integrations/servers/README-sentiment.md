# Sentiment Analysis MCP Server

## Overview

The Sentiment Analysis MCP Server provides sentiment analysis capabilities using AWS Comprehend, with built-in LGPD compliance through descadastro keyword detection.

## Features

- **Sentiment Analysis**: Analyze text sentiment using AWS Comprehend (POSITIVE, NEUTRAL, NEGATIVE, MIXED)
- **Batch Processing**: Process multiple texts in a single API call for cost optimization (up to 25 texts per batch)
- **Keyword Extraction**: Extract key phrases from text using AWS Comprehend
- **LGPD Compliance**: Automatic detection of descadastro keywords (Brazilian data protection law)
- **Multi-language Support**: Supports Portuguese, English, and Spanish
- **Retry Logic**: Exponential backoff for transient errors
- **Structured Logging**: All operations logged with trace_id for debugging

## Requirements

- AWS Comprehend access in your AWS account
- IAM permissions for `comprehend:DetectSentiment`, `comprehend:BatchDetectSentiment`, and `comprehend:DetectKeyPhrases`
- Node.js 18+ with TypeScript support

## Installation

```bash
npm install
```

## Usage

### Single Text Analysis

```typescript
import { createSentimentMCPServer } from './mcp-integrations/servers/sentiment';

const sentimentServer = createSentimentMCPServer({
  region: 'us-east-1',
  timeout: 30000,
  maxRetries: 3,
});

const result = await sentimentServer.analyze({
  text: 'Adorei o produto! Muito bom!',
  language: 'pt',
});

console.log(result);
// {
//   sentiment: 'POSITIVE',
//   score: 98,
//   scores: {
//     positive: 98,
//     neutral: 1,
//     negative: 1,
//     mixed: 0
//   },
//   keywords: ['produto', 'bom'],
//   shouldBlock: false
// }
```

### Batch Analysis (Cost Optimization)

```typescript
const batchResult = await sentimentServer.analyzeBatch({
  texts: [
    'Adorei o produto!',
    'Não gostei do atendimento.',
    'Produto ok, nada demais.',
  ],
  language: 'pt',
});

console.log(batchResult);
// {
//   results: [
//     { sentiment: 'POSITIVE', score: 98, ... },
//     { sentiment: 'NEGATIVE', score: 85, ... },
//     { sentiment: 'NEUTRAL', score: 75, ... }
//   ],
//   errorCount: 0,
//   errors: []
// }
```

### LGPD Descadastro Detection

```typescript
const result = await sentimentServer.analyze({
  text: 'Pare de me enviar mensagens! Quero descadastrar.',
  language: 'pt',
});

console.log(result.shouldBlock); // true
console.log(result.blockReason); // 'Descadastro keyword detected: "pare"'
```

## Configuration

### SentimentMCPConfig

```typescript
interface SentimentMCPConfig {
  region?: string; // AWS region (default: 'us-east-1')
  timeout?: number; // Request timeout in ms (default: 30000)
  maxRetries?: number; // Max retry attempts (default: 3)
  batchSize?: number; // Max items per batch (default: 25, AWS limit)
  descadastroKeywords?: string[]; // Custom descadastro keywords
  logger?: MCPLogger; // Custom logger implementation
}
```

### Custom Descadastro Keywords

```typescript
const sentimentServer = createSentimentMCPServer({
  descadastroKeywords: [
    'unsubscribe',
    'opt out',
    'remove me',
    // Custom keywords will be merged with defaults
  ],
});
```

## Default Descadastro Keywords

The server includes comprehensive Portuguese keywords for LGPD compliance:

- **Direct requests**: pare, parar, stop, descadastre, descadastrar, remover, excluir, deletar, cancelar
- **Negative interest**: não quero, não tenho interesse, sem interesse
- **LGPD specific**: lgpd, dados pessoais, privacidade, proteção de dados
- **Strong refusal**: nunca mais, me deixe em paz, para de me enviar

## AWS Comprehend Pricing

### Single Text Analysis
- $0.0001 per unit (100 characters)
- Example: 1000 texts of 500 chars = $0.50

### Batch Analysis (Recommended)
- Same pricing but more efficient
- Reduces API calls by up to 25x
- Example: 1000 texts in 40 batches = same cost, fewer API calls

### Key Phrase Detection
- $0.0001 per unit (100 characters)
- Only called for single text analysis (not batch)

## Cost Optimization Tips

1. **Use Batch Processing**: Process multiple texts in a single API call
2. **Skip Keyword Extraction**: Disable for batch processing to reduce costs
3. **Cache Results**: Implement caching for frequently analyzed texts
4. **Filter Before Analysis**: Use descadastro detection before calling AWS Comprehend

## Error Handling

The server automatically retries transient errors:

- Network errors (ECONNREFUSED, ETIMEDOUT, etc.)
- AWS throttling errors (ThrottlingException, TooManyRequestsException)
- Service errors (ServiceUnavailable, InternalServerError)
- HTTP 5xx errors

Non-retryable errors:
- Invalid parameters (empty text, text too long)
- Authentication errors
- Invalid language code

## Logging

All operations are logged with structured JSON format:

```json
{
  "level": "INFO",
  "message": "Sentiment analysis succeeded",
  "traceId": "uuid-v4",
  "sentiment": "POSITIVE",
  "score": 98,
  "shouldBlock": false,
  "duration": 245
}
```

## Integration with Nigredo Agents

### Agente de Atendimento

```typescript
// In lambda/agents/atendimento.ts
import { createSentimentMCPServer } from '../../mcp-integrations/servers/sentiment';

const sentimentServer = createSentimentMCPServer();

// Analyze lead response
const sentiment = await sentimentServer.analyze({
  text: leadMessage,
  language: 'pt',
});

// Check for descadastro
if (sentiment.shouldBlock) {
  await handleDescadastro(leadId, sentiment.blockReason);
  return;
}

// Adjust response tone based on sentiment
const responseTone = sentiment.sentiment === 'NEGATIVE' ? 'empathetic' : 'professional';
```

### Agente de Análise de Sentimento

```typescript
// In lambda/agents/sentimento.ts
import { createSentimentMCPServer } from '../../mcp-integrations/servers/sentiment';

export const handler = async (event: any) => {
  const sentimentServer = createSentimentMCPServer();
  
  const result = await sentimentServer.analyze({
    text: event.message,
    language: 'pt',
  });
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      sentiment: result.sentiment,
      score: result.score,
      shouldBlock: result.shouldBlock,
      blockReason: result.blockReason,
    }),
  };
};
```

## Testing

### Unit Tests

```typescript
import { createSentimentMCPServer } from './sentiment';

describe('SentimentMCPServer', () => {
  it('should detect positive sentiment', async () => {
    const server = createSentimentMCPServer();
    const result = await server.analyze({
      text: 'Adorei o produto!',
      language: 'pt',
    });
    
    expect(result.sentiment).toBe('POSITIVE');
    expect(result.score).toBeGreaterThan(80);
  });
  
  it('should detect descadastro keywords', async () => {
    const server = createSentimentMCPServer();
    const result = await server.analyze({
      text: 'Pare de me enviar mensagens!',
      language: 'pt',
    });
    
    expect(result.shouldBlock).toBe(true);
  });
});
```

## IAM Permissions

Required IAM policy for Lambda execution role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "comprehend:DetectSentiment",
        "comprehend:BatchDetectSentiment",
        "comprehend:DetectKeyPhrases"
      ],
      "Resource": "*"
    }
  ]
}
```

## Troubleshooting

### Error: "Text exceeds maximum size of 5000 bytes"

AWS Comprehend has a limit of 5000 bytes per text. Split long texts into smaller chunks.

### Error: "ThrottlingException"

You've exceeded AWS Comprehend rate limits. The server will automatically retry with exponential backoff.

### Error: "InvalidRequestException: Invalid language"

Ensure you're using a supported language code: 'pt', 'en', or 'es'.

## References

- [AWS Comprehend Documentation](https://docs.aws.amazon.com/comprehend/)
- [AWS Comprehend Pricing](https://aws.amazon.com/comprehend/pricing/)
- [LGPD - Brazilian Data Protection Law](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd)

## Requirements Mapping

This implementation satisfies the following requirements:

- **13.5**: MCP server for sentiment analysis integration
- **13.7**: API credentials stored in AWS Secrets Manager (via IAM roles)
- **13.8**: Retry logic with exponential backoff
- **13.9**: Structured logging with trace_id for all MCP calls
- **13.10**: Error handling and alerting for failed integrations
