# IAM Roles e Policies para Micro Agente de Disparo & Agendamento

# Role base para todas as Lambdas
resource "aws_iam_role" "lambda_role" {
  name = "${local.name_prefix}-lambda-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
  
  tags = local.common_tags
}

# Policy básica para CloudWatch Logs
resource "aws_iam_role_policy" "lambda_logs_policy" {
  name = "${local.name_prefix}-lambda-logs"
  role = aws_iam_role.lambda_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:*:log-group:/aws/lambda/${local.name_prefix}-*"
      }
    ]
  })
}

# Policy para acesso ao SQS
resource "aws_iam_role_policy" "lambda_sqs_policy" {
  name = "${local.name_prefix}-lambda-sqs"
  role = aws_iam_role.lambda_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:SendMessage",
          "sqs:GetQueueAttributes",
          "sqs:GetQueueUrl"
        ]
        Resource = [
          aws_sqs_queue.send_queue.arn,
          aws_sqs_queue.send_queue_dlq.arn
        ]
      }
    ]
  })
}

# Policy para acesso ao DynamoDB
resource "aws_iam_role_policy" "lambda_dynamodb_policy" {
  name = "${local.name_prefix}-lambda-dynamodb"
  role = aws_iam_role.lambda_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem"
        ]
        Resource = [
          aws_dynamodb_table.config.arn,
          aws_dynamodb_table.rate_limit.arn,
          aws_dynamodb_table.idempotency.arn,
          aws_dynamodb_table.stats.arn,
          aws_dynamodb_table.meetings.arn,
          "${aws_dynamodb_table.config.arn}/index/*",
          "${aws_dynamodb_table.stats.arn}/index/*",
          "${aws_dynamodb_table.meetings.arn}/index/*"
        ]
      }
    ]
  })
}

# Policy para acesso aos segredos do Secrets Manager
resource "aws_iam_role_policy" "lambda_secrets_policy" {
  name = "${local.name_prefix}-lambda-secrets"
  role = aws_iam_role.lambda_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          data.aws_secretsmanager_secret.whatsapp.arn,
          data.aws_secretsmanager_secret.email.arn,
          data.aws_secretsmanager_secret.calendar.arn
        ]
      }
    ]
  })
}

# Policy para EventBridge (para publicar eventos)
resource "aws_iam_role_policy" "lambda_eventbridge_policy" {
  name = "${local.name_prefix}-lambda-eventbridge"
  role = aws_iam_role.lambda_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "events:PutEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

# Policy para X-Ray tracing
resource "aws_iam_role_policy" "lambda_xray_policy" {
  name = "${local.name_prefix}-lambda-xray"
  role = aws_iam_role.lambda_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      }
    ]
  })
}

# Anexar policy gerenciada para VPC (se necessário no futuro)
resource "aws_iam_role_policy_attachment" "lambda_vpc_policy" {
  count      = var.environment == "prod" ? 1 : 0
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}
