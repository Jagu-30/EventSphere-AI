import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "EventSphere-AI"
    ENVIRONMENT: str = "development"

    # Database Settings
    DATABASE_URL: str = "sqlite+aiosqlite:///./eventsphere.db"
    REDIS_URL: str = "redis://localhost:6379/0"
    ELASTICSEARCH_URL: Optional[str] = "http://localhost:9200"

    # Security Settings
    JWT_SECRET: str = "supersecretjwtkeyforprodandsandboxenvironments123!"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Email Settings
    SENDGRID_API_KEY: Optional[str] = None
    FROM_EMAIL: str = "noreply@eventsphere.ai"

    # Storage Settings (AWS S3 Compatible)
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_BUCKET_NAME: str = "eventsphere-assets"
    AWS_ENDPOINT_URL: Optional[str] = None  # For LocalStack / MinIO

    # Rate Limiting
    RATE_LIMIT_CALLS: int = 100
    RATE_LIMIT_PERIOD_SECONDS: int = 60

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
