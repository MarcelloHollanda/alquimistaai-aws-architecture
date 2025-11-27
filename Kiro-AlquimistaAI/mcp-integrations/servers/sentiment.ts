import { MCPClient, MCPClientConfig, MCPError, MCPLogger } from '../base-client';

// Type declarations for Node.js globals
declare const require: any;
declare const process: any;
declare const setTimeout: any;

// Use require for uuid and AWS SDK to avoid type issues
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');

/**
 * Sentiment types
 */
export type SentimentType = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'MIXED';

/**
 * Sentiment analysis result
 */
export interface SentimentAnalysisResult {
  sentiment: SentimentType;
  score: number; // 0-100, confidence score
  scores: {
    positive: number;
    neutral: number;
    negative: number;
    mixed: number;
  };
  keywords: string[];
  shouldBlock: boolean; // True if descadastro keywords detected
  blockReason?: string;
}

/**
 * Sentiment analysis parameters
 */
export interface AnalyzeSentimentParams {
  text: string;
  language?: string; // Default: 'pt' (Portuguese)
}

/**
 * Batch sentiment analysis parameters
 */
export interface BatchAnalyzeSentimentParams {
  texts: string[];
  language?: string;
}

/**
 * Batch sentiment analysis result
 */
export interface BatchSentimentAnalysisResult {
  results: SentimentAnalysisResult[];
  errorCount: number;
  errors: Array<{
    index: number;
    error: string;
  }>;
}

/**
 * Sentiment MCP Server configuration
 */
export interface SentimentMCPConfig extends MCPClientConfig {
  region?: string; // AWS region for Comprehend
  batchSize?: number; // Max items per batch (AWS Comprehend limit is 25)
  descadastroKeywords?: string[]; // Custom descadastro keywords
}

/**
 * LGPD descadastro keywords (Brazilian data protection law)
 */
const DEFAULT_DESCADASTRO_KEYWORDS = [
  // Direct requests
  'pare',
  'parar',
  'stop',
  'descadastre',
  'descadastrar',
  'descadastro',
  'remover',
  'remova',
  'excluir',
  'exclua',
  'deletar',
  'delete',
  'cancelar',
  'cancele',
  
  // Negative interest
  'não quero',
  'nao quero',
  'não tenho interesse',
  'nao tenho interesse',
  'sem interesse',
  'não me interessa',
  'nao me interessa',
  
  // LGPD specific
  'lgpd',
  'dados pessoais',
  'privacidade',
  'proteção de dados',
  'protecao de dados',
  
  // Strong refusal
  'nunca mais',
  'me deixe em paz',
  'deixe-me em paz',
  'me deixa em paz',
  'para de me enviar',
  'pare de me enviar',
];

/**
 * Sentiment Analysis MCP Server for integrating with AWS Comprehend
 * 
 * Features:
 * - Sentiment analysis using AWS Comprehend
 * - Batch processing for cost optimization
 * - Descadastro keyword detection (LGPD compliance)
 * - Support for Portuguese language
 * - Retry with exponential backoff
 * - Structured logging with trace_id
 * 
 * Requirements: 13.5, 13.7, 13.8, 13.9, 13.10
 */
export class SentimentMCPServer {
  private readonly mcpClient: MCPClient;
  private readonly comprehend: any;
  private readonly logger: MCPLogger;
  private readonly batchSize: number;
  private readonly descadastroKeywords: string[];

  constructor(config: SentimentMCPConfig = {}) {
    this.mcpClient = new MCPClient(config);
    this.logger = config.logger ?? this.mcpClient['logger'];
    this.batchSize = config.batchSize ?? 25; // AWS Comprehend limit

    // Initialize AWS Comprehend
    this.comprehend = new AWS.Comprehend({
      region: config.region ?? process.env.AWS_REGION ?? 'us-east-1',
      apiVersion: '2017-11-27',
    });

    // Merge custom keywords with defaults
    this.descadastroKeywords = [
      ...DEFAULT_DESCADASTRO_KEYWORDS,
      ...(config.descadastroKeywords ?? []),
    ];

    this.logger.info('SentimentMCPServer initialized', {
      region: config.region ?? process.env.AWS_REGION ?? 'us-east-1',
      batchSize: this.batchSize,
      descadastroKeywordsCount: this.descadastroKeywords.length,
    });
  }

