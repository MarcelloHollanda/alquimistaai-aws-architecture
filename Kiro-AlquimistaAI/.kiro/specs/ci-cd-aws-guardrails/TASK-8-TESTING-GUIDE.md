# Tarefa 8 - Testes e Validação Final - Guia de Execução

## 📋 Visão Geral

Este documento fornece um guia passo-a-passo para executar todos os testes e validações da Tarefa 8, garantindo que o pipeline CI/CD está funcionando corretamente end-to-end.

**Status**: 🔄 Pronto para Execução  
**Pré-requisitos**: Tarefas 1-7 completas

---

## ✅ Checklist de Pré-requisitos

Antes de iniciar os testes, verifique:

- [ ] AWS_ACCOUNT_ID configurado no GitHub Secrets
- [ ] OIDC configurado na AWS (Tarefa 1)
- [ ] SecurityStack deployado
- [ ] Workflow GitHub Actions criado
- [ ] Scripts de validação criados
- [ ] Documentação completa

---

## 🧪 8.1 Testar Workflow em PR

### Objetivo
Verificar que o workflow executa validações em Pull Requests sem fazer deploy.

### Passo a Passo

#### 1. Criar Branch de Teste
```powershell
# Criar nova branch
git checkout -b test/workflow-pr-validation

# Fazer uma mudança simples
echo "# Test PR" >> TEST-PR.md
git add TEST-PR.md
git commit -m "test: validar workflow em PR"

# Push da branch
git push origin test/workflow-pr-validation
```

#### 2. Criar Pull Request
1. Acessar: https://github.com/MarcelloHollanda/alquimistaai-aws-architecture/pulls
2. Clicar em "New pull request"
3. Base: `main` ← Compare: `test/workflow-pr-validation`
4. Criar PR com título: "Test: Validar Workflow em PR"

#### 3. Verificar Execução do Workflow
1. Acessar: https://github.com/MarcelloHollanda/alquimistaai-aws-architecture/actions
2. Verificar que workflow iniciou automaticamente
3. Verificar que job `build-and-validate` está executando

#### 4. Verificar Validações
Aguardar conclusão e verificar:
- ✅ Job `build-and-validate` completou com sucesso
- ✅ npm install executou
- ✅ npm run build executou
- ✅ validate-system-complete.ps1 executou
- ✅ cdk synth executou

#### 5. Verificar Que Deploy NÃO Executou
- ❌ Job `deploy-dev` NÃO deve ter executado
- ❌ Job `deploy-prod` NÃO deve ter executado
- ✅ Apenas validação, sem deploy

#### 6. Verificar Status no PR
1. Voltar para o PR
2. Verificar que status check aparece (✅ ou ❌)
3. Verificar que pode fazer merge se passou

#### 7. Limpar
```powershell
# Fechar PR sem merge
# Deletar branch
git checkout main
git branch -D test/workflow-pr-validation
git push origin --delete test/workflow-pr-validation
```

### Critérios de Sucesso
- ✅ Workflow executou automaticamente
- ✅ Validações passaram
- ✅ Deploy NÃO executou
- ✅ Status apareceu no PR

### Troubleshooting
Se falhar, consultar: [TROUBLESHOOTING.md](../../../docs/ci-cd/TROUBLESHOOTING.md)

---

## 🚀 8.2 Testar Deploy em Dev

### Objetivo
Verificar que deploy automático em dev funciona após merge para main.

### Passo a Passo

#### 1. Criar Branch de Teste
```powershell
# Criar nova branch
git checkout -b test/deploy-dev

# Fazer uma mudança simples
echo "# Test Deploy Dev" >> TEST-DEPLOY-DEV.md
git add TEST-DEPLOY-DEV.md
git commit -m "test: validar deploy em dev"

# Push da branch
git push origin test/deploy-dev
```

#### 2. Criar e Fazer Merge do PR
1. Criar PR: `test/deploy-dev` → `main`
2. Aguardar validações passarem
3. Fazer merge do PR

#### 3. Verificar Execução do Workflow
1. Acessar: https://github.com/MarcelloHollanda/alquimistaai-aws-architecture/actions
2. Verificar que workflow iniciou automaticamente após merge
3. Verificar jobs em execução

#### 4. Verificar Job build-and-validate
- ✅ Compilação bem-sucedida
- ✅ Validações passaram
- ✅ CDK synth executou

