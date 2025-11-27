# Guia de Migração: CDK → Terraform

## 📋 Situação Atual

O repositório `alquimistaai-aws-architecture` atualmente usa **AWS CDK** para infraestrutura, mas o código Lambda está pronto para funcionar com **Terraform**.

### ✅ O que JÁ está implementado (código Lambda):

1. **Fibonacci - Receptor de Webhooks**
   - `lambda/fibonacci/handle-nigredo-event.ts`
   - Recebe eventos do Nigredo via `POST /public/nigredo-event`
   - Valida payload, armazena lead, publica no EventBridge

2. **Nigredo - Emissor de Webhooks**
   - `lambda/nigredo/shared/webhook-sender.ts`
   - Envia webhooks para Fibonacci com retry logic
   - `lambda/nigredo/create-lead.ts` já integra o envio

3. **Integração Completa**
   - Nigredo cria lead → envia webhook → Fibonacci recebe → processa

---

## 🎯 O que você precisa fazer: Criar Infraestrutura Terraform

### Estrutura de Diretórios Terraform

```
terraform/
├── backend.tf                    # S3 + DynamoDB state backend
├── modules/
│   ├── app_fibonacci_api/       # Módulo Fibonacci API
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── iam.tf
│   ├── app_nigredo_api/         # Módulo Nigredo API
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── iam.tf
│   └── app_nigredo_frontend/    # Módulo Nigredo Frontend
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
└── envs/
    ├── dev/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── terraform.tfvars
    └── prod/
        ├── main.tf
        ├── variables.tf
        └── terraform.tfvars
```

---

## 📦 Módulo Terraform: `app_fibonacci_api`

### Recursos necessários:

1. **Lambda Function** - `handle-nigredo-event`
   - Runtime: Node.js 20
   - Handler: `lambda/fibonacci/handle-nigredo-event.handler`
   - Timeout: 30s
   - Memory: 512MB
   - Environment Variables:
     - `EVENT_BUS_NAME`: Nome do EventBridge
     - `NIGREDO_WEBHOOK_SECRET`: Secret do Secrets Manager
     - `DB_SECRET_ARN`: ARN do secret do Aurora
   - VPC: Sim (para acessar Aurora)
   - Security Groups: Permitir saída para Aurora

2. **API Gateway HTTP API**
   - Rota: `POST /public/nigredo-event`
   - Integração: Lambda `handle-nigredo-event`
   - Autorização: Nenhuma (rota pública)
   - CORS: Configurado

3. **IAM Role**
   - Permissões:
     - `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents`
     - `ec2:CreateNetworkInterface`, `ec2:DescribeNetworkInterfaces`, `ec2:DeleteNetworkInterface` (VPC)
     - `secretsmanager:GetSecretValue` (para DB_SECRET_ARN e NIGREDO_WEBHOOK_SECRET)
     - `events:PutEvents` (para EventBridge)
     - `xray:PutTraceSegments`, `xray:PutTelemetryRecords` (X-Ray)

4. **Secrets Manager**
   - Secret: `/repo/aws/fibonacci/nigredo-webhook-secret`
   - Valor: Token HMAC para validar webhooks

### Exemplo `terraform/modules/app_fibonacci_api/main.tf`:

