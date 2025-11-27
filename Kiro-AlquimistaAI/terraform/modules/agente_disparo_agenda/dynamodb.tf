# DynamoDB Tables para Micro Agente de Disparo & Agendamento

# Tabela de configuração/tenants do agente
resource "aws_dynamodb_table" "config" {
  name         = "${local.name_prefix}-config"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  range_key    = "sk"
  
  attribute {
    name = "pk"
    type = "S"
  }
  
  attribute {
    name = "sk"
    type = "S"
  }
  
  attribute {
    name = "tenantId"
    type = "S"
  }
  
  # Global Secondary Index para consultas por tenant
  global_secondary_index {
    name            = "tenant-index"
    hash_key        = "tenantId"
    projection_type = "ALL"
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  tags = local.common_tags
}

# Tabela de rate limiting
resource "aws_dynamodb_table" "rate_limit" {
  name         = "${local.name_prefix}-rate-limit"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  
  attribute {
    name = "pk"
    type = "S"
  }
  
  # TTL para limpeza automática de registros antigos
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  tags = local.common_tags
}

# Tabela de idempotência
resource "aws_dynamodb_table" "idempotency" {
  name         = "${local.name_prefix}-idempotency"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  
  attribute {
    name = "pk"
    type = "S"
  }
  
  # TTL para limpeza automática (24h)
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  tags = local.common_tags
}

# Tabela de estatísticas
resource "aws_dynamodb_table" "stats" {
  name         = "${local.name_prefix}-stats"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  range_key    = "sk"
  
  attribute {
    name = "pk"
    type = "S"
  }
  
  attribute {
    name = "sk"
    type = "S"
  }
  
  attribute {
    name = "date"
    type = "S"
  }
  
  # GSI para consultas por data
  global_secondary_index {
    name            = "date-index"
    hash_key        = "date"
    range_key       = "pk"
    projection_type = "ALL"
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  tags = local.common_tags
}

# Tabela de reuniões/agendamentos
resource "aws_dynamodb_table" "meetings" {
  name         = "${local.name_prefix}-meetings"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  range_key    = "sk"
  
  attribute {
    name = "pk"
    type = "S"
  }
  
  attribute {
    name = "sk"
    type = "S"
  }
  
  attribute {
    name = "status"
    type = "S"
  }
  
  attribute {
    name = "scheduledAt"
    type = "S"
  }
  
  attribute {
    name = "tenantId"
    type = "S"
  }
  
  # GSI para consultas por status
  global_secondary_index {
    name            = "status-index"
    hash_key        = "status"
    range_key       = "scheduledAt"
    projection_type = "ALL"
  }
  
  # GSI para consultas por tenant
  global_secondary_index {
    name            = "tenant-meetings-index"
    hash_key        = "tenantId"
    range_key       = "scheduledAt"
    projection_type = "ALL"
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  tags = local.common_tags
}
