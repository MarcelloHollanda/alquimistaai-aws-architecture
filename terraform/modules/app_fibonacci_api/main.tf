data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = var.lambda_source_dir
  output_path = "${path.module}/build/${var.function_name}-${var.environment}.zip"
}

resource "aws_iam_role" "lambda_exec" {
  name = "${var.function_name}-${var.environment}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action   = "sts:AssumeRole"
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "lambda_vpc_access" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.function_name}-${var.environment}"
  retention_in_days = 14
  tags              = var.tags
}

resource "aws_security_group" "lambda" {
  name        = "${var.function_name}-${var.environment}-lambda-sg"
  description = "Security Group da Lambda ${var.function_name} (${var.environment})"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.tags,
    { Name = "${var.function_name}-${var.environment}-lambda-sg" }
  )
}

resource "aws_lambda_function" "this" {
  function_name = "${var.function_name}-${var.environment}"
  role          = aws_iam_role.lambda_exec.arn
  runtime       = "nodejs20.x"
  handler       = "index.handler"

  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  memory_size = 256
  timeout     = 10

      environment {
    variables = {
      APP_ENV        = var.environment
      DB_SECRET_ARN  = var.db_secret_arn
      DB_HOST        = var.db_host
    }
  }



  vpc_config {
    subnet_ids         = var.subnet_ids
    security_group_ids = [aws_security_group.lambda.id]
  }

  tags = var.tags
}

resource "aws_apigatewayv2_api" "http_api" {
  name          = "${var.function_name}-${var.environment}-http"
  protocol_type = "HTTP"
  cors_configuration {
    allow_origins = [
      "http://alquimistaai-fibonacci-frontend-prod.s3-website-us-east-1.amazonaws.com"
    ]
    allow_methods = ["GET", "OPTIONS"]
    allow_headers = ["*"]
  }

  tags = var.tags
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.this.arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "default_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /"

  target = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true

  tags = var.tags
}

resource "aws_lambda_permission" "allow_apigw_invoke" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.this.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_apigatewayv2_route" "public_agent_interest_post" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /public/agent-interest"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_iam_role_policy" "lambda_secrets_access" {
  name = "${var.function_name}-${var.environment}-secrets-access"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [var.db_secret_arn]
      }
    ]
  })
}
