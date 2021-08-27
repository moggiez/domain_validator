resource "aws_lambda_permission" "allow_cloudwatch_metrics_saver" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = module.scheduledLambda.lambda.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.call_lambda_rule.arn
}