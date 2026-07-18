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
    agency_store_backend: str = "memory"
    ingestion_admin_store_backend: str = "memory"
    user_submitted_listing_store_backend: str = "memory"
    partner_referral_store_backend: str = "memory"
    ai_insight_store_backend: str = "memory"
    news_store_backend: str = "memory"
    report_artifact_storage_backend: str = "disabled"
    report_artifact_local_dir: str = ".domarion/report-artifacts"
    report_artifact_public_base_url: str | None = None
    report_artifact_s3_endpoint_url: str | None = None
    report_artifact_s3_region: str = "eu-central-1"
    report_artifact_s3_bucket: str | None = None
    report_artifact_s3_prefix: str = "domarion/reports"
    report_artifact_s3_access_key_id: str | None = None
    report_artifact_s3_secret_access_key: str | None = None
    payment_provider: str = "mock"
    payment_checkout_base_url: str | None = None
    payment_success_url: str | None = None
    payment_cancel_url: str | None = None
    payment_checkout_timeout_seconds: float = 10.0
    stripe_secret_key: str | None = None
    stripe_api_base_url: str = "https://api.stripe.com"
    payment_webhook_tolerance_seconds: int = 300
    stripe_webhook_secret: str | None = None
    payu_api_base_url: str = "https://secure.snd.payu.com"
    payu_client_id: str | None = None
    payu_client_secret: str | None = None
    payu_merchant_pos_id: str | None = None
    payu_notify_url: str | None = None
    payu_customer_ip: str = "127.0.0.1"
    payu_second_key: str | None = None
    alert_email_enabled: bool = False
    alert_email_sender: str = "alerts@domarion.local"
    alert_smtp_host: str | None = None
    alert_smtp_port: int = 587
    alert_smtp_username: str | None = None
    alert_smtp_password: str | None = None
    alert_smtp_use_tls: bool = True
    alert_delivery_timeout_seconds: float = 10.0
    alert_telegram_enabled: bool = False
    alert_telegram_bot_name: str = "DomarionBot"
    alert_telegram_bot_token: str | None = None
    alert_telegram_api_base_url: str = "https://api.telegram.org"
    scoring_weights_json: str | None = None
    demo_user_id: str = "demo-user"
    demo_user_email: str = "demo@domarion.local"
    cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://127.0.0.1:3000"]
    )
    log_level: str = "INFO"
    sentry_dsn: str | None = None
    sentry_traces_sample_rate: float = Field(default=0.0, ge=0.0, le=1.0)
    api_lite_keys_json: str | None = None
    api_lite_default_monthly_quota: int = 1000
    api_lite_default_rate_limit_per_minute: int = 60

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
