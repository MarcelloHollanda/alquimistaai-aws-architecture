# Terraform Environment: DEV
# Micro Agente de Disparo & Agendamento

terraform {
  backend "s3" {
    bucket         = "alquimistaai-terraform-state"
    key            = "micro-agente-disparo-agenda/dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "alquimistaai-terraform-locks"
    encrypt        = true
  }
  
  required_version = ">= 1.6.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
  
  default_tags {
    tags = {
      Project     = "AlquimistaAI"
      Component   = "micro-agente-disparo-agendamento"
      Environment = "dev"
      ManagedBy   = "Terraform"
    }
  }
}

# Instância do módulo
module "agente_disparo_agenda" {
  source = "../../modules/agente_disparo_agenda"
  
  environment                = "dev"
  project_name               = "micro-agente-disparo-agendamento"
  aws_region                 = "us-east-1"
  alerts_sns_topic_arn       = var.alerts_sns_topic_arn
  lambda_artifact_bucket     = var.lambda_artifact_bucket
  lambda_artifact_key_prefix = "micro-agente-disparo-agendamento/dev/"
  
  tags = {}
}

# Outputs do ambiente dev
output "lambda_arns" {
  description = "ARNs das Lambdas"
  value       = module.agente_disparo_agenda.lambda_arns
}

output "sqs_urls" {
  description = "URLs das filas SQS"
  value       = module.agente_disparo_agenda.sqs_urls
}

output "dynamodb_table_names" {
  description = "Nomes das tabelas DynamoDB"
  value       = module.agente_disparo_agenda.dynamodb_table_names
}

output "secrets_names" {
  description = "Nomes dos segredos"
  value       = module.agente_disparo_agenda.secrets_names
}

output "api_gateway_id" {
  description = "ID da API Gateway"
  value       = module.agente_disparo_agenda.api_gateway_id
}

output "api_gateway_invoke_url" {
  description = "URL base da API Gateway"
  value       = module.agente_disparo_agenda.api_gateway_invoke_url
}

output "api_gateway_routes" {
  description = "Rotas disponíveis na API"
  value       = module.agente_disparo_agenda.api_gateway_routes
}
