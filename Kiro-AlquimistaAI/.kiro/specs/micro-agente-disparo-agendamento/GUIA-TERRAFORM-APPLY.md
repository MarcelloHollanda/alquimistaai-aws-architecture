# 🚀 Guia de Execução - Terraform Apply

**Micro Agente de Disparo Automático & Agendamento**  
**Ambiente**: DEV (ajustar para PROD quando necessário)  
**Região**: us-east-1

---

## 📋 Pré-requisitos

Antes de executar o `terraform apply`, você precisa:

1. ✅ **AWS CLI configurado** com credenciais válidas
2. ✅ **Terraform instalado** (versão >= 1.5.0)
3. ✅ **Node.js 20+** instalado
4. ✅ **PowerShell** (para executar os scripts)

---

## 🔐 Passo 1: Criar Secrets no AWS Secrets Manager

Execute o script para criar os 3 secrets necessários:

```powershell
cd .kiro/specs/micro-agente-disparo-agendamento
.\create-secrets.ps1
```

**⚠️ IMPORTANTE**: Após criar os secrets, você precisa **substituir os valores placeholder** pelos dados reais dos MCPs:

```powershell
# Exemplo: Atualizar secret do MCP WhatsApp
aws secretsmanager put-secret-value `
  --region us-east-1 `
  --secret-id "/alquimista/dev/agente-disparo-agenda/mcp-whatsapp" `
  --secret-string '{"endpoint":"https://SEU-ENDPOINT-REAL","api_key":"SUA-CHAVE-REAL"}'
```

Repita para os outros 2 secrets (Email e Calendar).

---

## 🏗️ Passo 2: Buildar e Fazer Upload das Lambdas

Execute o script para compilar o TypeScript e fazer upload para S3:

```powershell
cd .kiro/specs/micro-agente-disparo-agendamento
.\build-and-upload-lambdas.ps1
```

**O que este script faz:**
1. Instala dependências (`npm install`)
2. Compila TypeScript (`npm run build`)
3. Cria ZIPs das Lambdas
4. Faz upload para S3 (`s3://alquimista-lambda-artifacts-dev/agente-disparo-agenda/dev/`)

**⚠️ Se o bucket não existir**, crie-o primeiro:

```powershell
aws s3 mb s3://alquimista-lambda-artifacts-dev --region us-east-1
```

---

## 🔍 Passo 3: Validar Variáveis do Terraform

Execute o script de validação para verificar se todos os recursos necessários existem:

```powershell
cd .kiro/specs/micro-agente-disparo-agendamento
.\validate-terraform-vars.ps1
```

**O que este script verifica:**
- ✅ SNS Topic de alertas (`alquimista-alerts-dev`)
- ✅ Bucket de artefatos Lambda (`alquimista-lambda-artifacts-dev`)
- ✅ VPC e Subnets privadas
- ✅ Aurora Cluster
- ✅ EventBridge Bus (`fibonacci-bus-dev`)
- ✅ Secrets Manager (3 secrets criados)

**Se alguma validação falhar**, corrija o problema antes de prosseguir.

---

## 📝 Passo 4: Revisar o Terraform Plan

Antes de aplicar, revise o plano para ver o que será criado:

```powershell
cd terraform/envs/dev
terraform init
terraform plan
```

**O que será criado:**
- 🔹 **API Gateway HTTP** (`micro-agente-disparo-agendamento-dev-api`)
- 🔹 **6 Lambdas** (api-handler, ingest-contacts, send-messages, handle-replies, schedule-meeting, confirm-meeting)
- 🔹 **2 Tabelas DynamoDB** (dispatch-queue, meetings)
- 🔹 **1 Fila SQS** (message-queue + DLQ)
- 🔹 **EventBridge Scheduler** (cron para disparo automático)
- 🔹 **EventBridge Rules** (3 rules para eventos)
- 🔹 **CloudWatch Alarms** (4 alarmes)
- 🔹 **IAM Roles e Policies**

**Revise cuidadosamente** o output do `terraform plan` antes de prosseguir.

---

## ✅ Passo 5: Executar Terraform Apply

Se tudo estiver OK no plan, execute o apply:

```powershell
cd terraform/envs/dev
terraform apply
```

**Terraform vai perguntar**: `Do you want to perform these actions?`

Digite `yes` para confirmar.

**⏱️ Tempo estimado**: 5-10 minutos

---

## 🧪 Passo 6: Validar o Deploy

Após o `terraform apply` concluir, valide se tudo foi criado corretamente:

### 6.1. Verificar Outputs do Terraform

```powershell
terraform output
```

**Outputs esperados:**
- `api_gateway_id` - ID do API Gateway
- `api_gateway_invoke_url` - URL base da API (ex: `https://abc123.execute-api.us-east-1.amazonaws.com/dev`)
- `api_gateway_routes` - Lista de rotas criadas
- `lambda_function_names` - Nomes das Lambdas criadas
- `dynamodb_table_names` - Nomes das tabelas DynamoDB
- `sqs_queue_url` - URL da fila SQS

**📝 Anote o `api_gateway_invoke_url`** - você vai precisar dele para configurar o frontend!

### 6.2. Testar Health Check da API

```powershell
$apiUrl = "<API_GATEWAY_INVOKE_URL>"  # Substituir pelo output do Terraform
curl "$apiUrl/disparo/overview"
```

**Resposta esperada:**
```json
{
  "status": "healthy",
  "service": "micro-agente-disparo-agendamento",
  "version": "1.0.0",
  "timestamp": "2024-11-24T..."
}
```

