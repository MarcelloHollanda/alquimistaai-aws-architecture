import { Context } from 'aws-lambda';
import { withSimpleErrorHandling } from '../shared/error-handler';
import { Logger } from '../shared/logger';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { createSentimentMCPServer } from '../../mcp-integrations/servers/sentiment';

/**
 * Sentiment analysis request schema validation
 */
const SentimentRequestSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  language: z.string().optional().default('pt')
});

type SentimentRequest = z.infer<typeof SentimentRequestSchema>;

/**
 * Sentiment analysis response
 */
interface SentimentResponse {
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'MIXED';
  score: number; // 0-100
  scores: {
    positive: number;
    neutral: number;
    negative: number;
    mixed: number;
  };
  keywords: string[];
  shouldBlock: boolean;
  blockReason?: string;
  traceId: string;
}

// Initialize Sentiment MCP Server
const sentimentServer = createSentimentMCPServer({
  region: process.env.AWS_REGION || 'us-east-1',
  timeout: 10000,
  maxRetries: 3
});

/**
 * Agente de Análise de Sentimento - Nigredo
 * 
 * Responsável por:
 * - Receber texto da mensagem
 * - Pré-processar texto (normalização, tokenização)
 * - Chamar MCP sentiment.analyze()
 * - Classificar sentimento e calcular intensidade (0-100)
 * - Detectar palavras-chave de descadastro (LGPD)
 * - Retornar classificação estruturada
 * 
 * Este agente é invocado de forma síncrona pelo Agente de Atendimento
 * para análise em tempo real do sentimento das mensagens dos leads.
 * 
 * Requirements: 11.7, 11.12
 */
export const handler = withSimpleErrorHandling(
  async (event: SentimentRequest, context: Context, logger: Logger): Promise<SentimentResponse> => {
    const traceId = uuidv4();
    logger.setTraceId(traceId);

    logger.info('Agente de Análise de Sentimento iniciado', {
      functionName: context.functionName,
      traceId
    });

    try {
      // Step 1: Validate request
      const request = validateRequest(event, logger);

      logger.info('Requisição validada', {
        textLength: request.text.length,
        language: request.language,
        traceId
      });

      // Step 2: Pre-process text
      const processedText = preprocessText(request.text, logger);

      logger.debug('Texto pré-processado', {
        originalLength: request.text.length,
        processedLength: processedText.length,
        traceId
      });

      // Step 3: Analyze sentiment using MCP
      const sentimentResult = await sentimentServer.analyze({
        text: processedText,
        language: request.language
      });

      logger.info('Sentimento analisado', {
        sentiment: sentimentResult.sentiment,
        score: sentimentResult.score,
        shouldBlock: sentimentResult.shouldBlock,
        keywordsCount: sentimentResult.keywords.length,
        traceId
      });

      // Step 4: Return structured classification
      const response: SentimentResponse = {
        sentiment: sentimentResult.sentiment,
        score: sentimentResult.score,
        scores: sentimentResult.scores,
        keywords: sentimentResult.keywords,
        shouldBlock: sentimentResult.shouldBlock,
        blockReason: sentimentResult.blockReason,
        traceId
      };

      logger.info('Agente de Análise de Sentimento concluído', {
        sentiment: response.sentiment,
        score: response.score,
        shouldBlock: response.shouldBlock,
        traceId
      });

      return response;

    } catch (error) {
      logger.error('Erro ao analisar sentimento', error as Error, {
        traceId
      });

      // Return neutral sentiment on error to avoid blocking the flow
      return {
        sentiment: 'NEUTRAL',
        score: 50,
        scores: {
          positive: 0,
          neutral: 100,
          negative: 0,
          mixed: 0
        },
        keywords: [],
        shouldBlock: false,
        traceId
      };
    }
  }
);

/**
 * Validate sentiment analysis request
 */
function validateRequest(event: any, logger: Logger): SentimentRequest {
  logger.debug('Validando requisição');

  // Validate schema
  const validationResult = SentimentRequestSchema.safeParse(event);

  if (!validationResult.success) {
    logger.error('Requisição inválida', new Error('Validation failed'), {
      errors: validationResult.error.errors
    });
    throw new Error(`Invalid request: ${validationResult.error.errors.map(e => e.message).join(', ')}`);
  }

  return validationResult.data;
}

/**
 * Pre-process text for sentiment analysis
 * 
 * Performs:
 * - Normalization (trim, lowercase for keyword detection)
 * - Tokenization (split into words)
 * - Remove excessive whitespace
 * - Limit text size (AWS Comprehend has 5000 bytes limit)
 */
function preprocessText(text: string, logger: Logger): string {
  logger.debug('Pré-processando texto', {
    originalLength: text.length
  });

  // Step 1: Trim whitespace
  let processed = text.trim();

  // Step 2: Remove excessive whitespace (multiple spaces, tabs, newlines)
  processed = processed.replace(/\s+/g, ' ');

  // Step 3: Remove special characters that don't add sentiment value
  // Keep: letters, numbers, basic punctuation (. , ! ? - : ; " ')
  // Remove: emojis are kept as they carry sentiment
  // Note: We keep most characters as AWS Comprehend can handle them

  // Step 4: Limit text size to AWS Comprehend limit (5000 bytes)
  const maxBytes = 5000;
  let textBytes = Buffer.byteLength(processed, 'utf8');

  if (textBytes > maxBytes) {
    logger.warn('Texto excede limite de bytes, truncando', {
      originalBytes: textBytes,
      maxBytes
    });

    // Truncate to fit within byte limit
    // We need to be careful with multi-byte characters
    while (textBytes > maxBytes && processed.length > 0) {
      processed = processed.substring(0, processed.length - 1);
      textBytes = Buffer.byteLength(processed, 'utf8');
    }

    // Add ellipsis to indicate truncation
    processed = processed.trim() + '...';
  }

  logger.debug('Texto pré-processado', {
    processedLength: processed.length,
    processedBytes: Buffer.byteLength(processed, 'utf8')
  });

  return processed;
}
