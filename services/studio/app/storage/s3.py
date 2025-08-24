import boto3
import os
from app.config import Config

s3_client = boto3.client("s3", region_name=Config.AWS_REGION, endpoint_url=Config.AWS_BASE_ENDPOINT)

def ensure_asset_bucket(bucket_name=Config.BUCKET):
    try:
        s3_client.head_bucket(Bucket=bucket_name)
        print("Bucket Exist")
    except Exception as e: #Check for proper exception
        s3_client.create_bucket(Bucket=bucket_name)
        print("New Bucket Created")
