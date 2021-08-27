resource "aws_cloudwatch_event_rule" "call_lambda_rule" {
  name        = "moggies.io-call_${var.project_name}"
  description = "Call ${var.project_name}-scheduled on a schedule."

  schedule_expression = "cron(*/30 * * * ? *)"

  tags = {
    Project = var.domain_name
  }
}

resource "aws_cloudwatch_event_target" "call_lambda_target" {
  rule      = aws_cloudwatch_event_rule.call_lambda_rule.name
  target_id = "LambdaToTarget-${var.project_name}"
  arn       = module.scheduledLambda.lambda.arn
}