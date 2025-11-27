/**
 * Funções Auxiliares para Testes de Performance
 */

import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

/**
 * Métricas customizadas
 */
export const errorRate = new Rate('errors');
export const responseTime = new Trend('response_time');
export const requestCount = new Counter('requests');
export const cacheHitRate = new Rate('cache_hits');

/**
 * Verifica resposta HTTP e registra métricas
 */
export function checkResponse(response, name, expectedStatus = 200) {
  const success = check(response, {
    [`${name}: status ${expectedStatus}`]: (r) => r.status === expectedStatus,
    [`${name}: tem body`]: (r) => r.body && r.body.length > 0,
    [`${name}: tempo < 2s`]: (r) => r.timings.duration < 2000,
  });
  
  // Registrar métricas
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
  requestCount.add(1);
  
  // Verificar se resposta veio do cache
  const fromCache = response.headers['X-Cache'] === 'HIT' || 
                    response.headers['x-cache'] === 'HIT';
  if (fromCache) {
    cacheHitRate.add(1);
  } else {
    cacheHitRate.add(0);
  }
  
  return success;
}

/**
 * Verifica resposta de API com validação de estrutura
 */
export function checkApiResponse(response, name, requiredFields = []) {
  let body;
  try {
    body = JSON.parse(response.body);
  } catch (e) {
    console.error(`${name}: Erro ao parsear JSON`);
    errorRate.add(1);
    return false;
  }
  
  const checks = {
    [`${name}: status 200`]: (r) => r.status === 200,
    [`${name}: é JSON válido`]: () => body !== null,
  };
  
  // Adicionar checks para campos obrigatórios
  requiredFields.forEach(field => {
    checks[`${name}: tem campo ${field}`] = () => body[field] !== undefined;
  });
  
  const success = check(response, checks);
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
  requestCount.add(1);
  
  return success;
}

/**
 * Verifica resposta de lista paginada
 */
export function checkPaginatedResponse(response, name) {
  return checkApiResponse(response, name, ['items', 'total', 'limit', 'offset']);
}

/**
 * Verifica resposta de erro
 */
export function checkErrorResponse(response, name, expectedStatus) {
  const success = check(response, {
    [`${name}: status ${expectedStatus}`]: (r) => r.status === expectedStatus,
    [`${name}: tem mensagem de erro`]: (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.error || body.message;
      } catch (e) {
        return false;
      }
    },
  });
  
  errorRate.add(!success);
  return success;
}

/**
 * Sleep com variação para simular comportamento humano
 */
export function thinkTime(min = 1, max = 5) {
  const duration = Math.random() * (max - min) + min;
  sleep(duration);
}

/**
 * Retry com backoff exponencial
 */
export function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1) {
  let retries = 0;
  let delay = initialDelay;
  
  while (retries < maxRetries) {
    try {
      return fn();
    } catch (error) {
      retries++;
      if (retries >= maxRetries) {
        throw error;
      }
      console.warn(`Tentativa ${retries} falhou, aguardando ${delay}s...`);
      sleep(delay);
      delay *= 2; // Backoff exponencial
    }
  }
}

/**
 * Formata URL com query params
 */
export function buildUrl(baseUrl, path, params = {}) {
  const url = `${baseUrl}${path}`;
  const queryString = Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== null)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  
  return queryString ? `${url}?${queryString}` : url;
}

/**
 * Log estruturado para debugging
 */
export function logDebug(message, data = {}) {
  if (__ENV.DEBUG === 'true') {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'DEBUG',
      message,
      ...data,
    }));
  }
}

/**
 * Log de erro
 */
export function logError(message, error, context = {}) {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    message,
    error: error.message || error,
    stack: error.stack,
    ...context,
  }));
}

/**
 * Valida estrutura de resposta
 */
