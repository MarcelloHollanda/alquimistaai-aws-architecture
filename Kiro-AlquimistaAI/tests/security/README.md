# Testes de Segurança - Painel Operacional AlquimistaAI

## Visão Geral

Esta pasta contém todos os testes de segurança para o Painel Operacional AlquimistaAI, validando os requisitos 11.1, 11.2, 11.3, 11.5 e Critério de Aceitação Global 1.

## Estrutura de Arquivos

```
tests/security/
├── README.md                                    # Este arquivo
├── operational-dashboard-security.test.ts       # Testes principais de segurança
├── penetration-tests.test.ts                    # Testes de penetração automatizados
├── owasp-zap-scan.ps1                          # Script para OWASP ZAP scan
├── SECURITY-TEST-REPORT.md                     # Relatório de testes
├── VULNERABILITY-FIX-GUIDE.md                  # Guia de correção
└── reports/                                     # Relatórios gerados
```

## Executar Testes

### Testes Automatizados

```bash
# Todos os testes de segurança
npm run test:security

# Testes específicos
npm test tests/security/operational-dashboard-security.test.ts --run
npm test tests/security/penetration-tests.test.ts --run
```

### OWASP ZAP Scan

```powershell
# Baseline scan (rápido, ~5 minutos)
.\tests\security\owasp-zap-scan.ps1 -Target "https://api-dev.alquimista.ai"

# Full scan (completo, ~30 minutos)
.\tests\security\owasp-zap-scan.ps1 -Target "https://api-dev.alquimista.ai" -FullScan

# Scan com relatório customizado
.\tests\security\owasp-zap-scan.ps1 `
  -Target "https://api-dev.alquimista.ai" `
  -ReportPath "./custom-reports"
```

## Categorias de Testes

### 1. Isolamento de Dados entre Tenants

**Objetivo**: Garantir que clientes nunca acessem dados de outros clientes.

**Testes**:
- ✅ Acesso cruzado entre tenants
- ✅ Validação de tenant_id em queries
- ✅ Acesso de usuários internos

**Requisito**: 11.1

### 2. Validação de Permissões

**Objetivo**: Garantir que apenas usuários autorizados acessem recursos específicos.

**Testes**:
- ✅ Bloqueio de rotas internas para usuários clientes
- ✅ Acesso de INTERNAL_ADMIN
- ✅ Acesso de INTERNAL_SUPPORT
- ✅ Validação de grupos em requisições

**Requisito**: 11.2

### 3. SQL Injection

**Objetivo**: Prevenir ataques de SQL injection.

**Testes**:
- ⚠️ Payloads comuns de SQL injection
- ⚠️ Uso de prepared statements
- ✅ Validação de input

**Requisito**: 11.2

**Status**: REQUER AUDITORIA

### 4. XSS (Cross-Site Scripting)

**Objetivo**: Prevenir ataques XSS.

**Testes**:
- ⚠️ Payloads comuns de XSS
- ✅ Escapamento de caracteres especiais
- ✅ Sanitização de output

**Requisito**: 11.3

**Status**: PARCIALMENTE IMPLEMENTADO

### 5. Rate Limiting

**Objetivo**: Prevenir abuso e ataques DoS.

**Testes**:
- ❌ Rate limiting por IP
- ❌ Rate limiting por tenant
- ❌ Rate limiting por usuário

**Requisito**: 11.5

**Status**: NÃO IMPLEMENTADO - CRÍTICO

### 6. Validação de Input

**Objetivo**: Validar e sanitizar todos os inputs de usuário.

**Testes**:
- ✅ Validação de UUID
- ✅ Validação de tipos de dados
- ⚠️ Limitação de tamanho de strings

**Requisito**: 11.3

### 7. Headers de Segurança

**Objetivo**: Garantir que headers de segurança apropriados estão presentes.

**Testes**:
- ⚠️ X-Content-Type-Options
- ⚠️ X-Frame-Options
- ⚠️ X-XSS-Protection
- ⚠️ Strict-Transport-Security
- ⚠️ Content-Security-Policy

**Status**: REQUER CONFIGURAÇÃO

### 8. Testes de Penetração

**Objetivo**: Simular ataques reais para validar defesas.

**Testes**:
- ✅ Autenticação e autorização
- ✅ Injeção de código
- ✅ Path traversal
- ✅ IDOR (Insecure Direct Object Reference)
- ✅ Mass assignment
- ✅ Timing attacks
- ✅ Information disclosure
- ✅ Denial of Service (DoS)
- ✅ Session management

## Interpretação de Resultados

### Status dos Testes

- ✅ **PASSOU**: Teste passou, implementação correta
- ⚠️ **PARCIAL**: Teste passou parcialmente, requer melhorias
- ❌ **FALHOU**: Teste falhou, requer implementação/correção
- ⏳ **PENDENTE**: Teste não executado ainda

### Severidade de Vulnerabilidades

- 🔴 **CRÍTICA**: Bloqueia deploy em produção
- 🟠 **ALTA**: Deve ser corrigida antes de produção
- 🟡 **MÉDIA**: Deve ser corrigida na sprint atual
- 🟢 **BAIXA**: Pode ser corrigida em sprint futura

## Vulnerabilidades Conhecidas

