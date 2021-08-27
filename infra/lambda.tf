module "scheduledLambda" {
  source      = "git@github.com:moggiez/terraform-modules.git//lambda_with_dynamo"
  name        = "${var.project_name}-scheduled"
  dist_dir    = "../dist"
  s3_bucket   = aws_s3_bucket._
  environment = "PROD"

  timeout = 600

  policies = [
    aws_iam_policy.s3_access.arn,
    aws_iam_policy.cloudwatch_metrics_access.arn,
    aws_iam_policy.invoke_lambda.arn
  ]

  layers = []
}