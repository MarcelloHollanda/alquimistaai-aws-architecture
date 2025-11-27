# 🚨 Status Atual do Deploy - Alquimista.AI

**Data/Hora**: 13 de novembro de 2025
**Status**: ROLLBACK_IN_PROGRESS ⚠️

---

## 📊 Situação Atual

A stack `FibonacciStack-dev` está em estado de **ROLLBACK_IN_PROGRESS**, o que significa:
- Um deploy anterior falhou
- O CloudFormation está revertendo as mudanças
- Não é possível fazer novos deploys até o rollback completar

---

## 🔧 Plano de Ação para Deploy Completo

### Passo 1: Aguardar Rollback Completar ⏳

```powershell
# Monitorar status (executar manualmente)
aws cloudformation describe-stacks --stack-name FibonacciStack-dev --query "Stacks[0].StackStatus"

# OU aguardar automaticamente (pode demorar 5-15 minutos)
aws cloudformation wait stack-rollback-complete --stack-name FibonacciStack-dev
```

**Status esperado após conclusão**: `ROLLBACK_COMPLETE`

---

### Passo 2: Deletar Stack com Falha 🗑️

Após o rollback completar:

```powershell
# Deletar a stack
aws cloudformation delete-stack --stack-name FibonacciStack-dev

# Aguardar deleção completar (2-5 minutos)
aws cloudformation wait stack-delete-complete --stack-name FibonacciStack-dev

# Verificar se foi deletada
aws cloudformation describe-stacks --stack-name FibonacciStack-dev
# Deve retornar erro: "Stack with id FibonacciStack-dev does not exist"
```

---

### Passo 3: Limpar Recursos Órfãos (se necessário) 🧹

Alguns recursos podem não ser deletados automaticamente:

```powershell
# Verificar e limpar buckets S3
aws s3 ls | Select-String "fibonacci"

# Se encontrar buckets, esvaziar e deletar
aws s3 rm s3://[BUCKET-NAME] --recursive
aws s3 rb s3://[BUCKET-NAME]

# Verificar Security Groups órfãos
aws ec2 describe-security-groups --filters "Name=group-name,Values=*fibonacci*" --query "SecurityGroups[].GroupId"

# Verificar VPCs órfãs
aws ec2 describe-vpcs --filters "Name=tag:Name,Values=*fibonacci*" --query "Vpcs[].VpcId"
```

---

### Passo 4: Preparar Ambiente para Deploy Limpo 🎯

```powershell
# Verificar credenciais AWS
aws sts get-caller-identity

# Limpar cache do CDK
Remove-Item -Recurse -Force cdk.out -ErrorAction SilentlyContinue

# Instalar/atualizar dependências
npm install

# Compilar TypeScript
npm run build

# Validar sintaxe CDK
npx cdk synth --context env=dev
```

---

### Passo 5: Deploy Completo do Backend ✅

```powershell
# Bootstrap CDK (se necessário - primeira vez)
npx cdk bootstrap aws://[ACCOUNT-ID]/us-east-1

# Deploy com aprovação automática
npx cdk deploy FibonacciStack-dev --require-approval never --context env=dev

# OU com aprovação manual (mais seguro)
npx cdk deploy FibonacciStack-dev --context env=dev
```

**Tempo estimado**: 15-25 minutos

---

### Passo 6: Capturar Outputs do Backend 📝

```powershell
# Listar outputs
aws cloudformation describe-stacks --stack-name FibonacciStack-dev --query "Stacks[0].Outputs" --output table

# Salvar em arquivo
aws cloudformation describe-stacks --stack-name FibonacciStack-dev --query "Stacks[0].Outputs" > backend-outputs.json
```

**Outputs importantes**:
- `ApiEndpoint` - URL da API Gateway
- `UserPoolId` - ID do Cognito User Pool
- `UserPoolClientId` - ID do Client do Cognito
- `CloudFrontUrl` - URL do CloudFront

---

### Passo 7: Configurar e Deploy do Frontend 🎨

```powershell
cd frontend

# Criar arquivo .env.production com os outputs do backend
# NEXT_PUBLIC_API_URL=https://[API-GATEWAY-URL]
# NEXT_PUBLIC_COGNITO_USER_POOL_ID=[USER-POOL-ID]
# NEXT_PUBLIC_COGNITO_CLIENT_ID=[CLIENT-ID]
# NEXT_PUBLIC_AWS_REGION=us-east-1

# Instalar dependências
npm install

# Build de produção
npm run build

# Deploy no Vercel
vercel --prod
```

---

### Passo 8: Validação Pós-Deploy ✅

```powershell
# Testar API Gateway
curl https://[API-GATEWAY-URL]/health

# Verificar Lambdas
aws lambda list-functions --query "Functions[?starts_with(FunctionName, 'FibonacciStack')].FunctionName"

# Testar frontend
curl https://[SEU-APP].vercel.app
```

---

## 🐛 Troubleshooting Comum

### Erro: "Stack cannot be deleted while in ROLLBACK_IN_PROGRESS"
**Solução**: Aguarde o rollback completar antes de tentar deletar

### Erro: "Resource being used by another resource"
**Solução**: Delete manualmente os recursos dependentes primeiro (ENIs, Security Groups)

### Erro: "Bucket already exists"
**Solução**: Esvazie e delete o bucket manualmente antes do deploy

---

## 📞 Comandos Rápidos de Referência

```powershell
# Status da stack
aws cloudformation describe-stacks --stack-name FibonacciStack-dev --query "Stacks[0].StackStatus"

# Eventos recentes (últimos 10)
aws cloudformation describe-stack-events --stack-name FibonacciStack-dev --max-items 10

# Listar todas as stacks
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE ROLLBACK_COMPLETE

# Logs do CloudWatch
aws logs tail /aws/lambda/FibonacciStack-dev-ApiHandler --follow
```

---

## ⏱️ Timeline Estimado

1. **Aguardar Rollback**: 5-15 minutos
2. **Deletar Stack**: 2-5 minutos
3. **Limpar Recursos**: 2-5 minutos
4. **Deploy Backend**: 15-25 minutos
5. **Deploy Frontend**: 5-10 minutos
6. **Validação**: 5 minutos

**Total**: ~35-65 minutos

---

## ✅ Checklist de Execução

- [ ] Rollback completado (status: ROLLBACK_COMPLETE)
- [ ] Stack deletada com sucesso
- [ ] Recursos órfãos limpos
- [ ] Ambiente preparado (build, synth)
- [ ] Backend deployado (FibonacciStack-dev)
- [ ] Outputs capturados
- [ ] Frontend configurado (.env.production)
- [ ] Frontend deployado (Vercel)
- [ ] API testada e funcionando
- [ ] Frontend testado e funcionando
- [ ] Integração validada

---

**Próximo Passo**: Aguardar o rollback completar e executar o Passo 2 (Deletar Stack)
