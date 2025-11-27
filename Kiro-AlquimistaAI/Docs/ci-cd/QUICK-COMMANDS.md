# Comandos Rápidos - CI/CD AlquimistaAI

## 📋 Índice

1. [🧪 Teste do Workflow](#-teste-do-workflow)
2. [Deploy](#deploy)
3. [Validação](#validação)
4. [Logs e Monitoramento](#logs-e-monitoramento)
5. [Rollback](#rollback)
6. [Guardrails](#guardrails)
7. [Troubleshooting](#troubleshooting)

---

## 🧪 Teste do Workflow

### Teste Rápido (Recomendado)

```powershell
# Teste básico (seguro, sem deploy)
.\scripts\test-ci-cd-workflow.ps1 -TestType basic

# Teste completo (com deploy real)
.\scripts\test-ci-cd-workflow.ps1 -TestType full

# Teste de segurança (deve falhar propositalmente)
.\scripts\test-ci-cd-workflow.ps1 -TestType security
```

### Monitorar Workflow

```powershell
# Via GitHub CLI
gh run list --limit 5
gh run watch

# Ver logs
gh run view --log
```

### Documentação de Teste

- 📖 [Teste Rápido](./QUICK-TEST.md) - Início rápido
- 📖 [Validação Completa](./TESTE-WORKFLOW-VALIDACAO.md) - Guia detalhado
- 📖 [Guia Visual](./WORKFLOW-VISUAL-GUIDE.md) - Fluxo visual

---

## Deploy

### Deploy Automático em Dev

```powershell
# Fazer mudanças no código
git add .
git commit -m "feat: adicionar nova funcionalidade"
git push origin main

# Deploy dispara automaticamente
# Acompanhar em: https://github.com/MarcelloHollanda/alquimistaai-aws-architecture/actions
```

---

### Deploy Manual em Prod

**Via GitHub Actions**:
1. Acessar: https://github.com/MarcelloHollanda/alquimistaai-aws-architecture/actions
2. Clicar em "CI/CD AlquimistaAI"
3. Clicar em "Run workflow"
4. Selecionar branch: main
5. Selecionar environment: prod
6. Clicar em "Run workflow"
7. Aguardar aprovação
8. Aprovar deploy

**Via Tag de Versão**:
```powershell
# Criar tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Deploy dispara automaticamente
# Aguardar aprovação
```

---

### Deploy Local (Desenvolvimento)

```powershell
# Build
npm run build

# Validar
.\scripts\validate-system-complete.ps1

# CDK synth
cdk synth --all --context env=dev

# Deploy
cdk deploy --all --context env=dev
```

---

## Validação

### Validação Completa do Sistema

```powershell
# Executar validação completa
.\scripts\validate-system-complete.ps1

# Com verbose
.\scripts\validate-system-complete.ps1 -Verbose
```

---

### Validação de Migrations

```powershell
# Validar migrations Aurora
.\scripts\validate-migrations-aurora.ps1

# Com verbose
.\scripts\validate-migrations-aurora.ps1 -Verbose

# Para ambiente específico
.\scripts\validate-migrations-aurora.ps1 -Environment dev
```

---

### Smoke Tests

```powershell
# Executar smoke tests em dev
.\scripts\smoke-tests-api-dev.ps1 -Environment dev

# Com verbose
.\scripts\smoke-tests-api-dev.ps1 -Environment dev -Verbose

# Em prod
.\scripts\smoke-tests-api-dev.ps1 -Environment prod -Verbose
```

---

### CDK Diff

```powershell
# Ver mudanças que serão aplicadas em dev
cdk diff --all --context env=dev

# Em prod
cdk diff --all --context env=prod

# Stack específica
cdk diff FibonacciStack-dev --context env=dev
```

---

## Logs e Monitoramento

### Ver Logs de Lambda

```powershell
# Logs em tempo real
aws logs tail /aws/lambda/fibonacci-handler-dev --follow --region us-east-1

# Últimas 100 linhas
aws logs tail /aws/lambda/fibonacci-handler-dev --since 1h --region us-east-1

# Buscar por erro
aws logs filter-log-events `
  --log-group-name /aws/lambda/fibonacci-handler-dev `
  --filter-pattern "ERROR" `
  --region us-east-1
```

---

### Ver Logs de API Gateway

```powershell
# Logs em tempo real
aws logs tail /aws/apigateway/fibonacci-api-dev --follow --region us-east-1

# Últimas 100 linhas
aws logs tail /aws/apigateway/fibonacci-api-dev --since 1h --region us-east-1

# Buscar por status 500
aws logs filter-log-events `
  --log-group-name /aws/apigateway/fibonacci-api-dev `
  --filter-pattern "500" `
  --region us-east-1
```

---

### Ver Estado de Stacks

```powershell
# Listar todas as stacks
aws cloudformation list-stacks --region us-east-1

# Stacks de dev
aws cloudformation list-stacks `
  --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE `
  --query "StackSummaries[?contains(StackName, 'dev')].{Name:StackName, Status:StackStatus}" `
  --output table `
  --region us-east-1

# Stacks de prod
aws cloudformation list-stacks `
  --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE `
  --query "StackSummaries[?contains(StackName, 'prod')].{Name:StackName, Status:StackStatus}" `
  --output table `
  --region us-east-1
```

---

### Ver Eventos de Stack

```powershell
# Eventos recentes
aws cloudformation describe-stack-events `
  --stack-name FibonacciStack-dev `
  --max-items 20 `
  --region us-east-1

# Apenas erros
aws cloudformation describe-stack-events `
  --stack-name FibonacciStack-dev `
  --query "StackEvents[?ResourceStatus=='CREATE_FAILED' || ResourceStatus=='UPDATE_FAILED']" `
  --region us-east-1
```

---

### Ver Alarmes CloudWatch

```powershell
# Listar todos os alarmes
aws cloudwatch describe-alarms --region us-east-1

# Alarmes em estado de alarme
aws cloudwatch describe-alarms --state-value ALARM --region us-east-1

# Alarme específico
aws cloudwatch describe-alarms --alarm-names Fibonacci-API-Gateway-5XX --region us-east-1

# Histórico de alarme
aws cloudwatch describe-alarm-history `
  --alarm-name Fibonacci-API-Gateway-5XX `
  --max-records 10 `
  --region us-east-1
```

---

## Rollback

### Rollback via Git

```powershell
# Ver commits recentes
git log --oneline -10

# Reverter último commit
git revert HEAD
git push origin main

# Reverter commit específico
git revert <commit-hash>
git push origin main

# Reverter múltiplos commits
git revert HEAD~3..HEAD
git push origin main
```

---

### Rollback via CDK

```powershell
# Checkout do commit anterior
git checkout <commit-anterior>

# Deploy da stack
cdk deploy FibonacciStack-dev --context env=dev

# Validar
.\scripts\smoke-tests-api-dev.ps1 -Environment dev

# Voltar para main
git checkout main
```

---

### Rollback Guiado

```powershell
# Executar script de rollback guiado
.\scripts\manual-rollback-guided.ps1 -Environment dev

# Para prod
.\scripts\manual-rollback-guided.ps1 -Environment prod

# Seguir instruções interativas
```

---

## Guardrails

### Verificar Guardrails de Segurança

```powershell
# Executar script de verificação
.\scripts\verify-security-guardrails.ps1

# Com verbose
.\scripts\verify-security-guardrails.ps1 -Verbose
```

---

### Testar Alertas de Segurança

```powershell
# Executar script de teste
.\scripts\test-security-alerts.ps1

# Com verbose
.\scripts\test-security-alerts.ps1 -Verbose
```

---

### Ver Findings do GuardDuty

```powershell
# Listar detector
aws guardduty list-detectors --region us-east-1

# Listar findings
aws guardduty list-findings --detector-id <detector-id> --region us-east-1

# Ver detalhes de um finding
aws guardduty get-findings `
  --detector-id <detector-id> `
  --finding-ids <finding-id> `
  --region us-east-1
```

---

### Ver Gastos AWS

```powershell
# Gastos do mês atual
aws ce get-cost-and-usage `
  --time-period Start=2025-11-01,End=2025-11-30 `
  --granularity MONTHLY `
  --metrics BlendedCost `
  --region us-east-1

# Gastos por serviço
aws ce get-cost-and-usage `
  --time-period Start=2025-11-01,End=2025-11-30 `
  --granularity DAILY `
  --metrics BlendedCost `
  --group-by Type=DIMENSION,Key=SERVICE `
  --region us-east-1
```

---

### Ver Anomalias de Custo

```powershell
# Listar anomalias detectadas
aws ce get-anomalies `
  --date-interval Start=2025-11-01,End=2025-11-30 `
  --region us-east-1
```

---

### Gerenciar Assinaturas SNS

```powershell
# Listar tópicos
aws sns list-topics --region us-east-1

# Listar assinaturas de um tópico
aws sns list-subscriptions-by-topic `
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:alquimista-ops-alerts-dev `
  --region us-east-1

# Adicionar assinatura de email
aws sns subscribe `
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:alquimista-ops-alerts-dev `
  --protocol email `
  --notification-endpoint ops@alquimista.ai `
  --region us-east-1

# Testar envio
aws sns publish `
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:alquimista-ops-alerts-dev `
  --message "Test message" `
  --region us-east-1
```

---

## Troubleshooting

### Limpar Cache e Reinstalar

```powershell
# Limpar cache npm
npm cache clean --force

# Deletar node_modules
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# Reinstalar
npm install
```

---

### Verificar Configuração AWS

```powershell
# Ver credenciais atuais
aws sts get-caller-identity

# Ver região configurada
aws configure get region

# Testar conectividade
aws s3 ls
```

---

### Verificar Configuração CDK

```powershell
# Ver versão do CDK
cdk --version

# Ver contexto
cdk context

# Limpar contexto
cdk context --clear
```

---

### Deletar Stack

```powershell
# CUIDADO: Isso deleta todos os recursos da stack

# Dev
cdk destroy FibonacciStack-dev --context env=dev

# Prod (requer confirmação)
cdk destroy FibonacciStack-prod --context env=prod
```

---

### Forçar Recriação de Recurso

```powershell
# Deletar recurso manualmente
aws lambda delete-function --function-name function-name --region us-east-1

# Deploy novamente
cdk deploy FibonacciStack-dev --context env=dev
```

---

## Atalhos Úteis

### Aliases PowerShell

Adicione ao seu perfil PowerShell (`$PROFILE`):

```powershell
# Aliases de deploy
function Deploy-Dev { cdk deploy --all --context env=dev }
function Deploy-Prod { cdk deploy --all --context env=prod }

# Aliases de validação
function Validate-System { .\scripts\validate-system-complete.ps1 }
function Smoke-Tests-Dev { .\scripts\smoke-tests-api-dev.ps1 -Environment dev -Verbose }
function Smoke-Tests-Prod { .\scripts\smoke-tests-api-dev.ps1 -Environment prod -Verbose }

# Aliases de logs
function Logs-Fibonacci-Dev { aws logs tail /aws/lambda/fibonacci-handler-dev --follow --region us-east-1 }
function Logs-Nigredo-Dev { aws logs tail /aws/lambda/nigredo-handler-dev --follow --region us-east-1 }

# Aliases de rollback
function Rollback-Dev { .\scripts\manual-rollback-guided.ps1 -Environment dev }
function Rollback-Prod { .\scripts\manual-rollback-guided.ps1 -Environment prod }
```

**Uso**:
```powershell
# Depois de adicionar ao perfil
Deploy-Dev
Validate-System
Smoke-Tests-Dev
Logs-Fibonacci-Dev
Rollback-Dev
```

---

### Variáveis de Ambiente Úteis

```powershell
# Configurar emails para alertas
$env:SECURITY_ALERT_EMAIL = "security@alquimista.ai"
$env:COST_ALERT_EMAIL = "finance@alquimista.ai"
$env:OPS_ALERT_EMAIL = "ops@alquimista.ai"

# Configurar orçamento
$env:MONTHLY_BUDGET_AMOUNT = "500"

# Configurar região AWS
$env:AWS_REGION = "us-east-1"
$env:AWS_DEFAULT_REGION = "us-east-1"
```

---

## Recursos Adicionais

### Links Úteis

- **GitHub Actions**: https://github.com/MarcelloHollanda/alquimistaai-aws-architecture/actions
- **AWS Console**: https://console.aws.amazon.com/
- **CloudFormation**: https://console.aws.amazon.com/cloudformation/
- **CloudWatch**: https://console.aws.amazon.com/cloudwatch/
- **Lambda**: https://console.aws.amazon.com/lambda/
- **GuardDuty**: https://console.aws.amazon.com/guardduty/
- **Cost Explorer**: https://console.aws.amazon.com/cost-management/

### Documentação

- [PIPELINE-OVERVIEW.md](./PIPELINE-OVERVIEW.md) - Overview do pipeline
- [CI-CD-DEPLOY-FLOWS-DEV-PROD.md](../CI-CD-DEPLOY-FLOWS-DEV-PROD.md) - Fluxos de deploy
- [GUARDRAILS-GUIDE.md](./GUARDRAILS-GUIDE.md) - Guia de guardrails
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Solução de problemas
- [ROLLBACK-OPERACIONAL-AWS.md](../ROLLBACK-OPERACIONAL-AWS.md) - Procedimentos de rollback

### Scripts

| Script | Comando |
|--------|---------|
| Validação completa | `.\scripts\validate-system-complete.ps1` |
| Smoke tests | `.\scripts\smoke-tests-api-dev.ps1 -Environment dev` |
| Validar migrations | `.\scripts\validate-migrations-aurora.ps1` |
| Rollback guiado | `.\scripts\manual-rollback-guided.ps1 -Environment dev` |
| Verificar segurança | `.\scripts\verify-security-guardrails.ps1` |
| Testar alertas | `.\scripts\test-security-alerts.ps1` |

---

**Última Atualização**: 19 de novembro de 2025  
**Versão**: 1.0  
**Autor**: Kiro AI - Sistema de CI/CD AlquimistaAI