```hcl
# Lambda Function
resource "aws_lambda_function" "handle_nigredo_event" {
  function_name = "${var.env}-fibonacci-handle-nigredo-event"
  runtime       = "nodejs20.x"
  handler       = "lambda/fibonacci/handle-nigredo-event.handler"
  role          = aws_iam_role.fibonacci_lambda.arn
  timeout       = 30
  memory_size   = 512

  filename         = var.lambda_zip_path
  source_code_hash = filebase64sha256(var.lambda_zip_path)

  environment {
    variables = {
      EVENT_BUS_NAME          = var.event_bus_name
      NIGREDO_WEBHOOK_SECRET  = data.aws_secretsmanager_secret_version.nigredo_webhook_secret.secret_string
      DB_SECRET_ARN           = var.db_secret_arn
      NODE_ENV                = var.env
      LOG_LEVEL               = var.log_level
    }
  }

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [aws_security_group.fibonacci_lambda.id]
  }

  tracing_config {
    mode = "Active"
  }

  tags = {
    Environment = var.env
    Service     = "fibonacci"
    Component   = "nigredo-webhook"
  }
}

# API Gateway HTTP API
resource "aws_apigatewayv2_api" "fibonacci" {
  name          = "${var.env}-fibonacci-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["POST", "GET", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization"]
  }

  tags = {
    Environment = var.env
    Service     = "fibonacci"
  }
}

# API Gateway Route
resource "aws_apigatewayv2_route" "nigredo_event" {
  api_id    = aws_apigatewayv2_api.fibonacci.id
  route_key = "POST /public/nigredo-event"
  target    = "integrations/${aws_apigatewayv2_integration.nigredo_event.id}"
}

# API Gateway Integration
resource "aws_apigatewayv2_integration" "nigredo_event" {
  api_id           = aws_apigatewayv2_api.fibonacci.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.handle_nigredo_event.invoke_arn
}

# Lambda Permission for API Gateway
resource "aws_lambda_permission" "api_gateway_nigredo" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.handle_nigredo_event.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.fibonacci.execution_arn}/*/*"
}

# Secrets Manager Data Source
data "aws_secretsmanager_secret" "nigredo_webhook_secret" {
  name = "/repo/aws/fibonacci/nigredo-webhook-secret"
}

data "aws_secretsmanager_secret_version" "nigredo_webhook_secret" {
  secret_id = data.aws_secretsmanager_secret.nigredo_webhook_secret.id
}
```

---

## 📦 Módulo Terraform: `app_nigredo_api`

### Recursos necessários:

1. **Lambda Functions**
   - `create-lead` (já implementado)
   - `list-leads` (já implementado)
   - `get-lead` (já implementado)

2. **Environment Variables** (para todas as Lambdas):
   - `FIBONACCI_WEBHOOK_URL`: URL do API Gateway do Fibonacci
   - `FIBONACCI_NIGREDO_TOKEN`: Token de autenticação (do Secrets Manager)
   - `DB_SECRET_ARN`: ARN do secret do Aurora
   - `DEFAULT_TENANT_ID`: UUID do tenant padrão

3. **Secrets Manager**
   - Secret: `/repo/aws/nigredo/fibonacci-integration`
   - Conteúdo JSON:
     ```json
     {
       "FIBONACCI_API_BASE_URL": "https://api.fibonacci.com",
       "FIBONACCI_NIGREDO_TOKEN": "seu-token-aqui"
     }
     ```

### Exemplo `terraform/modules/app_nigredo_api/main.tf`:

```hcl
# Data Source: Secrets Manager
data "aws_secretsmanager_secret" "fibonacci_integration" {
  name = "/repo/aws/nigredo/fibonacci-integration"
}

data "aws_secretsmanager_secret_version" "fibonacci_integration" {
  secret_id = data.aws_secretsmanager_secret.fibonacci_integration.id
}

locals {
  fibonacci_config = jsondecode(data.aws_secretsmanager_secret_version.fibonacci_integration.secret_string)
}

# Lambda Function: Create Lead
resource "aws_lambda_function" "create_lead" {
  function_name = "${var.env}-nigredo-create-lead"
  runtime       = "nodejs20.x"
  handler       = "lambda/nigredo/create-lead.handler"
  role          = aws_iam_role.nigredo_lambda.arn
  timeout       = 30
  memory_size   = 512

  filename         = var.lambda_zip_path
  source_code_hash = filebase64sha256(var.lambda_zip_path)

  environment {
    variables = {
      FIBONACCI_WEBHOOK_URL = "${local.fibonacci_config.FIBONACCI_API_BASE_URL}/public/nigredo-event"
      FIBONACCI_NIGREDO_TOKEN = local.fibonacci_config.FIBONACCI_NIGREDO_TOKEN
      DB_SECRET_ARN         = var.db_secret_arn
      DEFAULT_TENANT_ID     = var.default_tenant_id
      NODE_ENV              = var.env
      LOG_LEVEL             = var.log_level
    }
  }

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [aws_security_group.nigredo_lambda.id]
  }

  tracing_config {
    mode = "Active"
  }

  tags = {
    Environment = var.env
    Service     = "nigredo"
    Component   = "api"
  }
}

# API Gateway HTTP API
resource "aws_apigatewayv2_api" "nigredo" {
  name          = "${var.env}-nigredo-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["POST", "GET", "OPTIONS"]
    allow_headers = ["Content-Type"]
  }

  tags = {
    Environment = var.env
    Service     = "nigredo"
  }
}

# API Gateway Route: Create Lead
resource "aws_apigatewayv2_route" "create_lead" {
  api_id    = aws_apigatewayv2_api.nigredo.id
  route_key = "POST /api/leads"
  target    = "integrations/${aws_apigatewayv2_integration.create_lead.id}"
}

# API Gateway Integration: Create Lead
resource "aws_apigatewayv2_integration" "create_lead" {
  api_id           = aws_apigatewayv2_api.nigredo.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.create_lead.invoke_arn
}

# Lambda Permission for API Gateway
resource "aws_lambda_permission" "api_gateway_create_lead" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.create_lead.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.nigredo.execution_arn}/*/*"
}
```

