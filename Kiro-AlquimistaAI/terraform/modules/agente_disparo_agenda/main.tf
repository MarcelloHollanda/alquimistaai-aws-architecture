# Terraform Module: Micro Agente de Disparo & Agendamento
# Versão: 1.0.0
# Data: 22 de Novembro de 2025

terraform {
  required_version = ">= 1.6.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

# Locals para padronização de nomes e tags
locals {
  name_prefix = "${var.project_name}-${var.environment}"
  
  common_tags = merge(
    var.tags,
    {
      Module = "agente_disparo_agenda"
    }
  )
}

# Outputs movidos para outputs.tf para evitar duplicação
