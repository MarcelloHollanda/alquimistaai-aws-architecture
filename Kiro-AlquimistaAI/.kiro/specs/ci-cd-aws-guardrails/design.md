# Design - Pipeline CI/CD + Guardrails AWS

## Visão Geral

Este documento descreve o design técnico completo do pipeline CI/CD e guardrails AWS para o projeto AlquimistaAI, incluindo arquitetura, fluxos, integrações e decisões de design.

## Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                         GitHub Repository                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                │
│  │   Code     │  │  Workflow  │  │  Secrets   │                │
│  │ (TypeScript│  │   (.yml)   │  │  (OIDC)    │                │
│  │   + CDK)   │  │            │  │            │                │
│  └────────────┘  └────────────┘  └────────────┘                │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ OIDC Authentication
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                          AWS Account                             │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    IAM OIDC Provider                      │  │
│  │  - Trust Policy: github.com/MarcelloHollanda/*           │  │
│  │  - Role: GitHubActionsDeployRole                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                     │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    CDK Deployment                         │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐               │  │
│  │  │Fibonacci │  │ Nigredo  │  │Alquimista│               │  │
│  │  │  Stack   │  │  Stack   │  │  Stack   │               │  │
│  │  └──────────┘  └──────────┘  └──────────┘               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Guardrails Layer                       │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐               │  │
│  │  │CloudTrail│  │GuardDuty │  │ Budgets  │               │  │
│  │  └──────────┘  └──────────┘  └──────────┘               │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐               │  │
│  │  │Cost Anom.│  │CloudWatch│  │   SNS    │               │  │
│  │  └──────────┘  └──────────┘  └──────────┘               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Componentes Principais

### 1. GitHub Actions Workflow

**Arquivo:** `.github/workflows/ci-cd-alquimistaai.yml`


**Triggers:**
- `pull_request` para branch `main` (validação apenas)
- `push` para branch `main` (validação + deploy dev)
- `workflow_dispatch` com input de ambiente (deploy manual)
- Tags `v*` (deploy prod com aprovação)

**Jobs:**
1. **validate** - Validações de código e build
2. **deploy-dev** - Deploy automático em dev (após merge)
3. **deploy-prod** - Deploy em prod (manual, requer aprovação)

### 2. Integração OIDC GitHub ↔ AWS

**Componente:** IAM Identity Provider + Role

**Trust Policy:**
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

**Permissões Necessárias:**
- CloudFormation: CreateStack, UpdateStack, DeleteStack, DescribeStacks
- IAM: CreateRole, AttachRolePolicy, PassRole (limitado)
- Lambda: CreateFunction, UpdateFunctionCode, UpdateFunctionConfiguration
- API Gateway: CreateApi, UpdateApi, CreateRoute
- Aurora: CreateDBCluster, ModifyDBCluster (limitado)
- S3: CreateBucket, PutObject, PutBucketPolicy
- CloudFront: CreateDistribution, UpdateDistribution
- Secrets Manager: GetSecretValue (somente leitura)
- CloudWatch: PutMetricAlarm, PutDashboard
- SNS: CreateTopic, Subscribe, Publish

**Decisão de Design:** Usar OIDC ao invés de Access Keys para:
- Eliminar risco de vazamento de credenciais
- Rotação automática de tokens
- Auditoria clara via CloudTrail
- Conformidade com melhores práticas AWS

### 3. Fluxo do Pipeline CI/CD

#### 3.1 Fluxo de Pull Request

```
PR criado → Trigger workflow
    ↓
Checkout código
    ↓
Setup Node.js 20
    ↓
npm install
    ↓
npm run build
    ↓
Executar validate-system-complete.ps1
    ↓
cdk synth (todas as stacks)
    ↓
cdk diff (mostrar mudanças)
    ↓
Comentar resultado no PR
    ↓
✓ Sucesso / ✗ Falha
```

#### 3.2 Fluxo de Deploy Dev (Push para main)

```
Push para main → Trigger workflow
    ↓
Checkout código
    ↓
Setup Node.js 20
    ↓
npm install
    ↓
npm run build
    ↓
Executar validate-system-complete.ps1
    ↓
Configurar credenciais AWS (OIDC)
    ↓
cdk synth --context env=dev
    ↓
cdk deploy FibonacciStack-dev --require-approval never
    ↓
cdk deploy NigredoStack-dev --require-approval never
    ↓
cdk deploy AlquimistaStack-dev --require-approval never
    ↓
Executar testes de fumaça (smoke tests)
    ↓
Notificar sucesso/falha via SNS
    ↓
✓ Deploy completo
```

#### 3.3 Fluxo de Deploy Prod (Manual/Tag)

```
Tag v* criado OU workflow_dispatch
    ↓
Checkout código
    ↓
Setup Node.js 20
    ↓
npm install
    ↓
npm run build
    ↓
Executar validate-system-complete.ps1
    ↓
Configurar credenciais AWS (OIDC)
    ↓
cdk synth --context env=prod
    ↓
cdk diff (mostrar mudanças)
    ↓
⏸ APROVAÇÃO MANUAL REQUERIDA
    ↓
cdk deploy FibonacciStack-prod --require-approval never
    ↓
cdk deploy NigredoStack-prod --require-approval never
    ↓
cdk deploy AlquimistaStack-prod --require-approval never
    ↓
Executar testes de validação
    ↓
Notificar sucesso/falha via SNS
    ↓
✓ Deploy completo
```

### 4. Estratégia de Deploy

**Abordagem:** Deploy sequencial por stack

**Ordem de Deploy:**
1. **FibonacciStack** (contém Cognito, base da plataforma)
2. **NigredoStack** (depende de recursos compartilhados)
3. **AlquimistaStack** (plataforma de agentes)

**Justificativa:**
- Fibonacci contém Cognito User Pool usado por outros stacks
- Nigredo pode depender de recursos do Fibonacci
- AlquimistaStack é a camada de aplicação final

**Rollback:**
- CDK mantém estado anterior em CloudFormation
- Rollback manual via `cdk deploy` com versão anterior do código
- CloudFormation rollback automático em caso de falha parcial

### 5. Guardrails de Segurança

#### 5.1 AWS CloudTrail

**Configuração:**
- **Região:** us-east-1
- **Trail Name:** alquimista-audit-trail
- **S3 Bucket:** alquimista-cloudtrail-logs-{account-id}
- **Retenção:** 90 dias
- **Criptografia:** SSE-S3
- **Log File Validation:** Habilitado
- **Multi-Region:** Não (custo)
- **Management Events:** Todos
- **Data Events:** S3 e Lambda (seletivo)

**Implementação:** CDK Stack dedicado ou módulo no AlquimistaStack

#### 5.2 Amazon GuardDuty

**Configuração:**
- **Região:** us-east-1
- **Detector:** Habilitado
- **Finding Publishing Frequency:** 15 minutos
- **S3 Protection:** Habilitado
- **EKS Protection:** Desabilitado (não usado)
- **Malware Protection:** Habilitado

**Integração:**
- EventBridge Rule para achados HIGH/CRITICAL
- Target: SNS Topic `alquimista-security-alerts`

**Implementação:** CDK Stack ou módulo

#### 5.3 SNS para Alertas de Segurança

**Tópico:** `alquimista-security-alerts`
- **Protocolo:** Email
- **Assinantes:** Configurável via variável de ambiente
- **Criptografia:** AWS KMS (opcional)
- **Política de Acesso:** Restrita a GuardDuty e CloudWatch

### 6. Guardrails de Custo

#### 6.1 AWS Budgets

**Configuração:**
- **Budget Name:** alquimista-monthly-budget
- **Tipo:** Cost Budget
- **Período:** Mensal
- **Valor:** Configurável (ex: $500/mês)
- **Alertas:**
  - 80% do budget → Email
  - 100% do budget → Email (crítico)
  - 120% do budget → Email (emergência)

**Implementação:** CDK usando `aws-budgets` construct

#### 6.2 AWS Cost Anomaly Detection

**Configuração:**
- **Monitor Name:** alquimista-cost-monitor
- **Serviços Monitorados:**
  - AWS Lambda
  - Amazon API Gateway
  - Amazon Aurora
  - Amazon S3
  - Amazon CloudFront
- **Threshold:** $50 de impacto
- **Frequência:** Diária

**Integração:**
- SNS Topic: `alquimista-cost-alerts`
- Notificações por email

**Implementação:** CDK ou Terraform (Cost Anomaly Detection tem suporte limitado no CDK)

#### 6.3 SNS para Alertas de Custo

**Tópico:** `alquimista-cost-alerts`
- **Protocolo:** Email
- **Assinantes:** Equipe financeira + técnica
- **Mensagens:** Formatadas com contexto de custo

### 7. Observabilidade Mínima

#### 7.1 CloudWatch Alarms - Fibonacci

**Alarmes:**

1. **Fibonacci API 5XX Errors**
   - Métrica: `5XXError` (API Gateway)
   - Threshold: >= 5 erros em 5 minutos
   - Ação: SNS `alquimista-ops-alerts`

2. **Fibonacci Lambda Errors**
   - Métrica: `Errors` (Lambda)
   - Threshold: >= 3 erros em 5 minutos
   - Ação: SNS `alquimista-ops-alerts`

3. **Fibonacci Lambda Duration**
   - Métrica: `Duration` (Lambda)
   - Threshold: >= 25000ms (próximo ao timeout de 30s)
   - Ação: SNS `alquimista-ops-alerts`

#### 7.2 CloudWatch Alarms - Nigredo

**Alarmes:**

1. **Nigredo API 5XX Errors**
   - Métrica: `5XXError` (API Gateway)
   - Threshold: >= 5 erros em 5 minutos
   - Ação: SNS `alquimista-ops-alerts`

2. **Nigredo Lambda Errors**
   - Métrica: `Errors` (Lambda)
   - Threshold: >= 3 erros em 5 minutos
   - Ação: SNS `alquimista-ops-alerts`

#### 7.3 CloudWatch Alarms - Aurora

**Alarmes:**

1. **Aurora Database Connections**
   - Métrica: `DatabaseConnections`
   - Threshold: >= 80% da capacidade máxima
   - Ação: SNS `alquimista-ops-alerts`

2. **Aurora CPU Utilization**
   - Métrica: `CPUUtilization`
   - Threshold: >= 80% por 10 minutos
   - Ação: SNS `alquimista-ops-alerts`

3. **Aurora Serverless Capacity**
   - Métrica: `ServerlessDatabaseCapacity`
   - Threshold: >= 90% do máximo configurado
   - Ação: SNS `alquimista-ops-alerts`

#### 7.4 Log Retention

**Configuração:**
- **Lambda Logs:** 30 dias
- **API Gateway Logs:** 30 dias
- **CloudTrail Logs:** 90 dias
- **Formato:** JSON estruturado (já implementado)

**Implementação:** CDK `logRetention` property

#### 7.5 SNS para Alertas Operacionais

**Tópico:** `alquimista-ops-alerts`
- **Protocolo:** Email + (opcional) SMS
- **Assinantes:** Equipe de operações
- **Filtros:** Por severidade (INFO, WARNING, CRITICAL)

### 8. Compatibilidade com Windows

**Decisões de Design:**

1. **Scripts PowerShell:**
   - Todos os scripts auxiliares em `.ps1`
   - Uso de cmdlets nativos do PowerShell
   - Evitar dependências de ferramentas Unix

2. **GitHub Actions:**
   - Runner: `windows-latest`
   - Shell padrão: `pwsh` (PowerShell Core)
   - Comandos npm funcionam nativamente

3. **Validação Local:**
   - `scripts/validate-system-complete.ps1` já existe
   - Novos scripts seguem mesmo padrão
   - Documentação com exemplos PowerShell

### 9. Integração com Estado Atual

**Validações Obrigatórias:**

1. **Migrations Aurora:**
   - Verificar que 008 está aplicada
   - Verificar que 009 está pulada (conforme decisão)
   - Verificar que 010 está aplicada
   - Script: `scripts/validate-migrations-state.ps1` (novo)

2. **CDK Stacks:**
   - `npm run build` deve completar sem erros
   - `cdk synth FibonacciStack` deve gerar template válido
   - `cdk synth NigredoStack` deve gerar template válido
   - `cdk synth AlquimistaStack` deve gerar template válido

3. **Dependências:**
   - Stripe v14.21.0 instalado
   - Handlers Stripe tipados corretamente
   - Env vars validadas em runtime

**Não Modificar:**
- Estrutura de migrations existentes
- Schema do Aurora
- Configuração de stacks CDK (apenas adicionar guardrails)
- Handlers Lambda existentes

### 10. Pontos de Falha e Recuperação

#### 10.1 Falha: validate-system-complete.ps1

**Sintoma:** Script retorna código de saída != 0

**Ação Automática:**
- Pipeline interrompe imediatamente
- Não prossegue para deploy
- Logs completos salvos em GitHub Actions

**Recuperação:**
- Revisar logs do script
- Corrigir problema identificado
- Re-executar pipeline

#### 10.2 Falha: cdk synth

**Sintoma:** Erro de compilação TypeScript ou CDK

**Ação Automática:**
- Pipeline interrompe
- Erro de compilação reportado

**Recuperação:**
- Corrigir erro de TypeScript
- Validar localmente com `npm run build`
- Commit e push da correção

#### 10.3 Falha: cdk deploy (parcial)

**Sintoma:** CloudFormation rollback automático

**Ação Automática:**
- CloudFormation reverte mudanças da stack afetada
- Outras stacks não são afetadas
- Notificação via SNS

**Recuperação:**
- Revisar logs do CloudFormation
- Identificar recurso problemático
- Corrigir e re-deploy

#### 10.4 Falha: Testes Pós-Deploy

**Sintoma:** Smoke tests falham após deploy

**Ação Automática:**
- Pipeline marca como falha
- Deploy já foi realizado (não reverte automaticamente)
- Notificação via SNS

**Recuperação:**
- Avaliar severidade do problema
- Se crítico: rollback manual para versão anterior
- Se não crítico: hotfix e re-deploy

### 11. Arquitetura de Notificações

```
┌─────────────────────────────────────────────────────────────┐
│                    Fontes de Eventos                         │
├─────────────────────────────────────────────────────────────┤
│  GuardDuty  │  Budgets  │  Cost Anomaly  │  CloudWatch     │
└──────┬──────┴─────┬─────┴────────┬────────┴────────┬────────┘
       │            │              │                  │
       ▼            ▼              ▼                  ▼
┌──────────────────────────────────────────────────────────────┐
│                      SNS Topics                               │
├──────────────────────────────────────────────────────────────┤
│  security-alerts  │  cost-alerts  │  ops-alerts             │
└─────────┬─────────┴──────┬────────┴──────┬──────────────────┘
          │                │               │
          ▼                ▼               ▼
┌──────────────────────────────────────────────────────────────┐
│                    Assinantes (Email)                         │
├──────────────────────────────────────────────────────────────┤
│  Equipe Segurança │ Equipe Financeira │ Equipe Operações    │
└──────────────────────────────────────────────────────────────┘
```

### 12. Decisões de Design Importantes

#### 12.1 CDK vs Terraform para Guardrails

**Decisão:** Usar CDK para todos os guardrails

**Justificativa:**
- Projeto já usa CDK
- Consistência de ferramentas
- Melhor integração com stacks existentes
- Time já familiarizado com CDK

**Exceção:** Cost Anomaly Detection pode requerer configuração manual (suporte limitado no CDK)

#### 12.2 Stack Único vs Múltiplos para Guardrails

**Decisão:** Stack dedicado `GuardrailsStack`

**Justificativa:**
- Separação de responsabilidades
- Guardrails são infraestrutura transversal
- Facilita manutenção independente
- Pode ser deployado uma única vez

#### 12.3 Aprovação Manual em Prod

**Decisão:** Requer aprovação manual via GitHub Actions

**Justificativa:**
- Produção é ambiente crítico
- Permite revisão humana antes de mudanças
- Reduz risco de deploys acidentais
- Conformidade com melhores práticas

#### 12.4 Frequência de Alarmes

**Decisão:** Thresholds conservadores (5 erros em 5 min)

**Justificativa:**
- Evitar fadiga de alertas
- Focar em problemas reais
- Pode ser ajustado após observação

### 13. Diagrama de Sequência - Deploy Completo

```
Developer    GitHub       GitHub Actions    AWS OIDC    CDK/CloudFormation    SNS
    │            │                │             │              │                │
    │──Push──────>│                │             │              │                │
    │            │──Trigger───────>│             │              │                │
    │            │                │──Auth──────>│              │                │
    │            │                │<──Token─────│              │                │
    │            │                │                            │                │
    │            │                │──Synth─────────────────────>│                │
    │            │                │<──Templates────────────────│                │
    │            │                │                            │                │
    │            │                │──Deploy Stack 1───────────>│                │
    │            │                │                            │──Creating...   │
    │            │                │<──Success──────────────────│                │
    │            │                │                            │                │
    │            │                │──Deploy Stack 2───────────>│                │
    │            │                │                            │──Creating...   │
    │            │                │<──Success──────────────────│                │
    │            │                │                            │                │
    │            │                │──Deploy Stack 3───────────>│                │
    │            │                │                            │──Creating...   │
    │            │                │<──Success──────────────────│                │
    │            │                │                            │                │
    │            │                │──Notify Success────────────────────────────>│
    │            │                │                            │                │──Email
    │<──Status───│<──Complete─────│                            │                │
```

## Resumo de Arquivos a Criar/Modificar

### Novos Arquivos

1. `.github/workflows/ci-cd-alquimistaai.yml` - Workflow principal
2. `lib/guardrails-stack.ts` - Stack de guardrails
3. `scripts/validate-migrations-state.ps1` - Validação de migrations
4. `scripts/setup-oidc-github-aws.ps1` - Setup inicial OIDC
5. `docs/ci-cd/PIPELINE-OVERVIEW.md` - Documentação do pipeline
6. `docs/ci-cd/GUARDRAILS-GUIDE.md` - Guia de guardrails
7. `docs/ci-cd/TROUBLESHOOTING.md` - Troubleshooting

### Arquivos a Modificar

1. `bin/app.ts` - Adicionar GuardrailsStack
2. `package.json` - Adicionar scripts auxiliares
3. `README.md` - Adicionar seção sobre CI/CD
4. `cdk.json` - Adicionar contextos para ambientes

## Próximos Passos

Após aprovação deste design, seguir para implementação conforme tasks.md.
