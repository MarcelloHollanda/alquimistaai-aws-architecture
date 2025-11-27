# Cache Redis - Guia Rápido de Referência

## 🚀 Uso Básico

### 1. Importar Dependências

```typescript
import { getCacheManager, buildCacheKey, CacheTTL } from '../shared/redis-client';
import { Logger } from '../shared/logger';

const logger = new Logger('my-handler');
```

### 2. Implementar Cache no Handler

```typescript
export async function handler(event: APIGatewayProxyEventV2) {
  // Inicializar cache
  const cache = await getCacheManager(logger);

  // Criar chave de cache
  const cacheKey = buildCacheKey('resource', 'operation', { param1, param2 });

  // Usar padrão cache-aside
  const result = await cache.getOrSet(
    cacheKey,
    async () => {
      logger.info('Cache miss - buscando do banco');
      return await fetchFromDatabase();
    },
    CacheTTL.RESOURCE_TYPE // TTL em segundos
  );

  return {
    statusCode: 200,
    headers: {
      'X-Cache-Status': 'HIT', // ou 'MISS'
    },
    body: JSON.stringify(result),
  };
}
```

## 📋 TTLs Disponíveis

```typescript
CacheTTL.TENANT_INFO          // 300s (5 min)
CacheTTL.TENANT_AGENTS        // 300s (5 min)
CacheTTL.TENANT_INTEGRATIONS  // 300s (5 min)
CacheTTL.TENANT_USAGE         // 600s (10 min)
CacheTTL.TENANT_INCIDENTS     // 180s (3 min)
CacheTTL.TENANTS_LIST         // 300s (5 min)
CacheTTL.USAGE_OVERVIEW       // 600s (10 min)
CacheTTL.BILLING_OVERVIEW     // 900s (15 min)
CacheTTL.TENANT_DETAIL        // 300s (5 min)
```

## 🔑 Construção de Chaves

### Padrão
```typescript
buildCacheKey('resource', 'identifier', params)
```

### Exemplos
```typescript
// Lista de tenants com filtros
buildCacheKey('tenants', 'list', { status, plan, limit, offset })
// Resultado: "opdash:dev:tenants:list:limit:50|offset:0|plan:pro|status:active"

// Dados de um tenant específico
buildCacheKey('tenant', tenantId, {})
// Resultado: "opdash:dev:tenant:uuid-123"

// Overview de uso por período
buildCacheKey('usage', 'overview', { period: '30d' })
// Resultado: "opdash:dev:usage:overview:period:30d"
```

## 🛠️ Operações Avançadas

### Invalidar Cache Específico
```typescript
const cache = await getCacheManager();
await cache.delete('tenants:list:...');
```

### Invalidar Todo o Cache
```typescript
const cache = await getCacheManager();
await cache.clear();
```

### Verificar se Existe
```typescript
const cache = await getCacheManager();
const exists = await cache.exists('tenants:list:...');
```

### Obter Métricas
```typescript
const cache = await getCacheManager();
const metrics = cache.getMetrics();

console.log({
  hits: metrics.hits,
  misses: metrics.misses,
  hitRate: metrics.hitRate, // %
});
```

## 🔧 Configuração

### Variáveis de Ambiente
```bash
CACHE_ENABLED=true
REDIS_HOST=alquimista-redis-dev.xxxxx.cache.amazonaws.com
REDIS_PORT=6379
ENV=dev
```

### Desabilitar Cache
```bash
CACHE_ENABLED=false
```

## 📊 Monitoramento

### Header HTTP
Todos os handlers retornam:
```
X-Cache-Status: HIT | MISS
```

### Logs CloudWatch
```json
{
  "operation": "cache.hit",
  "customMetrics": {
    "name": "operational-dashboard",
    "key": "opdash:dev:tenants:list:...",
    "age": 45000
  }
}
```

## ⚡ Performance

| Métrica | Sem Cache | Com Cache (Hit) |
|---------|-----------|-----------------|
| Tempo de resposta | 800-1200ms | 50-100ms |
| Carga no Aurora | Alta | Baixa (-75%) |
| Custo RDS API | Alto | Baixo (-75%) |

## 🚨 Troubleshooting

### Redis não conecta
1. Verificar Security Groups
2. Verificar VPC/Subnets
3. Verificar variáveis de ambiente
4. Sistema usa InMemoryCache como fallback

### Cache não funciona
1. Verificar `CACHE_ENABLED=true`
2. Verificar logs para erros
3. Verificar métricas de hit/miss

### Performance degradada
1. Verificar hit rate (deve ser > 70%)
2. Ajustar TTLs se necessário
3. Verificar tamanho do nó Redis

## 📚 Documentação Completa

Ver: `docs/operational-dashboard/CACHE-IMPLEMENTATION.md`

## 🔗 Arquivos Relacionados

- `lambda/shared/cache-manager.ts` - Interface abstrata
- `lambda/shared/redis-client.ts` - Helper Redis
- `lib/operational-dashboard-stack.ts` - Infraestrutura CDK
