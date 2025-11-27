# Lambda Function: dry-run (Fluxo mínimo de teste sem disparos reais)

resource "aws_lambda_function" "dry_run" {
  function_name = "${local.name_prefix}-dry-run"
  role          = aws_iam_role.lambda_role.arn
  
  # Código da Lambda (será fornecido pelo CI/CD)
  s3_bucket = var.lambda_artifact_bucket
  s3_key    = "${var.lambda_artifact_key_prefix}dry-run.zip"
  
  handler = "dist/handlers/dry-run.handler"
  runtime = "nodejs20.x"
  
  # Configurações de performance
  memory_size = 512
  timeout     = 30 # 30 segundos
  
  # Variáveis de ambiente
  environment {
    variables = {
      # Feature flag para controlar disparos reais
      MICRO_AGENT_DISPARO_ENABLED = "false" # Default: dry-run mode
      
      # Nomes das tabelas DynamoDB
      CONFIG_TABLE      = aws_dynamodb_table.config.name
      RATE_LIMIT_TABLE  = aws_dynamodb_table.rate_limit.name
      IDEMPOTENCY_TABLE = aws_dynamodb_table.idempotency.name
      STATS_TABLE       = aws_dynamodb_table.stats.name
      MEETINGS_TABLE    = aws_dynamodb_table.meetings.name
      
      # Paths dos segredos no Secrets Manager
      WHATSAPP_SECRET_NAME = data.aws_secretsmanager_secret.whatsapp.name
      EMAIL_SECRET_NAME    = data.aws_secretsmanager_secret.email.name
      CALENDAR_SECRET_NAME = data.aws_secretsmanager_secret.calendar.name
      
      # Configurações adicionais
      CUSTOM_AWS_REGION = var.aws_region
      ENVIRONMENT       = var.environment
      DEFAULT_TIMEZONE  = "America/Sao_Paulo"
      
      # EventBridge
      EVENT_BUS_NAME = "default"
      
      # Database (para persistir logs dry-run)
      # Nota: DB_SECRET_ARN será adicionado quando Aurora estiver configurado
      # DB_SECRET_ARN = data.aws_secretsmanager_secret.db_credentials.arn
    }
  }
  
  # X-Ray tracing
  tracing_config {
    mode = "Active"
  }
  
  tags = merge(
    local.common_tags,
    {
      Purpose = "dry-run-testing"
    }
  )
  
  depends_on = [
    aws_iam_role_policy.lambda_logs_policy,
    aws_iam_role_policy.lambda_dynamodb_policy,
    aws_iam_role_policy.lambda_secrets_policy,
    aws_iam_role_policy.lambda_eventbridge_policy,
    aws_iam_role_policy.lambda_xray_policy
  ]
}

# CloudWatch Log Group para dry-run
resource "aws_cloudwatch_log_group" "dry_run_logs" {
  name              = "/aws/lambda/${aws_lambda_function.dry_run.function_name}"
  retention_in_days = var.environment == "prod" ? 30 : 7
  
  tags = local.common_tags
}

# Permissão para invocar a Lambda dry-run via API Gateway (se necessário)
resource "aws_lambda_permission" "dry_run_api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.dry_run.function_name
  principal     = "apigateway.amazonaws.com"
  
  # Permitir invocação de qualquer rota do API Gateway
  source_arn = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# Permissão para invocar a Lambda dry-run via EventBridge (se necessário)
resource "aws_lambda_permission" "dry_run_eventbridge" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.dry_run.function_name
  principal     = "events.amazonaws.com"
  
  # Permitir invocação do EventBridge default bus
  source_arn = "arn:aws:events:${var.aws_region}:${data.aws_caller_identity.current.account_id}:rule/*"
}

# Data source para obter account ID
data "aws_caller_identity" "current" {}
