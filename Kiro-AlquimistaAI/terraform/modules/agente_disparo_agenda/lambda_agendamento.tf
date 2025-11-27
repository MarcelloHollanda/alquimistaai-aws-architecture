# Lambda Functions: Core do sistema de agendamento

# Lambda: ingest-contacts
resource "aws_lambda_function" "ingest_contacts" {
  function_name = "${local.name_prefix}-ingest-contacts"
  role          = aws_iam_role.lambda_role.arn
  
  s3_bucket = var.lambda_artifact_bucket
  s3_key    = "${var.lambda_artifact_key_prefix}ingest-contacts.zip"
  
  handler = "dist/handlers/ingest-contacts.handler"
  runtime = "nodejs20.x"
  
  memory_size = 512
  timeout     = 60 # 1 minuto
  
  environment {
    variables = {
      SEND_QUEUE_URL    = aws_sqs_queue.send_queue.url
      CONFIG_TABLE      = aws_dynamodb_table.config.name
      STATS_TABLE       = aws_dynamodb_table.stats.name
      IDEMPOTENCY_TABLE = aws_dynamodb_table.idempotency.name
      CUSTOM_AWS_REGION = var.aws_region
      ENVIRONMENT       = var.environment
      EVENT_BUS_NAME    = "default"
    }
  }
  
  tracing_config {
    mode = "Active"
  }
  
  tags = local.common_tags
  
  depends_on = [aws_iam_role_policy.lambda_logs_policy]
}

# Lambda: handle-replies
resource "aws_lambda_function" "handle_replies" {
  function_name = "${local.name_prefix}-handle-replies"
  role          = aws_iam_role.lambda_role.arn
  
  s3_bucket = var.lambda_artifact_bucket
  s3_key    = "${var.lambda_artifact_key_prefix}handle-replies.zip"
  
  handler = "dist/handlers/handle-replies.handler"
  runtime = "nodejs20.x"
  
  memory_size = 256
  timeout     = 30
  
  environment {
    variables = {
      CONFIG_TABLE   = aws_dynamodb_table.config.name
      STATS_TABLE    = aws_dynamodb_table.stats.name
      MEETINGS_TABLE = aws_dynamodb_table.meetings.name
      CUSTOM_AWS_REGION = var.aws_region
      ENVIRONMENT    = var.environment
      EVENT_BUS_NAME = "default"
    }
  }
  
  tracing_config {
    mode = "Active"
  }
  
  tags = local.common_tags
  
  depends_on = [aws_iam_role_policy.lambda_logs_policy]
}

# Lambda: schedule-meeting
resource "aws_lambda_function" "schedule_meeting" {
  function_name = "${local.name_prefix}-schedule-meeting"
  role          = aws_iam_role.lambda_role.arn
  
  s3_bucket = var.lambda_artifact_bucket
  s3_key    = "${var.lambda_artifact_key_prefix}schedule-meeting.zip"
  
  handler = "dist/handlers/schedule-meeting.handler"
  runtime = "nodejs20.x"
  
  memory_size = 512
  timeout     = 180 # 3 minutos
  
  environment {
    variables = {
      CONFIG_TABLE         = aws_dynamodb_table.config.name
      MEETINGS_TABLE       = aws_dynamodb_table.meetings.name
      STATS_TABLE          = aws_dynamodb_table.stats.name
      CALENDAR_SECRET_NAME = data.aws_secretsmanager_secret.calendar.name
      CUSTOM_AWS_REGION = var.aws_region
      ENVIRONMENT          = var.environment
      EVENT_BUS_NAME       = "default"
      DEFAULT_TIMEZONE     = "America/Sao_Paulo"
    }
  }
  
  tracing_config {
    mode = "Active"
  }
  
  tags = local.common_tags
  
  depends_on = [aws_iam_role_policy.lambda_logs_policy]
}

