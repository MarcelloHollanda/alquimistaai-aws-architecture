# CloudWatch Alarms para monitoramento do Micro Agente

# Alarm para erros na Lambda send-messages
resource "aws_cloudwatch_metric_alarm" "send_messages_errors" {
  alarm_name          = "${local.name_prefix}-send-messages-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Erros na Lambda send-messages"
  alarm_actions       = [var.alerts_sns_topic_arn]
  ok_actions          = [var.alerts_sns_topic_arn]
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    FunctionName = aws_lambda_function.send_messages.function_name
  }
  
  tags = local.common_tags
}

# Alarm para duração alta na Lambda send-messages
resource "aws_cloudwatch_metric_alarm" "send_messages_duration" {
  alarm_name          = "${local.name_prefix}-send-messages-duration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Average"
  threshold           = 240000 # 4 minutos (80% do timeout)
  alarm_description   = "Duração alta na Lambda send-messages"
  alarm_actions       = [var.alerts_sns_topic_arn]
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    FunctionName = aws_lambda_function.send_messages.function_name
  }
  
  tags = local.common_tags
}

# Alarm para fila SQS congestionada
resource "aws_cloudwatch_metric_alarm" "send_queue_messages_visible" {
  alarm_name          = "${local.name_prefix}-send-queue-congested"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Average"
  threshold           = 100
  alarm_description   = "Fila de envio congestionada - muitas mensagens pendentes"
  alarm_actions       = [var.alerts_sns_topic_arn]
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    QueueName = aws_sqs_queue.send_queue.name
  }
  
  tags = local.common_tags
}

# Alarm para mensagens na DLQ
resource "aws_cloudwatch_metric_alarm" "send_queue_dlq_messages" {
  alarm_name          = "${local.name_prefix}-send-queue-dlq-messages"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Average"
  threshold           = 0
  alarm_description   = "Mensagens na DLQ da fila de envio - requer investigação"
  alarm_actions       = [var.alerts_sns_topic_arn]
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    QueueName = aws_sqs_queue.send_queue_dlq.name
  }
  
  tags = local.common_tags
}

# Alarm para erros na Lambda ingest-contacts
resource "aws_cloudwatch_metric_alarm" "ingest_contacts_errors" {
  alarm_name          = "${local.name_prefix}-ingest-contacts-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Erros na Lambda ingest-contacts"
  alarm_actions       = [var.alerts_sns_topic_arn]
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    FunctionName = aws_lambda_function.ingest_contacts.function_name
  }
  
  tags = local.common_tags
}

# Alarm para erros na Lambda handle-replies
resource "aws_cloudwatch_metric_alarm" "handle_replies_errors" {
  alarm_name          = "${local.name_prefix}-handle-replies-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Erros na Lambda handle-replies"
  alarm_actions       = [var.alerts_sns_topic_arn]
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    FunctionName = aws_lambda_function.handle_replies.function_name
  }
  
  tags = local.common_tags
}

# Alarm para erros na Lambda schedule-meeting
resource "aws_cloudwatch_metric_alarm" "schedule_meeting_errors" {
  alarm_name          = "${local.name_prefix}-schedule-meeting-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Erros na Lambda schedule-meeting"
  alarm_actions       = [var.alerts_sns_topic_arn]
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    FunctionName = aws_lambda_function.schedule_meeting.function_name
  }
  
  tags = local.common_tags
}

# Alarm para throttles nas Lambdas
resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  alarm_name          = "${local.name_prefix}-lambda-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Throttling detectado nas Lambdas - possível limite de concorrência"
  alarm_actions       = [var.alerts_sns_topic_arn]
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    FunctionName = aws_lambda_function.send_messages.function_name
  }
  
  tags = local.common_tags
}

# Alarm para erros de DynamoDB (throttling)
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles" {
  alarm_name          = "${local.name_prefix}-dynamodb-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ThrottledRequests"
  namespace           = "AWS/DynamoDB"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Throttling no DynamoDB - possível necessidade de ajuste de capacidade"
  alarm_actions       = [var.alerts_sns_topic_arn]
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    TableName = aws_dynamodb_table.config.name
  }
  
  tags = local.common_tags
}

# Outputs dos alarms
output "alarm_arns" {
  description = "ARNs dos CloudWatch Alarms"
  value = {
    send_messages_errors     = aws_cloudwatch_metric_alarm.send_messages_errors.arn
    send_messages_duration   = aws_cloudwatch_metric_alarm.send_messages_duration.arn
    send_queue_congested     = aws_cloudwatch_metric_alarm.send_queue_messages_visible.arn
    send_queue_dlq_messages  = aws_cloudwatch_metric_alarm.send_queue_dlq_messages.arn
    ingest_contacts_errors   = aws_cloudwatch_metric_alarm.ingest_contacts_errors.arn
    handle_replies_errors    = aws_cloudwatch_metric_alarm.handle_replies_errors.arn
    schedule_meeting_errors  = aws_cloudwatch_metric_alarm.schedule_meeting_errors.arn
    lambda_throttles         = aws_cloudwatch_metric_alarm.lambda_throttles.arn
    dynamodb_throttles       = aws_cloudwatch_metric_alarm.dynamodb_throttles.arn
  }
}
