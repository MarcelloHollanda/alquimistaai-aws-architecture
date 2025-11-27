import { SQSEvent, SQSRecord, SQSBatchResponse, SQSBatchItemFailure } from 'aws-lambda';
import { Logger } from './logger';
import { addMetadata, addAnnotations } from './xray-tracer';

const logger = new Logger('batch-processor');

/**
 * Batch processing options
 */
interface BatchOptions {
  maxBatchSize?: number;
  maxBatchWaitMs?: number;
  maxRetries?: number;
  partialFailureEnabled?: boolean;
  parallelProcessing?: boolean;
  maxConcurrency?: number;
}

/**
 * Batch processing result
 */
interface BatchResult<T> {
  successful: T[];
  failed: Array<{ item: any; error: Error }>;
  totalProcessed: number;
  totalFailed: number;
  processingTime: number;
}

/**
 * Batch processor for efficient event processing
 */
export class BatchProcessor {
  private readonly defaultOptions: Required<BatchOptions> = {
    maxBatchSize: 10,
    maxBatchWaitMs: 5000,
    maxRetries: 3,
    partialFailureEnabled: true,
    parallelProcessing: true,
    maxConcurrency: 5,
  };

  constructor(private options: BatchOptions = {}) {
    this.options = { ...this.defaultOptions, ...options };
  }

  /**
   * Process SQS batch with partial failure handling
   */
  async processSQSBatch<T = any>(
    event: SQSEvent,
    processor: (record: SQSRecord) => Promise<T>
  ): Promise<SQSBatchResponse> {
    logger.info('Processing SQS batch', {
      recordCount: event.Records.length,
      parallelProcessing: this.options.parallelProcessing,
    });

    const startTime = Date.now();
    const failures: SQSBatchItemFailure[] = [];

    try {
      if (this.options.parallelProcessing) {
        // Process records in parallel with concurrency limit
        await this.processInParallel(
          event.Records,
          async (record) => {
            try {
              await processor(record);
            } catch (error) {
              logger.error('Failed to process SQS record', error as Error, {
                messageId: record.messageId,
              });
              failures.push({ itemIdentifier: record.messageId });
            }
          },
          this.options.maxConcurrency!
        );
      } else {
        // Process records sequentially
        for (const record of event.Records) {
          try {
            await processor(record);
          } catch (error) {
            logger.error('Failed to process SQS record', error as Error, {
              messageId: record.messageId,
            });
            failures.push({ itemIdentifier: record.messageId });
          }
        }
      }

      const processingTime = Date.now() - startTime;
      const successCount = event.Records.length - failures.length;

      logger.info('SQS batch processing completed', {
        total: event.Records.length,
        successful: successCount,
        failed: failures.length,
        processingTime,
      });

      addMetadata({
        batchSize: event.Records.length,
        successCount,
        failureCount: failures.length,
        processingTime,
      }, 'batch-processor');

      addAnnotations({
        batchProcessed: true,
        batchSize: event.Records.length,
        failureRate: (failures.length / event.Records.length) * 100,
      });

      // Return partial failure response if enabled
      if (this.options.partialFailureEnabled && failures.length > 0) {
        return { batchItemFailures: failures };
      }

      // Throw error if any failures and partial failure not enabled
      if (failures.length > 0) {
        throw new Error(`Batch processing failed: ${failures.length} items failed`);
      }

      return { batchItemFailures: [] };
    } catch (error) {
      logger.error('Batch processing error', error as Error);
      throw error;
    }
  }

  /**
   * Process items in batches
   */
  async processBatch<TInput, TOutput>(
    items: TInput[],
    processor: (item: TInput) => Promise<TOutput>
  ): Promise<BatchResult<TOutput>> {
    logger.info('Processing batch', {
      itemCount: items.length,
      batchSize: this.options.maxBatchSize,
    });

    const startTime = Date.now();
    const successful: TOutput[] = [];
    const failed: Array<{ item: TInput; error: Error }> = [];

    // Split into batches
    const batches = this.splitIntoBatches(items, this.options.maxBatchSize!);

    for (const batch of batches) {
      if (this.options.parallelProcessing) {
        // Process batch items in parallel
        const results = await this.processInParallel(
          batch,
          async (item) => {
            try {
              return await this.processWithRetry(item, processor);
            } catch (error) {
              failed.push({ item, error: error as Error });
              return null;
            }
          },
          this.options.maxConcurrency!
        );

        successful.push(...results.filter((r): r is TOutput => r !== null));
      } else {
        // Process batch items sequentially
        for (const item of batch) {
          try {
            const result = await this.processWithRetry(item, processor);
            successful.push(result);
          } catch (error) {
            failed.push({ item, error: error as Error });
          }
        }
      }
    }

    const processingTime = Date.now() - startTime;

    logger.info('Batch processing completed', {
      total: items.length,
      successful: successful.length,
      failed: failed.length,
      processingTime,
    });

    return {
      successful,
      failed,
      totalProcessed: successful.length,
      totalFailed: failed.length,
      processingTime,
    };
  }

