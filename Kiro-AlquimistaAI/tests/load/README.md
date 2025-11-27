# Testes de Performance - Painel Operacional AlquimistaAI

## Visão Geral

Este diretório contém testes de performance (load testing) para o Painel Operacional AlquimistaAI usando k6.

## Requisitos

- k6 instalado: https://k6.io/docs/getting-started/installation/
- Variáveis de ambiente configuradas (ver `.env.test`)

## Estrutura

```
tests/load/
├── README.md                           # Este arquivo
├── config/
│   ├── thresholds.js                   # Thresholds de performance
│   └── scenarios.js                    # Cenários de teste
├── scripts/
│   ├── dashboard-tenant.js             # Testes do dashboard do cliente
│   ├── dashboard-internal.js           # Testes do painel operacional
│   ├── tenant-apis.js                  # Testes das APIs /tenant/*
│   ├── internal-apis.js                # Testes das APIs /internal/*
│   └── full-load-test.js               # Teste completo de carga
├── utils/
│   ├── auth.js                         # Utilitários de autenticação
│   ├── data-generators.js              # Geradores de dados de teste
│   └── helpers.js                      # Funções auxiliares
└── reports/                            # Relatórios gerados (gitignored)
```

## Executar Testes

### Teste Individual

```bash
# Dashboard do cliente
k6 run tests/load/scripts/dashboard-tenant.js

# Painel operacional
k6 run tests/load/scripts/dashboard-internal.js

# APIs de tenant
k6 run tests/load/scripts/tenant-apis.js

# APIs internas
k6 run tests/load/scripts/internal-apis.js
```

### Teste Completo de Carga

```bash
k6 run tests/load/scripts/full-load-test.js
```

### Com Relatório HTML

```bash
k6 run --out html=tests/load/reports/report.html tests/load/scripts/full-load-test.js
```

### Com Diferentes Níveis de Carga

```bash
# Smoke test (carga mínima)
k6 run --vus 1 --duration 30s tests/load/scripts/full-load-test.js

# Load test (carga normal)
k6 run --vus 10 --duration 5m tests/load/scripts/full-load-test.js

# Stress test (carga alta)
k6 run --vus 50 --duration 10m tests/load/scripts/full-load-test.js

# Spike test (picos de carga)
k6 run --stage 1m:10 --stage 30s:100 --stage 1m:10 tests/load/scripts/full-load-test.js
```

## Thresholds de Performance

Conforme requisitos 12.1-12.4:

- **Tempo de resposta**: < 2s para dashboards (p95)
- **Taxa de erro**: < 1%
- **Throughput**: Suportar 100+ tenants simultâneos
- **Disponibilidade**: > 99%

## Cenários de Teste

### 1. Dashboard do Cliente
- Carga: 50 VUs (usuários virtuais)
- Duração: 5 minutos
- Endpoints testados:
  - GET /tenant/me
  - GET /tenant/agents
  - GET /tenant/usage
  - GET /tenant/integrations

### 2. Painel Operacional
- Carga: 20 VUs (equipe interna)
- Duração: 5 minutos
- Endpoints testados:
  - GET /internal/tenants
  - GET /internal/usage/overview
  - GET /internal/billing/overview
  - POST /internal/operations/commands

### 3. Teste de Escalabilidade
- Simula 100+ tenants
- Ramp-up gradual
- Validação de cache e otimizações

## Análise de Resultados

Após executar os testes, analise:

1. **Métricas de Tempo de Resposta**
   - http_req_duration (p95, p99)
   - http_req_waiting
   - http_req_connecting

2. **Métricas de Throughput**
   - http_reqs (requisições/segundo)
   - data_received
   - data_sent

3. **Métricas de Erro**
   - http_req_failed (%)
   - Códigos de status HTTP

4. **Métricas de Iteração**
   - iteration_duration
   - iterations

## Otimizações Comuns

Se os testes falharem nos thresholds:

1. **Queries Lentas**
   - Adicionar índices no banco de dados
   - Otimizar queries complexas
   - Implementar paginação

2. **Cache Insuficiente**
   - Aumentar TTL do Redis
   - Adicionar mais endpoints ao cache
   - Implementar cache em múltiplas camadas

3. **Recursos Lambda**
   - Aumentar memória das funções
   - Ajustar timeout
   - Implementar provisioned concurrency

4. **Conexões de Banco**
   - Ajustar pool de conexões
   - Implementar connection pooling
   - Usar RDS Proxy

## Monitoramento Durante Testes

Monitore no CloudWatch:

- Lambda: Invocations, Duration, Errors, Throttles
- API Gateway: Count, Latency, 4XXError, 5XXError
- Aurora: CPUUtilization, DatabaseConnections, ReadLatency, WriteLatency
- ElastiCache: CPUUtilization, CacheHits, CacheMisses

## Troubleshooting

### Erro: "Connection refused"
- Verifique se a API está acessível
- Confirme variáveis de ambiente

### Erro: "401 Unauthorized"
- Verifique tokens de autenticação
- Confirme que os usuários de teste existem

### Erro: "Too many requests"
- Rate limiting ativado
- Ajuste VUs ou duração do teste

### Performance abaixo do esperado
- Verifique logs do CloudWatch
- Analise queries lentas no Aurora
- Verifique cache hit rate no Redis

## Relatórios

Os relatórios são salvos em `tests/load/reports/` e incluem:

- Métricas detalhadas de performance
- Gráficos de tempo de resposta
- Análise de erros
- Recomendações de otimização

## Integração CI/CD

Para executar testes de performance no pipeline:

```yaml
# .github/workflows/performance-tests.yml
- name: Run Performance Tests
  run: |
    k6 run --out json=results.json tests/load/scripts/full-load-test.js
    
- name: Analyze Results
  run: |
    node tests/load/utils/analyze-results.js results.json
```

## Referências

- [k6 Documentation](https://k6.io/docs/)
- [k6 Best Practices](https://k6.io/docs/testing-guides/test-types/)
- [AWS Lambda Performance](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