#### 5. Verificar Job deploy-dev
- ✅ Job iniciou automaticamente
- ✅ Autenticação AWS via OIDC bem-sucedida
- ✅ CDK deploy executando
- ✅ Stacks sendo atualizadas

#### 6. Verificar Job smoke-tests-dev
- ✅ Job iniciou após deploy-dev
- ✅ Smoke tests executando
- ✅ Endpoints respondendo

#### 7. Verificar Stacks no CloudFormation
```powershell
# Listar stacks de dev
aws cloudformation list-stacks `
  --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE `
  --query "StackSummaries[?contains(StackName, 'dev')].{Name:StackName, Status:StackStatus}" `
  --output table `
  --region us-east-1
```

#### 8. Verificar Notificações SNS (se configurado)
- Verificar email de notificação (se configurado)
- Verificar tópico SNS recebeu mensagem

#### 9. Limpar
```powershell
# Deletar arquivo de teste
git rm TEST-DEPLOY-DEV.md
git commit -m "chore: limpar teste de deploy"
git push origin main
```

### Critérios de Sucesso
- ✅ Deploy executou automaticamente
- ✅ Stacks atualizadas com sucesso
- ✅ Smoke tests passaram
- ✅ APIs respondendo

### Troubleshooting
Se falhar, consultar: [TROUBLESHOOTING.md](../../../docs/ci-cd/TROUBLESHOOTING.md)

---

## 🔒 8.3 Testar Guardrails de Segurança

### Objetivo
Verificar que CloudTrail e GuardDuty estão ativos e funcionando.

### Passo a Passo

#### 1. Verificar CloudTrail
```powershell
# Listar trails
aws cloudtrail list-trails --region us-east-1

# Ver eventos recentes
aws cloudtrail lookup-events --max-results 10 --region us-east-1

# Verificar bucket S3
aws s3 ls s3://alquimista-cloudtrail-logs-ACCOUNT_ID-dev/
```

**Esperado**:
- ✅ Trail existe e está ativo
- ✅ Eventos sendo registrados
- ✅ Logs no S3

#### 2. Verificar GuardDuty
```powershell
# Listar detectores
aws guardduty list-detectors --region us-east-1

# Ver status do detector
aws guardduty get-detector --detector-id <detector-id> --region us-east-1

# Listar findings (se houver)
aws guardduty list-findings --detector-id <detector-id> --region us-east-1
```

**Esperado**:
- ✅ Detector existe e está habilitado
- ✅ Status: ENABLED
- ✅ S3 Protection habilitado

#### 3. Verificar SNS Topic de Segurança
```powershell
# Listar tópicos
aws sns list-topics --region us-east-1 | Select-String "security-alerts"

# Ver assinaturas
aws sns list-subscriptions-by-topic `
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:alquimista-security-alerts-dev `
  --region us-east-1
```

**Esperado**:
- ✅ Tópico existe
- ✅ Assinaturas configuradas (se email configurado)

#### 4. Verificar EventBridge Rule
```powershell
# Listar rules
aws events list-rules --region us-east-1 | Select-String "GuardDuty"

# Ver detalhes da rule
aws events describe-rule --name <rule-name> --region us-east-1
```

**Esperado**:
- ✅ Rule existe
- ✅ Target: SNS Topic de segurança

#### 5. Testar Alerta (Opcional)
```powershell
# Enviar mensagem de teste para SNS
aws sns publish `
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:alquimista-security-alerts-dev `
  --message "Test security alert" `
  --subject "Test Alert" `
  --region us-east-1
```

**Esperado**:
- ✅ Email recebido (se configurado)

#### 6. Executar Script de Verificação
```powershell
.\scripts\verify-security-guardrails.ps1 -Verbose
```

**Esperado**:
- ✅ Todas as verificações passam

### Critérios de Sucesso
- ✅ CloudTrail ativo e logando
- ✅ GuardDuty habilitado
- ✅ SNS Topic configurado
- ✅ EventBridge Rule ativa

### Troubleshooting
Se falhar, consultar: [GUARDRAILS-GUIDE.md](../../../docs/ci-cd/GUARDRAILS-GUIDE.md)

---

## 💰 8.4 Testar Guardrails de Custo

### Objetivo
Verificar que Budget e Cost Anomaly Detection estão configurados.

### Passo a Passo

#### 1. Verificar AWS Budget
```powershell
# Listar budgets
aws budgets describe-budgets --account-id ACCOUNT_ID --region us-east-1

# Ver detalhes do budget
aws budgets describe-budget `
  --account-id ACCOUNT_ID `
  --budget-name alquimista-monthly-budget-dev `
  --region us-east-1
