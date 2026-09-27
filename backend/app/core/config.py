from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file=(".env", "../.env"),
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

    # Authentication & Session Management
    SESSION_COOKIE_NAME: str = "kanggird_session"
    SESSION_IDLE_TIMEOUT_MINUTES: int = 60
    SESSION_ABSOLUTE_TIMEOUT_DAYS: int = 14
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"
    COOKIE_DOMAIN: str | None = None
    CORS_ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    # Argon2id Hashing Parameters
    ARGON2_TIME_COST: int = 3
    ARGON2_MEMORY_COST: int = 65536
    ARGON2_PARALLELISM: int = 4

    # Security Token Expirations
    RESET_TOKEN_EXPIRE_MINUTES: int = 15
    VERIFY_TOKEN_EXPIRE_HOURS: int = 24

    # Rate Limiting
    RATE_LIMIT_LOGIN_PER_MINUTE: int = 5
    RATE_LIMIT_REGISTER_PER_MINUTE: int = 3
    RATE_LIMIT_RESET_PER_MINUTE: int = 3

    # Legacy JWT (retained for backward compatibility if needed)
    jwt_secret_key: str = "66cf97afc5a3c054869c448234bd0af3faca3bb3443e803462ac4d29808f42ca"
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