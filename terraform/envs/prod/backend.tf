terraform {
  backend "s3" {
    bucket         = "alquimistaai-terraform-state"
    key            = "fibonacci/prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "alquimistaai-terraform-locks"
    encrypt        = true
  }
}
