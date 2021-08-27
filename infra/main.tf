terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }

  # Uncomment the line below to switch from local to s3 terraform backend
  # backend "s3" {}
}

provider "aws" {
  region = var.region
}

locals {
  environment = "PROD"
}
