import json
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]


def test_oracle_compose_defines_single_vm_topology() -> None:
    yaml = pytest.importorskip("yaml")
    compose = yaml.safe_load((ROOT / "compose.oracle.yaml").read_text(encoding="utf-8"))

    services = compose["services"]
    assert set(services) == {
        "api",
        "caddy",
        "db",
        "frontend",
        "migrate",
        "redis",
        "seed",
        "worker",
    }

    assert compose["networks"]["internal"]["internal"] is True
    assert "egress" in compose["networks"]
    assert "ports" not in services["db"]
    assert "ports" not in services["redis"]
    assert "ports" not in services["api"]
    assert "ports" not in services["frontend"]
    assert services["api"]["expose"] == ["8000"]
    assert services["frontend"]["expose"] == ["3000"]
    assert services["api"]["networks"] == ["internal", "egress"]
    assert services["worker"]["networks"] == ["internal", "egress"]

    db = services["db"]
    assert db["build"]["dockerfile"] == "deploy/oracle/postgis.Dockerfile"
    assert db["image"] == "${POSTGIS_IMAGE:-domarion-postgis:16-3}"
    assert "/var/lib/postgresql/data" in db["volumes"][0]
    assert "max_connections=${POSTGRES_MAX_CONNECTIONS:-50}" in db["command"]
    assert "shared_buffers=${POSTGRES_SHARED_BUFFERS:-1GB}" in db["command"]
    assert "effective_cache_size=${POSTGRES_EFFECTIVE_CACHE_SIZE:-6GB}" in db["command"]
    assert "maintenance_work_mem=${POSTGRES_MAINTENANCE_WORK_MEM:-256MB}" in db["command"]
    assert "work_mem=${POSTGRES_WORK_MEM:-16MB}" in db["command"]
    assert "wal_compression=on" in db["command"]

    caddy_ports = {str(port).split(":")[-1] for port in services["caddy"]["ports"]}
    assert {"80", "443"} <= caddy_ports
    assert services["caddy"]["networks"] == ["internal", "edge"]

    frontend_args = services["frontend"]["build"]["args"]
    assert "NEXT_PUBLIC_API_BASE_URL" in frontend_args
    assert "NEXT_PUBLIC_SITE_URL" in frontend_args

    api_volumes = services["api"]["volumes"]
    worker_volumes = services["worker"]["volumes"]
    assert "/srv/domarion/artifacts/reports" in api_volumes[0]
    assert "/srv/domarion/backups/postgres" in api_volumes[1]
    assert worker_volumes == api_volumes


def test_oracle_env_example_is_staging_safe_by_default() -> None:
    env = _read_env_example(ROOT / ".env.oracle.example")

    assert env["ENVIRONMENT"] == "staging"
    assert env["PAYMENT_PROVIDER"] == "mock"
    assert env["ALERT_WORKER_SEND"] == "false"
    assert env["WORKER_APPLY"] == "false"
    assert env["DATABASE_URL"].startswith("postgresql+psycopg://")
    assert "@db:5432/" in env["DATABASE_URL"]
    assert env["REDIS_URL"] == "redis://redis:6379/0"
    assert env["REPORT_ARTIFACT_STORAGE_BACKEND"] == "local"

    for key, value in env.items():
        if key.endswith("_BACKEND") and key not in {"REPORT_ARTIFACT_STORAGE_BACKEND"}:
            assert value == "postgres"


def test_oracle_proxy_and_postgis_artifacts_are_arm_ready() -> None:
    caddyfile = (ROOT / "deploy" / "oracle" / "Caddyfile").read_text(encoding="utf-8")
    postgis = (ROOT / "deploy" / "oracle" / "postgis.Dockerfile").read_text(
        encoding="utf-8"
    )
    backend_dockerfile = (ROOT / "Dockerfile").read_text(encoding="utf-8")
    deploy_script = (ROOT / "scripts" / "deploy_oracle_cloud.sh").read_text(
        encoding="utf-8"
    )
    systemd_unit = (ROOT / "deploy" / "oracle" / "domarion-compose.service").read_text(
        encoding="utf-8"
    )

    assert "{$DOMARION_FRONTEND_DOMAIN}" in caddyfile
    assert "{$DOMARION_API_DOMAIN}" in caddyfile
    assert "reverse_proxy frontend:3000" in caddyfile
    assert "reverse_proxy api:8000" in caddyfile

    assert "FROM postgres:16-bookworm" in postgis
    assert "postgresql-16-postgis-3" in postgis
    assert "postgresql-16-postgis-3-scripts" in postgis
    assert "FROM python:3.12-slim-bookworm" in backend_dockerfile
    assert "postgresql-client-16" in backend_dockerfile
    assert "COPY scripts ./scripts" in backend_dockerfile

    assert "docker compose --env-file" in deploy_script
    assert "scripts/oracle_cloud_preflight.py" in deploy_script
    assert "--pull-images" in deploy_script
    assert "compose pull db redis api frontend caddy" in deploy_script
    assert "compose build db migrate frontend" in deploy_script
    assert "--exit-code-from migrate" in deploy_script
    assert "domarion production-preflight" in deploy_script

    assert "WorkingDirectory=/srv/domarion/app" in systemd_unit
    assert "compose.oracle.yaml up -d --remove-orphans" in systemd_unit


