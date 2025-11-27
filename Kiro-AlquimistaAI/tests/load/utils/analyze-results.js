/**
 * Analisador de Resultados de Testes de Performance
 * 
 * Analisa resultados JSON do k6 e gera recomendações
 */

const fs = require('fs');
const path = require('path');

/**
 * Thresholds de referência
 */
const THRESHOLDS = {
  p95: 2000,        // 2 segundos
  p99: 3000,        // 3 segundos
  errorRate: 0.01,  // 1%
  throughput: 10,   // 10 req/s mínimo
};

/**
 * Analisa arquivo de resultados
 */
function analyzeResults(filePath) {
  console.log('='.repeat(80));
  console.log('ANÁLISE DE RESULTADOS DE PERFORMANCE');
  console.log('='.repeat(80));
  console.log(`Arquivo: ${filePath}\n`);
  
  // Ler arquivo
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // Extrair métricas
  const metrics = extractMetrics(data);
  
  // Analisar performance
  const analysis = analyzePerformance(metrics);
  
  // Gerar recomendações
  const recommendations = generateRecommendations(analysis);
  
  // Exibir resultados
  displayResults(metrics, analysis, recommendations);
  
  // Salvar relatório
  saveReport(metrics, analysis, recommendations);
  
  // Retornar código de saída
  return analysis.passed ? 0 : 1;
}

/**
 * Extrai métricas do resultado do k6
 */
function extractMetrics(data) {
  const metrics = data.metrics || {};
  
  return {
    totalRequests: metrics.http_reqs?.values?.count || 0,
    errorRate: metrics.http_req_failed?.values?.rate || 0,
    p50: metrics.http_req_duration?.values?.['p(50)'] || 0,
    p95: metrics.http_req_duration?.values?.['p(95)'] || 0,
    p99: metrics.http_req_duration?.values?.['p(99)'] || 0,
    avg: metrics.http_req_duration?.values?.avg || 0,
    min: metrics.http_req_duration?.values?.min || 0,
    max: metrics.http_req_duration?.values?.max || 0,
    throughput: metrics.http_reqs?.values?.rate || 0,
    dataReceived: metrics.data_received?.values?.count || 0,
    dataSent: metrics.data_sent?.values?.count || 0,
    iterations: metrics.iterations?.values?.count || 0,
    vus: metrics.vus?.values?.value || 0,
    cacheHitRate: metrics.cache_hits?.values?.rate || null,
  };
}

/**
 * Analisa performance baseado nas métricas
 */
function analyzePerformance(metrics) {
  const issues = [];
  let passed = true;
  
  // Verificar P95
  if (metrics.p95 > THRESHOLDS.p95) {
    issues.push({
      severity: 'HIGH',
      metric: 'P95',
      value: metrics.p95,
      threshold: THRESHOLDS.p95,
      message: `P95 (${metrics.p95.toFixed(0)}ms) acima do threshold (${THRESHOLDS.p95}ms)`,
    });
    passed = false;
  }
  
  // Verificar P99
  if (metrics.p99 > THRESHOLDS.p99) {
    issues.push({
      severity: 'MEDIUM',
      metric: 'P99',
      value: metrics.p99,
      threshold: THRESHOLDS.p99,
      message: `P99 (${metrics.p99.toFixed(0)}ms) acima do threshold (${THRESHOLDS.p99}ms)`,
    });
  }
  
  // Verificar taxa de erro
  if (metrics.errorRate > THRESHOLDS.errorRate) {
    issues.push({
      severity: 'HIGH',
      metric: 'Error Rate',
      value: metrics.errorRate,
      threshold: THRESHOLDS.errorRate,
      message: `Taxa de erro (${(metrics.errorRate * 100).toFixed(2)}%) acima do threshold (${THRESHOLDS.errorRate * 100}%)`,
    });
    passed = false;
  }
  
  // Verificar throughput
  if (metrics.throughput < THRESHOLDS.throughput) {
    issues.push({
      severity: 'MEDIUM',
      metric: 'Throughput',
      value: metrics.throughput,
      threshold: THRESHOLDS.throughput,
      message: `Throughput (${metrics.throughput.toFixed(2)} req/s) abaixo do mínimo (${THRESHOLDS.throughput} req/s)`,
    });
  }
  
  // Verificar cache (se disponível)
  if (metrics.cacheHitRate !== null && metrics.cacheHitRate < 0.5) {
    issues.push({
      severity: 'LOW',
      metric: 'Cache Hit Rate',
      value: metrics.cacheHitRate,
      threshold: 0.5,
      message: `Cache hit rate (${(metrics.cacheHitRate * 100).toFixed(2)}%) baixo, considere otimizar cache`,
    });
  }
  
  return {
    passed,
    issues,
    score: calculateScore(metrics, issues),
  };
}

/**
 * Calcula score de performance (0-100)
 */
