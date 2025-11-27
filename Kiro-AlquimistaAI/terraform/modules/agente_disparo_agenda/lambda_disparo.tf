# Lambda Function: send-messages (Processamento da fila de disparo)

resource "aws_lambda_function" "send_messages" {
  function_name = "${local.name_prefix}-send-messages"
  role          = aws_iam_role.lambda_role.arn
  
  # Código da Lambda (será fornecido pelo CI/CD)
  s3_bucket = var.lambda_artifact_bucket
  s3_key    = "${var.lambda_artifact_key_prefix}send-messages.zip"
  
  handler = "dist/handlers/send-messages.handler"
  runtime = "nodejs20.x"
  
  # Configurações de performance
  memory_size = 512
  timeout     = 300 # 5 minutos
  
  # Variáveis de ambiente
  environment {
    variables = {
      # URLs das filas SQS
      SEND_QUEUE_URL = aws_sqs_queue.send_queue.url
      
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
      ENVIRONMENT      = var.environment
      DEFAULT_TIMEZONE = "America/Sao_Paulo"
      
      # EventBridge
      EVENT_BUS_NAME = "default"
    }
  }
  
  # Dead letter config
  dead_letter_config {
    target_arn = aws_sqs_queue.send_queue_dlq.arn
  }
  
  # X-Ray tracing
  tracing_config {
    mode = "Active"
  }
  
  tags = local.common_tags
  
  depends_on = [
    aws_iam_role_policy.lambda_logs_policy,
    aws_iam_role_policy.lambda_sqs_policy,
    aws_iam_role_policy.lambda_dynamodb_policy,
    aws_iam_role_policy.lambda_secrets_policy,
    aws_iam_role_policy.lambda_eventbridge_policy,
    aws_iam_role_policy.lambda_xray_policy
  ]
}

# Event Source Mapping: SQS -> Lambda send-messages
resource "aws_lambda_event_source_mapping" "send_messages_sqs" {
  event_source_arn = aws_sqs_queue.send_queue.arn
  function_name    = aws_lambda_function.send_messages.arn
  
  # Configurações de batch
  batch_size                         = 10
  maximum_batching_window_in_seconds = 5
  
  # Configurações de retry
  function_response_types = ["ReportBatchItemFailures"]
}

# CloudWatch Log Group para send-messages
resource "aws_cloudwatch_log_group" "send_messages_logs" {
  name              = "/aws/lambda/${aws_lambda_function.send_messages.function_name}"
  retention_in_days = var.environment == "prod" ? 30 : 7
  
  tags = local.common_tags
}
