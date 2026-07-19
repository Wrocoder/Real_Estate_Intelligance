from __future__ import annotations

import os
from collections.abc import Mapping
from urllib.parse import parse_qs, urlparse

from domarion.core.config import Settings, get_settings
from domarion.schemas import ProductionReadinessCheck, ProductionReadinessReport

LOCAL_HOSTS = {"localhost", "127.0.0.1", "0.0.0.0", "::1"}
REQUIRED_POSTGRES_BACKENDS = {
    "DATA_REPOSITORY_BACKEND": "data_repository_backend",
    "REPORT_STORE_BACKEND": "report_store_backend",
    "REPORT_ORDER_STORE_BACKEND": "report_order_store_backend",
    "USER_STORE_BACKEND": "user_store_backend",
    "AUTH_STORE_BACKEND": "auth_store_backend",
    "AGENCY_STORE_BACKEND": "agency_store_backend",
    "CRM_STORE_BACKEND": "crm_store_backend",
    "INGESTION_ADMIN_STORE_BACKEND": "ingestion_admin_store_backend",
    "USER_SUBMITTED_LISTING_STORE_BACKEND": "user_submitted_listing_store_backend",
    "PARTNER_REFERRAL_STORE_BACKEND": "partner_referral_store_backend",
    "AI_INSIGHT_STORE_BACKEND": "ai_insight_store_backend",
    "NEWS_STORE_BACKEND": "news_store_backend",
    "CUSTOM_DASHBOARD_STORE_BACKEND": "custom_dashboard_store_backend",
}
VALID_WORKER_TASKS = {
    "daily-email-alerts",
    "area-market-snapshots",
    "price-history-rebuild",
}
MONITORING_ENV_VARS = {
    "UPTIME_MONITOR_URL": "uptime probe",
    "JOB_FAILURE_ALERT_TARGET": "background job failure alerts",
    "SOURCE_FRESHNESS_ALERT_TARGET": "source freshness alerts",
    "PAYMENT_WEBHOOK_ALERT_TARGET": "payment webhook alerts",
}


def build_production_readiness_report(
    settings: Settings | None = None,
    env: Mapping[str, str] | None = None,
) -> ProductionReadinessReport:
    settings = settings or get_settings()
    env_values = env if env is not None else os.environ
    checks: list[ProductionReadinessCheck] = []

    _add_check(
        checks,
        name="application_config",
        status="pass",
        message=(
            f"{settings.app_name} configuration loaded for "
            f"ENVIRONMENT={settings.environment}."
        ),
    )

    if settings.environment.strip().casefold() != "production":
        _add_check(
            checks,
            name="production_guardrails",
            status="pass",
            message="Production-only preflight checks are not blocking outside production.",
        )
        return _build_report(settings.environment, checks)

    checks.extend(
        [
            _check_postgres_backends(settings),
            _check_database_url(settings.database_url),
            _check_redis_url(settings.redis_url),
            _check_cors_origins(settings.cors_origins),
            _check_report_artifact_storage(settings),
            _check_payment_provider(settings),
            _check_notification_transports(settings),
            _check_worker_configuration(settings, env_values),
            _check_backup_storage(env_values),
            _check_monitoring(settings, env_values),
            _check_cost_controls(env_values),
        ]
    )
    return _build_report(settings.environment, checks)


def _check_postgres_backends(settings: Settings) -> ProductionReadinessCheck:
    non_postgres = [
        f"{env_name}={getattr(settings, field_name)}"
        for env_name, field_name in REQUIRED_POSTGRES_BACKENDS.items()
        if getattr(settings, field_name).strip().casefold() != "postgres"
    ]
    if non_postgres:
        return _make_check(
            name="postgres_backends",
            status="fail",
            message="Production has non-Postgres stores: " + ", ".join(non_postgres) + ".",
            remediation="Set every persistent store backend to postgres before paid traffic.",
        )
    return _make_check(
        name="postgres_backends",
        status="pass",
        message="All persistent store backends are configured for Postgres.",
    )


