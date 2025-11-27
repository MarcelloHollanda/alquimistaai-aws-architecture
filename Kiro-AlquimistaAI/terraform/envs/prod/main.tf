# Terraform Environment: PROD
# Micro Agente de Disparo & Agendamento

terraform {
  backend "s3" {
    bucket         = "alquimistaai-terraform-state"
    key            = "micro-agente-disparo-agenda/prod/terraform.tfstate"
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
      Environment = "prod"
      ManagedBy   = "Terraform"
    }
  }
}

# Instância do módulo
module "agente_disparo_agenda" {
  source = "../../modules/agente_disparo_agenda"
  
  environment                = "prod"
  project_name               = "micro-agente-disparo-agendamento"
  aws_region                 = "us-east-1"
  alerts_sns_topic_arn       = var.alerts_sns_topic_arn
  lambda_artifact_bucket     = var.lambda_artifact_bucket
  lambda_artifact_key_prefix = "micro-agente-disparo-agendamento/prod/"
  
  tags = {
    project     = "AlquimistaAI"
    component   = "micro-agente-disparo-agendamento"
    environment = "prod"
  }
}

# Outputs do ambiente prod
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