  /**
   * Analyze sentiment of a single text
   * 
   * @param params - Analysis parameters
   * @returns Promise with sentiment analysis result
   * @throws MCPError if analysis fails
   */
  async analyze(
    params: AnalyzeSentimentParams
  ): Promise<SentimentAnalysisResult> {
    const traceId = uuidv4();
    const startTime = Date.now();

    // Validate parameters
    this.validateAnalyzeParams(params);

    const language = params.language ?? 'pt';

    this.logger.info('Sentiment analysis initiated', {
      traceId,
      language,
      textLength: params.text.length,
    });

    try {
      // Detect descadastro keywords first (faster than API call)
      const descadastroDetection = this.detectDescadastro(params.text);

      // Call AWS Comprehend for sentiment analysis
      const comprehendResult = await this.callComprehend(
        params.text,
        language,
        traceId
      );

      // Extract keywords using key phrases detection
      const keywords = await this.extractKeywords(
        params.text,
        language,
        traceId
      );

      const result: SentimentAnalysisResult = {
        sentiment: comprehendResult.Sentiment as SentimentType,
        score: this.calculateConfidenceScore(comprehendResult.SentimentScore),
        scores: {
          positive: Math.round(comprehendResult.SentimentScore.Positive * 100),
          neutral: Math.round(comprehendResult.SentimentScore.Neutral * 100),
          negative: Math.round(comprehendResult.SentimentScore.Negative * 100),
          mixed: Math.round(comprehendResult.SentimentScore.Mixed * 100),
        },
        keywords,
        shouldBlock: descadastroDetection.shouldBlock,
        blockReason: descadastroDetection.reason,
      };

      const duration = Date.now() - startTime;
      this.logger.info('Sentiment analysis succeeded', {
        traceId,
        sentiment: result.sentiment,
        score: result.score,
        shouldBlock: result.shouldBlock,
        duration,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Sentiment analysis failed', error as Error, {
        traceId,
        textLength: params.text.length,
        duration,
      });
      throw error;
    }
  }