def _check_database_url(database_url: str) -> ProductionReadinessCheck:
    parsed = urlparse(database_url)
    failures: list[str] = []
    warnings: list[str] = []
    if not parsed.scheme.startswith("postgresql"):
        failures.append("DATABASE_URL must use a PostgreSQL driver.")
    if not parsed.hostname:
        failures.append("DATABASE_URL is missing a hostname.")
    elif _is_local_host(parsed.hostname):
        failures.append("DATABASE_URL points to a local host.")
    query = parse_qs(parsed.query)
    sslmode = (query.get("sslmode") or [""])[0].casefold()
    if sslmode not in {"require", "verify-ca", "verify-full"}:
        warnings.append("DATABASE_URL does not require TLS through sslmode.")

    if failures:
        return _make_check(
            name="database_url",
            status="fail",
            message=" ".join(failures),
            remediation="Use the managed Postgres/PostGIS URL, normally with sslmode=require.",
        )
    if warnings:
        return _make_check(
            name="database_url",
            status="warn",
            message=" ".join(warnings),
            remediation="Prefer sslmode=require or verify-full for production database traffic.",
        )
    return _make_check(
        name="database_url",
        status="pass",
        message="DATABASE_URL points to a non-local PostgreSQL endpoint with TLS enabled.",
    )


def _check_redis_url(redis_url: str) -> ProductionReadinessCheck:
    parsed = urlparse(redis_url)
    failures: list[str] = []
    warnings: list[str] = []
    if parsed.scheme not in {"redis", "rediss"}:
        failures.append("REDIS_URL must use redis:// or rediss://.")
    if not parsed.hostname:
        failures.append("REDIS_URL is missing a hostname.")
    elif _is_local_host(parsed.hostname):
        failures.append("REDIS_URL points to a local host.")
    if parsed.scheme != "rediss":
        warnings.append("REDIS_URL does not use TLS.")

    if failures:
        return _make_check(
            name="redis_url",
            status="fail",
            message=" ".join(failures),
            remediation="Use a managed Redis endpoint for production.",
        )
    if warnings:
        return _make_check(
            name="redis_url",
            status="warn",
            message=" ".join(warnings),
            remediation="Use rediss:// when the provider supports TLS.",
        )
    return _make_check(
        name="redis_url",
        status="pass",
        message="REDIS_URL points to a non-local TLS Redis endpoint.",
    )


def _check_cors_origins(cors_origins: list[str]) -> ProductionReadinessCheck:
    origins = [origin.strip() for origin in cors_origins if origin.strip()]
    if not origins:
        return _make_check(
            name="cors_origins",
            status="fail",
            message="CORS_ORIGINS is empty.",
            remediation="Configure the production frontend origin explicitly.",
        )
    if "*" in origins:
        return _make_check(
            name="cors_origins",
            status="fail",
            message="CORS_ORIGINS allows every origin.",
            remediation="Replace wildcard CORS with the exact production frontend domain.",
        )

    local_origins = [origin for origin in origins if _is_local_origin(origin)]
    if local_origins:
        return _make_check(
            name="cors_origins",
            status="fail",
            message="CORS_ORIGINS contains local development origins: " + ", ".join(local_origins),
            remediation="Keep localhost origins out of production configuration.",
        )
    return _make_check(
        name="cors_origins",
        status="pass",
        message="CORS_ORIGINS is limited to non-local origins.",
    )


def _check_report_artifact_storage(settings: Settings) -> ProductionReadinessCheck:
    backend = settings.report_artifact_storage_backend.strip().casefold()
    if backend != "s3":
        return _make_check(
            name="report_artifacts",
            status="fail",
            message=f"REPORT_ARTIFACT_STORAGE_BACKEND is {backend!r}, expected 's3'.",
            remediation="Use an S3-compatible private bucket for paid report artifacts.",
        )
    if not _present(settings.report_artifact_s3_bucket):
        return _make_check(
            name="report_artifacts",
            status="fail",
            message="REPORT_ARTIFACT_S3_BUCKET is not configured.",
            remediation=(
                "Create a private report artifact bucket and set "
                "REPORT_ARTIFACT_S3_BUCKET."
            ),
        )
    return _make_check(
        name="report_artifacts",
        status="pass",
        message="Report artifacts are configured for S3-compatible storage.",
    )


