# 🚀 Comandos para Deploy em DEV - Micro Agente Disparo & Agendamento

**Status:** ✅ Pronto para execução  
**Data:** 24 de novembro de 2024

---

## 📋 Pré-requisitos

- [x] Node.js 20 instalado
- [x] AWS CLI configurado (região us-east-1)
- [x] Terraform instalado
- [x] Credenciais AWS válidas

---

## 🎯 Sequência de Execução

### 1️⃣ Criar Secrets no AWS Secrets Manager

```powershell
cd C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI\.kiro\specs\micro-agente-disparo-agendamento

.\create-secrets.ps1
```

**Tempo estimado:** 30 segundos  
**O que faz:** Cria 3 secrets com valores placeholder

**Secrets criados:**
- `/repo/terraform/micro-agente-disparo-agendamento/whatsapp`
- `/repo/terraform/micro-agente-disparo-agendamento/email`
- `/repo/terraform/micro-agente-disparo-agendamento/calendar`

**Opcional - Atualizar com valores reais:**
```powershell
aws secretsmanager put-secret-value `
  --region us-east-1 `
  --secret-id "/repo/terraform/micro-agente-disparo-agendamento/whatsapp" `
  --secret-string '{"endpoint":"https://real-endpoint","api_key":"real-key"}'
```

---

### 2️⃣ Buildar e Enviar Lambdas para S3

```powershell
cd C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI\.kiro\specs\micro-agente-disparo-agendamento

.\build-and-upload-lambdas.ps1
```

**Tempo estimado:** 2-3 minutos  
**O que faz:**
1. `npm install` (instala dependências)
2. `npm run build` (compila TypeScript)
3. Cria ZIPs dos handlers
4. Upload para `s3://alquimista-lambda-artifacts-dev/`

**Handlers buildados:**
- api-handler.zip
- ingest-contacts.zip
- send-messages.zip
- handle-replies.zip
- schedule-meeting.zip
- confirm-meeting.zip

---

### 3️⃣ Validar Recursos AWS

```powershell
cd C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI\.kiro\specs\micro-agente-disparo-agendamento

.\validate-terraform-vars.ps1
```

**Tempo estimado:** 30 segundos  
**O que valida:**
- ✅ SNS Topic: `alquimista-alerts-dev`
- ✅ Bucket S3: `alquimista-lambda-artifacts-dev`
- ✅ VPC e Subnets (tag Project=Alquimista)
- ✅ Aurora Cluster
- ✅ EventBridge Bus: `fibonacci-bus-dev`
- ✅ Secrets Manager (3 secrets)

**Saída esperada:**
```
✓ Todas as validações passaram!

Variáveis para usar no Terraform:
  alerts_sns_topic_arn    = "arn:aws:sns:..."
  lambda_artifact_bucket  = "alquimista-lambda-artifacts-dev"
  vpc_id                  = "vpc-..."
  ...
```

---

### 4️⃣ Aplicar Terraform

```powershell
cd C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI\terraform\envs\dev

terraform init
terraform plan
terraform apply
```

**Tempo estimado:** 5-10 minutos  
**O que será criado:**

#### Lambdas (6)
- `api-handler-dev` - API Gateway handler
- `ingest-contacts-dev` - Ingestão de contatos
- `send-messages-dev` - Envio de mensagens
- `handle-replies-dev` - Processamento de respostas
- `schedule-meeting-dev` - Agendamento de reuniões
- `confirm-meeting-dev` - Confirmação de reuniões

#### DynamoDB (2)
- `dispatch-queue-dev` - Fila de disparos
- `rate-limit-tracker-dev` - Controle de rate limiting

#### API Gateway HTTP (1)
- 6 rotas configuradas
- Integração com Lambda api-handler

#### EventBridge (2)
- Scheduler (cron para disparo automático)
- Rules (eventos de campanha)

#### CloudWatch (6)
- Alarms para cada Lambda
- Log Groups automáticos

#### IAM (6)
- Roles para cada Lambda
- Policies de acesso

---

## 🔍 Verificação Pós-Deploy

### Verificar Lambdas Criadas

```powershell
aws lambda list-functions --region us-east-1 --query "Functions[?contains(FunctionName, 'disparo-agenda')].FunctionName"
```

### Verificar API Gateway

```powershell
aws apigatewayv2 get-apis --region us-east-1 --query "Items[?contains(Name, 'disparo-agenda')]"
```

