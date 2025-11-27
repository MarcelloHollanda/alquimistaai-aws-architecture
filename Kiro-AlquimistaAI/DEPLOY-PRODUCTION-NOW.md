# 🚀 Deploy em Produção - Guia Rápido

**Data**: 16 de Novembro de 2025  
**Status**: ✅ Sistema pronto para deploy

---

## ⚡ Quick Start (5 minutos)

### Opção 1: Deploy Automatizado (Recomendado)

```powershell
# Deploy completo com validação
.\scripts\complete-production-deploy.ps1 -Environment prod
```

### Opção 2: Deploy Manual

```powershell
# 1. Build
npm run build

# 2. Deploy
npm run deploy:prod

# 3. Validar
.\scripts\post-deploy-validation.ps1 -Environment prod
```

---

## 📋 Pré-requisitos

Antes de executar o deploy, certifique-se de ter:

- ✅ AWS CLI configurado (`aws configure`)
- ✅ Node.js 20.x instalado
- ✅ AWS CDK instalado (`npm install -g aws-cdk`)
- ✅ Credenciais AWS com permissões adequadas
- ✅ Código compilado sem erros (`npm run build`)

### Verificar Pré-requisitos

```powershell
# Verificar AWS
aws sts get-caller-identity

# Verificar Node.js
node --version  # Deve ser v20.x

# Verificar CDK
cdk --version

# Verificar build
npm run build
```

---

## 🎯 Deploy Passo a Passo

### Passo 1: Preparação (2 min)

```powershell
# Instalar dependências
npm ci

# Build
npm run build

# Verificar mudanças
npm run diff
```

### Passo 2: Deploy (15-25 min)

```powershell
# Deploy todas as stacks
npm run deploy:prod

# Ou usar script automatizado
.\scripts\complete-production-deploy.ps1 -Environment prod
```

**O que será criado:**
- 3 CloudFormation Stacks (Fibonacci, Nigredo, Alquimista)
- ~50 recursos AWS (VPC, Aurora, Lambda, API Gateway, etc.)
- Dashboards e alarmes do CloudWatch
- Configurações de segurança (WAF, CloudTrail, etc.)

### Passo 3: Validação (5 min)

```powershell
# Executar validação completa
.\scripts\post-deploy-validation.ps1 -Environment prod
```

**Testes executados:**
- ✅ CloudFormation stacks criadas
- ✅ API Gateway respondendo
- ✅ Database conectado
- ✅ Lambda functions ativas
- ✅ CloudWatch dashboards criados
- ✅ Alarmes configurados

### Passo 4: Configuração Pós-Deploy (10 min)

```powershell
# 1. Executar migrações do banco
node scripts/migrate.js

# 2. Popular dados iniciais
psql -h <DB_ENDPOINT> -U postgres -d fibonacci -f database/seeds/initial_data.sql
```

### Passo 5: Deploy do Frontend (5 min)

```powershell
cd frontend

# Configurar variáveis de ambiente
cp .env.production.example .env.production
# Editar .env.production com URLs do backend

# Deploy
npm run deploy:vercel
```

---

## 📊 Outputs Importantes

Após o deploy, você receberá os seguintes outputs:

