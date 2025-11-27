# EventBridge Scheduler para reminders e tarefas recorrentes

# Schedule para envio de reminders (executa a cada hora durante horário comercial)
resource "aws_scheduler_schedule" "send_reminders" {
  name       = "${local.name_prefix}-send-reminders"
  group_name = "default"
  
  # Executa de segunda a sexta, das 8h às 18h, a cada hora
  schedule_expression          = "cron(0 8-18 ? * MON-FRI *)"
  schedule_expression_timezone = "America/Sao_Paulo"
  
  description = "Agenda envio de reminders para reuniões próximas"
  
  flexible_time_window {
    mode = "OFF"
  }
  
  target {
    arn      = aws_lambda_function.send_reminders.arn
    role_arn = aws_iam_role.scheduler_role.arn
    
    input = jsonencode({
      source      = "scheduler"
      detail-type = "Scheduled Reminder Check"
      detail = {
        type        = "reminder_check"
        environment = var.environment
      }
    })
  }
}

# IAM Role para EventBridge Scheduler
resource "aws_iam_role" "scheduler_role" {
  name = "${local.name_prefix}-scheduler-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "scheduler.amazonaws.com"
        }
      }
    ]
  })
  
  tags = local.common_tags
}

# Policy para permitir que o Scheduler invoque as Lambdas
resource "aws_iam_role_policy" "scheduler_lambda_policy" {
  name = "${local.name_prefix}-scheduler-lambda"
  role = aws_iam_role.scheduler_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = [
          aws_lambda_function.send_reminders.arn,
          aws_lambda_function.generate_briefing.arn
        ]
      }
    ]
  })
}

# Permissão para o Scheduler invocar a Lambda send_reminders
resource "aws_lambda_permission" "allow_scheduler_send_reminders" {
  statement_id  = "AllowExecutionFromScheduler"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.send_reminders.function_name
  principal     = "scheduler.amazonaws.com"
  source_arn    = aws_scheduler_schedule.send_reminders.arn
}

# Output dos schedules
output "scheduler_arns" {
  description = "ARNs dos schedules do EventBridge"
  value = {
    send_reminders = aws_scheduler_schedule.send_reminders.arn
  }
}
