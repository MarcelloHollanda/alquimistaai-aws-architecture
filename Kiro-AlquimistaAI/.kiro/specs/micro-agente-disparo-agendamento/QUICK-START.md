# Quick Start - Micro Agente Disparo & Agendamento

Guia rápido para desenvolvimento e deploy do Micro Agente.

---

## 🚀 Setup Inicial

### 1. Instalar Dependências das Lambdas

```bash
cd lambda-src/agente-disparo-agenda
npm install
```

### 2. Compilar TypeScript

```bash
npm run build
```

### 3. Executar Testes (quando implementados)

```bash
npm test
```

---

## 🏗️ Desenvolvimento Local

### Estrutura de Diretórios

```
lambda-src/agente-disparo-agenda/
├── src/
│   ├── types/
│   │   └── common.ts          # Tipos e interfaces
│   ├── utils/
│   │   ├── aws-clients.ts     # Clientes AWS
│   │   └── logger.ts          # Logger estruturado
│   ├── ingest-contacts.ts     # Lambda 1
│   ├── enrich-contacts.ts     # Lambda 2
│   ├── plan-campaigns.ts      # Lambda 3
│   ├── send-messages.ts       # Lambda 4
│   ├── handle-replies.ts      # Lambda 5
│   ├── schedule-meeting.ts    # Lambda 6
│   └── analytics-reporting.ts # Lambda 7
├── package.json
└── tsconfig.json
```

### Adicionar Nova Lambda

1. Criar arquivo em `src/<nome-lambda>.ts`
2. Implementar handler seguindo padrão:

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createLogger } from './utils/logger';
import { docClient, config } from './utils/aws-clients';

const logger = createLogger({ function: 'nome-lambda' });

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Iniciando processamento', { event });
  
  try {
    // Implementação aqui
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error) {
    logger.error('Erro no processamento', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Internal error' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};
```

3. Adicionar definição no Terraform (`terraform/modules/agente_disparo_agenda/lambda.tf`)

---

## 🔧 Terraform

### Validar Configuração

```bash
cd terraform/modules/agente_disparo_agenda
terraform init
terraform validate
```

### Deploy em Dev

```bash
cd terraform/envs/dev
terraform init
terraform plan -var-file=dev.tfvars
terraform apply -var-file=dev.tfvars
```

### Deploy em Prod

```bash
cd terraform/envs/prod
terraform init
terraform plan -var-file=prod.tfvars
terraform apply -var-file=prod.tfvars
```

### Destruir Recursos (Dev apenas)

```bash
cd terraform/envs/dev
terraform destroy -var-file=dev.tfvars
```

---

## 🔐 Configurar Segredos

### Criar Segredos no AWS Secrets Manager

```bash
# WhatsApp
aws secretsmanager create-secret \
  --name /repo/terraform/agente-disparo-agenda/whatsapp \
  --secret-string '{"api_key":"YOUR_WHATSAPP_API_KEY","endpoint":"https://api.whatsapp.com"}' \
  --region us-east-1

# Email
aws secretsmanager create-secret \
  --name /repo/terraform/agente-disparo-agenda/email \
  --secret-string '{"api_key":"YOUR_EMAIL_API_KEY","endpoint":"https://api.email.com"}' \
  --region us-east-1

# Calendar
aws secretsmanager create-secret \
  --name /repo/terraform/agente-disparo-agenda/calendar \
  --secret-string '{"credentials":"YOUR_GOOGLE_CREDENTIALS"}' \
  --region us-east-1
```

---

## 📊 Monitoramento

### Ver Logs das Lambdas

```bash
# Logs em tempo real
aws logs tail /aws/lambda/alquimista-dev-disparo-agenda-send-messages --follow

# Últimas 100 linhas
aws logs tail /aws/lambda/alquimista-dev-disparo-agenda-send-messages --since 1h
```

### Ver Métricas CloudWatch

```bash
# Erros da Lambda
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=alquimista-dev-disparo-agenda-send-messages \
  --start-time 2024-01-15T00:00:00Z \
  --end-time 2024-01-15T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

### Ver Mensagens na Fila SQS

```bash
# Obter URL da fila
QUEUE_URL=$(aws sqs get-queue-url --queue-name alquimista-dev-disparo-agenda-message-queue --query 'QueueUrl' --output text)

# Ver atributos da fila
aws sqs get-queue-attributes \
  --queue-url $QUEUE_URL \
  --attribute-names All
```

---

## 🧪 Testes

### Testar Lambda Localmente (com SAM)

```bash
# Instalar SAM CLI
# https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html

# Invocar Lambda local
sam local invoke IngestContactsFunction -e events/ingest-contacts-event.json
```

### Testar Integração com DynamoDB Local

```bash
# Iniciar DynamoDB Local
docker run -p 8000:8000 amazon/dynamodb-local

# Criar tabelas locais
aws dynamodb create-table \
  --table-name alquimista-dev-disparo-agenda-contacts \
  --attribute-definitions AttributeName=pk,AttributeType=S \
  --key-schema AttributeName=pk,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:8000
```

---

## 🐛 Troubleshooting

### Lambda não está sendo invocada

1. Verificar EventBridge Rule está habilitada:
```bash
aws events describe-rule --name alquimista-dev-disparo-agenda-business-hours-dispatch
```

2. Verificar permissões da Lambda:
```bash
aws lambda get-policy --function-name alquimista-dev-disparo-agenda-send-messages
```

### Mensagens não estão sendo processadas

1. Verificar Dead Letter Queue:
```bash
DLQ_URL=$(aws sqs get-queue-url --queue-name alquimista-dev-disparo-agenda-message-dlq --query 'QueueUrl' --output text)
aws sqs receive-message --queue-url $DLQ_URL
```

2. Verificar alarmes CloudWatch:
```bash
aws cloudwatch describe-alarms --alarm-names alquimista-dev-disparo-agenda-dlq-messages
```

### Erros de permissão

1. Verificar IAM Role da Lambda:
```bash
aws iam get-role --role-name alquimista-dev-disparo-agenda-lambda-role
```

2. Verificar policies anexadas:
```bash
aws iam list-attached-role-policies --role-name alquimista-dev-disparo-agenda-lambda-role
```

---

## 📚 Recursos Úteis

- **AWS Lambda Docs**: https://docs.aws.amazon.com/lambda/
- **DynamoDB Docs**: https://docs.aws.amazon.com/dynamodb/
- **EventBridge Docs**: https://docs.aws.amazon.com/eventbridge/
- **Terraform AWS Provider**: https://registry.terraform.io/providers/hashicorp/aws/latest/docs

---

**Última Atualização**: 2024-01-15
