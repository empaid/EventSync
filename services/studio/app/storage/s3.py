import boto3
import os
from app.config import Config

s3_client = boto3.client("s3", region_name=Config.AWS_REGION, aws_access_key_id=Config.AWS_ACCESS_KEY, aws_secret_access_key=Config.AWS_SECRET_KEY )

def ensure_asset_bucket(bucket_name=Config.BUCKET):
    try:
        s3_client.head_bucket(Bucket=bucket_name)
        print("Bucket Exist")
    except Exception as e: #Check for proper exception
        s3_client.create_bucket(Bucket=bucket_name)
        print("New Bucket Created")
