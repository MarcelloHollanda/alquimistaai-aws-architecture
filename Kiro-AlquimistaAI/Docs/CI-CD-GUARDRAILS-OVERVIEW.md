# 🎯 Guia Mestre: CI/CD + Guardrails + Operação - AlquimistaAI

**Sistema**: AlquimistaAI / Fibonacci Orquestrador B2B  
**Região AWS**: us-east-1  
**Última Atualização**: 17 de novembro de 2025  
**Versão**: 1.0

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura de Alto Nível](#arquitetura-de-alto-nível)
3. [Ciclo de Vida do Código](#ciclo-de-vida-do-código)
4. [Mapa de Documentação](#mapa-de-documentação)
5. [Fluxo: Do Código ao Deploy](#fluxo-do-código-ao-deploy)
6. [Fluxo: Incident → Alerta → Ação](#fluxo-incident--alerta--ação)
7. [Próximos Passos](#próximos-passos)

---

## Visão Geral

Este documento é o **ponto de entrada central** para toda a documentação relacionada ao pipeline de CI/CD, guardrails de segurança/custo/observabilidade e operação do sistema AlquimistaAI na AWS.

### O que você encontrará aqui

- **Visão de alto nível** da arquitetura e componentes
- **Mapa completo** de toda a documentação disponível
- **Fluxos operacionais** do dia a dia
- **Links diretos** para guias especializados

### Para quem é este documento

- ✅ **Desenvolvedores** que precisam entender o pipeline
- ✅ **DevOps/SRE** que operam o sistema
- ✅ **Novos membros** do time (onboarding)
- ✅ **Gestores** que precisam de visão geral

---

## Arquitetura de Alto Nível

### Componentes Principais

```
┌─────────────────────────────────────────────────────────────────────┐
│                         APLICAÇÃO                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Fibonacci   │  │   Nigredo    │  │  Alquimista  │              │
│  │  Orquestrador│  │  Prospecção  │  │  Platform    │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                  │                  │                       │
│         └──────────────────┴──────────────────┘                      │
│                            │                                          │
│                            ▼                                          │
│         ┌──────────────────────────────────────┐                     │
│         │  API Gateway HTTP + Lambda Node 20   │                     │
│         └──────────────────┬───────────────────┘                     │
│                            │                                          │
│                            ▼                                          │
│         ┌──────────────────────────────────────┐                     │
│         │  Aurora Serverless v2 PostgreSQL     │                     │
│         │  Multi-AZ, Auto-scaling              │                     │
│         └──────────────────────────────────────┘                     │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      CI/CD + GUARDRAILS                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │  GitHub Actions (CI/CD Pipeline)                         │       │
│  │  - Build & Validate                                      │       │
│  │  - Deploy DEV (automático)                               │       │
│  │  - Deploy PROD (manual com aprovação)                    │       │
│  └──────────────────────────────────────────────────────────┘       │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Segurança   │  │    Custo     │  │Observabilidade│              │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤              │
│  │ CloudTrail   │  │ AWS Budgets  │  │ CloudWatch   │              │
│  │ GuardDuty    │  │ Cost Anomaly │  │ Alarmes      │              │
│  │ SNS Alerts   │  │ SNS Alerts   │  │ SNS Alerts   │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

### Stack Tecnológico

| Camada | Tecnologia | Descrição |
|--------|-----------|-----------|
| **Frontend** | Next.js 14 + TypeScript | SPA hospedado em S3 + CloudFront |
| **Backend** | Lambda Node.js 20 | Funções serverless |
| **API** | API Gateway HTTP | Endpoints REST |
| **Banco** | Aurora Serverless v2 PostgreSQL | Banco relacional auto-scaling |
| **Cache** | DynamoDB | Cache de sessões e dados temporários |
| **Auth** | Amazon Cognito | Autenticação e autorização |
| **IaC** | AWS CDK (TypeScript) | Infraestrutura como código |
| **CI/CD** | GitHub Actions | Pipeline de integração e deploy |

### Ambientes

| Ambiente | Propósito | Deploy | Aprovação |
|----------|-----------|--------|-----------|
| **dev** | Desenvolvimento e testes | Automático (merge → main) | Não requer |
| **prod** | Produção | Manual (workflow_dispatch ou tag) | Requer aprovação |

---

## Ciclo de Vida do Código

### Fluxo Completo

```
┌─────────────┐
│ Desenvolvedor│
│ cria branch │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Abre PR    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  CI: Build + Validate + Synth       │
│  - npm install                      │
│  - npm run build                    │
│  - validate-system-complete.ps1     │
│  - cdk synth (todas as stacks)      │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────┐
│ Code Review │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Merge → main│
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Deploy DEV (automático)            │
│  - cdk deploy --all --context env=dev│
│  - Smoke tests (opcional)           │
│  - Notificação SNS (futuro)         │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────┐
│ Validação   │
│ em DEV      │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Deploy PROD (manual)               │
│  - Trigger: workflow_dispatch ou tag│
│  - Aprovação manual requerida       │
│  - cdk deploy --all --context env=prod│
│  - Smoke tests (opcional)           │
│  - Notificação SNS (futuro)         │
└─────────────────────────────────────┘
```

### Conexão com Guardrails

Durante todo o ciclo de vida, os guardrails estão ativos:

- **CloudTrail**: Registra todas as ações de deploy
- **GuardDuty**: Monitora atividades suspeitas
- **Budgets**: Alerta sobre gastos anormais
- **CloudWatch**: Monitora erros e performance

---

## Mapa de Documentação

### 📘 Documentação Principal

| Documento | Descrição | Quando Consultar |
|-----------|-----------|------------------|
| **[CI-CD-PIPELINE-ALQUIMISTAAI.md](./CI-CD-PIPELINE-ALQUIMISTAAI.md)** | Índice central do pipeline | Ponto de entrada para CI/CD |
| **[SECURITY-GUARDRAILS-AWS.md](./SECURITY-GUARDRAILS-AWS.md)** | Guardrails de segurança | Configurar/entender CloudTrail e GuardDuty |
| **[COST-GUARDRAILS-AWS.md](./COST-GUARDRAILS-AWS.md)** | Guardrails de custo | Configurar/entender Budgets e Cost Anomaly |
| **[OBSERVABILITY-GUARDRAILS-AWS.md](./OBSERVABILITY-GUARDRAILS-AWS.md)** | Guardrails de observabilidade | Configurar/entender alarmes CloudWatch |
| **[VALIDACAO-E-SUPORTE-AWS.md](./VALIDACAO-E-SUPORTE-AWS.md)** | Scripts de validação | Validar sistema antes/depois de deploy |
| **[ROLLBACK-OPERACIONAL-AWS.md](./ROLLBACK-OPERACIONAL-AWS.md)** | Procedimentos de rollback | Em caso de problemas pós-deploy |

### 📗 Referências Rápidas

| Documento | Descrição | Quando Consultar |
|-----------|-----------|------------------|
| **[ci-cd/OIDC-SETUP.md](./ci-cd/OIDC-SETUP.md)** | Configuração OIDC GitHub ↔ AWS | Setup inicial ou troubleshooting de auth |
| **[ci-cd/COST-GUARDRAILS-QUICK-REFERENCE.md](./ci-cd/COST-GUARDRAILS-QUICK-REFERENCE.md)** | Referência rápida de custos | Consulta rápida de comandos e thresholds |
| **[ci-cd/OBSERVABILITY-QUICK-REFERENCE.md](./ci-cd/OBSERVABILITY-QUICK-REFERENCE.md)** | Referência rápida de observabilidade | Consulta rápida de alarmes e métricas |

### 📙 Documentação de Arquitetura

| Documento | Descrição | Quando Consultar |
|-----------|-----------|------------------|
| **[database/RESUMO-AURORA-OFICIAL.md](../database/RESUMO-AURORA-OFICIAL.md)** | Arquitetura oficial do Aurora | Entender estrutura do banco |
| **[database/AURORA-POSTGRESQL-PRONTO.md](../AURORA-POSTGRESQL-PRONTO.md)** | Status do Aurora | Verificar configuração atual |
| **[database/CONSOLIDACAO-AURORA-COMPLETA.md](../database/CONSOLIDACAO-AURORA-COMPLETA.md)** | Consolidação completa | Histórico e decisões técnicas |

### 📕 Spec Original

| Documento | Descrição | Quando Consultar |
|-----------|-----------|------------------|
| **[.kiro/specs/ci-cd-aws-guardrails/README.md](../.kiro/specs/ci-cd-aws-guardrails/README.md)** | Visão geral da spec | Entender objetivos e escopo |
| **[.kiro/specs/ci-cd-aws-guardrails/requirements.md](../.kiro/specs/ci-cd-aws-guardrails/requirements.md)** | Requisitos funcionais | Validar implementação |
| **[.kiro/specs/ci-cd-aws-guardrails/design.md](../.kiro/specs/ci-cd-aws-guardrails/design.md)** | Design técnico | Entender decisões de arquitetura |
| **[.kiro/specs/ci-cd-aws-guardrails/tasks.md](../.kiro/specs/ci-cd-aws-guardrails/tasks.md)** | Lista de tarefas | Acompanhar progresso |
| **[.kiro/specs/ci-cd-aws-guardrails/INDEX.md](../.kiro/specs/ci-cd-aws-guardrails/INDEX.md)** | Índice da spec | Navegar pela spec |

---

## Fluxo: Do Código ao Deploy

### Passo a Passo Típico

#### 1. Desenvolver Localmente

```powershell
# Criar branch
git checkout -b feature/minha-feature

# Desenvolver e testar localmente
npm run build
npm test

# Validar sistema completo
.\scripts\validate-system-complete.ps1
```

**Documentação**: [VALIDACAO-E-SUPORTE-AWS.md](./VALIDACAO-E-SUPORTE-AWS.md)

#### 2. Abrir Pull Request

```powershell
# Commit e push
git add .
git commit -m "feat: minha nova feature"
git push origin feature/minha-feature

# Abrir PR no GitHub
```

**O que acontece automaticamente:**
- ✅ CI executa: build, validate, synth
- ✅ Resultados aparecem no PR
- ❌ Deploy NÃO executa (apenas validação)

**Documentação**: [CI-CD-PIPELINE-ALQUIMISTAAI.md](./CI-CD-PIPELINE-ALQUIMISTAAI.md) → Seção "Job: build-and-validate"

#### 3. Code Review e Merge

```powershell
# Após aprovação, fazer merge
# (via interface do GitHub)
```

**O que acontece automaticamente:**
- ✅ CI executa novamente
- ✅ Deploy DEV executa automaticamente
- ✅ Stacks são atualizadas em dev
- ⏸️ Notificação SNS (futuro)

**Documentação**: [CI-CD-PIPELINE-ALQUIMISTAAI.md](./CI-CD-PIPELINE-ALQUIMISTAAI.md) → Seção "Fluxo de Deploy DEV"

#### 4. Validar em DEV

```powershell
# Executar smoke tests
.\scripts\smoke-tests-api-dev.ps1

# Validar migrations (se aplicável)
.\scripts\validate-migrations-aurora.ps1
```

**Documentação**: [VALIDACAO-E-SUPORTE-AWS.md](./VALIDACAO-E-SUPORTE-AWS.md)

#### 5. Deploy em PROD (Manual)

```powershell
# Opção 1: Via workflow_dispatch no GitHub
# - Acessar Actions → CI/CD Pipeline → Run workflow
# - Selecionar branch: main
# - Clicar em "Run workflow"

# Opção 2: Via tag
git tag -a v1.2.3 -m "Release v1.2.3"
git push origin v1.2.3
```

**O que acontece:**
- ⏸️ Workflow aguarda aprovação manual
- 👤 Aprovador revisa e aprova
- ✅ Deploy PROD executa
- ✅ Stacks são atualizadas em prod
- ⏸️ Notificação SNS (futuro)

**Documentação**: [CI-CD-PIPELINE-ALQUIMISTAAI.md](./CI-CD-PIPELINE-ALQUIMISTAAI.md) → Seção "Fluxo de Deploy PROD"

#### 6. Validar em PROD

```powershell
# Executar smoke tests em prod (ajustar URLs)
.\scripts\smoke-tests-api-dev.ps1 -Verbose

# Monitorar alarmes CloudWatch
# (via Console AWS ou SNS)
```

**Documentação**: [OBSERVABILITY-GUARDRAILS-AWS.md](./OBSERVABILITY-GUARDRAILS-AWS.md)

---

## Fluxo: Incident → Alerta → Ação

### Tipos de Alertas

#### 1. Alerta de Custo 💰

**Origem**: AWS Budgets ou Cost Anomaly Detection

**Canal**: SNS Topic `alquimista-cost-alerts-{env}`

**Exemplo de Alerta**:
```
Assunto: AWS Budget Alert - 80% do orçamento atingido
Corpo: Seu orçamento mensal de $500 atingiu 80% ($400).
```

**O que fazer**:
1. Acessar AWS Cost Explorer
2. Identificar serviços com maior gasto
3. Avaliar se é esperado ou anômalo
4. Tomar ação: otimizar recursos ou ajustar budget

**Documentação**: [COST-GUARDRAILS-AWS.md](./COST-GUARDRAILS-AWS.md) → Seção "Guia Operacional"

#### 2. Alerta de Segurança 🛡️

**Origem**: GuardDuty

**Canal**: SNS Topic `alquimista-security-alerts-{env}`

**Exemplo de Alerta**:
```
Assunto: GuardDuty Finding - HIGH Severity
Corpo: Atividade suspeita detectada: UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration
```

**O que fazer**:
1. Acessar GuardDuty no Console AWS
2. Revisar detalhes do finding
3. Avaliar se é falso positivo ou ameaça real
4. Tomar ação: revogar credenciais, bloquear IP, etc.
5. Documentar incidente

**Documentação**: [SECURITY-GUARDRAILS-AWS.md](./SECURITY-GUARDRAILS-AWS.md) → Seção "Fluxo de Resposta a Incidentes"

#### 3. Alerta Operacional ⚠️

**Origem**: CloudWatch Alarmes

**Canal**: SNS Topic `alquimista-ops-alerts-{env}`

**Exemplo de Alerta**:
```
Assunto: CloudWatch Alarm - Fibonacci API 5XX Errors
Corpo: Alarme em estado ALARM. Threshold: >= 5 erros em 5 minutos.
```

**O que fazer**:
1. Acessar CloudWatch Logs
2. Filtrar logs do período do alarme
3. Identificar causa raiz (erro de código, timeout, etc.)
4. Avaliar necessidade de rollback
5. Corrigir problema e validar

**Documentação**: [OBSERVABILITY-GUARDRAILS-AWS.md](./OBSERVABILITY-GUARDRAILS-AWS.md) → Seção "Fluxos de Ação"

### Matriz de Decisão Rápida

| Tipo de Alerta | Severidade | Ação Imediata | Rollback? |
|----------------|------------|---------------|-----------|
| Budget 80% | Baixa | Revisar custos | Não |
| Budget 100% | Média | Otimizar recursos | Não |
| Budget 120% | Alta | Ação urgente | Não |
| Cost Anomaly | Média-Alta | Investigar causa | Depende |
| GuardDuty LOW | Baixa | Revisar quando possível | Não |
| GuardDuty MEDIUM | Média | Revisar em 24h | Não |
| GuardDuty HIGH | Alta | Revisar imediatamente | Depende |
| GuardDuty CRITICAL | Crítica | Ação urgente | Sim, se necessário |
| API 5XX | Alta | Investigar logs | Sim, se persistir |
| Lambda Errors | Média-Alta | Investigar logs | Sim, se crítico |
| Aurora CPU Alta | Média | Monitorar | Não imediato |
| Aurora Conexões | Alta | Investigar leak | Sim, se crítico |

---

## Próximos Passos

### Para Novos Membros do Time

1. **Leia este documento** para entender a visão geral
2. **Leia o [Onboarding DevOps](./ONBOARDING-DEVOPS-ALQUIMISTAAI.md)** para guia passo-a-passo
3. **Leia o [Índice Operacional](./INDEX-OPERATIONS-AWS.md)** para referência rápida
4. **Execute os scripts de validação** localmente para se familiarizar
5. **Acompanhe um deploy** em dev para ver o fluxo na prática

### Para Operação do Dia a Dia

1. **Monitore alertas SNS** (configurar assinaturas de email)
2. **Revise CloudWatch Dashboards** periodicamente
3. **Execute smoke tests** após deploys
4. **Documente incidentes** e aprendizados
5. **Mantenha documentação atualizada**

### Para Melhorias Futuras

- [ ] Implementar notificações SNS no pipeline (Tarefa 5)
- [ ] Adicionar testes de fumaça automáticos pós-deploy
- [ ] Criar dashboards CloudWatch customizados
- [ ] Implementar alertas no Slack/Teams
- [ ] Adicionar métricas de negócio aos dashboards

---

## Suporte e Contatos

### Documentação

- **Spec Original**: `.kiro/specs/ci-cd-aws-guardrails/`
- **Documentação Técnica**: `docs/`
- **Scripts**: `scripts/`

### Recursos AWS

- **Console AWS**: https://console.aws.amazon.com/
- **Região**: us-east-1
- **CloudWatch**: https://console.aws.amazon.com/cloudwatch/
- **Cost Explorer**: https://console.aws.amazon.com/cost-management/

### Links Úteis

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS CloudTrail Best Practices](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/best-practices-security.html)
- [AWS GuardDuty Documentation](https://docs.aws.amazon.com/guardduty/)
- [AWS Budgets Documentation](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html)

---

**Última Atualização**: 17 de novembro de 2025  
**Versão**: 1.0  
**Mantido por**: Time DevOps AlquimistaAI
