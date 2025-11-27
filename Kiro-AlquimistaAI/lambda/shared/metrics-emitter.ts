import { CloudWatch } from 'aws-sdk';

/**
 * Helper para emitir métricas customizadas para o CloudWatch
 */

const cloudwatch = new CloudWatch();
const NAMESPACE = 'AlquimistaAI/OperationalDashboard';

/**
 * Dimensão de métrica
 */
export interface MetricDimension {
  Name: string;
  Value: string;
}

/**
 * Opções para emissão de métrica
 */
export interface EmitMetricOptions {
  /**
   * Nome da métrica
   */
  metricName: string;

  /**
   * Valor da métrica
   */
  value: number;

  /**
   * Unidade da métrica
   */
  unit?: 'Count' | 'Milliseconds' | 'Seconds' | 'Percent' | 'Bytes';

  /**
   * Dimensões da métrica
   */
  dimensions?: MetricDimension[];

  /**
   * Timestamp da métrica (padrão: agora)
   */
  timestamp?: Date;

  /**
   * Namespace customizado (padrão: AlquimistaAI/OperationalDashboard)
   */
  namespace?: string;
}

/**
 * Emitir uma métrica customizada para o CloudWatch
 */
export async function emitMetric(options: EmitMetricOptions): Promise<void> {
  try {
    await cloudwatch.putMetricData({
      Namespace: options.namespace || NAMESPACE,
      MetricData: [{
        MetricName: options.metricName,
        Value: options.value,
        Unit: options.unit || 'Count',
        Timestamp: options.timestamp || new Date(),
        Dimensions: options.dimensions || []
      }]
    }).promise();
  } catch (error) {
    console.error('Failed to emit metric:', error);
    // Não lançar erro para não quebrar o fluxo principal
  }
}

/**
 * Emitir múltiplas métricas em batch
 */
export async function emitMetricsBatch(metrics: EmitMetricOptions[]): Promise<void> {
  if (metrics.length === 0) return;

  try {
    // CloudWatch aceita até 20 métricas por chamada
    const chunks = chunkArray(metrics, 20);

    for (const chunk of chunks) {
      await cloudwatch.putMetricData({
        Namespace: chunk[0].namespace || NAMESPACE,
        MetricData: chunk.map(m => ({
          MetricName: m.metricName,
          Value: m.value,
          Unit: m.unit || 'Count',
          Timestamp: m.timestamp || new Date(),
          Dimensions: m.dimensions || []
        }))
      }).promise();
    }
  } catch (error) {
    console.error('Failed to emit metrics batch:', error);
  }
}

/**
 * Helpers específicos para métricas do Painel Operacional
 */

/**
 * Emitir métrica de chamada de API de tenant
 */
export async function emitTenantAPICall(
  tenantId: string,
  endpoint: string,
  statusCode: number,
  duration: number
): Promise<void> {
  await emitMetricsBatch([
    {
      metricName: 'TenantAPICall',
      value: 1,
      dimensions: [
        { Name: 'TenantId', Value: tenantId },
        { Name: 'Endpoint', Value: endpoint },
        { Name: 'StatusCode', Value: statusCode.toString() }
      ]
    },
    {
      metricName: 'APILatency',
      value: duration,
      unit: 'Milliseconds',
      dimensions: [
        { Name: 'Endpoint', Value: endpoint },
        { Name: 'StatusCode', Value: statusCode.toString() }
      ]
    }
  ]);
}

/**
 * Emitir métrica de chamada de API interna
 */
export async function emitInternalAPICall(
  userId: string,
  endpoint: string,
  statusCode: number,
  duration: number
): Promise<void> {
  await emitMetricsBatch([
    {
      metricName: 'InternalAPICall',
      value: 1,
      dimensions: [
        { Name: 'UserId', Value: userId },
        { Name: 'Endpoint', Value: endpoint },
        { Name: 'StatusCode', Value: statusCode.toString() }
      ]
    },
    {
      metricName: 'APILatency',
      value: duration,
      unit: 'Milliseconds',
      dimensions: [
        { Name: 'Endpoint', Value: endpoint },
        { Name: 'StatusCode', Value: statusCode.toString() }
      ]
    }
  ]);
}

/**
 * Emitir métrica de comando operacional criado
 */
export async function emitOperationalCommandCreated(
  commandType: string,
  tenantId?: string
): Promise<void> {
  await emitMetric({
    metricName: 'OperationalCommandCreated',
    value: 1,
    dimensions: [
      { Name: 'CommandType', Value: commandType },
      { Name: 'TenantId', Value: tenantId || 'global' }
    ]
  });
}

