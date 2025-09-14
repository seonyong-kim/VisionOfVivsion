import os

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
    DEBUG = os.getenv("DEBUG", "True").lower() in ("true", "1")
    # DB, Redis, 외부 API 키 등을 여기에 추가 가능
    