---

## 🔐 Secrets Manager - Configuração

### 1. Criar secret para Fibonacci

```bash
aws secretsmanager create-secret \
  --name /repo/aws/fibonacci/nigredo-webhook-secret \
  --description "HMAC secret for validating Nigredo webhooks" \
  --secret-string "$(openssl rand -hex 32)" \
  --region us-east-1
```

### 2. Criar secret para Nigredo

```bash
aws secretsmanager create-secret \
  --name /repo/aws/nigredo/fibonacci-integration \
  --description "Fibonacci integration configuration for Nigredo" \
  --secret-string '{
    "FIBONACCI_API_BASE_URL": "https://api-prod.fibonacci.alquimista.ai",
    "FIBONACCI_NIGREDO_TOKEN": "seu-token-seguro-aqui"
  }' \
  --region us-east-1
```

---

## 🚀 Deploy com Terraform

### 1. Inicializar Terraform

```bash
cd terraform/envs/dev
terraform init
```

### 2. Planejar deployment

```bash
terraform plan -out=tfplan
```

### 3. Aplicar mudanças

```bash
terraform apply tfplan
```

### 4. Verificar outputs

```bash
terraform output
```

Outputs esperados:
- `fibonacci_api_url`: URL do API Gateway do Fibonacci
- `nigredo_api_url`: URL do API Gateway do Nigredo
- `nigredo_frontend_url`: URL do CloudFront do Nigredo

---

## 🧪 Testar Integração

### 1. Criar lead no Nigredo

```bash
curl -X POST https://api-nigredo-dev.alquimista.ai/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "+5511999999999",
    "company": "Acme Corp",
    "message": "Gostaria de saber mais sobre os serviços"
  }'
```

### 2. Verificar webhook no Fibonacci

```bash
# Verificar logs do Lambda
aws logs tail /aws/lambda/dev-fibonacci-handle-nigredo-event --follow

# Verificar lead no banco
psql -h <aurora-endpoint> -U <user> -d fibonacci -c \
  "SELECT * FROM nigredo_leads.leads ORDER BY created_at DESC LIMIT 1;"
```

---

## 📊 Monitoramento

### CloudWatch Dashboards

Criar dashboards para monitorar:
- Taxa de sucesso de webhooks
- Latência de API
- Erros de integração

### CloudWatch Alarms

Configurar alarmes para:
- Taxa de erro > 5%
- Latência > 1000ms (p99)
- Falhas de webhook > 10%

---

## 🔄 Próximos Passos

1. **Criar estrutura Terraform** conforme exemplos acima
2. **Migrar recursos CDK** para Terraform gradualmente
3. **Testar em ambiente dev** antes de prod
4. **Documentar processo** de deploy
5. **Configurar CI/CD** com GitHub Actions

---

## 📚 Referências

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Lambda com Terraform](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lambda_function)
- [API Gateway HTTP API com Terraform](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/apigatewayv2_api)
- [Secrets Manager com Terraform](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/secretsmanager_secret)

---

**Última atualização:** 2024-01-15  
**Versão:** 1.0  
**Status:** Pronto para implementação
