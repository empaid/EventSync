
module "asset_bucket" {
    source = "./modules/s3_bucket"
    name = var.asset_bucket_name
    tags = {app = "event-sync", env= terraform.workspace }
}

output "asset_bucket_name" {value = module.asset_bucket.bucket_name}