function calculateScore(metrics, issues) {
  let score = 100;
  
  // Penalizar por issues
  issues.forEach(issue => {
    switch (issue.severity) {
      case 'HIGH':
        score -= 20;
        break;
      case 'MEDIUM':
        score -= 10;
        break;
      case 'LOW':
        score -= 5;
        break;
    }
  });
  
  // Penalizar por P95 alto (mesmo se dentro do threshold)
  if (metrics.p95 > 1500) {
    score -= 5;
  }
  
  // Bonificar por baixa taxa de erro
  if (metrics.errorRate < 0.001) {
    score += 5;
  }
  
  // Bonificar por alto throughput
  if (metrics.throughput > 50) {
    score += 5;
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Gera recomendações baseado na análise
 */
function generateRecommendations(analysis) {
  const recommendations = [];
  
  analysis.issues.forEach(issue => {
    switch (issue.metric) {
      case 'P95':
      case 'P99':
        recommendations.push({
          category: 'Performance',
          priority: issue.severity,
          title: 'Otimizar tempo de resposta',
          actions: [
            'Adicionar índices em queries lentas no banco de dados',
            'Implementar cache Redis para endpoints frequentes',
            'Aumentar memória das funções Lambda',
            'Otimizar queries N+1',
            'Implementar paginação em listas grandes',
          ],
        });
        break;
        
      case 'Error Rate':
        recommendations.push({
          category: 'Confiabilidade',
          priority: issue.severity,
          title: 'Reduzir taxa de erro',
          actions: [
            'Investigar logs de erro no CloudWatch',
            'Adicionar retry logic com backoff exponencial',
            'Implementar circuit breaker',
            'Validar inputs mais rigorosamente',
            'Aumentar timeout de requisições',
          ],
        });
        break;
        
      case 'Throughput':
        recommendations.push({
          category: 'Escalabilidade',
          priority: issue.severity,
          title: 'Aumentar throughput',
          actions: [
            'Aumentar concorrência das funções Lambda',
            'Implementar provisioned concurrency',
            'Otimizar pool de conexões do banco',
            'Usar RDS Proxy para gerenciar conexões',
            'Implementar rate limiting mais eficiente',
          ],
        });
        break;
        
      case 'Cache Hit Rate':
        recommendations.push({
          category: 'Cache',
          priority: issue.severity,
          title: 'Melhorar efetividade do cache',
          actions: [
            'Aumentar TTL do cache para dados estáveis',
            'Implementar cache warming',
            'Adicionar mais endpoints ao cache',
            'Implementar cache em múltiplas camadas',
            'Revisar estratégia de invalidação de cache',
          ],
        });
        break;
    }
  });
  
  // Recomendações gerais
  if (analysis.score < 80) {
    recommendations.push({
      category: 'Geral',
      priority: 'MEDIUM',
      title: 'Melhorias gerais de performance',
      actions: [
        'Executar profiling das funções mais lentas',
        'Revisar configurações de auto-scaling',
        'Implementar monitoramento proativo',
        'Configurar alarmes para métricas críticas',
        'Realizar testes de carga regularmente',
      ],
    });
  }
  
  return recommendations;
}

/**
 * Exibe resultados no console
 */
function displayResults(metrics, analysis, recommendations) {
  // Métricas
  console.log('MÉTRICAS');
  console.log('-'.repeat(80));
  console.log(`Total de Requisições: ${metrics.totalRequests}`);
  console.log(`Taxa de Erro: ${(metrics.errorRate * 100).toFixed(2)}%`);
  console.log(`Throughput: ${metrics.throughput.toFixed(2)} req/s`);
  console.log(`\nTempo de Resposta:`);
  console.log(`  Mínimo: ${metrics.min.toFixed(0)}ms`);
  console.log(`  Médio: ${metrics.avg.toFixed(0)}ms`);
  console.log(`  P50: ${metrics.p50.toFixed(0)}ms`);
  console.log(`  P95: ${metrics.p95.toFixed(0)}ms ${metrics.p95 > THRESHOLDS.p95 ? '⚠️' : '✓'}`);
  console.log(`  P99: ${metrics.p99.toFixed(0)}ms ${metrics.p99 > THRESHOLDS.p99 ? '⚠️' : '✓'}`);
  console.log(`  Máximo: ${metrics.max.toFixed(0)}ms`);
  
  if (metrics.cacheHitRate !== null) {
    console.log(`\nCache Hit Rate: ${(metrics.cacheHitRate * 100).toFixed(2)}%`);
  }
  
  // Score
  console.log(`\n${'='.repeat(80)}`);
  console.log(`SCORE DE PERFORMANCE: ${analysis.score}/100`);
  console.log(`STATUS: ${analysis.passed ? '✓ PASSOU' : '✗ FALHOU'}`);
  console.log('='.repeat(80));
  
  // Issues
  if (analysis.issues.length > 0) {
    console.log(`\nISSUES ENCONTRADOS (${analysis.issues.length})`);
    console.log('-'.repeat(80));
    analysis.issues.forEach((issue, i) => {
      console.log(`${i + 1}. [${issue.severity}] ${issue.message}`);
    });
  } else {
    console.log('\n✓ Nenhum issue encontrado!');
  }
  
  // Recomendações
  if (recommendations.length > 0) {
    console.log(`\nRECOMENDAÇÕES (${recommendations.length})`);
    console.log('-'.repeat(80));
    recommendations.forEach((rec, i) => {
      console.log(`\n${i + 1}. [${rec.priority}] ${rec.title} (${rec.category})`);
      rec.actions.forEach((action, j) => {
        console.log(`   ${j + 1}) ${action}`);
      });
    });
  }
  
  console.log('\n' + '='.repeat(80));
}

/**
 * Salva relatório em arquivo
 */
function saveReport(metrics, analysis, recommendations) {
  const report = {
    timestamp: new Date().toISOString(),
    metrics,
    analysis,
    recommendations,
  };
  
  const reportDir = path.join(__dirname, '..', 'reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const reportPath = path.join(reportDir, `analysis-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\nRelatório salvo em: ${reportPath}`);
}

// Executar se chamado diretamente
if (require.main === module) {
  const filePath = process.argv[2];
  
  if (!filePath) {
    console.error('Uso: node analyze-results.js <caminho-para-results.json>');
    process.exit(1);
  }
  
  if (!fs.existsSync(filePath)) {
    console.error(`Arquivo não encontrado: ${filePath}`);
    process.exit(1);
  }
  
  const exitCode = analyzeResults(filePath);
  process.exit(exitCode);
}

module.exports = { analyzeResults };