```

**Esperado**:
- ✅ Budget existe
- ✅ Limite configurado (ex: $500)
- ✅ Alertas em 80% e 100%

#### 2. Verificar Cost Anomaly Detection
```powershell
# Listar monitores
aws ce get-anomaly-monitors --region us-east-1

# Listar subscriptions
aws ce get-anomaly-subscriptions --region us-east-1
```

**Esperado**:
- ✅ Monitor existe
- ✅ Subscription configurada
- ✅ Threshold: $50

#### 3. Verificar SNS Topic de Custo
```powershell
# Listar tópicos
aws sns list-topics --region us-east-1 | Select-String "cost-alerts"

# Ver assinaturas
aws sns list-subscriptions-by-topic `
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:alquimista-cost-alerts-dev `
  --region us-east-1
```

**Esperado**:
- ✅ Tópico existe
- ✅ Assinaturas configuradas (se email configurado)

#### 4. Ver Gastos Atuais
```powershell
# Gastos do mês atual
aws ce get-cost-and-usage `
  --time-period Start=2025-11-01,End=2025-11-30 `
  --granularity MONTHLY `
  --metrics BlendedCost `
  --region us-east-1
```

**Esperado**:
- ✅ Dados de custo disponíveis

#### 5. Testar Alerta (Opcional)
```powershell
# Enviar mensagem de teste para SNS
aws sns publish `
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:alquimista-cost-alerts-dev `
  --message "Test cost alert" `
  --subject "Test Alert" `
  --region us-east-1
```

**Esperado**:
- ✅ Email recebido (se configurado)

### Critérios de Sucesso
- ✅ Budget configurado
- ✅ Cost Anomaly ativo
- ✅ SNS Topic configurado
- ✅ Alertas funcionando

### Troubleshooting
Se falhar, consultar: [GUARDRAILS-GUIDE.md](../../../docs/ci-cd/GUARDRAILS-GUIDE.md)

---

## 📊 8.5 Testar Alarmes CloudWatch

### Objetivo
Verificar que alarmes CloudWatch foram criados e estão funcionando.

### Passo a Passo

#### 1. Listar Todos os Alarmes
```powershell
# Listar alarmes
aws cloudwatch describe-alarms --region us-east-1

# Filtrar alarmes do AlquimistaAI
aws cloudwatch describe-alarms `
  --query "MetricAlarms[?contains(AlarmName, 'Fibonacci') || contains(AlarmName, 'Nigredo') || contains(AlarmName, 'Aurora')]" `
  --region us-east-1
```

**Esperado**:
- ✅ Alarmes do Fibonacci (API Gateway 5XX, Lambda Errors, Lambda Throttles)
- ✅ Alarmes do Nigredo (API Gateway 5XX, Lambda Errors)
- ✅ Alarmes do Aurora (CPU, Connections)

#### 2. Verificar Estado dos Alarmes
```powershell
# Ver alarmes em estado de alarme
aws cloudwatch describe-alarms --state-value ALARM --region us-east-1

# Ver alarmes OK
aws cloudwatch describe-alarms --state-value OK --region us-east-1
```

**Esperado**:
- ✅ Maioria dos alarmes em estado OK
- ⚠️ Alguns podem estar em INSUFFICIENT_DATA (normal se não há tráfego)

#### 3. Verificar SNS Topic Operacional
```powershell
# Listar tópicos
aws sns list-topics --region us-east-1 | Select-String "ops-alerts"

# Ver assinaturas
aws sns list-subscriptions-by-topic `
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:alquimista-ops-alerts-dev `
  --region us-east-1
```

**Esperado**:
- ✅ Tópico existe
- ✅ Assinaturas configuradas (se email configurado)

#### 4. Ver Histórico de Alarmes
```powershell
# Ver histórico de um alarme específico
aws cloudwatch describe-alarm-history `
  --alarm-name Fibonacci-API-Gateway-5XX `
  --max-records 10 `
  --region us-east-1
```

**Esperado**:
- ✅ Histórico disponível

#### 5. Testar Alerta (Opcional)
```powershell
# Enviar mensagem de teste para SNS
aws sns publish `
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:alquimista-ops-alerts-dev `
  --message "Test operational alert" `
  --subject "Test Alert" `
  --region us-east-1
```

**Esperado**:
- ✅ Email recebido (se configurado)

