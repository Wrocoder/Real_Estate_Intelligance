import json
import sys

import pytest
from fastapi.testclient import TestClient

from domarion import cli
from domarion.core.config import Settings
from domarion.main import app
from domarion.services.production_readiness import build_production_readiness_report

client = TestClient(app)


def test_readiness_endpoint_reports_local_ready() -> None:
    response = client.get("/ready")
    payload = response.json()

    assert response.status_code == 200
    assert payload["status"] == "ready"
    assert payload["environment"] == "local"
    assert payload["failed_count"] == 0
    assert payload["checks"]


def test_production_readiness_blocks_unsafe_defaults() -> None:
    report = build_production_readiness_report(Settings(environment="production"), env={})

    failed_checks = {check.name for check in report.checks if check.status == "fail"}

    assert report.status == "blocked"
    assert report.failed_count >= 7
    assert {
        "postgres_backends",
        "database_url",
        "redis_url",
        "cors_origins",
        "report_artifacts",
        "payment_provider",
        "backup_storage",
    } <= failed_checks


def test_production_readiness_accepts_full_production_shape() -> None:
    report = build_production_readiness_report(
        _production_settings(),
        env={
            "WORKER_TASKS": "daily-email-alerts,area-market-snapshots,price-history-rebuild",
            "WORKER_APPLY": "true",
            "ALERT_WORKER_SEND": "true",
            "BACKUP_S3_BUCKET": "domarion-backups",
            "UPTIME_MONITOR_URL": "https://uptime.example.test/domarion",
            "JOB_FAILURE_ALERT_TARGET": "ops@example.test",
            "SOURCE_FRESHNESS_ALERT_TARGET": "ops@example.test",
            "PAYMENT_WEBHOOK_ALERT_TARGET": "ops@example.test",
            "COST_ALERTS_CONFIGURED": "true",
        },
    )

    assert report.status == "ready"
    assert report.failed_count == 0
    assert report.warning_count == 0


def test_production_preflight_cli_exits_nonzero_on_blockers(monkeypatch, capsys) -> None:
    class FakeReport:
        status = "blocked"

        def model_dump_json(self, *, indent: int | None = None) -> str:
            return json.dumps({"status": self.status}, indent=indent)

    monkeypatch.setattr(cli, "build_production_readiness_report", lambda: FakeReport())
    monkeypatch.setattr(sys, "argv", ["domarion", "production-preflight"])

    with pytest.raises(SystemExit) as exc:
        cli.main()

    assert exc.value.code == 1
    assert json.loads(capsys.readouterr().out)["status"] == "blocked"


def _production_settings() -> Settings:
    backend_overrides = {
        field_name: "postgres"
        for field_name in (
            "data_repository_backend",
            "report_store_backend",
            "report_order_store_backend",
            "user_store_backend",
            "auth_store_backend",
            "agency_store_backend",
            "crm_store_backend",
            "ingestion_admin_store_backend",
            "user_submitted_listing_store_backend",
            "partner_referral_store_backend",
            "ai_insight_store_backend",
            "news_store_backend",
            "custom_dashboard_store_backend",
        )
    }
    return Settings(
        **backend_overrides,
        environment="production",
        database_url=(
            "postgresql+psycopg://domarion:secret@db.example.test:5432/"
            "domarion?sslmode=require"
        ),
        redis_url="rediss://redis.example.test:6379/0",
        cors_origins=["https://app.domarion.test"],
        report_artifact_storage_backend="s3",
        report_artifact_s3_bucket="domarion-artifacts",
        payment_provider="stripe",
        payment_success_url="https://app.domarion.test/payment/success",
        payment_cancel_url="https://app.domarion.test/payment/cancel",
        stripe_secret_key="sk_live_test",
        stripe_webhook_secret="whsec_test",
        alert_email_enabled=True,
        alert_smtp_host="smtp.example.test",
        alert_smtp_username="domarion",
        alert_smtp_password="secret",
        sentry_dsn="https://public@example.invalid/1",
    )
