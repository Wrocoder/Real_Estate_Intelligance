from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Domarion Analytics API"
    environment: str = "local"
    database_url: str = "postgresql+psycopg://domarion:domarion@localhost:5432/domarion"
    redis_url: str = "redis://localhost:6379/0"
    data_repository_backend: str = "memory"
    report_store_backend: str = "memory"
    report_order_store_backend: str = "memory"
    user_store_backend: str = "memory"
    auth_store_backend: str = "memory"
    ingestion_admin_store_backend: str = "memory"
    demo_user_id: str = "demo-user"
    demo_user_email: str = "demo@domarion.local"
    cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://127.0.0.1:3000"]
    )
    log_level: str = "INFO"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
