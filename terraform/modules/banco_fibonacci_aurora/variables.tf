variable "environment" {
  description = "Ambiente (dev, prod, etc.)"
  type        = string
}

variable "db_name" {
  description = "Nome do banco de dados inicial"
  type        = string
}

variable "vpc_id" {
  description = "ID da VPC onde o cluster será criado"
  type        = string
}

variable "private_subnet_ids" {
  description = "Subnets privadas para o Aurora"
  type        = list(string)
}

variable "tags" {
  description = "Tags padrão"
  type        = map(string)
}

variable "secrets_prefix" {
  description = "Prefixo do Secrets Manager (ex: /repo/github/alquimistaai-aws-architecture/fibonacci-dev)"
  type        = string
}