### 6.3. Verificar Lambdas no Console AWS

Acesse o console AWS Lambda e verifique se as 6 Lambdas foram criadas:

1. `micro-agente-disparo-agendamento-dev-api-handler`
2. `micro-agente-disparo-agendamento-dev-ingest-contacts`
3. `micro-agente-disparo-agendamento-dev-send-messages`
4. `micro-agente-disparo-agendamento-dev-handle-replies`
5. `micro-agente-disparo-agendamento-dev-schedule-meeting`
6. `micro-agente-disparo-agendamento-dev-confirm-meeting`

### 6.4. Verificar CloudWatch Alarms

Acesse o console CloudWatch Alarms e verifique se os 4 alarmes foram criados:

1. `DisparoHighFailureRate`
2. `DisparoRateLimitExceeded`
3. `AgendamentoLowConfirmationRate`
4. `AgendamentoHighNoShowRate`

---

## 🔗 Passo 7: Configurar Frontend

Agora que a API está no ar, você precisa configurar o frontend para apontar para ela.

### 7.1. Atualizar Variável de Ambiente

Edite o arquivo `frontend/.env.local` (ou `.env.development`):

```bash
# Adicionar ou atualizar esta linha:
NEXT_PUBLIC_DISPARO_API_URL=<API_GATEWAY_INVOKE_URL>
```

**Exemplo:**
```bash
NEXT_PUBLIC_DISPARO_API_URL=https://abc123.execute-api.us-east-1.amazonaws.com/dev
```

### 7.2. Atualizar Cliente da API

Edite o arquivo `frontend/src/lib/api/disparo-agenda-api.ts`:

```typescript
// Trocar de stub para API real
const API_BASE_URL = process.env.NEXT_PUBLIC_DISPARO_API_URL || 'http://localhost:3000';

// Remover dados mockados e usar fetch real
export async function getOverview(): Promise<OverviewData> {
  const response = await fetch(`${API_BASE_URL}/disparo/overview`);
  if (!response.ok) throw new Error('Failed to fetch overview');
  return response.json();
}
```

### 7.3. Testar Frontend

```powershell
cd frontend
npm run dev
```

Acesse `http://localhost:3000/disparo-agenda` e verifique se os dados estão sendo carregados da API real.

---

## 🧪 Passo 8: Executar Testes E2E

Execute os testes end-to-end para validar a integração completa:

```powershell
cd frontend
npx playwright test tests/e2e/disparo-agenda.spec.ts
```

**Testes esperados:**
- ✅ Página carrega sem erros
- ✅ Overview cards exibem dados da API
- ✅ Tabela de campanhas carrega
- ✅ Tabela de reuniões carrega
- ✅ Upload de contatos funciona

---

## 📊 Passo 9: Monitorar Logs e Métricas

### 9.1. CloudWatch Logs

```powershell
# Ver logs da Lambda API Handler
aws logs tail /aws/lambda/micro-agente-disparo-agendamento-dev-api-handler --follow
```

### 9.2. CloudWatch Metrics

Acesse o console CloudWatch Metrics e procure por:
- Namespace: `Alquimista/Nigredo/Disparo`
- Namespace: `Alquimista/Nigredo/Agendamento`

### 9.3. X-Ray Traces

Acesse o console AWS X-Ray para ver traces distribuídos das requisições.

---

## 🔄 Rollback (Se Necessário)

Se algo der errado, você pode fazer rollback:

```powershell
cd terraform/envs/dev
terraform destroy
```

**⚠️ CUIDADO**: Isso vai **deletar todos os recursos** criados pelo Terraform!

---

## ✅ Checklist Final

Antes de considerar o deploy completo, verifique:

- [ ] Secrets criados e com valores reais (não placeholders)
- [ ] Lambdas buildadas e no S3
- [ ] `terraform apply` executado com sucesso
- [ ] API Gateway respondendo no health check
- [ ] Lambdas visíveis no console AWS
- [ ] CloudWatch Alarms criados
- [ ] Frontend configurado com `NEXT_PUBLIC_DISPARO_API_URL`
- [ ] Testes E2E passando
- [ ] Logs estruturados aparecendo no CloudWatch
- [ ] Métricas sendo emitidas

---

## 🆘 Troubleshooting

### Problema: Terraform apply falha com "Secret not found"

**Solução**: Execute o script `create-secrets.ps1` primeiro.

### Problema: Lambda não consegue acessar Aurora

**Solução**: Verifique se as Lambdas estão na mesma VPC e subnets privadas do Aurora.

### Problema: API Gateway retorna 502 Bad Gateway

**Solução**: Verifique os logs da Lambda no CloudWatch Logs para ver o erro específico.

### Problema: Rate limit sendo atingido muito rápido

**Solução**: Ajuste as variáveis de ambiente das Lambdas:
- `RATE_LIMIT_TENANT_HOURLY`
- `RATE_LIMIT_TENANT_DAILY`

---

## 📚 Próximos Passos

Após o deploy em DEV estar estável:

1. **Testar fluxos completos** (disparo + agendamento)
2. **Ajustar rate limits** conforme necessário
3. **Validar integrações MCP** (WhatsApp, Email, Calendar)
4. **Preparar deploy em PROD** (repetir processo com `env=prod`)

---

**Última atualização**: 24 de Novembro de 2024  
**Versão**: 1.0.0  
**Mantido por**: Equipe AlquimistaAI
