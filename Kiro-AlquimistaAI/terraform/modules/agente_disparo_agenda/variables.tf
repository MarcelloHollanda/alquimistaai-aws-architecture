# Variables para o módulo Micro Agente de Disparo & Agendamento

variable "environment" {
  description = "Ambiente (dev ou prod)"
  type        = string
  
  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "Environment deve ser 'dev' ou 'prod'."
  }
}

variable "project_name" {
  description = "Nome do projeto"
  type        = string
  default     = "micro-agente-disparo-agendamento"
}

variable "aws_region" {
  description = "Região AWS"
  type        = string
  default     = "us-east-1"
}

variable "alerts_sns_topic_arn" {
  description = "ARN do tópico SNS para alertas operacionais"
  type        = string
}

variable "lambda_artifact_bucket" {
  description = "Nome do bucket S3 com artefatos das Lambdas"
  type        = string
}

variable "lambda_artifact_key_prefix" {
  description = "Prefixo das chaves S3 dos artefatos"
  type        = string
  default     = "micro-agente-disparo-agendamento/"
}

variable "tags" {
  description = "Tags adicionais para recursos"
  type        = map(string)
  default     = {}
}