def test_oracle_backup_systemd_timer_runs_containerized_backup() -> None:
    backup_service = (
        ROOT / "deploy" / "oracle" / "domarion-postgres-backup.service"
    ).read_text(encoding="utf-8")
    backup_timer = (
        ROOT / "deploy" / "oracle" / "domarion-postgres-backup.timer"
    ).read_text(encoding="utf-8")

    assert "WorkingDirectory=/srv/domarion/app" in backup_service
    assert "docker compose --env-file /srv/domarion/env/oracle.env" in backup_service
    assert "run --rm --no-deps api python scripts/postgres_backup.py backup" in backup_service
    assert "OnCalendar=*-*-* 03:15:00" in backup_timer
    assert "RandomizedDelaySec=30m" in backup_timer
    assert "Persistent=true" in backup_timer


def test_oracle_vm_bootstrap_script_sets_runtime_guardrails() -> None:
    bootstrap_script = (ROOT / "scripts" / "bootstrap_oracle_vm.sh").read_text(
        encoding="utf-8"
    )

    assert "docker-compose-plugin" in bootstrap_script
    assert "fail2ban" in bootstrap_script
    assert "unattended-upgrades" in bootstrap_script
    assert "ufw allow 80/tcp" in bootstrap_script
    assert "ufw allow 443/tcp" in bootstrap_script
    assert '"max-size": "50m"' in bootstrap_script
    assert "--harden-ssh" in bootstrap_script
    assert "PasswordAuthentication no" in bootstrap_script
    assert "$DATA_DIR/backups/postgres" in bootstrap_script


def test_oci_staging_runbook_covers_manual_setup_gates() -> None:
    runbook = (ROOT / "docs" / "oci_staging_setup_runbook.md").read_text(
        encoding="utf-8"
    )

    assert "oci-staging" in runbook
    assert "OCI_ENV_FILE" in runbook
    assert "OCI_SSH_KNOWN_HOSTS" in runbook
    assert "scripts/bootstrap_oracle_vm.sh" in runbook
    assert "deploy_oci=true" in runbook
    assert "scripts/deploy_oracle_cloud.sh --pull-images" in runbook
    assert "python scripts\\smoke_deployment.py" in runbook
    assert "/srv/domarion/env/snapshots" in runbook


def test_ci_workflow_can_publish_arm64_oci_images() -> None:
    yaml = pytest.importorskip("yaml")
    workflow_text = (ROOT / ".github" / "workflows" / "ci.yml").read_text(
        encoding="utf-8"
    )
    workflow = yaml.safe_load(workflow_text)
    publish_job = workflow["jobs"]["docker-publish"]

    assert publish_job["needs"] == ["backend", "docker-build", "frontend"]
    assert publish_job["permissions"]["packages"] == "write"
    assert "vars.OCI_IMAGE_PUBLISH_ENABLED == 'true'" in publish_job["if"]
    assert "inputs.publish_images == true" in publish_job["if"]
    assert "ghcr.io" in workflow_text
    assert "linux/arm64" in workflow_text
    assert "deploy/oracle/postgis.Dockerfile" in workflow_text
    assert "NEXT_PUBLIC_API_BASE_URL" in workflow_text
    assert "domarion-api" in workflow_text
    assert "domarion-frontend" in workflow_text
    assert "domarion-postgis" in workflow_text


def test_ci_workflow_defines_protected_oci_deploy_job() -> None:
    yaml = pytest.importorskip("yaml")
    workflow_text = (ROOT / ".github" / "workflows" / "ci.yml").read_text(
        encoding="utf-8"
    )
    workflow = yaml.safe_load(workflow_text)
    deploy_job = workflow["jobs"]["deploy-oci"]

    assert deploy_job["needs"] == ["docker-publish"]
    assert deploy_job["environment"]["name"] == "oci-staging"
    assert "inputs.deploy_oci == true" in deploy_job["if"]
    assert "OCI_SSH_PRIVATE_KEY" in workflow_text
    assert "OCI_SSH_KNOWN_HOSTS" in workflow_text
    assert "OCI_ENV_FILE" in workflow_text
    assert "/srv/domarion/env/snapshots" in workflow_text
    assert "scripts/deploy_oracle_cloud.sh --pull-images" in workflow_text


def test_oracle_preflight_blocks_example_placeholders() -> None:
    result = _run_oracle_preflight(ROOT / ".env.oracle.example")

    assert result.returncode == 1
    payload = json.loads(result.stdout)
    assert payload["status"] == "fail"
    assert payload["error_count"] >= 4
    assert "placeholder" in result.stdout


def test_oracle_preflight_accepts_realistic_staging_env(tmp_path: Path) -> None:
    env_path = tmp_path / "oracle.env"
    content = (ROOT / ".env.oracle.example").read_text(encoding="utf-8")
    replacements = {
        "app.example.com": "app.domarion.test",
        "api.example.com": "api.domarion.test",
        "change-me": "not-a-real-secret-32-chars-long",
    }
    for old, new in replacements.items():
        content = content.replace(old, new)
    env_path.write_text(content, encoding="utf-8")

    result = _run_oracle_preflight(env_path)

    assert result.returncode == 0
    payload = json.loads(result.stdout)
    assert payload == {
        "status": "pass",
        "error_count": 0,
        "warning_count": 0,
        "findings": [],
    }


def _read_env_example(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        key, value = line.split("=", 1)
        values[key] = value
    return values


def _run_oracle_preflight(env_path: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [
            sys.executable,
            str(ROOT / "scripts" / "oracle_cloud_preflight.py"),
            "--env-file",
            str(env_path),
            "--compose-file",
            str(ROOT / "compose.oracle.yaml"),
            "--json",
        ],
        check=False,
        capture_output=True,
        text=True,
    )
