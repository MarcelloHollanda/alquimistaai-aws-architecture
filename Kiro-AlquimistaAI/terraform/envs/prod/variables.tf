# Variables para ambiente PROD

variable "alerts_sns_topic_arn" {
  description = "ARN do tópico SNS para alertas operacionais"
  type        = string
  # Valor será configurado via terraform.tfvars ou variável de ambiente
}

variable "lambda_artifact_bucket" {
  description = "Nome do bucket S3 com artefatos das Lambdas"
  type        = string
  # Valor será configurado via terraform.tfvars ou variável de ambiente
}
