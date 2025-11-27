# API Gateway HTTP para Micro Agente de Disparo & Agendamento
# Expõe endpoints HTTP para integração com frontend

# API Gateway HTTP
resource "aws_apigatewayv2_api" "disparo_agenda_api" {
  name          = "${local.name_prefix}-api"
  protocol_type = "HTTP"
  description   = "API HTTP para Micro Agente de Disparo & Agendamento"

  cors_configuration {
    allow_origins = ["*"] # TODO: Restringir para domínios específicos em produção
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization", "X-Amz-Date", "X-Api-Key", "X-Amz-Security-Token"]
    max_age       = 300
  }

  tags = local.common_tags
}

# Stage DEV/PROD
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.disparo_agenda_api.id
  name        = var.environment
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway_logs.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
      errorMessage   = "$context.error.message"
    })
  }

  default_route_settings {
    throttling_burst_limit = 100
    throttling_rate_limit  = 50
  }

  tags = local.common_tags
}

# CloudWatch Log Group para API Gateway
resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  name              = "/aws/apigateway/${local.name_prefix}"
  retention_in_days = 7

  tags = local.common_tags
}

# ========================================
# INTEGRATIONS
# ========================================

# Integration: Lambda API Handler
resource "aws_apigatewayv2_integration" "api_handler" {
  api_id           = aws_apigatewayv2_api.disparo_agenda_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.api_handler.invoke_arn

  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

# ========================================
# ROUTES
# ========================================

# Route: GET /disparo/overview
resource "aws_apigatewayv2_route" "get_overview" {
  api_id    = aws_apigatewayv2_api.disparo_agenda_api.id
  route_key = "GET /disparo/overview"
  target    = "integrations/${aws_apigatewayv2_integration.api_handler.id}"
}

# Route: GET /disparo/campaigns
resource "aws_apigatewayv2_route" "get_campaigns" {
  api_id    = aws_apigatewayv2_api.disparo_agenda_api.id
  route_key = "GET /disparo/campaigns"
  target    = "integrations/${aws_apigatewayv2_integration.api_handler.id}"
}

# Route: POST /disparo/contacts/ingest
resource "aws_apigatewayv2_route" "post_contacts_ingest" {
  api_id    = aws_apigatewayv2_api.disparo_agenda_api.id
  route_key = "POST /disparo/contacts/ingest"
  target    = "integrations/${aws_apigatewayv2_integration.api_handler.id}"
}

# Route: GET /agendamento/meetings
resource "aws_apigatewayv2_route" "get_meetings" {
  api_id    = aws_apigatewayv2_api.disparo_agenda_api.id
  route_key = "GET /agendamento/meetings"
  target    = "integrations/${aws_apigatewayv2_integration.api_handler.id}"
}

# ========================================
# PERMISSIONS
# ========================================

# Permissão para API Gateway invocar Lambda API Handler
resource "aws_lambda_permission" "api_gateway_invoke" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.disparo_agenda_api.execution_arn}/*/*"
}

# Outputs movidos para outputs.tf