# Lambda: confirm-meeting (skeleton)
resource "aws_lambda_function" "confirm_meeting" {
  function_name = "${local.name_prefix}-confirm-meeting"
  role          = aws_iam_role.lambda_role.arn
  
  s3_bucket = var.lambda_artifact_bucket
  s3_key    = "${var.lambda_artifact_key_prefix}confirm-meeting.zip"
  
  handler = "dist/handlers/confirm-meeting.handler"
  runtime = "nodejs20.x"
  
  memory_size = 256
  timeout     = 30
  
  environment {
    variables = {
      MEETINGS_TABLE       = aws_dynamodb_table.meetings.name
      STATS_TABLE          = aws_dynamodb_table.stats.name
      CALENDAR_SECRET_NAME = data.aws_secretsmanager_secret.calendar.name
      CUSTOM_AWS_REGION = var.aws_region
      ENVIRONMENT          = var.environment
      EVENT_BUS_NAME       = "default"
    }
  }
  
  tracing_config {
    mode = "Active"
  }
  
  tags = local.common_tags
  
  depends_on = [aws_iam_role_policy.lambda_logs_policy]
}

# Lambda: send-reminders (skeleton)
resource "aws_lambda_function" "send_reminders" {
  function_name = "${local.name_prefix}-send-reminders"
  role          = aws_iam_role.lambda_role.arn
  
  s3_bucket = var.lambda_artifact_bucket
  s3_key    = "${var.lambda_artifact_key_prefix}send-reminders.zip"
  
  handler = "dist/handlers/send-reminders.handler"
  runtime = "nodejs20.x"
  
  memory_size = 256
  timeout     = 60
  
  environment {
    variables = {
      MEETINGS_TABLE       = aws_dynamodb_table.meetings.name
      WHATSAPP_SECRET_NAME = data.aws_secretsmanager_secret.whatsapp.name
      EMAIL_SECRET_NAME    = data.aws_secretsmanager_secret.email.name
      CUSTOM_AWS_REGION = var.aws_region
      ENVIRONMENT          = var.environment
    }
  }
  
  tracing_config {
    mode = "Active"
  }
  
  tags = local.common_tags
  
  depends_on = [aws_iam_role_policy.lambda_logs_policy]
}

# Lambda: generate-briefing (skeleton)
resource "aws_lambda_function" "generate_briefing" {
  function_name = "${local.name_prefix}-generate-briefing"
  role          = aws_iam_role.lambda_role.arn
  
  s3_bucket = var.lambda_artifact_bucket
  s3_key    = "${var.lambda_artifact_key_prefix}generate-briefing.zip"
  
  handler = "dist/handlers/generate-briefing.handler"
  runtime = "nodejs20.x"
  
  memory_size = 512
  timeout     = 120 # 2 minutos
  
  environment {
    variables = {
      CONFIG_TABLE      = aws_dynamodb_table.config.name
      MEETINGS_TABLE    = aws_dynamodb_table.meetings.name
      EMAIL_SECRET_NAME = data.aws_secretsmanager_secret.email.name
      CUSTOM_AWS_REGION = var.aws_region
      ENVIRONMENT       = var.environment
      EVENT_BUS_NAME    = "default"
    }
  }
  
  tracing_config {
    mode = "Active"
  }
  
  tags = local.common_tags
  
  depends_on = [aws_iam_role_policy.lambda_logs_policy]
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "ingest_contacts_logs" {
  name              = "/aws/lambda/${aws_lambda_function.ingest_contacts.function_name}"
  retention_in_days = var.environment == "prod" ? 30 : 7
  tags              = local.common_tags
}

resource "aws_cloudwatch_log_group" "handle_replies_logs" {
  name              = "/aws/lambda/${aws_lambda_function.handle_replies.function_name}"
  retention_in_days = var.environment == "prod" ? 30 : 7
  tags              = local.common_tags
}

resource "aws_cloudwatch_log_group" "schedule_meeting_logs" {
  name              = "/aws/lambda/${aws_lambda_function.schedule_meeting.function_name}"
  retention_in_days = var.environment == "prod" ? 30 : 7
  tags              = local.common_tags
}

resource "aws_cloudwatch_log_group" "confirm_meeting_logs" {
  name              = "/aws/lambda/${aws_lambda_function.confirm_meeting.function_name}"
  retention_in_days = var.environment == "prod" ? 30 : 7
  tags              = local.common_tags
}

resource "aws_cloudwatch_log_group" "send_reminders_logs" {
  name              = "/aws/lambda/${aws_lambda_function.send_reminders.function_name}"
  retention_in_days = var.environment == "prod" ? 30 : 7
  tags              = local.common_tags
}

resource "aws_cloudwatch_log_group" "generate_briefing_logs" {
  name              = "/aws/lambda/${aws_lambda_function.generate_briefing.function_name}"
  retention_in_days = var.environment == "prod" ? 30 : 7
  tags              = local.common_tags
}
