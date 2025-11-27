# Variables for DEV environment
# Micro Agente de Disparo & Agendamento

variable "alerts_sns_topic_arn" {
  description = "ARN do tópico SNS para alertas"
  type        = string
  default     = ""  # Será detectado automaticamente ou fornecido via tfvars
}

variable "lambda_artifact_bucket" {
  description = "Nome do bucket S3 para artefatos Lambda"
  type        = string
  default     = "alquimista-lambda-artifacts-dev"
}

variable "rate_limit_whatsapp_hourly" {
  description = "Limite de mensagens WhatsApp por hora"
  type        = number
  default     = 100
}

variable "rate_limit_email_hourly" {
  description = "Limite de mensagens Email por hora"
  type        = number
  default     = 500
}

variable "rate_limit_sms_hourly" {
  description = "Limite de mensagens SMS por hora"
  type        = number
  default     = 50
}

variable "lambda_timeout_api" {
  description = "Timeout da Lambda API Handler (segundos)"
  type        = number
  default     = 30
}

variable "lambda_timeout_send" {
  description = "Timeout da Lambda Send Messages (segundos)"
  type        = number
  default     = 180
}

variable "lambda_timeout_schedule" {
  description = "Timeout da Lambda Schedule Meeting (segundos)"
  type        = number
  default     = 300
}

variable "lambda_memory_api" {
  description = "Memória da Lambda API Handler (MB)"
  type        = number
  default     = 512
}

variable "lambda_memory_send" {
  description = "Memória da Lambda Send Messages (MB)"
  type        = number
  default     = 1024
}

variable "lambda_memory_schedule" {
  description = "Memória da Lambda Schedule Meeting (MB)"
  type        = number
  default     = 1024
}

variable "business_hours_start" {
  description = "Horário de início do expediente comercial (hora)"
  type        = number
  default     = 8
}

variable "business_hours_end" {
  description = "Horário de término do expediente comercial (hora)"
  type        = number
  default     = 18
}

variable "meeting_duration_default" {
  description = "Duração padrão de reuniões (minutos)"
  type        = number
  default     = 60
}

variable "buffer_minutes" {
  description = "Buffer entre reuniões (minutos)"
  type        = number
  default     = 15
}

variable "confirmation_timeout_hours" {
  description = "Timeout para confirmação de reunião (horas)"
  type        = number
  default     = 24
}
