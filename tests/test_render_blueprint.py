from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
SECRET_ENV_KEYS = {
    "REPORT_ARTIFACT_S3_ACCESS_KEY_ID",
    "REPORT_ARTIFACT_S3_SECRET_ACCESS_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "SENTRY_DSN",
}


def test_render_blueprint_defines_mvp_production_topology() -> None:
    yaml = pytest.importorskip("yaml")
    blueprint = yaml.safe_load((ROOT / "render.yaml").read_text(encoding="utf-8"))

    services = {service["name"]: service for service in blueprint["services"]}
    databases = {database["name"]: database for database in blueprint["databases"]}

    assert set(services) == {
        "domarion-api",
        "domarion-frontend",
        "domarion-worker",
        "domarion-redis",
    }
    assert set(databases) == {"domarion-postgres"}
    assert databases["domarion-postgres"]["region"] == "frankfurt"
    assert databases["domarion-postgres"]["postgresMajorVersion"] == "18"
    assert databases["domarion-postgres"]["connectionPool"] == "pgbouncer"
    assert databases["domarion-postgres"]["ipAllowList"] == []

    api = services["domarion-api"]
    assert api["type"] == "web"
    assert api["runtime"] == "docker"
    assert api["healthCheckPath"] == "/ready"
    assert "python -m alembic upgrade head" in api["preDeployCommand"]
    assert "domarion production-preflight" in api["preDeployCommand"]

    worker = services["domarion-worker"]
    assert worker["type"] == "worker"
    assert worker["dockerCommand"] == "domarion worker"

    redis = services["domarion-redis"]
    assert redis["type"] == "keyvalue"
    assert redis["ipAllowList"] == []


def test_render_blueprint_keeps_production_secrets_out_of_git() -> None:
    yaml = pytest.importorskip("yaml")
    blueprint = yaml.safe_load((ROOT / "render.yaml").read_text(encoding="utf-8"))

    for service in blueprint["services"]:
        for env_var in service.get("envVars", []):
            key = env_var.get("key")
            if key in SECRET_ENV_KEYS:
                assert env_var.get("sync") is False
                assert "value" not in env_var
