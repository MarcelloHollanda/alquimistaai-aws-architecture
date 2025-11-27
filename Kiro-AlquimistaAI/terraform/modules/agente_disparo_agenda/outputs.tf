# Outputs do módulo agente_disparo_agenda
# Expõe informações importantes dos recursos criados

# ============================================
# Lambdas
# ============================================

output "lambda_arns" {
  description = "ARNs de todas as Lambdas criadas"
  value = {
    api_handler      = aws_lambda_function.api_handler.arn
    ingest_contacts  = aws_lambda_function.ingest_contacts.arn
    send_messages    = aws_lambda_function.send_messages.arn
    handle_replies   = aws_lambda_function.handle_replies.arn
    schedule_meeting = aws_lambda_function.schedule_meeting.arn
    confirm_meeting  = aws_lambda_function.confirm_meeting.arn
    send_reminders   = aws_lambda_function.send_reminders.arn
    generate_briefing = aws_lambda_function.generate_briefing.arn
  }
}

output "lambda_function_names" {
  description = "Nomes das funções Lambda"
  value = {
    api_handler      = aws_lambda_function.api_handler.function_name
    ingest_contacts  = aws_lambda_function.ingest_contacts.function_name
    send_messages    = aws_lambda_function.send_messages.function_name
    handle_replies   = aws_lambda_function.handle_replies.function_name
    schedule_meeting = aws_lambda_function.schedule_meeting.function_name
    confirm_meeting  = aws_lambda_function.confirm_meeting.function_name
    send_reminders   = aws_lambda_function.send_reminders.function_name
    generate_briefing = aws_lambda_function.generate_briefing.function_name
  }
}

# ============================================
# API Gateway
# ============================================

output "api_gateway_id" {
  description = "ID da API Gateway HTTP"
  value       = aws_apigatewayv2_api.disparo_agenda_api.id
}

output "api_gateway_invoke_url" {
  description = "URL base para invocar a API"
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "api_gateway_routes" {
  description = "Rotas disponíveis na API"
  value = {
    get_overview          = "GET /disparo/overview"
    get_campaigns         = "GET /disparo/campaigns"
    post_contacts_ingest  = "POST /disparo/contacts/ingest"
    get_meetings          = "GET /agendamento/meetings"
  }
}

# ============================================
# DynamoDB
# ============================================

output "dynamodb_table_names" {
  description = "Nomes das tabelas DynamoDB"
  value = {
    config      = aws_dynamodb_table.config.name
    rate_limit  = aws_dynamodb_table.rate_limit.name
    idempotency = aws_dynamodb_table.idempotency.name
    stats       = aws_dynamodb_table.stats.name
    meetings    = aws_dynamodb_table.meetings.name
  }
}

output "dynamodb_table_arns" {
  description = "ARNs das tabelas DynamoDB"
  value = {
    config      = aws_dynamodb_table.config.arn
    rate_limit  = aws_dynamodb_table.rate_limit.arn
    idempotency = aws_dynamodb_table.idempotency.arn
    stats       = aws_dynamodb_table.stats.arn
    meetings    = aws_dynamodb_table.meetings.arn
  }
}

# ============================================
# SQS
# ============================================

output "sqs_urls" {
  description = "URLs das filas SQS"
  value = {
    send_queue     = aws_sqs_queue.send_queue.url
    send_queue_dlq = aws_sqs_queue.send_queue_dlq.url
  }
}

output "sqs_arns" {
  description = "ARNs das filas SQS"
  value = {
    send_queue     = aws_sqs_queue.send_queue.arn
    send_queue_dlq = aws_sqs_queue.send_queue_dlq.arn
  }
}

# ============================================
# Secrets Manager (Data Sources)
# ============================================

output "secrets_names" {
  description = "Nomes dos secrets no Secrets Manager"
  value = {
    whatsapp = data.aws_secretsmanager_secret.whatsapp.name
    email    = data.aws_secretsmanager_secret.email.name
    calendar = data.aws_secretsmanager_secret.calendar.name
  }
}

output "secrets_arns" {
  description = "ARNs dos secrets no Secrets Manager"
  value = {
    whatsapp = data.aws_secretsmanager_secret.whatsapp.arn
    email    = data.aws_secretsmanager_secret.email.arn
    calendar = data.aws_secretsmanager_secret.calendar.arn
  }
}

# ============================================
# EventBridge
# ============================================

output "eventbridge_scheduler_arn" {
  description = "ARN do EventBridge Scheduler"
  value       = aws_scheduler_schedule.send_reminders.arn
}

output "eventbridge_rules" {
  description = "ARNs das regras do EventBridge"
  value = {
    schedule_requested = aws_cloudwatch_event_rule.schedule_requested.arn
    meeting_proposed   = aws_cloudwatch_event_rule.meeting_proposed.arn
    meeting_confirmed  = aws_cloudwatch_event_rule.meeting_confirmed.arn
  }
}

# ============================================
# IAM
# ============================================

output "lambda_role_arn" {
  description = "ARN da role IAM das Lambdas"
  value       = aws_iam_role.lambda_role.arn
}

# ============================================
# CloudWatch
# ============================================

output "cloudwatch_log_groups" {
  description = "Nomes dos grupos de log no CloudWatch"
  value = {
    api_handler       = aws_cloudwatch_log_group.api_handler_logs.name
    ingest_contacts   = aws_cloudwatch_log_group.ingest_contacts_logs.name
    send_messages     = aws_cloudwatch_log_group.send_messages_logs.name
    handle_replies    = aws_cloudwatch_log_group.handle_replies_logs.name
    schedule_meeting  = aws_cloudwatch_log_group.schedule_meeting_logs.name
    confirm_meeting   = aws_cloudwatch_log_group.confirm_meeting_logs.name
    send_reminders    = aws_cloudwatch_log_group.send_reminders_logs.name
    generate_briefing = aws_cloudwatch_log_group.generate_briefing_logs.name
  }
}

output "cloudwatch_alarms" {
  description = "ARNs dos alarmes do CloudWatch"
  value = {
    send_messages_errors     = aws_cloudwatch_metric_alarm.send_messages_errors.arn
    send_messages_duration   = aws_cloudwatch_metric_alarm.send_messages_duration.arn
    send_queue_messages      = aws_cloudwatch_metric_alarm.send_queue_messages_visible.arn
    send_queue_dlq           = aws_cloudwatch_metric_alarm.send_queue_dlq_messages.arn
    ingest_contacts_errors   = aws_cloudwatch_metric_alarm.ingest_contacts_errors.arn
    handle_replies_errors    = aws_cloudwatch_metric_alarm.handle_replies_errors.arn
    schedule_meeting_errors  = aws_cloudwatch_metric_alarm.schedule_meeting_errors.arn
    lambda_throttles         = aws_cloudwatch_metric_alarm.lambda_throttles.arn
    dynamodb_throttles       = aws_cloudwatch_metric_alarm.dynamodb_throttles.arn
  }
}
