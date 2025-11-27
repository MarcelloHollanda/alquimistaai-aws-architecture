provider "aws" {
  region = "us-east-1"
}

locals {
  default_tags = {
    Project     = "Fibonacci-Orquestrador"
    Environment = "prod"
    Owner       = "AlquimistaAI"
    ManagedBy   = "Terraform"
  }
}

module "rede" {
  source      = "../../modules/rede"
  vpc_cidr    = "10.20.0.0/16"
  environment = "prod"
  tags        = local.default_tags
}

module "banco_fibonacci" {
  source             = "../../modules/banco_fibonacci_aurora"
  environment        = "prod"
  db_name            = "fibonacci_prod"
  vpc_id             = module.rede.vpc_id
  private_subnet_ids = module.rede.private_subnet_ids
  tags               = local.default_tags
  secrets_prefix     = "/repo/github/alquimistaai-aws-architecture/fibonacci-prod"
}

module "fibonacci_api" {
  source            = "../../modules/app_fibonacci_api"
  environment       = "prod"
  function_name     = "fibonacci-api"
  tags              = local.default_tags
  lambda_source_dir = "${path.module}/../../../lambda-src"

  vpc_id        = module.rede.vpc_id
  subnet_ids    = module.rede.public_subnet_ids
  db_secret_arn = module.banco_fibonacci.secret_arn
  db_host       = module.banco_fibonacci.cluster_endpoint
}

resource "aws_security_group_rule" "allow_lambda_to_db" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = module.banco_fibonacci.db_security_group_id
  source_security_group_id = module.fibonacci_api.lambda_security_group_id
}

resource "aws_security_group" "secretsmanager_endpoint" {
  name        = "fibonacci-prod-secretsmanager-endpoint-sg"
  description = "Permite Lambda prod acessar Secrets Manager via VPC endpoint"
  vpc_id      = module.rede.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.default_tags,
    { Name = "fibonacci-prod-secretsmanager-endpoint-sg" }
  )
}

resource "aws_security_group_rule" "allow_lambda_to_secretsmanager_endpoint" {
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  security_group_id        = aws_security_group.secretsmanager_endpoint.id
  source_security_group_id = module.fibonacci_api.lambda_security_group_id
}

resource "aws_vpc_endpoint" "secretsmanager" {
  vpc_id            = module.rede.vpc_id
  service_name      = "com.amazonaws.us-east-1.secretsmanager"
  vpc_endpoint_type = "Interface"

  subnet_ids         = module.rede.public_subnet_ids
  security_group_ids = [aws_security_group.secretsmanager_endpoint.id]

  private_dns_enabled = true

  tags = merge(
    local.default_tags,
    { Name = "fibonacci-prod-secretsmanager-endpoint" }
  )
}