export function validateResponseStructure(body, schema) {
  for (const [key, type] of Object.entries(schema)) {
    if (body[key] === undefined) {
      return { valid: false, error: `Campo ${key} ausente` };
    }
    
    if (typeof body[key] !== type) {
      return { 
        valid: false, 
        error: `Campo ${key} deveria ser ${type}, mas é ${typeof body[key]}` 
      };
    }
  }
  
  return { valid: true };
}

/**
 * Calcula percentil de um array
 */
export function percentile(arr, p) {
  if (arr.length === 0) return 0;
  
  const sorted = arr.slice().sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  
  return sorted[index];
}

/**
 * Calcula estatísticas de um array
 */
export function calculateStats(arr) {
  if (arr.length === 0) {
    return { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0 };
  }
  
  const sorted = arr.slice().sort((a, b) => a - b);
  const sum = arr.reduce((a, b) => a + b, 0);
  
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: sum / arr.length,
    p50: percentile(arr, 50),
    p95: percentile(arr, 95),
    p99: percentile(arr, 99),
  };
}

/**
 * Formata duração em ms para string legível
 */
export function formatDuration(ms) {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  } else {
    return `${(ms / 60000).toFixed(2)}m`;
  }
}

/**
 * Formata bytes para string legível
 */
export function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes}B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)}KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
  }
}

/**
 * Gera relatório de resumo
 */
export function generateSummary(data) {
  const summary = {
    'Total de Requisições': data.metrics.http_reqs.values.count,
    'Taxa de Erro': `${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%`,
    'Duração Média': formatDuration(data.metrics.http_req_duration.values.avg),
    'P95': formatDuration(data.metrics.http_req_duration.values['p(95)']),
    'P99': formatDuration(data.metrics.http_req_duration.values['p(99)']),
    'Throughput': `${data.metrics.http_reqs.values.rate.toFixed(2)} req/s`,
  };
  
  if (data.metrics.cache_hits) {
    summary['Cache Hit Rate'] = `${(data.metrics.cache_hits.values.rate * 100).toFixed(2)}%`;
  }
  
  return summary;
}

/**
 * Valida thresholds manualmente
 */
export function validateThresholds(metrics, thresholds) {
  const results = {};
  
  for (const [metric, conditions] of Object.entries(thresholds)) {
    results[metric] = conditions.map(condition => {
      // Parse condition (ex: "p(95)<2000")
      const match = condition.match(/^(\w+)(<|>|<=|>=)(\d+)$/);
      if (!match) return { condition, passed: false, error: 'Formato inválido' };
      
      const [, stat, operator, threshold] = match;
      const value = metrics[metric]?.values[stat];
      
      if (value === undefined) {
        return { condition, passed: false, error: 'Métrica não encontrada' };
      }
      
      let passed = false;
      switch (operator) {
        case '<': passed = value < parseFloat(threshold); break;
        case '>': passed = value > parseFloat(threshold); break;
        case '<=': passed = value <= parseFloat(threshold); break;
        case '>=': passed = value >= parseFloat(threshold); break;
      }
      
      return { condition, passed, value, threshold: parseFloat(threshold) };
    });
  }
  
  return results;
}

/**
 * Exporta métricas para arquivo JSON
 */
export function exportMetrics(data, filename) {
  const metrics = {
    timestamp: new Date().toISOString(),
    summary: generateSummary(data),
    detailed: data.metrics,
  };
  
  // Em k6, usar --out json=filename.json na linha de comando
  return metrics;
}

/**
 * Configuração padrão de requisição HTTP
 */
export const defaultHttpConfig = {
  timeout: '30s',
  headers: {
    'User-Agent': 'k6-load-test/1.0',
  },
};

/**
 * Tags padrão para requisições
 */
export function getDefaultTags(endpoint, method = 'GET') {
  return {
    endpoint,
    method,
    test_type: __ENV.TEST_TYPE || 'load',
    environment: __ENV.TEST_ENV || 'dev',
  };
}
