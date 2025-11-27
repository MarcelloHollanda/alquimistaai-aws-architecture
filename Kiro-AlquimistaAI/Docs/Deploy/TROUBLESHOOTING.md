# 🔧 Troubleshooting - Problemas Comuns de Deploy

Soluções para os problemas mais frequentes durante o deploy.

---

## 🚨 Stack em ROLLBACK_IN_PROGRESS

### Problema
```
Stack status: ROLLBACK_IN_PROGRESS
```

### Solução

```powershell
# 1. Aguardar rollback completar (5-15 min)
aws cloudformation wait stack-rollback-complete --stack-name FibonacciStack-dev

# 2. Deletar stack
aws cloudformation delete-stack --stack-name FibonacciStack-dev
aws cloudformation wait stack-delete-complete --stack-name FibonacciStack-dev

# 3. Deploy limpo
.\deploy-limpo.ps1
```

---

## ❌ Stack em ROLLBACK_COMPLETE

### Problema
```
Stack status: ROLLBACK_COMPLETE
Cannot update a stack when in ROLLBACK_COMPLETE state
```

### Solução

```powershell
# Deletar e recriar
aws cloudformation delete-stack --stack-name FibonacciStack-dev
aws cloudformation wait stack-delete-complete --stack-name FibonacciStack-dev
.\deploy-limpo.ps1
```

---

## 🪣 Erro: Bucket Already Exists

### Problema
```
Bucket already exists: fibonacci-stack-versions-dev-[ACCOUNT-ID]
```

### Solução

```powershell
# Esvaziar e deletar bucket
aws s3 rm s3://fibonacci-stack-versions-dev-[ACCOUNT-ID] --recursive
aws s3 rb s3://fibonacci-stack-versions-dev-[ACCOUNT-ID]

# Tentar deploy novamente
.\deploy-limpo.ps1
```

---

## 🔐 Erro: Insufficient Permissions

### Problema
```
User is not authorized to perform: [ACTION]
```

### Solução

```powershell
# Verificar credenciais
aws sts get-caller-identity

# Verificar permissões necessárias
# - CloudFormation: Full Access
# - Lambda: Full Access
# - API Gateway: Full Access
# - RDS: Full Access
# - S3: Full Access
# - Cognito: Full Access
```

---

## 🌐 Erro: VPC Limit Exceeded

### Problema
```
VPC limit exceeded
```

### Solução

```powershell
# Listar VPCs
aws ec2 describe-vpcs

# Deletar VPCs não utilizadas
aws ec2 delete-vpc --vpc-id vpc-xxxxx

# Ou solicitar aumento de limite na AWS
```

---

## 🔌 Erro: ENI in Use

### Problema
```
Network interface is currently in use
```

### Solução

```powershell
# Aguardar 5-10 minutos para AWS liberar
# OU deletar manualmente

# Listar ENIs
aws ec2 describe-network-interfaces --filters "Name=vpc-id,Values=vpc-xxxxx"

# Deletar ENI
aws ec2 delete-network-interface --network-interface-id eni-xxxxx
```

---

## 📦 Erro: CDK Bootstrap Required

### Problema
```
This stack uses assets, so the toolkit stack must be deployed
```

### Solução

```powershell
# Bootstrap CDK
npx cdk bootstrap aws://[ACCOUNT-ID]/us-east-1

# Tentar deploy novamente
.\deploy-limpo.ps1
```

---

## 🔨 Erro: Build Failed

### Problema
```
npm run build failed
```

### Solução

```powershell
# Limpar e reinstalar
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
npm run build
```

---

## 🕐 Timeout Durante Deploy

### Problema
Deploy demora mais de 1 hora

### Solução

```powershell
# Verificar se há recursos travados
aws cloudformation describe-stack-events --stack-name FibonacciStack-dev --max-items 20

# Se necessário, cancelar e tentar novamente
aws cloudformation cancel-update-stack --stack-name FibonacciStack-dev
# Aguardar cancelamento completar
.\deploy-limpo.ps1
```

---

## 🔍 Como Investigar Falhas

### Ver Eventos de Falha

```powershell
# Últimos 30 eventos
aws cloudformation describe-stack-events --stack-name FibonacciStack-dev --max-items 30

# Apenas falhas
aws cloudformation describe-stack-events --stack-name FibonacciStack-dev --query "StackEvents[?ResourceStatus=='CREATE_FAILED' || ResourceStatus=='UPDATE_FAILED']"
```

### Ver Logs do CloudWatch

```powershell
# Logs das Lambdas
aws logs tail /aws/lambda/FibonacciStack-dev-ApiHandler --follow

# Logs do CloudTrail
aws logs tail /aws/cloudtrail/fibonacci-dev --follow
```

---

## 🆘 Comandos Úteis

### Status da Stack

```powershell
aws cloudformation describe-stacks --stack-name FibonacciStack-dev --query "Stacks[0].StackStatus"
```

### Listar Recursos

```powershell
aws cloudformation list-stack-resources --stack-name FibonacciStack-dev
```

### Deletar Stack Forçado

```powershell
# CUIDADO: Isso pode deixar recursos órfãos
aws cloudformation delete-stack --stack-name FibonacciStack-dev --retain-resources [RESOURCE-ID]
```

---

## 📞 Ainda com Problemas?

1. Verifique os logs no CloudWatch
2. Consulte a [documentação AWS](https://docs.aws.amazon.com/cloudformation/)
3. Use o script de validação: `.\VALIDAR-DEPLOY.ps1`

---

**Voltar para**: [Índice Principal](./README.md)
