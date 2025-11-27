output "vpc_id" {
  value       = module.rede.vpc_id
  description = "ID da VPC prod"
}

output "fibonacci_api_url" {
  value       = module.fibonacci_api.api_endpoint
  description = "URL pública da API HTTP prod"
}

output "aurora_cluster_endpoint" {
  value       = module.banco_fibonacci.cluster_endpoint
  description = "Endpoint writer do Aurora prod"
}

output "aurora_secret_arn" {
  value       = module.banco_fibonacci.secret_arn
  description = "ARN do segredo com credenciais do Aurora prod"
}