### Críticas (Bloqueia Produção)

1. **Rate Limiting Não Implementado** 🔴
   - Sistema não possui rate limiting
   - Permite abuso e ataques DoS
   - **Ação**: Implementar IMEDIATAMENTE

### Altas (Corrigir Antes de Produção)

2. **Headers de Segurança Ausentes** 🟠
   - Headers de segurança não configurados
   - **Ação**: Configurar no API Gateway ou Lambda

3. **Auditoria de Queries SQL** 🟠
   - Necessário validar uso de prepared statements
   - **Ação**: Auditar todas as queries

### Médias (Corrigir em Sprint Atual)

4. **Validação de Tamanho de Input** 🟡
   - Não há limite explícito para tamanho de strings
   - **Ação**: Adicionar validação de tamanho máximo

## Correção de Vulnerabilidades

Consulte o arquivo `VULNERABILITY-FIX-GUIDE.md` para instruções detalhadas de correção.

### Prioridade de Correção

1. **Imediato** (Antes de Produção):
   - Rate limiting
   - Headers de segurança
   - Auditoria de queries SQL

2. **Curto Prazo** (Próxima Sprint):
   - Validação de tamanho de input
   - Content Security Policy
   - Logging de segurança

3. **Médio Prazo** (Próximo Mês):
   - Penetration testing profissional
   - Security audit completo
   - WAF rules customizadas

## Relatórios

### Gerar Relatório

```bash
# Executar todos os testes e gerar relatório
npm run test:security -- --reporter=html --outputFile=./tests/security/reports/test-report.html

# OWASP ZAP scan gera relatórios automaticamente
.\tests\security\owasp-zap-scan.ps1 -Target "https://api-dev.alquimista.ai"
```

### Visualizar Relatórios

```bash
# Abrir relatório HTML
start ./tests/security/reports/test-report.html

# Abrir relatório OWASP ZAP
start ./tests/security/reports/zap-report-*.html
```

## Integração com CI/CD

### GitHub Actions

```yaml
# .github/workflows/security-tests.yml
name: Security Tests

on:
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 2 * * *' # Diariamente às 2 AM

jobs:
  security-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run security tests
        run: npm run test:security
      
      - name: OWASP ZAP Scan
        uses: zaproxy/action-baseline@v0.7.0
        with:
          target: 'https://api-dev.alquimista.ai'
          rules_file_name: '.zap/rules.tsv'
          cmd_options: '-a'
      
      - name: Upload reports
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: security-reports
          path: tests/security/reports/
```

## Monitoramento Contínuo

### Alertas de Segurança

Configure alertas para:
- Tentativas de acesso não autorizado
- Rate limit excedido
- Tokens JWT inválidos
- Queries SQL suspeitas
- Payloads XSS detectados

### Logs de Auditoria

Todos os eventos de segurança são registrados em:
- CloudWatch Logs
- Tabela `operational_events` (Aurora)
- S3 (logs de longo prazo)

### Métricas

Monitore métricas de segurança:
- Taxa de requisições bloqueadas
- Tentativas de acesso não autorizado
- Erros de validação
- Rate limit hits

## Checklist de Segurança

### Antes de Deploy em Produção

- [ ] Todos os testes de segurança passando
- [ ] OWASP ZAP scan sem vulnerabilidades críticas
- [ ] Rate limiting implementado e testado
- [ ] Headers de segurança configurados
- [ ] Queries SQL auditadas
- [ ] Validação de input implementada
- [ ] Logs de auditoria configurados
- [ ] Secrets Manager configurado
- [ ] HTTPS obrigatório
- [ ] CORS configurado apropriadamente

### Monitoramento Contínuo

- [ ] Alertas configurados
- [ ] Logs de segurança coletados
- [ ] Revisão periódica de permissões
- [ ] Scans automatizados em CI/CD
- [ ] Atualização regular de dependências

## Recursos Adicionais

### Documentação

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [AWS Security Best Practices](https://aws.amazon.com/security/best-practices/)
- [Node.js Security Checklist](https://github.com/goldbergyoni/nodebestpractices#6-security-best-practices)
- [OWASP ZAP Documentation](https://www.zaproxy.org/docs/)

### Ferramentas

- [OWASP ZAP](https://www.zaproxy.org/) - Security scanner
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit) - Dependency vulnerabilities
- [Snyk](https://snyk.io/) - Security platform
- [SonarQube](https://www.sonarqube.org/) - Code quality and security

### Treinamento

- [OWASP WebGoat](https://owasp.org/www-project-webgoat/) - Security training
- [AWS Security Training](https://aws.amazon.com/training/learn-about/security/)
- [Secure Coding Guidelines](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)

## Contato

Para questões de segurança:
- **Email**: security@alquimista.ai
- **Slack**: #security-team
- **Responsável**: Equipe de Segurança

## Changelog

### 2024-01-XX
- ✅ Criados testes de isolamento de dados
- ✅ Criados testes de validação de permissões
- ✅ Criados testes de SQL injection
- ✅ Criados testes de XSS
- ✅ Criados testes de penetração
- ⚠️ Identificada necessidade de rate limiting
- ⚠️ Identificada necessidade de headers de segurança
- 📝 Documentação completa criada
