from sqlalchemy import false

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")
    
    APP_NAME:str
    APP_ENV:str
    CORS_ORIGIN1:str
    # database url
    DATABASE_URL:str
    # minio urls
    MINIO_URL:str
    MINIO_ACCESS_KEY:str
    MINIO_SECRET_KEY:str
    MINIO_SECURE:bool
    # redis
    REDIS_URL:str
    
settings = Settings()

print(settings.APP_NAME)


