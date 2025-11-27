# 🚀 Deploy Imediato - Alquimista.AI

## ✅ Status Pré-Deploy

- ✅ Node.js v24.11.1 instalado
- ✅ AWS CLI v2.31.34 instalado
- ✅ Conectado à conta AWS: 207933152643
- ✅ Build compilado com sucesso
- ✅ Dependências instaladas

## 📋 Próximos Passos

### 1. Bootstrap do CDK (Se necessário)

```bash
# Verificar se já foi feito bootstrap
aws cloudformation describe-stacks --stack-name CDKToolkit

# Se não existir, fazer bootstrap
cdk bootstrap aws://207933152643/us-east-1
```

### 2. Deploy em Desenvolvimento (Recomendado primeiro)

```bash
# Deploy em ambiente de desenvolvimento
npm run deploy:dev
```

### 3. Deploy em Staging

```bash
# Após validar dev, deploy em staging
npm run deploy:staging
```

### 4. Deploy em Produção

```bash
# Deploy final em produção
npm run deploy:prod
```

## ⚠️ IMPORTANTE

Antes do deploy em produção, você precisa:

1. **Configurar Secrets no AWS Secrets Manager**:
   - `fibonacci-prod-db-credentials` - Credenciais do banco
   - `fibonacci-prod-whatsapp-api-key` - API key do WhatsApp
   - `fibonacci-prod-google-calendar-credentials` - Credenciais do Google Calendar

2. **Configurar variáveis de ambiente** (se necessário)

3. **Revisar custos estimados**: ~$250-510/mês

## 🎯 Comando Recomendado para Começar

```bash
# Deploy em desenvolvimento para testar
npm run deploy:dev
```

Isso vai criar:
- VPC com subnets
- Aurora Serverless v2
- API Gateway
- 15+ Lambdas
- EventBridge
- SQS Queues
- S3 + CloudFront
- CloudWatch Dashboards
- Alarmes

**Tempo estimado**: 15-30 minutos

## 📊 Após o Deploy

Verificar:
```bash
# Ver stacks criadas
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE

# Ver funções Lambda
aws lambda list-functions --query 'Functions[?contains(FunctionName, `dev`)].FunctionName'

# Health check (após deploy)
curl https://<api-url>/health
```

## 🆘 Se Algo Der Errado

```bash
# Ver logs de erro
aws cloudformation describe-stack-events --stack-name FibonacciStack-dev

# Destruir stack (se necessário)
cdk destroy --all --context env=dev
```

---

**Pronto para começar?** Execute: `npm run deploy:dev`
