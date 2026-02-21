from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "AIDA - Imprenta Digital"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:4000",  # Portal 1 - Cliente
        "http://localhost:4001",  # Portal 6 - Admin
        "http://localhost:4002",  # Portal 2 - Facturador
        "http://localhost:4003",  # Portal 3 - Validacion
        "http://localhost:4004",  # Portal 4 - Developers
        "http://localhost:4005",  # Portal 5 - Gestion
        "http://localhost:4100",  # Landing
    ]
    ALLOWED_ORIGIN_REGEX: str = r"https://.*\.vercel\.app|https://.*\.up\.railway\.app"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://aida:aida_secret_2024@localhost:5432/aida_db"
    DATABASE_ECHO: bool = False

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT Security
    SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # 2FA
    OTP_ISSUER: str = "AIDA"

    # SENIAT
    SENIAT_API_URL: str = ""
    SENIAT_API_KEY: str = ""

    # Email
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@aida.com.ve"

    # AI / LLM Provider
    AI_PROVIDER: str = "groq"  # groq | anthropic | openai
    AI_API_KEY: str = ""
    AI_MODEL: str = "llama-3.3-70b-versatile"  # Groq default; cambiar a claude-sonnet-4-20250514 en prod
    AI_BASE_URL: str = "https://api.groq.com/openai/v1"  # Groq es OpenAI-compatible
    AI_MAX_TOKENS: int = 4096
    AI_TEMPERATURE: float = 0.3

    # Storage
    STORAGE_BACKEND: str = "local"
    STORAGE_PATH: str = "/app/storage"

    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    model_config = {"env_file": ".env", "case_sensitive": True}


@lru_cache
def get_settings() -> Settings:
    return Settings()
