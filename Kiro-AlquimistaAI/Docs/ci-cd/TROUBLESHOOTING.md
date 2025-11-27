# Troubleshooting - Pipeline CI/CD AlquimistaAI

## 📋 Índice

1. [Problemas de Build e Validação](#problemas-de-build-e-validação)
2. [Problemas de Deploy](#problemas-de-deploy)
3. [Problemas de Autenticação](#problemas-de-autenticação)
4. [Problemas de Smoke Tests](#problemas-de-smoke-tests)
5. [Problemas de Guardrails](#problemas-de-guardrails)
6. [Como Fazer Rollback](#como-fazer-rollback)
7. [Logs e Diagnóstico](#logs-e-diagnóstico)

---

## Problemas de Build e Validação

### Erro: npm install falhou

**Sintomas**:
```
Error: npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Causas Comuns**:
- Conflito de dependências
- package-lock.json desatualizado
- Versão do Node.js incompatível

**Solução**:
```powershell
# 1. Limpar cache npm
npm cache clean --force

# 2. Deletar node_modules e package-lock.json
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# 3. Reinstalar
npm install

# 4. Commit e push
git add package-lock.json
git commit -m "fix: atualizar package-lock.json"
git push origin main
```

---

### Erro: npm run build falhou

**Sintomas**:
```
Error: TS2304: Cannot find name 'X'
Error: TS2345: Argument of type 'X' is not assignable to parameter of type 'Y'
```

**Causas Comuns**:
- Erro de TypeScript
- Import faltando
- Tipo incorreto

**Solução**:
```powershell
# 1. Reproduzir localmente
npm run build

# 2. Ver erro completo
# 3. Corrigir código TypeScript
# 4. Testar novamente
npm run build

# 5. Commit e push
git add .
git commit -m "fix: corrigir erro de TypeScript"
git push origin main
```

---

### Erro: validate-system-complete.ps1 falhou

**Sintomas**:
```
[ERRO] Validação falhou: X
```

**Causas Comuns**:
- Arquivo faltando
- Configuração incorreta
- Migration não aplicada

**Solução**:
```powershell
# 1. Executar localmente com verbose
.\scripts\validate-system-complete.ps1 -Verbose

# 2. Ver qual validação falhou
# 3. Corrigir problema identificado
# 4. Testar novamente
.\scripts\validate-system-complete.ps1

# 5. Commit e push
git add .
git commit -m "fix: corrigir validação X"
git push origin main
```

**Validações Comuns que Falham**:

#### Migrations não aplicadas
```powershell
# Aplicar migrations
.\scripts\apply-migrations-aurora-dev.ps1

# Validar
.\scripts\validate-migrations-aurora.ps1
```

#### Stacks CDK com erro
```powershell
# Testar synth
cdk synth --all --context env=dev

# Ver erro específico
# Corrigir código CDK
```

---

### Erro: cdk synth falhou

**Sintomas**:
```
Error: Stack X has invalid configuration
Error: Cannot find module 'Y'
```

**Causas Comuns**:
- Erro de sintaxe CDK
- Dependência faltando
- Configuração inválida

**Solução**:
```powershell
# 1. Reproduzir localmente
cdk synth --all --context env=dev

# 2. Ver erro completo
# 3. Corrigir código CDK
# 4. Testar novamente
cdk synth --all --context env=dev

# 5. Commit e push
git add .
git commit -m "fix: corrigir configuração CDK"
git push origin main
```

---

## Problemas de Deploy

### Erro: cdk deploy falhou - Recurso já existe

**Sintomas**:
```
Error: Resource X already exists
Error: CREATE_FAILED: Resource X already exists
```

**Causas Comuns**:
- Recurso criado manualmente
- Deploy anterior incompleto
- Nome de recurso duplicado

**Solução**:

**Opção 1: Deletar recurso manualmente**
```powershell
# Exemplo: Deletar bucket S3
aws s3 rb s3://bucket-name --force --region us-east-1

# Exemplo: Deletar Lambda
aws lambda delete-function --function-name function-name --region us-east-1

# Tentar deploy novamente
cdk deploy --all --context env=dev
```

**Opção 2: Importar recurso no CDK**
```typescript
// lib/stack.ts
const bucket = s3.Bucket.fromBucketName(this, 'ExistingBucket', 'bucket-name');
```

**Opção 3: Deletar stack e recriar**
```powershell
# CUIDADO: Isso deleta todos os recursos da stack
cdk destroy FibonacciStack-dev --context env=dev
cdk deploy FibonacciStack-dev --context env=dev
```

---

### Erro: cdk deploy falhou - Permissões insuficientes

**Sintomas**:
```
Error: User is not authorized to perform: X
Error: AccessDenied: User X is not authorized to perform Y
```

**Causas Comuns**:
- Role IAM sem permissões
- Policy incorreta
- OIDC não configurado

**Solução**:
```powershell
# 1. Verificar role IAM
aws iam get-role --role-name GitHubActionsAlquimistaAICICD --region us-east-1

# 2. Verificar policies anexadas
aws iam list-attached-role-policies --role-name GitHubActionsAlquimistaAICICD --region us-east-1

# 3. Adicionar permissão faltante
# Via console AWS ou CLI

# 4. Tentar deploy novamente
```

**Documentação**: [OIDC-SETUP.md](./OIDC-SETUP.md)

---

### Erro: cdk deploy falhou - Limite de recursos atingido

**Sintomas**:
```
Error: LimitExceeded: You have reached the limit for X
Error: Cannot create more than Y resources of type Z
```

**Causas Comuns**:
- Limite de conta AWS atingido
- Muitos recursos criados
- Quota insuficiente

**Solução**:
```powershell
# 1. Ver limites da conta
aws service-quotas list-service-quotas --service-code lambda --region us-east-1

# 2. Solicitar aumento de limite
# Via console AWS Support

# 3. Ou deletar recursos não usados
aws lambda list-functions --region us-east-1
aws lambda delete-function --function-name old-function --region us-east-1
```

---

### Erro: cdk deploy falhou - Timeout

**Sintomas**:
```
Error: Timeout waiting for stack to complete
Error: Stack X did not complete in time
```

**Causas Comuns**:
- Recurso demorado para criar (Aurora, CloudFront)
- Problema de rede
- Recurso travado

**Solução**:
```powershell
# 1. Verificar estado da stack no CloudFormation
aws cloudformation describe-stacks --stack-name FibonacciStack-dev --region us-east-1

# 2. Ver eventos da stack
aws cloudformation describe-stack-events --stack-name FibonacciStack-dev --max-items 20 --region us-east-1

# 3. Se stack está em CREATE_IN_PROGRESS ou UPDATE_IN_PROGRESS
# Aguardar mais tempo

# 4. Se stack está em ROLLBACK_IN_PROGRESS
# Aguardar rollback completar
# Investigar causa do erro
# Corrigir e tentar novamente
```

---

## Problemas de Autenticação

### Erro: OIDC authentication failed

**Sintomas**:
```
Error: Unable to assume role via OIDC
Error: Not authorized to perform sts:AssumeRoleWithWebIdentity
```

**Causas Comuns**:
- OIDC não configurado
- Trust policy incorreta
- Repositório não autorizado

**Solução**:
```powershell
# 1. Verificar se Identity Provider existe
aws iam list-open-id-connect-providers --region us-east-1

# 2. Verificar trust policy da role
aws iam get-role --role-name GitHubActionsAlquimistaAICICD --region us-east-1

# 3. Verificar se repositório está correto na trust policy
# Deve ter: "repo:MarcelloHollanda/alquimistaai-aws-architecture:*"

# 4. Se não existe, criar OIDC
# Ver: docs/ci-cd/OIDC-SETUP.md
```

**Documentação**: [OIDC-SETUP.md](./OIDC-SETUP.md)

---

### Erro: AWS_ACCOUNT_ID não configurado

**Sintomas**:
```
Error: secrets.AWS_ACCOUNT_ID is not set
```

**Causas Comuns**:
- Secret não configurado no GitHub
- Nome do secret incorreto

**Solução**:
1. Acessar GitHub: `https://github.com/MarcelloHollanda/alquimistaai-aws-architecture/settings/secrets/actions`
2. Clicar em "New repository secret"
3. Name: `AWS_ACCOUNT_ID`
4. Value: `123456789012` (seu account ID)
5. Clicar em "Add secret"
6. Tentar deploy novamente

**Como Obter Account ID**:
```powershell
aws sts get-caller-identity --query Account --output text
```

---

## Problemas de Smoke Tests

### Erro: Smoke tests falharam - API não responde

**Sintomas**:
```
[ERRO] Health check falhou: Connection timeout
[ERRO] Endpoint X não responde
```

**Causas Comuns**:
- API ainda não está pronta (cold start)
- Endpoint mudou
- Lambda com erro
- API Gateway com erro

**Solução**:
```powershell
# 1. Aguardar 1-2 minutos (cold start)
Start-Sleep -Seconds 120

# 2. Tentar novamente
.\scripts\smoke-tests-api-dev.ps1 -Environment dev -Verbose

# 3. Se ainda falhar, testar manualmente
curl https://api-dev.alquimista.ai/health

# 4. Ver logs da Lambda
aws logs tail /aws/lambda/fibonacci-handler-dev --follow --region us-east-1

# 5. Ver logs do API Gateway
aws logs tail /aws/apigateway/fibonacci-api-dev --follow --region us-east-1
```

---

### Erro: Smoke tests falharam - Status 500

**Sintomas**:
```
[ERRO] Endpoint X retornou status 500
[ERRO] Internal Server Error
```

**Causas Comuns**:
- Lambda com erro de runtime
- Problema de conectividade com Aurora
- Secrets Manager não configurado
- Variável de ambiente faltando

**Solução**:
```powershell
# 1. Ver logs da Lambda
aws logs tail /aws/lambda/fibonacci-handler-dev --follow --region us-east-1

# 2. Procurar por erros
# Exemplo: "Cannot connect to database"
# Exemplo: "Secret not found"

# 3. Corrigir problema identificado
# Exemplo: Configurar secret
aws secretsmanager create-secret --name /alquimista/dev/database --secret-string '{"host":"...","password":"..."}'

# 4. Testar novamente
.\scripts\smoke-tests-api-dev.ps1 -Environment dev
```

---

### Erro: Smoke tests falharam - Status 404

**Sintomas**:
```
[ERRO] Endpoint X retornou status 404
[ERRO] Not Found
```

**Causas Comuns**:
- Endpoint mudou
- Rota não configurada no API Gateway
- Lambda não mapeada

**Solução**:
```powershell
# 1. Verificar rotas do API Gateway
aws apigatewayv2 get-routes --api-id <api-id> --region us-east-1

# 2. Verificar se rota existe
# 3. Se não existe, adicionar no CDK
# 4. Deploy novamente
cdk deploy FibonacciStack-dev --context env=dev

# 5. Testar novamente
.\scripts\smoke-tests-api-dev.ps1 -Environment dev
```

---

## Problemas de Guardrails

### Problema: Não estou recebendo alertas

**Sintomas**:
- Alarme disparou mas não recebi email
- GuardDuty detectou finding mas não recebi notificação

**Causas Comuns**:
- Email não configurado
- Email não confirmado
- Tópico SNS sem assinatura

**Solução**:
```powershell
# 1. Verificar assinaturas SNS
aws sns list-subscriptions-by-topic `
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:alquimista-ops-alerts-dev `
  --region us-east-1

# 2. Se não há assinatura, adicionar
aws sns subscribe `
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:alquimista-ops-alerts-dev `
  --protocol email `
  --notification-endpoint ops@alquimista.ai `
  --region us-east-1

# 3. Confirmar email recebido
# 4. Testar envio
aws sns publish `
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:alquimista-ops-alerts-dev `
  --message "Test message" `
  --region us-east-1
```

---

### Problema: Muitos alertas falsos positivos

**Sintomas**:
- Recebendo muitos alertas
- Alertas não são relevantes

**Causas Comuns**:
- Threshold muito baixo
- Período de avaliação muito curto

**Solução**:
1. Ajustar threshold no código CDK
2. Aumentar período de avaliação
3. Deploy novamente

**Exemplo**:
```typescript
// lib/fibonacci-stack.ts
const apiGateway5xxAlarm = new cloudwatch.Alarm(this, 'FibonacciApiGateway5xxAlarm', {
  threshold: 10, // Aumentar de 5 para 10
  evaluationPeriods: 2, // Aumentar de 1 para 2
  // ...
});
```

---

## Como Fazer Rollback

### Rollback via Git

**Quando Usar**:
- Deploy recente quebrou o sistema
- Código com bug crítico
- Precisa voltar para versão anterior rapidamente

**Passo a Passo**:
```powershell
# 1. Identificar commit anterior estável
git log --oneline -10

# 2. Reverter último commit
git revert HEAD

# 3. Ou reverter para commit específico
git revert <commit-hash>

# 4. Push (dispara deploy automático em dev)
git push origin main

# 5. Para prod, usar workflow dispatch
# GitHub Actions → CI/CD AlquimistaAI → Run workflow
```

---

### Rollback via CDK

**Quando Usar**:
- Deploy de stack específica falhou
- Precisa voltar stack para estado anterior
- Git revert não é suficiente

**Passo a Passo**:
```powershell
# 1. Checkout do commit anterior
git checkout <commit-anterior>

# 2. Deploy da stack específica
cdk deploy FibonacciStack-dev --context env=dev

# 3. Validar
.\scripts\smoke-tests-api-dev.ps1 -Environment dev

# 4. Se OK, voltar para main
git checkout main
```

---

### Rollback Guiado

**Quando Usar**:
- Não sabe qual é o melhor método
- Precisa de orientação passo a passo
- Situação complexa

**Passo a Passo**:
```powershell
# Executar script de rollback guiado
.\scripts\manual-rollback-guided.ps1 -Environment dev

# Seguir instruções interativas
# Script não executa comandos automaticamente
# Apenas orienta sobre o que fazer
```

**Documentação**: [ROLLBACK-OPERACIONAL-AWS.md](../ROLLBACK-OPERACIONAL-AWS.md)

---

## Logs e Diagnóstico

### Ver Logs de Lambda

```powershell
# Ver logs em tempo real
aws logs tail /aws/lambda/fibonacci-handler-dev --follow --region us-east-1

# Ver últimas 100 linhas
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
# Ver logs em tempo real
aws logs tail /aws/apigateway/fibonacci-api-dev --follow --region us-east-1

# Ver últimas 100 linhas
aws logs tail /aws/apigateway/fibonacci-api-dev --since 1h --region us-east-1

# Buscar por status 500
aws logs filter-log-events `
  --log-group-name /aws/apigateway/fibonacci-api-dev `
  --filter-pattern "500" `
  --region us-east-1
```

---

### Ver Eventos de CloudFormation

```powershell
# Ver eventos recentes de uma stack
aws cloudformation describe-stack-events `
  --stack-name FibonacciStack-dev `
  --max-items 20 `
  --region us-east-1

# Ver apenas eventos de erro
aws cloudformation describe-stack-events `
  --stack-name FibonacciStack-dev `
  --query "StackEvents[?ResourceStatus=='CREATE_FAILED' || ResourceStatus=='UPDATE_FAILED']" `
  --region us-east-1
```

---

### Ver Estado de Alarmes

```powershell
# Listar todos os alarmes
aws cloudwatch describe-alarms --region us-east-1

# Ver alarmes em estado de alarme
aws cloudwatch describe-alarms --state-value ALARM --region us-east-1

# Ver histórico de um alarme
aws cloudwatch describe-alarm-history `
  --alarm-name Fibonacci-API-Gateway-5XX `
  --max-records 10 `
  --region us-east-1
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

## Recursos Adicionais

### Documentação Relacionada

- [PIPELINE-OVERVIEW.md](./PIPELINE-OVERVIEW.md) - Overview do pipeline
- [CI-CD-DEPLOY-FLOWS-DEV-PROD.md](../CI-CD-DEPLOY-FLOWS-DEV-PROD.md) - Fluxos de deploy
- [GUARDRAILS-GUIDE.md](./GUARDRAILS-GUIDE.md) - Guia de guardrails
- [ROLLBACK-OPERACIONAL-AWS.md](../ROLLBACK-OPERACIONAL-AWS.md) - Procedimentos de rollback
- [VALIDACAO-E-SUPORTE-AWS.md](../VALIDACAO-E-SUPORTE-AWS.md) - Scripts de validação

### Scripts Úteis

| Script | Função |
|--------|--------|
| `validate-system-complete.ps1` | Validação completa do sistema |
| `smoke-tests-api-dev.ps1` | Testes de fumaça das APIs |
| `validate-migrations-aurora.ps1` | Validação de migrations |
| `manual-rollback-guided.ps1` | Guia de rollback |
| `verify-security-guardrails.ps1` | Verificar guardrails de segurança |

### Contatos de Suporte

- **Equipe de DevOps**: devops@alquimista.ai
- **Equipe de Segurança**: security@alquimista.ai
- **Suporte AWS**: https://console.aws.amazon.com/support/

---

**Última Atualização**: 19 de novembro de 2025  
**Versão**: 1.0  
**Autor**: Kiro AI - Sistema de CI/CD AlquimistaAI
