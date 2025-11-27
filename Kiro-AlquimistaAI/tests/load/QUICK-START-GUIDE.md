# Guia Rápido - Testes de Performance

## ⚡ Início Rápido

### 1. Instalar Dependências do Projeto

```powershell
# Instalar dependências do Node.js (inclui vitest)
npm install
```

### 2. Instalar k6

**Opção A - Chocolatey (Recomendado):**
```powershell
choco install k6
```

**Opção B - Winget:**
```powershell
winget install k6
```

**Opção C - Download Manual:**
1. Baixe de: https://github.com/grafana/k6/releases
2. Extraia o executável
3. Adicione ao PATH do Windows

### 3. Verificar Instalação

```powershell
# Verificar k6
k6 version

# Verificar vitest
npx vitest --version
```

## 🚀 Executar Testes de Performance

### Usando o Script PowerShell (Recomendado)

```powershell
# Teste básico
.\tests\load\run-tests.ps1 -TestType load

# Teste completo com análise
.\tests\load\run-tests.ps1 -TestType full -Analyze -GenerateReport

# Teste de stress
.\tests\load\run-tests.ps1 -TestType stress -VUs 50 -Duration 10m
```

### Usando k6 Diretamente

```powershell
# Teste de APIs de tenant
k6 run tests/load/scripts/tenant-apis.js

# Teste de APIs internas
k6 run tests/load/scripts/internal-apis.js

# Teste completo
k6 run tests/load/scripts/full-load-test.js
```

## 🔒 Testes de Segurança

### Opção 1: Testes TypeScript (Sem Docker)

```powershell
# Executar testes de segurança com vitest
npm run test:security

# Com relatório detalhado
npm run test:security:report
```

### Opção 2: OWASP ZAP (Requer Docker)

**Instalar Docker Desktop:**
1. Baixe: https://www.docker.com/products/docker-desktop/
2. Instale e reinicie o computador
3. Inicie o Docker Desktop

**Executar scan:**
```powershell
.\tests\security\owasp-zap-scan.ps1 -Target "https://api-dev.alquimista.ai"
```

## 📊 Analisar Resultados

```powershell
# Analisar resultados JSON do k6
node tests/load/utils/analyze-results.js tests/load/reports/results.json
```

## 🛠️ Troubleshooting

### Erro: "vitest não é reconhecido"

**Solução:**
```powershell
# Instalar dependências
npm install

# Ou usar npx
npx vitest run tests/security
```

### Erro: "k6 não é reconhecido"

**Solução:**
```powershell
# Instalar k6
choco install k6

# Ou adicionar ao PATH manualmente
```

### Erro: "Docker not found"

**Solução:**
```powershell
# Opção 1: Instalar Docker Desktop
# https://www.docker.com/products/docker-desktop/

# Opção 2: Usar testes TypeScript (sem Docker)
npm run test:security
```

### Erro: "Cannot find module"

**Solução:**
```powershell
# Limpar cache e reinstalar
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

## 📝 Exemplos de Uso

### Cenário 1: Validação Rápida

```powershell
# Smoke test (1 minuto)
.\tests\load\run-tests.ps1 -TestType smoke
```

### Cenário 2: Teste de Carga Normal

```powershell
# Load test (5 minutos, 10 usuários)
.\tests\load\run-tests.ps1 -TestType load -VUs 10 -Duration 5m
```

### Cenário 3: Teste de Escalabilidade

```powershell
# Teste com 100+ usuários
.\tests\load\run-tests.ps1 -TestType scalability -Analyze
```

### Cenário 4: Teste Completo com Relatório

```powershell
# Teste completo + análise + relatório HTML
.\tests\load\run-tests.ps1 -TestType full -Analyze -GenerateReport
```

## 🎯 Thresholds de Performance

Os testes validam automaticamente:

- ✅ **Tempo de resposta**: P95 < 2s para dashboards
- ✅ **Taxa de erro**: < 1%
- ✅ **Escalabilidade**: Suporta 100+ tenants simultâneos
- ✅ **Throughput**: > 10 req/s

## 📈 Próximos Passos

1. **Executar testes em dev**
   ```powershell
   .\tests\load\run-tests.ps1 -TestType load -Environment dev
   ```

2. **Analisar resultados**
   ```powershell
   # Relatórios ficam em: tests/load/reports/
   ```

3. **Implementar otimizações**
   - Seguir recomendações da análise
   - Adicionar índices no banco
   - Configurar cache

4. **Executar novamente**
   ```powershell
   .\tests\load\run-tests.ps1 -TestType load -Analyze
   ```

## 🔗 Links Úteis

- [k6 Documentation](https://k6.io/docs/)
- [Vitest Documentation](https://vitest.dev/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Chocolatey](https://chocolatey.org/install)

## 💡 Dicas

1. **Sempre teste em dev primeiro** antes de produção
2. **Monitore o CloudWatch** durante os testes
3. **Execute testes fora do horário de pico** em produção
4. **Documente os resultados** para comparação futura
5. **Automatize no CI/CD** para testes contínuos

---

**Precisa de ajuda?** Consulte o README completo em `tests/load/README.md`
