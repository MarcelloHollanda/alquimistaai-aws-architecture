# ⚙️ Configurações Otimizadas - Micro Agente Disparo & Agendamento

**Data**: 24 de Novembro de 2024  
**Ambiente**: DEV (ajustar para PROD conforme necessário)

---

## 📊 Configurações Recomendadas por Ambiente

### DEV (Desenvolvimento)

#### Rate Limiting
```hcl
# Conservador para testes
rate_limit_whatsapp_hourly = 100
rate_limit_email_hourly = 500
rate_limit_sms_hourly = 50

# Burst limits
rate_limit_whatsapp_burst = 10
rate_limit_email_burst = 50
rate_limit_sms_burst = 5
```

#### Timeouts
```hcl
lambda_timeout_api = 30          # 30 segundos
lambda_timeout_send = 180        # 3 minutos
lambda_timeout_schedule = 300    # 5 minutos
lambda_timeout_ingest = 120      # 2 minutos
```

#### Recursos
```hcl
lambda_memory_api = 512          # MB
lambda_memory_send = 1024        # MB
lambda_memory_schedule = 512     # MB

dynamodb_billing_mode = "ON_DEMAND"
```

---

### PROD (Produção)

#### Rate Limiting
```hcl
# Otimizado para produção
rate_limit_whatsapp_hourly = 1000
rate_limit_email_hourly = 5000
rate_limit_sms_hourly = 500

# Burst limits
rate_limit_whatsapp_burst = 50
rate_limit_email_burst = 200
rate_limit_sms_burst = 25
```

#### Timeouts
```hcl
lambda_timeout_api = 30          # 30 segundos
lambda_timeout_send = 300        # 5 minutos
lambda_timeout_schedule = 900    # 15 minutos
lambda_timeout_ingest = 180      # 3 minutos
```

#### Recursos
```hcl
lambda_memory_api = 1024         # MB
lambda_memory_send = 2048        # MB
lambda_memory_schedule = 1024    # MB

dynamodb_billing_mode = "ON_DEMAND"
dynamodb_autoscaling_enabled = true
```

---

## 🕐 Horários Comerciais

### Configuração Padrão (Brasil)

```json
{
  "timezone": "America/Sao_Paulo",
  "workingDays": [1, 2, 3, 4, 5],
  "startTime": "08:00",
  "endTime": "18:00",
  "lunchBreak": {
    "start": "12:00",
    "end": "13:00"
  },
  "holidays": [
    "2024-12-25",
    "2024-01-01",
    "2024-04-21",
    "2024-09-07",
    "2024-10-12",
    "2024-11-02",
    "2024-11-15",
    "2024-11-20"
  ]
}
```

### Configuração Internacional

```json
{
  "timezones": {
    "America/Sao_Paulo": {
      "startTime": "08:00",
      "endTime": "18:00"
    },
    "America/New_York": {
      "startTime": "09:00",
      "endTime": "17:00"
    },
    "Europe/London": {
      "startTime": "09:00",
      "endTime": "17:00"
    }
  }
}
```

---

## 🔄 Estratégias de Retry e Backoff

### Configuração Recomendada

```hcl
# Retry configuration
max_retries = 3
backoff_strategy = "exponential"
backoff_multiplier = 2
initial_backoff_ms = 1000

# Circuit breaker
circuit_breaker_threshold = 10
circuit_breaker_timeout_ms = 60000
```

### Comportamento

| Tentativa | Delay (Exponencial) | Delay (Linear) |
|-----------|---------------------|----------------|
| 1         | 1s                  | 1s             |
| 2         | 2s                  | 2s             |
| 3         | 4s                  | 3s             |
| 4         | 8s                  | 4s             |
| 5         | 16s                 | 5s             |

---

## 📦 DynamoDB - Configurações Otimizadas

### Tabela: campaigns

```hcl
resource "aws_dynamodb_table" "campaigns" {
  name           = "alquimista-disparo-campaigns-${var.environment}"
  billing_mode   = "ON_DEMAND"
  hash_key       = "campaign_id"
  
  attribute {
    name = "campaign_id"
    type = "S"
  }
  
  attribute {
    name = "status"
    type = "S"
  }
  
  attribute {
    name = "created_at"
    type = "S"
  }
  
  global_secondary_index {
    name            = "status-created-index"
    hash_key        = "status"
    range_key       = "created_at"
    projection_type = "ALL"
  }
  
  ttl {
    attribute_name = "expires_at"
    enabled        = true
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  server_side_encryption {
    enabled = true
  }
}
```

### Tabela: contacts

```hcl
resource "aws_dynamodb_table" "contacts" {
  name           = "alquimista-disparo-contacts-${var.environment}"
  billing_mode   = "ON_DEMAND"
  hash_key       = "contact_id"
  
  attribute {
    name = "contact_id"
    type = "S"
  }
  
  attribute {
    name = "campaign_id"
    type = "S"
  }
  
  attribute {
    name = "status"
    type = "S"
  }
  
  global_secondary_index {
    name            = "campaign-status-index"
    hash_key        = "campaign_id"
    range_key       = "status"
    projection_type = "ALL"
  }
  
  ttl {
    attribute_name = "expires_at"
    enabled        = true
  }
}
```

---

## 🔐 Secrets - Estrutura Recomendada