  /**
   * Analyze sentiment of multiple texts in batch (cost optimization)
   * 
   * @param params - Batch analysis parameters
   * @returns Promise with batch sentiment analysis results
   * @throws MCPError if batch analysis fails
   */
  async analyzeBatch(
    params: BatchAnalyzeSentimentParams
  ): Promise<BatchSentimentAnalysisResult> {
    const traceId = uuidv4();
    const startTime = Date.now();

    const language = params.language ?? 'pt';

    this.logger.info('Batch sentiment analysis initiated', {
      traceId,
      language,
      textCount: params.texts.length,
    });

    const results: SentimentAnalysisResult[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    try {
      // Split into batches (AWS Comprehend limit is 25 items per batch)
      const batches = this.splitIntoBatches(params.texts, this.batchSize);

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const batchStartIndex = batchIndex * this.batchSize;

        this.logger.debug('Processing batch', {
          traceId,
          batchIndex,
          batchSize: batch.length,
        });

        try {
          // Call AWS Comprehend batch sentiment detection
          const batchResult = await this.callComprehendBatch(
            batch,
            language,
            traceId
          );

          // Process each result in the batch
          for (let i = 0; i < batch.length; i++) {
            const text = batch[i];
            const comprehendResult = batchResult.ResultList[i];

            if (comprehendResult) {
              // Detect descadastro keywords
              const descadastroDetection = this.detectDescadastro(text);

              // Extract keywords (note: batch key phrase detection is separate API call)
              // For cost optimization, we'll skip keyword extraction in batch mode
              // or only extract for texts that need it

              results.push({
                sentiment: comprehendResult.Sentiment as SentimentType,
                score: this.calculateConfidenceScore(
                  comprehendResult.SentimentScore
                ),
                scores: {
                  positive: Math.round(
                    comprehendResult.SentimentScore.Positive * 100
                  ),
                  neutral: Math.round(
                    comprehendResult.SentimentScore.Neutral * 100
                  ),
                  negative: Math.round(
                    comprehendResult.SentimentScore.Negative * 100
                  ),
                  mixed: Math.round(
                    comprehendResult.SentimentScore.Mixed * 100
                  ),
                },
                keywords: [], // Empty in batch mode for cost optimization
                shouldBlock: descadastroDetection.shouldBlock,
                blockReason: descadastroDetection.reason,
              });
            } else {
              // Handle error for this specific item
              const errorItem = batchResult.ErrorList.find(
                (err: any) => err.Index === i
              );
              errors.push({
                index: batchStartIndex + i,
                error: errorItem?.ErrorMessage ?? 'Unknown error',
              });

              // Add placeholder result
              results.push({
                sentiment: 'NEUTRAL',
                score: 0,
                scores: {
                  positive: 0,
                  neutral: 0,
                  negative: 0,
                  mixed: 0,
                },
                keywords: [],
                shouldBlock: false,
              });
            }
          }
        } catch (error) {
          // Handle batch-level error
          this.logger.error('Batch processing failed', error as Error, {
            traceId,
            batchIndex,
          });

          // Add errors for all items in this batch
          for (let i = 0; i < batch.length; i++) {
            errors.push({
              index: batchStartIndex + i,
              error: (error as Error).message,
            });

            // Add placeholder results
            results.push({
              sentiment: 'NEUTRAL',
              score: 0,
              scores: {
                positive: 0,
                neutral: 0,
                negative: 0,
                mixed: 0,
              },
              keywords: [],
              shouldBlock: false,
            });
          }
        }
      }

      const duration = Date.now() - startTime;
      this.logger.info('Batch sentiment analysis completed', {
        traceId,
        totalTexts: params.texts.length,
        successCount: results.length - errors.length,
        errorCount: errors.length,
        duration,
      });

      return {
        results,
        errorCount: errors.length,
        errors,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Batch sentiment analysis failed', error as Error, {
        traceId,
        textCount: params.texts.length,
        duration,
      });
      throw error;
    }
  }

  /**
   * Call AWS Comprehend for single text sentiment analysis
   */
  private async callComprehend(
    text: string,
    language: string,
    traceId: string
  ): Promise<any> {
    try {
      this.logger.debug('Calling AWS Comprehend DetectSentiment', {
        traceId,
        textLength: text.length,
        language,
      });

      const params = {
        Text: text,
        LanguageCode: this.mapLanguageCode(language),
      };

      const result = await this.comprehend.detectSentiment(params).promise();

      return result;
    } catch (error) {
      throw new MCPError(
        `AWS Comprehend error: ${error}`,
        'SENTIMENT_API_ERROR',
        'sentiment',
        'analyze',
        traceId,
        this.isRetryableError(error)
      );
    }
  }

  /**
   * Call AWS Comprehend for batch sentiment analysis
   */
  private async callComprehendBatch(
    texts: string[],
    language: string,
    traceId: string
  ): Promise<any> {
    try {
      this.logger.debug('Calling AWS Comprehend BatchDetectSentiment', {
        traceId,
        batchSize: texts.length,
        language,
      });

      const params = {
        TextList: texts,
        LanguageCode: this.mapLanguageCode(language),
      };

      const result = await this.comprehend
        .batchDetectSentiment(params)
        .promise();

      return result;
    } catch (error) {
      throw new MCPError(
        `AWS Comprehend batch error: ${error}`,
        'SENTIMENT_API_ERROR',
        'sentiment',
        'analyzeBatch',
        traceId,
        this.isRetryableError(error)
      );
    }
  }

  /**
   * Extract keywords using AWS Comprehend key phrases detection
   */
  private async extractKeywords(
    text: string,
    language: string,
    traceId: string
  ): Promise<string[]> {
    try {
      this.logger.debug('Extracting keywords with AWS Comprehend', {
        traceId,
        textLength: text.length,
      });

      const params = {
        Text: text,
        LanguageCode: this.mapLanguageCode(language),
      };

      const result = await this.comprehend.detectKeyPhrases(params).promise();

      // Extract top 5 key phrases with highest score
      const keywords = result.KeyPhrases.sort(
        (a: any, b: any) => b.Score - a.Score
      )
        .slice(0, 5)
        .map((kp: any) => kp.Text);

      return keywords;
    } catch (error) {
      // Don't fail the entire analysis if keyword extraction fails
      this.logger.warn('Keyword extraction failed', {
        traceId,
        error: (error as Error).message,
      });
      return [];
    }
  }

  /**
   * Detect descadastro keywords (LGPD compliance)
   */
  private detectDescadastro(text: string): {
    shouldBlock: boolean;
    reason?: string;
  } {
    const normalizedText = text.toLowerCase().trim();

    for (const keyword of this.descadastroKeywords) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        return {
          shouldBlock: true,
          reason: `Descadastro keyword detected: "${keyword}"`,
        };
      }
    }

    return {
      shouldBlock: false,
    };
  }

  /**
   * Calculate overall confidence score from sentiment scores
   */
  private calculateConfidenceScore(sentimentScore: any): number {
    // Get the highest score among all sentiments
    const scores = [
      sentimentScore.Positive,
      sentimentScore.Neutral,
      sentimentScore.Negative,
      sentimentScore.Mixed,
    ];

    const maxScore = Math.max(...scores);

    // Convert to 0-100 scale
    return Math.round(maxScore * 100);
  }

  /**
   * Map language code to AWS Comprehend format
   */
  private mapLanguageCode(language: string): string {
    const languageMap: Record<string, string> = {
      pt: 'pt',
      'pt-BR': 'pt',
      'pt-br': 'pt',
      portuguese: 'pt',
      en: 'en',
      'en-US': 'en',
      english: 'en',
      es: 'es',
      spanish: 'es',
    };

    return languageMap[language] ?? 'pt';
  }

  /**
   * Split array into batches
   */
  private splitIntoBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];

    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }

    return batches;
  }

  /**
   * Validate analyze parameters
   */
  private validateAnalyzeParams(params: AnalyzeSentimentParams): void {
    if (!params.text) {
      throw new MCPError(
        'Missing required parameter: text',
        'SENTIMENT_INVALID_PARAMS',
        'sentiment',
        'analyze',
        uuidv4(),
        false
      );
    }

    if (params.text.length === 0) {
      throw new MCPError(
        'Text cannot be empty',
        'SENTIMENT_INVALID_PARAMS',
        'sentiment',
        'analyze',
        uuidv4(),
        false
      );
    }

    // AWS Comprehend has a limit of 5000 bytes per text
    const textBytes = Buffer.byteLength(params.text, 'utf8');
    if (textBytes > 5000) {
      throw new MCPError(
        'Text exceeds maximum size of 5000 bytes',
        'SENTIMENT_TEXT_TOO_LONG',
        'sentiment',
        'analyze',
        uuidv4(),
        false
      );
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Network errors are retryable
    if (error instanceof Error) {
      const networkErrorCodes = [
        'ECONNREFUSED',
        'ECONNRESET',
        'ETIMEDOUT',
        'ENOTFOUND',
      ];
      if (networkErrorCodes.some((code) => error.message.includes(code))) {
        return true;
      }
    }

    // AWS SDK errors
    if (error.code) {
      // Throttling errors are retryable
      if (
        error.code === 'ThrottlingException' ||
        error.code === 'TooManyRequestsException' ||
        error.code === 'ProvisionedThroughputExceededException'
      ) {
        return true;
      }

      // Service errors are retryable
      if (
        error.code === 'ServiceUnavailable' ||
        error.code === 'InternalServerError'
      ) {
        return true;
      }
    }

    // HTTP 5xx errors are retryable
    if (error.statusCode >= 500 && error.statusCode < 600) {
      return true;
    }

    return false;
  }
}

/**
 * Create a configured Sentiment MCP server instance
 */
export function createSentimentMCPServer(
  config?: SentimentMCPConfig
): SentimentMCPServer {
  return new SentimentMCPServer(config);
}