/**
 * Emitir métrica de comando operacional bem-sucedido
 */
export async function emitOperationalCommandSuccess(
  commandType: string,
  duration: number
): Promise<void> {
  await emitMetricsBatch([
    {
      metricName: 'OperationalCommandSuccess',
      value: 1,
      dimensions: [
        { Name: 'CommandType', Value: commandType }
      ]
    },
    {
      metricName: 'OperationalCommandDuration',
      value: duration,
      unit: 'Milliseconds',
      dimensions: [
        { Name: 'CommandType', Value: commandType }
      ]
    }
  ]);
}

/**
 * Emitir métrica de comando operacional com erro
 */
export async function emitOperationalCommandError(
  commandType: string,
  errorType: string
): Promise<void> {
  await emitMetric({
    metricName: 'OperationalCommandError',
    value: 1,
    dimensions: [
      { Name: 'CommandType', Value: commandType },
      { Name: 'ErrorType', Value: errorType }
    ]
  });
}

/**
 * Emitir métrica de cache hit
 */
export async function emitCacheHit(cacheKey: string): Promise<void> {
  await emitMetric({
    metricName: 'CacheHit',
    value: 1,
    dimensions: [
      { Name: 'CacheKey', Value: cacheKey }
    ]
  });
}

/**
 * Emitir métrica de cache miss
 */
export async function emitCacheMiss(cacheKey: string): Promise<void> {
  await emitMetric({
    metricName: 'CacheMiss',
    value: 1,
    dimensions: [
      { Name: 'CacheKey', Value: cacheKey }
    ]
  });
}

/**
 * Emitir métrica de falha de autorização
 */
export async function emitAuthorizationFailure(
  userId: string,
  endpoint: string,
  reason: string
): Promise<void> {
  await emitMetric({
    metricName: 'AuthorizationFailure',
    value: 1,
    dimensions: [
      { Name: 'UserId', Value: userId },
      { Name: 'Endpoint', Value: endpoint },
      { Name: 'Reason', Value: reason }
    ]
  });
}

/**
 * Emitir métrica de violação de isolamento de tenant
 */
export async function emitTenantIsolationViolation(
  userId: string,
  requestedTenantId: string,
  actualTenantId: string
): Promise<void> {
  await emitMetric({
    metricName: 'TenantIsolationViolation',
    value: 1,
    dimensions: [
      { Name: 'UserId', Value: userId },
      { Name: 'RequestedTenantId', Value: requestedTenantId },
      { Name: 'ActualTenantId', Value: actualTenantId }
    ]
  });
}

/**
 * Emitir métrica de agregação de métricas
 */
export async function emitMetricsAggregation(
  date: string,
  tenantsProcessed: number,
  duration: number
): Promise<void> {
  await emitMetricsBatch([
    {
      metricName: 'MetricsAggregationRun',
      value: 1,
      dimensions: [
        { Name: 'Date', Value: date }
      ]
    },
    {
      metricName: 'MetricsAggregationTenants',
      value: tenantsProcessed,
      dimensions: [
        { Name: 'Date', Value: date }
      ]
    },
    {
      metricName: 'MetricsAggregationDuration',
      value: duration,
      unit: 'Milliseconds',
      dimensions: [
        { Name: 'Date', Value: date }
      ]
    }
  ]);
}

/**
 * Utility: dividir array em chunks
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Classe para acumular métricas e emitir em batch
 */
export class MetricsBuffer {
  private metrics: EmitMetricOptions[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private maxBufferSize: number;
  private autoFlushInterval: number;

  constructor(maxBufferSize: number = 20, autoFlushInterval: number = 5000) {
    this.maxBufferSize = maxBufferSize;
    this.autoFlushInterval = autoFlushInterval;
    this.startAutoFlush();
  }

  /**
   * Adicionar métrica ao buffer
   */
  add(metric: EmitMetricOptions): void {
    this.metrics.push(metric);
    if (this.metrics.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  /**
   * Emitir todas as métricas acumuladas
   */
  async flush(): Promise<void> {
    if (this.metrics.length === 0) return;

    const metricsToEmit = [...this.metrics];
    this.metrics = [];

    await emitMetricsBatch(metricsToEmit);
  }

  /**
   * Iniciar flush automático
   */
  private startAutoFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.autoFlushInterval);
  }

  /**
   * Parar flush automático
   */
  stopAutoFlush(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  /**
   * Destruir buffer (flush final e parar auto-flush)
   */
  async destroy(): Promise<void> {
    this.stopAutoFlush();
    await this.flush();
  }
}