def _check_payment_provider(settings: Settings) -> ProductionReadinessCheck:
    provider = settings.payment_provider.strip().casefold()
    if provider == "mock":
        return _make_check(
            name="payment_provider",
            status="fail",
            message="PAYMENT_PROVIDER=mock is not suitable for production checkout.",
            remediation="Configure Stripe or PayU credentials and webhook secrets.",
        )
    if provider == "stripe":
        missing = _missing_settings(
            settings,
            [
                "stripe_secret_key",
                "stripe_webhook_secret",
                "payment_success_url",
                "payment_cancel_url",
            ],
        )
        if missing:
            return _make_check(
                name="payment_provider",
                status="fail",
                message="Stripe payment configuration is incomplete: " + ", ".join(missing) + ".",
                remediation="Set Stripe secret key, webhook secret and checkout redirect URLs.",
            )
    elif provider == "payu":
        missing = _missing_settings(
            settings,
            [
                "payu_client_id",
                "payu_client_secret",
                "payu_merchant_pos_id",
                "payu_notify_url",
                "payu_second_key",
                "payment_success_url",
                "payment_cancel_url",
            ],
        )
        if missing:
            return _make_check(
                name="payment_provider",
                status="fail",
                message="PayU payment configuration is incomplete: " + ", ".join(missing) + ".",
                remediation=(
                    "Set PayU credentials, second key, notify URL and checkout redirect URLs."
                ),
            )
    else:
        return _make_check(
            name="payment_provider",
            status="fail",
            message=f"Unsupported PAYMENT_PROVIDER={provider!r}.",
            remediation="Use PAYMENT_PROVIDER=stripe or PAYMENT_PROVIDER=payu.",
        )

    return _make_check(
        name="payment_provider",
        status="pass",
        message=f"{provider.title()} checkout and webhook configuration is present.",
    )


def _check_notification_transports(settings: Settings) -> ProductionReadinessCheck:
    missing: list[str] = []
    if settings.alert_email_enabled:
        missing.extend(
            _missing_settings(
                settings,
                ["alert_smtp_host", "alert_smtp_username", "alert_smtp_password"],
            )
        )
    if settings.alert_telegram_enabled and not _present(settings.alert_telegram_bot_token):
        missing.append("alert_telegram_bot_token")

    if missing:
        return _make_check(
            name="notification_transports",
            status="fail",
            message=(
                "Enabled alert transport credentials are incomplete: "
                + ", ".join(missing)
                + "."
            ),
            remediation="Set all enabled SMTP/Telegram credentials or disable the transport.",
        )
    if not settings.alert_email_enabled and not settings.alert_telegram_enabled:
        return _make_check(
            name="notification_transports",
            status="warn",
            message="No live alert delivery transport is enabled.",
            remediation="Enable SMTP or Telegram before selling alert workflows.",
        )
    return _make_check(
        name="notification_transports",
        status="pass",
        message="Enabled notification transports have required credentials.",
    )


def _check_worker_configuration(
    settings: Settings,
    env: Mapping[str, str],
) -> ProductionReadinessCheck:
    raw_tasks = env.get("WORKER_TASKS", "")
    tasks = _env_list(raw_tasks)
    warnings: list[str] = []
    failures: list[str] = []
    if not tasks:
        tasks = ["daily-email-alerts"]
        warnings.append("WORKER_TASKS is not set; worker will run only daily-email-alerts.")

    unknown_tasks = sorted(set(tasks) - VALID_WORKER_TASKS)
    if unknown_tasks:
        failures.append("Unknown WORKER_TASKS values: " + ", ".join(unknown_tasks) + ".")

    needs_apply = {"area-market-snapshots", "price-history-rebuild"} & set(tasks)
    if needs_apply and not _env_bool(env.get("WORKER_APPLY"), default=False):
        warnings.append("WORKER_APPLY is false, so maintenance tasks will not persist changes.")
    if (
        "daily-email-alerts" in tasks
        and settings.alert_email_enabled
        and not _env_bool(env.get("ALERT_WORKER_SEND"), default=False)
    ):
        warnings.append("ALERT_WORKER_SEND is false while email alerts are enabled.")

    if failures:
        return _make_check(
            name="worker_configuration",
            status="fail",
            message=" ".join(failures),
            remediation="Use only supported worker tasks in WORKER_TASKS.",
        )
    if warnings:
        return _make_check(
            name="worker_configuration",
            status="warn",
            message=" ".join(warnings),
            remediation="Configure worker task list and write/send flags for production behavior.",
        )
    return _make_check(
        name="worker_configuration",
        status="pass",
        message="Worker task configuration is explicit and supported.",
    )


