terraform {
  required_providers {
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

resource "random_password" "master" {
  length  = 20
  special = true
}

resource "aws_secretsmanager_secret" "db_credentials" {
  name = "${var.secrets_prefix}/db/postgres"

  tags = var.tags
}

resource "aws_db_subnet_group" "this" {
  name       = "fibonacci-${var.environment}-db-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = merge(
    var.tags,
    { Name = "fibonacci-${var.environment}-db-subnet-group" }
  )
}

resource "aws_security_group" "db" {
  name        = "fibonacci-${var.environment}-db-sg"
  description = "Security Group para Aurora do Fibonacci (${var.environment})"
  vpc_id      = var.vpc_id

  # As regras de entrada (ingress) serão gerenciadas fora (env dev/prod),
  # usando o ID exposto em output.

  tags = merge(
    var.tags,
    { Name = "fibonacci-${var.environment}-db-sg" }
  )
}

resource "aws_rds_cluster" "this" {
  cluster_identifier = "fibonacci-${var.environment}-aurora"
  engine             = "aurora-postgresql"
  engine_mode        = "provisioned"

  database_name   = var.db_name
  master_username = "fibonacci_admin"
  master_password = random_password.master.result

  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = [aws_security_group.db.id]

  backup_retention_period = 7
  preferred_backup_window = "04:00-05:00"
  copy_tags_to_snapshot   = true

  serverlessv2_scaling_configuration {
    min_capacity = 0.5
    max_capacity = 2.0
  }

  tags = var.tags
}

resource "aws_rds_cluster_instance" "serverless_instance" {
  identifier         = "fibonacci-${var.environment}-aurora-1"
  cluster_identifier = aws_rds_cluster.this.id
  instance_class     = "db.serverless"

  engine = aws_rds_cluster.this.engine

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "db_credentials_version" {
  secret_id = aws_secretsmanager_secret.db_credentials.id

  secret_string = jsonencode({
    username = "fibonacci_admin"
    password = random_password.master.result
    engine   = "aurora-postgresql"
    dbname   = var.db_name
    host     = aws_rds_cluster.this.endpoint
    port     = 5432
  })
}
