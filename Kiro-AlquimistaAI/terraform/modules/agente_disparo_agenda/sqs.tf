# SQS Queues para Micro Agente de Disparo & Agendamento

# Dead Letter Queue para fila principal
resource "aws_sqs_queue" "send_queue_dlq" {
  name                      = "${local.name_prefix}-send-dlq"
  message_retention_seconds = 1209600 # 14 dias
  
  tags = local.common_tags
}

# Fila principal de disparo (jobs de envio)
resource "aws_sqs_queue" "send_queue" {
  name = "${local.name_prefix}-send-queue"
  
  # Configurações de timeout e retry
  visibility_timeout_seconds = 300      # 5 minutos (timeout da Lambda + buffer)
  message_retention_seconds  = 1209600  # 14 dias
  
  # Dead Letter Queue configuration
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.send_queue_dlq.arn
    maxReceiveCount     = 3
  })
  
  tags = local.common_tags
}

# Policy para permitir que as Lambdas acessem a fila principal
resource "aws_sqs_queue_policy" "send_queue_policy" {
  queue_url = aws_sqs_queue.send_queue.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowLambdaAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.lambda_role.arn
        }
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:SendMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.send_queue.arn
      }
    ]
  })
}

# Policy para permitir que as Lambdas acessem a DLQ
resource "aws_sqs_queue_policy" "send_queue_dlq_policy" {
  queue_url = aws_sqs_queue.send_queue_dlq.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowLambdaAccessDLQ"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.lambda_role.arn
        }
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:SendMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.send_queue_dlq.arn
      }
    ]
  })
}

# Outputs das filas
output "send_queue_arn" {
  description = "ARN da fila principal de envio"
  value       = aws_sqs_queue.send_queue.arn
}

output "send_queue_dlq_arn" {
  description = "ARN da DLQ da fila de envio"
  value       = aws_sqs_queue.send_queue_dlq.arn
}
