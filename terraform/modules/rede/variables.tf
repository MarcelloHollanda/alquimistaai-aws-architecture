variable "vpc_cidr" {
  description = "Bloco CIDR da VPC"
  type        = string
}

variable "environment" {
  description = "Nome do ambiente (dev, prod, etc.)"
  type        = string
}

variable "tags" {
  description = "Tags padrão a serem aplicadas"
  type        = map(string)
}
