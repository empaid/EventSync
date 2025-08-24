import os
from dotenv import load_dotenv

load_dotenv()
load_dotenv(os.getcwd()+"/app/.env")

class Config:
    SECRET_KEY=os.getenv("SECRET_KEY", "TEST")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///studio.db")
    SQLALCHEMY_TRACK_MODIFICATIONS=False
    JWT_SECRET_KEY=os.getenv("JWT_SECRET_KEY", "SECRET_KEY")
    BUCKET = os.getenv("AWS_S3_ASSET_BUCKET")
    AWS_REGION = os.getenv("AWS_DEFAULT_REGION")
    AWS_BASE_ENDPOINT = os.getenv("AWS_BASE_ENDPOINT")


class Debug(Config):
    DEBUG=True