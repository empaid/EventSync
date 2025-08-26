terraform {


    backend "s3" {
        bucket = "tf-state-bucket-event-sync"
        key = "event-sync/infra/terraform.tfstate"
        region = "ap-southeast-2"
        use_lockfile = true
        encrypt = true
    }
}

provider "aws" {
    region = var.region
}