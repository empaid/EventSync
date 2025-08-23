import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY=os.getenv("SECRET_KEY", "TEST")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///studio.db")
    SQLALCHEMY_TRACK_MODIFICATIONS=False
    PORT = os.getenv("PORT", "3000")
    DEBUG=False

class Debug(Config):
    DEBUG=True