### Verificar DynamoDB Tables

```powershell
aws dynamodb list-tables --region us-east-1 --query "TableNames[?contains(@, 'dispatch') || contains(@, 'rate-limit')]"
```

### Testar Health Check

```powershell
# Obter URL da API
$apiUrl = terraform output -raw api_gateway_url

# Testar health check
curl "$apiUrl/api/disparo-agenda/health"
```

**Resposta esperada:**
```json
{
  "status": "healthy",
  "service": "micro-agente-disparo-agendamento",
  "environment": "dev",
  "timestamp": "2024-11-24T..."
}
```

---

## 📊 Recursos Criados - Resumo

| Tipo | Quantidade | Nomes |
|------|------------|-------|
| Lambda | 6 | api-handler, ingest-contacts, send-messages, handle-replies, schedule-meeting, confirm-meeting |
| DynamoDB | 2 | dispatch-queue, rate-limit-tracker |
| API Gateway | 1 | agente-disparo-agenda-api-dev |
| EventBridge | 2 | Scheduler + Rules |
| CloudWatch Alarms | 6 | 1 por Lambda |
| IAM Roles | 6 | 1 por Lambda |
| Secrets | 3 | whatsapp, email, calendar |

---

## 💰 Estimativa de Custos (DEV)

| Serviço | Custo Mensal Estimado |
|---------|----------------------|
| Lambda | $5-10 |
| DynamoDB | $5-15 |
| API Gateway | $1-3 |
| EventBridge | $1 |
| Secrets Manager | $2 |
| CloudWatch | $2-5 |
| **Total** | **$16-36/mês** |

---

## 🔄 Rollback (Se Necessário)

```powershell
cd C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI\terraform\envs\dev

terraform destroy
```

**Atenção:** Isso removerá TODOS os recursos criados!

---

## 📝 Logs e Monitoramento

### Ver Logs em Tempo Real

```powershell
# API Handler
aws logs tail /aws/lambda/api-handler-dev --follow

# Send Messages
aws logs tail /aws/lambda/send-messages-dev --follow

# Schedule Meeting
aws logs tail /aws/lambda/schedule-meeting-dev --follow
```

### Ver Métricas no CloudWatch

1. Acesse: https://console.aws.amazon.com/cloudwatch/
2. Região: us-east-1
3. Dashboards → Buscar "disparo-agenda"

---

## ✅ Checklist de Execução

- [ ] 1. Executar `create-secrets.ps1`
- [ ] 2. Executar `build-and-upload-lambdas.ps1`
- [ ] 3. Executar `validate-terraform-vars.ps1`
- [ ] 4. Executar `terraform init`
- [ ] 5. Executar `terraform plan` (revisar mudanças)
- [ ] 6. Executar `terraform apply` (confirmar com "yes")
- [ ] 7. Verificar recursos criados
- [ ] 8. Testar health check da API
- [ ] 9. Verificar logs no CloudWatch
- [ ] 10. Documentar outputs do Terraform

---

## 🆘 Troubleshooting

### Erro: "Secret already exists"

**Solução:** Use `put-secret-value` em vez de `create-secret`

```powershell
aws secretsmanager put-secret-value --region us-east-1 --secret-id "/repo/terraform/micro-agente-disparo-agendamento/whatsapp" --secret-string '{"endpoint":"...","api_key":"..."}'
```

### Erro: "Bucket does not exist"

**Solução:** Criar o bucket

```powershell
aws s3 mb s3://alquimista-lambda-artifacts-dev --region us-east-1
```

### Erro: "VPC not found"

**Solução:** Verificar se a VPC do projeto existe

```powershell
aws ec2 describe-vpcs --region us-east-1 --filters "Name=tag:Project,Values=Alquimista"
```

### Erro no Terraform: "Secret not found"

**Solução:** Executar `create-secrets.ps1` primeiro

---

## 📚 Documentação Relacionada

- **Sessão de Alinhamento:** `SESSAO-ALINHAMENTO-SECRETS-DEPLOY-2024-11-24.md`
- **Resumo Executivo:** `ALINHAMENTO-COMPLETO-RESUMO.md`
- **Resumo para ChatGPT:** `RESUMO-PARA-CHATGPT.md`
- **Blueprint:** `.kiro/steering/blueprint-disparo-agendamento.md`

---

**Pronto para executar!** 🚀