### Critérios de Sucesso
- ✅ Alarmes criados
- ✅ Alarmes em estado OK ou INSUFFICIENT_DATA
- ✅ SNS Topic configurado
- ✅ Notificações funcionando

### Troubleshooting
Se falhar, consultar: [GUARDRAILS-GUIDE.md](../../../docs/ci-cd/GUARDRAILS-GUIDE.md)

---

## 🔄 8.6 Testar Rollback

### Objetivo
Verificar que procedimentos de rollback funcionam corretamente.

### Passo a Passo

#### 1. Executar Script de Rollback Guiado
```powershell
# Executar script
.\scripts\manual-rollback-guided.ps1 -Environment dev

# Seguir instruções interativas
# Script não executa comandos, apenas orienta
```

**Esperado**:
- ✅ Script executa sem erros
- ✅ Orientações claras fornecidas
- ✅ Comandos sugeridos corretos

#### 2. Simular Rollback via Git (Teste)
```powershell
# Ver commits recentes
git log --oneline -5

# Simular revert (não fazer push)
git revert HEAD --no-commit

# Ver mudanças
git status

# Desfazer (não queremos fazer rollback de verdade)
git reset --hard HEAD
```

**Esperado**:
- ✅ Comandos funcionam
- ✅ Revert pode ser feito

#### 3. Verificar Documentação de Rollback
- Ler: [ROLLBACK-OPERACIONAL-AWS.md](../../../docs/ROLLBACK-OPERACIONAL-AWS.md)
- Verificar que procedimentos estão claros
- Verificar que comandos estão corretos

### Critérios de Sucesso
- ✅ Script de rollback funciona
- ✅ Comandos Git funcionam
- ✅ Documentação completa

### Troubleshooting
Se falhar, consultar: [ROLLBACK-OPERACIONAL-AWS.md](../../../docs/ROLLBACK-OPERACIONAL-AWS.md)

---

## ✅ 8.7 Validação Completa do Sistema

### Objetivo
Executar validação completa de todo o sistema.

### Passo a Passo

#### 1. Executar Script de Validação
```powershell
# Executar validação completa
.\scripts\validate-system-complete.ps1 -Verbose
```

**Esperado**:
- ✅ Todas as validações passam
- ✅ Estrutura de diretórios OK
- ✅ Configurações CDK OK
- ✅ Migrations OK
- ✅ Dependências OK

#### 2. Executar Smoke Tests
```powershell
# Smoke tests em dev
.\scripts\smoke-tests-api-dev.ps1 -Environment dev -Verbose
```

**Esperado**:
- ✅ Health checks passam
- ✅ Endpoints principais funcionando
- ✅ APIs respondendo

#### 3. Verificar Migrations
```powershell
# Validar migrations
.\scripts\validate-migrations-aurora.ps1 -Environment dev -Verbose
```

**Esperado**:
- ✅ Migrations aplicadas corretamente
- ✅ Schemas criados

#### 4. Documentar Ajustes (se necessário)
Se alguma validação falhar:
1. Documentar o problema
2. Documentar a solução aplicada
3. Atualizar documentação se necessário

### Critérios de Sucesso
- ✅ Validação completa passa
- ✅ Smoke tests passam
- ✅ Migrations OK
- ✅ Sistema funcionando

### Troubleshooting
Se falhar, consultar: [TROUBLESHOOTING.md](../../../docs/ci-cd/TROUBLESHOOTING.md)

---

## 📊 Resumo de Testes

### Checklist Final

- [ ] 8.1 Workflow em PR testado
- [ ] 8.2 Deploy em dev testado
- [ ] 8.3 Guardrails de segurança testados
- [ ] 8.4 Guardrails de custo testados
- [ ] 8.5 Alarmes CloudWatch testados
- [ ] 8.6 Rollback testado
- [ ] 8.7 Validação completa executada

### Critérios de Sucesso Geral

- ✅ Todos os testes passaram
- ✅ Documentação validada
- ✅ Sistema funcionando end-to-end
- ✅ Pronto para Tarefa 9

---

## 📝 Relatório de Testes

Após completar todos os testes, criar relatório em:
`.kiro/specs/ci-cd-aws-guardrails/TASK-8-TEST-REPORT.md`

Incluir:
- Data dos testes
- Resultados de cada teste
- Problemas encontrados
- Soluções aplicadas
- Status final

---

**Última Atualização**: 19 de novembro de 2025  
**Versão**: 1.0  
**Autor**: Kiro AI - Sistema de CI/CD AlquimistaAI
