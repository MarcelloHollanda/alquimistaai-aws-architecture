# Pipeline CI/CD - AlquimistaAI - Overview Completo

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Pipeline](#arquitetura-do-pipeline)
3. [Jobs do Workflow](#jobs-do-workflow)
4. [Fluxos de Execução](#fluxos-de-execução)
5. [Ambientes e Contextos](#ambientes-e-contextos)
6. [Segurança e Autenticação](#segurança-e-autenticação)
7. [Monitoramento e Notificações](#monitoramento-e-notificações)

---

## Visão Geral

O pipeline CI/CD do AlquimistaAI é uma solução completa de integração e entrega contínua baseada em **GitHub Actions**, projetada para automatizar validações, testes e deploys na AWS de forma segura e eficiente.

### Características Principais

- ✅ **Automação Completa**: Validação, build, testes e deploy automatizados
- ✅ **Segurança**: Autenticação via OIDC (sem credenciais de longo prazo)
- ✅ **Ambientes Separados**: Dev (automático) e Prod (manual com aprovação)
- ✅ **Guardrails**: Segurança, custo e observabilidade integrados
- ✅ **Compatibilidade Windows**: Scripts PowerShell nativos
- ✅ **Validação Pré-Deploy**: Migrations, compilação, CDK synth
- ✅ **Smoke Tests**: Validação automática pós-deploy

### Tecnologias Utilizadas

| Componente | Tecnologia | Versão |
|------------|------------|--------|
| CI/CD | GitHub Actions | Latest |
| IaC | AWS CDK | 2.x |
| Runtime | Node.js | 20.x |
| Shell | PowerShell | 7+ |
| Cloud | AWS | us-east-1 |
| Autenticação | OIDC | GitHub-AWS |

---

## Arquitetura do Pipeline

### Diagrama de Alto Nível

```
┌─────────────────────────────────────────────────────────────────┐
│                         GitHub Repository                        │
│                  alquimistaai-aws-architecture                   │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ Push/PR/Tag
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      GitHub Actions Workflow                     │
│                    ci-cd-alquimistaai.yml                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Job 1: build-and-validate                               │  │
│  │  • Checkout código                                        │  │
│  │  • Setup Node.js 20                                       │  │
│  │  • npm install                                            │  │
│  │  • npm run build                                          │  │
│  │  • Validar sistema (migrations, stacks)                  │  │
│  │  • CDK synth (todas as stacks)                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                      │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Job 2: deploy-dev (se push para main)                   │  │
│  │  • Autenticar AWS via OIDC                               │  │
│  │  • CDK deploy --all --context env=dev                    │  │
│  │  • Notificar resultado                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                      │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Job 3: smoke-tests-dev (após deploy-dev)                │  │
│  │  • Executar smoke tests automáticos                      │  │
│  │  • Validar health checks                                 │  │
│  │  • Validar endpoints principais                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Job 4: deploy-prod (manual ou tag)                      │  │
│  │  • Aguardar aprovação manual                             │  │
│  │  • Autenticar AWS via OIDC                               │  │
│  │  • CDK deploy --all --context env=prod                   │  │
│  │  • Notificar resultado                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                      │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Job 5: smoke-tests-prod (após deploy-prod)              │  │
│  │  • Aguardar 30s (cold start)                             │  │
│  │  • Executar smoke tests automáticos                      │  │
│  │  • Validar health checks                                 │  │
│  │  • Validar endpoints principais                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
             │
             │ OIDC Authentication
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                          AWS Account                             │
│                         (us-east-1)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Fibonacci    │  │ Nigredo      │  │ Alquimista   │         │
│  │ Stack        │  │ Stack        │  │ Stack        │         │
│  │ (Lambda+API) │  │ (Lambda+API) │  │ (Platform)   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Security     │  │ Aurora       │  │ CloudWatch   │         │
│  │ Stack        │  │ PostgreSQL   │  │ Dashboards   │         │
│  │ (Guardrails) │  │ (Database)   │  │ (Monitoring) │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Componentes Principais

#### 1. GitHub Actions Workflow
- **Arquivo**: `.github/workflows/ci-cd-alquimistaai.yml`
- **Função**: Orquestrar todo o processo de CI/CD
- **Triggers**: Push, PR, workflow_dispatch, tags

#### 2. IAM Role OIDC
- **Nome**: `GitHubActionsAlquimistaAICICD`
- **Função**: Permitir autenticação federada GitHub → AWS
- **Permissões**: CloudFormation, Lambda, API Gateway, Aurora, S3, etc.

#### 3. CDK Stacks
- **FibonacciStack**: API principal + Lambdas + Cognito
- **NigredoStack**: Sistema de prospecção
- **AlquimistaStack**: Plataforma de agentes
- **SecurityStack**: Guardrails (CloudTrail, GuardDuty, Budgets)

#### 4. Scripts de Suporte
- **validate-system-complete.ps1**: Validação pré-deploy
- **smoke-tests-api-dev.ps1**: Testes pós-deploy
- **validate-migrations-aurora.ps1**: Validação de migrations
- **manual-rollback-guided.ps1**: Guia de rollback

---

## Jobs do Workflow

### Job 1: build-and-validate

**Objetivo**: Validar código e preparar artefatos para deploy

**Quando Executa**:
- ✅ Pull Requests para main
- ✅ Push para main
- ✅ Workflow dispatch manual
- ✅ Tags de versão

**Etapas**:

1. **Checkout do Código**
   ```yaml
   - uses: actions/checkout@v4
   ```

2. **Setup Node.js 20**
   ```yaml
   - uses: actions/setup-node@v4
     with:
       node-version: '20'
       cache: 'npm'
   ```

3. **Instalar Dependências**
   ```powershell
   npm ci
   ```

4. **Build TypeScript**
   ```powershell
   npm run build
   ```

5. **Validar Sistema**
   ```powershell
   .\scripts\validate-system-complete.ps1
   ```
   - Valida estrutura de diretórios
   - Valida configurações CDK
   - Valida migrations Aurora
   - Valida dependências

6. **CDK Synth**
   ```powershell
   cdk synth --all --context env=dev
   ```
   - Gera templates CloudFormation
   - Valida configuração de stacks
   - Detecta erros de sintaxe

**Saída**:
- ✅ Código compilado
- ✅ Templates CloudFormation
- ✅ Artefatos de build

**Tempo Estimado**: 5-10 minutos

---

### Job 2: deploy-dev

**Objetivo**: Deploy automático no ambiente de desenvolvimento

**Quando Executa**:
- ✅ Após `build-and-validate` com sucesso
- ✅ Apenas em push para main
- ❌ NÃO executa em PRs

**Condição**:
```yaml
if: github.ref == 'refs/heads/main' && github.event_name == 'push'
```

**Etapas**:

1. **Checkout do Código**
   ```yaml
   - uses: actions/checkout@v4
   ```

2. **Setup Node.js 20**
   ```yaml
   - uses: actions/setup-node@v4
   ```

3. **Instalar Dependências**
   ```powershell
   npm ci
   ```

4. **Autenticar AWS via OIDC**
   ```yaml
   - uses: aws-actions/configure-aws-credentials@v4
     with:
       role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/GitHubActionsAlquimistaAICICD
       aws-region: us-east-1
   ```

5. **Deploy CDK**
   ```powershell
   cdk deploy --all --context env=dev --require-approval never
   ```
   - Deploy de todas as stacks
   - Sem aprovação manual
   - Contexto: dev

**Saída**:
- ✅ Stacks deployadas em dev
- ✅ Recursos AWS atualizados
- ✅ Outputs do CloudFormation

**Tempo Estimado**: 10-15 minutos

---

### Job 3: smoke-tests-dev

**Objetivo**: Validar deploy automático com testes de fumaça

**Quando Executa**:
- ✅ Após `deploy-dev` com sucesso
- ✅ Automaticamente

**Etapas**:

1. **Checkout do Código**
   ```yaml
   - uses: actions/checkout@v4
   ```

2. **Setup Node.js 20**
   ```yaml
   - uses: actions/setup-node@v4
   ```

3. **Instalar Dependências**
   ```powershell
   npm ci
   ```

4. **Autenticar AWS via OIDC**
   ```yaml
   - uses: aws-actions/configure-aws-credentials@v4
   ```

5. **Executar Smoke Tests**
   ```powershell
   .\scripts\smoke-tests-api-dev.ps1 -Environment dev -Verbose
   ```
   - Testa health checks
   - Testa endpoints principais
   - Valida respostas JSON

**Saída**:
- ✅ Relatório de testes
- ✅ Validação de endpoints
- ❌ Falha se APIs não respondem

**Tempo Estimado**: 2-5 minutos

---

### Job 4: deploy-prod

**Objetivo**: Deploy manual e protegido no ambiente de produção

**Quando Executa**:
- ✅ Workflow dispatch manual
- ✅ Tags de versão (v*)
- ✅ Após aprovação manual

**Condição**:
```yaml
if: github.event_name == 'workflow_dispatch' || startsWith(github.ref, 'refs/tags/v')
```

**Environment**:
```yaml
environment:
  name: prod
```
- Requer aprovação de revisores configurados
- Proteção adicional para produção

**Etapas**:

1. **Checkout do Código**
   ```yaml
   - uses: actions/checkout@v4
   ```

2. **Setup Node.js 20**
   ```yaml
   - uses: actions/setup-node@v4
   ```

3. **Instalar Dependências**
   ```powershell
   npm ci
   ```

4. **Autenticar AWS via OIDC**
   ```yaml
   - uses: aws-actions/configure-aws-credentials@v4
     with:
       role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/GitHubActionsAlquimistaAICICD
       aws-region: us-east-1
   ```

5. **CDK Diff (Informativo)**
   ```powershell
   cdk diff --all --context env=prod
   ```
   - Mostra mudanças que serão aplicadas
   - Não bloqueia deploy

6. **Deploy CDK**
   ```powershell
   cdk deploy --all --context env=prod
   ```
   - Deploy de todas as stacks
   - Contexto: prod

**Saída**:
- ✅ Stacks deployadas em prod
- ✅ Recursos AWS atualizados
- ✅ Outputs do CloudFormation

**Tempo Estimado**: 10-20 minutos (+ tempo de aprovação)

---

### Job 5: smoke-tests-prod

**Objetivo**: Validar deploy de produção com testes de fumaça

**Quando Executa**:
- ✅ Após `deploy-prod` com sucesso
- ✅ Automaticamente

**Etapas**:

1. **Aguardar Estabilização**
   ```powershell
   Start-Sleep -Seconds 30
   ```
   - Aguarda cold start das Lambdas

2. **Checkout do Código**
   ```yaml
   - uses: actions/checkout@v4
   ```

3. **Setup Node.js 20**
   ```yaml
   - uses: actions/setup-node@v4
   ```

4. **Instalar Dependências**
   ```powershell
   npm ci
   ```

5. **Autenticar AWS via OIDC**
   ```yaml
   - uses: aws-actions/configure-aws-credentials@v4
   ```

6. **Executar Smoke Tests**
   ```powershell
   .\scripts\smoke-tests-api-dev.ps1 -Environment prod -Verbose
   ```
   - Testa health checks
   - Testa endpoints principais
   - Valida respostas JSON

**Saída**:
- ✅ Relatório de testes
- ✅ Validação de endpoints
- ❌ Falha se APIs não respondem (alerta crítico)

**Tempo Estimado**: 2-5 minutos

---

## Fluxos de Execução

### Fluxo 1: Pull Request

```
PR criado → build-and-validate → ✅ Validação completa
                                 ❌ Deploy NÃO executa
```

**Objetivo**: Validar código antes de merge

**Etapas**:
1. Desenvolvedor cria PR para main
2. Workflow dispara automaticamente
3. Job `build-and-validate` executa
4. Resultado aparece no PR (✅ ou ❌)
5. Se ✅, PR pode ser merged
6. Se ❌, desenvolvedor corrige e push novamente

**Tempo**: 5-10 minutos

---

### Fluxo 2: Deploy Automático em Dev

```
Push para main → build-and-validate → deploy-dev → smoke-tests-dev → ✅ Deploy validado
```

**Objetivo**: Deploy automático e rápido em dev

**Etapas**:
1. Desenvolvedor faz push para main (ou merge de PR)
2. Workflow dispara automaticamente
3. Job `build-and-validate` executa (5-10 min)
4. Job `deploy-dev` executa (10-15 min)
5. Job `smoke-tests-dev` executa (2-5 min)
6. Deploy completo e validado

**Tempo Total**: 17-30 minutos

---

### Fluxo 3: Deploy Manual em Prod

```
Workflow dispatch → build-and-validate → deploy-prod (aguarda aprovação) → smoke-tests-prod → ✅ Deploy validado
```

**Objetivo**: Deploy controlado e seguro em prod

**Etapas**:
1. Desenvolvedor aciona workflow manualmente
2. Job `build-and-validate` executa (5-10 min)
3. Job `deploy-prod` aguarda aprovação
4. Revisor analisa e aprova
5. Job `deploy-prod` executa (10-20 min)
6. Job `smoke-tests-prod` executa (2-5 min)
7. Deploy completo e validado

**Tempo Total**: 17-35 minutos (+ tempo de aprovação)

---

### Fluxo 4: Deploy via Tag de Versão

```
Tag criada (v*) → build-and-validate → deploy-prod (aguarda aprovação) → smoke-tests-prod → ✅ Deploy validado
```

**Objetivo**: Deploy de release versionada

**Etapas**:
1. Desenvolvedor cria tag de versão (ex: v1.0.0)
2. Desenvolvedor faz push da tag
3. Workflow dispara automaticamente
4. Segue mesmo fluxo do deploy manual em prod

**Tempo Total**: 17-35 minutos (+ tempo de aprovação)

---

## Ambientes e Contextos

### Ambiente Dev

**Características**:
- ✅ Deploy automático
- ✅ Sem aprovação manual
- ✅ Múltiplos deploys por dia
- ✅ Validação rápida

**Contexto CDK**:
```powershell
--context env=dev
```

**Recursos AWS**:
- Sufixo: `-dev`
- Exemplos:
  - `FibonacciStack-dev`
  - `NigredoStack-dev`
  - `alquimista-security-alerts-dev`

**Uso**:
- Desenvolvimento ativo
- Testes de integração
- Validação de features

---

### Ambiente Prod

**Características**:
- ✅ Deploy manual
- ✅ Aprovação obrigatória
- ✅ Deploys planejados
- ✅ Validação completa

**Contexto CDK**:
```powershell
--context env=prod
```

**Recursos AWS**:
- Sufixo: `-prod`
- Exemplos:
  - `FibonacciStack-prod`
  - `NigredoStack-prod`
  - `alquimista-security-alerts-prod`

**Uso**:
- Produção
- Usuários finais
- Dados reais

---

## Segurança e Autenticação

### OIDC GitHub-AWS

**O que é**:
- Autenticação federada entre GitHub e AWS
- Elimina necessidade de credenciais de longo prazo
- Tokens temporários gerados automaticamente

**Como Funciona**:

```
GitHub Actions → OIDC Token → AWS STS → Temporary Credentials → AWS API
```

1. GitHub Actions solicita token OIDC
2. GitHub emite token com claims (repo, branch, etc.)
3. AWS STS valida token
4. AWS STS emite credenciais temporárias
5. Workflow usa credenciais para acessar AWS

**Configuração**:

**IAM Identity Provider**:
- URL: `https://token.actions.githubusercontent.com`
- Audience: `sts.amazonaws.com`

**IAM Role**:
- Nome: `GitHubActionsAlquimistaAICICD`
- Trust Policy:
  ```json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
        },
        "Action": "sts:AssumeRoleWithWebIdentity",
        "Condition": {
          "StringEquals": {
            "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
          },
          "StringLike": {
            "token.actions.githubusercontent.com:sub": "repo:MarcelloHollanda/alquimistaai-aws-architecture:*"
          }
        }
      }
    ]
  }
  ```

**Permissões da Role**:
- CloudFormation (full)
- Lambda (full)
- API Gateway (full)
- Aurora (full)
- S3 (full)
- CloudFront (full)
- IAM (limitado)
- CloudWatch (full)
- SNS (full)
- Secrets Manager (read)

**Documentação**: [docs/ci-cd/OIDC-SETUP.md](./OIDC-SETUP.md)

---

## Monitoramento e Notificações

### CloudWatch Alarms

**Alarmes Configurados**:

**Fibonacci**:
- API Gateway 5XX (>= 5 em 5 min)
- Lambda Errors (>= 3 em 5 min)
- Lambda Throttles (>= 1 em 10 min)

**Nigredo**:
- API Gateway 5XX (>= 5 em 5 min)
- Lambda Errors (>= 3 em 5 min)

**Aurora**:
- CPU Utilization (>= 80% por 10 min)
- Database Connections (>= 80 por 10 min)

**Ação**: Notificação via SNS

---

### SNS Topics

**3 Tópicos Configurados**:

1. **alquimista-security-alerts-{env}**
   - CloudTrail events
   - GuardDuty findings (HIGH/CRITICAL)

2. **alquimista-cost-alerts-{env}**
   - Budget alerts (80%, 100%, 120%)
   - Cost anomaly detection

3. **alquimista-ops-alerts-{env}**
   - CloudWatch alarms
   - Operational issues

**Configuração**:
- Assinaturas via variável de ambiente
- Formato: `SECURITY_ALERT_EMAIL`, `COST_ALERT_EMAIL`, `OPS_ALERT_EMAIL`

---

### Logs

**Retenção Configurada**:
- Lambda logs: 30 dias
- API Gateway logs: 30 dias
- CloudTrail logs: 90 dias

**Acesso**:
```powershell
# Ver logs de uma Lambda
aws logs tail /aws/lambda/fibonacci-handler-dev --follow --region us-east-1
```

---

## Recursos Adicionais

### Documentação Relacionada

- [CI-CD-PIPELINE-ALQUIMISTAAI.md](../CI-CD-PIPELINE-ALQUIMISTAAI.md) - Índice central
- [CI-CD-DEPLOY-FLOWS-DEV-PROD.md](../CI-CD-DEPLOY-FLOWS-DEV-PROD.md) - Fluxos práticos
- [GUARDRAILS-GUIDE.md](./GUARDRAILS-GUIDE.md) - Guia de guardrails
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Solução de problemas
- [QUICK-COMMANDS.md](./QUICK-COMMANDS.md) - Comandos rápidos

### Scripts Úteis

| Script | Função |
|--------|--------|
| `validate-system-complete.ps1` | Validação completa do sistema |
| `smoke-tests-api-dev.ps1` | Testes de fumaça das APIs |
| `validate-migrations-aurora.ps1` | Validação de migrations |
| `manual-rollback-guided.ps1` | Guia de rollback |

---

**Última Atualização**: 19 de novembro de 2025  
**Versão**: 1.0  
**Autor**: Kiro AI - Sistema de CI/CD AlquimistaAI
