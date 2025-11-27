import { createCache, CacheManager, InMemoryCache } from './cache-manager';
import { Logger } from './logger';

let redisClient: any = null;
let cacheManager: CacheManager | null = null;

/**
 * Inicializa o cliente Redis (ioredis)
 * Usa fallback para InMemoryCache se Redis não estiver disponível
 */
export async function initializeRedisClient(logger?: Logger): Promise<CacheManager> {
  // Se já foi inicializado, retornar instância existente
  if (cacheManager) {
    return cacheManager;
  }

  const cacheEnabled = process.env.CACHE_ENABLED === 'true';
  const redisHost = process.env.REDIS_HOST;
  const redisPort = parseInt(process.env.REDIS_PORT || '6379');

  if (!cacheEnabled || !redisHost) {
    logger?.info('Cache desabilitado ou Redis não configurado, usando InMemoryCache');
    
    cacheManager = new InMemoryCache(
      'operational-dashboard',
      { ttl: 300, prefix: 'opdash', namespace: process.env.ENV || 'dev' },
      logger
    );
    
    return cacheManager;
  }

  try {
    // Importar ioredis dinamicamente
    const Redis = (await import('ioredis')).default;
    
    redisClient = new Redis({
      host: redisHost,
      port: redisPort,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    // Conectar ao Redis
    await redisClient.connect();

    logger?.info('Redis conectado com sucesso', {
      host: redisHost,
      port: redisPort,
    });

    // Criar CacheManager com Redis
    cacheManager = createCache(
      'operational-dashboard',
      { ttl: 300, prefix: 'opdash', namespace: process.env.ENV || 'dev' },
      redisClient,
      logger
    );

    return cacheManager;
  } catch (error) {
    logger?.warn('Falha ao conectar ao Redis, usando InMemoryCache como fallback', {
      error: error instanceof Error ? error.message : String(error),
    });

    // Fallback para InMemoryCache
    cacheManager = new InMemoryCache(
      'operational-dashboard',
      { ttl: 300, prefix: 'opdash', namespace: process.env.ENV || 'dev' },
      logger
    );

    return cacheManager;
  }
}

/**
 * Obtém a instância do CacheManager
 * Inicializa se ainda não foi inicializado
 */
export async function getCacheManager(logger?: Logger): Promise<CacheManager> {
  if (!cacheManager) {
    return await initializeRedisClient(logger);
  }
  return cacheManager;
}

/**
 * Fecha a conexão com o Redis (para cleanup)
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    cacheManager = null;
  }
}

/**
 * Helper para criar chave de cache com padrões consistentes
 */
export function buildCacheKey(resource: string, identifier: string, params?: Record<string, any>): string {
  const parts = [resource, identifier];
  
  if (params && Object.keys(params).length > 0) {
    // Ordenar params para garantir consistência
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    parts.push(sortedParams);
  }
  
  return parts.join(':');
}

/**
 * TTLs recomendados para diferentes tipos de dados
 */
export const CacheTTL = {
  TENANT_INFO: 300,        // 5 minutos
  TENANT_AGENTS: 300,      // 5 minutos
  TENANT_INTEGRATIONS: 300, // 5 minutos
  TENANT_USAGE: 600,       // 10 minutos
  TENANT_INCIDENTS: 180,   // 3 minutos
  TENANTS_LIST: 300,       // 5 minutos
  USAGE_OVERVIEW: 600,     // 10 minutos
  BILLING_OVERVIEW: 900,   // 15 minutos
  TENANT_DETAIL: 300,      // 5 minutos
} as const;
