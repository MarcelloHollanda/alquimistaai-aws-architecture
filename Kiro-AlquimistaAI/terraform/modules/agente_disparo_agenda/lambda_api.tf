# Lambda: API Handler
# Roteia requisições HTTP para as Lambdas core do micro agente

resource "aws_lambda_function" "api_handler" {
  function_name = "${local.name_prefix}-api-handler"
  role          = aws_iam_role.lambda_role.arn
  handler       = "api-handler.handler"
  runtime       = "nodejs20.x"
  timeout       = 30
  memory_size   = 512

  s3_bucket = var.lambda_artifact_bucket
  s3_key    = "${var.lambda_artifact_key_prefix}api-handler.zip"

  environment {
    variables = {
      ENVIRONMENT                = var.environment
      AWS_REGION_CUSTOM          = var.aws_region
      DYNAMODB_CONFIG_TABLE      = aws_dynamodb_table.config.name
      DYNAMODB_RATE_LIMIT_TABLE  = aws_dynamodb_table.rate_limit.name
      DYNAMODB_IDEMPOTENCY_TABLE = aws_dynamodb_table.idempotency.name
      DYNAMODB_STATS_TABLE       = aws_dynamodb_table.stats.name
      DYNAMODB_MEETINGS_TABLE    = aws_dynamodb_table.meetings.name
      SQS_SEND_QUEUE_URL         = aws_sqs_queue.send_queue.url
      EVENTBRIDGE_BUS_NAME       = "fibonacci-bus-${var.environment}"
      LOG_LEVEL                  = "INFO"
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-api-handler"
    }
  )
}

# CloudWatch Log Group para API Handler
resource "aws_cloudwatch_log_group" "api_handler_logs" {
  name              = "/aws/lambda/${aws_lambda_function.api_handler.function_name}"
  retention_in_days = 7

  tags = local.common_tags
}

# Output movido para outputs.tf

