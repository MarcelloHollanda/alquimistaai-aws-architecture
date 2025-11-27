# 📚 Índice Operacional - AWS AlquimistaAI

**Sistema**: AlquimistaAI / Fibonacci Orquestrador B2B  
**Região AWS**: us-east-1  
**Última Atualização**: 17 de novembro de 2025  
**Versão**: 1.0

---

## 🎯 Propósito

Este é o **menu operacional** para qualquer pessoa responsável pela operação, manutenção e troubleshooting do sistema AlquimistaAI na AWS.

### Para quem é este índice

- ✅ **DevOps/SRE** - Operação diária
- ✅ **Desenvolvedores** - Deploy e validação
- ✅ **Suporte** - Troubleshooting
- ✅ **Gestores** - Visão geral e status

---

## 📋 Índice Rápido

1. [Arquitetura Oficial](#arquitetura-oficial-backend)
2. [CI/CD & Deploy](#cicd--deploy)
3. [Guardrails](#guardrails)
4. [Scripts Úteis](#scripts-úteis)
5. [Rollback & Incidentes](#rollback--incidentes)
6. [Spec & Kiro](#spec--kiro)

---

## Arquitetura Oficial (Backend)

### Documentos Principais

| Documento | Descrição | Link |
|-----------|-----------|------|
| **Resumo Aurora Oficial** | Arquitetura oficial do banco de dados | [database/RESUMO-AURORA-OFICIAL.md](../database/RESUMO-AURORA-OFICIAL.md) |
| **Aurora PostgreSQL Pronto** | Status atual e configuração | [AURORA-POSTGRESQL-PRONTO.md](../AURORA-POSTGRESQL-PRONTO.md) |
| **Consolidação Aurora** | Histórico completo e decisões | [database/CONSOLIDACAO-AURORA-COMPLETA.md](../database/CONSOLIDACAO-AURORA-COMPLETA.md) |

### Stack Tecnológico

```
Frontend:  Next.js 14 + TypeScript → S3 + CloudFront + WAF
Backend:   Lambda Node.js 20 → API Gateway HTTP
Database:  Aurora Serverless v2 PostgreSQL (Multi-AZ)
Cache:     DynamoDB
Auth:      Amazon Cognito
IaC:       AWS CDK (TypeScript)
```

### Stacks CDK

| Stack | Propósito | Arquivo |
|-------|-----------|---------|
| **FibonacciStack** | Orquestrador B2B principal | `lib/fibonacci-stack.ts` |
| **NigredoStack** | Núcleo de prospecção | `lib/nigredo-stack.ts` |
| **AlquimistaStack** | Plataforma de agentes | `lib/alquimista-stack.ts` |
| **SecurityStack** | Guardrails de segurança/custo/obs | `lib/security-stack.ts` |
| **WAFStack** | Proteção de APIs e frontend | `lib/waf-stack.ts` |
| **FrontendStack** | Hospedagem de arquivos estáticos | `lib/frontend-stack.ts` |



---

## 🔐 WAF & Edge Security

### 1. Visão Geral

O AWS WAF (Web Application Firewall) protege as APIs e o frontend da AlquimistaAI contra ataques comuns e tráfego malicioso.

**Componentes**:
- ✅ Web ACL Dev (modo observação)
- ✅ Web ACL Prod (modo bloqueio)
- ✅ IP Sets (allowlist e blocklist)
- ✅ Logging completo no CloudWatch
- ✅ Alarmes integrados com SNS

**Arquitetura**:
```
Usuário → CloudFront → WAF → S3/API Gateway → Backend
                       ↓
                  CloudWatch Logs
                       ↓
                  Alarmes SNS
```

### 2. Onde Operar no Dia a Dia

#### Console AWS WAF
**URL**: https://console.aws.amazon.com/wafv2/

**Web ACLs**:
- `AlquimistaAI-WAF-Dev` - Modo count (observação)
- `AlquimistaAI-WAF-Prod` - Modo block (bloqueio ativo)

**O que monitorar**:
- Requisições bloqueadas (aba "Overview")
- Rate limiting acionado (aba "Metrics")
- Logs de requisições (aba "Logging and metrics")

#### CloudWatch Logs
**Log Groups**:
- `aws-waf-logs-alquimista-dev` (retenção 30 dias)
- `aws-waf-logs-alquimista-prod` (retenção 90 dias)

**O que procurar**:
- IPs suspeitos com múltiplos bloqueios
- Padrões de ataque (SQL injection, XSS)
- Rate limiting excessivo em IPs legítimos

#### CloudWatch Alarmes
**Alarmes configurados**:
- `alquimista-waf-high-block-rate-{env}` - Alto volume de bloqueios
- `alquimista-waf-rate-limit-triggered-{env}` - Rate limiting acionado

**Ação**: Alarmes enviam para SNS Topic `alquimista-security-alerts-{env}`

### 3. Fluxos Relacionados

#### Adicionar IP à Allowlist
```powershell
# 1. Obter ARN do IP Set
aws wafv2 list-ip-sets --scope REGIONAL --region us-east-1

# 2. Adicionar IP
aws wafv2 update-ip-set \
  --scope REGIONAL \
  --id <IP_SET_ID> \
  --addresses "203.0.113.0/24" \
  --lock-token <LOCK_TOKEN>
```

#### Adicionar IP à Blocklist
```powershell
# Mesmo processo, mas usar o IP Set de blocklist
# Nome: alquimista-blocked-ips-{env}
```

#### Investigar Bloqueios
1. Acesse CloudWatch Logs → `aws-waf-logs-alquimista-prod`
2. Filtre por IP ou padrão: `{ $.httpRequest.clientIp = "x.x.x.x" }`
3. Analise regras que bloquearam: `$.action = "BLOCK"`
4. Decida: adicionar à allowlist ou manter bloqueio

#### Responder a Alarme de Ataque
1. **Alarme recebido**: "Alto volume de bloqueios"
2. **Verificar logs**: Identificar IPs e padrões
3. **Avaliar severidade**: Ataque real ou falso positivo?
4. **Ação**:
   - Se ataque real: Manter bloqueio, documentar
   - Se falso positivo: Ajustar regras ou adicionar à allowlist
5. **Documentar**: Registrar incidente e ações tomadas

### 4. Documentação Completa

| Documento | Descrição | Quando Usar |
|-----------|-----------|-------------|
| **[WAF-LOGGING-ALQUIMISTAAI.md](./security/WAF-LOGGING-ALQUIMISTAAI.md)** | Padrão oficial completo | Implementação e troubleshooting |
| **[WAF-LOGGING-QUICK-REFERENCE.md](./security/WAF-LOGGING-QUICK-REFERENCE.md)** | Referência rápida | Consulta rápida de comandos |
| **[WAF-LOGGING-VISUAL-GUIDE.md](./security/WAF-LOGGING-VISUAL-GUIDE.md)** | Guia visual | Compreensão visual |
| **[WAF-IMPLEMENTATION-SUMMARY.md](./security/WAF-IMPLEMENTATION-SUMMARY.md)** | Resumo de implementação | Status e validação |
| **[security/README.md](./security/README.md)** | Índice de segurança | Navegação geral |

### 5. Comandos Rápidos

```powershell
# Deploy WAF
cdk deploy WAFStack-dev --context env=dev
cdk deploy WAFStack-prod --context env=prod

# Listar Web ACLs
aws wafv2 list-web-acls --scope REGIONAL --region us-east-1

# Listar IP Sets
aws wafv2 list-ip-sets --scope REGIONAL --region us-east-1

# Ver logs recentes
aws logs tail aws-waf-logs-alquimista-prod --follow

# Verificar métricas
aws cloudwatch get-metric-statistics \
  --namespace AWS/WAFV2 \
  --metric-name BlockedRequests \
  --dimensions Name=WebACL,Value=AlquimistaAI-WAF-Prod \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

### 6. Troubleshooting Comum

| Problema | Causa Provável | Solução |
|----------|----------------|---------|
| Requisições legítimas bloqueadas | Regra muito restritiva | Adicionar IP à allowlist ou ajustar regra |
| Rate limiting excessivo | Limite muito baixo | Aumentar limite ou adicionar IP à allowlist |
| Logs não aparecem | Configuração incorreta | Verificar logging configuration |
| Alarmes não disparam | SNS não configurado | Verificar assinaturas SNS |

### 7. Regras Configuradas

#### Dev (Modo Observação)
- ✅ Blocklist IPs (block)
- ✅ AWS Managed Rules - Common (count)
- ✅ AWS Managed Rules - Known Bad Inputs (count)
- ✅ AWS Managed Rules - SQLi (count)
- ✅ Rate Limiting: 2000 req/5min (count)

#### Prod (Modo Bloqueio)
- ✅ Blocklist IPs (block)
- ✅ AWS Managed Rules - Common (block)
- ✅ AWS Managed Rules - Known Bad Inputs (block)
- ✅ AWS Managed Rules - SQLi (block)
- ✅ Rate Limiting: 1000 req/5min (block)

### 8. Métricas Importantes

**Monitorar diariamente**:
- `BlockedRequests` - Total de requisições bloqueadas
- `AllowedRequests` - Total de requisições permitidas
- `CountedRequests` - Requisições que acionaram regras em modo count

**Alertar se**:
- BlockedRequests > 100 em 10 minutos (possível ataque)
- Rate limiting acionado > 10 vezes em 5 minutos

---

## Frontend Web (S3 + CloudFront + WAF)

### Documentação Principal

| Documento | Descrição | Quando Usar |
|-----------|-----------|-------------|
| **[FRONTEND-DEPLOY-ALQUIMISTAAI.md](./frontend/FRONTEND-DEPLOY-ALQUIMISTAAI.md)** | Guia completo de deploy do frontend | Deploy e operação do frontend |
| **[FRONTEND-QUICK-REFERENCE.md](./frontend/FRONTEND-QUICK-REFERENCE.md)** | Referência rápida de comandos | Consulta rápida de comandos |

### Arquitetura Frontend

```
Usuário → CloudFront (CDN) → S3 Bucket (Privado)
              ↓
            WAF (Prod)
```

**Características**:
- ✅ Buckets S3 privados (acesso via OAC)
- ✅ CloudFront para distribuição global
- ✅ WAF integrado em produção
- ✅ HTTPS obrigatório
- ✅ Separação dev/prod

### Comandos Rápidos

```powershell
# Deploy infraestrutura
cdk deploy FrontendStack-dev --context env=dev
cdk deploy FrontendStack-prod --context env=prod

# Deploy arquivos frontend
.\scripts\deploy-frontend-dev.ps1
.\scripts\deploy-frontend-prod.ps1

# Gerar configuração de APIs
.\scripts\generate-api-config.ps1 -Environment dev

# Invalidar cache CloudFront
aws cloudfront create-invalidation --distribution-id <DIST_ID> --paths "/*"

# Obter URL do frontend
aws cloudformation describe-stacks `
  --stack-name FrontendStack-dev `
  --query "Stacks[0].Outputs[?OutputKey=='FrontendUrl'].OutputValue" `
  --output text
```

### Recursos da Stack

**Outputs disponíveis**:
- `FrontendUrl` - URL pública (https://xxxxx.cloudfront.net)
- `BucketName` - Nome do bucket S3
- `DistributionId` - ID da CloudFront Distribution
- `DistributionDomainName` - Domain name da distribution

### Troubleshooting Comum

| Problema | Solução Rápida | Documentação |
|----------|----------------|--------------|
| Página não carrega (403) | Verificar bucket policy e OAC | [FRONTEND-DEPLOY-ALQUIMISTAAI.md](./frontend/FRONTEND-DEPLOY-ALQUIMISTAAI.md#troubleshooting) |
| Mudanças não aparecem | Invalidar cache do CloudFront | [FRONTEND-QUICK-REFERENCE.md](./frontend/FRONTEND-QUICK-REFERENCE.md#invalidar-cache-cloudfront) |
| WAF bloqueando (Prod) | Verificar logs do WAF, ajustar regras | [FRONTEND-DEPLOY-ALQUIMISTAAI.md](./frontend/FRONTEND-DEPLOY-ALQUIMISTAAI.md#problema-waf-bloqueando-requisições-legítimas-prod) |

---

## CI/CD & Deploy

### Documentação Principal

| Documento | Descrição | Quando Usar |
|-----------|-----------|-------------|
| **[CI-CD-PIPELINE-ALQUIMISTAAI.md](./CI-CD-PIPELINE-ALQUIMISTAAI.md)** | Índice central do pipeline | Ponto de entrada para CI/CD |
| **[CI-CD-GUARDRAILS-OVERVIEW.md](./CI-CD-GUARDRAILS-OVERVIEW.md)** | Guia mestre completo | Visão geral de tudo |
| **[ci-cd/OIDC-SETUP.md](./ci-cd/OIDC-SETUP.md)** | Configuração OIDC GitHub ↔ AWS | Setup inicial ou troubleshooting |
| **[CI-CD-DEPLOY-FLOWS-DEV-PROD.md](./CI-CD-DEPLOY-FLOWS-DEV-PROD.md)** | Guia de deploy dev/prod | Executar e validar deploys |
| **[CI-CD-VALIDATION-INTEGRATION-SUMMARY.md](./CI-CD-VALIDATION-INTEGRATION-SUMMARY.md)** | ✅ **NOVO** - Integração de validação automática | Entender validações automáticas |

### Workflow GitHub Actions

**Arquivo**: `.github/workflows/ci-cd-alquimistaai.yml`

**Jobs**:
1. **build-and-validate** - Executa em todos os PRs e pushes
   - ✅ **Valida migrations (pré-deploy)**
2. **deploy-dev** - Executa após merge em main (automático)
3. **smoke-tests-dev** - ✅ **NOVO** - Testes automáticos após deploy dev
4. **deploy-prod** - Executa via workflow_dispatch ou tag (manual com aprovação)
5. **smoke-tests-prod** - ✅ **NOVO** - Testes automáticos após deploy prod

### Comandos Rápidos

```powershell
# Validar sistema localmente
.\scripts\validate-system-complete.ps1

# Build local
npm run build

# Synth CDK (todas as stacks)
cdk synth --all --context env=dev

# Deploy manual em dev
cdk deploy --all --context env=dev --require-approval never

# Deploy manual em prod
cdk deploy --all --context env=prod
```

### Fluxo de Deploy

```
PR → CI (validate) → Merge → Deploy DEV (auto) → Validar → Deploy PROD (manual + aprovação)
```

**Documentação Detalhada**: [CI-CD-GUARDRAILS-OVERVIEW.md](./CI-CD-GUARDRAILS-OVERVIEW.md) → Seção "Fluxo: Do Código ao Deploy"

---

## Guardrails

### Segurança 🛡️

**Documento**: [SECURITY-GUARDRAILS-AWS.md](./SECURITY-GUARDRAILS-AWS.md)

**Componentes**:
- ✅ CloudTrail (auditoria, 90 dias)
- ✅ GuardDuty (detecção de ameaças)
- ✅ SNS Topic: `alquimista-security-alerts-{env}`

**Quando Consultar**:
- Configurar assinaturas de email → [Ver seção "Como Configurar Emails para Alertas de Segurança"](./SECURITY-GUARDRAILS-AWS.md#como-configurar-emails-para-alertas-de-segurança-sns)
- Entender alertas de segurança
- Responder a findings do GuardDuty
- Auditar ações na conta AWS

**Scripts**:
- `scripts/verify-security-guardrails.ps1` - Verificar configuração
- `scripts/test-security-alerts.ps1` - Testar envio de alertas

### Custo 💰

**Documento**: [COST-GUARDRAILS-AWS.md](./COST-GUARDRAILS-AWS.md)

**Componentes**:
- ✅ AWS Budgets (alertas em 80%, 100%, 120%)
- ✅ Cost Anomaly Detection (threshold $50)
- ✅ SNS Topic: `alquimista-cost-alerts-{env}`

**Quando Consultar**:
- Configurar orçamento mensal
- Configurar assinaturas de email → [Ver seção "Como Configurar Emails para Alertas de Custo"](./COST-GUARDRAILS-AWS.md#como-configurar-emails-para-alertas-de-custo-sns)
- Entender alertas de custo
- Investigar anomalias de gasto
- Otimizar recursos

**Referência Rápida**: [ci-cd/COST-GUARDRAILS-QUICK-REFERENCE.md](./ci-cd/COST-GUARDRAILS-QUICK-REFERENCE.md)

### Observabilidade 📊

**Documento**: [OBSERVABILITY-GUARDRAILS-AWS.md](./OBSERVABILITY-GUARDRAILS-AWS.md)

**Componentes**:
- ✅ CloudWatch Dashboards (Dev e Prod)
- ✅ CloudWatch Alarmes (Fibonacci, Nigredo, Aurora)
- ✅ Retenção de logs (30 dias)
- ✅ SNS Topic: `alquimista-ops-alerts-{env}`

**Dashboards CloudWatch**:
- **Localização**: CloudWatch Console > Dashboards
- **Dashboards**:
  - `AlquimistaAI-Dev-Overview` - Visão geral do ambiente dev
  - `AlquimistaAI-Prod-Overview` - Visão geral do ambiente prod
- **Documentação**: [OBSERVABILITY-GUARDRAILS-AWS.md](./OBSERVABILITY-GUARDRAILS-AWS.md#dashboards-de-observabilidade)
- **Métricas**: API Gateway (latência, erros, throughput), Lambda (invocações, erros, duração), Aurora (CPU, conexões, storage)
- **Uso**: Monitoramento contínuo e resposta a incidentes

**Alarmes Configurados**:
- API Gateway 5XX (>= 5 em 5 min)
- Lambda Errors (>= 3 em 5 min)
- Lambda Throttles (>= 1 em 10 min)
- Aurora CPU (>= 80% por 10 min)
- Aurora Conexões (>= 80 por 10 min)

**Quando Consultar**:
- Visualizar métricas em tempo real
- Entender alertas operacionais
- Investigar erros de API/Lambda
- Monitorar performance do banco
- Configurar novos alarmes

**Referência Rápida**: [ci-cd/OBSERVABILITY-QUICK-REFERENCE.md](./ci-cd/OBSERVABILITY-QUICK-REFERENCE.md)

---

## Scripts Úteis

### Tabela de Scripts

| Script | Função | Quando Usar | Automático no CI/CD? | Documentação |
|--------|--------|-------------|----------------------|--------------|
| **validate-system-complete.ps1** | Validação completa do sistema | Antes de qualquer deploy | ✅ Sim (build-and-validate) | [VALIDACAO-E-SUPORTE-AWS.md](./VALIDACAO-E-SUPORTE-AWS.md) |
| **validate-migrations-aurora.ps1** | Valida estado de migrations | Antes/depois de aplicar migrations | ✅ Sim (pré-deploy) | [VALIDACAO-E-SUPORTE-AWS.md](./VALIDACAO-E-SUPORTE-AWS.md) |
| **smoke-tests-api-dev.ps1** | Testa endpoints das APIs | Após deploy, validação | ✅ Sim (pós-deploy dev/prod) | [VALIDACAO-E-SUPORTE-AWS.md](./VALIDACAO-E-SUPORTE-AWS.md) |
| **manual-rollback-guided.ps1** | Guia de rollback seguro | Problemas pós-deploy | ❌ Manual | [ROLLBACK-OPERACIONAL-AWS.md](./ROLLBACK-OPERACIONAL-AWS.md) |
| **apply-migrations-aurora-dev.ps1** | Aplica migrations no Aurora | Atualização de schema | ❌ Manual | [database/](../database/) |
| **verify-security-guardrails.ps1** | Verifica guardrails de segurança | Validar configuração | ❌ Manual | [SECURITY-GUARDRAILS-AWS.md](./SECURITY-GUARDRAILS-AWS.md) |
| **test-security-alerts.ps1** | Testa alertas de segurança | Validar SNS | ❌ Manual | [SECURITY-GUARDRAILS-AWS.md](./SECURITY-GUARDRAILS-AWS.md) |

### ✅ Validação Automática no CI/CD

**Novidade**: Os scripts de validação agora são executados **automaticamente** no pipeline CI/CD!

**Pré-Deploy (Automático)**:
- ✅ Validação de migrations (estrutura e nomenclatura)
- Executa no job `build-and-validate`
- Bloqueia deploy se houver problemas

**Pós-Deploy DEV (Automático)**:
- ✅ Smoke tests das APIs (Fibonacci e Nigredo)
- Executa no job `smoke-tests-dev`
- Falha orienta para rollback

**Pós-Deploy PROD (Automático)**:
- ✅ Smoke tests das APIs (Fibonacci e Nigredo)
- Aguarda 30s para estabilização
- Executa no job `smoke-tests-prod`
- Falha emite alerta crítico

**Documentação Completa**: [CI-CD-VALIDATION-INTEGRATION-SUMMARY.md](./CI-CD-VALIDATION-INTEGRATION-SUMMARY.md)

### Exemplos de Uso

#### Validação Completa

```powershell
# Validar tudo antes de deploy
.\scripts\validate-system-complete.ps1

# Validar migrations específicas
.\scripts\validate-migrations-aurora.ps1 -Verbose

# Smoke tests após deploy
.\scripts\smoke-tests-api-dev.ps1
```

#### Troubleshooting

```powershell
# Verificar guardrails de segurança
.\scripts\verify-security-guardrails.ps1

# Testar alertas SNS
.\scripts\test-security-alerts.ps1

# Guia de rollback (não executa, apenas orienta)
.\scripts\manual-rollback-guided.ps1
```

---

## Rollback & Incidentes

### Documentação Principal

| Documento | Descrição | Quando Usar |
|-----------|-----------|-------------|
| **[ROLLBACK-OPERACIONAL-AWS.md](./ROLLBACK-OPERACIONAL-AWS.md)** | Procedimentos de rollback | Problemas pós-deploy |
| **[VALIDACAO-E-SUPORTE-AWS.md](./VALIDACAO-E-SUPORTE-AWS.md)** | Scripts de validação | Validar estado do sistema |

### Matriz de Decisão Rápida

| Cenário | Severidade | Ação Imediata | Rollback? |
|---------|------------|---------------|-----------|
| Deploy CDK falhou | Baixa | Aguardar rollback automático | Não (CloudFormation reverte) |
| API retorna 500 | Alta | Investigar logs | Depende da causa |
| Funcionalidade quebrada | Média-Alta | Avaliar impacto | Sim, se crítico |
| Migration problemática | Crítica | Parar aplicação | Sim, com cuidado |
| Frontend quebrado | Média | Rollback S3/CloudFront | Sim |

### Cenários de Rollback

**Documentação Completa**: [ROLLBACK-OPERACIONAL-AWS.md](./ROLLBACK-OPERACIONAL-AWS.md)

1. **Deploy CDK Falhou** - CloudFormation reverte automaticamente
2. **API com Erros** - Rollback via CDK ou código
3. **Funcionalidade Quebrada** - Rollback de código + redeploy
4. **Migration Problemática** - Rollback de migration (cuidado!)
5. **Frontend Quebrado** - Rollback de S3/CloudFront

### Script de Rollback

```powershell
# Guia interativo de rollback
.\scripts\manual-rollback-guided.ps1

# Rollback CDK para versão anterior
cdk deploy --all --context env=dev --version-reporting false

# Rollback via Git
git revert <commit-hash>
git push origin main
# (Aguardar deploy automático)
```

---

## Spec & Kiro

### Spec Original

**Localização**: `.kiro/specs/ci-cd-aws-guardrails/`

| Documento | Descrição |
|-----------|-----------|
| **README.md** | Visão geral da spec |
| **requirements.md** | Requisitos funcionais |
| **design.md** | Design técnico |
| **tasks.md** | Lista de tarefas |
| **INDEX.md** | Índice da spec |

### Progresso da Spec

```
Tarefa 1: ████████████████████ 100% ✅ OIDC
Tarefa 2: ████████████████████ 100% ✅ Workflow
Tarefa 3: ████████████████████ 100% ✅ Segurança
Tarefa 4: ████████████████████ 100% ✅ Custo
Tarefa 5: ████████████████████ 100% ✅ Observabilidade
Tarefa 6: ████████████████████ 100% ✅ Scripts
Tarefa 7: ████████████████████ 100% 🔄 Documentação (em andamento)
Tarefa 8: ░░░░░░░░░░░░░░░░░░░░   0% ⏸️ Testes
Tarefa 9: ░░░░░░░░░░░░░░░░░░░░   0% ⏸️ Checklist Final

Total:    ████████████████░░░░  78% 🔄 Em Progresso
```

### Documentos de Progresso

| Documento | Descrição |
|-----------|-----------|
| **TASK-1-COMPLETE.md** | Tarefa 1 - Relatório completo |
| **TASK-2-COMPLETE.md** | Tarefa 2 - Relatório completo |
| **TASK-3-COMPLETE.md** | Tarefa 3 - Relatório completo |
| **TASK-4-COMPLETE.md** | Tarefa 4 - Relatório completo |
| **TASK-5-COMPLETE.md** | Tarefa 5 - Relatório completo |
| **TASK-6-COMPLETE.md** | Tarefa 6 - Relatório completo |

---

## 🚀 Próximos Passos

### Para Novos Membros

1. Leia [ONBOARDING-DEVOPS-ALQUIMISTAAI.md](./ONBOARDING-DEVOPS-ALQUIMISTAAI.md)
2. Leia [CI-CD-GUARDRAILS-OVERVIEW.md](./CI-CD-GUARDRAILS-OVERVIEW.md)
3. Execute scripts de validação localmente
4. Acompanhe um deploy em dev

### Para Operação Diária

1. Monitore alertas SNS (configurar assinaturas)
2. Revise CloudWatch Dashboards
3. Execute smoke tests após deploys
4. Documente incidentes

### Para Melhorias

- [ ] Implementar notificações SNS no pipeline
- [ ] Adicionar testes automáticos pós-deploy
- [ ] Criar dashboards CloudWatch customizados
- [ ] Implementar alertas no Slack/Teams

---

## 📞 Suporte

### Recursos AWS

- **Console AWS**: https://console.aws.amazon.com/
- **Região**: us-east-1
- **CloudWatch**: https://console.aws.amazon.com/cloudwatch/
- **Cost Explorer**: https://console.aws.amazon.com/cost-management/

### Links Úteis

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS CloudTrail Best Practices](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/best-practices-security.html)

---

**Última Atualização**: 17 de novembro de 2025  
**Versão**: 1.0  
**Mantido por**: Time DevOps AlquimistaAI
