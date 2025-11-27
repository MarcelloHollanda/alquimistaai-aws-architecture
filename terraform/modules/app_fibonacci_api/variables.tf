variable "environment" {
  description = "Ambiente (dev, prod, etc.)"
  type        = string
}

variable "function_name" {
  description = "Nome base da função Lambda"
  type        = string
}

variable "tags" {
  description = "Tags padrão para os recursos"
  type        = map(string)
}

variable "lambda_source_dir" {
  description = "Diretório com o código-fonte da Lambda"
  type        = string
}
variable "vpc_id" {
  description = "VPC onde a Lambda será executada"
  type        = string
}

variable "subnet_ids" {
  description = "Subnets onde a Lambda será executada (ex.: subnets públicas)"
  type        = list(string)
}
variable "db_secret_arn" {
  description = "ARN do segredo do banco no Secrets Manager"
  type        = string
}
variable "db_host" {
  description = "Host do banco de dados (endpoint do Aurora)"
  type        = string
}