### MCP WhatsApp

```json
{
  "endpoint": "https://api.whatsapp.com/v1",
  "api_key": "YOUR_WHATSAPP_API_KEY",
  "phone_number_id": "123456789",
  "business_account_id": "987654321",
  "webhook_verify_token": "YOUR_WEBHOOK_TOKEN"
}
```

### MCP Email

```json
{
  "endpoint": "https://api.sendgrid.com/v3",
  "api_key": "YOUR_SENDGRID_API_KEY",
  "from_email": "noreply@alquimista.ai",
  "from_name": "Alquimista AI",
  "reply_to": "contato@alquimista.ai"
}
```

### MCP Calendar

```json
{
  "endpoint": "https://www.googleapis.com/calendar/v3",
  "api_key": "YOUR_GOOGLE_API_KEY",
  "calendar_id": "vendas@alquimista.ai",
  "service_account_email": "calendar-service@project.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
}
```

---

## 📊 CloudWatch - Métricas e Alarmes

### Métricas Customizadas

```typescript
// Rate Limiting
{
  namespace: 'AlquimistaAI/DisparoAgenda',
  metrics: [
    'RateLimitHit',
    'MessagesSent',
    'MessagesFailedRate',
    'QueueDepth'
  ]
}

// Performance
{
  namespace: 'AlquimistaAI/DisparoAgenda',
  metrics: [
    'AverageDispatchTime',
    'ConfirmationRate',
    'NoShowRate'
  ]
}
```

### Alarmes Recomendados

```hcl
# Alta taxa de erro
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "disparo-agenda-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "Alerta quando taxa de erro > 10 em 5 minutos"
}

# Alta latência
resource "aws_cloudwatch_metric_alarm" "high_latency" {
  alarm_name          = "disparo-agenda-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Average"
  threshold           = "10000"
  alarm_description   = "Alerta quando latência média > 10s"
}

# DLQ com mensagens
resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  alarm_name          = "disparo-agenda-dlq-messages"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Maximum"
  threshold           = "0"
  alarm_description   = "Alerta quando há mensagens na DLQ"
}
```

---

## 🎯 Otimizações de Performance

### Lambda

1. **Provisioned Concurrency** (PROD apenas)
   ```hcl
   provisioned_concurrent_executions = 5
   ```

2. **Reserved Concurrency**
   ```hcl
   reserved_concurrent_executions = 100  # PROD
   reserved_concurrent_executions = 10   # DEV
   ```

3. **Memory Optimization**
   - API Handler: 512 MB (DEV) / 1024 MB (PROD)
   - Send Messages: 1024 MB (DEV) / 2048 MB (PROD)
   - Schedule Meeting: 512 MB (DEV) / 1024 MB (PROD)

### DynamoDB

1. **Auto Scaling** (PROD)
   ```hcl
   autoscaling_read_min = 5
   autoscaling_read_max = 100
   autoscaling_write_min = 5
   autoscaling_write_max = 100
   ```

2. **Global Tables** (Multi-região - futuro)
   ```hcl
   replica_regions = ["us-west-2", "eu-west-1"]
   ```

### SQS

1. **Visibility Timeout**
   ```hcl
   visibility_timeout_seconds = 1800  # 6x Lambda timeout
   ```

2. **Message Retention**
   ```hcl
   message_retention_seconds = 1209600  # 14 dias
   ```

---

## 💰 Estimativa de Custos (Mensal)

### DEV
- Lambda: ~$5-10
- DynamoDB: ~$5-15
- SQS: ~$1-2
- EventBridge: ~$1
- Secrets Manager: ~$2
- **Total**: ~$14-30/mês

### PROD (estimativa para 10k mensagens/dia)
- Lambda: ~$50-100
- DynamoDB: ~$50-100
- SQS: ~$5-10
- EventBridge: ~$5
- Secrets Manager: ~$2
- **Total**: ~$112-217/mês

---

## 🔧 Como Aplicar Estas Configurações

### 1. Criar arquivo de variáveis

```hcl
# terraform/envs/dev/terraform.tfvars
environment = "dev"

# Rate Limiting
rate_limit_whatsapp_hourly = 100
rate_limit_email_hourly = 500
rate_limit_sms_hourly = 50

# Timeouts
lambda_timeout_api = 30
lambda_timeout_send = 180
lambda_timeout_schedule = 300

# Resources
lambda_memory_api = 512
lambda_memory_send = 1024
lambda_memory_schedule = 512

# Business Hours
business_hours_start = 8
business_hours_end = 18
business_hours_timezone = "America/Sao_Paulo"
```

### 2. Aplicar com Terraform

```powershell
cd terraform/envs/dev
terraform init
terraform plan -var-file="terraform.tfvars"
terraform apply -var-file="terraform.tfvars"
```

---

## 📝 Notas Finais

1. **Ajuste Gradual**: Comece com configurações conservadoras e ajuste conforme necessário
2. **Monitoramento**: Acompanhe métricas do CloudWatch para otimizar
3. **Custos**: Revise custos mensalmente e ajuste recursos
4. **Segurança**: Mantenha secrets atualizados e rotacionados
5. **Backup**: Habilite Point-in-Time Recovery no DynamoDB

---

**Última Atualização**: 24/11/2024  
**Versão**: 1.0
