output "function_name" {
  description = "Nome da Lambda"
  value       = aws_lambda_function.this.function_name
}

output "api_endpoint" {
  description = "URL base da API HTTP"
  value       = aws_apigatewayv2_stage.default.invoke_url
}
output "lambda_security_group_id" {
  description = "ID do Security Group da Lambda"
  value       = aws_security_group.lambda.id
}
