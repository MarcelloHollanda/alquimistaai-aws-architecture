# EventBridge Rules para triggers de Lambdas secundárias

# Rule para capturar eventos de "Schedule Requested" e invocar schedule-meeting
resource "aws_cloudwatch_event_rule" "schedule_requested" {
  name        = "${local.name_prefix}-schedule-requested"
  description = "Captura eventos de solicitação de agendamento"
  
  event_pattern = jsonencode({
    source      = ["nigredo.atendimento"]
    detail-type = ["Schedule Requested"]
  })
  
  tags = local.common_tags
}

# Target para a rule schedule_requested
resource "aws_cloudwatch_event_target" "schedule_requested_target" {
  rule      = aws_cloudwatch_event_rule.schedule_requested.name
  target_id = "ScheduleMeetingTarget"
  arn       = aws_lambda_function.schedule_meeting.arn
}

# Permissão para EventBridge invocar schedule-meeting
resource "aws_lambda_permission" "allow_eventbridge_schedule_meeting" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.schedule_meeting.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.schedule_requested.arn
}

# Rule para capturar eventos de "Meeting Proposed" e invocar generate-briefing
resource "aws_cloudwatch_event_rule" "meeting_proposed" {
  name        = "${local.name_prefix}-meeting-proposed"
  description = "Captura eventos de reunião proposta para gerar briefing"
  
  event_pattern = jsonencode({
    source      = ["micro-agente-disparo-agendamento"]
    detail-type = ["Meeting Proposed"]
  })
  
  tags = local.common_tags
}

# Target para a rule meeting_proposed
resource "aws_cloudwatch_event_target" "meeting_proposed_target" {
  rule      = aws_cloudwatch_event_rule.meeting_proposed.name
  target_id = "GenerateBriefingTarget"
  arn       = aws_lambda_function.generate_briefing.arn
}

# Permissão para EventBridge invocar generate-briefing
resource "aws_lambda_permission" "allow_eventbridge_generate_briefing" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.generate_briefing.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.meeting_proposed.arn
}

# Rule para capturar eventos de "Meeting Confirmed" e atualizar status
resource "aws_cloudwatch_event_rule" "meeting_confirmed" {
  name        = "${local.name_prefix}-meeting-confirmed"
  description = "Captura eventos de confirmação de reunião"
  
  event_pattern = jsonencode({
    source      = ["micro-agente-disparo-agendamento"]
    detail-type = ["Meeting Confirmed"]
  })
  
  tags = local.common_tags
}

# Target para a rule meeting_confirmed
resource "aws_cloudwatch_event_target" "meeting_confirmed_target" {
  rule      = aws_cloudwatch_event_rule.meeting_confirmed.name
  target_id = "ConfirmMeetingTarget"
  arn       = aws_lambda_function.confirm_meeting.arn
}

# Permissão para EventBridge invocar confirm-meeting
resource "aws_lambda_permission" "allow_eventbridge_confirm_meeting" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.confirm_meeting.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.meeting_confirmed.arn
}

# Outputs das rules
output "eventbridge_rule_arns" {
  description = "ARNs das regras do EventBridge"
  value = {
    schedule_requested = aws_cloudwatch_event_rule.schedule_requested.arn
    meeting_proposed   = aws_cloudwatch_event_rule.meeting_proposed.arn
    meeting_confirmed  = aws_cloudwatch_event_rule.meeting_confirmed.arn
  }
}
