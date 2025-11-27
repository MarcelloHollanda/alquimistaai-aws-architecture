/**
 * Simple Rate Limiter - Implementação em memória para testes
 * 
 * Para produção, usar Redis/ElastiCache
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Verifica rate limit
 * 
 * @param key - Chave única (IP, tenant_id, etc.)
 * @param limit - Número máximo de requisições
 * @param windowSeconds - Janela de tempo em segundos
 * @returns true se bloqueado, false se permitido
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  
  // Se não existe ou expirou, criar nova entrada
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + (windowSeconds * 1000)
    });
    return false; // Permitido
  }
  
  // Se atingiu o limite, bloquear
  if (entry.count >= limit) {
    return true; // Bloqueado
  }
  
  // Incrementar contador
  entry.count++;
  rateLimitStore.set(key, entry);
  
  return false; // Permitido
}

/**
 * Limpa entradas expiradas (manutenção)
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Reseta rate limit para uma chave específica
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Limpa todo o store (para testes)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}
