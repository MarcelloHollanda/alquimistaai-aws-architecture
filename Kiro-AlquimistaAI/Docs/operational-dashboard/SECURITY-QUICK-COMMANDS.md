# Comandos Rápidos - Testes de Segurança

## 🚀 Execução de Testes

### Executar Testes de Segurança
```bash
npm test -- tests/security/operational-dashboard-security.test.ts --run
```

### Executar Todos os Testes
```bash
npm test -- --run
```

### Executar com Coverage
```bash
npm test -- --coverage --run
```

### Executar Testes Específicos
```bash
# Apenas SQL Injection
npm test -- tests/security/operational-dashboard-security.test.ts -t "SQL Injection" --run

# Apenas XSS
npm test -- tests/security/operational-dashboard-security.test.ts -t "XSS" --run

# Apenas Rate Limiting
npm test -- tests/security/operational-dashboard-security.test.ts -t "Rate Limiting" --run
```

## 📊 Análise de Resultados

### Ver Resultados Detalhados
```bash
npm test -- tests/security/operational-dashboard-security.test.ts --run --reporter=verbose
```

### Gerar Relatório HTML
```bash
npm test -- tests/security/operational-dashboard-security.test.ts --run --reporter=html
```

## 🔧 Desenvolvimento

### Compilar TypeScript
```bash
npm run build
```

### Verificar Erros de Tipo
```bash
npx tsc --noEmit
```

### Lint
```bash
npm run lint
```

## 🐛 Debug

### Executar Testes em Modo Debug
```bash
node --inspect-brk node_modules/.bin/vitest tests/security/operational-dashboard-security.test.ts
```

### Ver Logs Detalhados
```bash
DEBUG=* npm test -- tests/security/operational-dashboard-security.test.ts --run
```

## 📝 Documentação

### Abrir Documentação de Segurança
```bash
# Windows
start docs/operational-dashboard/SECURITY-INDEX.md

# Linux/Mac
open docs/operational-dashboard/SECURITY-INDEX.md
```

### Ver Relatório de Testes
```bash
# Windows
start docs/operational-dashboard/SECURITY-TEST-REPORT.md

# Linux/Mac
open docs/operational-dashboard/SECURITY-TEST-REPORT.md
```

## 🔍 OWASP ZAP Scan

### Executar ZAP Scan (Requer Docker)
```bash
docker run -t owasp/zap2docker-stable zap-baseline.py -t http://localhost:3000
```

### Executar ZAP Scan com Relatório
```bash
docker run -v $(pwd):/zap/wrk/:rw -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:3000 \
  -r zap-report.html
```

## 🔐 Validação de Segurança

### Verificar Prepared Statements
```bash
# Buscar queries sem prepared statements
grep -r "SELECT.*\${" lambda/
grep -r "INSERT.*\${" lambda/
grep -r "UPDATE.*\${" lambda/
```

### Verificar Sanitização de Input
```bash
# Buscar uso de query parameters sem validação
grep -r "queryStringParameters\?" lambda/ | grep -v "sanitize"
```

### Verificar Rate Limiting
```bash
# Buscar handlers sem rate limiting
grep -r "export.*handler" lambda/ | grep -v "rateLimitMiddleware"
```

## 📦 Instalação de Dependências

### Instalar Dependências de Teste
```bash
npm install --save-dev @types/node vitest
```

### Instalar Redis (para Rate Limiting)
```bash
npm install ioredis
npm install --save-dev @types/ioredis
```

## 🔄 CI/CD

### Executar Testes no CI
```bash
npm ci
npm run build
npm test -- --run --coverage
```

### Verificar Cobertura Mínima
```bash
npm test -- --run --coverage --coverage.lines=80
```

## 📈 Métricas

### Ver Estatísticas de Testes
```bash
npm test -- tests/security/operational-dashboard-security.test.ts --run --reporter=json > test-results.json
```

### Contar Vulnerabilidades
```bash
# Total de testes
grep -c "it(" tests/security/operational-dashboard-security.test.ts

# Testes falhando
npm test -- tests/security/operational-dashboard-security.test.ts --run | grep "FAIL" | wc -l
```

## 🛠️ Correções

### Criar Arquivo de Validação
```bash
touch lambda/shared/input-validator.ts
```

### Criar Base Handler
```bash
touch lambda/shared/base-handler.ts
```

### Criar Rate Limiter
```bash
touch lambda/shared/rate-limiter.ts
```

## 📋 Checklist Rápido

### Antes de Commitar
```bash
# 1. Compilar
npm run build

# 2. Lint
npm run lint

# 3. Testes
npm test -- --run

# 4. Testes de Segurança
npm test -- tests/security/operational-dashboard-security.test.ts --run
```

### Antes de Deploy
```bash
# 1. Todos os testes
npm test -- --run --coverage

# 2. Testes de segurança
npm test -- tests/security/operational-dashboard-security.test.ts --run

# 3. Build de produção
npm run build

# 4. Verificar tipos
npx tsc --noEmit
```

## 🎯 Atalhos Úteis

### Ver Status Atual
```bash
cat docs/operational-dashboard/SECURITY-AUDIT-SUMMARY.md | grep "Status:"
```

### Ver Vulnerabilidades Críticas
```bash
cat docs/operational-dashboard/SECURITY-TEST-REPORT.md | grep "🔴"
```

### Ver Próximos Passos
```bash
cat docs/operational-dashboard/TASK-22-SECURITY-TESTS-COMPLETE.md | grep -A 10 "Próximos Passos"
```

## 📞 Ajuda

### Ver Ajuda do Vitest
```bash
npx vitest --help
```

### Ver Opções de Teste
```bash
npm test -- --help
```

### Ver Documentação
```bash
# Abrir índice de segurança
cat docs/operational-dashboard/SECURITY-INDEX.md
```

---

**Dica**: Salve este arquivo nos seus favoritos para acesso rápido aos comandos mais usados!
