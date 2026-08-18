from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )

    # Application
    APP_NAME: str = "AI Video Orchestrator"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str

    # Redis
    REDIS_URL: str

    # MinIO
    MINIO_ENDPOINT: str
    MINIO_ACCESS_KEY: str
    MINIO_SECRET_KEY: str
    MINIO_SECURE: bool = False

    # Authentication / JWT
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60

    # AI API Keys & Local Proxies
    GEMINI_API_KEY: str = ""
    ELEVENLABS_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    OMNIROUTE_BASE_URL: str = "http://localhost:20128/v1"
    OMNIROUTE_API_KEY: str = ""
    OMNIROUTE_MODEL: str = "oc/nemotron-3-ultra-free"
    HUGGINGFACE_API_KEY: str = ""
    FAL_KEY: str = ""
    REPLICATE_API_TOKEN: str = ""


settings = Settings()