### FibonacciStack
- **ApiUrl**: URL do API Gateway (ex: https://xxx.execute-api.us-east-1.amazonaws.com/)
- **DatabaseEndpoint**: Endpoint do Aurora
- **CloudFrontUrl**: URL do CloudFront
- **UserPoolId**: ID do Cognito User Pool
- **VpcId**: ID da VPC

### NigredoStack
- **RecebimentoQueueUrl**: URL da fila de recebimento
- **EventBusArn**: ARN do EventBridge bus

### AlquimistaStack
- **PlatformApiUrl**: URL da API da plataforma

---

## 🔐 Configurar Secrets

Após o deploy, configure os secrets necessários:

### 1. WhatsApp Business API

```powershell
aws secretsmanager create-secret `
  --name fibonacci-prod-whatsapp-credentials `
  --secret-string '{
    "apiKey": "YOUR_WHATSAPP_API_KEY",
    "phoneNumberId": "YOUR_PHONE_NUMBER_ID"
  }'
```

### 2. Google Calendar OAuth

```powershell
aws secretsmanager create-secret `
  --name fibonacci-prod-google-calendar-credentials `
  --secret-string '{
    "clientId": "YOUR_CLIENT_ID",
    "clientSecret": "YOUR_CLIENT_SECRET",
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

### 3. Outras Integrações MCP

Configure conforme necessário para:
- Receita Federal API
- LinkedIn API
- Outras integrações

---

## 🔍 Monitoramento

### CloudWatch Dashboards

Acesse os dashboards criados:

1. **Fibonacci Core Dashboard**
   - Métricas de API Gateway
   - Métricas de Lambda
   - Métricas de EventBridge
   - Métricas de SQS

2. **Nigredo Agents Dashboard**
   - Leads processados por agente
   - Taxa de sucesso
   - Tempo médio de processamento
   - Erros por agente

3. **Business Metrics Dashboard**
   - Funil de conversão
   - Taxa de resposta
   - Taxa de agendamento
   - Custo por lead
   - ROI por campanha

### CloudWatch Alarms

Alarmes configurados:
- ✅ Taxa de erro alta (>10 erros em 2 min)
- ✅ Latência alta (p95 >3s)
- ✅ DLQ não vazia
- ✅ Aurora CPU alta (>80%)
- ✅ Custos acima do budget

### Logs

Acessar logs:

```powershell
# Logs do API Handler
aws logs tail /aws/lambda/fibonacci-prod-handler --follow

# Logs de um agente específico
aws logs tail /aws/lambda/fibonacci-prod-recebimento --follow
```

---

## 🧪 Smoke Tests

Execute testes básicos após o deploy:

```powershell
# Obter API URL
$API_URL = aws cloudformation describe-stacks `
  --stack-name FibonacciStack-prod `
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' `
  --output text

# Test health endpoint
Invoke-RestMethod -Uri "$API_URL/health"
# Esperado: { "ok": true }

# Test database status
Invoke-RestMethod -Uri "$API_URL/db-status"
# Esperado: { "db_status": "connected" }

# Test event publishing
Invoke-RestMethod -Uri "$API_URL/events" -Method Post -Body '{"type":"test","data":{}}' -ContentType "application/json"
# Esperado: { "eventId": "..." }
```

---

## 🔄 Rollback

Se algo der errado, execute rollback:

### Rollback Automático

```powershell
# Rollback para versão anterior
cdk deploy --all --context env=prod --rollback
```

### Rollback Manual

```powershell
# Listar versões anteriores
aws cloudformation list-stack-resources --stack-name FibonacciStack-prod

# Rollback para versão específica
aws cloudformation update-stack `
  --stack-name FibonacciStack-prod `
  --use-previous-template `
  --parameters UsePreviousValue=true
```

---

## 📈 Métricas de Sucesso

Após 24-48 horas, valide:

### Performance
- ✅ P99 latência < 3s
- ✅ Cold start < 500ms
- ✅ Cache hit rate > 70%

### Confiabilidade
- ✅ Uptime > 99.95%
- ✅ Error rate < 0.1%
- ✅ MTTR < 15min

### Custos
- ✅ Custo por request < $0.001
- ✅ Custo total < $120/mês

---

## 🆘 Troubleshooting

### Problema: Deploy falha com erro de permissão

**Solução:**
```powershell
# Verificar permissões IAM
aws iam get-user

# Verificar se tem permissões de CloudFormation
aws cloudformation describe-stacks --stack-name FibonacciStack-prod
```

### Problema: Lambda não consegue conectar ao Aurora

**Solução:**
1. Verificar Security Groups
2. Verificar que Lambda está na VPC correta
3. Verificar que subnets têm acesso ao Aurora

```powershell
# Verificar configuração da Lambda
aws lambda get-function-configuration --function-name fibonacci-prod-handler
```

### Problema: API Gateway retorna 502

**Solução:**
1. Verificar logs da Lambda
2. Verificar timeout da Lambda
3. Verificar que Lambda tem permissões corretas

```powershell
# Ver logs recentes
aws logs tail /aws/lambda/fibonacci-prod-handler --since 10m
```

### Problema: CloudWatch Alarms em estado ALARM

**Solução:**
1. Identificar qual métrica está fora do threshold
2. Verificar logs para identificar causa raiz
3. Ajustar configuração ou corrigir código

```powershell
# Listar alarmes em ALARM
aws cloudwatch describe-alarms --state-value ALARM
```

---

## 📞 Suporte

### Documentação
- [Troubleshooting Guide](./docs/deploy/TROUBLESHOOTING.md)
- [Architecture Documentation](./docs/ecosystem/ARQUITETURA-TECNICA-COMPLETA.md)
- [API Documentation](./docs/ecosystem/API-DOCUMENTATION.md)

### Logs e Métricas
- CloudWatch Console: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1
- CloudFormation Console: https://console.aws.amazon.com/cloudformation/home?region=us-east-1
- Lambda Console: https://console.aws.amazon.com/lambda/home?region=us-east-1

### Comandos Úteis

```powershell
# Ver status das stacks
aws cloudformation describe-stacks --query 'Stacks[*].[StackName,StackStatus]' --output table

# Ver outputs de uma stack
aws cloudformation describe-stacks --stack-name FibonacciStack-prod --query 'Stacks[0].Outputs'

# Ver recursos de uma stack
aws cloudformation list-stack-resources --stack-name FibonacciStack-prod

# Ver logs de uma Lambda
aws logs tail /aws/lambda/fibonacci-prod-handler --follow

# Ver métricas de uma Lambda
aws cloudwatch get-metric-statistics `
  --namespace AWS/Lambda `
  --metric-name Invocations `
  --dimensions Name=FunctionName,Value=fibonacci-prod-handler `
  --start-time (Get-Date).AddHours(-1) `
  --end-time (Get-Date) `
  --period 300 `
  --statistics Sum
```

---

## ✅ Checklist Final

Antes de considerar o deploy completo:

- [ ] Deploy executado com sucesso
- [ ] Validação pós-deploy passou (>90% dos testes)
- [ ] Secrets configurados
- [ ] Migrações do banco executadas
- [ ] Frontend deployado
- [ ] Smoke tests passando
- [ ] Dashboards mostrando dados
- [ ] Alarmes configurados e em estado OK
- [ ] Documentação atualizada
- [ ] Equipe treinada
- [ ] Plano de rollback testado
- [ ] Monitoramento ativo por 24-48h

---

## 🎉 Conclusão

Após completar todos os passos acima, seu sistema Alquimista.AI estará 100% operacional em produção!

**Próximos Passos:**
1. Monitorar sistema por 48 horas
2. Coletar feedback de usuários
3. Ajustar configurações conforme necessário
4. Planejar próximas features

---

**Última Atualização**: 16 de Novembro de 2025  
**Versão**: 1.0.0  
**Status**: ✅ Pronto para Produção
