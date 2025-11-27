output "cluster_arn" {
  description = "ARN do cluster Aurora"
  value       = aws_rds_cluster.this.arn
}

output "cluster_endpoint" {
  description = "Endpoint writer do Aurora"
  value       = aws_rds_cluster.this.endpoint
}

output "reader_endpoint" {
  description = "Endpoint reader do Aurora"
  value       = aws_rds_cluster.this.reader_endpoint
}

output "secret_arn" {
  description = "ARN do segredo com credenciais do banco"
  value       = aws_secretsmanager_secret.db_credentials.arn
}
output "db_security_group_id" {
  description = "ID do Security Group do Aurora"
  value       = aws_security_group.db.id
}