  /**
   * Process item with retry logic
   */
  private async processWithRetry<TInput, TOutput>(
    item: TInput,
    processor: (item: TInput) => Promise<TOutput>
  ): Promise<TOutput> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.options.maxRetries!; attempt++) {
      try {
        return await processor(item);
      } catch (error) {
        lastError = error as Error;
        logger.warn('Processing attempt failed', {
          attempt,
          maxRetries: this.options.maxRetries,
          error: lastError.message,
        });

        if (attempt < this.options.maxRetries!) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 100;
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Processing failed after retries');
  }

  /**
   * Process items in parallel with concurrency limit
   */
  private async processInParallel<TInput, TOutput>(
    items: TInput[],
    processor: (item: TInput) => Promise<TOutput>,
    maxConcurrency: number
  ): Promise<TOutput[]> {
    const results: TOutput[] = [];
    const executing: Promise<void>[] = [];

    for (const item of items) {
      const promise = processor(item).then((result) => {
        results.push(result);
      });

      executing.push(promise);

      if (executing.length >= maxConcurrency) {
        await Promise.race(executing);
        executing.splice(
          executing.findIndex((p) => p === promise),
          1
        );
      }
    }

    await Promise.all(executing);
    return results;
  }

  /**
   * Split array into batches
   */
  private splitIntoBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }

    return batches;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Aggregate batch results
   */
  aggregateResults<T>(
    results: BatchResult<T>[],
    aggregator: (items: T[]) => T
  ): T {
    const allSuccessful = results.flatMap((r) => r.successful);
    return aggregator(allSuccessful);
  }
}

/**
 * Create batch processor instance
 */
export function createBatchProcessor(options?: BatchOptions): BatchProcessor {
  return new BatchProcessor(options);
}

/**
 * Process SQS batch with default options
 */
export async function processSQSBatch<T = any>(
  event: SQSEvent,
  processor: (record: SQSRecord) => Promise<T>,
  options?: BatchOptions
): Promise<SQSBatchResponse> {
  const batchProcessor = createBatchProcessor(options);
  return await batchProcessor.processSQSBatch(event, processor);
}

/**
 * Batch writer for efficient bulk operations
 */
export class BatchWriter<T> {
  private buffer: T[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(
    private writer: (items: T[]) => Promise<void>,
    private options: {
      maxBatchSize: number;
      maxWaitMs: number;
    }
  ) {}

  /**
   * Add item to batch
   */
  async add(item: T): Promise<void> {
    this.buffer.push(item);

    // Flush if batch is full
    if (this.buffer.length >= this.options.maxBatchSize) {
      await this.flush();
      return;
    }

    // Schedule flush if not already scheduled
    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        this.flush().catch((error) => {
          logger.error('Auto-flush failed', error);
        });
      }, this.options.maxWaitMs);
    }
  }

  /**
   * Flush buffer
   */
  async flush(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.buffer.length === 0) {
      return;
    }

    const items = [...this.buffer];
    this.buffer = [];

    logger.debug('Flushing batch', { itemCount: items.length });

    try {
      await this.writer(items);
      logger.debug('Batch flushed successfully', { itemCount: items.length });
    } catch (error) {
      logger.error('Failed to flush batch', error as Error, {
        itemCount: items.length,
      });
      throw error;
    }
  }

  /**
   * Get current buffer size
   */
  getBufferSize(): number {
    return this.buffer.length;
  }
}

/**
 * Create batch writer instance
 */
export function createBatchWriter<T>(
  writer: (items: T[]) => Promise<void>,
  options: { maxBatchSize: number; maxWaitMs: number }
): BatchWriter<T> {
  return new BatchWriter(writer, options);
}