def _check_backup_storage(env: Mapping[str, str]) -> ProductionReadinessCheck:
    if not _present(env.get("BACKUP_S3_BUCKET")):
        return _make_check(
            name="backup_storage",
            status="fail",
            message="BACKUP_S3_BUCKET is not configured.",
            remediation="Store logical Postgres backups outside the database provider.",
        )
    return _make_check(
        name="backup_storage",
        status="pass",
        message="Offsite backup bucket is configured.",
    )


def _check_monitoring(
    settings: Settings,
    env: Mapping[str, str],
) -> ProductionReadinessCheck:
    missing = [
        description
        for env_name, description in MONITORING_ENV_VARS.items()
        if not _present(env.get(env_name))
    ]
    if not _present(settings.sentry_dsn):
        missing.append("Sentry error tracking")

    if missing:
        return _make_check(
            name="monitoring",
            status="warn",
            message="Production monitoring is incomplete: " + ", ".join(missing) + ".",
            remediation=(
                "Configure uptime, job failure, source freshness, payment webhook and "
                "Sentry alerts before paid beta traffic."
            ),
        )
    return _make_check(
        name="monitoring",
        status="pass",
        message="Monitoring and alert targets are configured.",
    )


def _check_cost_controls(env: Mapping[str, str]) -> ProductionReadinessCheck:
    if not _env_bool(env.get("COST_ALERTS_CONFIGURED"), default=False):
        return _make_check(
            name="cost_controls",
            status="warn",
            message="COST_ALERTS_CONFIGURED is not enabled.",
            remediation="Set budget alerts for maps, AI/API usage, S3 and database storage.",
        )
    return _make_check(
        name="cost_controls",
        status="pass",
        message="Cost controls are marked as configured.",
    )


def _build_report(
    environment: str,
    checks: list[ProductionReadinessCheck],
) -> ProductionReadinessReport:
    failed_count = sum(1 for check in checks if check.status == "fail")
    warning_count = sum(1 for check in checks if check.status == "warn")
    status = "blocked" if failed_count else "degraded" if warning_count else "ready"
    return ProductionReadinessReport(
        status=status,
        environment=environment,
        check_count=len(checks),
        failed_count=failed_count,
        warning_count=warning_count,
        checks=checks,
    )


def _add_check(
    checks: list[ProductionReadinessCheck],
    *,
    name: str,
    status: str,
    message: str,
    remediation: str | None = None,
) -> None:
    checks.append(
        _make_check(
            name=name,
            status=status,
            message=message,
            remediation=remediation,
        )
    )


def _make_check(
    *,
    name: str,
    status: str,
    message: str,
    remediation: str | None = None,
) -> ProductionReadinessCheck:
    severity_by_status = {"pass": "info", "warn": "warning", "fail": "critical"}
    return ProductionReadinessCheck(
        name=name,
        status=status,
        severity=severity_by_status[status],
        message=message,
        remediation=remediation,
    )


def _missing_settings(settings: Settings, field_names: list[str]) -> list[str]:
    return [field_name for field_name in field_names if not _present(getattr(settings, field_name))]


def _present(value: object) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    return True


def _is_local_origin(origin: str) -> bool:
    parsed = urlparse(origin)
    host = parsed.hostname or origin
    return _is_local_host(host)


def _is_local_host(host: str) -> bool:
    normalized = host.strip().strip("[]").casefold()
    return normalized in LOCAL_HOSTS or normalized.endswith(".localhost")


def _env_list(raw: str | None) -> list[str]:
    if raw is None:
        return []
    return [item.strip() for item in raw.split(",") if item.strip()]


def _env_bool(raw: str | None, *, default: bool) -> bool:
    if raw is None:
        return default
    return raw.strip().casefold() in {"1", "true", "yes", "y", "on"}
