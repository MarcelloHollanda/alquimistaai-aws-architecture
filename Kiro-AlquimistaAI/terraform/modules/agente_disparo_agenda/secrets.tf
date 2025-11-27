# Secrets Manager - Data Sources para segredos existentes

# Segredo do WhatsApp
data "aws_secretsmanager_secret" "whatsapp" {
  name = "/repo/terraform/micro-agente-disparo-agendamento/whatsapp"
}

# Segredo do Email
data "aws_secretsmanager_secret" "email" {
  name = "/repo/terraform/micro-agente-disparo-agendamento/email"
}

# Segredo do Calendar
data "aws_secretsmanager_secret" "calendar" {
  name = "/repo/terraform/micro-agente-disparo-agendamento/calendar"
}

# Output secrets_arns movido para outputs.tf
